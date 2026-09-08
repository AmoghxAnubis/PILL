use serde::{Deserialize, Serialize};
use std::sync::atomic::Ordering;
use sysinfo::System;
use tauri::{AppHandle, Emitter};

use crate::events::TELEMETRY_UPDATE;
use crate::SHUTDOWN_REQUESTED;

const TELEMETRY_POLL_INTERVAL: std::time::Duration =
    std::time::Duration::from_secs(2);

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct TelemetrySnapshot {
    pub cpu: f32,
    pub ram: f32,
}

#[derive(Debug, Clone, Copy)]
pub struct TelemetryThresholds {
    pub cpu_warning: f32,
    pub ram_warning: f32,
}

impl Default for TelemetryThresholds {
    fn default() -> Self {
        Self {
            cpu_warning: 85.0,
            ram_warning: 85.0,
        }
    }
}

pub fn read_telemetry(system: &System) -> TelemetrySnapshot {
    let cpu = system.global_cpu_usage();

    let total_memory = system.total_memory();
    let used_memory = system.used_memory();

    let ram = if total_memory == 0 {
        0.0
    } else {
        (used_memory as f64 / total_memory as f64 * 100.0) as f32
    };

    TelemetrySnapshot { cpu, ram }
}

pub fn is_cpu_warning(
    cpu: f32,
    thresholds: TelemetryThresholds,
) -> bool {
    cpu >= thresholds.cpu_warning
}

pub fn is_ram_warning(
    ram: f32,
    thresholds: TelemetryThresholds,
) -> bool {
    ram >= thresholds.ram_warning
}

pub fn spawn_telemetry_monitor(app: AppHandle) {
    tauri::async_runtime::spawn(async move {
        println!(
            "[Archipelago][Telemetry] Telemetry monitor started"
        );

        let mut system = System::new();

        system.refresh_memory();
        system.refresh_cpu_usage();

        let mut interval =
            tokio::time::interval(TELEMETRY_POLL_INTERVAL);

        interval.tick().await;

        let mut last_snapshot: Option<TelemetrySnapshot> = None;

        loop {
            interval.tick().await;

            if SHUTDOWN_REQUESTED.load(Ordering::SeqCst) {
                println!(
                    "[Archipelago][Telemetry] Telemetry monitor shutting down"
                );

                break;
            }

            system.refresh_cpu_usage();
            system.refresh_memory();

            let snapshot = read_telemetry(&system);

            let changed = match &last_snapshot {
                Some(previous) => previous != &snapshot,
                None => true,
            };

            if !changed {
                continue;
            }

            if let Err(error) =
                app.emit(TELEMETRY_UPDATE, snapshot.clone())
            {
                eprintln!(
                    "[Archipelago] Failed to emit telemetry: {}",
                    error
                );

                continue;
            }

            last_snapshot = Some(snapshot);
        }
    });
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn telemetry_snapshot_equality_works() {
        let first = TelemetrySnapshot {
            cpu: 42.0,
            ram: 61.0,
        };

        let second = TelemetrySnapshot {
            cpu: 42.0,
            ram: 61.0,
        };

        assert_eq!(first, second);
    }

    #[test]
    fn cpu_warning_uses_threshold() {
        let thresholds = TelemetryThresholds::default();

        assert!(!is_cpu_warning(
            84.9,
            thresholds
        ));

        assert!(is_cpu_warning(
            85.0,
            thresholds
        ));
    }

    #[test]
    fn ram_warning_uses_threshold() {
        let thresholds = TelemetryThresholds::default();

        assert!(!is_ram_warning(
            84.9,
            thresholds
        ));

        assert!(is_ram_warning(
            85.0,
            thresholds
        ));
    }

    #[test]
    fn shutdown_signal_is_observable() {
        SHUTDOWN_REQUESTED.store(
            false,
            Ordering::SeqCst,
        );

        assert!(
            !SHUTDOWN_REQUESTED.load(
                Ordering::SeqCst
            )
        );

        SHUTDOWN_REQUESTED.store(
            true,
            Ordering::SeqCst,
        );

        assert!(
            SHUTDOWN_REQUESTED.load(
                Ordering::SeqCst
            )
        );

        // Keep global state clean for the remaining tests.
        SHUTDOWN_REQUESTED.store(
            false,
            Ordering::SeqCst,
        );
    }
}