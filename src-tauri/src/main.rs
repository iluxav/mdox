// Prevents additional console window on Windows in release
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod commands;
mod markdown;
mod files;
mod cli;

use tauri::{Manager, Emitter};

fn main() {
    let cli_args = cli::parse_args();

    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![
            commands::read_file,
            commands::parse_markdown,
            commands::resolve_file_path,
            commands::save_file,
        ])
        .setup(move |app| {
            if let Some(file_path) = cli_args.file {
                let window = app.get_webview_window("main").unwrap();
                window.emit("file-to-open", file_path).unwrap();
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

