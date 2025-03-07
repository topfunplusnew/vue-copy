<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useUserStore } from '@/stores/user';
import walletItem from '@/components/wallet-item.vue';
import { ElMessage } from 'element-plus';
import { getImageUrl } from '@/utils';
import { auth } from '@/services/http';

/** 页面标题，可在此修改 */
const msg= 'Contact Us';

// 初始化router和userStore
const router = useRouter();
const userStore = useUserStore();

// 处理登录点击
const handleLoginClick = () => {
  router.push({ name: 'login' });
};

// 页面加载时获取用户信息（如果已登录）
onMounted(() => {
  if (auth.get() && !userStore.user) {
    userStore.getUserInfo();
  }
});

/** 简易表单数据 */
const contactForm = ref({
  name: '',
  email: '',
  message: ''
});

const isSubmitting = ref(false);
const formSubmitted = ref(false);

/** 提交表单 */
function submitContact() {
  // 表单验证
  if (!contactForm.value.name || !contactForm.value.email || !contactForm.value.message) {
    ElMessage({
      message: 'Please fill in all fields',
      type: 'warning'
    });
    return;
  }
  
  // 简单的邮箱验证
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(contactForm.value.email)) {
    ElMessage({
      message: 'Please enter a valid email address',
      type: 'warning'
    });
    return;
  }
  
  isSubmitting.value = true;
  
  // 在这里处理提交逻辑，如发送邮件或请求后端API
  // 模拟API请求
  setTimeout(() => {
    ElMessage({
      message: `Thanks, ${contactForm.value.name}! Your message has been sent.`,
      type: 'success'
    });
    
    // 提交后清空
    contactForm.value = {
      name: '',
      email: '',
      message: ''
    };
    
    formSubmitted.value = true;
    isSubmitting.value = false;
    
    // 3秒后重置表单状态
    setTimeout(() => {
      formSubmitted.value = false;
    }, 3000);
  }, 1500);
}

// 前往个人主页
const goToUserProfile = () => {
  router.push({ name: 'userpage' });
};

// 处理下拉菜单命令
const handleCommand = (command) => {
  if (command === 'profile') {
    router.push({ name: 'userpage' });
  } else if (command === 'logout') {
    userStore.logout();
    ElMessage.success('Logged out successfully');
    router.push({ path: '/' });
  }
};

</script>

<template>
  <div class="background-layer"></div>
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
          <walletItem />
          <!-- 未登录状态显示登录和注册按钮 -->
          <template v-if="!userStore.user">
            <el-button class="nav-button" @click="handleLoginClick">LOGIN</el-button>
            <router-link :to="{ name: 'signup' }">
              <el-button class="nav-button">SIGN UP</el-button>
            </router-link>
          </template>
          
          <!-- 已登录状态显示用户头像和下拉菜单 -->
          <div v-else class="user-profile-nav">
            <div class="home-avatar-container" @click="goToUserProfile">
              <img 
                :src="getImageUrl(userStore.user.avatar || '')" 
                alt="User Avatar" 
                class="home-new-user-avatar"
              />
              <span class="home-new-username">{{ userStore.user.name }}</span>
            </div>
            <el-dropdown trigger="click" @command="handleCommand">
              <span class="el-dropdown-link">
                <i class="el-icon-arrow-down"></i>
              </span>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="profile">My Profile</el-dropdown-item>
                  <el-dropdown-item command="logout">Logout</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>
        </div>
      </div>
    </header>

    <!-- 页面标题 -->
    <div class="contact-hero">
      <h1 class="contact-title">{{ msg }}</h1>
      <p class="contact-subtitle">We'd love to hear from you</p>
    </div>

    <!-- 联系方式和表单主体区域 -->
    <main class="contact-container">
      <div class="contact-content">
        <!-- 左侧：联系信息 -->
        <section class="contact-info">
          <div class="info-card official-email">
            <h2>Our Email</h2>
            <p class="email-display">ipologo.os@gmail.com</p>
          </div>
          
          <div class="info-card">
            <h2>Follow Us</h2>
            <div class="social-links">
              <a href="#" class="social-link">
                <i class="el-icon-s-platform"></i>
              </a>
              <a href="#" class="social-link">
                <i class="el-icon-s-promotion"></i>
              </a>
              <a href="#" class="social-link">
                <i class="el-icon-s-marketing"></i>
              </a>
              <a href="#" class="social-link">
                <i class="el-icon-s-cooperation"></i>
              </a>
            </div>
          </div>
        </section>

        <!-- 右侧：联系表单 -->
        <section class="contact-form-section">
          <div class="contact-form-contact" :class="{ 'submitted': formSubmitted }">
            <h2 class='form-title-contact'>Send Us a Message</h2>
            
            <div v-if="formSubmitted" class="success-message-contact">
              <i class="el-icon-check-circle"></i>
              <h3>Message Sent!</h3>
              <p>We'll get back to you soon.</p>
            </div>
            
            <form v-else @submit.prevent="submitContact">
              <div class="form-field-contact">
                <label for="name">Name</label>
                <el-input
                  id="name"
                  v-model="contactForm.name"
                  placeholder="Your Name"
                  clearable
                  class="input-box-contact"
                />
              </div>

              <div class="form-field-contact">
                <label for="email">Email</label>
                <el-input
                  id="email"
                  v-model="contactForm.email"
                  placeholder="Your Email"
                  clearable
                  class="input-box-contact"
                />
              </div>

              <div class="form-field-contact">
                <label for="message">Message</label>
                <el-input
                  type="textarea"
                  id="message"
                  v-model="contactForm.message"
                  placeholder="Your Message"
                  :rows="6"
                  class="input-box-contact"
                />
              </div>
              
              <button type="submit" class="submit-button-contact" :disabled="isSubmitting">
                <span v-if="!isSubmitting">Send Message</span>
                <span v-else class="loading-spinner-contact"></span>
              </button>
            </form>
          </div>
        </section>
      </div>
    </main>
  </div>
</template>


