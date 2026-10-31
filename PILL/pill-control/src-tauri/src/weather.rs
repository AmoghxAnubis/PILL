#[path = "../../../shared/weather/provider.rs"]
mod provider;

#[tauri::command]
pub async fn search_weather_locations(query: String) -> Result<Vec<crate::settings::model::WeatherLocation>, String> {
    provider::search(query).await
}
