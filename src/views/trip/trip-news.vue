<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import { getImageUrl } from '@/utils';
import { formatDate } from '@/utils/date';

import commonHeader from '@/layout/common-header.vue';
import TripNewsDialog from './trip-news-dialog.vue';

const selectedNews = ref(null);
const dialogVisible = ref(false);
const searchQuery = ref('');
const selectedCategory = ref('Top');
const isLoading = ref(false);

// 新闻分类配置
const newsCategories = [
  { id: 'Top', name: 'Top', icon: '🔥' },
  { id: 'ForYou', name: 'For You', icon: '✨' },
  { id: 'Travel', name: 'Travel', icon: '✈️' },
  { id: 'Finance', name: 'Finance', icon: '₿' },
  { id: 'Healthcare', name: 'Healthcare', icon: '🏥' },
  { id: 'Sports', name: 'Sports', icon: '⚽' }
];

// 模拟新闻数据
const mockNews = ref([
  {
    id: 1,
    title: "Top Travel Destinations for 2024: Hidden Gems Around the World",
    content: "Discover the most breathtaking and lesser-known destinations that are perfect for your next adventure. From secluded beaches to mountain retreats, these locations offer unique experiences away from the crowds.",
    category: 'Travel',
    author: 'Travel Explorer',
    publishedAt: '2024-01-15T10:30:00Z',
    readTime: 5,
    image: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=800',
    featured: true,
    likes: 234,
    comments: 45
  },
  {
    id: 2,
    title: "Global Economy Shows Signs of Recovery in Q4 2024",
    content: "Economic indicators point to a steady recovery across major markets, with GDP growth exceeding expectations in several regions. Expert analysis reveals key factors driving this positive trend.",
    category: 'Finance',
    author: 'Financial Analyst',
    publishedAt: '2024-01-14T14:20:00Z',
    readTime: 3,
    image: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800',
    featured: false,
    likes: 189,
    comments: 67
  },
  {
    id: 3,
    title: "Champions League: Stunning Upset in Quarter-Finals",
    content: "Last night's match delivered one of the most surprising results of the tournament, with the underdog team securing a historic victory that has fans and analysts talking.",
    category: 'Sports',
    author: 'Sports Reporter',
    publishedAt: '2024-01-14T09:15:00Z',
    readTime: 4,
    image: 'https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?w=800',
    featured: false,
    likes: 456,
    comments: 123
  },
  {
    id: 4,
    title: "Sustainable Travel: How to Reduce Your Carbon Footprint",
    content: "Learn practical tips and strategies for environmentally conscious travel. From choosing eco-friendly accommodations to sustainable transportation options.",
    category: 'Travel',
    author: 'Eco Traveler',
    publishedAt: '2024-01-13T16:45:00Z',
    readTime: 6,
    image: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800',
    featured: false,
    likes: 167,
    comments: 89
  },
  {
    id: 5,
    title: "Tech Stocks Rally as AI Sector Shows Unprecedented Growth",
    content: "The artificial intelligence sector continues to drive market gains, with major tech companies reporting record-breaking revenues from AI-related services and products.",
    category: 'Finance',
    author: 'Market Analyst',
    publishedAt: '2024-01-13T11:30:00Z',
    readTime: 4,
    image: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800',
    featured: true,
    likes: 312,
    comments: 78
  },
  {
    id: 6,
    title: "Olympic Training: Athletes Prepare for Paris 2024",
    content: "With months to go before the Paris Olympics, athletes around the world are in the final stages of preparation. Get an inside look at their training regimens and aspirations.",
    category: 'Sports',
    author: 'Olympic Correspondent',
    publishedAt: '2024-01-12T13:20:00Z',
    readTime: 7,
    image: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=800',
    featured: false,
    likes: 203,
    comments: 56
  },
  {
    id: 7,
    title: "Breakthrough in Cancer Treatment: New Immunotherapy Shows Promise",
    content: "Researchers at leading medical institutions report significant progress in cancer immunotherapy, with clinical trials showing improved patient outcomes and reduced side effects.",
    category: 'Healthcare',
    author: 'Medical Correspondent',
    publishedAt: '2024-01-15T08:45:00Z',
    readTime: 6,
    image: 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=800',
    featured: false,
    likes: 312,
    comments: 89
  },
  {
    id: 8,
    title: "Mental Health Awareness: Digital Therapy Platforms on the Rise",
    content: "The growing adoption of digital mental health platforms is transforming how people access therapy and support, making mental healthcare more accessible than ever before.",
    category: 'Healthcare',
    author: 'Health Tech Reporter',
    publishedAt: '2024-01-14T11:30:00Z',
    readTime: 5,
    image: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=800',
    featured: false,
    likes: 267,
    comments: 134
  }
]);

// 筛选新闻
const filteredNews = computed(() => {
  let filtered = mockNews.value;
  
  // 按分类筛选
  if (selectedCategory.value !== 'Top' && selectedCategory.value !== 'ForYou') {
    filtered = filtered.filter(news => news.category === selectedCategory.value);
  }
  
  // 按搜索关键词筛选
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase();
    filtered = filtered.filter(news => 
      news.title.toLowerCase().includes(query) ||
      news.content.toLowerCase().includes(query) ||
      news.author.toLowerCase().includes(query)
    );
  }
  
  return filtered;
});

