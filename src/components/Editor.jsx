import { useEffect, useRef, useImperativeHandle, forwardRef } from "react";
import { EditorView, keymap } from "@codemirror/view";
import { EditorState } from "@codemirror/state";
import { defaultKeymap, indentWithTab } from "@codemirror/commands";
import { markdown } from "@codemirror/lang-markdown";
import { oneDark } from "@codemirror/theme-one-dark";
import "./Editor.css";

const Editor = forwardRef(({ content, onChange, onSave, theme, onScroll }, ref) => {
  const editorRef = useRef(null);
  const viewRef = useRef(null);
  const scrollTimeoutRef = useRef(null);

  useImperativeHandle(ref, () => ({
    scrollToPercentage: (percentage) => {
      if (viewRef.current && scrollTimeoutRef.current === null) {
        const scroller = viewRef.current.scrollDOM;
        const maxScroll = scroller.scrollHeight - scroller.clientHeight;
        scroller.scrollTop = maxScroll * percentage;
      }
    },
  }));

  useEffect(() => {
    if (!editorRef.current) return;

    const extensions = [
      markdown(),
      keymap.of([
        ...defaultKeymap,
        indentWithTab,
        {
          key: "Mod-s",
          run: () => {
            onSave();
            return true;
          },
        },
      ]),
      EditorView.updateListener.of((update) => {
        if (update.docChanged) {
          onChange(update.state.doc.toString());
        }
      }),
      EditorView.domEventHandlers({
        scroll: (event, view) => {
          if (onScroll && scrollTimeoutRef.current === null) {
            const scroller = view.scrollDOM;
            const scrollPercentage = scroller.scrollTop / (scroller.scrollHeight - scroller.clientHeight);
            
            scrollTimeoutRef.current = setTimeout(() => {
              scrollTimeoutRef.current = null;
            }, 50);
            
            onScroll(scrollPercentage);
          }
        },
      }),
    ];

    if (theme === "dark") {
      extensions.push(oneDark);
    }

    const startState = EditorState.create({
      doc: content,
      extensions,
    });

    const view = new EditorView({
      state: startState,
      parent: editorRef.current,
    });

    viewRef.current = view;

    return () => {
      view.destroy();
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, [theme, onScroll]); // Only recreate when theme or scroll handler changes

  // Update content when it changes externally
  useEffect(() => {
    if (viewRef.current && content !== viewRef.current.state.doc.toString()) {
      viewRef.current.dispatch({
        changes: {
          from: 0,
          to: viewRef.current.state.doc.length,
          insert: content,
        },
      });
    }
  }, [content]);

  return <div className="editor" ref={editorRef} />;
});

Editor.displayName = "Editor";

export default Editor;

