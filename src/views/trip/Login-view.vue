<script setup lang="ts">
import walletItem from '@/components/wallet-item.vue';
import { ref, reactive, onMounted } from 'vue';
</script>

<template>
  <div class="home">
    <!-- Header 区域（保持原有设计） -->
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
          <router-link :to="{ name: 'userpage' }">
            <el-button class="nav-button">User Page</el-button>
          </router-link>
        </div>
      </div>
      <h1 class="welcome-text">Welcome Back!</h1>
    </header>

    <!-- 主体部分：左右两栏结构 -->
    <main class="main">
      <div class="content-container">
        <!-- 左侧：登录功能及相关选项 -->
        <div class="left-panel">

          <div class="login-container">
            <div class="login-form">
              <h2>Login</h2>
              <form @submit.prevent="handleSubmit">
                <input type="text" v-model="username" placeholder="Username / Email" required />
                <input type="password" v-model="password" placeholder="Password" required />
                <button type="submit" class="login-button">Login</button>
              </form>

              <!-- 忘记密码和注册链接 -->
              <div class="links-container">
                <router-link to="/forgetpassword" class="forgot-password-link">Forgot Password?</router-link>
                <router-link to="/signup" class="signup-link">Sign up</router-link>
              </div>

              <!-- 分割线及 or -->
              <div class="or-divider">
                <span>or</span>
              </div>
              <!-- 快捷登录提示 -->
              <p class="quick-login-text">Quick login in the following ways:</p>
              <!-- 快捷登录模块 -->
              <div class="social-login">
                <button class="social-button wechat">WeChat</button>
                <button class="social-button google">Google</button>
                <button class="social-button apple">Apple</button>
              </div>
            </div>
          </div>
        </div>

        <!-- 右侧：展示视频和图片 -->
        <!-- <div class="right-panel">
          <div class="media-display">

            <video class="promo-video" controls>
              <source src="path/to/video.mp4" type="video/mp4">
              Your browser does not support the video tag.
            </video>

            <div class="image-gallery">
              <img src="path/to/image1.jpg" alt="Promo Image 1" />
              <img src="path/to/image2.jpg" alt="Promo Image 2" />
            </div>
          </div>
        </div> -->
      </div>
    </main>
  </div>
</template>
