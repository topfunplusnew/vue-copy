<script setup lang="ts">
import { ref, reactive } from 'vue';
import walletItem from '@/components/wallet-item.vue';
import Captcha from '@/components/Captcha.vue';  // 引入 DragSlider 组件
import { userSignup } from '@/services/api';

const msg = 'Start Your Journey in iPoloGO';

const errorMessage = ref('');
const isVerified = ref(false);  // 用于判断验证码是否通过

const editForm = reactive({
  email: '',
  password: '',
  password_confirm: '',
});


// 注册表单提交逻辑
const handleSubmit = () => {
  if (!editForm.email || !editForm.password || !editForm.password_confirm) {
    errorMessage.value = 'Please fill in all the fields.';
    return;
  }

  if (editForm.password !== editForm.password_confirm) {
    errorMessage.value = 'Passwords do not match.';
    return;
  }

  if (!isVerified.value) {
    errorMessage.value = 'Please complete the CAPTCHA.';
    return;
  }

  // TODO: Handle registration logic (e.g., API call)
  console.log('User registered:', editForm.email);
  errorMessage.value = ''; // Reset error message
  userSignup(editForm).then((res) => {
    console.log(res);
  }).catch((e) => {
    console.log(e);
  });
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
          <router-link :to="{ name: 'login' }"><el-button class="nav-button">LOGIN</el-button></router-link>
          <router-link :to="{ name: 'signup' }"><el-button class="nav-button">SIGN UP</el-button></router-link>
        </div>
      </div>
      
    </header>

    <h2 class="header-title-signup">{{ msg }}</h2>

    <!-- 注册表单 -->
    <div class="signup-container">
      
      <form @submit.prevent="handleSubmit">
        <!-- 错误提示 -->
        <p v-if="errorMessage" class="error-message">{{ errorMessage }}</p>

        <!-- 用户名 -->
        <!-- <div class="form-group">
          <label for="username">Username</label>
          <input type="text" id="username" v-model="editForm.name" placeholder="8-16 characters, letters and numbers only" required />
        </div> -->

        <!-- 电子邮箱 -->
        <div class="form-group">
          <label for="email">Email</label>
          <input type="email" id="email" v-model="editForm.email" placeholder="example@domain.com" required />
        </div>

        <!-- 发送确认邮件按钮 -->
        <button type="button" class="confirm-email-button">Send Confirmation Email</button>

        <!-- 密码 -->
        <div class="form-group">
          <label for="password">Password</label>
          <input type="password" id="password" v-model="editForm.password" placeholder="6-12 characters" required />
        </div>

        <!-- 确认密码 -->
        <div class="form-group">
          <label for="confirmPassword">Confirm Password</label>
          <input type="password" id="confirmPassword" v-model="editForm.password_confirm" placeholder="Re-enter password" required />
        </div>

        <div class="captcha-container">
          <div class="captcha-item">
            <label for="captcha" class="captcha-label">Verify your identity</label>
            <Captcha @success="isVerified = true" id="captcha" />
          </div>
        </div>

        <button type="submit" class="signup-button">Sign Up</button>
      </form>
    </div>
  </div>
</template>


