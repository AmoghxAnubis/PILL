use super::model::{parse_settings, PillSettings};
use fs2::FileExt;
use serde_json::Value;
use std::{fs::{self, File, OpenOptions}, io::Write, path::{Path, PathBuf}, sync::atomic::{AtomicU64, Ordering}, time::{Duration, Instant}};

pub fn settings_directory() -> Result<PathBuf, String> {
    #[cfg(target_os = "windows")]
    let root = std::env::var_os("APPDATA").map(PathBuf::from);
    #[cfg(not(target_os = "windows"))]
    let root = std::env::var_os("HOME").map(|home| PathBuf::from(home).join(".config"));
    root.map(|path| path.join("PILL")).ok_or_else(|| "Application data directory is unavailable".into())
}

pub fn load_from(directory: &Path) -> Result<PillSettings, String> {
    match fs::read_to_string(directory.join("settings.json")) {
        Ok(contents) => parse_settings(&contents),
        Err(error) if error.kind() == std::io::ErrorKind::NotFound => Ok(PillSettings::default()),
        Err(error) => Err(format!("Could not read PILL settings: {error}")),
    }
}
pub fn load() -> Result<PillSettings, String> { load_from(&settings_directory()?) }

pub fn atomic_write(path: &Path, bytes: &[u8]) -> Result<(), String> {
    static SEQUENCE: AtomicU64 = AtomicU64::new(0);
    let parent = path.parent().ok_or("Invalid settings path")?;
    fs::create_dir_all(parent).map_err(|error| error.to_string())?;
    let temporary = path.with_extension(format!("{}.{}.tmp", std::process::id(), SEQUENCE.fetch_add(1, Ordering::Relaxed)));
    let result = (|| {
        let mut file = OpenOptions::new().write(true).create_new(true).open(&temporary)?;
        file.write_all(bytes)?;
        file.sync_all()?;
        drop(file);
        fs::rename(&temporary, path)
    })();
    if let Err(error) = result {
        let _ = fs::remove_file(&temporary);
        return Err(format!("Could not save PILL settings: {error}"));
    }
    Ok(())
}

fn lock(directory: &Path) -> Result<File, String> {
    fs::create_dir_all(directory).map_err(|error| error.to_string())?;
    // Lock a stable sidecar, not the JSON file that atomic replacement swaps.
    let file = OpenOptions::new().read(true).write(true).create(true).truncate(false)
        .open(directory.join("settings.lock")).map_err(|error| error.to_string())?;
    let started = Instant::now();
    loop {
        match FileExt::try_lock_exclusive(&file) {
            Ok(()) => return Ok(file),
            Err(error) if error.kind() == std::io::ErrorKind::WouldBlock || error.raw_os_error() == Some(33) => {
                if started.elapsed() > Duration::from_secs(2) { return Err("Settings are busy. Please try again.".into()); }
                std::thread::sleep(Duration::from_millis(15));
            }
            Err(error) => return Err(format!("Could not lock PILL settings: {error}")),
        }
    }
}

pub fn update_from(directory: &Path, patch: Value) -> Result<PillSettings, String> {
    let object = patch.as_object().ok_or("Settings update must be an object")?;
    if object.keys().any(|key| !["widgets", "behavior", "appearance", "system", "weather"].contains(&key.as_str())) {
        return Err("Unknown settings section".into());
    }
    let _guard = lock(directory)?;
    let current = load_from(directory)?;
    let mut merged = serde_json::to_value(&current).map_err(|error| error.to_string())?;
    for (section, updates) in object {
        let updates = updates.as_object().ok_or("Settings sections must be objects")?;
        let target = merged[section].as_object_mut().ok_or("Unknown settings section")?;
        for (key, value) in updates { target.insert(key.clone(), value.clone()); }
    }
    let mut next: PillSettings = serde_json::from_value(merged).map_err(|_| "Invalid settings update".to_string())?;
    next.validate()?;
    next.revision = current.revision.checked_add(1).ok_or("Settings revision limit reached")?;
    let bytes = serde_json::to_vec_pretty(&next).map_err(|error| error.to_string())?;
    atomic_write(&directory.join("settings.json"), &bytes)?;
    Ok(next)
}
pub fn update(patch: Value) -> Result<PillSettings, String> { update_from(&settings_directory()?, patch) }

