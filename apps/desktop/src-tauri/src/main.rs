// Ground-Up Learning desktop shell (DEC-016).
//
// The application itself is the unchanged static local-first SPA from
// apps/client; this binary only provides the native window that hosts it.
// The webview loads the bundled assets over Tauri's internal protocol, so the
// app runs with no server and no network access except the optional BYOK
// tutor calls allowed by the CSP in tauri.conf.json.
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    tauri::Builder::default()
        .run(tauri::generate_context!())
        .expect("failed to start the Ground-Up Learning window");
}
