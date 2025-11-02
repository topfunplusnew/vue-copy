<script setup lang="ts">
import { ref, reactive } from 'vue';
import { ElInput, ElMessage, ElForm, ElFormItem, ElButton, type FormInstance, type FormRules } from 'element-plus';
import commonHeader from '@/layout/common-header.vue';

const msg = 'Reset Your Password';
const errorMessage = ref('');
const successMessage = ref('');
const isLoading = ref(false);
const formRef = ref<FormInstance>();

const form = reactive({
  email: '',
  code: '',
});

const rules: FormRules = {
  email: [
    { required: true, message: 'Please enter your email address', trigger: 'blur' },
    { type: 'email', message: 'Please enter a valid email address', trigger: 'blur' },
  ],
  code: [{ required: true, message: 'Please enter the verification code', trigger: 'blur' }],
};

const handleSubmit = async () => {
  if (!formRef.value) return;

  try {
    const valid = await formRef.value.validate().catch(() => false);
    if (!valid) {
      errorMessage.value = 'Please fill in all the fields correctly.';
      return;
    }

    isLoading.value = true;
    errorMessage.value = '';

    // 模拟API调用
    await new Promise((resolve) => setTimeout(resolve, 1000));
    successMessage.value = 'Verification code sent successfully!';
    ElMessage.success('Password reset email has been sent!');
  } catch {
    errorMessage.value = 'Failed to send verification code. Please try again.';
  } finally {
    isLoading.value = false;
  }
};

const sendCode = async () => {
  if (!form.email) {
    errorMessage.value = 'Please enter your email address.';
    return;
  }

  // 验证邮箱格式
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(form.email)) {
    errorMessage.value = 'Please enter a valid email address.';
    return;
  }

  try {
    errorMessage.value = '';
    // 模拟发送验证码
    await new Promise((resolve) => setTimeout(resolve, 1000));
    ElMessage.success('Verification code sent successfully!');
  } catch {
    ElMessage.error('Failed to send verification code.');
    errorMessage.value = 'Failed to send verification code.';
  }
};
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

        <el-form-item label="Verification Code" prop="code" class="form-group-reset">
          <div class="code-input-wrapper">
            <el-input type="text" v-model="form.code" placeholder="Enter verification code" clearable />
            <el-button type="default" class="send-code-button" @click="sendCode" :disabled="!form.email || isLoading"> Send Code </el-button>
          </div>
        </el-form-item>

        <el-form-item>
          <el-button type="primary" class="reset-button" :loading="isLoading" @click="handleSubmit" native-type="submit"> Submit </el-button>
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
