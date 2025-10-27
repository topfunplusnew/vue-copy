// 文件类型枚举
export enum FileType {
  PDF = 'pdf',
  DOC = 'doc',
  DOCX = 'docx',
  PPT = 'ppt',
  PPTX = 'pptx',
  XLS = 'xls',
  XLSX = 'xlsx',
  JPG = 'jpg',
  JPEG = 'jpeg',
  PNG = 'png',
  GIF = 'gif',
  MP4 = 'mp4',
  AVI = 'avi',
  MOV = 'mov',
  ZIP = 'zip',
  RAR = 'rar',
  SEVENZ = '7z',
  TXT = 'txt',
  UNKNOWN = 'unknown'
}

// 文件类型图标映射
export const FILE_TYPE_ICONS: Record<FileType, string> = {
  [FileType.PDF]: '📄',
  [FileType.DOC]: '📝',
  [FileType.DOCX]: '📝',
  [FileType.PPT]: '📊',
  [FileType.PPTX]: '📊',
  [FileType.XLS]: '📈',
  [FileType.XLSX]: '📈',
  [FileType.JPG]: '🖼️',
  [FileType.JPEG]: '🖼️',
  [FileType.PNG]: '🖼️',
  [FileType.GIF]: '🖼️',
  [FileType.MP4]: '🎥',
  [FileType.AVI]: '🎥',
  [FileType.MOV]: '🎥',
  [FileType.ZIP]: '📦',
  [FileType.RAR]: '📦',
  [FileType.SEVENZ]: '📦',
  [FileType.TXT]: '📃',
  [FileType.UNKNOWN]: '📎'
};

// 文件类型分类
export const FILE_CATEGORIES: Record<string, FileType[]> = {
  DOCUMENTS: [FileType.PDF, FileType.DOC, FileType.DOCX, FileType.TXT],
  PRESENTATIONS: [FileType.PPT, FileType.PPTX],
  SPREADSHEETS: [FileType.XLS, FileType.XLSX],
  IMAGES: [FileType.JPG, FileType.JPEG, FileType.PNG, FileType.GIF],
  VIDEOS: [FileType.MP4, FileType.AVI, FileType.MOV],
  ARCHIVES: [FileType.ZIP, FileType.RAR, FileType.SEVENZ]
};

/**
 * 根据文件名获取文件类型
 * @param fileName 文件名
 * @returns FileType 文件类型
 */
export function getFileType(fileName: string): FileType {
  const extension = fileName.split('.').pop()?.toLowerCase();
  
  if (!extension) return FileType.UNKNOWN;
  
  // 检查是否为已知的文件类型
  const fileType = Object.values(FileType).find(type => type === extension);
  return fileType || FileType.UNKNOWN;
}

/**
 * 根据文件名获取对应的图标
 * @param fileName 文件名
 * @returns string 图标字符串
 */
export function getFileIcon(fileName: string): string {
  const fileType = getFileType(fileName);
  return FILE_TYPE_ICONS[fileType];
}

/**
 * 检查文件是否为指定类型
 * @param fileName 文件名
 * @param fileType 文件类型
 * @returns boolean
 */
export function isFileType(fileName: string, fileType: FileType): boolean {
  return getFileType(fileName) === fileType;
}

/**
 * 检查文件是否属于指定分类
 * @param fileName 文件名
 * @param category 文件分类
 * @returns boolean
 */
export function isFileCategory(fileName: string, category: string): boolean {
  const fileType = getFileType(fileName);
  return FILE_CATEGORIES[category]?.includes(fileType) || false;
}
