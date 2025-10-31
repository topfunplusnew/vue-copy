<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import commonHeader from '@/layout/common-header.vue';
import { useConferenceStore } from '@/stores/conference';
import type { IConferenceParticipation } from '@/types/conference';
import { formatRange } from '@/utils/date';

const props = defineProps<{ conferenceId: number }>();
const conferenceStore = useConferenceStore();
const featuredConferences = computed(() => conferenceStore.list);
const conferenceDetail = ref<IConferenceParticipation | null>(null);

onMounted(async () => {
  const { data } = await conferenceStore.getConferenceDetails(props.conferenceId);
  conferenceDetail.value = data;
});

const selectedConference = computed({
  get: () => conferenceDetail.value,
  set: (val) => (conferenceDetail.value = val),
});

// Paper interface
interface Paper {
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

// Paper search and modal state
const searchQuery = ref('');
const selectedPaper = ref<Paper | null>(null);
const showPaperModal = ref(false);
const activeTab = ref('details');

// Pagination for papers
const currentPage = ref(1);
const papersPerPage = ref(12);
const totalPages = computed(() => {
  return Math.ceil(filteredPapers.value.length / papersPerPage.value);
});

// Paginated papers
const paginatedPapers = computed(() => {
  const start = (currentPage.value - 1) * papersPerPage.value;
  const end = start + papersPerPage.value;
  return filteredPapers.value.slice(start, end);
});

// Reset pagination when search changes
watch(searchQuery, () => {
  currentPage.value = 1;
});

// Conference statistics
const conferenceStats = computed(() => ({
  totalConferences: featuredConferences.value?.length,
  categories: [...new Set(featuredConferences.value?.map((c) => c.conference_type))],
}));

// Filtered papers based on search query
const filteredPapers = computed(() => {
  if (!selectedConference.value?.papers) return [];

  if (!searchQuery.value.trim()) {
    return selectedConference.value.papers;
  }

  const query = searchQuery.value.toLowerCase();
  return selectedConference.value.papers.filter(
    (paper) =>
      paper.title.toLowerCase().includes(query) ||
      paper.authors.some((author) => author.toLowerCase().includes(query)) ||
      paper.institutions.some((institution) => institution.toLowerCase().includes(query)) ||
      paper.keywords.some((keyword) => keyword.toLowerCase().includes(query)),
  );
});

//点击请求新会议
async function selectConference(id: number) {
  const { data } = await conferenceStore.getConferenceDetails(id);
  conferenceDetail.value = data;
}

// function selectConference(conference: ConferenceParticipation) {
//   selectedConference.value= conference;
// }

function registerInterest(conferenceId: number) {
  ElMessage.success('Interest registered! You will receive updates about this conference.' + conferenceId);
}

function openPaperModal(paper: Paper) {
  selectedPaper.value = paper;
  showPaperModal.value = true;
  activeTab.value = 'details';
}

function closePaperModal() {
  showPaperModal.value = false;
  selectedPaper.value = null;
}

function switchTab(tab: string) {
  activeTab.value = tab;
}

function getAuthorAffiliations(authorIndex: number, paper: Paper): string {
  // Simple mapping: first author -> institution 1, second author -> institution 2, etc.
  // In a real application, this would be more complex based on actual author-institution relationships
  const institutionIndex = authorIndex % paper.institutions.length;
  return (institutionIndex + 1).toString();
}

function goToPage(page: number) {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page;
  }
}

function nextPage() {
  if (currentPage.value < totalPages.value) {
    currentPage.value++;
  }
}

function prevPage() {
  if (currentPage.value > 1) {
    currentPage.value--;
  }
}

