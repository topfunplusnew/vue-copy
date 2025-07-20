<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { useWalletStore, WALLET_STATUS } from '@/stores/wallet';
import UserMessage from '@/views/user/user-message.vue';
import PlanComponent from '@/views/components/plan-component.vue';
import HistoryComponent from '@/views/components/history-component.vue';
import { ElMessage, ElIcon } from 'element-plus';
import { User } from '@element-plus/icons-vue';
import { useUserStore } from '@/stores/user';
import { useChatStore } from '@/stores/chat';
import { getImageUrl } from '@/utils';
import type { Destination, SavedPlanData } from '@/types/base';

const router = useRouter();
const userStore = useUserStore();
const walletStore = useWalletStore();
const chatStore = useChatStore();

// 消息弹窗状态
const showMessageModal = ref(false);

// 计划弹窗状态
const showPlanModal = ref(false);

// 历史弹窗状态
const showHistoryModal = ref(false);

// 导航菜单状态
const navMenuActive = ref(false);

// 可用景点数据（header中通常为空，但保持接口一致）
const availableDestinations = ref<Destination[]>([]);

onMounted(() => {
  userStore.getUserInfo();
  // 初始化钱包
  try {
    walletStore.init();
  } catch (e) {
    console.log(e);
  }
  // 添加点击事件监听器
  document.addEventListener('click', handleClickOutside);
});

onUnmounted(() => {
  // 清理事件监听器
  document.removeEventListener('click', handleClickOutside);
});

// 处理下拉菜单命令
const handleCommand = (command: string) => {
  if (command === 'profile') {
    router.push({ name: 'userpage' });
  } else if (command === 'message') {
    showMessageModal.value = true;
  } else if (command === 'wallet') {
    // 处理钱包连接
    if (walletStore.status === WALLET_STATUS.NO_PROVIDER) {
      window.open('https://metamask.io/download/', '_blank');
    } else if (walletStore.status !== WALLET_STATUS.CONNECTED) {
      walletStore.connect();
      ElMessage.info('Connecting to wallet...');
    } else {
      ElMessage.info(`Wallet connected: ${walletStore.address.slice(0, 6)}...${walletStore.address.slice(-4)}`);
    }
  } else if (command === 'plan') {
    showPlanModal.value = true;
  } else if (command === 'history') {
    showHistoryModal.value = true;
  } else if (command === 'logout') {
    userStore.logout();
    ElMessage.success('Logged out successfully');
    router.push({ path: '/' });
  }
  // TODO: 处理其他命令 (plan, history, cart, orders)
  // TODO: 处理其他命令 (wallet, cart, orders)
};

// 处理计划保存
const handlePlanSave = (plan: SavedPlanData) => {
  console.log('Saving plan from header:', plan);
  showPlanModal.value = false;
  ElMessage.success('Plan saved successfully!');
};

// 处理历史对话加载
const handleHistoryLoad = (conversationId: number) => {
  showHistoryModal.value = false;

  // 检查当前是否在trip-generator页面
  const currentRoute = router.currentRoute.value;

  if (currentRoute.name === 'generator') {
    // 如果已经在generator页面，直接加载对话
    chatStore.getChatsByConversationID(conversationId)
      .then(() => {
        ElMessage.success('Conversation loaded successfully');
      })
      .catch((e: unknown) => {
        console.error('Failed to load conversation:', e);
        ElMessage.error('Failed to load conversation');
      });
  } else {
    // 如果在其他页面，跳转到generator页面并传递conversationId
    ElMessage.info('Redirecting to chat page...');
    router.push({
      name: 'generator',
      query: { conversationId: conversationId.toString() }
    }).catch((e: unknown) => {
      console.error('Failed to navigate:', e);
      ElMessage.error('Failed to navigate to chat page');
    });
  }
};

// 切换导航菜单显示
const toggleNavMenu = (event: Event) => {
  event.preventDefault();
  event.stopPropagation();
  navMenuActive.value = !navMenuActive.value;
};

