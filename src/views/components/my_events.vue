<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import { ElMessage } from 'element-plus';
import type { FormInstance, FormRules } from 'element-plus';
import commonHeader from '@/layout/common-header.vue';
import { useConferenceStore } from '@/stores/conference';
import { convertUTCToTimezone, formatRange } from '@/utils/date';
import { getImageUrl } from '@/utils';
import { updateMyPaperDetail, searchKeywords as searchKeywordsAPI } from '@/services/api';
import FileUpload from '@/components/file-upload.vue';
import type { TabKey } from '@/types/conference.ts';
import { getFileTypeByTabKey } from '@/utils/conference.ts';
import { useDragSort } from '@/hooks/useDragSort';
import { getImageFormats, getVideoFormats } from '@/utils/file';
import SaveButton from '@/components/save-button.vue';
import LatexContent from '@/components/latex-content.vue';

const store = useConferenceStore();
const route = useRoute();
const paperId = computed(() => Number(route.params.paperId));
const activeTab = ref<TabKey>('details');
const myPaperDetailInfo = computed(() => store.myPaperDetail);

// 静态常量
const MAX_KEYWORDS = 6;
onMounted(async () => {
  await store.getMyPaper(paperId.value);
});
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
});
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

// 使用拖拽排序hook
const { draggedIndex, draggedOverIndex, handleDragStart, handleDragOver, handleDragLeave, handleDrop, handleDragEnd, handleTouchStart, handleTouchMove, handleTouchEnd, handleTouchCancel } =
  useDragSort(keywords);

// 关键词容器引用，用于触摸拖动
const keywordsContainerRef = ref<HTMLElement | null>(null);

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
  fileUrl: myPaperDetailInfo.value?.[getFileTypeByTabKey(activeTab.value)],
}));

function setActiveTab(tab: TabKey) {
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
      .then((response) => {
        // 从响应中提取items数组，并获取关键词名称
        const items = response.data?.items || [];
        const suggestions = items
          .map((item: { name?: string; keyword?: string; [key: string]: unknown }) => ({
            value: item.name || item.keyword || String(item),
          }))
          .filter((item: { value: string }) => item.value);

        cb(suggestions);
      })
      .catch((error) => {
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

  // 检查是否已达到最大数量限制
  if (keywords.value.length >= MAX_KEYWORDS) {
    ElMessage.warning(`You can add up to ${MAX_KEYWORDS} keywords.`);
    detailsFormRef.value?.validateField('keywords');
    return;
  }

  if (keywordToAdd && !keywords.value.some((k) => k.name === keywordToAdd)) {
    const newKeyword = {
      name: keywordToAdd,
      id: keywords.value.length + 1,
      order: keywords.value.length + 1,
    };
    keywords.value.push(newKeyword);
    keywordInput.value = '';
  }
};

// 删除关键词
const removeKeyword = (index: number) => {
  keywords.value.splice(index, 1);
  // 重新分配order
  keywords.value.forEach((keyword, idx) => {
    keyword.order = idx + 1;
  });
};

function onKeywordBlur() {
  if (keywords.value.length >= MAX_KEYWORDS) {
    detailsFormRef.value?.validateField('keywords');
    ElMessage.warning(`You can add up to ${MAX_KEYWORDS} keywords.`);
  }
}

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
    ElMessage.success('保存成功！');

    // 保存成功后刷新数据
    await refreshPaperData();
  } catch (error) {
    console.error('保存失败：', error);
    ElMessage.error('保存失败，请重试');
  }
  fullscreenLoading.value = false;
}

