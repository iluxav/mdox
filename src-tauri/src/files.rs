use std::fs;
use std::path::Path;

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
