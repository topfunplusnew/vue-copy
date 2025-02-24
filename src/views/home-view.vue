<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import walletItem from '@/components/wallet-item.vue';
import { useBlogStore } from '@/stores/blog';
import { ElMessageBox, ElMessage } from 'element-plus';
import { Auth } from '@/services/auth';

// 引入定位和天气
import { destinations } from '@/assets/destinations';
import { getReverseGeocoding } from '@/utils/geolocationService';
import { getWeatherData } from '@/utils/weatherService';
import { generateUserPrompt } from '@/stores/userprompt';

// -------------------
// Trip Options 部分
const selectedLocation = ref('');
const selectedDestination = ref('');
const weather = ref('');
const weatherIcon = ref(''); // 存储天气图标 URL
const userLocation = ref('');
const userDestination = ref('');
const userFlag = ref('');
const destinationFlag = ref('');
const isLoading = ref(false);
const errorMessage = ref('');

const store = useBlogStore();
const router = useRouter();
const auth = new Auth();

const preferenceOptions = ref([
  { name: 'Sightseeing', icon: '🌆' },
  { name: 'Educational', icon: '🎓' },
  { name: 'Business', icon: '💼' },
  { name: 'Medical', icon: '🏥' },
  { name: 'Gastronomy', icon: '🍴' },
  { name: 'Culture', icon: '🎭' },
]);

// 用户选择的旅游偏好
const selectedOptions = ref<string[]>([]);
// 自动生成的 prompt 文本
const userInput = ref('');

const updateUserInput = () => {
  userInput.value = generateUserPrompt(
    selectedLocation.value || 'Unknown',
    selectedDestination.value || 'Unknown',
    selectedOptions.value
  );
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
    const { city, country, flagUrl } = await getReverseGeocoding(
      position.coords.latitude,
      position.coords.longitude
    );
    selectedLocation.value = city;
    userLocation.value = `${city}, ${country}`;
    userFlag.value = flagUrl;
    const weatherData = await getWeatherData(city);
    weather.value = `${weatherData.description}, ${weatherData.temp}°C`;
    weatherIcon.value = weatherData.icon;
    updateUserInput();
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '定位失败';
  } finally {
    isLoading.value = false;
  }
};

const handleLocationChange = async (value: string) => {
  selectedLocation.value = value;
  const loc = destinations.find(item => item.value === value);
  if (loc) {
    userFlag.value = loc.flagUrl || '';
    userLocation.value = loc.label;
  }
  try {
    const weatherData = await getWeatherData(value);
    weather.value = `${weatherData.description}, ${weatherData.temp}°C`;
    weatherIcon.value = weatherData.icon;
  } catch (error) {
    console.log(error);
    weather.value = '天气数据不可用';
    weatherIcon.value = '';
  }
  updateUserInput();
};

const handleDestinationSelect = async (value: string) => {
  selectedDestination.value = value;
  const dest = destinations.find(item => item.value === value);
  if (dest) {
    destinationFlag.value = dest.flagUrl || '';
    userDestination.value = dest.label;
  } else {
    destinationFlag.value = '';
  }
  try {
    const weatherData = await getWeatherData(value);
    weather.value = `${weatherData.description}, ${weatherData.temp}°C`;
    weatherIcon.value = weatherData.icon;
  } catch (error) {
    console.log(error);
    weather.value = '天气数据不可用';
    weatherIcon.value = '';
  }
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
  router.push({ name: 'generator', query: { prompt: userInput.value } });
};

const allPosts = computed(()=>store.blogs);
const condition = computed(() => store.condition);
condition.value.keyword = 'a';

const dialogBlog = ref(false);
const selectedBlog = computed(()=> store.blog);

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
  { label: 'Most Popular',   icon: '🔥' },
  { label: 'NFT',            icon: '🖼️' },
  { label: 'Sightseeing',    icon: '🌇' },
  { label: 'Educational',    icon: '🎓' },
  { label: 'Business',       icon: '💼' },
  { label: 'Medical',        icon: '🏥' },
  { label: 'Gastronomy',     icon: '🍴' },
  { label: 'Culture',        icon: '🎭' },
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
    posts = posts.filter(post => {
      const titleMatch = post.title.toLowerCase().includes(query);
      const contentMatch = post.content.toLowerCase().includes(query);
      const locationMatch = post.location?.toLowerCase().includes(query);
      const tagMatch = post.tags.some(tag => tag.toLowerCase().includes(query));
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
    return posts.filter(post => post.isNFT);
  } else {
    return posts.filter(post =>
      post.tags.some(tag => selectedFilters.value.includes(tag))
    );
  }
});

const postsToShow = ref(12);
const postsDisplayed = computed(() => {
  return filteredPosts.value.slice(0, postsToShow.value);
});

