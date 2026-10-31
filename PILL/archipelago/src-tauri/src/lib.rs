use serde::{Deserialize, Serialize};
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::OnceLock;
use std::collections::HashMap;

use tauri::{
    AppHandle,
    Emitter,
    Manager,
    RunEvent,
    WebviewWindow,
};

pub mod events;
pub mod evasion;
pub mod focus_timer;
pub mod media;
pub mod telemetry;
pub mod settings;
mod weather;

mod hwnd_controller;

/// Global application shutdown signal.
///
/// Native background monitors use this flag to terminate cleanly when
/// the Tauri application begins shutting down.
pub static SHUTDOWN_REQUESTED: AtomicBool =
    AtomicBool::new(false);

/// Represents the current island UI state.
#[derive(
    Debug,
    Clone,
    Copy,
    PartialEq,
    Eq,
    Serialize,
    Deserialize,
)]
pub enum IslandState {
    Idle,
    Compact,
    Expanded,
    Split,
}

#[derive(Debug, Clone, Copy, Deserialize)]
struct IslandDimensions {
    width: f64,
    height: f64,
}

// The frontend imports this same file. Startup must not use a second set of
// dimensions that makes the first interaction jump or clip its contents.
fn island_dimensions(state: &str) -> IslandDimensions {
    static LAYOUT: OnceLock<HashMap<String, IslandDimensions>> = OnceLock::new();
    LAYOUT.get_or_init(|| {
        serde_json::from_str(include_str!("../../../shared/island-layout.json"))
            .expect("Invalid shared island layout")
    })[state]
}

/// Represents the calculated physical position of the island window.
#[derive(
    Debug,
    Clone,
    Copy,
    PartialEq,
    Eq,
)]
struct WindowPosition {
    x: i32,
    y: i32,
}

/// Calculates the top-center position of the island on a monitor.
///
/// The island width is provided in logical pixels and converted to
/// physical pixels using the monitor's scale factor.
fn calculate_window_position(
    monitor_x: i32,
    monitor_y: i32,
    monitor_width: u32,
    logical_width: f64,
    scale_factor: f64,
) -> WindowPosition {
    let physical_width =
        (logical_width * scale_factor) as i32;

    let x = monitor_x
        + (monitor_width as i32 - physical_width) / 2;

    let y =
        monitor_y + (8.0 * scale_factor) as i32;

    WindowPosition { x, y }
}

/// Converts the frontend's string representation of an island state
/// into the strongly typed backend representation.
fn parse_island_state(
    state: &str,
) -> Result<IslandState, String> {
    match state {
        "idle" => Ok(IslandState::Idle),
        "compact" => Ok(IslandState::Compact),
        "expanded" => Ok(IslandState::Expanded),
        "split" => Ok(IslandState::Split),
        _ => Err(format!(
            "Unknown island state: {}",
            state
        )),
    }
}

/// Resize the island window to new dimensions.
#[tauri::command]
fn resize_island(
    window: WebviewWindow,
    width: f64,
    height: f64,
) -> Result<(), String> {
    if !width.is_finite() || !height.is_finite() || width <= 0.0 || height <= 0.0 {
        return Err("Island dimensions must be positive and finite".to_string());
    }
    let monitor = window
        .current_monitor()
        .map_err(|e| e.to_string())?
        .ok_or("No monitor found")?;

    let monitor_size = monitor.size();
    let monitor_position = monitor.position();
    let scale_factor = monitor.scale_factor();

    let position = calculate_window_position(
        monitor_position.x,
        monitor_position.y,
        monitor_size.width,
        width,
        scale_factor,
    );

    window
        .set_size(
            tauri::LogicalSize::new(
                width,
                height,
            ),
        )
        .map_err(|e| e.to_string())?;

    window
        .set_position(
            tauri::PhysicalPosition::new(
                position.x,
                position.y,
            ),
        )
        .map_err(|e| e.to_string())?;

    Ok(())
}

/// Toggle click-through mode on the island.
#[tauri::command]
fn set_click_through(
    window: WebviewWindow,
    enabled: bool,
) -> Result<(), String> {
    hwnd_controller::set_click_through(
        &window,
        enabled,
    )
}

