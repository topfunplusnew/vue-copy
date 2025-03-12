<script setup lang="ts">
import { ref, reactive } from 'vue';
import { useRouter } from 'vue-router';
import { useUserStore } from '@/stores/user';
import walletItem from '@/components/wallet-item.vue';
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


const showBlogDetail = async (id: number) => {
  // 重置图片索引
  currentImageIndex.value = 0;

  try {
    // 添加参数指示后端返回所有回复，不分页
    await store.getBlogByID(id);
    dialogBlog.value = true;

    // 重置评论区状态
    expandedReplies.value = [];
    expandedComments.value = []; // 重置已展开的评论列表
    replyContent.value = '';
    replyTarget.value = null;

    // 在对话框打开后滚动到顶部
    nextTick(() => {
      const detailBox = document.querySelector('.blog-details-home');
      if (detailBox) {
        detailBox.scrollTop = 0;
      }
    });
  } catch (error) {
    console.error('无法加载博客详情:', error);
    ElMessage.error('Failed to load blog details');
  }
};

const loginForm = reactive({
  email: '',
  password: ''
});

const closeBlogDetail = () => {
  dialogBlog.value = false;
  // 恢复背景滚动
  document.body.style.overflow = '';
  // 清空评论输入
  newComment.value = '';
};

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
  <div class="background-layer"></div>
  <div class="home">
    <commonHeader />
    <div class="login-page-container">
      <div class="login-hero">
        <div class="header-title-login">Welcome Back</div>
        <div class="login-subtitle">Sign in to continue your journey</div>
      </div>

      <div class="login-container">
        <form @submit.prevent="handleLogin">
          <div class="form-title-login">Sign In</div>
          <p v-if="errorMessage" class="error-message">{{ errorMessage }}</p>

          <div class="form-group-login login-input-group">
            <label for="email">Email</label>
            <input type="email" 
            id="email" 
            v-model="loginForm.email" 
            placeholder="Your email address" 
            required />
          </div>

          <div class="form-group-login login-input-group">
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
  </div>
</template>


