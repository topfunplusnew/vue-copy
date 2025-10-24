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
    // 合并请求
  // async function getAllConferenceData(id = 4) {
  //   try {
  //     //
  //     const [list, detail] = await Promise.all([
  //       ConferenceList(),
  //       ConferenceDetails(id)
  //     ])
  //     Data.value = list.data.items
  //     Details.value = detail.data
  //     return { list, detail }
  //   } catch (err) {
  //     console.error('获取会议数据失败:', err)
  //     throw err
  //   }
  // }

  return {
    list,
    details,
    getConferenceDetails,
    getConferenceList,
    //getAllConferenceData
  };
});
