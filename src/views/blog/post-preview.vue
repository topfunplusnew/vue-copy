<script setup lang="ts">
import { computed } from 'vue';
import { getImageUrl } from '@/utils';
import type { ISocialFilter } from '@/types/blog';
import { useUserStore } from '@/stores/user';

const userStore = useUserStore();

const props = defineProps<{
  title: string
  content: string
  images: string[]
  tags: string[]
  preferences: number[]
  socialFilters: ISocialFilter[]
  location: string[]
  isNFT: boolean
}>();

const emit = defineEmits<{
  close: []
}>();

// 模拟一个预览博客对象，格式与BlogDetailDialog期望的selectedBlog一致
const previewBlog = computed(() => ({
  id: 0, // 预览博客没有ID
  title: props.title,
  content: props.content,
  image: props.images,
  tags: props.tags,
  social_filters: props.socialFilters.filter(filter => props.preferences.includes(filter.id)),
  location: props.location,
  user: {
    id: userStore.user?.id || 0,
    name: userStore.user?.name || 'You',
    avatar: userStore.user?.avatar || ''
  },
  likes: 0,
  comments_count: 0,
  coins: 0,
  isNFT: props.isNFT,
  created_at: new Date().toISOString()
}));

const closeDialog = () => {
  emit('close');
};

const handleImageError = (event: Event) => {
  const target = event.target as HTMLImageElement;
  target.classList.add('image-error');
};
</script>

<template>
  <el-dialog
    :model-value="true"
    :fullscreen="false"
    class="blog-detail-dialog preview-dialog"
    @close="closeDialog"
    :style="{ '--el-dialog-width': '90%' }"
    :show-close="false"
  >
    <div class="blog-detail-container" :class="{ 'nft-post': previewBlog?.isNFT }">
      <!-- 关闭按钮 -->
      <button class="close-button" @click="closeDialog">×</button>

      <!-- 左侧区域：图片 -->
      <div class="detail-left">
        <!-- 图片轮播 -->
        <el-carousel
          v-if="previewBlog?.image && previewBlog.image.length > 0"
          :interval="5000"
          class="image-section"
          height="100%"
          :touchable="true"
          :loop="true"
          :autoplay="false"
        >
          <el-carousel-item v-for="(image, index) in previewBlog.image" :key="index">
          <div class="image-slider">
              <div class="image-wrapper">
              <img
                :src="getImageUrl(image)"
                alt="Blog Image"
                class="detail-image"
                  @error="handleImageError"
              />
            </div>
            </div>
          </el-carousel-item>
        </el-carousel>
      </div>

      <!-- 右侧内容区域 -->
      <div class="detail-right">
        <div class="detail-right-content">
          <!-- 用户信息和标题 -->
          <div class="user-header">
            <div class="author-info">
              <img
                :src="getImageUrl(previewBlog?.user?.avatar || '')"
                alt="Author Avatar"
                class="author-avatar"
              />
              <span class="author-name">{{ previewBlog?.user?.name }}</span>
              <span class="preview-badge">Preview Mode</span>
        </div>
            <!-- 分类 -->
            <div class="tags-section-pref" v-if="previewBlog?.social_filters && previewBlog.social_filters.length > 0">
              <span v-for="(item, index) in previewBlog.social_filters" :key="index" class="tag-pref">
                {{ item.icon }}{{ item.name }}
          </span>
            </div>
            <h2 class="blog-title">{{ previewBlog?.title }}</h2>
        </div>

          <!-- 标签 -->
          <div class="tags-section" v-if="(previewBlog?.tags && previewBlog.tags.length > 0) || previewBlog?.isNFT">
            <div class="nft-tag" v-if="previewBlog?.isNFT">NFT</div>
            <span class="tag" v-for="tag in previewBlog?.tags" :key="tag">
              #{{ tag }}
          </span>
        </div>

        <!-- 博客内容 -->
        <div class="content-section">
            <p class="blog-content">{{ previewBlog?.content }}</p>
          </div>

          <!-- 预览模式说明 -->
          <div class="preview-notice">
            <p>📝 This is a preview of your blog post. Click "Post" to publish it.</p>
          </div>
        </div>

        <!-- 统计信息栏 - 预览模式下显示静态数据 -->
        <div class="stats-bar">
          <!-- 统计信息 -->
          <div class="stats-info">
            <span class="likes disabled">
              <span class="heart-icon">🤍</span> <span class="count">0</span>
            </span>
            <span class="comments disabled">
              <span class="comment-icon">💬</span> <span class="count">0</span>
            </span>
            <span class="coins disabled" v-if="previewBlog?.isNFT">
              <span class="coin-icon">₿</span> <span class="count">0</span>
            </span>
          </div>
          <!-- 预览模式下禁用评论输入 -->
          <div class="quick-comment-input disabled">
            <input
              type="text"
              placeholder="Comments will be available after posting..."
              class="comment-input comment-input-home"
              disabled
            />
            <button class="submit-quick-comment" disabled>
              <span>➤</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </el-dialog>
</template>

<style scoped>
/* 确保preview弹窗使用与BlogDetailDialog完全相同的样式 */
.preview-dialog {
  /* 更高的z-index确保显示在post弹窗之上 */
  z-index: 2200 !important;
}

/* 确保el-dialog的body高度正确 */
.preview-dialog :deep(.el-dialog__body) {
  padding: 0 !important;
  height: 90vh !important;
  overflow: hidden !important;
}

/* 确保blog-detail-container完全填满dialog容器 */
.preview-dialog .blog-detail-container {
  /* 使用与BlogDetailDialog相同的高度设置 */
  width: 100%;
  height: 90vh;
  display: flex;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  background: white;
  position: relative;
  transition: flex-direction 0.3s ease, width 0.3s ease, height 0.3s ease;

  /* 在移动端调整为垂直布局 */
  @media (max-width: 768px) {
    flex-direction: column;
    height: 90vh;
  }
}

/* 左侧图片区域 */
.preview-dialog .detail-left {
  flex: 6;
  background: white;
  position: relative;
  display: flex;
  flex-direction: column;
  transition: height 0.3s ease;

  /* 在移动端调整高度 */
  @media (max-width: 768px) {
    height: 50%;
  }
}

/* 右侧内容区域 */
.preview-dialog .detail-right {
  flex: 4;
  background: white;
  display: flex;
  flex-direction: column;
  height: 100%;
  position: relative;

  /* 在移动端调整高度 */
  @media (max-width: 768px) {
    height: 50%;
  }
}

/* 只添加preview特有的样式，其他样式完全继承自BlogDetailDialog */
.preview-badge {
  background: rgba(255, 193, 7, 0.1);
  color: #ff9800;
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 12px;
  font-weight: 500;
  margin-left: 8px;
}

.preview-notice {
  margin: 20px 0;
  padding: 15px;
  background: linear-gradient(45deg, rgba(0, 204, 255, 0.1), rgba(0, 153, 204, 0.1));
  border-left: 4px solid #00ccff;
  border-radius: 8px;
}

.preview-notice p {
  margin: 0;
  color: #0066cc;
  font-size: 14px;
  font-weight: 500;
}

/* 预览模式下禁用状态的样式 */
.stats-bar .disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.quick-comment-input.disabled input {
  background-color: #f5f5f5;
  cursor: not-allowed;
}

.quick-comment-input.disabled button {
  cursor: not-allowed;
  opacity: 0.5;
}
</style>



