import React, { ReactNode, useContext } from "react";
import { FileManagerContext } from "../context/FileManagerContext";
import { FileItem } from "../types";

type MenuItem = {
  key: string;
  label: ReactNode;
  onClick?: (
    selectedItems: FileItem[],
    currentFolder: FileItem,
    item: MenuItem,
    actions: {
      onClose?: () => void;
      onCopy?: () => void;
      onCut?: () => void;
      onPaste?: () => void;
      onDelete?: () => void;
      onRename?: () => void;
      onDownload?: () => void;
      onUpload?: () => void;
      onCreateFolder?: () => void;
    }
  ) => void;
  disabled?: boolean;
  shortcut?: string;
  danger?: boolean;
};

type SeparatorItem = {
  type: "separator";
};

export interface ContextMenuProps {
  position: { x: number; y: number } | null;
  selectedItems: FileItem[];
  canPaste: boolean;
  items?: (MenuItem | SeparatorItem)[];
  onClose?: () => void;
  onCopy?: () => void;
  onCut?: () => void;
  onPaste?: () => void;
  onDelete?: () => void;
  onRename?: () => void;
  onDownload?: () => void;
  onUpload?: () => void;
  onCreateFolder?: () => void;
}

export const ContextMenu: React.FC<ContextMenuProps> = ({
  position,
  items,
  selectedItems,
  canPaste,
  onClose,
  onCopy,
  onCut,
  onPaste,
  onDelete,
  onRename,
  onDownload,
  onUpload,
  onCreateFolder,
}) => {
  const { currentFolder } = useContext(FileManagerContext);

  if (!position) return null;

  const defaultMenuItems: (MenuItem | SeparatorItem)[] = [
    {
      key: "_copy",
      label: "复制",
      onClick: onCopy,
      disabled: selectedItems.length === 0,
      shortcut: "Ctrl+C",
    },
    {
      key: "_cut",
      label: "剪切",
      onClick: onCut,
      disabled: selectedItems.length === 0,
      shortcut: "Ctrl+X",
    },
    {
      key: "_paste",
      label: "粘贴",
      onClick: onPaste,
      disabled: !canPaste,
      shortcut: "Ctrl+V",
    },
    { type: "separator" },
    {
      key: "_delete",
      label: "删除",
      onClick: onDelete,
      disabled: selectedItems.length === 0,
      shortcut: "Delete",
      danger: true,
    },
    {
      key: "_rename",
      label: "重命名",
      onClick: onRename,
      disabled: selectedItems.length !== 1,
      shortcut: "F2",
    },
    {
      key: "_download",
      label: "下载",
      onClick: onDownload,
      disabled:
        selectedItems.length !== 1 || selectedItems[0]?.type === "folder",
    },
    {
      key: '_upload',
      label: '上传',
      onClick: onUpload,
    },
    { type: "separator" },
    {
      key: "_createFolder",
      label: "新建文件夹",
      onClick: onCreateFolder,
      // shortcut: 'Ctrl+Shift+N',
    },
  ];

  const menuItems: (MenuItem | SeparatorItem)[] = items ?? defaultMenuItems;

  return (
    <>
      {/* <div className="fixed inset-0 z-50" onClick={onClose} /> */}
      <div
        className="fixed z-50 bg-white rounded-lg shadow-lg py-1 min-w-52"
        style={{
          left: position.x,
          top: position.y,
        }}
      >
        <div className="w-full px-4 py-1.5 text-left flex items-center justify-between ">
          选中{selectedItems.length}项
        </div>
        <div className="h-px bg-gray-200 my-1"></div>
        {menuItems.map((item, index) =>
          "type" in item ? (
            <div key={`_split__${index}`} className="h-px bg-gray-200 my-1" />
          ) : (
            <button
              type="button"
              key={item.key}
              className={`
                w-full px-4 py-1.5 text-left flex items-center justify-between
                ${item.danger ? "text-red-600" : "text-gray-700"}
                ${
                  item.disabled
                    ? "!text-gray-400 cursor-not-allowed"
                    : "hover:bg-gray-100"
                }
              `}
              onClick={() => {
                if (!item.disabled) {
                  item.onClick?.(selectedItems, currentFolder, item, {
                    onClose,
                    onCopy,
                    onCut,
                    onPaste,
                    onDelete,
                    onRename,
                    onDownload,
                    onUpload,
                    onCreateFolder,
                  });
                  onClose?.();
                }
              }}
              disabled={item.disabled}
            >
              <span className="flex-grow">{item.label}</span>
              {item.shortcut && (
                <span className="flex-shrink-0 text-xs text-gray-400 ml-4">
                  {item.shortcut}
                </span>
              )}
            </button>
          )
        )}
      </div>
    </>
  );
};
