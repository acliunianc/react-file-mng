import React, { useContext, useMemo } from "react";

import {
  ArrowLeftIcon,
  ArrowRightIcon,
  ArrowUpIcon,
  HomeIcon,
  ListBulletIcon,
  Squares2X2Icon,
} from "@heroicons/react/24/outline";
import { v4 } from "uuid";
import AddressBar from "../AddressBar";
import { FileManagerContext } from "../context/FileManagerContext";
import type { FileItem } from "../types";

export interface ToolBarProps {
  onNavigate?: (file: FileItem | null, path: string) => Promise<any>;
}

const ToolBar: React.FC<ToolBarProps> = ({ onNavigate }) => {
  const {
    path,
    setPath,
    viewMode,
    setViewMode,
    setCurrentHistory,
    root,
    historyStack,
    setHistoryStack,
    getHistoryIndex,
    flatRealFiles,
    currentFolder,
  } = useContext(FileManagerContext);

  const handleToolBarNavigate = async (path: string) => {
    // 在打平的realFiles中查找该路径
    const _currentFolder = flatRealFiles.find((item) => item.path === path);
    if (!_currentFolder) {
      // 即使找不到路径，也需要触发onNavigate事件通知使用者
      return onNavigate?.(null, path);
    }

    await onNavigate?.(_currentFolder, path);
    setPath(_currentFolder.path);
    const newHistory = {
      path: _currentFolder.path,
      id: v4(),
      record: _currentFolder,
    };
    setCurrentHistory(newHistory);
    setHistoryStack((prev) => [...prev, newHistory]);
  };

  const canGoBack = useMemo(
    () => historyStack.length > 0 && getHistoryIndex() > 0,
    [historyStack, getHistoryIndex]
  );
  const canGoForward = useMemo(
    () =>
      historyStack.length > 0 && getHistoryIndex() < historyStack.length - 1,
    [historyStack, getHistoryIndex]
  );
  const canGoHome = useMemo(() => path !== root.path, [path, root]);
  const canGoUp = useMemo(() => path !== root.path, [path, root]);

  const handleToolBarGoBack = async () => {
    // 后退
    const index = getHistoryIndex();
    const prevHistory = historyStack[index - 1];
    if (!prevHistory) return;
    await onNavigate?.(prevHistory.record, prevHistory.path);
    setPath(prevHistory.path);
    setCurrentHistory(prevHistory);
  };

  const handleToolBarGoForward = async () => {
    // 前进
    const index = getHistoryIndex();
    const nextHistory = historyStack[index + 1];
    if (!nextHistory) return;
    await onNavigate?.(nextHistory.record, nextHistory.path);
    setPath(nextHistory.path);
    setCurrentHistory(nextHistory);
  };

  const handleToolBarGoUp = async () => {
    const parentFolder = currentFolder.parent;
    if (!parentFolder) return;
    const newHistory = {
      path: parentFolder.path,
      id: v4(),
      record: parentFolder,
    };
    await onNavigate?.(parentFolder, parentFolder.path);
    setCurrentHistory(newHistory);
    setHistoryStack((prev) => [...prev, newHistory]);
    setPath(parentFolder!.path);
  };

  const handleToolBarGoHome = async () => {
    await onNavigate?.(root, root.path);
    setPath(root.path);
    const newHistory = {
      path: root.path,
      id: v4(),
      record: root,
    };
    setCurrentHistory(newHistory);
    setHistoryStack((prev) => [...prev, newHistory]);
  };

  return (
    <div
      className="flex items-center gap-2 p-2"
      // onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-center gap-1">
        <button
          type="button"
          className={`p-1.5 rounded-md hover:bg-gray-100 ${
            !canGoBack && "opacity-50 cursor-not-allowed"
          }`}
          onClick={handleToolBarGoBack}
          disabled={!canGoBack}
          title="后退"
        >
          <ArrowLeftIcon className="w-5 h-5" />
        </button>
        <button
          type="button"
          className={`p-1.5 rounded-md hover:bg-gray-100 ${
            !canGoForward && "opacity-50 cursor-not-allowed"
          }`}
          onClick={handleToolBarGoForward}
          disabled={!canGoForward}
          title="前进"
        >
          <ArrowRightIcon className="w-5 h-5" />
        </button>
        <button
          type="button"
          className={`p-1.5 rounded-md hover:bg-gray-100 ${
            !canGoUp && "opacity-50 cursor-not-allowed"
          }`}
          onClick={handleToolBarGoUp}
          disabled={!canGoUp}
          title="向上"
        >
          <ArrowUpIcon className="w-5 h-5" />
        </button>
        <button
          type="button"
          className={`p-1.5 rounded-md hover:bg-gray-100 ${
            !canGoHome && "opacity-50 cursor-not-allowed"
          }`}
          onClick={handleToolBarGoHome}
          disabled={!canGoHome}
          title="主页"
        >
          <HomeIcon className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 mx-2">
        <AddressBar
          path={path}
          onNavigate={handleToolBarNavigate}
          folders={flatRealFiles}
        />
      </div>

      <div className="flex items-center gap-1">
        <button
          type="button"
          className={`p-1.5 rounded-md hover:bg-gray-100 ${
            viewMode === "grid" && "bg-gray-100"
          }`}
          onClick={() => setViewMode("grid")}
          title="网格视图"
        >
          <Squares2X2Icon className="w-5 h-5" />
        </button>
        <button
          type="button"
          className={`p-1.5 rounded-md hover:bg-gray-100 ${
            viewMode === "list" && "bg-gray-100"
          }`}
          onClick={() => setViewMode("list")}
          title="列表视图"
        >
          <ListBulletIcon className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};
export default ToolBar;
