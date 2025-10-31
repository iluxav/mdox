import { memo } from "react";
import { open } from "@tauri-apps/plugin-dialog";
import "./EmptyState.css";

const EmptyState = memo(function EmptyState({ onOpenFile }) {
  const handleOpenFile = async () => {
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
      onOpenFile(selected);
    }
  };

  return (
    <div className="empty-state">
      <div className="empty-content">
        <div className="icon">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path>
            <polyline points="13 2 13 9 20 9"></polyline>
          </svg>
        </div>

        <h1>Welcome to mdox</h1>
        <p>A blazingly fast Markdown viewer</p>

        <button className="open-btn" onClick={handleOpenFile}>
          Open Markdown File
        </button>

        <div className="hint">
          <p>Or use the command line:</p>
          <code>mdox README.md</code>
        </div>
      </div>
    </div>
  );
});

export default EmptyState;

