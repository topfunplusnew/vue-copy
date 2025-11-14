<script setup lang="ts">
import { deleteFile, getFileUploadAddress } from '@/services/common/files.ts';
import { Plus, Document, Reading } from '@element-plus/icons-vue';
import { ElMessage, type UploadProps } from 'element-plus';
import { auth, http } from '@/services/http.ts';
import { computed, ref } from 'vue';
import { getImageUrl, isVideoFile, isPdfFile, isImageFile, isZipFile, removeImagePrefix } from '@/utils';
import type { UploadFiles, UploadUserFile } from 'element-plus';
import type { TabKey } from '@/types/conference.ts';
import { getFileTypeByTabKey } from '@/utils/conference';
import PdfIcon from './icons/pdf-icon.vue';
import ExcelIcon from './icons/excel-icon.vue';
import WordIcon from './icons/word-icon.vue';
import PptIcon from './icons/ppt-icon.vue';
import TxtIcon from './icons/txt-icon.vue';
import VideoIcon from './icons/video-icon.vue';
import ZipIcon from './icons/zip-icon.vue';
import type { UploadFile } from 'element-plus/es/components/upload/src/upload.mjs';
import type { PaperDetail } from '@/components/index.ts';

type IsFileListShowConfig = {
  [key in TabKey]?: boolean;
};

interface Props {
  tabKey: TabKey;
  paperId: string | number;
  paperDetail?: PaperDetail;
  limit: number;
  isShow: boolean;
  // 可选：限制允许上传的文件类型。支持HTML accept格式，如 'image/*', '.pdf', 'application/pdf' 或数组
  accept?: string | string[];
  // 是否显示文件列表
  isFileListShowConfig?: IsFileListShowConfig;
}

interface Emits {
  (e: 'refresh'): void;
}

const props = withDefaults(defineProps<Props>(), {
  tabKey: 'details',
  paperId: '',
  paperDetail: () => ({}),
  limit: 1,
  isShow: true,
  accept: undefined,
});
const isItemShow = computed(() => props.isShow);
const emit = defineEmits<Emits>();
const tabKey = computed(() => props.tabKey);
const paperDetailInfo = computed(() => props.paperDetail);
console.log(`paperDetailInfo.value`, paperDetailInfo.value);
const paperId = computed(() => props.paperId);
const getVisibleByTabKey = (tabKey: TabKey) => {
  if (!props.isFileListShowConfig) {
    return true;
  }
  return props.isFileListShowConfig[tabKey];
};
// 文件列表 这里除了额外文件后端限制只能一个文件
const posterFileList = computed((): UploadUserFile[] => {
  if (!paperDetailInfo.value?.fileUrl) {
    return [];
  }
  if (Array.isArray(paperDetailInfo.value.fileUrl)) {
    // 确保数组中的每个元素都有正确的 UploadUserFile 格式
    return paperDetailInfo.value.fileUrl.map((file: unknown, index: number): UploadUserFile => {
      if (typeof file === 'string') {
        return {
          name: file,
          url: getImageUrl(file),
          uid: Date.now() + index,
          status: 'success',
        };
      }
      // 如果已经是对象，确保有 uid 属性
      if (typeof file === 'object' && file !== null) {
        const fileObj = file as Record<string, unknown>;
        return {
          name: (fileObj.name as string) || String(file),
          url: (fileObj.url as string) || getImageUrl(String(file)),
          uid: (fileObj.uid as number) || Date.now() + index,
          status: 'success',
        };
      }
      // 如果不是字符串也不是对象，返回默认格式
      return {
        name: String(file),
        url: getImageUrl(String(file)),
        uid: Date.now() + index,
        status: 'success',
      };
    });
  }
  return [
    {
      name: paperDetailInfo.value?.fileUrl as string,
      url: getImageUrl(paperDetailInfo.value?.fileUrl as string),
      uid: Date.now(),
      status: 'success',
    },
  ];
});
const file_type = computed(() => getFileTypeByTabKey(tabKey.value));

// 判断是否允许多上传：支持所有类型多文件上传
const allowMultiple = computed(() => true);

// 判断是否应该显示视频播放器
const shouldShowVideoPlayer = computed(() => {
  return posterFileList.value.length === 1 && posterFileList.value[0]?.url && isVideoFile(posterFileList.value[0].url);
});

