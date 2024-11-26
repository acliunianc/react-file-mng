import { deepFind } from "../../utils";
import { FC, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { v4 } from "uuid";
import { ContextMenu, ContextMenuProps } from "./ContextMenu";
import DropZone from "./DropZone";
import FileGrid from "./FileGrid";
import FileList from "./FileList";
import ToolBar from "./ToolBar";
import { FileManagerContext } from "./context/FileManagerContext";
import { useFileDrop } from "./hooks/useFileDrop";
import { useGlobalShortcuts } from "./hooks/useGlobalShortcuts";
import type { FileItem, ViewMode } from "./types";

export type HistoryProp = {
  path: string;
  id: string;
  record: FileItem;
};

export interface FileWithPath {
  file: File;
  path: string;
}

export interface FileItemWithFrom extends FileItem {
  from: FileItem;
}

// 以下方法都需要改为Promise，并添加loading状态。状态成功后再进行下一步操作。因为使用者可能需要与服务器进行交互
type FileManagerCompProps = {
  files: FileItem[];
  openedKey: string;
  defaultViewMode?: ViewMode;
  disabledContextMenu?: boolean;
  contextMenuItems?: ContextMenuProps["items"];
  onNavigate?: (file: FileItem | null, path: string) => Promise<any>;
  onPaste?: (to: FileItem, files: FileItem[]) => Promise<any>;
  onDelete?: (from: FileItem, ids: string[], files: FileItem[]) => Promise<any>;
  onCreateFolder?: (from: FileItem) => Promise<any>;
  onMove?: (from: FileItem, to: FileItem, files: FileItem[]) => Promise<any>;
  onRename?: (file: FileItem, value: string) => Promise<any>;
  onUpload?: (to: FileItem, files: FileWithPath[]) => Promise<any>;
  onDownload?: (file: FileItem) => void;
};
const FileManagerComp: FC<FileManagerCompProps> = ({
  files,
  openedKey,
  defaultViewMode = "list",
  disabledContextMenu = false,
  contextMenuItems,
  onNavigate,
  onPaste,
  onDelete,
  onCreateFolder,
  onMove,
  onRename,
  onUpload,
  onDownload,
}) => {
  const fileManagerRef = useRef<HTMLDivElement>(null);

  const [viewMode, setViewMode] = useState<ViewMode>(defaultViewMode ?? "list");
  const [selectedFileIds, setSelectedFileIds] = useState<string[]>([]);
  const [selectedItems, setSelectedItems] = useState<FileItem[]>([]);

  // 复制的文件列表
  const [copySelectedItems, setCopySelectedItems] = useState<FileItem[]>([]);
  // 剪切的文件列表
  const [cutSelectedItems, setCutSelectedItems] = useState<FileItemWithFrom[]>(
    []
  );

  const [path, setPath] = useState("/");
  const [realFiles, setRealFiles] = useState<FileItem[]>([]);

  const root = useMemo<FileItem>(
    () => ({
      id: "0",
      path: "/",
      name: "根目录",
      type: "folder",
      children: files,
      size: 0,
      modifiedDate: new Date().getTime(),
    }),
    [files]
  );

  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [currentFolder, setCurrentFolder] = useState<FileItem>(() => root);

  // openedKey 改变时刷新当前显示文件夹
  useEffect(() => {
    const cur = deepFind(realFiles, (item) => item.id === openedKey);
    if (cur) {
      setCurrentFolder({
        ...cur,
        children: cur.children || [],
      });
    }
  }, [openedKey, realFiles]);

  useEffect(() => {
    const deepMap = (
      arr: (FileItem & { parent?: FileItem })[],
      parent?: (FileItem & { parent?: FileItem }) | null
    ) => {
      return arr.map((item) => {
        if (parent) (item as any).parent = parent;
        if (item.type === "folder" && item.children) {
          item.children = deepMap(item.children, item);
        }
        return item;
      });
    };
    setRealFiles(deepMap([root], null));
  }, [root]);

  const flatRealFiles = useMemo(() => {
    const result: FileItem[] = [];

    const flatMap = (arr: FileItem[]) => {
      for (const file of arr) {
        result.push(file);
        if (file.children) {
          flatMap(file.children);
        }
      }
    };

    flatMap(realFiles);

    return result;
  }, [realFiles]);

  // ------------------------------------------
  // tabBar
  // ------------------------------------------
  // #region
  const [currentHistory, setCurrentHistory] = useState<HistoryProp>(() => ({
    id: "0",
    path: "/",
    record: currentFolder,
  }));
  const [historyStack, setHistoryStack] = useState<HistoryProp[]>(() => [
    currentHistory,
  ]);
  const getHistoryIndex = useCallback(() => {
    return historyStack.map((item) => item.id).indexOf(currentHistory.id);
  }, [historyStack, currentHistory.id]);
  // #endregion

  // ------------------------------------------
  // FileList和FileGrid
  // ------------------------------------------
  // #region
  const handleFileListNavigate = useCallback(
    async (file: FileItem) => {
      // 双击进行跳转时，根据当前histroy找到索引，把索引后面的历史纪录全部删除，替换成当前点击的路径，并记录history
      await onNavigate?.(file, file.path);
      const index = getHistoryIndex();

      const newHistory = {
        path: file.path,
        id: v4(),
        record: file,
      };
      setHistoryStack([...historyStack.slice(0, index + 1), newHistory]);
      setCurrentHistory(newHistory);
      setPath(file.path);
    },
    [getHistoryIndex, historyStack, onNavigate]
  );
  const handleFileListSelect = useCallback((files: FileItem[]) => {
    setSelectedFileIds(files.map((it) => it.id));
    setSelectedItems(files);
  }, []);
  const handleFileListRename = useCallback(
    async (file: FileItem, value: string) => {
      // 清理所有的editing状态
      setCurrentFolder((prev) => ({
        ...prev,
        children: (prev.children || []).map((it) => {
          it.editing = false;
          return it;
        }),
      }));
      await onRename?.(file, value);
    },
    [onRename]
  );
  // #endregion

  // ------------------------------------------
  // ContextMenu
  // ------------------------------------------
  // #region
  const handleContextMenuCopy = useCallback(() => {
    setCopySelectedItems([...selectedItems]);
    // 复制的时候清空剪切的文件列表
    setCutSelectedItems([]);
  }, [selectedItems]);
  const handleContextMenuCut = useCallback(() => {
    // 剪切的时候清空复制的文件列表
    setCopySelectedItems([]);
    setCutSelectedItems([
      ...selectedItems.map((item) => ({ ...item, from: currentFolder })),
    ]);
  }, [selectedItems, currentFolder]);
  const handleContextMenuPaste = useCallback(async () => {
    // 粘贴要么从剪切板列表中获取，要么从复制列表中获取. 不存在两个列表都有数据的情况
    if (copySelectedItems.length) {
      await onPaste?.(currentFolder, copySelectedItems);
    } else if (cutSelectedItems.length) {
      await onMove?.(
        cutSelectedItems[0]?.from,
        currentFolder,
        cutSelectedItems
      );
    }
    // 粘贴完成需要清空剪切板列表
    setCutSelectedItems([]);
  }, [copySelectedItems, cutSelectedItems, onPaste, onMove, currentFolder]);
  const handleContextMenuDelete = useCallback(async () => {
    await onDelete?.(
      currentFolder,
      selectedItems.map((it) => it.id),
      selectedItems
    );
  }, [onDelete, currentFolder, selectedItems]);
  const handleContextMenuRename = useCallback(() => {
    // 设置当前选中的文件为编辑状态
    setCurrentFolder((prev) => {
      return {
        ...prev,
        children: (prev.children || []).map((it) => {
          if (selectedFileIds.includes(it.id)) {
            it.editing = true;
          }
          return it;
        }),
      };
    });
  }, [selectedFileIds]);
  const handleContextMenuDownload = useCallback(() => {
    onDownload?.(selectedItems[0]);
  }, [onDownload, selectedItems]);
  const handleContextMenuCreateFolder = useCallback(async () => {
    await onCreateFolder?.(currentFolder);
  }, [onCreateFolder, currentFolder]);
  const handleContextMenuSelectAll = useCallback(() => {
    setSelectedFileIds((currentFolder.children || [])?.map((it) => it.id));
    setSelectedItems(currentFolder.children || []);
  }, [currentFolder]);
  // #endregion

  useGlobalShortcuts({
    dom: fileManagerRef.current,
    onCopy: handleContextMenuCopy,
    onCreateFolder: handleContextMenuCreateFolder,
    onCut: handleContextMenuCut,
    onDelete: handleContextMenuDelete,
    onRename: handleContextMenuRename,
    onPaste: handleContextMenuPaste,
    onSelectAll: handleContextMenuSelectAll,
    disabled: disabledContextMenu,
  });

  // ------------------------------------------
  // Drag & Drop
  // ------------------------------------------
  // #region
  // 处理文件夹上传
  const processEntry = useCallback(
    async (
      entry: FileSystemEntry,
      basePath: string = ""
    ): Promise<FileWithPath[]> => {
      if (entry.isFile) {
        return new Promise((resolve) => {
          (entry as FileSystemFileEntry).file((file) => {
            const fullPath = `${basePath}/${entry.name}`;
            resolve([{ file, path: fullPath }]);
          });
        });
      }

      if (entry.isDirectory) {
        const dirReader = (entry as FileSystemDirectoryEntry).createReader();
        const entries = await new Promise<FileSystemEntry[]>((resolve) => {
          dirReader.readEntries(resolve);
        });

        const files: FileWithPath[] = [];
        for (const subEntry of entries) {
          const subPath = `${basePath}/${entry.name}`;
          const entryFiles = await processEntry(subEntry, subPath);
          files.push(...entryFiles);
        }

        return files;
      }

      return [];
    },
    []
  );
  // 处理文件拖拽
  const handleFileDrop = useCallback(
    async (items: DataTransferItem[]) => {
      const filesWithPath: FileWithPath[] = [];

      for (const item of items) {
        const entry = item.webkitGetAsEntry();
        if (!entry) continue;

        const entryFiles = await processEntry(entry);
        filesWithPath.push(...entryFiles);
      }

      if (filesWithPath.length > 0) {
        // 修改上传函数以支持带路径的文件
        onUpload?.(currentFolder, filesWithPath);
      }
    },
    [onUpload, processEntry, currentFolder]
  );
  const { isDragging, dragBindings } = useFileDrop({
    onFileDrop: handleFileDrop,
    disabled: false,
  });
  // #endregion

  // 上下文数据
  const fileManagerContextData = useMemo(() => {
    return {
      viewMode,
      setViewMode,

      path,
      setPath,

      historyStack,
      setHistoryStack,
      setCurrentHistory,
      getHistoryIndex,

      selectedFileIds,
      setSelectedFileIds,
      selectedItems,
      setSelectedItems,

      copySelectedItems,
      setCopySelectedItems,

      cutSelectedItems,
      setCutSelectedItems,

      openedKey,

      realFiles,
      root,
      flatRealFiles,
      contextMenu,
      setContextMenu,
      currentFolder,
      setCurrentFolder,
    };
  }, [
    viewMode,
    path,
    selectedFileIds,
    selectedItems,
    copySelectedItems,
    cutSelectedItems,
    realFiles,
    contextMenu,
    root,
    flatRealFiles,
    historyStack,
    getHistoryIndex,
    currentFolder,
    openedKey,
  ]);

  return (
    <FileManagerContext.Provider value={fileManagerContextData}>
      <div
        ref={fileManagerRef}
        tabIndex={-1}
        className="relative h-full w-full bg-white rounded-lg shadow-lg border flex flex-col"
        onClick={() => {
          setSelectedFileIds([]);
          setSelectedItems([]);
          setContextMenu(null);
        }}
        onContextMenu={(e) => {
          e.preventDefault();
          setContextMenu({ x: e.pageX, y: e.pageY });
        }}
        {...dragBindings}
      >
        <div className="flex-shrink-0">
          <ToolBar onNavigate={onNavigate} />
        </div>
        <div className="flex-grow">
          {viewMode === "list" && (
            <FileList
              onNavigate={handleFileListNavigate}
              onSelect={handleFileListSelect}
              onRename={handleFileListRename}
              onMove={onMove}
            />
          )}
          {viewMode === "grid" && (
            <FileGrid
              onNavigate={handleFileListNavigate}
              onSelect={handleFileListSelect}
              onRename={handleFileListRename}
              onMove={onMove}
            />
          )}
        </div>
        <DropZone active={isDragging} />

        {!disabledContextMenu && (
          <ContextMenu
            items={contextMenuItems}
            position={contextMenu}
            canPaste
            selectedItems={selectedItems}
            onClose={() => setContextMenu(null)}
            onCopy={handleContextMenuCopy}
            onCut={handleContextMenuCut}
            onPaste={handleContextMenuPaste}
            onDelete={handleContextMenuDelete}
            onRename={handleContextMenuRename}
            onDownload={handleContextMenuDownload}
            onCreateFolder={handleContextMenuCreateFolder}
          />
        )}
      </div>
    </FileManagerContext.Provider>
  );
};

export default FileManagerComp;
