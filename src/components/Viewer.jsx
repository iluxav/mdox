import { useEffect, useRef, useImperativeHandle, forwardRef } from "react";
import { convertFileSrc } from "@tauri-apps/api/core";
import hljs from "highlight.js";
import "highlight.js/styles/github-dark.css";
import "../styles/markdown.css";
import "./Viewer.css";

const Viewer = forwardRef(({ htmlContent, onLinkClick, onScroll }, ref) => {
  const contentRef = useRef(null);
  const viewerRef = useRef(null);
  const scrollTimeoutRef = useRef(null);
  const onScrollRef = useRef(onScroll);
  const onLinkClickRef = useRef(onLinkClick);

  // Keep refs updated
  useEffect(() => {
    onScrollRef.current = onScroll;
    onLinkClickRef.current = onLinkClick;
  }, [onScroll, onLinkClick]);

  useImperativeHandle(ref, () => ({
    scrollToPercentage: (percentage) => {
      if (viewerRef.current && scrollTimeoutRef.current === null) {
        const maxScroll = viewerRef.current.scrollHeight - viewerRef.current.clientHeight;
        viewerRef.current.scrollTop = maxScroll * percentage;
      }
    },
  }));

  useEffect(() => {
    if (contentRef.current) {
      // Apply syntax highlighting
      const codeBlocks = contentRef.current.querySelectorAll("pre code");
      codeBlocks.forEach((block) => {
        hljs.highlightElement(block);
      });

      // Convert file:// URLs to Tauri asset protocol
      const images = contentRef.current.querySelectorAll("img");
      images.forEach((img) => {
        const src = img.getAttribute("src");
        if (src && src.startsWith("file://")) {
          const filePath = src.replace("file://", "");
          img.src = convertFileSrc(filePath);
        }
      });

      // Handle link clicks
      const links = contentRef.current.querySelectorAll("a");
      links.forEach((link) => {
        link.addEventListener("click", (e) => {
          const href = link.getAttribute("href");

          // Only handle internal links and file links
          if (href && !href.startsWith("http://") && !href.startsWith("https://")) {
            e.preventDefault();
            onLinkClickRef.current(href);
          }
          // External links open in browser (handled by Tauri)
        });
      });

      // Cleanup
      return () => {
        links.forEach((link) => {
          link.removeEventListener("click", () => {});
        });
      };
    }
  }, [htmlContent]);

  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer) return;

    const handleScroll = () => {
      if (onScrollRef.current && scrollTimeoutRef.current === null) {
        const scrollPercentage = viewer.scrollTop / (viewer.scrollHeight - viewer.clientHeight);

        scrollTimeoutRef.current = setTimeout(() => {
          scrollTimeoutRef.current = null;
        }, 50);

        onScrollRef.current(scrollPercentage);
      }
    };

    viewer.addEventListener("scroll", handleScroll);
    return () => {
      viewer.removeEventListener("scroll", handleScroll);
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []); // Only set up once

  return (
    <div className="viewer" ref={viewerRef}>
      <div 
        ref={contentRef}
        className="markdown-content" 
        dangerouslySetInnerHTML={{ __html: htmlContent }} 
      />
    </div>
  );
});

Viewer.displayName = "Viewer";

export default Viewer;

