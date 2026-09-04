use serde::{Deserialize, Serialize};

/// Normalized rectangle used by the fullscreen classifier.
///
/// We deliberately keep this independent of Win32's `RECT` so the
/// classification logic can be tested without calling Windows APIs.


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
/// a 1-2 pixel discrepancy caused by borders, DPI handling, or rounding.
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
///
/// We intentionally keep this centralized so it can be tuned later
/// based on real Windows applications.
pub const FULLSCREEN_TOLERANCE: i32 = 2;

/// Convert a Win32 RECT into our platform-independent rectangle.
#[cfg(target_os = "windows")]
fn from_win32_rect(rect: windows::Win32::Foundation::RECT) -> ScreenRect {
    ScreenRect {
        left: rect.left,
        top: rect.top,
        right: rect.right,
        bottom: rect.bottom,
    }
}

/// Checks whether the current foreground window fills the monitor it
/// belongs to.
///
/// This function is the Windows-specific adapter around the pure
/// `is_fullscreen()` classifier.
#[cfg(target_os = "windows")]
pub fn detect_foreground_fullscreen() -> bool {
    use windows::Win32::Graphics::Gdi::{
    GetMonitorInfoW,
    MonitorFromWindow,
    MONITOR_DEFAULTTONEAREST,
    MONITORINFO,
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

        let mut window_rect = windows::Win32::Foundation::RECT::default();

        if GetWindowRect(
            foreground,
            &mut window_rect,
        )
        .is_err()
        {
            return false;
        }

        let monitor =
            MonitorFromWindow(foreground, MONITOR_DEFAULTTONEAREST);

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

        let window_rect = from_win32_rect(window_rect);
        let monitor_rect = from_win32_rect(
            monitor_info.rcMonitor,
        );

        is_fullscreen(
            window_rect,
            monitor_rect,
            FULLSCREEN_TOLERANCE,
        )
    }
}

#[cfg(test)]
mod tests {
    use super::*;

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
}