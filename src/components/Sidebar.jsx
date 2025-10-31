import { memo, useState, useRef, useEffect } from "react";
import "./Sidebar.css";

const Sidebar = memo(function Sidebar({
  isOpen,
  recentFiles,
  linkedDocs,
  isLoadingLinked,
  currentFile,
  displayUrl,
  onFileSelect,
  onRemoveRecent,
  onClose
}) {
  const [activeTab, setActiveTab] = useState("recent");
  const [width, setWidth] = useState(260);
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef(null);

  const getFileName = (path) => {
    if (!path) return "";

    // Check if it's a GitHub repo URL pattern
    const githubRepoPattern = /^https?:\/\/github\.com\/([^/]+)\/([^/]+?)(\.git)?$/;
    const match = path.match(githubRepoPattern);

    if (match) {
      const repoName = match[2];
      return `${repoName} - README.md`;
    }

    // Otherwise extract filename normally
    const parts = path.split(/[/\\]/);
    return parts[parts.length - 1];
  };

  const getDirectory = (path) => {
    if (!path) return "";

    // Check if it's a GitHub repo URL pattern
    const githubRepoPattern = /^https?:\/\/github\.com\/([^/]+)\/([^/]+?)(\.git)?$/;
    const match = path.match(githubRepoPattern);

    if (match) {
      const username = match[1];
      return `github.com/${username}`;
    }

    // For other URLs, show the domain
    if (path.startsWith('http://') || path.startsWith('https://')) {
      try {
        const url = new URL(path);
        return url.hostname;
      } catch {
        return "";
      }
    }

    // For local files, extract directory path
    const parts = path.split(/[/\\]/);
    return parts.slice(0, -1).join("/");
  };

  // Helper to check if a file is the currently active file
  // For remote files, compare against displayUrl; for local files, compare against currentFile
  const isActiveFile = (filePath) => {
    if (!currentFile) return false;

    // Direct match with currentFile (for local files or raw URLs)
    if (filePath === currentFile) return true;

    // For remote files, also check against displayUrl (the original repo URL)
    if (displayUrl && filePath === displayUrl) return true;

    return false;
  };

  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e) => {
      const newWidth = e.clientX;
      if (newWidth >= 200 && newWidth <= 600) {
        setWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isResizing]);

  const handleResizeStart = (e) => {
    e.preventDefault();
    setIsResizing(true);
  };

  return (
    <aside
      ref={sidebarRef}
      className={`sidebar ${isOpen ? "open" : ""} ${isResizing ? "resizing" : ""}`}
      style={isOpen ? { width: `${width}px`, minWidth: `${width}px` } : {}}
    >
      <div className="sidebar-header">
        <div className="sidebar-tabs">
          <button 
            className={`sidebar-tab ${activeTab === "recent" ? "active" : ""}`}
            onClick={() => setActiveTab("recent")}
          >
            Recent
          </button>
          <button 
            className={`sidebar-tab ${activeTab === "linked" ? "active" : ""}`}
            onClick={() => setActiveTab("linked")}
          >
            Linked
          </button>
        </div>
        <button className="sidebar-close" onClick={onClose}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>

      <div className="sidebar-content">
        {activeTab === "recent" && (
          <>
            {recentFiles.length === 0 ? (
              <div className="sidebar-empty">
                <p>No recent files</p>
                <span>Open a markdown file to get started</span>
              </div>
            ) : (
              <ul className="file-list">
                {recentFiles.map((file, index) => (
                  <li
                    key={index}
                    className={isActiveFile(file) ? "active" : ""}
                    title={file}
                  >
                    <div className="file-info" onClick={() => onFileSelect(file, { isRootFile: true })}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path>
                        <polyline points="13 2 13 9 20 9"></polyline>
                      </svg>
                      <div className="file-details">
                        <span className="file-name">{getFileName(file)}</span>
                        <span className="file-path">{getDirectory(file)}</span>
                      </div>
                    </div>
                    <button
                      className="file-remove"
                      onClick={(e) => {
                        e.stopPropagation();
                        onRemoveRecent(file);
                      }}
                      title="Remove from recent files"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                      </svg>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}

        {activeTab === "linked" && (
          <>
            {isLoadingLinked ? (
              <div className="sidebar-loading">
                <div className="spinner"></div>
                <p>Discovering linked documents...</p>
              </div>
            ) : linkedDocs.length === 0 ? (
              <div className="sidebar-empty">
                <p>No linked documents</p>
                <span>This file doesn't link to other markdown files</span>
              </div>
            ) : (
              <ul className="file-list">
                {linkedDocs.map((doc, index) => (
                  <li 
                    key={index}
                    className={doc.path === currentFile ? "active" : ""}
                    onClick={() => onFileSelect(doc.path, { isRootFile: false, addToRecent: false })}
                    title={doc.path}
                  >
                    <div className="file-info">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
                        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
                      </svg>
                      <div className="file-details">
                        <span className="file-name">{doc.title}</span>
                        <span className="file-path">{getDirectory(doc.path)}</span>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </div>
      {isOpen && (
        <div
          className="sidebar-resize-handle"
          onMouseDown={handleResizeStart}
        />
      )}
    </aside>
  );
});

export default Sidebar;

