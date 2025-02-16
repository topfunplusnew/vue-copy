<template>
  <div class="home">
    <!-- Header 区域 -->
    <header class="header">
      <div class="nav-container">
        <div class="left-nav">
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
          <wallet-item />
          <router-link :to="{ name: 'login' }">
            <el-button class="nav-button">LOGIN</el-button>
          </router-link>
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
          <h3>Explore iPoloGO Community</h3>
          <hr class="horizontal-divider" />
        </div>
        <div class="social-container">
          <!-- 固定左侧区域 -->
          <div class="social-fixed">
            <div class="social-filter-panel">
              <!-- 社交筛选按钮：带图标 -->
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
                v-for="post in postsDisplayed"
                :key="post.id"
              >
                <img :src="post.image" alt="Post Image" class="post-image" />
                <div class="post-footer">
                  <img :src="post.avatar" alt="Avatar" class="post-avatar" />
                  <div class="post-stats">
                    <span class="likes">❤️ {{ post.likes }}</span>
                    <span class="comments">💬 {{ post.comments }}</span>
                    <span class="coins">💰 {{ post.coins }}</span>
                  </div>
                </div>
              </div>
              <!-- 用于无限滚动触发的底部监测元素 -->
              <div ref="bottomTrigger"></div>
            </div>
          </div>
        </div>
      </section>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import walletItem from '@/components/wallet-item.vue';
import router from '@/router';

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

onMounted(() => {
  // 页面载入时，自动获取一次定位
  handleLocationClick();
});

// -----------------------------
// 社交帖子模块部分
import { blogPosts } from '@/data/blogdata';

// 将筛选项改为 { label, icon } 的对象数组
const socialFilters = ref([
  { label: 'Recommendation', icon: '⭐' },
  { label: 'Most Popular',   icon: '🔥' },
  { label: 'Sightseeing',    icon: '🌇' },
  { label: 'Educational',    icon: '🎓' },
  { label: 'Business',       icon: '💼' },
  { label: 'Medical',        icon: '🏥' },
  { label: 'Gastronomy',     icon: '🍴' },
  { label: 'Culture',        icon: '🎭' },
  { label: 'NFT',            icon: '🖼️' },
]);

// 多选筛选：选中的标签（字符串）
const selectedFilters = ref<string[]>([]);

const toggleSocialFilter = (filterLabel: string) => {
  const idx = selectedFilters.value.indexOf(filterLabel);
  if (idx > -1) {
    selectedFilters.value.splice(idx, 1);
  } else {
    selectedFilters.value.push(filterLabel);
  }
};

const filteredPosts = computed(() => {
  if (selectedFilters.value.length === 0) {
    return blogPosts;
  }
  if (selectedFilters.value.includes('Recommendation')) {
    return blogPosts;
  } else if (selectedFilters.value.includes('Most Popular')) {
    return [...blogPosts].sort((a, b) => b.likes - a.likes);
  } else if (selectedFilters.value.includes('NFT')) { // NFT filter logic
    return blogPosts.filter(post => post.isNFT);
  } else {
    return blogPosts.filter(post =>
      post.tags.some(tag => selectedFilters.value.includes(tag))
    );
  }
});

// 控制加载的帖子数，初始显示12个帖子，每次加载6个
const postsToShow = ref(12);
const postsDisplayed = computed(() => {
  return filteredPosts.value.slice(0, postsToShow.value);
});

// 下拉加载更多：每次加载6个帖子
const loadMorePosts = () => {
  if (postsToShow.value < blogPosts.length) {
    postsToShow.value += 6;
  }
};

// 使用 IntersectionObserver 检测用户是否滚动到底部
const bottomTrigger = ref<HTMLElement | null>(null);
onMounted(() => {
  if (bottomTrigger.value) {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting && postsToShow.value < blogPosts.length) {
          loadMorePosts();
        }
      });
    });
    observer.observe(bottomTrigger.value);
  }
});
</script>
