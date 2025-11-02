<template>
  <div class="latex-content-wrapper">
    <div v-if="!isEditing" class="latex-view-mode" @click="enterEditMode" :class="{ 'is-clickable': editable }">
      <div ref="latexContainer" class="latex-content"></div>
      <div v-if="!props.latex" class="latex-placeholder">{{ placeholder || '点击编辑' }}</div>
      <div v-if="editable && props.latex" class="edit-hint">点击编辑</div>
    </div>
    <div v-else class="latex-edit-mode">
      <el-input ref="textareaRef" v-model="editValue" type="textarea" :rows="rows" :placeholder="placeholder || '请输入 LaTeX 内容...'" resize="vertical" class="latex-textarea" />
      <div class="latex-edit-actions">
        <el-button size="small" @click="cancelEdit">取消</el-button>
        <el-button type="primary" size="small" @click="saveEdit">保存</el-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, nextTick } from 'vue';
import { ElInput } from 'element-plus';
import katex from 'katex';
import 'katex/dist/katex.min.css';

interface Props {
  // LaTeX 表达式字符串
  latex?: string;
  // 是否使用块级显示（displayMode），默认为false（行内模式）
  displayMode?: boolean;
  // KaTeX 选项
  options?: katex.KatexOptions;
  // 是否可编辑
  editable?: boolean;
  // 占位符文本
  placeholder?: string;
  // textarea 行数
  rows?: number;
}

const props = withDefaults(defineProps<Props>(), {
  latex: '',
  displayMode: false,
  editable: false,
  placeholder: '',
  rows: 6,
});

const emit = defineEmits<{
  'update:latex': [value: string];
  change: [value: string];
}>();

const latexContainer = ref<HTMLElement | null>(null);
const textareaRef = ref<InstanceType<typeof ElInput> | null>(null);
const isEditing = ref(false);
const editValue = ref('');

const renderLatex = () => {
  if (!latexContainer.value || isEditing.value) {
    return;
  }

  // 清空容器内容
  latexContainer.value.innerHTML = '';

  // 如果latex为空，直接返回
  if (!props.latex) {
    return;
  }

  try {
    // 检查是否是完整的 LaTeX 文档（包含 \documentclass, \begin{document} 等）
    const isFullDocument = props.latex.includes('\\documentclass') || props.latex.includes('\\begin{document}') || props.latex.includes('\\usepackage');

    if (isFullDocument) {
      // 完整 LaTeX 文档：提取并渲染数学表达式，其他部分作为文本显示
      renderFullDocument(props.latex);
    } else {
      // 纯数学表达式：直接渲染
      renderMathExpression(props.latex);
    }
  } catch (error) {
    console.error('LaTeX 渲染错误:', error);
    if (latexContainer.value) {
      latexContainer.value.textContent = props.latex;
    }
  }
};

