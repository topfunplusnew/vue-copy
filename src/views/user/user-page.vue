<script setup lang="ts">
import { ref, reactive, onMounted, computed, nextTick } from 'vue';
import walletItem from '@/components/wallet-item.vue';
import { VueCropper } from 'vue-cropper';
import 'vue-cropper/dist/index.css';
import { useUserStore } from '@/stores/user';
import { useRouter } from 'vue-router';
import { getImageUrl } from '@/utils';
import { ElMessage, ElMessageBox } from 'element-plus';
import type { IUser } from '@/types/user';
import { formatDate } from '@/utils/date';
import '@/styles/_userpage.scss';
import type { IBlogComment } from '@/types/blog';

// import commonHeader from '@/layout/common-header.vue';

const store = useUserStore();
const router = useRouter();

// const userProfile = computed(() => store.user); // user改成这种用法

onMounted(() => {
  store.getUserInfo().then(({data})=>{
    editForm.name = data.name;
    editForm.avatar = data.avatar;
  });
  store.getUserBlogList(true);
});

// 添加登出处理函数
function handleLogout() {
  store.logout();
  router.push({ name: 'login' }); // 跳转到登录页
}

// const user = reactive(userInfo);
const user = computed(() => store.user);

const uploadfile = ref<HTMLElement | null>(null);
function onUpload() {
  showCropper.value = true;
  if(uploadfile.value) uploadfile.value.click();
}

// const totalLikes = computed(() => posts.value.reduce((sum, post) => sum + post.likes, 0));


const postsContainer = ref<HTMLElement | null>(null);

// 用户博客数据
const userPosts = computed(() => store.blogs);

// 博客详情相关的状态和方法
const selectedBlog = computed(() => store.selectedPost);

const isFollowing = ref(false);

const showBlogDetail = (id?: number) => {
  if(!id) return;
  store.getUserBlogByID(id).then(() => {
    if(selectedBlog.value?.user.id) store.isFollowing(selectedBlog.value?.user.id).then(({data}) =>{
      isFollowing.value = data as boolean;
    })
    document.body.style.overflow = 'hidden';
  });
};

function gotoEidtPage(id?:number) {
  if(!id) return;
  router.push({
    name:'PostView',
    params: {id}
  })
}

const closeBlogDetail = () => {
  store.clearSelectedPost();
  document.body.style.overflow = '';
};


function handleScroll() {
  const container = postsContainer.value;
  if (!container) return;
  if (container.scrollTop + container.clientHeight >= container.scrollHeight - 100) {
    // loadPosts();
  }
}

// 头像裁剪相关
const showCropper = ref(false);
const cropperRef = ref();
const cropOption = {
  autoCrop: true, // 是否默认生成截图框
  fixedBox: true, // 固定截图框大小
  outputType: 'png', // 裁剪生成图片的格式
  centerBox: true, // 截图框是否被限制在图片里面
  infoTrue: true, // true 为展示真实输出图片宽高 false 展示看到的截图框宽高
  full: false, // 是否输出原图比例的截图
  canMoveBox: true, // 截图框能否拖动
  original: false, // 上传图片按照原始比例渲染
  canScale: true, // 图片是否允许滚轮缩放
  fixed: true, // 是否开启截图框宽高固定比例
  fixedNumber: [1, 1], // 截图框的宽高比例
};
const cropImage = ref('');


// 修改裁剪完成函数，直接更新头像
function cropSuccess() {
  cropperRef.value.getCropBlob((image: Blob) => {

    // const file = new File([image], 'file', {type: image.type});
    store.uploadImage(image).then(({data}) => {
      editForm.avatar = data.avatar;
    })
    showCropper.value = false;
  });
}


// 添加编辑个人信息相关状态
const showEditProfile = ref(false);
const editForm = reactive({
  name: user.value?.name,
  avatar: user.value?.avatar,
});

// 提交编辑
function submitProfileEdit() {
  store
    .editUserInfo(editForm)
    .then((res) => {
      console.log(res);
    })
    .catch((e) => console.log(e));
  showEditProfile.value = false;
}