pub fn reset() -> Result<PillSettings, String> {
    let defaults = serde_json::to_value(PillSettings::default()).map_err(|error| error.to_string())?;
    let mut patch = defaults.as_object().cloned().ok_or("Invalid defaults")?;
    patch.remove("version"); patch.remove("revision");
    update(Value::Object(patch))
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    fn temporary_directory() -> PathBuf {
        static TEST_ID: AtomicU64 = AtomicU64::new(0);
        let path = std::env::temp_dir().join(format!("pill-settings-{}-{}", std::process::id(), TEST_ID.fetch_add(1, Ordering::Relaxed)));
        fs::create_dir_all(&path).unwrap(); path
    }

    #[test]
    fn migrates_version_one_without_losing_preferences() {
        let directory = temporary_directory();
        let old = json!({"version":1,"widgets":{"media":false,"telemetry":true,"focusTimer":true},"behavior":{"hoverToExpand":false,"clickToExpand":true,"autoCollapse":true,"collapseDelayMs":1200,"fullscreenEvasion":true},"appearance":{"theme":"light","animations":false},"system":{"launchAtStartup":false,"minimizeToTray":true}});
        fs::write(directory.join("settings.json"), old.to_string()).unwrap();
        let updated = update_from(&directory, json!({"appearance":{"opacity":0.7}})).unwrap();
        assert_eq!(updated.version, 2); assert!(!updated.widgets.media);
        assert!(!updated.behavior.hover_to_expand); assert_eq!(updated.behavior.collapse_delay_ms, 1200);
        assert_eq!(updated.appearance.opacity, 0.7); assert!(!updated.appearance.animations);
        assert_eq!(updated.appearance.scale, 1.0); assert!(!updated.weather.enabled);
        fs::remove_dir_all(directory).unwrap();
    }

    #[test]
    fn concurrent_updates_preserve_unrelated_fields() {
        let directory = temporary_directory();
        let one = directory.clone(); let two = directory.clone();
        let first = std::thread::spawn(move || update_from(&one, json!({"appearance":{"theme":"purple"}})).unwrap());
        let second = std::thread::spawn(move || update_from(&two, json!({"widgets":{"telemetry":false}})).unwrap());
        first.join().unwrap(); second.join().unwrap();
        let settings = load_from(&directory).unwrap();
        assert_eq!(settings.appearance.theme, super::super::model::ThemeMode::Purple);
        assert!(!settings.widgets.telemetry); assert_eq!(settings.revision, 2);
        fs::remove_dir_all(directory).unwrap();
    }

    #[test]
    fn invalid_updates_and_corrupt_or_future_files_are_preserved() {
        let directory = temporary_directory();
        update_from(&directory, json!({"appearance":{"theme":"blue"}})).unwrap();
        let before = fs::read(directory.join("settings.json")).unwrap();
        for patch in [json!({"appearance":{"scale":10}}), json!({"appearance":{"opacity":0}}), json!({"appearance":{"unknown":true}}), json!({"revision":8})] {
            assert!(update_from(&directory, patch).is_err());
            assert_eq!(fs::read(directory.join("settings.json")).unwrap(), before);
        }
        for contents in ["{broken}".to_string(), String::from_utf8(before).unwrap().replace("\"version\": 2", "\"version\": 99")] {
            fs::write(directory.join("settings.json"), &contents).unwrap();
            assert!(update_from(&directory, json!({"widgets":{"media":false}})).is_err());
            assert_eq!(fs::read_to_string(directory.join("settings.json")).unwrap(), contents);
        }
        fs::remove_dir_all(directory).unwrap();
    }
}