// 渲染完整的 LaTeX 文档（提取数学表达式）
const renderFullDocument = (latex: string) => {
  if (!latexContainer.value) return;

  // 移除 documentclass、usepackage、begin{document}、end{document} 等文档命令
  const content = latex
    .replace(/\\documentclass\{[^}]*\}/g, '')
    .replace(/\\usepackage\[[^\]]*\]\{[^}]*\}/g, '')
    .replace(/\\usepackage\{[^}]*\}/g, '')
    .replace(/\\title\{[^}]*\}/g, '')
    .replace(/\\author\{[^}]*\}/g, '')
    .replace(/\\maketitle/g, '')
    .replace(/\\begin\{document\}/g, '')
    .replace(/\\end\{document\}/g, '')
    .replace(/\\bibliographystyle\{[^}]*\}/g, '')
    .replace(/\\bibliography\{[^}]*\}/g, '');

  // 提取和处理数学表达式
  // 匹配 $$...$$, \[...\], \begin{equation}...\end{equation}, \begin{align}...\end{align} 等块级数学
  // 以及 $...$, \(...\) 等行内数学

  const blockMathRegex =
    /(\$\$[\s\S]*?\$\$|\\\[[\s\S]*?\\\]|\\begin\{(equation|equation\*|align|align\*|eqnarray|eqnarray\*|gather|gather\*|multline|multline\*)\}[\s\S]*?\\end\{(equation|equation\*|align|align\*|eqnarray|eqnarray\*|gather|gather\*|multline|multline\*)\})/g;
  const inlineMathRegex = /(\$[^$\n]+?\$|\\\([^\)]+?\\\))/g;

  const parts: Array<{ type: 'text' | 'block' | 'inline'; content: string }> = [];
  let lastIndex = 0;
  let match;

  // 辅助函数：处理文本中的行内数学
  const processInlineMath = (text: string): Array<{ type: 'text' | 'inline'; content: string }> => {
    const textParts: Array<{ type: 'text' | 'inline'; content: string }> = [];
    let textLastIndex = 0;
    let inlineMatch;

    while ((inlineMatch = inlineMathRegex.exec(text)) !== null) {
      // 添加行内数学之前的文本
      if (inlineMatch.index > textLastIndex) {
        const textContent = text.substring(textLastIndex, inlineMatch.index);
        if (textContent.trim()) {
          textParts.push({ type: 'text', content: textContent });
        }
      }
      // 提取数学表达式内容
      let mathContent = inlineMatch[1];
      if (mathContent.startsWith('$')) {
        mathContent = mathContent.slice(1, -1);
      } else if (mathContent.startsWith('\\(')) {
        mathContent = mathContent.slice(2, -2);
      }
      textParts.push({ type: 'inline', content: mathContent.trim() });
      textLastIndex = inlineMatch.index + inlineMatch[0].length;
    }

    // 添加最后剩余的文本
    if (textLastIndex < text.length) {
      const textContent = text.substring(textLastIndex);
      if (textContent.trim()) {
        textParts.push({ type: 'text', content: textContent });
      }
    }

    // 如果没有找到任何数学表达式，返回整个文本
    return textParts.length > 0 ? textParts : [{ type: 'text', content: text }];
  };

  // 先处理块级数学
  while ((match = blockMathRegex.exec(content)) !== null) {
    // 处理块级数学之前的文本（可能包含行内数学）
    if (match.index > lastIndex) {
      const text = content.substring(lastIndex, match.index);
      if (text.trim()) {
        const processedTextParts = processInlineMath(text);
        parts.push(...processedTextParts);
      }
    }
    // 提取数学表达式内容
    let mathContent = match[1];
    if (mathContent.startsWith('$$')) {
      mathContent = mathContent.slice(2, -2);
    } else if (mathContent.startsWith('\\[')) {
      mathContent = mathContent.slice(2, -2);
    } else if (mathContent.startsWith('\\begin{')) {
      // 提取 \begin{...} 和 \end{...} 之间的内容
      const beginMatch = mathContent.match(/\\begin\{[^}]+\}/);
      if (beginMatch) {
        const beginTag = beginMatch[0];
        const endTag = beginTag.replace('begin', 'end');
        const startIdx = mathContent.indexOf(beginTag) + beginTag.length;
        const endIdx = mathContent.lastIndexOf(endTag);
        if (endIdx > startIdx) {
          mathContent = mathContent.substring(startIdx, endIdx);
        }
      }
    }
    parts.push({ type: 'block', content: mathContent.trim() });
    lastIndex = match.index + match[0].length;
  }

  // 处理剩余的文本（可能包含行内数学）
  if (lastIndex < content.length) {
    const remainingText = content.substring(lastIndex);
    if (remainingText.trim()) {
      const processedTextParts = processInlineMath(remainingText);
      parts.push(...processedTextParts);
    }
  }

  // 渲染所有部分
  // 需要合并连续的文本和行内数学到一个容器中
  let currentTextContainer: HTMLDivElement | null = null;

  parts.forEach((part, index) => {
    if (part.type === 'text') {
      // 如果当前没有文本容器，或者上一个部分是块级数学，创建新容器
      if (!currentTextContainer || (index > 0 && parts[index - 1].type === 'block')) {
        currentTextContainer = document.createElement('div');
        currentTextContainer.className = 'latex-text-content';
        latexContainer.value?.appendChild(currentTextContainer);
      }

      // 在文本容器中添加内容
      const textContent = part.content
        .replace(/\\section\{(.+?)\}/g, '<h2>$1</h2>')
        .replace(/\\subsection\{(.+?)\}/g, '<h3>$1</h3>')
        .replace(/\\textbf\{(.+?)\}/g, '<strong>$1</strong>')
        .replace(/\\textit\{(.+?)\}/g, '<em>$1</em>')
        .replace(/\\verb\|(.+?)\|/g, '<code>$1</code>')
        .replace(/\\href\{([^}]+)\}\{([^}]+)\}/g, '<a href="$1">$2</a>')
        .replace(/\\url\{([^}]+)\}/g, '<a href="$1">$1</a>');

      // 处理换行
      const lines = textContent.split('\n');
      lines.forEach((line, lineIndex) => {
        if (lineIndex > 0) {
          currentTextContainer?.appendChild(document.createElement('br'));
        }
        if (line.trim()) {
          const lineSpan = document.createElement('span');
          lineSpan.innerHTML = line;
          currentTextContainer?.appendChild(lineSpan);
        }
      });
    } else if (part.type === 'inline') {
      // 行内数学应该添加到当前的文本容器中
      if (!currentTextContainer) {
        currentTextContainer = document.createElement('div');
        currentTextContainer.className = 'latex-text-content';
        latexContainer.value?.appendChild(currentTextContainer);
      }

      const mathEl = document.createElement('span');
      mathEl.className = 'latex-inline-math';

      try {
        katex.render(part.content, mathEl, {
          displayMode: false,
          throwOnError: false,
          ...props.options,
        });
        currentTextContainer.appendChild(mathEl);
      } catch (error) {
        console.error('数学表达式渲染错误:', error, part.content);
        mathEl.textContent = part.content;
        currentTextContainer.appendChild(mathEl);
      }
    } else if (part.type === 'block') {
      // 块级数学，结束当前文本容器
      currentTextContainer = null;

      const mathEl = document.createElement('div');
      mathEl.className = 'latex-block-math';

      try {
        katex.render(part.content, mathEl, {
          displayMode: true,
          throwOnError: false,
          ...props.options,
        });
        latexContainer.value?.appendChild(mathEl);
      } catch (error) {
        console.error('数学表达式渲染错误:', error, part.content);
        mathEl.textContent = part.content;
        latexContainer.value?.appendChild(mathEl);
      }
    }
  });
};

