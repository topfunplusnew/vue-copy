<script setup lang="ts">
import walletItem from '@/components/wallet-item.vue';
import { ref } from 'vue';
import { useRouter } from 'vue-router';

// 保存草稿功能
const saveDraft = () => {
  // 保存草稿的逻辑
  console.log('Draft Saved:', postText.value);
};

// 选择回复权限
const selectReplyOption = (option: string) => {
  selectedReplyOption.value = option;
};

// 发布推文
const postTweet = () => {
  if (postText.value.trim()) {
    console.log('Post Published:', postText.value, selectedReplyOption.value);
    // 这里可以添加实际发布推文的逻辑
    router.push({ name: 'HomePage' }); // 跳转到首页或其他页面
  } else {
    alert('Please write something before posting.');
  }
};

// 处理图片上传
const handleImageUpload = (event: Event) => {
  const file = (event.target as HTMLInputElement).files?.[0];
  if (file) {
    console.log('Image Uploaded:', file.name);
    // 处理图片上传逻辑
  }
};

const postText = ref('');
const selectedReplyOption = ref<string>('everyone');
const router = useRouter();

</script>


<template>
    <div class="home">
      <!-- Header 区域（保持原有设计） -->
      <header class="header">
        <div class="nav-container">
          <div class="left-nav">
            <router-link :to="{ name: 'home' }">
              <el-button class="nav-button">HOME</el-button>
            </router-link>
            <router-link :to="{ name: 'about' }">
              <el-button class="nav-button">ABOUT</el-button>
            </router-link>
            <router-link :to="{ name: 'blog' }">
              <el-button class="nav-button">BLOG</el-button>
            </router-link>
            <router-link :to="{ name: 'contact' }">
              <el-button class="nav-button">CONTACT</el-button>
            </router-link>
          </div>
          <div class="right-nav">
            <wallet-item />
            <router-link :to="{ name: 'login' }">
              <el-button class="nav-button">LOGIN</el-button>
            </router-link>
            <router-link :to="{ name: 'signup' }">
              <el-button class="nav-button">SIGN UP</el-button>
            </router-link>
            <router-link :to="{ name: 'userpage' }">
              <el-button class="nav-button">User Page</el-button>
            </router-link>
          </div>
        </div>
      </header>


    <div class="post-container">
    <div class="header-container">
        <h2 class="posttext">Share your happiness！</h2> <!-- 新增的文本 -->
    </div>

    <!-- 文本编辑框 -->
    <textarea v-model="postText" class="text-editor" placeholder="What's happening?"></textarea>

    <!-- 图片上传 -->
    <div class="image-upload">
      <input type="file" @change="handleImageUpload" />
    </div>

    <!-- 谁可以回复的选项 -->
    <div class="reply-options">
        <span class="reply-label">Who can reply?</span> <!-- 说明文本 -->
    
      <button
        class="option-button"
        :class="{ selected: selectedReplyOption === 'everyone' }"
        @click="selectReplyOption('everyone')"
      >
        Everyone can reply
      </button>
      <button
        class="option-button"
        :class="{ selected: selectedReplyOption === 'followers' }"
        @click="selectReplyOption('followers')"
      >
        Followers can reply
      </button>
      <button
        class="option-button"
        :class="{ selected: selectedReplyOption === 'onlyMe' }"
        @click="selectReplyOption('onlyMe')"
      >
        Only me can reply
      </button>
    </div>
    

    <!-- 发布按钮 -->
    <div class="action-buttons">
      <button @click="saveDraft" class="save-draft">Save Draft</button>
      <button @click="postTweet" class="post-button">Post</button>
    </div>
  </div>
</div>
</template>

<style scoped>
.posttext {
  font-size: 40px; /* 设置更大的字体 */
  font-weight: bold;
  text-align: center;
  color: #ffffff; /* 设置文本颜色 */
  margin-bottom: 10px; /* 增加下方的间距，可以根据需要调整 */
}

</style>