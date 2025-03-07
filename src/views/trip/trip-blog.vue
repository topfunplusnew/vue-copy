<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue';
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
const dialogVisible = ref(false); // 控制弹窗显示
const newComment = ref(''); // 评论输入
const commentInput = ref(null); // 评论输入框引用
const isFollowing = ref(false); // 是否关注作者
const isLiked = ref(false); // 是否点赞
const likeCount = ref(0); // 点赞数
const searchQuery = ref(''); // 搜索查询
const filterCategory = ref(''); // 分类过滤
const sortOption = ref('newest'); // 排序选项
const pageSize = ref(6); // 每页显示数量
const currentPage = ref(1); // 当前页码
const isLoadingMore = ref(false); // 是否加载更多中
const menuActive = ref(false); // 添加导航菜单状态

// 初始化router和userStore
const router = useRouter();
const userStore = useUserStore();

// 处理登录点击
const handleLoginClick = () => {
  router.push({ name: 'login' });
};

// 格式化日期
const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { 
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

// 截断文本
const truncateText = (text, maxLength) => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

// 计算属性：过滤和排序后的帖子
const filteredPosts = computed(() => {
  let result = [...posts.value];
  
  // 应用搜索过滤
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    result = result.filter(post => 
      post.title.toLowerCase().includes(query) ||
      post.content.toLowerCase().includes(query) ||
      post.author.toLowerCase().includes(query) ||
      post.categories.some(cat => cat.toLowerCase().includes(query))
    );
  }
  
  // 应用类别过滤
  if (filterCategory.value) {
    result = result.filter(post => 
      post.categories.includes(filterCategory.value)
    );
  }
  
  // 应用排序
  if (sortOption.value === 'newest') {
    result.sort((a, b) => new Date(b.date) - new Date(a.date));
  } else if (sortOption.value === 'oldest') {
    result.sort((a, b) => new Date(a.date) - new Date(b.date));
  } else if (sortOption.value === 'popular') {
    result.sort((a, b) => (b.views || 0) - (a.views || 0));
  }
  
  return result;
});

// 计算属性：分页后的帖子
const paginatedPosts = computed(() => {
  const start = 0;
  const end = currentPage.value * pageSize.value;
  return filteredPosts.value.slice(start, end);
});

// 计算是否有更多帖子
const hasMorePosts = computed(() => {
  return filteredPosts.value.length > currentPage.value * pageSize.value;
});

// 计算所有唯一类别
const uniqueCategories = computed(() => {
  const categories = new Set();
  posts.value.forEach(post => {
    post.categories.forEach(category => {
      categories.add(category);
    });
  });
  return Array.from(categories);
});

// 计算是否是自己的帖子
const isOwnPost = computed(() => {
  if (!userStore.user || !selectedPost.value) {
    return false;
  }
  return userStore.user.id === selectedPost.value.authorId;
});

// 添加显示和关闭博客详情的方法
const showBlogDetail = (post) => {
  selectedPost.value = post;
  dialogVisible.value = true;
  isLiked.value = false; // 重置点赞状态
  likeCount.value = post.likes || 0;
  newComment.value = ''; // 清空评论
  
  // 检查是否已关注作者
  checkFollowStatus(post.authorId);
};

const closeBlogDetail = () => {
  selectedPost.value = null;
  dialogVisible.value = false;
};

// 加载更多帖子
const loadMorePosts = async () => {
  if (isLoadingMore.value || !hasMorePosts.value) return;
  
  isLoadingMore.value = true;
  // 模拟加载延迟
  await new Promise(resolve => setTimeout(resolve, 800));
  currentPage.value++;
  isLoadingMore.value = false;
};

// 检查关注状态
const checkFollowStatus = async (userId) => {
  if (!userId || !userStore.user) {
    isFollowing.value = false;
    return;
  }
  
  try {
    // 此处应调用实际API来检查关注状态
    // 暂时使用模拟数据
    isFollowing.value = false;
  } catch (error) {
    console.error('Failed to check follow status:', error);
  }
};

// 处理关注/取消关注
const handleFollowClick = async (userId) => {
  if (!userId || !userStore.user) {
    ElMessage.warning('Please login to follow users');
    return;
  }
  
  try {
    if (isFollowing.value) {
      await userStore.unfollow(userId);
      isFollowing.value = false;
      ElMessage.success('Unfollowed successfully');
    } else {
      await userStore.follow(userId);
      isFollowing.value = true;
      ElMessage.success('Following successfully');
    }
  } catch (error) {
    ElMessage.error('Failed to update following status');
  }
};

// 切换点赞状态
const toggleLike = () => {
  if (!userStore.user) {
    ElMessage.warning('Please login to like posts');
    return;
  }
  
  isLiked.value = !isLiked.value;
  likeCount.value += isLiked.value ? 1 : -1;
  
  // 应该发送API请求更新点赞状态
  // 暂时只是前端模拟
};