const loadMorePosts = () => {
  if (postsToShow.value < allPosts.value.length) { // Modified: 使用 userPosts.value.length
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
      await ElMessageBox.confirm(
        'You need to login first to post a blog. Would you like to login now?',
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
      duration: 2000
    });
    return;
  }
  // 未登录状态，跳转到登录页面
  router.push({ name: 'login' });
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
          <el-button 
            class="nav-button" 
            @click="handleLoginClick"
          >
            LOGIN
          </el-button>
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
            <el-select
              v-model="selectedLocation"
              placeholder="Select location"
              class="select"
              filterable
              @change="handleLocationChange"
            >
              <el-option
                v-for="(loc, index) in destinations"
                :key="index"
                :label="loc.label"
                :value="loc.value"
              />
            </el-select>
            <div class="ld-info">
              <img v-if="userFlag" :src="userFlag" alt="Flag" class="flag" />
              <span>{{ userLocation }}</span>
              <span v-if="weather">{{ weather }}</span>
            </div>
          </div>

          <!-- Destination -->
          <div class="field destination-field">
            <div class="field-label">Destination</div>
            <el-select
              v-model="selectedDestination"
              placeholder="Select destination"
              class="select"
              filterable
              @change="handleDestinationSelect"
            >
              <el-option
                v-for="(destination, index) in destinations"
                :key="index"
                :label="destination.label"
                :value="destination.value"
              />
            </el-select>
            <div class="ld-info">
              <img
                v-if="destinationFlag"
                :src="destinationFlag"
                alt="Destination Flag"
                class="flag"
              />
              <img
                v-if="weatherIcon"
                :src="weatherIcon"
                alt="Weather Icon"
                class="weather-icon"
              />
              <span>{{ userDestination }}</span>
              <span v-if="weather">{{ weather }}</span>
            </div>
          </div>
        </div>
        <hr class="horizontal-divider" />

        <!-- 旅游偏好  -->
        <div class="preference-options">
          <span
            v-for="option in preferenceOptions"
            :key="option.name"
            class="preference-option"
            :class="{ selected: selectedOptions.includes(option.name) }"
            @click="togglePreference(option.name)"
          >
            <span class="option-icon">{{ option.icon }}</span>
            <span class="option-name">{{ option.name }}</span>
          </span>
        </div>

        <!-- 用户行程输入框 -->
        <div class="input-container">
          <el-input
            v-model="userInput"
            placeholder="Edit your trip prompt..."
            class="itinerary-input"
            type="textarea"
            :rows="4"
            @keydown.enter="handleEnter"
          />
          <button class="togenerator" @click="submitItinerary">
            Start Now
          </button>
        </div>
      </div>

      <!-- 社交帖子模块 -->
      <section class="social-feed">
        <div class="social-header">
          <!-- 搜索框 -->
          <input
            type="text"
            v-model="searchQuery"
            placeholder="Search"
            class="search-input"
            @keydown="handleSearch"
          />
          <h3>Explore iPoloGO Community</h3>
          <el-button class="custom-post-button" @click="handlePostClick">Post</el-button>
        </div>
        <hr class="horizontal-divider" />
        <div class="social-container">
          <!-- 固定左侧区域 -->
          <div class="social-fixed">
            <div class="social-filter-panel">
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
          </div>

          <!-- 竖直分隔线 -->
          <div class="vertical-divider"></div>

          <!-- 右侧博客滚动区域 -->
          <div class="social-scroll">
            <div class="social-posts-panel" ref="postsPanel">
              <div
                class="social-post"
                :class="{ 'nft-post': post.isNFT }"
                v-for="post in allPosts"
                :key="post.id"
                @click="showBlogDetail(post.id)"
              >
                <img :src="post.image[0]" alt="Post Image" class="post-image" />
                <div class="post-content">
                  <h2>{{ post.title }}</h2>
                  <p>{{ post.content }}</p>
                </div>
                <div class="post-footer">
                  <!-- Modified: 使用 post.likes 而非 user?.likes -->
                  <div class="post-stats">
                    <span class="likes">❤️ {{ post.likes }}</span>
                    <span class="comments">💬 {{ post.comments }}</span>
                    <span class="coins" v-if="post.isNFT">💰 {{ post.coins }}</span>
                  </div>
                  <img :src="post.user?.avatar" alt="Avatar" class="post-avatar" />
                </div>
              </div>
              <!-- 用于无限滚动触发的底部监测元素 -->
              <div ref="bottomTrigger"></div>
            </div>
          </div>
        </div>
      </section>
    </main>

    <!-- 博客详情弹出层 -->
    <div class="blog-detail-overlay" v-if="dialogBlog" @click.self="closeBlogDetail">
      <div class="blog-detail-container">
        <div class="blog-detail-header">
          <h2>{{ selectedBlog?.title }}</h2>
          <button class="close-button" @click="closeBlogDetail">×</button>
        </div>
        <div class="blog-detail-content">
          <img v-if="selectedBlog?.image && selectedBlog.image.length > 0" :src="selectedBlog.image[0]" alt="Blog Image" class="detail-image" />
          <div class="detail-info">
            <div class="author-info">
              <img :src="selectedBlog?.user?.avatar" alt="Author Avatar" class="author-avatar" />
              <span class="author-name">{{ selectedBlog?.user?.name }}</span>
            </div>
            <p class="content">{{ selectedBlog?.content }}</p>
            <div class="detail-stats">
              <span class="likes">❤️ {{ selectedBlog?.likes }}</span>
              <span class="comments">💬 {{ selectedBlog?.comments }}</span>
              <span class="coins" v-if="selectedBlog?.isNFT">💰 {{ selectedBlog.coins }}</span>
            </div>
            <div class="tags">
              <span v-for="tag in selectedBlog?.tags" :key="tag" class="tag">
                {{ tag }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 搜索结果为空提示 -->
    <div v-if="searchQuery && filteredPosts.length === 0" class="no-results">
      No posts found for "{{ searchQuery }}"
    </div>
  </div>
</template>
