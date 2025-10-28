<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import { ElMessage } from 'element-plus';
import commonHeader from '@/layout/common-header.vue';
import { useConferenceStore } from '@/stores/conference';
import { formatRange } from '@/utils/date';
import { getImageUrl } from '@/utils/index';
import { updateMyPaperDetail, searchKeywords as searchKeywordsAPI } from '@/services/api';
import { uploadVideo } from '@/services/common/files.ts';
import FileUpload from '@/components/file-upload.vue';
import type { TabKey } from '@/types/conference.ts';
import { getFileTypeByTabKey } from '@/utils/conference.ts';

const route = useRoute();
const graphicalAbstractInput = ref<HTMLInputElement>();
const paperId = computed(() => Number(route.params.paperId));
const activeTab = ref<TabKey>('details');

const store = useConferenceStore();
store.getMyPaper(paperId.value);
const myPaperDetailInfo = computed(() => store.myPaperDetail);

// 创建基于myPaperDetailInfo的reactive表单对象
const formData = reactive({
  doi: '',
  abstract: '',
  keywords: [] as string[],
  graphic_abstract: '',
  video: '',
  slide: '',
  poster: '',
  addition_files: '',
});

// 初始化表单数据
const initializeFormData = () => {
  if (myPaperDetailInfo.value) {
    formData.doi = String(myPaperDetailInfo.value.doi ?? '');
    formData.abstract = myPaperDetailInfo.value.abstract ?? '';
    // 将keywords从对象数组转换为字符串数组
    formData.keywords = myPaperDetailInfo.value.keywords?.map(k => 
      typeof k === 'string' ? k : k.name || ''
    ).filter(Boolean) || [];
    formData.graphic_abstract = myPaperDetailInfo.value.graphic_abstract ?? '';
    formData.video = myPaperDetailInfo.value.video ?? '';
    formData.slide = myPaperDetailInfo.value.slide ?? '';
    formData.poster = myPaperDetailInfo.value.poster ?? '';
    formData.addition_files = myPaperDetailInfo.value.addition_files ?? '';
  }
};

// 监听myPaperDetailInfo变化，更新表单数据
watch(
  () => myPaperDetailInfo.value,
  () => {
    initializeFormData();
  },
  { immediate: true, deep: true }
);

const paperContent = reactive({
  fileUrl: myPaperDetailInfo.value?.graphic_abstract,
});

function setActiveTab(tab: TabKey) {
  activeTab.value = tab;
  if (myPaperDetailInfo.value) {
    paperContent.fileUrl = myPaperDetailInfo.value[getFileTypeByTabKey(tab)];
  }
}

async function refreshPaperData() {
  await store.getMyPaper(paperId.value);
  if (myPaperDetailInfo.value) {
    paperContent.fileUrl = myPaperDetailInfo.value[getFileTypeByTabKey(activeTab.value)];
    // 刷新后重新初始化表单数据
    initializeFormData();
  }
}

const imagePath = ref<string>('');

function onUploadGraphicalAbstract(e: Event) {
  graphicalAbstractInput.value?.click();
  const input = e.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;
  const valid = ['image/jpeg', 'image/png'].includes(file.type) && file.size <= 10 * 1024 * 1024;
  if (!valid) {
    ElMessage.error('Invalid file. JPG/PNG up to 10MB.');
    return;
  }

  uploadVideo(uploadFile(file, 'graphic_abstract', '2'));

  const url = URL.createObjectURL(file);
  imagePath.value = url;
  formData.graphic_abstract = url;
}

// Video
const videoConsent = ref(!!myPaperDetailInfo.value?.video);

// 监听paper数据变化，自动更新video consent状态
watch(
  () => myPaperDetailInfo.value?.video,
  (hasVideo) => {
    videoConsent.value = !!hasVideo;
  },
  { immediate: true }
);

function uploadFile(file: File, file_type: string, paper_id: string) {
  const formData = new FormData();
  formData.append('paper_id', paper_id);
  formData.append('file_type', file_type);
  formData.append('file', file);
  return formData;
}


// 关键词搜索相关
const keywordInput = ref('');
let searchTimeout: NodeJS.Timeout | null = null;

