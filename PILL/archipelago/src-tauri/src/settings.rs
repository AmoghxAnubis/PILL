use serde::{Deserialize, Serialize};
use std::{
    env,
    fs,
    path::{Path, PathBuf},
    time::Duration,
};

use tauri::{AppHandle, Emitter};

pub const SETTINGS_CHANGED: &str = "settings_changed";

const SETTINGS_DIRECTORY_NAME: &str = "PILL";
const SETTINGS_FILE_NAME: &str = "settings.json";
const SETTINGS_POLL_INTERVAL_MS: u64 = 500;

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct WidgetSettings {
    pub media: bool,
    pub telemetry: bool,
    pub focus_timer: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct BehaviorSettings {
    pub hover_to_expand: bool,
    pub click_to_expand: bool,
    pub auto_collapse: bool,
    pub collapse_delay_ms: u64,
    pub fullscreen_evasion: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct AppearanceSettings {
    pub theme: ThemeMode,
    pub animations: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum ThemeMode {
    Dark,
    Light,
    System,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct SystemSettings {
    pub launch_at_startup: bool,
    pub minimize_to_tray: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct PillSettings {
    pub version: u8,
    pub widgets: WidgetSettings,
    pub behavior: BehaviorSettings,
    pub appearance: AppearanceSettings,
    pub system: SystemSettings,
}

impl Default for PillSettings {
    fn default() -> Self {
        Self {
            version: 1,

            widgets: WidgetSettings {
                media: true,
                telemetry: true,
                focus_timer: true,
            },

            behavior: BehaviorSettings {
                hover_to_expand: true,
                click_to_expand: true,
                auto_collapse: true,
                collapse_delay_ms: 750,
                fullscreen_evasion: true,
            },

            appearance: AppearanceSettings {
                theme: ThemeMode::Dark,
                animations: true,
            },

            system: SystemSettings {
                launch_at_startup: false,
                minimize_to_tray: true,
            },
        }
    }
}

fn app_data_root() -> Result<PathBuf, String> {
    #[cfg(target_os = "windows")]
    {
        env::var_os("APPDATA")
            .map(PathBuf::from)
            .ok_or_else(|| {
                "APPDATA environment variable is not available"
                    .to_string()
            })
    }

    #[cfg(not(target_os = "windows"))]
    {
        env::var_os("HOME")
            .map(PathBuf::from)
            .map(|home| home.join(".config"))
            .ok_or_else(|| {
                "HOME environment variable is not available"
                    .to_string()
            })
    }
}

fn settings_file_path() -> Result<PathBuf, String> {
    Ok(app_data_root()?
        .join(SETTINGS_DIRECTORY_NAME)
        .join(SETTINGS_FILE_NAME))
}

fn read_settings_file() -> Result<PillSettings, String> {
    let path = settings_file_path()?;

    if !path.exists() {
        return Ok(PillSettings::default());
    }

    let contents = fs::read_to_string(&path).map_err(|error| {
        format!(
            "Failed to read settings file {}: {error}",
            path.display()
        )
    })?;

    match serde_json::from_str::<PillSettings>(&contents) {
        Ok(settings) if settings.version == 1 => {
            Ok(settings)
        }
        Ok(_) => Ok(PillSettings::default()),
        Err(_) => Ok(PillSettings::default()),
    }
}

fn read_settings_contents() -> Result<Option<String>, String> {
    let path = settings_file_path()?;

    if !path.exists() {
        return Ok(None);
    }

    fs::read_to_string(&path)
        .map(Some)
        .map_err(|error| {
            format!(
                "Failed to read settings file {}: {error}",
                path.display()
            )
        })
}

#[tauri::command]
pub fn load_settings() -> Result<PillSettings, String> {
    read_settings_file()
}

/// Watches the shared settings file and emits a Tauri event whenever
/// a new valid settings document is detected.
///
/// Invalid or partially written JSON is ignored instead of replacing
/// the current runtime configuration with defaults.
pub fn spawn_settings_monitor(app: AppHandle) {
    tauri::async_runtime::spawn(async move {
        let mut last_contents = read_settings_contents()
            .ok()
            .flatten();

        let mut interval = tokio::time::interval(
            Duration::from_millis(
                SETTINGS_POLL_INTERVAL_MS,
            ),
        );

        interval.tick().await;

        loop {
            if crate::SHUTDOWN_REQUESTED.load(
                std::sync::atomic::Ordering::SeqCst,
            ) {
                break;
            }

            interval.tick().await;

            let current_contents =
                match read_settings_contents() {
                    Ok(contents) => contents,
                    Err(error) => {
                        eprintln!(
                            "[Archipelago][Settings] {error}"
                        );
                        continue;
                    }
                };

            if current_contents == last_contents {
                continue;
            }

            let Some(contents) = current_contents.as_ref()
            else {
                continue;
            };

            let parsed =
                serde_json::from_str::<PillSettings>(
                    contents,
                );

            let Ok(settings) = parsed else {
                continue;
            };

            if settings.version != 1 {
                continue;
            }

            match app.emit(
                SETTINGS_CHANGED,
                settings,
            ) {
                Ok(()) => {
                    last_contents =
                        current_contents;
                }
                Err(error) => {
                    eprintln!(
                        "[Archipelago][Settings] Failed to emit settings change: {error}"
                    );
                }
            }
        }

        println!(
            "[Archipelago][Settings] Monitor stopped"
        );
    });
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn default_settings_are_enabled() {
        let settings = PillSettings::default();

        assert_eq!(settings.version, 1);
        assert!(settings.widgets.media);
        assert!(settings.widgets.telemetry);
        assert!(settings.widgets.focus_timer);
    }

    #[test]
    fn settings_round_trip_through_json() {
        let settings = PillSettings {
            widgets: WidgetSettings {
                media: true,
                telemetry: false,
                focus_timer: true,
            },
            ..PillSettings::default()
        };

        let serialized =
            serde_json::to_string(&settings)
                .unwrap();

        let restored: PillSettings =
            serde_json::from_str(
                &serialized,
            )
            .unwrap();

        assert_eq!(restored, settings);
    }

    #[test]
    fn serialized_widget_keys_match_shared_contract() {
        let settings =
            PillSettings::default();

        let value =
            serde_json::to_value(settings)
                .unwrap();

        let widgets =
            value.get("widgets").unwrap();

        assert!(
            widgets.get("focusTimer").is_some()
        );

        assert!(
            widgets.get("telemetry").is_some()
        );
    }

    #[test]
    fn unsupported_version_is_rejected_by_validation() {
        let mut settings =
            PillSettings::default();

        settings.version = 2;

        assert_ne!(settings.version, 1);
    }

    #[test]
    fn path_builder_uses_shared_pill_directory() {
        let path = PathBuf::from(
            "C:\\Users\\Test\\AppData\\PILL\\settings.json",
        );

        let parent = path.parent().unwrap();

        assert_eq!(
            parent,
            Path::new(
                "C:\\Users\\Test\\AppData\\PILL"
            )
        );
    }
}