// 判断是否应该显示PDF预览
const shouldShowPdfPreview = computed(() => {
  return posterFileList.value.length === 1 && posterFileList.value[0]?.url && isPdfFile(posterFileList.value[0].url);
});

// 判断是否应该显示图片预览
const shouldShowImagePreview = computed(() => {
  return posterFileList.value.length === 1 && posterFileList.value[0]?.url && isImageFile(posterFileList.value[0].url);
});

// 获取图片URL
const imageUrl = computed(() => {
  return shouldShowImagePreview.value ? posterFileList.value[0].url : null;
});

// 动态计算上传块高度
const uploadBlockHeight = computed(() => {
  if (shouldShowImagePreview.value && imageUrl.value) {
    // 如果有图片预览，返回动态高度，最大600px
    return 'auto';
  }
  // 默认高度
  return '120px';
});

// 获取视频URL
const videoUrl = computed(() => {
  return shouldShowVideoPlayer.value ? posterFileList.value[0].url : null;
});

// 获取PDF URL
const pdfUrl = computed(() => {
  return shouldShowPdfPreview.value ? posterFileList.value[0].url : null;
});

// 获取文件扩展名
const getFileExtension = (url: string): string => {
  const lastDot = url.lastIndexOf('.');
  return lastDot !== -1 ? url.substring(lastDot + 1).toUpperCase() : 'Unknown';
};

// 根据文件类型获取对应的图标组件
const getFileIcon = (url: string) => {
  const extension = getFileExtension(url).toLowerCase();

  // 优先使用文件类型判断函数
  if (isPdfFile(url)) {
    return PdfIcon;
  } else if (isVideoFile(url)) {
    return VideoIcon;
  } else if (isZipFile(url)) {
    return ZipIcon;
  } else if (extension === 'xlsx' || extension === 'xls') {
    return ExcelIcon;
  } else if (extension === 'docx' || extension === 'doc') {
    return WordIcon;
  } else if (extension === 'pptx' || extension === 'ppt') {
    return PptIcon;
  } else if (extension === 'txt') {
    return TxtIcon;
  }

  // 默认返回一个通用的文件图标
  return null;
};

const deleteLoading = ref(false);
const uploadLoading = ref(false);
// 用于存储待上传的文件队列
interface PendingFile {
  file: UploadFile;
  rawFile: File; // 保存原始文件对象
  onSuccess?: (response: unknown, uploadFile: UploadFile) => void;
  onError?: UploadProps['onError'];
  onProgress?: UploadProps['onProgress'];
}
const pendingFiles = ref<PendingFile[]>([]);
const isUploadingBatch = ref(false);
const isUploadDisabled = computed(() => {
  if (props.limit === -1) {
    return false; // 无限制时不禁用
  }
  return posterFileList.value.length >= props.limit;
});
const handleRemove: UploadProps['onRemove'] = (uploadFile, uploadFiles) => {
  console.log(`uploadFile, uploadFiles`, uploadFile, uploadFiles);
  if (!paperId.value) {
    return;
  }
  deleteLoading.value = true;
  const deleteBody = {
    paper_id: Number(paperId.value),
    file_type: file_type.value,
    file_path: removeImagePrefix(uploadFile.url || ''),
  };
  deleteFile(deleteBody)
    .then(() => {
      ElMessage.success('The file has been successfully deleted~');
      emit('refresh');
    })
    .catch((error) => {
      ElMessage.error('The file failed to be deleted');
      console.error('Delete file error:', error);
    })
    .finally(() => {
      deleteLoading.value = false;
    });
};
const handleError: UploadProps['onError'] = (error: Error, uploadFile: UploadFile, uploadFiles: UploadFiles) => {
  console.log(uploadFile, uploadFiles);
  ElMessage.error('The file upload failed,' + JSON.parse(error.message).error);
  uploadLoading.value = false;
};

const handleExceed: UploadProps['onExceed'] = (files, uploadFiles) => {
  ElMessage.warning(`最多只能上传 ${uploadFiles.length} 个文件，当前选择了 ${files.length} 个文件`);
};

const handleUploadStart = () => {
  uploadLoading.value = true;
};

// 生成用于el-upload的accept字符串
const acceptAttr = computed(() => {
  if (!props.accept) return undefined;
  return Array.isArray(props.accept) ? props.accept.join(',') : props.accept;
});

