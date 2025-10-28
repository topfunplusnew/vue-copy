export function getImageUrl(imagePath?: string) {
  console.log('Getting image url', imagePath);
  if (!imagePath) return '';
  // 如果是完整的 URL，直接返回
  if (imagePath.startsWith('http') || imagePath.startsWith('data:')) {
    return imagePath;
  }
  // 否则拼接基础路径
  return `/images/${imagePath}`;
}

export function deepClone(obj: object) {
  //深拷贝
  return JSON.parse(JSON.stringify(obj));
}

/**
 * 判断文件是否为视频文件
 * @param url - 文件URL
 * @returns 是否为视频文件
 */
export function isVideoFile(url: string): boolean {
  const videoExtensions = ['.mp4', '.avi', '.mov', '.wmv', '.flv', '.webm', '.mkv', '.m4v'];
  const lowerUrl = url.toLowerCase();
  return videoExtensions.some((ext) => lowerUrl.includes(ext));
}

/**
 * 判断文件是否为PDF文件
 * @param url - 文件URL
 * @returns 是否为PDF文件
 */
export function isPdfFile(url: string): boolean {
  const pdfExtensions = ['.pdf'];
  const lowerUrl = url.toLowerCase();
  return pdfExtensions.some((ext) => lowerUrl.includes(ext));
}

/**
 * 判断文件是否为图片文件
 * @param url - 文件URL
 * @returns 是否为图片文件
 */
export function isImageFile(url: string): boolean {
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.svg'];
  const lowerUrl = url.toLowerCase();
  return imageExtensions.some((ext) => lowerUrl.includes(ext));
}

export const downloadFile = (url: string, filename: string) => {
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
