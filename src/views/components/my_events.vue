<script setup lang="ts">
import { ref, reactive, computed, onMounted, inject, toRaw, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import { useUserStore } from '@/stores/user';
import { getImageUrl } from '@/utils';
import commonHeader from '@/layout/common-header.vue';
import { useConferenceStore } from '@/stores/conference'
import { formatRange } from '@/utils/date'
import { deepClone } from '@/utils/index'
import { UploadVideo } from '@/services/api'
import { IPapersKeyword } from '@/types/conference'
const route = useRoute();
const router = useRouter();
const userStore = useUserStore();
const user = computed(() => userStore.user);

// File input refs
const graphicalAbstractInput = ref<HTMLInputElement>();
const videoInput = ref<HTMLInputElement>();
const slidesInput = ref<HTMLInputElement>();
const posterInput = ref<HTMLInputElement>();
const additionalInput = ref<HTMLInputElement>();

const conferenceId = computed(() => Number(route.params.conferenceId));
const paperId = computed(() => Number(route.params.paperId));

// Left navigation tabs
type TabKey = 'details' | 'video' | 'slides' | 'poster' | 'additional' | 'fulltext';
const activeTab = ref<TabKey>('details');

function setActiveTab(tab: TabKey) {
  activeTab.value = tab;
}
const story = useConferenceStore()
// Mock: load conference & paper meta


onMounted(() => {
  story.getMyPapers(2);
})


const eventMeta = computed(() => story.myPapers)

// Details form
const detailsForm = computed(() => ({
  doi: eventMeta.value?.doi ?? '',
  abstract: eventMeta.value?.abstract ?? '',
  keywords: eventMeta.value?.keywords ?? [],
  graphicalAbstractFile: eventMeta.value?.graphic_abstract ?? '',
  graphicalAbstractPreview: eventMeta.value?.graphic_abstract ?? ''
}))

const detailFormCopy = reactive({
  doi: '',
  abstract: '',
  keywords: [],
  graphicalAbstractFile: '',
  graphicalAbstractPreview: ''
})

watch(
  () => detailsForm.value,
  (newVal) => {
    Object.assign(detailFormCopy, deepClone(toRaw(newVal)))
  },
  { immediate: true, deep: true }
)



function onUploadGraphicalAbstract(e: Event) {
  const input = e.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;
  const valid = (
    ['image/jpeg', 'image/png'].includes(file.type) && file.size <= 10 * 1024 * 1024
  );
  if (!valid) {
    ElMessage.error('Invalid file. JPG/PNG up to 10MB.');
    return;
  }
  const url = URL.createObjectURL(file);
  detailFormCopy.graphicalAbstractFile = file;
  detailFormCopy.graphicalAbstractPreview = url;
}

// Video
const videoConsent = ref(false);
const videoFile = ref<File | null>(null);
const videoShow = ref<string | null>(eventMeta.value?.video ?? null)
const videoSrc = computed(() => {//视频预览

  if (!videoFile.value) return '';
  try {
    return URL.createObjectURL(videoFile.value);
  } catch (e) {
    return '';
  }
});

async function onUploadVideo(e: Event, file_type = 'video') {//处理上传逻辑
  const input = e.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;
  if (!videoConsent.value) {
    ElMessage.warning('Please accept the video release terms first.');
    return;
  }
  videoFile.value = file;
  const formData = new FormData()
  formData.append('paper_id', '2')
  formData.append('file_type', file_type)
  formData.append('file', file)

  try {
    const res = await UploadVideo(formData)
    console.log('上传成功！', res);
    return res
  } catch (err) {
    console.error('上传失败：', err.response?.data || err);
  }
}
function removeVideo() { videoFile.value = null; }

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
function removeSlides() { slidesFile.value = null; }

// Poster (single-page PDF up to 10MB)
const posterFile = ref<File | null>(null);
function onUploadPoster(e: Event) {
  const input = e.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;
  if (!file.type.includes('pdf') || file.size > 10 * 1024 * 1024) {
    ElMessage.error('Poster must be a single-page PDF up to 10MB.');
    return;
  }
  posterFile.value = file;
}
function removePoster() { posterFile.value = null; }

// Additional info: any files
const additionalFiles = ref<File[]>([]);
function onUploadAdditional(e: Event) {
  const input = e.target as HTMLInputElement;
  const files = input.files ? Array.from(input.files) : [];
  additionalFiles.value = files;
}
function clearAdditional() { additionalFiles.value = []; }

function saveDetails() {
  ElMessage.success('Details saved successfully!');
}

// PDF Preview Modal
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

// Schedule functionality - 只添加用户的重要个人日程
// function addToSchedule() {
//   try {
//     const existingEvents = JSON.parse(localStorage.getItem('user-schedule-events') || '[]');

//     // 解析用户session日期
//     const userSessionDate = parseUserSessionDate();

//     if (!userSessionDate) {
//       ElMessage.error('Unable to parse session date');
//       return;
//     }

//     // 检查是否已经添加过用户session
//     const existingSession = existingEvents.find((event: any) => event.isUserSession && event.type === 'session');
//     if (existingSession) {
//       ElMessage.warning('Your presentation session is already in your schedule!');
//       return;
//     }

//     // 添加用户的演讲session（重要个人日程）
//     const userSessionEvent = {
//       id: `user-session-${Date.now()}`,
//       title: `${eventMeta.value?.title} - My Presentation`,
//       date: userSessionDate,
//       time: '14:30',
//       location: `Room ${sessionInfo.room}, ${eventMeta.value?.conference.address}`,
//       description: `My presentation: ${eventMeta.value?.title}\nSession: ${sessionInfo.session}\nPaper ID: ${sessionInfo.paperID}`,
//       type: 'session' as const,
//       isUserSession: true,
//       sessionRoom: sessionInfo.room,
//       paperID: sessionInfo.paperID,
//       customColor: '#ff8c00' // 橘色作为默认颜色
//     };

//     existingEvents.push(userSessionEvent);
//     localStorage.setItem('user-schedule-events', JSON.stringify(existingEvents));

//     ElMessage.success('Your presentation session added to your schedule!');
//   } catch (error) {
//     console.error('Failed to add session to schedule:', error);
//     ElMessage.error('Failed to add session to schedule');
//   }
// }

// 统一的session信息，确保显示和数据的一致性

const sessionInfo = computed(() => eventMeta.value?.session)

// Helper function to parse user session date
// function parseUserSessionDate(): string | null {
//   const sessionDateStr = sessionInfo.dateDisplay;
//   try {
//     const match = sessionDateStr.match(/(\w+)\.,\s+(\w+)\s+(\d+),\s+(\d+)/);
//     if (match) {
//       const [, , month, day, year] = match;
//       const monthNames = [
//         'January', 'February', 'March', 'April', 'May', 'June',
//         'July', 'August', 'September', 'October', 'November', 'December'
//       ];
//       const monthIndex = monthNames.indexOf(month);
//       if (monthIndex !== -1) {
//         // 使用本地时间避免时区问题
//         const parsedYear = parseInt(year);
//         const parsedMonth = monthIndex + 1; // 月份从1开始
//         const parsedDay = parseInt(day);

//         // 手动构建YYYY-MM-DD格式，避免时区转换
//         const yearStr = parsedYear.toString();
//         const monthStr = parsedMonth.toString().padStart(2, '0');
//         const dayStr = parsedDay.toString().padStart(2, '0');

//         const result = `${yearStr}-${monthStr}-${dayStr}`;
//         return result;
//       }
//     }
//   } catch (error) {
//     console.error('Error parsing session date:', error);
//   }

//   return null;
// }

// Helper function to parse conference date range
// function parseConferenceDateRange(dateStr: string): { startYear: number, startMonth: number, startDay: number, days: number } | null {
//   // Parse "December 9-15, 2025" to get date range
//   try {
//     const match = dateStr.match(/(\w+)\s+(\d+)-(\d+),\s+(\d+)/);
//     if (match) {
//       const [, month, startDay, endDay, year] = match;
//       const monthNames = [
//         'January', 'February', 'March', 'April', 'May', 'June',
//         'July', 'August', 'September', 'October', 'November', 'December'
//       ];
//       const monthIndex = monthNames.indexOf(month);
//       if (monthIndex !== -1) {
//         return {
//           startYear: parseInt(year),
//           startMonth: monthIndex + 1, // 1-based month
//           startDay: parseInt(startDay),
//           days: parseInt(endDay) - parseInt(startDay) + 1
//         };
//       }
//     }

//     // Handle single day format like "December 9, 2025"
//     const singleMatch = dateStr.match(/(\w+)\s+(\d+),\s+(\d+)/);
//     if (singleMatch) {
//       const [, month, day, year] = singleMatch;
//       const monthNames = [
//         'January', 'February', 'March', 'April', 'May', 'June',
//         'July', 'August', 'September', 'October', 'November', 'December'
//       ];
//       const monthIndex = monthNames.indexOf(month);
//       if (monthIndex !== -1) {
//         return {
//           startYear: parseInt(year),
//           startMonth: monthIndex + 1,
//           startDay: parseInt(day),
//           days: 1
//         };
//       }
//     }
//   } catch (error) {
//     console.error('Error parsing date range:', error);
//   }

//   return null;
// }

// Helper function to format date object to YYYY-MM-DD string (避免时区问题)
// function formatDateToString(date: Date): string {
//   const year = date.getFullYear();
//   const month = (date.getMonth() + 1).toString().padStart(2, '0');
//   const day = date.getDate().toString().padStart(2, '0');
//   return `${year}-${month}-${day}`;
// }

// Helper function to parse conference date string to proper date format
// function parseConferenceDate(dateStr: string): string {
//   // Parse "December 9-15, 2025" to get the start date
//   try {
//     const match = dateStr.match(/(\w+)\s+(\d+)(?:-\d+)?,\s+(\d+)/);
//     if (match) {
//       const [, month, day, year] = match;
//       const monthNames = [
//         'January', 'February', 'March', 'April', 'May', 'June',
//         'July', 'August', 'September', 'October', 'November', 'December'
//       ];
//       const monthIndex = monthNames.indexOf(month);
//       if (monthIndex !== -1) {
//         // 使用本地时间避免时区问题
//         const parsedYear = parseInt(year);
//         const parsedMonth = monthIndex + 1; // 月份从1开始
//         const parsedDay = parseInt(day);

//         // 手动构建YYYY-MM-DD格式，避免时区转换
//         const yearStr = parsedYear.toString();
//         const monthStr = parsedMonth.toString().padStart(2, '0');
//         const dayStr = parsedDay.toString().padStart(2, '0');

//         return `${yearStr}-${monthStr}-${dayStr}`;
//       }
//     }
//   } catch (error) {
//     console.error('Error parsing date:', error);
//   }

//   // Fallback to current date if parsing fails
//   const now = new Date();
//   const year = now.getFullYear();
//   const month = (now.getMonth() + 1).toString().padStart(2, '0');
//   const day = now.getDate().toString().padStart(2, '0');
//   return `${year}-${month}-${day}`;
// }

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
        <button :class="{ active: activeTab === 'additional' }" @click="setActiveTab('additional')">Additional
          Info</button>
        <button :class="{ active: activeTab === 'fulltext' }" @click="setActiveTab('fulltext')">Full Files</button>
      </aside>
      <section class="right-panel">
        <!-- <header class="user-summary">
          <div class="user-avatar" v-if="user?.avatar">
            <img :src="getImageUrl(user?.avatar)" alt="User Avatar" />
          </div>
          <div class="user-name">{{ user?.name }}</div>
        </header> -->
        <header class="event-header">
          <div class="conference-header">
            <div class="logo" v-if="eventMeta?.conference.logo">
              <img :src="eventMeta.conference.logo" alt="Conference Logo" />
            </div>
            <div class="conference-info">
              <div class="conference-name">{{ eventMeta?.conference.abbreviation }}</div>
              <div class="conference-full-name">{{ eventMeta?.conference.name }}</div>
              <div class="conference-details">
                <div class="detail-row">
                  <span class="detail-icon">📅</span>
                  <span class="detail-text">{{ formatRange(eventMeta?.conference.start_time,
                    eventMeta?.conference.end_time) }}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-icon">📍</span>
                  <span class="detail-text">{{ eventMeta?.conference.city }}, {{ eventMeta?.conference.country }}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-icon">🏢</span>
                  <span class="detail-text">{{ eventMeta?.conference.address }}</span>
                </div>
              </div>
            </div>
          </div>
          <div class="conference-links">
            <a :href="eventMeta?.conference.website" target="_blank" class="conf-link">
              <span class="link-icon">🌐</span>
              Official Website
            </a>
            <a :href="eventMeta?.conference.committee_website" target="_blank" class="conf-link">
              <span class="link-icon">👥</span>
              Committee
            </a>
            <a :href="eventMeta?.conference.registration_website" target="_blank" class="conf-link">
              <span class="link-icon">📝</span>
              Registration
            </a>
          </div>
          <div class="meta">
            <div class="title">{{ eventMeta?.title }}</div>
            <div class="authors">
              <span class="author-name">John Smith<sup>1</sup></span>,
              <span class="author-name">Jane Doe<sup>2</sup></span>,
              <span class="author-name">Bob Johnson<sup>1,3</sup></span>
            </div>
            <div class="affiliations">
              <div class="affiliation"><sup>1</sup>Department of Computer Science, Stanford University, Stanford, CA,
                USA</div>
              <div class="affiliation"><sup>2</sup>MIT Computer Science and Artificial Intelligence Laboratory,
                Cambridge, MA, USA</div>
              <div class="affiliation"><sup>3</sup>Department of Electrical Engineering, University of California,
                Berkeley, CA, USA</div>
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
                <!-- <button class="schedule-action-btn" @click="addToSchedule">
                  <span class="btn-icon">📌</span>
                  Add to My Schedule
                </button> -->
              </div>
            </div>
            <div class="dates">Date Created: {{ eventMeta?.conference.start_time }} · Date Edited: {{
              eventMeta?.conference.end_time }}</div>

          </div>
        </header>

        <div v-if="activeTab === 'details'" class="tab-content">
          <div class="form-grid">
            <div class="form-item">
              <label>Digital Object Identifier</label>
              <input v-model="detailFormCopy.doi" :placeholder="`${eventMeta?.doi ?? ''}`" />
            </div>
            <div class="form-item full">
              <label>Abstract</label>
              <textarea v-model="detailFormCopy.abstract" rows="6" :placeholder="eventMeta?.abstract"></textarea>
            </div>
            <div class="form-item">
              <label>Graphical Abstract</label>
              <input ref="graphicalAbstractInput" type="file" accept="image/jpeg,image/png"
                @change="onUploadGraphicalAbstract" style="display: none" />
              <button @click="graphicalAbstractInput?.click()" class="upload-btn">Upload Image</button>
              <div class="hint">Please upload an image [min 400x400 pixels – formats: JPG, PNG – max 10MB]</div>
              <div v-if="detailFormCopy.graphicalAbstractPreview" class="preview">
                <img :src="detailFormCopy.graphicalAbstractPreview" alt="Graphical Abstract" />
                <button @click="detailFormCopy.graphicalAbstractPreview = ''" class="remove-btn">Remove</button>
              </div>
            </div>
            <div class="form-item full">
              <label>Keywords</label>
              <div class="keywords">
                <input v-for="(k, i) in detailFormCopy?.keywords" :key="i" :placeholder="k.name" />
              </div>
            </div>
            <div class="form-actions">
              <button @click="saveDetails" class="save-btn">Save Details</button>
            </div>
          </div>
        </div>

        <div v-else-if="activeTab === 'video'" class="tab-content">
          <div class="video-upload">
            <label class="checkbox">
              <input type="checkbox" v-model="videoConsent" />
              <span>I have read, understood, and accept the video release terms.</span>
            </label>
            <input ref="videoInput" type="file" accept="video/*" @change="onUploadVideo" style="display: none" />
            <button @click="videoInput?.click()" class="file-upload-btn" :disabled="!videoConsent">Upload Video</button>
            <div class="file-row" v-if="videoFile">
              <div class="file-info">
                <div class="file-icon">📹</div>
                <div class="file-details">
                  <div class="file-name">{{ videoFile.name }}</div>
                  <div class="file-size">{{ (videoFile.size / 1024 / 1024).toFixed(2) }} MB</div>
                </div>
              </div>
              <button @click="removeVideo" class="remove-btn">Remove</button>
            </div>
            {{ videoShow }}
            <video v-if="videoShow || videoSrc" class="preview-video" controls
              :src="videoSrc ?? videoShow ?? undefined"></video>
          </div>
        </div>

        <div v-else-if="activeTab === 'slides'" class="tab-content">
          <input ref="slidesInput" type="file" accept="application/pdf" @change="onUploadSlides"
            style="display: none" />
          <button @click="slidesInput?.click()" class="file-upload-btn">Upload Slides (PDF)</button>
          <div class="file-row" v-if="slidesFile">
            <div class="file-info">
              <div class="file-icon">📄</div>
              <div class="file-details">
                <div class="file-name">{{ slidesFile.name }}</div>
                <div class="file-size">{{ (slidesFile.size / 1024 / 1024).toFixed(2) }} MB</div>
              </div>
            </div>
            <button @click="removeSlides" class="remove-btn">Remove</button>
          </div>
          <div class="pdf-preview" v-if="slidesFile">
            <div class="pdf-preview-header">
              <span class="pdf-title">{{ slidesFile.name }}</span>
              <button @click="openPdfModal('slides')" class="preview-btn">Preview PDF</button>
            </div>
            <div class="pdf-thumbnail" @click="openPdfModal('slides')">
              <div class="pdf-icon">📄</div>
              <div class="pdf-info">Click to preview PDF</div>
            </div>
          </div>
        </div>

        <div v-else-if="activeTab === 'poster'" class="tab-content">
          <input ref="posterInput" type="file" accept="application/pdf" @change="onUploadPoster"
            style="display: none" />
          <button @click="posterInput?.click()" class="file-upload-btn">Upload Poster (PDF)</button>
          <div class="file-row" v-if="posterFile">
            <div class="file-info">
              <div class="file-icon">🖼️</div>
              <div class="file-details">
                <div class="file-name">{{ posterFile.name }}</div>
                <div class="file-size">{{ (posterFile.size / 1024 / 1024).toFixed(2) }} MB</div>
              </div>
            </div>
            <button @click="removePoster" class="remove-btn">Remove</button>
          </div>
          <div class="pdf-preview" v-if="posterFile">
            <div class="pdf-preview-header">
              <span class="pdf-title">{{ posterFile.name }}</span>
              <button @click="openPdfModal('poster')" class="preview-btn">Preview PDF</button>
            </div>
            <div class="pdf-thumbnail" @click="openPdfModal('poster')">
              <div class="pdf-icon">🖼️</div>
              <div class="pdf-info">Click to preview poster</div>
            </div>
          </div>
        </div>

        <div v-else-if="activeTab === 'additional'" class="tab-content">
          <input ref="additionalInput" type="file" multiple @change="onUploadAdditional" style="display: none" />
          <button @click="additionalInput?.click()" class="file-upload-btn">Upload Additional Files (Optional)</button>
          <div class="file-list" v-if="additionalFiles.length">
            <div class="file-row" v-for="(f, i) in additionalFiles" :key="i">
              <div class="file-info">
                <div class="file-icon">📎</div>
                <div class="file-details">
                  <div class="file-name">{{ f.name }}</div>
                  <div class="file-size">{{ (f.size / 1024 / 1024).toFixed(2) }} MB</div>
                </div>
              </div>
              <button @click="additionalFiles.splice(i, 1)" class="remove-btn">Remove</button>
            </div>
            <button @click="clearAdditional" class="clear-btn">Clear All</button>
          </div>
        </div>

        <div v-else-if="activeTab === 'fulltext'" class="tab-content">
          <div class="fulltext-section">
            <div class="checklist">
              <div class="item">
                <div class="label">Graphical Abstract</div>
                <div class="status" :class="{ ok: !!detailsForm.graphicalAbstractFile }">{{
                  detailsForm.graphicalAbstractFile ? 'Uploaded' : 'Missing' }}</div>
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
                <div class="status" :class="{ ok: additionalFiles.length > 0 }">{{ additionalFiles.length > 0 ?
                  'Uploaded' :
                  'Missing' }}</div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </section>

    <!-- PDF Preview Modal -->
    <div v-if="pdfModalVisible" class="pdf-modal-overlay" @click="closePdfModal">
      <div class="pdf-modal" @click.stop>
        <div class="pdf-modal-header">
          <h3>{{ currentPdfTitle }}</h3>
          <button @click="closePdfModal" class="close-btn">×</button>
        </div>
        <div class="pdf-modal-content">
          <iframe v-if="currentPdfUrl && !isMobile" :src="currentPdfUrl" class="pdf-viewer" frameborder="0">
          </iframe>
          <div v-else-if="currentPdfUrl && isMobile" class="mobile-pdf-viewer">
            <!-- Mobile PDF display using object tag -->
            <object :data="currentPdfUrl" type="application/pdf" class="mobile-pdf-iframe">
              <embed :src="currentPdfUrl" type="application/pdf" class="mobile-pdf-iframe">
              <div class="pdf-fallback-mobile">
                <div class="pdf-icon">📄</div>
                <p>{{ getCurrentFileName() }}</p>
              </div>
            </object>
            <!-- Mobile action buttons -->
            <div class="mobile-pdf-actions">
              <a :href="currentPdfUrl" :download="getCurrentFileName()" class="download-btn">
                Download PDF
              </a>
              <button @click="openInNewTab" class="open-btn">
                Open in New Tab
              </button>
            </div>
          </div>
          <div v-else class="pdf-loading">Loading PDF...</div>
        </div>
      </div>
    </div>
  </div>
</template>
