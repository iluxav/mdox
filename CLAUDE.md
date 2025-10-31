# 🧠 Project Specification: mdox.io

## 📘 Overview

**mdox** is a **blazingly fast, cross-platform Markdown viewer and editor**, built as a **single native binary** using **Rust + Tauri**.

The application opens `.md` files directly from the terminal or file explorer and provides a rich, interactive view for reading and editing Markdown documents — similar to a lightweight PDF viewer, but optimized for Markdown.

By combining a **Rust backend** with a **web-based frontend**, mdox delivers native performance with the rich document rendering capabilities of HTML/CSS, all packaged as a single executable.

The core goals are:

- ⚡ **Instant startup** (<150 ms)
- 🧩 **Single executable binary**
- 🖥️ **Cross-platform native UI**
- 🧠 **Offline & dependency-free operation**
- ✍️ **Native text selection, copying, and editing**
- 🎨 **Beautiful, responsive rendering**

---

## Product description

### Basic application

mdox.io is a markdown file viewer first and potentially editor. It should be a desktop application with behavior that is similar to pdf viewer.
You can start the application by clicking on it and it should open in empty state and allow you to select file from disc or remote url.
As an option, this app can be called from terminal by `mdox ./README.md` or `mdox https://some-server.com/README.md` and it should open the file.
It should be able to navigate the links both same page links and external links.
We should have a minimalistic back button.
In addition we need a side menu that shows recent files.

### Advanced navigation and editing

The app should be able to edit and save changes (if not from remove source)
Side menu should have a tab that shows the quick paragraph titles so user can click and just to the relevant title.
If possible in background start a worker that traverse all the doc links and build a list of links in side bar.

---

## 🎯 Project Goals

1. **Fast Markdown Viewer**

   - Launch instantly (<150 ms)
   - Render Markdown documents with rich formatting (headings, lists, code, tables, images, etc.)
   - Native text selection and copy like a browser
   - Smooth scrolling for large documents

2. **Markdown Editor**

   - Toggle between view and edit modes
   - Live syntax highlighting in editor
   - Split view with live preview
   - Support file save (`Ctrl+S` / `Cmd+S`)
   - Auto-save option

3. **Cross-Platform Delivery**

   - Single executable binary for:
     - Windows (`.exe`)
     - macOS (universal binary or Apple Silicon native)
     - Linux (AppImage or ELF)
   - Native window controls and system integration
   - Consistent rendering across all platforms

4. **Command-Line Integration**

   - Launch via:
     ```bash
     mdox README.md
     ```
   - Open multiple files:
     ```bash
     mdox file1.md file2.md
     ```
   - No daemon or background service

5. **Rich Document Features**

   - Internal link navigation `[links](./other.md)`
   - Back/forward navigation history
   - Image rendering (relative and absolute paths)
   - Code syntax highlighting
   - Table rendering
   - Search within document (`Ctrl+F` / `Cmd+F`)
   - Theme support (light/dark mode)

6. **User Experience**

   - File associations (double-click `.md` files)
   - Drag-and-drop file opening
   - Recently opened files list
   - Keyboard shortcuts for common actions

---

## ⚙️ Technical Specifications

### 🏗️ Architecture

**Hybrid Architecture**: Rust backend + Web frontend via Tauri

```
┌─────────────────────────────────────┐
│         mdox Application            │
├─────────────────────────────────────┤
│  Frontend (HTML/CSS/JS/TS)          │
│  - Document rendering (HTML/CSS)    │
│  - Code editor (Monaco/CodeMirror)  │
│  - UI components (React/Svelte)     │
├─────────────────────────────────────┤
│  Tauri Bridge (IPC)                 │
├─────────────────────────────────────┤
│  Rust Backend                       │
│  - File system operations           │
│  - Markdown parsing                 │
│  - CLI argument handling            │
│  - System integration               │
└─────────────────────────────────────┘
```

### 🦀 Backend (Rust)

