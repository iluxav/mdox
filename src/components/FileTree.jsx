import { memo, useState, useEffect, useCallback } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { ask } from '@tauri-apps/plugin-dialog';
import InputDialog from './InputDialog';
import './FileTree.css';

const FileTreeItem = memo(function FileTreeItem({
  item,
  level = 0,
  onFileClick,
  onDelete,
  onMove,
  onFolderSelect,
  selectedPath,
  expandedFolders,
  onToggleExpand,
  onContextMenu
}) {
  const [children, setChildren] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [error, setError] = useState(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const isExpanded = expandedFolders.has(item.path);
  const isSelected = selectedPath === item.path;

  const loadChildren = useCallback(async () => {
    if (!item.is_directory || isLoading) return;

    setIsLoading(true);
    setError(null);

    try {
      const entries = await invoke('read_directory', { path: item.path });
      setChildren(entries);
      setHasLoaded(true);
    } catch (err) {
      console.error('Failed to read directory:', err);
      setError(err);
      setHasLoaded(true);
    } finally {
      setIsLoading(false);
    }
  }, [item.path, item.is_directory, isLoading]);

  useEffect(() => {
    if (item.is_directory && isExpanded && !hasLoaded && !isLoading) {
      loadChildren();
    }
  }, [item.is_directory, isExpanded, hasLoaded, isLoading, loadChildren]);

  const handleToggle = useCallback((e) => {
    e.stopPropagation();
    if (item.is_directory) {
      onToggleExpand(item.path);
    }
  }, [item.is_directory, item.path, onToggleExpand]);

  const handleClick = useCallback(() => {
    if (item.is_directory) {
      onFolderSelect(item.path);
      onToggleExpand(item.path);
    } else {
      onFileClick(item.path);
    }
  }, [item.is_directory, item.path, onFileClick, onFolderSelect, onToggleExpand]);

  const handleDelete = useCallback((e) => {
    e.stopPropagation();
    onDelete(item);
  }, [item, onDelete]);

  const handleDragStart = useCallback((e) => {
    e.stopPropagation();
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', JSON.stringify({
      path: item.path,
      name: item.name,
      isDirectory: item.is_directory
    }));
  }, [item]);

  const handleDragEnter = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();

    if (item.is_directory) {
      setIsDragOver(true);
    }
  }, [item.is_directory]);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();

    // Only allow dropping on directories
    if (item.is_directory) {
      e.dataTransfer.dropEffect = 'move';
    } else {
      e.dataTransfer.dropEffect = 'none';
    }
  }, [item.is_directory]);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();

    // Only reset drag over if we're actually leaving this element (not a child)
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;

    if (x < rect.left || x >= rect.right || y < rect.top || y >= rect.bottom) {
      setIsDragOver(false);
    }
  }, []);

  const handleDrop = useCallback(async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    if (!item.is_directory) return;

    try {
      const data = JSON.parse(e.dataTransfer.getData('text/plain'));

      // Don't allow dropping on itself
      if (data.path === item.path) return;

      // Don't allow dropping a folder into its own subfolder
      if (item.path.startsWith(data.path + '/')) {
        await ask('Cannot move a folder into its own subfolder', {
          title: 'Invalid Operation',
          kind: 'warning',
        });
        return;
      }

      const newPath = `${item.path}/${data.name}`;

      // Don't move if it's already in the same location
      if (data.path === newPath) return;

      await onMove(data.path, newPath);
    } catch (err) {
      console.error('Failed to handle drop:', err);
    }
  }, [item, onMove]);

  const handleContextMenu = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    onContextMenu(e, item);
  }, [item, onContextMenu]);

  return (
    <>
      <div
        className={`file-tree-item ${isSelected ? 'selected' : ''} ${isDragOver ? 'drag-over' : ''}`}
        style={{ paddingLeft: `${level * 12  + (item.is_directory ? 0 : 28)}px` }}
        onClick={handleClick}
        onContextMenu={handleContextMenu}
        draggable
        onDragStart={handleDragStart}
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {item.is_directory && (
          <button
            className="expand-button"
            onClick={handleToggle}
            aria-label={isExpanded ? 'Collapse folder' : 'Expand folder'}
          >
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              style={{
                transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
                transition: 'transform 0.2s'
              }}
            >
              <polyline points="9 18 15 12 9 6"></polyline>
            </svg>
          </button>
        )}

        <div className="file-tree-item-icon">
          {item.is_directory ? (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
            </svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path>
              <polyline points="13 2 13 9 20 9"></polyline>
            </svg>
          )}
        </div>

        <span className="file-tree-item-name">{item.name}</span>

        <button
          className="delete-button"
          onClick={handleDelete}
          aria-label="Delete"
          title="Delete"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="3 6 5 6 21 6"></polyline>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
          </svg>
        </button>
      </div>

      {item.is_directory && isExpanded && (
        <div className="file-tree-children">
          {isLoading && (
            <div className="file-tree-loading" style={{ paddingLeft: `${(level + 1) * 12 + 28}px` }}>
              Loading...
            </div>
          )}
          {error && (
            <div className="file-tree-error" style={{ paddingLeft: `${(level + 1) * 12 + 28}px` }}>
              Failed to load
            </div>
          )}
          {!isLoading && !error && children.length === 0 && (
            <div className="file-tree-empty" style={{ paddingLeft: `${(level + 1) * 12 + 28}px` }}>
              Empty folder
            </div>
          )}
          {!isLoading && !error && children.map((child) => (
            <FileTreeItem
              key={child.path}
              item={child}
              level={level + 1}
              onFileClick={onFileClick}
              onDelete={onDelete}
              onMove={onMove}
              onFolderSelect={onFolderSelect}
              selectedPath={selectedPath}
              expandedFolders={expandedFolders}
              onToggleExpand={onToggleExpand}
              onContextMenu={onContextMenu}
            />
          ))}
        </div>
      )}
    </>
  );
});