// 搜索关键词的异步函数
const querySearchAsync = (queryString: string, cb: (arg: { value: string }[]) => void) => {
  // 清除之前的定时器
  if (searchTimeout) {
    clearTimeout(searchTimeout);
  }
  
  if (!queryString.trim()) {
    cb([]);
    return;
  }
  
  // 添加防抖，避免频繁请求
  searchTimeout = setTimeout(() => {
    searchKeywordsAPI(queryString)
      .then(response => {
        // 从响应中提取items数组，并获取关键词名称
        const items = response.data?.items || [];
        const suggestions = items.map((item: { name?: string; keyword?: string; [key: string]: unknown }) => ({
          value: item.name || item.keyword || String(item)
        })).filter((item: { value: string }) => item.value);
        
        cb(suggestions);
      })
      .catch(error => {
        console.error('搜索关键词失败:', error);
        cb([]);
      });
  }, 200); // 300ms防抖
};

// 选择建议项
const handleSelect = (item: Record<string, unknown>) => {
  if (item.value && typeof item.value === 'string') {
    addKeyword(item.value);
  }
};

// 添加关键词
const addKeyword = (keyword?: string) => {
  const keywordToAdd = keyword || keywordInput.value.trim();
  if (keywordToAdd && !formData.keywords.includes(keywordToAdd)) {
    formData.keywords.push(keywordToAdd);
    keywordInput.value = '';
  }
};

// 删除关键词
const removeKeyword = (index: number) => {
  formData.keywords.splice(index, 1);
};

async function saveDetails() {
  try {
    // 将keywords字符串数组转换为后端期望的对象数组格式
    const keywordsForBackend = formData.keywords.map((keyword, index) => ({
      name: keyword,
      id: index + 1,
      order: index + 1
    }));
    
    const updateData = {
      id: paperId.value,
      doi: Number(formData.doi) || 0,
      abstract: formData.abstract,
      keywords: keywordsForBackend,
      graphic_abstract: formData.graphic_abstract,
      video: formData.video,
      slide: formData.slide,
      poster: formData.poster,
      addition_files: formData.addition_files,
    };
    
    await updateMyPaperDetail(updateData);
    ElMessage.success('保存成功！');
    
    // 保存成功后刷新数据
    await refreshPaperData();
  } catch (error) {
    console.error('保存失败：', error);
    ElMessage.error('保存失败，请重试');
  }
}

const pdfModalVisible = ref(false);
const currentPdfUrl = ref('');
const currentPdfTitle = ref('');
const currentPdfFile = ref<File | null>(null);

// Mobile detection
const isMobile = computed(() => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth <= 768;
});

function closePdfModal() {
  if (currentPdfUrl.value) {
    URL.revokeObjectURL(currentPdfUrl.value);
  }
  pdfModalVisible.value = false;
  currentPdfUrl.value = '';
  currentPdfTitle.value = '';
  currentPdfFile.value = null;
}

function getCurrentFileName() {
  return currentPdfFile.value?.name || 'document.pdf';
}

function openInNewTab() {
  if (currentPdfUrl.value) {
    window.open(currentPdfUrl.value, '_blank');
  }
}

const sessionInfo = computed(() => myPaperDetailInfo.value?.session);
</script>

