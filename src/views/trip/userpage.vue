<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { userInfo, generateBlogs, BlogPost } from '@/data/psblog';
import walletItem from '@/components/wallet-item.vue';

// 从 psblog.ts 中导入用户信息，并使其响应式
const user = reactive(userInfo);

// 初始博客数据取自 user.blogs
const posts = ref<BlogPost[]>([...user.blogs]);

// 下拉加载用的页码，初始页已在 user.blogs 中加载（假设为第一页）
const page = ref(2);
const perPage = 10;
const loading = ref(false);
const noMorePosts = ref(false);
const postsContainer = ref<HTMLElement | null>(null);

// 加载更多博客数据
function loadPosts() {
  if (loading.value || noMorePosts.value) return;
  loading.value = true;
  // 模拟异步加载
  setTimeout(() => {
    const newPosts = generateBlogs(page.value, perPage);
    if (newPosts.length < perPage) {
      noMorePosts.value = true;
    }
    posts.value.push(...newPosts);
    user.blogs.push(...newPosts);
    page.value++;
    loading.value = false;
  }, 1000);
}

// 处理帖子容器滚动，下拉加载更多
function handleScroll() {
  const container = postsContainer.value;
  if (!container) return;
  if (container.scrollTop + container.clientHeight >= container.scrollHeight - 100) {
    loadPosts();
  }
}

// 处理头像上传
function handleAvatarUpload(event: Event) {
  const target = event.target as HTMLInputElement;
  const file = target.files ? target.files[0] : null;
  if (file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        user.avatar = e.target.result as string;
      }
    };
    reader.readAsDataURL(file);
  }
}

onMounted(() => {
  loadPosts();
});
</script>

<template>
  <div class="home">
    <!-- Header 区域 -->
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
          <!-- wallet-item 组件用于 Web3 钱包连接 -->
          <wallet-item />
          <router-link :to="{ name: 'login' }">
            <el-button class="nav-button">LOGIN</el-button>
          </router-link>
          <router-link :to="{ name: 'signup' }">
            <el-button class="nav-button">SIGN UP</el-button>
          </router-link>
        </div>
      </div>
    </header>

    <!-- 主体部分：左右两栏 -->
    <div class="user-page-content">
      <!-- 左侧：用户侧边栏 -->
      <aside class="sidebar">
        <div class="user-info">
          <div class="avatar-container">
            <!-- 用户头像，支持上传更新 -->
            <img class="avatar" :src="user.avatar" alt="User Avatar" />
            <input type="file" class="upload-avatar" @change="handleAvatarUpload" />
          </div>
          <!-- 用户 ID -->
          <div class="user-id">ID: {{ user.id }}</div>
          <!-- 注册时间 -->
          <div class="registration-time">Joined: {{ user.joined }}</div>
          <!-- Following / Followers 链接（在一行显示，鼠标悬停时改变颜色） -->
          <div class="follow-links">
            <span class="follow-item">
              <span class="number">{{ user.followings }}</span>
              <router-link to="/following" class="follow-link">Following</router-link>
            </span>
            <span class="follow-item">
              <span class="number">{{ user.followers }}</span>
              <router-link to="/followers" class="follow-link">Followers</router-link>
            </span>
          </div>
          <!-- 点赞与 Coin 统计（数字和文本在一行） -->
          <div class="stats">
            <div class="stat">
              <span class="number">{{ user.likes }}</span>
              <span class="label">Likes</span>
            </div>
            <div class="stat">
              <span class="number">{{ user.coins }}</span>
              <span class="label">Coins</span>
            </div>
          </div>
        </div>
      </aside>

      <div class="vertical-divider"></div>

      <!-- 右侧：用户发布的帖子（博客），支持下拉加载更多 -->
      <section class="posts" ref="postsContainer" @scroll="handleScroll">
        <div class="posts-grid">
          <div class="post-card" v-for="post in posts" :key="post.id">
            <img class="post-image" :src="post.image" alt="Post Image" />
            <div class="post-stats">
              <div class="stat-item">
                <i class="el-icon-like"></i>
                <span>{{ post.likes }}</span>
              </div>
              <div class="stat-item">
                <i class="el-icon-chat-line-round"></i>
                <span>{{ post.comments }}</span>
              </div>
              <div class="stat-item">
                <i class="el-icon-coin"></i>
                <span>{{ post.coins }}</span>
              </div>
            </div>
          </div>
        </div>
        <!-- 加载提示 -->
        <div v-if="loading" class="loading">Loading more posts...</div>
        <div v-if="noMorePosts" class="no-more">No more posts</div>
      </section>
    </div>
  </div>
</template>


