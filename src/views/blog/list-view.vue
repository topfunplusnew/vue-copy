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
const showPostView = ref(false);
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
const userDestination = ref('');
const userFlag = ref('');
const destinationFlag = ref('');
const isLoading = ref(true);
const contentReady = ref(false);
const errorMessage = ref('');

const store = useBlogStore();
const router = useRouter();
const componentsStore = usecomponentsStore();
const userStore = useUserStore();

const originWeather = computed(() => componentsStore.originWeather);
const originWeatherIcon = computed(() => componentsStore.originWeatherIcon);
const destinationWeather = computed(() => componentsStore.destinationWeather);
const destinationWeatherIcon = computed(() => componentsStore.destinationWeatherIcon);

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
      <!-- 行程规划模块 -->
      <div class="combined-card">
        <div class="plan-header">
          <div class="plan-it-text">Plan Your Itinerary</div>
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
              <!-- <img v-if="userFlag" :src="userFlag" alt="Flag" class="flag" /> -->
              <div class="location-info">
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
              <!-- <img v-if="destinationFlag" :src="destinationFlag"
              alt="Destination Flag" class="flag" /> -->
              <div class="location-info">
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
          <span v-for="option in socialFilters" :key="option.name"
            class="preference-option"
            :class="{ selected: selectedOptions.includes(option.name) }"
            @click="togglePreference(option.name)">
            <span class="option-icon">{{ option.icon }}</span>
            <span class="option-name">{{ option.name }}</span>
          </span>
        </div>

        <!-- 用户行程输入框 -->
        <div class="input-container">
          <el-input v-model="userInput"
          placeholder="Edit your trip prompt..."
          class="itinerary-input" type="textarea" :rows="4"
          @keydown.enter.stop.prevent="submitItinerary" />
          <button class="togenerator"
          @click.prevent.stop="submitItinerary">Start Now</button>
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
            <el-button type="primary" @click="showPostView = true" class="custom-post-button">Post</el-button>
            <post-view :modelValue="showPostView" @update:modelValue="showPostView = $event" />

          </div>
        </div>

        <!-- 水平分割线 -->
        <hr class="horizontal-divider" />

        <!-- 博客展示区域 -->
        <div class="social-scroll">
          <div class="social-posts-panel" ref="postsPanel"
          style="overflow-y: auto; max-height: none;">
            <blog-item v-for="(item, index) in allPosts?.items" :key="index" :post="item"></blog-item>
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
</template>

