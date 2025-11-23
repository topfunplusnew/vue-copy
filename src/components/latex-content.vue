<template>
  <div class="latex-content-wrapper">
    <div v-if="!isEditing" class="latex-view-mode" @click="enterEditMode" :class="{ 'is-clickable': editable }">
      <div class="latex-content" v-html="renderedContent"></div>
      <div v-if="!props.latex" class="latex-placeholder">{{ placeholder || 'Click to Edit' }}</div>
      <div v-if="editable && props.latex" class="edit-hint">Click to Edit</div>
    </div>
    <div v-else class="latex-edit-mode">
      <el-input ref="textareaRef" v-model="editValue" type="textarea" :rows="rows"
        :placeholder="placeholder || 'Please input Markdown content (LaTeX formulas are supported)...'"
        resize="vertical" class="latex-textarea" @blur="saveEdit"/>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick } from 'vue';
import { ElInput } from 'element-plus';
import MarkdownIt from 'markdown-it';
import mk from 'markdown-it-katex';

interface Props {
  // Markdown 内容字符串（支持 LaTeX 公式）
  latex?: string;
  // 是否使用块级显示（displayMode），保留用于向后兼容，但实际由 KaTeX 自动处理
  displayMode?: boolean;
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

const textareaRef = ref<InstanceType<typeof ElInput> | null>(null);
const isEditing = ref(false);
const editValue = ref('');

// 初始化 markdown-it 实例，启用 katex 插件
const md = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true,
}).use(mk);

// 计算渲染后的内容
const renderedContent = computed(() => {
  if (isEditing.value || !props.latex) {
    return '';
  }

  try {
    return md.render(props.latex);
  } catch (error) {
    console.error('Markdown 渲染错误:', error);
    return `<pre>${props.latex}</pre>`;
  }
});

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
</script>

<style scoped lang="scss">
@use '../styles/utils/utils' as utils;
@use '../styles/utils/mixins' as *;
.latex-content-wrapper {
  width: 100%;
  box-sizing: border-box;
@include screen-mobile{
  width:80vw;
}
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
    /* 两端对齐 */
    text-align: justify;
    // text-align-last: justify;
    /* 可选：防止英文单词断字出现大空隙 */
    // word-break: break-all;
    // text-align-last: left; //最后一行文本左对齐
    @include wordWrap();
    /* 如果只有一行，也要顶格 */
    // 文本内容样式
    .latex-text-content {
      margin: 0.5em 0;
      line-height: 1.6;
      white-space: pre-wrap;
      word-wrap: break-word;

      h2 {
        font-size: utils.rpx(15);
        font-weight: bold;
        margin: 1em 0 0.5em;
        color: #333;
      }

      h3 {
        font-size: utils.rpx(12);
        font-weight: bold;
        margin: 0.8em 0 0.4em;
        color: #444;
      }

      code {
        background-color: #f4f4f4;
        padding: 2px 4px;
        border-radius: 3px;
        font-family: 'Courier New', monospace;
        font-size: utils.rpx(9);
      }

      a {
        color: #409eff;
        text-decoration: none;

        &:hover {
          text-decoration: underline;
        }
      }
    }

    // KaTeX 数学公式样式
    :deep(.katex-display) {
      margin: 1em 0;
      overflow-x: auto;
      overflow-y: hidden;
    }

    :deep(.katex) {
      font-size: 1.1em;
    }

    // 块级数学公式（$$ ... $$）
    :deep(.katex-display .katex) {
      text-align: left;
      display: inline-block;
      max-width: 100%;
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

    // Markdown 生成的样式
    :deep(table) {
      border-collapse: collapse;
      margin: 1em 0;
      width: 100%;
      max-width: 100%;
      overflow-x: auto;
    }

    :deep(th),
    :deep(td) {
      border: 1px solid #333;
      padding: 8px;
      text-align: left;
    }

    :deep(p) {
      margin: 1em 0;
      line-height: 1.6;
    }

    :deep(h1),
    :deep(h2),
    :deep(h3),
    :deep(h4),
    :deep(h5),
    :deep(h6) {
      margin: 1em 0 0.5em;
      font-weight: bold;
    }

    :deep(ul),
    :deep(ol) {
      margin: 1em 0;
      padding-left: 2em;
    }

    :deep(li) {
      margin: 0.5em 0;
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