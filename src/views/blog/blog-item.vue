<template>
  <!-- 点击整个博客项时，触发 onClick 事件 -->
  <div class="blog-item" :class="{ 'nft-blog': post.isNFT }" @click="onClick">
    <!-- 轮播图：如果有文件则显示 -->
    <el-carousel v-if="post.files && post.files.length > 0" indicator-position="outside" class="post-carousel" :autoplay="false" :touchable="true" :loop="true">
      <!-- 遍历所有文件 -->
      <el-carousel-item v-for="(file, index) in post.files" :key="index">
        <!-- 使用动态绑定的 src -->
        <template #default>
          <img :src="getDisplayUrl(file)" :alt="isVideo(file) ? 'Video Thumbnail' : 'Post Image'" class="post-image" />
        </template>
      </el-carousel-item>
    </el-carousel>

    <!-- 博客内容 -->
    <div class="post-content-userpage">
      <h2 class="post-title-userpage" :title="post.title">
        {{ post.title }}
      </h2>
    </div>

    <!-- 博客底部信息 -->
    <div class="post-footer-userpage">
      <!-- 作者信息 -->
      <div class="author-info">
        <img v-if="post.user?.avatar" :src="getImageUrl(post.user.avatar)" alt="Avatar" class="post-avatar" />
        <span class="author-name" :title="post.user?.name">
          {{ post.user?.name }}
        </span>
      </div>

      <!-- 统计信息 -->
      <div class="post-stats">
        <span class="collect" :class="{ collected: isCollected }">
          <span class="star-icon">{{ isCollected ? '⭐' : '☆' }}</span>
          <span class="collect-text">{{ isCollected ? '已收藏' : '收藏' }}</span>
        </span>
        <span class="comments">💬 {{ post.comments_count }}</span>
        <span class="coins" v-if="post.isNFT">₿ {{ post.coins }}</span>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted, watch, onBeforeUnmount } from 'vue';
import type { IBlog } from '@/types/blog';
import { getImageUrl } from '@/utils';
import { useBlogStore } from '@/stores/blog';
import { useUserStore } from '@/stores/user';

// --- Props & Emits ---
const props = defineProps<{ post: IBlog }>();
const emits = defineEmits<{ detail: [id: number] }>();

// --- Stores ---
const store = useBlogStore();
const userStore = useUserStore();

// --- State Management ---
// 使用 Map 存储视频封面，性能优于普通对象
const videoCovers = ref<Map<string, string>>(new Map());
// 存储创建的 video 元素引用，用于组件卸载时清理，防止内存泄漏
const videoElements = ref<HTMLVideoElement[]>([]);
// 收藏状态
const isCollected = ref(false);

// --- Helper Functions ---
/**
 * 判断一个 URL 是否为视频
 * @param url 文件 URL
 */
function isVideo(url: string): boolean {
  if (!url) return false;
  const lowerUrl = url.toLowerCase();
  return lowerUrl.includes('.mp4') || lowerUrl.includes('.avi') || lowerUrl.includes('.mov') || lowerUrl.includes('.webm');
}

/**
 * 生成视频封面（使用视频的第一帧）
 * @param videoUrl 视频文件的 URL
 * @returns 返回一个 Promise， resolve 为封面图的 Data URL
 */
function generateVideoCover(videoUrl: string): Promise<string> {
  if (videoCovers.value.has(videoUrl)) {
    return Promise.resolve(videoCovers.value.get(videoUrl)!);
  }

  return new Promise((resolve) => {
    const video = document.createElement('video');
    video.src = getImageUrl(videoUrl);
    video.crossOrigin = 'anonymous';

    // --- 改1：新增seeked事件的回调（跳转完成后绘图）---
    const onSeeked = () => {
      video.removeEventListener('seeked', onSeeked); // 只执行一次，立即移除监听

      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 300;
      canvas.height = video.videoHeight || 200;

      const ctx = canvas.getContext('2d');
      if (ctx && video.videoWidth > 0) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const thumbnailUrl = canvas.toDataURL('image/jpeg');
        videoCovers.value.set(videoUrl, thumbnailUrl);
        resolve(thumbnailUrl);
      } else {
        console.warn('Canvas 绘图失败，使用默认封面。URL:', videoUrl);
        resolve('/default-video-cover.jpg');
      }
      cleanup();
    };

    const onLoadedMetadata = () => {
      video.removeEventListener('loadedmetadata', onLoadedMetadata);

      if (!video.duration || video.duration <= 0) {
        console.warn('无法获取视频时长，使用默认封面。URL:', videoUrl);
        resolve('/default-video-cover.jpg');
        cleanup();
        return;
      }

      // 计算随机时间（逻辑不变）
      const start = video.duration * 0.1;
      const end = video.duration * 0.9;
      const randomTime = start + Math.random() * (end - start);
      console.log(`视频时长: ${video.duration.toFixed(2)}s, 随机时间: ${randomTime.toFixed(2)}s`);

      // --- 改2：跳转前先绑定seeked事件（等跳转完成再绘图）---
      video.addEventListener('seeked', onSeeked);
      video.currentTime = randomTime; // 执行跳转
    };

    // --- 改3：删除原来的onLoadedData事件（不再用它绘图）---
    // （原来的onLoadedData逻辑已迁移到onSeeked里，这里直接删掉）

    const onError = () => {
      console.error('视频加载失败，无法生成封面:', videoUrl);
      resolve('/default-video-cover.jpg');
      cleanup();
    };

    const cleanup = () => {
      video.removeEventListener('loadedmetadata', onLoadedMetadata);
      video.removeEventListener('seeked', onSeeked); // 清理seeked监听
      video.removeEventListener('error', onError);
    };

    // 只保留这两个事件监听（onLoadedData已删掉）
    video.addEventListener('loadedmetadata', onLoadedMetadata);
    video.addEventListener('error', onError);

    videoElements.value.push(video);
  });
}

