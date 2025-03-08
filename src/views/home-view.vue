<script setup lang="ts">
import { ref, computed, watch, onMounted, nextTick, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import walletItem from '@/components/wallet-item.vue';
import { useBlogStore } from '@/stores/blog';
import { usecomponentsStore } from '@/stores/components';
import { ElMessageBox, ElMessage, useTransitionFallthrough } from 'element-plus';
import { Auth } from '@/services/auth';
import { useUserStore } from '@/stores/user';
import BlurText from '@/components/BlurText.vue';
import LoadingScreen from '@/components/LoadingScreen.vue';
import commonHeader from '@/views/common/common-header.vue';

// 引入定位和天气
import { destinations } from '@/assets/destinations';
import { getReverseGeocoding } from '@/utils/geolocationService';

import { generateUserPrompt } from '@/stores/userprompt';
import { getImageUrl } from '@/utils';

// -------------------
// Trip Options 部分
const selectedLocation = ref('');
const selectedDestination = ref('');

const userLocation = ref('');
const userDestination = ref('');
const userFlag = ref('');
const destinationFlag = ref('');
const isLoading = ref(true);
const contentReady = ref(false);
const errorMessage = ref('');

const store = useBlogStore();
const router = useRouter();
const auth = new Auth();
const componentsStore = usecomponentsStore();
const userStore = useUserStore();

const originWeather = computed(() => componentsStore.originWeather);
const originWeatherIcon = computed(() => componentsStore.originWeatherIcon);
const destinationWeather = computed(() => componentsStore.destinationWeather);
const destinationWeatherIcon = computed(() => componentsStore.destinationWeatherIcon);

const preferenceOptions = ref([
  { name: 'Sightseeing', icon: '🌆' },
  { name: 'Educational', icon: '🎓' },
  { name: 'Business', icon: '💼' },
  { name: 'Medical', icon: '🏥' },
  { name: 'Cuisine', icon: '🍴' },
  { name: 'Culture', icon: '🎭' },
]);

// 用户选择的旅游偏好
const selectedOptions = ref<string[]>([]);
// 自动生成的 prompt 文本
const userInput = ref('');

const updateUserInput = () => {
  userInput.value = generateUserPrompt(selectedLocation.value || 'Unknown', selectedDestination.value || 'Unknown', selectedOptions.value);
};

watch([selectedLocation, selectedDestination, selectedOptions], () => {
  if (!userInput.value) {
    updateUserInput();
  }
});

const handleLocationClick = async () => {
  isLoading.value = true;
  errorMessage.value = '';
  try {
    const position = await new Promise<GeolocationPosition>((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        timeout: 5000,
      });
    });
    const { city, country, flagUrl } = await getReverseGeocoding(position.coords.latitude, position.coords.longitude);
    selectedLocation.value = city;
    userLocation.value = `${city}, ${country}`;
    userFlag.value = flagUrl;
    
    componentsStore.getWeather(city, false);

    updateUserInput();
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '定位失败';
  } finally {
    isLoading.value = false;
  }
};

const handleLocationChange = async (value: string) => {
  selectedLocation.value = value;
  const loc = destinations.find((item) => item.value === value);
  if (loc) {
    userFlag.value = loc.flagUrl || '';
    userLocation.value = loc.label;
  }
  componentsStore.getWeather(value, false);
  updateUserInput();
};

const handleDestinationSelect = async (value: string) => {
  selectedDestination.value = value;
  const dest = destinations.find((item) => item.value === value);
  if (dest) {
    destinationFlag.value = dest.flagUrl || '';
    userDestination.value = dest.label;
  } else {
    destinationFlag.value = '';
  }
  componentsStore.getWeather(value, true);

  updateUserInput();
};

const togglePreference = (optionName: string) => {
  const index = selectedOptions.value.indexOf(optionName);
  if (index > -1) {
    selectedOptions.value.splice(index, 1);
  } else {
    selectedOptions.value.push(optionName);
  }
  updateUserInput();
};

const handleEnter = (event: Event | KeyboardEvent) => {
  event.preventDefault();
  router.push({ name: 'conversation', query: { prompt: userInput.value } });
};

const submitItinerary = () => {
  router.push({
    name: 'generator',
    query: {
      prompt: userInput.value,
      location: selectedLocation.value,
      destination: selectedDestination.value
    }
  });
};

const allPosts = computed(() => store.blogs);
const condition = computed(() => store.condition);


const dialogBlog = ref(false);
const selectedBlog = computed(() => store.blog);

