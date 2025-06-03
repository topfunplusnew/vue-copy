<template>

  <!-- 顶部导航栏 -->
  <!-- Header 区域 -->
  <header class="layout">
    <div class="header-container">
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
        <router-link :to="{ name: 'blog' }" class="nav-btn toggle-nav">BLOG</router-link>
        <router-link :to="{ name: 'contact' }" class="nav-btn toggle-nav">CONTACT</router-link>
      </nav>

      <!-- 用户区域 -->
      <nav class="user-nav">
        <wallet-item class="nav-btn" />
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
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import walletItem from '@/components/wallet-item.vue';
import UserMessage from '@/views/user/user-message.vue';
import { ElMessage, ElIcon } from 'element-plus';
import { User } from '@element-plus/icons-vue';
import { useUserStore } from '@/stores/user';
import { getImageUrl } from '@/utils';

const router = useRouter();
const userStore = useUserStore();

// 消息弹窗状态
const showMessageModal = ref(false);

onMounted(() => {
  userStore.getUserInfo();
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
  } else if (command === 'logout') {
    userStore.logout();
    ElMessage.success('Logged out successfully');
    router.push({ path: '/' });
  }
  // TODO: 处理其他命令 (wallet, plan, history, cart, orders)
};

// 导航菜单状态
const navMenuActive = ref(false);

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
