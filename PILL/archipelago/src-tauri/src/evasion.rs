use serde::{Deserialize, Serialize};
use tauri::{AppHandle, Emitter};

use crate::events::{
    FullscreenStateChanged,
    FULLSCREEN_STATE_CHANGED,
};

/// Normalized rectangle used by the fullscreen classifier.
///
/// This is intentionally independent of Win32's `RECT` so the
/// fullscreen classification logic can be tested without calling
/// Windows APIs.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub struct ScreenRect {
    pub left: i32,
    pub top: i32,
    pub right: i32,
    pub bottom: i32,
}

/// Determines whether a window occupies essentially the entire monitor.
///
/// A small tolerance is allowed because some applications can have
/// a small discrepancy caused by borders, DPI handling, or rounding.
pub fn is_fullscreen(
    window: ScreenRect,
    monitor: ScreenRect,
    tolerance: i32,
) -> bool {
    if tolerance < 0 {
        return false;
    }

    let left_matches =
        (window.left - monitor.left).abs() <= tolerance;

    let top_matches =
        (window.top - monitor.top).abs() <= tolerance;

    let right_matches =
        (window.right - monitor.right).abs() <= tolerance;

    let bottom_matches =
        (window.bottom - monitor.bottom).abs() <= tolerance;

    left_matches
        && top_matches
        && right_matches
        && bottom_matches
}

/// Default tolerance used by fullscreen detection.
pub const FULLSCREEN_TOLERANCE: i32 = 2;

/// Tracks the last known fullscreen state so the native monitor
/// only reacts when the state actually changes.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct EvasionState {
    pub is_fullscreen: bool,
}

impl EvasionState {
    /// Creates a new evasion state with fullscreen inactive.
    pub fn new() -> Self {
        Self {
            is_fullscreen: false,
        }
    }

    /// Updates the fullscreen state.
    ///
    /// Returns `true` when the state actually changed.
    /// Returns `false` when the state is unchanged.
    pub fn update(&mut self, fullscreen: bool) -> bool {
        if self.is_fullscreen == fullscreen {
            return false;
        }

        self.is_fullscreen = fullscreen;
        true
    }
}

impl Default for EvasionState {
    fn default() -> Self {
        Self::new()
    }
}

/// Converts a state transition into the payload expected by
/// the frontend event bridge.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct FullscreenTransition {
    pub active: bool,
}

impl From<FullscreenTransition> for FullscreenStateChanged {
    fn from(transition: FullscreenTransition) -> Self {
        Self {
            active: transition.active,
        }
    }
}

/// Stateful fullscreen monitor.
///
/// This layer is deliberately independent of Windows APIs and Tauri.
/// That allows us to test the transition logic deterministically.
#[derive(Debug, Default)]
pub struct FullscreenMonitor {
    state: EvasionState,
}

impl FullscreenMonitor {
    pub fn new() -> Self {
        Self::default()
    }

    /// Processes one fullscreen observation.
    ///
    /// Returns an event payload only when the fullscreen state changes.
    pub fn poll(
        &mut self,
        fullscreen: bool,
    ) -> Option<FullscreenStateChanged> {
        if !self.state.update(fullscreen) {
            return None;
        }

        Some(
            FullscreenTransition {
                active: fullscreen,
            }
            .into(),
        )
    }

    /// Returns the current fullscreen state.
    pub fn is_fullscreen(&self) -> bool {
        self.state.is_fullscreen
    }
}

/// Convert a Win32 `RECT` into our platform-independent rectangle.
#[cfg(target_os = "windows")]
fn from_win32_rect(
    rect: windows::Win32::Foundation::RECT,
) -> ScreenRect {
    ScreenRect {
        left: rect.left,
        top: rect.top,
        right: rect.right,
        bottom: rect.bottom,
    }
}

