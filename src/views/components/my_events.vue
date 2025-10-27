<script setup lang="ts">
import { computed, reactive, ref } from 'vue';
import { ElMessage } from 'element-plus';
import commonHeader from '@/layout/common-header.vue';
import { useConferenceStore } from '@/stores/conference';
import { formatRange } from '@/utils/date';
import { UploadVideo } from '@/services/api';
type TabKey = 'details' | 'video' | 'slides' | 'poster' | 'additional' | 'fulltext';

const activeTab = ref<TabKey>('details');
const graphicalAbstractInput = ref<HTMLInputElement>();
const videoInput = ref<HTMLInputElement>();
const slidesInput = ref<HTMLInputElement>();
const posterInput = ref<HTMLInputElement>();
const additionalInput = ref<HTMLInputElement>();
const story = useConferenceStore();


function setActiveTab(tab: TabKey) {
  activeTab.value = tab;
}
story.getMyPapers(2);
// 获取论文内容
const eventMeta = computed(() => story.myPapers);
// 获取机构列表
const affiliations = computed(() => {
  if (!eventMeta.value?.authors) return [];
  const affiliationMap = new Map();
  let affiliationId = 1;
  eventMeta.value.authors.forEach(author => {
    if (author.affiliations && author.affiliations.length > 0) {
      author.affiliations.forEach(affiliation => {
        if (!affiliationMap.has(affiliation.id)) {
          affiliationMap.set(affiliation.id, {
            id: affiliationId++,
            ...affiliation
          });
        }
      });
    }
  });
  return Array.from(affiliationMap.values());
});
function getAffiliationNumber(affiliationId: number): number {
  const affiliation = affiliations.value.find(aff => aff.id === affiliationId);
  return affiliation ? affiliation.id : 0;
}
const detailsForm = reactive({
  doi: '',
  abstract: '',
  keywords: ['', '', '', '', ''] as string[],
  graphicalAbstractFile: null as File | null,
  graphicalAbstractPreview: '' as string,
});

function onUploadGraphicalAbstract(e: Event) {
  const input = e.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;
  const valid = ['image/jpeg', 'image/png'].includes(file.type) && file.size <= 10 * 1024 * 1024;
  if (!valid) {
    ElMessage.error('Invalid file. JPG/PNG up to 10MB.');
    return;
  }
  const url = URL.createObjectURL(file);
  detailsForm.graphicalAbstractFile = file;
  detailsForm.graphicalAbstractPreview = url;
}

const videoConsent = ref(false);
const videoFile = ref<File | null>(null);
const videoSrc = computed(() => {
  if (!videoFile.value) return '';
  try {
    return URL.createObjectURL(videoFile.value);
  } catch {
    return '';
  }
});

async function onUploadVideo(e: Event, file_type = 'video') {
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
    const res = await UploadVideo(formData);
    return res;
  } catch {
    ElMessage.error('上传失败');
  }
}

function removeVideo() {
  videoFile.value = null;
}

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

function removePoster() {
  posterFile.value = null;
}

const additionalFiles = ref<File[]>([]);

function onUploadAdditional(e: Event) {
  const input = e.target as HTMLInputElement;
  additionalFiles.value = input.files ? Array.from(input.files) : [];
}

function clearAdditional() {
  additionalFiles.value = [];
}

function saveDetails() {
  ElMessage.success('Details saved successfully!');
}

const pdfModalVisible = ref(false);
const currentPdfUrl = ref('');
const currentPdfTitle = ref('');
const currentPdfFile = ref<File | null>(null);

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

function addToSchedule() {
  try {
    const existingEvents = JSON.parse(localStorage.getItem('user-schedule-events') || '[]');

    const userSessionDate = parseUserSessionDate();

    if (!userSessionDate) {
      ElMessage.error('Unable to parse session date');
      return;
    }

    const existingSession = existingEvents.find((event: { isUserSession?: boolean; type?: string }) => event.isUserSession && event.type === 'session');
    if (existingSession) {
      ElMessage.warning('Your presentation session is already in your schedule!');
      return;
    }

    const userSessionEvent = {
      id: `user-session-${Date.now()}`,
      title: `${eventMeta.value?.title} - My Presentation`,
      date: userSessionDate,
      time: '14:30',
      location: `Room ${sessionInfo.room}, ${eventMeta.value?.conference.address}`,
      description: `My presentation: ${eventMeta.value?.title}\nSession: ${sessionInfo.session}\nPaper ID: ${sessionInfo.paperID}`,
      type: 'session' as const,
      isUserSession: true,
      sessionRoom: sessionInfo.room,
      paperID: sessionInfo.paperID,
      customColor: '#ff8c00',
    };

    existingEvents.push(userSessionEvent);
    localStorage.setItem('user-schedule-events', JSON.stringify(existingEvents));

    ElMessage.success('Your presentation session added to your schedule!');
  } catch {
    ElMessage.error('Failed to add session to schedule');
  }
}

const sessionInfo = {
  dateDisplay: 'WED., June 11, 2025',
  room: 'A3',
  session: 'Visual Computing and Cognitive Modelling for Human-Machine and Social Interaction & Humanized Crowd Computing',
  paperID: '#1234',
};

