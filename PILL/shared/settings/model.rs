use serde::{Deserialize, Serialize};

pub const SETTINGS_VERSION: u8 = 2;

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct WidgetSettings {
    pub media: bool,
    pub telemetry: bool,
    pub focus_timer: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct BehaviorSettings {
    pub hover_to_expand: bool,
    pub click_to_expand: bool,
    pub auto_collapse: bool,
    pub collapse_delay_ms: u64,
    pub fullscreen_evasion: bool,
    #[serde(default)]
    pub pin_expanded: bool,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum ThemeMode { Dark, Light, System, Graphite, Blue, Purple, Fluent }

#[derive(Debug, Clone, Copy, Default, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum IslandShape { #[default] Pill, Panel }

fn full_opacity() -> f64 { 1.0 }
fn default_scale() -> f64 { 1.0 }

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct AppearanceSettings {
    pub theme: ThemeMode,
    pub animations: bool,
    #[serde(default = "full_opacity")]
    pub opacity: f64,
    #[serde(default = "default_scale")]
    pub scale: f64,
    #[serde(default)]
    pub shape: IslandShape,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct SystemSettings {
    pub launch_at_startup: bool,
    pub minimize_to_tray: bool,
}

#[derive(Debug, Clone, Copy, Default, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum TemperatureUnit { #[default] Celsius, Fahrenheit }

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct WeatherLocation {
    pub id: u64,
    pub name: String,
    pub region: String,
    pub country: String,
    pub latitude: f64,
    pub longitude: f64,
}

#[derive(Debug, Clone, Default, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct WeatherSettings {
    pub enabled: bool,
    pub location: Option<WeatherLocation>,
    pub unit: TemperatureUnit,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(deny_unknown_fields)]
pub struct PillSettings {
    pub version: u8,
    #[serde(default)]
    pub revision: u64,
    pub widgets: WidgetSettings,
    pub behavior: BehaviorSettings,
    pub appearance: AppearanceSettings,
    pub system: SystemSettings,
    #[serde(default)]
    pub weather: WeatherSettings,
}

impl Default for PillSettings {
    fn default() -> Self {
        Self {
            version: SETTINGS_VERSION, revision: 0,
            widgets: WidgetSettings { media: true, telemetry: true, focus_timer: true },
            behavior: BehaviorSettings { hover_to_expand: true, click_to_expand: true, auto_collapse: true, collapse_delay_ms: 750, fullscreen_evasion: true, pin_expanded: false },
            appearance: AppearanceSettings { theme: ThemeMode::Dark, animations: true, opacity: 1.0, scale: 1.0, shape: IslandShape::Pill },
            system: SystemSettings { launch_at_startup: false, minimize_to_tray: true },
            weather: WeatherSettings::default(),
        }
    }
}

pub fn validate_location(location: &WeatherLocation) -> Result<(), String> {
    if location.name.trim().is_empty() || location.name.len() > 160
        || location.region.len() > 160 || location.country.len() > 160
        || !location.latitude.is_finite() || !location.longitude.is_finite()
        || !(-90.0..=90.0).contains(&location.latitude)
        || !(-180.0..=180.0).contains(&location.longitude) {
        return Err("Invalid weather location".into());
    }
    Ok(())
}

impl PillSettings {
    pub fn validate(&self) -> Result<(), String> {
        if self.version != SETTINGS_VERSION { return Err("Unsupported settings version".into()); }
        if !self.appearance.opacity.is_finite() || !(0.55..=1.0).contains(&self.appearance.opacity) {
            return Err("Background opacity must be between 55% and 100%".into());
        }
        if !self.appearance.scale.is_finite() || !(0.85..=1.25).contains(&self.appearance.scale) {
            return Err("Island scale must be between 85% and 125%".into());
        }
        if self.behavior.collapse_delay_ms > 10_000 { return Err("Collapse delay is too large".into()); }
        if let Some(location) = &self.weather.location { validate_location(location)?; }
        Ok(())
    }
}

pub fn parse_settings(contents: &str) -> Result<PillSettings, String> {
    let mut settings: PillSettings = serde_json::from_str(contents)
        .map_err(|_| "Settings could not be read. The existing file has been preserved.".to_string())?;
    if settings.version != 1 && settings.version != SETTINGS_VERSION {
        return Err("This settings file belongs to a newer PILL version".into());
    }
    settings.version = SETTINGS_VERSION;
    settings.validate()?;
    Ok(settings)
}
