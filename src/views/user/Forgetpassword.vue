<script setup lang="ts">
import { ref, reactive, computed } from 'vue';
import walletItem from '@/components/wallet-item.vue';
import { ElInput, ElMessage } from 'element-plus';

const msg = 'Reset Your Password';
const errorMessage = ref('');
const successMessage = ref('');
const isLoading = ref(false);
const isVerified = ref(false);

const editForm = reactive({
  email: '',
  username: '',
  password: '',
  password_confirm: '',
});

const passwordStrength = ref(0);
const passwordRequirements = reactive({
  length: false,
  uppercase: false,
  number: false,
  special: false
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
    await new Promise(resolve => setTimeout(resolve, 1000)); // 模拟API调用
    successMessage.value = 'Password reset successfully!';
    errorMessage.value = '';
    ElMessage.success('Password reset email has been sent!');
  } catch (error) {
    errorMessage.value = 'Failed to reset password. Please try again.';
  } finally {
    isLoading.value = false;
  }
};

const sendConfirmationEmail = async () => {
  if (!editForm.email) {
    errorMessage.value = 'Please enter your email address.';
    return;
  }
  
  try {
    // TODO: 实现发送确认邮件的逻辑
    await new Promise(resolve => setTimeout(resolve, 1000)); // 模拟API调用
    ElMessage.success('Confirmation email sent successfully!');
  } catch (error) {
    ElMessage.error('Failed to send confirmation email.');
  }
};
</script>

<template>
  <div class="forget-password-page">
    <header class="header">
      <div class="nav-container">
        <div class="left-nav">
          <router-link :to="{ name: 'home' }"><el-button class="nav-button">HOME</el-button></router-link>
          <router-link :to="{ name: 'about' }"><el-button class="nav-button">ABOUT</el-button></router-link>
          <router-link :to="{ name: 'blog' }"><el-button class="nav-button">BLOG</el-button></router-link>
          <router-link :to="{ name: 'contact' }"><el-button class="nav-button">CONTACT</el-button></router-link>
          <wallet-item />
          <router-link :to="{ name: 'login' }"><el-button class="nav-button">LOGIN</el-button></router-link>
          <router-link :to="{ name: 'signup' }"><el-button class="nav-button">SIGN UP</el-button></router-link>
        </div>
      </div>
    </header>

    <div class="forget-password-hero">
      <h2 class="header-title-forget">{{ msg }}</h2>
      <p class="forget-subtitle">Recover your account access securely</p>
    </div>

    <div class="forget-container" :class="{ success: successMessage }">
      <form @submit.prevent="handleSubmit">
        <h3 class="form-title-forget">Reset Password</h3>
        <p v-if="errorMessage" class="error-message">{{ errorMessage }}</p>
        <div v-if="successMessage" class="success-message">
          <i class="el-icon-success"></i>
          <h3>Password Reset Successful!</h3>
          <p>{{ successMessage }}</p>
        </div>

        <div class="form-group-forget">
          <label for="username">Username</label>
          <input 
            type="text" 
            id="username" 
            v-model="editForm.username" 
            placeholder="Enter your username"
            required 
          />
        </div>

        <div class="form-group-forget">
          <label for="email">Email</label>
          <input 
            type="email" 
            id="email" 
            v-model="editForm.email" 
            placeholder="Enter your email address"
            required 
          />
        </div>

        <button 
          type="button" 
          class="confirm-email-button" 
          @click="sendConfirmationEmail"
          :disabled="!editForm.email"
        >
          Send Confirmation Email
        </button>

        <div class="form-group-forget">
          <label for="password">New Password</label>
          <el-input
            v-model="editForm.password"
            type="password"
            id="password"
            placeholder="Enter your new password"
            show-password
            required
            @input="checkPasswordStrength"
          />
        </div>
        <div class="password-strength-signup">
          <div class="strength-meter-signup">
            <div 
              class="strength-bar-signup" 
              :style="{ width: `${passwordStrength * 25}%` }"
              :class="{
                'weak': passwordStrength === 1,
                'medium': passwordStrength === 2,
                'strong': passwordStrength === 3,
                'very-strong': passwordStrength === 4
              }"
            ></div>
          </div>
          <span class="strength-text-signup" v-if="editForm.password">
            {{ passwordStrength === 0 ? 'Too Weak' : ['Weak', 'Fair', 'Good', 'Strong'][passwordStrength - 1] }}
          </span>
        </div>

        <div class="form-group-forget">
          <label for="password_confirm">Confirm Password</label>
          <el-input
            v-model="editForm.password_confirm"
            type="password" 
            id="password_confirm"
            placeholder="Confirm your new password"
            show-password
            required
          />
        </div>

        <button type="submit" class="reset-password-button" :disabled="isLoading">
          <span v-if="!isLoading">Reset Password</span>
          <span v-else class="loading-spinner"></span>
        </button>

        <div class="login-link">
          Remember your password? <router-link :to="{ name: 'login' }">Log in</router-link>
        </div>
      </form>
    </div>
  </div>
</template>

<style lang="scss" scoped>
@import '@/styles/_forgetpassword.scss';

.password-strength-signup {
  margin-top: 8px;
  margin-left: 155px;
  margin-bottom: 20px;
  width: 76%;
  
  .strength-meter-signup {
    height: 4px;
    background-color: rgba(255, 255, 255, 0.1);
    border-radius: 2px;
    overflow: hidden;
    margin-bottom: 5px;
  }
  
  .strength-bar-signup {
    height: 100%;
    transition: all 0.3s ease;
    
    &.weak {
      background-color: #ff4d4d;
    }
    
    &.medium {
      background-color: #ffaa00;
    }
    
    &.strong {
      background-color: #2ecc71;
    }
    
    &.very-strong {
      background-color: #00ff6a;
    }
  }
  
  .strength-text-signup {
    display: block;
    margin-top: 4px;
    font-size: 14px;
    color: rgba(255, 255, 255, 0.7);
  }
}

@media (max-width: 768px) {
  .password-strength-signup {
    margin-left: 0;
    width: 100%;
  }
}
</style>