<template>
  <div class="latex-content-wrapper">
    <!-- 查看模式：展示 LaTeX 渲染结果 -->
    <div v-if="!isEditing" class="latex-view-mode" @click="enterEditMode" :class="{ 'is-clickable': editable }">
      <div ref="latexContainer" class="latex-content"></div>
      <div v-if="!props.latex" class="latex-placeholder">{{ placeholder || '点击编辑' }}</div>
      <div v-if="editable && props.latex" class="edit-hint">点击编辑</div>
    </div>
    <!-- 编辑模式：文本输入框 -->
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
    // 处理空格：将普通空格替换为 LaTeX 的强制空格命令
    // KaTeX 在数学模式下会忽略空格，需要将空格替换为 \ (反斜杠+空格) 来保留
    const processedLatex = props.latex.replace(/ /g, '\\ ');

    katex.render(processedLatex, latexContainer.value, {
      displayMode: props.displayMode,
      throwOnError: false,
      ...props.options,
    });
  } catch (error) {
    console.error('LaTeX 渲染错误:', error);
    if (latexContainer.value) {
      latexContainer.value.textContent = props.latex;
    }
  }
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
