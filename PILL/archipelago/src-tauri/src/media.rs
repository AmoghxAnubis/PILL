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

    /// Returns true when the media session's actual content/state changed.
    ///
    /// Position is intentionally excluded because it changes continuously
    /// during playback. We still emit position updates for the progress bar,
    /// but we do not treat them as a new media session for logging purposes.
    pub fn has_content_changed(&self, other: &Self) -> bool {
        self.app_id != other.app_id
            || self.title != other.title
            || self.artist != other.artist
            || self.is_playing != other.is_playing
            || self.duration != other.duration
            || self.artwork != other.artwork
    }
}

#[cfg(target_os = "windows")]
mod windows_media {
    use super::*;
    use base64::Engine;
    use windows::Media::Control::{
        GlobalSystemMediaTransportControlsSessionManager,
        GlobalSystemMediaTransportControlsSessionPlaybackStatus,
    };
    use windows::Storage::Streams::{
        DataReader,
        IRandomAccessStreamReference,
    };

    /// Reads album artwork from the Windows media session and returns it
    /// as a base64 data URL that can be consumed directly by the frontend.
    async fn read_thumbnail(
        thumbnail: Option<IRandomAccessStreamReference>,
    ) -> Option<String> {
        let thumbnail = thumbnail?;

        let stream = match thumbnail.OpenReadAsync() {
            Ok(operation) => match operation.await {
                Ok(stream) => stream,
                Err(error) => {
                    eprintln!(
                        "[Archipelago][Media] Thumbnail OpenReadAsync failed: {}",
                        error
                    );
                    return None;
                }
            },
            Err(error) => {
                eprintln!(
                    "[Archipelago][Media] Failed to start thumbnail read: {}",
                    error
                );
                return None;
            }
        };

        let size = match stream.Size() {
            Ok(size) => size,
            Err(error) => {
                eprintln!(
                    "[Archipelago][Media] Failed to get thumbnail size: {}",
                    error
                );
                return None;
            }
        };

        // Prevent unexpectedly large artwork from consuming excessive memory.
        const MAX_ARTWORK_SIZE: u64 = 10 * 1024 * 1024;

        if size == 0 || size > MAX_ARTWORK_SIZE {
            eprintln!(
                "[Archipelago][Media] Ignoring thumbnail with size: {} bytes",
                size
            );
            return None;
        }

        let input_stream = match stream.GetInputStreamAt(0) {
            Ok(input_stream) => input_stream,
            Err(error) => {
                eprintln!(
                    "[Archipelago][Media] Failed to open thumbnail input stream: {}",
                    error
                );
                return None;
            }
        };

        let reader = match DataReader::CreateDataReader(&input_stream) {
            Ok(reader) => reader,
            Err(error) => {
                eprintln!(
                    "[Archipelago][Media] Failed to create thumbnail reader: {}",
                    error
                );
                return None;
            }
        };

        let bytes_to_load = size as u32;

        match reader.LoadAsync(bytes_to_load) {
            Ok(operation) => {
                if let Err(error) = operation.await {
                    eprintln!(
                        "[Archipelago][Media] Failed to load thumbnail bytes: {}",
                        error
                    );
                    return None;
                }
            }
            Err(error) => {
                eprintln!(
                    "[Archipelago][Media] Failed to start thumbnail byte load: {}",
                    error
                );
                return None;
            }
        }

        let mut bytes = vec![0u8; size as usize];

        if let Err(error) = reader.ReadBytes(&mut bytes) {
            eprintln!(
                "[Archipelago][Media] Failed to read thumbnail bytes: {}",
                error
            );
            return None;
        }

        let encoded = base64::engine::general_purpose::STANDARD.encode(bytes);

        Some(format!("data:image/jpeg;base64,{encoded}"))
    }

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
                status
                    == GlobalSystemMediaTransportControlsSessionPlaybackStatus::Playing
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

        let thumbnail = properties.Thumbnail().ok();

        let artwork = read_thumbnail(thumbnail).await;