// 取消编辑
function cancelProfileEdit() {
  editForm.name = user.value?.name;
  // editForm.id = user.value?.id;
  editForm.avatar = user.value?.avatar; //恢复原头像
  showEditProfile.value = false;
}

// 在编辑页面上传头像
function handleEditAvatarUpload(event: Event) {
  const target = event.target as HTMLInputElement;
  const file = target.files ? target.files[0] : null;
  if(file) {
    console.log(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      cropImage.value = e.target?.result as string;
    }
    reader.readAsDataURL(file);
  }
}

// 添加拖动相关状态和方法
const isDragging = ref(false);
const dragOffset = reactive({ x: 0, y: 0 });
const editProfilePosition = reactive({ x: 0, y: 0 });

function startDrag(e: MouseEvent) {
  isDragging.value = true;
  dragOffset.x = e.clientX - editProfilePosition.x;
  dragOffset.y = e.clientY - editProfilePosition.y;
}

function onDrag(e: MouseEvent) {
  if (isDragging.value) {
    editProfilePosition.x = e.clientX - dragOffset.x;
    editProfilePosition.y = e.clientY - dragOffset.y;
  }
}

function stopDrag() {
  isDragging.value = false;
}

// 修改取消裁剪函数
function cancelCrop() {
  showCropper.value = false;
  // 如果在编辑个人信息中
  if (showEditProfile.value) {
    editForm.avatar = user.value?.avatar; // 恢复原头像
  }
}

// 添加钱包连接状态（这里假设从某个store或props获取）
const isWalletConnected = computed(() => {
  // 根据实际情况返回钱包连接状态
  // return !!user.value?.walletAddress;
  return false;
});

// 添加图片导航相关状态
const currentImageIndex = ref(0);

// 添加图片导航方法
function prevImage() {
  if (selectedBlog.value?.image && selectedBlog.value.image.length > 1) {
    currentImageIndex.value = (currentImageIndex.value - 1 + selectedBlog.value.image.length) % selectedBlog.value.image.length;
  }
}

function nextImage() {
  if (selectedBlog.value?.image && selectedBlog.value.image.length > 1) {
    currentImageIndex.value = (currentImageIndex.value + 1) % selectedBlog.value.image.length;
  }
}

// 添加编辑模式状态
const isEditMode = ref(false);
const selectedBlogId = ref<number | null>(null);

// 切换编辑模式
const toggleEditMode = () => {
  isEditMode.value = !isEditMode.value;
  if (!isEditMode.value) {
    selectedBlogId.value = null;
  }
};

// 删除博客
const deleteBlog = async (blogId?: number) => {
  if(!blogId) return;
  try {
    await ElMessageBox.confirm(
      'Are you sure you want to delete this blog post?',
      'Warning',
      {
        confirmButtonText: 'Delete',
        cancelButtonText: 'Cancel',
        type: 'warning',
      }
    );

    await store.delUserBlogByID(blogId);
    ElMessage.success('Blog deleted successfully');
    store.getUserBlogList(true); // 刷新博客列表
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('Failed to delete blog');
    }
  }
};

// 编辑博客

// 评论功能
const newComment = ref('');

const submitComment = async () => {
  if (!newComment.value.trim()) return;
  if (!selectedBlog.value?.id) return;

  // 用户已登录不用检查登录状态
  store.commenttoBlog(selectedBlog.value?.id, newComment.value).then(res=>{
    console.log(res);
  }).catch(e=>{
    console.log(e);
  }).finally(()=>{
    // 清空输入
    newComment.value = '';
    if(selectedBlog.value?.id) store.getUserBlogByID(selectedBlog.value?.id);

    // 滚动到新评论
    nextTick(() => {
      scrollToComments();
    });
  });

  // 模拟添加评论
  ElMessage({
    message: 'Comment submitted successfully!',
    type: 'success'
  });

  newComment.value = '';
}



// 评论相关的状态

// 评论长按删除功能
const longPressTimeout = ref();
const longPressDuration = 800; // 长按时间阈值，单位为毫秒
const activeComment = ref();

