<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { ElMessage } from 'element-plus';
import { useRouter } from 'vue-router';
import commonHeader from '@/layout/common-header.vue';
import { useConferenceStore } from '@/stores/conference';
import { useUserStore } from '@/stores/user';
import { formatRange } from '@/utils/date';
import { getImageUrl } from '@/utils';
import { addFavorite } from '@/services/conference';
import type { IAddFavoriteRequest } from '@/services/conference/type.ts';
type SelectedPaperLite = { id: number; title?: string };
const conferenceStore = useConferenceStore();
const userStore = useUserStore();
const router = useRouter();
const props = defineProps({
  conferenceId: {
    type: String,
    required: true,
  },
});

onMounted(() => {
  conferenceStore.getConferencesList();
});

const conferenceSearchQuery = ref(''); // 会议搜索框绑定的输入值
const hasSearched = ref(false); // 是否执行过搜索

// 搜索会议
function searchConferences() {
  const searchValue = conferenceSearchQuery.value?.trim();
  hasSearched.value = !!searchValue; // 如果有搜索关键词，标记为已搜索；如果清空，则重置状态
  conferenceStore.getConferencesList(searchValue || undefined);
}

// 监听搜索框变化，如果清空则重置搜索状态并重新加载所有会议
watch(conferenceSearchQuery, (newVal) => {
  if (!newVal?.trim() && hasSearched.value) {
    // 如果从有搜索关键词变为空，重置状态并重新加载所有会议
    hasSearched.value = false;
    conferenceStore.getConferencesList();
  }
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

const conferencePapers = computed(() => conferenceStore.conferencePaper);

// watch(searchQuery, () => {
//   currentPage.value = 1;
// });

const conferenceStats = computed(() => {
  const totalConferences = featuredConferences.value?.length || 0;
  const categories = [...new Set(featuredConferences.value?.map((c) => c.conference_type))];

  return {
    totalConferences,
    categories,
    isSearching: hasSearched.value, // 只有在执行搜索后才显示 "Searched"
  };
});

//点击请求新会议
// async function selectConference(id: number) {

//   router.push({ name: 'FeaturedEvents', params: { conferenceId: id } })
//   await conferenceStore.getConferenceDetails(id);
//   conferenceDetail.value = conferenceStore.conferenceDetail;

// }
const addFavorLoading = ref<boolean>(false);

// 判断用户是否登录
const isLoggedIn = computed(() => userStore.isLogin());

// 添加至喜欢 发送邮件
function registerInterest(conferenceId: number) {
  // 如果未登录，跳转到登录页面并带上回调地址
  if (!isLoggedIn.value) {
    const currentRoute = router.currentRoute.value;
    const redirectUrl = currentRoute.fullPath;
    router.push({
      name: 'login',
      query: {
        redirectUrl: redirectUrl,
      },
    });
    return;
  }

  // 已登录，正常执行添加收藏逻辑
  addFavorLoading.value = true;
  const data: IAddFavoriteRequest = {
    conference_id: conferenceId,
  };
  addFavorite(data)
    .then(() => {
      ElMessage.success('Interest registered! You will receive updates about this conference.');
    })
    .catch((err) => {
      ElMessage.error(`error adding favourite , `, err.response.data.message);
    })
    .finally(() => {
      addFavorLoading.value = false;
    });
}

function openPaperModal(paper: SelectedPaperLite) {
  // 跳转到论文详情页
  router.push({
    name: 'PaperDetail',
    params: { paperId: paper.id },
  });
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

<template>
  <div class="background-layer"></div>

  <div class="featured-events-page main">
    <commonHeader />

    <section class="main-content">
      <!-- Conference Selector -->
      <aside class="conference-selector">
        <div class="selector-header">
          <h2>Featured Conferences</h2>
          <div class="conference-search-container">
            <input v-model="conferenceSearchQuery" type="text" placeholder="Search conferences by name..." class="conference-search-input" @keyup.enter="searchConferences()" />
            <el-button icon="Search" class="conference-search-btn" @click="searchConferences()" />
          </div>
          <div v-if="conferenceStats.isSearching" class="stats">
            <span class="stat-item"> {{ conferenceStats.totalConferences }} Conferences Searched , {{ conferenceStats.categories.length }} Categories Searched </span>
          </div>
        </div>

        <div class="conference-list">
          <router-link
            v-for="conf in featuredConferences"
            :key="conf.id"
            :class="['conference-card', { active: selectedConference?.id === conf.id }]"
            :to="{
              name: 'FeaturedEvents',
              params: { conferenceId: conf.id },
            }"
          >
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
                  <span class="detail-text">{{ formatRange(selectedConference?.start_time, selectedConference?.end_time) }}</span>
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
            <a :href="selectedConference?.website" target="_blank" class="conf-link"> <span class="link-icon">🌐</span> Official Website </a>
            <a :href="selectedConference?.committee_website" target="_blank" class="conf-link"> <span class="link-icon">👥</span> Committee </a>
            <a :href="selectedConference?.registration_website" target="_blank" class="conf-link"> <span class="link-icon">📝</span> Registration </a>
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
                  <div class="date-value">{{ formatRange(selectedConference?.start_time, selectedConference?.end_time) }}</div>
                </div>
              </div>
            </div>
          </div>

          <!-- Action Buttons -->
          <div class="action-buttons">
            <el-button :loading="addFavorLoading" @click="registerInterest(selectedConference!.id)" class="interest-btn"
              ><span class="btn-icon">💡</span>
              {{ isLoggedIn ? 'Add to Favourite' : 'Login To Add Favourite' }}
            </el-button>
            <a :href="selectedConference?.website" target="_blank" class="visit-btn"> <span class="btn-icon">🔗</span> Visit Website </a>
            <a :href="selectedConference?.registration_website" target="_blank" class="register-btn"> <span class="btn-icon">📝</span> Register Now </a>
          </div>
        </header>

        <!-- Papers Section -->
        <div class="papers-section">
          <div class="papers-header">
            <h3>Conference Papers</h3>
            <div class="search-container">
              <input v-model="searchQuery" type="text" placeholder="Search papers by title, author, institution, or keywords..." class="paper-search-input" @keyup.enter="seachPaper()" />
              <el-button icon="Search" class="search-btn" @click="seachPaper()" />
            </div>
          </div>

          <div class="papers-list">
            <div v-for="paper in conferencePapers" :key="paper.id" class="paper-item" @click="openPaperModal(paper)">
              <div class="paper-title">
                <span class="paper-title-text" :class="{ 'paper-full': paper.full_text, 'paper-video': paper.video }">{{ paper.paper_title }}</span>
              </div>
              <template v-for="(authors, index) in paper.paper_authors" :key="authors.id">
                <span class="paper-authors"
                  ><span class="author">{{ authors.name }}</span>
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
  </div>
</template>
