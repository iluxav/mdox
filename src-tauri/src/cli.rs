use clap::Parser;

#[derive(Parser, Debug)]
#[command(name = "mdox")]
#[command(about = "A blazingly fast Markdown viewer and editor", long_about = None)]
pub struct CliArgs {
    /// Path to the Markdown file to open
    pub file: Option<String>,
}

pub fn parse_args() -> CliArgs {
    CliArgs::parse()
}