/// Notify the backend of a state change so it can adjust
/// polling/behavior in later phases.
#[tauri::command]
fn notify_state_change(
    state: String,
) -> Result<(), String> {
    let parsed_state =
        parse_island_state(&state)?;

    println!(
        "[Archipelago] State changed to: {:?}",
        parsed_state
    );

    Ok(())
}

#[tauri::command]
fn open_control(app: AppHandle) -> Result<(), String> {
    let mut candidates = Vec::new();
    if let Ok(directory) = app.path().resource_dir() { candidates.push(directory.join("PILL-Control.exe")); }
    if let Ok(executable) = std::env::current_exe() {
        if let Some(directory) = executable.parent() { candidates.push(directory.join("PILL-Control.exe")); }
    }
    #[cfg(debug_assertions)]
    candidates.push(std::path::PathBuf::from(env!("CARGO_MANIFEST_DIR")).join("../../pill-control/src-tauri/target/release/PILL-Control.exe"));
    let path = candidates.into_iter().find(|path| path.is_file()).ok_or("PILL Control is not installed alongside PILL. Build or reinstall PILL Control.")?;
    std::process::Command::new(path).spawn().map_err(|error| format!("Could not open PILL Control: {error}"))?;
    Ok(())
}

/// Control the active Windows media session.
#[tauri::command]
async fn media_skip_previous()
    -> Result<bool, String>
{
    media::skip_previous().await
}

#[tauri::command]
async fn media_toggle_play_pause()
    -> Result<bool, String>
{
    media::toggle_play_pause().await
}

#[tauri::command]
async fn media_skip_next()
    -> Result<bool, String>
{
    media::skip_next().await
}

/// Start the focus timer.
#[tauri::command]
fn start_focus_timer(
    app: AppHandle,
    timer: tauri::State<'_, focus_timer::FocusTimer>,
) -> Result<
    focus_timer::TimerSnapshot,
    String,
> {
    let snapshot = timer.start();

    app.emit(
        events::TIMER_TICK,
        snapshot,
    )
    .map_err(|error| {
        format!(
            "Failed to emit timer update: {error}"
        )
    })?;

    Ok(snapshot)
}

/// Pause the focus timer.
#[tauri::command]
fn pause_focus_timer(
    app: AppHandle,
    timer: tauri::State<'_, focus_timer::FocusTimer>,
) -> Result<
    focus_timer::TimerSnapshot,
    String,
> {
    let snapshot = timer.pause();

    app.emit(
        events::TIMER_TICK,
        snapshot,
    )
    .map_err(|error| {
        format!(
            "Failed to emit timer update: {error}"
        )
    })?;

    Ok(snapshot)
}

/// Reset the focus timer to its default duration.
#[tauri::command]
fn reset_focus_timer(
    app: AppHandle,
    timer: tauri::State<'_, focus_timer::FocusTimer>,
) -> Result<
    focus_timer::TimerSnapshot,
    String,
> {
    let snapshot = timer.reset();

    app.emit(
        events::TIMER_TICK,
        snapshot,
    )
    .map_err(|error| {
        format!(
            "Failed to emit timer update: {error}"
        )
    })?;

    Ok(snapshot)
}

/// Position the island at the top-center of the monitor
/// where the window currently resides.
fn position_island_on_startup(
    app: &AppHandle,
) {
    let window = app
        .get_webview_window("island")
        .expect("island window not found");

    if let Ok(Some(monitor)) =
        window.current_monitor()
    {
        let _ =
            hwnd_controller::set_click_through(
                &window,
                false,
            );

        let monitor_size = monitor.size();
        let monitor_position = monitor.position();
        let scale_factor = monitor.scale_factor();

        let idle = island_dimensions("idle");
        let idle_width = idle.width;
        let idle_height = idle.height;

        let position =
            calculate_window_position(
                monitor_position.x,
                monitor_position.y,
                monitor_size.width,
                idle_width,
                scale_factor,
            );

        let _ = window.set_size(
            tauri::LogicalSize::new(
                idle_width,
                idle_height,
            ),
        );

        let _ = window.set_position(
            tauri::PhysicalPosition::new(
                position.x,
                position.y,
            ),
        );
    }
    // Avoid flashing at (0, 0) with bootstrap dimensions before positioning.
    let _ = window.show();
}

