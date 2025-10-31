import { useState, useEffect, useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";

export function useLinkedDocs(currentFilePath) {
  const [linkedDocs, setLinkedDocs] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const discoverLinks = useCallback(async (filePath) => {
    if (!filePath) {
      setLinkedDocs([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Discover linked documents with max depth of 2
      const discovered = await invoke("discover_linked_documents", {
        rootPath: filePath,
        maxDepth: 2,
      });

      setLinkedDocs(discovered || []);
    } catch (err) {
      console.error("Failed to discover linked documents:", err);
      setError(err.toString());
      setLinkedDocs([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Discover links when the current file changes
  useEffect(() => {
    discoverLinks(currentFilePath);
  }, [currentFilePath, discoverLinks]);

  return {
    linkedDocs,
    isLoading,
    error,
    refresh: () => discoverLinks(currentFilePath),
  };
}

