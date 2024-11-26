import { useCallback, useState } from "react";
import { FileItem } from "../types";

interface UseDragAndDropProps {
  onMove?: (from: FileItem, to: FileItem, files: FileItem[]) => Promise<void>;
}

export const useDragAndDrop = ({ onMove }: UseDragAndDropProps) => {
  const [draggedOver, setDraggedOver] = useState<FileItem[]>([]);
  const [from, setFrom] = useState<FileItem | null>(null);

  const handleDragStart = useCallback(
    (_event: React.DragEvent, from: FileItem, files: FileItem[]) => {
      setFrom(from);
      setDraggedOver(files);
    },
    []
  );

  const handleDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
  }, []);

  const handleDragLeave = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    // setDraggedOver([]);
    // setFrom(null);
  }, []);

  const handleDrop = useCallback(
    async (event: React.DragEvent, to: FileItem) => {
      event.preventDefault();
      event.stopPropagation();

      try {
        // 检查是否在拖拽到自身或其子目录
        const isInvalidMove = draggedOver.some((item) => {
          return to.path === item.path || to.path.startsWith(item.path + "/");
        });

        if (isInvalidMove) {
          return;
        }

        await onMove?.(from!, to, draggedOver);
      } catch (error) {
        console.error("Drop failed:", error);
      }

      setDraggedOver([]);
      setFrom(null);
    },
    [onMove, from, draggedOver]
  );

  return {
    draggedOver,
    handleDragStart,
    handleDragOver,
    handleDragLeave,
    handleDrop,
  };
};
