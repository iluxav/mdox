// Prevents additional console window on Windows in release
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod cli;
mod commands;
mod files;
mod link_discovery;
mod markdown;

use tauri::{Emitter, Manager};

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
            commands::discover_linked_documents,
        ])
        .setup({
            let cli_args = cli_args.clone();
            move |app| {
                if let Some(file_path) = &cli_args.file {
                    if let Some(window) = app.get_webview_window("main") {
                        if let Err(e) = window.emit("file-to-open", file_path) {
                            eprintln!("Failed to emit 'file-to-open': {}", e);
                        }
                    } else {
                        eprintln!("Failed to get 'main' webview window");
                    }
                }
                Ok(())
            }
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