// 长按开始处理函数
const handleTouchStart = (comment:IBlogComment) => {
  console.log(comment);
  // 检查是否是当前用户的评论
  const currentUser = store.user;

  // 如果不是当前用户的评论，不允许删除
  if (!comment || !currentUser || comment.user.id !== currentUser.id) {
    return;
  }

  longPressTimeout.value = setTimeout(() => {
    activeComment.value = comment.id;
  }, longPressDuration);
};

// 长按结束处理函数
const handleTouchEnd = () => {
  if (longPressTimeout.value) {
    clearTimeout(longPressTimeout.value);
    longPressTimeout.value = null;
  }
};

// 移动时取消长按
const handleTouchMove = () => {
  if (longPressTimeout.value) {
    clearTimeout(longPressTimeout.value);
    longPressTimeout.value = null;
  }
};

// 确认删除评论
const confirmDeleteComment = async (commentId?:number) => {
  if(!commentId) return;
  try {
    // 调用删除评论API
    await store.userDeleteComment(commentId);

    // 刷新博客数据以更新评论列表
    if(selectedBlog.value?.id) {
      await store.getUserBlogByID(selectedBlog.value.id);
    }

    ElMessage.success('Comment deleted successfully');
  } catch (error) {
    console.error('Failed to delete comment:', error);
    ElMessage.error('Failed to delete comment');
  } finally {
    activeComment.value = undefined;
  }
};

// 取消删除操作
const cancelDeleteComment = () => {
  activeComment.value = undefined;
};
// const activeCommentId = ref<number | null>(null);
const replyContent = ref('');
const isSubmittingReply = ref(false);
// 展开回复相关的状态

// 添加回复目标状态
const replyTarget = ref<{id: number, type: string, parentId?: number} | null>(null);

