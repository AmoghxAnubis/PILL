use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;
use std::sync::atomic::Ordering;
use std::time::Duration;

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

fn settings_file_path() -> Result<PathBuf, String> {
    #[cfg(target_os = "windows")]
    {
        std::env::var_os("APPDATA")
            .map(PathBuf::from)
            .map(|app_data| {
                app_data
                    .join(SETTINGS_DIRECTORY_NAME)
                    .join(SETTINGS_FILE_NAME)
            })
            .ok_or_else(|| {
                "APPDATA environment variable is not available"
                    .to_string()
            })
    }

    #[cfg(not(target_os = "windows"))]
    {
        std::env::var_os("HOME")
            .map(PathBuf::from)
            .map(|home| {
                home.join(".config")
                    .join(SETTINGS_DIRECTORY_NAME)
                    .join(SETTINGS_FILE_NAME)
            })
            .ok_or_else(|| {
                "HOME environment variable is not available"
                    .to_string()
            })
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

fn parse_settings(
    contents: &str,
) -> Option<PillSettings> {
    match serde_json::from_str::<PillSettings>(contents) {
        Ok(settings) if settings.version == 1 => {
            Some(settings)
        }
        _ => None,
    }
}

#[tauri::command]
pub fn load_settings() -> Result<PillSettings, String> {
    let Some(contents) = read_settings_contents()?
    else {
        return Ok(PillSettings::default());
    };

    Ok(
        parse_settings(&contents)
            .unwrap_or_default(),
    )
}

pub fn spawn_settings_monitor(
    app: AppHandle,
) {
    tauri::async_runtime::spawn(async move {
        let mut last_contents =
            match read_settings_contents() {
                Ok(contents) => contents,
                Err(error) => {
                    eprintln!(
                        "[Archipelago][Settings] {error}"
                    );
                    None
                }
            };

        let mut interval =
            tokio::time::interval(Duration::from_millis(
                SETTINGS_POLL_INTERVAL_MS,
            ));

        interval.tick().await;

        loop {
            if crate::SHUTDOWN_REQUESTED.load(
                Ordering::SeqCst,
            ) {
                println!(
                    "[Archipelago][Settings] Monitor stopped"
                );
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

            let Some(contents) =
                current_contents.as_deref()
            else {
                /*
                 * A missing file is not treated as a live
                 * settings reset. This avoids changing
                 * runtime settings during a transient file
                 * replacement.
                 */
                continue;
            };

            let Some(settings) =
                parse_settings(contents)
            else {
                /*
                 * Ignore incomplete/invalid JSON. The
                 * Control application may briefly expose a
                 * partially-written file while updating it.
                 */
                continue;
            };

            match app.emit(
                SETTINGS_CHANGED,
                settings,
            ) {
                Ok(()) => {
                    last_contents =
                        current_contents;

                    println!(
                        "[Archipelago][Settings] Settings changed"
                    );
                }

                Err(error) => {
                    eprintln!(
                        "[Archipelago][Settings] Failed to emit settings change: {error}"
                    );
                }
            }
        }
    });
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn defaults_enable_all_widgets() {
        let settings =
            PillSettings::default();

        assert_eq!(
            settings.version,
            1
        );

        assert!(
            settings.widgets.media
        );

        assert!(
            settings.widgets.telemetry
        );

        assert!(
            settings.widgets.focus_timer
        );
    }

    #[test]
    fn telemetry_can_be_disabled() {
        let settings = PillSettings {
            widgets: WidgetSettings {
                media: true,
                telemetry: false,
                focus_timer: true,
            },
            ..PillSettings::default()
        };

        assert!(
            settings.widgets.media
        );

        assert!(
            !settings.widgets.telemetry
        );

        assert!(
            settings.widgets.focus_timer
        );
    }

    #[test]
    fn settings_round_trip_through_json() {
        let settings = PillSettings {
            widgets: WidgetSettings {
                media: true,
                telemetry: false,
                focus_timer: true,
            },
            behavior: BehaviorSettings {
                hover_to_expand: false,
                click_to_expand: true,
                auto_collapse: true,
                collapse_delay_ms: 1200,
                fullscreen_evasion: false,
            },
            appearance: AppearanceSettings {
                theme: ThemeMode::Light,
                animations: false,
            },
            system: SystemSettings {
                launch_at_startup: true,
                minimize_to_tray: false,
            },
            version: 1,
        };

        let json =
            serde_json::to_string(&settings)
                .unwrap();

        let restored: PillSettings =
            serde_json::from_str(&json)
                .unwrap();

        assert_eq!(
            restored,
            settings
        );
    }

    #[test]
    fn serialized_keys_match_control_contract() {
        let settings =
            PillSettings::default();

        let value =
            serde_json::to_value(settings)
                .unwrap();

        assert_eq!(
            value["widgets"]["focusTimer"],
            true
        );

        assert_eq!(
            value["widgets"]["telemetry"],
            true
        );

        assert_eq!(
            value["behavior"]["collapseDelayMs"],
            750
        );

        assert_eq!(
            value["system"]["launchAtStartup"],
            false
        );
    }

    #[test]
    fn invalid_json_is_rejected() {
        assert!(
            parse_settings(
                "{ definitely not valid json }"
            )
            .is_none()
        );
    }

    #[test]
    fn unsupported_version_is_rejected() {
        let mut settings =
            PillSettings::default();

        settings.version = 2;

        let json =
            serde_json::to_string(&settings)
                .unwrap();

        assert!(
            parse_settings(&json)
                .is_none()
        );
    }

    #[test]
    fn empty_file_is_rejected() {
        assert!(
            parse_settings("")
                .is_none()
        );
    }

    #[test]
    fn whitespace_file_is_rejected() {
        assert!(
            parse_settings("   ")
                .is_none()
        );
    }
}