use crate::files;
use crate::markdown;
use crate::link_discovery;

#[tauri::command]
pub fn read_file(path: String) -> Result<String, String> {
    files::read_file_contents(&path)
}

#[tauri::command]
pub fn parse_markdown(content: String, base_path: Option<String>) -> Result<String, String> {
    match base_path {
        Some(path) => Ok(markdown::parse_to_html_with_base_path(&content, &path)),
        None => Ok(markdown::parse_to_html(&content)),
    }
}

#[tauri::command]
pub fn resolve_file_path(base_path: String, relative_path: String) -> Result<String, String> {
    files::resolve_relative_path(&base_path, &relative_path)
}

#[tauri::command]
pub fn save_file(path: String, content: String) -> Result<(), String> {
    files::write_file_contents(&path, &content)
}

#[tauri::command]
pub fn discover_linked_documents(root_path: String, max_depth: usize) -> Result<Vec<link_discovery::LinkedDocument>, String> {
    link_discovery::discover_linked_documents(&root_path, max_depth)
}
