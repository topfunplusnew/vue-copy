<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useUserStore } from '@/stores/user';
import { auth } from '@/services/http';
import commonHeader from '@/layout/common-header.vue';
// 初始化router和userStore
const userStore = useUserStore();

// 处理登录点击

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
  // { value: '1M+', label: 'iPoloCoins Earned' }
]);

// FAQ 数据
const faqs = ref([
  {
    question: 'How to design my personal itinerary?',
    answer:
    'iPoloGO offers intuitive tools to help you easily create your itinerary. Simply select your destination, travel dates, flights, hotels, and other preferences. iPoloGO will automatically generate a personalized travel plan tailored specifically for you.'
  },
  {
    question: 'What is NFT in iPoloGO?',
    answer:
    'In iPoloGO, an NFT (Non-Fungible Token) is a unique digital collectible representing memorable travel experiences, personalized itineraries, special achievements, or exclusive rewards. These NFTs can be collected, shared, or traded within the iPoloGO community, allowing you to preserve your travel memories and engage more deeply with other travelers.'
  },
  {
    question: 'How do I make my own NFT in iPoloGO? ',
    answer:
    'Every time you connect your wallet and publish a travel blog on iPoloGO, you have the option to turn it into an NFT. Simply select the "Make Your NFT" option when posting your blog. Your blog content will be stored securely on the blockchain, and you will receive a unique NFT representing your travel experience.'
  }
]);

// FAQ交互逻辑
const activeFaqIndex = ref<number | null>(null);

const toggleFaq = (index: number) => {
  activeFaqIndex.value = activeFaqIndex.value === index ? null : index;
};
</script>

<template>
  <div class="background-layer"></div>
  <div class="about layout-main">
    <commonHeader />

    <!-- iPoloGO 介绍段落 -->
    <div class="ipologo-intro">
      <h1>Welcome to iPoloGO【Beta】</h1>
      <p>
        iPoloGO is a Decentralized Autonomous Organization (DAO) tourism platform, powered by large language models and Web3 technology.
        With iPoloGO, you can personalize your travel experiences and earn rewards by sharing your journey.
        Whether you're exploring breathtaking scenery, engaging in educational, business, or healthcare experiences, or diving into local cuisine and culture, everything becomes easier with just a few inputs.
        We will help you plan every aspect of your trip.
        Our community makes it simple to learn from others' travel plans and shared knowledge.
        You can also contribute your insights, earning rewards while enriching the experiences of fellow travelers.
      </p>
    </div>

    <!-- 交互式特点展示区域 -->
    <div class="features-container-about">
      <div class="features-title-about">iPoloGO Features</div>
      <div class="features-grid-about">
        <div class="feature-card-about" v-for="(feature, index) in features" :key="index">
          <div class="feature-icon-about" :class="feature.class">
            <span v-html="feature.icon"></span>
          </div>
          <div class="about-feature-title">{{ feature.title }}</div>
          <div class="feature-description-about">{{ feature.description }}</div>
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
      <div class="faq-header">
        <h3>Frequently Asked Questions</h3>
        <div class="faq-subtitle">Everything you need to know about iPoloGO</div>
      </div>
      
      <div class="faq-list">
        <div 
          v-for="(faq, index) in faqs" 
          :key="index" 
          class="faq-item"
          :class="{ 'active': activeFaqIndex === index }"
          @click="toggleFaq(index)"
        >
          <div class="faq-question">
            <span class="question-text">{{ faq.question }}</span>
            <span class="toggle-icon">
              <svg 
                width="20" 
                height="20" 
                viewBox="0 0 24 24" 
                :class="{ 'rotated': activeFaqIndex === index }"
              >
                <path d="M7 10l5 5 5-5z" fill="currentColor"/>
              </svg>
            </span>
          </div>
          
          <div class="faq-answer" :class="{ 'open': activeFaqIndex === index }">
            <div class="answer-content">
              {{ faq.answer }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
