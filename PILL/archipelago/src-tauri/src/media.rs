use crate::events::MEDIA_UPDATE;
use serde::{Deserialize, Serialize};
use std::time::Duration;
use tauri::{AppHandle, Emitter};

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct MediaSnapshot {
    pub app_id: String,
    pub title: String,
    pub artist: String,
    pub is_playing: bool,
    pub duration: f64,
    pub position: f64,
    pub artwork: Option<String>,
}

impl Default for MediaSnapshot {
    fn default() -> Self {
        Self {
            app_id: String::new(),
            title: String::new(),
            artist: String::new(),
            is_playing: false,
            duration: 0.0,
            position: 0.0,
            artwork: None,
        }
    }
}

impl MediaSnapshot {
    pub fn is_empty(&self) -> bool {
        self.app_id.is_empty()
            && self.title.is_empty()
            && self.artist.is_empty()
            && !self.is_playing
            && self.duration == 0.0
            && self.position == 0.0
            && self.artwork.is_none()
    }
}

#[cfg(target_os = "windows")]
mod windows_media {
    use super::*;
    use windows::Media::Control::{
        GlobalSystemMediaTransportControlsSessionManager,
        GlobalSystemMediaTransportControlsSessionPlaybackStatus,
    };

    pub async fn read_current_session() -> Option<MediaSnapshot> {
        let operation =
            GlobalSystemMediaTransportControlsSessionManager::RequestAsync().ok()?;

        let manager = match operation.await {
            Ok(manager) => manager,
            Err(error) => {
                eprintln!(
                    "[Archipelago][Media] RequestAsync failed: {}",
                    error
                );
                return None;
            }
        };

        let session = match manager.GetCurrentSession() {
            Ok(session) => session,
            Err(error) => {
                eprintln!(
                    "[Archipelago][Media] GetCurrentSession failed: {}",
                    error
                );
                return None;
            }
        };

        let properties_operation = match session.TryGetMediaPropertiesAsync() {
            Ok(operation) => operation,
            Err(error) => {
                eprintln!(
                    "[Archipelago][Media] TryGetMediaPropertiesAsync failed: {}",
                    error
                );
                return None;
            }
        };

        let properties = match properties_operation.await {
            Ok(properties) => properties,
            Err(error) => {
                eprintln!(
                    "[Archipelago][Media] Media properties await failed: {}",
                    error
                );
                return None;
            }
        };

        let playback = match session.GetPlaybackInfo() {
            Ok(playback) => playback,
            Err(error) => {
                eprintln!(
                    "[Archipelago][Media] GetPlaybackInfo failed: {}",
                    error
                );
                return None;
            }
        };

        let timeline = match session.GetTimelineProperties() {
            Ok(timeline) => timeline,
            Err(error) => {
                eprintln!(
                    "[Archipelago][Media] GetTimelineProperties failed: {}",
                    error
                );
                return None;
            }
        };

        let title = properties.Title().unwrap_or_default().to_string();

        let artist = properties.Artist().unwrap_or_default().to_string();

        let is_playing = playback
            .PlaybackStatus()
            .map(|status| {
                status == GlobalSystemMediaTransportControlsSessionPlaybackStatus::Playing
            })
            .unwrap_or(false);

        let duration = timeline
            .EndTime()
            .map(|value| value.Duration as f64 / 10_000_000.0)
            .unwrap_or(0.0);

        let position = timeline
            .Position()
            .map(|value| value.Duration as f64 / 10_000_000.0)
            .unwrap_or(0.0);

        let app_id = session
            .SourceAppUserModelId()
            .ok()
            .map(|value| value.to_string())
            .unwrap_or_default();

        Some(MediaSnapshot {
            app_id,
            title,
            artist,
            is_playing,
            duration: duration.max(0.0),
            position: position.max(0.0),
            artwork: None,
        })
    }

    pub fn spawn_media_monitor(app: AppHandle) {
        tauri::async_runtime::spawn(async move {
            println!("[Archipelago][Media] Media monitor started");

            let mut last_snapshot = MediaSnapshot::default();

            let mut interval = tokio::time::interval(Duration::from_millis(500));
            interval.tick().await;

            loop {
                interval.tick().await;

                let snapshot = read_current_session().await;

                match snapshot {
                    Some(snapshot) => {
                        if snapshot != last_snapshot {
                            println!(
                                "[Archipelago][Media] Session: app_id='{}', title='{}', artist='{}', playing={}",
                                snapshot.app_id,
                                snapshot.title,
                                snapshot.artist,
                                snapshot.is_playing
                            );

                            if let Err(error) =
                                app.emit(MEDIA_UPDATE, snapshot.clone())
                            {
                                eprintln!(
                                    "[Archipelago][Media] Failed to emit media update: {}",
                                    error
                                );
                            }

                            last_snapshot = snapshot;
                        }
                    }

                    None => {
                        if !last_snapshot.is_empty() {
                            let empty_snapshot = MediaSnapshot::default();

                            println!(
                                "[Archipelago][Media] No active media session"
                            );

                            if let Err(error) =
                                app.emit(MEDIA_UPDATE, empty_snapshot.clone())
                            {
                                eprintln!(
                                    "[Archipelago][Media] Failed to emit empty media update: {}",
                                    error
                                );
                            }

                            last_snapshot = empty_snapshot;
                        }
                    }
                }
            }
        });
    }
}

#[cfg(not(target_os = "windows"))]
mod windows_media {
    use super::*;

    pub fn spawn_media_monitor(_app: AppHandle) {
        println!(
            "[Archipelago][Media] Media integration is only available on Windows"
        );
    }
}

pub fn spawn_media_monitor(app: AppHandle) {
    windows_media::spawn_media_monitor(app);
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn default_media_snapshot_is_empty() {
        let snapshot = MediaSnapshot::default();

        assert!(snapshot.is_empty());
        assert!(snapshot.app_id.is_empty());
        assert!(snapshot.title.is_empty());
        assert!(snapshot.artist.is_empty());
        assert!(!snapshot.is_playing);
        assert_eq!(snapshot.duration, 0.0);
        assert_eq!(snapshot.position, 0.0);
        assert!(snapshot.artwork.is_none());
    }

    #[test]
    fn populated_media_snapshot_is_not_empty() {
        let snapshot = MediaSnapshot {
            app_id: "Spotify".to_string(),
            title: "Example Track".to_string(),
            artist: "Example Artist".to_string(),
            is_playing: true,
            duration: 240.0,
            position: 12.0,
            artwork: None,
        };

        assert!(!snapshot.is_empty());
    }

    #[test]
    fn media_snapshot_preserves_values() {
        let snapshot = MediaSnapshot {
            app_id: "Spotify".to_string(),
            title: "Example Track".to_string(),
            artist: "Example Artist".to_string(),
            is_playing: true,
            duration: 245.5,
            position: 42.25,
            artwork: None,
        };

        assert_eq!(snapshot.app_id, "Spotify");
        assert_eq!(snapshot.title, "Example Track");
        assert_eq!(snapshot.artist, "Example Artist");
        assert!(snapshot.is_playing);
        assert_eq!(snapshot.duration, 245.5);
        assert_eq!(snapshot.position, 42.25);
    }
}