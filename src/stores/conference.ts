import { ref } from 'vue';
import { defineStore } from 'pinia';
import { getConferenceList, getConferenceDetail, getMyPaperDetail, getMyConferenceList, getConferenceIdPaper, getPaperDetail, updateMyPaperDetail } from '@/services/api';
import type { IConferenceEvent, IConferenceParticipation, IPapers, IMyConference } from '@/types/conference';
import type { IModifyPaperShow, IPaper, IpaperDetail } from '@/types/paper'

export const useConferenceStore = defineStore('meet', () => {
  const conferenceList = ref<IConferenceEvent[]>([]);
  const conferenceDetail = ref<IConferenceParticipation>();
  const myConferenceList = ref<IMyConference[]>([]);
  const myPaperDetail = ref<IPapers>();//我的论文详情
  const conferencePaper = ref<IPaper[]>()//会议论文
  const paperDetail = ref<IModifyPaperShow>()

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
      console.log('数据获取完毕', myPaperDetail.value);
      return res;
    });
  }

  function getConferencePaper(id: string, search?: string) {

    return getConferenceIdPaper(id, search).then((res) => {
      conferencePaper.value = res.data.items
    })

  }
  function getPaperDetailAll(id: string) {
    return getPaperDetail(id).then((res) => {
      paperDetail.value = res.data
    })
  }

  // 更新论文的is_open_access状态
  function updateIsOpenAccess(data: IModifyPaperShow) {
    return updateMyPaperDetail(data).then(res => {
      if (res.data) {
        console.log('更新成功', res.data);
        console.log(res.data.paper);
        paperDetail.value.is_open_access = res.data.paper.is_open_access
      }
    });
  }

  return {
    conferencePaper,
    conferenceList,
    conferenceDetail,
    myPaperDetail,
    myConferenceList,
    paperDetail,
    getConferenceDetails,
    getConferencesList,
    getMyPaper,
    getMyConference,
    getConferencePaper,
    getPaperDetailAll,
    updateIsOpenAccess
  };
});
