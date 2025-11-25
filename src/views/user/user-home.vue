<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { getUserAchievements } from '@/services/user';
import { getImageUrl } from '@/utils';
import type { UserAchievementsResponse } from '@/services/user/type';
import { formatRange } from '@/utils/date';
import { ElMessage } from 'element-plus';

const achievements = ref<UserAchievementsResponse | null>(null);
const loading = ref(false);
const selectedConferenceId = ref<number | null>(null);

// 获取用户成就数据
const fetchUserAchievements = async () => {
  loading.value = true;
  try {
    const response = await getUserAchievements();
    if (response.data) {
      achievements.value = response.data;
      // 默认选中第一个会议
      if (response.data.conferences && response.data.conferences.length > 0) {
        selectedConferenceId.value = response.data.conferences[0].id;
      }
    }
  } catch (error) {
    console.error('Failed to fetch user achievements:', error);
    ElMessage.error('Failed to load achievements. Please try again later.');
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  fetchUserAchievements();
});

// 选中的会议
const selectedConference = computed(() => {
  if (!achievements.value || !selectedConferenceId.value) return null;
  return achievements.value.conferences.find(c => c.id === selectedConferenceId.value) || null;
});

// 选中会议的所有 papers（Presentations）
const selectedConferencePapers = computed(() => {
  if (!achievements.value || !selectedConferenceId.value) return [];
  return achievements.value.papers.filter(p => p.conference_id === selectedConferenceId.value);
});

// 选中会议的所有 sessions（Chaired Sessions）
const selectedConferenceSessions = computed(() => {
  if (!achievements.value || !selectedConferenceId.value) return [];
  return achievements.value.sessions.filter(s => s.conference_id === selectedConferenceId.value);
});

// 选择会议
const selectConference = (conferenceId: number) => {
  selectedConferenceId.value = conferenceId;
};

// 格式化日期
const formatDate = (dateString: string) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
};

// 格式化时间范围
const formatTimeRange = (startTime: string, endTime: string) => {
  if (!startTime) return '';
  return formatRange(startTime, endTime);
};
</script>

