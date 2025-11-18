<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import { ElMessage } from 'element-plus';
import type { FormInstance, FormRules } from 'element-plus';
import commonHeader from '@/layout/common-header.vue';
import { useConferenceStore } from '@/stores/conference';
import { convertUTCToTimezone, formatRange } from '@/utils/date';
import { getImageUrl } from '@/utils';
import { updateMyPaperDetail } from '@/services/api';
//, searchKeywords as searchKeywordsAPI
import FileUpload from '@/components/file-upload.vue';
import { addPaperViewHistory } from '@/services/user';
import type { TabKey } from '@/types/conference.ts';
import { getFileTypeByTabKey } from '@/utils/conference.ts';
// import { useDragSort } from '@/hooks/useDragSort';
import { getImageFormats, getVideoFormats } from '@/utils/file';
// import SaveButton from '@/components/save-button.vue';
import LatexContent from '@/components/latex-content.vue';

const store = useConferenceStore();
const route = useRoute();
const paperId = computed(() => Number(route.params.paperId));
const activeTab = ref<TabKey | 'Key Point'>('details');
const myPaperDetailInfo = computed(() => store.myPaperDetail);

// 静态常量
const MAX_KEYWORDS = 6;

// 记录论文浏览历史
const recordViewHistory = async (id: number) => {
  try {
    await addPaperViewHistory({
      paper_id: id,
      view_type: 'detail',
    });
  } catch (error) {
    // 静默失败，不影响页面展示
    console.error('Failed to record view history:', error);
  }
};

onMounted(async () => {
  await store.getMyPaper(paperId.value);
  // 记录浏览历史
  recordViewHistory(paperId.value);
});

// 监听 paperId 变化，当路由参数变化时重新记录
watch(
  () => paperId.value,
  (newId) => {
    if (newId) {
      recordViewHistory(newId);
    }
  }
);
// 创建基于myPaperDetailInfo的reactive表单对象
const keywords = ref<Array<{ name: string; id: number; order: number }>>([]);
const formData = reactive({
  doi: '',
  abstract: '',
  graphic_abstract: [] as string[],
  video: '',
  slide: '',
  poster: '',
  addition_files: [] as string[],
  keywords: [] as Array<{ name: string; id: number; order: number }>,
  poster_status: 0,
  slide_status: 0,
  video_status: 0,
  key_points: [] as string[]
});

// Key Points 状态管理
const keyPoints = reactive([
  { id: 1, title: 'Key Point One', content: '' },
  { id: 2, title: 'Key Point Two', content: '' },
  { id: 3, title: 'Key Point Three', content: '' },
  { id: 4, title: 'Key Point Four', content: '' },
  { id: 5, title: 'Key Point Five', content: '' },
]);
const fullscreenLoading = ref(false); //全局loading
const detailsFormRef = ref<FormInstance>();

const validateDoiRule = (_: unknown, value: string, callback: (error?: Error) => void): void => {
  if (!value) {
    callback();
    return;
  }
  const pattern = /^[A-Za-z0-9._:\/\-]+$/;
  if (!pattern.test(value)) {
    callback(new Error('DOI can only contain letters, numbers,. _:/-and other characters.'));
    return;
  }
  callback();
};

const detailsRules: FormRules = {
  doi: [{ validator: validateDoiRule, trigger: ['blur', 'change'] }],
  keywords: [
    {
      validator: (_: unknown, __: unknown, callback: (error?: Error) => void) => {
        if ((keywords.value?.length || 0) > MAX_KEYWORDS) {
          callback(new Error(`You already add ${MAX_KEYWORDS} keywords.`));
          return;
        }
        callback();
      },
      trigger: ['change', 'blur'],
    },
  ],
};

// // 使用拖拽排序hook
// const { draggedIndex, draggedOverIndex, handleDragStart, handleDragOver, handleDragLeave, handleDrop, handleDragEnd, handleTouchStart, handleTouchMove, handleTouchEnd, handleTouchCancel } =
//   useDragSort(keywords);

// // 关键词容器引用，用于触摸拖动
// const keywordsContainerRef = ref<HTMLElement | null>(null);

