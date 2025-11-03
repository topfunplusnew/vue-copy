<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElInput, ElMessage, ElForm, ElFormItem, ElButton, type FormInstance, type FormRules } from 'element-plus';
import commonHeader from '@/layout/common-header.vue';
import { resetPassword } from '@/services/user/index';

const route = useRoute();
const router = useRouter();
const msg = 'Reset Your Password';
const errorMessage = ref('');
const successMessage = ref('');
const isLoading = ref(false);
const isVerified = ref(false);
const resetToken = ref('');
const isResetMode = ref(false); // 是否是重置密码模式（从邮件链接跳转）
const formRef = ref<FormInstance>();
const countdown = ref(0);
let countdownTimer: NodeJS.Timeout | null = null;

const editForm = reactive({
  email: '',
  username: '',
  password: '',
  password_confirm: '',
});

// 自定义密码校验函数
const validatePassword = (_: unknown, value: string, callback: (error?: Error) => void) => {
  if (!value) {
    callback(new Error('Please enter your new password'));
    return;
  }
  if (value.length < 8) {
    callback(new Error('Password must be at least 8 characters'));
    return;
  }
  callback();
};

// 自定义确认密码校验函数
const validatePasswordConfirm = (_: unknown, value: string, callback: (error?: Error) => void) => {
  if (!value) {
    callback(new Error('Please confirm your password'));
    return;
  }
  if (value !== editForm.password) {
    callback(new Error('Passwords do not match'));
    return;
  }
  callback();
};

const rules: FormRules = {
  email: [
    { required: true, message: 'Please enter your email address', trigger: 'blur' },
    { type: 'email', message: 'Please enter a valid email address', trigger: 'blur' },
  ],
  password: [{ validator: validatePassword, trigger: ['blur', 'change'] }],
  password_confirm: [{ validator: validatePasswordConfirm, trigger: ['blur', 'change'] }],
};

const passwordStrength = ref(0);
const passwordRequirements = reactive({
  length: false,
  uppercase: false,
  number: false,
  special: false,
});

const checkPasswordStrength = () => {
  let strength = 0;
  const password = editForm.password;

  passwordRequirements.length = password.length >= 8;
  if (passwordRequirements.length) strength += 1;

  passwordRequirements.uppercase = /[A-Z]/.test(password);
  if (passwordRequirements.uppercase) strength += 1;

  passwordRequirements.number = /[0-9]/.test(password);
  if (passwordRequirements.number) strength += 1;

  passwordRequirements.special = /[^A-Za-z0-9]/.test(password);
  if (passwordRequirements.special) strength += 1;

  passwordStrength.value = strength;
};

const handleSubmit = async () => {
  if (!formRef.value) return;

  try {
    // 表单校验
    const valid = await formRef.value.validate().catch(() => false);
    if (!valid) {
      errorMessage.value = 'Please fill in all the fields correctly.';
      return;
    }

    // 重置密码模式：直接调用接口
    if (isResetMode.value) {
      if (!resetToken.value) {
        errorMessage.value = 'Invalid reset token.';
        return;
      }

      isLoading.value = true;
      errorMessage.value = '';
      try {
        await resetPassword({
          reset_token: resetToken.value,
          email: editForm.email,
          password: editForm.password,
          repeat_password: editForm.password_confirm,
        });
        successMessage.value = 'Password reset successfully!';
        ElMessage.success('Password reset successfully!');
        // 启动倒计时，3秒后跳转到登录页面
        countdown.value = 3;
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
            router.push({ name: 'login' });
          }
        }, 1000);
      } catch (error: unknown) {
        const axiosError = error as { response?: { data?: { error?: string; message?: string } } };
        const errorMsg = axiosError?.response?.data?.error || axiosError?.response?.data?.message || 'Failed to reset password. Please try again.';
        errorMessage.value = errorMsg;
        ElMessage.error(errorMsg);
      } finally {
        isLoading.value = false;
      }
      return;
    }

    // 原有逻辑（发送邮件模式）
    if (!isVerified.value) {
      errorMessage.value = 'Please complete the CAPTCHA.';
      return;
    }

    if (passwordStrength.value < 2) {
      const missingRequirements = [];
      if (!passwordRequirements.length) missingRequirements.push('at least 8 characters');
      if (!passwordRequirements.uppercase) missingRequirements.push('uppercase letter');
      if (!passwordRequirements.number) missingRequirements.push('number');
      if (!passwordRequirements.special) missingRequirements.push('special character');

      errorMessage.value = `Password is too weak. Please include: ${missingRequirements.join(', ')}`;
      return;
    }

    isLoading.value = true;
    try {
      // TODO: Handle password reset logic (e.g., API call)
      await new Promise((resolve) => setTimeout(resolve, 1000)); // 模拟API调用
      successMessage.value = 'Password reset successfully!';
      errorMessage.value = '';
      ElMessage.success('Password reset email has been sent!');
    } catch {
      errorMessage.value = 'Failed to reset password. Please try again.';
    } finally {
      isLoading.value = false;
    }
  } catch {
    errorMessage.value = 'Please fill in all the fields correctly.';
  }
};

