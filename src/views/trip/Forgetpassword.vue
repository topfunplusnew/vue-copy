<script setup lang="ts">
import { ref } from 'vue';

const msg = ' Welcome Back!'; // 新增的文本

// 定义绑定的变量
const username = ref('');
const email = ref('');
const newPassword = ref('');
const confirmPassword = ref('');
const errorMessage = ref('');
const successMessage = ref('');

// 表单提交的逻辑
const handleSubmit = () => {
  if (!username.value || !email.value || !newPassword.value || !confirmPassword.value) {
    errorMessage.value = 'Please fill in all fields.';
    return;
  }

  if (newPassword.value !== confirmPassword.value) {
    errorMessage.value = 'Passwords do not match.';
    return;
  }

  // TODO: Handle password reset logic (e.g., API call)
  successMessage.value = 'Password reset successfully!';
  errorMessage.value = ''; // Reset error message
};
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
        </div>
      </div>
    </header>

    <h2>{{ msg }}</h2>

    <!-- 重置密码表单 -->
    <div class="forget-container">
      <h2 class="resettext">Reset Your Password</h2> <!-- 新增的文本 -->
      
      <!-- 错误提示 -->
      <p v-if="errorMessage" class="error-message">{{ errorMessage }}</p>
      
      <!-- 成功提示 -->
      <p v-if="successMessage" class="success-message">{{ successMessage }}</p>

      <form @submit.prevent="handleSubmit">
        <!-- 用户名 -->
        <div class="form-group">
          <label for="username">Username</label>
          <input type="text" id="username" v-model="username" placeholder="Enter your username" required />
        </div>

        <!-- 电子邮箱 -->
        <div class="form-group">
          <label for="email">Email</label>
          <input type="email" id="email" v-model="email" placeholder="Enter your email" required />
        </div>

        <!-- 发送确认邮件按钮 -->
        <button type="button" class="confirm-email-button">Send Confirmation Email</button>

        <!-- 新密码 -->
        <div class="form-group">
          <label for="newPassword">New Password</label>
          <input type="password" id="newPassword" v-model="newPassword" placeholder="Enter new password" required />
        </div>

        <!-- 确认新密码 -->
        <div class="form-group">
          <label for="confirmPassword">Confirm New Password</label>
          <input type="password" id="confirmPassword" v-model="confirmPassword" placeholder="Re-enter new password" required />
        </div>

        <!-- 重置密码按钮 -->
        <button type="submit" class="Reset-button">Reset Password</button>
      </form>
    </div>
  </div>
</template>



<style scoped>
.resettext {
  font-size: 40px; /* 设置更大的字体 */
  font-weight: bold;
  text-align: center;
  color: #ffffff; /* 设置文本颜色 */
  margin-bottom: 50px; /* 增加下方的间距，可以根据需要调整 */
}
</style>