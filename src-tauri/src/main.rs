// Prevents additional console window on Windows in release
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod cli;
mod commands;
mod files;
mod link_discovery;
mod markdown;
mod remote;

use tauri::{
    menu::{MenuBuilder, MenuItemBuilder, SubmenuBuilder},
    Emitter, Manager,
};

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
            commands::file_exists,
            commands::read_directory,
            commands::create_directory,
            commands::delete_file_or_directory,
            commands::rename_file_or_directory,
            commands::discover_linked_documents,
            commands::fetch_remote_file,
            commands::discover_remote_linked_documents,
        ])
        .setup({
            let cli_args = cli_args.clone();
            move |app| {
                // Build native menu
                let new_file_item = MenuItemBuilder::new("New File")
                    .id("new_file")
                    .accelerator("CmdOrCtrl+N")
                    .build(app)?;

                let open_item = MenuItemBuilder::new("Open...")
                    .id("open_file")
                    .accelerator("CmdOrCtrl+O")
                    .build(app)?;

                let open_url_item = MenuItemBuilder::new("Open from URL...")
                    .id("open_url")
                    .accelerator("CmdOrCtrl+Shift+O")
                    .build(app)?;

                let save_as_item = MenuItemBuilder::new("Save As...")
                    .id("save_as")
                    .accelerator("CmdOrCtrl+Shift+S")
                    .build(app)?;

                let file_submenu = SubmenuBuilder::new(app, "File")
                    .item(&new_file_item)
                    .separator()
                    .item(&open_item)
                    .item(&open_url_item)
                    .separator()
                    .item(&save_as_item)
                    .separator()
                    .close_window()
                    .build()?;

                let menu = MenuBuilder::new(app).item(&file_submenu).build()?;

                app.set_menu(menu)?;

                // Handle menu events
                app.on_menu_event(move |app, event| {
                    if event.id() == "new_file" {
                        if let Some(window) = app.get_webview_window("main") {
                            if let Err(e) = window.emit("menu-new-file", ()) {
                                eprintln!("Failed to emit 'menu-new-file': {}", e);
                            }
                        }
                    } else if event.id() == "open_file" {
                        if let Some(window) = app.get_webview_window("main") {
                            if let Err(e) = window.emit("menu-open-file", ()) {
                                eprintln!("Failed to emit 'menu-open-file': {}", e);
                            }
                        }
                    } else if event.id() == "open_url" {
                        if let Some(window) = app.get_webview_window("main") {
                            if let Err(e) = window.emit("menu-open-url", ()) {
                                eprintln!("Failed to emit 'menu-open-url': {}", e);
                            }
                        }
                    } else if event.id() == "save_as" {
                        if let Some(window) = app.get_webview_window("main") {
                            if let Err(e) = window.emit("menu-save-as", ()) {
                                eprintln!("Failed to emit 'menu-save-as': {}", e);
                            }
                        }
                    }
                });

                // Handle CLI file argument
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
