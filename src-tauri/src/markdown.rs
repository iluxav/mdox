use pulldown_cmark::{html, CowStr, Event, Options, Parser, Tag};
use std::path::Path;

fn generate_id(text: &str) -> String {
    text.to_lowercase()
        .chars()
        .map(|c| {
            if c.is_alphanumeric() || c == '-' || c == '_' {
                c
            } else if c.is_whitespace() {
                '-'
            } else {
                // Skip emojis and special characters
                ' '
            }
        })
        .collect::<String>()
        .split_whitespace()
        .collect::<Vec<&str>>()
        .join("-")
}

pub fn parse_to_html(markdown: &str) -> String {
    let mut options = Options::empty();
    options.insert(Options::ENABLE_STRIKETHROUGH);
    options.insert(Options::ENABLE_TABLES);
    options.insert(Options::ENABLE_TASKLISTS);
    options.insert(Options::ENABLE_HEADING_ATTRIBUTES);

    let parser = Parser::new_ext(markdown, options);

    // Collect text content for heading IDs
    let mut events = Vec::new();
    let mut in_heading = false;

    let mut heading_text = String::new();
    let mut heading_start_index = 0;

    for event in parser {
        match &event {
            Event::Start(Tag::Heading {
                level: _,
                id: _,
                classes: _,
                attrs: _,
            }) => {
                in_heading = true;
                heading_text.clear();
                heading_start_index = events.len();
                events.push(event);
            }
            Event::End(pulldown_cmark::TagEnd::Heading(_)) => {
                in_heading = false;
                if !heading_text.is_empty() {
                    let id = generate_id(&heading_text);
                    // Update the heading start event with the ID
                    if let Some(Event::Start(Tag::Heading { level, classes, .. })) =
                        events.get_mut(heading_start_index)
                    {
                        *events.get_mut(heading_start_index).unwrap() =
                            Event::Start(Tag::Heading {
                                level: *level,
                                id: Some(CowStr::from(id)),
                                classes: classes.clone(),
                                attrs: vec![],
                            });
                    }
                }
                events.push(event);
            }
            Event::Text(text) if in_heading => {
                heading_text.push_str(text);
                events.push(event);
            }
            _ => {
                events.push(event);
            }
        }
    }

    let mut html_output = String::new();
    html::push_html(&mut html_output, events.into_iter());

    html_output
}

pub fn parse_to_html_with_base_path(markdown: &str, base_path: &str) -> String {
    let mut options = Options::empty();
    options.insert(Options::ENABLE_STRIKETHROUGH);
    options.insert(Options::ENABLE_TABLES);
    options.insert(Options::ENABLE_TASKLISTS);
    options.insert(Options::ENABLE_HEADING_ATTRIBUTES);

    let parser = Parser::new_ext(markdown, options);
    let base = Path::new(base_path);
    let base_dir = base.parent();

    // Collect and transform events
    let mut events = Vec::new();
    let mut in_heading = false;
    let mut heading_text = String::new();
    let mut heading_start_index = 0;

    for event in parser {
        match &event {
            Event::Start(Tag::Heading {
                level: _,
                id: _,
                classes: _,
                attrs: _,
            }) => {
                in_heading = true;
                heading_text.clear();
                heading_start_index = events.len();
                events.push(event);
            }
            Event::End(pulldown_cmark::TagEnd::Heading(_)) => {
                in_heading = false;
                if !heading_text.is_empty() {
                    let id = generate_id(&heading_text);
                    // Update the heading start event with the ID
                    if let Some(Event::Start(Tag::Heading { level, classes, .. })) =
                        events.get_mut(heading_start_index)
                    {
                        *events.get_mut(heading_start_index).unwrap() =
                            Event::Start(Tag::Heading {
                                level: *level,
                                id: Some(CowStr::from(id)),
                                classes: classes.clone(),
                                attrs: vec![],
                            });
                    }
                }
                events.push(event);
            }
            Event::Text(text) if in_heading => {
                heading_text.push_str(text);
                events.push(event.clone());
            }
            Event::Start(Tag::Image {
                link_type,
                dest_url,
                title,
                id,
            }) => {
                let new_url = if !dest_url.starts_with("http://")
                    && !dest_url.starts_with("https://")
                    && !dest_url.starts_with("data:")
                    && base_dir.is_some()
                {
                    let img_path = base_dir.unwrap().join(dest_url.as_ref());
                    if img_path.exists() {
                        if let Some(absolute) = img_path.to_str() {
                            format!("file://{}", absolute).into()
                        } else {
                            dest_url.clone()
                        }
                    } else {
                        dest_url.clone()
                    }
                } else {
                    dest_url.clone()
                };
                events.push(Event::Start(Tag::Image {
                    link_type: *link_type,
                    dest_url: new_url,
                    title: title.clone(),
                    id: id.clone(),
                }));
            }
            _ => {
                events.push(event);
            }
        }
    }

    let mut html_output = String::new();
    html::push_html(&mut html_output, events.into_iter());

    html_output
}
