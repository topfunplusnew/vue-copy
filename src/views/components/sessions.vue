<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import commonHeader from '@/layout/common-header.vue';
import { useConferenceStore } from '@/stores/conference';
import { formatRange } from '@/utils/date';
import { getImageUrl } from '@/utils';
import type { ISession } from '@/types/conference';
import { getSessions, getSessionPapers } from '@/services/session';
import type { Session, SessionPaper } from '@/services/session/type';

const conferenceStore = useConferenceStore();
const router = useRouter();

const props = defineProps({
  conferenceId: {
    type: String,
    required: true,
  },
});

// Sessions 数据
const sessionsData = ref<Session[]>([]);
const loading = ref(false);

// Session Papers 数据：存储每个 session 的 papers
const sessionPapersMap = ref<Map<number, SessionPaper[]>>(new Map());
// Session Papers 加载状态
const sessionPapersLoadingMap = ref<Map<number, boolean>>(new Map());

// 将 API 返回的 Session 转换为组件使用的 ISession 格式
const mapSessionToISession = (session: Session): ISession => {
  return {
    id: session.id,
    session_name: session.session_name,
    session_number: session.session_number,
    topic: session.topic,
    chairperson: session.chairperson,
    start_time: session.start_time,
    end_time: session.end_time,
    room_info: session.room_info,
  };
};

// 获取 sessions 数据
const fetchSessions = async () => {
  loading.value = true;
  try {
    const response = await getSessions();
    if (response.data && response.data.sessions) {
      // 严格过滤：只保留 conference_id 等于当前路由 conferenceId 的 sessions
      const currentConferenceId = Number(props.conferenceId);
      
      // 确保 conferenceId 是有效数字
      if (isNaN(currentConferenceId)) {
        console.error('Invalid conferenceId:', props.conferenceId);
        sessionsData.value = [];
        return;
      }
      
      // 严格过滤，只保留匹配的 sessions，其他全部过滤掉
      const filteredSessions = response.data.sessions.filter(
        (session) => session.conference_id === currentConferenceId
      );
      
      sessionsData.value = filteredSessions;
    } else {
      // 如果没有数据，设置为空数组
      sessionsData.value = [];
    }
  } catch (error) {
    console.error('Failed to fetch sessions:', error);
    ElMessage.error('Failed to load sessions. Please try again later.');
    sessionsData.value = [];
  } finally {
    loading.value = false;
  }
};

onMounted(async () => {
  await conferenceStore.getConferenceDetails(props.conferenceId);
  await fetchSessions();
  await conferenceStore.getConferencePaper(props.conferenceId);
});

watch(
  () => props.conferenceId,
  async (val, old) => {
    if (val !== old) {
      // 清空 session papers 缓存，因为切换了会议
      sessionPapersMap.value.clear();
      sessionPapersLoadingMap.value.clear();
      selectedSessionId.value = null;
      
      await conferenceStore.getConferenceDetails(val);
      await fetchSessions();
      await conferenceStore.getConferencePaper(val);
    }
  },
);

const conferenceDetail = computed(() => conferenceStore.conferenceDetail);

// 将 API 数据转换为组件使用的格式，并再次确保只包含当前 conferenceId 的数据
const sessions = computed(() => {
  const currentConferenceId = Number(props.conferenceId);
  // 双重过滤：确保只包含当前 conferenceId 的 sessions（虽然已经在 fetchSessions 中过滤过，但这里作为额外保护）
  return sessionsData.value
    .filter((session) => session.conference_id === currentConferenceId)
    .map(mapSessionToISession);
});

// 使用实际数据
const displaySessions = computed(() => sessions.value);

// 搜索功能
const searchQuery = ref('');
const filteredSessions = computed(() => {
  if (!searchQuery.value?.trim()) {
    return displaySessions.value;
  }
  
  const query = searchQuery.value.toLowerCase();
  return displaySessions.value.filter((session: ISession) => {
    return (
      session.session_name?.toLowerCase().includes(query) ||
      session.topic?.toLowerCase().includes(query) ||
      session.chairperson?.toLowerCase().includes(query) ||
      session.room_info?.toLowerCase().includes(query)
    );
  });
});

