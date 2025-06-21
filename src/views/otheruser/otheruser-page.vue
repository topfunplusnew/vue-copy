<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue';
import { useUserStore } from '@/stores/user';
import { useRouter, useRoute } from 'vue-router';
import { getImageUrl } from '@/utils';
import { ElMessage } from 'element-plus';
import type { IUser } from '@/types/user';
import type { IBlog } from '@/types/blog';
import BlogDetailDialog from '@/views/blog/blog-detail-dialog.vue';
import commonHeader from '@/layout/common-header.vue';
import { useBlogStore } from '@/stores/blog';
import axios from 'axios';

const store = useUserStore();
const blogStore = useBlogStore();
const router = useRouter();
const route = useRoute();

// 获取路由参数中的用户ID
const userId = computed(() => {
  const id = route.params.id;
  return typeof id === 'string' ? parseInt(id) : null;
});

// 其他用户信息
const otherUser = ref<IUser | null>(null);
const otherUserPosts = ref<{items: IBlog[], loading: boolean, has_next: boolean}>({
  items: [],
  loading: false,
  has_next: false
});

// 关注状态
const isFollowing = ref(false);
const followingLoading = ref(false);

// 博客详情弹窗相关
const selectedBlog = ref<IBlog | null>(null);
const showBlogDialog = ref(false);

// 搜索功能
const searchKeyword = ref('');

onMounted(async () => {
  // 确保页面滚动到顶部
  nextTick(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    document.body.scrollTop = 0;
    document.documentElement.scrollTop = 0;
  });

  // 加载用户信息和博客列表
  if (userId.value) {
    await loadOtherUserData();
  } else {
    ElMessage.error('Invalid user ID');
    router.push('/');
  }
});

// 加载其他用户的数据
const loadOtherUserData = async () => {
  if (!userId.value) return;

  try {
    // 加载用户基本信息 - 使用后端API
    const userResponse = await axios.get(`/api/user/id/${userId.value}`);
    otherUser.value = userResponse.data;

    // 加载用户的博客列表 - 使用博客API过滤特定用户
    const blogsResponse = await axios.get('/api/blogs', {
      params: {
        user_id: userId.value,
        page: 1,
        per_page: 20
      }
    });
    
    // 过滤出该用户的博客
    const userBlogs = blogsResponse.data.items.filter((blog: any) => blog.user.id === userId.value);
    otherUserPosts.value = {
      items: userBlogs,
      loading: false,
      has_next: false
    };

    // 检查当前用户是否关注了这个用户
    if (store.isLogin()) {
      const followResponse = await store.isFollowing(userId.value);
      isFollowing.value = followResponse.data.is_following;
    }
  } catch (error) {
    console.error('Failed to load user data:', error);
    ElMessage.error('Failed to load user information');
  }
};

// 处理关注/取消关注
const handleFollowToggle = async () => {
  if (!userId.value || !store.isLogin()) {
    ElMessage.warning('Please login first');
    router.push('/login');
    return;
  }

  followingLoading.value = true;
  try {
    if (isFollowing.value) {
      await store.unfollow(userId.value);
      isFollowing.value = false;
      ElMessage.success('Unfollowed successfully');
    } else {
      await store.follow(userId.value);
      isFollowing.value = true;
      ElMessage.success('Following successfully');
    }
  } catch (error) {
    console.error('Failed to toggle follow status:', error);
    ElMessage.error('Failed to update following status');
  } finally {
    followingLoading.value = false;
  }
};

// 显示博客详情
const showBlogDetail = async (blogId?: number) => {
  if (!blogId) return;
  
  try {
    console.log('Showing blog detail for ID:', blogId);
    
    // 使用blogStore获取博客详情
    await blogStore.getBlogByID(blogId);
    console.log('BlogStore.blog loaded:', blogStore.blog);
    
    if (blogStore.blog) {
      selectedBlog.value = blogStore.blog;
      showBlogDialog.value = true;
      document.body.style.overflow = 'hidden';
      console.log('Blog dialog should be visible now');
    } else {
      console.error('Failed to load blog data');
      ElMessage.error('Failed to load blog details');
    }
  } catch (error) {
    console.error('Failed to load blog details:', error);
    ElMessage.error('Failed to load blog details');
  }
};

// 关闭博客详情弹窗
const closeBlogDetail = (visible?: boolean) => {
  console.log('Closing blog detail dialog, visible:', visible);
  showBlogDialog.value = false;
  selectedBlog.value = null;
  document.body.style.overflow = '';
};

// 搜索功能处理
const handleSearch = () => {
  const keyword = searchKeyword.value.toLowerCase().trim();
  console.log('Search keyword:', keyword);
  // TODO: 实现搜索功能
};

// 返回上一页
const goBack = () => {
  router.back();
};

// 检查是否是当前用户自己
const isCurrentUser = computed(() => {
  return store.user?.id === otherUser.value?.id;
});
</script>