<template>
  <div class="home-area" v-loading="loading">
    <div class="home-container">
      <!-- 左侧：Events 部分 -->
      <div class="events-section">
        <h2 class="section-title">
          <span class="title-icon">📅</span>
          Events
        </h2>
        <div class="events-grid">
          <div
            v-for="conference in achievements?.conferences || []"
            :key="conference.id"
            class="event-item"
            :class="{ active: selectedConferenceId === conference.id }"
            @click="selectConference(conference.id)"
          >
            <div class="event-logo-container">
              <img
                v-if="conference.logo"
                :src="getImageUrl(conference.logo)"
                :alt="conference.name || 'Conference Logo'"
                class="event-logo"
              />
              <div v-else class="event-logo-placeholder">
                {{ conference.abbreviation?.charAt(0) || conference.name?.charAt(0) || '?' }}
              </div>
            </div>
            <div class="event-info">
              <div class="event-name">{{ conference.abbreviation || conference.name }}</div>
              <div class="event-year">{{ new Date(conference.start_time).getFullYear() }}</div>
            </div>
          </div>
        </div>
        <div v-if="!loading && (!achievements?.conferences || achievements.conferences.length === 0)" class="empty-state">
          <div class="empty-icon">📅</div>
          <p>No events found</p>
        </div>
      </div>

      <!-- 右侧：Contributions 部分 -->
      <div class="contributions-section">
        <div v-if="selectedConference" class="contributions-content">
          <div class="contributions-header">
            <h2 class="section-title">
              <span class="title-icon">📊</span>
              Contributions
            </h2>
            <div class="conference-title">
              <span class="info-icon">🏛️</span>
              {{ selectedConference.name }}
            </div>
            <div class="conference-location">
              <span class="info-icon">📍</span>
              {{ selectedConference.city }}, {{ selectedConference.country }}
            </div>
            <div class="conference-date">
              <span class="info-icon">📆</span>
              {{ formatTimeRange(selectedConference.start_time, selectedConference.end_time) }}
            </div>
          </div>

          <!-- Presentations 部分 -->
          <div class="contributions-subsection">
            <h3 class="subsection-title">
              <span class="subsection-icon">📝</span>
              Presentations
            </h3>
            <div v-if="selectedConferencePapers.length === 0" class="empty-subsection">
              <p>No presentations found</p>
            </div>
            <div v-else class="presentations-list">
              <div
                v-for="paper in selectedConferencePapers"
                :key="paper.id"
                class="presentation-item"
              >
                <div class="presentation-title">
                  <span v-if="paper.presentation_type" class="presentation-type">
                    {{ paper.presentation_type }}:
                  </span>
                  <span class="paper-icon">📄</span>
                  {{ paper.paper_title }}
                </div>
                <div v-if="paper.paper_doi" class="presentation-doi">
                  <span class="meta-icon">🔗</span>
                  DOI: {{ paper.paper_doi }}
                </div>
                <div v-if="paper.session_name" class="presentation-session">
                  <span class="meta-icon">🎯</span>
                  Session: {{ paper.session_name }}
                </div>
                <div v-if="paper.presentation_time" class="presentation-time">
                  <span class="meta-icon">⏰</span>
                  {{ formatDate(paper.presentation_time) }}
                </div>
              </div>
            </div>
          </div>

          <!-- Chaired Sessions 部分 -->
          <div class="contributions-subsection">
            <h3 class="subsection-title">
              <span class="subsection-icon">👤</span>
              Chaired Sessions
            </h3>
            <div v-if="selectedConferenceSessions.length === 0" class="empty-subsection">
              <p>No chaired sessions found</p>
            </div>
            <div v-else class="sessions-list">
              <div
                v-for="session in selectedConferenceSessions"
                :key="session.id"
                class="session-item"
              >
                <div class="session-title">
                  <span class="session-icon">🎪</span>
                  {{ session.session_name }}
                </div>
                <div class="session-number">
                  <span class="meta-icon">#</span>
                  {{ session.session_number }}
                </div>
                <div v-if="session.topic" class="session-topic">
                  <span class="meta-icon">🔍</span>
                  Topic: {{ session.topic }}
                </div>
                <div class="session-time">
                  <span class="meta-icon">⏰</span>
                  {{ formatTimeRange(session.start_time, session.end_time) }}
                </div>
                <div v-if="session.room_info" class="session-room">
                  <span class="meta-icon">🏢</span>
                  Room: {{ session.room_info }}
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 未选择会议时的空状态 -->
        <div v-else-if="!loading" class="empty-contributions">
          <div class="empty-icon">📋</div>
          <p>Select an event to view contributions</p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.home-area {
  padding: 0;
  height: 100%;
  width: 100%;
  box-sizing: border-box;
  overflow-y: auto;
  background-color: transparent;
}

.home-container {
  display: flex;
  gap: 40px;
  width: 100%;
  height: 100%;
  padding: 0 20px;
  align-items: flex-start;
  box-sizing: border-box;
}

/* 左侧 Events 部分 */
.events-section {
  flex: 0 0 300px;
  display: flex;
  flex-direction: column;
  padding-top: 0;
  margin-top: 0;
  align-items: flex-start;
}

.section-title {
  font-size: 24px;
  font-weight: 600;
  color: #1a3566;
  margin-top: 0;
  margin-bottom: 24px;
  padding: 12px 20px;
  padding-bottom: 12px;
  background: rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(5px);
  border-radius: 8px;
  border: 1px solid rgba(26, 53, 102, 0.1);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  width: 100%;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  text-align: center;
}

.title-icon {
  font-size: 20px;
  display: inline-block;
}

.events-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
  flex: 1;
  overflow-y: auto;
}

.event-item {
  aspect-ratio: 1;
  border-radius: 12px;
  overflow: hidden;
  background: #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  padding: 12px;
  box-sizing: border-box;
  border: 2px solid transparent;
}

