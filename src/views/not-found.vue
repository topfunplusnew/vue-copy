<script setup lang="ts">
import { useRouter } from 'vue-router';
import commonHeader from '@/layout/common-header.vue';

const router = useRouter();

const goHome = () => {
  router.push({ name: 'home' });
};
</script>

<template>
  <div class="background-layer"></div>
  <commonHeader />
  <div class="not-found layout-main">
    <div class="not-found-content">
      <div class="error-code">404</div>
      <h1 class="error-title">Page Not Found</h1>
      <p class="error-description">The page you are looking for doesn't exist or has been moved.</p>
      <button class="home-button" @click="goHome">Back to Home</button>
    </div>
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/pages/_404.scss' as *;
</style>
