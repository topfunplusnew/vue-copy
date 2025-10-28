<script setup lang="ts">
import { deleteFile, getFileUploadAddress } from '@/services/common/files.ts';
import { Plus, Document } from '@element-plus/icons-vue';
import { ElMessage, type UploadProps } from 'element-plus';
import { auth } from '@/services/http.ts';
import { computed, ref } from 'vue';
import { getImageUrl, isVideoFile, isPdfFile, isImageFile, downloadFile } from '@/utils';
import type { UploadUserFile } from 'element-plus';
import type { TabKey } from '@/types/conference.ts';
import { getFileTypeByTabKey } from '@/utils/conference';
import PdfIcon from './icons/pdf-icon.vue';
import ExcelIcon from './icons/excel-icon.vue';
import WordIcon from './icons/word-icon.vue';
import PptIcon from './icons/ppt-icon.vue';
import TxtIcon from './icons/txt-icon.vue';

interface PaperDetail {
  fileUrl?: string;

  [key: string]: unknown;
}

interface Props {
  tabKey: TabKey;
  paperId: string | number;
  paperDetail?: PaperDetail;
}

const props = withDefaults(defineProps<Props>(), {
  tabKey: 'details',
  paperId: '',
  paperDetail: () => ({}),
});
const tabKey = computed(() => props.tabKey);
const paperDetailInfo = computed(() => props.paperDetail);
const paperId = computed(() => props.paperId);
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

// 判断是否应该显示文件表格（既不是图片、PDF，也不是视频）
const shouldShowFileTable = computed(() => {
  return (
    posterFileList.value.length === 1 &&
    posterFileList.value[0]?.url &&
    !isVideoFile(posterFileList.value[0].url) &&
    !isPdfFile(posterFileList.value[0].url) &&
    !isImageFile(posterFileList.value[0].url)
  );
});

// 获取视频URL
const videoUrl = computed(() => {
  return shouldShowVideoPlayer.value ? posterFileList.value[0].url : null;
});

// 获取PDF URL
const pdfUrl = computed(() => {
  return shouldShowPdfPreview.value ? posterFileList.value[0].url : null;
});

// 获取文件表格数据
const fileTableData = computed(() => {
  if (!shouldShowFileTable.value) {
    return [];
  }
  const file = posterFileList.value[0];
  return [
    {
      name: file.name,
      url: file.url,
      size: 'Unknown', // 可以后续从API获取文件大小
      type: getFileExtension(file.url || ''),
    },
  ];
});

// 获取文件扩展名
const getFileExtension = (url: string): string => {
  const lastDot = url.lastIndexOf('.');
  return lastDot !== -1 ? url.substring(lastDot + 1).toUpperCase() : 'Unknown';
};

