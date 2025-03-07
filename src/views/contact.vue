<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import walletItem from '@/components/wallet-item.vue';
import { useUserStore } from '@/stores/user';
// 其他导入...

const router = useRouter();
const userStore = useUserStore();

// 处理登录点击
const handleLoginClick = () => {
  router.push({ name: 'login' });
};

// 处理下拉菜单命令
const handleCommand = (command) => {
  if (command === 'profile') {
    router.push({ name: 'userpage' });
  } else if (command === 'logout') {
    userStore.logout();
    router.push({ name: 'home' });
  }
};

// 跳转到用户个人资料页面
const goToUserProfile = () => {
  router.push({ name: 'userpage' });
};

// 添加导航菜单状态管理
const menuActive = ref(false);

// 切换菜单显示
const toggleMenu = () => {
  menuActive.value = !menuActive.value;
};
</script>

<template>
  <div class="background-layer"></div>
  <div class="contact-container">
    <!-- Header -->
    <header class="header">
      <div class="nav-container" :class="{ 'menu-active': menuActive }">
        <!-- 汉堡菜单按钮 -->
        <button class="hamburger-menu" @click="toggleMenu">
          <span v-if="menuActive">✕</span>
          <span v-else>☰</span>
        </button>
        
        <div class="left-nav" :class="{ 'active': menuActive }">
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
  </div>
</template> 