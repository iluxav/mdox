# Installation Guide

## macOS Installation

### Method 1: Download and Install (Recommended)

1. Download the latest `.dmg` file from the [Releases page](../../releases)
2. Open the downloaded `.dmg` file
3. Drag `mdox.app` to your Applications folder

### Handling "Unverified Developer" Warning

When you first open mdox, macOS may show a warning: **"Apple could not verify mdox is free of malware"**

This is because the app is not yet notarized by Apple. To open the app safely:

**Option A: Right-click Method**
1. Right-click (or Control+click) on `mdox.app` in Applications
2. Select **"Open"** from the menu
3. Click **"Open"** again in the security dialog
4. The app will now open and remember your choice

**Option B: Terminal Method**
```bash
xattr -cr /Applications/mdox.app
open /Applications/mdox.app
```

**Option C: System Settings**
1. Try to open the app normally (it will be blocked)
2. Go to **System Settings** → **Privacy & Security**
3. Scroll down and click **"Open Anyway"** next to the mdox warning
4. Confirm by clicking **"Open"**

### Why This Happens

mdox is an open-source application distributed without Apple Developer ID code signing ($99/year). This is common for free, community-driven software.

**The app is completely safe** - it's:
- ✅ Open source (you can review all code)
- ✅ Built from verified source code
- ✅ Free from malware or tracking
- ✅ Used by the community

Apple shows this warning for **any** unsigned app, not because mdox is unsafe, but because Apple hasn't reviewed it.

### Alternative Installation Methods

If you prefer not to bypass Gatekeeper:

**Option 1: Build from Source**
```bash
git clone https://github.com/yourusername/mdox
cd mdox
npm install
npm run tauri build
```

**Option 2: Homebrew** (Coming Soon)
```bash
brew tap yourusername/mdox
brew install --cask mdox
```

## Windows Installation

1. Download the `.msi` or `.exe` installer from the [Releases page](../../releases)
2. Run the installer
3. Windows Defender SmartScreen may show a warning - click "More info" → "Run anyway"

## Linux Installation

### AppImage (Universal)
```bash
chmod +x mdox-*.AppImage
./mdox-*.AppImage
```

### Debian/Ubuntu (.deb)
```bash
sudo dpkg -i mdox-*.deb
sudo apt-get install -f  # Fix dependencies if needed
```

## Command Line Usage

After installation, you can open Markdown files from the terminal:

```bash
mdox README.md
mdox ./docs/guide.md
mdox https://raw.githubusercontent.com/user/repo/main/README.md
```

## Troubleshooting

### macOS: "App is damaged and can't be opened"
This usually means the app was quarantined. Run:
```bash
xattr -cr /Applications/mdox.app
```

### macOS: Command not found
The `mdox` command may not be in your PATH. Use the full path:
```bash
/Applications/mdox.app/Contents/MacOS/mdox README.md
```

Or create an alias in `~/.zshrc`:
```bash
alias mdox="/Applications/mdox.app/Contents/MacOS/mdox"
```

## Building from Source

If you prefer to build mdox yourself:

```bash
# Install dependencies
npm install

# Run in development
npm run tauri dev

# Build for production
npm run tauri build
```

See [README.md](README.md) for full development instructions.
