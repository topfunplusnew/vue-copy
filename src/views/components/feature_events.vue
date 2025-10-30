FileUpload
<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import commonHeader from '@/layout/common-header.vue';
import { useConferenceStore } from '@/stores/conference';
import { formatRange } from '@/utils/date';
import { getImageUrl } from '@/utils';
import { useRouter } from 'vue-router';
import type { TabKey } from '@/types/conference.ts';
import { getFileTypeByTabKey } from '@/utils/conference.ts';
import FileUpload from '@/components/file-upload.vue';
interface IPaper {
  id: number;
  title: string;
  authors: string[];
  institutions: string[];
  doi: string;
  abstract: string;
  keywords: string[];
  graphicalAbstract: string | null;
  video: string | null;
  slides: string | null;
  poster: string | null;
  additionalInfo: string | null;
}
const router = useRouter();
const conferenceStore = useConferenceStore();
const props = defineProps({
  conferenceId: {
    type: String,
    required: true
  }
})
onMounted(() => {
  conferenceStore.getConferencesList();
})

watch(() => props.conferenceId, (val, old) => {
  if (val !== old) {
    conferenceStore.getConferenceDetails(val);
    conferenceStore.getConferencePaper(val);
  }
}, { immediate: true });

const featuredConferences = computed(() => conferenceStore.conferenceList);
const conferenceDetail = computed(() => conferenceStore.conferenceDetail);



const selectedConference = computed({
  get: () => conferenceDetail.value,
  set: (val) => (conferenceDetail.value = val),
});

const searchQuery = ref('');//搜索框绑定的输入值
const selectedPaper = ref<IPaper | null>(null);//当前选中的论文对象
const showPaperModal = ref(false);//控制论文详情弹窗是否显示
const activeTab = ref<TabKey>('details');//当前激活的 Tab
// const currentPage = ref(1);//当前分页页码
// const papersPerPage = ref(20);//每页显示论文数量（默认 12）

// const filteredPapers = selectedConference.value?.papers

const conferencePapers = computed(() => conferenceStore.conferencePaper);





// watch(searchQuery, () => {
//   currentPage.value = 1;
// });

const conferenceStats = computed(() => ({//统计会议数量和类别
  totalConferences: featuredConferences.value?.length,
  categories: [...new Set(featuredConferences.value?.map((c) => c.conference_type))],
}));


//点击请求新会议
// async function selectConference(id: number) {

//   router.push({ name: 'FeaturedEvents', params: { conferenceId: id } })
//   await conferenceStore.getConferenceDetails(id);
//   conferenceDetail.value = conferenceStore.conferenceDetail;

// }

function registerInterest(conferenceId: number) {
  ElMessage.success('Interest registered! You will receive updates about this conference.' + conferenceId);
}

function openPaperModal(paper: IPaper) {
  selectedPaper.value = paper;
  showPaperModal.value = true;
  activeTab.value = 'details';
  conferenceStore.getPaperDetailAll(String(paper.id))

}
const paperDetail = computed(() => conferenceStore.paperDetail)


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

const paperContent = computed(() => ({
  fileUrl: paperDetail.value?.[getFileTypeByTabKey(activeTab.value)],
}));

// 计算属性：获取去重后的机构列表
const uniqueAffiliations = computed(() => {
  if (!paperDetail.value?.authors) return [];

  const affiliationMap = new Map();

  // 遍历所有作者的所有机构，使用Map去重
  paperDetail.value.authors.forEach(author => {
    if (author.affiliations && author.affiliations.length) {
      author.affiliations.forEach(affiliation => {
        // 使用机构id作为Map的键，确保每个机构只存储一次
        if (affiliation?.name && !affiliationMap.has(affiliation?.name)) {
          affiliationMap.set(affiliation.name, affiliation.name);
        }
      });
    }
  });

  // 将Map转换为数组并返回
  return Array.from(affiliationMap.values());
});

function seachPaper() {
  conferenceStore.getConferencePaper(props.conferenceId, searchQuery.value);
}

