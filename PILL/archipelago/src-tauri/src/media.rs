use serde::{Deserialize, Serialize};

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

pub fn empty_media_snapshot() -> MediaSnapshot {
    MediaSnapshot::default()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn default_media_snapshot_is_empty() {
        let snapshot = MediaSnapshot::default();

        assert!(snapshot.app_id.is_empty());
        assert!(snapshot.title.is_empty());
        assert!(snapshot.artist.is_empty());
        assert!(!snapshot.is_playing);
        assert_eq!(snapshot.duration, 0.0);
        assert_eq!(snapshot.position, 0.0);
        assert!(snapshot.artwork.is_none());
    }

    #[test]
    fn empty_media_snapshot_matches_default() {
        assert_eq!(
            empty_media_snapshot(),
            MediaSnapshot::default()
        );
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