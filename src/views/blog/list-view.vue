<script setup lang="ts">
import { ref, computed, watch, onMounted, nextTick, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { useBlogStore } from '@/stores/blog';
import { usecomponentsStore } from '@/stores/components';
import {  ElMessage } from 'element-plus';
import { useUserStore } from '@/stores/user';
import commonHeader from '@/layout/common-header.vue';
import blogItem from './blog-item.vue';
import BlogDetailDialog from './blog-detail-dialog.vue';
// import userPageDialog from '@/views/user/user-page-dialog.vue';
// 引入定位和天气
import { destinations } from '@/utils/destinations';
import { getReverseGeocoding } from '@/utils/geolocationService';

import { generateUserPrompt } from '@/stores/userprompt';
import postView from './post-view.vue';
import postPreview from './post-preview.vue';
import { ElMessageBox } from 'element-plus';
const showPostView = ref(false);
const showPreview = ref(false);
const previewData = ref({
  title: '',
  content: '',
  images: [] as string[],
  tags: [] as string[],
  preferences: [] as number[],
  location: [] as string[],
  isNFT: false
});
const props = defineProps({
  id: {
    type: String,
  },
});
const blogID = computed(() => props.id);
const dialogBlog = ref(false);

const closeBlogDetail = () => {
  router.push({
    name: 'home',
    params: { id: ''}
  });
};

watch(blogID, (val, old) => {
  if(val != old) showBlogDetail(Number(val));
});
// -------------------
// Trip Options 部分
const selectedLocation = ref('');
const selectedDestination = ref('');

const userLocation = ref('');
// const userDestination = ref('');
const userFlag = ref('');
// const destinationFlag = ref('');
const isLoading = ref(true);
const contentReady = ref(false);
const errorMessage = ref('');

const store = useBlogStore();
const router = useRouter();
const componentsStore = usecomponentsStore();
const userStore = useUserStore();

const originWeather = computed(() => componentsStore.originWeather);
// const originWeatherIcon = computed(() => componentsStore.originWeatherIcon);
// const destinationWeather = computed(() => componentsStore.destinationWeather);
// const destinationWeatherIcon = computed(() => componentsStore.destinationWeatherIcon);

const socialFilters = computed(() => store.socialFilters); // 社会过滤器


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

// const handleDestinationSelect = async (value: string) => {
//   selectedDestination.value = value;
//   const dest = destinations.find((item) => item.value === value);
//   if (dest) {
//     destinationFlag.value = dest.flagUrl || '';
//     userDestination.value = dest.label;
//   } else {
//     destinationFlag.value = '';
//   }
//   componentsStore.getWeather(value, true);

//   updateUserInput();
// };

const togglePreference = (optionName: string) => {
  const index = selectedOptions.value.indexOf(optionName);
  if (index > -1) {
    selectedOptions.value.splice(index, 1);
  } else {
    selectedOptions.value.push(optionName);
  }
  updateUserInput();
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
  userInput.value = '';
};

const allPosts = computed(() => store.blogs);
// const condition = computed(() => store.condition);


const selectedBlog = computed(() => store.blog);

// 添加分页和无限滚动相关的状态
// 滚动加载相关状态
const bottomTrigger = ref(null);
const observer = ref();

function nextPage() {
  store.getBlogList();
}

onMounted(async() => {

  await store.getSocialFilter();
  // 页面载入时，自动获取一次定位和加载博客列表
  await store.getBlogList(true);

  if(blogID.value) {
    showBlogDetail(Number(blogID.value));
  }
  handleLocationClick();

  // 确保页面始终会显示 - 安全机制
  setTimeout(() => {
    if (isLoading.value) {
      console.log('Done loading');
      isLoading.value = false;
      contentReady.value = true;
    }
  }, 5000);

  // 添加Intersection Observer设置
  // 设置无限滚动观察器
  observer.value = new IntersectionObserver(
    (entries) => {
      const entry = entries[0];
      if (entry.isIntersecting && !allPosts.value.loading && allPosts.value.has_next) {
        console.log('Trigger element is visible, loading more blogs...');
        nextPage();
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
  // 恢复背景滚动
  document.body.style.overflow = '';
  // 清理观察器
  if (observer.value) {
    observer.value.disconnect();
  }
});

// -----------------------------
// 社交帖子模块部分

// 修改：点击博客时传入帖子的 id 而非整个对象  // Modified
const showBlogDetail = async (id: number) => {
  // router.push({
  //   name:'home',
  //   params: {id: id.toString()}
  // })
  // 重置图片索引


  try {
    // 添加参数指示后端返回所有回复，不分页
    await store.getBlogByID(id);


    // 重置评论区状态
    expandedReplies.value = [];
    expandedComments.value = []; // 重置已展开的评论列表
    replyContent.value = '';
    replyTarget.value = null;


    // 显示博客详情对话框
    dialogBlog.value = true;

    // 在对话框打开后滚动到顶部
    nextTick(() => {
      const detailBox = document.querySelector('.blog-details-home');
      if (detailBox) {
        detailBox.scrollTop = 0;
      }
    });
  } catch (error) {
    console.error('加载博客详情失败:', error);
    // 只在确实无法加载主要内容时显示错误
          if (!store.blog || !store.blog.id) {
        ElMessage.error('Failed to load blog details');
      }
    }
  };



const selectedFilters = ref<number[]>([]);
const isFilterMenuOpen = ref(false);

const toggleSocialFilter = (filter: number) => {
  if (selectedFilters.value.includes(filter)) {
    selectedFilters.value = selectedFilters.value.filter(f => f !== filter);
  } else {
    selectedFilters.value.push(filter);
  }
  allPosts.value.args['social_filter[]'] = selectedFilters.value;
  store.getBlogList(true);
};

const toggleFilterMenu = () => {
  isFilterMenuOpen.value = !isFilterMenuOpen.value;
};

const searchQuery = ref('');


function handleSearch() {
  allPosts.value.args.keyword =  searchQuery.value;
  store.getBlogList(true);
}


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
    if(newBlog.user.id) checkFollowStatus(newBlog.user.id);
  } else {
    // 自己的博客或无博客选中，重置关注状态
    isFollowing.value = false;
  }
}, { immediate: true });

// 添加一个函数来检查关注状态
const checkFollowStatus = async (userId:number) => {
  try {
    // 假设API返回一个布尔值表示是否已关注
    const isFollowed = await userStore.isFollowing(userId);
    isFollowing.value = isFollowed.data.is_following;

  } catch (error) {
    console.error('Failed to check follow status:', error);
  }
};
// 添加评论功能到博客弹窗
// const showCommentInput = ref(false)

// 评论相关的状态
// const activeCommentId = ref<number | null>(null);
const replyContent = ref('');

// 展开回复相关的状态
const expandedReplies = ref<number[]>([]);

// 添加回复目标状态
const replyTarget = ref<{id: number, type: string, parentId?: number} | null>(null);




// 添加"查看更多回复"功能
const expandedComments = ref<number[]>([]);

// 决定显示哪些回复 - 默认只显示前2条




// 长按结束处理函数

// 处理博客项点击事件
const openBlogDetail = (id: number) => {
  showBlogDetail(id);
};

// 在script setup中添加新的响应式变量和方法

// 定位组件展开状态
const locationExpanded = ref(false);

const toggleLocation = () => {
  locationExpanded.value = !locationExpanded.value;
  if (locationExpanded.value) {
    locationSearchQuery.value = '';
    // 延迟聚焦到搜索框
    nextTick(() => {
      const searchInput = document.querySelector('.location-search input') as HTMLInputElement;
      if (searchInput) searchInput.focus();
    });
  }
};

// 定位组件 - 弹窗设计
const locationWidgetRef = ref<HTMLElement | null>(null);
const locationSearchQuery = ref('');
const filteredLocations = computed(() => {
  if (!locationSearchQuery.value) {
    return destinations.slice(0, 8); // 默认显示前8个
  }

  return destinations.filter(location =>
    location.label.toLowerCase().includes(locationSearchQuery.value.toLowerCase())
  );
});

const handleLocationSearch = () => {
  // 搜索逻辑已在计算属性中处理
};

const selectLocation = (locationValue: string) => {
  selectedLocation.value = locationValue;
  handleLocationChange(locationValue);
  locationExpanded.value = false;
  locationSearchQuery.value = '';
};

// 点击外部区域关闭弹窗
const handleClickOutside = (event: Event) => {
  const target = event.target as HTMLElement;
  if (locationExpanded.value && locationWidgetRef.value && !locationWidgetRef.value.contains(target)) {
    locationExpanded.value = false;
    locationSearchQuery.value = '';
  }
};

// 监听文档点击事件
onMounted(() => {
  document.addEventListener('click', handleClickOutside);
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
});

// 底部选择器状态
const interestsExpanded = ref(false);
const toolsExpanded = ref(false);
const interestsWidgetRef = ref<HTMLElement | null>(null);
const toolsWidgetRef = ref<HTMLElement | null>(null);

// 选中的工具
const selectedTools = ref<string[]>([]);

// 可用工具列表
const availableTools = ref([
  {
    name: 'Weather',
    icon: '🌤️',
    description: 'Weather forecast'
  },
  // {
  //   name: 'Currency',
  //   icon: '💱',
  //   description: 'Exchange rates'
  // },
  // {
  //   name: 'Translation',
  //   icon: '🌐',
  //   description: 'Language translator'
  // },
  // {
  //   name: 'Maps',
  //   icon: '🗺️',
  //   description: 'Interactive maps'
  // },
  // {
  //   name: 'Reviews',
  //   icon: '⭐',
  //   description: 'Place reviews'
  // },
  // {
  //   name: 'Budget',
  //   icon: '💰',
  //   description: 'Trip budget planner'
  // }
]);

// 切换Interests菜单
const toggleInterests = () => {
  interestsExpanded.value = !interestsExpanded.value;
  if (interestsExpanded.value) {
    toolsExpanded.value = false; // 关闭另一个菜单
  }
};

// 切换Tools菜单
const toggleTools = () => {
  toolsExpanded.value = !toolsExpanded.value;
  if (toolsExpanded.value) {
    interestsExpanded.value = false; // 关闭另一个菜单
  }
};

// 切换工具选择
const toggleTool = (toolName: string) => {
  if (selectedTools.value.includes(toolName)) {
    selectedTools.value = selectedTools.value.filter(t => t !== toolName);
  } else {
    selectedTools.value.push(toolName);
  }
};

// 点击外部区域关闭菜单
const handleSelectorClickOutside = (event: Event) => {
  const target = event.target as HTMLElement;
  if (interestsExpanded.value && interestsWidgetRef.value && !interestsWidgetRef.value.contains(target)) {
    interestsExpanded.value = false;
  }
  if (toolsExpanded.value && toolsWidgetRef.value && !toolsWidgetRef.value.contains(target)) {
    toolsExpanded.value = false;
  }
};

// 更新现有的生命周期钩子
onMounted(() => {
  document.addEventListener('click', handleClickOutside);
  document.addEventListener('click', handleSelectorClickOutside); // 添加新的监听器
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
  document.removeEventListener('click', handleSelectorClickOutside); // 移除新的监听器
});

// 添加缺失的post相关函数
const handlePostClick = async () => {
  // 检查用户是否已登录
  if (!userStore.isLogin()) {
    try {
      await ElMessageBox.confirm(
        'You need to login first to post a blog. Would you like to login now?',
        'Login Required',
        {
          confirmButtonText: 'Go to Login',
          cancelButtonText: 'Cancel',
          type: 'warning',
        }
      );
      // 用户确认，跳转到登录页面
      router.push({ name: 'login' });
    } catch {
      // 用户取消，不做任何操作
    }
    return;
  }

  // 用户已登录，显示发布页面
  showPostView.value = true;
};

// 处理预览显示
const handleShowPreview = (data: {
  title: string;
  content: string;
  images: string[];
  tags: string[];
  preferences: number[];
  location: string[];
  isNFT: boolean;
}) => {
  previewData.value = {
    title: data.title,
    content: data.content,
    images: data.images,
    tags: data.tags,
    preferences: data.preferences,
    location: data.location,
    isNFT: data.isNFT
  };
  showPreview.value = true;
};

// 关闭预览
const closePreview = () => {
  showPreview.value = false;
};

// 语音输入功能
const startVoiceInput = () => {
  // 检查浏览器是否支持语音识别
  if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    const recognition = new SpeechRecognition();

    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      ElMessage.info('Listening... Speak now!');
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      userInput.value = transcript;
      ElMessage.success('Voice input captured!');
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onerror = (event: any) => {
      ElMessage.error('Voice recognition error: ' + event.error);
    };

    recognition.start();
  } else {
    ElMessage.warning('Voice recognition not supported in this browser');
  }
};

