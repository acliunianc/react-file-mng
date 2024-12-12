# react-file-mng

基于React框架的类似于Windows资源管理器的文件管理库



# Preview

https://stackblitz.com/edit/vitejs-vite-fygza3?file=src%2FApp.tsx



## Implemented && Todo

Implemented:

1. 路径和当前所处文件夹映射
2. 文件导航提示下拉菜单
3. 进入文件夹
4. 移动、删除、复制、粘贴、创建文件夹...
5. 全局快捷键
6. 切换显示视图
7. 拖拽上传
8. 拖拽移动文件夹
9. 允许禁用和自定义右键上下文菜单
10. 默认排序
11. 优化右键菜单空间超出视口范围时的显示效果



Todo:

1. 允许自定义列
2. 允许自定义排序方法
3. loading效果



## Installation

```shell
npm install react-file-mng
```



## Usage

```tsx
import { FileManager } from "react-file-mng";
import "react-file-mng/index.css";
import { ReactNode, useState } from "react";

type FileType = "file" | "folder";
interface FileItem {
  id: string;
  name: string;
  path: string;
  type: FileType;
  size: number;
  modifiedDate: string | number;
  extension?: string;
  children?: FileItem[];
  parent?: FileItem;
  editing?: boolean;
  previewImage?: string | ReactNode;
}

const files: FileItem[] = [
  {
    id: "1",
    name: "Documents",
    path: "/Documents",
    type: "folder",
    size: 0,
    modifiedDate: new Date("2024-03-15").valueOf(),
    children: [
      {
        id: "1-1",
        name: "Project Proposal.docx",
        path: "/Documents/Project Proposal.docx",
        type: "file",
        size: 2458000,
        modifiedDate: new Date("2024-03-14").valueOf(),
        extension: "docx",
      },
      {
        id: "1-2",
        name: "Budget 2024",
        path: "/Documents/Budget 2024",
        type: "folder",
        size: 0,
        modifiedDate: new Date("2024-03-10").valueOf(),
        children: [
          {
            id: "1-2-1",
            name: "Q1 Report.xlsx",
            path: "/Documents/Budget 2024/Q1 Report.xlsx",
            type: "file",
            size: 1548000,
            modifiedDate: new Date("2024-03-10").valueOf(),
            extension: "xlsx",
          },
          {
            id: "1-2-2",
            name: "Q2 Forecast.xlsx",
            path: "/Documents/Budget 2024/Q2 Forecast.xlsx",
            type: "file",
            size: 1342000,
            modifiedDate: new Date("2024-03-09").valueOf(),
            extension: "xlsx",
          },
        ],
      },
    ],
  },
  {
    id: "2",
    name: "Images",
    path: "/Images",
    type: "folder",
    size: 0,
    modifiedDate: new Date("2024-03-16").valueOf(),
    children: [
      {
        id: "2-1",
        name: "Product Photos",
        path: "/Images/Product Photos",
        type: "folder",
        size: 0,
        modifiedDate: new Date("2024-03-16").valueOf(),
        children: [
          {
            id: "2-1-1",
            name: "product-001.jpg",
            path: "/Images/Product Photos/product-001.jpg",
            type: "file",
            size: 3245000,
            modifiedDate: new Date("2024-03-16").valueOf(),
            extension: "jpg",
          },
          {
            id: "2-1-2",
            name: "product-002.jpg",
            path: "/Images/Product Photos/product-002.jpg",
            type: "file",
            size: 2845000,
            modifiedDate: new Date("2024-03-16").valueOf(),
            extension: "jpg",
          },
        ],
      },
      {
        id: "2-2",
        name: "banner.png",
        path: "/Images/banner.png",
        type: "file",
        size: 4562000,
        modifiedDate: new Date("2024-03-15").valueOf(),
        extension: "png",
        previewImage:
          "https://gw.alipayobjects.com/zos/rmsportal/KDpgvguMpGfqaHPjicRK.svg",
      },
    ],
  },
  {
    id: "3",
    name: "Projects",
    path: "/Projects",
    type: "folder",
    size: 0,
    modifiedDate: new Date("2024-03-17").valueOf(),
    children: [
      {
        id: "3-1",
        name: "Backend",
        path: "/Projects/Backend",
        type: "folder",
        size: 0,
        modifiedDate: new Date("2024-03-17").valueOf(),
        children: [
          {
            id: "3-1-1",
            name: "source-code.zip",
            path: "/Projects/Backend/source-code.zip",
            type: "file",
            size: 15678000,
            modifiedDate: new Date("2024-03-17").valueOf(),
            extension: "zip",
          },
          {
            id: "3-1-2",
            name: "readme.md",
            path: "/Projects/Backend/readme.md",
            type: "file",
            size: 12400,
            modifiedDate: new Date("2024-03-16").valueOf(),
            extension: "md",
          },
        ],
      },
      {
        id: "3-2",
        name: "Frontend",
        path: "/Projects/Frontend",
        type: "folder",
        size: 0,
        modifiedDate: new Date("2024-03-17").valueOf(),
        children: [
          {
            id: "3-2-1",
            name: "build.tar.gz",
            path: "/Projects/Frontend/build.tar.gz",
            type: "file",
            size: 8567000,
            modifiedDate: new Date("2024-03-17").valueOf(),
            extension: "gz",
          },
          {
            id: "3-2-2",
            name: "design-specs.pdf",
            path: "/Projects/Frontend/design-specs.pdf",
            type: "file",
            size: 5648000,
            modifiedDate: new Date("2024-03-15").valueOf(),
            extension: "pdf",
          },
        ],
      },
    ],
  },
  {
    id: "4",
    name: "Downloads",
    path: "/Downloads",
    type: "folder",
    size: 0,
    modifiedDate: new Date("2024-03-18").valueOf(),
    children: [
      {
        id: "4-1",
        name: "software-update.exe",
        path: "/Downloads/software-update.exe",
        type: "file",
        size: 245890000,
        modifiedDate: new Date("2024-03-18").valueOf(),
        extension: "exe",
      },
      {
        id: "4-2",
        name: "presentation.pptx",
        path: "/Downloads/presentation.pptx",
        type: "file",
        size: 8567000,
        modifiedDate: new Date("2024-03-17").valueOf(),
        extension: "pptx",
      },
    ],
  },
];

const deepFind = <T extends Record<PropertyKey, any>>(
  originArr: T[],
  callback: (item: T, parent?: T | null) => boolean,
  {
    childrenKey = "children",
    structure = false,
  }: { childrenKey?: keyof T; structure?: boolean } = {}
): T | null => {
  if (!Array.isArray(originArr)) {
    throw new Error("请传入数组");
  }

  let result: T | null = null;
  const core = (arr: T[], parent?: T | null): void => {
    for (const item of arr) {
      const condition = callback(item, parent);
      structure && ((item as T & { parent?: T | null }).parent = parent);
      if (condition) {
        result = item;
        return;
      }
      item[childrenKey] && core(item[childrenKey] as T[], item);
    }
  };
  core(originArr, null);

  return result;
};

const deepMap = <
  T extends Record<PropertyKey, any>,
  R extends Record<PropertyKey, any>
>(
  originArr: T[] = [],
  callback: (item: T, index: number, arr: T[]) => R,
  {
    childrenKey = "children",
    toChildrenKey = childrenKey,
  }: { childrenKey?: keyof T; toChildrenKey?: keyof R } = {}
): R[] => {
  const core = (arr: T[]): R[] => {
    return arr.map((item, index, array) => {
      const res = callback(item, index, array);
      const children = item[childrenKey] as T[] | undefined;
      if (Array.isArray(children) && children.length > 0) {
        (res[toChildrenKey] as R[]) = core(children);
      }

      return res;
    });
  };

  return core(originArr);
};

const App = () => {
  const [realFiles, setRealFiles] = useState<FileItem[]>(() => files);
  const [openedKey, setOpenedKey] = useState("0");

  return (
    <div style={{ display: "flex", height: "80vh" }}>
      <FileManager
        files={realFiles}
        openedKey={openedKey}
        // disabledContextMenu
        // contextMenuItems={[
        //   {
        //     key: "1",
        //     label: "测试",
        //     onClick(...args) {
        //       // 摁下ctrl+c将执行该onClick方法
        //       console.log("qwe", args);
        //     },
        //     shortcut: "ctrl+c",
        //   },
        // ]}
        onNavigate={async (file) => {
          if (!file) return alert("路径不存在");
          setOpenedKey(file.id);
        }}
        onPaste={async (to, files) => {
          setRealFiles((prev) => {
            const cur = deepFind(prev, (item) => item.id === to.id);

            if (cur) {
              cur.children = [...(cur.children || []), ...files];
            } else if (to.id === "0") {
              // 处理粘贴到最外层的清空
              files.forEach((file) => {
                prev.push(file);
              });
            }

            return [...prev];
          });
        }}
        onMove={async (from, to, files) => {
          const newFiles = deepMap(files, (file) => ({
            ...file,
            path: to.path + file.path,
          }));
          setRealFiles((prev) => {
            let result = [...prev];
            // 删除from的children
            const fromCur = deepFind(prev, (item) => item.id === from.id);
            if (fromCur) {
              fromCur.children = fromCur.children?.filter(
                (item) => !newFiles.map((it) => it.id).includes(item.id)
              );
            } else if (from.id === "0") {
              // 处理移动最外层的文件到其他地方的情况
              result = prev.filter(
                (item) => !newFiles.map((it) => it.id).includes(item.id)
              );
            }

            // 增加to的children
            const cur = deepFind(prev, (item) => item.id === to.id);
            if (cur) {
              cur.children = [...(cur.children || []), ...newFiles];
            } else if (to.id === "0") {
              // 处理移动其他地方的文件到最外层的情况
              newFiles.forEach((file) => {
                result.push({ ...file, path: to.path + file.path });
              });
            }
            return result;
          });
        }}
        onDelete={async (from, ids) => {
          setRealFiles((prev) => {
            let result = [...prev];
            const cur = deepFind(result, (item) => item.id === from.id);
            if (cur) {
              cur.children = cur.children?.filter((it) => !ids.includes(it.id));
            } else if (from.id === "0") {
              // 处理删除最外层的文件的情况
              result = result.filter((item) => !ids.includes(item.id));
            }
            return result;
          });
        }}
        onCreateFolder={async (from: FileItem) => {
          setRealFiles((prev) => {
            const cur = deepFind(prev, (item) => item.id === from.id);
            const newFolder = {
              id: "" + Math.random(),
              name: "新建文件夹",
              type: "folder",
              size: 0,
              modifiedDate: new Date().valueOf(),
              children: [],
              editing: true,
            };

            if (cur) {
              cur.children = [
                ...(cur.children || []),
                {
                  ...newFolder,
                  type: "folder",
                  path: `${cur.path}/${newFolder.name}`,
                },
              ];
            } else if (from.id === "0") {
              // 处理在最外层新增的情况
              prev.push({
                ...newFolder,
                type: "folder",
                path: `/${newFolder.name}`,
              });
            }
            return [...prev];
          });
        }}
        onRename={async (from, value) => {
          setRealFiles((prev) => {
            const cur = deepFind(prev, (item) => item.id === from.id);
            if (cur) {
              cur.name = value;
              cur.path = `${cur.path
                .split("/")
                .slice(0, -1)
                .join("/")}/${value}`;
            }
            return [...prev];
          });
        }}
        onUpload={async (to, files) => {
          console.log("files", to, files);
          console.log("执行上传方法....");
        }}
        onDownload={(file) => {
          console.log("通知服务器开始下载该文件", file);
        }}
      />
    </div>
  );
};

export default App;
```