// 添加分页和无限滚动相关的状态
// 滚动加载相关状态
const currentPage = ref(1);
const isLoadingMore = ref(false);
const hasMoreBlogs = ref(true);
const bottomTrigger = ref(null);
const observer = ref(null);

onMounted(() => {
  // 页面载入时，自动获取一次定位和加载博客列表
  store.getBlogList();
  handleLocationClick();
  if (auth.get() && !userStore.user) {
    userStore.getUserInfo();
  }
  
  // 确保页面始终会显示 - 安全机制
  setTimeout(() => {
    if (isLoading.value) {
      console.log('强制完成加载');
      isLoading.value = false;
      contentReady.value = true;
    }
  }, 5000);

  // 添加Intersection Observer设置
  // 设置无限滚动观察器
  observer.value = new IntersectionObserver(
    (entries) => {
      const entry = entries[0];
      if (entry.isIntersecting && !isLoadingMore.value && hasMoreBlogs.value) {
        console.log('Trigger element is visible, loading more blogs...');
        loadMoreBlogs();
      }
    },
    { threshold: 0.1 } // 当10%的目标元素可见时触发
  );
  
  // 开始观察底部触发元素
  nextTick(() => {
    if (bottomTrigger.value) {
      observer.value.observe(bottomTrigger.value);
      console.log('Now observing the bottom trigger element');
    }
  });
});

// 清理IntersectionObserver
onUnmounted(() => {
  if (observer.value) {
    observer.value.disconnect();
  }
});

// -----------------------------
// 社交帖子模块部分

// 修改：点击博客时传入帖子的 id 而非整个对象  // Modified
const showBlogDetail = async (id: number) => {
  // 重置图片索引
  currentImageIndex.value = 0;
  
  try {
    // 添加参数指示后端返回所有回复，不分页
    await store.getBlogByID(id, { includeAllReplies: true });
    dialogBlog.value = true;
    
    // 重置评论区状态
    expandedReplies.value = [];
    expandedComments.value = []; // 重置已展开的评论列表
    replyContent.value = '';
    replyTarget.value = null;
    
    // 在对话框打开后滚动到顶部
    nextTick(() => {
      const detailBox = document.querySelector('.blog-details-home');
      if (detailBox) {
        detailBox.scrollTop = 0;
      }
    });
  } catch (error) {
    console.error('无法加载博客详情:', error);
    ElMessage.error('Failed to load blog details');
  }
};

const closeBlogDetail = () => {
  dialogBlog.value = false;
  // 恢复背景滚动
  document.body.style.overflow = '';
  // 清空评论输入
  newComment.value = '';
};

const socialFilters = ref([
  { label: 'Star', icon: '⭐' },
  { label: 'Most Popular', icon: '🔥' },
  { label: 'NFT', icon: '🖼️' },
  { label: 'Sightseeing', icon: '🌇' },
  { label: 'Educational', icon: '🎓' },
  { label: 'Business', icon: '💼' },
  { label: 'Medical', icon: '🏥' },
  { label: 'Cuisine', icon: '🍴' },
  { label: 'Culture', icon: '🎭' },
]);

const selectedFilters = ref<string[]>([]);
const toggleSocialFilter = (filterLabel: string) => {
  const idx = selectedFilters.value.indexOf(filterLabel);
  if (idx > -1) {
    selectedFilters.value.splice(idx, 1);
  } else {
    selectedFilters.value.push(filterLabel);
  }
};

const searchQuery = ref('');

// 修改：确保使用 userPosts.value  // Modified
const filteredPosts = computed(() => {
  let posts = allPosts.value;
  const query = searchQuery.value.toLowerCase().trim();

  // 先应用搜索过滤
  if (query) {
    posts = posts.filter((post) => {
      const titleMatch = post.title.toLowerCase().includes(query);
      const contentMatch = post.content.toLowerCase().includes(query);
      const locationMatch = post.location?.toLowerCase().includes(query);
      const tagMatch = post.tags.some((tag) => tag.toLowerCase().includes(query));
      const userMatch = post.user.name.toLowerCase().includes(query);
      return titleMatch || contentMatch || locationMatch || tagMatch || userMatch;
    });
  }

  // 再应用标签过滤
  if (selectedFilters.value.length === 0) {
    return posts;
  }
  if (selectedFilters.value.includes('Recommendation')) {
    return posts;
  } else if (selectedFilters.value.includes('Most Popular')) {
    return [...posts].sort((a, b) => b.likes - a.likes);
  } else if (selectedFilters.value.includes('NFT')) {
    return posts.filter((post) => post.isNFT);
  } else {
    return posts.filter((post) => post.tags.some((tag) => selectedFilters.value.includes(tag)));
  }
});

