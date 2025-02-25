export function getImageUrl(imagePath: string) {
  // 如果是完整的 URL，直接返回
  if (imagePath.startsWith('http') || imagePath.startsWith('data:')) {
    return imagePath;
  }
  // 否则拼接基础路径
  return `/images/${imagePath}`;
}