// 选中的 session
const selectedSessionId = ref<number | null>(null);

// 获取 session 的论文（从 API）
const fetchSessionPapers = async (sessionId: number) => {
  // 如果已经加载过，直接返回
  if (sessionPapersMap.value.has(sessionId)) {
    return;
  }

  // 设置加载状态
  sessionPapersLoadingMap.value.set(sessionId, true);

  try {
    const response = await getSessionPapers(sessionId);
    if (response.data && response.data.papers) {
      // 存储该 session 的 papers
      sessionPapersMap.value.set(sessionId, response.data.papers);
    } else {
      // 如果没有数据，设置为空数组
      sessionPapersMap.value.set(sessionId, []);
    }
  } catch (error) {
    console.error(`Failed to fetch papers for session ${sessionId}:`, error);
    ElMessage.error('Failed to load papers. Please try again later.');
    sessionPapersMap.value.set(sessionId, []);
  } finally {
    sessionPapersLoadingMap.value.set(sessionId, false);
  }
};

function selectSession(sessionId: number) {
  const isExpanding = selectedSessionId.value !== sessionId;
  selectedSessionId.value = selectedSessionId.value === sessionId ? null : sessionId;
  
  // 如果展开 session，则加载该 session 的 papers
  if (isExpanding && selectedSessionId.value === sessionId) {
    fetchSessionPapers(sessionId);
  }
}

// 获取 session 的论文（从缓存中读取）
const getSessionPapersList = (sessionId: number): SessionPaper[] => {
  return sessionPapersMap.value.get(sessionId) || [];
};

// 检查 session 的 papers 是否正在加载
const isSessionPapersLoading = (sessionId: number): boolean => {
  return sessionPapersLoadingMap.value.get(sessionId) || false;
};

// 打开论文详情
function openPaperDetail(paperId: number) {
  router.push({
    name: 'PaperDetail',
    params: { paperId }
  });
}

// 返回会议详情页
function backToConference() {
  router.push({
    name: 'FeaturedEvents',
    params: { conferenceId: props.conferenceId }
  });
}

// 格式化时间范围
function formatSessionTime(startTime: string, endTime: string): string {
  if (!startTime) return 'TBA';
  return formatRange(startTime, endTime);
}

// 按日期分组 sessions
const sessionsByDate = computed(() => {
  const grouped: Record<string, ISession[]> = {};
  
  filteredSessions.value.forEach((session: ISession) => {
    const date = session.start_time ? new Date(session.start_time).toLocaleDateString() : 'TBA';
    if (!grouped[date]) {
      grouped[date] = [];
    }
    grouped[date].push(session);
  });
  
  return grouped;
});
</script>