// 初始化表单数据
const initializeFormData = () => {
  if (myPaperDetailInfo.value) {
    formData.doi = String(myPaperDetailInfo.value.doi ?? '');
    formData.abstract = myPaperDetailInfo.value.abstract ?? '';
    // 后端返回的是对象数组，按order排序
    keywords.value = myPaperDetailInfo.value.keywords?.sort((a, b) => (a.order || 0) - (b.order || 0)) || [];
    formData.keywords = keywords.value;
    formData.graphic_abstract = myPaperDetailInfo.value.graphic_abstract ?? [];
    formData.video = myPaperDetailInfo.value.video ?? '';
    formData.slide = myPaperDetailInfo.value.slide ?? '';
    formData.poster = myPaperDetailInfo.value.poster ?? '';
    formData.addition_files = myPaperDetailInfo.value.addition_files ?? [];
    formData.poster_status = myPaperDetailInfo.value.poster_status ?? 0;
    formData.slide_status = myPaperDetailInfo.value.slide_status ?? 0;
    formData.video_status = myPaperDetailInfo.value.video_status ?? 0;
    formData.key_points = myPaperDetailInfo.value.key_points ?? [];
  }
};

// 监听myPaperDetailInfo变化，更新表单数据
watch(
  () => myPaperDetailInfo.value,
  () => {
    initializeFormData();
  },
  { immediate: true, deep: true },
);

// 同步表单字段并触发表单校验
watch(
  () => keywords.value,
  () => {
    formData.keywords = keywords.value;
    detailsFormRef.value?.validateField('keywords');
  },
  { deep: true },
);

const paperContent = computed(() => ({
  fileUrl: activeTab.value === 'Key Point' ? '' : myPaperDetailInfo.value?.[getFileTypeByTabKey(activeTab.value)],
}));

function setActiveTab(tab: TabKey | 'Key Point') {
  activeTab.value = tab;
}

async function refreshPaperData() {
  await store.getMyPaper(paperId.value);
  // 刷新后重新初始化表单数据
  initializeFormData();
}

const videoConsent = ref(!!myPaperDetailInfo.value?.video);
// 监听paper数据变化，自动更新video consent状态
watch(
  () => myPaperDetailInfo.value?.video,
  (hasVideo) => {
    videoConsent.value = !!hasVideo;
  },
  { immediate: true },
);
// 关键词搜索相关
// const keywordInput = ref('');
// let searchTimeout: NodeJS.Timeout | null = null;

// 搜索关键词的异步函数
// const querySearchAsync = (queryString: string, cb: (arg: { value: string }[]) => void) => {
//   // 清除之前的定时器
//   if (searchTimeout) {
//     clearTimeout(searchTimeout);
//   }

//   if (!queryString.trim()) {
//     cb([]);
//     return;
//   }

//   // 添加防抖，避免频繁请求
//   searchTimeout = setTimeout(() => {
//     searchKeywordsAPI(queryString)
//       .then((response) => {
//         // 从响应中提取items数组，并获取关键词名称
//         const items = response.data?.items || [];
//         const suggestions = items
//           .map((item: { name?: string; keyword?: string;[key: string]: unknown }) => ({
//             value: item.name || item.keyword || String(item),
//           }))
//           .filter((item: { value: string }) => item.value);

//         cb(suggestions);
//       })
//       .catch((error) => {
//         console.error('搜索关键词失败:', error);
//         cb([]);
//       });
//   }, 200); // 300ms防抖
// };

// 选择建议项
// const handleSelect = (item: Record<string, unknown>) => {
//   if (item.value && typeof item.value === 'string') {
//     addKeyword(item.value);
//   }
// };

// 添加关键词
// const addKeyword = (keyword?: string) => {
//   const keywordToAdd = keyword || keywordInput.value.trim();

//   // 检查是否已达到最大数量限制
//   if (keywords.value.length >= MAX_KEYWORDS) {
//     ElMessage.warning(`You can add up to ${MAX_KEYWORDS} keywords.`);
//     detailsFormRef.value?.validateField('keywords');
//     return;
//   }

//   if (keywordToAdd && !keywords.value.some((k) => k.name === keywordToAdd)) {
//     const newKeyword = {
//       name: keywordToAdd,
//       id: keywords.value.length + 1,
//       order: keywords.value.length + 1,
//     };
//     keywords.value.push(newKeyword);
//     keywordInput.value = '';
//   }
// };

