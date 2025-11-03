import fs from 'fs';
import path from 'path';

export default function galleryPlugin(options: { dir?: string; virtualId?: string } = {}) {
  const {
    dir = 'public/QS LOGO', // 默认目录
    virtualId = 'virtual:gallery', // 虚拟模块名
  } = options;

  const resolvedVirtualId = '\0' + virtualId;
  const rootDir = path.resolve(process.cwd(), dir);

  // 工具函数：递归读取图片文件
  function readImagesRecursively(dirPath: string): string[] {
    if (!fs.existsSync(dirPath)) return [];

    const entries = fs.readdirSync(dirPath);
    let files: string[] = [];

    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        files = files.concat(readImagesRecursively(fullPath));
      } else if (/\.(png|jpe?g|gif|webp|svg)$/i.test(entry)) {
        // 转换为相对于 public 目录的路径
        const relativePath = '/' + path.relative(path.join(process.cwd(), 'public'), fullPath).replace(/\\/g, '/');
        files.push(relativePath);
      }
    }

    return files;
  }

  // 生成模块代码
  function generateModule(): string {
    if (!fs.existsSync(rootDir)) return `export default []`;
    const files = readImagesRecursively(rootDir);
    return `export default ${JSON.stringify(files, null, 2)}`;
  }

  return {
    name: 'vite-plugin-gallery',
    resolveId(id: string) {
      if (id === virtualId) return resolvedVirtualId;
      return null;
    },
    load(id: string) {
      if (id === resolvedVirtualId) return generateModule();
      return null;
    },
    handleHotUpdate({ file, server }: { file: string; server: any }) {
      // 只要变化文件在目标目录下，就重新生成模块并刷新页面
      const normalizedFile = path.normalize(file);
      const normalizedRootDir = path.normalize(rootDir);
      if (normalizedFile.startsWith(normalizedRootDir)) {
        const mod = server.moduleGraph.getModuleById(resolvedVirtualId);
        if (mod) {
          server.moduleGraph.invalidateModule(mod);
          server.ws.send({ type: 'full-reload' });
        }
      }
    },
  };
}

