import { ReactNode } from 'react';

export type FileType = 'file' | 'folder';

export interface FileItem {
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

export type ViewMode = 'grid' | 'list';

export interface SortConfig {
  field: keyof Pick<FileItem, 'name' | 'type' | 'size' | 'modifiedDate'>;
  direction: 'asc' | 'desc';
}
