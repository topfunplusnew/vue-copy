<script setup lang="ts">
import { ref, onMounted } from 'vue';
import LoadingScreen from '@/components/LoadingScreen.vue';
import commonHeader from '@/layout/common-header.vue';
import router from '@/router';


const isLoading = ref(true);
let tid:unknown;


const handleLoadingComplete = () => {
  // 直接设置加载完成，不使用延迟
  isLoading.value = false;
  gotoHome();
};

function gotoHome() {
  if(tid) clearTimeout(tid as number);
  router.replace({
    name: 'home'
  })
}



onMounted(() => {
  // 确保页面始终会显示 - 安全机制
  tid = setTimeout(() => {
    if (isLoading.value) {
      console.log('Done loading');
      isLoading.value = false;
      gotoHome();
    }
  }, 5000);

});



</script>

<template>
  <!-- 加载页 -->
  <LoadingScreen
    v-if="isLoading"
    @complete="handleLoadingComplete"
    :duration="1800"
  />

  <div class="background-layer"></div>
  <div class="home" >
    <common-header />
  </div>
</template>

