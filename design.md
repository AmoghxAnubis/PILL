System Design Document (SDD)Project Archipelago: Windows-Centric Dynamic IslandDocument Version: 1.0.0Architecture Style: Event-Driven Micro-Kernel with Shared Memory IPCTarget Environment: Windows 11 ($x86\_64$)1. Architectural OverviewProject Archipelago decouples low-level Windows OS event loop listening from high-refresh-rate UI rendering. The architecture utilizes a Tauri Core (written in Rust) acting as the privileged system supervisor, and a Webview Presentation Layer (React + TypeScript) acting as an isolated canvas for rendering layouts.  +-------------------------------------------------------------------------+
| PRESENTATION LAYER (React + TypeScript)                                 |
| - Framer Motion Layout Engine (Spring Physics Renderer)                 |
| - State Machine Manager (Idle -> Compact -> Expanded -> Split)          |
+-------------------------------------------------------------------------+
                                   ^
                                   | Tauri IPC (Commands & Events)
                                   v
+-------------------------------------------------------------------------+
| TAURI DESKTOP CORE (Rust Engine)                                        |
| - HWND Window Controller (Transparency, Click-through, Z-Order)         |
| - Local Async Thread Pool (Tokio runtime)                               |
+-------------------------------------------------------------------------+
         |                                 |                        |
         v                                 v                        v
+------------------+             +------------------+    +------------------+
| WINAPI HOOKS     |             | SYSINFO CORE     |    | SMTC INTERCEPT   |
| - GetForeground  |             | - CPU Allocation |    | - Track Metadata |
| - Window Evasion |             | - RAM Footprint  |    | - Artwork Buffer |
+------------------+             +------------------+    +------------------+
2. Low-Level Windows OS Integration Blueprint2.1 Native Window Composition & Layering (HWND Management)To make the application overlay perfectly without taking focus or blocking user interactions, the Rust backend directly manipulates the Win32 window properties post-creation:Z-Order Enforcement: The window handle (HWND) is explicitly modified using SetWindowPos with the HWND_TOPMOST flag to permanently position it above standard desktop applications.  Click-Through Capabilities (Hit-Testing): While in the Idle state, the window is injected with the WS_EX_TRANSPARENT and WS_EX_LAYERED extended window styles via SetWindowLongPtrW. This instructs the Windows Desktop Window Manager (DWM) to ignore mouse clicks over the coordinates, passing input directly to whatever application is running underneath.  Taskbar Removal: The window uses the WS_EX_TOOLWINDOW style to prevent an icon from appearing in the Windows Taskbar or when the user enters the Alt+Tab view.2.2 Fullscreen Evasion SystemTo ensure a completely non-intrusive experience during gaming or full-screen video playback, a dedicated low-priority asynchronous background thread runs an evaluation loop:  It periodically queries the foreground window using GetForegroundWindow.  It evaluates the bounding rectangle of that window via GetWindowRect and compares it to the resolution dimensions of the active monitor.It cross-checks the window style via GetWindowLong. If the window lacks WS_OVERLAPPEDWINDOW, it is classified as a full-screen application.Upon confirmation of a full-screen event, the Rust backend emits an asynchronous event to Tauri's window instance, switching visibility to false in less than 16 milliseconds (under 1 frame at 60Hz).  2.3 System Media Transport Controls (SMTC) InterceptionThe media feature binds directly to the modern Windows Runtime (Windows.Media.Control) namespaces using the native Rust windows crate:  Data Scraper: It listens to the GlobalSystemMediaTransportControlsSessionManager to capture the current active media session (e.g., Spotify, Chrome, Edge).  Media Event Pipeline: When the active track changes, an internal asynchronous handler fires, packaging the track title, artist name, and a base64-encoded string of the album art image directly into an IPC payload bound for the React frontend.  3. Frontend Architecture & Animation States3.1 State Machine DesignThe visual interface transitions through a strict, deterministic state machine to ensure layout predictability:    +--------+   Hover   +-----------+   Click / Trigger   +--------------+
    |  IDLE  | --------> |  COMPACT  | ------------------> |   EXPANDED   |
    +--------+           +-----------+                     +--------------+
        ^                      |                                  |
        |                      v                                  |
        |               Concurrent Alert                          |
        +---------------------------------------------------------+
                               |
                               v
                         +-----------+
                         |   SPLIT   |
                         +-----------+
3.2 Animation Engine MechanicsHard linear duration values ($t = 300\text{ms}$) are prohibited. All layout morphing is computed on-the-fly via Hooke's Law spring physics integrated within the layout engine:  $$F = -k \cdot x - c \cdot v$$Stiffness Coefficient ($k$): Set to 400 for crisp, immediate movement initiation.Damping Ratio ($c$): Set to 30 to prevent over-oscillating, absorbing kinetic energy smoothly as the shape snaps into its target dimensions.4. Component Layout Data StructuresTo handle state rendering cleanly, the application architecture parses incoming native hardware events using structured JSON schemas:4.1 Telemetry Update SchemaJSON{
  "type": "SYSTEM_TELEMETRY",
  "timestamp": 1715975412,
  "payload": {
    "cpu_usage": 14.2,
    "ram_allocated_mb": 12450,
    "ram_percentage": 38.5,
    "thermal_status_celsius": 54
  }
}
4.2 Media Update SchemaJSON{
  "type": "MEDIA_SESSION_CHANGE",
  "timestamp": 1715975435,
  "payload": {
    "app_id": "Spotify.exe",
    "title": "White Ferrari",
    "artist": "Frank Ocean",
    "is_playing": true,
    "duration_ms": 248000,
    "current_position_ms": 42000,
    "has_artwork": true,
    "artwork_data_base64": "iVBORw0KGgoAAAANSUhEUgAA..."
  }
}
5. Security & Resource Optimization Matrix5.1 Memory Footprint IsolationZero Caching Engine: The data layer architecture forces volatile memory handling. Any text data swept via the drag-drop workspace or copied through the clip buffer is processed strictly inside an allocated raw pointer buffer inside the Rust application memory workspace. It is systematically overwritten with zero-bytes immediately after execution terminates, ensuring zero persistence to the hard disk drive.  Thread Throttling: When the state machine logs an Idle state, the internal system background telemetry polling frequency scales down from a $500\text{ms}$ active polling speed to a relaxed $5000\text{ms}$ loop, dropping CPU utilization to absolute $0.0\%$.