| Function              | Crate/Library                                                               |
| --------------------- | --------------------------------------------------------------------------- |
| Application Framework | [`tauri`](https://tauri.app/) (v2.x)                                        |
| Markdown Parser       | [`pulldown-cmark`](https://github.com/raphlinus/pulldown-cmark)             |
| File Operations       | `std::fs` + [`notify`](https://github.com/notify-rs/notify)                 |
| CLI Argument Parsing  | [`clap`](https://github.com/clap-rs/clap)                                   |
| Path Handling         | `std::path` + [`path-absolutize`](https://crates.io/crates/path-absolutize) |

### 🌐 Frontend (Web Technologies)

| Function            | Library/Framework                                                                                   |
| ------------------- | --------------------------------------------------------------------------------------------------- |
| UI Framework        | **React** or **Svelte** (TBD - recommend Svelte for size)                                           |
| Markdown Rendering  | [`marked`](https://github.com/markedjs/marked) or custom HTML                                       |
| Code Editor         | [`CodeMirror 6`](https://codemirror.net/) or [`Monaco`](https://microsoft.github.io/monaco-editor/) |
| Syntax Highlighting | [`Prism.js`](https://prismjs.com/) or [`highlight.js`](https://highlightjs.org/)                    |
| Styling             | **Tailwind CSS** or plain CSS                                                                       |
| Build Tool          | **Vite** (bundled with Tauri)                                                                       |

### 🔌 Communication Layer

- **Tauri Commands**: Rust functions exposed to frontend via `#[tauri::command]`
- **Events**: Bidirectional event system for file changes, navigation, etc.
- **File System API**: Secure file access through Tauri's API

### 📦 Distribution

| Platform | Format          | Size Estimate |
| -------- | --------------- | ------------- |
| Windows  | `.exe` (NSIS)   | ~5-8 MB       |
| macOS    | `.app` bundle   | ~6-10 MB      |
| Linux    | AppImage/Binary | ~7-10 MB      |

### 🧩 Key Design Decisions

1. **Why Tauri over Electron?**

   - Smaller binary size (5-10 MB vs 100+ MB)
   - Lower memory footprint
   - No Node.js bundled
   - Uses system webview (no Chromium bundle)
   - Rust backend for file operations

2. **Frontend Framework Choice** ✅

   - **React** (chosen): More ecosystem/libraries, familiar to most developers
   - Implemented with functional components and hooks
   - Clean component structure with separate CSS files

3. **Markdown Rendering Strategy** ✅

   - **Implemented**: Rust backend parses Markdown → sends HTML to frontend
   - Uses `pulldown-cmark` for parsing
   - Backend parsing provides consistency and security
   - HTML sanitization built-in

4. **Code Editor Choice**
   - **CodeMirror 6**: Lighter, more customizable, better for Markdown
   - **Monaco**: Feature-rich (VS Code's editor), but heavier
   - Recommendation: CodeMirror 6 for balance of features and size

---

## 🗺️ Implementation Roadmap

### Phase 1: MVP (Core Viewer) ⚡ ✅ COMPLETE

**Goal**: Open and display a Markdown file

- [x] Set up Tauri project with React
- [x] Implement file opening via CLI (`mdox file.md`)
- [x] Rust command to read file contents
- [x] Basic Markdown rendering in frontend
- [x] Simple styling (readable typography)
- [x] Window management and closing
- [x] Native file dialog integration
- [x] Empty state with file picker

**Deliverable**: Can open and view a Markdown file ✅

---

### Phase 2: Rich Rendering 🎨 ✅ COMPLETE

**Goal**: Beautiful, feature-complete Markdown display

- [x] Syntax highlighting for code blocks (highlight.js)
- [x] Image rendering (local files with asset protocol)
- [x] Table rendering (enhanced styling)
- [x] Proper typography (line height, spacing, etc.)
- [x] Theme support (light/dark mode toggle)
- [x] Responsive layout (mobile-friendly)
- [x] Text selection and copy
- [x] Custom scrollbar styling
- [x] GitHub-style markdown rendering

**Deliverable**: Production-quality Markdown viewer ✅

---

### Phase 3: Navigation 🧭 ✅ COMPLETE

**Goal**: Multi-file browsing experience

- [x] Internal link navigation (`[link](./other.md)`)
- [x] Anchor link navigation (`#section`)
- [x] Back/forward buttons
- [x] Navigation history
- [x] Recently opened files sidebar
- [x] Breadcrumb/file name display in toolbar
- [x] External link handling (opens in browser)

**Deliverable**: Can navigate between linked Markdown files ✅

---

### Phase 4: Editor Mode ✍️ ✅ COMPLETE

**Goal**: Edit Markdown files

- [x] Integrate CodeMirror 6
- [x] Toggle view/edit mode
- [x] Markdown syntax highlighting in editor
- [x] Save file (`Ctrl+S`/`Cmd+S`)
- [x] Dirty file indicator (unsaved changes)
- [x] Live preview (updates as you type)
- [x] Split view (editor + preview side-by-side)
- [x] Unsaved changes warning

**Deliverable**: Full-featured Markdown editor ✅

---

### Phase 5: Polish & Distribution 🚀 ⚙️ IN PROGRESS

**Goal**: Production-ready application

- [x] Search functionality (`Ctrl+F`)
- [x] Keyboard shortcuts (Open, Save, Edit, Search, Theme, Navigation)
- [x] Settings/preferences panel
- [x] Performance optimization (scroll synchronization)
- [x] Error handling and edge cases
- [x] Native macOS UI (transparent title bar, traffic light integration)
- [x] Custom scrollbar styling
- [x] Native sidebar with frosted glass effect
- [x] File associations (configured in tauri.conf.json)

**Deliverable**: Production-ready application ⚙️

---

### Phase 6: Document links traversal and discovery

**Goal**: Show in sidebar under its own tab "Linked docs" list of document titles that i can click on it and open the doc

- [ ] Performant Rust based text parser that looks for the links in active document, follow the link and does the same for each file it finds
- [ ] Introduce tabs in side menu: Linked Docs, Recent Docs

**Deliverable**: Production-ready functionality application ⚙️

---

## 🎨 UI/UX Considerations

### Visual Design

- **Clean, distraction-free interface**
- **Typography-first**: Emphasis on readability
- **Minimal chrome**: Focus on content
- **System-native feel**: Follow platform guidelines

### Layout

````
┌────────────────────────────────────────────┐
│ [←] [→] [Edit] [Theme]          [⚙️]  [✕]  │ ← Toolbar
├────────────────────────────────────────────┤
│                                            │
│  # Document Title                          │
│                                            │
│  This is the rendered **Markdown**         │
│  content with proper formatting.           │
│                                            │
│  - List items                              │
│  - More items                              │
│                                            │
│  ```javascript                             │
│  console.log("Syntax highlighted");        │
│  ```                                       │
│                                            │
└────────────────────────────────────────────┘
````

### Keyboard Shortcuts

| Action           | Windows/Linux | macOS   |
| ---------------- | ------------- | ------- |
| Open File        | `Ctrl+O`      | `Cmd+O` |
| Save File        | `Ctrl+S`      | `Cmd+S` |
| Toggle Edit Mode | `Ctrl+E`      | `Cmd+E` |
| Search           | `Ctrl+F`      | `Cmd+F` |
| Toggle Theme     | `Ctrl+T`      | `Cmd+T` |
| Back             | `Alt+←`       | `Cmd+[` |
| Forward          | `Alt+→`       | `Cmd+]` |
| Quit             | `Ctrl+Q`      | `Cmd+Q` |

---

## 📁 Project Structure

```
mdox/
├── src-tauri/          # Rust backend
│   ├── src/
│   │   ├── main.rs     # Entry point ✅
│   │   ├── commands.rs # Tauri commands ✅
│   │   ├── markdown.rs # Markdown parsing ✅
│   │   ├── files.rs    # File operations ✅
│   │   └── cli.rs      # CLI argument parsing ✅
│   ├── Cargo.toml      # ✅
│   ├── tauri.conf.json # Tauri configuration ✅
│   └── capabilities/   # ✅
│       └── default.json
│
├── src/                # Frontend (React)
│   ├── App.jsx         # Main app component ✅
│   ├── App.css         # ✅
│   ├── components/     # ✅
│   │   ├── Viewer.jsx  # Markdown viewer ✅
│   │   ├── Viewer.css
│   │   ├── Editor.jsx  # CodeMirror editor ✅
│   │   ├── Editor.css
│   │   ├── Toolbar.jsx # Top toolbar ✅
│   │   ├── Toolbar.css
│   │   ├── Sidebar.jsx # Recent files sidebar ✅
│   │   ├── Sidebar.css
│   │   ├── SearchBar.jsx # In-document search ✅
│   │   ├── SearchBar.css
│   │   ├── Settings.jsx # Settings panel ✅
│   │   ├── Settings.css
│   │   ├── EmptyState.jsx # Empty state screen ✅
│   │   └── EmptyState.css
│   ├── hooks/          # ✅
│   │   ├── useTheme.js # Theme management ✅
│   │   ├── useNavigation.js # History/navigation ✅
│   │   └── useRecentFiles.js # Recent files ✅
│   ├── styles/         # ✅
│   │   ├── global.css  # ✅
│   │   └── markdown.css # ✅
│   └── main.jsx        # ✅
│
├── index.html          # ✅
├── vite.config.js      # ✅
├── package.json        # ✅
└── README.md           # ✅
```

---

## 🚀 Getting Started (Development)

### Prerequisites

- Rust (latest stable)
- Node.js (LTS)
- Platform-specific Tauri dependencies:
  - **macOS**: Xcode Command Line Tools
  - **Linux**: Build essentials, webkit2gtk, etc.
  - **Windows**: Microsoft C++ Build Tools

### Setup Commands

```bash
# Create new Tauri project
npm create tauri-app@latest

# Install dependencies
npm install

# Run in development mode
npm run tauri dev

# Build for production
npm run tauri build
```

---

## 🔒 Security Considerations

- **Tauri's security model**: No Node.js means smaller attack surface
- **File system access**: Use Tauri's scoped file system API
- **Content Security Policy**: Restrict what frontend can do
- **No arbitrary code execution**: Markdown is rendered as HTML, not executed
- **Safe Markdown parsing**: Sanitize HTML output to prevent XSS

---

## 🎯 Success Metrics

- ✅ Smooth scrolling (60fps) for documents up to 10,000 lines

---

## 📚 Resources

### Tauri

- [Tauri Documentation](https://tauri.app/v1/guides/)
- [Tauri Examples](https://github.com/tauri-apps/tauri/tree/dev/examples)

### Markdown

- [CommonMark Spec](https://commonmark.org/)
- [GitHub Flavored Markdown](https://github.github.com/gfm/)

### Inspiration

- [Marktext](https://github.com/marktext/marktext)
- [Typora](https://typora.io/)
- [Obsidian](https://obsidian.md/)

---

## IMPORTANT NOTES:

- DO NOT REPEAT YOURSELF! - do NOT duplicate any code, make code as reusable as possible. Follow the best practices.
- DO NOT dump lots of code in one single function. Use files and folders structure that make sense.
- DO NOT produce explanations and documentation files and other artifacts
- DO NOT create file versions - always replace the code with the new approach if decided
- ALWAYS update the CLAUDE.md file and progress

---

## 📊 Current Implementation Status

### ✅ Phase 1: MVP (Core Viewer) - COMPLETE

**Implemented Features:**

- Tauri 2.0 application with Rust backend
- React 18 frontend with Vite bundler
- CLI argument parsing (can launch with `mdox file.md`)
- File reading from disk via Rust commands
- Markdown parsing using `pulldown-cmark`
- HTML rendering with proper styling
- Native file dialog integration (`@tauri-apps/plugin-dialog`)
- Empty state screen with file picker
- Toolbar with file open button
- Beautiful typography and markdown styling
- Support for headings, lists, code blocks, tables, blockquotes
- Text selection and copying
- Cross-platform icon assets

### ✅ Phase 2: Rich Rendering - COMPLETE

**Implemented Features:**

- **Syntax highlighting**: highlight.js with GitHub Dark theme
- **Local image rendering**: Relative paths resolved via Rust, displayed using Tauri asset protocol
- **Enhanced tables**: Striped rows, proper borders, responsive overflow
- **Dark/Light themes**: Toggle button in toolbar with persistent localStorage
- **Improved typography**: GitHub-style spacing (16px base, 1.7 line-height)
- **Responsive layout**: Mobile-friendly padding, max-width constraints
- **Custom scrollbar**: Styled for both light and dark themes
- **Professional styling**: GitHub-inspired markdown rendering
- **Smooth transitions**: Theme switching with CSS transitions

**Tech Stack:**

- **Backend**: Rust, Tauri 2.0, pulldown-cmark, clap
- **Frontend**: React 18, Vite 5, highlight.js
- **Plugins**: tauri-plugin-shell, tauri-plugin-dialog

### ✅ Phase 3: Navigation - COMPLETE

**Implemented Features:**

- **Internal link navigation**: Click markdown links to navigate to other files
- **Anchor links**: Jump to sections within the same document (#section)
- **Back/forward navigation**: Browser-style navigation buttons with history
- **Navigation history**: Tracks visited files with forward/back support
- **Recent files sidebar**: Slide-out panel showing last 10 opened files
- **File path resolution**: Rust backend resolves relative paths correctly
- **Keyboard-friendly**: Disabled state for nav buttons when unavailable
- **Persistent history**: Recent files saved to localStorage

### ✅ Phase 4: Editor Mode - COMPLETE

**Implemented Features:**

- **CodeMirror 6 integration**: Modern, performant code editor
- **View/Edit mode toggle**: Switch between reading and editing with Cmd+E
- **Markdown syntax highlighting**: Full syntax support in editor
- **File save functionality**: Cmd+S/Ctrl+S with visual feedback
- **Dirty file indicator**: Shows when file has unsaved changes
- **Live preview**: Real-time markdown rendering as you type
- **Split view**: Side-by-side editor and preview panels
- **Bidirectional scroll sync**: Editor and preview scroll together smoothly
- **Performance optimized**: requestAnimationFrame-based scrolling
- **Unsaved changes warning**: Prevents accidental data loss

### ⚙️ Phase 5: Polish & Distribution - IN PROGRESS

**Implemented Features:**

- **Search functionality**: In-document search with Cmd+F, match count, navigation
- **Global keyboard shortcuts**: Open (Cmd+O), Save (Cmd+S), Edit (Cmd+E), Search (Cmd+F), Theme (Cmd+T)
- **Settings panel**: Displays keyboard shortcuts, theme toggle, app version
- **Native macOS UI**: Transparent title bar, traffic light button integration, proper spacing
- **Custom scrollbars**: Styled webkit scrollbars for editor and viewer
- **Native sidebar design**: Frosted glass effect, native fonts, proper animations
- **Sidebar behavior**: Pushes content instead of overlaying, includes toolbar
- **Performance optimization**: Smooth scroll synchronization with requestAnimationFrame
- **Error handling**: User-friendly error messages with dismissible alerts
- **File associations**: Configured for .md and .markdown files
- **React.memo optimization**: Memoized components for better performance
- Drag-and-drop file opening (attempted but requires Tauri v2 configuration investigation)

**Pending:**

**Tech Stack:**

- **Backend**: Rust, Tauri 2.0, pulldown-cmark, clap
- **Frontend**: React 18, Vite 5, CodeMirror 6, highlight.js
- **Plugins**: tauri-plugin-shell, tauri-plugin-dialog
- **Custom Hooks**: useNavigation, useRecentFiles, useTheme
- **Performance**: requestAnimationFrame, React.memo, useCallback

**Next Steps:** Final testing and distribution builds