// 渲染纯数学表达式
const renderMathExpression = (latex: string) => {
  if (!latexContainer.value) return;

  // 处理空格：将普通空格替换为 LaTeX 的强制空格命令
  // KaTeX 在数学模式下会忽略空格，需要将空格替换为 \ (反斜杠+空格) 来保留
  const processedLatex = latex.replace(/ /g, '\\ ');

  katex.render(processedLatex, latexContainer.value, {
    displayMode: props.displayMode,
    throwOnError: false,
    ...props.options,
  });
};

// 进入编辑模式
const enterEditMode = () => {
  if (!props.editable) {
    return;
  }
  isEditing.value = true;
  editValue.value = props.latex;
  // 聚焦到 textarea
  nextTick(() => {
    // 通过 querySelector 查找 textarea 元素
    const wrapperEl = textareaRef.value?.$el;
    if (wrapperEl) {
      const textareaEl = wrapperEl.querySelector('textarea') as HTMLTextAreaElement | null;
      if (textareaEl) {
        textareaEl.focus();
      }
    }
  });
};

// 保存编辑
const saveEdit = () => {
  const newValue = editValue.value.trim();
  emit('update:latex', newValue);
  emit('change', newValue);
  isEditing.value = false;
};

// 取消编辑
const cancelEdit = () => {
  editValue.value = props.latex;
  isEditing.value = false;
};

watch(
  () => props.latex,
  () => {
    if (!isEditing.value) {
      renderLatex();
    }
  },
  { immediate: true },
);

watch(
  () => props.displayMode,
  () => {
    if (!isEditing.value) {
      renderLatex();
    }
  },
);

watch(
  () => isEditing.value,
  (newVal) => {
    if (!newVal) {
      // 退出编辑模式时重新渲染
      nextTick(() => {
        renderLatex();
      });
    }
  },
);

onMounted(() => {
  if (!isEditing.value) {
    renderLatex();
  }
});
</script>

<style scoped lang="scss">
.latex-content-wrapper {
  width: 100%;
  box-sizing: border-box;
}