const postsToShow = ref(12);
const postsDisplayed = computed(() => {
  return filteredPosts.value.slice(0, postsToShow.value);
});

const loadMorePosts = () => {
  if (postsToShow.value < allPosts.value.length) {
    // Modified: 使用 userPosts.value.length
    postsToShow.value += 6;
  }
};

function handleSearch(event: KeyboardEvent) {
  if (event.key === 'Enter') {
    event.preventDefault();
    postsToShow.value = 12;
  }
}

const handlePostClick = async () => {
  if (!auth.get()) {
    try {
      await ElMessageBox.confirm('You need to login first to post a blog. Would you like to login now?', 'Login Required', {
        confirmButtonText: 'Go to Login',
        cancelButtonText: 'Cancel',
        type: 'warning',
      });
      router.push({ name: 'login' });
    } catch {
      // 用户点击取消
      return;
    }
  } else {
    // 已登录，直接跳转到发布页面
    router.push({ name: 'PostView' });
  }
};

// 关注状态
const isFollowing = ref(false);

// 添加一个计算属性，判断当前帖子是否是用户自己的
const isOwnPost = computed(() => {
  if (!userStore.user || !selectedBlog.value?.user) {
    return false;
  }
  // 增加一些日志输出帮助调试
  console.log('User ID:', userStore.user.id);
  console.log('Post User ID:', selectedBlog.value.user.id);
  
  // 确保两个ID都转为字符串进行比较，以防类型不同导致比较失败
  return String(userStore.user.id) === String(selectedBlog.value.user.id);
});

// 在博客详情打开时，检查关注状态
watch(() => selectedBlog.value, (newBlog) => {
  // 重新评估是否为自己的帖子
  console.log('Is own post:', isOwnPost.value);
  
  // 如果选中了博客且不是自己的博客，则检查关注状态
  if (newBlog && newBlog.user && !isOwnPost.value) {
    // 这里可以调用API检查是否已关注
    checkFollowStatus(newBlog.user.id);
  } else {
    // 自己的博客或无博客选中，重置关注状态
    isFollowing.value = false;
  }
}, { immediate: true });

// 添加一个函数来检查关注状态
const checkFollowStatus = async (userId) => {
  try {
    // 假设API返回一个布尔值表示是否已关注
    const isFollowed = await userStore.isFollowing(userId);
    isFollowing.value = isFollowed.data.is_following;
    
  } catch (error) {
    console.error('Failed to check follow status:', error);
  }
};

// 修复关注/取消关注功能的逻辑
const handleFollowClick = async (id) => {
  if (!id) return;
  try {
    if (isFollowing.value) {
      // 取消关注功能
      await userStore.unfollow(id);  // 修正为unfollow
      isFollowing.value = false;
      ElMessage.success('Unfollowed successfully');
    } else {
      // 关注功能
      await userStore.follow(id);    // 修正为follow
      isFollowing.value = true;
      ElMessage.success('Following successfully');
    }
  } catch (error) {
    ElMessage.error('Failed to update following status');
  }
};

// 恢复登录按钮处理方法
const handleLoginClick = async () => {
  if (auth.get()) {
    // 已登录状态
    ElMessage({
      message: 'You are already logged in',
      type: 'info',
      duration: 2000,
    });
    return;
  }
  // 未登录状态，跳转到登录页面
  router.push({ name: 'login' });
};
const currentImageIndex = ref(0);

// 添加图片导航方法
function prevImage() {
  if (selectedBlog.value?.image && selectedBlog.value.image.length > 1) {
    currentImageIndex.value = (currentImageIndex.value - 1 + selectedBlog.value.image.length) % selectedBlog.value.image.length;
  }
}

function nextImage() {
  if (selectedBlog.value?.image && selectedBlog.value.image.length > 1) {
    currentImageIndex.value = (currentImageIndex.value + 1) % selectedBlog.value.image.length;
  }
}

// 添加评论功能到博客弹窗
const showCommentInput = ref(false);
const newComment = ref('');

