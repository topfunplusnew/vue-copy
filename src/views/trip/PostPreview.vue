<template>
  <div class="background-layer"></div>
  <div class="blog-detail-overlay" @click.self="emit('close')">
    <div class="blog-detail-container">
      <!-- 关闭按钮 -->
      <button class="close-button" @click="emit('close')">×</button>

      <!-- 放大 Preview 标签 -->
      <div class="preview-label">Preview</div>
      
      <!-- 左侧内容区域 -->
      <div class="detail-left">
        <!-- 顶部信息栏 -->
        <div class="detail-header">
          <div class="header-content">
            <h2 class="blog-title">{{ title }}</h2>
            <div class="post-stats">
              <span class="stat-item">
                <span class="stat-icon">❤️</span>
                <span>0</span>
              </span>
              <span class="stat-item">
                <span class="stat-icon">💬</span>
                <span>0</span>
              </span>
            </div>
          </div>
        </div>

        <!-- 图片区域 -->
        <div class="image-section" v-if="images.length">
          <div class="image-slider">
            <div class="image-wrapper" :style="{ transform: `translateX(-${currentImageIndex * 100}%)` }">
              <img 
                v-for="(image, index) in images" 
                :key="index"
                :src="getImageUrl(image)"
                alt="Blog Image" 
                class="detail-image"
              />
            </div>
            
            <!-- 添加导航按钮 -->
            <button 
              v-if="images.length > 1" 
              class="nav-btn prev" 
              @click.stop="prevImage"
            >❮</button>
            <button 
              v-if="images.length > 1" 
              class="nav-btn next" 
              @click.stop="nextImage"
            >❯</button>

            <!-- 添加指示器 -->
            <div class="image-indicators" v-if="images.length > 1">
              <span
                v-for="(_, index) in images"
                :key="index"
                class="indicator"
                :class="{ active: currentImageIndex === index }"
                @click.stop="currentImageIndex = index"
              ></span>
            </div>
          </div>
        </div>

        <!-- 添加评论区域 -->
        <div class="comments-container">
          <div class="comments-header">
            <h3>Comments</h3>
            <span class="comment-count">0</span>
          </div>
          <!-- 添加评论输入框 -->
          <div class="comment-input-container">
            <el-input
              v-model="commentText"
              type="textarea"
              :rows="2"
              placeholder="Add a comment..."
              class="comment-input"
            />
          </div>
        </div>
      </div>

      <!-- 右侧内容区域 -->
      <div class="detail-right">
        <!-- 偏好标签区域 -->
        <div class="tags-section" v-if="preferences.length">
          <span v-for="pref in preferences" :key="pref" class="tag">
            {{ pref }}
          </span>
        </div>

        <!-- 博客内容 -->
        <div class="content-section">
          <p class="blog-content">{{ content }}</p>
        </div>

        <!-- 标签区域 -->
        <div class="tags-section" v-if="tags.length">
          <span v-for="tag in tags" :key="tag" class="tag">
            {{ tag }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { getImageUrl } from '@/utils';

const currentImageIndex = ref(0);

const props = defineProps<{
  title: string
  content: string
  images: string[]
  tags: string[]
  preferences: number[]
}>();

const emit = defineEmits<{
  close: []
}>();

const commentText = ref(''); // 添加评论文本

// 添加图片导航方法
const prevImage = () => {
  if (currentImageIndex.value > 0) {
    currentImageIndex.value--;
  } else {
    currentImageIndex.value = props.images.length - 1;
  }
};

const nextImage = () => {
  if (currentImageIndex.value < props.images.length - 1) {
    currentImageIndex.value++;
  } else {
    currentImageIndex.value = 0;
  }
};

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