/**
 * 获取用于显示的 URL
 * @param file 文件 URL
 * @returns 如果是图片，返回图片 URL；如果是视频，返回已生成的封面 URL 或默认封面 URL
 */
function getDisplayUrl(file: string): string {
  if (!isVideo(file)) {
    return getImageUrl(file);
  }
  // 返回 Map 中已生成的封面，如果没有则返回默认封面
  return videoCovers.value.get(file) || '/default-video-cover.jpg';
}

/**
 * 处理所有文件，为视频生成封面
 * @param files 文件数组
 */
function processVideoFiles(files: string[] = []) {
  files.forEach((file) => {
    if (isVideo(file) && !videoCovers.value.has(file)) {
      // 直接调用生成函数，无需等待 img 的 @load 事件
      generateVideoCover(file);
    }
  });
}

// 检查收藏状态
const checkCollectionStatus = async (blogId: number | undefined) => {
  if (!blogId || !userStore.isLogin()) {
    isCollected.value = false;
    return;
  }

  try {
    const response = await store.checkUserLike(blogId);
    isCollected.value = response.is_collected;
  } catch (error) {
    console.error('Failed to check collection status:', error);
    isCollected.value = false;
  }
};

// --- Lifecycle Hooks ---
// 组件挂载后，立即处理视频文件
onMounted(() => {
  if (props.post.files) {
    processVideoFiles(props.post.files);
  }
  // 检查收藏状态
  if (props.post.id) {
    checkCollectionStatus(props.post.id);
  }
});

// 监听 post.files 的变化，如果数据是异步加载的，这能确保逻辑执行
watch(
  () => props.post.files,
  (newFiles) => {
    processVideoFiles(newFiles);
  },
);

// 监听 post.id 的变化，检查收藏状态
watch(
  () => props.post.id,
  (newId) => {
    if (newId) {
      checkCollectionStatus(newId);
    }
  },
);

// 组件卸载前，清理所有创建的 video 元素，防止内存泄漏
onBeforeUnmount(() => {
  videoElements.value.forEach((video) => {
    video.pause();
    video.src = ''; // 释放视频资源
    video.load();
  });
  videoElements.value = [];
});

// --- Event Handlers ---
/**
 * 点击博客项时触发，向外发送 'detail' 事件
 */
function onClick() {
  if (props.post.id) {
    emits('detail', props.post.id);
  }
}
</script>

<style scoped>
.blog-item {
  display: flex;
  flex-direction: column;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s ease-in-out;
  cursor: pointer;
}

.blog-item:hover {
  transform: translateY(-4px);
}

.post-carousel {
  width: 100%;
}

/* 让轮播项高度自适应图片 */
.post-carousel :deep(.el-carousel__item) {
  height: auto;
  min-height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.post-image {
  width: 100%;
  max-height: 600px;
  object-fit: contain;
  display: block;
  background-color: #f0f0f0; /* 默认背景色，在封面生成前显示 */
}

.post-content-userpage {
  padding: 16px;
  flex: 1;
}

.post-title-userpage {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #333;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.post-footer-userpage {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 16px 16px;
  font-size: 14px;
  color: #666;
}

.author-info {
  display: flex;
  align-items: center;
}

.post-avatar {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  margin-right: 8px;
  object-fit: cover;
}

.author-name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 120px;
}

.post-stats {
  display: flex;
  gap: 12px;
}

.collect,
.comments,
.coins {
  display: flex;
  align-items: center;
  gap: 4px;
}

.collect {
  font-size: 14px;
  color: #666;
}

.star-icon {
  font-size: 16px;
}

.collect-text {
  font-size: 14px;
  color: #666;
}
</style>