<template>
  <div class="background-layer"></div>
  <div class="about layout-main">
    <commonHeader />

    <div class="user-page">
      <!-- 主体内容，使用 flex 布局让左侧个人信息 & 右侧博客并排 -->
      <section class="main-content">
        <!-- 左侧用户信息面板 -->
        <aside class="sidebar">
          <div class="user-info">
            <!-- 返回按钮 -->
            <div class="profile-buttons">
              <button class="edit-profile-btn" @click="goBack">
                <span class="btn-icon">←</span>
                <span class="btn-text">BACK</span>
              </button>
              <!-- 关注按钮（如果不是当前用户自己） -->
              <button 
                v-if="!isCurrentUser && store.isLogin()"
                class="logout-btn"
                :class="{ 'following': isFollowing }"
                :disabled="followingLoading"
                @click="handleFollowToggle"
              >
                <span class="btn-icon">{{ isFollowing ? '✓' : '+' }}</span>
                <span class="btn-text">{{ isFollowing ? 'FOLLOWING' : 'FOLLOW' }}</span>
              </button>
            </div>

            <div v-if="otherUser">
              <div class="avatar-section">
                <div class="avatar-container">
                  <img :src="getImageUrl(otherUser.avatar)" :alt="`${otherUser.name}'s Avatar`" class="avatar" />
                </div>
              </div>
              <div class="username">{{ otherUser.name }}</div>
              <div class="user-id">ID: {{ otherUser.id }}</div>
              <div class="registration-time">Joined: {{ otherUser.created_at }}</div>
              
              <!-- Likes / Coins -->
              <div class="stats">
                <div class="stat">
                  <span class="number">{{ otherUser.likes || 0 }}</span>
                  <span class="label">Likes</span>
                </div>
                <!-- <div class="stat">
                  <span class="number">{{ otherUser.coins || 0 }}</span>
                  <span class="label">Coins</span>
                </div> -->
              </div>
              
              <!-- Following / Followers -->
              <div class="follow-stats-row">
                <div class="follow-item">
                  <span class="number">{{ otherUser.followings || 0 }}</span>
                  <span class="follow-link">
                    <span class="link-text">Following</span>
                  </span>
                </div>
                <div class="follower-item">
                  <span class="number">{{ otherUser.followers || 0 }}</span>
                  <span class="follower-link">
                    <span class="link-text">Followers</span>
                  </span>
                </div>
              </div>
            </div>

            <!-- 用户信息加载中 -->
            <div v-else class="user-info-loading">
              <div class="loading-spinner"></div>
              <p>Loading user information...</p>
            </div>
          </div>
        </aside>

        <!-- 垂直分割线，与 sidebar 同高 (100vh) -->
        <div class="vertical-divider-us"></div>

        <!-- 右侧博客列表区，填满剩余宽度 -->
        <section class="blog-area">
          <!-- 博客区域顶部操作栏 -->
          <div class="blog-area-header">
            <!-- 搜索框 -->
            <input
              class="blog-search-input"
              type="text"
              :placeholder="`Search ${otherUser?.name || 'user'}'s blog`"
              v-model="searchKeyword"
              @input="handleSearch"
            />
            <!-- 博客数量显示 -->
            <div class="blog-count">
              {{ otherUserPosts.items.length }} posts
            </div>
          </div>

          <div class="blog-posts">
            <div
              v-for="post in otherUserPosts.items"
              :key="post.id"
              class="blog-post"
              :class="{ 'nft-post': post.isNFT }"
              @click="showBlogDetail(post.id)"
            >
              <!-- 使用 el-carousel 代替单张图片显示 -->
              <el-carousel
                v-if="post.image && post.image.length > 0"
                :interval="3000"
                arrow="hover"
                height="200px"
                class="post-carousel"
                :touchable="true"
                :loop="true"
                :autoplay="false"
              >
                <el-carousel-item
                  v-for="(img, index) in post.image"
                  :key="index"
                >
                  <img :src="getImageUrl(img)" alt="Blog Image" class="post-image" />
                </el-carousel-item>
              </el-carousel>

              <!-- 博客内容 -->
              <div class="post-content-userpage">
                <h2 class="post-title-userpage">{{ post.title }}</h2>
                <p class="post-text-userpage">{{ post.content }}</p>
              </div>

              <!-- 博客底部信息 -->
              <div class="post-footer-userpage">
                <!-- 作者信息 -->
                <div class="author-info">
                  <img v-if="post.user?.avatar" :src="getImageUrl(post.user.avatar)" alt="Avatar" class="post-avatar" />
                  <span class="author-name">{{ post.user?.name }}</span>
                </div>

                <!-- 统计信息 -->
                <div class="post-stats">
                  <span class="likes">❤️ {{ post.likes }}</span>
                  <span class="comments">💬 {{ post.comments_count }}</span>
                  <span class="coins" v-if="post.isNFT">₿ {{ post.coins }}</span>
                </div>
              </div>
            </div>

            <!-- 空状态 -->
            <div v-if="otherUserPosts.items.length === 0 && !otherUserPosts.loading" class="empty-posts">
              <div class="empty-icon">📝</div>
              <p>{{ otherUser?.name }} hasn't posted anything yet</p>
            </div>
          </div>
          
          <!-- 底部加载提示 -->
          <div v-if="otherUserPosts.loading" class="loading">Loading more posts...</div>
          <div v-if="!otherUserPosts.has_next && otherUserPosts.items.length > 0" class="no-more">No more posts</div>
        </section>
      </section>
    </div>

    <!-- 博客详情弹出层 -->
    <!-- Debug info: showBlogDialog={{ showBlogDialog }}, selectedBlog={{ selectedBlog?.id }} -->
    <BlogDetailDialog
      v-if="showBlogDialog && selectedBlog && selectedBlog.id"
      :blog-id="selectedBlog.id"
      :visible="showBlogDialog"
      @update:visible="closeBlogDetail"
      @close="closeBlogDetail"
    />
  </div>
</template>


