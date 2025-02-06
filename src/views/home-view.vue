<script setup lang="ts">
import { ref, onMounted } from 'vue';
import walletItem from '@/components/wallet-item.vue';
import { destinations } from '@/assets/destinations'; // 确保路径正确
import { getReverseGeocoding } from '@/utils/geolocationService'; // 导入地理位置服务
import { getWeatherData } from '@/utils/weatherService'; // 导入天气服务
import router from '@/router';

const selectedLocation = ref('');
const selectedDestination = ref('');
const weather = ref('');
const userLocation = ref('');
const userFlag = ref('');
const msg = 'Welcome to iPoloGO!';
const isLoading = ref(false);
const errorMessage = ref('');
// const searchQuery = ref('');
const generatedPrompt = ref();

const preferenceOptions = ref([
  { name: 'Sightseeing', icon: '🌆' },
  { name: 'Educational', icon: '🎓' },
  { name: 'Business', icon: '💼' },
  { name: 'Medical', icon: '🏥' },
  { name: 'Gastronomy', icon: '🍴' },
  { name: 'Culture', icon: '🎭' },
]);

const selectedOptions = ref<string[]>([]);
const userInput = ref('');

// 获取用户位置
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

    // 获取天气
    const weatherData = await getWeatherData(city);
    weather.value = `${weatherData.description}, ${weatherData.temp}°C`;
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '定位失败';
  } finally {
    isLoading.value = false;
  }
};

// 目的地选择处理
const handleDestinationSelect = async (value: string) => {
  selectedDestination.value = value;
  try {
    const weatherData = await getWeatherData(value);
    weather.value = `${weatherData.description}, ${weatherData.temp}°C`;
  } catch (error) {
    console.log(error);
    weather.value = '天气数据不可用';
  }
};

// 自动生成 prompt 函数
const generatePrompt = () => {
  let prompt = 'Plan my trip with the following preferences: ';
  if (selectedOptions.value.length > 0) {
    prompt += selectedOptions.value.join(', ');
  } else {
    prompt += 'no specific preferences';
  }
  prompt += `. Travel requirements: ${userInput.value}`;
  return prompt;
};

// 处理回车事件：阻止换行，生成 prompt 并跳转到对话界面
const handleEnter = (event: Event | KeyboardEvent) => {
  // 阻止 textarea 插入换行
  event.preventDefault();
  const prompt = generatePrompt();
  // 跳转到对话界面（假设路由名称为 'conversation'，并通过 query 参数传递 prompt）
  router.push({ name: 'conversation', query: { prompt } });
};

onMounted(() => {
  handleLocationClick();
});
</script>

<template>
  <div class="home">
    <!-- 改进后的 Header -->
    <header class="header">
      <div class="nav-container">
        <div class="left-nav">
          <router-link :to="{ name: 'about' }"><el-button class="nav-button">ABOUT</el-button></router-link>
          <router-link :to="{ name: 'blog' }"><el-button class="nav-button">BLOG</el-button></router-link>
          <router-link :to="{ name: 'contact' }"><el-button class="nav-button">CONTACT</el-button></router-link>
        </div>
        <div class="right-nav">
          <wallet-item />
          <router-link :to="{ name: 'login' }"><el-button class="nav-button">Login</el-button></router-link>
          <router-link :to="{ name: 'signup' }"><el-button class="nav-button">Sign Up</el-button></router-link>
        </div>
      </div>

      <h1 class="header-title">{{ msg }}</h1>
    </header>

    <!-- 改进后的定位模块 -->
    <main class="main">
      <div class="destination-container">
        <div class="location-flow">
          <!-- 改进的定位模块 -->
          <div class="location-card">
            <h2>Localization</h2>
            <div class="location-content">
              <div class="current-location">
                <img v-if="userFlag" :src="userFlag" alt="Flag" class="flag" />
                <el-select v-model="selectedLocation" class="location-select">
                  <el-option v-for="(loc, index) in destinations" :key="index" :label="loc.label" :value="loc.value" />
                </el-select>
              </div>
              <p class="coordinates">{{ userLocation }}</p>
            </div>
          </div>

          <!-- 改进的飞机图标 -->
          <div class="flight-animation">
            <svg class="airplane" viewBox="0 0 24 24">
              <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z" />
            </svg>
          </div>

          <!-- 目的地选择模块 -->
          <div class="destination-card">
            <h2>Destination</h2>
            <div class="destination-content">
              <el-select v-model="selectedDestination" placeholder="Select destination" class="destination-select" filterable @change="handleDestinationSelect">
                <el-option v-for="(destination, index) in destinations" :key="index" :label="destination.label" :value="destination.value" />
              </el-select>
              <div v-if="weather" class="weather-info">
                <i class="weather-icon"></i>
                <span>{{ weather }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 行程规划模块保持不变 -->
        <div class="itinerary-section">
          <h2>Design Your Own Itinerary Agent</h2>
          <div class="visualization-panel">
            <div v-if="selectedOptions.length > 0" class="tags-container">
              <el-tag v-for="(option, index) in selectedOptions" :key="index" class="preference-tag" closable @close="selectedOptions.splice(index, 1)">
                {{ preferenceOptions.find((o) => o.name === option)?.icon }}
                {{ option }}
              </el-tag>
            </div>
            <div v-else class="empty-state">
              <h3>No preferences selected</h3>
            </div>
          </div>

          <el-select v-model="selectedOptions" multiple filterable placeholder="🗺️ Select preferences to start planning" class="preference-select">
            <el-option v-for="option in preferenceOptions" :key="option.name" :label="option.name" :value="option.name">
              <span class="option-content">
                <span class="option-icon">{{ option.icon }}</span>
                {{ option.name }}
              </span>
            </el-option>
          </el-select>

          <div class="prompt-preview" v-if="selectedOptions.length > 0 || userInput">
            <pre>{{ generatedPrompt }}</pre>
          </div>

          <el-input v-model="userInput" placeholder="Enter your travel requirements..." class="requirements-input" type="textarea" :rows="6" @keydown.enter="handleEnter" />
        </div>
        <router-link :to="{ name: 'generator' }"><el-button class="nav-button">Start Now</el-button></router-link>
      </div>
    </main>
  </div>
</template>
