<script setup lang="ts">
import { ref, onMounted } from 'vue';
import walletItem from '@/components/wallet-item.vue';
import { destinations } from '/src/assets/destinations.js'; // 确保路径正确
import { getReverseGeocoding } from '/src/components/geolocationService.js'; // 导入地理位置服务
import { getWeatherData } from '/src/components/weatherService.js'; // 导入天气服务

const selectedLocation = ref('');
const selectedDestination = ref('');
const weather = ref('');
const userLocation = ref('');
const userFlag = ref('');
const msg = 'Welcome to iPoloGO!';
const isLoading = ref(false);
const errorMessage = ref('');
const searchQuery = ref('');

const preferenceOptions = ref([
  { name: 'Sightseeing', icon: '🌆' },
  { name: 'Educational', icon: '🎓' },
  { name: 'Business', icon: '💼' },
  { name: 'Medical', icon: '🏥' },
  { name: 'Gastronomy', icon: '🍴' },
  { name: 'Culture', icon: '🎭' }
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
        timeout: 5000
      });
    });

    const { city, country, flagUrl } = await getReverseGeocoding(
      position.coords.latitude,
      position.coords.longitude
    );

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
const handleEnter = (event: KeyboardEvent) => {
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
                  <el-option
                    v-for="(loc, index) in destinations"
                    :key="index"
                    :label="loc.label"
                    :value="loc.value"
                  />
                </el-select>
              </div>
              <p class="coordinates">{{ userLocation }}</p>
            </div>
          </div>

          <!-- 改进的飞机图标 -->
          <div class="flight-animation">
            <svg class="airplane" viewBox="0 0 24 24">
              <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/>
            </svg>
          </div>

          <!-- 目的地选择模块 -->
          <div class="destination-card">
            <h2>Destination</h2>
            <div class="destination-content">
              <el-select
                v-model="selectedDestination"
                placeholder="Select destination"
                class="destination-select"
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
              <el-tag
                v-for="(option, index) in selectedOptions"
                :key="index"
                class="preference-tag"
                closable
                @close="selectedOptions.splice(index, 1)"
              >
                {{ preferenceOptions.find(o => o.name === option)?.icon }}
                {{ option }}
              </el-tag>
            </div>
            <div v-else class="empty-state">
              <h3>No preferences selected</h3>
            </div>
          </div>

          <el-select
            v-model="selectedOptions"
            multiple
            filterable
            placeholder="🗺️ Select preferences to start planning"
            class="preference-select"
          >
            <el-option
              v-for="option in preferenceOptions"
              :key="option.name"
              :label="option.name"
              :value="option.name"
            >
              <span class="option-content">
                <span class="option-icon">{{ option.icon }}</span>
                {{ option.name }}
              </span>
            </el-option>
          </el-select>

    <div class="prompt-preview" v-if="selectedOptions.length > 0 || userInput">
      <pre>{{ generatedPrompt }}</pre>
    </div>


          <el-input
            v-model="userInput"
            placeholder="Enter your travel requirements..."
            class="requirements-input"
            type="textarea"
            :rows="6"
            @keydown.enter="handleEnter"
          />
        </div>
        <router-link :to="{ name: 'generator' }"><el-button class="nav-button">Start Now</el-button></router-link>
      </div>
    </main>


  </div>
</template>

<style scoped>
.home {
  background: linear-gradient(45deg, #3a7bd5, #00d2ff, #6a82fb);
  background-size: 300% 300%;
  animation: gradient-animation 5s ease infinite;
  min-height: 100vh; /* Full viewport height */
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: center;
  text-align: center;  /* 设置两端对齐 */
  color: #fff;
  font-family: 'Roboto', sans-serif;
  padding-top: 20px;
  width: 100%;  /* 使容器宽度为 100% */
}

.ipologo-intro p,
h1,
h3 {
  max-width: 90%; /* 限制文本最大宽度，确保文本不会过宽 */
  margin-left: auto;
  margin-right: auto;
}

/* 动态背景动画 */
@keyframes gradient-animation {
  0% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0% 50%;
  }
}

/* 统一Header样式 */
.nav-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 1rem;
}

