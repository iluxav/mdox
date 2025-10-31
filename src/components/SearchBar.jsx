import { useState, useEffect, useRef, useCallback } from "react";
import "./SearchBar.css";

function SearchBar({ isOpen, onClose, content }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentMatch, setCurrentMatch] = useState(0);
  const [totalMatches, setTotalMatches] = useState(0);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isOpen]);

  useEffect(() => {
    if (!searchTerm || !content) {
      setTotalMatches(0);
      setCurrentMatch(0);
      return;
    }

    // Find matches (just count them, don't highlight yet)
    const text = content.toLowerCase();
    const search = searchTerm.toLowerCase();
    const matches = [];
    let index = text.indexOf(search);
    
    while (index !== -1) {
      matches.push(index);
      index = text.indexOf(search, index + 1);
    }

    setTotalMatches(matches.length);
    if (matches.length > 0) {
      setCurrentMatch(1);
    }
  }, [searchTerm, content]);

  const performSearch = useCallback((backwards = false) => {
    if (!searchTerm || totalMatches === 0) return;
    
    // Use browser's find functionality
    if (window.find) {
      window.find(searchTerm, false, backwards, false, false, true, false);
    }
  }, [searchTerm, totalMatches]);

  const handleNext = () => {
    if (totalMatches === 0) return;
    const next = currentMatch >= totalMatches ? 1 : currentMatch + 1;
    setCurrentMatch(next);
    performSearch(false);
  };

  const handlePrevious = () => {
    if (totalMatches === 0) return;
    const prev = currentMatch <= 1 ? totalMatches : currentMatch - 1;
    setCurrentMatch(prev);
    performSearch(true);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (e.shiftKey) {
        handlePrevious();
      } else {
        handleNext();
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };
  
  // Auto-search on first match when user stops typing
  useEffect(() => {
    if (searchTerm && totalMatches > 0) {
      const timer = setTimeout(() => {
        performSearch(false);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [searchTerm, totalMatches, performSearch]);

  if (!isOpen) return null;

  return (
    <div className="search-bar">
      <div className="search-input-wrapper">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="8"></circle>
          <path d="m21 21-4.35-4.35"></path>
        </svg>
        <input
          ref={inputRef}
          type="text"
          className="search-input"
          placeholder="Find in document..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        {searchTerm && (
          <span className="search-results">
            {totalMatches > 0 ? `${currentMatch}/${totalMatches}` : 'No results'}
          </span>
        )}
      </div>
      
      <div className="search-controls">
        <button 
          className="search-btn" 
          onClick={handlePrevious}
          disabled={totalMatches === 0}
          title="Previous (Shift+Enter)"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="15 18 9 12 15 6"></polyline>
          </svg>
        </button>
        <button 
          className="search-btn" 
          onClick={handleNext}
          disabled={totalMatches === 0}
          title="Next (Enter)"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="9 18 15 12 9 6"></polyline>
          </svg>
        </button>
        <button 
          className="search-btn search-close" 
          onClick={onClose}
          title="Close (Esc)"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>
    </div>
  );
}

export default SearchBar;

