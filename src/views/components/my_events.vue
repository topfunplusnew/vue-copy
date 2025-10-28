<script setup lang="ts">
<<<<<<< HEAD
import { computed, reactive, ref } from 'vue';
import { ElMessage } from 'element-plus';
import { useRoute } from 'vue-router';
import commonHeader from '@/layout/common-header.vue';
import { useConferenceStore } from '@/stores/conference';
import { formatRange } from '@/utils/date';
import { UploadVideo } from '@/services/api';
// import { validConfig } from '@/utils/configValidUtils.ts';
import { getFileIcon } from '@/constants/file';

type TabKey = 'details' | 'video' | 'slides' | 'poster' | 'additional' | 'fulltext';

const activeTab = ref<TabKey>('details');
=======
import { ref, reactive, computed, onMounted, toRaw, watch } from 'vue';
import { useRoute } from 'vue-router';
import { ElMessage } from 'element-plus';
import { useUserStore } from '@/stores/user';
import commonHeader from '@/layout/common-header.vue';
import { useConferenceStore } from '@/stores/conference';
import { formatRange } from '@/utils/date';
import { deepClone, getImageUrl } from '@/utils/index';
import { uploadVideo, putMyPaper, deleteFile } from '@/services/api';

const route = useRoute();
const userStore = useUserStore();
>>>>>>> 77f9935f741c22c4bae183759e6095ae8494e9fc
const graphicalAbstractInput = ref<HTMLInputElement>();
const videoInput = ref<HTMLInputElement>();
const slidesInput = ref<HTMLInputElement>();
const posterInput = ref<HTMLInputElement>();
<<<<<<< HEAD
// const additionalInput = ref<HTMLInputElement>();
const route = useRoute();
const conferenceStore = useConferenceStore();
const videoConsent = ref(false);
const videoFile = ref<File | null>(null);
=======
const additionalInput = ref<HTMLInputElement>();
const conferenceId = computed(() => Number(route.params.conferenceId));
const paperId = computed(() => Number(route.params.paperId));
type TabKey = 'details' | 'video' | 'slides' | 'poster' | 'additional' | 'fulltext';
const activeTab = ref<TabKey>('details');
>>>>>>> 77f9935f741c22c4bae183759e6095ae8494e9fc

function setActiveTab(tab: TabKey) {
  activeTab.value = tab;
}
<<<<<<< HEAD

const paperId = computed(() => Number(route.params.paperId));
conferenceStore.getMyPapers(paperId.value);
// // 获取论文内容
const eventMeta = computed(() => conferenceStore.myPapers);
=======
>>>>>>> 77f9935f741c22c4bae183759e6095ae8494e9fc

const store = useConferenceStore();

<<<<<<< HEAD
// 从路由参数获取conferenceId
// const paperId = computed(() => {
//   // const id = route.params.paperId;
//   // return typeof id === 'string' ? parseInt(id) : Array.isArray(id) ? parseInt(id[0]) : 2;
//   // TODO 暂时写死了
//   return 2;
// });


// // 获取机构列表 - 按作者顺序合并去重并重新编号
// const affiliations = computed(() => {
//   if (!eventMeta.value?.authors) return [];
//   // 按作者的order属性排序
//   const sortedAuthors = [...eventMeta.value.authors].sort((a, b) => (a.order || 0) - (b.order || 0));
//   // 收集所有机构，记录作者ID和原始机构ID
//   const allAffiliations: Array<{
//     authorId: number;
//     originalAffiliationId: number;
//     affiliation: {
//       id: number;
//       name: string;
//       department?: string;
//       university?: string;
//       city?: string;
//       state?: string;
//       country?: string;
//     };
//   }> = [];

//   sortedAuthors.forEach((author) => {
//     if (author.affiliations && author.affiliations.length > 0) {
//       author.affiliations.forEach((affiliation) => {
//         allAffiliations.push({
//           authorId: author.id,
//           originalAffiliationId: affiliation.id,
//           affiliation: affiliation,
//         });
//       });
//     }
//   });
=======
onMounted(() => {
  store.getMyPaper(paperId.value);
});

