import { useState, useCallback } from "react";

export function useNavigation() {
  const [history, setHistory] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(-1);

  const canGoBack = currentIndex > 0;
  const canGoForward = currentIndex < history.length - 1;

  const addToHistory = useCallback((filePath) => {
    setHistory((prev) => {
      // Remove any forward history when navigating to a new file
      const newHistory = prev.slice(0, currentIndex + 1);
      // Don't add duplicate if it's the same as current
      if (newHistory[newHistory.length - 1] === filePath) {
        return prev;
      }
      return [...newHistory, filePath];
    });
    setCurrentIndex((prev) => prev + 1);
  }, [currentIndex]);

  const goBack = useCallback(() => {
    if (canGoBack) {
      setCurrentIndex((prev) => prev - 1);
      return history[currentIndex - 1];
    }
    return null;
  }, [canGoBack, currentIndex, history]);

  const goForward = useCallback(() => {
    if (canGoForward) {
      setCurrentIndex((prev) => prev + 1);
      return history[currentIndex + 1];
    }
    return null;
  }, [canGoForward, currentIndex, history]);

  const getCurrentFile = useCallback(() => {
    return history[currentIndex] || null;
  }, [history, currentIndex]);

  return {
    addToHistory,
    goBack,
    goForward,
    canGoBack,
    canGoForward,
    getCurrentFile,
    history,
  };
}

