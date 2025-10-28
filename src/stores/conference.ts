import { ref } from 'vue';
import { defineStore } from 'pinia';
import { getConferenceList, getConferenceDetail, getMyPaperDetail, getMyConferenceList } from '@/services/api';
import type { IConferenceEvent, IConferenceParticipation, IPapers, IMyConference } from '@/types/conference';

export const useConferenceStore = defineStore('meet', () => {
  const conferenceList = ref<IConferenceEvent[]>([]);
  const conferenceDetail = ref<IConferenceParticipation>();
  const myConferenceList = ref<IMyConference[]>([]);
  const myPaperDetail = ref<IPapers>();

  async function getConferencesList() {
    try {
      const res = await getConferenceList();
      conferenceList.value = res.data.items || [];
      return res;
    } catch (error) {
      console.error('获取会议列表失败:', error);
      throw error;
    }
  }

  async function getConferenceDetails(id: number) {
    if (!id || id <= 0) {
      throw new Error('无效的会议ID');
    }

    try {
      const res = await getConferenceDetail(id);
      conferenceDetail.value = res.data;
      return res;
    } catch (error) {
      console.error('获取会议详情失败:', error);
      throw error;
    }
  }

  async function getMyConference() {
    try {
      const res = await getMyConferenceList();
      myConferenceList.value = res.data.items || [];
      return res;
    } catch (error) {
      console.error('获取我的会议失败:', error);
      throw error;
    }
  }

  async function getMyPaper(id: number) {
    if (!id || id <= 0) {
      throw new Error('无效的会议ID');
    }
    try {
      const res = await getMyPaperDetail(id);
      myPaperDetail.value = res.data;
      console.log('数据获取完毕', myPaperDetail.value);
      return res;
    } catch (error) {
      console.error('获取论文详情失败:', error);
      throw error;
    }
  }

  return {
    conferenceList,
    conferenceDetail,
    myPaperDetail,
    myConferenceList,
    getConferenceDetails,
    getConferencesList,
    getMyPaper,
    getMyConference,
  };
});