<template>
  <div class="background-layer"></div>

  <div class="my-events-page main">
    <commonHeader />

    <section class="main-content">
      <aside class="left-nav">
        <button :class="{ active: activeTab === 'details' }" @click="setActiveTab('details')">Details</button>
        <button :class="{ active: activeTab === 'video' }" @click="setActiveTab('video')">Video</button>
        <button :class="{ active: activeTab === 'slides' }" @click="setActiveTab('slides')">Slides</button>
        <button :class="{ active: activeTab === 'poster' }" @click="setActiveTab('poster')">Poster</button>
        <button :class="{ active: activeTab === 'additional' }" @click="setActiveTab('additional')">Additional Info</button>
        <button :class="{ active: activeTab === 'fulltext' }" @click="setActiveTab('fulltext')">Full Files</button>
      </aside>
      <section class="right-panel">
        <header class="event-header">
          <div class="conference-header">
            <div class="logo" v-if="myPaperDetailInfo?.conference.logo">
              <img :src="getImageUrl(myPaperDetailInfo.conference.logo)" alt="Conference Logo" />
            </div>
            <div class="conference-info">
              <div class="conference-name">{{ myPaperDetailInfo?.conference.abbreviation }}</div>
              <div class="conference-full-name">{{ myPaperDetailInfo?.conference.name }}</div>
              <div class="conference-details">
                <div class="detail-row">
                  <span class="detail-icon">📅</span>
                  <span class="detail-text">{{ formatRange(myPaperDetailInfo?.conference.start_time, myPaperDetailInfo?.conference.end_time) }}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-icon">📍</span>
                  <span class="detail-text">{{ myPaperDetailInfo?.conference.city }}, {{ myPaperDetailInfo?.conference.country }}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-icon">🏢</span>
                  <span class="detail-text">{{ myPaperDetailInfo?.conference.address }}</span>
                </div>
              </div>
            </div>
          </div>
          <div class="conference-links">
            <a :href="myPaperDetailInfo?.conference.website" target="_blank" class="conf-link">
              <span class="link-icon">🌐</span>
              Official Website
            </a>
            <a :href="myPaperDetailInfo?.conference.committee_website" target="_blank" class="conf-link">
              <span class="link-icon">👥</span>
              Committee
            </a>
            <a :href="myPaperDetailInfo?.conference.registration_website" target="_blank" class="conf-link">
              <span class="link-icon">📝</span>
              Registration
            </a>
          </div>
          <div class="meta">
            <div class="title">{{ myPaperDetailInfo?.title }}</div>
            <div class="authors">
              <span class="author-name">John Smith<sup>1</sup></span
              >, <span class="author-name">Jane Doe<sup>2</sup></span
              >,
              <span class="author-name">Bob Johnson<sup>1,3</sup></span>
            </div>
            <div class="affiliations">
              <div class="affiliation"><sup>1</sup>Department of Computer Science, Stanford University, Stanford, CA, USA</div>
              <div class="affiliation"><sup>2</sup>MIT Computer Science and Artificial Intelligence Laboratory, Cambridge, MA, USA</div>
              <div class="affiliation"><sup>3</sup>Department of Electrical Engineering, University of California, Berkeley, CA, USA</div>
            </div>
            <div class="session-notice">
              <div class="session-header">
                <div class="notice-title">Important Conference Schedule</div>
              </div>
              <div class="session-content">
                <div class="schedule-details">
                  <div class="schedule-row">
                    <span class="schedule-label">📅 Date:</span>
                    <span class="schedule-value">{{ formatRange(sessionInfo?.start_time) }}</span>
                  </div>
                  <div class="schedule-row">
                    <span class="schedule-label">🏢 Room:</span>
                    <span class="schedule-value">{{ sessionInfo?.room_info }}</span>
                  </div>
                  <div class="schedule-row">
                    <span class="schedule-label">🎯 Session:</span>
                    <span class="schedule-value">{{ sessionInfo?.session_name }}</span>
                  </div>
                  <div class="schedule-row">
                    <span class="schedule-label">📄 Paper ID:</span>
                    <span class="schedule-value">{{ sessionInfo?.session_number }}</span>
                  </div>
                </div>
              </div>
            </div>
            <div class="dates">
              Date Created: {{ myPaperDetailInfo?.conference.start_time }} · Date Edited:
              {{ myPaperDetailInfo?.conference.end_time }}
            </div>
          </div>
        </header>

        <div v-if="activeTab === 'details'" class="tab-content">
          <div class="form-grid">
            <div class="form-item">
              <label>Digital Object Identifier</label>
              <el-input 
                v-model="formData.doi" 
                :placeholder="`${myPaperDetailInfo?.doi ?? ''}`"
                clearable
              />
            </div>
            <div class="form-item full">
              <label>Abstract</label>
              <el-input 
                v-model="formData.abstract" 
                type="textarea" 
                :rows="6" 
                :placeholder="myPaperDetailInfo?.abstract"
                resize="vertical"
              />
            </div>
            <div class="form-item">
              <label>Graphical Abstract</label>
              <input ref="graphicalAbstractInput" type="file" accept="image/jpeg,image/png" @change="onUploadGraphicalAbstract" style="display: none" />
              <file-upload :tab-key="activeTab" :paper-id="paperId" :paper-detail="paperContent" :limit="1" @refresh="refreshPaperData" />
            </div>
            <div class="form-item full">
              <label>Keywords</label>
              <div class="keywords-container">
                <el-tag
                  v-for="(keyword, index) in formData.keywords"
                  :key="index"
                  closable
                  @close="removeKeyword(index)"
                >
                  {{ keyword }}
                </el-tag>
                <el-autocomplete
                  v-model="keywordInput"
                  :fetch-suggestions="querySearchAsync"
                  placeholder="请输入关键词..."
                  style="width: 50%;"
                  @select="handleSelect"
                  @keyup.enter="addKeyword"
                />
              </div>
            </div>
            <div class="form-actions">
              <button @click="saveDetails()" class="save-btn">Save Details</button>
            </div>
          </div>
        </div>

        <div v-else-if="activeTab === 'video'" class="tab-content">
          <div class="consent-section">
            <label class="checkbox">
              <input type="checkbox" v-model="videoConsent" />
              <span>I have read, understood, and accept the video release terms.</span>
            </label>
          </div>
          <div v-if="videoConsent" class="video-upload">
            <file-upload :tab-key="activeTab" :paper-id="paperId" :paper-detail="paperContent" :limit="1" @refresh="refreshPaperData" />
          </div>
        </div>

        <div v-else-if="activeTab === 'slides'" class="tab-content">
          <file-upload :tab-key="activeTab" :paper-id="paperId" :paper-detail="paperContent" :limit="1" @refresh="refreshPaperData" />
        </div>

        <div v-else-if="activeTab === 'poster'" class="tab-content">
          <file-upload :tab-key="activeTab" :paper-id="paperId" :paper-detail="paperContent" :limit="1" @refresh="refreshPaperData" />
        </div>

        <div v-else-if="activeTab === 'additional'" class="tab-content">
          <file-upload :tab-key="activeTab" :paper-id="paperId" :paper-detail="paperContent" :limit="-1" @refresh="refreshPaperData" />
        </div>

        <div v-else-if="activeTab === 'fulltext'" class="tab-content">
          <div class="fulltext-section">
            <div class="checklist">
              <div class="item">
                <div class="label">Graphical Abstract</div>
                <div class="status" :class="{ ok: !!formData.graphic_abstract }">
                  {{ formData.graphic_abstract ? 'Uploaded' : 'Missing' }}
                </div>
              </div>
              <div class="item">
                <div class="label">Slides</div>
                <div class="status" :class="{ ok: !!formData.slide }">{{ formData.slide ? 'Uploaded' : 'Missing' }}</div>
              </div>
              <div class="item">
                <div class="label">Video</div>
                <div class="status" :class="{ ok: !!formData.video }">{{ formData.video ? 'Uploaded' : 'Missing' }}</div>
              </div>
              <div class="item">
                <div class="label">Poster</div>
                <div class="status" :class="{ ok: !!formData.poster }">{{ formData.poster ? 'Uploaded' : 'Missing' }}</div>
              </div>
              <div class="item">
                <div class="label">Additional Info (optional)</div>
                <div class="status" :class="{ ok: !!formData.addition_files }">
                  {{ formData.addition_files ? 'Uploaded' : 'Missing' }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </section>
    <div v-if="pdfModalVisible" class="pdf-modal-overlay" @click="closePdfModal">
      <div class="pdf-modal" @click.stop>
        <div class="pdf-modal-header">
          <h3>{{ currentPdfTitle }}</h3>
          <button @click="closePdfModal" class="close-btn">×</button>
        </div>
        <div class="pdf-modal-content">
          <iframe v-if="currentPdfUrl && !isMobile" :src="currentPdfUrl" class="pdf-viewer" frameborder="0"></iframe>
          <div v-else-if="currentPdfUrl && isMobile" class="mobile-pdf-viewer">
            <object :data="currentPdfUrl" type="application/pdf" class="mobile-pdf-iframe">
              <embed :src="currentPdfUrl" type="application/pdf" class="mobile-pdf-iframe" />
              <div class="pdf-fallback-mobile">
                <div class="pdf-icon">📄</div>
                <p>{{ getCurrentFileName() }}</p>
              </div>
            </object>
            <div class="mobile-pdf-actions">
              <a :href="currentPdfUrl" :download="getCurrentFileName()" class="download-btn"> Download PDF </a>
              <button @click="openInNewTab" class="open-btn">Open in New Tab</button>
            </div>
          </div>
          <div v-else class="pdf-loading">Loading PDF...</div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.pdf-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
  overflow: auto;
}

.pdf-modal {
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
  max-width: 90vw;
  max-height: 90vh;
  width: 800px;
  height: 600px;
  display: flex;
  flex-direction: column;
  margin: auto;
}

.pdf-modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #e4e7ed;
  flex-shrink: 0;
}

.pdf-modal-content {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.pdf-viewer {
  width: 100%;
  height: 100%;
  border: none;
}

.mobile-pdf-viewer {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.mobile-pdf-iframe {
  flex: 1;
  width: 100%;
  border: none;
}

.mobile-pdf-actions {
  display: flex;
  gap: 10px;
  padding: 10px;
  border-top: 1px solid #e4e7ed;
  flex-shrink: 0;
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #666;
  padding: 0;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.close-btn:hover {
  color: #333;
}

.consent-section {
  margin-bottom: 24px;
  padding: 16px;
  background-color: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #e9ecef;
}

.checkbox {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-size: 14px;
  color: #333;
}

.checkbox input[type="checkbox"] {
  width: 16px;
  height: 16px;
  cursor: pointer;
}

.keywords-container {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}
</style>