const FileTree = memo(function FileTree({ rootPath, onFileClick, selectedPath }) {
  const [rootItems, setRootItems] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [expandedFolders, setExpandedFolders] = useState(new Set());
  const [showFileDialog, setShowFileDialog] = useState(false);
  const [showFolderDialog, setShowFolderDialog] = useState(false);
  const [selectedFolder, setSelectedFolder] = useState(null);
  const [contextMenu, setContextMenu] = useState(null);
  const [treeKey, setTreeKey] = useState(0);

  const loadRootDirectory = useCallback(async () => {
    if (!rootPath) {
      setRootItems([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const entries = await invoke('read_directory', { path: rootPath });
      setRootItems(entries);

      // Recursively find all directories and expand them
      const allFolders = new Set();
      const findAllFolders = async (items) => {
        for (const item of items) {
          if (item.is_directory) {
            allFolders.add(item.path);
            try {
              const children = await invoke('read_directory', { path: item.path });
              await findAllFolders(children);
            } catch (err) {
              console.error(`Failed to read directory ${item.path}:`, err);
            }
          }
        }
      };
      await findAllFolders(entries);
      setExpandedFolders(allFolders);
    } catch (err) {
      console.error('Failed to read root directory:', err);
      setError(err);
      setRootItems([]);
    } finally {
      setIsLoading(false);
    }
  }, [rootPath]);

  useEffect(() => {
    loadRootDirectory();
  }, [loadRootDirectory]);

  const handleToggleExpand = useCallback((path) => {
    setExpandedFolders((prev) => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  }, []);

  const handleFolderSelect = useCallback((folderPath) => {
    setSelectedFolder(folderPath);
  }, []);

  const handleDelete = useCallback(async (item) => {
    const confirmMessage = item.is_directory
      ? `Are you sure you want to delete the folder "${item.name}" and all its contents?`
      : `Are you sure you want to delete "${item.name}"?`;

    const confirmed = await ask(confirmMessage, {
      title: 'Confirm Delete',
      kind: 'warning',
    });

    if (!confirmed) {
      return;
    }

    try {
      await invoke('delete_file_or_directory', { path: item.path });
      // Reload the directory
      await loadRootDirectory();
    } catch (err) {
      console.error('Failed to delete:', err);
      await ask(`Failed to delete: ${err}`, {
        title: 'Error',
        kind: 'error',
      });
    }
  }, [loadRootDirectory]);

  const handleMove = useCallback(async (oldPath, newPath) => {
    try {
      await invoke('rename_file_or_directory', { oldPath, newPath });
      // Reload the directory
      await loadRootDirectory();
    } catch (err) {
      console.error('Failed to move:', err);
      await ask(`Failed to move: ${err}`, {
        title: 'Error',
        kind: 'error',
      });
    }
  }, [loadRootDirectory]);

  const handleCreateFile = useCallback(async (fileName) => {
    if (!fileName || !rootPath) return;

    // Automatically add .md extension if not present
    let finalFileName = fileName;
    if (!finalFileName.endsWith('.md')) {
      finalFileName = `${finalFileName}.md`;
    }

    // Use selected folder or root path
    const targetPath = selectedFolder || rootPath;
    const filePath = `${targetPath}/${finalFileName}`;

    try {
      await invoke('save_file', { path: filePath, content: '' });
      // Reload the entire tree and force re-render
      await loadRootDirectory();
      setTreeKey(prev => prev + 1);
      setShowFileDialog(false);
      setSelectedFolder(null);
    } catch (err) {
      console.error('Failed to create file:', err);
      await ask(`Failed to create file: ${err}`, {
        title: 'Error',
        kind: 'error',
      });
    }
  }, [rootPath, selectedFolder, loadRootDirectory]);

  const handleCreateFolder = useCallback(async (folderName) => {
    if (!folderName || !rootPath) return;

    // Use selected folder or root path
    const targetPath = selectedFolder || rootPath;
    const folderPath = `${targetPath}/${folderName}`;

    try {
      await invoke('create_directory', { path: folderPath });
      // Reload the entire tree and force re-render
      await loadRootDirectory();
      setTreeKey(prev => prev + 1);
      setShowFolderDialog(false);
      setSelectedFolder(null);
    } catch (err) {
      console.error('Failed to create folder:', err);
      await ask(`Failed to create folder: ${err}`, {
        title: 'Error',
        kind: 'error',
      });
    }
  }, [rootPath, selectedFolder, loadRootDirectory]);

  // Drag and drop handlers for the root container
  const handleRootDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'move';
  }, []);

  const handleRootDrop = useCallback(async (e) => {
    e.preventDefault();
    e.stopPropagation();

    try {
      const data = JSON.parse(e.dataTransfer.getData('text/plain'));
      const newPath = `${rootPath}/${data.name}`;

      // Don't move if it's already in the root
      if (data.path === newPath) return;

      await handleMove(data.path, newPath);
    } catch (err) {
      console.error('Failed to handle root drop:', err);
    }
  }, [rootPath, handleMove]);

  const handleContextMenu = useCallback((e, item) => {
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      item: item
    });
  }, []);

  const closeContextMenu = useCallback(() => {
    setContextMenu(null);
  }, []);

  const handleContextCreateFile = useCallback(() => {
    if (contextMenu?.item) {
      setSelectedFolder(contextMenu.item.is_directory ? contextMenu.item.path : null);
      setShowFileDialog(true);
    }
    closeContextMenu();
  }, [contextMenu, closeContextMenu]);

  const handleContextCreateFolder = useCallback(() => {
    if (contextMenu?.item) {
      setSelectedFolder(contextMenu.item.is_directory ? contextMenu.item.path : null);
      setShowFolderDialog(true);
    }
    closeContextMenu();
  }, [contextMenu, closeContextMenu]);

  const handleContextDelete = useCallback(async () => {
    if (contextMenu?.item) {
      await handleDelete(contextMenu.item);
    }
    closeContextMenu();
  }, [contextMenu, handleDelete, closeContextMenu]);

  // Close context menu when clicking outside
  useEffect(() => {
    if (contextMenu) {
      const handleClick = () => closeContextMenu();
      document.addEventListener('click', handleClick);
      return () => document.removeEventListener('click', handleClick);
    }
  }, [contextMenu, closeContextMenu]);

  if (!rootPath) {
    return (
      <div className="file-tree-empty">
        <p>No root directory selected</p>
        <p className="file-tree-empty-hint">
          Go to Settings to select a root directory
        </p>
      </div>
    );
  }

  return (
    <div
      className="file-tree"
      onDragOver={handleRootDragOver}
      onDrop={handleRootDrop}
    >
      <div className="file-tree-actions">
        <button
          className="file-tree-action-button"
          onClick={() => setShowFileDialog(true)}
          title="New File"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path>
            <polyline points="13 2 13 9 20 9"></polyline>
            <line x1="12" y1="18" x2="12" y2="12"></line>
            <line x1="9" y1="15" x2="15" y2="15"></line>
          </svg>
        </button>
        <button
          className="file-tree-action-button"
          onClick={() => setShowFolderDialog(true)}
          title="New Folder"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
            <line x1="12" y1="11" x2="12" y2="17"></line>
            <line x1="9" y1="14" x2="15" y2="14"></line>
          </svg>
        </button>
      </div>

      {isLoading && <div className="file-tree-loading">Loading...</div>}
      {error && <div className="file-tree-error">Failed to load directory</div>}
      {!isLoading && !error && rootItems.length === 0 && (
        <div className="file-tree-empty">
          <p>Empty directory</p>
        </div>
      )}
      {!isLoading && !error && rootItems.map((item) => (
        <FileTreeItem
          key={`${item.path}-${treeKey}`}
          item={item}
          level={0}
          onFileClick={onFileClick}
          onDelete={handleDelete}
          onMove={handleMove}
          onFolderSelect={handleFolderSelect}
          selectedPath={selectedPath}
          expandedFolders={expandedFolders}
          onToggleExpand={handleToggleExpand}
          onContextMenu={handleContextMenu}
        />
      ))}

      {contextMenu && (
        <div
          className="context-menu"
          style={{
            position: 'fixed',
            top: `${contextMenu.y}px`,
            left: `${contextMenu.x}px`,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {contextMenu.item.is_directory && (
            <>
              <button className="context-menu-item" onClick={handleContextCreateFile}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path>
                  <polyline points="13 2 13 9 20 9"></polyline>
                </svg>
                New File
              </button>
              <button className="context-menu-item" onClick={handleContextCreateFolder}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
                </svg>
                New Folder
              </button>
              <div className="context-menu-separator" />
            </>
          )}
          <button className="context-menu-item context-menu-item-danger" onClick={handleContextDelete}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            </svg>
            Delete
          </button>
        </div>
      )}

      <InputDialog
        isOpen={showFileDialog}
        onClose={() => setShowFileDialog(false)}
        onSubmit={handleCreateFile}
        title="Create New File"
        placeholder="Enter file name (e.g., document.md)"
      />

      <InputDialog
        isOpen={showFolderDialog}
        onClose={() => setShowFolderDialog(false)}
        onSubmit={handleCreateFolder}
        title="Create New Folder"
        placeholder="Enter folder name"
      />
    </div>
  );
});

export default FileTree;
