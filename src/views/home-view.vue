<script setup lang="ts">
import { ref, computed, watch, onMounted, nextTick } from 'vue';
import { useRouter } from 'vue-router';
import walletItem from '@/components/wallet-item.vue';
import { useBlogStore } from '@/stores/blog';
import { usecomponentsStore } from '@/stores/components';
import { ElMessageBox, ElMessage } from 'element-plus';
import { Auth } from '@/services/auth';

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
const isLoading = ref(false);
const errorMessage = ref('');

const store = useBlogStore();
const router = useRouter();
const auth = new Auth();
const componentsStore = usecomponentsStore();

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

onMounted(() => {
  // 页面载入时，自动获取一次定位和加载博客列表
  store.getBlogList();
  handleLocationClick();
});

// -----------------------------
// 社交帖子模块部分

// 修改：点击博客时传入帖子的 id 而非整个对象  // Modified
const showBlogDetail = (id: number) => {
  store.getBlogByID(id);
  dialogBlog.value = true;
  document.body.style.overflow = 'hidden';
};

const closeBlogDetail = () => {
  store.clearBlog();
  dialogBlog.value = false;
  document.body.style.overflow = '';
};

const socialFilters = ref([
  { label: 'Recommendation', icon: '⭐' },
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

const bottomTrigger = ref<HTMLElement | null>(null);
// onMounted(() => {
//   if (bottomTrigger.value) {
//     const observer = new IntersectionObserver(entries => {
//       entries.forEach(entry => {
//         if (entry.isIntersecting && postsToShow.value < allPosts.value.length) { // Modified
//           loadMorePosts();
//         }
//       });
//     });
//     observer.observe(bottomTrigger.value);
//   }
// });

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

const submitComment = () => {
  if (!newComment.value.trim()) return;
  if (!selectedBlog.value?.id) return;
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
          <walletItem />
          <el-button class="nav-button" @click="handleLoginClick"> LOGIN </el-button>
          <router-link :to="{ name: 'signup' }">
            <el-button class="nav-button">SIGN UP</el-button>
          </router-link>
          <router-link :to="{ name: 'userpage' }">
            <el-button class="nav-button">PROFILE</el-button>
          </router-link>
        </div>
      </div>
    </header>

    <h1 class="welcome-text">Welcome to iPoloGO</h1>
    <h2 class="welcome-text2">To Explore, To Share, To Earn</h2>

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
            <el-select v-model="selectedLocation" placeholder="Select location" class="select" filterable @change="handleLocationChange">
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
            <el-select v-model="selectedDestination" placeholder="Select destination" class="select" filterable @change="handleDestinationSelect">
              <el-option v-for="(destination, index) in destinations" :key="index" :label="destination.label" :value="destination.value" />
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
          <span v-for="option in preferenceOptions" :key="option.name" class="preference-option" :class="{ selected: selectedOptions.includes(option.name) }" @click="togglePreference(option.name)">
            <span class="option-icon">{{ option.icon }}</span>
            <span class="option-name">{{ option.name }}</span>
          </span>
        </div>

        <!-- 用户行程输入框 -->
        <div class="input-container">
          <el-input v-model="userInput" placeholder="Edit your trip prompt..." class="itinerary-input" type="textarea" :rows="4" @keydown.enter="handleEnter" />
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
            <input type="text" v-model="searchQuery" placeholder="Explore Anything..." class="search-input-home" @keydown="handleSearch" />

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
          <div class="social-posts-panel" ref="postsPanel">
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
            <div ref="bottomTrigger"></div>
          </div>
        </div>
      </section>
    </main>

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
                />
              </div>
              <!-- 导航按钮 -->
              <button class="nav-btn-home prev-home" @click="prevImage" v-if="selectedBlog?.image?.length > 1">❮</button>
              <button class="nav-btn-home next-home" @click="nextImage" v-if="selectedBlog?.image?.length > 1">❯</button>
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
            <div class="author-info-home">
              <img 
                :src="getImageUrl(selectedBlog?.user?.avatar || '')" 
                alt="Author Avatar" 
                class="author-avatar-home"
              />
              <span class="author-name-home">{{ selectedBlog?.user?.name }}</span>
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
              <span class="comment-count-home">{{ selectedBlog?.comments?.length || 0 }}</span>
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
                  <p class="comment-text-home">{{ comment.content }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 搜索结果为空提示 -->
    <div v-if="searchQuery && filteredPosts.length === 0" class="no-results">No posts found for "{{ searchQuery }}"</div>
  </div>
</template>
