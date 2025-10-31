use pulldown_cmark::{Event, Parser, Tag, TagEnd};
use regex::Regex;
use serde::{Deserialize, Serialize};
use std::collections::{HashSet, VecDeque};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RemoteLinkedDocument {
    pub url: String,
    pub title: String,
}

/// Fetches content from a remote URL
pub fn fetch_remote_content(url: &str) -> Result<String, String> {
    let client = reqwest::blocking::Client::builder()
        .timeout(std::time::Duration::from_secs(10))
        .user_agent("mdox/0.1.0")
        .build()
        .map_err(|e| format!("Failed to create HTTP client: {}", e))?;

    let response = client
        .get(url)
        .send()
        .map_err(|e| format!("Failed to fetch URL: {}", e))?;

    if !response.status().is_success() {
        return Err(format!(
            "HTTP error {}: {}",
            response.status().as_u16(),
            response
                .status()
                .canonical_reason()
                .unwrap_or("Unknown error")
        ));
    }

    let content_type = response
        .headers()
        .get("content-type")
        .and_then(|v| v.to_str().ok())
        .unwrap_or("");

    // Check if it's likely a text file
    if !content_type.is_empty()
        && !content_type.contains("text")
        && !content_type.contains("markdown")
        && !content_type.contains("plain")
    {
        return Err(format!(
            "Invalid content type: {}. Expected text/markdown or text/plain",
            content_type
        ));
    }

    let text = response
        .text()
        .map_err(|e| format!("Failed to read response body: {}", e))?;

    // Basic validation: check if it looks like markdown/text
    if text.is_empty() {
        return Err("File is empty".to_string());
    }

    // Check if it's binary content (contains too many non-printable characters)
    let non_printable_count = text
        .chars()
        .filter(|c| c.is_control() && *c != '\n' && *c != '\r' && *c != '\t')
        .count();

    if non_printable_count > text.len() / 10 {
        return Err("File appears to be binary, not a text file".to_string());
    }

    Ok(text)
}

/// Detects if a URL is a GitHub repository and converts it to raw README URL
pub fn detect_and_convert_github_url(url: &str) -> Option<String> {
    // Pattern: https://github.com/{username}/{repo}
    let re = Regex::new(r"^https://github\.com/([^/]+)/([^/]+?)(?:\.git)?/?$").ok()?;

    if let Some(captures) = re.captures(url) {
        let username = captures.get(1)?.as_str();
        let repo = captures.get(2)?.as_str();

        // Try main branch first, then master
        return Some(format!(
            "https://raw.githubusercontent.com/{}/{}/refs/heads/main/README.md",
            username, repo
        ));
    }

    None
}

/// Tries to fetch README from both main and master branches
pub fn fetch_github_readme(username: &str, repo: &str) -> Result<(String, String), String> {
    // Try main branch first
    let main_url = format!(
        "https://raw.githubusercontent.com/{}/{}/refs/heads/main/README.md",
        username, repo
    );

    match fetch_remote_content(&main_url) {
        Ok(content) => return Ok((content, main_url)),
        Err(_) => {
            // Try master branch as fallback
            let master_url = format!(
                "https://raw.githubusercontent.com/{}/{}/refs/heads/master/README.md",
                username, repo
            );

            match fetch_remote_content(&master_url) {
                Ok(content) => Ok((content, master_url)),
                Err(e) => Err(format!(
                    "Could not find README.md in main or master branch: {}",
                    e
                )),
            }
        }
    }
}

/// Resolves a relative URL based on a base URL
fn resolve_url(base_url: &str, relative_url: &str) -> Option<String> {
    // If it's already absolute, return as-is
    if relative_url.starts_with("http://") || relative_url.starts_with("https://") {
        return Some(relative_url.to_string());
    }

    // Parse base URL to get the directory
    if let Ok(base) = url::Url::parse(base_url) {
        if let Ok(resolved) = base.join(relative_url) {
            return Some(resolved.to_string());
        }
    }

    None
}

/// Extracts all linked Markdown URLs from remote content
fn extract_remote_links(content: &str, base_url: &str) -> Vec<String> {
    let parser = Parser::new(content);
    let mut links = Vec::new();

    for event in parser {
        if let Event::Start(Tag::Link { dest_url, .. }) = event {
            let url = dest_url.to_string();

            // Skip anchor links and external non-markdown links
            if url.starts_with('#') {
                continue;
            }

            // Check if it's a markdown link
            let is_md = url.ends_with(".md") || url.ends_with(".markdown");

            // Or if it's a relative link without extension (assume markdown)
            let is_relative = !url.starts_with("http://") && !url.starts_with("https://");

            if is_md || (is_relative && !url.contains('.')) {
                if let Some(resolved) = resolve_url(base_url, &url) {
                    links.push(resolved);
                }
            }
        }
    }

    links
}

/// Extracts title from markdown content
fn extract_title_from_content(content: &str) -> Option<String> {
    let parser = Parser::new(content);
    let mut in_heading = false;
    let mut title = String::new();

    for event in parser {
        match event {
            Event::Start(Tag::Heading { level, .. })
                if level == pulldown_cmark::HeadingLevel::H1 =>
            {
                in_heading = true;
            }
            Event::End(TagEnd::Heading(_)) => {
                if in_heading && !title.is_empty() {
                    return Some(title.trim().to_string());
                }
                in_heading = false;
            }
            Event::Text(text) if in_heading => {
                title.push_str(&text);
            }
            _ => {}
        }
    }

    None
}

/// Discovers linked documents from a remote markdown file
pub fn discover_remote_linked_documents(
    root_url: String,
    max_depth: usize,
) -> Result<Vec<RemoteLinkedDocument>, String> {
    let mut discovered = Vec::new();
    let mut visited = HashSet::new();
    let mut queue = VecDeque::new();

    // Start with the root URL
    queue.push_back((root_url.clone(), 0));
    visited.insert(root_url.clone());

    while let Some((current_url, depth)) = queue.pop_front() {
        if depth >= max_depth {
            continue;
        }

        // Fetch the content
        match fetch_remote_content(&current_url) {
            Ok(content) => {
                // Extract links
                let links = extract_remote_links(&content, &current_url);

                for link_url in links {
                    if !visited.contains(&link_url) {
                        visited.insert(link_url.clone());

                        // Try to fetch and extract title
                        let title = match fetch_remote_content(&link_url) {
                            Ok(link_content) => {
                                extract_title_from_content(&link_content).unwrap_or_else(|| {
                                    // Extract filename from URL as fallback
                                    link_url.split('/').last().unwrap_or("Untitled").to_string()
                                })
                            }
                            Err(_) => {
                                // If we can't fetch, use filename
                                link_url.split('/').last().unwrap_or("Untitled").to_string()
                            }
                        };

                        discovered.push(RemoteLinkedDocument {
                            url: link_url.clone(),
                            title,
                        });

                        // Add to queue for traversal
                        queue.push_back((link_url, depth + 1));
                    }
                }
            }
            Err(e) => {
                eprintln!("Error fetching {}: {}", current_url, e);
            }
        }
    }

    Ok(discovered)
}
