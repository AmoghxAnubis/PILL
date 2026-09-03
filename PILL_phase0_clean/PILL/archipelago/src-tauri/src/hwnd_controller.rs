use tauri::WebviewWindow;

#[cfg(target_os = "windows")]
use windows::Win32::Foundation::HWND;
#[cfg(target_os = "windows")]
use windows::Win32::UI::WindowsAndMessaging::{
    GetWindowLongPtrW, SetWindowLongPtrW, GWL_EXSTYLE,
    WS_EX_LAYERED, WS_EX_TRANSPARENT,
};

/// Set or remove click-through (WS_EX_TRANSPARENT) on the island window.
/// When enabled, all mouse events pass through to windows beneath.
pub fn set_click_through(window: &WebviewWindow, enabled: bool) -> Result<(), String> {
    #[cfg(target_os = "windows")]
    {
        use raw_window_handle::HasWindowHandle;
        
        let raw = window.window_handle()
            .map_err(|e| format!("Failed to get window handle: {}", e))?;
        
        let raw_handle = raw.as_raw();
        
        if let raw_window_handle::RawWindowHandle::Win32(handle) = raw_handle {
            let hwnd = HWND(handle.hwnd.get() as *mut _);
            
            unsafe {
                let current_style = GetWindowLongPtrW(hwnd, GWL_EXSTYLE);
                
                let new_style = if enabled {
                    current_style | WS_EX_TRANSPARENT.0 as isize | WS_EX_LAYERED.0 as isize
                } else {
                    current_style & !(WS_EX_TRANSPARENT.0 as isize)
                };
                
                SetWindowLongPtrW(hwnd, GWL_EXSTYLE, new_style);
            }
            
            Ok(())
        } else {
            Err("Not a Win32 window handle".to_string())
        }
    }
    
    #[cfg(not(target_os = "windows"))]
    {
        let _ = (window, enabled);
        Err("Click-through is only supported on Windows".to_string())
    }
}