// 删除关键词
// const removeKeyword = (index: number) => {
//   keywords.value.splice(index, 1);
//   // 重新分配order
//   keywords.value.forEach((keyword, idx) => {
//     keyword.order = idx + 1;
//   });
// };

// function onKeywordBlur() {
//   if (keywords.value.length >= MAX_KEYWORDS) {
//     detailsFormRef.value?.validateField('keywords');
//     ElMessage.warning(`You can add up to ${MAX_KEYWORDS} keywords.`);
//   }
// }

// 保存 Key Points 功能
// async function saveKeyPoints() {
//   fullscreenLoading.value = true;
//   try {
//     ElMessage.success('Key Points Saved Successfully!');
//     // 这里可以添加保存到后端的逻辑

//     console.log('Saving key points:', keyPoints);
//   } catch (error) {
//     console.error('保存失败：', error);
//     ElMessage.error('Save Failed, please try again');
//   }
//   fullscreenLoading.value = false;
// }

async function saveDetails() {
  fullscreenLoading.value = true;
  try {
    // 校验表单
    const valid = await detailsFormRef.value?.validate().catch(() => false);
    if (!valid) {
      fullscreenLoading.value = false;
      ElMessage.error('The form verification failed, please check your input!');
      return;
    }
    const updateData = {
      id: paperId.value,
      doi: formData.doi || '',
      abstract: formData.abstract,
      keywords: keywords.value, // 使用keywords ref
      graphic_abstract: formData.graphic_abstract,
      video: formData.video,
      slide: formData.slide,
      poster: formData.poster,
      addition_files: formData.addition_files,
    };

    await updateMyPaperDetail(updateData);
    ElMessage.success('Save Successful!');

    // 保存成功后刷新数据
    await refreshPaperData();
  } catch (error) {
    console.error('保存失败：', error);
    ElMessage.error('Save Failed, please try again');
  }
  fullscreenLoading.value = false;
}
async function saveKeyPoint() {
  fullscreenLoading.value = true;
  try {
    // 这里可以添加保存到后端的逻辑
      store.updateIsOpenAccess({
        id: paperId.value,
        key_points: formData.key_points,
      });  
  
      ElMessage.success('Key Points Saved Successfully!');     
  } catch (error) {
    console.error('保存失败：', error);
    ElMessage.error('Save Failed, please try again');
  }
  fullscreenLoading.value = false;
}
// 处理 Abstract 内容变化
function handleAbstractChange(value: string) {
  formData.abstract = value;
  saveDetails();
}

// DOI 的校验已集成到 el-form 的自定义规则 validateDoiRule 中

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

// 获取机构列表 - 按作者顺序合并去重并重新编号
const affiliations = computed(() => {
  if (!myPaperDetailInfo.value?.authors) return [];
  // 按作者的order属性排序
  const sortedAuthors = [...myPaperDetailInfo.value.authors].sort((a, b) => (a.order || 0) - (b.order || 0));
  // 收集所有机构，记录作者ID和原始机构ID
  const allAffiliations: Array<{
    authorId: number;
    originalAffiliationId: number;
    affiliation: {
      id: number;
      name: string;
      department?: string;
      university?: string;
      city?: string;
      state?: string;
      country?: string;
    };
  }> = [];
  sortedAuthors.forEach((author) => {
    if (author.affiliations && author.affiliations.length > 0) {
      author.affiliations.forEach((affiliation) => {
        allAffiliations.push({
          authorId: author.id,
          originalAffiliationId: affiliation.id,
          affiliation: affiliation,
        });
      });
    }
  });
  // 去重：相同原始机构ID只保留第一次出现的
  const uniqueAffiliations = new Map();
  const affiliationList: Array<{
    id: number;
    originalId: number;
    name: string;
    department?: string;
    university?: string;
    city?: string;
    state?: string;
    country?: string;
  }> = [];
  let newId = 1;
  allAffiliations.forEach((item) => {
    if (!uniqueAffiliations.has(item.originalAffiliationId)) {
      const newAffiliation = {
        id: newId++,
        originalId: item.originalAffiliationId,
        name: item.affiliation.name,
        department: item.affiliation.department,
        university: item.affiliation.university,
        city: item.affiliation.city,
        state: item.affiliation.state,
        country: item.affiliation.country,
      };
      uniqueAffiliations.set(item.originalAffiliationId, newAffiliation);
      affiliationList.push(newAffiliation);
    }
  });
  return affiliationList;
});

