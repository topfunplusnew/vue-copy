import type { Plugin } from 'vite';

/**
 * Vite 插件：在生产环境移除所有 console 语句
 * @param options 插件选项
 * @param options.include 要处理的文件类型，默认为 ['js', 'ts', 'jsx', 'tsx', 'vue']
 * @param options.exclude 排除的文件路径模式
 * @param options.drop 要移除的 console 方法，默认为 ['log']，设置为 '*' 移除所有 console 方法
 */
export default function removeConsolePlugin(
  options: {
    include?: string[];
    exclude?: string | RegExp | ((id: string) => boolean);
    drop?: string[] | '*';
  } = {},
): Plugin {
  const { include = ['js', 'ts', 'jsx', 'tsx', 'vue'], exclude, drop = ['log'] } = options;

  const fileExtensionRegex = new RegExp(`\\.(${include.join('|')})(\\?.*)?$`);

  const shouldExclude = (id: string): boolean => {
    if (!exclude) return false;
    if (typeof exclude === 'string') {
      return id.includes(exclude);
    }
    if (exclude instanceof RegExp) {
      return exclude.test(id);
    }
    if (typeof exclude === 'function') {
      return exclude(id);
    }
    return false;
  };

  // 匹配括号对，处理嵌套和多行的情况
  const matchParentheses = (str: string, start: number): number => {
    let depth = 1;
    let i = start;
    while (i < str.length && depth > 0) {
      if (str[i] === '(') depth++;
      else if (str[i] === ')') depth--;
      i++;
    }
    return i;
  };

  // 将 console 语句替换为 void 0，使其不执行任何操作
  const removeConsoleStatements = (code: string): string => {
    let result = code;
    const consoleMethods =
      drop === '*'
        ? ['log', 'debug', 'info', 'warn', 'error', 'trace', 'table', 'group', 'groupEnd', 'groupCollapsed', 'time', 'timeEnd', 'count', 'clear', 'assert', 'dir', 'dirxml', 'profile', 'profileEnd']
        : drop;

    // 遍历所有 console 方法
    for (const method of consoleMethods) {
      const methodPattern = new RegExp(`console\\.${method}\\s*\\(`, 'g');
      let match;

      // 从后往前替换，避免索引偏移问题
      const matches: Array<{ start: number; closeParen: number }> = [];

      while ((match = methodPattern.exec(result)) !== null) {
        const start = match.index;
        const openParen = start + match[0].length - 1;
        const closeParen = matchParentheses(result, openParen + 1);

        // 检查是否找到匹配的右括号
        if (closeParen <= result.length) {
          matches.push({ start, closeParen });
        }
      }

      // 从后往前替换，避免索引偏移
      for (let i = matches.length - 1; i >= 0; i--) {
        const { start, closeParen } = matches[i];
        // 替换为 void 0，使其不执行任何操作
        result = result.substring(0, start) + '(void 0)' + result.substring(closeParen);
      }
    }

    return result;
  };

  return {
    name: 'vite-plugin-remove-console',
    enforce: 'pre',
    transform(code, id) {
      // 在生产环境和测试环境处理
      const isProduction = process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'prod' || process.env.MODE === 'production';
    //   const isTest = process.env.NODE_ENV === 'development' || process.env.MODE === 'development';

      if (!isProduction ) {
        return null;
      }

      // 检查文件类型
      if (!fileExtensionRegex.test(id)) {
        return null;
      }

      // 检查是否应该排除
      if (shouldExclude(id)) {
        return null;
      }

      // 检查是否包含 console
      if (!code.includes('console.')) {
        return null;
      }

      try {
        // 移除 console 语句
        const transformedCode = removeConsoleStatements(code);

        // 如果代码没有变化，返回 null（Vite 优化）
        if (transformedCode === code) {
          return null;
        }

        return {
          code: transformedCode,
          map: null, // 不生成 source map 以提高性能
        };
      } catch {
        // 如果转换失败，返回原始代码
        // 注意：这里不能使用 console.warn，因为可能会在生产环境被移除
        return null;
      }
    },
  };
}
