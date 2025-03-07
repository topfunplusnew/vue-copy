<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useUserStore } from '@/stores/user';
import { ElMessage } from 'element-plus';
import { getImageUrl } from '@/utils';
import { auth } from '@/services/http';
import walletItem from '@/components/wallet-item.vue';
import '@/styles/_about.scss'; // 引入About页面的SCSS样式

// 初始化router和userStore
const router = useRouter();
const userStore = useUserStore();

// 处理登录点击
const handleLoginClick = () => {
  router.push({ name: 'login' });
};

// 页面加载时获取用户信息（如果已登录）
onMounted(() => {
  if (auth.get() && !userStore.user) {
    userStore.getUserInfo();
  }
});

// 特点数据
const features = ref([
  {
    icon: '🌍',
    title: 'Personalized Itineraries',
    description: 'Create custom travel plans tailored to your preferences and interests with AI assistance.',
    class: 'blue-gradient'
  },
  {
    icon: '💰',
    title: 'Earn While Traveling',
    description: 'Earn iPoloCoins by sharing your experiences and knowledge with the community.',
    class: 'purple-gradient'
  },
  {
    icon: '��',
    title: 'Web3 Integration',
    description: 'Connect your wallet to create and trade travel experiences as NFTs.',
    class: 'green-gradient'
  },
  {
    icon: '🤝',
    title: 'Community Driven',
    description: 'Join a global community of travelers sharing insights and recommendations.',
    class: 'orange-gradient'
  },
  {
    icon: '🔒',
    title: 'Secure & Transparent',
    description: 'All transactions and interactions are secured by blockchain technology.',
    class: 'red-gradient'
  },
  {
    icon: '🧠',
    title: 'AI Powered',
    description: 'Large language models help optimize your travel planning and experiences.',
    class: 'teal-gradient'
  }
]);

// 统计数据
const stats = ref([
  { value: '10K+', label: 'Active Users' },
  { value: '50K+', label: 'Itineraries Created' },
  { value: '120+', label: 'Countries Covered' },
  { value: '1M+', label: 'iPoloCoins Earned' }
]);

// FAQ 数据
const faqs = ref([
  {
    question: 'How to design my personal itinerary?',
    answer:
      'You can design your personal itinerary by using iPoloGO. Simply input your preferences, destinations, and interests, and the platform will help you create a personalized travel plan.',
  },
  {
    question: 'What is NFT in iPoloGO?',
    answer:
      'To connect your Web3 wallet, click on the "Connect Wallet" button on the platform. Select your wallet provider, follow the prompts, and your wallet will be securely connected to iPoloGO.',
  },
  {
    question: 'How do I make my own NFT in iPoloGO? ',
    answer: 'To share your itinerary in iPoloGO, go to the "Share" section within your plan and choose how you would like to share your trip (via social media or directly with other users).',
  },
  {
    question: 'What can I do with an NFT?',
    answer:
      'By sharing your itinerary, you can earn iPoloCoins based on the number of people who view or interact with your plan. You can also gain access to exclusive rewards and features by sharing travel tips and experiences.',
  },
  {
    question: 'How is the weight of obtaining iPoloCoin calculated?',
    answer:
      'The weight for obtaining iPoloCoin is calculated based on several factors, including the popularity of your shared itinerary, the level of interaction it receives, and the value of the knowledge shared with other users.',
  },
]);

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
</script>

<template>
  <div class="background-layer"></div>
  <div class="home">
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
          <!-- 未登录状态显示登录和注册按钮 -->
          <template v-if="!userStore.user">
            <el-button class="nav-button" @click="handleLoginClick">LOGIN</el-button>
            <router-link :to="{ name: 'signup' }">
              <el-button class="nav-button">SIGN UP</el-button>
            </router-link>
          </template>
          
          <!-- 已登录状态显示用户头像和下拉菜单 -->
          <div v-else class="user-profile-nav">
            <div class="home-avatar-container" @click="goToUserProfile">
              <img 
                :src="getImageUrl(userStore.user.avatar || '')" 
                alt="User Avatar" 
                class="home-new-user-avatar"
              />
              <span class="home-new-username">{{ userStore.user.name }}</span>
            </div>
            <el-dropdown trigger="click" @command="handleCommand">
              <span class="el-dropdown-link">
                <i class="el-icon-arrow-down"></i>
              </span>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="profile">My Profile</el-dropdown-item>
                  <el-dropdown-item command="logout">Logout</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>
        </div>
      </div>
    </header>

    <!-- iPoloGO 介绍段落 -->
    <div class="ipologo-intro">
      <h1>Welcome to iPoloGO</h1>
      <p>
        iPoloGO is a Decentralized Autonomous Organization (DAO) tourism platform, powered by large language models and Web3 technology. With iPoloGO, you can personalize your travel experiences and earn rewards by sharing your journey. Whether you're exploring breathtaking scenery, engaging in educational, business, or healthcare experiences, or diving into local cuisine and culture, everything becomes easier with just a few inputs. We will help you plan every aspect of your trip.

        Our community makes it simple to learn from others' travel plans and shared knowledge. You can also contribute your insights, earning rewards while enriching the experiences of fellow travelers.
      </p>
    </div>

    <!-- 交互式特点展示区域 -->
    <div class="features-container-about">
      <h2 class="features-title-about">iPoloGO Features</h2>
      <div class="features-grid-about">
        <div class="feature-card-about" v-for="(feature, index) in features" :key="index">
          <div class="feature-icon-about" :class="feature.class">
            <span v-html="feature.icon"></span>
          </div>
          <div class="about-feature-title">{{ feature.title }}</div>
          <p class="feature-description-about">{{ feature.description }}</p>
          <div class="feature-overlay-about"></div>
        </div>
      </div>
    </div>
    
    <!-- 统计数据展示 -->
    <div class="stats-container-about">
      <div class="stat-item-about" v-for="(stat, index) in stats" :key="index">
        <div class="stat-value-about">{{ stat.value }}</div>
        <div class="stat-label-about">{{ stat.label }}</div>
      </div>
    </div>

    <!-- FAQ Section -->
    <div class="faq-container-about">
      <h3>Frequently Asked Questions</h3>
      <el-collapse accordion class="clean-collapse stable-width-collapse">
        <el-collapse-item v-for="(faq, index) in faqs" :key="index" :title="faq.question" class="stable-item">
          <div class="answer-content-about">{{ faq.answer }}</div>
        </el-collapse-item>
      </el-collapse>
    </div>
  </div>
</template>
