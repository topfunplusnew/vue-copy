<script setup lang="ts">
import { ref, computed, nextTick, watch } from 'vue';
import { useUserStore } from '@/stores/user';
import { useBlogStore } from '@/stores/blog';
import { ElMessage, ElMessageBox } from 'element-plus';
import type { IBlogComment } from '@/types/blog';
import { getImageUrl } from '@/utils';
import { isImage, isVideo } from '@/constants/file';
import { cancelCollection } from '@/services/api';
import { useRouter } from 'vue-router';
import BlogDetailComment from '@/views/blog/blog-detail-comment.vue';

// 定义props和emit
const props = defineProps<{
  isFollowing: boolean;
}>();

const emit = defineEmits(['close', 'toggle-follow']);

const store = useUserStore();
const blogStore = useBlogStore();
const router = useRouter();

const selectedBlog = computed(() => store.selectedPost);

// 图片数组 - 优先使用 image，如果没有则使用 files
const blogImages = computed(() => {
  const images = selectedBlog.value?.files || [];
  return images;
});

// 关注状态 - 使用 props 初始化
const isFollowing = ref(props.isFollowing);

// 监听 props 变化，同步到本地状态
watch(
  () => props.isFollowing,
  (newVal) => {
    isFollowing.value = newVal;
  },
);

// 收藏状态
const isCollected = ref(false);

// 检查收藏状态
const checkCollectionStatus = async (blogId: number | undefined) => {
  if (!blogId || !store.isLogin()) {
    isCollected.value = false;
    return;
  }

  try {
    const response = await blogStore.checkUserLike(blogId);
    isCollected.value = response.is_collected;
  } catch (error) {
    console.error('Failed to check collection status:', error);
    isCollected.value = false;
  }
};

// 初始化收藏状态
watch(
  () => selectedBlog.value,
  (newBlog) => {
    if (newBlog?.id) {
      // 检查用户是否已经收藏
      checkCollectionStatus(newBlog.id);
    }
  },
  { immediate: true },
);

// 处理收藏
const handleCollect = async () => {
  if (!selectedBlog.value?.id) return;
  if (!store.isLogin()) {
    ElMessageBox.confirm('You need to login to collect this post. Would you like to login now?', 'Login Required', {
      confirmButtonText: 'Go to Login',
      cancelButtonText: 'Cancel',
      type: 'warning',
    }).then(() => {
      router.push({ name: 'login' });
    });
    return;
  }

  const previousState = isCollected.value;
  try {
    // 根据当前收藏状态调用不同的接口
    if (isCollected.value) {
      // 如果已收藏，则取消收藏
      await cancelCollection(selectedBlog.value.id);
      isCollected.value = false;
      ElMessage.success('Uncollected successfully');
    } else {
      // 如果未收藏，则进行收藏
      await blogStore.likeBlog(selectedBlog.value.id);
      isCollected.value = true;
      ElMessage.success('Collected successfully');
    }
  } catch (error) {
    console.error('Failed to toggle collection:', error);
    ElMessage.error('Failed to update collection status');
    // 如果失败，恢复到之前的状态
    isCollected.value = previousState;
  }
};

// Comment functionality
const newComment = ref('');
const submitComment = async () => {
  if (!newComment.value.trim()) return;
  if (!selectedBlog.value?.id) return;

  try {
    await store.commenttoBlog(selectedBlog.value.id, newComment.value);
    newComment.value = '';
    if (selectedBlog.value.id) await store.getUserBlogByID(selectedBlog.value.id);
    nextTick(() => {
      scrollToComments();
    });
    ElMessage.success('Comment submitted successfully!');
  } catch (error) {
    console.error(error);
    ElMessage.error('Failed to submit comment');
  }
};

// Long press comment handling
const longPressTimeout = ref();
const longPressDuration = 800;
const activeComment = ref<number | undefined>();

const handleTouchStart = (comment: IBlogComment) => {
  const currentUser = store.user;
  if (!comment || !currentUser || comment.user.id !== currentUser.id) return;

  longPressTimeout.value = setTimeout(() => {
    activeComment.value = comment.id;
  }, longPressDuration);
};

const handleTouchEnd = () => {
  if (longPressTimeout.value) {
    clearTimeout(longPressTimeout.value);
    longPressTimeout.value = null;
  }
};

const handleTouchMove = () => {
  if (longPressTimeout.value) {
    clearTimeout(longPressTimeout.value);
    longPressTimeout.value = null;
  }
};
//删除评论
const confirmDeleteComment = async (commentId?: number) => {
  if (!commentId) return;
  try {
    await store.userDeleteComment(commentId);
    if (selectedBlog.value?.id) await store.getUserBlogByID(selectedBlog.value.id);
    ElMessage.success('Comment deleted successfully');
  } catch (error) {
    console.error('Failed to delete comment:', error);
    ElMessage.error('Failed to delete comment');
  } finally {
    activeComment.value = undefined;
  }
};

