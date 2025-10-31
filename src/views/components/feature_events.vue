FileUpload
<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import commonHeader from '@/layout/common-header.vue';
import { useConferenceStore } from '@/stores/conference';
import { formatRange } from '@/utils/date';
import { getImageUrl } from '@/utils';
import type { TabKey } from '@/types/conference.ts';
import { getFileTypeByTabKey } from '@/utils/conference.ts';
import FileUpload from '@/components/file-upload.vue';
import type { IpaperDetail } from '@/types/paper';
import { addFavorite } from '@/services/conference';
import type { IAddFavoriteRequest } from '@/services/conference/type.ts';

type SelectedPaperLite = { id: number; title?: string };
type AffRaw = {
  id: number;
  name?: string;
  department?: string;
  university?: string;
  city?: string;
  state?: string;
  country?: string;
};
type AffiliationLite = {
  id: number;
  originalId: number;
  name?: string;
  department?: string;
  university?: string;
  city?: string;
  state?: string;
  country?: string;
};
type PaperDetailLike = { fileUrl?: string | string[] };
// const router = useRouter();
const conferenceStore = useConferenceStore();
const props = defineProps({
  conferenceId: {
    type: String,
    required: true,
  },
});
onMounted(() => {
  conferenceStore.getConferencesList();
});

watch(
  () => props.conferenceId,
  (val, old) => {
    if (val !== old) {
      conferenceStore.getConferenceDetails(val);
      conferenceStore.getConferencePaper(val);
    }
  },
  { immediate: true },
);

const featuredConferences = computed(() => conferenceStore.conferenceList);
const conferenceDetail = computed(() => conferenceStore.conferenceDetail);

const selectedConference = computed(() => conferenceDetail.value);

const searchQuery = ref(''); //搜索框绑定的输入值
const selectedPaper = ref<SelectedPaperLite | null>(null); //当前选中的论文对象
const showPaperModal = ref(false); //控制论文详情弹窗是否显示
const activeTab = ref<TabKey>('details'); //当前激活的 Tab
// const currentPage = ref(1);//当前分页页码
// const papersPerPage = ref(20);//每页显示论文数量（默认 12）

// const filteredPapers = selectedConference.value?.papers

const conferencePapers = computed(() => conferenceStore.conferencePaper);

// watch(searchQuery, () => {
//   currentPage.value = 1;
// });

const conferenceStats = computed(() => ({
  //统计会议数量和类别
  totalConferences: featuredConferences.value?.length,
  categories: [...new Set(featuredConferences.value?.map((c) => c.conference_type))],
}));

//点击请求新会议
// async function selectConference(id: number) {

//   router.push({ name: 'FeaturedEvents', params: { conferenceId: id } })
//   await conferenceStore.getConferenceDetails(id);
//   conferenceDetail.value = conferenceStore.conferenceDetail;

// }
const addFavorLoading = ref<boolean>(false);

// 添加至喜欢 发送邮件
async function registerInterest(conferenceId: number) {
  const data: IAddFavoriteRequest = {
    conference_id: conferenceId,
  };
  addFavorLoading.value = true;
  ElMessage.info('Adding to Favourite...');
  const res = await addFavorite(data);
  console.log(res);
  addFavorLoading.value = false;
  ElMessage.success('Interest registered! You will receive updates about this conference.');
}
const papershow = ref<boolean>(false);
const paperDetail = ref<IpaperDetail>({} as IpaperDetail);
function openPaperModal(paper: SelectedPaperLite) {
  conferenceStore.getPaperDetailAll(String(paper.id)).then(res => {
    papershow.value = true;
    selectedPaper.value = paper;
    showPaperModal.value = true;
    activeTab.value = 'details';
  }).catch(err => {
    showPaperModal.value = false;
    console.error('打开论文详情弹窗失败', err);
  });
}
watch(
  () => conferenceStore.paperDetail,
  (newVal) => {
    paperDetail.value = newVal
  },
  { immediate: true } // 页面加载时同步一次
)

// const paperDetail = computed(() => conferenceStore.paperDetail);

function closePaperModal() {
  showPaperModal.value = false;
  selectedPaper.value = null;
}

function switchTab(tab: TabKey) {
  activeTab.value = tab;
}

// function getAuthorAffiliations(authorIndex: number, paper: IPaper): string {
//   // Simple mapping: first author -> institution 1, second author -> institution 2, etc.
//   // In a real application, this would be more complex based on actual author-institution relationships
//   const institutionIndex = authorIndex % paper.institutions.length;
//   return (institutionIndex + 1).toString();
// }