// 校验文件类型是否符合accept规则
function matchAcceptRule(file: File, rule: string): boolean {
  const name = file.name || '';
  const type = file.type || '';
  const token = rule.trim().toLowerCase();
  if (!token) return true;
  // .ext 扩展名匹配
  if (token.startsWith('.')) {
    return name.toLowerCase().endsWith(token);
  }
  // image/* 这样的通配mime
  if (token.endsWith('/*')) {
    const prefix = token.replace('/*', '');
    return type.toLowerCase().startsWith(prefix);
  }
  // 直接与mime完全匹配，如 application/pdf
  return type.toLowerCase() === token;
}

const handleBeforeUpload: UploadProps['beforeUpload'] = (rawFile) => {
  const file = rawFile as File;

  // 检查文件大小，限制为500MB
  const maxSize = 500 * 1024 * 1024; // 500MB in bytes
  if (file.size > maxSize) {
    ElMessage.error('The file size cannot exceed 500MB, please select a smaller file');
    return false;
  }

  if (props.accept) {
    const rules = Array.isArray(props.accept) ? props.accept : String(props.accept).split(',');
    const ok = rules.some((r) => matchAcceptRule(rawFile as unknown as File, r));
    if (!ok) {
      const acceptText = Array.isArray(props.accept) ? props.accept.join(', ') : String(props.accept);
      ElMessage.error(`Only files of types ${acceptText} are allowed.`);
      return false;
    }
  }
  handleUploadStart();
  return true;
};

const handleUploadSuccess = () => {
  uploadLoading.value = false;
  ElMessage.success('Upload Successful!');
  emit('refresh');
};

const handleUploadProgress = () => {
  // 上传进度处理，保持loading状态
};

// 批量上传多个文件
const uploadBatchFiles = async () => {
  if (pendingFiles.value.length === 0 || isUploadingBatch.value) {
    return;
  }

  isUploadingBatch.value = true;
  uploadLoading.value = true;

  try {
    // 构建 FormData，包含所有待上传的文件
    const formData = new FormData();
    formData.append('paper_id', String(paperId.value));
    formData.append('file_type', file_type.value);

    // 添加所有文件到 FormData（每个文件使用 'file' 字段名，后端可以接收多个）
    pendingFiles.value.forEach((item) => {
      const file = item.rawFile;
      if (file instanceof File) {
        formData.append('file', file, file.name);
      }
    });

    // 使用 axios 批量上传
    // 注意：不要手动设置 Content-Type，让浏览器自动设置（包含 boundary）
    const response = await http.post(getFileUploadAddress(), formData, {
      headers: {
        Authorization: 'Bearer ' + auth.get(),
      },
      onUploadProgress: (progressEvent) => {
        if (progressEvent.total) {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          // 更新所有文件的上传进度
          pendingFiles.value.forEach((item) => {
            if (item.onProgress) {
              // 构造符合 UploadProgressEvent 格式的事件对象
              const uploadProgressEvent = {
                percent: percent,
                ...progressEvent,
              } as unknown as Parameters<UploadProps['onProgress']>[0];
              item.onProgress(uploadProgressEvent, item.file, posterFileList.value as UploadFiles);
            }
          });
        }
      },
    });

    // 所有文件上传成功
    pendingFiles.value.forEach((item) => {
      item.onSuccess?.(response.data, item.file);
    });

    // 清空待上传队列
    pendingFiles.value = [];
    handleUploadSuccess();
  } catch (error: unknown) {
    const err = error as { message?: string; response?: { data?: { error?: string }; status?: number }; config?: { method?: string; url?: string } };
    const errorMessage = err.response?.data?.error || err.message || 'Upload failed';

    // 所有文件上传失败
    pendingFiles.value.forEach((item) => {
      if (item.onError) {
        // 构造符合 UploadAjaxError 格式的错误对象
        const uploadError = new Error(errorMessage) as unknown as Parameters<UploadProps['onError']>[0];
        if (err.response) {
          (uploadError as { status?: number; method?: string; url?: string }).status = err.response.status;
        }
        if (err.config) {
          (uploadError as { method?: string; url?: string }).method = err.config.method?.toUpperCase();
          (uploadError as { url?: string }).url = err.config.url;
        }
        item.onError(uploadError, item.file, posterFileList.value as UploadFiles);
      }
    });

    handleError(err as Error, pendingFiles.value[0]?.file as UploadFile, posterFileList.value as UploadFiles);
    pendingFiles.value = [];
  } finally {
    isUploadingBatch.value = false;
    uploadLoading.value = false;
  }
};

