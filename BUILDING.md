# Building mdox

This guide explains how to build mdox from source and create distribution packages.

## Prerequisites

### All Platforms
- **Node.js** 20+ (LTS recommended)
- **Rust** 1.70+ (latest stable)
- **npm** or **yarn**

### Platform-Specific Requirements

#### macOS
```bash
xcode-select --install
```

#### Linux (Ubuntu/Debian)
```bash
sudo apt-get update
sudo apt-get install -y \
  libwebkit2gtk-4.1-dev \
  libappindicator3-dev \
  librsvg2-dev \
  patchelf \
  libssl-dev \
  libgtk-3-dev
```

#### Windows
- **Microsoft C++ Build Tools** or **Visual Studio 2019+**

## Development Build

```bash
# Clone repository
git clone https://github.com/yourusername/mdox
cd mdox

# Install dependencies
npm install

# Run in development mode
npm run tauri dev
```

The app will launch with hot-reload enabled for frontend changes.

## Production Build

```bash
# Build for your current platform
npm run tauri build
```

### Build Outputs

| Platform | Output Location | Files |
|----------|----------------|-------|
| **macOS** | `src-tauri/target/release/bundle/` | `dmg/mdox_*.dmg`<br>`macos/mdox.app` |
| **Windows** | `src-tauri/target/release/bundle/` | `msi/mdox_*.msi`<br>`nsis/mdox_*.exe` |
| **Linux** | `src-tauri/target/release/bundle/` | `appimage/mdox_*.AppImage`<br>`deb/mdox_*.deb` |

## Code Signing

### macOS Ad-hoc Signing (Current Setup)

mdox uses ad-hoc code signing by default. This requires no Apple Developer account.

**Configuration** ([src-tauri/tauri.conf.json](src-tauri/tauri.conf.json)):
```json
{
  "bundle": {
    "macOS": {
      "signingIdentity": "-",
      "hardenedRuntime": true
    }
  }
}
```

**Verification:**
```bash
# Check signature
codesign -dv src-tauri/target/release/bundle/macos/mdox.app

# Expected output:
# Signature=adhoc
# Runtime Version=15.5.0
```

**User Experience:**
- Users see Gatekeeper warning on first launch
- Right-click → Open bypasses warning (one-time)
- App works normally after first bypass

### Official Apple Code Signing (Optional)

To eliminate the Gatekeeper warning, you need:
1. Apple Developer Program membership ($99/year)
2. Developer ID Application certificate
3. App notarization

See [CODE_SIGNING.md](CODE_SIGNING.md) for detailed instructions.

## Building for Multiple Architectures

### macOS Universal Binary

Build for both Intel and Apple Silicon:

```bash
# Install targets
rustup target add aarch64-apple-darwin
rustup target add x86_64-apple-darwin

# Build universal binary
npm run tauri build -- --target universal-apple-darwin
```

Output: `src-tauri/target/universal-apple-darwin/release/bundle/dmg/mdox_*.dmg`

### Linux Cross-Compilation

```bash
# Build for different architectures
cargo install cross

# ARM64
cross build --target aarch64-unknown-linux-gnu --release

# x86_64
cross build --target x86_64-unknown-linux-gnu --release
```

## GitHub Actions (CI/CD)

The repository includes automated builds via GitHub Actions.

**Trigger builds:**
```bash
# Push a version tag
git tag v0.2.0
git push origin v0.2.0
```

**Workflow:** [.github/workflows/build.yml](.github/workflows/build.yml)

Builds for:
- ✅ macOS (Universal - Intel + Apple Silicon)
- ✅ Windows (x64)
- ✅ Linux (x64)

**Artifacts** are uploaded and available in the Actions tab.

## Build Optimization

### Reduce Binary Size

Edit `src-tauri/Cargo.toml`:

```toml
[profile.release]
strip = true          # Strip symbols
opt-level = "z"       # Optimize for size
lto = true           # Link-time optimization
codegen-units = 1    # Better optimization
panic = "abort"      # Smaller panic handler
```

**Trade-off:** Slower build times, smaller binaries

### Bundle Analysis

```bash
# Check bundle size
du -sh src-tauri/target/release/bundle/macos/mdox.app

# List large dependencies
cargo tree --edges normal --depth 1 | grep -v '(*)' | sort -k2 -hr
```

## Troubleshooting

### macOS: "Command not found: tauri"

Install Tauri CLI:
```bash
npm install --save-dev @tauri-apps/cli
```

### Linux: "webkit2gtk-4.1 not found"

Install WebKit dependencies:
```bash
sudo apt-get install libwebkit2gtk-4.1-dev
```

### Windows: "MSVC not found"

Install Visual Studio Build Tools:
- Download from: https://visualstudio.microsoft.com/downloads/
- Select "Desktop development with C++"

### Build Errors After Dependency Updates

Clean and rebuild:
```bash
# Clean Rust build
cargo clean

# Clean frontend build
rm -rf dist node_modules
npm install

# Rebuild
npm run tauri build
```

## Performance Benchmarks

| Metric | Value |
|--------|-------|
| Binary size (macOS) | 6.4 MB |
| Startup time | <150 ms |
| Memory footprint | ~80 MB |
| Build time (release) | ~1 min |

## Release Checklist

Before creating a release:

- [ ] Update version in `package.json`
- [ ] Update version in `src-tauri/Cargo.toml`
- [ ] Update version in `src-tauri/tauri.conf.json`
- [ ] Update CHANGELOG.md
- [ ] Test on all platforms
- [ ] Create git tag: `git tag v0.x.x`
- [ ] Push tag: `git push origin v0.x.x`
- [ ] Wait for GitHub Actions to build
- [ ] Download and test artifacts
- [ ] Create GitHub Release with notes
- [ ] Attach build artifacts to release

## Additional Resources

- [Tauri Build Guide](https://tauri.app/v1/guides/building/)
- [Rust Performance Book](https://nnethercote.github.io/perf-book/)
- [macOS Code Signing](https://developer.apple.com/documentation/security/notarizing_macos_software_before_distribution)
