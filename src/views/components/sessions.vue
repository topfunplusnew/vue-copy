<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import commonHeader from '@/layout/common-header.vue';
import { useConferenceStore } from '@/stores/conference';
import { formatRange } from '@/utils/date';
import { getImageUrl } from '@/utils';
import type { ISession } from '@/types/conference';

const conferenceStore = useConferenceStore();
const router = useRouter();

const props = defineProps({
  conferenceId: {
    type: String,
    required: true,
  },
});

onMounted(async () => {
  await conferenceStore.getConferenceDetails(props.conferenceId);
  await conferenceStore.getConferenceSessionsList(props.conferenceId);
  await conferenceStore.getConferencePaper(props.conferenceId);
});

watch(
  () => props.conferenceId,
  async (val, old) => {
    if (val !== old) {
      await conferenceStore.getConferenceDetails(val);
      await conferenceStore.getConferenceSessionsList(val);
      await conferenceStore.getConferencePaper(val);
    }
  },
);

const conferenceDetail = computed(() => conferenceStore.conferenceDetail);
const sessions = computed(() => conferenceStore.conferenceSessions || []);

// Mock 数据用于测试
const mockSessions = ref<ISession[]>([
  {
    id: 1,
    session_name: 'Opening Keynote: The Future of AI',
    session_number: 'Session 1',
    topic: 'Artificial Intelligence',
    chairperson: 'Dr. Sarah Johnson',
    start_time: '2024-03-15T09:00:00Z',
    end_time: '2024-03-15T10:30:00Z',
    room_info: 'Main Hall A',
  },
  {
    id: 2,
    session_name: 'Machine Learning Applications',
    session_number: 'Session 2',
    topic: 'Machine Learning',
    chairperson: 'Prof. Michael Chen',
    start_time: '2024-03-15T11:00:00Z',
    end_time: '2024-03-15T12:30:00Z',
    room_info: 'Conference Room B',
  },
  {
    id: 3,
    session_name: 'Computer Vision and Image Processing',
    session_number: 'Session 3',
    topic: 'Computer Vision',
    chairperson: 'Dr. Emily Zhang',
    start_time: '2024-03-15T14:00:00Z',
    end_time: '2024-03-15T15:30:00Z',
    room_info: 'Innovation Lab',
  },
  {
    id: 4,
    session_name: 'Natural Language Processing',
    session_number: 'Session 4',
    topic: 'NLP',
    chairperson: 'Prof. David Williams',
    start_time: '2024-03-16T09:00:00Z',
    end_time: '2024-03-16T10:30:00Z',
    room_info: 'Main Hall A',
  },
  {
    id: 5,
    session_name: 'Robotics and Automation',
    session_number: 'Session 5',
    topic: 'Robotics',
    chairperson: 'Dr. Lisa Anderson',
    start_time: '2024-03-16T11:00:00Z',
    end_time: '2024-03-16T12:30:00Z',
    room_info: 'Tech Hub',
  },
]);

// 使用实际数据或 mock 数据
const displaySessions = computed(() => 
  sessions.value && sessions.value.length > 0 ? sessions.value : mockSessions.value
);

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

function selectSession(sessionId: number) {
  selectedSessionId.value = selectedSessionId.value === sessionId ? null : sessionId;
}

// 获取 session 的论文
const getSessionPapers = (sessionId: number) => {
  return conferenceStore.conferencePaper?.filter(
    (paper) => paper.session_id === sessionId
  ) || [];
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
      <!-- Back Button -->
      <div class="back-button-wrapper">
        <button class="back-btn" @click="backToConference">
          <span class="back-icon">←</span> Back to Conference
        </button>
      </div>

      <!-- Conference Header -->
      <header class="conference-header-section">
            <div class="logo" v-if="conferenceDetail?.logo">
              <img :src="getImageUrl(conferenceDetail.logo)" :alt="conferenceDetail.abbreviation" />
            </div>
        <div class="conference-info">
          <h1 class="conference-title">{{ conferenceDetail?.abbreviation }}</h1>
          <div class="conference-subtitle">{{ conferenceDetail?.name }}</div>
              <div class="conference-meta">
                <span class="meta-item">
                  <span class="meta-icon">📅</span>
                  {{ formatRange(conferenceDetail?.start_time, conferenceDetail?.end_time) }}
                </span>
                <span class="meta-item">
                  <span class="meta-icon">📍</span>
                  {{ conferenceDetail?.city }}, {{ conferenceDetail?.country }}
                </span>
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

        <!-- Sessions List -->
        <div v-if="Object.keys(sessionsByDate).length > 0" class="sessions-list">
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
                    <div
                      v-for="paper in getSessionPapers(session.id)"
                      :key="paper.id"
                      class="paper-item"
                      @click.stop="openPaperDetail(paper.id)"
                    >
                      <div class="paper-title">
                        <span class="paper-title-text">{{ paper.paper_title }}</span>
                        <div class="paper-badges">
                          <span v-if="paper.full_text" class="badge full-text">Full Text</span>
                          <span v-if="paper.video" class="badge video">Video</span>
                          <span v-if="paper.slides" class="badge slides">Slides</span>
                        </div>
                      </div>
                      <div v-if="paper.paper_authors && paper.paper_authors.length" class="paper-authors">
                        <template v-for="(author, index) in paper.paper_authors" :key="author.id">
                          <span class="author">{{ author.name }}</span>
                          <span v-if="index < paper.paper_authors.length - 1">, </span>
                        </template>
                      </div>
                    </div>

                    <div v-if="!getSessionPapers(session.id).length" class="no-papers">
                      <p>No papers available for this session yet.</p>
                    </div>
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
  </div>
</template>

<style lang="scss" scoped>
@use '../../styles/pages/_sessions.scss' as *;
</style>

