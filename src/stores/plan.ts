import { ref } from 'vue';
import { defineStore } from 'pinia';


export const usePlanStore = defineStore('plan', () => {
  const plan = ref<IPlan>();

  return {
    plan
  }
})