// 自定义上传方法，支持多文件批量上传
const handleHttpRequest: UploadProps['httpRequest'] = async (options) => {
  const { file, onSuccess, onError, onProgress } = options;

  // 获取原始文件对象
  const rawFile = (file as { raw?: File }).raw || (file as File);
  if (!(rawFile instanceof File)) {
    console.error('Invalid file object:', file);
    // 如果文件无效，不添加到队列，直接返回
    return;
  }

  // 确保 file 对象有必要的属性
  const uploadFile: UploadFile = {
    ...file,
    uid: file.uid || Date.now(),
    name: file.name || rawFile.name || 'unknown',
    status: 'uploading',
  } as UploadFile;

  // 将文件添加到待上传队列
  pendingFiles.value.push({
    file: uploadFile,
    rawFile: rawFile, // 保存原始文件对象
    onSuccess,
    onError: onError as unknown as UploadProps['onError'],
    onProgress: onProgress as unknown as UploadProps['onProgress'],
  });

  // 延迟执行批量上传，等待所有文件都添加到队列
  // 使用 setTimeout 确保在当前事件循环结束后执行，这样可以收集到同一批次的所有文件
  setTimeout(() => {
    // 检查是否还有待上传的文件且当前没有正在上传
    if (pendingFiles.value.length > 0 && !isUploadingBatch.value) {
      uploadBatchFiles();
    }
  }, 100);
};

// 处理文件下载
const handleFileDownload = (file: UploadUserFile) => {
  if (!file.url) return;

  // 创建一个临时链接用于下载
  const link = document.createElement('a');
  link.href = file.url;
  link.download = file.name || 'download';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// 处理PDF预览 - 在新窗口打开
const handlePdfPreview = (fileUrl?: string) => {
  const url = fileUrl || pdfUrl.value;
  if (url) {
    window.open(url, '_blank');
  }
};
</script>

<template>
  <div>
    <el-upload
      v-model:file-list="posterFileList"
      list-type="text"
      :on-remove="handleRemove"
      :on-error="handleError"
      :on-exceed="handleExceed"
      :on-progress="handleUploadProgress"
      :before-upload="handleBeforeUpload"
      :http-request="handleHttpRequest"
      :limit="props.limit === -1 ? undefined : props.limit"
      :disabled="isUploadDisabled || uploadLoading"
      :accept="acceptAttr"
      class="upload-area"
      :class="{
        'upload-disabled': isUploadDisabled && !shouldShowImagePreview,
        'upload-loading': uploadLoading,
        'upload-image-preview': shouldShowImagePreview,
      }"
      :multiple="allowMultiple"
      v-if="isItemShow && (props.limit === -1 || posterFileList.length < props.limit)"
    >
      <div
        class="upload-block"
        :class="{
          'upload-block-disabled': isUploadDisabled && !shouldShowImagePreview,
          'upload-block-loading': uploadLoading,
          'upload-block-image-preview': shouldShowImagePreview,
        }"
        :style="{ height: uploadBlockHeight }"
      >
        <!-- Loading状态 -->
        <div v-if="uploadLoading" class="upload-loading-container">
          <div class="upload-spinner"></div>
          <div class="upload-loading-text">Uploading...</div>
        </div>
        <!-- 图片预览状态 -->
        <div v-else-if="shouldShowImagePreview" class="image-preview-container">
          <img :src="imageUrl || ''" :alt="posterFileList[0]?.name" class="preview-image" />
          <div class="image-overlay">
            <div class="image-overlay-text">Click to preview</div>
          </div>
        </div>
        <!-- 正常状态 -->
        <template v-else>
          <el-icon class="upload-icon" :class="{ 'upload-icon-disabled': isUploadDisabled }">
            <Plus />
          </el-icon>
          <div class="upload-text" :class="{ 'upload-text-disabled': isUploadDisabled }">
            {{ isUploadDisabled ? 'Upload limit has been reached' : props.limit === -1 ? 'Click to upload files' : 'Click to upload files' }}
          </div>
        </template>
      </div>
    </el-upload>

    <!-- 文件尺寸提示 -->
    <div v-if="isItemShow && (props.limit === -1 || posterFileList.length === 0)" class="upload-size-hint">Maximum file size: 500MB</div>

    <!-- 自定义文件列表显示 -->
    <div v-if="getVisibleByTabKey(tabKey) && posterFileList.length > 0" class="custom-file-list">
      <div v-for="file in posterFileList" :key="file.uid" :class="tabKey !== 'additional' ? `file-item option-row` : `file-item option-columnn`">
        <div class="file-preview">
          <!-- 如果是图片，显示缩略图 -->
          <img v-if="isImageFile(file.url || '')" :src="file.url" :alt="file.name" class="file-thumbnail" />
          <!-- 如果不是图片，显示对应的文件图标 -->
          <div v-else class="file-icon-container">
            <component :is="getFileIcon(file.url || '')" v-if="getFileIcon(file.url || '')" class="file-icon" />
            <div v-else class="default-file-icon">
              <el-icon>
                <Document />
              </el-icon>
            </div>
          </div>
        </div>
        <div class="file-info">
          <div class="file-name" v-if="props.limit === -1" :title="file.name" @click="handleFileDownload(file)" style="cursor: pointer">
            {{ file.name }}
          </div>
        </div>
      </div>
    </div>
    <!-- 视频播放器 -->
    <div v-if="shouldShowVideoPlayer" class="video-player-container">
      <video :src="videoUrl || undefined" controls class="video-player" preload="metadata">Your browser does not support video playback</video>
    </div>

    <!-- PDF预览 -->
    <div v-if="shouldShowPdfPreview">
      <div class="pdf-preview-container">
        <iframe :src="pdfUrl || undefined" class="pdf-preview" frameborder="0" type="application/pdf"> Your browser does not support PDF preview </iframe>
        <!-- 按钮放在 iframe 下面 -->
        <div class="pdf-preview-actions" v-if="isItemShow && posterFileList.length > 0 && posterFileList[0]">
          <el-button type="primary" size="large" class="pdf-preview-button" @click="handlePdfPreview(pdfUrl || undefined)">
            <el-icon>
              <Reading />
            </el-icon>
            Preview
          </el-button>
          <el-button type="danger" size="large" :loading="deleteLoading" @click="handleRemove(posterFileList[0] as any, posterFileList as any)"> Delete </el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