// 根据机构原始ID获取新的编号
function getAffiliationNumber(originalId: number): number {
  const affiliation = affiliations.value.find((aff) => aff.originalId === originalId);
  return affiliation ? affiliation.id : 0;
}
</script>

<template>
  <div class="background-layer"></div>

  <div class="my-events-page main" v-loading.fullscreen.lock="fullscreenLoading" element-loading-text="Saving">
    <commonHeader />

    <section class="main-content">
      <section class="right-panel">
        <header class="event-header">
          <div class="conference-header">
            <div class="logo" v-if="myPaperDetailInfo?.conference.logo">
              <img :src="getImageUrl(myPaperDetailInfo.conference.logo)" alt="Conference Logo" />
            </div>
            <div class="conference-info">
              <div class="conference-name">{{ myPaperDetailInfo?.conference.abbreviation }}</div>
              <div class="conference-full-name">{{ myPaperDetailInfo?.conference.name }}</div>
            </div>
          </div>
          <div class="meta">
            <div class="title">{{ myPaperDetailInfo?.title }}</div>

            <!-- 渲染论文作者列表以及下标 -->
            <div class="authors">
              <div v-if="myPaperDetailInfo?.authors?.length" class="authors-list">
                <span class="author-name" v-for="(author, authorIndex) in myPaperDetailInfo.authors" :key="authorIndex">
                  {{ author.name
                  }}<template v-if="author?.affiliations?.length"><sup
                      v-for="(affiliation, affiliationsIndex) in author.affiliations" :key="affiliationsIndex">{{
                        getAffiliationNumber(affiliation.id) }}<span
                        v-if="affiliationsIndex < author.affiliations.length - 1">,</span></sup></template><span
                    v-if="authorIndex < myPaperDetailInfo.authors.length - 1">,</span>
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
                  <sup>{{ affiliation.id }}</sup>{{ affiliation.university || affiliation.name }}{{
                    affiliation.department ? ', ' +
                      affiliation.department : '' }}{{ affiliation.city ? ', ' + affiliation.city : ''
                  }}{{ affiliation.state ? ', ' + affiliation.state : '' }}{{ affiliation.country ? ', ' +
                    affiliation.country : ''
                  }}
                </div>
              </div>
              <!-- 当机构列表为空的时候，渲染一个空状态 -->
              <div v-else class="empty-state">
                <div class="empty-text">No affiliation information available</div>
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
            <div class="session-notice">
              <div class="session-header">
                <div class="conference-details">
                  <div class="detail-row">
                    <span class="detail-icon">📅</span>
                    <span class="detail-text">{{ formatRange(myPaperDetailInfo?.conference.start_time,
                      myPaperDetailInfo?.conference.end_time) }}</span>
                  </div>
                  <div class="detail-row">
                    <span class="detail-icon">📍</span>
                    <span class="detail-text">{{ myPaperDetailInfo?.conference.city }}, {{
                      myPaperDetailInfo?.conference.country }}</span>
                  </div>
                  <div class="detail-row">
                    <span class="detail-icon">🏢</span>
                    <span class="detail-text">{{ myPaperDetailInfo?.conference.address }}</span>
                  </div>
                </div>
              </div>
              <div class="session-content">
                <div class="schedule-details" v-if="myPaperDetailInfo && myPaperDetailInfo.session">
                  <div class="schedule-row">
                    <span class="schedule-label">📅 Date And Time:</span>
                    <span class="schedule-value">{{ convertUTCToTimezone(myPaperDetailInfo.session.start_time) }}</span>
                  </div>
                  <div class="schedule-row">
                    <span class="schedule-label">🏢 Room:</span>
                    <span class="schedule-value">{{ myPaperDetailInfo.session.room_info }}</span>
                  </div>
                  <div class="schedule-row">
                    <span class="schedule-label">🎯 Session:</span>
                    <span class="schedule-value">{{ myPaperDetailInfo.session.session_name }}</span>
                  </div>
                  <div class="schedule-row">
                    <span class="schedule-label">📄 Paper ID:</span>
                    <span class="schedule-value">{{ myPaperDetailInfo.paperId }}</span>
                  </div>
                </div>
                <!-- <button class="schedule-action-btn">
                  <span class="btn-icon">📌</span>
                  Add to My Schedule
                </button> -->
              </div>
            </div>
            <div class="dates">
              Date Created:
              {{ convertUTCToTimezone(myPaperDetailInfo?.conference.start_time as string, undefined, `YYYY-MM-DD`) }} ·
              Date Edited:
              {{ convertUTCToTimezone(myPaperDetailInfo?.conference.end_time as string, undefined, `YYYY-MM-DD`) }}
            </div>
          </div>
        </header>
        <!-- detail video Slides Poster Additional Info Full Fils -->
        <div class="tab-container">
          <div class="left-nav">
            <button :class="{ active: activeTab === 'details' }" @click="setActiveTab('details')">Details</button>
            <button :class="{ active: activeTab === 'video' }" @click="setActiveTab('video')">Video</button>
            <button :class="{ active: activeTab === 'Key Point' }" @click="setActiveTab('Key Point')">Key Point</button>
            <button :class="{ active: activeTab === 'slides' }" @click="setActiveTab('slides')">Slides</button>
            <button :class="{ active: activeTab === 'poster' }" @click="setActiveTab('poster')">Poster</button>
            <button :class="{ active: activeTab === 'additional' }" @click="setActiveTab('additional')">Additional
              Info</button>
            <router-link :to="{ name: 'PaperDetail', params: { paperId: paperId } }">
              View Presentation
            </router-link>
            <div class="copyright-note">
              <div class="note-title">⚠️ Note</div>
              <div class="note-content">
                Please do not upload any copyrighted content if you do not own the rights to such content or do not have
                written
                permission from the copyright owners.
              </div>
              <div class="note-content">
                Additionally, please do not include any depictions or other personal data of individuals unless you have
                their
                explicit written permission to do so.
              </div>
            </div>
          </div>
          <!-- 展示区 -->
          <div v-if="activeTab === 'details'" class="tab-content">
            <el-form :model="formData" :rules="detailsRules" ref="detailsFormRef" label-position="top" class="form-grid"
              @submit.prevent>
              <el-form-item label="Digital Object Identifier" prop="doi" class="form-item">
                <el-input v-model="formData.doi" :placeholder="`${myPaperDetailInfo?.doi ?? ''}`" clearable  @change="saveDetails()"/>
              </el-form-item>
              <el-form-item label="Abstract" class="form-item full">
                <latex-content v-model:latex="formData.abstract" :editable="true" :display-mode="true"
                  :placeholder="myPaperDetailInfo?.abstract || 'Click to Edit Abstract'" :rows="6"
                  @change="handleAbstractChange" />
              </el-form-item>
              <el-form-item label="Graphical Abstract" class="form-item">
                <file-upload :tab-key="activeTab" :paper-id="paperId" :paper-detail="paperContent" :limit="1"
                  @refresh="refreshPaperData" :is-show="true" />
              </el-form-item>
              <div class="form-item full"></div>
              <!-- <el-form-item :label="`Keywords (${keywords.length}/${MAX_KEYWORDS})`" prop="keywords"
                class="form-item full">
                <div class="keywords-container">
                  <div class="keywords-input-row">
                    <el-row :gutter="8">
                      <el-col :xs="24" :sm="18">
                        <el-autocomplete v-model="keywordInput" :fetch-suggestions="querySearchAsync"
                          placeholder="please input keywords..." @select="handleSelect" @keyup.enter="addKeyword"
                          @blur="onKeywordBlur" style="width: 100%" />
                      </el-col>
                      <el-col :xs="24" :sm="6">
                        <div class="add-button-container">
                          <el-button @click="() => addKeyword()"
                            :disabled="!keywordInput.trim() || keywords.length >= MAX_KEYWORDS" type="primary"
                            style="width: 100%">Add </el-button>
                        </div>
                      </el-col>
                    </el-row>
                  </div>
                  <div class="keywords-tips">Dragging tags can adjust the keyword order.</div>
                  <div class="keywords-tags" v-if="keywords.length > 0" ref="keywordsContainerRef"
                    @touchmove="handleTouchMove" @touchend="handleTouchEnd" @touchcancel="handleTouchCancel">
                    <el-tag v-for="(keyword, index) in keywords" :key="keyword.id" :draggable="true" :class="{
                      dragging: draggedIndex === index,
                      'drag-over': draggedOverIndex === index,
                    }" closable @close="removeKeyword(index)" :data-drag-index="index"
                      @dragstart="(event: DragEvent) => handleDragStart(event, index)"
                      @dragover="(event: DragEvent) => handleDragOver(event, index)" @dragleave="handleDragLeave"
                      @drop="(event: DragEvent) => handleDrop(event, index)" @dragend="handleDragEnd"
                      @touchstart="(event: TouchEvent) => keywordsContainerRef && handleTouchStart(event, index, keywordsContainerRef)">
                      {{ keyword.name }}
                    </el-tag>
                  </div>
                </div>
              </el-form-item> -->
              <!-- <div class="form-actions"> -->

                <!-- <el-button type="primary" size="large" round :loading="fullscreenLoading" native-type="button"
                  @click="saveDetails()"> Save Details </el-button> -->
                <!-- <save-button @click="saveDetails()" /> -->

              <!-- </div> -->
            </el-form>
          </div>

          <div v-else-if="activeTab === 'video'" class="tab-content">
            <!-- 当视频已存在时显示同意条款复选框 -->
            <div v-if="myPaperDetailInfo?.video" class="consent-section">
              <div class="consent-row">
                <el-switch v-model="formData.video_status" :active-value="1" :inactive-value="2" active-text="release"
                  inactive-text="private" @change="
                    (value: number | boolean | string) => {
                      const status = typeof value === 'number' ? value : value ? 2 : 1;
                      store.updateIsOpenAccess({
                        id: paperId,
                        video_status: status,
                      });
                    }
                  " />
              </div>
            </div>
            <!-- 总是显示上传组件 -->
            <div class="video-upload">
              <file-upload :accept="getVideoFormats()" :tab-key="activeTab" :paper-id="paperId"
                :paper-detail="paperContent" :limit="1" @refresh="refreshPaperData" :is-show="true" />
            </div>
          </div>

          <div v-else-if="activeTab === 'slides'" class="tab-content">
            <!-- 当幻灯片已存在时显示可见性控制滑块 -->
            <div v-if="myPaperDetailInfo?.slide" class="consent-section">
              <div class="consent-row">
                <el-switch v-model="formData.slide_status" :active-value="1" :inactive-value="2" active-text="release"
                  inactive-text="private" @change="
                    (value: number | boolean | string) => {
                      const status = typeof value === 'number' ? value : value ? 2 : 1;
                      store.updateIsOpenAccess({
                        id: paperId,
                        slide_status: status,
                      });
                    }
                  " />
              </div>
            </div>
            <file-upload :accept="[`.pdf`, ...getImageFormats()]" :tab-key="activeTab" :paper-id="paperId"
              :paper-detail="paperContent" :limit="1" @refresh="refreshPaperData" :is-show="true" />
          </div>

          <div v-else-if="activeTab === 'poster'" class="tab-content">
            <!-- 当海报已存在时显示可见性控制滑块 -->
            <div v-if="myPaperDetailInfo?.poster" class="consent-section">
              <div class="consent-row">
                <el-switch v-model="formData.poster_status" :active-value="1" :inactive-value="2" active-text="release"
                  inactive-text="private" @change="
                    (value: number | boolean | string) => {
                      const status = typeof value === 'number' ? value : value ? 2 : 1;
                      store.updateIsOpenAccess({
                        id: paperId,
                        poster_status: status,
                      });
                    }
                  " />
              </div>
            </div>
            <file-upload :accept="`.pdf`" :tab-key="activeTab" :paper-id="paperId" :paper-detail="paperContent"
              :limit="1" @refresh="refreshPaperData" :is-show="true" />
          </div>

          <div v-else-if="activeTab === 'additional'" class="tab-content">
            <file-upload
              :accept="[`.tar`, `.gz`, `.docx`, `.txt`, `.zip`, `.rar`, `.pdf`, `.doc`, ...getImageFormats()]"
              :tab-key="activeTab" :paper-id="paperId" :paper-detail="paperContent" :limit="-1"
              @refresh="refreshPaperData" :is-show="true" />
          </div>
          <div v-else-if="activeTab === 'Key Point'" class="tab-content">

            <div class="key-takeaways-container">
              <div class="key-takeaways-header">
                <h2>Key Takeaways</h2>
                <p>Please provide the key points of your paper</p>
              </div>

              <div class="key-points-list">
                <div v-for="point in keyPoints" :key="point.id" class="key-point-item">
                  <h3>{{ point.title }}</h3>
                  <input type="text" class="key-point-input" v-model="formData.key_points[point.id - 1]"
                    :placeholder="formData.key_points[point.id - 1]">
                </div>
              </div>
              <div class="save-button-container">
                <el-button class="save-button" @click="saveKeyPoint()">Save</el-button>
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
              <a :href="currentPdfUrl" :download="getCurrentFileName()" class="download-btn"> Download PDF
              </a>
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
@use '@/styles/utils/mixins' as *;

