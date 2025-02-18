<template>
  <div class="preview-overlay" @click.self="emit('close')">
    <div class="preview-modal">
      <div class="preview-header">
        <h2>Preview</h2>
        <button class="close-button" @click="emit('close')">×</button>
      </div>
      
      <h3 class="post-title">{{ title }}</h3>
      
      <div class="preview-content">
        <div class="preview-layout">
          <!-- 左侧图片区域 -->
          <div class="images-section" v-if="images.length">
            <div class="images-grid">
              <img 
                v-for="(image, index) in images" 
                :key="index" 
                :src="image.url" 
                :alt="`预览图片 ${index + 1}`"
                @click="showLargeImage(image.url)"
              />
            </div>
          </div>

          <!-- 右侧内容区域 -->
          <div class="content-section">
            <div class="preferences-container" v-if="preferences.length">
              <span v-for="pref in preferences" :key="pref" class="preference-tag">
                <span class="preference-icon">{{ getPreferenceIcon(pref) }}</span>
                <span class="preference-name">{{ pref }}</span>
              </span>
            </div>
            
            <p class="post-content">{{ content }}</p>
            
            <div class="tags-container" v-if="tags.length">
              <span v-for="tag in tags" :key="tag" class="tag">
                {{ tag }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

defineProps<{
  title: string
  content: string
  images: { url: string }[]
  tags: string[]
  preferences: string[]
}>()

const emit = defineEmits<{
  close: []
}>()

const showLargeImage = (imageUrl: string) => {
  // 可以在这里添加点击图片放大的逻辑
  console.log('Show large image:', imageUrl);
}

// 添加图标映射函数
const getPreferenceIcon = (preference: string): string => {
  const iconMap: { [key: string]: string } = {
    'Sightseeing': '🌆',
    'Educational': '🎓',
    'Business': '💼',
    'Medical': '🏥',
    'Gastronomy': '🍴',
    'Culture': '🎭'
  };
  return iconMap[preference] || '';
};
</script>

<style lang="scss">
@import '@/styles/_postpreview.scss';
</style>