<script setup lang="ts">
import { ref, onMounted } from 'vue';

const msg= 'Welcome back to iPoloGO';
</script>

<template>
  <div class="home">
    <!-- 改进后的 Header -->
    <header class="header">
      <div class="nav-container">
        <div class="left-nav">
          <router-link :to="{ name: 'home' }"><el-button class="nav-button">HOME</el-button></router-link>
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
</style>
