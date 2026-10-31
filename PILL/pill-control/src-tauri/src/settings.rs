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