/// Checks whether the current foreground window fills the monitor
/// it belongs to.
///
/// This is the Windows-specific adapter around the pure
/// `is_fullscreen()` classifier.
#[cfg(target_os = "windows")]
pub fn detect_foreground_fullscreen() -> bool {
    use windows::Win32::Foundation::RECT;

    use windows::Win32::Graphics::Gdi::{
        GetMonitorInfoW,
        MonitorFromWindow,
        MONITORINFO,
        MONITOR_DEFAULTTONEAREST,
    };

    use windows::Win32::UI::WindowsAndMessaging::{
        GetForegroundWindow,
        GetWindowRect,
    };

    unsafe {
        let foreground = GetForegroundWindow();

        if foreground.0.is_null() {
            return false;
        }

        let mut window_rect = RECT::default();

        if GetWindowRect(
            foreground,
            &mut window_rect,
        )
        .is_err()
        {
            return false;
        }

        let monitor = MonitorFromWindow(
            foreground,
            MONITOR_DEFAULTTONEAREST,
        );

        if monitor.0.is_null() {
            return false;
        }

        let mut monitor_info = MONITORINFO {
            cbSize: std::mem::size_of::<MONITORINFO>() as u32,
            ..Default::default()
        };

        if !GetMonitorInfoW(
            monitor,
            &mut monitor_info,
        )
        .as_bool()
        {
            return false;
        }

        let window_rect =
            from_win32_rect(window_rect);

        let monitor_rect =
            from_win32_rect(monitor_info.rcMonitor);

        is_fullscreen(
            window_rect,
            monitor_rect,
            FULLSCREEN_TOLERANCE,
        )
    }
}

/// Non-Windows fallback.
///
/// The application is currently Windows-focused, but keeping a stub
/// allows the Rust crate to remain compilable on other platforms.
#[cfg(not(target_os = "windows"))]
pub fn detect_foreground_fullscreen() -> bool {
    false
}

/// Starts the background fullscreen monitor.
///
/// The monitor polls Windows at a lightweight interval and emits
/// `fullscreen_state_changed` only when the observed state changes.
pub fn spawn_fullscreen_monitor(app: AppHandle) {
    tauri::async_runtime::spawn(async move {
        let mut monitor = FullscreenMonitor::new();

        let mut interval =
            tokio::time::interval(
                std::time::Duration::from_millis(300),
            );

        loop {
            interval.tick().await;

            let fullscreen =
                detect_foreground_fullscreen();

            if let Some(payload) =
                monitor.poll(fullscreen)
            {
                if let Err(error) =
                    app.emit(FULLSCREEN_STATE_CHANGED, payload)
                {
                    eprintln!(
                        "[Archipelago] Failed to emit fullscreen state: {}",
                        error
                    );
                }
            }
        }
    });
}

#[cfg(test)]
mod tests {
    use super::*;

    // ------------------------------------------------------------------------
    // Fullscreen geometry tests
    // ------------------------------------------------------------------------

    #[test]
    fn detects_exact_fullscreen_rect() {
        let monitor = ScreenRect {
            left: 0,
            top: 0,
            right: 1920,
            bottom: 1080,
        };

        let window = monitor;

        assert!(is_fullscreen(
            window,
            monitor,
            FULLSCREEN_TOLERANCE,
        ));
    }

    #[test]
    fn detects_fullscreen_with_small_border_difference() {
        let monitor = ScreenRect {
            left: 0,
            top: 0,
            right: 1920,
            bottom: 1080,
        };

        let window = ScreenRect {
            left: 1,
            top: 1,
            right: 1919,
            bottom: 1079,
        };

        assert!(is_fullscreen(
            window,
            monitor,
            FULLSCREEN_TOLERANCE,
        ));
    }

    #[test]
    fn rejects_normal_window() {
        let monitor = ScreenRect {
            left: 0,
            top: 0,
            right: 1920,
            bottom: 1080,
        };

        let window = ScreenRect {
            left: 400,
            top: 200,
            right: 1500,
            bottom: 900,
        };

        assert!(!is_fullscreen(
            window,
            monitor,
            FULLSCREEN_TOLERANCE,
        ));
    }

    #[test]
    fn supports_negative_monitor_coordinates() {
        let monitor = ScreenRect {
            left: -1920,
            top: 0,
            right: 0,
            bottom: 1080,
        };

        let window = ScreenRect {
            left: -1920,
            top: 0,
            right: 0,
            bottom: 1080,
        };

        assert!(is_fullscreen(
            window,
            monitor,
            FULLSCREEN_TOLERANCE,
        ));
    }