// 处理 Abstract 内容变化
function handleAbstractChange(value: string) {
  formData.abstract = value;
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

            <!-- 渲染论文作者列表以及下标 -->
            <div class="authors">
              <div v-if="myPaperDetailInfo?.authors?.length" class="authors-list">
                <span class="author-name" v-for="(author, authorIndex) in myPaperDetailInfo.authors" :key="authorIndex">
                  {{ author.name
                  }}<template v-if="author?.affiliations?.length"
                    ><sup v-for="(affiliation, affiliationsIndex) in author.affiliations" :key="affiliationsIndex">{{ getAffiliationNumber(affiliation.id) }}</sup></template
                  ><span v-if="authorIndex < myPaperDetailInfo.authors.length - 1">, </span>
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
                  <sup>{{ affiliation.id }}</sup
                  >{{ affiliation.university || affiliation.name }}{{ affiliation.department ? ', ' + affiliation.department : '' }}{{ affiliation.city ? ', ' + affiliation.city : ''
                  }}{{ affiliation.state ? ', ' + affiliation.state : '' }}{{ affiliation.country ? ', ' + affiliation.country : '' }}
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
              {{ convertUTCToTimezone(myPaperDetailInfo?.conference.start_time as string, undefined, `YYYY-MM-DD`) }} · Date Edited:
              {{ convertUTCToTimezone(myPaperDetailInfo?.conference.end_time as string, undefined, `YYYY-MM-DD`) }}
            </div>
          </div>
        </header>
        <!-- detail video Slides Poster Additional Info Full Fils -->
        <div class="left-nav">
          <button :class="{ active: activeTab === 'details' }" @click="setActiveTab('details')">Details</button>
          <button :class="{ active: activeTab === 'video' }" @click="setActiveTab('video')">Video</button>
          <button :class="{ active: activeTab === 'slides' }" @click="setActiveTab('slides')">Slides</button>
          <button :class="{ active: activeTab === 'poster' }" @click="setActiveTab('poster')">Poster</button>
          <button :class="{ active: activeTab === 'additional' }" @click="setActiveTab('additional')">Additional Info</button>
          <button :class="{ active: activeTab === 'fulltext' }" @click="setActiveTab('fulltext')">Full Files</button>
        </div>
        <!-- 展示区 -->
        <div v-if="activeTab === 'details'" class="tab-content">
          <el-form :model="formData" :rules="detailsRules" ref="detailsFormRef" label-position="top" class="form-grid" @submit.prevent>
            <el-form-item label="Digital Object Identifier" prop="doi" class="form-item">
              <el-input v-model="formData.doi" :placeholder="`${myPaperDetailInfo?.doi ?? ''}`" clearable />
            </el-form-item>
            <el-form-item label="Abstract" class="form-item full">
              <latex-content
                v-model:latex="formData.abstract"
                :editable="true"
                :display-mode="true"
                :placeholder="myPaperDetailInfo?.abstract || '点击编辑 Abstract'"
                :rows="6"
                @change="handleAbstractChange"
              />
            </el-form-item>
            <el-form-item label="Graphical Abstract" class="form-item">
              <file-upload :tab-key="activeTab" :paper-id="paperId" :paper-detail="paperContent" :limit="1" @refresh="refreshPaperData" :is-show="true" />
            </el-form-item>
            <el-form-item :label="`Keywords (${keywords.length}/${MAX_KEYWORDS})`" prop="keywords" class="form-item full">
              <div class="keywords-container">
                <div class="keywords-input-row">
                  <el-row>
                    <el-col :span="18">
                      <el-autocomplete
                        v-model="keywordInput"
                        :fetch-suggestions="querySearchAsync"
                        placeholder="please input keywords..."
                        @select="handleSelect"
                        @keyup.enter="addKeyword"
                        @blur="onKeywordBlur"
                      />
                    </el-col>
                    <el-col :span="6">
                      <div class="add-button-container">
                        <el-button @click="() => addKeyword()" :disabled="!keywordInput.trim() || keywords.length >= MAX_KEYWORDS" type="primary">添加 </el-button>
                      </div>
                    </el-col>
                  </el-row>
                </div>
                <div class="keywords-tips">Dragging tags can adjust the keyword order.</div>
                <div
                  class="keywords-tags"
                  v-if="keywords.length > 0"
                  ref="keywordsContainerRef"
                  @touchmove="handleTouchMove"
                  @touchend="handleTouchEnd"
                  @touchcancel="handleTouchCancel"
                >
                  <el-tag
                    v-for="(keyword, index) in keywords"
                    :key="keyword.id"
                    :draggable="true"
                    :class="{
                      dragging: draggedIndex === index,
                      'drag-over': draggedOverIndex === index,
                    }"
                    closable
                    @close="removeKeyword(index)"
                    :data-drag-index="index"
                    @dragstart="(event: DragEvent) => handleDragStart(event, index)"
                    @dragover="(event: DragEvent) => handleDragOver(event, index)"
                    @dragleave="handleDragLeave"
                    @drop="(event: DragEvent) => handleDrop(event, index)"
                    @dragend="handleDragEnd"
                    @touchstart="(event: TouchEvent) => keywordsContainerRef && handleTouchStart(event, index, keywordsContainerRef)"
                  >
                    {{ keyword.name }}
                  </el-tag>
                </div>
              </div>
            </el-form-item>
            <div class="form-actions">
              <el-form-item>
                <!-- <el-button type="primary" size="large" round :loading="fullscreenLoading" native-type="button" @click="saveDetails()"> Save Details </el-button> -->
                <save-button @click="saveDetails()" />
              </el-form-item>
            </div>
          </el-form>
        </div>

        <div v-else-if="activeTab === 'video'" class="tab-content">
          <!-- 当视频已存在时显示同意条款复选框 -->
          <div v-if="myPaperDetailInfo?.video" class="consent-section">
            <label class="checkbox">
              <input
                type="checkbox"
                :checked="formData.video_status === 2"
                @change="
                  (event: Event) => {
                    const target = event.target as HTMLInputElement;
                    if (target) {
                      formData.video_status = target.checked ? 1 : 2;
                      store.updateIsOpenAccess({
                        id: paperId,
                        video_status: formData.video_status,
                      });
                    }
                  }
                "
              />
              <span>I understand and agree to keep the video private.</span>
            </label>
          </div>
          <!-- 总是显示上传组件 -->
          <div class="video-upload">
            <file-upload :accept="getVideoFormats()" :tab-key="activeTab" :paper-id="paperId" :paper-detail="paperContent" :limit="1" @refresh="refreshPaperData" :is-show="true" />
          </div>
        </div>

        <div v-else-if="activeTab === 'slides'" class="tab-content">
          <!-- 当幻灯片已存在时显示可见性控制滑块 -->
          <div v-if="myPaperDetailInfo?.slide" class="consent-section">
            <div class="consent-row">
              <el-switch
                v-model="formData.slide_status"
                :active-value="1"
                :inactive-value="2"
                active-text="release"
                inactive-text="private"
                @change="
                  (value: number | boolean | string) => {
                    const status = typeof value === 'number' ? value : value ? 2 : 1;
                    store.updateIsOpenAccess({
                      id: paperId,
                      slide_status: status,
                    });
                  }
                "
              />
            </div>
          </div>
          <file-upload :accept="[`.pdf`, ...getImageFormats()]" :tab-key="activeTab" :paper-id="paperId" :paper-detail="paperContent" :limit="1" @refresh="refreshPaperData" :is-show="true" />
        </div>

        <div v-else-if="activeTab === 'poster'" class="tab-content">
          <!-- 当海报已存在时显示可见性控制滑块 -->
          <div v-if="myPaperDetailInfo?.poster" class="consent-section">
            <div class="consent-row">
              <el-switch
                v-model="formData.poster_status"
                :active-value="1"
                :inactive-value="2"
                active-text="release"
                inactive-text="private"
                @change="
                  (value: number | boolean | string) => {
                    const status = typeof value === 'number' ? value : value ? 2 : 1;
                    store.updateIsOpenAccess({
                      id: paperId,
                      poster_status: status,
                    });
                  }
                "
              />
            </div>
          </div>
          <file-upload :accept="`.pdf`" :tab-key="activeTab" :paper-id="paperId" :paper-detail="paperContent" :limit="1" @refresh="refreshPaperData" :is-show="true" />
        </div>

        <div v-else-if="activeTab === 'additional'" class="tab-content">
          <file-upload
            :accept="[`.tar`, `.gz`, `.docx`, `.txt`, `.zip`, `.rar`, `.pdf`, `.doc`, ...getImageFormats()]"
            :tab-key="activeTab"
            :paper-id="paperId"
            :paper-detail="paperContent"
            :limit="-1"
            @refresh="refreshPaperData"
            :is-show="true"
          />
        </div>

        <div v-else-if="activeTab === 'fulltext'" class="tab-content">
          <div class="fulltext-section">
            <div class="checklist">
              <div class="item">
                <div class="label">Graphical Abstract</div>
                <div class="status" :class="{ ok: !!formData.graphic_abstract.length }">
                  {{ formData.graphic_abstract.length ? 'Uploaded' : 'Missing' }}
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
                <div class="status" :class="{ ok: !!formData.addition_files.length }">
                  {{ formData.addition_files.length ? 'Uploaded' : 'Missing' }}
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
.keywords-tips {
  margin: 10px 0;
  padding: 8px 12px;
  background-color: #f0f9ff;
  border-left: 4px solid #409eff;
  color: #606266;
  font-size: 12px;
  border-radius: 4px;
  position: absolute;
  top: -25px;
  left: 290px;
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
  display: inline-block;
  width: auto;
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
}

.keywords-input-row {
  display: flex;
  gap: 8px;
  align-items: center;
}

.keywords-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
  margin-top: 10px;
  // 改善触摸拖动体验
  touch-action: pan-y; // 允许垂直滚动，但会处理水平拖动
  -webkit-overflow-scrolling: touch;

  // 确保触摸时标签有足够的点击区域
  :deep(.el-tag) {
    // 改善触摸交互
    touch-action: none; // 禁用默认触摸行为，让我们完全控制
    user-select: none; // 防止文本选择干扰拖动
    -webkit-user-select: none;
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
</style>