// 格式化字符串，使第一个字母大写，其他字母小写
function formatFirstLetterUppercase(str: string): string {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

</script>

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
              params: { conferenceId: conf.id }
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
            <a :href="selectedConference?.website" target="_blank" class="conf-link">
              <span class="link-icon">🌐</span> Official Website
            </a>
            <a :href="selectedConference?.committee_website" target="_blank" class="conf-link">
              <span class="link-icon">👥</span> Committee
            </a>
            <a :href="selectedConference?.registration_website" target="_blank" class="conf-link">
              <span class="link-icon">📝</span> Registration
            </a>
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
            <button @click="registerInterest(selectedConference!.id)" class="interest-btn">
              <span class="btn-icon">💡</span> Add to Favourite
            </button>
            <a :href="selectedConference?.website" target="_blank" class="visit-btn">
              <span class="btn-icon">🔗</span> Visit Website
            </a>
            <a :href="selectedConference?.registration_website" target="_blank" class="register-btn">
              <span class="btn-icon">📝</span> Register Now
            </a>
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
          <h2>{{ selectedPaper?.title }}</h2>
          <button class="close-btn" @click="closePaperModal">×</button>
        </div>

        <div class="modal-content">
          <div class="paper-info">
            <div class="info-section">
              <h4>Authors</h4>
              <div class="authors-list">
                <span v-for="(author, index) in paperDetail?.authors" :key="index" class="author-name">
                  {{ author.name }}
                  {{ index < (paperDetail?.authors.length || 0) - 1 ? ',' : '' }} </span>
              </div>
            </div>

            <div class="info-section">
              <h4>Affiliations</h4>
              <div class="affiliations-list">
                <!-- 使用计算属性获取去重后的机构列表 -->
                <div v-for="(affiliation, affIndex) in uniqueAffiliations" :key="affiliation.id" class="affiliation">
                  <span class="affiliation-number">{{ affIndex + 1 }}</span>
                  {{ affiliation }}
                </div>
              </div>
            </div>
          </div>

          <div class="tab-navigation">
            <button :class="['tab-btn', { active: activeTab === 'details' }]"
              @click="switchTab('details')">Details</button>
            <button :class="['tab-btn', { active: activeTab === 'video', disabled: !paperDetail?.video }]"
              @click="paperDetail?.video && switchTab('video')" :disabled="!paperDetail?.video">
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
              :class="['tab-btn', { active: activeTab === 'additional', disabled: !(paperDetail?.addition_files.length) }]"
              @click="paperDetail?.addition_files.length && switchTab('additional')"
              :disabled="!paperDetail?.addition_files.length">
              Additional Info
            </button>
          </div>

          <div class="tab-content">
            <div v-if="activeTab === 'details'" class="details-content">
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
              <FileUpload :tab-key="activeTab" :paper-id="paperDetail?.id" :paper-detail="paperContent" :limit="1"
                :is-show="false" />
            </div>

            <div v-if="activeTab === 'slides'" class="slides-content">
              <FileUpload :tab-key="activeTab" :paper-id="paperDetail?.id" :paper-detail="paperContent" :limit="1"
                class="slides-iframe" :is-show="false" />
            </div>

            <div v-if="activeTab === 'poster'" class="poster-content">
              <FileUpload :tab-key="activeTab" :paper-id="paperDetail?.id" :paper-detail="paperContent" :limit="1"
                class="poster-image" :is-show="false" />
            </div>

            <div v-if="activeTab === 'additional'" class="additional-content">
              <template v-if="paperDetail?.addition_files">
                <!-- <FileUpload :tab-key="activeTab" :paper-id="paperDetail?.id" :paper-detail="paperContent"
                  class="additional-iframe" :limit="-1" :is-show="false" /> -->
                <file-upload :tab-key="activeTab" :paper-id="paperDetail?.id" :paper-detail="paperContent" :limit="-1"
                  :isshow="true" class="additional-iframe" />
              </template>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
