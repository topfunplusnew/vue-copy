<template>
  <div class="forgot-password-container">
    <!-- 改进后的 Header -->
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
          <router-link :to="{ name: 'login' }"><el-button class="nav-button">Login</el-button></router-link>
          <router-link :to="{ name: 'signup' }"><el-button class="nav-button">Sign Up</el-button></router-link>
        </div>
      </div>

      <h1 class="header-title">Forgot Password</h1>
    </header>

    <!-- Forgot Password Form -->
    <div class="form-container">
      <form @submit.prevent="handleSubmit">
        <!-- Username -->
        <div class="form-group">
          <label for="username">Username</label>
          <input type="text" id="username" v-model="username" placeholder="Enter your username" required />
        </div>

        <!-- Email -->
        <div class="form-group">
          <label for="email">Email</label>
          <input type="email" id="email" v-model="email" placeholder="Enter your email" required />
        </div>

        <!-- Email Verification Code -->
        <div class="form-group">
          <label for="verificationCode">Email Verification Code</label>
          <div class="captcha-container">
            <input
              type="text"
              id="verificationCode"
              v-model="verificationCode"
              placeholder="Enter the verification code"
              required
            />
            <button type="button" @click="sendVerificationCode">Send Code</button>
          </div>
        </div>

        <!-- New Password -->
        <div class="form-group">
          <label for="newPassword">New Password</label>
          <input
            type="password"
            id="newPassword"
            v-model="newPassword"
            placeholder="Enter your new password"
            required
          />
        </div>

        <!-- Confirm New Password -->
        <div class="form-group">
          <label for="confirmPassword">Confirm New Password</label>
          <input
            type="password"
            id="confirmPassword"
            v-model="confirmPassword"
            placeholder="Confirm your new password"
            required
          />
        </div>

        <!-- Submit Button -->
        <div class="form-group">
          <button type="submit" class="submit-button">Confirm Change</button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

const username = ref('');
const email = ref('');
const verificationCode = ref('');
const newPassword = ref('');
const confirmPassword = ref('');

const handleSubmit = () => {
  // Implement form submission logic
  if (newPassword.value !== confirmPassword.value) {
    alert('Passwords do not match!');
    return;
  }

  // Here you can add the logic to handle password reset (send data to API, etc.)
  alert('Password has been successfully updated!');
};

const sendVerificationCode = () => {
  // Implement email verification code sending logic here
  alert('Verification code sent to your email!');
};
</script>