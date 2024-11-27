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
  const handleContextMenuUpload = useCallback(() => {
    const input = document.createElement("input");
    input.type = "file";
    input.multiple = true;

    const currentFolderPath = currentFolder.path.endsWith("/")
      ? currentFolder.path
      : currentFolder.path + "/";

    input.onchange = (event: Event) => {
      const files = Array.from((event.target as HTMLInputElement).files || []);
      if (files.length > 0) {
        onUpload?.(
          currentFolder,
          files.map((file) => ({
            file,
            path: currentFolderPath + file.name,
          }))
        );
      }
    };

    input.click(); // 打开选择器
  }, [onUpload, currentFolder]);
  const handleContextMenuCreateFolder = useCallback(async () => {
    await onCreateFolder?.(currentFolder);
  }, [onCreateFolder, currentFolder]);
  // #endregion

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
          const allEntries: FileSystemEntry[] = [];
          const readBatch = () => {
            dirReader.readEntries((batch) => {
              if (batch.length === 0) {
                resolve(allEntries);
                return;
              }
              allEntries.push(...batch);
              readBatch();
            });
          };
          readBatch();
        });

        const subEntryFiles = await Promise.all(
          entries.map((subEntry) =>
            processEntry(subEntry, `${basePath}/${entry.name}`)
          )
        );

        return subEntryFiles.flat();
      }

      return [];
    },
    []
  );
  // 处理文件拖拽
  const handleFileDrop = useCallback(
    async (items: DataTransferItem[]) => {
      const entryList: FileSystemEntry[] = [];
      const filesWithPath: FileWithPath[] = [];
      const currentFolderPath = currentFolder.path.endsWith("/")
        ? currentFolder.path
        : currentFolder.path + "/";

      // 为什么一个循环解决不了问题?
      // for (const item of items) {
      //   const entry = item.webkitGetAsEntry?.();
      //   if (entry) { // 只能拿到第一个文件, 后续所有entry都是null
      //     const entryFiles = await processEntry(entry);
      //     filesWithPath.push(
      //       ...entryFiles.map((item) => ({
      //         ...item,
      //         path: currentFolderPath + item.path.slice(1),
      //       })),
      //     );
      //   }
      // }

      // 收集所有 entry
      for (const item of items) {
        const entry = item.webkitGetAsEntry?.();
        if (entry) {
          entryList.push(entry);
        }
      }

      // 使用 Promise.all 处理所有 entry
      const entryFilesPromises = entryList.map(async (entry) => {
        const entryFiles = await processEntry(entry);
        return entryFiles.map((item) => ({
          ...item,
          path: currentFolderPath + item.path.slice(1),
        }));
      });

      // 等待所有文件处理完成
      const results = await Promise.all(entryFilesPromises);

      // 将处理后的文件合并到 filesWithPath 中
      results.forEach((result) => {
        filesWithPath.push(...result);
      });

      if (filesWithPath.length > 0) {
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
        onContextMenu={() => {
          setContextMenu(null);
        }}
        {...dragBindings}
      >
        <div className="flex-shrink-0">
          <ToolBar onNavigate={onNavigate} />
        </div>
        <div
          className="flex-grow"
          onContextMenu={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setContextMenu({ x: e.pageX, y: e.pageY });
          }}
        >
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
            onUpload={handleContextMenuUpload}
            onCreateFolder={handleContextMenuCreateFolder}
          />
        )}
      </div>
    </FileManagerContext.Provider>
  );
};

export default FileManagerComp;
