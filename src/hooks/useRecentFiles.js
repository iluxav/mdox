import { useState, useEffect } from "react";

const MAX_RECENT_FILES = 10;
const STORAGE_KEY = "mdox-recent-files";

export function useRecentFiles() {
  const [recentFiles, setRecentFiles] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(recentFiles));
  }, [recentFiles]);

  const addRecentFile = (filePath) => {
    setRecentFiles((prev) => {
      // Remove if already exists
      const filtered = prev.filter((f) => f !== filePath);
      // Add to beginning
      const updated = [filePath, ...filtered];
      // Keep only MAX_RECENT_FILES
      return updated.slice(0, MAX_RECENT_FILES);
    });
  };

  const removeRecentFile = (filePath) => {
    setRecentFiles((prev) => prev.filter((f) => f !== filePath));
  };

  const clearRecentFiles = () => {
    setRecentFiles([]);
  };

  return { recentFiles, addRecentFile, removeRecentFile, clearRecentFiles };
}