#[cfg_attr(
    mobile,
    tauri::mobile_entry_point
)]
pub fn run() {
    // Always begin a new application run with a clear
    // shutdown state.
    SHUTDOWN_REQUESTED.store(
        false,
        Ordering::SeqCst,
    );

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(
            tauri::generate_handler![
                resize_island,
                open_control,
                set_click_through,
                notify_state_change,
                media_skip_previous,
                media_toggle_play_pause,
                media_skip_next,
                start_focus_timer,
                pause_focus_timer,
                reset_focus_timer,
                settings::load_settings,
                settings::update_settings,
                settings::reset_settings,
                weather::get_weather,
                weather::load_cached_weather,
            ],
        )
        .setup(|app| {
            position_island_on_startup(
                app.handle(),
            );

            let focus_timer =
                focus_timer::FocusTimer::new();

            app.manage(focus_timer.clone());

            evasion::spawn_fullscreen_monitor(
                app.handle().clone(),
            );

            telemetry::spawn_telemetry_monitor(
                app.handle().clone(),
            );

            media::spawn_media_monitor(
                app.handle().clone(),
            );

            focus_timer::spawn_focus_timer_monitor(
                app.handle().clone(),
                focus_timer,
            );

            settings::spawn_settings_monitor(
                app.handle().clone(),
            );

            Ok(())
        })
        .build(
            tauri::generate_context!(),
        )
        .expect(
            "error while building tauri application",
        )
        .run(|_app_handle, event| {
            match event {
                RunEvent::ExitRequested { .. } => {
                    println!(
                        "[Archipelago] Shutdown requested"
                    );

                    SHUTDOWN_REQUESTED.store(
                        true,
                        Ordering::SeqCst,
                    );
                }

                RunEvent::Exit => {
                    SHUTDOWN_REQUESTED.store(
                        true,
                        Ordering::SeqCst,
                    );
                }

                _ => {}
            }
        });
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn shared_layout_covers_every_presentation() {
        for state in ["idle", "compact", "expanded", "split"] {
            let size = island_dimensions(state);
            assert!(size.width.is_finite() && size.width > 0.0);
            assert!(size.height.is_finite() && size.height > 0.0);
        }
        assert!(island_dimensions("expanded").height > island_dimensions("idle").height);
    }

    #[test]
    fn parses_all_valid_island_states() {
        assert_eq!(
            parse_island_state("idle"),
            Ok(IslandState::Idle)
        );

        assert_eq!(
            parse_island_state("compact"),
            Ok(IslandState::Compact)
        );

        assert_eq!(
            parse_island_state("expanded"),
            Ok(IslandState::Expanded)
        );

        assert_eq!(
            parse_island_state("split"),
            Ok(IslandState::Split)
        );
    }

    #[test]
    fn rejects_unknown_island_state() {
        let result =
            parse_island_state("unknown");

        assert!(result.is_err());

        assert_eq!(
            result.unwrap_err(),
            "Unknown island state: unknown"
        );
    }

    #[test]
    fn calculates_centered_position_on_standard_display() {
        let position =
            calculate_window_position(
                0,
                0,
                1920,
                110.0,
                1.0,
            );

        assert_eq!(
            position,
            WindowPosition {
                x: 905,
                y: 8,
            }
        );
    }

    #[test]
    fn calculates_position_with_display_offset_and_scaling() {
        let position =
            calculate_window_position(
                100,
                50,
                2560,
                220.0,
                1.5,
            );

        assert_eq!(
            position,
            WindowPosition {
                x: 1215,
                y: 62,
            }
        );
    }

    #[test]
    fn handles_zero_width_monitor_without_panicking() {
        let position =
            calculate_window_position(
                100,
                50,
                0,
                110.0,
                1.0,
            );

        assert_eq!(
            position,
            WindowPosition {
                x: 45,
                y: 58,
            }
        );
    }

    #[test]
    fn shutdown_signal_starts_clear() {
        SHUTDOWN_REQUESTED.store(
            false,
            Ordering::SeqCst,
        );

        assert!(
            !SHUTDOWN_REQUESTED.load(
                Ordering::SeqCst
            )
        );
    }

    #[test]
    fn shutdown_signal_can_be_requested() {
        SHUTDOWN_REQUESTED.store(
            false,
            Ordering::SeqCst,
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

        // Leave the test process in the normal
        // non-shutdown state for other tests.
        SHUTDOWN_REQUESTED.store(
            false,
            Ordering::SeqCst,
        );
    }
}
