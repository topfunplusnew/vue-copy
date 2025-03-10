<script lang="ts" setup>
import { ref, onMounted } from 'vue';

const props = defineProps({
  duration: {
    type: Number,
    default: 2000
  }
});

const emit = defineEmits(['complete']);
const isVisible = ref(true);

onMounted(() => {
  // 确保至少显示加载动画的最短时间
  const minLoadTime = setTimeout(() => {
    if (document.readyState === 'complete') {
      startHideAnimation();
    } else {
      window.addEventListener('load', startHideAnimation);
    }
  }, props.duration);

  const startHideAnimation = () => {
    clearTimeout(minLoadTime);
    window.removeEventListener('load', startHideAnimation);
    isVisible.value = false;

    // 加载完成后的延迟，给淡出动画留时间
    setTimeout(() => {
      emit('complete');
    }, 600);
  };
});
</script>

<template>
  <div class="loading-screen" :class="{ 'fade-out': !isVisible }">
    <div class="loading-content">
      <div class="loading-logo">WELCOME TO iPOLOGO</div>
      <div class="loading-spinner">
        <div class="spinner-circle"></div>
      </div>
      <div class="loading-text">...</div>
    </div>
  </div>
</template>

<style scoped>
.loading-screen {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #1a2a6c 0%, #b21f1f 50%, #fdbb2d 100%);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
  transition: opacity 0.6s ease-out;
}

.loading-screen.fade-out {
  opacity: 0;
  pointer-events: none;
}

.loading-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  color: white;
}

.loading-logo {
  font-size: 4rem;
  font-weight: bold;
  margin-bottom: 2rem;
  font-family: 'Lucida Sans', 'Lucida Sans Regular', 'Lucida Grande', Geneva, Verdana, sans-serif;
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
  letter-spacing: 2px;
}

.loading-spinner {
  margin-bottom: 2rem;
}

.spinner-circle {
  width: 60px;
  height: 60px;
  border: 4px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 1s ease-in-out infinite;
}

.loading-text {
  font-size: 1.5rem;
  opacity: 0.8;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

@media (max-width: 768px) {
  .loading-logo {
    font-size: 2rem;
  }
}

@media (max-width: 480px) {
  .loading-logo {
    font-size: 2rem;
  }
}

</style>
