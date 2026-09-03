use serde::{Deserialize, Serialize};

/// Emitted when the foreground application enters or leaves fullscreen mode.
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct FullscreenStateChanged {
    pub active: bool,
}

/// Hardware telemetry emitted by the backend.
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct TelemetryUpdate {
    pub cpu_usage: f32,
    pub ram_allocated_mb: u64,
    pub ram_percentage: f32,
}

/// Currently active media session information.
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct MediaUpdate {
    pub app_id: String,
    pub title: String,
    pub artist: String,
    pub is_playing: bool,
    pub duration: f64,
    pub position: f64,
    pub artwork: Option<String>,
}

/// Timer state emitted by the backend.
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct TimerTick {
    pub seconds_remaining: u64,
    pub is_running: bool,
}

pub const FULLSCREEN_STATE_CHANGED: &str = "fullscreen_state_changed";
pub const TELEMETRY_UPDATE: &str = "telemetry_update";
pub const MEDIA_UPDATE: &str = "media_update";
pub const TIMER_TICK: &str = "timer_tick";

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn fullscreen_event_serializes_correctly() {
        let payload = FullscreenStateChanged {
            active: true,
        };

        let json = serde_json::to_string(&payload)
            .expect("fullscreen payload should serialize");

        assert_eq!(json, r#"{"active":true}"#);
    }

    #[test]
    fn telemetry_event_serializes_correctly() {
        let payload = TelemetryUpdate {
            cpu_usage: 92.5,
            ram_allocated_mb: 8192,
            ram_percentage: 87.3,
        };

        let json = serde_json::to_string(&payload)
            .expect("telemetry payload should serialize");

        assert!(json.contains(r#""cpu_usage":92.5"#));
        assert!(json.contains(r#""ram_allocated_mb":8192"#));
        assert!(json.contains(r#""ram_percentage":87.3"#));
    }

    #[test]
    fn media_event_serializes_correctly() {
        let payload = MediaUpdate {
            app_id: "spotify".to_string(),
            title: "Test Track".to_string(),
            artist: "Test Artist".to_string(),
            is_playing: true,
            duration: 240.0,
            position: 42.0,
            artwork: Some("base64-art".to_string()),
        };

        let json = serde_json::to_string(&payload)
            .expect("media payload should serialize");

        assert!(json.contains(r#""app_id":"spotify""#));
        assert!(json.contains(r#""title":"Test Track""#));
        assert!(json.contains(r#""artist":"Test Artist""#));
        assert!(json.contains(r#""is_playing":true"#));
    }

    #[test]
    fn timer_event_serializes_correctly() {
        let payload = TimerTick {
            seconds_remaining: 1500,
            is_running: true,
        };

        let json = serde_json::to_string(&payload)
            .expect("timer payload should serialize");

        assert_eq!(
            json,
            r#"{"seconds_remaining":1500,"is_running":true}"#
        );
    }

    #[test]
    fn event_names_are_stable() {
        assert_eq!(
            FULLSCREEN_STATE_CHANGED,
            "fullscreen_state_changed"
        );

        assert_eq!(
            TELEMETRY_UPDATE,
            "telemetry_update"
        );

        assert_eq!(
            MEDIA_UPDATE,
            "media_update"
        );

        assert_eq!(
            TIMER_TICK,
            "timer_tick"
        );
    }
}