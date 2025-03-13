<template>
  <div class="background-layer"></div>
  <div class="blog-detail-overlay-postp" @click.self="emit('close')">
    <div class="blog-detail-container">
      <!-- 关闭按钮 -->
      <button class="close-button" @click="emit('close')">×</button>

      <!-- 放大 Preview 标签 -->
      <div class="preview-label">Preview</div>

      <!-- 左侧内容区域 -->
      <div class="detail-left">

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
      </div>

      <!-- 右侧内容区域 -->
      <div class="detail-right">
        <div class="blog-title-section">
          <p class="blog-title">{{ title }}</p>
        </div>

        <!-- 偏好标签区域 -->
        <div class="tags-section" v-if="list.length">
          <span v-for="(item, index) in list" :key="index" 
          class="tag-pref">
            {{ item.name }} {{ item.icon }}
          </span>
        </div>

        <!-- 标签区域 -->
        <div class="tags-section" v-if="tags.length">
          <span v-for="tag in tags" :key="tag" class="tag">
            {{ tag }}
          </span>
        </div>

        <!-- 博客内容 -->
        <div class="content-section">
          <p class="blog-content">{{ content }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { getImageUrl } from '@/utils';
import type { ISocialFilter } from '@/types/blog';

const currentImageIndex = ref(0);

const props = defineProps<{
  title: string
  content: string
  images: string[]
  tags: string[]
  preferences: number[]
  socialFilters: ISocialFilter[]
  location:string[]
}>();

const emit = defineEmits<{
  close: []
}>();


const list = computed(() =>{
  const arr:ISocialFilter[] = [];
  for(const item of props.socialFilters) {
    if(props.preferences.includes(item.id)) arr.push(item);
  }
  return arr;
});

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


// 添加图标映射函数
</script>

<style lang="scss">
@import '@/styles/_postpreview.scss';
</style>
