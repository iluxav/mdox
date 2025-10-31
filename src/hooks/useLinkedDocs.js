import { useState, useEffect, useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";

export function useLinkedDocs(currentFilePath, isRemoteFile = false) {
  const [linkedDocs, setLinkedDocs] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const discoverLinks = useCallback((filePath, isRemote) => {
    if (!filePath) {
      setLinkedDocs([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    // Run discovery in the background (non-blocking)
    const runDiscovery = async () => {
      try {
        let discovered;

        if (isRemote) {
          // Use remote discovery for URLs
          discovered = await invoke("discover_remote_linked_documents", {
            rootUrl: filePath,
            maxDepth: 2,
          });
          // Transform to match the expected format
          discovered = discovered.map(doc => ({
            path: doc.url,
            title: doc.title,
          }));
        } else {
          // Use local discovery for file paths
          discovered = await invoke("discover_linked_documents", {
            rootPath: filePath,
            maxDepth: 2,
          });
        }

        setLinkedDocs(discovered || []);
      } catch (err) {
        console.error("Failed to discover linked documents:", err);
        setError(err.toString());
        setLinkedDocs([]);
      } finally {
        setIsLoading(false);
      }
    };

    // Start discovery in background - don't await it
    runDiscovery();
  }, []);

  // Discover links when the current file changes
  useEffect(() => {
    discoverLinks(currentFilePath, isRemoteFile);
  }, [currentFilePath, isRemoteFile, discoverLinks]);

  return {
    linkedDocs,
    isLoading,
    error,
    refresh: () => discoverLinks(currentFilePath, isRemoteFile),
  };
}