// 聚焦评论输入框
const focusCommentInput = () => {
  nextTick(() => {
    if (commentInput.value) {
      commentInput.value.focus();
    }
  });
};

// 提交评论
const submitComment = () => {
  if (!userStore.user) {
    ElMessage.warning('Please login to comment');
    return;
  }
  
  if (!newComment.value.trim()) {
    return;
  }
  
  // 创建新评论对象
  const comment = {
    id: Date.now(),
    content: newComment.value,
    userName: userStore.user.name,
    userAvatar: userStore.user.avatar,
    date: new Date().toISOString(),
    likes: 0,
    isLiked: false
  };
  
  // 添加到评论列表
  if (!selectedPost.value.comments) {
    selectedPost.value.comments = [];
  }
  selectedPost.value.comments.push(comment);
  
  // 清空输入
  newComment.value = '';
  
  ElMessage.success('Comment posted successfully');
};

// 回复评论
const replyToComment = (comment) => {
  focusCommentInput();
  newComment.value = `@${comment.userName} `;
};

// 点赞评论
const likeComment = (comment) => {
  if (!userStore.user) {
    ElMessage.warning('Please login to like comments');
    return;
  }
  
  comment.isLiked = !comment.isLiked;
  comment.likes = (comment.likes || 0) + (comment.isLiked ? 1 : -1);
  
  // 应该发送API请求更新评论点赞状态
  // 暂时只是前端模拟
};

// 分享博客
const sharePost = () => {
  // 实现分享功能
  ElMessage.info('Sharing functionality will be implemented soon');
};

