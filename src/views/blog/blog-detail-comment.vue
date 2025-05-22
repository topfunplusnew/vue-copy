<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue';
import { ElMessage } from 'element-plus';
import { useBlogStore } from '@/stores/blog';
import { useUserStore } from '@/stores/user';
import { getImageUrl } from '@/utils';
import type { IBlogComment } from '@/types/blog';


// const store = useBlogStore();
// const userStore = useUserStore();

// 新增：自动更新时间显示的定时器
let timeUpdateInterval: number;
onMounted(() => {
  timeUpdateInterval = window.setInterval(() => {
    // 这个空interval只是为了触发重新计算相对时间
  }, 60000); // 每分钟更新一次
});

onUnmounted(() => {
  if (timeUpdateInterval) {
    clearInterval(timeUpdateInterval);
  }
});

// function formatDate(dateStr?: string): string {
//   if (!dateStr) return '';
//   const date = new Date(dateStr);
//   if (isNaN(date.getTime())) return ''; // 日期无效
//   const yyyy = date.getFullYear();
//   const mm = String(date.getMonth() + 1).padStart(2, '0');
//   const dd = String(date.getDate()).padStart(2, '0');
//   const hh = String(date.getHours()).padStart(2, '0');
//   const mi = String(date.getMinutes()).padStart(2, '0');
//   return `${yyyy}-${mm}-${dd} ${hh}:${mi}`;
// }


const store = useBlogStore();
const userStore = useUserStore();

const selectedBlog = computed(() => store.blog);

// 评论相关的状态
const replyContent = ref('');
const isSubmittingReply = ref(false);
const replyTarget = ref<{id: number, type: string, parentId?: number} | null>(null);


// 长按删除相关
const longPressTimeout = ref();
const longPressDuration = 800;
const activeComment = ref();

// 关注状态
const isFollowing = ref(false);

const isOwnPost = computed(() => {
  if (!userStore.user || !selectedBlog.value?.user) {
    return false;
  }
  return String(userStore.user.id) === String(selectedBlog.value.user.id);
});



const checkFollowStatus = async (userId: number) => {
  try {
    const isFollowed = await userStore.isFollowing(userId);
    isFollowing.value = isFollowed.data.is_following;
  } catch (error) {
    console.error('Failed to check follow status:', error);
  }
};

watch(() => selectedBlog.value, (newBlog) => {
  if (newBlog?.user?.id && !isOwnPost.value) {
    checkFollowStatus(newBlog.user.id);
  } else {
    isFollowing.value = false;
  }
}, { immediate: true });


