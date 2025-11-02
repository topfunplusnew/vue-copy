<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted } from 'vue';
import { ElInput, ElMessage, ElForm, ElFormItem, ElButton, type FormInstance, type FormRules } from 'element-plus';
import commonHeader from '@/layout/common-header.vue';
import { getForgetPasswordCaptcha, sendForgetPasswordEmail } from '@/services/user/index';

const msg = 'Reset Your Password';
const errorMessage = ref('');
const successMessage = ref('');
const isLoading = ref(false);
const formRef = ref<FormInstance>();
const captchaImage = ref('');
const sessionId = ref('');
const countdown = ref(0);
let countdownTimer: NodeJS.Timeout | null = null;

const form = reactive({
  email: '',
  captcha: '',
});

const rules: FormRules = {
  email: [
    { required: true, message: 'Please enter your email address', trigger: 'blur' },
    { type: 'email', message: 'Please enter a valid email address', trigger: 'blur' },
  ],
  captcha: [{ required: true, message: 'Please enter the verification code', trigger: 'blur' }],
};

// 获取验证码
const fetchCaptcha = async () => {
  try {
    const response = await getForgetPasswordCaptcha();
    // 响应是图片的二进制 Blob 数据
    const blob = response.data as Blob;

    // 创建图片 URL
    const imageUrl = URL.createObjectURL(blob);
    captchaImage.value = imageUrl;
    const sessionIdFromHeader = response.headers['x-captcha-session'] || '';
    console.log('sessionIdFromHeader', sessionIdFromHeader);
    if (sessionIdFromHeader) {
      sessionId.value = sessionIdFromHeader;
    }
  } catch (error) {
    console.error('Failed to fetch captcha:', error);
    ElMessage.error('Failed to load verification code. Please refresh the page.');
  }
};

// 刷新验证码
const refreshCaptcha = async () => {
  form.captcha = '';
  // 释放之前的图片 URL，避免内存泄漏
  if (captchaImage.value) {
    URL.revokeObjectURL(captchaImage.value);
    captchaImage.value = '';
  }
  await fetchCaptcha();
};

// 启动倒计时
const startCountdown = () => {
  countdown.value = 60;
  if (countdownTimer) {
    clearInterval(countdownTimer);
  }
  countdownTimer = setInterval(() => {
    countdown.value--;
    if (countdown.value <= 0) {
      if (countdownTimer) {
        clearInterval(countdownTimer);
        countdownTimer = null;
      }
    }
  }, 1000);
};

const handleSubmit = async () => {
  if (!formRef.value) return;

  // 如果正在倒计时，不允许提交
  if (countdown.value > 0) {
    return;
  }

  try {
    const valid = await formRef.value.validate().catch(() => false);
    if (!valid) {
      errorMessage.value = 'Please fill in all the fields correctly.';
      return;
    }

    if (!sessionId.value) {
      errorMessage.value = 'Please refresh the verification code.';
      return;
    }

    isLoading.value = true;
    errorMessage.value = '';

    // 调用发送邮件接口
    await sendForgetPasswordEmail({
      email: form.email,
      captcha: form.captcha,
      session_id: sessionId.value,
    });

    successMessage.value = 'Verification code sent successfully!';
    ElMessage.success('Password reset email has been sent!');

    // 启动倒计时
    startCountdown();
  } catch (error: unknown) {
    console.error('Failed to send email:', error);
    const axiosError = error as { response?: { data?: { error?: string; message?: string }; status?: number } };
    const errorMsg = axiosError?.response?.data?.error || axiosError?.response?.data?.message || 'Failed to send verification code. Please try again.';
    errorMessage.value = errorMsg;
    ElMessage.error(errorMsg);
    // 如果验证码错误，刷新验证码
    if (axiosError?.response?.status === 400) {
      await refreshCaptcha();
    }
  } finally {
    isLoading.value = false;
  }
};

onMounted(() => {
  fetchCaptcha();
});

onUnmounted(() => {
  // 组件卸载时清除定时器
  if (countdownTimer) {
    clearInterval(countdownTimer);
    countdownTimer = null;
  }
});
</script>

<template>
  <div class="background-layer"></div>
  <div class="reset-password-email-page layout-main">
    <common-header />

    <div class="reset-password-email-hero">
      <h2 class="header-title-reset">{{ msg }}</h2>
      <p class="reset-subtitle">Enter your email to receive a verification code</p>
    </div>

    <div class="reset-password-email-container" :class="{ success: successMessage }">
      <el-form ref="formRef" :model="form" :rules="rules" @submit.prevent="handleSubmit" label-position="top">
        <p v-if="errorMessage" class="error-message">{{ errorMessage }}</p>
        <div v-if="successMessage" class="success-message">
          <i class="el-icon-success"></i>
          <h3>Verification Successful!</h3>
          <p>{{ successMessage }}</p>
        </div>

        <el-form-item label="Email" prop="email" class="form-group-reset">
          <el-input type="email" v-model="form.email" placeholder="Please Input your email" clearable />
        </el-form-item>

        <el-form-item label="Verification Code" prop="captcha" class="form-group-reset">
          <div class="code-input-wrapper">
            <el-input type="text" v-model="form.captcha" placeholder="Enter verification code" clearable />
            <div class="captcha-image-wrapper" @click="refreshCaptcha" title="Click to refresh verification code">
              <img v-if="captchaImage" :src="captchaImage" alt="Verification Code" class="captcha-image" />
              <div v-else class="captcha-loading">Loading...</div>
            </div>
          </div>
        </el-form-item>

        <el-form-item>
          <el-button type="primary" class="reset-button" :loading="isLoading" :disabled="countdown > 0" @click="handleSubmit" native-type="submit">
            {{ countdown > 0 ? `Send Code (${countdown}s)` : 'Send Code' }}
          </el-button>
        </el-form-item>

        <div class="login-link">
          Remember your password?
          <router-link :to="{ name: 'login' }">Log in</router-link>
        </div>
      </el-form>
    </div>
  </div>
</template>

<style lang="scss" scoped>
@use '@/styles/_reset_password_email.scss';
</style>
