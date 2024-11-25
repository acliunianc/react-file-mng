import { CloudArrowUpIcon } from '@heroicons/react/24/outline';
import React from 'react';

interface DropZoneProps {
  active: boolean;
}

const DropZone: React.FC<DropZoneProps> = ({ active }) => {
  if (!active) return null;

  return (
    <div
      className="absolute inset-0 bg-blue-500/10 backdrop-blur-[1px] z-50
                    flex items-center justify-center"
    >
      <div
        className="bg-white/90 rounded-lg shadow-lg p-6
                    flex flex-col items-center gap-3
                    border-2 border-dashed border-blue-500"
      >
        <CloudArrowUpIcon className="w-12 h-12 text-blue-500" />
        <div className="text-lg font-medium text-gray-700">
          拖放文件或文件夹到这里
        </div>
        <div className="text-sm text-gray-500">释放鼠标以开始上传</div>
      </div>
    </div>
  );
};
export default DropZone;
