use serde::{Deserialize, Serialize};
use tauri::{AppHandle, Manager, WebviewWindow};

pub mod events;
pub mod evasion;
pub mod media;
pub mod telemetry;

mod hwnd_controller;

/// Represents the current island UI state.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum IslandState {
    Idle,
    Compact,
    Expanded,
    Split,
}

/// Represents the calculated physical position of the island window.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
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
    let physical_width = (logical_width * scale_factor) as i32;

    let x = monitor_x + (monitor_width as i32 - physical_width) / 2;
    let y = monitor_y + (8.0 * scale_factor) as i32;

    WindowPosition { x, y }
}

/// Converts the frontend's string representation of an island state
/// into the strongly typed backend representation.
fn parse_island_state(state: &str) -> Result<IslandState, String> {
    match state {
        "idle" => Ok(IslandState::Idle),
        "compact" => Ok(IslandState::Compact),
        "expanded" => Ok(IslandState::Expanded),
        "split" => Ok(IslandState::Split),
        _ => Err(format!("Unknown island state: {}", state)),
    }
}

/// Resize the island window to new dimensions.
#[tauri::command]
fn resize_island(
    window: WebviewWindow,
    width: f64,
    height: f64,
) -> Result<(), String> {
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
        .set_size(tauri::LogicalSize::new(width, height))
        .map_err(|e| e.to_string())?;

    window
        .set_position(tauri::PhysicalPosition::new(
            position.x,
            position.y,
        ))
        .map_err(|e| e.to_string())?;

    Ok(())
}

/// Toggle click-through mode on the island.
#[tauri::command]
fn set_click_through(
    window: WebviewWindow,
    enabled: bool,
) -> Result<(), String> {
    hwnd_controller::set_click_through(&window, enabled)
}

/// Notify the backend of a state change so it can adjust
/// polling/behavior in later phases.
#[tauri::command]
fn notify_state_change(state: String) -> Result<(), String> {
    let parsed_state = parse_island_state(&state)?;

    println!(
        "[Archipelago] State changed to: {:?}",
        parsed_state
    );

    Ok(())
}

/// Control the active Windows media session.
#[tauri::command]
async fn media_skip_previous() -> Result<bool, String> {
    media::skip_previous().await
}

#[tauri::command]
async fn media_toggle_play_pause() -> Result<bool, String> {
    media::toggle_play_pause().await
}

#[tauri::command]
async fn media_skip_next() -> Result<bool, String> {
    media::skip_next().await
}

/// Position the island at the top-center of the monitor
/// where the window currently resides.
fn position_island_on_startup(app: &AppHandle) {
    let window = app
        .get_webview_window("island")
        .expect("island window not found");

    if let Ok(Some(monitor)) = window.current_monitor() {
        let _ = hwnd_controller::set_click_through(
            &window,
            false,
        );

        let monitor_size = monitor.size();
        let monitor_position = monitor.position();
        let scale_factor = monitor.scale_factor();

        // Idle dimensions: 110x32 logical pixels.
        let idle_width = 110.0;
        let idle_height = 32.0;

        let position = calculate_window_position(
            monitor_position.x,
            monitor_position.y,
            monitor_size.width,
            idle_width,
            scale_factor,
        );

        let _ = window.set_size(tauri::LogicalSize::new(
            idle_width,
            idle_height,
        ));

        let _ = window.set_position(tauri::PhysicalPosition::new(
            position.x,
            position.y,
        ));
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            resize_island,
            set_click_through,
            notify_state_change,
            media_skip_previous,
            media_toggle_play_pause,
            media_skip_next,
        ])
        .setup(|app| {
            position_island_on_startup(app.handle());

            evasion::spawn_fullscreen_monitor(
                app.handle().clone(),
            );

            telemetry::spawn_telemetry_monitor(
                app.handle().clone(),
            );

            media::spawn_media_monitor(
                app.handle().clone(),
            );

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

#[cfg(test)]
mod tests {
    use super::*;

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
        let result = parse_island_state("unknown");

        assert!(result.is_err());

        assert_eq!(
            result.unwrap_err(),
            "Unknown island state: unknown"
        );
    }

    #[test]
    fn calculates_centered_position_on_standard_display() {
        let position = calculate_window_position(
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
        let position = calculate_window_position(
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
        let position = calculate_window_position(
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
}