        Some(MediaSnapshot {
            app_id,
            title,
            artist,
            is_playing,
            duration: duration.max(0.0),
            position: position.max(0.0),
            artwork,
        })
    }

    pub async fn skip_previous() -> Result<bool, String> {
        let manager =
            GlobalSystemMediaTransportControlsSessionManager::RequestAsync()
                .map_err(|error| format!("RequestAsync failed: {error}"))?
                .await
                .map_err(|error| format!("RequestAsync await failed: {error}"))?;

        let session = manager
            .GetCurrentSession()
            .map_err(|error| format!("GetCurrentSession failed: {error}"))?;

        session
            .TrySkipPreviousAsync()
            .map_err(|error| format!("TrySkipPreviousAsync failed: {error}"))?
            .await
            .map_err(|error| {
                format!("TrySkipPreviousAsync await failed: {error}")
            })
    }

    pub async fn toggle_play_pause() -> Result<bool, String> {
        let manager =
            GlobalSystemMediaTransportControlsSessionManager::RequestAsync()
                .map_err(|error| format!("RequestAsync failed: {error}"))?
                .await
                .map_err(|error| format!("RequestAsync await failed: {error}"))?;

        let session = manager
            .GetCurrentSession()
            .map_err(|error| format!("GetCurrentSession failed: {error}"))?;

        session
            .TryTogglePlayPauseAsync()
            .map_err(|error| {
                format!("TryTogglePlayPauseAsync failed: {error}")
            })?
            .await
            .map_err(|error| {
                format!("TryTogglePlayPauseAsync await failed: {error}")
            })
    }

    pub async fn skip_next() -> Result<bool, String> {
        let manager =
            GlobalSystemMediaTransportControlsSessionManager::RequestAsync()
                .map_err(|error| format!("RequestAsync failed: {error}"))?
                .await
                .map_err(|error| format!("RequestAsync await failed: {error}"))?;

        let session = manager
            .GetCurrentSession()
            .map_err(|error| format!("GetCurrentSession failed: {error}"))?;

        session
            .TrySkipNextAsync()
            .map_err(|error| format!("TrySkipNextAsync failed: {error}"))?
            .await
            .map_err(|error| format!("TrySkipNextAsync await failed: {error}"))
    }

    pub fn spawn_media_monitor(app: AppHandle) {
        tauri::async_runtime::spawn(async move {
            println!("[Archipelago][Media] Media monitor started");

            let mut last_snapshot = MediaSnapshot::default();

            let mut interval =
                tokio::time::interval(Duration::from_millis(500));

            interval.tick().await;

            loop {
                interval.tick().await;

                let snapshot = read_current_session().await;

                match snapshot {
                    Some(snapshot) => {
                        if snapshot != last_snapshot {
                            if snapshot.has_content_changed(&last_snapshot) {
                                println!(
                                    "[Archipelago][Media] Session: app_id='{}', title='{}', artist='{}', playing={}",
                                    snapshot.app_id,
                                    snapshot.title,
                                    snapshot.artist,
                                    snapshot.is_playing
                                );
                            }

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

    pub async fn skip_previous() -> Result<bool, String> {
        Err("Media controls are only available on Windows".to_string())
    }

    pub async fn toggle_play_pause() -> Result<bool, String> {
        Err("Media controls are only available on Windows".to_string())
    }

    pub async fn skip_next() -> Result<bool, String> {
        Err("Media controls are only available on Windows".to_string())
    }
}

pub fn spawn_media_monitor(app: AppHandle) {
    windows_media::spawn_media_monitor(app);
}

pub async fn skip_previous() -> Result<bool, String> {
    windows_media::skip_previous().await
}

pub async fn toggle_play_pause() -> Result<bool, String> {
    windows_media::toggle_play_pause().await
}

pub async fn skip_next() -> Result<bool, String> {
    windows_media::skip_next().await
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

    #[test]
    fn position_only_change_is_not_content_change() {
        let original = MediaSnapshot {
            app_id: "Spotify.exe".to_string(),
            title: "Test Song".to_string(),
            artist: "Test Artist".to_string(),
            is_playing: true,
            duration: 240.0,
            position: 30.0,
            artwork: None,
        };

        let updated = MediaSnapshot {
            position: 31.0,
            ..original.clone()
        };

        assert!(!updated.has_content_changed(&original));
    }

    #[test]
    fn track_change_is_content_change() {
        let original = MediaSnapshot {
            app_id: "Spotify.exe".to_string(),
            title: "Song One".to_string(),
            artist: "Artist".to_string(),
            is_playing: true,
            duration: 240.0,
            position: 30.0,
            artwork: None,
        };

        let updated = MediaSnapshot {
            title: "Song Two".to_string(),
            ..original.clone()
        };

        assert!(updated.has_content_changed(&original));
    }

    #[test]
    fn playback_state_change_is_content_change() {
        let original = MediaSnapshot {
            app_id: "Spotify.exe".to_string(),
            title: "Test Song".to_string(),
            artist: "Test Artist".to_string(),
            is_playing: true,
            duration: 240.0,
            position: 30.0,
            artwork: None,
        };

        let updated = MediaSnapshot {
            is_playing: false,
            ..original.clone()
        };

        assert!(updated.has_content_changed(&original));
    }
}