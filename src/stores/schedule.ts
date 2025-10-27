import { defineStore } from 'pinia';
import type { IScheduleEvent } from '@/types/schedule.ts';
import { getScheduleList } from '@/services/api.ts';
import { ref } from 'vue';
import { ElMessage } from 'element-plus';
// 日历日程的列表获取
export const useScheduleStore = defineStore('schedule', () => {
  const conferenceEvents = ref<IScheduleEvent[]>([]);

  async function fetchScheduleData() {
    const response = await getScheduleList();
    if (response.status !== 200) {
      ElMessage.error('failed to get schedule data');
      return;
    }
    conferenceEvents.value = response.data;
  }

  return {
    conferenceEvents,
    fetchScheduleData,
  };
});
