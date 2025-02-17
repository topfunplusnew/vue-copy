<script setup lang="ts">
import walletItem from '@/components/wallet-item.vue';
import { ref } from 'vue';
import { useRouter } from 'vue-router';

// 响应式数据
const postText = ref('');
const postTitle = ref('');
const selectedReplyOption = ref<string>('everyone');
const images = ref<{ url: string }[]>([]);
const tagInput = ref('');
const tags = ref<string[]>([]);
const router = useRouter();

const preferenceOptions = ref([
  { name: 'Sightseeing', icon: '🌆' },
  { name: 'Educational', icon: '🎓' },
  { name: 'Business', icon: '💼' },
  { name: 'Medical', icon: '🏥' },
  { name: 'Gastronomy', icon: '🍴' },
  { name: 'Culture', icon: '🎭' },
]);

// 添加 NFT 选项的状态
const mintNFT = ref(false);

// 添加选中偏好的响应式数据
const selectedOptions = ref<string[]>([]);

// 添加切换偏好的方法
const togglePreference = (optionName: string) => {
  const index = selectedOptions.value.indexOf(optionName);
  if (index === -1) {
    selectedOptions.value.push(optionName);
  } else {
    selectedOptions.value.splice(index, 1);
  }
};

// 图片处理相关函数
const handleImageUpload = (event: Event) => {
  const files = (event.target as HTMLInputElement).files;
  if (!files) return;

  const filesArray = Array.from(files);
  if (images.value.length + filesArray.length > 9) {
    alert("You can upload a maximum of 9 images.");
    return;
  }

  filesArray.forEach(file => {
    const reader = new FileReader();
    reader.onload = (e) => {
      if (typeof e.target?.result === 'string') {
        images.value.push({ url: e.target.result });
      }
    };
    reader.readAsDataURL(file);
  });
};

const removeImage = (index: number) => {
  images.value.splice(index, 1);
};

// 修改：标签处理函数
const handleTagInput = (event: KeyboardEvent) => {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault();
    const value = tagInput.value.trim();
    
    // 如果输入为空则返回
    if (!value) return;

    // 自动添加#号
    const tagWithHash = value.startsWith('#') ? value : `#${value}`;
    
    // 检查标签长度（不包括#号）
    if (value.length > 15) {
      alert('Tag length should not exceed 15 characters');
      return;
    }
    // 检查标签数量限制
    if (tags.value.length >= 5) {
      alert('Maximum 5 tags allowed');
      return;
    }
    // 检查标签是否重复（考虑带#和不带#的情况）
    if (!tags.value.some(tag => tag.slice(1) === value || tag === tagWithHash)) {
      tags.value.push(tagWithHash);
      tagInput.value = ''; // 清空输入
    } else {
      alert('This tag already exists');
    }
  }
};

// 新增：删除标签函数
const removeTag = (index: number) => {
  tags.value.splice(index, 1);
};

// 发布相关函数
const saveDraft = () => {
  console.log('Draft Saved:', postText.value);
};

const selectReplyOption = (option: string) => {
  selectedReplyOption.value = option;
};

const postTweet = () => {
  if (postText.value.trim()) {
    console.log('Post Published:', {
      title: postTitle.value,
      content: postText.value,
      replyOption: selectedReplyOption.value,
      images: images.value,
      mintAsNFT: mintNFT.value,
      tags: tags.value,
      preferences: selectedOptions.value
    });
    router.push({ name: 'HomePage' });
  } else {
    alert('Please write something before posting.');
  }
};
</script>