// 切换回复输入框显示状态
const toggleReplyInput = (id: number|undefined, type: string = 'comment', parentId?: number) => {
  if (!id) return;
  // 如果当前已经是在回复这个评论/回复，则关闭回复框
  if (replyTarget.value &&
      replyTarget.value.id === id &&
      replyTarget.value.type === type) {
    replyTarget.value = null;
    replyContent.value = '';
  } else {
    // 否则打开回复框
    if (type === 'reply' && !parentId) {
      console.error('回复需要提供父评论ID');
      return;
    }

    replyTarget.value = {
      id,
      type,
      parentId
    };

    // 添加延迟滚动到回复框，确保DOM已更新
    nextTick(() => {
      // 滚动到回复框
      const replyInputContainer = document.querySelector('.reply-input-container-home');
      if (replyInputContainer) {
        replyInputContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    });

    replyContent.value = '';
  }
};

// 取消回复
const cancelReply = () => {
  replyTarget.value = null;
  replyContent.value = '';
};
// 展开查看所有回复
const expandReplies = async (commentId: number|undefined) => {
  // 如果需要调用API加载更多回复，可以在这里添加
  // await store.loadAllRepliesForComment(selectedBlog.value.id, commentId);
  if (commentId) store.getComments(commentId);
  // 标记该评论已展开
  // expandedComments.value.push(commentId);
};
// 提交回复
const submitReply = async () => {
  if (!replyContent.value.trim()) return;

  isSubmittingReply.value = true;
  try {


    if(replyTarget.value?.id) await store.commenttoComment(replyTarget.value.id, replyContent.value);
    ElMessage.success('Reply added successfully');
    if(selectedBlog.value?.id)store.getUserBlogByID(selectedBlog.value?.id);
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
  const detailRight = document.querySelector('.detail-right');

  if (commentsSection && detailRight) {
    detailRight.scrollTo({
      top: commentsSection.offsetTop - 20,
      behavior: 'smooth'
    });
  }
}

// 添加社交弹窗相关的状态和方法
const isSocialModalVisible = ref(false);
const followings = computed(() => store.followings);
const followers = computed(() => store.followers);
const loadingFollowings = ref(false);
const loadingFollowers = ref(false);

// 显示社交弹窗
function showSocialModal() {
  isSocialModalVisible.value = true;
  document.body.style.overflow = 'hidden'; // 防止背景滚动

  // 加载数据
  store.getFollowings();
  store.getFollowers();
}

// 关闭社交弹窗
function closeSocialModal() {
  isSocialModalVisible.value = false;
  document.body.style.overflow = ''; // 恢复背景滚动
}

// 取消关注用户
function unfollowUser(following:IUser) {
  ElMessageBox.confirm(
    `Are you sure you want to unfollow ${following.name}?`,
    'Confirm Unfollow',
    {
      confirmButtonText: 'Unfollow',
      cancelButtonText: 'Cancel',
      type: 'warning'
    }
  ).then(() => {
    // 模拟API调用
    if(following.id) store.unfollow(following.id).then(() => isFollowing.value = false);
    ElMessage.success(`You have unfollowed ${following.name}`);
  });
}

// 切换关注状态
function toggleFollowUser(follower:IUser) {
  store.isFollowing(follower.id||0).then(({data}) =>{
    if(data) {
      unfollowUser(follower)
      isFollowing.value = false;
    } else {
      if(follower.id) store.follow(follower.id).then(() => isFollowing.value = true);
    }
  });
}

// 添加导航菜单状态管理
const menuActive = ref(false);

// 切换菜单显示
const toggleMenu = () => {
  menuActive.value = !menuActive.value;
};
</script>

<template>

  <div class="user-page">
    <!-- 顶部导航栏 -->
    <header class="header-userpage">
      <div class="nav-container-userpage" :class="{ 'menu-active-userpage': menuActive }">
        <div class="nav-left">
          <!-- 汉堡菜单按钮 -->
          <button class="hamburger-menu-userpage" @click="toggleMenu">
            <span v-if="menuActive">✕</span>
            <span v-else>☰</span>
          </button>

          <div class="left-nav-userpage" :class="{ 'active-userpage': menuActive }">
            <router-link :to="{ name: 'home' }">
              <el-button class="nav-button-userpage">HOME</el-button>
            </router-link>
            <router-link :to="{ name: 'about' }">
              <el-button class="nav-button-userpage">ABOUT</el-button>
            </router-link>
            <router-link :to="{ name: 'blog' }">
              <el-button class="nav-button-userpage">BLOG</el-button>
            </router-link>
            <router-link :to="{ name: 'contact' }">
              <el-button class="nav-button-userpage">CONTACT</el-button>
            </router-link>
            <wallet-item />
          </div>
        </div>

        <div class="nav-edit">
          <el-button
            class="edit-mode-btn"
            :type="isEditMode ? 'primary' : 'default'"
            @click="toggleEditMode"
          >
            {{ isEditMode ? 'Done' : 'EDIT BLOG' }}
          </el-button>
        </div>
      </div>
    </header>

    <!-- 主体内容，使用 flex 布局让左侧个人信息 & 右侧博客并排 -->
    <section class="main-content">
      <!-- 左侧用户信息面板 -->
      <aside class="sidebar" :class="{ 'wallet-connected': isWalletConnected }">
        <div class="profile-buttons">
          <button class="edit-profile-btn" @click="showEditProfile = true">EDIT PROFILE</button>
          <button class="logout-btn" @click="handleLogout">LOGOUT</button>
        </div>
        <div class="user-info">
          <div class="avatar-section">
            <div class="avatar-container">
              <img :src="getImageUrl(user?.avatar)" alt="User Avatar" class="avatar" />
              <!-- <input type="file" class="upload-avatar" accept="image/*" @change="handleAvatarUpload" /> -->
              <div class="avatar-upload-icon">
                <i class="el-icon-camera"></i>
              </div>
            </div>
          </div>
          <div class="username">{{ user?.name }}</div>
          <div class="user-id">ID: {{ user?.id }}</div>
          <div class="registration-time">Joined: {{ user?.created_at }}</div>
          <!-- Likes / Coins -->
          <div class="stats">
            <div class="stat">
              <span class="number">{{ user?.likes }}</span>
              <span class="label">Likes</span>
            </div>
            <!-- <div class="stat">
              <span class="number">{{ user?.coins }}</span>
              <span class="label">Coins</span>
            </div> -->
          </div>
          <!-- Following / Followers -->
          <div class="follow-stats-row">
            <div class="follow-item">
              <span class="number">{{ user?.followings }}</span>
              <span class="follow-link" @click="showSocialModal">
                <span class="link-text">Following</span>
              </span>
            </div>
            <div class="follower-item">
              <span class="number">{{ user?.followers }}</span>
              <span class="follower-link" @click="showSocialModal">
                <span class="link-text">Followers</span>
              </span>
            </div>
          </div>
        </div>
      </aside>

      <!-- 垂直分割线，与 sidebar 同高 (100vh) -->
      <div class="vertical-divider-us"></div>

      <!-- 右侧博客列表区，填满剩余宽度 -->
      <section class="blog-area" ref="postsContainer" @scroll="handleScroll">
        <div class="blog-posts">
          <div
            v-for="post in userPosts.items"
            :key="post.id"
            class="blog-post"
            :class="{
              'nft-post': post.isNFT,
              'edit-mode': isEditMode
            }"
            @click="isEditMode ? null : showBlogDetail(post.id)"
          >
            <!-- 编辑模式下的操作按钮 -->
            <div v-if="isEditMode" class="blog-action-buttons">
              <el-button
                type="danger"
                class="delete-blog-btn"
                @click.prevent.stop="deleteBlog(post.id)"
              >
                Delete
              </el-button>
              <el-button
                type="primary"
                class="edit-blog-btn"
                @click.prevent.stop="gotoEidtPage(post.id)"
              >
                Edit
              </el-button>
            </div>

            <!-- 原有的博客内容 -->
            <img v-if="post.image && post.image.length > 0" :src="getImageUrl(post.image[0])" alt="Blog Image" class="post-image" />

            <!-- 博客内容 -->
            <div class="post-content-userpage">
              <h2 class="post-title-userpage">{{ post.title }}</h2>
              <p class="post-text-userpage">{{ post.content }}</p>
            </div>

            <!-- 博客底部信息 -->
            <div class="post-footer-userpage">
              <!-- 作者信息 -->
              <div class="author-info">
                <img v-if="post.user?.avatar" :src="getImageUrl(post.user.avatar)" alt="Avatar" class="post-avatar" />
                <span class="author-name">{{ post.user?.name }}</span>
              </div>

              <!-- 统计信息 -->
              <div class="post-stats">
                <span class="likes">❤️ {{ post.likes }}</span>
                <span class="comments">💬 {{ post.comments_count }}</span>
                <span class="coins" v-if="post.isNFT">₿ {{ post.coins }}</span>
              </div>
            </div>
          </div>
        </div>
        <!-- 底部加载提示 -->
        <div v-if="userPosts.loading" class="loading">Loading more posts...</div>
        <div v-if="!userPosts.has_next" class="no-more">No more posts</div>
      </section>
    </section>

    <!-- 裁剪弹窗 -->
    <div v-if="false" class="cropper-modal">
      <div class="cropper-container">
        <div class="cropper-buttons">
          <el-button @click="cropSuccess">Confirm</el-button>
          <el-button @click="cancelCrop">Cancel</el-button>
        </div>
      </div>
    </div>
    <el-dialog
      v-model="showCropper"
      class="crop-dialog"
      title="Edit Avatar"
      :close-on-click-modal="true"
      :show-close="true"
      destroy-on-close
    >
      <div class="avatar-cut">
        <vue-cropper
          ref="cropperRef"
          :img="cropImage"
          v-bind="cropOption"
        />

      </div>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="cropSuccess">Confirm</el-button>
          <el-button @click="cancelCrop">Cancel</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 编辑个人信息弹窗 -->
    <div class="edit-profile-modal" v-if="showEditProfile">
      <div
        class="edit-profile-container"
        :style="{
          transform: `translate(${editProfilePosition.x}px, ${editProfilePosition.y}px)`,
        }"
        @mousedown="startDrag"
        @mousemove="onDrag"
        @mouseup="stopDrag"
        @mouseleave="stopDrag"
      >
        <h2>Edit Profile</h2>
        <input ref="uploadfile" style="display: none;" type="file" class="upload-avatar" accept="image/*" @change="handleEditAvatarUpload" />
        <div class="edit-avatar-section avatar-container">
          <img :src="getImageUrl(editForm.avatar)" alt="Edit Avatar" class="edit-avatar" />
          <div class="avatar-upload-icon">
            <i class="el-icon-camera" @click.prevent.stop="onUpload">edit</i>
          </div>
        </div>
        <div class="edit-form">
          <div class="form-group">
            <label>Nickname</label>
            <input v-model="editForm.name" type="text" placeholder="Enter your nickname" />
          </div>
        </div>
        <div class="edit-buttons">
          <el-button @click="submitProfileEdit">Save Changes</el-button>
          <el-button @click="cancelProfileEdit">Cancel</el-button>
        </div>
      </div>
    </div>

    <!-- 添加社交关系弹窗 -->
    <div v-if="isSocialModalVisible" class="social-modal-overlay" @click.self="closeSocialModal">
      <div class="social-modal-container">
        <button class="social-modal-close" @click="closeSocialModal">&times;</button>

        <div class="social-modal-content">
          <!-- 左侧：Following 列表 -->
          <div class="social-modal-column following-column">
            <h3 class="social-modal-title">Following ({{ user?.followings || 0 }})</h3>

            <div v-if="loadingFollowings" class="social-loading">
              <div class="loading-spinner"></div>
              <p>Loading followings...</p>
            </div>

            <div v-else-if="followings.length === 0" class="social-empty">
              <div class="empty-icon">👤</div>
              <p>Not following anyone yet</p>
            </div>

            <div v-else class="social-user-list">
              <div v-for="following in followings" :key="following.id" class="social-user-item">
                <img :src="`/images/${following.avatar}`" :alt="`${following.name}'s avatar`" class="social-user-avatar">
                <div class="social-user-info">
                  <div class="social-user-name">{{ following.name }}</div>
                  <div class="social-user-meta">Following since {{ formatDate(following.created_at) }}</div>
                </div>
                <button class="social-action-btn following" @click="unfollowUser(following)">
                  Unfollow
                </button>
              </div>
            </div>
          </div>

          <!-- 右侧：Followers 列表 -->
          <div class="social-modal-column followers-column">
            <h3 class="social-modal-title">Followers ({{ user?.followers || 0 }})</h3>

            <div v-if="loadingFollowers" class="social-loading">
              <div class="loading-spinner"></div>
              <p>Loading followers...</p>
            </div>

            <div v-else-if="followers.length === 0" class="social-empty">
              <div class="empty-icon">👥</div>
              <p>No followers yet</p>
            </div>

            <div v-else class="social-user-list">
              <div v-for="follower in followers" :key="follower.id" class="social-user-item">
                <img :src="follower.avatar" :alt="`${follower.name}'s avatar`" class="social-user-avatar">
                <div class="social-user-info">
                  <div class="social-user-name">{{ follower.name }}</div>
                  <div class="social-user-meta">Following since {{ formatDate(follower.created_at) }}</div>
                </div>
                <button
                  class="social-action-btn"
                  :class="{ 'following': isFollowing }"
                  @click="toggleFollowUser(follower)"
                >
                  {{ isFollowing ? 'Following' : 'Follow' }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- 博客详情弹出层 -->
  <div class="blog-detail-overlay" v-if="selectedBlog" @click.self="closeBlogDetail">
    <div class="blog-detail-container" :class="{ 'nft-post': selectedBlog?.isNFT }">
      <!-- 关闭按钮移到容器顶层 -->
      <button class="close-button" @click="closeBlogDetail">×</button>

      <!-- 左侧区域：图片和统计信息 -->
      <div class="detail-left">
        <!-- 图片区域 -->
        <div class="image-section">
          <div class="image-slider">
            <div class="image-wrapper" :style="{ transform: `translateX(-${currentImageIndex * 100}%)` }">
              <img
                v-for="(image, index) in selectedBlog?.image"
                :key="index"
                :src="getImageUrl(image)"
                alt="Blog Image"
                class="detail-image"
              />
            </div>
            <!-- 导航按钮 -->
            <button class="nav-btn prev" @click="prevImage" v-if="selectedBlog?.image?.length > 1">❮</button>
            <button class="nav-btn next" @click="nextImage" v-if="selectedBlog?.image?.length > 1">❯</button>
          </div>
        </div>

        <!-- 统计信息栏 -->
        <div class="stats-bar">
          <!-- 统计信息 -->
          <div class="stats-info">
            <span class="likes">❤️ {{ selectedBlog.likes }}</span>
            <span class="comments" @click="scrollToComments">💬 {{ selectedBlog.comments_count }}</span>
            <span class="coins" v-if="selectedBlog.isNFT">₿ {{ selectedBlog.coins }}</span>
          </div>
        </div>

        <!-- 简化的评论输入框 -->
        <div class="quick-comment-input">
            <input
              type="text"
              v-model="newComment"
              placeholder="Add a comment..."
              @keyup.enter="submitComment"
              class="comment-input-home"
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

      <!-- 右侧内容区域 -->
      <div class="detail-right" ref="detailRight">
        <!-- 用户信息和标题 -->
        <div class="user-header">
          <div class="author-info">
            <img
              :src="getImageUrl(selectedBlog?.user?.avatar || '')"
              alt="Author Avatar"
              class="author-avatar"
            />
            <span class="author-name">{{ selectedBlog?.user?.name }}</span>
          </div>
          <h2 class="blog-title">{{ selectedBlog.title }}</h2>
          <!-- 偏好标签区域 -->
          <div class="tags-section-pref-userpage" v-if="selectedBlog?.social_filters">
            <span v-for="(item, index) in selectedBlog?.social_filters"
            :key="index" class="tag-pref-userpage">
              {{ item.name }} {{ item.icon }}
            </span>
          </div>
        </div>

        <!-- 标签区域 -->
        <div class="tags-section">
          <div class="nft-tag" v-if="selectedBlog.isNFT">NFT</div>
          <span class="tag" v-for="tag in selectedBlog?.tags" :key="tag">
            {{ tag }}
          </span>
        </div>

        <!-- 博客内容 -->
        <div class="content-section">
          <p class="blog-content">{{ selectedBlog.content }}</p>
        </div>

        <!-- 评论部分 -->
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
                <span class="comment-username">{{ comment.user.name }}</span>
                <p class="comment-text">{{ comment.content }}</p>

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
                      <div class="reply-header">
                        <span class="reply-username-home">{{ reply.user.name }}</span>
                        <span class="replying-to">replying to</span>
                        <span class="target-name-show">@{{ comment.user.name }}</span>
                        <div class="reply-content-wrapper">
                          <p class="reply-text-home"
                            @click.stop.prevent="toggleReplyInput(reply.id, 'reply', comment.id)">{{ reply.content }}</p>
                          <!-- 回复到回复的图标 -->
                          <el-tooltip content="Reply to this reply" placement="top">
                            <span class="reply-icon-reply-to-reply"
                            @click.stop.prevent="toggleReplyInput(reply.id, 'reply', comment.id)">↩️</span>
                          </el-tooltip>
                        </div>
                      </div>
                    </div>
                  </div>
                  <!-- 添加查看更多回复按钮 -->
                </div>
                <div v-if="comment.total_replies > 2 && comment.total_replies !== comment.replies.length"
                    class="view-more-replies" @click="expandReplies(comment.id)">
                  <span class="view-more-text-r2r">
                  View {{ comment.total_replies - 2 }} more {{ comment.total_replies - 2 === 1 ? 'reply' : 'replies' }}
              </span>
                  <span class="view-more-icon-r2r">↓</span>
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
      </div>
    </div>
  </div>
</template>


