import { useEffect, useRef, useImperativeHandle, forwardRef } from "react";
import { EditorView, keymap } from "@codemirror/view";
import { EditorState } from "@codemirror/state";
import { defaultKeymap, indentWithTab, insertTab } from "@codemirror/commands";
import { markdown } from "@codemirror/lang-markdown";
import { oneDark } from "@codemirror/theme-one-dark";
import { autocompletion, closeBrackets, closeBracketsKeymap } from "@codemirror/autocomplete";
import "./Editor.css";

const Editor = forwardRef(({ content, onChange, onSave, theme, onScroll }, ref) => {
  const editorRef = useRef(null);
  const viewRef = useRef(null);
  const scrollTimeoutRef = useRef(null);
  const onChangeRef = useRef(onChange);
  const onSaveRef = useRef(onSave);
  const onScrollRef = useRef(onScroll);

  // Keep refs updated
  useEffect(() => {
    onChangeRef.current = onChange;
    onSaveRef.current = onSave;
    onScrollRef.current = onScroll;
  }, [onChange, onSave, onScroll]);

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

    // Markdown shortcuts helper
    const wrapSelection = (view, before, after = before) => {
      const { state } = view;
      const { from, to } = state.selection.main;
      const selectedText = state.sliceDoc(from, to);

      view.dispatch({
        changes: { from, to, insert: before + selectedText + after },
        selection: { anchor: from + before.length + selectedText.length + after.length }
      });

      return true;
    };

    const insertPrefix = (view, prefix) => {
      const { state } = view;
      const line = state.doc.lineAt(state.selection.main.from);

      view.dispatch({
        changes: { from: line.from, insert: prefix }
      });

      return true;
    };

    const extensions = [
      markdown(),
      autocompletion(),
      closeBrackets(),
      keymap.of([
        ...closeBracketsKeymap,
        ...defaultKeymap,
        indentWithTab,
        {
          key: "Mod-s",
          run: () => {
            onSaveRef.current();
            return true;
          },
        },
        // Markdown shortcuts
        { key: "Mod-b", run: (view) => wrapSelection(view, "**") }, // Bold
        { key: "Mod-i", run: (view) => wrapSelection(view, "*") },  // Italic
        { key: "Mod-k", run: (view) => wrapSelection(view, "[", "](url)") }, // Link
        { key: "Mod-`", run: (view) => wrapSelection(view, "`") },  // Inline code
        { key: "Mod-Shift-c", run: (view) => wrapSelection(view, "```\n", "\n```") }, // Code block
        { key: "Mod-Shift-l", run: (view) => insertPrefix(view, "- ") }, // List item
        { key: "Mod-Shift-1", run: (view) => insertPrefix(view, "# ") },   // H1
        { key: "Mod-Shift-2", run: (view) => insertPrefix(view, "## ") },  // H2
        { key: "Mod-Shift-3", run: (view) => insertPrefix(view, "### ") }, // H3
      ]),
      EditorView.updateListener.of((update) => {
        if (update.docChanged) {
          onChangeRef.current(update.state.doc.toString());
        }
      }),
      EditorView.domEventHandlers({
        scroll: (event, view) => {
          if (onScrollRef.current && scrollTimeoutRef.current === null) {
            const scroller = view.scrollDOM;
            const scrollPercentage = scroller.scrollTop / (scroller.scrollHeight - scroller.clientHeight);

            scrollTimeoutRef.current = setTimeout(() => {
              scrollTimeoutRef.current = null;
            }, 50);

            onScrollRef.current(scrollPercentage);
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
  }, [theme]); // Only recreate when theme changes

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

