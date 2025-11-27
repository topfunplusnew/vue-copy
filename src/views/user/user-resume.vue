<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { ElMessage } from 'element-plus';
import { getUserProfile, uploadBioPdf } from '@/services/user';
import { getImageUrl } from '@/utils';

// 简历PDF上传相关状态
const bioPdfFile = ref<File | null>(null);
const bioPdfFileName = ref('');
const uploadingBioPdf = ref(false);
const bioPdfInputRef = ref<HTMLElement | null>(null);
const currentBioPdf = ref<string | null>(null);
const loading = ref(false);

// 计算 PDF URL
const pdfUrl = computed(() => {
  return currentBioPdf.value ? getImageUrl(currentBioPdf.value) : null;
});

// 检测是否为移动端
const isMobile = computed(() => {
  return window.innerWidth <= 768;
});

// 加载用户资料，获取已上传的简历
const loadUserProfile = async () => {
  loading.value = true;
  try {
    const response = await getUserProfile();
    if (response.data?.bio_pdf) {
      currentBioPdf.value = response.data.bio_pdf;
      // 从路径中提取文件名
      const pathParts = response.data.bio_pdf.split('/');
      bioPdfFileName.value = pathParts[pathParts.length - 1] || 'resume.pdf';
    }
  } catch (error) {
    console.error('Failed to load user profile:', error);
  } finally {
    loading.value = false;
  }
};

// 处理简历PDF上传
function handleBioPdfUpload(event: Event) {
  const target = event.target as HTMLInputElement;
  const file = target.files ? target.files[0] : null;
  
  if (!file) {
    return;
  }

  // 判断是否为PDF文件
  const fileExtension = file.name.split('.').pop()?.toLowerCase();
  if (fileExtension !== 'pdf') {
    ElMessage.error('Please upload a PDF file');
    if (target) {
      target.value = '';
    }
    return;
  }

  // 检查文件大小（限制100MB）
  const maxSize = 100 * 1024 * 1024; // 100MB
  if (file.size > maxSize) {
    ElMessage.error('File size should not exceed 100MB');
    if (target) {
      target.value = '';
    }
    return;
  }

  bioPdfFile.value = file;
  bioPdfFileName.value = file.name;
  
  // 立即上传
  uploadBioPdfFile();
}

// 上传简历PDF文件
function uploadBioPdfFile() {
  if (!bioPdfFile.value) {
    return;
  }

  uploadingBioPdf.value = true;
  uploadBioPdf({ file: bioPdfFile.value })
    .then((response) => {
      ElMessage.success('Resume uploaded successfully');
      bioPdfFileName.value = bioPdfFile.value?.name || '';
      if (response.data?.bio_pdf) {
        currentBioPdf.value = response.data.bio_pdf;
      } else {
        // 重新加载用户资料
        loadUserProfile();
      }
    })
    .catch((error) => {
      console.error('Failed to upload resume:', error);
      ElMessage.error('Failed to upload resume, please try again later');
      bioPdfFile.value = null;
      bioPdfFileName.value = '';
    })
    .finally(() => {
      uploadingBioPdf.value = false;
    });
}

// 触发文件选择
function triggerBioPdfUpload() {
  if (bioPdfInputRef.value) {
    bioPdfInputRef.value.click();
  }
}

// 删除已选择的简历文件
function removeBioPdf() {
  bioPdfFile.value = null;
  bioPdfFileName.value = '';
  if (bioPdfInputRef.value) {
    (bioPdfInputRef.value as HTMLInputElement).value = '';
  }
}

// 预览简历PDF
function previewBioPdf() {
  if (currentBioPdf.value) {
    const pdfUrl = getImageUrl(currentBioPdf.value);
    window.open(pdfUrl, '_blank');
  }
}

// 下载简历PDF
function downloadBioPdf() {
  if (currentBioPdf.value) {
    const pdfUrl = getImageUrl(currentBioPdf.value);
    const link = document.createElement('a');
    link.href = pdfUrl;
    link.download = bioPdfFileName.value || 'resume.pdf';
    link.click();
  }
}

onMounted(() => {
  loadUserProfile();
});
</script>

