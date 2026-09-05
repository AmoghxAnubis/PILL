use serde::{Deserialize, Serialize};

/// Normalized hardware telemetry payload sent to the frontend.
#[derive(Debug, Clone, Copy, PartialEq, Serialize, Deserialize)]
pub struct TelemetrySnapshot {
    pub cpu_usage: f32,
    pub ram_allocated_mb: u64,
    pub ram_percentage: f32,
}

/// Thresholds that determine when telemetry should be treated
/// as a warning condition by the frontend.
#[derive(Debug, Clone, Copy, PartialEq)]
pub struct TelemetryThresholds {
    pub cpu_percentage: f32,
    pub ram_percentage: f32,
}

impl Default for TelemetryThresholds {
    fn default() -> Self {
        Self {
            cpu_percentage: 85.0,
            ram_percentage: 85.0,
        }
    }
}

/// Determines whether either CPU or RAM usage has crossed the
/// warning threshold.
pub fn is_telemetry_warning(
    snapshot: TelemetrySnapshot,
    thresholds: TelemetryThresholds,
) -> bool {
    snapshot.cpu_usage >= thresholds.cpu_percentage
        || snapshot.ram_percentage >= thresholds.ram_percentage
}

/// Converts raw memory values into the normalized telemetry format.
///
/// `total_memory` and `used_memory` are expressed in bytes by
/// sysinfo. :contentReference[oaicite:4]{index=4}
pub fn map_memory_usage(
    used_memory: u64,
    total_memory: u64,
) -> (u64, f32) {
    if total_memory == 0 {
        return (0, 0.0);
    }

    let allocated_mb = used_memory / 1_000_000;

    let percentage =
        (used_memory as f64 / total_memory as f64 * 100.0)
            as f32;

    (allocated_mb, percentage)
}

/// Maps raw CPU and memory measurements into the payload used
/// by the application.
pub fn map_telemetry(
    cpu_usage: f32,
    used_memory: u64,
    total_memory: u64,
) -> TelemetrySnapshot {
    let (ram_allocated_mb, ram_percentage) =
        map_memory_usage(
            used_memory,
            total_memory,
        );

    TelemetrySnapshot {
        cpu_usage: cpu_usage.clamp(0.0, 100.0),
        ram_allocated_mb,
        ram_percentage: ram_percentage.clamp(0.0, 100.0),
    }
}

/// Reads a telemetry snapshot from a persistent sysinfo System.
///
/// The caller should reuse the same `System` instance between
/// refreshes. CPU usage is derived from successive measurements,
/// so the first refresh is not expected to be accurate. :contentReference[oaicite:5]{index=5}
pub fn read_telemetry(
    system: &sysinfo::System,
) -> TelemetrySnapshot {
    map_telemetry(
        system.global_cpu_usage(),
        system.used_memory(),
        system.total_memory(),
    )
}
use std::time::Duration;

use tauri::{AppHandle, Emitter};

use crate::events::TELEMETRY_UPDATE;

/// Polling interval for the initial telemetry implementation.
pub const TELEMETRY_POLL_INTERVAL: Duration =
    Duration::from_secs(2);

