<script setup lang="ts">
import walletItem from '@/components/wallet-item.vue';
import type { ILogin } from '@/types/user';
import { reactive, ref } from 'vue';
import { ElMessage } from 'element-plus';
import { useUserStore } from '@/stores/user';
import { useRouter } from 'vue-router';
import SignupView from './Signup-view.vue';

const router = useRouter();
const store = useUserStore();
const params = reactive(<ILogin>{ email: '', password: '' });
const loading = ref(false);

function handleSubmit() {
  if (!params.email || !params.password) {
    ElMessage.error('Please enter your email and password');
    return;
  }

  loading.value = true;
  store
    .login(params)
    .then((res) => {
      ElMessage.success('Login successful');
      router.push({ name: 'userpage' });
    })
    .catch((e) => {
      if (e.response?.status === 400) {
        ElMessage.error('Incorrect email or password');
      } else {
        ElMessage.error('Login failed, please try again later');
      }
    })
    .finally(() => {
      loading.value = false;
    });
}
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
                <input type="text" v-model="params.email" placeholder="Username / Email" required />
                <input type="password" v-model="params.password" placeholder="Password" required />
                <button type="submit" class="login-button" :disabled="loading">Login</button>
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
                <button class="social-button google">Google</button>
                <button class="social-button apple">Apple</button>
              </div>
            </div>
          </div>
        </div>

      </div>
    </main>
  </div>
</template>

<style lang="scss" scoped>
@import '@/styles/_login.scss';
</style>
