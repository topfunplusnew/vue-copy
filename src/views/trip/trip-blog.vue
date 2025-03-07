<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useUserStore } from '@/stores/user';
import { ElMessage } from 'element-plus';
import { getImageUrl } from '@/utils';
import IconTooling from '@/components/icons/IconTooling.vue';
import walletItem from '@/components/wallet-item.vue';
import { blogPosts } from '@/data/blogpost.ts'; // 确保路径正确
import LoginButton from '@/components/login-button.vue';
import UserPage from '../user/userpage.vue';  // 从 '../trip/userpage.vue' 改为 '../user/userpage.vue'

const msg = 'Our Latest Blog';
const posts = ref(blogPosts);
const selectedPost = ref(null); // 添加选中的博客状态

// 初始化router和userStore
const router = useRouter();
const userStore = useUserStore();

// 处理登录点击
const handleLoginClick = () => {
  router.push({ name: 'login' });
};

// 添加显示和关闭博客详情的方法
const showBlogDetail = (post) => {
  selectedPost.value = post;
};

const closeBlogDetail = () => {
  selectedPost.value = null;
};

// 前往个人主页
const goToUserProfile = () => {
  router.push({ name: 'userpage' });
};

// 处理下拉菜单命令
const handleCommand = (command) => {
  if (command === 'profile') {
    router.push({ name: 'userpage' });
  } else if (command === 'logout') {
    userStore.logout();
    ElMessage.success('Logged out successfully');
    router.push({ path: '/' });
  }
};
</script>

<template>
  <div class="background-layer"></div>
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
          <walletItem />
          <!-- 未登录状态显示登录和注册按钮 -->
          <template v-if="!userStore.user">
            <el-button class="nav-button" @click="handleLoginClick">LOGIN</el-button>
            <router-link :to="{ name: 'signup' }">
              <el-button class="nav-button">SIGN UP</el-button>
            </router-link>
          </template>
          
          <!-- 已登录状态显示用户头像和下拉菜单 -->
          <div v-else class="user-profile-nav">
            <div class="home-avatar-container" @click="goToUserProfile">
              <img 
                :src="getImageUrl(userStore.user.avatar || '')" 
                alt="User Avatar" 
                class="home-new-user-avatar"
              />
              <span class="home-new-username">{{ userStore.user.name }}</span>
            </div>
            <el-dropdown trigger="click" @command="handleCommand">
              <span class="el-dropdown-link">
                <i class="el-icon-arrow-down"></i>
              </span>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="profile">My Profile</el-dropdown-item>
                  <el-dropdown-item command="logout">Logout</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>
        </div>
      </div>
      
    </header>

    <h1 class="blog-header-title">{{ msg }}</h1>

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

.post-item {
  cursor: pointer;
  transition: transform 0.3s ease, box-shadow 0.3s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }
}
</style>

