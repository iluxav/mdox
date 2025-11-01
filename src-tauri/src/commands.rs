use crate::files;
use crate::markdown;
use crate::link_discovery;
use crate::remote;

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
pub fn file_exists(path: String) -> bool {
    files::file_exists(&path)
}

#[tauri::command]
pub fn read_directory(path: String) -> Result<Vec<files::FileEntry>, String> {
    files::read_directory(&path)
}

#[tauri::command]
pub fn create_directory(path: String) -> Result<(), String> {
    files::create_directory(&path)
}

#[tauri::command]
pub fn delete_file_or_directory(path: String) -> Result<(), String> {
    files::delete_file_or_directory(&path)
}

#[tauri::command]
pub fn rename_file_or_directory(old_path: String, new_path: String) -> Result<(), String> {
    files::rename_file_or_directory(&old_path, &new_path)
}

#[tauri::command]
pub fn discover_linked_documents(root_path: String, max_depth: usize) -> Result<Vec<link_discovery::LinkedDocument>, String> {
    link_discovery::discover_linked_documents(&root_path, max_depth)
}

#[tauri::command]
pub fn fetch_remote_file(url: String) -> Result<serde_json::Value, String> {
    // Check if it's a GitHub repository URL
    if let Some(readme_url) = remote::detect_and_convert_github_url(&url) {
        // Extract username and repo from the converted URL
        let parts: Vec<&str> = readme_url.split('/').collect();
        if parts.len() >= 5 {
            let username = parts[3];
            let repo = parts[4];

            match remote::fetch_github_readme(username, repo) {
                Ok((content, actual_url)) => {
                    return Ok(serde_json::json!({
                        "content": content,
                        "url": actual_url
                    }));
                }
                Err(e) => return Err(e),
            }
        }
    }

    // Otherwise, fetch directly
    match remote::fetch_remote_content(&url) {
        Ok(content) => Ok(serde_json::json!({
            "content": content,
            "url": url
        })),
        Err(e) => Err(e),
    }
}

#[tauri::command]
pub async fn discover_remote_linked_documents(
    root_url: String,
    max_depth: usize,
) -> Result<Vec<remote::RemoteLinkedDocument>, String> {
    // Run the blocking I/O operation in a background thread
    tokio::task::spawn_blocking(move || {
        remote::discover_remote_linked_documents(root_url, max_depth)
    })
    .await
    .map_err(|e| format!("Task failed: {}", e))?
}
