<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { useBlogStore } from '@/stores/blog';
import { useUserStore } from '@/stores/user';
import { getImageUrl } from '@/utils';
import { useRouter } from 'vue-router';
import BlogDetailComment from './blog-detail-comment.vue';
import { isImage, isVideo } from '@/constants/file';

const router = useRouter();
const dialogWidth = ref('90%');
const props = defineProps({
  visible: {
    type: Boolean,
    required: true,
  }, // 接收 v-model 传递的 visible
  blogId: {
    type: Number,
    required: true,
  },
});
// const currentBlogId = ref(1); // 博客ID
const emit = defineEmits(['update:visible', 'close']);

const store = useBlogStore();
const userStore = useUserStore();

const selectedBlog = computed(() => store.blog);
// const currentImageIndex = ref(0);
const newComment = ref('');

// 图片数组 - 优先使用 image，如果没有则使用 files
const blogImages = computed(() => {
  if (selectedBlog.value?.image && selectedBlog.value.image.length > 0) {
    return selectedBlog.value.image;
  }
  return selectedBlog.value?.files || [];
});

// 评论相关的状态
const replyContent = ref('');
const expandedReplies = ref<number[]>([]);
const replyTarget = ref<{ id: number; type: string; parentId?: number } | null>(null);
const expandedComments = ref<number[]>([]);

const isLiked = ref(false);
const likesCount = ref(0);
// 初始化点赞状态
watch(
  () => selectedBlog.value,
  (newBlog) => {
    if (newBlog?.id) {
      likesCount.value = newBlog.likes || 0;
      // 检查用户是否已经点赞
      checkLikeStatus(newBlog.id);
    }
  },
  { immediate: true },
);

// 检查点赞状态
const checkLikeStatus = async (blogId: number | undefined) => {
  if (!blogId || !userStore.isLogin()) {
    isLiked.value = false;
    return;
  }

  try {
    const response = await store.checkUserLike(blogId);
    isLiked.value = response.data.has_liked;
  } catch (error) {
    console.error('Failed to check like status:', error);
    isLiked.value = false;
  }
};

// 处理点赞
const handleLike = async () => {
  if (!selectedBlog.value?.id) return;

  if (!userStore.isLogin()) {
    ElMessageBox.confirm('You need to login to like this post. Would you like to login now?', 'Login Required', {
      confirmButtonText: 'Go to Login',
      cancelButtonText: 'Cancel',
      type: 'warning',
    }).then(() => {
      router.push({ name: 'login' });
    });
    return;
  }

  if (isLiked.value) {
    ElMessage.info('You have already liked this post');
    return;
  }

  try {
    await store.likeBlog(selectedBlog.value.id);
    isLiked.value = true;
    likesCount.value += 1;
    ElMessage.success('Liked successfully');
  } catch (error) {
    console.error('Failed to like blog:', error);
    ElMessage.error('Failed to like blog');
  }
};

// 关注状态
const isFollowing = ref(false);

const isOwnPost = computed(() => {
  if (!userStore.user || !selectedBlog.value?.user) {
    return false;
  }
  return String(userStore.user.id) === String(selectedBlog.value.user.id);
});

watch(
  () => props.blogId,
  async (newVal) => {
    if (newVal > 0) {
      console.log('通过获取博客ID:', newVal);
      await store.getBlogByID(newVal);
      console.log('博客已获取:', selectedBlog.value);

      // 重置评论区状态
      expandedReplies.value = [];
      expandedComments.value = [];
      replyContent.value = '';
      replyTarget.value = null;

      // 检查关注状态
      if (selectedBlog.value?.user?.id && !isOwnPost.value) {
        checkFollowStatus(selectedBlog.value.user.id);
      }

      nextTick(() => {
        const detailBox = document.querySelector('.blog-details-home');
        if (detailBox) {
          detailBox.scrollTop = 0;
        }
      });
    }
  },
);

watch(
  () => selectedBlog.value,
  (newBlog) => {
    if (newBlog?.user?.id && !isOwnPost.value) {
      checkFollowStatus(newBlog.user.id);
    } else {
      isFollowing.value = false;
    }
  },
  { immediate: true },
);

const checkFollowStatus = async (userId: number) => {
  try {
    const isFollowed = await userStore.isFollowing(userId);
    isFollowing.value = isFollowed.data.is_following;
  } catch (error) {
    console.error('Failed to check follow status:', error);
  }
};

const closeDialog = () => {
  emit('update:visible', false); // 通知父组件隐藏对话框
  emit('close');
};

// const prevImage = () => {
//   if (selectedBlog.value?.image && selectedBlog.value.image.length > 1) {
//     currentImageIndex.value = (currentImageIndex.value - 1 + selectedBlog.value.image.length) % selectedBlog.value.image.length;
//   }
// };

