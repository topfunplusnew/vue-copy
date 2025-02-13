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
        <h2>Our Official Email</h2>
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

<style scoped>

/* 主体容器，居中排列 */
.contact-container {

  width: 100%;
  max-width: 900px;
  margin: 2rem auto; /* 居中 */
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2rem;
}

/* 官方邮箱展示 */
.official-email {
  margin-top: 50px;
  background: rgba(255, 255, 255, 0.1);
  background-color: rgba(0, 0, 0, 0.5);
  border-radius: 10px;
  box-shadow: 0px 4px 6px rgba(0, 0, 0, 0.3);
  padding: 2rem;
  border-radius: 8px;
  text-align: center;
  width: 100%;
}
.email-display{
  font-size: 3rem;
  font-weight: bold;
  margin: 0.5rem 0;
}

/* 联系表单 */
.contact-form {
  margin-top:22px;
  background: rgba(255, 255, 255, 0.15);
  padding: 2rem;
  border-radius: 8px;
  width: 100%;
  height: 100%;
}

/* 表单字段统一样式 */
.form-field {
  margin-bottom: 1.2rem;
}
.form-field label {
  display: block;
  margin-bottom: 1rem;
  font-size: 1.8rem;
  font-family: 'Courier New', Courier, monospace;
  text-align: left;
  font-weight: bold;
}
.input-box ::v-deep .el-input__inner {
  background: rgba(255, 255, 255, 0.9);
  border: none;
  border-radius: 6px;
  color: #333; /* 深色文字以便填写内容清晰 */
  font-family: 'Courier New', Courier, monospace;
}

/* 提交按钮 */
.submit-button {
  display: inline-block;
  padding: 1rem 2rem;
  font-size: 2.2rem;
  font-weight: bold;
  color: #fff;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  background: linear-gradient(45deg, rgba(255,255,255,0.3), rgba(255,255,255,0.1));
  transition: background 0.3s ease, transform 0.3s ease, box-shadow 0.3s ease;
}
.submit-button:hover {
  background: linear-gradient(45deg, rgba(255,255,255,0.5), rgba(255,255,255,0.3));
  transform: scale(1.05);
  box-shadow: 0 4px 6px rgba(0,0,0,0.2);
}
</style>
