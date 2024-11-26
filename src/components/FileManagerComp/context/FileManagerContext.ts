import { createContext } from "react";
import { FileItemWithFrom, HistoryProp } from "..";
import { FileItem, ViewMode } from "../types";

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
}

export const FileManagerContext = createContext<FileManagerContextProps>(
  {} as unknown as any
);
