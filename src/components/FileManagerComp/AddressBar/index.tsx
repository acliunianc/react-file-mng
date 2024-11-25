import { FolderIcon } from "@heroicons/react/24/outline";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { FileItem } from "../types";

interface PathInputProps {
  path: string;
  folders: FileItem[];
  onNavigate: (path: string) => void;
}

const AddressBar: React.FC<PathInputProps> = ({
  path,
  folders,
  onNavigate,
}) => {
  const [inputValue, setInputValue] = useState(path);
  const [showDropdown, setShowDropdown] = useState(false);
  const [filteredFolders, setFilteredFolders] = useState<FileItem[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(-1); // 添加选中项索引
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const selectedItemRef = useRef<HTMLDivElement>(null); // 添加选中项的引用

  // 当 path 改变时更新输入值
  useEffect(() => {
    setInputValue(path);
  }, [path]);

  const handleFilterFolders = useCallback(
    (value: string) => {
      // /Documents/Projects/ReactApp -> search Projects
      // /Documents/Projects/ReactApp/ -> search ReactApp
      // /Documents/ -> search Documents
      // 将最后一个 / 前面的文件夹名称作为搜索条件，folders中寻找

      // 过滤文件夹
      const filtered = folders.filter(
        (folder) =>
          folder.type === "folder" &&
          (folder.path.toLowerCase().startsWith(value.toLowerCase()) ||
            folder.name.toLowerCase().includes(value.toLowerCase()))
      );
      setFilteredFolders(filtered);
    },
    [folders]
  );

  // 处理输入变化
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);
    handleFilterFolders(value);
  };

  // 处理文件夹选择
  const handleFolderSelect = (folder: FileItem) => {
    onNavigate(folder.path);
    setShowDropdown(false);
    inputRef.current?.blur();
  };

  // 鼠标悬停时更新选中索引
  const handleMouseEnter = (index: number) => {
    setSelectedIndex(index);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (selectedIndex >= 0 && selectedIndex < filteredFolders.length) {
        // 如果有选中项，使用选中项的路径
        handleFolderSelect(filteredFolders[selectedIndex]);
      } else {
        // 否则使用输入的路径
        onNavigate(inputValue);
        setShowDropdown(false);
        inputRef.current?.blur();
      }
    } else if (e.key === "Escape") {
      setShowDropdown(false);
      setInputValue(path);
      setSelectedIndex(-1);
      inputRef.current?.blur();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (!showDropdown) {
        setShowDropdown(true);
      }
      setSelectedIndex((prev) =>
        prev < filteredFolders.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : prev));
    } else if (e.key === "Tab") {
      e.preventDefault();
      if (selectedIndex >= 0 && selectedIndex < filteredFolders.length) {
        // Tab 键自动补全
        setInputValue(filteredFolders[selectedIndex].path);
      }
    } else {
      // 输入其他按键的时候重置选中索引
      setSelectedIndex(-1);
    }
  };

  // 点击外部关闭下拉框
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        !inputRef.current?.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative flex-1">
      <input
        ref={inputRef}
        type="text"
        value={inputValue}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        onFocus={(e) => {
          setShowDropdown(true);
          handleFilterFolders(e.target.value);
        }}
        className="w-full px-3 py-1.5 border rounded
                 focus:outline-none focus:ring-2 focus:ring-blue-500
                 text-sm bg-white"
        placeholder="输入路径或搜索文件夹..."
      />

      {/* 下拉框 */}
      {showDropdown && (
        <div
          ref={dropdownRef}
          className="absolute top-full left-0 right-0 mt-1
                     max-h-60 overflow-y-auto
                     bg-white border rounded-md shadow-lg z-50"
        >
          {filteredFolders.length > 0 ? (
            filteredFolders.map((folder, index) => (
              <div
                key={folder.path}
                ref={index === selectedIndex ? selectedItemRef : null}
                className={`flex items-center px-3 py-2 cursor-pointer transition-colors duration-100 ${
                  index === selectedIndex
                    ? "bg-blue-50 text-blue-700"
                    : "hover:bg-gray-100"
                }`}
                onClick={() => handleFolderSelect(folder)}
                onMouseEnter={() => handleMouseEnter(index)}
              >
                <FolderIcon
                  className={`w-4 h-4 mr-2 ${
                    index === selectedIndex
                      ? "text-blue-500"
                      : "text-yellow-500"
                  }`}
                />
                <div className="flex flex-col">
                  <span className="text-sm">{folder.name}</span>
                  <span
                    className={`text-xs ${
                      index === selectedIndex
                        ? "text-blue-500"
                        : "text-gray-500"
                    }`}
                  >
                    {folder.path}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="px-3 py-2 text-sm text-gray-500">
              没有找到匹配的文件夹
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AddressBar;
