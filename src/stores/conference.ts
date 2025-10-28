import { ref } from 'vue';
import { defineStore } from 'pinia';
import { getConferenceList, ConferenceDetails, getMyPaperDetail, getMyConferenceList } from '@/services/api';
import type { IConferenceEvent, IConferenceParticipation, IPapers, IMyConference } from '@/types/conference';
import { ElMessage } from 'element-plus';

export const useConferenceStore = defineStore('meet', () => {
  const list = ref<IConferenceEvent[]>([]);
<<<<<<< HEAD
  const details = ref<IConferenceParticipation[]>();
  const myConference = ref<IMyConference[]>()
  const myPapers = ref<IPapers>()
  // 获取会议列表
  async function getConferenceList() {
    return await ConferenceList().then((res) => {
      list.value = res.data.items;
      return res;
    });
  }

  //获取会议详情
  async function getConferenceDetails(id: number) {
    return await ConferenceDetails(id).then((res) => {
      details.value = res.data;
      return res;
    });
  }

  //我的会议
  async function getMyConference() {
    return await MyConferences().then((res) => {

      myConference.value = res.data.items
    })
  }

  //获取论文详情
  async function getMyPapers(id: number) {
    try {
      if (!id) {
        ElMessage.error('id is required');
        return;
      }
      const res = await Mypapers(id);
      if (res.status !== 200) {
        ElMessage.error('failed to fetch my papers');
        return;
      }
      myPapers.value = res.data;
      return res;
    } catch (err) {
      console.error('请求失败：', err);
    }
  }

=======
  const details = ref<IConferenceParticipation>();
  const myConferenceList = ref<IMyConference[]>([]);
  const myPaperDetail = ref<IPapers>();

  async function getConferencesList() {
    try {
      const res = await getConferenceList();
      list.value = res.data.items || [];
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
      const res = await ConferenceDetails(id);
      details.value = res.data;
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
      return res;
    } catch (error) {
      console.error('获取论文详情失败:', error);
      throw error;
    }
  }

>>>>>>> 77f9935f741c22c4bae183759e6095ae8494e9fc
  return {
    list,
    details,
    myPaperDetail,
    myConferenceList,
    getConferenceDetails,
    getConferencesList,
    getMyPaper,
    getMyConference,
  };
});