<template>
  <div class="resume-area" v-loading="loading">
    <div class="resume-header">
      <h2>Resume (PDF)</h2>
    </div>

    <div class="resume-content">
      <div v-if="!currentBioPdf" class="upload-placeholder">
        <input
          ref="bioPdfInputRef"
          type="file"
          accept=".pdf,application/pdf"
          style="display: none"
          @change="handleBioPdfUpload"
        />
        <div class="upload-icon">📄</div>
        <p class="upload-text">No resume uploaded yet</p>
        <el-button type="primary" @click="triggerBioPdfUpload" :loading="uploadingBioPdf" size="large">
          {{ uploadingBioPdf ? 'Uploading...' : 'Upload Resume PDF' }}
        </el-button>
        <p class="upload-hint">Supports PDF files up to 100MB</p>
      </div>

      <div v-else class="resume-with-pdf">
        <div class="resume-actions">
          <input
            ref="bioPdfInputRef"
            type="file"
            accept=".pdf,application/pdf"
            style="display: none"
            @change="handleBioPdfUpload"
          />
          <div class="actions-container">
            <el-button @click="previewBioPdf">Preview in New Tab</el-button>
            <el-button @click="downloadBioPdf">Download</el-button>
            <el-button type="primary" @click="triggerBioPdfUpload" :loading="uploadingBioPdf">
              {{ uploadingBioPdf ? 'Uploading...' : 'Replace' }}
            </el-button>
          </div>
        </div>

        <div class="pdf-preview-container">
          <iframe v-if="pdfUrl && !isMobile" :src="pdfUrl" class="pdf-viewer" frameborder="0"></iframe>
          <div v-else-if="pdfUrl && isMobile" class="mobile-pdf-viewer">
            <object :data="pdfUrl" type="application/pdf" class="mobile-pdf-iframe">
              <embed :src="pdfUrl" type="application/pdf" class="mobile-pdf-iframe" />
              <div class="pdf-fallback-mobile">
                <div class="pdf-icon">📄</div>
                <p>{{ bioPdfFileName || 'resume.pdf' }}</p>
              </div>
            </object>
            <div class="mobile-pdf-actions">
              <a :href="pdfUrl" :download="bioPdfFileName || 'resume.pdf'" class="download-btn">Download PDF</a>
              <button @click="previewBioPdf" class="open-btn">Open in New Tab</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.resume-area {
  padding: 20px;
  height: 100%;
  width: 100%;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  overflow: hidden;
}

.resume-header {
  margin-bottom: 20px;
  flex-shrink: 0;
}

.resume-header h2 {
  font-size: 24px;
  font-weight: 600;
  color: #1a3566;
  margin: 0;
}

.resume-with-pdf {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.resume-actions {
  display: flex;
  justify-content: center;
  align-items: center;
  margin-bottom: 20px;
  flex-shrink: 0;
}

.actions-container {
  display: flex;
  gap: 12px;
  align-items: center;
  justify-content: center;
}

.resume-content {
  flex: 1;
  width: 100%;
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
}

.upload-placeholder {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 40px 20px;
}

.upload-icon {
  font-size: 64px;
  margin-bottom: 16px;
}

.upload-text {
  font-size: 18px;
  color: #666;
  margin-bottom: 24px;
}

.upload-hint {
  font-size: 14px;
  color: #999;
  margin-top: 16px;
}

.pdf-preview-container {
  flex: 1;
  width: 100%;
  display: flex;
  flex-direction: column;
  min-height: 0;
  background: #f5f5f5;
  border-radius: 8px;
  overflow: hidden;
}

.pdf-viewer {
  width: 100%;
  height: 100%;
  border: none;
  flex: 1;
  min-height: 0;
}

.mobile-pdf-viewer {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.mobile-pdf-iframe {
  flex: 1;
  width: 100%;
  border: none;
  min-height: 0;
}

.pdf-fallback-mobile {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 40px 20px;
}

.pdf-icon {
  font-size: 64px;
  margin-bottom: 16px;
}

.mobile-pdf-actions {
  flex-shrink: 0;
  display: flex;
  gap: 12px;
  padding: 16px;
  background: #fff;
  border-top: 1px solid #e0e0e0;
}

.download-btn,
.open-btn {
  flex: 1;
  padding: 12px 16px;
  border-radius: 6px;
  text-align: center;
  text-decoration: none;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  border: none;
  transition: all 0.3s;
}

.download-btn {
  background: #1a3566;
  color: #fff;
}

.download-btn:hover {
  background: #2a4a7a;
}

.open-btn {
  background: #f5f5f5;
  color: #1a3566;
}

.open-btn:hover {
  background: #e0e0e0;
}

/* 移动端响应式样式 */
@media (max-width: 768px) {
  .resume-area {
    padding: 10px;
  }

  .resume-header h2 {
    font-size: 20px;
  }

  .resume-actions {
    margin-bottom: 16px;
  }

  .actions-container {
    width: 100%;
    flex-wrap: wrap;
  }

  .actions-container .el-button {
    flex: 1;
    min-width: 120px;
  }

  .upload-icon {
    font-size: 48px;
  }

  .upload-text {
    font-size: 16px;
  }
}
</style>

