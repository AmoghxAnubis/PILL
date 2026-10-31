#[path = "../../../shared/settings/model.rs"]
pub mod model;
#[path = "../../../shared/settings/storage.rs"]
pub mod storage;
pub use model::PillSettings;

#[tauri::command]
pub fn load_settings() -> Result<PillSettings, String> { storage::load() }

#[tauri::command]
pub async fn update_settings(patch: serde_json::Value) -> Result<PillSettings, String> {
    tauri::async_runtime::spawn_blocking(move || storage::update(patch))
        .await.map_err(|error| error.to_string())?
}

#[tauri::command]
pub async fn reset_settings() -> Result<PillSettings, String> {
    tauri::async_runtime::spawn_blocking(storage::reset)
        .await.map_err(|error| error.to_string())?
}

use tauri::Emitter;
use std::sync::atomic::Ordering;
pub const SETTINGS_CHANGED: &str = "settings_changed";

pub fn spawn_settings_monitor(app: tauri::AppHandle) {
    tauri::async_runtime::spawn(async move {
        let mut last = storage::load().ok();
        let mut interval = tokio::time::interval(std::time::Duration::from_millis(500));
        loop {
            interval.tick().await;
            if crate::SHUTDOWN_REQUESTED.load(Ordering::SeqCst) { break; }
            // Atomic replacement means readers see either complete revision.
            if let Ok(settings) = storage::load() {
                if last.as_ref() != Some(&settings) && app.emit(SETTINGS_CHANGED, &settings).is_ok() {
                    last = Some(settings);
                }
            }
        }
    });
}