// 从 URL 获取参数
onMounted(() => {
  const token = route.query.reset_token as string;
  const email = route.query.email as string;

  if (token && email) {
    isResetMode.value = true;
    resetToken.value = token;
    editForm.email = email;
  }
});

onUnmounted(() => {
  if (countdownTimer) {
    clearInterval(countdownTimer);
    countdownTimer = null;
  }
});
</script>

<template>
  <div class="background-layer"></div>
  <div class="forget-password-page layout-main">
    <common-header />

    <div class="forget-password-hero">
      <h2 class="header-title-forget">{{ msg }}</h2>
      <p class="forget-subtitle">Recover your account access securely</p>
    </div>

    <div class="forget-container" :class="{ success: successMessage }">
      <el-form ref="formRef" :model="editForm" :rules="rules" @submit.prevent="handleSubmit" label-position="top">
        <p v-if="errorMessage" class="error-message">{{ errorMessage }}</p>
        <div v-if="successMessage" class="success-message">
          <i class="el-icon-success"></i>
          <h3>Password Reset Successful!</h3>
          <p>{{ successMessage }}</p>
        </div>
        <div v-if="countdown > 0" class="countdown-box">
          <div class="countdown-number">{{ countdown }}</div>
          <div class="countdown-label">Redirecting to login page in {{ countdown }} second{{ countdown > 1 ? 's' : '' }}...</div>
        </div>

        <el-form-item label="Email" prop="email" class="form-group-forget">
          <el-input type="email" v-model="editForm.email" placeholder="Enter your email address" :disabled="isResetMode" clearable />
        </el-form-item>

        <el-form-item label="New Password" prop="password" class="form-group-forget">
          <el-input v-model="editForm.password" type="password" placeholder="Enter your new password" show-password @input="checkPasswordStrength" clearable />
        </el-form-item>
        <div class="password-strength-signup" v-if="editForm.password">
          <div class="strength-meter-signup">
            <div
              class="strength-bar-signup"
              :style="{ width: `${passwordStrength * 25}%` }"
              :class="{
                weak: passwordStrength === 1,
                medium: passwordStrength === 2,
                strong: passwordStrength === 3,
                'very-strong': passwordStrength === 4,
              }"
            ></div>
          </div>
          <span
            class="strength-text-signup"
            :class="{
              'text-weak': passwordStrength === 1,
              'text-medium': passwordStrength === 2,
              'text-strong': passwordStrength === 3,
              'text-very-strong': passwordStrength === 4,
            }"
            v-if="editForm.password"
          >
            {{ passwordStrength === 0 ? 'Too Weak' : ['Weak', 'Fair', 'Good', 'Strong'][passwordStrength - 1] }}
          </span>
        </div>

        <el-form-item label="Confirm Pwd" prop="password_confirm" class="form-group-forget">
          <el-input v-model="editForm.password_confirm" type="password" placeholder="Confirm your new password" show-password clearable />
        </el-form-item>

        <el-form-item>
          <el-button type="primary" class="reset-password-button" :loading="isLoading" @click="handleSubmit" native-type="submit"> Reset Password </el-button>
        </el-form-item>

        <div class="login-link">Remember your password? <router-link :to="{ name: 'login' }">Log in</router-link></div>
      </el-form>
    </div>
  </div>
</template>

<style lang="scss" scoped>
@use '@/styles/_forgetpassword.scss';
</style>
