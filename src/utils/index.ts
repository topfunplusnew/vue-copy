export function getImageUrl(imagePath?: string) {
  if (!imagePath) return '';
  // 如果是完整的 URL，直接返回
  if (imagePath.startsWith('http') || imagePath.startsWith('data:')) {
    return imagePath;
  }
  // 否则拼接基础路径
  return `/images/${imagePath}`;
}


export function deepClone(obj: object) {//深拷贝
  return JSON.parse(JSON.stringify(obj))
}