/// Starts the background hardware telemetry monitor.
///
/// A single `sysinfo::System` instance is reused for the lifetime
/// of the task so CPU usage can be calculated from successive
/// measurements.
pub fn spawn_telemetry_monitor(app: AppHandle) {
    tauri::async_runtime::spawn(async move {
        let mut system = sysinfo::System::new();

        // Refresh memory immediately.
        system.refresh_memory();

        // CPU usage needs two measurements separated by time.
        system.refresh_cpu_usage();

        let mut interval =
            tokio::time::interval(TELEMETRY_POLL_INTERVAL);

        // Skip the interval's immediate first tick. This gives sysinfo
        // enough time to establish its initial CPU measurement.
        interval.tick().await;

        loop {
            interval.tick().await;

            system.refresh_cpu_usage();
            system.refresh_memory();

            let snapshot = read_telemetry(&system);

            if let Err(error) =
                app.emit(TELEMETRY_UPDATE, snapshot)
            {
                eprintln!(
                    "[Archipelago] Failed to emit telemetry: {}",
                    error
                );
            }
        }
    });
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn maps_memory_usage_to_megabytes_and_percentage() {
        let (allocated_mb, percentage) =
            map_memory_usage(
                8_000_000_000,
                16_000_000_000,
            );

        assert_eq!(
            allocated_mb,
            8_000
        );

        assert!(
            (percentage - 50.0).abs() < f32::EPSILON
        );
    }

    #[test]
    fn handles_zero_total_memory() {
        let result =
            map_memory_usage(100, 0);

        assert_eq!(result, (0, 0.0));
    }

    #[test]
    fn clamps_cpu_usage_to_valid_range() {
        let snapshot =
            map_telemetry(
                125.0,
                4_000_000_000,
                8_000_000_000,
            );

        assert_eq!(
            snapshot.cpu_usage,
            100.0
        );
    }

    #[test]
    fn clamps_memory_percentage_to_valid_range() {
        let snapshot =
            map_telemetry(
                10.0,
                12_000_000_000,
                8_000_000_000,
            );

        assert_eq!(
            snapshot.ram_percentage,
            100.0
        );
    }

    #[test]
    fn creates_expected_telemetry_snapshot() {
        let snapshot =
            map_telemetry(
                72.5,
                6_000_000_000,
                12_000_000_000,
            );

        assert_eq!(
            snapshot.cpu_usage,
            72.5
        );

        assert_eq!(
            snapshot.ram_allocated_mb,
            6_000
        );

        assert!(
            (snapshot.ram_percentage - 50.0).abs()
                < f32::EPSILON
        );
    }

    #[test]
    fn warning_is_false_below_thresholds() {
        let snapshot =
            TelemetrySnapshot {
                cpu_usage: 70.0,
                ram_allocated_mb: 6_000,
                ram_percentage: 70.0,
            };

        assert!(
            !is_telemetry_warning(
                snapshot,
                TelemetryThresholds::default(),
            )
        );
    }

    #[test]
    fn warning_is_true_when_cpu_crosses_threshold() {
        let snapshot =
            TelemetrySnapshot {
                cpu_usage: 85.0,
                ram_allocated_mb: 4_000,
                ram_percentage: 40.0,
            };

        assert!(
            is_telemetry_warning(
                snapshot,
                TelemetryThresholds::default(),
            )
        );
    }

    #[test]
    fn warning_is_true_when_ram_crosses_threshold() {
        let snapshot =
            TelemetrySnapshot {
                cpu_usage: 40.0,
                ram_allocated_mb: 13_600,
                ram_percentage: 85.0,
            };

        assert!(
            is_telemetry_warning(
                snapshot,
                TelemetryThresholds::default(),
            )
        );
    }

    #[test]
    fn warning_is_true_when_both_cross_thresholds() {
        let snapshot =
            TelemetrySnapshot {
                cpu_usage: 95.0,
                ram_allocated_mb: 15_000,
                ram_percentage: 95.0,
            };

        assert!(
            is_telemetry_warning(
                snapshot,
                TelemetryThresholds::default(),
            )
        );
    }

    #[test]
    fn custom_thresholds_are_respected() {
        let snapshot =
            TelemetrySnapshot {
                cpu_usage: 75.0,
                ram_allocated_mb: 7_000,
                ram_percentage: 75.0,
            };

        let thresholds =
            TelemetryThresholds {
                cpu_percentage: 70.0,
                ram_percentage: 80.0,
            };

        assert!(
            is_telemetry_warning(
                snapshot,
                thresholds,
            )
        );
    }

    #[test]
    fn read_telemetry_maps_existing_system_state() {
        let system =
            sysinfo::System::new();

        let snapshot =
            read_telemetry(&system);

        assert!(
            snapshot.cpu_usage >= 0.0
        );
        assert!(
            snapshot.cpu_usage <= 100.0
        );

        assert!(
            snapshot.ram_percentage >= 0.0
        );
        assert!(
            snapshot.ram_percentage <= 100.0
        );
    }
}
#[test]
fn telemetry_poll_interval_is_two_seconds() {
    assert_eq!(
        TELEMETRY_POLL_INTERVAL,
        std::time::Duration::from_secs(2)
    );
}

#[test]
fn read_telemetry_produces_valid_ranges() {
    let mut system = sysinfo::System::new();

    system.refresh_memory();
    system.refresh_cpu_usage();

    let snapshot = read_telemetry(&system);

    assert!(
        snapshot.cpu_usage >= 0.0
            && snapshot.cpu_usage <= 100.0
    );

    assert!(
        snapshot.ram_percentage >= 0.0
            && snapshot.ram_percentage <= 100.0
    );
}