.left-nav, .right-nav {
  display: flex;
  gap: 1.5rem;
  align-items: center;
}

.nav-button {
  background: rgba(255, 255, 255, 0.15);
  border: 1px solid rgba(255, 255, 255, 0.2);
  transition: all 0.3s ease;
}

.el-button {
  font-size: 1rem;
  padding: 10px 20px;
  background-color: rgba(255, 255, 255, 0.15);
  border: none;
  color: #fff;
  transition: background-color 0.3s ease, transform 0.3s ease;
}

.el-button:hover {
  background-color: rgba(255, 255, 255, 0.3);
  transform: scale(1.05);
}

.nav-buttons {
  display: flex;
  justify-content: center;
  gap: 1rem;
  margin-bottom: 20px;
}

/* 定位流程模块 */
.destination-container {
  width: 100%;
  max-width: 1000px;
  margin: 2rem auto;
}

.location-flow {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 3rem;
}

.location-card, .destination-card {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(5px);
  border-radius: 9px;
  padding: 2rem;
  width: 350px;
  height: 100px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

/* 飞机动画 */
.flight-animation {
  position: relative;
  margin: 0 1rem;
}

.airplane {
  width: 50px;
  height: 50px;
  fill: #ebf053;
  animation: fly 2s ease-in-out infinite;
}

@keyframes fly {
  0%, 100% { transform: translateX(0) rotate(0); }
  50% { transform: translateX(20px) rotate(10deg); }
}

/* 定位选择样式 */
.location-content {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.current-location {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.flag {
  width: 30px;
  height: 20px;
  border-radius: 4px;
}

.location-select, .destination-select {
  width: 100%;
}

.location-select ::v-deep .el-input__inner {
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: white;
}

/* 天气信息 */
.weather-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 1rem;
  color: #021115;
}

.itinerary-section {
  min-width: 800px;
  max-width: 800px;
  margin: 2rem auto;
  padding: 2rem;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 15px;
  backdrop-filter: blur(10px);
}

.preference-select {
  width: 100%;
  margin: 1.5rem 0;
}

.requirements-input {
  width: 100%;
  margin-top: 1rem;
}

.loading-spinner {
  width: 24px;
  height: 24px;
  border: 3px solid #fff;
  border-radius: 50%;
  border-top-color: transparent;
  animation: spin 1s linear infinite;
  margin: 0 auto;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.error-message {
  color: #ff4444;
  font-size: 0.9rem;
}

/* 行程规划 */
.visualization-panel {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 3px;
  padding: 0.5rem;
  margin: 1rem 0;
  min-height: 50px;
}

.tags-container {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.preference-tag {
  background: rgba(0, 210, 255, 0.15);
  border: 1px solid rgba(0, 0, 0, 0.3);
  color: #00d2ff;
  font-size: 0.9rem;
  padding: 8px 12px;
  border-radius: 20px;
  transition: all 0.3s ease;
}

.preference-tag:hover {
  transform: translateY(-2px);
  box-shadow: 0 2px 6px rgba(4, 13, 15, 0.2);
}

.empty-state {
  color: rgba(0, 0, 0, 0.5);
  text-align: center;
  padding: 0.1rem;
}

/* 优化多选组件 */
.preference-select {
  width: 100%;
  margin: 3 rem 0;
}

.preference-select ::v-deep .el-select__tags {
  flex-wrap: nowrap;
  overflow-x: auto;
  max-width: 100%;
}

.option-content {
  display: flex;
  align-items: center;
  gap: 20px;
}

.option-icon {
  font-size: 1.2rem;
}

.requirements-input ::v-deep .el-textarea__inner::placeholder {
  color: rgba(145, 134, 134, 0.7) !important; /* 增加不透明度使颜色更深 */
}

/* 修改标签颜色保持一致性 */
.preference-tag {
  color: rgba(0, 3, 4, 0.9) !important;
  border-color: rgba(0, 0, 0, 0.5) !important;
}

/* 优化输入框焦点样式 */
.requirements-input ::v-deep .el-textarea__inner:focus {
  border-color: rgba(0, 210, 255, 0.5);
  box-shadow: 0 0 8px rgba(0, 210, 255, 0.2);
}

</style>
