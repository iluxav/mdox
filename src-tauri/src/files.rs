use std::fs;
use std::path::Path;
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FileEntry {
    pub name: String,
    pub path: String,
    pub is_directory: bool,
}

pub fn read_file_contents(path: &str) -> Result<String, String> {
    let file_path = Path::new(path);

    if !file_path.exists() {
        return Err(format!("File not found: {}", path));
    }

    if !file_path.is_file() {
        return Err(format!("Path is not a file: {}", path));
    }

    fs::read_to_string(file_path).map_err(|e| format!("Failed to read file: {}", e))
}

pub fn write_file_contents(path: &str, content: &str) -> Result<(), String> {
    let file_path = Path::new(path);

    fs::write(file_path, content).map_err(|e| format!("Failed to write file: {}", e))
}

pub fn file_exists(path: &str) -> bool {
    Path::new(path).exists()
}

pub fn resolve_relative_path(base_path: &str, relative_path: &str) -> Result<String, String> {
    let base = Path::new(base_path);
    let base_dir = base.parent().ok_or("Failed to get base directory")?;

    let resolved = base_dir.join(relative_path);
    let canonical = resolved
        .canonicalize()
        .map_err(|e| format!("Failed to resolve path: {}", e))?;

    canonical
        .to_str()
        .map(|s| s.to_string())
        .ok_or_else(|| "Failed to convert path to string".to_string())
}

pub fn read_directory(path: &str) -> Result<Vec<FileEntry>, String> {
    let dir_path = Path::new(path);

    if !dir_path.exists() {
        return Err(format!("Directory not found: {}", path));
    }

    if !dir_path.is_dir() {
        return Err(format!("Path is not a directory: {}", path));
    }

    let mut entries = Vec::new();

    let read_dir = fs::read_dir(dir_path)
        .map_err(|e| format!("Failed to read directory: {}", e))?;

    for entry_result in read_dir {
        let entry = entry_result.map_err(|e| format!("Failed to read entry: {}", e))?;
        let entry_path = entry.path();

        // Skip hidden files (starting with .)
        if let Some(name) = entry_path.file_name() {
            if name.to_string_lossy().starts_with('.') {
                continue;
            }
        }

        let name = entry_path
            .file_name()
            .and_then(|n| n.to_str())
            .unwrap_or("")
            .to_string();

        let path_str = entry_path
            .to_str()
            .ok_or("Failed to convert path to string")?
            .to_string();

        let is_directory = entry_path.is_dir();

        entries.push(FileEntry {
            name,
            path: path_str,
            is_directory,
        });
    }

    // Sort: directories first, then files, both alphabetically
    entries.sort_by(|a, b| {
        match (a.is_directory, b.is_directory) {
            (true, false) => std::cmp::Ordering::Less,
            (false, true) => std::cmp::Ordering::Greater,
            _ => a.name.to_lowercase().cmp(&b.name.to_lowercase()),
        }
    });

    Ok(entries)
}

pub fn create_directory(path: &str) -> Result<(), String> {
    fs::create_dir_all(path).map_err(|e| format!("Failed to create directory: {}", e))
}

pub fn delete_file_or_directory(path: &str) -> Result<(), String> {
    let file_path = Path::new(path);

    if !file_path.exists() {
        return Err(format!("Path not found: {}", path));
    }

    if file_path.is_dir() {
        fs::remove_dir_all(path).map_err(|e| format!("Failed to delete directory: {}", e))
    } else {
        fs::remove_file(path).map_err(|e| format!("Failed to delete file: {}", e))
    }
}

pub fn rename_file_or_directory(old_path: &str, new_path: &str) -> Result<(), String> {
    fs::rename(old_path, new_path).map_err(|e| format!("Failed to rename: {}", e))
}