// 统一所有 form-item label 的样式
:deep(.el-form-item__label) {
  font-size: 22px;
  font-weight: 600;
  color: #334155;
  line-height: 1.5;

  @include screen-mobile {
    font-size: 13px;
  }
}

// Abstract 内容字体大小
:deep(.latex-content) {
  font-size: 16px;
  line-height: 1.8;

  @include screen-mobile {
    font-size: 14px;
  }
}

.keywords-tips {
  margin-top: 8px;
  margin-bottom: 8px;
  padding: 6px 0;
  color: #909399;
  font-size: 13px;
  line-height: 1.5;

  @include screen-mobile {
    font-size: 12px;
    text-align: left;
  }
}

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

// 导航按钮样式 - 由 _my_events.scss 统一管理
// 这里保留基础样式作为后备

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
  padding: 0;
  background-color: transparent;
  border: none;
  display: block;
  width: 100%;
  margin-bottom: 12px;

  @include screen-mobile {
    width: 100%;
  }
}

.consent-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  width: 100%;

  @include screen-mobile {
    flex-direction: row;
    justify-content: space-between;
  }

  span {
    font-size: 14px;
    color: #333;

    @include screen-mobile {
      font-size: 13px;
    }
  }
}

.checkbox {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-size: 14px;
  color: #333;
  padding: 8px 12px;
  background-color: transparent;
  border-radius: 6px;
  transition: background-color 0.2s ease;
  width: auto;

  @include screen-mobile {
    padding: 8px 0;
    width: 100%;
  }

  &:hover {
    background-color: rgba(99, 102, 241, 0.05);
  }
}

