<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import { useUserStore } from '@/stores/user';
import { getImageUrl } from '@/utils';
import commonHeader from '@/layout/common-header.vue';

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

// Mock: load conference & paper meta
const eventMeta = reactive({
  logo: 'https://nips.cc/static/core/img/NeurIPS-logo.svg',
  conferenceName: 'NeurIPS 2025',
  conferenceFullName: 'Neural Information Processing Systems',
  conferenceDate: 'December 9-15, 2025',
  location: {
    city: 'Vancouver',
    country: 'Canada',
    venue: 'Vancouver Convention Centre'
  },
  websites: {
    official: 'https://nips.cc',
    committee: 'https://nips.cc/Conferences/2025/ProgramCommittee',
    registration: 'https://nips.cc/Conferences/2025/Registration'
  },
  createdAt: '2025-01-10',
  updatedAt: '2025-02-18',
  title: 'Learning Efficient Policies with Sparse Feedback',
  authors: [
    { name: 'Dr. John Smith', affiliation: 'Stanford University' },
    { name: 'Prof. Jane Doe', affiliation: 'MIT' },
    { name: 'Dr. Bob Johnson', affiliation: 'University of California' }
  ]
});

// Details form
const detailsForm = reactive({
  doi: '',
  abstract: '',
  keywords: ['','','','',''] as string[],
  graphicalAbstractFile: null as File | null,
  graphicalAbstractPreview: '' as string,
});

function onUploadGraphicalAbstract(e: Event) {
  const input = e.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;
  const valid = (
    ['image/jpeg','image/png'].includes(file.type) && file.size <= 10 * 1024 * 1024
  );
  if (!valid) {
    ElMessage.error('Invalid file. JPG/PNG up to 10MB.');
    return;
  }
  const url = URL.createObjectURL(file);
  detailsForm.graphicalAbstractFile = file;
  detailsForm.graphicalAbstractPreview = url;
}

