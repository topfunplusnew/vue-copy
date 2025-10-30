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
  graphic_abstract: '',
  video: '',
  slide: '',
  poster: '',
  addition_files: '',
  keywords: [] as Array<{ name: string; id: number; order: number }>,
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
        if ((keywords.value?.length || 0) >= MAX_KEYWORDS) {
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
const { draggedIndex, draggedOverIndex, handleDragStart, handleDragOver, handleDragLeave, handleDrop, handleDragEnd } = useDragSort(keywords);

// 初始化表单数据
const initializeFormData = () => {
  if (myPaperDetailInfo.value) {
    formData.doi = String(myPaperDetailInfo.value.doi ?? '');
    formData.abstract = myPaperDetailInfo.value.abstract ?? '';
    // 后端返回的是对象数组，按order排序
    keywords.value = myPaperDetailInfo.value.keywords?.sort((a, b) => (a.order || 0) - (b.order || 0)) || [];
    formData.keywords = keywords.value;
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
              <el-input v-model="formData.abstract" type="textarea" :rows="6" :placeholder="myPaperDetailInfo?.abstract" resize="vertical" />
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
                <div class="keywords-tags" v-if="keywords.length > 0">
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
                    @dragstart="(event: DragEvent) => handleDragStart(event, index)"
                    @dragover="(event: DragEvent) => handleDragOver(event, index)"
                    @dragleave="handleDragLeave"
                    @drop="(event: DragEvent) => handleDrop(event, index)"
                    @dragend="handleDragEnd"
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
          <div class="consent-section">
            <label class="checkbox">
              <input type="checkbox" v-model="videoConsent" />
              <span>I have read, understood, and accept the video release terms.</span>
            </label>
          </div>
          <div v-if="videoConsent" class="video-upload">
            <file-upload :accept="getVideoFormats()" :tab-key="activeTab" :paper-id="paperId" :paper-detail="paperContent" :limit="1" @refresh="refreshPaperData" :is-show="true" />
          </div>
        </div>

        <div v-else-if="activeTab === 'slides'" class="tab-content">
          <file-upload :accept="[`.pdf`, ...getImageFormats()]" :tab-key="activeTab" :paper-id="paperId" :paper-detail="paperContent" :limit="1" @refresh="refreshPaperData" :is-show="true" />
        </div>

        <div v-else-if="activeTab === 'poster'" class="tab-content">
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

// 导航按钮样式
.left-nav {
  display: flex;
  gap: 12px;
  margin: 24px 0;
  padding: 8px;
  background-color: #f5f7fa;
  border-radius: 8px;
  flex-wrap: wrap;
}

.left-nav button {
  padding: 10px 20px;
  border: 2px solid transparent;
  background-color: transparent;
  color: #606266;
  font-size: 14px;
  font-weight: 500;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s ease;
  outline: none;
}

.left-nav button:hover {
  color: #409eff;
  background-color: #ecf5ff;
  border-color: #d9ecff;
}

// 激活状态的增强样式
.left-nav button.active {
  color: #ffffff;
  background-color: #409eff;
  border-color: #409eff;
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.3);
  font-weight: 600;
  transform: translateY(-1px);
}

.left-nav button.active:hover {
  color: #ffffff;
  background-color: #66b1ff;
  border-color: #66b1ff;
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.4);
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

.checkbox input[type='checkbox'] {
  width: 16px;
  height: 16px;
  cursor: pointer;
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