    #[test]
    fn rejects_window_that_exceeds_tolerance() {
        let monitor = ScreenRect {
            left: 0,
            top: 0,
            right: 1920,
            bottom: 1080,
        };

        let window = ScreenRect {
            left: 4,
            top: 0,
            right: 1920,
            bottom: 1080,
        };

        assert!(!is_fullscreen(
            window,
            monitor,
            FULLSCREEN_TOLERANCE,
        ));
    }

    #[test]
    fn negative_tolerance_is_never_fullscreen() {
        let monitor = ScreenRect {
            left: 0,
            top: 0,
            right: 1920,
            bottom: 1080,
        };

        assert!(!is_fullscreen(
            monitor,
            monitor,
            -1,
        ));
    }

    // ------------------------------------------------------------------------
    // Evasion state tests
    // ------------------------------------------------------------------------

    #[test]
    fn evasion_state_starts_inactive() {
        let state = EvasionState::new();

        assert!(!state.is_fullscreen);
    }

    #[test]
    fn evasion_state_reports_activation() {
        let mut state = EvasionState::new();

        assert!(state.update(true));
        assert!(state.is_fullscreen);
    }

    #[test]
    fn evasion_state_does_not_report_duplicate_activation() {
        let mut state = EvasionState::new();

        assert!(state.update(true));
        assert!(!state.update(true));

        assert!(state.is_fullscreen);
    }

    #[test]
    fn evasion_state_reports_deactivation() {
        let mut state = EvasionState::new();

        assert!(state.update(true));
        assert!(state.update(false));

        assert!(!state.is_fullscreen);
    }

    #[test]
    fn evasion_state_does_not_report_duplicate_deactivation() {
        let mut state = EvasionState::new();

        assert!(!state.update(false));
        assert!(!state.update(false));

        assert!(!state.is_fullscreen);
    }

    // ------------------------------------------------------------------------
    // Fullscreen monitor tests
    // ------------------------------------------------------------------------

    #[test]
    fn monitor_starts_with_no_transition() {
        let mut monitor = FullscreenMonitor::new();

        assert!(monitor.poll(false).is_none());
        assert!(!monitor.is_fullscreen());
    }

    #[test]
    fn monitor_emits_activation_once() {
        let mut monitor = FullscreenMonitor::new();

        let first = monitor
            .poll(true)
            .expect("activation should produce an event");

        assert!(first.active);
        assert!(monitor.is_fullscreen());

        assert!(
            monitor.poll(true).is_none(),
            "duplicate activation should not emit"
        );
    }

    #[test]
    fn monitor_emits_deactivation_once() {
        let mut monitor = FullscreenMonitor::new();

        assert!(monitor.poll(true).is_some());

        let transition = monitor
            .poll(false)
            .expect("deactivation should produce an event");

        assert!(!transition.active);
        assert!(!monitor.is_fullscreen());

        assert!(
            monitor.poll(false).is_none(),
            "duplicate deactivation should not emit"
        );
    }

    #[test]
    fn monitor_handles_multiple_fullscreen_transitions() {
        let mut monitor = FullscreenMonitor::new();

        assert!(monitor.poll(false).is_none());

        assert_eq!(
            monitor.poll(true),
            Some(FullscreenStateChanged { active: true })
        );

        assert!(monitor.poll(true).is_none());

        assert_eq!(
            monitor.poll(false),
            Some(FullscreenStateChanged { active: false })
        );

        assert!(monitor.poll(false).is_none());

        assert_eq!(
            monitor.poll(true),
            Some(FullscreenStateChanged { active: true })
        );
    }

    #[test]
    fn fullscreen_transition_maps_to_event_payload() {
        let transition = FullscreenTransition {
            active: true,
        };

        let payload: FullscreenStateChanged =
            transition.into();

        assert_eq!(
            payload,
            FullscreenStateChanged {
                active: true,
            }
        );
    }
}