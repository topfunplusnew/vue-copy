<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import walletItem from '@/components/wallet-item.vue';
import { destinations } from '@/assets/destinations';
import { getReverseGeocoding } from '@/utils/geolocationService';
import { getWeatherData } from '@/utils/weatherService';
import router from '@/router';

const selectedLocation = ref('');
const selectedDestination = ref('');
const weather = ref('');
const userLocation = ref('');
const userFlag = ref('');
const msg = 'Welcome to iPoloGO!';
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

// 用户选择的偏好
const selectedOptions = ref<string[]>([]);
// 用户额外输入的要求
const userInput = ref('');

// 自动生成 prompt，采用结构化格式，更利于 ChatGPT 理解
const generatedPrompt = computed(() => {
  let prompt = "I need help planning a trip. Here are my details:\n";
  prompt += `- Preferences: ${selectedOptions.value.length > 0 ? selectedOptions.value.join(", ") : "None"}\n`;
  prompt += `- Current Location: ${selectedLocation.value || "Unknown"}\n`;
  prompt += `- Destination: ${selectedDestination.value || "Unknown"}\n`;
  if (userInput.value) {
    prompt += `- Additional Requirements: ${userInput.value}\n`;
  }
  prompt += "Please provide a detailed itinerary taking into account local weather conditions and any relevant travel tips.";
  return prompt;
});

// 获取用户位置及天气
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

    const weatherData = await getWeatherData(city);
    weather.value = `${weatherData.description}, ${weatherData.temp}°C`;
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '定位失败';
  } finally {
    isLoading.value = false;
  }
};

// 目的地选择后更新天气数据
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

// 按下回车时，使用最新生成的 prompt 跳转到对话页面
const handleEnter = (event: Event | KeyboardEvent) => {
  event.preventDefault();
  router.push({ name: 'conversation', query: { prompt: generatedPrompt.value } });
};

onMounted(() => {
  handleLocationClick();
});
</script>

<template>
  <div class="home">
    <!-- Header 区域 -->
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

    <!-- 定位与目的地选择区域 -->
    <main class="main">
      <div class="destination-container">
        <div class="location-flow">
          <!-- 定位模块 -->
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

          <!-- 飞机动画 -->
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

        <!-- 行程规划模块：仅使用 el-select 内置展示已选内容，并在下方预览自动生成的 prompt -->
        <div class="itinerary-section">
          <h2>Design Your Own Itinerary Agent</h2>
          <el-select v-model="selectedOptions" multiple filterable placeholder="🗺️ Select preferences to start planning" class="preference-select">
            <el-option v-for="option in preferenceOptions" :key="option.name" :label="option.name" :value="option.name">
              <span class="option-content">
                <span class="option-icon">{{ option.icon }}</span>
                {{ option.name }}
              </span>
            </el-option>
          </el-select>

          <!-- 自动生成 prompt 预览区域 -->
          <div class="prompt-preview" v-if="selectedOptions.length || userInput">
            <pre>{{ generatedPrompt }}</pre>
          </div>

          <el-input v-model="userInput" placeholder="Enter your travel requirements..." class="requirements-input" type="textarea" :rows="6" @keydown.enter="handleEnter" />
        </div>
        <router-link :to="{ name: 'generator' }"><el-button class="nav-button">Start Now</el-button></router-link>
      </div>
    </main>
  </div>
</template>


