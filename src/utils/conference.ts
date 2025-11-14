import type { TabKey, FileType } from '@/types/conference';

/**
 * 根据 TabKey 获取对应的 FileType
 * @param tabKey - 标签页键值
 * @returns 对应的文件类型
 */
export function getFileTypeByTabKey(tabKey: TabKey): FileType {
  const tabToFileTypeMap: Record<TabKey, FileType> = {
    details: 'graphic_abstract',
    video: 'video',
    slides: 'slide',
    poster: 'poster',
    additional: 'addition_files',
    fulltext: 'full_text',
  };
  
  return tabToFileTypeMap[tabKey];
}