const submitComment = async () => {
  if (!newComment.value.trim()) return;
  if (!selectedBlog.value?.id) return;
  
  // 检查用户是否已登录
  if (!auth.get()) {
    try {
      await ElMessageBox.confirm(
        'You need to login first to comment. Would you like to login now?', 
        'Login Required', 
        {
          confirmButtonText: 'Go to Login',
          cancelButtonText: 'Cancel',
          type: 'warning',
        }
      );
      router.push({ name: 'login' });
    } catch {
      // 用户点击取消
      return;
    }
    return;
  }

  store.commenttoBlog(selectedBlog.value?.id, newComment.value).then(res=>{
    console.log(res);
  }).catch(e=>{
    console.log(e);
  }).finally(()=>{
    // 清空输入
    newComment.value = '';
    if(selectedBlog.value?.id) store.getBlogByID(selectedBlog.value?.id);
    
    // 滚动到新评论
    nextTick(() => {
      scrollToComments();
    });
  });  
  
  // 模拟添加评论
  ElMessage({
    message: 'Comment submitted successfully!',
    type: 'success'
  });
  
  newComment.value = '';
};

const scrollToComments = () => {
  const commentsSection = document.querySelector('.comments-container-home');
  const detailRight = document.querySelector('.detail-right-home');
  
  if (commentsSection && detailRight) {
    detailRight.scrollTo({
      top: commentsSection.offsetTop - 20,
      behavior: 'smooth'
    });
  }
};

// 添加图片错误处理方法
function handleImageError(event: Event) {
  // 设置默认图片
  const target = event.target as HTMLImageElement;
  target.src = '/path/to/fallback-image.jpg'; // 替换为你的默认图片路径
  target.classList.add('image-error');
}

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

// 导航菜单状态
const menuActive = ref(false);

// 切换菜单显示
const toggleMenu = () => {
  menuActive.value = !menuActive.value;
};

// 处理动画完成
const handleAnimationComplete = () => {
  console.log('Loading animation complete!');
};

// 处理加载完成事件
const handleLoadingComplete = () => {
  // 直接设置加载完成，不使用延迟
  isLoading.value = false;
  contentReady.value = true;
};

// 添加加载更多博客的方法
/**
 * 加载更多博客的方法
 */
const loadMoreBlogs = async () => {
  if (isLoadingMore.value || !hasMoreBlogs.value) return;
  
  isLoadingMore.value = true;
  try {
    // 增加页码
    currentPage.value++;
    console.log('Loading more blogs, page:', currentPage.value);
    
    // 调用store方法加载更多博客
    const newBlogs = await store.loadMoreBlogs(currentPage.value);
    
    // 如果没有更多博客，设置hasMoreBlogs为false
    if (!newBlogs || newBlogs.length === 0) {
      hasMoreBlogs.value = false;
      console.log('No more blogs to load');
    }
  } catch (error) {
    console.error('Failed to load more blogs:', error);
  } finally {
    isLoadingMore.value = false;
  }
};

// 评论相关的状态
const activeCommentId = ref<number | null>(null);
const replyContent = ref('');
const isSubmittingReply = ref(false);
// 展开回复相关的状态
const expandedReplies = ref<number[]>([]);

// 切换回复展开/折叠
const toggleReplies = (commentId: number) => {
  if (expandedReplies.value.includes(commentId)) {
    // 如果已展开，则折叠
    expandedReplies.value = expandedReplies.value.filter(id => id !== commentId);
  } else {
    // 如果未展开，则展开并加载所有回复
    expandedReplies.value.push(commentId);
    // 确保加载该评论的所有回复
    loadAllRepliesForComment(commentId);
  }
};

// 加载评论的所有回复
const loadAllRepliesForComment = async (commentId: number) => {
  try {
    if (selectedBlog.value) {
      // 如果后端API支持按评论ID加载所有回复，可以这样调用
      // 示例: await store.loadAllRepliesForComment(selectedBlog.value.id, commentId);
      
      // 临时解决方案: 如果后端已经返回了所有回复，这里可以直接返回
      console.log(`Loading all replies for comment all replies mment ${commentId}`);
    }
  } catch (error) {
    console.error('Failed to load all replies:', error);
    ElMessage.error('Failed to load all replies');
  }
};

// 检查回复是否已展开
const isRepliesExpanded = (commentId: number) => {
  return expandedReplies.value.includes(commentId);
};

// 全部展开函数也需要确保加载所有回复
const toggleAllReplies = () => {
  if (selectedBlog.value && selectedBlog.value.comments) {
    // 检查是否所有回复都已展开
    const allCommentsWithReplies = selectedBlog.value.comments
      .filter(comment => comment.replies && comment.replies.length > 0)
      .map(comment => comment.id);
      
    const allExpanded = allCommentsWithReplies.every(id => 
      expandedReplies.value.includes(id)
    );
    
    if (allExpanded) {
      // 如果所有回复都已展开，则全部折叠
      expandedReplies.value = [];
    } else {
      // 否则全部展开
      expandedReplies.value = [...allCommentsWithReplies];
      // 确保加载所有评论的所有回复
      allCommentsWithReplies.forEach(commentId => {
        loadAllRepliesForComment(commentId);
      });
    }
  }
};

