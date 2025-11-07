import { formatByte } from "../../../utils";
import {
  ChevronDownIcon,
  ChevronUpIcon,
  DocumentIcon,
  FolderIcon,
} from "@heroicons/react/24/outline";
import moment from "moment";
import React, { useContext, useMemo, useState } from "react";
import { FileManagerContext } from "../context/FileManagerContext";
import { useDragAndDrop } from "../hooks/useDragAndDrop";
import { CustomIcon, FileItem, SortConfig } from "../types";

type SortField = "name" | "size" | "type" | "modifiedDate";

export interface FileListProps {
  onSelect?: (files: FileItem[]) => void;
  onNavigate?: (file: FileItem) => Promise<any>;
  onDoubleClickItem?: (file: FileItem) => Promise<any>;
  onRename?: (file: FileItem, value: string) => Promise<any>;
  onMove?: (from: FileItem, to: FileItem, files: FileItem[]) => Promise<any>;
  customIcons?: CustomIcon[];
}

const FileList: React.FC<FileListProps> = ({
  onSelect,
  onNavigate,
  onDoubleClickItem,
  onRename,
  onMove,
  customIcons,
}) => {
  const {
    setContextMenu,
    currentFolder,
    cutSelectedItems,
    selectedItems,
    sortConfig,
    setSortConfig,
  } = useContext(FileManagerContext);

  const cutSelectedIds = useMemo(
    () => cutSelectedItems.map((it) => it.id),
    [cutSelectedItems]
  );

  const { handleDragLeave, handleDragOver, handleDragStart, handleDrop } =
    useDragAndDrop({
      onMove,
    });

  // 记录最后一次单击选择的项
  const [lastSelectedItem, setLastSelectedItem] = useState<FileItem | null>(
    null
  );

  const handleSort = async (field: SortField) => {
    const newSortConfig: SortConfig = {
      field,
      direction:
        sortConfig.field === field && sortConfig.direction === "asc"
          ? "desc"
          : "asc",
    };

    setSortConfig(newSortConfig);
  };

  const renderSortIcon = (field: SortField) => {
    if (sortConfig.field !== field) return null;
    return sortConfig.direction === "asc" ? (
      <ChevronUpIcon className="w-4 h-4" />
    ) : (
      <ChevronDownIcon className="w-4 h-4" />
    );
  };

  const renderHeader = (
    field: SortField,
    label: string,
    width: string = "auto"
  ) => (
    <div
      className={`
        flex items-center gap-1 cursor-pointer select-none
        hover:bg-gray-50 py-1 rounded ${width}
      `}
      onClick={() => handleSort(field)}
    >
      <span>{label}</span>
      {renderSortIcon(field)}
    </div>
  );

  const handleDoubleClick = (file: FileItem) => {
    if (file.type === "folder") {
      onNavigate?.(file);
    }
    onDoubleClickItem?.(file);
  };

  const handleItemClick = (file: FileItem, event: React.MouseEvent) => {
    // Ctrl/Command + 点击：切换选中状态
    if (event.ctrlKey || event.metaKey) {
      const newSelectedItems = selectedItems.includes(file)
        ? selectedItems.filter((item) => item !== file)
        : [...selectedItems, file];

      onSelect?.(newSelectedItems);
      setLastSelectedItem(file);
    }
    // Shift + 点击：范围选择
    else if (event.shiftKey && lastSelectedItem) {
      const startIndex = (currentFolder.children || []).findIndex(
        (f) => f === lastSelectedItem
      );
      const endIndex = (currentFolder.children || []).findIndex(
        (f) => f === file
      );

      if (startIndex !== -1 && endIndex !== -1) {
        const start = Math.min(startIndex, endIndex);
        const end = Math.max(startIndex, endIndex);
        const rangeSelection = (currentFolder.children || []).slice(
          start,
          end + 1
        );

        // 如果按住 Ctrl/Command，则添加到现有选择
        const newSelectedItems =
          event.ctrlKey || event.metaKey
            ? Array.from(new Set([...selectedItems, ...rangeSelection]))
            : rangeSelection;

        onSelect?.(newSelectedItems);
      }
    }
    // 普通点击：单选
    else {
      onSelect?.([file]);
      setLastSelectedItem(file);
    }
  };

  // 获取文件的扩展名
  const getFileExtension = (file: FileItem): string => {
    if (file.extension) {
      return file.extension.toLowerCase();
    }
    const parts = file.name.split(".");
    if (parts.length > 1) {
      return parts.pop()?.toLowerCase() || "";
    }
    return "";
  };

  // 查找匹配的自定义图标
  const findCustomIcon = (file: FileItem) => {
    if (!customIcons || customIcons.length === 0) {
      return null;
    }

    const extension = getFileExtension(file);
    if (!extension) {
      return null;
    }

    return customIcons.find((icon) => {
      if (typeof icon.extension === "string") {
        return icon.extension.toLowerCase() === extension;
      }
      if (Array.isArray(icon.extension)) {
        return icon.extension.some(
          (ext) => ext.toLowerCase() === extension
        );
      }
      return false;
    });
  };

  // 渲染文件图标
  const renderFileIcon = (file: FileItem) => {
    if (file.type === "folder") {
      return <FolderIcon className="w-5 h-5 text-yellow-500" />;
    }

    const customIcon = findCustomIcon(file);
    if (customIcon) {
      return customIcon.render(file);
    }

    return <DocumentIcon className="w-5 h-5 text-blue-500" />;
  };

  return (
    // 阻止冒泡传递
    <div className={`w-full h-full flex flex-col`}>
      {/* 表头 */}
      <div className="flex-shrink-0 flex items-center px-4 py-2 border-b font-medium text-gray-500 sticky top-0 bg-white">
        <div className="w-6" /> {/* 图标占位 */}
        {renderHeader("name", "名称", "flex-1")}
        {renderHeader("type", "类型", "w-32")}
        {renderHeader("size", "大小", "w-32")}
        {renderHeader("modifiedDate", "修改日期", "w-40")}
      </div>

      {/* 文件列表 */}
      <div className="flex-grow overflow-y-auto">
        {(currentFolder.children || []).map((file) => (
          <div
            key={file.id}
            className={`flex items-center px-4 py-2 cursor-pointer select-none transition-colors hover:bg-gray-50 ${
              selectedItems.map((it) => it.id).includes(file.id) &&
              "!bg-blue-100"
            } ${cutSelectedIds.includes(file.id) && "opacity-50"}`}
            onClick={(e) => {
              e.stopPropagation();
              setContextMenu(null);
              handleItemClick(file, e);
            }}
            onContextMenu={(e) => {
              e.preventDefault();
              // 没有选中selectedItems时, 对某个文件右击通常需要操作该文件，默认选中当前项
              // 而当有多个选中项时, 右键菜单不应该操作当前项, 而是操作多个选中项, 所以不能触发 onSelect , 若是触发那么就会替换多个选中项为单个
              if (selectedItems.length <= 1) {
                onSelect?.([file]);
              }
            }}
            onDoubleClick={() => handleDoubleClick(file)}
            draggable
            onDragStart={(e) =>
              handleDragStart(
                e,
                currentFolder,
                selectedItems.length ? selectedItems : [file]
              )
            }
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, file)}
          >
            {/* 文件图标 */}
            <div className="w-6 h-6 flex items-center justify-center">
              {renderFileIcon(file)}
            </div>

            {/* 文件名 */}
            {file?.editing ? (
              <div className="flex-1 ps-2 pe-12 truncate">
                <input
                  autoFocus
                  onBlur={() => {
                    onRename?.(file, file.name);
                  }}
                  onKeyDown={(e) => {
                    const target = e.target as HTMLInputElement;
                    if (e.key === "Enter") {
                      // 触发通知
                      onRename?.(file, target.value);
                      target.blur();
                    } else if (e.key === "Escape") {
                      onRename?.(file, file.name);
                      target.blur();
                    }
                  }}
                  type="text"
                  className="px-2 w-full border outline-none rounded"
                  defaultValue={file.name}
                />
              </div>
            ) : (
              <div className="flex-1 truncate px-2">{file.name}</div>
            )}

            {/* 类型 */}
            <div className="w-32 text-gray-500">
              {file.type === "folder"
                ? "文件夹"
                : file.name.split(".").length > 1
                ? file.name.split(".").pop()?.toUpperCase()
                : "文件"}
            </div>

            {/* 大小 */}
            <div className="w-32 text-gray-500">
              {file.type === "folder"
                ? "-"
                : formatByte(Number.isNaN(Number(file.size)) ? 0 : file.size)}
            </div>

            {/* 修改时间 */}
            <div className="w-40 text-gray-500">
              {moment(file.modifiedDate || "").format("YYYY-MM-DD HH:mm:ss")}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FileList;