// Video
const videoConsent = ref(false);
const videoFile = ref<File | null>(null);
const videoSrc = computed(() => {
  if (!videoFile.value) return '';
  try {
    return URL.createObjectURL(videoFile.value);
  } catch (e) {
    return '';
  }
});
function onUploadVideo(e: Event) {
  const input = e.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;
  if (!videoConsent.value) {
    ElMessage.warning('Please accept the video release terms first.');
    return;
  }
  videoFile.value = file;
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

</script>

<template>
  <div class="background-layer"></div>
    
  <div class="my-events-page main">
    <commonHeader />
    
    <section class="main-content">
      <aside class="left-nav">
        <button :class="{active: activeTab==='details'}" @click="setActiveTab('details')">Details</button>
        <button :class="{active: activeTab==='video'}" @click="setActiveTab('video')">Video</button>
        <button :class="{active: activeTab==='slides'}" @click="setActiveTab('slides')">Slides</button>
        <button :class="{active: activeTab==='poster'}" @click="setActiveTab('poster')">Poster</button>
        <button :class="{active: activeTab==='additional'}" @click="setActiveTab('additional')">Additional Info</button>
        <button :class="{active: activeTab==='fulltext'}" @click="setActiveTab('fulltext')">Full Text</button>
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
            <div class="logo" v-if="eventMeta.logo">
              <img :src="eventMeta.logo" alt="Conference Logo" />
            </div>
            <div class="conference-info">
              <div class="conference-name">{{ eventMeta.conferenceName }}</div>
              <div class="conference-full-name">{{ eventMeta.conferenceFullName }}</div>
              <div class="conference-details">
                <div class="detail-row">
                  <span class="detail-icon">📅</span>
                  <span class="detail-text">{{ eventMeta.conferenceDate }}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-icon">📍</span>
                  <span class="detail-text">{{ eventMeta.location.city }}, {{ eventMeta.location.country }}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-icon">🏢</span>
                  <span class="detail-text">{{ eventMeta.location.venue }}</span>
                </div>
                <div class="conference-links">
                  <a :href="eventMeta.websites.official" target="_blank" class="conf-link">
                    <span class="link-icon">🌐</span>
                    Official Website
                  </a>
                  <a :href="eventMeta.websites.committee" target="_blank" class="conf-link">
                    <span class="link-icon">👥</span>
                    Committee
                  </a>
                  <a :href="eventMeta.websites.registration" target="_blank" class="conf-link">
                    <span class="link-icon">📝</span>
                    Registration
                  </a>
                </div>
              </div>
            </div>
          </div>
          <div class="meta">
            <div class="title">{{ eventMeta.title }}</div>
            <div class="authors">
              <span class="author-name">John Smith<sup>1</sup></span>,
              <span class="author-name">Jane Doe<sup>2</sup></span>,
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
                    <span class="schedule-value">TUE., June 10, 2025</span>
                  </div>
                  <div class="schedule-row">
                    <span class="schedule-label">🏢 Room:</span>
                    <span class="schedule-value">A3</span>
                  </div>
                  <div class="schedule-row">
                    <span class="schedule-label">🎯 Session:</span>
                    <span class="schedule-value">RVisual Computing and Cognitive Modelling for Human-Machine and Social Interaction & Humanized Crowd Computing</span>
                  </div>
                  <div class="schedule-row">
                    <span class="schedule-label">📄 Paper ID:</span>
                    <span class="schedule-value">#1234</span>
                  </div>
                </div>
                <button class="schedule-action-btn">
                  <span class="btn-icon">📌</span>
                  Add to My Schedule
                </button>
              </div>
            </div>
            <div class="dates">Date Created: {{ eventMeta.createdAt }} · Date Edited: {{ eventMeta.updatedAt }}</div>

        </div>
        </header>

        <div v-if="activeTab==='details'" class="tab-content">
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

        <div v-else-if="activeTab==='video'" class="tab-content">
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

        <div v-else-if="activeTab==='slides'" class="tab-content">
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

        <div v-else-if="activeTab==='poster'" class="tab-content">
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

        <div v-else-if="activeTab==='additional'" class="tab-content">
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

        <div v-else-if="activeTab==='fulltext'" class="tab-content">
          <div class="fulltext-section">
            <div class="checklist">
              <div class="item">
                <div class="label">Graphical Abstract</div>
                <div class="status" :class="{ok: !!detailsForm.graphicalAbstractFile}">{{ detailsForm.graphicalAbstractFile ? 'Uploaded' : 'Missing' }}</div>
              </div>
              <div class="item">
                <div class="label">Slides</div>
                <div class="status" :class="{ok: !!slidesFile}">{{ slidesFile ? 'Uploaded' : 'Missing' }}</div>
              </div>
              <div class="item">
                <div class="label">Video</div>
                <div class="status" :class="{ok: !!videoFile}">{{ videoFile ? 'Uploaded' : 'Missing' }}</div>
              </div>
              <div class="item">
                <div class="label">Poster</div>
                <div class="status" :class="{ok: !!posterFile}">{{ posterFile ? 'Uploaded' : 'Missing' }}</div>
              </div>
              <div class="item">
                <div class="label">Additional Info (optional)</div>
                <div class="status" :class="{ok: additionalFiles.length>0}">{{ additionalFiles.length>0 ? 'Uploaded' : 'Missing' }}</div>
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
          <iframe 
            v-if="currentPdfUrl && !isMobile" 
            :src="currentPdfUrl" 
            class="pdf-viewer"
            frameborder="0">
          </iframe>
          <div v-else-if="currentPdfUrl && isMobile" class="mobile-pdf-viewer">
            <!-- Mobile PDF display using object tag -->
            <object 
              :data="currentPdfUrl" 
              type="application/pdf"
              class="mobile-pdf-iframe">
              <embed 
                :src="currentPdfUrl" 
                type="application/pdf"
                class="mobile-pdf-iframe">
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