## Doc

| **参数**            | 必填 | 说明                                                     | 默认值   | 类型                                                         |
| ------------------- | ---- | -------------------------------------------------------- | -------- | ------------------------------------------------------------ |
| files               | 是   | 文件列表                                                 |          | [`FileItem`](#FileItem)[]                                    |
| openedKey           | 是   | 当前打开的文件夹`key`                                    |          | `string`                                                     |
| defaultViewMode     |      | 默认的视图                                               | `"list"` | `ViewMode`                                                   |
| disabledContextMenu |      | 禁用右键菜单                                             | `false`  | `boolean`                                                    |
| contextMenuItems    |      | 自定义右键菜单                                           |          | ([`MenuItem`](#MenuItem)&#124;[`SeparatorItem`](#SeparatorItem))[] |
| onNavigate          |      | 打开文件夹或者输入地址栏跳转时触发的回调函数             |          | `(file: FileItem`&#124;`null, path: string) => Promise<any>` |
| onPaste             |      | 右键菜单选择**粘贴**时触发时的回调函数（复制->粘贴触发） |          | `(to: FileItem, files: FileItem[]) => Promise<any>`          |
| onDelete            |      | 右键菜单选择**删除**时触发的回调函数                     |          | `(from: FileItem, ids: string[], files: FileItem[]) => Promise<any>` |
| onCreateFolder      |      | 右键菜单选择**创建文件夹**时的回调函数                   |          | `(from: FileItem) => Promise<any>`                           |
| onMove              |      | 移动文件到另一个文件夹下的回调函数（剪切->粘贴触发）     |          | `(from: FileItem, to: FileItem, files: FileItem[]) => Promise<any>` |
| onRename            |      | 右键菜单选择**重命名**时的回调函数                       |          | `(file: FileItem, value: string) => Promise<any>`            |
| onUpload            |      | 拖拽文件夹/文件到区域中的回调函数                        |          | `(to: FileItem, files: FileWithPath[]) => Promise<any>`      |
| onDownload          |      | 右键菜单选择**下载**时的回调函数                         |          | `(file: FileItem) => void`                                   |



## Types

### FileItem

```ts
interface FileItem {
  id: string;
  name: string;
  path: string;
  type: "file" | "folder";
  size: number;
  modifiedDate: string | number;
  extension?: string;
  children?: FileItem[];
  parent?: FileItem;
  editing?: boolean;
  previewImage?: string | ReactNode;
}
```



### ViewMode

```ts
export type ViewMode = 'grid' | 'list';
```



### MenuItem

```ts
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
    },
  ) => void;
  disabled?: boolean;
  shortcut?: string;
  danger?: boolean;
}
```



### SeparatorItem

```ts
type SeparatorItem = {
  type: 'separator';
}
```

