import { ref } from 'vue';
import { defineStore } from 'pinia';
import { ConferenceList, ConferenceDetails, Mypapers, MyConferences } from '@/services/api'
import type { IConferenceEvent, IConferenceParticipation, IPapers, IMyConference } from '@/types/conference';

export const useConferenceStore = defineStore('meet', () => {
  const list = ref<IConferenceEvent[]>([]);
  const details = ref<IConferenceParticipation>();
  const myConference = ref<IMyConference[]>()
  const myPapers = ref<IPapers>()
  // 获取会议列表
  async function getConferenceList() {
    return await ConferenceList().then((res) => {

      list.value = res.data.items
      return res
    });
  }
  //获取会议详情
  async function getConferenceDetails(id: number) {
    return await ConferenceDetails(id).then((res) => {
      details.value = res.data
      return res
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
      const res = await Mypapers(id);
      myPapers.value = res.data;
      return res;
    } catch (err) {
      console.error("请求失败：", err);
    }
  }


  return {
    list,
    details,
    myPapers,
    myConference,
    getConferenceDetails,
    getConferenceList,
    getMyPapers,
    getMyConference
  };
});
