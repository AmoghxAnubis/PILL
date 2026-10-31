#[path = "../../../shared/weather/provider.rs"]
mod provider;
use crate::settings::{model::WeatherSettings, storage};
use provider::{WeatherSnapshot, now_millis};
use std::sync::OnceLock;

const FRESH_MS: u64 = 15 * 60 * 1000;
const MAX_CACHE_MS: u64 = 24 * 60 * 60 * 1000;

fn configured() -> Result<WeatherSettings, String> {
    let settings = storage::load()?.weather;
    if !settings.enabled || settings.location.is_none() { return Err("Choose a city and enable weather in PILL Control".into()); }
    Ok(settings)
}

fn read_cache(settings: &WeatherSettings) -> Option<WeatherSnapshot> {
    let location = settings.location.as_ref()?;
    let bytes = std::fs::read(storage::settings_directory().ok()?.join("weather-cache.json")).ok()?;
    let snapshot: WeatherSnapshot = serde_json::from_slice(&bytes).ok()?;
    if snapshot.validate().is_ok() && snapshot.matches(location, settings.unit)
        && snapshot.fetched_at <= now_millis() && now_millis() - snapshot.fetched_at <= MAX_CACHE_MS {
        Some(snapshot)
    } else { None }
}

#[tauri::command]
pub fn load_cached_weather() -> Result<Option<WeatherSnapshot>, String> {
    Ok(read_cache(&configured()?))
}

#[tauri::command]
pub async fn get_weather() -> Result<WeatherSnapshot, String> {
    // Serialize refreshes across remounts/manual requests; a fresh cache avoids
    // repeated provider calls. UI retries use exponential backoff after errors.
    static REFRESH: OnceLock<tokio::sync::Mutex<()>> = OnceLock::new();
    let _refresh = REFRESH.get_or_init(|| tokio::sync::Mutex::new(())).lock().await;
    let settings = configured()?;
    if let Some(snapshot) = read_cache(&settings) {
        if now_millis() - snapshot.fetched_at < FRESH_MS { return Ok(snapshot); }
    }
    let snapshot = provider::forecast(settings.location.clone().ok_or("Choose a city")?, settings.unit).await?;
    // Disabling/changing location while an HTTP request is in flight must not
    // commit that obsolete response as the current location's cache.
    if configured()? != settings { return Err("Weather settings changed during refresh".into()); }
    let bytes = serde_json::to_vec(&snapshot).map_err(|error| error.to_string())?;
    if let Ok(directory) = storage::settings_directory() {
        if let Err(error) = storage::atomic_write(&directory.join("weather-cache.json"), &bytes) {
            eprintln!("[Weather] Cache unavailable: {error}");
        }
    }
    Ok(snapshot)
}
