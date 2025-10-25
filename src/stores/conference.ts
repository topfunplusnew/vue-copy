import { ref } from 'vue';
import { defineStore } from 'pinia';
import {ConferenceList,ConferenceDetails} from '@/services/api'
import type { IConferenceEvent ,IConferenceParticipation} from '@/types/conference';

export const useConferenceStore = defineStore('meet', () => {
  const list =  ref<IConferenceEvent[]>([]);
  const details = ref<IConferenceParticipation>();

  // 获取会议列表
  async function  getConferenceList() {
      return await ConferenceList().then((res) =>{

        list.value=res.data.items        
        return res
        });
  }

  //获取会议详情
  async function getConferenceDetails(id:number) {
      return await ConferenceDetails(id).then((res) =>{                   
          details.value=res.data
          return res
        });
  }
 

  return {
    list,
    details,
    getConferenceDetails,
    getConferenceList,
   
  };
});
