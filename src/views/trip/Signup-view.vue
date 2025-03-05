<script setup lang="ts">
import { ref, reactive } from 'vue';
import walletItem from '@/components/wallet-item.vue';
import Captcha from '@/components/Captcha.vue';
import { userSignup } from '@/services/api';
import { useRouter } from 'vue-router';
import { ElInput } from 'element-plus';

const msg = 'Start Your Journey in iPoloGO';
const router = useRouter();

const errorMessage = ref('');
const isVerified = ref(false);
const isLoading = ref(false);
const signupSuccess = ref(false);

const editForm = reactive({
  email: '',
  password: '',
  password_confirm: '',
  name: '',
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
    let missingRequirements = [];
    if (!passwordRequirements.length) missingRequirements.push('at least 8 characters');
    if (!passwordRequirements.uppercase) missingRequirements.push('uppercase letter');
    if (!passwordRequirements.number) missingRequirements.push('number');
    if (!passwordRequirements.special) missingRequirements.push('special character');
    
    errorMessage.value = `Password is too weak. Please include: ${missingRequirements.join(', ')}`;
    return;
  }

  isLoading.value = true;
  errorMessage.value = '';
  
  try {
    await userSignup({
      email: editForm.email,
      password: editForm.password,
      password_confirm: editForm.password_confirm,
      name: editForm.name,
    });
    
    signupSuccess.value = true;
    setTimeout(() => {
      router.push({ name: 'login' });
    }, 2000);
  } catch (error) {
    console.error(error);
    if (error.response && error.response.data && error.response.data.message) {
      errorMessage.value = `Registration failed: ${error.response.data.message}`;
    } else {
      errorMessage.value = 'Registration failed. Please try again.';
    }
  } finally {
    isLoading.value = false;
  }
};
</script>

<template>
  <div class="signup-page">
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

    <div class="signup-hero">
      <h2 class="header-title-signup">{{ msg }}</h2>
      <p class="signup-subtitle">Join our community and start exploring the world</p>
    </div>

    <div class="signup-container" :class="{ 'success': signupSuccess }">
      <div v-if="signupSuccess" class="success-message">
        <i class="el-icon-check-circle"></i>
        <h3>Registration Successful!</h3>
        <p>Redirecting to login page...</p>
      </div>
      
      <form @submit.prevent="handleSubmit" v-else>
        <h3 class="form-title-signup">Create Your Account</h3>
        <p v-if="errorMessage" class="error-message">{{ errorMessage }}</p>

        <div class="form-group-signup">
          <label for="username">Username</label>
          <input type="text" id="username" v-model="editForm.name" placeholder="How should we call you?" />
        </div>

        <div class="form-group-signup">
          <label for="email">Email</label>
          <input type="email" id="email" v-model="editForm.email" placeholder="example@domain.com" required />
        </div>

        <div class="form-group-signup">
          <label for="password">Password</label>
          <el-input
            v-model="editForm.password"
            id="password"
            type="password"
            placeholder="Min 8 characters with letters, numbers & symbols"
            show-password
            @input="checkPasswordStrength"
            required
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
            {{ ['Weak', 'Fair', 'Good', 'Strong'][passwordStrength - 1] || 'Too Weak' }}
          </span>
          <div class="password-requirements" v-if="editForm.password">
        </div>

        <div class="form-group-signup">
          <label for="confirmPassword">Confirm Password</label>
          <el-input
            v-model="editForm.password_confirm"
            id="confirmPassword"
            type="password"
            placeholder="Re-enter password"
            show-password
            required
          />
        </div>

        <div class="captcha-container">
          <div class="captcha-item">
            <label for="captcha" class="captcha-label">Verify your identity</label>
            <Captcha @success="isVerified = true" id="captcha" />
          </div>
        </div>

        <button type="submit" class="signup-button" :disabled="isLoading">
          <span v-if="!isLoading">Sign Up</span>
          <span v-else class="loading-spinner"></span>
        </button>
        
        <div class="login-link">
          Already have an account? <router-link :to="{ name: 'login' }">Log in</router-link>
        </div>
      </form>
    </div>
  </div>
</template>


