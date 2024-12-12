import { deepFind } from "../../utils";
import {
  FC,
  MutableRefObject,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import { v4 } from "uuid";
import { ContextMenu, ContextMenuProps } from "./ContextMenu";
import DropZone from "./DropZone";
import FileGrid from "./FileGrid";
import FileList from "./FileList";
import ToolBar from "./ToolBar";
import { FileManagerContext } from "./context/FileManagerContext";
import { useFileDrop } from "./hooks/useFileDrop";
import type { FileItem, SortConfig, ViewMode } from "./types";

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
  actionRef?: MutableRefObject<any>;
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
  defaultViewMode = "list",
  openedKey,
  disabledContextMenu = false,
  contextMenuItems,
  actionRef,
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

  const [sortConfig, setSortConfig] = useState<SortConfig>({
    field: "name",
    direction: "asc",
  });

  // homeKey只在初始化时生成一次, 之后不会改变, 没有任何依赖
  const homeKey = useMemo(() => openedKey, []);

  // 根文件夹除了子文件列表, 其他都不会改变
  const root = useMemo<FileItem>(() => {
    const cur = deepFind(files, (item) => item.id === homeKey);
    if (cur) return cur;

    return {
      id: "0",
      path: "/",
      name: "根目录",
      type: "folder",
      children: files,
      size: 0,
      modifiedDate: new Date().getTime(),
    };
  }, [files]);

  function updateRealFiles(files: FileItem[]) {
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
    return deepMap(
      [
        {
          id: "0",
          path: "/",
          name: "根目录",
          type: "folder",
          children: files,
          size: 0,
          modifiedDate: new Date().getTime(),
        },
      ],
      null
    );
  }
  // 内部使用的文件列表, 需要初始化, 当每次files改变时都需要更新, realFiles的结构和files相同, 但是多了一个parent字段
  const [realFiles, setRealFiles] = useState<FileItem[]>(() =>
    updateRealFiles(files)
  );
  useEffect(() => {
    setRealFiles(updateRealFiles(files));
  }, [files]);

  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
  } | null>(null);

  const [path, setPath] = useState("/");
  const [currentFolder, setCurrentFolder] = useState<FileItem>(() => root);

  const sortFiles = useCallback(
    (files: FileItem[]) => {
      // 分离文件夹和文件
      const folders = files.filter((file) => file.type === "folder");
      const regularFiles = files.filter((file) => file.type !== "folder");

      const direction = sortConfig.direction === "asc" ? 1 : -1;

      const ext = (field: string) => {
        return field.split(".").pop()?.toLowerCase() || "";
      };

      // 排序函数
      const compareItems = (a: FileItem, b: FileItem): number => {
        switch (sortConfig.field) {
          case "name":
            return a.name.localeCompare(b.name) * direction;

          case "type":
            return ext(a.name) === ext(b.name)
              ? a.name.localeCompare(b.name) * direction
              : ext(a.name).localeCompare(ext(b.name)) * direction;

          case "size":
            return a.size === b.size
              ? a.name.localeCompare(b.name)
              : (a.size - b.size) * direction;

          case "modifiedDate":
            return a.modifiedDate === b.modifiedDate
              ? a.name.localeCompare(b.name)
              : (Number(a.modifiedDate) - Number(b.modifiedDate)) * direction;

          default:
            return 0;
        }
      };

      // 分别对文件夹和文件进行排序
      const sortedFolders = [...folders].sort(compareItems);
      const sortedFiles = [...regularFiles].sort(compareItems);

      // 合并排序后的文件夹和文件
      return [...sortedFolders, ...sortedFiles];
    },
    [sortConfig]
  );

  // openedKey 改变时刷新当前显示文件夹，显示openedKey对应的地址
  useEffect(() => {
    const cur = deepFind(realFiles, (item) => item.id === openedKey);
    if (cur) {
      setPath(cur.path);
      setCurrentFolder({
        ...cur,
        children: sortFiles(cur.children || []),
      });
    }
  }, [openedKey, realFiles, sortConfig, sortFiles]);

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
    id: currentFolder.id || "0",
    path: currentFolder.path || "/",
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
      try {
        // 当Promise成功时再进行跳转
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

        // 清空选中项
        setSelectedFileIds([]);
        setSelectedItems([]);
      } catch (error) {
        // TODO:暂时什么都不做
      }
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
        children: sortFiles(prev.children || []).map((it) => {
          it.editing = false;
          return it;
        }),
      }));
      await onRename?.(file, value);
    },
    [onRename, sortFiles]
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
        children: sortFiles(prev.children || []).map((it) => {
          if (selectedFileIds.includes(it.id)) {
            it.editing = true;
          }
          return it;
        }),
      };
    });
  }, [selectedFileIds, sortFiles]);
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
  // const handleFileDrop = useCallback(
  //   async (items: DataTransferItem[]) => {
  //     const filesWithPath: FileWithPath[] = [];

  //     const currentFolderPath = currentFolder.path.endsWith('/')
  //       ? currentFolder.path
  //       : currentFolder.path + '/';
  //     const entryList = [];

  //     // 为什么一个循环解决不了问题?
  //     // for (const item of items) {
  //     //   const entry = item.webkitGetAsEntry?.(); // 尝试获取 FileSystemEntry
  //     //   if (entry) {
  //     //     const entryFiles = await processEntry(entry);
  //     //     filesWithPath.push(
  //     //       ...entryFiles.map((item) => ({
  //     //         ...item,
  //     //         path: currentFolderPath + item.path.slice(1),
  //     //       })),
  //     //     );
  //     //   }
  //     // }

  //     for (const item of items) {
  //       const entry = item.webkitGetAsEntry?.(); // 尝试获取 FileSystemEntry
  //       if (!entry) continue;
  //       entryList.push(entry);
  //     }

  //     for (const entry of entryList) {
  //       const entryFiles = await processEntry(entry);
  //       filesWithPath.push(
  //         ...entryFiles.map((item) => ({
  //           ...item,
  //           path: currentFolderPath + item.path.slice(1),
  //         })),
  //       );
  //     }
  //     console.log('filesWithPath', filesWithPath);

  //     if (filesWithPath.length > 0) {
  //       onUpload?.(currentFolder, filesWithPath);
  //     }
  //   },
  //   [onUpload, processEntry, currentFolder],
  // );

  const handleFileDrop = useCallback(
    async (items: DataTransferItem[]) => {
      const entryList: FileSystemEntry[] = [];
      const filesWithPath: FileWithPath[] = [];
      const currentFolderPath = currentFolder.path.endsWith("/")
        ? currentFolder.path
        : currentFolder.path + "/";

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

      sortConfig,
      setSortConfig,
      sortFiles,

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
    sortConfig,
    sortFiles,
  ]);

  // ------------------------------------------
  // 重置状态
  // ------------------------------------------
  // #region
  const resetState = () => {
    setSelectedFileIds([]);
    setSelectedItems([]);
    setContextMenu(null);
  };

  useEffect(() => {
    addEventListener("click", resetState);
    addEventListener("contextmenu", resetState);
    return () => {
      removeEventListener("click", resetState);
      removeEventListener("contextmenu", resetState);
    };
  }, []);
  // #endregion

  useImperativeHandle(actionRef, () => {
    return {
      getSelectedItems: () => selectedItems, // 获取选中的文件
      getSelectedFileIds: () => selectedFileIds, // 获取选中的文件id
      getCopySelectedItems: () => copySelectedItems, // 获取复制的文件
      getCutSelectedItems: () => cutSelectedItems, // 获取剪切的文件
      getViewMode: () => viewMode, // 获取视图
      getPath: () => path, // 获取路径
      getRealFiles: () => realFiles, // 获取真实使用的文件列表
      getFlatRealFiles: () => flatRealFiles, // 获取被打平的真实使用的文件列表
      setSelectedItems,
      setSelectedFileIds,
      setCurrentFolder,
      setCopySelectedItems,
      setCutSelectedItems,
      setPath,
      setViewMode,
    };
  });

  return (
    <FileManagerContext.Provider value={fileManagerContextData}>
      <div
        ref={fileManagerRef}
        tabIndex={-1}
        className="file-mng"
        // 修复：file-mng类后代的tailwindcss样式才会生效，所以需要将这些类写成行内样式。
        // className="file-mng relative h-full w-full bg-white rounded-lg shadow-lg border flex flex-col"
        style={{
          position: "relative",
          height: "100%",
          width: "100%",
          backgroundColor: "#fff",
          borderRadius: "0.5rem",
          boxShadow:
            "var(--tw-ring-offset-shadow, 0 0 #0000), var(--tw-ring-shadow, 0 0 #0000), var(--tw-shadow)",
          borderWidth: "1px",
          display: "flex",
          flexDirection: "column",
        }}
        {...dragBindings}
      >
        <div className="flex-shrink-0">
          <ToolBar
            onNavigate={async (...args) => {
              setSelectedFileIds([]);
              setSelectedItems([]);
              return onNavigate?.(...args);
            }}
          />
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