.event-item:hover {
  transform: translateY(-4px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
}

.event-item.active {
  border-color: #627180;
  box-shadow: 0 4px 16px rgba(26, 53, 102, 0.2);
}

.event-logo-container {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f5f5f5;
  border-radius: 8px;
  margin-bottom: 8px;
  overflow: hidden;
}

.event-logo {
  width: 100%;
  height: 100%;
  object-fit: contain;
  padding: 8px;
}

.event-logo-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 48px;
  font-weight: bold;
  color: #999;
  background: #e0e0e0;
}

.event-info {
  text-align: center;
  width: 100%;
}

.event-name {
  font-size: 14px;
  font-weight: 600;
  color: #1a3566;
  margin-bottom: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.event-year {
  font-size: 12px;
  color: #1a3566;
  opacity: 0.7;
}

/* 右侧 Contributions 部分 */
.contributions-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 12px;
  padding: 32px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(26, 53, 102, 0.1);
  overflow-y: auto;
  align-self: flex-start;
}

.contributions-content {
  display: flex;
  flex-direction: column;
  gap: 32px;
}

.contributions-header {
  border-bottom: 2px solid rgba(26, 53, 102, 0.2);
  padding-bottom: 24px;
}

.conference-title {
  font-size: 20px;
  font-weight: 600;
  color: #1a3566;
  margin-top: 16px;
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  text-align: center;
}

.conference-location {
  font-size: 14px;
  color: #1a3566;
  opacity: 0.8;
  margin-bottom: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  text-align: center;
}

.conference-date {
  font-size: 14px;
  color: #1a3566;
  opacity: 0.8;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  text-align: center;
}

.info-icon {
  font-size: 16px;
  flex-shrink: 0;
}

