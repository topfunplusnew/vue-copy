<script setup lang="ts">
import { computed, ref, nextTick, onMounted } from 'vue';
import { formatDate } from '@/utils/date';

interface NewsData {
  id: number;
  title: string;
  content: string;
  author: string;
  publishedAt: string;
  image: string;
  category: string;
  likes: number;
  comments: number;
  readTime: number;
}

const props = defineProps<{
  visible: boolean;
  news: NewsData | null;
}>();

const emit = defineEmits<{
  close: [];
}>();

const isLiked = ref(false);
const isBookmarked = ref(false);
const fontSize = ref('medium');
const readingProgress = ref(0);

const formattedDate = computed(() => {
  if (!props.news?.publishedAt) return '';
  return formatDate(props.news.publishedAt);
});

const closeDialog = () => {
  emit('close');
};

// 计算阅读时间
const readingTime = computed(() => {
  if (!props.news?.content) return 0;
  const wordsPerMinute = 200;
  const wordCount = props.news.content.split(' ').length;
  return Math.ceil(wordCount / wordsPerMinute);
});

// 切换点赞
const toggleLike = () => {
  isLiked.value = !isLiked.value;
};

// 切换收藏
const toggleBookmark = () => {
  isBookmarked.value = !isBookmarked.value;
};

// 分享功能
const shareArticle = () => {
  if (navigator.share) {
    navigator.share({
      title: props.news?.title,
      text: props.news?.content?.substring(0, 150) + '...',
      url: window.location.href
    });
  } else {
    // 复制链接到剪贴板
    navigator.clipboard.writeText(window.location.href);
  }
};

// 字体大小控制
const changeFontSize = (size: string) => {
  fontSize.value = size;
};

// 监听滚动进度
const updateReadingProgress = (event: Event) => {
  const target = event.target as HTMLElement;
  const scrollTop = target.scrollTop;
  const scrollHeight = target.scrollHeight - target.clientHeight;
  readingProgress.value = (scrollTop / scrollHeight) * 100;
};

onMounted(() => {
  // 重置状态
  isLiked.value = false;
  isBookmarked.value = false;
  fontSize.value = 'medium';
  readingProgress.value = 0;
});
</script>

<template>
  <div v-if="visible" class="news-reader-overlay" @click.self="closeDialog">
    <div class="news-reader-container">
      <!-- 阅读进度条 -->
      <div class="reading-progress-bar">
        <div 
          class="progress-fill" 
          :style="{ width: readingProgress + '%' }"
        ></div>
      </div>

      <!-- 顶部工具栏 -->
      <div class="news-toolbar">
        <div class="toolbar-left">
          <button class="tool-btn back-btn" @click="closeDialog">
            <span>←</span>
            <span class="btn-label">Back</span>
          </button>
        </div>
        
        <div class="toolbar-center">
          <div class="font-controls">
            <button 
              class="font-btn" 
              :class="{ active: fontSize === 'small' }"
              @click="changeFontSize('small')"
            >A</button>
            <button 
              class="font-btn" 
              :class="{ active: fontSize === 'medium' }"
              @click="changeFontSize('medium')"
            >A</button>
            <button 
              class="font-btn large" 
              :class="{ active: fontSize === 'large' }"
              @click="changeFontSize('large')"
            >A</button>
          </div>
        </div>

        <div class="toolbar-right">
          <button class="tool-btn share-btn" @click="shareArticle">
            <span>📤</span>
          </button>
          <button class="tool-btn close-btn" @click="closeDialog">
            <span>✕</span>
          </button>
        </div>
      </div>

      <!-- 主要内容区域 -->
      <div class="news-content-wrapper" @scroll="updateReadingProgress">
        <!-- 文章头部 -->
        <article class="news-article" :class="`font-${fontSize}`">
          <!-- 分类标签 -->
          <div class="article-category">
            <span 
              v-if="news?.category"
              class="category-chip"
            >
              {{ news.category }}
            </span>
          </div>

          <!-- 文章标题 -->
          <h1 class="article-headline">{{ news?.title }}</h1>

          <!-- 文章元信息 -->
          <div class="article-meta-section">
            <div class="author-byline">
              <div class="author-avatar">
                <div class="avatar-circle">
                  {{ news?.author?.charAt(0) }}
                </div>
              </div>
              <div class="author-info">
                <div class="author-name">{{ news?.author }}</div>
                <div class="publish-details">
                  <time class="publish-date">{{ formattedDate }}</time>
                  <span class="reading-time">{{ readingTime }} min read</span>
                </div>
              </div>
            </div>
            
            <div class="article-stats">
              <span class="stat-item">{{ news?.likes }} likes</span>
              <span class="stat-item">{{ news?.comments }} comments</span>
            </div>
          </div>

          <!-- 主图 -->
          <div v-if="news?.image" class="article-hero">
            <img :src="news.image" :alt="news.title" class="hero-image" />
          </div>

          <!-- 文章正文 -->
          <div class="article-body">
            <div class="article-text">
              {{ news?.content }}
            </div>
          </div>

          <!-- 文章底部 -->
          <div class="article-footer">
            <!-- 交互按钮 -->
            <div class="interaction-panel">
              <button 
                class="interaction-btn like-btn" 
                :class="{ active: isLiked }"
                @click="toggleLike"
              >
                <span class="btn-icon">{{ isLiked ? '❤️' : '🤍' }}</span>
                <span class="btn-text">{{ isLiked ? 'Liked' : 'Like' }}</span>
                <span class="btn-count">{{ news?.likes }}</span>
              </button>
              
              <button 
                class="interaction-btn bookmark-btn" 
                :class="{ active: isBookmarked }"
                @click="toggleBookmark"
              >
                <span class="btn-icon">{{ isBookmarked ? '🔖' : '📋' }}</span>
                <span class="btn-text">{{ isBookmarked ? 'Saved' : 'Save' }}</span>
              </button>
              
              <button class="interaction-btn share-btn" @click="shareArticle">
                <span class="btn-icon">📤</span>
                <span class="btn-text">Share</span>
              </button>
            </div>

            <!-- 标签区域 -->
            <div class="tags-cloud">
              <div class="tags-label">Related Topics:</div>
              <div class="tags-list">
                <span 
                  v-if="news?.category"
                  class="topic-tag"
                >
                  #{{ news.category }}
                </span>
              </div>
            </div>
          </div>
        </article>
      </div>
    </div>
  </div>
</template>

<style lang="scss">
@use '@/styles/pages/news' as *;
</style>
