import { ref } from 'vue';
import { defineStore } from 'pinia';
import { getConferenceList, getConferenceDetail, getMyPaperDetail, getMyConferenceList, getConferenceIdPaper } from '@/services/api';
import type { IConferenceEvent, IConferenceParticipation, IPapers, IMyConference } from '@/types/conference';
import type { IPaper, page } from '@/types/paper'

export const useConferenceStore = defineStore('meet', () => {
  const conferenceList = ref<IConferenceEvent[]>([]);
  const conferenceDetail = ref<IConferenceParticipation>();
  const myConferenceList = ref<IMyConference[]>([]);
  const myPaperDetail = ref<IPapers>();
  const conferencePaper = ref<IPaper[]>()

  function getConferencesList() {
    return getConferenceList().then(res => {
      conferenceList.value = res.data.items || [];
      return res;
    });
  }

  function getConferenceDetails(id: number | string) {
    return getConferenceDetail(id).then(res => {
      conferenceDetail.value = res.data;
      return res
    })
  }

  function getMyConference() {

    return getMyConferenceList().then(res => {
      myConferenceList.value = res.data.items;
      return res;
    });

  }

  function getMyPaper(id: number) {
    if (!id || id <= 0) {
      throw new Error('无效的会议ID');
    }

    return getMyPaperDetail(id).then((res) => {
      myPaperDetail.value = res.data;
      return res;
    });
  }

  function getConferencePaper(id: string, search?: string) {

    return getConferenceIdPaper(id, search).then((res) => {
      conferencePaper.value = res.data.items
    })

  }


  return {
    conferencePaper,
    conferenceList,
    conferenceDetail,
    myPaperDetail,
    myConferenceList,
    getConferenceDetails,
    getConferencesList,
    getMyPaper,
    getMyConference,
    getConferencePaper
  };
});