const cancelDeleteComment = () => {
  activeComment.value = undefined;
};

// Reply functionality
const replyContent = ref('');
const isSubmittingReply = ref(false);
const replyTarget = ref<{ id: number; type: string; parentId?: number } | null>(null);

const toggleReplyInput = (id?: number, type: string = 'comment', parentId?: number) => {
  if (!id) return;

  if (replyTarget.value && replyTarget.value.id === id && replyTarget.value.type === type) {
    replyTarget.value = null;
    replyContent.value = '';
  } else {
    if (type === 'reply' && !parentId) {
      console.error('Reply needs parent comment ID');
      return;
    }

    replyTarget.value = {
      id,
      type,
      parentId,
    };

    nextTick(() => {
      const replyInputContainer = document.querySelector('.reply-input-container-home');
      if (replyInputContainer) {
        replyInputContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    });

    replyContent.value = '';
  }
};

const cancelReply = () => {
  replyTarget.value = null;
  replyContent.value = '';
};

const expandReplies = async (commentId?: number) => {
  if (commentId) store.getComments(commentId);
};

const collapseComments = async (commentId?: number) => {
  if (commentId) store.collapseComments(commentId);
};

const submitReply = async () => {
  if (!replyContent.value.trim()) return;

  isSubmittingReply.value = true;
  try {
    if (replyTarget.value?.id) await store.commenttoComment(replyTarget.value.id, replyContent.value);
    ElMessage.success('Reply added successfully');
    if (selectedBlog.value?.id) await store.getUserBlogByID(selectedBlog.value.id);
    replyTarget.value = null;
    replyContent.value = '';
  } catch (error) {
    console.error('Failed to add reply:', error);
    ElMessage.error('Failed to add reply. Please try again.');
  } finally {
    isSubmittingReply.value = false;
  }
};

function scrollToComments() {
  const commentsSection = document.querySelector('.comments-container') as HTMLElement;

  if (commentsSection) {
    // 直接使用scrollIntoView方法，将评论区域滚动到视图顶部
    commentsSection.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
  }
}

const handleFollowClick = async (id?: number) => {
  if (!id) return;
  try {
    if (isFollowing.value) {
      await store.unfollow(id);
      isFollowing.value = false;
      ElMessage.success('Unfollowed successfully');
    } else {
      await store.follow(id);
      isFollowing.value = true;
      ElMessage.success('Following successfully');
    }
    // 通知父组件更新关注状态
    emit('toggle-follow');
  } catch (error) {
    console.log(error);
    ElMessage.error('Failed to update following status');
  }
};

const isOwnPost = computed(() => {
  const user = store.user;
  const blogUser = selectedBlog.value?.user;
  return user && blogUser && user.id === blogUser.id;
});

const handleMassageClick = (id?: number) => {
  if (!id) return;
  // TODO: 实现私信功能，可以跳转到私信页面或打开私信弹窗
  ElMessage.info(`Opening message conversation with user ${id}`);
  console.log('Message button clicked for user:', id);
};

// 三个点菜单状态
const showOptionsMenu = ref(false);

// 删除博客
const handleDeleteBlog = async () => {
  if (!selectedBlog.value?.id) return;
  const blogId = selectedBlog.value.id;

  try {
    await ElMessageBox.confirm('Are you sure you want to delete this blog post?', 'Warning', {
      confirmButtonText: 'Delete',
      cancelButtonText: 'Cancel',
      type: 'warning',
    });

    await store.delUserBlogByID(blogId);
    ElMessage.success('Blog deleted successfully');
    store.getUserBlogList(true); // 刷新博客列表
    emit('close'); // 关闭弹窗
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('Failed to delete blog');
    }
  } finally {
    showOptionsMenu.value = false;
  }
};

// 切换选项菜单
const toggleOptionsMenu = () => {
  showOptionsMenu.value = !showOptionsMenu.value;
};

// 关闭选项菜单
const closeOptionsMenu = () => {
  showOptionsMenu.value = false;
};

// 编辑博客 (前端占位函数)
const handleEditBlog = () => {
  console.log('Edit blog clicked');
  showOptionsMenu.value = false;
};

const handleImageError = (event: Event) => {
  const target = event.target as HTMLImageElement;
  target.src = '/path/to/fallback-image.jpg';
  target.classList.add('image-error');
};
</script>