function parseUserSessionDate(): string | null {
  const sessionDateStr = sessionInfo.dateDisplay;
  try {
    const match = sessionDateStr.match(/(\w+)\.,\s+(\w+)\s+(\d+),\s+(\d+)/);
    if (match) {
      const [, , month, day, year] = match;
      const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
      const monthIndex = monthNames.indexOf(month);
      if (monthIndex !== -1) {
        const parsedYear = parseInt(year);
        const parsedMonth = monthIndex + 1;
        const parsedDay = parseInt(day);

        const yearStr = parsedYear.toString();
        const monthStr = parsedMonth.toString().padStart(2, '0');
        const dayStr = parsedDay.toString().padStart(2, '0');

        const result = `${yearStr}-${monthStr}-${dayStr}`;
        return result;
      }
    }
  } catch {}

  return null;
}
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
            <div class="logo" v-if="eventMeta?.conference.logo">
              <img :src="eventMeta.conference.logo" alt="Conference Logo" />
            </div>
            <div class="conference-info">
              <div class="conference-name">{{ eventMeta?.conference.abbreviation }}</div>
              <div class="conference-full-name">{{ eventMeta?.conference.name }}</div>
              <div class="conference-details">
                <div class="detail-row">
                  <span class="detail-icon">📅</span>
                  <span class="detail-text">{{ formatRange(eventMeta!.created_at, eventMeta!.updated_at) }}</span>
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

            <!-- 渲染论文作者列表以及下标 -->
            <div class="authors">
              <div v-if="eventMeta?.authors?.length" class="authors-list">
                <span class="author-name" v-for="(author, authorIndex) in eventMeta.authors" :key="authorIndex">
                  {{ author.name }}<template v-if="author?.affiliations?.length"><sup v-for="(affiliation, affiliationsIndex) in author.affiliations" :key="affiliationsIndex">{{ getAffiliationNumber(affiliation.id) }}</sup></template><span v-if="authorIndex < eventMeta.authors.length - 1">, </span>
                </span>
              </div>
              <!-- 当论文作者为空的时候 渲染一个空状态 -->
              <div v-else class="empty-state">
                <div class="empty-text">No authors information available</div>
              </div>
            </div>
            <!-- 渲染机构列表以及下标 -->
            <div class="affiliations">
              <div v-if="affiliations.length" class="affiliations-list">
                <div class="affiliation" v-for="affiliation in affiliations" :key="affiliation.id">
                  <sup>{{ affiliation.id }}</sup>{{ affiliation.name }}{{ affiliation.department ? ', ' + affiliation.department : '' }}{{ affiliation.university ? ', ' + affiliation.university : '' }}{{ affiliation.city ? ', ' + affiliation.city : '' }}{{ affiliation.state ? ', ' + affiliation.state : '' }}{{ affiliation.country ? ', ' + affiliation.country : '' }}
                </div>
              </div>
              <!-- 当机构列表为空的时候，渲染一个空状态 -->
              <div v-else class="empty-state">
                <div class="empty-text">No affiliation information available</div>
              </div>
            </div>
            <div class="session-notice">
              <div class="session-header">
                <div class="notice-title">Important Conference Schedule</div>
              </div>
              <div class="session-content">
                <div class="schedule-details">
                  <div class="schedule-row">
                    <span class="schedule-label">📅 Date:</span>
                    <span class="schedule-value">{{ sessionInfo.dateDisplay }}</span>
                  </div>
                  <div class="schedule-row">
                    <span class="schedule-label">🏢 Room:</span>
                    <span class="schedule-value">{{ sessionInfo.room }}</span>
                  </div>
                  <div class="schedule-row">
                    <span class="schedule-label">🎯 Session:</span>
                    <span class="schedule-value">{{ sessionInfo.session }}</span>
                  </div>
                  <div class="schedule-row">
                    <span class="schedule-label">📄 Paper ID:</span>
                    <span class="schedule-value">{{ sessionInfo.paperID }}</span>
                  </div>
                </div>
                <button class="schedule-action-btn" @click="addToSchedule">
                  <span class="btn-icon">📌</span>
                  Add to My Schedule
                </button>
              </div>
            </div>
            <div class="dates">
              Date Created: {{ eventMeta?.conference.start_time }} · Date Edited:
              {{ eventMeta?.conference.end_time }}
            </div>
          </div>
        </header>

        <div v-if="activeTab === 'details'" class="tab-content">
          <div class="form-grid">
            <div class="form-item">
              <label>Digital Object Identifier</label>
              <input v-model="detailsForm.doi" placeholder="Enter DOI (e.g., 10.1145/1234567)" />
            </div>
            <div class="form-item full">
              <label>Abstract</label>
              <textarea v-model="detailsForm.abstract" rows="6" placeholder="Enter your abstract..."></textarea>
            </div>
            <div class="form-item">
              <label>Graphical Abstract</label>
              <input ref="graphicalAbstractInput" type="file" accept="image/jpeg,image/png" @change="onUploadGraphicalAbstract" style="display: none" />
              <button @click="graphicalAbstractInput?.click()" class="upload-btn">Upload Image</button>
              <div class="hint">Please upload an image [min 400x400 pixels – formats: JPG, PNG – max 10MB]</div>
              <div v-if="detailsForm.graphicalAbstractPreview" class="preview">
                <img :src="detailsForm.graphicalAbstractPreview" alt="Graphical Abstract" />
                <button @click="detailsForm.graphicalAbstractPreview = ''" class="remove-btn">Remove</button>
              </div>
            </div>
            <div class="form-item full">
              <label>Keywords</label>
              <div class="keywords">
                <input v-for="(k, i) in detailsForm.keywords" :key="i" v-model="detailsForm.keywords[i]" placeholder="Keyword" />
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
            <video v-if="videoSrc" class="preview-video" controls :src="videoSrc"></video>
          </div>
        </div>

        <div v-else-if="activeTab === 'slides'" class="tab-content">
          <input ref="slidesInput" type="file" accept="application/pdf" @change="onUploadSlides" style="display: none" />
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
          <input ref="posterInput" type="file" accept="application/pdf" @change="onUploadPoster" style="display: none" />
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
