import { useCallback, useState } from "react";

interface UseFileDropProps {
  onFileDrop: (items: DataTransferItem[]) => void;
  disabled?: boolean;
}

export const useFileDrop = ({
  onFileDrop,
  disabled = false,
}: UseFileDropProps) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragEnter = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();

      // 检查是否包含文件
      if (disabled || !e.dataTransfer.types.includes("Files")) return;

      setIsDragging(true);
    },
    [disabled]
  );

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // 确保只在鼠标离开容器时才重置状态
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;

    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();

      if (disabled) return;

      // 设置拖拽效果
      e.dataTransfer.dropEffect = "copy";
    },
    [disabled]
  );

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();

      setIsDragging(false);

      if (disabled) return;

      const items = Array.from(e.dataTransfer.items);
      onFileDrop(items);
    },
    [disabled, onFileDrop]
  );

  return {
    isDragging,
    dragBindings: {
      onDragEnter: handleDragEnter,
      onDragLeave: handleDragLeave,
      onDragOver: handleDragOver,
      onDrop: handleDrop,
    },
  };
};
