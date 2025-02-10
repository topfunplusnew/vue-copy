<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import walletItem from '@/components/wallet-item.vue';
import { destinations } from '@/assets/destinations';
import { getReverseGeocoding } from '@/utils/geolocationService';
import { getWeatherData } from '@/utils/weatherService';
import router from '@/router';
import { generateUserPrompt } from '@/stores/userprompt';

const selectedLocation = ref('');
const selectedDestination = ref('');
const weather = ref('');
const weatherIcon = ref(''); // 存储天气图标 URL
const userLocation = ref('');
const userFlag = ref('');
const destinationFlag = ref('');
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

// 用户选择的旅游类型（偏好）
const selectedOptions = ref<string[]>([]);
// 用户可编辑的 prompt 内容
const userInput = ref('');

// 根据 Localization、Destination 和旅游类型生成 prompt
const updateUserInput = () => {
  userInput.value = generateUserPrompt(
    selectedLocation.value || 'Unknown',
    selectedDestination.value || 'Unknown',
    selectedOptions.value
  );
};

// 当 Localization、Destination 或偏好变化时自动更新
watch([selectedLocation, selectedDestination, selectedOptions], () => {
  if (!userInput.value) {
    updateUserInput();
  }
});

// 初始定位及天气获取
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
    // 获取当前城市天气
    const weatherData = await getWeatherData(city);
    weather.value = `${weatherData.description}, ${weatherData.temp}°C`;
    weatherIcon.value = weatherData.icon; // 设置天气图标
    updateUserInput();
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '定位失败';
  } finally {
    isLoading.value = false;
  }
};

// 当用户修改 Localization 时更新国旗与地址信息
const handleLocationChange = (value: string) => {
  selectedLocation.value = value;
  const loc = destinations.find(item => item.value === value);
  if (loc) {
    userFlag.value = loc.flagUrl || '';
    userLocation.value = loc.label;
  }
  updateUserInput();
};

// 目的地选择后更新天气和目的地国旗，同时设置天气图标
const handleDestinationSelect = async (value: string) => {
  selectedDestination.value = value;
  const dest = destinations.find(item => item.value === value);
  if (dest) {
    destinationFlag.value = dest.flagUrl || '';
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

// 旅游偏好切换函数：点击后添加或移除选项
const togglePreference = (optionName: string) => {
  const index = selectedOptions.value.indexOf(optionName);
  if (index > -1) {
    selectedOptions.value.splice(index, 1);
  } else {
    selectedOptions.value.push(optionName);
  }
  updateUserInput();
};

// 按下回车时，使用当前 userInput 文本跳转到对话页面
const handleEnter = (event: Event | KeyboardEvent) => {
  event.preventDefault();
  router.push({ name: 'conversation', query: { prompt: userInput.value } });
};

const submitItinerary = () => {
  router.push({ name: 'generator', query: { prompt: userInput.value } });
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
            <el-button class="nav-button">Login</el-button>
          </router-link>
          <router-link :to="{ name: 'signup' }">
            <el-button class="nav-button">Sign Up</el-button>
          </router-link>
        </div>
      </div>
      <h1 class="header-title">{{ msg }}</h1>
    </header>

    <!-- 主体区域 -->
    <main class="main">
      <!-- 合并后的 Localization 与 Destination 卡片（同一行排列） -->
      <div class="combined-card">
        <div class="location-destination-row">
          <!-- Localization 列 -->
          <div class="field location-field">
            <div class="field-label">Localization</div>
            <el-select v-model="selectedLocation" placeholder="Select location" class="select" @change="handleLocationChange">
              <el-option
                v-for="(loc, index) in destinations"
                :key="index"
                :label="loc.label"
                :value="loc.value"
              />
            </el-select>
            <div class="info">
              <img v-if="userFlag" :src="userFlag" alt="Flag" class="flag" />
              <span>{{ userLocation }}</span>
            </div>
          </div>
          <!-- Destination 列 -->
          <div class="field destination-field">
            <div class="field-label">Destination</div>
            <el-select v-model="selectedDestination" placeholder="Select destination" class="select" filterable @change="handleDestinationSelect">
              <el-option
                v-for="(destination, index) in destinations"
                :key="index"
                :label="destination.label"
                :value="destination.value"
              />
            </el-select>
            <div class="info">
              <img v-if="destinationFlag" :src="destinationFlag" alt="Destination Flag" class="flag" />
              <img v-if="weatherIcon" :src="weatherIcon" alt="Weather Icon" class="weather-icon" />
              <span v-if="weather">{{ weather }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 行程规划模块：改为横排展示选项，及美化用户输入模块 -->
      <div class="itinerary-section">
        <h3>Plan Your Itinerary</h3>
        <!-- 旅游偏好横排选择 -->
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
        <!-- 美化后的用户输入模块 -->
        <el-input
          v-model="userInput"
          placeholder="Edit your trip prompt..."
          class="itinerary-input"
          type="textarea"
          :rows="4"
          @keydown.enter="handleEnter"
        />
        <button class="submit-button" @click="submitItinerary">Start Now</button>
      </div>
    </main>
  </div>


</template>