const paperContent = computed<PaperDetailLike>(() => {
  // 当activeTab为'additional'时，直接使用addition_files
  if (activeTab.value === 'additional') {
    return {
      fileUrl: paperDetail.value?.addition_files || [],
    };
  }

  // 其他标签页保持原有逻辑
  const raw = paperDetail.value?.[getFileTypeByTabKey(activeTab.value)] as unknown;
  const fileUrl = Array.isArray(raw) ? undefined : (raw as string | undefined);
  return { fileUrl };
});

// 获取机构列表 - 按作者顺序合并去重并重新编号
const affiliations = computed((): AffiliationLite[] => {
  if (!paperDetail.value?.authors) return [];
  const sortedAuthors = [...paperDetail.value.authors];
  const allAffiliations: { authorId: number; originalAffiliationId: number; affiliation: AffRaw }[] = [];
  sortedAuthors.forEach((author) => {
    if (author.affiliations && author.affiliations.length > 0) {
      author.affiliations.forEach((affiliation) => {
        allAffiliations.push({
          authorId: author.id,
          originalAffiliationId: affiliation.id,
          affiliation: affiliation as AffRaw,
        });
      });
    }
  });
  const uniqueAffiliations = new Map();
  const affiliationList: AffiliationLite[] = [];
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

function getAffiliationNumber(originalId: number) {
  const aff = affiliations.value.find((a) => a.originalId === originalId);
  return aff ? aff.id : 0;
}

function seachPaper() {
  conferenceStore.getConferencePaper(props.conferenceId, searchQuery.value);
}

// 格式化字符串，使第一个字母大写，其他字母小写
function formatFirstLetterUppercase(str: string): string {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}
</script>

<style scoped>
.access-restricted {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px;
  background-color: #f5f7fa;
  border-radius: 8px;
  border: 1px solid #ebeef5;
  color: #909399;
}

.access-restricted p {
  margin: 0;
  font-size: 16px;
}

/* 禁用状态的video按钮样式 */
.tab-btn:disabled {
  position: relative;
  cursor: not-allowed;
  opacity: 0.6;
  background-color: #f5f7fa;
  border: 1px solid #ebeef5;
}


.tab-btn:disabled:before {
  content: '🔒';
  margin-right: 4px;
}

.tab-btn:disabled:hover {
  background-color: #f5f7fa;
  cursor: not-allowed;
}

/* 模态框头部样式 - 使标题居中 */
.modal-header {
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
  height: 60px;
  background-color: #fff;
  border-bottom: 1px solid #eaeaea;
  padding: 0 20px;
}

/* 确保关闭按钮样式清晰可见 */
.modal-header .close-btn {
  position: absolute;
  right: 20px;
  top: 50%;
  transform: translateY(-50%);
  width: 30px;
  height: 30px;
  border: none;
  background-color: transparent;
  font-size: 24px;
  color: #666;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2;
  /* 确保关闭按钮在标题上方 */
}

.modal-header h2 {
  margin: 0;
  text-align: center;
  color: #333;
  font-size: 18px;
  font-weight: 600;
  padding: 10px 40px;
  /* 为右侧的关闭按钮留出空间 */
  word-wrap: break-word;
  max-width: 100%;
  z-index: 1;
  /* 确保标题在关闭按钮下方但仍然可见 */
}

.modal-header .close-btn {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
}
</style>

<template>
  <div class="background-layer"></div>

  <div class="featured-events-page main">
    <commonHeader />

    <section class="main-content">
      <!-- Conference Selector -->
      <aside class="conference-selector">
        <div class="selector-header">
          <h2>Featured Conferences</h2>
          <div class="stats">
            <span class="stat-item">{{ conferenceStats.totalConferences }} Conferences</span>
            <span class="stat-item">{{ conferenceStats.categories.length }} Categories</span>
          </div>
        </div>

        <div class="conference-list">
          <router-link v-for="conf in featuredConferences" :key="conf.id"
            :class="['conference-card', { active: selectedConference?.id === conf.id }]" :to="{
              name: 'FeaturedEvents',
              params: { conferenceId: conf.id },
            }">
            <div class="card-logo">
              <img :src="getImageUrl(conf.logo)" :alt="conf.abbreviation" />
            </div>
            <div class="card-info">
              <div class="card-name">{{ conf.abbreviation }}</div>
              <div class="card-category">{{ conf.conference_type }}</div>
              <div class="card-date">{{ formatRange(conf.start_time, conf.end_time) }}</div>
            </div>
          </router-link>
        </div>
      </aside>

      <!-- Conference Details -->
      <section class="conference-details">
        <header class="event-header">
          <div class="conference-header">
            <div class="logo">
              <img :src="getImageUrl(selectedConference?.logo)" :alt="selectedConference?.abbreviation" />
            </div>
            <div class="conference-info">
              <div class="conference-name">{{ selectedConference?.name }}</div>
              <div class="conference-full-name">{{ selectedConference?.abbreviation }}</div>

              <div class="conference-details">
                <div class="detail-row">
                  <span class="detail-icon">📅</span>
                  <span class="detail-text">{{ formatRange(selectedConference?.start_time, selectedConference?.end_time)
                    }}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-icon">📍</span>
                  <span class="detail-text">{{ selectedConference?.city }}, {{ selectedConference?.country }}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-icon">🏢</span>
                  <span class="detail-text">{{ selectedConference?.address }}</span>
                </div>
              </div>
            </div>
          </div>

          <div class="conference-links">
            <a :href="selectedConference?.website" target="_blank" class="conf-link"> <span class="link-icon">🌐</span>
              Official Website </a>
            <a :href="selectedConference?.committee_website" target="_blank" class="conf-link"> <span
                class="link-icon">👥</span> Committee </a>
            <a :href="selectedConference?.registration_website" target="_blank" class="conf-link"> <span
                class="link-icon">📝</span> Registration </a>
          </div>

          <!-- Conference Description -->
          <div class="conference-description">
            <h3>About This Conference</h3>
            <p>{{ selectedConference?.description }}</p>
          </div>

          <!-- Research Topics -->
          <div class="research-topics">
            <h3>Key Research Topics</h3>
            <div class="topic-tags">
              <span v-for="(topic, index) in selectedConference?.keywords" :key="index" class="topic-tag">
                {{ index === 0 ? formatFirstLetterUppercase(topic.name) : topic.name }}
              </span>
            </div>
          </div>

          <!-- Important Dates -->
          <div class="important-dates">
            <h3>Important Dates</h3>
            <div class="dates-grid">
              <div class="date-item">
                <div class="date-icon">📝</div>
                <div class="date-info">
                  <div class="date-label">Submission Deadline</div>
                  <div class="date-value">{{ formatRange(selectedConference?.submission_deadline) }}</div>
                </div>
              </div>
              <div class="date-item">
                <div class="date-icon">📧</div>
                <div class="date-info">
                  <div class="date-label">Notification Date</div>
                  <div class="date-value">{{ formatRange(selectedConference?.notification_date) }}</div>
                </div>
              </div>
              <div class="date-item">
                <div class="date-icon">🎯</div>
                <div class="date-info">
                  <div class="date-label">Conference Dates</div>
                  <div class="date-value">{{ formatRange(selectedConference?.start_time, selectedConference?.end_time)
                    }}</div>
                </div>
              </div>
            </div>
          </div>

          <!-- Action Buttons -->
          <div class="action-buttons">
            <el-button :loading="addFavorLoading" @click="registerInterest(selectedConference!.id)"
              class="interest-btn"><span class="btn-icon">💡</span> Add to Favourite </el-button>
            <a :href="selectedConference?.website" target="_blank" class="visit-btn"> <span class="btn-icon">🔗</span>
              Visit Website </a>
            <a :href="selectedConference?.registration_website" target="_blank" class="register-btn"> <span
                class="btn-icon">📝</span> Register Now </a>
          </div>
        </header>

        <!-- Papers Section -->
        <div class="papers-section">
          <div class="papers-header">
            <h3>Conference Papers</h3>
            <div class="search-container">
              <input v-model="searchQuery" type="text"
                placeholder="Search papers by title, author, institution, or keywords..." class="paper-search-input" />
              <el-button icon="Search" class="search-btn" @click="seachPaper()" />
            </div>
          </div>

          <div class="papers-list">
            <div v-for="paper in conferencePapers" :key="paper.id" class="paper-item" @click="openPaperModal(paper)">
              <div class="paper-title">{{ paper.paper_title }}</div>
              <template v-for="(authors, index) in paper.paper_authors" :key="authors.id">
                <span class="paper-authors"><span class="author">{{ authors.name }}</span>
                  <span v-if="index < paper.paper_authors.length - 1">,</span>
                </span>
                <!-- <div class="paper-institutions">{{ authors.affiliation }}</div> -->
              </template>
            </div>

            <div v-if="conferencePapers?.length === 0" class="no-papers">
              <p>No papers found matching your search criteria.</p>
            </div>
          </div>
        </div>
      </section>
    </section>

    <!-- Paper Detail Modal -->
    <div v-if="showPaperModal" class="paper-modal-overlay" @click="closePaperModal">
      <div class="paper-modal" @click.stop>
        <div class="modal-header">
          <h2>{{ paperDetail?.title || selectedPaper?.title || '论文详情' }}</h2>
          <button class="close-btn" @click="closePaperModal">×</button>
        </div>

        <div class="modal-content">
          <div class="tab-container">
            <div class="tab-navigation">
              <button :class="['tab-btn', { active: activeTab === 'details' }]"
                @click="switchTab('details')">Details</button>
              <button :class="['tab-btn', { active: activeTab === 'video' }]" @click="switchTab('video')"
                :disabled="!paperDetail?.video">
                Video
              </button>
              <button :class="['tab-btn', { active: activeTab === 'slides', disabled: !paperDetail?.slide }]"
                @click="paperDetail?.slide && switchTab('slides')" :disabled="!paperDetail?.slide">
                Slides
              </button>
              <button :class="['tab-btn', { active: activeTab === 'poster', disabled: !paperDetail?.poster }]"
                @click="paperDetail?.poster && switchTab('poster')" :disabled="!paperDetail?.poster">
                Poster
              </button>
              <button
                :class="['tab-btn', { active: activeTab === 'additional', disabled: !paperDetail?.addition_files.length }]"
                @click="paperDetail?.addition_files.length && switchTab('additional')"
                :disabled="!paperDetail?.addition_files.length">
                Additional Info
              </button>
            </div>

            <div class="tab-content">
              <div v-if="activeTab === 'details'" class="details-content">
                <div class="paper-info">
                  <div class="info-section">
                    <h4>Authors</h4>
                    <div class="authors-list">
                      <span v-for="(author, authorIndex) in paperDetail?.authors" :key="authorIndex"
                        class="author-name">
                        {{ author.name }}<template v-if="author?.affiliations?.length"><sup
                            v-for="(aff, affIdx) in author.affiliations" :key="affIdx">{{ getAffiliationNumber(aff.id)
                            }}</sup></template><span>
                          {{ authorIndex < (paperDetail?.authors.length || 0) - 1 ? ',' : '' }} </span>
                        </span>
                    </div>
                  </div>

                  <div class="info-section">
                    <h4>Affiliations</h4>
                    <div class="affiliations-list">
                      <div v-for="aff in affiliations" :key="aff.id" class="affiliation">
                        <span class="affiliation-number"><sup>{{ aff.id }}</sup></span>{{ aff.university || aff.name
                        }}{{
                          aff.department ? ', ' + aff.department : '' }}{{ aff.city ? ', ' + aff.city : '' }}{{
                          aff.state ? ', ' + aff.state : '' }}{{ aff.country ? ', ' + aff.country : '' }}
                      </div>
                    </div>
                  </div>
                </div>
                <div class="detail-item">
                  <h5>DOI</h5>
                  <p>{{ paperDetail?.doi }}</p>
                </div>
                <div class="detail-item">
                  <h5>Abstract</h5>
                  <p>{{ paperDetail?.abstract }}</p>
                </div>
                <div class="detail-item">
                  <h5>Graphical Abstract</h5>
                  <template v-for="graphical in paperDetail?.graphic_abstract" :key="graphical">
                    <img v-if="1" :src="getImageUrl(graphical)" alt="Graphical Abstract" class="graphical-abstract" />
                  </template>
                </div>
                <div class="detail-item">
                  <h5>Keywords</h5>
                  <div class="keywords-list">
                    <span v-for="keyword in paperDetail?.keywords" :key="keyword.order" class="keyword-tag">
                      {{ keyword.name }}
                    </span>
                  </div>
                </div>
              </div>

              <div v-if="activeTab === 'video'" class="videos-content">
                <template v-if="paperDetail?.is_open_access">
                  <FileUpload :tab-key="activeTab" :paper-id="paperDetail?.id || 0" :paper-detail="paperContent"
                    :limit="1" :is-show="false" :is-file-list-show-config="{
                      [activeTab]: false,
                    }" />
                </template>
                <div v-else class="access-restricted">
                  <p>Video content is only available to open access.</p>
                </div>
              </div>

              <div v-if="activeTab === 'slides'" class="slides-content">
                <FileUpload :tab-key="activeTab" :paper-id="paperDetail?.id || 0" :paper-detail="paperContent"
                  :limit="1" class="slides-iframe" :is-show="false" :is-file-list-show-config="{
                    [activeTab]: false,
                  }" />
              </div>

              <div v-if="activeTab === 'poster'" class="poster-content">
                <FileUpload :tab-key="activeTab" :paper-id="paperDetail?.id || 0" :paper-detail="paperContent"
                  :limit="1" class="poster-image" :is-show="false" :is-file-list-show-config="{
                    [activeTab]: false,
                  }" />
              </div>

              <div v-if="activeTab === 'additional'" class="additional-content">
                <template v-if="paperDetail?.addition_files">
                  <!-- <FileUpload :tab-key="activeTab" :paper-id="paperDetail?.id" :paper-detail="paperContent"
                  class="additional-iframe" :limit="-1" :is-show="false" /> -->
                  <FileUpload :tab-key="activeTab" :paper-id="paperDetail?.id" :paper-detail="paperContent" :limit="-1"
                    :is-show="false" class="additional-iframe" />
                </template>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
