use serde::{Deserialize, Serialize};
use std::collections::{HashSet, VecDeque};
use std::path::{Path, PathBuf};
use pulldown_cmark::{Parser, Event, Tag, TagEnd};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LinkedDocument {
    pub path: String,
    pub title: String,
}

/// Discovers all linked Markdown documents starting from a root file
pub fn discover_linked_documents(root_path: &str, max_depth: usize) -> Result<Vec<LinkedDocument>, String> {
    let root_path = PathBuf::from(root_path);
    
    if !root_path.exists() {
        return Err(format!("File does not exist: {}", root_path.display()));
    }
    
    let mut discovered = Vec::new();
    let mut visited = HashSet::new();
    let mut queue = VecDeque::new();
    
    // Start with the root document
    queue.push_back((root_path.clone(), 0));
    visited.insert(root_path.clone());
    
    while let Some((current_path, depth)) = queue.pop_front() {
        if depth >= max_depth {
            continue;
        }
        
        // Extract links from the current document
        match extract_links(&current_path) {
            Ok(links) => {
                for link_path in links {
                    if !visited.contains(&link_path) {
                        visited.insert(link_path.clone());
                        
                        // Extract title from the document
                        let title = extract_title(&link_path)
                            .unwrap_or_else(|| {
                                link_path
                                    .file_name()
                                    .and_then(|n| n.to_str())
                                    .unwrap_or("Untitled")
                                    .to_string()
                            });
                        
                        discovered.push(LinkedDocument {
                            path: link_path.to_string_lossy().to_string(),
                            title,
                        });
                        
                        // Add to queue for traversal
                        queue.push_back((link_path, depth + 1));
                    }
                }
            }
            Err(e) => {
                eprintln!("Error extracting links from {}: {}", current_path.display(), e);
            }
        }
    }
    
    Ok(discovered)
}

/// Extracts all local Markdown file links from a document
fn extract_links(file_path: &Path) -> Result<Vec<PathBuf>, String> {
    let content = std::fs::read_to_string(file_path)
        .map_err(|e| format!("Failed to read file: {}", e))?;
    
    let parser = Parser::new(&content);
    let mut links = Vec::new();
    let base_dir = file_path.parent().unwrap_or(Path::new("."));
    
    let mut in_link = false;
    let mut link_url = String::new();
    
    for event in parser {
        match event {
            Event::Start(Tag::Link { dest_url, .. }) => {
                in_link = true;
                link_url = dest_url.to_string();
            }
            Event::End(TagEnd::Link) => {
                if in_link {
                    if let Some(resolved) = resolve_link(&link_url, base_dir) {
                        links.push(resolved);
                    }
                    in_link = false;
                    link_url.clear();
                }
            }
            _ => {}
        }
    }
    
    Ok(links)
}

/// Resolves a markdown link to an absolute path if it's a local .md file
fn resolve_link(link: &str, base_dir: &Path) -> Option<PathBuf> {
    // Skip external URLs
    if link.starts_with("http://") || link.starts_with("https://") {
        return None;
    }
    
    // Skip anchor-only links
    if link.starts_with('#') {
        return None;
    }
    
    // Remove anchor fragments
    let link_path = link.split('#').next().unwrap_or(link);
    
    // Skip empty links
    if link_path.is_empty() {
        return None;
    }
    
    // Resolve relative path
    let full_path = base_dir.join(link_path);
    
    // Normalize the path
    let normalized = match full_path.canonicalize() {
        Ok(p) => p,
        Err(_) => return None,
    };
    
    // Only include .md and .markdown files
    if let Some(ext) = normalized.extension() {
        if ext == "md" || ext == "markdown" {
            return Some(normalized);
        }
    }
    
    None
}

/// Extracts the title from a Markdown document (first heading or filename)
fn extract_title(file_path: &Path) -> Option<String> {
    let content = std::fs::read_to_string(file_path).ok()?;
    let parser = Parser::new(&content);
    
    let mut in_heading = false;
    let mut title = String::new();
    
    for event in parser {
        match event {
            Event::Start(Tag::Heading { .. }) => {
                in_heading = true;
            }
            Event::Text(text) if in_heading => {
                title.push_str(&text);
            }
            Event::End(TagEnd::Heading(_)) => {
                if in_heading && !title.is_empty() {
                    return Some(title.trim().to_string());
                }
                in_heading = false;
            }
            _ => {}
        }
    }
    
    None
}

