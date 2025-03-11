<script setup lang="ts">
import { ref, reactive } from 'vue';
import { useRouter } from 'vue-router';
import { useUserStore } from '@/stores/user';
import { ElInput, ElMessage } from 'element-plus';
import commonHeader from '@/layout/common-header.vue';

interface ApiError {
  response?: {
    data?: {
      message?: string;
    };
  };
}

const router = useRouter();
const store = useUserStore();



const loginForm = reactive({
  email: '',
  password: ''
});


const errorMessage = ref('');
const isLoading = ref(false);
const rememberMe = ref(false);

const handleLogin = async () => {
  if (!loginForm.email || !loginForm.password) {
    errorMessage.value = 'Please enter both email and password.';
    return;
  }

  isLoading.value = true;
  errorMessage.value = '';

  try {
    await store.login(loginForm);

    ElMessage({
      message: 'Login successful!',
      type: 'success',
      duration: 2000
    });

    router.push({ name: 'home' });
  } catch (error: unknown) {
    console.error(error);
    const apiError = error as ApiError;
    if (apiError.response?.data?.message) {
      errorMessage.value = `Login failed: ${apiError.response.data.message}`;
    } else {
      errorMessage.value = 'Login failed. Please check your credentials and try again.';
    }
  } finally {
    isLoading.value = false;
  }
};

const handleSocialLogin = (provider: string) => {
  ElMessage({
    message: `${provider} login will be available soon.`,
    type: 'info',
    duration: 3000
  });
};
</script>

<template>
  <div class="login-page">
    <common-header />

    <div class="login-hero">
      <h2 class="header-title-login">Welcome Back</h2>
      <p class="login-subtitle">Sign in to continue your journey</p>
    </div>

    <div class="login-container">
      <form @submit.prevent="handleLogin">
        <h3 class="form-title-login">Sign In</h3>
        <p v-if="errorMessage" class="error-message">{{ errorMessage }}</p>

        <div class="form-group-login">
          <label for="email">Email</label>
          <input type="email" id="email" v-model="loginForm.email" placeholder="Your email address" required />
        </div>

        <div class="form-group-login">
          <label for="password">Password</label>
          <el-input
            v-model="loginForm.password"
            id="password"
            type="password"
            placeholder="Your password"
            show-password
            required
          />
        </div>

        <div class="form-options">
          <div class="remember-me">
            <input type="checkbox" id="remember" v-model="rememberMe" />
            <label for="remember">Remember me</label>
          </div>
          <router-link :to="{ name: 'forgetpassword' }" class="forgot-password">Forgot password?</router-link>
        </div>

        <button type="submit" class="login-button" :disabled="isLoading">
          <span v-if="!isLoading">Sign In</span>
          <span v-else class="loading-spinner"></span>
        </button>

        <div class="or-divider">
          <span>or continue with</span>
        </div>

        <div class="social-login">
          <button type="button" class="social-button" @click="handleSocialLogin('Google')">
            <img src="@/assets/google-logo.svg" alt="Google" />
            Google
          </button>
          <button type="button" class="social-button" @click="handleSocialLogin('Apple')">
            <img src="@/assets/apple-logo.svg" alt="Apple" />
            Apple
          </button>
          <button type="button" class="social-button" @click="handleSocialLogin('WeChat')">
            <img src="@/assets/wechat-logo.svg" alt="WeChat" />
            WeChat
          </button>
        </div>

        <div class="signup-link">
          Don't have an account? <router-link :to="{ name: 'signup' }">Sign up</router-link>
        </div>
      </form>
    </div>
  </div>
</template>


