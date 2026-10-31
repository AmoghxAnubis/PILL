use crate::settings::model::{validate_location, TemperatureUnit, WeatherLocation};
use serde::{Deserialize, Serialize};
use std::{sync::OnceLock, time::{Duration, SystemTime, UNIX_EPOCH}};

const MAX_RESPONSE_BYTES: usize = 256 * 1024;

fn client() -> Result<&'static reqwest::Client, String> {
    static CLIENT: OnceLock<Result<reqwest::Client, String>> = OnceLock::new();
    CLIENT.get_or_init(|| reqwest::Client::builder()
        .https_only(true).connect_timeout(Duration::from_secs(4)).timeout(Duration::from_secs(10))
        .user_agent("PILL/0.2-weather-preview")
        .build().map_err(|_| "Weather service could not be initialized".to_string()))
        .as_ref().map_err(Clone::clone)
}

async fn read_json<T: serde::de::DeserializeOwned>(request: reqwest::RequestBuilder) -> Result<T, String> {
    let mut response = request.send().await.map_err(|_| "Could not reach the weather service. Check your connection.".to_string())?
        .error_for_status().map_err(|_| "The weather service is unavailable. Please try later.".to_string())?;
    let mut bytes = Vec::new();
    while let Some(chunk) = response.chunk().await.map_err(|_| "Weather response was interrupted".to_string())? {
        if bytes.len() + chunk.len() > MAX_RESPONSE_BYTES { return Err("Weather response was too large".into()); }
        bytes.extend_from_slice(&chunk);
    }
    serde_json::from_slice(&bytes).map_err(|_| "The weather service returned incomplete data".into())
}

#[derive(Deserialize)]
struct SearchResponse { #[serde(default)] results: Vec<SearchLocation> }
#[derive(Deserialize)]
struct SearchLocation {
    id: u64, name: String, latitude: f64, longitude: f64,
    #[serde(default)] admin1: String,
    #[serde(default)] country: String,
}

pub async fn search(query: String) -> Result<Vec<WeatherLocation>, String> {
    let query = query.trim();
    if query.chars().count() < 2 || query.len() > 160 { return Err("Enter a city name between 2 and 160 characters".into()); }
    let response: SearchResponse = read_json(client()?.get("https://geocoding-api.open-meteo.com/v1/search")
        .query(&[("name", query), ("count", "5"), ("language", "en"), ("format", "json")])).await?;
    Ok(response.results.into_iter().filter_map(|result| {
        let location = WeatherLocation { id: result.id, name: result.name, region: result.admin1, country: result.country, latitude: result.latitude, longitude: result.longitude };
        validate_location(&location).ok().map(|_| location)
    }).collect())
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct WeatherSnapshot {
    pub location: WeatherLocation,
    pub unit: TemperatureUnit,
    pub fetched_at: u64,
    pub observed_at: u64,
    pub temperature: f64,
    pub apparent_temperature: f64,
    pub humidity: f64,
    pub wind_speed: f64,
    pub wind_direction: f64,
    pub code: u16,
    pub is_day: bool,
}

#[derive(Deserialize)]
struct ForecastResponse { current: CurrentWeather }
#[derive(Deserialize)]
struct CurrentWeather {
    time: u64, temperature_2m: f64, apparent_temperature: f64,
    relative_humidity_2m: f64, wind_speed_10m: f64,
    wind_direction_10m: f64, weather_code: u16, is_day: u8,
}

pub fn now_millis() -> u64 {
    SystemTime::now().duration_since(UNIX_EPOCH).unwrap_or_default().as_millis() as u64
}

impl WeatherSnapshot {
    pub fn matches(&self, location: &WeatherLocation, unit: TemperatureUnit) -> bool {
        &self.location == location && self.unit == unit
    }
    pub fn validate(&self) -> Result<(), String> {
        validate_location(&self.location)?;
        if !self.temperature.is_finite() || !self.apparent_temperature.is_finite()
            || !(-250.0..=300.0).contains(&self.temperature) || !(-250.0..=300.0).contains(&self.apparent_temperature)
            || !self.humidity.is_finite() || !(0.0..=100.0).contains(&self.humidity)
            || !self.wind_speed.is_finite() || !(0.0..=1000.0).contains(&self.wind_speed)
            || !self.wind_direction.is_finite() || !(0.0..=360.0).contains(&self.wind_direction) {
            return Err("The weather service returned invalid measurements".into());
        }
        Ok(())
    }
}

fn to_snapshot(current: CurrentWeather, location: WeatherLocation, unit: TemperatureUnit) -> Result<WeatherSnapshot, String> {
    if current.is_day > 1 { return Err("Invalid weather day/night value".into()); }
    let snapshot = WeatherSnapshot {
        location, unit, fetched_at: now_millis(), observed_at: current.time.checked_mul(1000).ok_or("Invalid weather time")?,
        temperature: current.temperature_2m, apparent_temperature: current.apparent_temperature,
        humidity: current.relative_humidity_2m, wind_speed: current.wind_speed_10m,
        wind_direction: current.wind_direction_10m, code: current.weather_code, is_day: current.is_day == 1,
    };
    snapshot.validate()?;
    Ok(snapshot)
}

pub async fn forecast(location: WeatherLocation, unit: TemperatureUnit) -> Result<WeatherSnapshot, String> {
    validate_location(&location)?;
    let response: ForecastResponse = read_json(client()?.get("https://api.open-meteo.com/v1/forecast")
        .query(&[
            ("latitude", location.latitude.to_string()), ("longitude", location.longitude.to_string()),
            ("current", "temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,is_day,wind_speed_10m,wind_direction_10m".into()),
            ("temperature_unit", if unit == TemperatureUnit::Fahrenheit { "fahrenheit" } else { "celsius" }.into()),
            ("wind_speed_unit", if unit == TemperatureUnit::Fahrenheit { "mph" } else { "kmh" }.into()),
            ("timeformat", "unixtime".into()),
        ])).await?;
    to_snapshot(response.current, location, unit)
}

#[cfg(test)]
mod tests {
    use super::*;
    fn location() -> WeatherLocation { WeatherLocation { id: 1, name: "Test City".into(), region: String::new(), country: "Test".into(), latitude: 10.0, longitude: 20.0 } }
    #[test]
    fn maps_actual_provider_fields_and_preserves_units() {
        let current = serde_json::from_str(r#"{"time":1793448000,"temperature_2m":72.5,"apparent_temperature":73.2,"relative_humidity_2m":60,"wind_speed_10m":8.2,"wind_direction_10m":180,"weather_code":3,"is_day":1}"#).unwrap();
        let snapshot = to_snapshot(current, location(), TemperatureUnit::Fahrenheit).unwrap();
        assert_eq!(snapshot.temperature, 72.5); assert_eq!(snapshot.wind_speed, 8.2);
        assert_eq!(snapshot.observed_at, 1793448000000); assert!(snapshot.is_day);
        assert!(snapshot.matches(&location(), TemperatureUnit::Fahrenheit));
        assert!(!snapshot.matches(&location(), TemperatureUnit::Celsius));
    }
    #[test]
    fn rejects_missing_or_invalid_measurements() {
        assert!(serde_json::from_str::<ForecastResponse>(r#"{"current":{"temperature_2m":null}}"#).is_err());
        let current = CurrentWeather { time: 1, temperature_2m: 20.0, apparent_temperature: 20.0, relative_humidity_2m: 150.0, wind_speed_10m: 2.0, wind_direction_10m: 90.0, weather_code: 0, is_day: 1 };
        assert!(to_snapshot(current, location(), TemperatureUnit::Celsius).is_err());
    }
}
