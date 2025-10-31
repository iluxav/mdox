import { useEffect, useState, useCallback, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { useTheme } from "./hooks/useTheme";
import { useNavigation } from "./hooks/useNavigation";
import { useRecentFiles } from "./hooks/useRecentFiles";
import Viewer from "./components/Viewer";
import Editor from "./components/Editor";
import Toolbar from "./components/Toolbar";
import EmptyState from "./components/EmptyState";
import Sidebar from "./components/Sidebar";
import "./App.css";

function App() {
  const { theme, toggleTheme } = useTheme();
  const navigation = useNavigation();
  const { recentFiles, addRecentFile } = useRecentFiles();
  
  const [currentFile, setCurrentFile] = useState(null);
  const [fileContent, setFileContent] = useState("");
  const [editedContent, setEditedContent] = useState("");
  const [htmlContent, setHtmlContent] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isSplitView, setIsSplitView] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  
  const viewerRef = useRef(null);
  const editorRef = useRef(null);
  const editorScrollingRef = useRef(false);
  const viewerScrollingRef = useRef(false);

  const openFile = async (filePath, addToNav = true) => {
    if (!filePath) return;

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
      
      if (addToNav) {
        navigation.addToHistory(filePath);
      }
      addRecentFile(filePath);
    } catch (err) {
      setError(err);
      console.error("Error opening file:", err);
    } finally {
      setIsLoading(false);
    }
  };

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
    } catch (err) {
      console.error("Error parsing markdown:", err);
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
    } catch (err) {
      setError(`Failed to save file: ${err}`);
      console.error("Error saving file:", err);
    }
  };

  const toggleEditMode = () => {
    if (!currentFile) return;
    setIsEditMode(!isEditMode);
  };

  const toggleSplitView = () => {
    setIsSplitView(!isSplitView);
  };

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

  const handleBack = () => {
    const prevFile = navigation.goBack();
    if (prevFile) {
      openFile(prevFile, false);
    }
  };

  const handleForward = () => {
    const nextFile = navigation.goForward();
    if (nextFile) {
      openFile(nextFile, false);
    }
  };

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
        openFile(resolvedPath);
      } catch (err) {
        console.error("Failed to resolve link:", err);
        setError(`Failed to open link: ${href}`);
      }
    }
  };

  useEffect(() => {
    const unlisten = listen("file-to-open", (event) => {
      openFile(event.payload);
    });

    return () => {
      unlisten.then((fn) => fn());
    };
  }, []);

  return (
    <div className="app">
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
      />

      <div className="app-body">
        <Sidebar 
          isOpen={sidebarOpen}
          recentFiles={recentFiles}
          currentFile={currentFile}
          onFileSelect={openFile}
          onClose={() => setSidebarOpen(false)}
        />

        <main className={`main-content ${isSplitView && isEditMode ? "split-view" : ""}`}>
          {isLoading ? (
            <div className="loading">Loading...</div>
          ) : error ? (
            <div className="error">
              <h2>Error</h2>
              <p>{error}</p>
            </div>
          ) : currentFile ? (
            <>
              {isEditMode && (
                <Editor 
                  ref={editorRef}
                  content={editedContent}
                  onChange={handleEditorChange}
                  onSave={handleSave}
                  theme={theme}
                  onScroll={isSplitView ? handleEditorScroll : null}
                />
              )}
              {(!isEditMode || isSplitView) && (
                <Viewer 
                  ref={viewerRef}
                  htmlContent={htmlContent} 
                  onLinkClick={handleLinkClick}
                  currentFile={currentFile}
                  onScroll={isSplitView ? handleViewerScroll : null}
                />
              )}
            </>
          ) : (
            <EmptyState onOpenFile={openFile} />
          )}
        </main>
      </div>
    </div>
  );
}

export default App;

