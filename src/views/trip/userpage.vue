<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue';
import { userInfo, generateBlogs, BlogPost } from '@/data/psblog';
import walletItem from '@/components/wallet-item.vue';

const user = reactive(userInfo);
const posts = ref<BlogPost[]>([...user.blogs]);
const totalLikes = computed(() =>
  posts.value.reduce((sum, post) => sum + post.likes, 0)
);

const page = ref(2);
const perPage = 10;
const loading = ref(false);
const noMorePosts = ref(false);
const postsContainer = ref<HTMLElement | null>(null);

function loadPosts() {
  if (loading.value || noMorePosts.value) return;
  loading.value = true;
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

function handleScroll() {
  const container = postsContainer.value;
  if (!container) return;
  if (container.scrollTop + container.clientHeight >= container.scrollHeight - 100) {
    loadPosts();
  }
}

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
  <div class="user-page">
    <!-- 顶部 Header -->
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
          <wallet-item />
        </div>
      </div>
    </header>

    <!-- 主体内容，使用 flex 布局让左侧个人信息 & 右侧博客并排 -->
    <section class="main-content">
      <!-- 左侧用户信息面板，固定宽度 & 100vh 高度 -->
      <aside class="sidebar">
        <div class="user-info">
          <div class="avatar-container">
            <img class="avatar" :src="user.avatar" alt="User Avatar" />
            <input type="file" class="upload-avatar" @change="handleAvatarUpload" />
          </div>
          <div class="username">{{ user.name }}</div>
          <div class="user-id">ID: {{ user.id }}</div>
          <div class="registration-time">Joined: {{ user.joined }}</div>
          <!-- Following / Followers -->
          <div class="follow-section">
            <div class="follow-item">
              <span class="number">{{ user.followings }}</span>
              <router-link to="/following" class="follow-link">Following</router-link>
            </div>
            <div class="follower-item">
              <span class="number">{{ user.followers }}</span>
              <router-link to="/followers" class="follower-link">Followers</router-link>
            </div>
          </div>
          <!-- Likes / Coins -->
          <div class="stats">
            <div class="stat">
              <span class="number">{{ totalLikes }}</span>
              <span class="label">Likes</span>
            </div>
            <div class="stat">
              <span class="number">{{ user.coins }}</span>
              <span class="label">Coins</span>
            </div>
          </div>
        </div>
      </aside>

      <!-- 垂直分割线，与 sidebar 同高 (100vh) -->
      <div class="vertical-divider-us"></div>

      <!-- 右侧博客列表区，填满剩余宽度 -->
      <section class="blog-area" ref="postsContainer" @scroll="handleScroll">
        <div class="posts-grid">
          <div class="post-card" v-for="post in posts" :key="post.id">
            <img class="post-image" :src="post.image" alt="Post Image" />
            <div class="post-stats">
              <div class="stat">
                <i class="el-icon-like"></i>
                <span>{{ post.likes }}</span>
              </div>
              <div class="stat">
                <i class="el-icon-chat-line-round"></i>
                <span>{{ post.comments }}</span>
              </div>
              <div class="stat">
                <i class="el-icon-coin"></i>
                <span>{{ post.coins }}</span>
              </div>
            </div>
          </div>
        </div>
        <!-- 底部加载提示 -->
        <div v-if="loading" class="loading">Loading more posts...</div>
        <div v-if="noMorePosts" class="no-more">No more posts</div>
      </section>
    </section>
  </div>
</template>

a
