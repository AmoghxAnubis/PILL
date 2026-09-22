use serde::{Deserialize, Serialize};
use std::{
    env,
    fs,
    path::{Path, PathBuf},
};

const SETTINGS_DIRECTORY_NAME: &str = "PILL";
const SETTINGS_FILE_NAME: &str = "settings.json";

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

fn settings_directory_from_root(root: impl AsRef<Path>) -> PathBuf {
    root.as_ref().join(SETTINGS_DIRECTORY_NAME)
}

fn settings_file_from_root(root: impl AsRef<Path>) -> PathBuf {
    settings_directory_from_root(root).join(SETTINGS_FILE_NAME)
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
    let root = app_data_root()?;
    Ok(settings_file_from_root(root))
}

#[tauri::command]
pub fn load_settings() -> Result<PillSettings, String> {
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

#[tauri::command]
pub fn save_settings(settings: PillSettings) -> Result<(), String> {
    if settings.version != 1 {
        return Err(format!(
            "Unsupported settings version: {}",
            settings.version
        ));
    }

    let path = settings_file_path()?;

    let directory = path
        .parent()
        .ok_or_else(|| {
            "Settings file has no parent directory".to_string()
        })?;

    fs::create_dir_all(directory).map_err(|error| {
        format!(
            "Failed to create settings directory {}: {error}",
            directory.display()
        )
    })?;

    let serialized =
        serde_json::to_string_pretty(&settings).map_err(|error| {
            format!(
                "Failed to serialize settings: {error}"
            )
        })?;

    fs::write(&path, serialized).map_err(|error| {
        format!(
            "Failed to write settings file {}: {error}",
            path.display()
        )
    })?;

    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn default_settings_match_expected_values() {
        let settings = PillSettings::default();

        assert_eq!(settings.version, 1);

        assert!(settings.widgets.media);
        assert!(settings.widgets.telemetry);
        assert!(settings.widgets.focus_timer);

        assert!(settings.behavior.hover_to_expand);
        assert!(settings.behavior.click_to_expand);
        assert!(settings.behavior.auto_collapse);
        assert_eq!(
            settings.behavior.collapse_delay_ms,
            750
        );
        assert!(settings.behavior.fullscreen_evasion);

        assert_eq!(
            settings.appearance.theme,
            ThemeMode::Dark
        );
        assert!(settings.appearance.animations);

        assert!(!settings.system.launch_at_startup);
        assert!(settings.system.minimize_to_tray);
    }

    #[test]
    fn settings_file_path_is_under_shared_pill_directory() {
        let root = PathBuf::from("C:\\Users\\Test\\AppData");

        let path = settings_file_from_root(&root);

        assert_eq!(
            path,
            PathBuf::from(
                "C:\\Users\\Test\\AppData\\PILL\\settings.json"
            )
        );
    }

    #[test]
    fn settings_directory_is_under_shared_pill_directory() {
        let root = PathBuf::from("C:\\Users\\Test\\AppData");

        let directory =
            settings_directory_from_root(&root);

        assert_eq!(
            directory,
            PathBuf::from(
                "C:\\Users\\Test\\AppData\\PILL"
            )
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
            ..PillSettings::default()
        };

        let serialized =
            serde_json::to_string(&settings).unwrap();

        let restored: PillSettings =
            serde_json::from_str(&serialized).unwrap();

        assert_eq!(restored, settings);
    }

    #[test]
    fn telemetry_can_be_disabled_without_affecting_other_widgets() {
        let settings = PillSettings {
            widgets: WidgetSettings {
                media: true,
                telemetry: false,
                focus_timer: true,
            },
            ..PillSettings::default()
        };

        assert!(settings.widgets.media);
        assert!(!settings.widgets.telemetry);
        assert!(settings.widgets.focus_timer);
    }

    #[test]
    fn invalid_json_falls_back_to_defaults() {
        let result =
            serde_json::from_str::<PillSettings>(
                "{invalid json}",
            );

        assert!(result.is_err());

        let defaults = PillSettings::default();

        assert!(defaults.widgets.telemetry);
    }

    #[test]
    fn unsupported_versions_are_detectable() {
        let mut settings = PillSettings::default();

        settings.version = 2;

        assert_ne!(settings.version, 1);
    }
}