.checkbox input[type='checkbox'] {
  width: 18px;
  height: 18px;
  cursor: pointer;
  flex-shrink: 0;
}

.keywords-container {
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
}

.keywords-input-row {
  display: flex;
  gap: 8px;
  align-items: center;
  width: 100%;

  :deep(.el-row) {
    width: 100%;
  }

  :deep(.el-col) {
    @include screen-mobile {
      margin-bottom: 8px;
    }
  }
}

.keywords-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;

  // 改善触摸拖动体验
  touch-action: pan-y; // 允许垂直滚动，但会处理水平拖动
  -webkit-overflow-scrolling: touch;

  // 确保触摸时标签有足够的点击区域
  :deep(.el-tag) {
    // 改善触摸交互
    touch-action: pan-y; // 允许垂直滚动，但会处理水平拖动
    user-select: none; // 防止文本选择干扰拖动
    -webkit-user-select: none;

    // 关闭按钮保持正常的触摸行为，允许点击
    .el-tag__close {
      touch-action: auto !important;
      pointer-events: auto;
    }
  }
}

.add-button-container {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 8px;
}

.max-keywords-warning {
  color: #f56c6c;
  font-size: 12px;
  line-height: 1.2;
}

.dragging {
  opacity: 0.5;
  transform: scale(0.95);
}

.drag-over {
  border: 2px dashed #409eff !important;
  background-color: #f0f9ff !important;
}

// User Profile Styles
.profiles {
  margin-top: 24px;
  padding: 16px;
  background-color: #f7f7f7;
  border-radius: 8px;
}

.profile-item {
  display: flex;
  align-items: center;
  gap: 16px;
}

.profile-avatar {
  width: 80px;
  height: 80px;
  border-radius: 40px;
  object-fit: cover;
  border: 2px solid #ddd;
}

.profile-info {
  display: flex;
  flex-direction: column;
}

.profile-info h4 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #333;
}

.profile-info p {
  margin: 4px 0 0;
  font-size: 14px;
  color: #666;
}
</style>
