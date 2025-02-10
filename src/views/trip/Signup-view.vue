<script setup lang="ts">
import { ref } from 'vue';

const msg = 'Sign Up';
const username = ref('');
const email = ref('');
const password = ref('');
const confirmPassword = ref('');
const phoneNumber = ref('');
const captcha = ref('');
const errorMessage = ref('');

// 注册表单提交逻辑
const handleSubmit = () => {
  if (!username.value || !email.value || !password.value || !confirmPassword.value || !phoneNumber.value || !captcha.value) {
    errorMessage.value = 'Please fill in all the fields.';
    return;
  }

  if (password.value !== confirmPassword.value) {
    errorMessage.value = 'Passwords do not match.';
    return;
  }

  // TODO: Handle registration logic (e.g., API call)
  console.log('User registered:', username.value, email.value, phoneNumber.value);
  errorMessage.value = ''; // Reset error message
};
</script>

<template>
  <div class="home">
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

    <!-- 注册表单 -->
    <div class="signup-container">
      <form @submit.prevent="handleSubmit">
        <!-- 错误提示 -->
        <p v-if="errorMessage" class="error-message">{{ errorMessage }}</p>

        <!-- 用户名 -->
        <div class="form-group">
          <label for="username">Username</label>
          <input type="text" id="username" v-model="username" placeholder="8-16 characters, letters and numbers only" required />
        </div>

        <!-- 电子邮箱 -->
        <div class="form-group">
          <label for="email">Email</label>
          <input type="email" id="email" v-model="email" placeholder="example@domain.com" required />
        </div>

        <!-- 密码 -->
        <div class="form-group">
          <label for="password">Password</label>
          <input type="password" id="password" v-model="password" placeholder="6-12 characters" required />
        </div>

        <!-- 确认密码 -->
        <div class="form-group">
          <label for="confirmPassword">Confirm Password</label>
          <input type="password" id="confirmPassword" v-model="confirmPassword" placeholder="Re-enter password" required />
        </div>

        <!-- 手机号码 -->
        <div class="form-group">
          <label for="phoneNumber">Phone Number</label>
          <input type="text" id="phoneNumber" v-model="phoneNumber" placeholder="Your phone number" required />
        </div>

        <!-- 图形验证码 -->
        <div class="form-group captcha-container">
          <label for="captcha">Captcha</label>
          <input type="text" id="captcha" v-model="captcha" placeholder="Enter Captcha" required />
          <button type="button" class="verification-button">Send Code</button>
        </div>

        <button type="submit" class="signup-button">Sign Up</button>
      </form>
    </div>
  </div>
</template>