<template>
  <div class="home">
    <!-- 导航栏 -->
    <header class="header">
      <div class="nav-container">
        <!-- 左侧导航 -->
        <div class="left-nav">
          <router-link v-for="item in ['home', 'about', 'blog', 'contact']" 
                      :key="item" 
                      :to="{ name: item }">
            <el-button class="nav-button">{{ item.toUpperCase() }}</el-button>
          </router-link>
        </div>

        <!-- 右侧导航 -->
        <div class="right-nav">
          <wallet-item />
          <router-link v-for="item in ['login', 'signup', 'userpage']" 
                      :key="item" 
                      :to="{ name: item }">
            <el-button class="nav-button">
              {{ item === 'userpage' ? 'User Page' : item.toUpperCase() }}
            </el-button>
          </router-link>
        </div>
      </div>
    </header>

    <!-- 主要内容区域 -->
    <div class="post-container">
      <!-- 标题区域 -->
      <div class="header-container">
        <h2 class="posttext">Share your happiness！</h2>
      </div>

      <!-- 编辑区域 -->
      <div class="title-container">
        <textarea 
          v-model="postTitle"
          class="title-editor" 
          placeholder="What is the title?..."
          maxlength="50"
        ></textarea>
        <span v-if="postTitle" class="title-count">
          {{ postTitle.length }}/50
        </span>
      </div>


        <!-- 旅游偏好  -->
        <div class="postprefer-options">
          <span
            v-for="option in preferenceOptions"
            :key="option.name"
            class="postprefer-option"
            :class="{ 'postprefer-selected': selectedOptions.includes(option.name) }"
            @click="togglePreference(option.name)"
          >
            <span class="postprefer-icon">{{ option.icon }}</span>
            <span class="postprefer-name">{{ option.name }}</span>
          </span>
        </div>


      <textarea 
        v-model="postText" 
        class="text-editor" 
        placeholder="What's happening?"
      ></textarea>

      <!-- 图片预览和上传部分 -->
      <div class="image-upload">
        <!-- 图片预览区域 -->
        <div v-if="images.length > 0" class="image-preview-container">
          <div v-for="(image, index) in images" 
               :key="index"
               class="image-preview">
            <img :src="image.url" alt="Uploaded Image" />
            <button class="remove-btn" @click="removeImage(index)">✖</button>
          </div>
        </div>

        <!-- 图片上传区域 -->
        <label class="upload-container">
          Choose your image
          <input 
            type="file" 
            @change="handleImageUpload" 
            accept="image/*" 
            multiple
          />
        </label>

        <!-- 上传限制提示 -->
        <p v-if="images.length >= 9" class="limit-message">
          Maximum 9 images allowed.
        </p>
      </div>

      <!-- 修改：标签输入区域 -->
      <div class="tags-section">
        <div class="tags-container">
          <div v-for="(tag, index) in tags" 
               :key="index" 
               class="tag">
            {{ tag }}
            <span class="tag-remove" @click="removeTag(index)" title="Remove tag">×</span>
          </div>
        </div>
        <div class="tag-input-container">
          <textarea 
            v-model="tagInput"
            class="tag-editor"
            placeholder="Add tag name..."
            @keydown="handleTagInput"
            maxlength="15"
          ></textarea>
          <span class="tag-count" v-if="tags.length > 0">
            {{ tags.length }}/5 tags
          </span>
        </div>
      </div>

      <!-- 回复权限选择 -->
      <div class="reply-options">
        <span class="reply-label">Who can reply?</span>
        <button v-for="option in ['Everyone', 'Followers', 'Only me']"
                :key="option"
                class="option-button"
                :class="{ selected: selectedReplyOption === option }"
                @click="selectReplyOption(option)">
          {{ option }} can reply
        </button>
      </div>

      <!-- 添加 NFT 选项 -->
      <div class="nft-option">
        <label class="nft-checkbox-label">
          <input 
            type="checkbox" 
            v-model="mintNFT"
            class="nft-checkbox"
          >
          <span class="checkbox-custom"></span>
          <span class="label-text">Minting NFTs</span>
        </label>
      </div>

      <!-- 操作按钮 -->
      <div class="action-buttons">
        <button @click="saveDraft" class="save-draft">Save Draft</button>
        <button @click="postTweet" class="post-button">Post</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.posttext {
  font-size: 40px;
  font-weight: bold;
  text-align: center;
  color: #ffffff;
  margin-bottom: 10px;
}
</style>

