<script setup lang="ts">
import { computed, reactive, ref, toRaw, watch } from 'vue';
import { useRoute } from 'vue-router';
import { ElMessage } from 'element-plus';
import commonHeader from '@/layout/common-header.vue';
import { useConferenceStore } from '@/stores/conference';
import { formatRange } from '@/utils/date';
import { deepClone, getImageUrl } from '@/utils/index';
import { putMyPaper } from '@/services/api';
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
const paperContent = reactive({
  fileUrl: myPaperDetailInfo.value?.graphic_abstract,
});
const detailsForm = computed(() => ({
  doi: myPaperDetailInfo.value?.doi ?? '',
  abstract: myPaperDetailInfo.value?.abstract ?? '',
  keywords: myPaperDetailInfo.value?.keywords ?? [],
  graphicalAbstractFile: myPaperDetailInfo.value?.graphic_abstract ?? '',
  graphicalAbstractPreview: myPaperDetailInfo.value?.graphic_abstract ?? '',
}));

const detailFormCopy = reactive({
  doi: 0,
  abstract: '',
  keywords: [{ name: '', id: 0, order: 0 }],
  graphicalAbstractFile: '',
  graphicalAbstractPreview: '',
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
  }
}

watch(
  () => detailsForm.value,
  (newVal) => {
    Object.assign(detailFormCopy, deepClone(toRaw(newVal)));
  },
  { immediate: true, deep: true },
);

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
  detailFormCopy.graphicalAbstractFile = url;
  detailFormCopy.graphicalAbstractPreview = url;
}

// Video
const videoConsent = ref(false);
const videoFile = ref<File | null>(null);
const videoShow = ref<string | null>(myPaperDetailInfo.value?.video ?? null);
const videoSrc = computed(() => {
  //视频预览

  if (!videoFile.value) return '';
  try {
    return URL.createObjectURL(videoFile.value);
  } catch {
    return '';
  }
});

async function onUploadVideo(e: Event, file_type = 'video') {
  //处理上传逻辑
  const input = e.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;
  if (!videoConsent.value) {
    ElMessage.warning('Please accept the video release terms first.');
    return;
  }
  videoFile.value = file;
  const formData = new FormData();
  formData.append('paper_id', '2');
  formData.append('file_type', file_type);
  formData.append('file', file);

  try {
    const res = await uploadVideo(formData);
    console.log('上传成功！', res);
    return res;
  } catch (err: any) {
    console.error('上传失败：', err.response?.data || err);
  }
}

function uploadFile(file: File, file_type: string, paper_id: string) {
  const formData = new FormData();
  formData.append('paper_id', paper_id);
  formData.append('file_type', file_type);
  formData.append('file', file);
  return formData;
}

function removeVideo() {
  videoFile.value = null;
}

// Slides (PDF up to 10MB)
const slidesFile = ref<File | null>(null);

function onUploadSlides(e: Event) {
  const input = e.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;
  if (!file.type.includes('pdf') || file.size > 10 * 1024 * 1024) {
    ElMessage.error('Slides must be a PDF up to 10MB.');
    return;
  }
  slidesFile.value = file;
}

function removeSlides() {
  slidesFile.value = null;
}

const posterFile = ref<File | null>(null);
const additionalFiles = ref<File[]>([]);

function saveDetails() {
  putMyPaper({
    id: 2,
    doi: Number(detailFormCopy.doi),
    abstract: detailFormCopy.abstract,
    keywords: detailFormCopy.keywords,
  });
}

const pdfModalVisible = ref(false);
const currentPdfUrl = ref('');
const currentPdfTitle = ref('');
const currentPdfFile = ref<File | null>(null);

// Mobile detection
const isMobile = computed(() => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth <= 768;
});

function openPdfModal(type: 'slides' | 'poster') {
  let file: File | null = null;
  let title = '';

  if (type === 'slides' && slidesFile.value) {
    file = slidesFile.value;
    title = `Slides: ${file.name}`;
  } else if (type === 'poster' && posterFile.value) {
    file = posterFile.value;
    title = `Poster: ${file.name}`;
  }

  if (file) {
    currentPdfFile.value = file;
    currentPdfUrl.value = URL.createObjectURL(file);
    currentPdfTitle.value = title;
    pdfModalVisible.value = true;
  }
}

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
              <input v-model="detailFormCopy.doi" :placeholder="`${myPaperDetailInfo?.doi ?? ''}`" />
            </div>
            <div class="form-item full">
              <label>Abstract</label>
              <textarea v-model="detailFormCopy.abstract" rows="6" :placeholder="myPaperDetailInfo?.abstract"></textarea>
            </div>
            <div class="form-item">
              <label>Graphical Abstract</label>
              <input ref="graphicalAbstractInput" type="file" accept="image/jpeg,image/png" @change="onUploadGraphicalAbstract" style="display: none" />
              <file-upload :tab-key="activeTab" :paper-id="paperId" :paper-detail="paperContent" :limit="1" @refresh="refreshPaperData" />
            </div>
            <div class="form-item full">
              <label>Keywords</label>
              <div class="keywords">
                <input v-for="(k, i) in detailFormCopy?.keywords" v-model="k.name" :key="i" :placeholder="k.name" />
              </div>
            </div>
            <div class="form-actions">
              <button @click="saveDetails()" class="save-btn">Save Details</button>
            </div>
          </div>
        </div>

        <div v-else-if="activeTab === 'video'" class="tab-content">
          <div class="video-upload">
            <label class="checkbox">
              <input type="checkbox" v-model="videoConsent" />
              <span>I have read, understood, and accept the video release terms.</span>
            </label>
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
                <div class="status" :class="{ ok: !!detailsForm.graphicalAbstractFile }">
                  {{ detailsForm.graphicalAbstractFile ? 'Uploaded' : 'Missing' }}
                </div>
              </div>
              <div class="item">
                <div class="label">Slides</div>
                <div class="status" :class="{ ok: !!slidesFile }">{{ slidesFile ? 'Uploaded' : 'Missing' }}</div>
              </div>
              <div class="item">
                <div class="label">Video</div>
                <div class="status" :class="{ ok: !!videoFile }">{{ videoFile ? 'Uploaded' : 'Missing' }}</div>
              </div>
              <div class="item">
                <div class="label">Poster</div>
                <div class="status" :class="{ ok: !!posterFile }">{{ posterFile ? 'Uploaded' : 'Missing' }}</div>
              </div>
              <div class="item">
                <div class="label">Additional Info (optional)</div>
                <div class="status" :class="{ ok: additionalFiles.length > 0 }">
                  {{ additionalFiles.length > 0 ? 'Uploaded' : 'Missing' }}
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
</style>
