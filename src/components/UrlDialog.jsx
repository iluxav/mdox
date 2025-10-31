import { memo, useState, useEffect, useRef } from "react";
import "./UrlDialog.css";

const UrlDialog = memo(function UrlDialog({ isOpen, onClose, onSubmit }) {
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");
  const inputRef = useRef(null);

  // Ensure input is focused when dialog opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      // Use setTimeout to ensure focus happens after render
      setTimeout(() => {
        inputRef.current?.focus();
      }, 10);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!url.trim()) {
      setError("Please enter a URL");
      return;
    }

    // Basic URL validation
    try {
      new URL(url);
    } catch {
      setError("Please enter a valid URL");
      return;
    }

    onSubmit(url);
    setUrl("");
    setError("");
  };

  const handleClose = () => {
    setUrl("");
    setError("");
    onClose();
  };

  const handleKeyDown = (e) => {
    if (e.key === "Escape") {
      handleClose();
    }
  };

  return (
    <>
      <div className="url-dialog-overlay" onClick={handleClose} />
      <div className="url-dialog">
        <div className="url-dialog-header">
          <h2>Open from URL</h2>
          <button className="url-dialog-close" onClick={handleClose}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="url-dialog-content">
          <div className="url-input-group">
            <label htmlFor="url-input">Markdown File URL</label>
            <input
              ref={inputRef}
              id="url-input"
              type="text"
              value={url}
              onChange={(e) => {
                setUrl(e.target.value);
                setError("");
              }}
              onKeyDown={handleKeyDown}
              placeholder="https://raw.githubusercontent.com/user/repo/main/README.md"
              autoFocus
            />
            {error && <div className="url-error">{error}</div>}
          </div>

          <div className="url-dialog-hint">
            <p><strong>Supported URLs:</strong></p>
            <ul>
              <li>Direct raw markdown files (e.g., raw.githubusercontent.com)</li>
              <li>GitHub repository URLs (e.g., github.com/username/repo)</li>
            </ul>
          </div>

          <div className="url-dialog-actions">
            <button type="button" onClick={handleClose} className="url-btn-cancel">
              Cancel
            </button>
            <button type="submit" className="url-btn-open">
              Open
            </button>
          </div>
        </form>
      </div>
    </>
  );
});

export default UrlDialog;
