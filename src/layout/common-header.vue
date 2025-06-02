<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import walletItem from '@/components/wallet-item.vue';
import UserMessage from '@/views/user/user-message.vue';
import { ElMessage, ElIcon } from 'element-plus';
import { useUserStore } from '@/stores/user';
import { getImageUrl } from '@/utils';

const router = useRouter();
const userStore = useUserStore();

// 消息弹窗状态
const showMessageModal = ref(false);

onMounted(() => {
  userStore.getUserInfo();
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
const menuActive = ref(false);

// 切换菜单显示
const toggleMenu = () => {
  menuActive.value = !menuActive.value;
};
</script>

<template>
  <!-- 顶部导航栏 -->
  <!-- Header 区域 -->
  <header class="layout">
    <div class="header-container"  :class="{ 'menu-active': menuActive }">
      <!-- 汉堡菜单按钮 -->
      <button class="hamburger-menu" @click="toggleMenu">
        <span v-if="menuActive">✕</span>
        <span v-else>☰</span>
      </button>

      <nav class="pop-nav">
        <router-link :to="{ name: 'home' }" class="nav-btn toggle-nav">HOME</router-link>
        <router-link :to="{ name: 'about' }" class="nav-btn toggle-nav">ABOUT</router-link>
        <router-link :to="{ name: 'blog' }" class="nav-btn toggle-nav">BLOG</router-link>
        <router-link :to="{ name: 'contact' }" class="nav-btn toggle-nav">CONTACT</router-link>
      </nav>
      <nav>
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
                <el-icon><user /></el-icon>
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
