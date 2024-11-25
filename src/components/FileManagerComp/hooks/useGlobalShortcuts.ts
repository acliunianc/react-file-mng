import { useCallback, useEffect } from 'react';

interface UseGlobalShortcutsProps {
  dom?: HTMLElement | null;
  onRename: () => void;
  onDelete: () => void;
  onCopy: () => void;
  onCut: () => void;
  onPaste: () => void;
  onCreateFolder: () => void;
  onSelectAll: () => void;
  disabled?: boolean;
}

export const useGlobalShortcuts = ({
  dom,
  onRename,
  onDelete,
  onCopy,
  onCut,
  onPaste,
  onCreateFolder,
  onSelectAll,
  disabled = false,
}: UseGlobalShortcutsProps) => {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      // 如果在输入框中，不处理快捷键
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement ||
        disabled
      ) {
        return;
      }

      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const modifier = isMac ? event.metaKey : event.ctrlKey;

      // 阻止浏览器默认行为
      const preventDefault = () => {
        event.preventDefault();
        event.stopPropagation();
      };

      // 检查是否按下了修饰键
      if (modifier) {
        switch (event.key.toLowerCase()) {
          case 'c': // Ctrl/Cmd + C
            preventDefault();
            onCopy();
            break;

          case 'x': // Ctrl/Cmd + X
            preventDefault();
            onCut();
            break;

          case 'v': // Ctrl/Cmd + V
            preventDefault();
            onPaste();
            break;

          case 'a': // Ctrl/Cmd + A
            preventDefault();
            onSelectAll();
            break;

          case 'n': // Ctrl/Cmd + N
            preventDefault();
            onCreateFolder();
            break;
        }
      } else {
        // 不需要修饰键的快捷键
        switch (event.key) {
          case 'F2': // F2
            preventDefault();
            onRename();
            break;

          case 'Delete': // Delete
            preventDefault();
            onDelete();
            break;
        }
      }
    },
    [
      onRename,
      onDelete,
      onCopy,
      onCut,
      onPaste,
      onCreateFolder,
      onSelectAll,
      disabled,
    ],
  );

  useEffect(() => {
    // 捕获状态下触发事件监听器
    const realDom = dom || document;

    // @ts-ignore
    realDom?.addEventListener('keydown', handleKeyDown);
    return () => {
      // @ts-ignore
      realDom?.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown, dom]);
};