.contributions-subsection {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.subsection-title {
  font-size: 18px;
  font-weight: 600;
  color: #1a3566;
  margin-bottom: 8px;
  padding-bottom: 8px;
  border-bottom: 1px solid rgba(26, 53, 102, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  text-align: center;
}

.subsection-icon {
  font-size: 18px;
}

.presentations-list,
.sessions-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.presentation-item,
.session-item {
  padding: 16px;
  background: rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(5px);
  border-radius: 8px;
  border-left: 3px solid #627180;
  transition: all 0.2s ease;
  border: 1px solid rgba(26, 53, 102, 0.1);
}

.presentation-item:hover,
.session-item:hover {
  background: rgba(255, 255, 255, 0.8);
  box-shadow: 0 2px 8px rgba(26, 53, 102, 0.1);
  transform: translateY(-2px);
}

.presentation-title {
  font-size: 15px;
  font-weight: 500;
  color: #1a3566;
  line-height: 1.5;
  margin-bottom: 8px;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  gap: 6px;
  text-align: center;
}

.paper-icon {
  font-size: 16px;
  flex-shrink: 0;
  margin-top: 2px;
}

.presentation-type {
  font-weight: 600;
  color: #627180;
}

.presentation-doi,
.presentation-session,
.presentation-time {
  font-size: 13px;
  color: #1a3566;
  opacity: 0.7;
  margin-top: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  text-align: center;
}

.meta-icon {
  font-size: 14px;
  flex-shrink: 0;
}

.session-title {
  font-size: 15px;
  font-weight: 500;
  color: #1a3566;
  margin-bottom: 6px;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  gap: 6px;
  text-align: center;
}

.session-icon {
  font-size: 16px;
  flex-shrink: 0;
  margin-top: 2px;
}

.session-number {
  font-size: 13px;
  color: #627180;
  font-weight: 600;
  margin-bottom: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  text-align: center;
}

.session-topic,
.session-time,
.session-room {
  font-size: 13px;
  color: #1a3566;
  opacity: 0.7;
  margin-top: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  text-align: center;
}

.empty-state,
.empty-contributions,
.empty-subsection {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  color: #1a3566;
  opacity: 0.6;
  text-align: center;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.empty-subsection {
  padding: 20px;
  font-size: 14px;
}

/* 移动端响应式样式 */
@media (max-width: 1024px) {
  .home-container {
    flex-direction: column;
    gap: 24px;
    padding: 0 15px;
  }

  .events-section {
    flex: 0 0 auto;
    width: 100%;
  }

  .events-grid {
    grid-template-columns: repeat(3, 1fr);
    gap: 12px;
  }

  .contributions-section {
    width: 100%;
  }
}

@media (max-width: 768px) {
  .home-area {
    padding: 0;
    margin: 0;
  }

  .home-container {
    padding: 0 10px;
    gap: 20px;
    margin-top: 0;
  }

  .events-section {
    width: 100%;
    padding-top: 0;
    margin-top: 0;
  }

  .section-title {
    font-size: 20px;
    padding: 10px 15px;
    margin-top: 0;
    margin-bottom: 20px;
  }

  .title-icon {
    font-size: 18px;
  }

  .events-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }

  .event-item {
    padding: 10px;
  }

  .event-name {
    font-size: 13px;
  }

  .event-year {
    font-size: 11px;
  }

  .contributions-section {
    padding: 20px 15px;
    width: 100%;
  }

  .contributions-content {
    gap: 24px;
  }

  .contributions-header {
    padding-bottom: 20px;
    text-align: center;
  }

  .conference-title {
    font-size: 18px;
    margin-top: 12px;
    margin-bottom: 6px;
  }

  .conference-location,
  .conference-date {
    font-size: 13px;
    margin-bottom: 3px;
  }

  .subsection-title {
    font-size: 16px;
    margin-bottom: 12px;
    padding-bottom: 6px;
  }

  .subsection-icon {
    font-size: 16px;
  }

  .presentation-item,
  .session-item {
    padding: 12px;
  }

  .presentation-title {
    font-size: 14px;
    margin-bottom: 6px;
  }

  .paper-icon {
    font-size: 14px;
  }

  .presentation-doi,
  .presentation-session,
  .presentation-time {
    font-size: 12px;
    margin-top: 3px;
  }

  .session-title {
    font-size: 14px;
    margin-bottom: 5px;
  }

  .session-icon {
    font-size: 14px;
  }

  .session-number {
    font-size: 12px;
    margin-bottom: 5px;
  }

  .session-topic,
  .session-time,
  .session-room {
    font-size: 12px;
    margin-top: 3px;
  }

  .meta-icon {
    font-size: 12px;
  }

  .info-icon {
    font-size: 14px;
  }
}

@media (max-width: 480px) {
  .home-area {
    padding: 0;
    margin: 0;
  }

  .home-container {
    padding: 0 8px;
    gap: 16px;
    margin-top: 0;
  }

  .events-section {
    padding-top: 0;
    margin-top: 0;
  }

  .section-title {
    font-size: 18px;
    padding: 8px 12px;
    margin-top: 0;
    margin-bottom: 16px;
  }

  .title-icon {
    font-size: 16px;
  }

  .events-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 10px;
  }

  .event-item {
    padding: 8px;
  }

  .event-logo-container {
    margin-bottom: 6px;
  }

  .event-name {
    font-size: 12px;
  }

  .event-year {
    font-size: 10px;
  }

  .contributions-section {
    padding: 16px 12px;
  }

  .contributions-content {
    gap: 20px;
  }

  .contributions-header {
    padding-bottom: 16px;
  }

  .conference-title {
    font-size: 16px;
    margin-top: 10px;
    margin-bottom: 5px;
  }

  .conference-location,
  .conference-date {
    font-size: 12px;
  }

  .subsection-title {
    font-size: 15px;
    margin-bottom: 10px;
  }

  .presentations-list,
  .sessions-list {
    gap: 12px;
  }

  .presentation-item,
  .session-item {
    padding: 10px;
  }

  .presentation-title {
    font-size: 13px;
    flex-wrap: wrap;
  }

  .session-title {
    font-size: 13px;
    flex-wrap: wrap;
  }

  .empty-state,
  .empty-contributions,
  .empty-subsection {
    padding: 30px 15px;
  }

  .empty-icon {
    font-size: 36px;
    margin-bottom: 12px;
  }
}
</style>
