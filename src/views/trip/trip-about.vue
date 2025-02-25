<script setup lang="ts">
import { ref } from 'vue';
import walletItem from '@/components/wallet-item.vue';

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
</script>

<template>
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
          <wallet-item />
          <router-link :to="{ name: 'login' }">
            <el-button class="nav-button">LOGIN</el-button>
          </router-link>
          <router-link :to="{ name: 'signup' }">
            <el-button class="nav-button">SIGN UP</el-button>
          </router-link>
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

    <!-- FAQ Section -->
    <h3>FAQs</h3>
    <el-collapse accordion>
      <el-collapse-item v-for="(faq, index) in faqs" :key="index" :title="faq.question" class="stable-item">
        <div class="answer-content">{{ faq.answer }}</div>
      </el-collapse-item>
    </el-collapse>
  </div>
</template>

<style scoped>

.faq-container {
  max-width: 900px;
  min-width: 900px; /* 新增最小宽度锁定 */
  margin: 2rem auto;
}

:deep(.stable-width-collapse) {
  width: 100% !important;
  max-width: 100% !important;
  min-width: 100% !important;
}

/* 纯净模式折叠面板 */
:deep(.clean-collapse) {
  --el-collapse-border-color: transparent;
  background: transparent;
}

:deep(.el-collapse-item) {
  max-width: 900px;
  min-width: 900px;
  margin: 8px 0;
  transition: all 0.1s ease;
}

/* 标题样式 */
:deep(.el-collapse-item__header) {
  background: rgba(255, 255, 255, 0.1) !important;
  border-radius: 8px !important;
  color: #fff !important;
  padding: 16px 24px !important;
  font-size: 2.2rem;
  border: 1px solid transparent;
  transition: all 0.3s ease;
}

/* 内容区域 */
:deep(.el-collapse-item__content) {
  background: transparent !important;
  box-shadow: none !important;
  border: none !important;
  border-radius: 8px !important;
  color: #fff !important;
  padding: 16px 24px !important;
  font-size: 2.2rem;
  border: transparent;
  transition: all 0.9s ease;
  text-align: justify;
}
:deep(.el-collapse-item__content) {
  background: transparent !important;
  backdrop-filter: none !important;
}

/* 移除内容区域阴影效果 */
:deep(.el-collapse-item__wrap) {
  background: transparent !important;
  box-shadow: none !important;
  border: none !important;
}

/* 修复箭头图标颜色 */
:deep(.el-collapse-item__arrow) {
  color: #fff !important;
}

/* 调整激活状态标题背景 */
:deep(.el-collapse-item.is-active .el-collapse-item__header) {
  background: rgba(255, 255, 255, 0.15) !important;
}

/* 箭头图标动画 */
:deep(.el-collapse-item__arrow) {
  color: #fff !important;
  transition: transform 0.3s ease;
}

:deep(.el-collapse-item.is-active) .el-collapse-item__arrow {
  transform: rotate(90deg);
}

/* 悬停效果 */
:deep(.el-collapse-item:hover) .el-collapse-item__header {
  transform: translateX(5px);
  background: rgba(255, 255, 255, 0.15) !important;
}
</style>