const myPaperDetailInfo = computed(() => store.myPaperDetail);
const detailsForm = computed(() => ({
  doi: myPaperDetailInfo.value?.doi ?? '',
  abstract: myPaperDetailInfo.value?.abstract ?? '',
  keywords: myPaperDetailInfo.value?.keywords ?? [],
  graphicalAbstractFile: myPaperDetailInfo.value?.graphic_abstract ?? '',
  graphicalAbstractPreview: myPaperDetailInfo.value?.graphic_abstract ?? '',
}));
>>>>>>> 77f9935f741c22c4bae183759e6095ae8494e9fc

//   // 去重：相同原始机构ID只保留第一次出现的
//   const uniqueAffiliations = new Map();
//   const affiliationList: Array<{
//     id: number;
//     originalId: number;
//     name: string;
//     department?: string;
//     university?: string;
//     city?: string;
//     state?: string;
//     country?: string;
//   }> = [];

//   let newId = 1;
//   allAffiliations.forEach((item) => {
//     if (!uniqueAffiliations.has(item.originalAffiliationId)) {
//       const newAffiliation = {
//         id: newId++,
//         originalId: item.originalAffiliationId,
//         name: item.affiliation.name,
//         department: item.affiliation.department,
//         university: item.affiliation.university,
//         city: item.affiliation.city,
//         state: item.affiliation.state,
//         country: item.affiliation.country,
//       };
//       uniqueAffiliations.set(item.originalAffiliationId, newAffiliation);
//       affiliationList.push(newAffiliation);
//     }
//   });

//   return affiliationList;
// });

// // 根据机构原始ID获取新的编号
// function getAffiliationNumber(originalId: number): number {
//   const affiliation = affiliations.value.find((aff) => aff.originalId === originalId);
//   return affiliation ? affiliation.id : 0;
// }

const detailsForm = reactive({
  doi: '',
  abstract: '',
<<<<<<< HEAD
  keywords: ['', '', '', '', ''] as string[],
  graphicalAbstractFile: null as File | null,
  graphicalAbstractPreview: '' as string,
});

function onUploadGraphicalAbstract(e: Event) {
=======
  keywords: [{ name: '', id: 0, order: 0 }],
  graphicalAbstractFile: '',
  graphicalAbstractPreview: '',
});

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
>>>>>>> 77f9935f741c22c4bae183759e6095ae8494e9fc
  const input = e.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;
  const valid = ['image/jpeg', 'image/png'].includes(file.type) && file.size <= 10 * 1024 * 1024;
  if (!valid) {
    ElMessage.error('Invalid file. JPG/PNG up to 10MB.');
    return;
  }
<<<<<<< HEAD
  const url = URL.createObjectURL(file);
  detailsForm.graphicalAbstractFile = file;
  detailsForm.graphicalAbstractPreview = url;
}

// 视频的地址 proxy会自动处理
// const videoSrc = computed(() => {
//   validConfig();
//   if (!eventMeta.value || !eventMeta.value?.video) {
//     return '';
//   }
//   return import.meta.env.IPG_IMAGE_URL + eventMeta.value?.video;
// });
// // pdf的地址
// const pdfSrc = computed(() => {
//   validConfig();
//   if (!eventMeta.value || !eventMeta.value?.slide) {
//     return '';
//   }
//   return import.meta.env.IPG_IMAGE_URL + eventMeta.value?.slide;
// });

async function onUploadVideo(e: Event, file_type = 'video') {
=======

  uploadVideo(uploadFile(file, 'graphic_abstract', '2'));

  const url = URL.createObjectURL(file);
  imagePath.value = url;
  detailFormCopy.graphicalAbstractFile = url;
  detailFormCopy.graphicalAbstractPreview = url;
}

function deleteImage() {
  isMove.value = !isMove.value;
  detailFormCopy.graphicalAbstractPreview = '';
  deleteFile({ paper_id: 2, file_type: 'graphic_abstract', file_path: imagePath.value });
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
  } catch (e) {
    return '';
  }
});

