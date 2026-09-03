use tauri::{AppHandle, Manager, WebviewWindow};
use serde::{Deserialize, Serialize};

mod hwnd_controller;

/// Represents the current island UI state
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum IslandState {
    Idle,
    Compact,
    Expanded,
    Split,
}

/// Resize the island window to new dimensions
#[tauri::command]
fn resize_island(window: WebviewWindow, width: f64, height: f64) -> Result<(), String> {
    let monitor = window.current_monitor()
        .map_err(|e| e.to_string())?
        .ok_or("No monitor found")?;

    let monitor_size = monitor.size();
    let monitor_position = monitor.position();
    let scale_factor = monitor.scale_factor();

    // Center horizontally on the current monitor, pin to top
    let physical_width = (width * scale_factor) as i32;
    let x = monitor_position.x + (monitor_size.width as i32 - physical_width) / 2;
    let y = monitor_position.y + (8.0 * scale_factor) as i32; // 8px padding from top

    window.set_size(tauri::LogicalSize::new(width, height))
        .map_err(|e| e.to_string())?;
    window.set_position(tauri::PhysicalPosition::new(x, y))
        .map_err(|e| e.to_string())?;

    Ok(())
}

/// Toggle click-through mode on the island
#[tauri::command]
fn set_click_through(window: WebviewWindow, enabled: bool) -> Result<(), String> {
    hwnd_controller::set_click_through(&window, enabled)
}

/// Notify the backend of a state change so it can adjust polling/behavior
#[tauri::command]
fn notify_state_change(state: String) -> Result<(), String> {
    // Will be used in later phases for adaptive polling
    println!("[Archipelago] State changed to: {}", state);
    Ok(())
}

/// Position the island at top-center of the monitor where the cursor currently is
fn position_island_on_startup(app: &AppHandle) {
    let window = app.get_webview_window("island").expect("island window not found");

    if let Ok(Some(monitor)) = window.current_monitor() {
        let monitor_size = monitor.size();
        let monitor_position = monitor.position();
        let scale_factor = monitor.scale_factor();

        // Idle dimensions: 110x32 logical pixels
        let idle_width = 110.0;
        let idle_height = 32.0;

        let physical_width = (idle_width * scale_factor) as i32;
        let x = monitor_position.x + (monitor_size.width as i32 - physical_width) / 2;
        let y = monitor_position.y + (8.0 * scale_factor) as i32;

        let _ = window.set_size(tauri::LogicalSize::new(idle_width, idle_height));
        let _ = window.set_position(tauri::PhysicalPosition::new(x, y));
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
        ])
        .setup(|app| {
            position_island_on_startup(app.handle());
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