// 处理点击外部区域收起菜单
const handleClickOutside = (event: Event) => {
  const target = event.target as HTMLElement;

  // 检查点击的元素是否在汉堡菜单按钮或下拉菜单内
  if (navMenuActive.value && target) {
    const hamburgerBtn = target.closest('.nav-hamburger-menu');
    const dropdownMenu = target.closest('.pop-nav');

    // 如果点击的不是汉堡菜单按钮和下拉菜单，则收起菜单
    if (!hamburgerBtn && !dropdownMenu) {
      navMenuActive.value = false;
    }
  }
};
</script>

<template>
  <!-- 顶部导航栏 -->
  <!-- Header 区域 -->
  <header class="layout">
    <div class="header-container">
      <!-- 添加 logo -->
      <div class="logo-container">
        <img src="@/assets/iPoloGO.png" alt="iPoloGO Logo" class="logo" />
      </div>
      <!-- 移动端导航区域 -->
      <div class="mobile-nav">
        <!-- HOME按钮带嵌入的汉堡菜单 -->
        <div class="home-with-menu">
          <router-link :to="{ name: 'home' }" class="nav-btn home-btn">HOME</router-link>
          <button class="nav-hamburger-menu embedded" @click="toggleNavMenu">
            <span v-if="navMenuActive">✕</span>
            <span v-else>☰</span>
          </button>
        </div>
      </div>

      <!-- 主导航菜单 -->
      <nav class="pop-nav" :class="{ 'nav-menu-active': navMenuActive }">
        <router-link :to="{ name: 'home' }" class="nav-btn toggle-nav desktop-nav">HOME</router-link>
        <router-link :to="{ name: 'about' }" class="nav-btn toggle-nav">ABOUT</router-link>
        <router-link :to="{ name: 'news' }" class="nav-btn toggle-nav">NEWS</router-link>
        <router-link :to="{ name: 'contact' }" class="nav-btn toggle-nav">CONTACT</router-link>
        <router-link :to="{ name: 'invitation' }" class="nav-btn toggle-nav">INVITATION</router-link>
      </nav>

      <!-- 用户区域 -->
      <nav class="user-nav">
        <div v-if="userStore.user" class="nav-btn user-profile-btn">
          <div class="user-profile-nav">
            <div class="data-flow"></div>
            <img
              :src="getImageUrl(userStore.user.avatar || '')"
              alt="User Avatar"
            />
            <span class="home-new-username">{{ userStore.user.name }}</span>
            <el-dropdown trigger="click" @command="handleCommand">
              <span class="el-dropdown-link">
                <el-icon><User /></el-icon>
              </span>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="profile">My Profile</el-dropdown-item>
                  <el-dropdown-item command="message">Message</el-dropdown-item>
                  <el-dropdown-item command="wallet">Wallet</el-dropdown-item>
                  <el-dropdown-item command="plan">My Plan</el-dropdown-item>
                  <el-dropdown-item command="history">Chat History</el-dropdown-item>
                  <el-dropdown-item command="cart">Cart</el-dropdown-item>
                  <el-dropdown-item command="orders">Orders</el-dropdown-item>
                  <el-dropdown-item command="logout">Logout</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>
        </div>
        <template v-else>
          <router-link :to="{ name: 'login' }" class="nav-btn">LOGIN</router-link>
          <router-link :to="{ name: 'signup' }" class="nav-btn">SIGN UP</router-link>
        </template>
      </nav>
    </div>
  </header>

  <!-- 消息弹窗组件 -->
  <UserMessage v-model:visible="showMessageModal" />

  <!-- 计划弹窗组件 -->
  <PlanComponent
    :visible="showPlanModal"
    :available-destinations="availableDestinations"
    @close="showPlanModal = false"
    @save="handlePlanSave"
  />

  <!-- 历史弹窗组件 -->
  <HistoryComponent
    :visible="showHistoryModal"
    @close="showHistoryModal = false"
    @load-history="handleHistoryLoad"
  />
</template>

<style scoped>
.logo-container {
  display: flex;
  align-items: center;
  margin-right: rpx(15);
}

.logo {
  height: rpx(40);
  width: auto;
}
</style>
