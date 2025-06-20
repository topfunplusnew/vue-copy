<script setup lang="ts">
import { ref, computed, nextTick } from 'vue';
import { useUserStore } from '@/stores/user';
import { ElMessage } from 'element-plus';
import type { IBlogComment, IBlog } from '@/types/blog';
import { getImageUrl } from '@/utils';

// Props 定义
interface Props {
  blog: IBlog;
  isFollowing: boolean;
}

const props = defineProps<Props>();

// Emits 定义
const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'toggle-follow'): void;
}>();

const store = useUserStore();

const selectedBlog = computed(() => props.blog);

// Comment functionality
const newComment = ref('');
const submitComment = async () => {
  if (!newComment.value.trim()) return;
  if (!selectedBlog.value?.id) return;

  try {
    await store.commenttoBlog(selectedBlog.value.id, newComment.value);
    newComment.value = '';
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
  if(!commentId) return;
  try {
    await store.userDeleteComment(commentId);
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
const replyTarget = ref<{id: number, type: string, parentId?: number} | null>(null);

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

const expandReplies = async (commentId?: number) => {
  if (commentId) {
    console.log('Expand replies for comment:', commentId);
  }
};

const collapseComments = async (commentId?: number) => {
  if (commentId) {
    console.log('Collapse comments for comment:', commentId);
  }
};

const submitReply = async () => {
  if (!replyContent.value.trim()) return;

  isSubmittingReply.value = true;
  try {
    if(replyTarget.value?.id) {
      await store.commenttoComment(replyTarget.value.id, replyContent.value);
    }
    ElMessage.success('Reply added successfully');
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
    commentsSection.scrollIntoView({
      behavior: 'smooth',
      block: 'start'
    });
  }
}

const handleFollowClick = async () => {
  emit('toggle-follow');
};

const isOwnPost = computed(() => {
  const user = store.user;
  const blogUser = selectedBlog.value?.user;
  return user && blogUser && user.id === blogUser.id;
});
</script>

<template>
  <div class="blog-detail-overlay" @click.self="$emit('close')">
    <div class="blog-detail-container" :class="{ 'nft-post': selectedBlog?.isNFT }">
      <button class="close-button" @click="$emit('close')">×</button>

      <div class="detail-left">
        <el-carousel
          v-if="selectedBlog?.image && selectedBlog.image.length > 0"
          :interval="5000"
          class="image-section"
          height="100%"
          :touchable="true"
          :loop="true"
          :autoplay="false"
        >
          <el-carousel-item
            v-for="(image, index) in selectedBlog.image"
            :key="index"
          >
            <div class="image-slider">
              <div
                class="image-wrapper"
              >
                <img
                  :src="getImageUrl(image)"
                  alt="Blog Image"
                  class="detail-image"
                />
              </div>
            </div>
          </el-carousel-item>
        </el-carousel>
      </div>

        <div class="detail-right">
          <div class="detail-right-content">
            <div class="user-header">
              <div class="author-info">
                <img
                  :src="getImageUrl(selectedBlog?.user?.avatar || '')"
                  alt="Author Avatar"
                  class="author-avatar"
                />
                <span class="author-name">{{ selectedBlog?.user?.name }}</span>

                <el-button
                  v-if="!isOwnPost"
                  class="follow-btn"
                  size="small"
                  :class="{ 'following': props.isFollowing }"
                  @click.stop="handleFollowClick"
                >
                  <span class="follow-icon">+</span>
                  <span class="follow-text">{{ props.isFollowing ? 'Following' : 'Follow' }}</span>
                </el-button>
                <!-- 编辑按钮 -->
                <!-- <el-button
                  v-else
                  class="edit-btn"
                  size="small"
                  @click="handleEditClick"
                >
                  <span class="edit-icon">✏️</span>
                  <span class="edit-text">Edit</span>
                </el-button> -->
              </div>
              <div class="tags-section-pref-userpage" v-if="selectedBlog?.social_filters">
                <span v-for="(item, index) in selectedBlog?.social_filters"
                :key="index" class="tag-pref-userpage">
                  {{ item.name }} {{ item.icon }}
                </span>
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

            <div class="comments-container" ref="commentsSection">
              <div class="comments-header">
                <h3>Comments</h3>
                <span class="comment-count">{{ selectedBlog?.comments?.length || 0 }}</span>
              </div>
              <div class="comments-list">
                <div v-for="comment in selectedBlog?.comments" :key="comment.id" class="comment-item">
                  <div class="comment-row"
                      :class="{'long-press-active': activeComment === comment.id}"
                      @touchstart.stop="handleTouchStart(comment)"
                      @touchend.stop="handleTouchEnd"
                      @touchmove.stop="handleTouchMove"
                      @mousedown="handleTouchStart(comment)"
                      @mouseup="handleTouchEnd"
                      @mouseleave="handleTouchEnd">
                    <img
                      :src="getImageUrl(comment.user.avatar)"
                      alt="Commenter Avatar"
                      class="comment-avatar"
                    />
                    <div class="comment-content-wrapper">
                      <span class="comment-username">{{ comment.user.name }}</span>
                      <p class="comment-text" @click.stop.prevent="toggleReplyInput(comment.id, 'comment')">
                        {{ comment.content }}
                      </p>
                    </div>
                    <!-- 删除指示器 -->
                    <div class="delete-indicator" :class="{'visible': activeComment === comment.id}">
                      <i class="el-icon-delete"></i>
                    </div>
                    <!-- 删除确认浮层 -->
                    <div class="delete-confirm-overlay" :class="{'visible': activeComment === comment.id}" @click="console.log(123)">
                      <div class="delete-message">Delete this comment?</div>
                      <div class="delete-actions">
                        <button class="delete-btn-rp" @click.stop="confirmDeleteComment(comment.id)">Delete</button>
                        <button class="cancel-btn-rp" @click.stop="cancelDeleteComment">Cancel</button>
                      </div>
                    </div>
                  </div>
                  <!-- 显示评论的回复 -->
                  <div
                    v-if="comment.replies && comment.replies.length > 0"
                    class="comment-replies-home"
                  >
                    <div v-for="reply in comment.replies" :key="reply.id"
                    class="reply-item">
                      <div class="reply-row"
                        :class="{'long-press-active': activeComment === reply.id}"
                        @touchstart.prevent="handleTouchStart(reply)"
                        @touchend.prevent="handleTouchEnd"
                        @touchmove.prevent="handleTouchMove"
                        @mousedown="handleTouchStart(reply)"
                        @mouseup="handleTouchEnd"
                        @mouseleave="handleTouchEnd"
                      >
                        <img
                          :src="getImageUrl(reply.user.avatar)"
                          alt="Replier Avatar"
                          class="reply-avatar"
                        />
                        <div class="reply-info">
                          <!-- 顶部显示用户名和 replying to -->
                          <div class="reply-header-line">
                            <span class="reply-username-home">{{ reply.user.name }}</span>
                            <span class="target-name-show">@{{ comment.user.name }}</span>
                          </div>

                          <!-- 回复内容 -->
                          <div class="reply-content-wrapper">
                            <p class="reply-text-home"
                              @click.stop.prevent="toggleReplyInput(reply.id, 'reply', comment.id)">
                              {{ reply.content }}
                            </p>
                          </div>
                        </div>
                      </div>
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
                  <!-- 显示更多回复 -->
                  <div v-if="comment.total_replies > 2 && comment.total_replies !== comment.replies.length"
                        class="view-more-replies" @click="expandReplies(comment.id)">
                      <span class="view-more-text-r2r">
                      View {{ comment.total_replies - 2 }} more {{ comment.total_replies - 2 === 1 ? 'reply' : 'replies' }}
                      </span>
                      <span class="view-more-icon-r2r">↓</span>
                    </div>

                    <!-- 隐藏回复 -->
                    <div v-if="comment.total_replies > 2 && comment.replies.length === comment.total_replies"
                        class="view-more-replies"
                        @click="collapseComments(comment.id)">
                      <span class="hide-replies-text-r2r">Hide {{ comment.total_replies - 2 === 1 ? 'reply' : 'replies' }}</span>
                      <span class="hide-replies-icon-r2r">↑</span>
                    </div>
                </div>
              </div>
            </div>
          </div>
          <div class="stats-bar">
            <div class="stats-info">
              <span class="likes" >❤️ {{ selectedBlog?.likes }}</span>
              <span class="comments" @click="scrollToComments">💬 {{ selectedBlog?.comments_count }}</span>
              <span class="coins" v-if="selectedBlog?.isNFT">₿ {{ selectedBlog?.coins }}</span>
            </div>

            <div class="quick-comment-input">
              <input
                type="text"
                v-model="newComment"
                placeholder="Add a comment..."
                @keyup.enter="submitComment"
                class="comment-input"
              />
              <button
                class="submit-quick-comment"
                @click="submitComment"
                :disabled="!newComment.trim()"
              >
                <span>💬</span>
              </button>
            </div>
          </div>
        </div>
    </div>
  </div>
</template>