// 特色新闻（第一篇）
const featuredNews = computed(() => {
  const featured = filteredNews.value.find(news => news.featured);
  return featured || filteredNews.value[0];
});

// 普通新闻（除特色外的其他新闻）
const regularNews = computed(() => {
  return filteredNews.value.filter(news => news.id !== featuredNews.value?.id);
});

// 选择分类
const selectCategory = (category: string) => {
  selectedCategory.value = category;
  searchQuery.value = '';
};

// 搜索新闻
const searchNews = () => {
  // 搜索功能通过computed属性自动执行
};

// 显示新闻详情
const showNewsDetail = (news: any) => {
  // 直接传递新闻数据给弹窗
  selectedNews.value = news;
  dialogVisible.value = true;
};

// 关闭详情弹窗
const closeDialog = () => {
  dialogVisible.value = false;
};

// 加载更多
const loadMore = () => {
  isLoading.value = true;
  setTimeout(() => {
    isLoading.value = false;
    ElMessage.success('More news loaded');
  }, 1000);
};

// 截断文本
const truncateText = (text: string, maxLength: number) => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

// 格式化时间
const formatTime = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - date.getTime());
  const diffHours = Math.ceil(diffTime / (1000 * 60 * 60));
  
  if (diffHours < 24) {
    return `${diffHours}h ago`;
  } else {
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  }
};

onMounted(() => {
  // 初始化数据
});
</script>

<template>
  <div class="background-layer"></div>
  <div class="news-hub layout-main">
    <!-- Header -->
    <common-header />

    <!-- News Header -->
    <div class="news-header">
      <div class="news-title">
        <h1>📰 News Hub</h1>
        <p>Stay informed with the latest updates</p>
      </div>
      
      <!-- Search Bar -->
      <div class="search-container">
        <div class="search-input-wrapper">
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search news..."
            class="search-input"
            @keyup.enter="searchNews"
          />
          <button class="search-btn" @click="searchNews">
            🔍
          </button>
        </div>
      </div>
    </div>

    <!-- Category Navigation -->
    <div class="category-nav">
      <div class="category-selector">
        <button
          v-for="category in newsCategories"
          :key="category.id"
          class="category-btn"
          :class="{ active: selectedCategory === category.id }"
          @click="selectCategory(category.id)"
        >
          <span class="category-icon">{{ category.icon }}</span>
          <span class="category-name">{{ category.name }}</span>
        </button>
      </div>
    </div>

    <!-- News Content -->
    <div class="news-content">
      <!-- Featured News -->
      <div v-if="featuredNews" class="featured-section">
        <div class="featured-news" @click="showNewsDetail(featuredNews)">
          <div class="featured-image">
            <img :src="featuredNews.image" :alt="featuredNews.title" />
            <div class="featured-overlay">
              <div class="featured-category">
                {{ featuredNews.category }}
              </div>
            </div>
          </div>
          <div class="featured-content">
            <h2 class="featured-title">{{ featuredNews.title }}</h2>
            <p class="featured-excerpt">{{ truncateText(featuredNews.content, 150) }}</p>
            <div class="featured-meta">
              <span class="author">{{ featuredNews.author }}</span>
              <span class="separator">•</span>
              <span class="time">{{ formatTime(featuredNews.publishedAt) }}</span>
              <span class="separator">•</span>
              <span class="read-time">{{ featuredNews.readTime }} min read</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Regular News Grid -->
      <div class="news-grid">
        <div
          v-for="news in regularNews"
          :key="news.id"
          class="news-card"
          @click="showNewsDetail(news)"
        >
          <div class="news-image">
            <img :src="news.image" :alt="news.title" />
            <div class="news-category-badge">
              {{ news.category }}
            </div>
          </div>
          <div class="news-card-content">
            <h3 class="news-title">{{ news.title }}</h3>
            <p class="news-excerpt">{{ truncateText(news.content, 100) }}</p>
            <div class="news-meta">
              <div class="meta-left">
                <span class="news-author">{{ news.author }}</span>
                <span class="news-time">{{ formatTime(news.publishedAt) }}</span>
              </div>
              <div class="meta-right">
                <span class="engagement">
                  <span class="likes">❤️ {{ news.likes }}</span>
                  <span class="comments">💬 {{ news.comments }}</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Load More Button -->
      <div class="load-more-section">
        <button class="load-more-btn" @click="loadMore" :disabled="isLoading">
          <span v-if="!isLoading">Load More Stories</span>
          <span v-else class="loading-text">
            <span class="loading-spinner"></span>
            Loading...
          </span>
        </button>
      </div>

      <!-- Empty State -->
      <div v-if="filteredNews.length === 0" class="empty-state">
        <div class="empty-icon">🔍</div>
        <h3>No news found</h3>
        <p>Try adjusting your search or category filter</p>
      </div>
    </div>

    <!-- News Detail Dialog -->
    <TripNewsDialog 
      v-if="dialogVisible"
      :visible="dialogVisible"
      :news="selectedNews"
      @close="closeDialog"
    />
  </div>
</template>

<style lang="scss">
@use '@/styles/pages/news' as *;
</style>



