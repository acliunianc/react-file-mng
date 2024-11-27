import React, { ReactNode, useCallback, useContext } from "react";
import { FileManagerContext } from "../context/FileManagerContext";
import { useGlobalShortcuts } from "../hooks/useGlobalShortcuts";
import { FileItem } from "../types";

export interface Actions {
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

export type MenuItem = {
  key: string;
  label: ReactNode;
  type?: "item";
  onClick?: (
    selectedItems: FileItem[],
    currentFolder: FileItem,
    item: MenuItem,
    actions: Actions
  ) => void;
  disabled?:
    | boolean
    | ((
        selectedItems: FileItem[],
        currentFolder: FileItem,
        item: MenuItem
      ) => boolean);
  shortcut?: string;
  danger?: boolean;
};

export type SeparatorItem = {
  type: "separator";
};

export type MenuItems = (MenuItem | SeparatorItem)[];

export interface ContextMenuProps extends Actions {
  position: { x: number; y: number } | null;
  selectedItems: FileItem[];
  canPaste: boolean;
  items?: MenuItems;
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
  const { currentFolder, setSelectedFileIds, setSelectedItems } =
    useContext(FileManagerContext);

  const handleContextMenuSelectAll = useCallback(() => {
    setSelectedFileIds((currentFolder.children || [])?.map((it) => it.id));
    setSelectedItems(currentFolder.children || []);
  }, [currentFolder, setSelectedFileIds, setSelectedItems]);

  const defaultMenuItems: MenuItems = [
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
      key: "_upload",
      label: "上传",
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

  const menuItems: MenuItems = items ?? defaultMenuItems;

  useGlobalShortcuts({
    items: [
      {
        key: "_selectAll",
        label: "全选",
        onClick: handleContextMenuSelectAll,
        shortcut: "Ctrl+A",
      },
      ...menuItems,
    ],
    actions: {
      onClose,
      onCopy,
      onCut,
      onPaste,
      onDelete,
      onRename,
      onDownload,
      onUpload,
      onCreateFolder,
    },
    enabled: true,
  });

  if (!position) return null;

  return (
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
                  (
                    typeof item.disabled === "function"
                      ? item.disabled(selectedItems, currentFolder, item)
                      : item.disabled
                  )
                    ? "!text-gray-400 cursor-not-allowed"
                    : "hover:bg-gray-100"
                }
              `}
            onClick={() => {
              const disabled =
                typeof item.disabled === "function"
                  ? item.disabled(selectedItems, currentFolder, item)
                  : item.disabled;

              if (!disabled) {
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
            disabled={
              typeof item.disabled === "function"
                ? item.disabled(selectedItems, currentFolder, item)
                : item.disabled
            }
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
  );
};
