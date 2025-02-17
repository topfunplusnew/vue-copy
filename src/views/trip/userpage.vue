<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue';
import { userInfo, generateBlogs, BlogPost } from '@/data/psblog'; 
import walletItem from '@/components/wallet-item.vue';
import type { IBlogPost } from '@/types/blog';
import macauImg from '@/assets/macau.jpg';

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

// 用户博客数据
const userPosts = ref<IBlogPost[]>([
  {
    id: 1,
    image: [macauImg],
    user: {
      avatar: 'https://via.placeholder.com/50?text=A',
      name: 'Alice',
    },
    title: 'My Trip to Macau',
    content: 'Sharing my wonderful experience in Macau...',
    likes: 23,
    comments: 5,
    coins: 10,
    tags: ['Travel', 'Macau', 'Experience'],
    isNFT: false
  },
  // 可以添加更多博客帖子...
]);

// 博客详情相关的状态和方法
const selectedBlog = ref<IBlogPost | null>(null);

const showBlogDetail = (blog: IBlogPost) => {
  selectedBlog.value = blog;
  document.body.style.overflow = 'hidden';
};

const closeBlogDetail = () => {
  selectedBlog.value = null;
  document.body.style.overflow = '';
};

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
        <div class="blog-posts">
          <div 
            v-for="post in userPosts" 
            :key="post.id" 
            class="blog-post"
            @click="showBlogDetail(post)"
          >
            <img :src="post.image[0]" alt="Blog Image" class="post-image" />
            <div class="post-footer">
              <img :src="post.user.avatar" alt="Avatar" class="post-avatar" />
              <div class="post-stats">
                <span class="likes">❤️ {{ post.likes }}</span>
                <span class="comments">💬 {{ post.comments }}</span>
                <span class="coins">💰 {{ post.coins }}</span>
              </div>
            </div>
          </div>
        </div>
        <!-- 底部加载提示 -->
        <div v-if="loading" class="loading">Loading more posts...</div>
        <div v-if="noMorePosts" class="no-more">No more posts</div>
      </section>
    </section>

    <!-- 博客详情弹出层 -->
    <div class="blog-detail-overlay" v-if="selectedBlog" @click.self="closeBlogDetail">
      <div class="blog-detail-container">
        <div class="blog-detail-header">
          <h2>{{ selectedBlog.title }}</h2>
          <button class="close-button" @click="closeBlogDetail">×</button>
        </div>
        <div class="blog-detail-content">
          <img :src="selectedBlog.image[0]" alt="Blog Image" class="detail-image" />
          <div class="detail-info">
            <div class="author-info">
              <img :src="selectedBlog.user.avatar" alt="Author Avatar" class="author-avatar" />
              <span class="author-name">{{ selectedBlog.user.name }}</span>
            </div>
            <p class="content">{{ selectedBlog.content }}</p>
            <div class="detail-stats">
              <span class="likes">❤️ {{ selectedBlog.likes }}</span>
              <span class="comments">💬 {{ selectedBlog.comments }}</span>
              <span class="coins">💰 {{ selectedBlog.coins }}</span>
            </div>
            <div class="tags">
              <span v-for="tag in selectedBlog.tags" :key="tag" class="tag">
                {{ tag }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.blog-posts {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 20px;
  padding: 20px;
}

.blog-post {
  cursor: pointer;
  border-radius: 12px;
  overflow: hidden;
  transition: transform 0.2s;
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(10px);
}

.blog-post:hover {
  transform: scale(1.02);
}

.post-image {
  width: 100%;
  height: 200px;
  object-fit: cover;
}

.post-footer {
  padding: 10px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.post-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
}

.post-stats {
  display: flex;
  gap: 12px;
}

/* 博客详情弹出层样式 */
.blog-detail-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(10px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.blog-detail-container {
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(10px);
  border-radius: 20px;
  width: 80%;
  max-width: 900px;
  max-height: 90vh;
  overflow-y: auto;
  padding: 24px;
  position: relative;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.3);
}

.blog-detail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.blog-detail-header h2 {
  color: #000;
  margin: 0;
}

.close-button {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  padding: 8px;
  color: #000;
}

.detail-image {
  width: 100%;
  max-height: 400px;
  object-fit: cover;
  border-radius: 12px;
  margin-bottom: 20px;
}

.detail-info {
  padding: 0 20px;
}

.author-info {
  display: flex;
  align-items: center;
  margin-bottom: 16px;
  padding: 12px;
  background-color: rgba(255, 255, 255, 0.3);
  border-radius: 12px;
}

.author-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  margin-right: 16px;
}

.author-name {
  font-weight: 600;
  color: #000;
}

.content {
  line-height: 1.8;
  margin-bottom: 24px;
  font-size: 1.1rem;
  color: #000;
}

.detail-stats {
  display: flex;
  gap: 24px;
  margin-bottom: 20px;
  padding: 12px 0;
  color: #000;
}

.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.tag {
  background-color: rgba(255, 255, 255, 0.3);
  padding: 6px 16px;
  border-radius: 20px;
  font-size: 0.9rem;
  color: #000;
}

.tag:hover {
  background-color: rgba(255, 255, 255, 0.4);
}
</style>