// 根据文件类型获取对应的图标组件
const getFileIcon = (url: string) => {
  const extension = getFileExtension(url).toLowerCase();
  
  // 优先使用 isPdfFile 函数判断PDF文件
  if (isPdfFile(url)) {
    return PdfIcon;
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
const dialogImageUrl = ref('');
const dialogVisible = ref(false);
const handleRemove: UploadProps['onRemove'] = (uploadFile, uploadFiles) => {
  console.log(`uploadFile, uploadFiles`, uploadFile, uploadFiles);
  if (!paperId.value) {
    return;
  }
  deleteFile({
    paper_id: Number(paperId.value),
    file_type: file_type.value,
    file_path: uploadFile.url || '',
  }).then(() => {
    ElMessage.success('删除文件成功~');
  });
};
const handlePictureCardPreview: UploadProps['onPreview'] = (uploadFile) => {
  dialogImageUrl.value = uploadFile.url!;
  dialogVisible.value = true;
};
const handleError = () => {
  ElMessage.error('上传失败!');
};

const handleExceed: UploadProps['onExceed'] = (files, uploadFiles) => {
  ElMessage.warning(`最多只能上传 ${uploadFiles.length} 个文件，当前选择了 ${files.length} 个文件`);
};
</script>

<template>
  <div>
    <el-upload
      :data="bodyParams"
      :headers="headers"
      v-model:file-list="posterFileList"
      :action="serverActionUrl"
      list-type="text"
      :on-preview="handlePictureCardPreview"
      :on-remove="handleRemove"
      :on-error="handleError"
      :on-exceed="handleExceed"
      :limit="1"
      class="upload-area"
    >
      <div class="upload-block">
        <el-icon class="upload-icon"><Plus /></el-icon>
        <div class="upload-text">点击上传文件</div>
      </div>
    </el-upload>

    <!-- 自定义文件列表显示 -->
    <div v-if="posterFileList.length > 0" class="custom-file-list">
      <div v-for="file in posterFileList" :key="file.uid" class="file-item">
        <div class="file-preview">
          <!-- 如果是图片，显示缩略图 -->
          <img 
            v-if="isImageFile(file.url || '')" 
            :src="file.url" 
            :alt="file.name"
            class="file-thumbnail"
            @click="handlePictureCardPreview(file as any)"
          />
          <!-- 如果不是图片，显示对应的文件图标 -->
          <div v-else class="file-icon-container">
            <component 
              :is="getFileIcon(file.url || '')" 
              v-if="getFileIcon(file.url || '')"
              class="file-icon"
            />
            <div v-else class="default-file-icon">
              <el-icon><Document /></el-icon>
            </div>
          </div>
        </div>
        <div class="file-info">
          <div class="file-name" :title="file.name">{{ file.name }}</div>
          <div class="file-actions">
            <el-button 
              type="danger" 
              size="small" 
              @click="handleRemove(file as any, posterFileList as any)"
            >
              删除
            </el-button>
          </div>
        </div>
      </div>
    </div>
    <el-dialog v-model="dialogVisible">
      <img w-full :src="dialogImageUrl" alt="Preview Image" />
    </el-dialog>

    <!-- 视频播放器 -->
    <div v-if="shouldShowVideoPlayer" class="video-player-container">
      <video :src="videoUrl || undefined" controls class="video-player" preload="metadata">您的浏览器不支持视频播放</video>
    </div>

    <!-- PDF预览 -->
    <div v-if="shouldShowPdfPreview" class="pdf-preview-container">
      <iframe :src="pdfUrl || undefined" class="pdf-preview" frameborder="0" type="application/pdf"> 您的浏览器不支持PDF预览 </iframe>
    </div>

    <!-- 文件表格 -->
    <div v-if="shouldShowFileTable" class="file-table-container">
      <el-table :data="fileTableData" style="width: 100%">
        <el-table-column prop="name" label="文件名" width="300" />
        <el-table-column prop="type" label="文件类型" width="120" />
        <el-table-column prop="size" label="文件大小" width="120" />
        <el-table-column label="操作" width="150">
          <template #default="scope">
            <el-button type="primary" size="small" @click="downloadFile(scope.row.url, scope.row.name)"> 下载 </el-button>
          </template>
        </el-table-column>
      </el-table>
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

    &:hover {
      border-color: #409eff;
      background-color: #f0f9ff;
    }
  }

  :deep(.el-upload-list) {
    display: none;
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

.upload-icon {
  font-size: 32px;
  margin-bottom: 8px;
  color: #999;
}

.upload-text {
  font-size: 14px;
  color: #999;
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
  width: 36px;
  height: 36px;
  margin-right: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  overflow: hidden;
  background-color: #f5f5f5;
}

.file-thumbnail {
  width: 100%;
  height: 100%;
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
  justify-content: space-between;
  min-height: 36px;
}

.file-name {
  font-size: 13px;
  font-weight: 500;
  color: #333;
  word-break: break-all;
  line-height: 1.3;
  flex: 1;
  margin-right: 8px;
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
  height: 600px;
  border: none;
  background-color: #f5f5f5;
}

.file-table-container {
  margin-top: 16px;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  overflow: hidden;
}

.file-table-container .el-table {
  border: none;
}

.file-table-container .el-table th,
.file-table-container .el-table td {
  border-bottom: 1px solid #e4e7ed;
}
</style>