// Get tier color
// function getTierColor(tier: string) {
//   switch (tier) {
//     case 'Tier 1': return '#d97706';
//     case 'Tier 2': return '#dc2626';
//     case 'Tier 3': return '#7c3aed';
//     default: return '#6b7280';
//   }
// }
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
          <div v-for="conf in featuredConferences" :key="conf.id" :class="['conference-card', { active: selectedConference?.id === conf.id }]" @click="selectConference(conf.id)">
            <div class="card-logo">
              <img :src="conf.logoUrl" :alt="conf.name" />
            </div>
            <div class="card-info">
              <div class="card-name">{{ conf.name }}</div>
              <div class="card-category">{{ conf.conference_type }}</div>
              <div class="card-date">{{ formatRange(conf.start_time, conf.end_time) }}</div>
              <!-- <div class="card-tier" :style="{ color: getTierColor(conf.tier) }">{{ conf.tier }}</div> -->
            </div>
          </div>
        </div>
      </aside>

      <!-- Conference Details -->
      <section class="conference-details">
        <header class="event-header">
          <div class="conference-header">
            <div class="logo">
              <img :src="selectedConference?.logo" :alt="selectedConference?.abbreviation" />
            </div>
            <div class="conference-info">
              <div class="conference-name">{{ selectedConference?.name }}</div>
              <div class="conference-full-name">{{ selectedConference?.abbreviation }}</div>
              <div class="conference-details">
                <div class="detail-row">
                  <span class="detail-icon">📅</span>
                  <span class="detail-text">{{ formatRange(selectedConference!.start_time, selectedConference!.end_time) }}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-icon">📍</span>
                  <span class="detail-text">{{ selectedConference!.city }},{{ selectedConference!.country }}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-icon">🏢</span>
                  <span class="detail-text">{{ selectedConference!.address }}</span>
                </div>
              </div>
            </div>
          </div>

          <div class="conference-links">
            <a :href="selectedConference?.website" target="_blank" class="conf-link">
              <span class="link-icon">🌐</span>
              Official Website
            </a>
            <a :href="selectedConference?.committee_website" target="_blank" class="conf-link">
              <span class="link-icon">👥</span>
              Committee
            </a>
            <a :href="selectedConference?.registration_website" target="_blank" class="conf-link">
              <span class="link-icon">📝</span>
              Registration
            </a>
          </div>

          <!-- Conference Statistics & Info -->
          <!-- <div class="conference-stats">
              <div class="stats-grid">
                <div class="stat-card">
                  <div class="stat-icon">⭐</div>
                  <div class="stat-value">{{ selectedConference.tier }}</div>
                  <div class="stat-label">Conference Tier</div>
                </div>
                <div class="stat-card">
                  <div class="stat-icon">📊</div>
                  <div class="stat-value">{{ selectedConference.acceptanceRate }}</div>
                  <div class="stat-label">Acceptance Rate</div>
                </div>
                <div class="stat-card">
                  <div class="stat-icon">👥</div>
                  <div class="stat-value">{{ selectedConference.expectedAttendees }}</div>
                  <div class="stat-label">Expected Attendees</div>
                </div>
                <div class="stat-card">
                  <div class="stat-icon">🏷️</div>
                  <div class="stat-value">{{ selectedConference.category }}</div>
                  <div class="stat-label">Research Area</div>
                </div>
              </div>
            </div> -->

          <!-- Conference Description -->
          <div class="conference-description">
            <h3>About This Conference</h3>
            <p>{{ selectedConference?.description }}</p>
          </div>

          <!-- Research Topics -->
          <div class="research-topics">
            <h3>Key Research Topics</h3>
            <div class="topic-tags">
              <span v-for="topic in selectedConference?.keywords" :key="topic.id" class="topic-tag">
                {{ topic.name }}
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
                  <div class="date-value">{{ formatRange(selectedConference!.submission_deadline) }}</div>
                </div>
              </div>
              <div class="date-item">
                <div class="date-icon">📧</div>
                <div class="date-info">
                  <div class="date-label">Notification Date</div>
                  <div class="date-value">{{ formatRange(selectedConference!.notification_date) }}</div>
                </div>
              </div>
              <div class="date-item">
                <div class="date-icon">🎯</div>
                <div class="date-info">
                  <div class="date-label">Conference Dates</div>
                  <div class="date-value">{{ formatRange(selectedConference!.start_time, selectedConference!.end_time) }}</div>
                </div>
              </div>
            </div>
          </div>

          <!-- Action Buttons -->
          <div class="action-buttons">
            <button @click="registerInterest(selectedConference!.id)" class="interest-btn">
              <span class="btn-icon">💡</span>
              Add to Favourite
            </button>
            <a :href="selectedConference?.website" target="_blank" class="visit-btn">
              <span class="btn-icon">🔗</span>
              Visit Website
            </a>
            <a :href="selectedConference?.registration_website" target="_blank" class="register-btn">
              <span class="btn-icon">📝</span>
              Register Now
            </a>
          </div>
        </header>

        <!-- Papers Section -->
        <div class="papers-section">
          <div class="papers-header">
            <h3>Conference Papers</h3>
            <div class="search-container">
              <input v-model="searchQuery" type="text" placeholder="Search papers by title, author, institution, or keywords..." class="paper-search-input" />
              <el-button icon="Search" class="search-btn" />
            </div>
          </div>

          <div class="papers-list">
            <div v-for="paper in paginatedPapers" :key="paper.id" class="paper-card" @click="openPaperModal(paper)">
              <div class="paper-title">{{ paper.title }}</div>
              <div class="paper-authors">{{ paper.authors.join(', ') }}</div>
              <div class="paper-institutions">{{ paper.institutions.join(', ') }}</div>
              <div class="paper-keywords">
                <span v-for="keyword in paper.keywords" :key="keyword" class="keyword-tag">
                  {{ keyword }}
                </span>
              </div>
            </div>

            <div v-if="filteredPapers.length === 0" class="no-papers">
              <p>No papers found matching your search criteria.</p>
            </div>
          </div>

          <!-- Pagination -->
          <div v-if="totalPages > 1" class="pagination">
            <button @click="prevPage" :disabled="currentPage === 1" class="page-btn prev-btn">← Previous</button>

            <div class="page-numbers">
              <button v-for="page in Math.min(5, totalPages)" :key="page" @click="goToPage(page)" :class="['page-btn', { active: currentPage === page }]">
                {{ page }}
              </button>

              <span v-if="totalPages > 5" class="page-ellipsis">...</span>

              <button v-if="totalPages > 5" @click="goToPage(totalPages)" :class="['page-btn', { active: currentPage === totalPages }]">
                {{ totalPages }}
              </button>
            </div>

            <button @click="nextPage" :disabled="currentPage === totalPages" class="page-btn next-btn">Next →</button>
          </div>

          <div class="papers-info">
            <p>Showing {{ (currentPage - 1) * papersPerPage + 1 }} - {{ Math.min(currentPage * papersPerPage, filteredPapers.length) }} of {{ filteredPapers.length }} papers</p>
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
                <span v-for="(author, index) in selectedPaper?.authors" :key="index" class="author-name">
                  {{ author }}<sup>{{ selectedPaper ? getAuthorAffiliations(index, selectedPaper) : '' }}</sup
                  >{{ index < (selectedPaper?.authors.length || 0) - 1 ? ',' : '' }}
                </span>
              </div>
            </div>
            <div class="info-section">
              <h4>Affiliations</h4>
              <div class="affiliations-list">
                <div v-for="(institution, index) in selectedPaper?.institutions" :key="index" class="affiliation">
                  <sup>{{ index + 1 }}</sup
                  >{{ institution }}
                </div>
              </div>
            </div>
          </div>

          <div class="tab-navigation">
            <button :class="['tab-btn', { active: activeTab === 'details' }]" @click="switchTab('details')">Details</button>
            <button :class="['tab-btn', { active: activeTab === 'videos', disabled: !selectedPaper?.video }]" @click="selectedPaper?.video && switchTab('videos')" :disabled="!selectedPaper?.video">
              Video
            </button>
            <button :class="['tab-btn', { active: activeTab === 'slides', disabled: !selectedPaper?.slides }]" @click="selectedPaper?.slides && switchTab('slides')" :disabled="!selectedPaper?.slides">
              Slides
            </button>
            <button :class="['tab-btn', { active: activeTab === 'poster', disabled: !selectedPaper?.poster }]" @click="selectedPaper?.poster && switchTab('poster')" :disabled="!selectedPaper?.poster">
              Poster
            </button>
            <button
              :class="['tab-btn', { active: activeTab === 'additional', disabled: !selectedPaper?.additionalInfo }]"
              @click="selectedPaper?.additionalInfo && switchTab('additional')"
              :disabled="!selectedPaper?.additionalInfo"
            >
              Additional Info
            </button>
          </div>

          <div class="tab-content">
            <div v-if="activeTab === 'details'" class="details-content">
              <div class="detail-item">
                <h5>DOI</h5>
                <p>{{ selectedPaper?.doi }}</p>
              </div>
              <div class="detail-item">
                <h5>Abstract</h5>
                <p>{{ selectedPaper?.abstract }}</p>
              </div>
              <div class="detail-item">
                <h5>Graphical Abstract</h5>
                <img v-if="selectedPaper?.graphicalAbstract" :src="selectedPaper.graphicalAbstract" alt="Graphical Abstract" class="graphical-abstract" />
              </div>
              <div class="detail-item">
                <h5>Keywords</h5>
                <div class="keywords-list">
                  <span v-for="keyword in selectedPaper?.keywords" :key="keyword" class="keyword-tag">
                    {{ keyword }}
                  </span>
                </div>
              </div>
            </div>

            <div v-if="activeTab === 'videos'" class="videos-content">
              <video v-if="selectedPaper?.video" :src="selectedPaper.video" controls class="paper-video">Your browser does not support the video tag.</video>
            </div>

            <div v-if="activeTab === 'slides'" class="slides-content">
              <iframe v-if="selectedPaper?.slides" :src="selectedPaper.slides" class="slides-iframe"></iframe>
            </div>

            <div v-if="activeTab === 'poster'" class="poster-content">
              <img v-if="selectedPaper?.poster" :src="selectedPaper.poster" alt="Poster" class="poster-image" />
            </div>

            <div v-if="activeTab === 'additional'" class="additional-content">
              <iframe v-if="selectedPaper?.additionalInfo" :src="selectedPaper.additionalInfo" class="additional-iframe"></iframe>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