<template>
  <div class="blog-detail-overlay" @click.self="$emit('close')" @click="closeOptionsMenu">
    <div class="blog-detail-container" :class="{ 'nft-post': selectedBlog?.isNFT }" @click.stop>
      <button class="close-button" @click="$emit('close')">×</button>

      <div class="detail-left">
        <!-- 图片轮播 -->
        <el-carousel v-if="blogImages && blogImages.length > 0" :interval="5000" class="image-section" height="100%" :touchable="true" :loop="true" :autoplay="false">
          <el-carousel-item v-for="(image, index) in blogImages" :key="index">
            <div class="image-slider">
              <div class="image-wrapper">
                <img v-if="isImage(image)" :src="getImageUrl(image)" alt="Blog Image" class="blog-image" @error="handleImageError" />
                <video v-else-if="isVideo(image)" :src="getImageUrl(image)" @error="handleImageError" controls class="detail-video" />
                <img v-else :src="getImageUrl(image)" alt="Blog Image" class="blog-image" @error="handleImageError" />
              </div>
            </div>
          </el-carousel-item>
        </el-carousel>
      </div>

      <div class="detail-right">
        <div class="detail-right-content">
          <div class="user-header">
            <div class="author-info">
              <img :src="getImageUrl(selectedBlog?.user?.avatar || '')" alt="Author Avatar" class="author-avatar" />
              <span class="author-name">{{ selectedBlog?.user?.name }}</span>

              <!-- 三个点菜单按钮（仅自己的博客显示） -->
              <div v-if="isOwnPost" class="options-menu-container" @click.stop>
                <button class="options-menu-trigger" @click="toggleOptionsMenu" @blur="closeOptionsMenu">⋯</button>

                <!-- 下拉菜单 -->
                <div v-if="showOptionsMenu" class="options-dropdown" @click.stop>
                  <button class="dropdown-item edit-item" @click.prevent.stop="handleEditBlog">
                    <span class="dropdown-icon">✏️</span>
                    <span class="dropdown-text">Edit</span>
                  </button>
                  <button class="dropdown-item delete-item" @click="handleDeleteBlog">
                    <span class="dropdown-icon">🗑️</span>
                    <span class="dropdown-text">Delete</span>
                  </button>
                </div>
              </div>

              <!-- Follow按钮直接跟在用户名后面 -->
              <el-button v-if="!isOwnPost" class="follow-btn inline-btn" size="small" :class="{ following: isFollowing }" @click.stop="handleFollowClick(selectedBlog?.user?.id)">
                <span class="follow-icon">+</span>
                <span class="follow-text">{{ isFollowing ? 'Following' : 'Follow' }}</span>
              </el-button>
              <!-- Massage按钮 -->
              <el-button v-if="!isOwnPost" class="massage-btn inline-btn" size="small" @click.stop="handleMassageClick(selectedBlog?.user?.id)">
                <span class="massage-icon">💬</span>
                <span class="massage-text">Message</span>
              </el-button>
            </div>
            <div class="tags-section-pref-userpage" v-if="selectedBlog?.social_filters">
              <span v-for="(item, index) in selectedBlog?.social_filters" :key="index" class="tag-pref-userpage"> {{ item.name }} {{ item.icon }} </span>
            </div>
            <h2 class="blog-title">{{ selectedBlog?.title }}</h2>
          </div>

          <div class="tags-section">
            <div class="nft-tag" v-if="selectedBlog?.isNFT">NFT</div>
            <span class="tag" v-for="tag in selectedBlog?.tags" :key="tag">
              {{ tag }}
            </span>
          </div>

          <div class="content-section">
            <p class="blog-content">{{ selectedBlog?.content }}</p>
          </div>

          <!-- 评论组件 -->
          <BlogDetailComment v-if="selectedBlog?.id" :blog-id="selectedBlog.id" />
        </div>
        <div class="stats-bar">
          <div class="stats-info">
            <span class="collect-btn" @click="handleCollect" :class="{ collected: isCollected }">
              <span class="star-icon">{{ isCollected ? '⭐' : '☆' }}</span>
              <span class="collect-text">{{ isCollected ? 'collected' : 'collect' }}</span>
            </span>
            <span class="comments" @click="scrollToComments">💬 {{ selectedBlog?.comments_count }}</span>
            <span class="coins" v-if="selectedBlog?.isNFT">₿ {{ selectedBlog?.coins }}</span>
          </div>

          <div class="quick-comment-input">
            <input type="text" v-model="newComment" placeholder="Add a comment..." @keyup.enter="submitComment" class="comment-input" />
            <button class="submit-quick-comment" @click="submitComment" :disabled="!newComment.trim()">
              <span>💬</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