// 获取是否全部展开状态
const areAllRepliesExpanded = computed(() => {
  if (!selectedBlog.value || !selectedBlog.value.comments) return false;
  
  const commentsWithReplies = selectedBlog.value.comments
    .filter(comment => comment.replies && comment.replies.length > 0);
  
  if (commentsWithReplies.length === 0) return false;
  
  return commentsWithReplies.every(comment => 
    expandedReplies.value.includes(comment.id)
  );
});

// 获取回复对象用户名
const getReplyTargetName = (comment: any) => {
  if (!selectedBlog.value || !selectedBlog.value.comments) return '';
  
  // 查找原始评论的用户名
  const originalComment = selectedBlog.value.comments.find(c => c.id === comment.parent_id);
  return originalComment ? originalComment.user.name : '';
};

// 添加回复目标状态
const replyTarget = ref<{id: number, type: 'comment' | 'reply', parentId?: number} | null>(null);

// 切换回复输入框显示状态
const toggleReplyInput = (id: number, type: string = 'comment', parentId?: number) => {
  // 如果当前已经是在回复这个评论/回复，则关闭回复框
  if (replyTarget.value && 
      replyTarget.value.id === id && 
      replyTarget.value.type === type) {
    replyTarget.value = null;
    replyContent.value = '';
  } else {
    // 否则打开回复框
    if (type === 'reply' && !parentId) {
      console.error('回复需要提供父评论ID');
      return;
    }
    
    replyTarget.value = {
      id,
      type,
      parentId
    };
    
    // 添加延迟滚动到回复框，确保DOM已更新
    nextTick(() => {
      // 滚动到回复框
      const replyInputContainer = document.querySelector('.reply-input-container-home');
      if (replyInputContainer) {
        replyInputContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    });
    
    replyContent.value = '';
  }
};

// 取消回复
const cancelReply = () => {
  replyTarget.value = null;
  replyContent.value = '';
};

// 提交回复
const submitReply = async () => {
  if (!replyContent.value.trim()) return;
  
  isSubmittingReply.value = true;
  try {
    // 根据回复类型确定正确的父评论ID
    const commentId = replyTarget.value?.type === 'comment' 
      ? replyTarget.value.id 
      : replyTarget.value?.parentId;
      
    await store.commenttoComment(replyTarget.value.id, replyContent.value);
    ElMessage.success('Reply added successfully');
    store.getBlogByID(selectedBlog.value?.id);
    replyTarget.value = null;
    replyContent.value = '';
  } catch (error) {
    console.error('Failed to add reply:', error);
    ElMessage.error('Failed to add reply. Please try again.');
  } finally {
    isSubmittingReply.value = false;
  }
};

// 添加"查看更多回复"功能
const expandedComments = ref<number[]>([]);

// 决定显示哪些回复 - 默认只显示前2条
const displayedReplies = (comment: any) => {
  if (expandedComments.value.includes(comment.id)) {
    return comment.replies; // 如果已展开，显示所有回复
  } else {
    return comment.replies.slice(0, 2); // 否则只显示前2条
  }
};

// 展开查看所有回复
const expandReplies = async (commentId: number|undefined) => {
  // 如果需要调用API加载更多回复，可以在这里添加
  // await store.loadAllRepliesForComment(selectedBlog.value.id, commentId);
  if (commentId) store.getComments(commentId);
  // 标记该评论已展开
  // expandedComments.value.push(commentId);
};

</script>

<template>
  <!-- 加载页 -->
  <LoadingScreen 
    v-if="isLoading" 
    @complete="handleLoadingComplete" 
    :duration="1800"
  />

  <div class="background-layer" :class="{ 'visible': !isLoading }"></div>
  <div class="home" :class="{ 'content-visible': !isLoading }">
    <common-header />
    <!-- <h1 class="welcome-text">Welcome to iPoloGO</h1>
    <h2 class="welcome-text2">To Explore, To Share, To Earn</h2> -->
    <section class="welcome-section">
      <BlurText
        text="Welcome to iPoloGO"
        delay={180}
        animateBy="words"
        direction="top"
        @animation-complete="handleAnimationComplete"
        class="welcome-text"
      />
      <BlurText
        text="To Explore, To Share, To Earn"
        delay={180}
        animateBy="words"
        direction="bottom"
        class="welcome-text2"
      />
    </section>

    <!-- 主体区域 -->
    <main class="main">
      <!-- 行程规划模块 -->
      <div class="combined-card">
        <div class="plan-header">
          <h3>Plan Your Itinerary</h3>
        </div>
        <hr class="horizontal-divider" />
        <div class="location-destination-row">
          <!-- Localization -->
          <div class="field location-field">
            <div class="field-label">Localization</div>
            <el-select v-model="selectedLocation" placeholder="Select location" 
            class="select" filterable @change="handleLocationChange">
              <el-option v-for="(loc, index) in destinations" :key="index" :label="loc.label" :value="loc.value" />
            </el-select>
            <div class="ld-info">
              <img v-if="userFlag" :src="userFlag" alt="Flag" class="flag" />
              <div class="location-info">
                <span class="location-name">{{ userLocation }}</span>
                <div class="weather-info" v-if="originWeather">
                  <span class="weather-icon" :class="originWeatherIcon"></span>
                  <span class="weather-data">{{ originWeather }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Destination -->
          <div class="field destination-field">
            <div class="field-label">Destination</div>
            <el-select v-model="selectedDestination" placeholder="Select destination" 
            class="select" filterable @change="handleDestinationSelect">
              <el-option v-for="(destination, index) in destinations" :key="index" 
              :label="destination.label" :value="destination.value" />
            </el-select>
            <div class="ld-info">
              <img v-if="destinationFlag" :src="destinationFlag" alt="Destination Flag" class="flag" />
              <div class="location-info">
                <span class="location-name">{{ userDestination }}</span>
                <div class="weather-info" v-if="destinationWeather">
                  <span class="weather-icon" :class="destinationWeatherIcon"></span>
                  <span class="weather-data">{{ destinationWeather }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        <hr class="horizontal-divider" />

        <!-- 旅游偏好  -->
        <div class="preference-options">
          <span v-for="option in preferenceOptions" :key="option.name" class="preference-option" 
          :class="{ selected: selectedOptions.includes(option.name) }" @click="togglePreference(option.name)">
            <span class="option-icon">{{ option.icon }}</span>
            <span class="option-name">{{ option.name }}</span>
          </span>
        </div>

        <!-- 用户行程输入框 -->
        <div class="input-container">
          <el-input v-model="userInput" placeholder="Edit your trip prompt..." 
          class="itinerary-input" type="textarea" :rows="4" @keydown.enter="handleEnter" />
          <button class="togenerator" @click="submitItinerary">Start Now</button>
        </div>
      </div>

      <!-- 社交帖子模块 -->
      <section class="social-feed">
        <div class="social-header">
          <!-- 标题单独一行 -->
          <h3>Explore iPoloGO Community</h3>

          <!-- 搜索框、筛选选项和Post按钮放在下一行 -->
          <div class="social-header-controls">
            <!-- 搜索框 -->
            <input type="text" v-model="searchQuery" placeholder="Explore Anything..." 
            class="search-input-home" @keydown="handleSearch" />

            <!-- 横排筛选选项 -->
            <div class="social-filter-panel-horizontal">
              <button 
                v-for="item in socialFilters" 
                :key="item.label" 
                :class="{ active: selectedFilters.includes(item.label) }" 
                @click="toggleSocialFilter(item.label)"
              >
                <span class="filter-icon">{{ item.icon }}</span>
                <span class="filter-label">{{ item.label }}</span>
              </button>
            </div>

            <!-- Post按钮 -->
            <el-button class="custom-post-button" @click="handlePostClick">Post</el-button>
          </div>
        </div>

        <!-- 水平分割线 -->
        <hr class="horizontal-divider" />

        <!-- 博客展示区域 -->
        <div class="social-scroll">
          <div class="social-posts-panel" ref="postsPanel" style="overflow-y: auto; max-height: none;">
            <div 
              class="social-post-home" 
              :class="{ 'nft-post-home': post.isNFT }"
              v-for="post in allPosts" 
              :key="post.id" 
              @click="showBlogDetail(post.id)"
            >
              <!-- 博客图片 -->
              <img 
                v-if="post.image && post.image.length > 0" 
                :src="getImageUrl(post.image[0])" 
                alt="Post Image" 
                class="post-image-home" 
              />

              <!-- 博客内容 -->
              <div class="post-content-home">
                <h2 class="post-title-home">{{ post.title }}</h2>
                <p class="post-text-home">{{ post.content }}</p>
              </div>

              <!-- 博客底部信息 -->
              <div class="post-footer-home">
                <!-- 作者信息 -->
                <div class="author-info-home">
                  <img v-if="post.user?.avatar" :src="getImageUrl(post.user.avatar)" alt="Avatar" class="post-avatar-home" />
                  <span class="author-name-home">{{ post.user?.name }}</span>
                </div>

                <!-- 统计信息 -->
                <div class="post-stats">
                  <span class="likes">❤️ {{ post.likes }}</span>
                  <span class="comments">💬 {{ post.comments_count }}</span>
                  <span class="coins" v-if="post.isNFT">💰 {{ post.coins }}</span>
                </div>
              </div>
            </div>
            <div ref="bottomTrigger" class="bottom-load-container">
              <div v-if="isLoadingMore" class="loading-indicator">Loading more posts...</div>
              <button 
                v-else-if="hasMoreBlogs" 
                class="load-more-btn-home" 
                @click="loadMoreBlogs"
              >
                Load More
              </button>
              <div v-else>No more posts to show</div>
            </div>
          </div>
        </div>
      </section>
    </main>

    <!-- 搜索结果为空提示 -->
    <div v-if="searchQuery && filteredPosts.length === 0" class="no-results">No posts found for "{{ searchQuery }}"</div>
  

  <!-- 博客详情弹出层 -->
  <div class="blog-detail-overlay-home" v-if="dialogBlog" @click.self="closeBlogDetail">
    <div class="blog-detail-container-home" :class="{ 'nft-post-home': selectedBlog?.isNFT }">
      <!-- 关闭按钮 -->
      <button class="close-button-home" @click="closeBlogDetail">×</button>
      
      <!-- 左侧区域：图片和统计信息 -->
      <div class="detail-left-home">
        <!-- 图片区域 -->
        <div class="image-section-home">
          <div class="image-slider-home">
            <div class="image-wrapper-home" :style="{ transform: `translateX(-${currentImageIndex * 100}%)` }">
              <img 
                v-for="(image, index) in selectedBlog?.image" 
                :key="index"
                :src="getImageUrl(image)"
                alt="Blog Image" 
                class="detail-image-home"
                @error="handleImageError"
                
              />
            </div>
            <!-- 图片加载指示器 -->
            <!-- <div class="image-loading" v-if="selectedBlog?.image?.length === 0">
              <span>No images available</span>
            </div> -->
            <!-- 导航按钮 -->
            <button 
              class="nav-btn-home prev-home" 
              @click.stop="prevImage" 
              v-if="selectedBlog && selectedBlog?.image?.length > 1">❮</button>
            <button 
              class="nav-btn-home next-home" 
              @click.stop="nextImage" 
              v-if="selectedBlog && selectedBlog?.image?.length > 1">❯</button>
          </div>
        </div>
        
        <!-- 统计信息栏 -->
        <div class="stats-bar-home">
          <!-- 统计信息 -->
          <div class="stats-info-home">
            <span class="likes-home">❤️ {{ selectedBlog?.likes }}</span>
            <span class="comments-home" @click="scrollToComments">💬 {{ selectedBlog?.comments_count }}</span>
            <span class="coins-home" v-if="selectedBlog?.isNFT">💰 {{ selectedBlog?.coins }}</span>
          </div>

          <!-- 简化的评论输入框 -->
          <div class="quick-comment-input">
            <input 
              type="text" 
              v-model="newComment" 
              placeholder="Add a comment..." 
              @keyup.enter="submitComment"
              class="comment-input-home"
            />
            <button 
              class="submit-quick-comment" 
              @click="submitComment" 
              :disabled="!newComment.trim()"
            >
              <span>💬</span>
            </button>
          </div>
        </div>
      </div>

      <!-- 右侧内容区域 -->
      <div class="detail-right-home" ref="detailRight">
        <!-- 用户信息和标题 -->
        <div class="user-header-home">
          <div class="author-container">
            <div class="author-info-home">
              <img 
                :src="getImageUrl(selectedBlog?.user?.avatar || '')" 
                alt="Author Avatar" 
                class="author-avatar-home"
              />
              <span class="author-name-home">{{ selectedBlog?.user?.name }}</span>
              <el-button 
                v-if="!isOwnPost" 
                class="follow-btn" 
                size="small"
                :class="{ 'following': isFollowing }"
                @click.stop="handleFollowClick(selectedBlog?.user?.id)"
              >
                <span class="follow-icon">+</span>
                <span class="follow-text">{{ isFollowing ? 'Following' : 'Follow' }}</span>
              </el-button>
            </div>
          </div>
          <h2 class="blog-title-home">{{ selectedBlog?.title }}</h2>
        </div>
        
        <!-- 标签区域 -->
        <div class="tags-section-home">
          <div class="nft-tag-home" v-if="selectedBlog?.isNFT">NFT</div>
          <span class="tag-home" v-for="tag in selectedBlog?.tags" :key="tag">
            {{ tag }}
          </span>
        </div>
        
        <!-- 博客内容 -->
        <div class="content-section-home">
          <p class="blog-content-home">{{ selectedBlog?.content }}</p>
        </div>
        
        <!-- 评论部分 -->
        <div class="comments-container-home" ref="commentsSection">
          <div class="comments-header-home">
            <h3>Comments</h3>
            <div class="comments-actions-home">
              <span class="comment-count-home">{{ selectedBlog?.comments_count || 0 }}</span>
            </div>
          </div>
          <div class="comments-list-home">
            <div v-for="comment in selectedBlog?.comments" :key="comment.id" class="comment-item-home">
              <div class="comment-row-home">
                <img 
                  :src="getImageUrl(comment.user.avatar)" 
                  alt="Commenter Avatar" 
                  class="comment-avatar-home"
                />
                <span class="comment-username-home">{{ comment.user.name }}</span>
                <div class="comment-content-wrapper">
                  <p class="comment-text-home" 
                  @click="toggleReplyInput(comment.id)">{{ comment.content }}</p>
                  
                  <!-- 回复图标 -->
                  <el-tooltip content="Reply to this comment" placement="top">
                    <span class="reply-icon" @click="toggleReplyInput(comment.id)">↩️</span>
                  </el-tooltip>
                </div>
              </div>
              
              <!-- 显示评论的回复 -->
              <div 
                v-if="comment.replies && comment.replies.length > 0" 
                class="comment-replies-home"
              >
                <div v-for="reply in comment.replies" :key="reply.id" 
                class="reply-item-home">
                  <div class="reply-row-home">
                    <img 
                      :src="getImageUrl(reply.user.avatar)" 
                      alt="Replier Avatar" 
                      class="reply-avatar-home-view"
                    />
                    <div class="reply-info">
                      <div class="reply-header">
                        <span class="reply-username-home">{{ reply.user.name }}</span>
                        <span class="replying-to">replying to</span>
                        <span class="target-name-show">@{{ comment.user.name }}</span>
                      <div class="reply-content-wrapper">
                        <p class="reply-text-home" 
                          @click.stop.prevent="toggleReplyInput(reply.id, 'reply', comment.id)">{{ reply.content }}</p>
                        <!-- 回复到回复的图标 -->
                        <el-tooltip content="Reply to this reply" placement="top">
                          <span class="reply-icon-reply-to-reply" 
                          @click.stop.prevent="toggleReplyInput(reply.id, 'reply', comment.id)">↩️</span>
                        </el-tooltip>
                      </div>
                      </div>
                    </div>
                  </div>
                  <!-- 添加查看更多回复按钮 -->
                </div>
                <div v-if="comment.total_replies > 2 && comment.total_replies !== comment.replies.length" 
                    class="view-more-replies" @click="expandReplies(comment.id)">
                  <span class="view-more-text-r2r">
                  View {{ comment.total_replies - 2 }} more {{ comment.total_replies - 2 === 1 ? 'reply' : 'replies' }}
                  </span>
                  <span class="view-more-icon-r2r">↓</span>
                </div>
              </div>
              
              <!-- 回复输入框 -->
              <div class="reply-input-container-home" v-if="replyTarget && 
                ((replyTarget.type === 'comment' && replyTarget.id === comment.id) || 
                (replyTarget.type === 'reply' && replyTarget.parentId === comment.id))">
                <div class="replying-to-label">
                  <span>Replying to</span>
                  <span class="target-name">@{{ 
                    replyTarget.type === 'comment' 
                      ? comment.user.name 
                      : comment.replies.find(r => r.id === replyTarget.id)?.user.name 
                  }}</span>
                </div>
                <el-input
                  v-model="replyContent"
                  type="textarea"
                  :rows="1"
                  resize="none"
                  placeholder="Reply to this comment..."
                  maxlength="200"
                  show-word-limit
                  class="reply-textarea-home"
                ></el-input>
                <div class="reply-actions-home">
                  <el-button 
                    size="small" 
                    @click="cancelReply" 
                    class="cancel-reply-btn-home"
                  >Cancel</el-button>
                  <el-button 
                    type="primary" 
                    size="small" 
                    @click="submitReply" 
                    :loading="isSubmittingReply"
                    :disabled="!replyContent.trim()"
                    class="submit-reply-btn-home"
                  >Reply</el-button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
  <div v-if="searchQuery && filteredPosts.length === 0" class="no-results">No posts found for "{{ searchQuery }}"</div>
</div>
</template>