// const nextImage = () => {
//   if (selectedBlog.value?.image && selectedBlog.value.image.length > 1) {
//     currentImageIndex.value = (currentImageIndex.value + 1) % selectedBlog.value.image.length;
//   }
// };
//回复帖子
const submitComment = async () => {
  if (!newComment.value.trim()) return;
  if (!selectedBlog.value?.id) return;

  if (!userStore.isLogin()) {
    ElMessageBox.confirm('You need to login first to comment. Would you like to login now?', 'Login Required', {
      confirmButtonText: 'Go to Login',
      cancelButtonText: 'Cancel',
      type: 'warning',
    }).then(() => {
      router.push({ name: 'login' });
    });
    return;
  }

  try {
    await userStore.commenttoBlog(selectedBlog.value.id, newComment.value);
    newComment.value = '';

    // 重新获取博客数据以更新评论列表
    await store.getBlogByID(selectedBlog.value.id);

    nextTick(() => {
      scrollToComments();
    });

    ElMessage.success('Comment submitted successfully!');
  } catch (error) {
    console.error(error);
    ElMessage.error('Failed to submit comment');
  }
};

const scrollToComments = () => {
  const commentsSection = document.querySelector('.comments-container') as HTMLElement;

  if (commentsSection) {
    // 直接使用scrollIntoView方法，将评论区域滚动到视图顶部
    commentsSection.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
  }
};

const handleImageError = (event: Event) => {
  const target = event.target as HTMLImageElement;
  target.src = '/path/to/fallback-image.jpg';
  target.classList.add('image-error');
};
// 编辑按钮已移除

const handleFollowClick = async (id?: number) => {
  if (!id) return;
  try {
    if (isFollowing.value) {
      await userStore.unfollow(id);
      isFollowing.value = false;
      ElMessage.success('Unfollowed successfully');
    } else {
      await userStore.follow(id);
      isFollowing.value = true;
      ElMessage.success('Following successfully');
    }
  } catch (error) {
    console.log(error);
    ElMessage.error('Failed to update following status');
  }
};

const handleMassageClick = (id?: number) => {
  if (!id) return;
  // TODO: 实现私信功能，可以跳转到私信页面或打开私信弹窗
  ElMessage.info(`Opening message conversation with user ${id}`);
  console.log('Message button clicked for user:', id);
};

// 处理头像和用户名点击事件
const handleUserClick = (event?: Event) => {
  console.log('handleUserClick 被调用');

  // 阻止事件冒泡，避免其他事件干扰
  if (event) {
    event.preventDefault();
    event.stopPropagation();
  }

  // 获取要跳转的用户ID
  const targetUserId = selectedBlog.value?.user?.id;
  if (!targetUserId) {
    console.log('❌ cannot get user id');
    ElMessage.error('cannot get user info');
    return;
  }

  console.log('✅ click user avatar, prepare to jump to user page');
  console.log('target user id:', targetUserId);
  console.log('current user id:', userStore.user?.id);
  console.log('is own post:', isOwnPost.value);

  try {
    // 先关闭当前弹窗
    console.log('📤 close dialog...');
    closeDialog();

    // 使用setTimeout确保弹窗完全关闭后再跳转
    setTimeout(() => {
      console.log('🚀 start to jump to user page...');

      // 跳转到对应的用户页面
      const jumpToUserPage = async () => {
        try {
          // 如果是当前用户自己的博客，跳转到自己的用户页面
          if (isOwnPost.value) {
            console.log('jump to my user page (userpage)');
            await router.push({ name: 'userpage' });
            console.log('✅ success to jump to my user page');
          } else {
            // 如果是其他用户的博客，跳转到其他用户页面
            console.log('jump to other user page (otheruser), user id:', targetUserId);
            await router.push({ name: 'otheruser', params: { id: targetUserId.toString() } });
            console.log('✅ success to jump to other user page');
          }

          // 跳转成功后滚动到页面顶部
          nextTick(() => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
            document.body.scrollTop = 0;
            document.documentElement.scrollTop = 0;
          });
        } catch (error) {
          console.error('❌ jump failed:', error);
          const errorMessage = error instanceof Error ? error.message : 'unknown error';
          ElMessage.error(`jump failed: ${errorMessage}`);
        }
      };

      jumpToUserPage();
    }, 100); // 100ms延迟确保弹窗关闭
  } catch (error) {
    console.error('❌ jump failed:', error);
    ElMessage.error('jump failed');
  }
};
</script>

