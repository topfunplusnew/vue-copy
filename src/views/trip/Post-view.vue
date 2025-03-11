<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import PostPreview from '@/views/trip/PostPreview.vue';
import { Plus } from '@element-plus/icons-vue';
import { ElMessage, ElMessageBox, type UploadFile } from 'element-plus';
import { Auth } from '@/services/auth';
import { useBlogStore } from '@/stores/blog';
import commonHeader from '@/layout/common-header.vue';
import { getImageUrl } from '@/utils';



const props = defineProps({
  id: {
    type: Number,
  },
});
console.log(props.id);

const store = useBlogStore();

const socialFilters = computed(() => store.socialFilters); // 社会过滤器
const createData = computed(() => store.createData); // 创建数据
const commentPermission = computed(() => store.commentPermission); // 评论权限

// 响应式数据
const postText = ref('');
const postTitle = ref('');
const images = ref<{ url: string; src: string }[]>([]);
const tagInput = ref('');
const tags = ref<string[]>([]);
const router = useRouter();
const showPreview = ref(false);
const auth = new Auth();



// 添加选中偏好的响应式数据

// 添加切换偏好的方法
const togglePreference = (id: number) => {
  console.log(createData.value.social_filters, id,createData.value.social_filters.indexOf(id));
  const index = createData.value.social_filters.indexOf(id);
  if (index === -1) {
    createData.value.social_filters.push(id);
  } else {
    createData.value.social_filters.splice(index, 1);
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
const handleImageUpload = async (file: UploadFile) => {
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
  store.userPostimage(file).then(() =>{
    ElMessage({
      message: 'Image uploaded successfully',
      type: 'success',
      duration: 2000,
    });
  }).catch(error =>{
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
  })
};

const removeImage = (index: number) => {
  images.value.splice(index, 1);
};

// 修改：标签处理函数
const handleTagInput = (evt: Event|KeyboardEvent) => {
  const event = evt as KeyboardEvent;
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

// const selectReplyOption = (option: number) => {
//   createData.value.comment_permission = option;
// };

// 修改发布博客处理
const postTweet = async () => {
  if (!createData.value.title || !createData.value.content) {
    ElMessage.warning('Please add title and content');
    return;
  }
  ElMessageBox.confirm('Are you sure you want to publish this blog?', 'Confirm Publication', {
    confirmButtonText: 'Publish',
    cancelButtonText: 'Continue Editing',
    type: 'info',
  }).then(() =>{
    createData.value.tags = tags.value;
    store.userPostblog().then(() =>{
      ElMessage.success('Blog posted successfully');
      router.push({ name: 'userpage' });
    }).catch(error =>{
      if (error.response?.status === 401) {
        ElMessage.error('Session expired, please login again');
        router.push({ name: 'login' });
      }
      ElMessage.error('Failed to post blog');
    });
  });
};

// 添加计算属性来判断是否可以预览
const canPreview = computed(() => {
  return postTitle.value.trim() !== '' && images.value.length > 0;
});

// 修改预览函数

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

// 添加导航菜单状态管理

// 切换菜单显示

onMounted(async () => {
  await store.getSocialFilter();
});
</script>

<template>
  <div class="background-layer"></div>

  <!-- 保留公共头部 -->

  <div class="home">
  <common-header />
  <el-container class="post-view-container">
  <el-main class="post-content">
    <!-- 内容卡片 -->
    <el-card class="post-card">
      <template #header>
        <div class="post-card-header">
          <h2 class="post-title">Share your happiness!</h2>
          <el-button
            type="primary"
            @click="handlePreviewClick"
            :disabled="!canPreview"
            class="preview-btn"
          >
            Preview
          </el-button>
        </div>
      </template>

      <!-- 博客创建表单 -->
      <el-form :model="createData" label-position="top">
        <!-- 标题输入 -->
        <el-form-item label="Title">
          <el-input
            v-model="createData.title"
            type="textarea"
            :autosize="{ minRows: 1, maxRows: 2 }"
            placeholder="Enter a catchy title"
            maxlength="50"
            show-word-limit
          ></el-input>
        </el-form-item>

        <!-- 社交筛选器 -->
        <el-form-item label="Categories">
          <div class="filter-tags">
            <el-tag
              v-for="option in socialFilters"
              :key="option.id"
              :class="{ 'active-tag': createData.social_filters.includes(option.id) }"
              @click="togglePreference(option.id)"
              effect="plain"
              class="filter-tag"
            >
              <span class="filter-icon">{{ option.icon }}</span>
              <span>{{ option.name }}</span>
            </el-tag>
          </div>
        </el-form-item>

        <!-- 内容输入 -->
        <el-form-item label="Content">
          <el-input
            v-model="createData.content"
            type="textarea"
            :autosize="{ minRows: 4, maxRows: 8 }"
            placeholder="What's happening? Share your experience..."
          ></el-input>
        </el-form-item>

        <!-- 图片上传 -->
        <el-form-item label="Photos (up to 9)">
          <el-upload
            class="post-upload"
            :show-file-list="false"
            :on-change="handleImageUpload"
            :auto-upload="false"
            multiple
            accept="image/*"
            list-type="picture-card"
          >
            <el-icon><Plus /></el-icon>
            <div class="upload-text">Select Images</div>
          </el-upload>

          <!-- 图片预览 -->
          <div class="image-gallery" v-if="createData.image.length">
            <el-image
              v-for="(image, index) in createData.image"
              :key="index"
              :src="getImageUrl(image)"
              :preview-src-list="createData.image.map(img => getImageUrl(img))"
              fit="cover"
              class="preview-image"
            >
              <template #error>
                <div class="image-slot">
                  <el-icon><Picture /></el-icon>
                </div>
              </template>
              <template #placeholder>
                <div class="image-slot">
                  <el-icon><Loading /></el-icon>
                </div>
              </template>
              <div class="image-actions">
                <el-button
                  type="danger"
                  circle
                  size="small"
                  icon="Delete"
                  @click.stop="removeImage(index)"
                ></el-button>
              </div>
            </el-image>
          </div>
        </el-form-item>

        <!-- 标签输入 -->
        <el-form-item label="Tags (up to 5)">
          <div class="tags-input-area">
            <div class="tags-list">
              <el-tag
                v-for="(tag, index) in tags"
                :key="index"
                closable
                @close="removeTag(index)"
                class="post-tag"
              >
                {{ tag }}
              </el-tag>
            </div>
            <div class="tag-input">
              <el-input
                v-model="tagInput"
                placeholder="Add tag"
                @keydown="handleTagInput"
                maxlength="15"
                class="tag-input-field"
              >
                <template #append>
                  <el-button @click="addTag" :disabled="tags.length >= 5 || !tagInput.trim()">
                    Add
                  </el-button>
                </template>
              </el-input>
              <div class="tag-count" v-if="tags.length > 0">{{ tags.length }}/5 tags</div>
            </div>
          </div>
        </el-form-item>

        <!-- 评论权限 -->
        <el-form-item label="Who can reply?">
          <el-radio-group v-model="createData.comment_permission">
            <el-radio
              v-for="option in commentPermission"
              :key="option.id"
              :label="option.id"
            >
              {{ option.name }} can reply
            </el-radio>
          </el-radio-group>
        </el-form-item>

        <!-- NFT 选项 -->
        <el-form-item>
          <el-checkbox v-model="createData.isNFT">
            <div class="nft-option">
              <span class="nft-icon">🖼️</span>
              Make your NFT
            </div>
          </el-checkbox>
        </el-form-item>

        <!-- 操作按钮 -->
        <el-form-item>
          <div class="action-buttons">
            <el-button @click="saveDraft" plain>Save Draft</el-button>
            <el-button @click="postTweet" type="primary">Post</el-button>
          </div>
        </el-form-item>
      </el-form>
    </el-card>
  </el-main>
</el-container>

<!-- 预览组件 -->
<PostPreview
  v-if="showPreview"
  :title="createData.title"
  :content="createData.content"
  :images="createData.image"
  :tags="tags"
  :preferences="createData.social_filters"
  @close="closePreview"
/>
</div>
</template>
