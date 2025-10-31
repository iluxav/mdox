import { useEffect, useState, useCallback, useRef, memo } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { useTheme } from "./hooks/useTheme";
import { useNavigation } from "./hooks/useNavigation";
import { useRecentFiles } from "./hooks/useRecentFiles";
import { useLinkedDocs } from "./hooks/useLinkedDocs";
import Viewer from "./components/Viewer";
import Editor from "./components/Editor";
import Toolbar from "./components/Toolbar";
import EmptyState from "./components/EmptyState";
import Sidebar from "./components/Sidebar";
import SearchBar from "./components/SearchBar";
import Settings from "./components/Settings";
import "./App.css";

function App() {
  const { theme, toggleTheme } = useTheme();
  const navigation = useNavigation();
  const { recentFiles, addRecentFile } = useRecentFiles();
  
  const [currentFile, setCurrentFile] = useState(null);
  const [rootFile, setRootFile] = useState(null); // The main entry point file
  const [fileContent, setFileContent] = useState("");
  const [editedContent, setEditedContent] = useState("");
  const [htmlContent, setHtmlContent] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isSplitView, setIsSplitView] = useState(false);
  const [splitPosition, setSplitPosition] = useState(50); // percentage
  const [isResizingSplit, setIsResizingSplit] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Link discovery only runs for the root file
  const { linkedDocs, isLoading: isLoadingLinked } = useLinkedDocs(rootFile);

  const viewerRef = useRef(null);
  const editorRef = useRef(null);
  const editorScrollingRef = useRef(false);
  const viewerScrollingRef = useRef(false);
  const mainContentRef = useRef(null);

  const openFile = useCallback(async (filePath, options = {}) => {
    if (!filePath) return;

    const { 
      addToNav = true, 
      isRootFile = false, // true = opened from file system/recent, false = clicked link
      addToRecent = true 
    } = options;

    // Check if there are unsaved changes
    if (isDirty && currentFile) {
      const confirmed = window.confirm("You have unsaved changes. Do you want to discard them?");
      if (!confirmed) return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const content = await invoke("read_file", { path: filePath });
      const html = await invoke("parse_markdown", { 
        content, 
        basePath: filePath 
      });

      setFileContent(content);
      setEditedContent(content);
      setHtmlContent(html);
      setCurrentFile(filePath);
      setIsDirty(false);
      setIsEditMode(false);
      setError(null);
      
      // Only update root file if this is explicitly opened (not a link navigation)
      if (isRootFile) {
        setRootFile(filePath);
      }
      
      if (addToNav) {
        navigation.addToHistory(filePath);
      }
      
      // Only add to recent files if it's a root file opening
      if (addToRecent) {
        addRecentFile(filePath);
      }
    } catch (err) {
      const errorMessage = typeof err === 'string' ? err : err.message || 'Unknown error occurred';
      setError(`Failed to open file: ${errorMessage}`);
      console.error("Error opening file:", err);
    } finally {
      setIsLoading(false);
    }
  }, [isDirty, currentFile, navigation, addRecentFile]);

  const handleEditorChange = useCallback(async (newContent) => {
    setEditedContent(newContent);
    setIsDirty(newContent !== fileContent);
    
    // Update preview in real-time
    try {
      const html = await invoke("parse_markdown", { 
        content: newContent, 
        basePath: currentFile 
      });
      setHtmlContent(html);
      setError(null);
    } catch (err) {
      console.error("Error parsing markdown:", err);
      // Don't show error to user during typing, just log it
    }
  }, [fileContent, currentFile]);

  const handleSave = async () => {
    if (!currentFile || !isDirty) return;

    try {
      await invoke("save_file", { 
        path: currentFile, 
        content: editedContent 
      });
      setFileContent(editedContent);
      setIsDirty(false);
      setError(null);
    } catch (err) {
      const errorMessage = typeof err === 'string' ? err : err.message || 'Unknown error occurred';
      setError(`Failed to save file: ${errorMessage}`);
      console.error("Error saving file:", err);
      alert(`Failed to save file: ${errorMessage}`);
    }
  };

  const toggleEditMode = useCallback(() => {
    if (!currentFile) return;
    setIsEditMode(!isEditMode);
  }, [currentFile, isEditMode]);

  const toggleSplitView = useCallback(() => {
    setIsSplitView(!isSplitView);
  }, [isSplitView]);

  const handleEditorScroll = useCallback((scrollPercentage) => {
    if (!isSplitView || viewerScrollingRef.current) return;
    
    editorScrollingRef.current = true;
    if (viewerRef.current) {
      viewerRef.current.scrollToPercentage(scrollPercentage);
    }
    setTimeout(() => {
      editorScrollingRef.current = false;
    }, 100);
  }, [isSplitView]);

  const handleViewerScroll = useCallback((scrollPercentage) => {
    if (!isSplitView || editorScrollingRef.current) return;

    viewerScrollingRef.current = true;
    if (editorRef.current) {
      editorRef.current.scrollToPercentage(scrollPercentage);
    }
    setTimeout(() => {
      viewerScrollingRef.current = false;
    }, 100);
  }, [isSplitView]);

  // Split view resize handlers
  useEffect(() => {
    if (!isResizingSplit) return;

    const handleMouseMove = (e) => {
      if (mainContentRef.current) {
        const rect = mainContentRef.current.getBoundingClientRect();
        const newPosition = ((e.clientX - rect.left) / rect.width) * 100;
        if (newPosition >= 20 && newPosition <= 80) {
          setSplitPosition(newPosition);
        }
      }
    };

    const handleMouseUp = () => {
      setIsResizingSplit(false);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isResizingSplit]);

  const handleSplitResizeStart = useCallback((e) => {
    e.preventDefault();
    setIsResizingSplit(true);
  }, []);

  const handleBack = useCallback(() => {
    const prevFile = navigation.goBack();
    if (prevFile) {
      openFile(prevFile, { addToNav: false });
    }
  }, [navigation, openFile]);

  const handleForward = useCallback(() => {
    const nextFile = navigation.goForward();
    if (nextFile) {
      openFile(nextFile, { addToNav: false });
    }
  }, [navigation, openFile]);

  const normalizeId = (id) => {
    // Remove the # and normalize the ID the same way Rust does
    return id
      .replace(/^#/, '')
      .toLowerCase()
      .replace(/[^a-z0-9\-_\s]/g, ' ')
      .trim()
      .replace(/\s+/g, '-');
  };

  const handleLinkClick = async (href) => {
    if (!currentFile) return;

    // Handle anchor links (same page)
    if (href.startsWith("#")) {
      const normalizedId = normalizeId(href);
      const element = document.getElementById(normalizedId);
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "start" });
      } else {
        console.warn(`Element with id "${normalizedId}" not found`);
      }
      return;
    }

    // Handle relative file links
    if (!href.startsWith("http://") && !href.startsWith("https://")) {
      try {
        const resolvedPath = await invoke("resolve_file_path", {
          basePath: currentFile,
          relativePath: href,
        });
        // Clicking links in the document = navigation, not root file
        openFile(resolvedPath, { isRootFile: false, addToRecent: false });
      } catch (err) {
        console.error("Failed to resolve link:", err);
        setError(`Failed to open link: ${href}`);
      }
    }
  };

  useEffect(() => {
    const unlistenFileToOpen = listen("file-to-open", (event) => {
      // Opening from CLI = root file
      openFile(event.payload, { isRootFile: true });
    });

    const unlistenMenuOpen = listen("menu-open-file", async () => {
      // Menu triggered open - show file picker
      const { open } = await import("@tauri-apps/plugin-dialog");
      const selected = await open({
        multiple: false,
        filters: [
          {
            name: "Markdown",
            extensions: ["md", "markdown"],
          },
        ],
      });

      if (selected) {
        openFile(selected, { isRootFile: true });
      }
    });

    return () => {
      unlistenFileToOpen.then((fn) => fn());
      unlistenMenuOpen.then((fn) => fn());
    };
  }, [openFile]);

  // Drag and drop file opening using Tauri's event system
  useEffect(() => {
    console.log('Setting up file drop listeners...');
    
    let unlistenDrop;
    let unlistenHover;
    let unlistenCancel;
    
    const setupFileDrop = async () => {
      console.log('Inside setupFileDrop function');
      try {
        console.log('About to listen for tauri://file-drop');
        
        // Try multiple possible event names for file drop
        const eventNames = [
          'tauri://file-drop',
          'tauri://drag-drop',
          'window-file-drop',
          'file-drop',
          'tauri://window-file-drop'
        ];
        
        for (const eventName of eventNames) {
          try {
            await listen(eventName, (event) => {
              console.log(`🎉 FILE DROPPED via ${eventName}!`, event);
              setIsDragging(false);
              const paths = Array.isArray(event.payload) ? event.payload : event.payload?.paths;
              if (paths && Array.isArray(paths) && paths.length > 0) {
                const filePath = paths[0];
                console.log('Dropped file path:', filePath);
                if (filePath.endsWith('.md') || filePath.endsWith('.markdown')) {
                  console.log('Opening markdown file...');
                  // Drag-and-drop = root file
                  openFile(filePath, { isRootFile: true });
                }
              }
            });
            console.log(`✓ ${eventName} listener registered`);
          } catch (e) {
            console.log(`✗ ${eventName} failed:`, e.message);
          }
        }
        
        // Try hover events
        const hoverEvents = ['tauri://file-drop-hover', 'tauri://drag-hover', 'file-drop-hover'];
        for (const eventName of hoverEvents) {
          try {
            await listen(eventName, (event) => {
              console.log(`📋 FILE HOVER via ${eventName}!`, event);
              setIsDragging(true);
            });
            console.log(`✓ ${eventName} listener registered`);
          } catch (e) {
            console.log(`✗ ${eventName} failed:`, e.message);
          }
        }
        
        // Try cancel events
        const cancelEvents = ['tauri://file-drop-cancelled', 'tauri://drag-cancelled'];
        for (const eventName of cancelEvents) {
          try {
            await listen(eventName, (event) => {
              console.log(`❌ CANCELLED via ${eventName}!`, event);
              setIsDragging(false);
            });
            console.log(`✓ ${eventName} listener registered`);
          } catch (e) {
            console.log(`✗ ${eventName} failed:`, e.message);
          }
        }
        
        console.log('✅ ALL FILE DROP LISTENERS SETUP COMPLETE');
      } catch (err) {
        console.error('❌ FAILED TO SETUP FILE DROP:', err);
      }
    };
    
    setupFileDrop();
    
    return () => {
      console.log('Cleaning up file drop listeners');
      if (unlistenDrop) unlistenDrop.then(fn => fn());
      if (unlistenHover) unlistenHover.then(fn => fn());
      if (unlistenCancel) unlistenCancel.then(fn => fn());
    };
  }, [openFile]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event) => {
      // Cmd/Ctrl + S: Save file
      if ((event.metaKey || event.ctrlKey) && event.key === 's') {
        event.preventDefault();
        if (isDirty && isEditMode) {
          handleSave();
        }
      }
      
      // Cmd/Ctrl + E: Toggle edit mode
      if ((event.metaKey || event.ctrlKey) && event.key === 'e') {
        event.preventDefault();
        if (currentFile) {
          toggleEditMode();
        }
      }
      
      // Cmd/Ctrl + P: Toggle split view
      if ((event.metaKey || event.ctrlKey) && event.key === 'p') {
        event.preventDefault();
        if (isEditMode) {
          toggleSplitView();
        }
      }
      
      // Cmd/Ctrl + \ : Toggle sidebar (only when not in edit mode to avoid conflict with Bold)
      if ((event.metaKey || event.ctrlKey) && event.key === '\\') {
        event.preventDefault();
        setSidebarOpen(!sidebarOpen);
      }
      
      // Cmd/Ctrl + T: Toggle theme
      if ((event.metaKey || event.ctrlKey) && event.key === 't') {
        event.preventDefault();
        toggleTheme();
      }
      
      // Cmd/Ctrl + [: Go back
      if ((event.metaKey || event.ctrlKey) && event.key === '[') {
        event.preventDefault();
        if (navigation.canGoBack) {
          handleBack();
        }
      }
      
      // Cmd/Ctrl + ]: Go forward
      if ((event.metaKey || event.ctrlKey) && event.key === ']') {
        event.preventDefault();
        if (navigation.canGoForward) {
          handleForward();
        }
      }
      
      // Cmd/Ctrl + F: Search
      if ((event.metaKey || event.ctrlKey) && event.key === 'f') {
        event.preventDefault();
        if (currentFile && !isEditMode) {
          setSearchOpen(!searchOpen);
        }
      }
      
      // Cmd/Ctrl + ,: Settings
      if ((event.metaKey || event.ctrlKey) && event.key === ',') {
        event.preventDefault();
        setSettingsOpen(!settingsOpen);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isDirty, isEditMode, isSplitView, currentFile, sidebarOpen, navigation, theme]);

  return (
    <div className={`app ${isDragging ? 'dragging' : ''}`}>
      <SearchBar 
        isOpen={searchOpen}
        onClose={() => setSearchOpen(false)}
        content={fileContent}
      />
      
      <Settings 
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        theme={theme}
        onToggleTheme={toggleTheme}
      />
      
      <div className="app-body">
        <Sidebar 
          isOpen={sidebarOpen}
          recentFiles={recentFiles}
          linkedDocs={linkedDocs}
          isLoadingLinked={isLoadingLinked}
          currentFile={currentFile}
          onFileSelect={openFile}
          onClose={() => setSidebarOpen(false)}
        />

        <div className="app-main">
          <Toolbar 
            currentFile={currentFile} 
            onOpenFile={openFile}
            theme={theme}
            onToggleTheme={toggleTheme}
            canGoBack={navigation.canGoBack}
            canGoForward={navigation.canGoForward}
            onBack={handleBack}
            onForward={handleForward}
            onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
            sidebarOpen={sidebarOpen}
            isEditMode={isEditMode}
            onToggleEdit={toggleEditMode}
            isSplitView={isSplitView}
            onToggleSplit={toggleSplitView}
            isDirty={isDirty}
            onSave={handleSave}
            onOpenSettings={() => setSettingsOpen(true)}
          />

          <main
            ref={mainContentRef}
            className={`main-content ${isSplitView && isEditMode ? "split-view" : ""} ${isResizingSplit ? "resizing" : ""}`}
          >
            {isLoading ? (
              <div className="loading">Loading...</div>
          ) : error ? (
            <div className="error">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
              <h2>Error</h2>
              <p>{error}</p>
              <button className="error-dismiss" onClick={() => setError(null)}>
                Dismiss
              </button>
            </div>
            ) : currentFile ? (
              <>
                {isEditMode && (
                  <div
                    className="split-panel editor-panel"
                    style={isSplitView ? { width: `${splitPosition}%` } : {}}
                  >
                    <Editor
                      ref={editorRef}
                      content={editedContent}
                      onChange={handleEditorChange}
                      onSave={handleSave}
                      theme={theme}
                      onScroll={isSplitView ? handleEditorScroll : null}
                    />
                  </div>
                )}
                {isSplitView && isEditMode && (
                  <div
                    className="split-resize-handle"
                    style={{ left: `calc(${splitPosition}% - 4px)` }}
                    onMouseDown={handleSplitResizeStart}
                  />
                )}
                {(!isEditMode || isSplitView) && (
                  <div
                    className="split-panel viewer-panel"
                    style={isSplitView ? { width: `${100 - splitPosition}%` } : {}}
                  >
                    <Viewer
                      ref={viewerRef}
                      htmlContent={htmlContent}
                      onLinkClick={handleLinkClick}
                      currentFile={currentFile}
                      onScroll={isSplitView ? handleViewerScroll : null}
                    />
                  </div>
                )}
              </>
            ) : (
              <EmptyState onOpenFile={openFile} />
            )}
          </main>
        </div>
      </div>
    </div>
  );
}

export default App;

