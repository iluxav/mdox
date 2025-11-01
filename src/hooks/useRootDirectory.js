import { useState, useEffect, useCallback } from 'react';
import { open } from '@tauri-apps/plugin-dialog';

const ROOT_DIR_KEY = 'mdox-root-directory';

export function useRootDirectory() {
  const [rootDirectory, setRootDirectory] = useState(() => {
    return localStorage.getItem(ROOT_DIR_KEY) || null;
  });

  useEffect(() => {
    if (rootDirectory) {
      localStorage.setItem(ROOT_DIR_KEY, rootDirectory);
    } else {
      localStorage.removeItem(ROOT_DIR_KEY);
    }
  }, [rootDirectory]);

  const selectRootDirectory = useCallback(async () => {
    try {
      const selected = await open({
        directory: true,
        multiple: false,
        title: 'Select Root Directory for Documents',
      });

      if (selected) {
        setRootDirectory(selected);
        return selected;
      }
      return null;
    } catch (error) {
      console.error('Failed to select directory:', error);
      return null;
    }
  }, []);

  const clearRootDirectory = useCallback(() => {
    setRootDirectory(null);
  }, []);

  return {
    rootDirectory,
    setRootDirectory,
    selectRootDirectory,
    clearRootDirectory,
  };
}
