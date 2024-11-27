import { useContext, useEffect, useMemo } from "react";
import { Actions, type MenuItem, type MenuItems } from "../ContextMenu";
import { FileManagerContext } from "../context/FileManagerContext";

// 辅助函数：从键盘事件生成快捷键字符串
const getShortcutFromEvent = (e: KeyboardEvent): string => {
  const parts: string[] = [];

  if (e.ctrlKey) parts.push("ctrl");
  if (e.shiftKey) parts.push("shift");
  if (e.altKey) parts.push("alt");

  // 特殊键处理
  const key = e.key.toLowerCase();
  if (key !== "control" && key !== "shift" && key !== "alt") {
    parts.push(key);
  }

  return parts.sort().join("+");
};

// 辅助函数：标准化快捷键格式
const normalizeShortcut = (shortcut: string): string => {
  return shortcut
    .split("+")
    .map((key) => key.trim().toLowerCase())
    .sort()
    .join("+");
};

export const useGlobalShortcuts = (config: {
  items: MenuItems;
  actions: Actions;
  enabled: boolean;
}) => {
  const { items: menuItems, enabled, actions } = config;
  const { selectedItems, currentFolder } = useContext(FileManagerContext);
  // 合并并提取所有有效的快捷键配置
  const shortcutMap = useMemo(() => {
    const map = new Map<string, MenuItem>();

    // 处理菜单项并提取快捷键
    const processMenuItems = (items: MenuItems) => {
      items.forEach((item) => {
        if (item.type === "separator") return;

        const { shortcut, onClick, disabled } = item;
        if (shortcut && onClick && !disabled) {
          // 标准化快捷键格式
          const normalizedShortcut = normalizeShortcut(shortcut);
          map.set(normalizedShortcut, item);
        }
      });
    };

    // 处理单项
    processMenuItems(menuItems);

    return map;
  }, [menuItems]);

  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const shortcut = getShortcutFromEvent(e);
      const item = shortcutMap.get(shortcut);
      if (!item?.onClick) return;
      e.preventDefault();
      item?.onClick(selectedItems, currentFolder, item, actions!);
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [enabled, shortcutMap, selectedItems, currentFolder, actions]);
};
