<script setup lang="ts">
import walletItem from '@/components/wallet-item.vue';
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import PostPreview from '@/views/trip/PostPreview.vue';
import { blogPost, Postimage } from '@/services/api';
import type { IBlogPostCreate, IBlogPostimage } from '@/types/blog';
import { Plus } from '@element-plus/icons-vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Auth } from '@/services/auth';
import UserPage from '../user/userpage.vue';

// 响应式数据
const postText = ref('');
const postTitle = ref('');
const selectedReplyOption = ref<string>('everyone');
const images = ref<{ url: string; src: string }[]>([]);
const tagInput = ref('');
const tags = ref<string[]>([]);
const router = useRouter();
const showPreview = ref(false);
const auth = new Auth();

const preferenceOptions = ref([
  { name: 'Sightseeing', icon: '🌆' },
  { name: 'Educational', icon: '🎓' },
  { name: 'Business', icon: '💼' },
  { name: 'Medical', icon: '🏥' },
  { name: 'Cuisine', icon: '🍴' },
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

// 检查登录状态
const checkLogin = () => {
  return !!auth.get(); // 返回 true 如果有 token
};

// 显示登录确认弹窗
const showLoginConfirm = () => {
  return ElMessageBox.confirm('You need to login first to post a blog. Would you like to login now?', 'Login Required', {
    confirmButtonText: 'Go to Login',
    cancelButtonText: 'Cancel',
    type: 'warning',
  });
};

// 修改预览按钮点击处理
const handlePreviewClick = () => {
  if (!postTitle.value.trim()) {
    ElMessageBox.alert('Please enter a title for your post', 'Title Required', {
      confirmButtonText: 'OK',
      type: 'warning',
      center: true,
    });
    return;
  }

  if (!postText.value.trim()) {
    ElMessageBox.alert('Please add some content to your post', 'Content Required', {
      confirmButtonText: 'OK',
      type: 'warning',
      center: true,
    });
    return;
  }

  if (images.value.length === 0) {
    ElMessageBox.alert('Please upload at least one image', 'Image Required', {
      confirmButtonText: 'OK',
      type: 'warning',
      center: true,
    });
    return;
  }

  showPreview.value = true;
};

// 修改图片上传处理
const handleImageUpload = async (file: any) => {
  if (!checkLogin()) {
    try {
      await showLoginConfirm();
      router.push({ name: 'login' });
    } catch {
      return;
    }
    return;
  }

  if (images.value.length >= 9) {
    ElMessage({
      message: 'Maximum 9 images allowed',
      type: 'warning',
      duration: 2000,
    });
    return;
  }

  try {
    const formData = new FormData();
    formData.append('files', file.raw);

    const response = await Postimage({ image: formData });
    if (response.data && response.data.success) {
      const arr = response.data.success as string[];
      for (const url of arr) {
        images.value.push({
          src: `${import.meta.env.IPG_IMAGE_URL}/${url}`,
          url,
        });
      }
      ElMessage({
        message: 'Image uploaded successfully',
        type: 'success',
        duration: 2000,
      });
    }
  } catch (error: any) {
    if (error.response?.status === 401) {
      ElMessage({
        message: 'Please login first',
        type: 'error',
        duration: 2000,
      });
      router.push({ name: 'login' });
      return;
    }
    ElMessage({
      message: 'Failed to upload image',
      type: 'error',
      duration: 2000,
    });
  }
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
      ElMessage.warning('Tag length should not exceed 15 characters');
      return;
    }
    // 检查标签数量限制
    if (tags.value.length >= 5) {
      ElMessage.warning('Maximum 5 tags allowed');
      return;
    }
    // 检查标签是否重复（考虑带#和不带#的情况）
    if (!tags.value.some((tag) => tag.slice(1) === value || tag === tagWithHash)) {
      tags.value.push(tagWithHash);
      tagInput.value = ''; // 清空输入
    } else {
      ElMessage.warning('This tag already exists');
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

// 修改发布博客处理
const postTweet = async () => {
  if (!postTitle.value || !postText.value) {
    ElMessage.warning('Please add title and content');
    return;
  }

  try {
    // 添加发布确认弹窗
    await ElMessageBox.confirm('Are you sure you want to publish this blog?', 'Confirm Publication', {
      confirmButtonText: 'Publish',
      cancelButtonText: 'Continue Editing',
      type: 'info',
    });

    const postData: IBlogPostCreate = {
      title: postTitle.value,
      content: postText.value,
      image: images.value.map((img) => img.url),
      tags: tags.value,
      preferences: selectedOptions.value,
      isNFT: mintNFT.value,
    };

    await blogPost(postData);
    ElMessage.success('Blog posted successfully');
    router.push({ name: 'userpage' });
  } catch (error: any) {
    if (error.message === 'cancel') {
      // 用户选择继续编辑
      return;
    }
    if (error.response?.status === 401) {
      ElMessage.error('Session expired, please login again');
      router.push({ name: 'login' });
      return;
    }
    ElMessage.error('Failed to post blog');
  }
};

// 添加计算属性来判断是否可以预览
const canPreview = computed(() => {
  return postTitle.value.trim() !== '' && images.value.length > 0;
});

// 修改预览函数
const previewPost = () => {
  if (canPreview.value) {
    showPreview.value = true;
  }
};

// 添加关闭预览的函数
const closePreview = () => {
  showPreview.value = false;
};

// 修改标签添加处理
const addTag = () => {
  if (tags.value.length >= 5) {
    ElMessage.warning('Maximum 5 tags allowed');
    return;
  }
  // ... 其他标签添加逻辑
};
</script>

<template>
  <div class="home">
    <!-- 导航栏 -->
    <header class="header">
      <div class="nav-container">
        <!-- 左侧导航 -->
        <div class="left-nav">
          <router-link v-for="item in ['home', 'about', 'blog', 'contact']" :key="item" :to="{ name: item }">
            <el-button class="nav-button">{{ item.toUpperCase() }}</el-button>
          </router-link>
        </div>

        <!-- 右侧导航 -->
        <div class="right-nav">
          <wallet-item />
          <router-link v-for="item in ['login', 'signup', 'userpage']" :key="item" :to="{ name: item }">
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
        <button @click="handlePreviewClick" class="preview-button" :disabled="!canPreview" :class="{ 'preview-button-disabled': !canPreview }">Preview</button>
      </div>

      <!-- 编辑区域 -->
      <div class="title-container">
        <textarea v-model="postTitle" class="title-editor" placeholder="Title" maxlength="50"></textarea>
        <span v-if="postTitle" class="title-count"> {{ postTitle.length }}/50 </span>
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

      <textarea v-model="postText" class="text-editor" placeholder="What's happening?"></textarea>

      <!-- 图片上传部分 -->
      <div class="image-upload">
        <div class="upload-text">Add photos (up to 9)</div>
        <el-upload class="upload-container" :show-file-list="false" :on-change="handleImageUpload" :auto-upload="false" :multiple="true" accept="image/*">
          <template #trigger>
            <el-button type="primary">
              <el-icon><Plus /></el-icon>
              Select Images
            </el-button>
          </template>
        </el-upload>

        <!-- 图片预览部分 -->
        <div class="image-preview-container" v-if="images.length">
          <div v-for="(image, index) in images" :key="index" class="image-preview">
            <img :src="image.src" :alt="`Preview ${index + 1}`" />
            <button class="remove-image" @click="removeImage(index)">×</button>
          </div>
        </div>
      </div>

      <!-- 修改：标签输入区域 -->
      <div class="tags-section">
        <div class="tags-container">
          <div v-for="(tag, index) in tags" :key="index" class="tag">
            {{ tag }}
            <span class="tag-remove" @click="removeTag(index)" title="Remove tag">×</span>
          </div>
        </div>
        <div class="tag-input-container">
          <textarea v-model="tagInput" class="tag-editor" placeholder="Add tag" @keydown="handleTagInput" maxlength="15"></textarea>
          <span class="tag-count" v-if="tags.length > 0"> {{ tags.length }}/5 tags </span>
        </div>
      </div>

      <!-- 回复权限选择 -->
      <div class="reply-options">
        <span class="reply-label">Who can reply?</span>
        <button v-for="option in ['Everyone', 'Followers', 'Only me']" :key="option" class="option-button" :class="{ selected: selectedReplyOption === option }" @click="selectReplyOption(option)">
          {{ option }} can reply
        </button>
      </div>

      <!-- 添加 NFT 选项 -->
      <div class="nft-option">
        <label class="nft-checkbox-label">
          <input type="checkbox" v-model="mintNFT" class="nft-checkbox" />
          <span class="checkbox-custom"></span>
          <span class="nft-label-text">Make your NFT</span>
        </label>
      </div>

      <!-- 操作按钮 -->
      <div class="action-buttons">
        <button @click="saveDraft" class="save-draft">Save Draft</button>
        <button @click="postTweet" class="post-button">Post</button>
      </div>
    </div>

    <!-- 添加 PostPreview 组件 -->
    <PostPreview v-if="showPreview" :title="postTitle" :content="postText" :images="images" :tags="tags" :preferences="selectedOptions" @close="closePreview" />
  </div>
</template>

<style lang="scss">
@import '@/styles/_post.scss';

// 可以添加自定义样式
.custom-message-box {
  .el-message-box__header {
    padding-top: 20px;
  }
  
  .el-message-box__content {
    padding: 20px;
    font-size: 16px;
  }

  .el-message-box__btns {
    padding: 10px 20px 20px;
  }
}
</style>
