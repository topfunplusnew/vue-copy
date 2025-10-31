<script setup lang="ts">
import { deleteFile, getFileUploadAddress } from '@/services/common/files.ts';
import { Plus, Document } from '@element-plus/icons-vue';
import { ElMessage, type UploadProps } from 'element-plus';
import { auth } from '@/services/http.ts';
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
const headers = ref({
  Authorization: 'Bearer ' + auth.get(),
});
const file_type = computed(() => getFileTypeByTabKey(tabKey.value));
const bodyParams = computed(() => ({
  paper_id: paperId.value,
  file_type: file_type.value,
}));

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

const serverActionUrl = computed(() => import.meta.env.IPG_API_URL + getFileUploadAddress());
const deleteLoading = ref(false);
const uploadLoading = ref(false);
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
      ElMessage.success('删除文件成功~');
      emit('refresh');
    })
    .catch((error) => {
      ElMessage.error('删除文件失败');
      console.error('Delete file error:', error);
    })
    .finally(() => {
      deleteLoading.value = false;
    });
};
const handleError: UploadProps['onError'] = (error: Error, uploadFile: UploadFile, uploadFiles: UploadFiles) => {
  console.log(uploadFile, uploadFiles);
  ElMessage.error('上传失败,' + JSON.parse(error.message).error);
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
    ElMessage.error('文件大小不能超过500MB，请选择较小的文件');
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
  ElMessage.success('上传成功!');
  emit('refresh');
};

const handleUploadProgress = () => {
  // 上传进度处理，保持loading状态
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
</script>

<template>
  <div>
    <el-upload :data="bodyParams" :headers="headers" v-model:file-list="posterFileList" :action="serverActionUrl"
      list-type="text" :on-remove="handleRemove" :on-error="handleError" :on-exceed="handleExceed"
      :on-progress="handleUploadProgress" :before-upload="handleBeforeUpload" :on-success="handleUploadSuccess"
      :limit="props.limit === -1 ? undefined : props.limit" :disabled="isUploadDisabled || uploadLoading"
      :accept="acceptAttr" class="upload-area" :class="{
        'upload-disabled': isUploadDisabled && !shouldShowImagePreview,
        'upload-loading': uploadLoading,
        'upload-image-preview': shouldShowImagePreview,
      }" :multiple="true" v-if="isItemShow && (props.limit === -1 || posterFileList.length === 0)">
      <div class="upload-block" :class="{
        'upload-block-disabled': isUploadDisabled && !shouldShowImagePreview,
        'upload-block-loading': uploadLoading,
        'upload-block-image-preview': shouldShowImagePreview,
      }" :style="{ height: uploadBlockHeight }">
        <!-- Loading状态 -->
        <div v-if="uploadLoading" class="upload-loading-container">
          <div class="upload-spinner"></div>
          <div class="upload-loading-text">上传中...</div>
        </div>
        <!-- 图片预览状态 -->
        <div v-else-if="shouldShowImagePreview" class="image-preview-container">
          <img :src="imageUrl || ''" :alt="posterFileList[0]?.name" class="preview-image" />
          <div class="image-overlay">
            <div class="image-overlay-text">点击预览</div>
          </div>
        </div>
        <!-- 正常状态 -->
        <template v-else>
          <el-icon class="upload-icon" :class="{ 'upload-icon-disabled': isUploadDisabled }">
            <Plus />
          </el-icon>
          <div class="upload-text" :class="{ 'upload-text-disabled': isUploadDisabled }">
            {{ isUploadDisabled ? '已达到上传限制' : props.limit === -1 ? '点击上传文件' : '点击上传文件' }}
          </div>
        </template>
      </div>
    </el-upload>

    <!-- 文件尺寸提示 -->
    <div v-if="isItemShow && (props.limit === -1 || posterFileList.length === 0)" class="upload-size-hint">
      您最大可上传500MB的文件
    </div>

    <!-- 自定义文件列表显示 -->
    <div v-if="getVisibleByTabKey(tabKey) && posterFileList.length > 0" class="custom-file-list">
      <div v-for="file in posterFileList" :key="file.uid" class="file-item">
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
          <div class="file-name" v-if="props.limit === -1" :title="file.name" @click="handleFileDownload(file)"
            style="cursor: pointer">
            {{ file.name }}
          </div>
          <div class="file-actions" v-if="isItemShow">
            <el-button type="danger" size="small" :loading="deleteLoading"
              @click="handleRemove(file as any, posterFileList as any)"> 删除 </el-button>
          </div>
        </div>
      </div>
    </div>
    <!-- 视频播放器 -->
    <div v-if="shouldShowVideoPlayer" class="video-player-container">
      <video :src="videoUrl || undefined" controls class="video-player" preload="metadata">您的浏览器不支持视频播放</video>
    </div>

    <!-- PDF预览 -->
    <div v-if="shouldShowPdfPreview" class="pdf-preview-container">
      <iframe :src="pdfUrl || undefined" class="pdf-preview" frameborder="0" type="application/pdf"> 您的浏览器不支持PDF预览
      </iframe>
    </div>
  </div>
</template>

<style scoped lang="scss">
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
  color: #ff2b2b;
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

.custom-file-list {
  margin-top: 16px;
}

.file-item {
  display: flex;
  align-items: center;
  padding: 6px 10px;
  border: 1px solid #e4e7ed;
  border-radius: 6px;
  background-color: #fafafa;
  margin-bottom: 4px;
}

.file-preview {
  margin-right: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  overflow: hidden;
  background-color: #f5f5f5;
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
}

.file-icon-container {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.file-icon {
  width: 24px;
  height: 24px;
}

.default-file-icon {
  font-size: 18px;
  color: #999;
}

.file-info {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  min-height: 36px;
}

.file-name {
  font-size: 13px;
  font-weight: 500;
  color: #409eff;
  /* 改为蓝色，表示可点击 */
  word-break: break-all;
  line-height: 1.3;
  flex: 1;
  margin-right: 8px;
  transition: color 0.3s ease;

  &:hover {
    color: #66b1ff;
    /* 悬停时颜色变浅 */
    text-decoration: underline;
    /* 悬停时显示下划线 */
  }
}

.file-actions {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}

.video-player-container {
  margin-top: 16px;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  overflow: hidden;
}

.video-player {
  width: 100%;
  height: 450px;
  object-fit: contain;
  background-color: #000;
}

.pdf-preview-container {
  margin-top: 16px;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  overflow: hidden;
}

.pdf-preview {
  width: 100%;
  height: calc(100vh - 8px);
  border: none;
  background-color: #f5f5f5;
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