<template>
  <el-dialog :model-value="visible" :fullscreen="false" class="blog-detail-dialog" @close="closeDialog" :style="{ '--el-dialog-width': dialogWidth }" :show-close="false">
    <div class="blog-detail-container" :class="{ 'nft-post': selectedBlog?.isNFT }">
      <!-- 关闭按钮 -->
      <button class="close-button" @click="closeDialog">×</button>

      <!-- 左侧区域：图片 -->
      <div class="detail-left">
        <!-- 图片轮播 -->
        <el-carousel v-if="blogImages && blogImages.length > 0" :interval="5000" class="image-section" height="100%" :touchable="true" :loop="true" :autoplay="false">
          <el-carousel-item v-for="(image, index) in blogImages" :key="index">
            <div class="image-slider">
              <div class="image-wrapper">
                <img v-if="isImage(image)" :src="getImageUrl(image)" alt="Blog Image" class="blog-image" @error="handleImageError" />
                <video v-else-if="isVideo(image)" :src="getImageUrl(image)" @error="handleImageError" controls class="detail-video" />
              </div>
            </div>
          </el-carousel-item>
        </el-carousel>
      </div>

      <!-- 右侧内容区域 -->
      <div class="detail-right" ref="detailRight">
        <div class="detail-right-content">
          <!-- 用户信息和标题 -->
          <div class="user-header">
            <div class="author-info">
              <div class="user-click-area clickable" @click="handleUserClick($event)" :title="isOwnPost ? 'Click to jump to my user page' : `Click to jump to ${selectedBlog?.user?.name}'s user page`">
                <img :src="getImageUrl(selectedBlog?.user?.avatar || '')" alt="Author Avatar" class="author-avatar" />
                <span class="author-name">{{ selectedBlog?.user?.name }}</span>
              </div>
              <!-- Edit/Follow按钮直接跟在用户名后面 -->
              <el-button v-if="!isOwnPost" class="follow-btn inline-btn" size="small" :class="{ following: isFollowing }" @click.stop="handleFollowClick(selectedBlog?.user?.id)">
                <span class="follow-icon">+</span>
                <span class="follow-text">{{ isFollowing ? 'Following' : 'Follow' }}</span>
              </el-button>
              <!-- Massage按钮 -->
              <el-button v-if="!isOwnPost" class="massage-btn inline-btn" size="small" @click.stop="handleMassageClick(selectedBlog?.user?.id)">
                <span class="massage-icon">💬</span>
                <span class="massage-text">Message</span>
              </el-button>
              <!-- 编辑按钮已移除 -->
            </div>
            <!-- 分类 -->
            <div class="tags-section-pref" v-if="selectedBlog?.social_filters">
              <span v-for="(item, index) in selectedBlog.social_filters" :key="index" class="tag-pref"> {{ item.icon }}{{ item.name }} </span>
            </div>
            <h2 class="blog-title">{{ selectedBlog?.title }}</h2>
          </div>

          <!-- 标签 -->
          <div class="tags-section">
            <div class="nft-tag" v-if="selectedBlog?.isNFT">NFT</div>
            <span class="tag" v-for="tag in selectedBlog?.tags" :key="tag">
              {{ tag }}
            </span>
          </div>

          <!-- 博客内容 -->
          <div class="content-section">
            <p class="blog-content">{{ selectedBlog?.content }}</p>
          </div>

          <!-- 评论组件 -->
          <BlogDetailComment :blog-id="blogId" />
        </div>

        <!-- 统计信息栏 -->
        <div class="stats-bar">
          <!-- 统计信息 -->
          <div class="stats-info">
            <span class="likes" @click="handleLike" :class="{ liked: isLiked }">
              <span class="heart-icon">{{ isLiked ? '❤️' : '🤍' }}</span> <span class="count">{{ likesCount }}</span>
            </span>
            <span class="comments" @click="scrollToComments">
              <span class="comment-icon">💬</span> <span class="count">{{ selectedBlog?.comments_count }}</span>
            </span>
            <span class="coins" v-if="selectedBlog?.isNFT">
              <span class="coin-icon">₿</span> <span class="count">{{ selectedBlog?.coins }}</span>
            </span>
          </div>
          <!-- 简化的评论输入框 -->
          <div class="quick-comment-input">
            <input type="text" v-model="newComment" placeholder="Add a comment..." @keyup.enter="submitComment" class="comment-input comment-input-home" />
            <button class="submit-quick-comment" @click="submitComment" :disabled="!newComment.trim()">
              <span>➤</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </el-dialog>
</template>
<style scoped>
.el-carousel__item {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 确保图片完整显示 */
:deep(.image-wrapper) {
  overflow: hidden !important;
  background-color: #f5f5f5 !important;
}

:deep(.blog-image),
:deep(.detail-image),
:deep(.detail-video) {
  width: 100% !important;
  height: 100% !important;
  object-fit: contain !important;
  box-sizing: border-box !important;
}
</style>
