import { memo } from "react";
import "./Settings.css";

const Settings = memo(function Settings({ isOpen, onClose, theme, onToggleTheme }) {
  if (!isOpen) return null;

  return (
    <>
      <div className="settings-overlay" onClick={onClose} />
      <div className="settings-modal">
        <div className="settings-header">
          <h2>Settings</h2>
          <button className="settings-close" onClick={onClose}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <div className="settings-content">
          <div className="settings-section">
            <h3>Appearance</h3>
            <div className="setting-item">
              <div className="setting-info">
                <label>Theme</label>
                <span className="setting-description">Switch between light and dark mode</span>
              </div>
              <button className="setting-toggle" onClick={onToggleTheme}>
                {theme === 'light' ? (
                  <>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
                    </svg>
                    Dark
                  </>
                ) : (
                  <>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="5"></circle>
                      <line x1="12" y1="1" x2="12" y2="3"></line>
                      <line x1="12" y1="21" x2="12" y2="23"></line>
                      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                      <line x1="1" y1="12" x2="3" y2="12"></line>
                      <line x1="21" y1="12" x2="23" y2="12"></line>
                      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
                      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
                    </svg>
                    Light
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="settings-section">
            <h3>Keyboard Shortcuts</h3>

            <h4 className="shortcuts-category">General</h4>
            <div className="shortcuts-list">
              <div className="shortcut-item">
                <span>Toggle Theme</span>
                <kbd>Ctrl/Cmd + T</kbd>
              </div>
              <div className="shortcut-item">
                <span>Toggle Sidebar</span>
                <kbd>Ctrl/Cmd + \</kbd>
              </div>
              <div className="shortcut-item">
                <span>Toggle Edit Mode</span>
                <kbd>Ctrl/Cmd + E</kbd>
              </div>
              <div className="shortcut-item">
                <span>Toggle Split View</span>
                <kbd>Ctrl/Cmd + P</kbd>
              </div>
              <div className="shortcut-item">
                <span>Search</span>
                <kbd>Ctrl/Cmd + F</kbd>
              </div>
              <div className="shortcut-item">
                <span>Save File</span>
                <kbd>Ctrl/Cmd + S</kbd>
              </div>
              <div className="shortcut-item">
                <span>Go Back</span>
                <kbd>Ctrl/Cmd + [</kbd>
              </div>
              <div className="shortcut-item">
                <span>Go Forward</span>
                <kbd>Ctrl/Cmd + ]</kbd>
              </div>
            </div>

            <h4 className="shortcuts-category">Markdown Editing (Edit Mode Only)</h4>
            <div className="shortcuts-list">
              <div className="shortcut-item">
                <span>Bold</span>
                <kbd>Ctrl/Cmd + B</kbd>
              </div>
              <div className="shortcut-item">
                <span>Italic</span>
                <kbd>Ctrl/Cmd + I</kbd>
              </div>
              <div className="shortcut-item">
                <span>Insert Link</span>
                <kbd>Ctrl/Cmd + K</kbd>
              </div>
              <div className="shortcut-item">
                <span>Inline Code</span>
                <kbd>Ctrl/Cmd + `</kbd>
              </div>
              <div className="shortcut-item">
                <span>Code Block</span>
                <kbd>Ctrl/Cmd + Shift + C</kbd>
              </div>
              <div className="shortcut-item">
                <span>List Item</span>
                <kbd>Ctrl/Cmd + Shift + L</kbd>
              </div>
              <div className="shortcut-item">
                <span>Heading 1</span>
                <kbd>Ctrl/Cmd + Shift + 1</kbd>
              </div>
              <div className="shortcut-item">
                <span>Heading 2</span>
                <kbd>Ctrl/Cmd + Shift + 2</kbd>
              </div>
              <div className="shortcut-item">
                <span>Heading 3</span>
                <kbd>Ctrl/Cmd + Shift + 3</kbd>
              </div>
            </div>
          </div>

          <div className="settings-section">
            <h3>About</h3>
            <div className="about-info">
              <h4>mdox</h4>
              <p>A blazingly fast Markdown viewer and editor</p>
              <p className="version">Version 0.1.0</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
});

export default Settings;