// 在组件挂载时初始化数据
onMounted(() => {
  // 这里可以放置初始化逻辑，如从API获取博客列表
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
      <!-- 博客过滤和搜索栏 -->
      <div class="blogos-filter-bar">
        <div class="blogos-search-container">
          <input 
            type="text" 
            v-model="searchQuery" 
            placeholder="Search blogs..." 
            class="blogos-search-input"
          />
          <button class="blogos-search-button">
            <span>🔍</span>
          </button>
        </div>
        <div class="blogos-filter-options">
          <el-select v-model="filterCategory" placeholder="Category" class="blogos-filter-select">
            <el-option label="All Categories" value=""></el-option>
            <el-option 
              v-for="category in uniqueCategories" 
              :key="category" 
              :label="category" 
              :value="category"
            ></el-option>
          </el-select>
          <el-select v-model="sortOption" placeholder="Sort by" class="blogos-filter-select">
            <el-option label="Newest" value="newest"></el-option>
            <el-option label="Oldest" value="oldest"></el-option>
            <el-option label="Most Popular" value="popular"></el-option>
          </el-select>
        </div>
      </div>
      
      <!-- 响应式博客网格 -->
      <div class="blogos-grid">
        <div 
          v-for="post in filteredPosts" 
          :key="post.id" 
          class="blogos-card"
          @click="showBlogDetail(post)"
        >
          <div class="blogos-card-image" :style="{ backgroundImage: `url(${post.image || '/default-blog-image.jpg'})` }">
            <div class="blogos-card-overlay">
              <div class="blogos-categories">
                <span v-for="(category, index) in post.categories" :key="index" class="blogos-category-badge">
                  {{ category }}
                </span>
              </div>
            </div>
          </div>
          <div class="blogos-card-content">
            <div class="blogos-card-meta">
              <span class="reading-time"><i class="el-icon-time"></i> {{ post.readingTime }}</span>
              <span class="blogos-date">{{ formatDate(post.date) }}</span>
            </div>
            <div class="blog-card-title">{{ post.title }}</div>
            <div class="blog-card-excerpt">{{ truncateText(post.content, 120) }}</div>
            <div class="blogos-card-footer">
              <div class="blogos-author-info">
                <img :src="post.authorAvatar || '/default-avatar.jpg'" alt="Author" class="blogos-author-avatar" />
                <span class="blogos-author-name">{{ post.author }}</span>
              </div>
              <div class="blogos-stats">
                <span class="blogos-stat-item"><i class="el-icon-view"></i> {{ post.views || 0 }}</span>
                <span class="blogos-stat-item"><i class="el-icon-chat-dot-round"></i> {{ post.comments?.length || 0 }}</span>
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
      :title="selectedPost?.title" 
      custom-class="blogos-detail-dialog"
      :close-on-click-modal="true"
      :show-close="true"
      width="80%"
      top="5vh"
      destroy-on-close
    >
      <div class="blogos-detail-container">
        <!-- 博客详情头部 -->
        <div class="blogos-detail-header">
          <div class="blogos-author-container">
            <img 
              :src="selectedPost?.authorAvatar || '/default-avatar.jpg'" 
              :alt="selectedPost?.author" 
              class="blog-author-avatar"
            />
            <div class="blogos-author-info">
              <h4 class="blogos-author-name">{{ selectedPost?.author }}</h4>
              <div class="blogos-publish-date">
                Published on {{ formatDate(selectedPost?.date) }}
              </div>
            </div>
            <el-button 
              v-if="selectedPost && !isOwnPost" 
              class="blogos-follow-btn-blog" 
              size="small"
              :class="{ 'blogos-following': isFollowing }"
              @click.stop="handleFollowClick(selectedPost.authorId)"
            >
              <span class="blogos-follow-text">{{ isFollowing ? 'Following' : 'Follow' }}</span>
            </el-button>
          </div>
          <div class="blogos-categories-container">
            <span v-for="(category, index) in selectedPost?.categories" :key="index" class="blogos-detail-category">
              {{ category }}
            </span>
          </div>
        </div>
        
        <!-- 博客详情内容区 -->
        <div class="blogos-detail-content">
          <!-- 博客轮播图 -->
          <div class="blogos-image-carousel" v-if="selectedPost?.images && selectedPost.images.length > 0">
            <el-carousel :interval="4000" type="card" height="400px">
              <el-carousel-item v-for="(image, index) in selectedPost.images" :key="index">
                <img :src="image" :alt="`Blog image ${index + 1}`" class="carousel-image" />
              </el-carousel-item>
            </el-carousel>
          </div>
          
          <!-- 或者显示单张特色图片 -->
          <div class="blogos-featured-image" v-else-if="selectedPost?.image">
            <img :src="selectedPost.image" :alt="selectedPost.title" class="blogos-featured-image" />
          </div>
          
          <!-- 博客正文 -->
          <div class="blogos-text-content">
            <p>{{ selectedPost?.content }}</p>
          </div>
          
          <!-- 标签区域 -->
          <div class="blogos-tags-container" v-if="selectedPost?.tags && selectedPost.tags.length > 0">
            <h4>Tags:</h4>
            <div class="blogos-tag-list">
              <span v-for="(tag, index) in selectedPost.tags" :key="index" class="blogos-tag">
                #{{ tag }}
              </span>
            </div>
          </div>
          
          <!-- 互动区域 -->
          <div class="blogos-interaction-bar">
            <div class="blogos-interaction-left">
              <button class="interaction-btn like-btn" @click.stop="toggleLike">
                <i :class="isLiked ? 'el-icon-star-on' : 'el-icon-star-off'"></i>
                <span>{{ likeCount }}</span>
              </button>
              <button class="interaction-btn comment-btn" @click.stop="focusCommentInput">
                <i class="blogos-el-icon-chat-dot-round"></i>
                <span>{{ selectedPost?.comments?.length || 0 }}</span>
              </button>
            </div>
            <div class="blogos-interaction-right">
              <button class="blogos-interaction-btn share-btn" @click.stop="sharePost">
                <i class="blogos-el-icon-share"></i>
                <span>Share</span>
              </button>
            </div>
          </div>
        </div>
        
        <!-- 评论区域 -->
        <div class="blogos-comments-section">
          <h3 class="blogos-comments-title">Comments ({{ selectedPost?.comments?.length || 0 }})</h3>
          
          <!-- 评论输入框 -->
          <div class="blogos-comment-input-container">
            <textarea 
              ref="commentInput"
              v-model="newComment" 
              placeholder="Write a comment..." 
              class="blogos-comment-textarea"
              rows="3"
            ></textarea>
            <button 
              class="blogos-submit-comment-btn" 
              @click.stop="submitComment"
              :disabled="!newComment.trim() || !userStore.user"
            >
              {{ userStore.user ? 'Post Comment' : 'Login to Comment' }}
            </button>
          </div>
          
          <!-- 评论列表 -->
          <div class="blogos-comments-list">
            <div 
              v-for="comment in selectedPost?.comments" 
              :key="comment.id" 
              class="blogos-comment-item"
            >
              <div class="blogos-comment-header">
                <img 
                  :src="comment.userAvatar || '/default-avatar.jpg'" 
                  :alt="comment.userName" 
                  class="blogos-commenter-avatar"
                />
                <div class="blogos-comment-info">
                  <div class="blogos-commenter-name">{{ comment.userName }}</div>
                  <div class="blogos-comment-date">{{ formatDate(comment.date) }}</div>
                </div>
              </div>
              <div class="blogos-comment-content">
                <p>{{ comment.content }}</p>
              </div>
              <div class="blogos-comment-actions">
                <button class="blogos-comment-action-btn" @click.stop="replyToComment(comment)">
                  Reply
                </button>
                <button class="blogos-comment-action-btn" @click.stop="likeComment(comment)">
                  {{ comment.isLiked ? 'Liked' : 'Like' }} ({{ comment.likes || 0 }})
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </el-dialog>
  </div>
</template>


