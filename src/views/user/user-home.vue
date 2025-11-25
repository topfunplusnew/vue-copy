<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { getMyConferences } from '@/services/user';
import { getImageUrl } from '@/utils';
import type { MyConference } from '@/services/user/type';

const conferences = ref<MyConference[]>([]);
const loading = ref(false);

// 获取我的会议列表
const fetchMyConferences = async () => {
  loading.value = true;
  try {
    const response = await getMyConferences({
      include_papers: true,
      sort_by: 'start_time',
      sort_order: 'desc',
    });
    conferences.value = response.data?.items || [];
  } catch (error) {
    console.error('Failed to fetch my conferences:', error);
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  fetchMyConferences();
});
</script>

<template>
  <div class="home-area" v-loading="loading">
    <div class="conferences-grid">
      <div
        v-for="conference in conferences"
        :key="conference.id"
        class="conference-logo-item"
      >
        <img
          v-if="conference.logo"
          :src="getImageUrl(conference.logo)"
          :alt="conference.name || 'Conference Logo'"
          class="conference-logo"
        />
      </div>
    </div>
    <div v-if="!loading && conferences.length === 0" class="empty-state">
      <p>No conferences found</p>
    </div>
  </div>
</template>

<style scoped>
.home-area {
  padding: 20px;
  height: 100%;
  width: 100%;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  overflow-y: auto;
}

.conferences-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 24px;
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
}

.conference-logo-item {
  width: 100%;
  aspect-ratio: 1;
  border-radius: 16px;
  overflow: hidden;
  background: #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s, box-shadow 0.3s;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  box-sizing: border-box;
}

.conference-logo-item:hover {
  transform: translateY(-4px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
}

.conference-logo {
  width: 100%;
  height: 100%;
  object-fit: contain;
  border-radius: 8px;
}

.empty-state {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #999;
  font-size: 16px;
}

/* 移动端响应式样式 */
@media (max-width: 768px) {
  .home-area {
    padding: 10px;
  }

  .conferences-grid {
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: 16px;
  }

  .conference-logo {
    padding: 12px;
  }
}
</style>

