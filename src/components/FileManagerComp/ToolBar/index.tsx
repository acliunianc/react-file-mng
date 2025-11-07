import {
  ArrowLeftIcon,
  ArrowRightIcon,
  ArrowUpIcon,
  HomeIcon,
  ArrowPathIcon,
  ListBulletIcon,
  Squares2X2Icon,
} from "@heroicons/react/24/outline";
import React, { FC, useContext, useMemo } from "react";
import { v4 } from "uuid";
import AddressBar from "../AddressBar";
import { FileManagerContext } from "../context/FileManagerContext";
import type { FileItem, ViewMode } from "../types";

export interface ToolBarProps {
  onNavigate?: (file: FileItem | null, path: string) => Promise<any>;
  onReload?: (file: FileItem) => Promise<any>;
  toolBarToolRender?: (params: {
    actions: {
      viewMode: ViewMode;
      setViewMode: (mode: ViewMode) => void;
    };
    doms: React.FunctionComponent<any>[];
  }) => React.ReactNode;
}

const ToolBar: React.FC<ToolBarProps> = ({
  onNavigate,
  onReload,
  toolBarToolRender,
}) => {
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
    const _currentFolder = flatRealFiles.find(item => item.path === path);
    if (!_currentFolder) {
      try {
        onNavigate?.(null, path);
      } catch (error) {
        // TODO:暂时什么都不做
      }
      return;
    }

    try {
      await onNavigate?.(_currentFolder, path);
      setPath(_currentFolder.path);
      const newHistory = {
        path: _currentFolder.path,
        id: v4(),
        record: _currentFolder,
      };
      setCurrentHistory(newHistory);
      setHistoryStack(prev => [...prev, newHistory]);
    } catch (error) {
      // TODO:暂时什么都不做
    }
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
    try {
      await onNavigate?.(prevHistory.record, prevHistory.path);
      setPath(prevHistory.path);
      setCurrentHistory(prevHistory);
    } catch (error) {}
  };

  const handleToolBarGoForward = async () => {
    // 前进
    const index = getHistoryIndex();
    const nextHistory = historyStack[index + 1];
    if (!nextHistory) return;
    try {
      await onNavigate?.(nextHistory.record, nextHistory.path);
      setPath(nextHistory.path);
      setCurrentHistory(nextHistory);
    } catch (error) {}
  };

  const handleToolBarGoUp = async () => {
    const parentFolder = currentFolder.parent;
    if (!parentFolder) return;
    const newHistory = {
      path: parentFolder.path,
      id: v4(),
      record: parentFolder,
    };
    try {
      await onNavigate?.(parentFolder, parentFolder.path);
      setCurrentHistory(newHistory);
      setHistoryStack(prev => [...prev, newHistory]);
      setPath(parentFolder!.path);
    } catch (error) {}
  };

  const handleToolBarGoHome = async () => {
    try {
      await onNavigate?.(root, root.path);
      setPath(root.path);
      const newHistory = {
        path: root.path,
        id: v4(),
        record: root,
      };
      setCurrentHistory(newHistory);
      setHistoryStack(prev => [...prev, newHistory]);
    } catch (error) {}
  };

  const ReloadButton: FC<any> = () => (
    <button
      type="button"
      className="p-1.5 rounded-md hover:bg-gray-100"
      onClick={() => onReload?.(currentFolder)}
      title="刷新"
    >
      <ArrowPathIcon className="w-5 h-5" />
    </button>
  );

  const GridViewButton: FC<any> = () => (
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
  );

  const ListViewButton: FC<any> = () => (
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
  );

  const innerToolBarToolRender = toolBarToolRender
    ? toolBarToolRender
    : () => (
        <>
          <ReloadButton />
          <GridViewButton />
          <ListViewButton />
        </>
      );

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
        {/* 可以增加自定义的render */}
        {innerToolBarToolRender?.({
          actions: {
            viewMode,
            setViewMode,
          },
          doms: [ReloadButton, GridViewButton, ListViewButton],
        })}
      </div>
    </div>
  );
};
export default ToolBar;
