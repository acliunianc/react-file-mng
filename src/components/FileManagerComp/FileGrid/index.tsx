import { isImageExtension } from "../../../utils";
import { DocumentIcon, FolderIcon, PhotoIcon } from "@heroicons/react/24/solid";

import React, { useContext, useMemo, useState } from "react";
import { FileManagerContext } from "../context/FileManagerContext";
import { useDragAndDrop } from "../hooks/useDragAndDrop";
import { FileItem } from "../types";

interface FileGridProps {
  onSelect?: (files: FileItem[]) => void;
  onNavigate?: (file: FileItem) => Promise<any>;
  onRename?: (file: FileItem, value: string) => Promise<any>;
  onMove?: (from: FileItem, to: FileItem, files: FileItem[]) => Promise<any>;
}

const FileGrid: React.FC<FileGridProps> = ({
  onSelect,
  onNavigate,
  onRename,
  onMove,
}) => {
  const { setContextMenu, cutSelectedItems, selectedItems, currentFolder } =
    useContext(FileManagerContext);

  const { handleDragLeave, handleDragOver, handleDragStart, handleDrop } =
    useDragAndDrop({
      onMove,
    });

  // 记录最后一次单击选择的项
  const [lastSelectedItem, setLastSelectedItem] = useState<FileItem | null>(
    null
  );

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

  const cutSelectedIds = useMemo(
    () => cutSelectedItems.map((it) => it.id),
    [cutSelectedItems]
  );

  return (
    <div className="w-full h-full overflow-auto">
      <div className="flex flex-wrap gap-4 p-4">
        {(currentFolder.children || []).map((file) => (
          <div
            key={file.id}
            title={file.name}
            className={`
            flex flex-col flex-shrink-0 items-center p-2 rounded cursor-pointer select-none w-28 hover:bg-gray-50
            ${
              selectedItems.map((it) => it.id).includes(file.id) &&
              "!bg-blue-100"
            }
            transition-colors
            ${cutSelectedIds.includes(file.id) && "opacity-50"}
          `}
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
            onDoubleClick={() => {
              if (file.type === "folder") {
                onNavigate?.(file);
              }
            }}
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
            {/* 图片需要直接显示 */}
            <div className="text-[36px] leading-9 mb-2 w-12 h-12">
              {file.type === "folder" ? (
                <FolderIcon className="text-yellow-400" />
              ) : isImageExtension(file.name) ? (
                file.previewImage ? (
                  typeof file.previewImage === "string" ? (
                    <img src={file.previewImage} className="w-12 h-12" />
                  ) : (
                    file.previewImage
                  )
                ) : (
                  <PhotoIcon />
                )
              ) : (
                <DocumentIcon />
              )}
            </div>

            {/* 切换input或者div */}
            {file?.editing ? (
              <div className="w-full truncate">
                <input
                  autoFocus
                  onKeyDown={(e) => {
                    const target = e.target as HTMLInputElement;
                    if (e.key === 'Enter') {
                      // 触发通知
                      onRename?.(file, target.value);
                      target.blur();
                    } else if (e.key === 'Escape') {
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
              <div className="text-center text-sm truncate w-full">
                {file.name}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default FileGrid;