@use '../styles/utils/_mixins.scss' as *;

.upload-area {
  :deep(.el-upload) {
    border: 2px dashed #d9d9d9;
    border-radius: 8px;
    width: 100%;
    height: 120px;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: #fafafa;
    transition: all 0.3s ease;
    cursor: pointer;
    position: relative;
    overflow: hidden;

    &:hover {
      border-color: #409eff;
      background-color: #f0f9ff;
    }
  }

  &.upload-image-preview {
    :deep(.el-upload) {
      height: auto;
      min-height: 120px;
      max-height: 600px;
      align-items: stretch;
      background-color: #fff;
      opacity: 1;
    }
  }

  :deep(.el-upload-list) {
    display: none;
  }

  &.upload-disabled {
    :deep(.el-upload) {
      border-color: #e4e7ed;
      background-color: #f5f5f5;
      cursor: not-allowed;
      opacity: 0.6;

      &:hover {
        border-color: #e4e7ed;
        background-color: #f5f5f5;
      }
    }
  }

  &.upload-loading {
    :deep(.el-upload) {
      border-color: #409eff;
      background-color: #f0f9ff;
      cursor: not-allowed;

      &:hover {
        border-color: #409eff;
        background-color: #f0f9ff;
      }
    }
  }
}

.upload-block {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #666;
  font-size: 14px;
}

.upload-block-image-preview {
  display: block;
  height: auto;
  max-height: 600px;
  min-height: 120px;
  background-color: #fff;
  opacity: 1 !important;
}

.upload-icon {
  width: 250px;
  font-size: 32px;
  margin-bottom: 8px;
  color: #999;
}

.upload-text {
  font-size: 14px;
  color: #999;
}

.upload-block-disabled {
  opacity: 0.6;
}

.upload-icon-disabled {
  color: #c0c4cc !important;
}

.upload-text-disabled {
  color: #c0c4cc !important;
}

.upload-size-hint {
  margin-top: 8px;
  font-size: 14px;
  color: #909399;
  text-align: center;
  line-height: 1.5;
}

.upload-loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.upload-spinner {
  width: 24px;
  height: 24px;
  border: 2px solid #e4e7ed;
  border-top: 2px solid #409eff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 8px;
}

