import { createContext } from "react";
import { FileItemWithFrom, HistoryProp } from "..";
import { FileItem, SortConfig, ViewMode } from "../types";

interface FileManagerContextProps {
  viewMode: ViewMode;
  setViewMode: React.Dispatch<
    React.SetStateAction<FileManagerContextProps["viewMode"]>
  >;

  path: string;
  setPath: React.Dispatch<
    React.SetStateAction<FileManagerContextProps["path"]>
  >;

  historyStack: HistoryProp[];
  setHistoryStack: React.Dispatch<
    React.SetStateAction<FileManagerContextProps["historyStack"]>
  >;
  setCurrentHistory: React.Dispatch<
    React.SetStateAction<FileManagerContextProps["historyStack"][number]>
  >;
  getHistoryIndex: () => number;

  selectedFileIds: string[];
  setSelectedFileIds: React.Dispatch<
    React.SetStateAction<FileManagerContextProps["selectedFileIds"]>
  >;

  selectedItems: FileItem[];
  setSelectedItems: React.Dispatch<
    React.SetStateAction<FileManagerContextProps["selectedItems"]>
  >;

  copySelectedItems: FileItem[];
  setCopySelectedItems: React.Dispatch<
    React.SetStateAction<FileManagerContextProps["copySelectedItems"]>
  >;

  cutSelectedItems: FileItemWithFrom[];
  setCutSelectedItems: React.Dispatch<
    React.SetStateAction<FileManagerContextProps["cutSelectedItems"]>
  >;

  openedKey: string;

  sortConfig: SortConfig;
  setSortConfig: React.Dispatch<
    React.SetStateAction<FileManagerContextProps["sortConfig"]>
  >;
  sortFiles: (files: FileItem[]) => FileItem[];

  realFiles: FileItem[];
  root: FileItem;
  flatRealFiles: FileItem[];

  contextMenu: {
    x: number;
    y: number;
  } | null;
  setContextMenu: React.Dispatch<
    React.SetStateAction<FileManagerContextProps["contextMenu"]>
  >;

  currentFolder: FileItem;
  setCurrentFolder: React.Dispatch<React.SetStateAction<FileItem>>;

  /** 文件管理器根元素 ref，用于判断快捷键是否应在当前实例内生效（可见/聚焦时才拦截） */
  containerRef?: React.RefObject<HTMLDivElement | null>;
}

export const FileManagerContext = createContext<FileManagerContextProps>(
  {} as unknown as any
);