<template>
  <div class="background-layer"></div>

  <div class="sessions-page main">
    <commonHeader />

    <section class="main-content">
      <section class="right-panel">
        <!-- Back Button -->
        <div class="back-button-wrapper">
          <button class="back-btn" @click="backToConference">
            <span class="back-icon">←</span> Back to Conference
          </button>
        </div>

        <!-- Conference Header -->
        <header class="event-header">
        <div class="conference-header">
          <div class="logo" v-if="conferenceDetail?.logo">
            <img :src="getImageUrl(conferenceDetail.logo)" :alt="conferenceDetail.abbreviation" />
          </div>
          <div class="conference-info">
            <div class="conference-name">{{ conferenceDetail?.abbreviation }}</div>
            <div class="conference-full-name">{{ conferenceDetail?.name }}</div>
          </div>
        </div>
        
        <div class="meta">
          <div class="session-notice">
            <div class="session-header">
              <div class="conference-details">
                <div class="detail-row">
                  <span class="detail-icon">📅</span>
                  <span class="detail-text">{{ formatRange(conferenceDetail?.start_time, conferenceDetail?.end_time) }}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-icon">📍</span>
                  <span class="detail-text">{{ conferenceDetail?.city }}, {{ conferenceDetail?.country }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <!-- Sessions Section -->
      <section class="sessions-section">
        <div class="sessions-header">
          <h2 class="sessions-title">Conference Sessions</h2>
          <div class="search-container">
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Search sessions by name, topic, chair, or room..."
              class="session-search-input"
            />
            <el-button icon="Search" class="search-btn" />
          </div>
        </div>

        <!-- Loading State -->
        <div v-if="loading" class="loading-state">
          <div class="loading-spinner">Loading sessions...</div>
        </div>

        <!-- Sessions List -->
        <div v-else-if="Object.keys(sessionsByDate).length > 0" class="sessions-list">
          <div v-for="(sessionGroup, date) in sessionsByDate" :key="date" class="session-date-group">
            <h3 class="date-header">{{ date }}</h3>
            
            <div class="sessions-grid">
              <div
                v-for="session in sessionGroup"
                :key="session.id"
                :class="['session-card', { 'expanded': selectedSessionId === session.id }]"
                @click="selectSession(session.id)"
              >
                <div class="session-card-header">
                  <div class="session-main-info">
                    <div class="session-number">{{ session.session_number }}</div>
                    <div class="session-details">
                      <h4 class="session-name">{{ session.session_name }}</h4>
                      <div class="session-meta">
                        <span v-if="session.topic" class="session-topic">
                          <span class="topic-icon">🔍</span>{{ session.topic }}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div class="expand-icon">{{ selectedSessionId === session.id ? '▼' : '▶' }}</div>
                </div>

                <div class="session-info-grid">
                  <div class="info-item">
                    <span class="info-label">Time:</span>
                    <span class="info-value">{{ formatSessionTime(session.start_time, session.end_time) }}</span>
                  </div>
                  <div v-if="session.room_info" class="info-item">
                    <span class="info-label">Room:</span>
                    <span class="info-value">{{ session.room_info }}</span>
                  </div>
                  <div v-if="session.chairperson" class="info-item">
                    <span class="info-label">Chair:</span>
                    <span class="info-value">{{ session.chairperson }}</span>
                  </div>
                </div>

                <!-- Expanded Papers List -->
                <div v-if="selectedSessionId === session.id" class="session-papers">
                  <h5 class="papers-title">Papers in this Session</h5>
                  <div class="papers-list">
                    <!-- Loading State -->
                    <div v-if="isSessionPapersLoading(session.id)" class="papers-loading">
                      <p>Loading papers...</p>
                    </div>

                    <!-- Papers List -->
                    <template v-else>
                      <div
                        v-for="paper in getSessionPapersList(session.id)"
                        :key="paper.id"
                        class="paper-item"
                        @click.stop="openPaperDetail(paper.id)"
                      >
                        <div class="paper-title">
                          <span class="paper-title-text">{{ paper.title }}</span>
                          <div class="paper-badges">
                            <span v-if="paper.full_text" class="badge full-text">Full Text</span>
                            <span v-if="paper.video" class="badge video">Video</span>
                            <span v-if="paper.slide" class="badge slides">Slides</span>
                            <span v-if="paper.poster" class="badge poster">Poster</span>
                          </div>
                        </div>
                        <div v-if="paper.authors && paper.authors.length" class="paper-authors">
                          <template v-for="(author, index) in paper.authors" :key="author.id">
                            <span class="author">{{ author.name }}</span>
                            <span v-if="index < paper.authors.length - 1">, </span>
                          </template>
                        </div>
                      </div>

                      <div v-if="!getSessionPapersList(session.id).length" class="no-papers">
                        <p>No papers available for this session yet.</p>
                      </div>
                    </template>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Empty State -->
        <div v-else class="empty-state">
          <div class="empty-icon">📋</div>
          <h3 class="empty-title">No Sessions Found</h3>
          <p class="empty-desc">
            {{ searchQuery ? 'No sessions match your search criteria.' : 'No sessions have been scheduled for this conference yet.' }}
          </p>
        </div>
      </section>
      </section>
    </section>
  </div>
</template>

<style lang="scss" scoped>
@use '../../styles/pages/_sessions.scss' as *;
</style>