.upload-loading-text {
  font-size: 14px;
  color: #409eff;
  font-weight: 500;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }

  100% {
    transform: rotate(360deg);
  }
}

.option-columnn {
  @include screen-mobile {
    flex-direction: column;
    align-items: flex-start;
    height: auto;
  }
}

.option-row {
  @include screen-mobile {
    flex-direction: row;
    align-items: flex-start;
    height: auto;
  }
}

.file-item {
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  padding: 6px 10px;
  border-radius: 6px;
  margin-bottom: 4px;
}

.file-preview {
  width: 100%;
  margin-bottom: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  overflow: hidden;
  background-color: #f5f5f5;

  @include screen-mobile {
    margin-bottom: 8px;
  }
}

.file-actions {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
  width: 100%;
  justify-content: flex-start;
  margin-top: 8px;

  @include screen-mobile {
    flex-direction: column;
    gap: 6px;
  }
}

.file-thumbnail {
  max-width: 400px;
  height: auto;
  object-fit: cover;
  cursor: pointer;
  transition: transform 0.2s ease;

  &:hover {
    transform: scale(1.05);
  }

  @include screen-mobile {
    width: 100%;
  }
}

.file-icon-container {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
}

.file-icon {
  width: 24px;
  height: 24px;
}

.default-file-icon {
  font-size: 18px;
  color: #999;

  @include screen-mobile {
    font-size: 10px;
  }
}

.file-info {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  min-height: 36px;

  @include screen-mobile {
    width: 100%;
    text-align: center;
    flex-direction: column;
    align-items: flex-start;
    justify-content: flex-start;
    min-height: 16px;
  }
}

.file-name {
  color: #409eff;
  /* 改为蓝色，表示可点击 */
  word-break: break-all;
  flex: 1;
  margin-right: 8px;
  transition: color 0.3s ease;

  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap; // 一行显示，超出隐藏

  &:hover {
    color: #66b1ff;
    text-decoration: underline;
  }

  @include screen-mobile {
    margin-right: 0;
    margin-bottom: 8px;
    width: 100%;
  }
}

.video-player-container {
  margin-top: 16px;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  overflow: hidden;
}

.video-player {
  width: 100%;
  height: 100%;
  object-fit: contain;
  background-color: #000;
}

.pdf-preview-button {
  flex-shrink: 0;
  background-color: #1a3566 !important;
  border-color: #1a3566 !important;
  color: #fff !important;
  border-radius: 6px;
  transition: all 0.3s ease;
  box-shadow: 0 2px 4px rgba(26, 53, 102, 0.2);

  &:hover {
    background-color: #2a4a7a !important;
    border-color: #2a4a7a !important;
    box-shadow: 0 4px 8px rgba(26, 53, 102, 0.3);
    transform: translateY(-1px);
  }

  &:active {
    transform: translateY(0);
    box-shadow: 0 2px 4px rgba(26, 53, 102, 0.2);
  }

  :deep(.el-icon) {
    color: #fff !important;
  }
}

.pdf-preview-container {
  margin-top: 10px;
  position: relative;
  border-radius: 4px;
  background-color: #e2e5e6;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.pdf-preview-actions {
  display: flex;
  gap: 8px;
  padding: 12px;
  justify-content: flex-start;
  background-color: #fff;
  border-top: 1px solid #e4e7ed;

  @include screen-mobile {
    flex-direction: column;
    gap: 6px;
  }
}

.pdf-preview {
  width: 100%;
  height: calc(100vh - 8px);
  border: none;
  display: block;
  // background-color: #f5f5f5;
}

.image-preview-container {
  position: relative;
  width: 100%;
  height: auto;
  max-height: 600px;
  border-radius: 6px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s ease;
  background-color: #fff;
  border: none;
  display: block;
  opacity: 1 !important;

  &:hover {
    .image-overlay {
      opacity: 1;
    }
  }
}

.preview-image {
  width: 100%;
  height: auto;
  max-height: 600px;
  object-fit: contain;
  display: block;
  background-color: #fff;
  opacity: 1 !important;
  position: relative;
  z-index: 1;
}

.image-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: opacity 0.3s ease;
}

.image-overlay-text {
  color: white;
  font-size: 14px;
  font-weight: 500;
  text-align: center;
}
</style>
