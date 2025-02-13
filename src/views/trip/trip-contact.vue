<script setup lang="ts">
import { ref } from 'vue';
import walletItem from '@/components/wallet-item.vue';

/** 页面标题，可在此修改 */
const msg= 'Contact Us';

/** 简易表单数据 */
const contactForm = ref({
  name: '',
  email: '',
  message: ''
});

/** 提交表单 */
function submitContact() {
  // 在这里处理提交逻辑，如发送邮件或请求后端API
  alert(`Thanks, ${contactForm.value.name}! Your message has been sent.`);
  // 提交后清空
  contactForm.value = {
    name: '',
    email: '',
    message: ''
  };
}
</script>

<template>
  <div class="home">
    <!-- Header -->
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

    <!-- 联系方式和表单主体区域 -->
    <main class="contact-container">
      <!-- 官方邮箱 -->
      <section class="official-email">
        <h1>Our Official Email</h1>
        <p class="email-display">ipologo.os@gmail.com</p>
      </section>

      <!-- 联系表单 -->
      <section class="contact-form">
        <h2 class='send-u-msg'>Send Us a Message</h2>

        <div class="form-field">
          <label for="name">Name</label>
          <el-input
            id="name"
            v-model="contactForm.name"
            placeholder="Your Name"
            clearable
            class="input-box"
          />
        </div>

        <div class="form-field">
          <label for="email">Email</label>
          <el-input
            id="email"
            v-model="contactForm.email"
            placeholder="Your Email"
            clearable
            class="input-box"
          />
        </div>

        <div class="form-field">
          <label for="message">Message</label>
          <el-input
            type="textarea"
            id="message"
            v-model="contactForm.message"
            placeholder="Your Message"
            :rows="3"
            class="input-box"
          />
        </div>
        <button class="submit-button" @click="submitContact">Send</button>
      </section>
    </main>
  </div>
</template>