const toggleReplyInput = (id: number, type: string = 'comment', parentId?: number) => {
  if (!id) return;

  if (replyTarget.value && replyTarget.value.id === id && replyTarget.value.type === type) {
    replyTarget.value = null;
    replyContent.value = '';
  } else {
    if (type === 'reply' && !parentId) {
      console.error('回复需要提供父评论ID');
      return;
    }

    replyTarget.value = {
      id,
      type,
      parentId
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
//二级回复
const submitReply = async () => {
  if (!replyContent.value.trim()) return;

  isSubmittingReply.value = true;
  try {
    if (replyTarget.value?.id) {
      await userStore.commenttoComment(replyTarget.value.id, replyContent.value);
      ElMessage.success('Reply added successfully');
      if (selectedBlog.value?.id) {
        await store.getBlogByID(selectedBlog.value.id);
      }
      replyTarget.value = null;
      replyContent.value = '';
    }
  } catch (error) {
    console.error('Failed to add reply:', error);
    ElMessage.error('Failed to add reply. Please try again.');
  } finally {
    isSubmittingReply.value = false;
  }
};

const expandReplies = async (commentId: number) => {
  if (commentId) {
    await store.getComments(commentId);
  }
};

const collapseComments = async (commentId: number) => {
  if (commentId) {
    await store.collapseComments(commentId);
  }
};

const handleTouchStart = (comment: IBlogComment) => {
  const currentUser = userStore.user;  //获取当前的用户信息
  if (!comment || !currentUser || comment.user.id !== currentUser.id) {
    return;
  }

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
// 删除评论
const confirmDeleteComment = async (commentId?: number) => {
  if (!commentId) return;
  try {
    await userStore.userDeleteComment(commentId);
    if (selectedBlog.value?.id) {
      await store.getBlogByID(selectedBlog.value.id);
    }
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


</script>

<template>
 <div class="comments-container-home" ref="commentsSection">
    <div class="comments-header-home">
      <h3>Comments</h3>
      <div class="comments-actions-home">
        <span class="comment-count-home">{{ selectedBlog?.comments_count || 0 }}</span>
      </div>
    </div>
    <div class="comments-list-home">
      <div  v-for="comment in [...(selectedBlog?.comments || [])].reverse()" :key="comment.id" class="comment-item-home">
        <div class="comment-row-home"
              :class="{'long-press-active': activeComment === comment.id}"
              @touchstart.prevent="handleTouchStart(comment)"
              @touchend.prevent="handleTouchEnd"
              @touchmove.prevent="handleTouchMove"
              @mousedown="handleTouchStart(comment)"
              @mouseup="handleTouchEnd"
              @mouseleave="handleTouchEnd">
          <img
            :src="getImageUrl(comment.user.avatar)"
            alt="Commenter Avatar"
            class="comment-avatar-home"
          />
          <div class="comment-content-wrapper">
            <span class="comment-username-home">{{ comment.user.name }}</span>
            <p class="comment-text-home" style="text-align: start;"
            @click="comment.id && toggleReplyInput(comment.id)">{{ comment.content }}</p>

            <!-- 回复图标 -->
            <div class="comment-actions">
            <!-- <el-tooltip content="Reply to this comment" placement="top">
              <span class="reply-icon"
              @click="comment.id && toggleReplyInput(comment.id)">↩️</span>
            </el-tooltip> -->

            </div>
          </div>
          <!-- 删除指示器 -->
          <div class="delete-indicator" :class="{'visible': activeComment === comment.id}">
            <i class="el-icon-delete" ></i>
          </div>

          <!-- 删除确认浮层 -->
          <div class="delete-confirm-overlay" :class="{'visible': activeComment === comment.id}">
            <div class="delete-message">Delete this comment?</div>
            <div class="delete-actions">
              <button class="delete-btn-rp" @click="confirmDeleteComment(comment.id)">Delete</button>
              <button class="cancel-btn-rp" @click="cancelDeleteComment">Cancel</button>
            </div>
          </div>
        </div>

        <!-- 显示评论的回复 -->
        <div v-if="comment.replies && comment.replies.length > 0"
          class="comment-replies-home">
          <div v-for="reply in comment.replies" :key="reply.id"
                class="reply-item-home">
            <div class="reply-row-home"
            :class="{'long-press-active': activeComment === reply.id}"
              @touchstart.prevent="handleTouchStart(reply)"
              @touchend.prevent="handleTouchEnd"
              @touchmove.prevent="handleTouchMove"
              @mousedown="handleTouchStart(reply)"
              @mouseup="handleTouchEnd"
              @mouseleave="handleTouchEnd">

              <img
                :src="getImageUrl(reply.user.avatar)"
                alt="Replier Avatar"
                class="reply-avatar-home-view"
              />
              <div class="reply-content-wrapper">
                <div class="reply-user-info">
                  <span class="reply-username-home">{{ reply.user.name }}</span>
                  <span class="target-name-show">@{{ comment.user.name }}</span>
                </div>
                <p class="reply-text-home"
                  @click.stop.prevent="reply.id && comment.id && toggleReplyInput(reply.id, 'reply', comment.id)">
                  {{ reply.content }}
                </p>
                  <!-- 回复到回复的图标 -->
                <!-- <el-tooltip content="Reply to this reply" placement="top">
                  <span class="reply-icon-reply-to-reply"
                  @click.stop.prevent="reply.id && comment.id && toggleReplyInput(reply.id, 'reply', comment.id)">↩️</span>
                </el-tooltip> -->
              </div>
            </div>
          </div>
          <!-- 展开 -->
          <div v-if="comment.total_replies > 2 && comment.total_replies !== comment.replies.length"
              class="view-more-replies" @click="comment.id && expandReplies(comment.id)">
            <span class="view-more-text-r2r">
            View {{ comment.total_replies - 2 }} more {{ comment.total_replies - 2 === 1 ? 'reply' : 'replies' }}
            </span>
            <span class="view-more-icon-r2r">↓</span>
          </div>
          <!-- 收起 -->
          <div v-if="comment.total_replies > 2 && comment.replies.length === comment.total_replies"
              class="view-more-replies"
              @click="comment.id && collapseComments(comment.id)">
            <span class="hide-replies-text-r2r">Hide {{ comment.total_replies - 2 === 1 ? 'reply' : 'replies' }}</span>
            <span class="hide-replies-icon-r2r">↑</span>
          </div>
        </div>

        <!-- 回复输入框 -->
        <div class="reply-input-container-home" v-if="replyTarget &&
          ((replyTarget.type === 'comment' && replyTarget.id === comment.id) ||
          (replyTarget.type === 'reply' && replyTarget.parentId === comment.id))">
          <div class="replying-to-label">
            <span>Replying to</span>
            <span class="target-name">@{{
              replyTarget.type === 'comment'
                ? comment.user.name
                : comment.replies.find(r => r.id === replyTarget?.id)?.user.name
            }}</span>
          </div>
          <el-input
            v-model="replyContent"
            type="textarea"
            :rows="1"
            resize="none"
            placeholder="Reply to this comment..."
            maxlength="200"
            show-word-limit
            class="reply-textarea-home"
          ></el-input>
          <div class="reply-actions-home">
            <el-button
              size="small"
              @click="cancelReply"
              class="cancel-reply-btn-home"
            >Cancel</el-button>
            <el-button
              type="primary"
              size="small"
              @click="submitReply"
              :loading="isSubmittingReply"
              :disabled="!replyContent.trim()"
              class="submit-reply-btn-home"
            >Reply</el-button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>