.latex-view-mode {
  position: relative;
  width: 100%;
  box-sizing: border-box;
  min-height: 60px;
  padding: 12px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  background-color: #fafafa;
  transition: all 0.3s ease;

  &.is-clickable {
    cursor: pointer;

    &:hover {
      border-color: #409eff;
      background-color: #f0f9ff;
    }
  }

  .latex-content {
    display: block;
    width: 100%;
    max-width: 100%;
    overflow-x: auto;
    overflow-y: auto;
    min-height: 40px;

    // 文本内容样式
    .latex-text-content {
      margin: 0.5em 0;
      line-height: 1.6;
      white-space: pre-wrap;
      word-wrap: break-word;

      h2 {
        font-size: 1.5em;
        font-weight: bold;
        margin: 1em 0 0.5em;
        color: #333;
      }

      h3 {
        font-size: 1.2em;
        font-weight: bold;
        margin: 0.8em 0 0.4em;
        color: #444;
      }

      code {
        background-color: #f4f4f4;
        padding: 2px 4px;
        border-radius: 3px;
        font-family: 'Courier New', monospace;
        font-size: 0.9em;
      }

      a {
        color: #409eff;
        text-decoration: none;

        &:hover {
          text-decoration: underline;
        }
      }
    }

    // 块级数学样式
    .latex-block-math {
      margin: 1em 0;
      overflow-x: auto;
    }

    // 行内数学样式
    .latex-inline-math {
      display: inline;
      margin: 0 0.1em;
      vertical-align: baseline;
    }

    // 文本内容样式调整
    .latex-text-content {
      display: block;

      // 文本内容中的行内数学应该在同一行
      :deep(.latex-inline-math) {
        display: inline;
        margin: 0 0.1em;
        vertical-align: baseline;
      }
    }

    // 自定义滚动条样式 - Webkit (Chrome, Safari, Edge)
    &::-webkit-scrollbar {
      width: 10px;
      height: 10px;
    }

    &::-webkit-scrollbar-track {
      background: #f1f1f1;
      border-radius: 10px;
    }

    &::-webkit-scrollbar-thumb {
      background: #c1c1c1;
      border-radius: 10px;
      border: 2px solid #f1f1f1;
      transition: background 0.3s ease;

      &:hover {
        background: #a8a8a8;
      }

      &:active {
        background: #888888;
      }
    }

    &::-webkit-scrollbar-corner {
      background: #f1f1f1;
    }

    // 自定义滚动条样式 - Firefox
    scrollbar-width: thin;
    scrollbar-color: #c1c1c1 #f1f1f1;

    // 块级模式下使用块显示
    :deep(.katex-display) {
      margin: 1em 0;
      max-width: 100%;
      overflow-x: auto;

      // 为 KaTeX 显示块也添加滚动条样式
      &::-webkit-scrollbar {
        width: 8px;
        height: 8px;
      }

      &::-webkit-scrollbar-track {
        background: #f5f5f5;
        border-radius: 8px;
      }

      &::-webkit-scrollbar-thumb {
        background: #b0b0b0;
        border-radius: 8px;
        border: 1px solid #f5f5f5;
        transition: background 0.3s ease;

        &:hover {
          background: #909090;
        }
      }

      scrollbar-width: thin;
      scrollbar-color: #b0b0b0 #f5f5f5;
    }

    // 行内模式也要限制宽度
    :deep(.katex) {
      max-width: 100%;
      overflow-x: auto;
    }
  }

  .latex-placeholder {
    color: #909399;
    font-style: italic;
    padding: 20px;
    text-align: center;
    min-height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .edit-hint {
    position: absolute;
    top: 8px;
    right: 12px;
    font-size: 12px;
    color: #909399;
    opacity: 0;
    transition: opacity 0.3s ease;
  }

  &.is-clickable:hover .edit-hint {
    opacity: 1;
  }
}

.latex-edit-mode {
  width: 100%;
  box-sizing: border-box;

  .latex-textarea {
    width: 100%;
    margin-bottom: 12px;
    box-sizing: border-box;

    :deep(.el-textarea__inner) {
      width: 100% !important;
      max-width: 100%;
      box-sizing: border-box;
    }
  }

  .latex-edit-actions {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
  }
}
</style>
