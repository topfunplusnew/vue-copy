<script setup lang="ts">
import { ref } from 'vue';
import IconTooling from '@/components/icons/IconTooling.vue';
import walletItem from '@/components/wallet-item.vue';
import { blogPosts } from '@/data/blogpost.ts'; // 确保路径正确

const msg = 'Our Latest Blog';
const posts = ref(blogPosts);
const selectedPost = ref(null); // 添加选中的博客状态

// 添加显示和关闭博客详情的方法
const showBlogDetail = (post) => {
  selectedPost.value = post;
};

const closeBlogDetail = () => {
  selectedPost.value = null;
};
</script>

<template>
  <div class="home">
    <!-- Header -->
    <header class="header">
      <div class="nav-container">
        <div class="left-nav">
          <router-link :to="{ name: 'home' }">
            <el-button class="nav-button">HOME</el-button>
          </router-link>
          <router-link :to="{ name: 'about' }">
            <el-button class="nav-button">ABOUT</el-button>
          </router-link>
          <router-link :to="{ name: 'blog' }">
            <el-button class="nav-button">BLOG</el-button>
          </router-link>
          <router-link :to="{ name: 'contact' }">
            <el-button class="nav-button">CONTACT</el-button>
          </router-link>
        </div>
        <div class="right-nav">
          <wallet-item />
          <router-link :to="{ name: 'login' }">
            <el-button class="nav-button">LOGIN</el-button>
          </router-link>
          <router-link :to="{ name: 'signup' }">
            <el-button class="nav-button">SIGN UP</el-button>
          </router-link>
        </div>
      </div>
      <h1 class="blog-header-title">{{ msg }}</h1>
    </header>

    <!-- Blog Content -->
    <div class="blog-container">
      <div class="post-list">
        <div 
          v-for="post in posts" 
          :key="post.id" 
          class="post-item"
          @click="showBlogDetail(post)"
        >
          <div class="meta-line">
            <span class="reading-time">{{ post.readingTime }}</span>
            <div class="categories">
              <span v-for="(category, index) in post.categories" :key="index" class="category-tag">
                {{ category }}
              </span>
            </div>
          </div>
          <h3 class="post-title">{{ post.title }}</h3>
          <div class="divider"></div>
        </div>
      </div>

      <!-- 博客详情弹窗 -->
      <div v-if="selectedPost" class="blog-detail-overlay" @click.self="closeBlogDetail">
        <div class="blog-detail-container">
          <div class="blog-detail-header">
            <h2>{{ selectedPost.title }}</h2>
            <button class="close-button" @click="closeBlogDetail">×</button>
          </div>
          
          <div class="blog-detail-content">
            <img 
              v-if="selectedPost.image" 
              :src="selectedPost.image" 
              :alt="selectedPost.title"
              class="detail-image"
            />
            
            <div class="detail-info">
              <div class="author-info" v-if="selectedPost.author">
                <img 
                  :src="selectedPost.author.avatar" 
                  :alt="selectedPost.author.name"
                  class="author-avatar"
                />
                <span class="author-name">{{ selectedPost.author.name }}</span>
              </div>
              
              <p class="content">{{ selectedPost.content }}</p>
              
              <div class="detail-stats" v-if="selectedPost.stats">
                <span>👍 {{ selectedPost.stats.likes }}</span>
                <span>💬 {{ selectedPost.stats.comments }}</span>
                <span>🔄 {{ selectedPost.stats.shares }}</span>
              </div>
              
              <div class="tags" v-if="selectedPost.tags">
                <span 
                  v-for="(tag, index) in selectedPost.tags" 
                  :key="index"
                  class="tag"
                >
                  {{ tag }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss">
@import '@/styles/_blog-detail.scss';

.post-item {
  cursor: pointer;
  transition: transform 0.3s ease, box-shadow 0.3s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }
}
</style>