// 监听定位变化，自动关闭展开状态
watch(selectedLocation, () => {
  if (selectedLocation.value) {
    setTimeout(() => {
      locationExpanded.value = false;
    }, 1000);
  }
});

</script>

<template>
  <div class="background-layer" :class="{ 'visible': !isLoading }"></div>
  <div class="home" :class="{ 'content-visible': !isLoading }">
    <common-header />
    <section class="welcome-section">
      <blur-text
        text="Welcome to iPoloGO"
        :delay="180"
        animateBy="words"
        direction="top"
        class="welcome-text"
      />
      <blur-text
        text="To Explore, To Share, To Earn"
        :delay="180"
        animateBy="words"
        direction="bottom"
        class="welcome-text2"
      />
    </section>

    <!-- 主体区域 -->
    <main class="main">
      <!-- 行程规划模块 - 重新设计 -->
      <div class="trip-planning-container">

        <!-- 主输入区域 -->
        <div class="chat-input-container">
          <div class="input-wrapper">
            <el-input
              v-model="userInput"
              placeholder="Plan your perfect trip... Where would you like to go?"
              class="trip-input"
              type="textarea"
              :rows="1"
              :autosize="{ minRows: 3, maxRows: 6 }"
              @keydown.enter.ctrl.stop.prevent="submitItinerary"
            />

            <div class="input-actions">
              <button class="action-btn microphone-btn" @click="startVoiceInput" title="Voice Input">
                <el-icon><Microphone /></el-icon>
              </button>
              <button class="action-btn send-btn" @click="submitItinerary" title="Start Planning">
                <el-icon><Position /></el-icon>
              </button>
            </div>
          </div>
        </div>

        <!-- 底部选择菜单 - 固定在下方 -->
        <div class="bottom-selectors">
          <!-- Location 定位选择器 -->
          <div class="selector-widget" ref="locationWidgetRef">
            <div class="selector-trigger" @click="toggleLocation">
              <el-icon class="selector-icon">
                <Location />
              </el-icon>

              <!-- 当有选择地点时显示地名和天气 -->
              <div class="selector-content" v-if="selectedLocation">
                <span class="selector-name">{{ selectedLocation }}</span>
                <span class="weather-info" v-if="originWeather">{{ originWeather }}</span>
              </div>

              <!-- 没有选择地点时的默认文本 -->
              <span class="selector-text" v-else>Add Location</span>

              <el-icon class="dropdown-icon" :class="{ 'rotated': locationExpanded }">
                <ArrowDown />
              </el-icon>
            </div>

            <!-- Location 下拉菜单 - 统一使用selector-dropdown -->
            <transition name="dropdown">
              <div class="selector-dropdown" v-if="locationExpanded" @click.stop>
                <div class="dropdown-content">
                  <div class="search-section">
                    <el-input
                      v-model="locationSearchQuery"
                      placeholder="Search for a location..."
                      class="location-search"
                      clearable
                      @input="handleLocationSearch"
                    >
                      <template #prefix>
                        <el-icon><Search /></el-icon>
                      </template>
                    </el-input>
                  </div>

                  <div class="results-section">
                    <div class="result-list">
                      <div
                        v-for="(location, index) in filteredLocations"
                        :key="index"
                        class="location-item"
                        @click="selectLocation(location.value)"
                      >
                        <div class="location-item-content">
                          <el-icon class="item-icon"><Location /></el-icon>
                          <div class="item-info">
                            <span class="item-name">{{ location.label }}</span>
                          </div>
                        </div>
                      </div>

                      <!-- 无搜索结果 -->
                      <div class="no-results" v-if="filteredLocations.length === 0 && locationSearchQuery">
                        <el-icon><Warning /></el-icon>
                        <span>No locations found</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </transition>
          </div>

          <!-- Interests 兴趣选择器 -->
          <div class="selector-widget" ref="interestsWidgetRef">
            <div class="selector-trigger" @click="toggleInterests">
              <el-icon class="selector-icon">
                <Star />
              </el-icon>
              <span class="selector-text">Interests</span>
              <span class="selected-count" v-if="selectedOptions.length > 0">({{ selectedOptions.length }})</span>
              <el-icon class="dropdown-icon" :class="{ 'rotated': interestsExpanded }">
                <ArrowDown />
              </el-icon>
            </div>

            <!-- Interests 下拉菜单 -->
            <transition name="dropdown">
              <div class="selector-dropdown" v-if="interestsExpanded" @click.stop>
                <div class="dropdown-content">
                  <div class="dropdown-header">
                    <span class="header-title">Choose your interests</span>
                  </div>

                  <div class="options-grid">
                    <div
                      v-for="option in socialFilters"
                      :key="option.name"
                      class="option-item"
                      :class="{ 'selected': selectedOptions.includes(option.name) }"
                      @click="togglePreference(option.name)"
                    >
                      <span class="option-icon">{{ option.icon }}</span>
                      <span class="option-name">{{ option.name }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </transition>
          </div>

          <!-- Tools 工具选择器 -->
          <div class="selector-widget" ref="toolsWidgetRef">
            <div class="selector-trigger" @click="toggleTools">
              <el-icon class="selector-icon">
                <Setting />
              </el-icon>
              <span class="selector-text">Tools</span>
              <span class="selected-count" v-if="selectedTools.length > 0">({{ selectedTools.length }})</span>
              <el-icon class="dropdown-icon" :class="{ 'rotated': toolsExpanded }">
                <ArrowDown />
              </el-icon>
            </div>

            <!-- Tools 下拉菜单 -->
            <transition name="dropdown">
              <div class="selector-dropdown" v-if="toolsExpanded" @click.stop>
                <div class="dropdown-content">
                  <div class="dropdown-header">
                    <span class="header-title">Available tools</span>
                  </div>

                  <div class="tools-grid">
                    <div
                      v-for="tool in availableTools"
                      :key="tool.name"
                      class="tool-item"
                      :class="{ 'selected': selectedTools.includes(tool.name) }"
                      @click="toggleTool(tool.name)"
                    >
                      <span class="tool-icon">{{ tool.icon }}</span>
                      <span class="tool-name">{{ tool.name }}</span>
                      <span class="tool-desc">{{ tool.description }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </transition>
          </div>
        </div>
      </div>

      <!-- 社交帖子模块 -->
      <section class="social-feed">
        <div class="social-header">
          <!-- 标题单独一行 -->
          <div class="social-header-text">Explore iPoloGO Community</div>

          <!-- 搜索框、筛选选项和Post按钮放在下一行 -->
          <div class="social-header-controls">
             <!-- 搜索框 -->
            <input type="text" v-model="searchQuery"
            placeholder="Explore Anything..."
            class="search-input-home"
            @keyup.enter="handleSearch" />

            <!-- 筛选选项汉堡菜单按钮 (移动端显示) -->
            <button class="filter-menu-toggle" @click="toggleFilterMenu">
              <span class="filter-icon-bar"></span>
              <span class="filter-icon-bar"></span>
              <span class="filter-icon-bar"></span>
            </button>

            <!-- 横排筛选选项 -->
            <div class="social-filter-panel-horizontal"
            :class="{ 'expanded': isFilterMenuOpen }">
              <button
                v-for="item in socialFilters"
                :key="item.id"
                :class="{ active: selectedFilters.includes(item.id) }"
                @click="toggleSocialFilter(item.id)"
              >
                <span class="filter-icon">{{ item.icon }}</span>
                <span class="filter-label">{{ item.name }}</span>
              </button>
            </div>

            <!-- Post按钮 -->
            <el-button type="primary" @click="handlePostClick" class="custom-post-button">Post</el-button>
          </div>
        </div>

        <!-- 水平分割线 -->
        <hr class="horizontal-divider" />

        <!-- 博客展示区域 -->
        <div class="social-scroll">
          <div class="social-posts-panel" ref="postsPanel"
          style="overflow-y: auto; max-height: none;">
            <blog-item
              v-for="(item, index) in allPosts?.items"
              :key="index"
              :post="item"
              @detail="openBlogDetail"
            ></blog-item>
            <div ref="bottomTrigger" class="bottom-load-container">
              <div v-if="allPosts.loading"
              class="loading-indicator">Loading more posts...</div>
              <button
                v-else-if="allPosts?.has_next"
                class="load-more-btn-home"
                @click="nextPage"
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
    <div v-if="allPosts.total === 0" class="no-results">No posts found for "{{ allPosts.args }}"</div>

    <!-- 博客详情弹出层 -->
    <blog-detail-dialog
      v-model:visible="dialogBlog"
      :blog-id="Number(blogID)"
      :is-following="isFollowing"
      @close="closeBlogDetail"
    />

    <div v-if="allPosts.total === 0" class="no-results">No posts found for "{{ allPosts.args }}"</div>
  </div>

  <!-- 将 post-view 组件移到这里，作为整个页面的子元素 -->
  <div v-if="showPostView" class="post-view-overlay" @click.self="showPostView = false">
    <post-view @close="showPostView = false" @show-preview="handleShowPreview" />
  </div>

  <!-- 将 preview 组件移到这里，作为整个页面的子元素 -->
  <post-preview
    v-if="showPreview"
    :title="previewData.title"
    :content="previewData.content"
    :images="previewData.images"
    :tags="previewData.tags"
    :preferences="previewData.preferences"
    :socialFilters="socialFilters"
    :location="previewData.location"
    :isNFT="previewData.isNFT"
    @close="closePreview"
  />
</template>

<style scoped>
.post-view-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  display: flex;
  align-items: flex-start;
  justify-content: center;
  z-index: 2000;
  padding: 2vh 20px;
  box-sizing: border-box;
  /* 确保可以滚动 */
  overflow-y: auto;
  overflow-x: hidden;
  /* 确保滚动平滑 */
  scroll-behavior: smooth;
  -webkit-overflow-scrolling: touch;
}

/* 确保post-view组件在遮罩层中正确显示 */
.post-view-overlay > * {
  flex-shrink: 0;
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  min-height: auto;
}

@media (max-width: 768px) {
  .post-view-overlay {
    padding: 0;
    align-items: flex-start;
    /* 在移动设备上确保可以滚动 */
    overflow-y: auto;
    overflow-x: hidden;
  }

  .post-view-overlay > * {
    width: 100%;
    max-width: 100%;
  }
}
</style>

