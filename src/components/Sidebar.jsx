import "./Sidebar.css";

function Sidebar({ isOpen, recentFiles, currentFile, onFileSelect, onClose }) {
  const getFileName = (path) => {
    if (!path) return "";
    const parts = path.split(/[/\\]/);
    return parts[parts.length - 1];
  };

  const getDirectory = (path) => {
    if (!path) return "";
    const parts = path.split(/[/\\]/);
    return parts.slice(0, -1).join("/");
  };

  return (
    <>
      {isOpen && <div className="sidebar-overlay" onClick={onClose} />}
      
      <aside className={`sidebar ${isOpen ? "open" : ""}`}>
        <div className="sidebar-header">
          <h2>Recent Files</h2>
          <button className="sidebar-close" onClick={onClose}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <div className="sidebar-content">
          {recentFiles.length === 0 ? (
            <div className="sidebar-empty">
              <p>No recent files</p>
              <span>Open a markdown file to get started</span>
            </div>
          ) : (
            <ul className="recent-files-list">
              {recentFiles.map((file, index) => (
                <li 
                  key={index}
                  className={file === currentFile ? "active" : ""}
                  onClick={() => {
                    onFileSelect(file);
                    onClose();
                  }}
                  title={file}
                >
                  <div className="file-info">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path>
                      <polyline points="13 2 13 9 20 9"></polyline>
                    </svg>
                    <div className="file-details">
                      <span className="file-name">{getFileName(file)}</span>
                      <span className="file-path">{getDirectory(file)}</span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </aside>
    </>
  );
}

export default Sidebar;

