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
    question: 'What is iPoloGO and who is it for?',
    answer:
    'iPoloGO is an intelligent platform designed for international academic conferences, serving both researchers and conference organizers. Whether you\'re attending conferences to present your research, networking with peers, or organizing academic events, iPoloGO provides comprehensive tools to enhance your entire conference experience—from initial planning to post-event engagement.'
  },
  {
    question: 'How does iPoloGO help with conference planning?',
    answer:
    'iPoloGO combines travel planning with academic workflows in one unified platform. You can create door-to-door travel itineraries, discover nearby academic events and local experiences, track important conference deadlines (calls for papers, submission dates), manage your conference schedule, and access all conference materials in one place. Our platform streamlines the entire journey from abstract submission to the closing session.'
  },
  {
    question: 'What AI features does iPoloGO offer?',
    answer:
    'iPoloGO features an AI multi-agent toolkit specifically designed for academic workflows. Our AI assistants can help you generate personalized travel itineraries based on your conference schedule, discover relevant academic events and networking opportunities, optimize your conference agenda, and provide intelligent recommendations for local experiences. These tools are built to understand the unique needs of researchers and conference organizers.'
  },
  {
    question: 'Can I use iPoloGO for both attending and organizing conferences?',
    answer:
    'Absolutely! iPoloGO is designed to serve both conference attendees and organizers. As an attendee, you can plan your travel, manage your schedule, and share insights with the community. As an organizer, you get access to conference tech support tools and services to run smooth, professional events. The platform provides reliable infrastructure for call for papers management, paper submissions, review processes, and event coordination.'
  },
  {
    question: 'What is the community and sharing feature?',
    answer:
    'iPoloGO\'s community platform enables researchers to share conference insights, research highlights, and frontier perspectives with a global academic network. You can post about your conference experiences, discover what others are working on, exchange ideas with peers, and stay connected with the latest developments in your field. It\'s a space where academic travel meets knowledge sharing and professional networking.'
  },
  {
    question: 'What is NFT in iPoloGO?',
    answer:
    'In iPoloGO, NFTs (Non-Fungible Tokens) allow you to preserve memorable conference experiences and research milestones as unique digital collectibles. When you connect your wallet and publish content about your conference journey, presentations, or research insights, you can mint them as NFTs. This provides a blockchain-verified record of your academic contributions and enables you to share, collect, or trade these digital artifacts within the research community.'
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
      <h1>Welcome to iPoloGO</h1>
      <p class="intro-main">
        iPoloGO is an intelligent platform for international academic conferences. 
        We help researchers and organizers stay on the leading edge, plan seamlessly, and run events with maximum efficiency. 
        Our tools combine travel planning with academic workflows so your conference journey, from call for papers to closing session, lives in one place.
      </p>
      
      <div class="features-highlight">
        <h3>What you can do with iPoloGO:</h3>
        <div class="feature-list">
          <div class="feature-item">
            <span class="feature-icon">🌍</span>
            <div class="feature-text">
              <strong>Smart itinerary & nearby travel:</strong> Build door-to-door plans and discover relevant local experiences.
            </div>
          </div>
          <div class="feature-item">
            <span class="feature-icon">💡</span>
            <div class="feature-text">
              <strong>Share & discover:</strong> Post insights, highlights, and frontier perspectives with the community.
            </div>
          </div>
          <div class="feature-item">
            <span class="feature-icon">🏛️</span>
            <div class="feature-text">
              <strong>Conference tech support:</strong> Reliable tools and services for smooth, professional events.
            </div>
          </div>
          <div class="feature-item">
            <span class="feature-icon">🤖</span>
            <div class="feature-text">
              <strong>AI multi-agent toolkit:</strong> Academic-focused assistants that streamline research and organizing tasks.
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Trusted by -->
    <div class="trusted-by-section">
      <div class="trusted-header">
        <h3>Trusted by Leading Institutions Worldwide</h3>
        <div class="trusted-subtitle">Connecting researchers from top universities across the globe</div>
      </div>
      
      <div class="logo-scroll-container">
        <div class="logo-scroll-track">
          <!-- 第一组 logos -->
          <div class="logo-scroll-content">
            <div class="university-logo-card" v-for="n in 20" :key="n">
              <div class="logo-placeholder">
                <span class="university-name">University {{ n }}</span>
                <div class="logo-icon">🎓</div>
              </div>
            </div>
          </div>
          <!-- 复制一组用于无缝循环 -->
          <div class="logo-scroll-content" aria-hidden="true">
            <div class="university-logo-card" v-for="n in 20" :key="`dup-${n}`">
              <div class="logo-placeholder">
                <span class="university-name">University {{ n }}</span>
                <div class="logo-icon">🎓</div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 渐变遮罩 -->
      <div class="scroll-fade-left"></div>
      <div class="scroll-fade-right"></div>
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
