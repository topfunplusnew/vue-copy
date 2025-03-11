<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue';
import { useRouter } from 'vue-router';
import { useUserStore } from '@/stores/user';
import { ElMessage } from 'element-plus';
import { getImageUrl } from '@/utils';
import walletItem from '@/components/wallet-item.vue';
import { formatDate } from '@/utils/date';
import { useBlogStore } from '@/stores/blog';

const msg = 'Our Latest Blog';
const store = useBlogStore();
const allosBlog = computed(() => store.blogos);
const selectedosPost = ref(null); // 添加选中的博客状态
const dialogVisible = ref(false); // 控制弹窗显示
const isLoadingMore = ref(false); // 是否加载更多中
const menuActive = ref(false); // 添加导航菜单状态
const currentPage = ref(1); // 当前页码
const pageSize = ref(6); // 每页显示数量

// 初始化router和userStore
const router = useRouter();
const userStore = useUserStore();

const blogos = computed(() => store.blogos);
// 处理登录点击
const handleLoginClick = () => {
  router.push({ name: 'login' });
};

const showOsBlogDetail = async (id: number) => {
  await store.getBlogosPost(id);
  selectedosPost.value = store.blogos[0]; // 获取选中的博客
  dialogVisible.value = true;
};

// 计算过滤后的博客列表
const filteredPosts = computed(() => {
  if (!blogos.value || blogos.value.length === 0) return [];
  return blogos.value;
});

// 计算是否有更多博客加载
const hasMorePosts = computed(() => {
  return filteredPosts.value.length > currentPage.value * pageSize.value;
});

// 加载更多博客
const loadMorePosts = async () => {
  if (isLoadingMore.value) return;
  isLoadingMore.value = true;
  
  try {
    // 模拟加载延迟
    await new Promise(resolve => setTimeout(resolve, 800));
    currentPage.value++;
  } catch (error) {
    console.error('Failed to load more posts:', error);
  } finally {
    isLoadingMore.value = false;
  }
};

// 截断文本
const truncateText = (text:string, maxLength:number) => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

// 在组件挂载时初始化数据
onMounted(() => {
  // 从API获取官方博客列表
  store.getBlogosList();
});

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

// 切换菜单显示
const toggleMenu = () => {
  menuActive.value = !menuActive.value;
};
</script>

<template>
  <div class="background-layer"></div>
  <div class="home">
    <!-- Header -->
    <header class="header">
      <div class="nav-container" :class="{ 'menu-active': menuActive }">
        <!-- 汉堡菜单按钮 -->
        <button class="hamburger-menu" @click="toggleMenu">
          <span v-if="menuActive">✕</span>
          <span v-else>☰</span>
        </button>
        <div class="left-nav" :class="{ 'active': menuActive }">
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

    <div class="blogos-header-title">{{ msg }}</div>

    <!-- 改进的Blog Content部分 -->
    <div class="blogos-page-container">
      <!-- 加载中显示 -->
      <div v-if="!filteredPosts || filteredPosts.length === 0" class="blogos-loading-blogs">
        <div class="blogos-loading-spinner"></div>
        <p>Loading blogs...</p>
      </div>

      <!-- 响应式博客网格 -->
      <div class="blogos-grid" v-else>
        <div
          v-for="post in filteredPosts"
          :key="post.id"
          class="blogos-card"
          @click="showOsBlogDetail(post.id)"
        >
          <div class="blogos-card-image" :style="{ backgroundImage: `url(${post.image[0] || '/default-blog-image.jpg'})` }">
            <div class="blogos-card-overlay">
              <div class="blogos-categories">
                <span v-for="(tag, index) in post.tags" :key="index" 
                class="blogos-category-badge">
                  {{ tag }}
                </span>
              </div>
            </div>
          </div>
          <div class="blogos-card-content">
            <div class="blogos-card-meta">
              <span class="reading-time"><i class="el-icon-time"></i> {{ Math.ceil(post.content.length / 1000) }} min read</span>
              <span class="blogos-date">{{ formatDate(post.created_at) }}</span>
            </div>
            <div class="blog-card-title">{{ post.title }}</div>
            <div class="blog-card-excerpt">{{ truncateText(post.content, 120) }}</div>
            <div class="blogos-card-footer">
              <div class="blogos-author-info">
                <span class="blogos-author-name">{{ post.user?.name || 'Anonymous' }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 加载更多按钮 -->
      <div class="blogos-load-more-container" v-if="hasMorePosts">
        <button class="blogos-load-more-button" @click="loadMorePosts" :disabled="isLoadingMore">
          {{ isLoadingMore ? 'Loading...' : 'Load More' }}
        </button>
      </div>

      <!-- 无结果提示 -->
      <div class="blogos-no-results" v-if="filteredPosts.length === 0">
        <h3>No posts found</h3>
        <p>Try adjusting your search or filters.</p>
      </div>
    </div>

    <!-- Blog Detail Dialog -->
    <el-dialog
      v-model="dialogVisible"
      :title="selectedosPost?.title"
      custom-class="blogos-detail-dialog"
      :close-on-click-modal="true"
      :show-close="true"
      width="90%"
      top="5vh"
      destroy-on-close
    >
      <div class="blogos-detail-container">
        <!-- 博客详情头部 -->
        <div class="blogos-detail-header">
          <div class="blogos-author-container">
            <div class="blogos-author-info">
              <h4 class="blogos-author-name">{{ selectedosPost?.user?.name || 'Anonymous' }}</h4>
              <div class="blogos-publish-date">
                {{ formatDate(selectedosPost?.created_at) }}
              </div>
            </div>
          </div>
          <div class="blogos-categories-container">
            <span v-for="(tag, index) in selectedosPost?.tags" :key="index" 
            class="blogos-detail-category">
              {{ tag }}
            </span>
          </div>
        </div>

        <!-- 博客详情内容区 -->
        <div class="blogos-detail-content">
          <!-- 博客轮播图 -->
          <div class="blogos-image-carousel" v-if="selectedosPost?.image && selectedosPost.image.length > 0">
            <el-carousel :interval="4000" type="card" height="400px">
              <el-carousel-item v-for="(image, index) in selectedosPost.image" :key="index">
                <img :src="image" :alt="`Blog image ${index + 1}`" class="carousel-image" />
              </el-carousel-item>
            </el-carousel>
          </div>

          <!-- 或者显示单张特色图片 -->
          <div class="blogos-featured-image" v-else-if="selectedosPost?.image && selectedosPost.image[0]">
            <img :src="selectedosPost.image[0]" :alt="selectedosPost.title" class="blogos-featured-image" />
          </div>

          <!-- 博客正文 -->
          <div class="blogos-text-content">
            <p>{{ selectedosPost?.content }}</p>
          </div>

          <!-- 标签区域 -->
          <div class="blogos-tags-container" v-if="selectedosPost?.tags && selectedosPost.tags.length > 0">
            <h4>Tags:</h4>
            <div class="blogos-tag-list">
              <span v-for="(tag, index) in selectedosPost.tags" :key="index" class="blogos-tag">
                #{{ tag }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </el-dialog>
  </div>
</template>