async function onUploadVideo(e: Event, file_type = 'video') {
  //处理上传逻辑
>>>>>>> 77f9935f741c22c4bae183759e6095ae8494e9fc
  const input = e.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;
  if (!videoConsent.value) {
    ElMessage.warning('Please accept the video release terms first.');
    return;
  }
  videoFile.value = file;
  const formData = new FormData();
<<<<<<< HEAD
  formData.append('paper_id', paperId.value.toString());
=======
  formData.append('paper_id', '2');
>>>>>>> 77f9935f741c22c4bae183759e6095ae8494e9fc
  formData.append('file_type', file_type);
  formData.append('file', file);

  try {
<<<<<<< HEAD
    return await UploadVideo(formData);
  } catch {
    ElMessage.error('上传失败');
  }
}

function removeVideo() {
  videoFile.value = null;
}

const slidesFile = ref<File | null>(null);

=======
    const res = await uploadVideo(formData);
    console.log('上传成功！', res);
    return res;
  } catch (err) {
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

const isMove = ref(true);

>>>>>>> 77f9935f741c22c4bae183759e6095ae8494e9fc
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
<<<<<<< HEAD
=======

function removeSlides() {
  slidesFile.value = null;
}
>>>>>>> 77f9935f741c22c4bae183759e6095ae8494e9fc

function removeSlides() {
  slidesFile.value = null;
}

const posterFile = ref<File | null>(null);
<<<<<<< HEAD
const posterFiles = ref<Array<{ file: File; uploaded: boolean; url?: string }>>([]);

// 从API数据获取poster文件列表
// const apiPosterFiles = computed(() => {
//   if (!eventMeta.value?.poster) return [];
//   return [
//     {
//       file: { name: eventMeta.value.poster.split('/').pop() || 'poster', size: 0 } as File,
//       uploaded: true,
//       url: import.meta.env.IPG_IMAGE_URL + eventMeta.value.poster,
//     },
//   ];
// });

//从API数据获取additional文件列表
// const apiAdditionalFiles = computed(() => {
//   if (!eventMeta.value?.addition_files || !Array.isArray(eventMeta.value.addition_files)) return [];
//   return eventMeta.value.addition_files.map((filePath: string) => ({
//     file: { name: filePath.split('/').pop() || 'file', size: 0 } as File,
//     uploaded: true,
//     url: import.meta.env.IPG_IMAGE_URL + filePath,
//   }));
// });

async function onUploadPoster(e: Event) {
=======

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

// Additional info: any files
const additionalFiles = ref<File[]>([]);

function onUploadAdditional(e: Event) {
>>>>>>> 77f9935f741c22c4bae183759e6095ae8494e9fc
  const input = e.target as HTMLInputElement;
  const files = input.files;
  if (!files || files.length === 0) return;

  for (const file of Array.from(files)) {
    if (file.size > 10 * 1024 * 1024) {
      ElMessage.error(`${file.name} is too large. Max size is 10MB.`);
      continue;
    }

    const formData = new FormData();
    formData.append('paper_id', paperId.value.toString());
    formData.append('file_type', 'poster');
    formData.append('file', file);

    try {
      const response = await UploadVideo(formData);
      posterFiles.value.push({
        file: file,
        uploaded: true,
        url: response.data?.url || '',
      });
      ElMessage.success(`${file.name} uploaded successfully!`);
    } catch {
      posterFiles.value.push({
        file: file,
        uploaded: false,
      });
      ElMessage.error(`Failed to upload ${file.name}`);
    }
  }

  // 清空input
  input.value = '';
}

<<<<<<< HEAD
function removePoster(index: number) {
  posterFiles.value.splice(index, 1);
}

// const additionalFiles = ref<Array<{ file: File; uploaded: boolean; url?: string }>>([]);

// async function onUploadAdditional(e: Event) {
//   const input = e.target as HTMLInputElement;
//   const files = input.files;
//   if (!files || files.length === 0) return;

//   for (const file of Array.from(files)) {
//     if (file.size > 10 * 1024 * 1024) {
//       ElMessage.error(`${file.name} is too large. Max size is 10MB.`);
//       continue;
//     }

//     const formData = new FormData();
//     formData.append('paper_id', paperId.value.toString());
//     formData.append('file_type', 'additional');
//     formData.append('file', file);

//     try {
//       const response = await UploadVideo(formData);
//       additionalFiles.value.push({
//         file: file,
//         uploaded: true,
//         url: response.data?.url || '',
//       });
//       ElMessage.success(`${file.name} uploaded successfully!`);
//     } catch {
//       additionalFiles.value.push({
//         file: file,
//         uploaded: false,
//       });
//       ElMessage.error(`Failed to upload ${file.name}`);
//     }
//   }

//   // 清空input
//   input.value = '';
// }

// function clearAdditional() {
//   additionalFiles.value = [];
// }

function saveDetails() {
  ElMessage.success('Details saved successfully!');
=======
function clearAdditional() {
  additionalFiles.value = [];
}

function saveDetails() {
  putMyPaper({
    id: 2,
    doi: Number(detailFormCopy.doi),
    abstract: detailFormCopy.abstract,
    keywords: detailFormCopy.keywords,
  });
>>>>>>> 77f9935f741c22c4bae183759e6095ae8494e9fc
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

<<<<<<< HEAD
// function addToSchedule() {
//   try {
//     const existingEvents = JSON.parse(localStorage.getItem('user-schedule-events') || '[]');
//     const userSessionDate = parseUserSessionDate();
//     if (!userSessionDate) {
//       ElMessage.error('Unable to parse session date');
//       return;
//     }
//     const existingSession = existingEvents.find((event: { isUserSession?: boolean; type?: string }) => event.isUserSession && event.type === 'session');
//     if (existingSession) {
//       ElMessage.warning('Your presentation session is already in your schedule!');
//       return;
//     }
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
//       customColor: '#ff8c00',
//     };
//     existingEvents.push(userSessionEvent);
//     localStorage.setItem('user-schedule-events', JSON.stringify(existingEvents));
//     ElMessage.success('Your presentation session added to your schedule!');
//   } catch {
//     ElMessage.error('Failed to add session to schedule');
//   }
// }

const sessionInfo = {
  dateDisplay: 'WED., June 11, 2025',
  room: 'A3',
  session: 'Visual Computing and Cognitive Modelling for Human-Machine and Social Interaction & Humanized Crowd Computing',
  paperID: '#1234',
};

// function parseUserSessionDate(): string | null {
//   const sessionDateStr = sessionInfo.dateDisplay;
//   try {
//     const match = sessionDateStr.match(/(\w+)\.,\s+(\w+)\s+(\d+),\s+(\d+)/);
//     if (match) {
//       const [, , month, day, year] = match;
//       const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
//       const monthIndex = monthNames.indexOf(month);
//       if (monthIndex !== -1) {
//         const parsedYear = parseInt(year);
//         const parsedMonth = monthIndex + 1;
//         const parsedDay = parseInt(day);

//         const yearStr = parsedYear.toString();
//         const monthStr = parsedMonth.toString().padStart(2, '0');
//         const dayStr = parsedDay.toString().padStart(2, '0');

//         const result = `${yearStr}-${monthStr}-${dayStr}`;
//         return result;
//       }
//     }
//   } catch { }

//   return null;
// }
=======
const sessionInfo = computed(() => myPaperDetailInfo.value?.session);
>>>>>>> 77f9935f741c22c4bae183759e6095ae8494e9fc
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
<<<<<<< HEAD
          <!--          如果有eventMeta?.conference信息 就正常展示-->
          <div v-if="eventMeta?.conference">
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
                    <span class="detail-text">{{ eventMeta?.conference.city }}, {{ eventMeta?.conference.country
                      }}</span>
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
              <!-- <div class="authors">
                <div v-if="eventMeta?.authors?.length" class="authors-list">
                  <span class="author-name" v-for="(author, authorIndex) in eventMeta.authors" :key="authorIndex">
                    {{ author.name
                    }}<template v-if="author?.affiliations?.length"><sup
                        v-for="(affiliation, affiliationsIndex) in author.affiliations" :key="affiliationsIndex">{{
                          getAffiliationNumber(affiliation.id) }}</sup></template><span
  v-if="authorIndex < eventMeta.authors.length - 1">, </span>
</span>
</div> -->
              <!-- 当论文作者为空的时候 渲染一个空状态 -->
              <!-- <div v-else class="empty-state">
                  <div class="empty-text">No authors information available</div>
                </div>
              </div> -->
              <!-- 渲染机构列表以及下标 -->
              <!-- <div class="affiliations">
                <div v-if="affiliations.length" class="affiliations-list">
                  <div class="affiliation" v-for="affiliation in affiliations" :key="affiliation.id">
                    <sup>{{ affiliation.id }}</sup>{{ affiliation.university || affiliation.name }}{{
                      affiliation.department ? ', ' +
                        affiliation.department : '' }}{{ affiliation.city ? ', ' + affiliation.city : ''
                    }}{{ affiliation.state ? ', ' + affiliation.state : '' }}{{ affiliation.country ? ', ' +
                      affiliation.country : ''
                    }}
=======
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
>>>>>>> 77f9935f741c22c4bae183759e6095ae8494e9fc
                  </div>
                </div>
                 当机构列表为空的时候，渲染一个空状态 -->
              <!-- <div v-else class="empty-state">
                  <div class="empty-text">No affiliation information available</div>
                </div>
              </div>  -->
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
                  <!-- <button class="schedule-action-btn" @click="addToSchedule"> -->
                  <span class="btn-icon">📌</span>
                  Add to My Schedule
                  <!-- </button> -->
                </div>
              </div>
              <div class="dates">
                Date Created: {{ eventMeta?.conference.start_time }} · Date Edited:
                {{ eventMeta?.conference.end_time }}
              </div>
            </div>
<<<<<<< HEAD
          </div>
          <!--          没有eventMeta?.conference信息的时候 渲染一个空状态-->
          <div v-else class="empty-conference-state">
            <div class="empty-content">
              <div class="empty-icon">📋</div>
              <div class="empty-title">No Paper Data</div>
              <div class="empty-description">Unable to load Paper information. Please try refreshing the page.</div>
              <button @click="() => conferenceStore.getMyPapers(paperId)" class="retry-btn">
                <span class="btn-icon">🔄</span>
                Retry
              </button>
=======
            <div class="dates">
              Date Created: {{ myPaperDetailInfo?.conference.start_time }} · Date Edited:
              {{ myPaperDetailInfo?.conference.end_time }}
>>>>>>> 77f9935f741c22c4bae183759e6095ae8494e9fc
            </div>
          </div>
        </header>

        <div v-if="activeTab === 'details'" class="tab-content">
          <div class="form-grid">
            <div class="form-item">
              <label>Digital Object Identifier</label>
<<<<<<< HEAD
              <input v-model="detailsForm.doi" placeholder="Enter DOI (e.g., 10.1145/1234567)" />
            </div>
            <div class="form-item full">
              <label>Abstract</label>
              <textarea v-model="detailsForm.abstract" rows="6" placeholder="Enter your abstract..."></textarea>
            </div>
            <div class="form-item">
              <label>Graphical Abstract</label>
              <input ref="graphicalAbstractInput" type="file" accept="image/jpeg,image/png"
                @change="onUploadGraphicalAbstract" style="display: none" />
              <button @click="graphicalAbstractInput?.click()" class="upload-btn">Upload Image</button>
              <div class="hint">Please upload an image [min 400x400 pixels – formats: JPG, PNG – max 10MB]</div>
              <div v-if="detailsForm.graphicalAbstractPreview" class="preview">
                <img :src="detailsForm.graphicalAbstractPreview" alt="Graphical Abstract" />
                <button @click="detailsForm.graphicalAbstractPreview = ''" class="remove-btn">Remove</button>
=======
              <input v-model="detailFormCopy.doi" :placeholder="`${myPaperDetailInfo?.doi ?? ''}`" />
            </div>
            <div class="form-item full">
              <label>Abstract</label>
              <textarea v-model="detailFormCopy.abstract" rows="6" :placeholder="myPaperDetailInfo?.abstract"></textarea>
            </div>
            <div class="form-item">
              <label>Graphical Abstract</label>{{ detailFormCopy.graphicalAbstractPreview }}
              <input ref="graphicalAbstractInput" type="file" accept="image/jpeg,image/png" @change="onUploadGraphicalAbstract" style="display: none" />
              <button @click="onUploadGraphicalAbstract(e)" class="upload-btn">Upload Image</button>
              <div class="hint">Please upload an image [min 400x400 pixels – formats: JPG, PNG – max 10MB]</div>
              <div v-if="detailFormCopy.graphicalAbstractPreview" class="preview">
                <img :src="'/images' + detailFormCopy.graphicalAbstractPreview" alt="Graphical Abstract" v-if="isMove" />
                <img :src="detailFormCopy.graphicalAbstractPreview" alt="Graphical Abstract" v-else />
                <button @click="deleteImage()" class="remove-btn">Remove</button>
>>>>>>> 77f9935f741c22c4bae183759e6095ae8494e9fc
              </div>
            </div>
            <div class="form-item full">
              <label>Keywords</label>
              <div class="keywords">
                <input v-for="(k, i) in detailsForm.keywords" :key="i" v-model="detailsForm.keywords[i]"
                  placeholder="Keyword" />
              </div>
            </div>
            <div class="form-actions">
              <button @click="saveDetails" class="save-btn">Save Details</button>
            </div>
          </div>
        </div>
        <!--        如果左侧选择了视频-->
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
<<<<<<< HEAD
            <!-- <video v-if="videoSrc" class="preview-video" controls :src="videoSrc"></video> -->
=======
            {{ videoShow }}
            <video v-if="videoShow || videoSrc" class="preview-video" controls :src="videoSrc ?? videoShow ?? undefined"></video>
>>>>>>> 77f9935f741c22c4bae183759e6095ae8494e9fc
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
              <button @click="openPdfModal('slides')" class="preview-btn">Full Screen</button>
            </div>
            <div class="pdf-viewer-container">
              <!-- <iframe :src="pdfSrc" class="pdf-viewer-iframe" frameborder="0"></iframe> -->
            </div>
          </div>
        </div>

        <div v-else-if="activeTab === 'poster'" class="tab-content">
<<<<<<< HEAD
          <input ref="posterInput" type="file" multiple @change="onUploadPoster" style="display: none" />
          <button @click="posterInput?.click()" class="file-upload-btn">Upload Poster Files</button>
=======
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
>>>>>>> 77f9935f741c22c4bae183759e6095ae8494e9fc

          <!-- <div class="file-list" v-if="apiPosterFiles.length || posterFiles.length"> -->
          <!-- 显示API数据中的poster文件 -->
          <!-- <div class="file-row" v-for="(fileItem, index) in apiPosterFiles" :key="'api-' + index">
              <div class="file-info">
                <div class="file-icon">{{ getFileIcon(fileItem.file.name) }}</div>
                <div class="file-details">
                  <div class="file-name">{{ fileItem.file.name }}</div>
                  <div class="file-size">API File</div>
                  <div class="file-status uploaded">✓ From Server</div>
                </div>
              </div>
              <a :href="fileItem.url" target="_blank" class="download-btn">Download</a>
            </div> -->
          <!-- 显示新上传的文件 -->
          <div class="file-row" v-for="(fileItem, index) in posterFiles" :key="'new-' + index">
            <div class="file-info">
              <div class="file-icon">{{ getFileIcon(fileItem.file.name) }}</div>
              <div class="file-details">
                <div class="file-name">{{ fileItem.file.name }}</div>
                <div class="file-size">{{ (fileItem.file.size / 1024 / 1024).toFixed(2) }} MB</div>
                <div class="file-status" :class="{ uploaded: fileItem.uploaded, failed: !fileItem.uploaded }">
                  {{ fileItem.uploaded ? '✓ Uploaded' : '✗ Upload Failed' }}
                </div>
              </div>
            </div>
            <button @click="removePoster(index)" class="remove-btn">Remove</button>
          </div>
        </div>
      </section>
    </section>

  </div>

  <!-- <div v-else-if="activeTab === 'additional'" class="tab-content">
          <input ref="additionalInput" type="file" multiple @change="onUploadAdditional" style="display: none" />
          <button @click="additionalInput?.click()" class="file-upload-btn">Upload Additional Files (Optional)</button>
          <div class="file-list" v-if="apiAdditionalFiles.length || additionalFiles.length">
             显示API数据中的additional文件 -->
  <!-- <div class="file-row" v-for="(fileItem, index) in apiAdditionalFiles" :key="'api-' + index">
              <div class="file-info">
                <div class="file-icon">{{ getFileIcon(fileItem.file.name) }}</div>
                <div class="file-details">
                  <div class="file-name">{{ fileItem.file.name }}</div>
                  <div class="file-size">API File</div>
                  <div class="file-status uploaded">✓ From Server</div>
                </div>
              </div>
              <a :href="fileItem.url" target="_blank" class="download-btn">Download</a>
            </div>
            显示新上传的文件 -->
  <!-- <div class="file-row" v-for="(fileItem, index) in additionalFiles" :key="'new-' + index">
              <div class="file-info">
                <div class="file-icon">{{ getFileIcon(fileItem.file.name) }}</div>
                <div class="file-details">
                  <div class="file-name">{{ fileItem.file.name }}</div>
                  <div class="file-size">{{ (fileItem.file.size / 1024 / 1024).toFixed(2) }} MB</div>
                  <div class="file-status" :class="{ uploaded: fileItem.uploaded, failed: !fileItem.uploaded }">
                    {{ fileItem.uploaded ? '✓ Uploaded' : '✗ Upload Failed' }}
                  </div>
                </div>
              </div>
              <button @click="additionalFiles.splice(index, 1)" class="remove-btn">Remove</button>
            </div>
            <button @click="clearAdditional" class="clear-btn">Clear All</button>
          </div>
        </div> -->

  <!-- <div v-else-if="activeTab === 'fulltext'" class="tab-content">
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
                <div class="status"
                  :class="{ ok: apiPosterFiles.length > 0 || (posterFiles.length > 0 && posterFiles.some((f) => f.uploaded)) }">
                  {{apiPosterFiles.length > 0 || (posterFiles.length > 0 && posterFiles.some((f) => f.uploaded)) ?
                    'Uploaded' :
                    'Missing'}}
                </div>
              </div>
              <div class="item">
                <div class="label">Additional Info (optional)</div>
<<<<<<< HEAD
                <div class="status"
                  :class="{ ok: apiAdditionalFiles.length > 0 || (additionalFiles.length > 0 && additionalFiles.some((f) => f.uploaded)) }">
                  {{apiAdditionalFiles.length > 0 || (additionalFiles.length > 0 && additionalFiles.some((f) =>
                    f.uploaded)) ?
                    'Uploaded' : 'Missing'}}
=======
                <div class="status" :class="{ ok: additionalFiles.length > 0 }">
                  {{ additionalFiles.length > 0 ? 'Uploaded' : 'Missing' }}
>>>>>>> 77f9935f741c22c4bae183759e6095ae8494e9fc
                </div>
              </div>
            </div>
          </div>
        </div> -->

<<<<<<< HEAD


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
=======
    <!-- PDF Preview Modal -->
    <div v-if="pdfModalVisible" class="pdf-modal-overlay" @click="closePdfModal">
      <div class="pdf-modal" @click.stop>
        <div class="pdf-modal-header">
          <h3>{{ currentPdfTitle }}</h3>
          <button @click="closePdfModal" class="close-btn">×</button>
        </div>
        <div class="pdf-modal-content">
          <iframe v-if="currentPdfUrl && !isMobile" :src="currentPdfUrl" class="pdf-viewer" frameborder="0"></iframe>
          <div v-else-if="currentPdfUrl && isMobile" class="mobile-pdf-viewer">
            <!-- Mobile PDF display using object tag -->
            <object :data="currentPdfUrl" type="application/pdf" class="mobile-pdf-iframe">
              <embed :src="currentPdfUrl" type="application/pdf" class="mobile-pdf-iframe" />
              <div class="pdf-fallback-mobile">
                <div class="pdf-icon">📄</div>
                <p>{{ getCurrentFileName() }}</p>
              </div>
            </object>
            <!-- Mobile action buttons -->
            <div class="mobile-pdf-actions">
              <a :href="currentPdfUrl" :download="getCurrentFileName()" class="download-btn"> Download PDF </a>
              <button @click="openInNewTab" class="open-btn">Open in New Tab</button>
>>>>>>> 77f9935f741c22c4bae183759e6095ae8494e9fc
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

</template>