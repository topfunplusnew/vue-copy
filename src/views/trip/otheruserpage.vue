<script setup lang="ts">
import { ref, reactive, onMounted, computed, nextTick } from 'vue';
import walletItem from '@/components/wallet-item.vue';
import type { IBlogPost } from '@/types/blog';
import { VueCropper } from 'vue-cropper';
import 'vue-cropper/dist/index.css';
import { useUserStore } from '@/stores/user';
import type { IUserEdit } from '@/types/user';
import { useRouter } from 'vue-router';
import { getBlogPost, getMyBlogList, PostAvatar, myblogdelete } from '@/services/api';
import { getImageUrl } from '@/utils';
import { ElMessage, ElMessageBox } from 'element-plus';

const store = useUserStore();
const router = useRouter();

// const userProfile = computed(() => store.user); // user改成这种用法

onMounted(() => {
  store.getUserInfo();
  store.getUserBlogList();
});

// 添加登出处理函数
function handleLogout() {
  store.logout();
  router.push({ name: 'login' }); // 跳转到登录页
}

// const user = reactive(userInfo);
const user = computed(() => store.user);

const posts = ref<IBlogPost[]>([]);
// const totalLikes = computed(() => posts.value.reduce((sum, post) => sum + post.likes, 0));

const page = ref(2);
const perPage = 10;
const loading = ref(false);
const noMorePosts = ref(false);
const postsContainer = ref<HTMLElement | null>(null);

// 用户博客数据
const userPosts = computed(() => store.userPosts);

// 博客详情相关的状态和方法
const selectedBlog = computed(() => store.selectedPost);

const showBlogDetail = (id: number) => {
  store.getUserBlogByID(id).then((res) => {
    document.body.style.overflow = 'hidden';
  });
};

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
const cropImg = ref('');
const cropOption = {
  img: '', // 裁剪图片的地址
  autoCrop: true, // 是否默认生成截图框
  fixedBox: true, // 固定截图框大小
  outputType: 'png', // 裁剪生成图片的格式
  centerBox: true, // 截图框是否被限制在图片里面
  infoTrue: true, // true 为展示真实输出图片宽高 false 展示看到的截图框宽高
  full: false, // 是否输出原图比例的截图
  canMoveBox: false, // 截图框能否拖动
  original: false, // 上传图片按照原始比例渲染
  canScale: true, // 图片是否允许滚轮缩放
  fixed: true, // 是否开启截图框宽高固定比例
  fixedNumber: [1, 1], // 截图框的宽高比例
};

function handleAvatarUpload(event: Event) {
  const target = event.target as HTMLInputElement;
  const file = target.files ? target.files[0] : null;
  if (file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        cropOption.img = e.target.result as string;
        showCropper.value = true;
      }
    };
    reader.readAsDataURL(file);
  }
}

// 修改裁剪完成函数，直接更新头像
function cropSuccess() {
  cropperRef.value.getCropData((data: string) => {
    if (showEditProfile.value) {
      editForm.avatar = data;
    } else {
      user.value.avatar = data; // 直接更新用户头像
    }
    showCropper.value = false;
  });
}

// 修改显示头像的计算属性
const displayAvatar = computed(() => {
  if (user.value?.avatar) return `/images/${user.value?.avatar}`;
  return 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0icmdiYSgxMjgsIDEyOCwgMTI4LCAwLjUpIi8+PC9zdmc+';
});

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
  if (file) {
    const formData = new FormData();
    formData.append('file', file);
    PostAvatar({ image: formData })
      .then((res) => {
        editForm.avatar = res.data.avatar;
        console.log(res);
      })
      .catch((e) => {
        console.log(e);
      });
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
const newComment = ref('');

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
const deleteBlog = async (blogId: number, event: Event) => {
  event.stopPropagation(); // 阻止事件冒泡，避免触发博客详情
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
    store.getUserBlogList(); // 刷新博客列表
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('Failed to delete blog');
    }
  }
};

// 评论功能
function submitComment() {
  if (!newComment.value.trim()) return;
  
  // 创建新评论对象
  const comment = {
    id: Date.now(), // 临时ID
    content: newComment.value,
    user: {
      name: user.value?.name || 'Anonymous',
      avatar: user.value?.avatar || 'default-avatar.jpg'
    },
    create_at: new Date().toISOString()
  };
  
  // 添加到评论列表
  if (!selectedBlog.value.comments) {
    selectedBlog.value.comments = [];
  }
  selectedBlog.value.comments.push(comment);
  
  // 更新评论计数
  selectedBlog.value.comments_count = (selectedBlog.value.comments_count || 0) + 1;
  
  // 清空输入
  newComment.value = '';
  
  // 滚动到新评论
  nextTick(() => {
    scrollToComments();
  });
}

function scrollToComments() {
  const commentsSection = document.querySelector('.comments-container');
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
const followings = ref([]);
const followers = ref([]);
const loadingFollowings = ref(false);
const loadingFollowers = ref(false);

// 显示社交弹窗
function showSocialModal() {
  isSocialModalVisible.value = true;
  document.body.style.overflow = 'hidden'; // 防止背景滚动
  
  // 加载数据
  loadFollowingsData();
  loadFollowersData();
}

// 关闭社交弹窗
function closeSocialModal() {
  isSocialModalVisible.value = false;
  document.body.style.overflow = ''; // 恢复背景滚动
}

// 加载关注列表
async function loadFollowingsData() {
  loadingFollowings.value = true;
  try {
    // 模拟数据
    await new Promise(resolve => setTimeout(resolve, 1000));
    followings.value = Array(user.value.followings || 0).fill(0).map((_, i) => ({
      id: i + 1,
      name: `User ${i + 1}`,
      avatar: `https://randomuser.me/api/portraits/${i % 2 ? 'men' : 'women'}/${i + 1}.jpg`,
      follow_time: new Date(Date.now() - i * 86400000).toISOString()
    }));
  } catch (error) {
    console.error('Failed to load followings:', error);
  } finally {
    loadingFollowings.value = false;
  }
}

// 加载粉丝列表
async function loadFollowersData() {
  loadingFollowers.value = true;
  try {
    // 模拟数据
    await new Promise(resolve => setTimeout(resolve, 1500));
    followers.value = Array(user.value.followers || 0).fill(0).map((_, i) => ({
      id: 100 + i,
      name: `Follower ${i + 1}`,
      avatar: `https://randomuser.me/api/portraits/${i % 2 ? 'women' : 'men'}/${10 + i}.jpg`,
      follow_time: new Date(Date.now() - i * 86400000).toISOString(),
      is_following: i % 3 === 0 // 随机设置一些已关注状态
    }));
  } catch (error) {
    console.error('Failed to load followers:', error);
  } finally {
    loadingFollowers.value = false;
  }
}

// 取消关注用户
function unfollowUser(following) {
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
    setTimeout(() => {
      ElMessage.success(`You have unfollowed ${following.name}`);
      
      // 从列表中移除
      followings.value = followings.value.filter(f => f.id !== following.id);
      
      // 更新计数
      if (user.value) {
        user.value.followings = (user.value.followings || 0) - 1;
      }
    }, 500);
  }).catch(() => {
    // 用户取消操作
  });
}

// 切换关注状态
function toggleFollowUser(follower) {
  if (follower.is_following) {
    // 取消关注
    ElMessageBox.confirm(
      `Are you sure you want to unfollow ${follower.name}?`,
      'Confirm Unfollow',
      {
        confirmButtonText: 'Unfollow',
        cancelButtonText: 'Cancel',
        type: 'warning'
      }
    ).then(() => {
      // 模拟API调用
      setTimeout(() => {
        follower.is_following = false;
        
        // 更新计数
        if (user.value) {
          user.value.followings = (user.value.followings || 0) - 1;
        }
        
        // 从followings列表中移除
        followings.value = followings.value.filter(f => f.id !== follower.id);
        
        ElMessage.success(`You have unfollowed ${follower.name}`);
      }, 500);
    }).catch(() => {
      // 用户取消操作
    });
  } else {
    // 关注
    // 模拟API调用
    setTimeout(() => {
      follower.is_following = true;
      
      // 更新计数
      if (user.value) {
        user.value.followings = (user.value.followings || 0) + 1;
      }
      
      // 添加到followings列表
      const newFollowing = {
        id: follower.id,
        name: follower.name,
        avatar: follower.avatar,
        follow_time: new Date().toISOString()
      };
      followings.value.unshift(newFollowing);
      
      ElMessage.success(`Now following ${follower.name}`);
    }, 500);
  }
}

// 格式化日期
function formatDate(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  });
}
</script>

<template>
  <div class="otheruser-page">
    <!-- 顶部 Header -->
    <header class="header">
      <div class="nav-container">
        <div class="left-nav">
          <router-link :to="{ name: 'home' }">
            <el-button class="nav-button">HOME</el-button>
          </router-link>
          <router-link :to="{ name: 'about' }">
            <el-button class="nav-button">ABOUT</el-button>
          </router-link>
          <router-link :to="{ name: 'blog' }">
            <el-button class="nav-button">BLOG</el-button>
          </router-link>
          <router-link :to="{ name: 'contact' }">
            <el-button class="nav-button">CONTACT</el-button>
          </router-link>
          <wallet-item />
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
      <!-- 左侧用户信息面板，固定宽度 & 100vh 高度 -->
      <aside class="sidebar" :class="{ 'wallet-connected': isWalletConnected }">
        <div class="profile-buttons">
          <button class="edit-profile-btn" @click="showEditProfile = true">EDIT PROFILE</button>
          <button class="logout-btn" @click="handleLogout">LOGOUT</button>
        </div>
        <div class="user-info">
          <div class="avatar-section">
            <div class="avatar-container">
              <img :src="displayAvatar" alt="User Avatar" class="avatar" />
              <!-- <input type="file" class="upload-avatar" accept="image/*" @change="handleAvatarUpload" /> -->
              <div class="avatar-upload-icon">
                <i class="el-icon-camera"></i>
              </div>
            </div>
          </div>
          <div class="username">{{ user?.name }}</div>
          <div class="user-id">ID: {{ user?.id }}</div>
          <div class="registration-time">Joined: {{ user?.create_at }}</div>
          <!-- Likes / Coins -->
          <div class="stats">
            <div class="stat">
              <span class="number">{{ user?.likes }}</span>
              <span class="label">Likes</span>
            </div>
            <div class="stat">
              <span class="number">{{ user?.coins }}</span>
              <span class="label">Coins</span>
            </div>
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
            v-for="post in userPosts" 
            :key="post.id" 
            class="blog-post"
            :class="{ 
              'nft-post': post.isNFT,
              'edit-mode': isEditMode 
            }"
            @click="isEditMode ? null : showBlogDetail(post.id)"
          >
            <!-- 编辑模式下显示的删除按钮 -->
            <div v-if="isEditMode" class="edit-controls">
              <el-button
                type="danger"
                circle
                size="small"
                class="delete-btn"
                @click="(e) => deleteBlog(post.id, e)"
              >
                <i class="el-icon-delete"></i>
              </el-button>
            </div>

            <!-- 原有的博客内容 -->
            <img v-if="post.image && post.image.length > 0" :src="getImageUrl(post.image[0])" alt="Blog Image" class="post-image" />

            <!-- 博客内容 -->
            <div class="post-content">
              <h2 class="post-title">{{ post.title }}</h2>
              <p class="post-text">{{ post.content }}</p>
            </div>

            <!-- 博客底部信息 -->
            <div class="post-footer">
              <!-- 作者信息 -->
              <div class="author-info">
                <img v-if="post.user?.avatar" :src="getImageUrl(post.user.avatar)" alt="Avatar" class="post-avatar" />
                <span class="author-name">{{ post.user?.name }}</span>
              </div>

              <!-- 统计信息 -->
              <div class="post-stats">
                <span class="likes">❤️ {{ post.likes }}</span>
                <span class="comments">💬 {{ post.comments_count }}</span>
                <span class="coins" v-if="post.isNFT">💰 {{ post.coins }}</span>
              </div>
            </div>
          </div>
        </div>
        <!-- 底部加载提示 -->
        <div v-if="loading" class="loading">Loading more posts...</div>
        <div v-if="noMorePosts" class="no-more">No more posts</div>
      </section>
    </section>
    
    <!-- 裁剪弹窗 -->
    <div class="cropper-modal" v-if="showCropper">
      <div class="cropper-container">
        <VueCropper
          ref="cropperRef"
          :img="cropOption.img"
          :autoCrop="cropOption.autoCrop"
          :fixedBox="cropOption.fixedBox"
          :centerBox="cropOption.centerBox"
          :infoTrue="cropOption.infoTrue"
          :full="cropOption.full"
          :canMoveBox="cropOption.canMoveBox"
          :original="cropOption.original"
          :canScale="cropOption.canScale"
          :fixed="cropOption.fixed"
          :fixedNumber="cropOption.fixedNumber"
          :outputType="cropOption.outputType"
        />
        <div class="cropper-buttons">
          <el-button @click="cropSuccess">Confirm</el-button>
          <el-button @click="cancelCrop">Cancel</el-button>
        </div>
      </div>
    </div>

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
        <div class="edit-avatar-section">
          <img :src="editForm.avatar" alt="Edit Avatar" class="edit-avatar" />
          <input type="file" class="upload-avatar" accept="image/*" @change="handleEditAvatarUpload" />
          <div class="avatar-upload-icon">
            <i class="el-icon-camera"></i>
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
                <img :src="following.avatar" :alt="`${following.name}'s avatar`" class="social-user-avatar">
                <div class="social-user-info">
                  <div class="social-user-name">{{ following.name }}</div>
                  <div class="social-user-meta">Following since {{ formatDate(following.follow_time) }}</div>
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
                  <div class="social-user-meta">Following since {{ formatDate(follower.follow_time) }}</div>
                </div>
                <button 
                  class="social-action-btn" 
                  :class="{ 'following': follower.is_following }"
                  @click="toggleFollowUser(follower)"
                >
                  {{ follower.is_following ? 'Following' : 'Follow' }}
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
            <span class="coins" v-if="selectedBlog.isNFT">💰 {{ selectedBlog.coins }}</span>
          </div>
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
              <div class="comment-row">
                <img 
                  :src="getImageUrl(comment.user.avatar)" 
                  alt="Commenter Avatar" 
                  class="comment-avatar"
                />
                <span class="comment-username">{{ comment.user.name }}</span>
                <p class="comment-text">{{ comment.content }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
  /* 社交弹窗样式 */
  .social-modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.75);
    backdrop-filter: blur(8px);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
    animation: fadeIn 0.3s ease;
  }

  .social-modal-container {
    width: 90%;
    max-width: 1000px;
    height: 80vh;
    background: white;
    border-radius: 16px;
    overflow: hidden;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
    position: relative;
    animation: slideUp 0.3s ease;
  }

  .social-modal-close {
    position: absolute;
    top: 15px;
    right: 15px;
    width: 36px;
    height: 36px;
    background: rgba(0, 0, 0, 0.1);
    border: none;
    border-radius: 50%;
    font-size: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    z-index: 10;
    transition: background 0.2s;
    
    &:hover {
      background: rgba(0, 0, 0, 0.2);
    }
  }

  .social-modal-content {
    display: flex;
    height: 100%;
    
    @media (max-width: 768px) {
      flex-direction: column;
    }
  }

  .social-modal-column {
    flex: 1;
    padding: 20px;
    overflow-y: auto;
    
    &.following-column {
      border-right: 1px solid #eee;
      
      @media (max-width: 768px) {
        border-right: none;
        border-bottom: 1px solid #eee;
        max-height: 50%;
      }
    }
  }

  .social-modal-title {
    font-size: 1.8rem;
    margin: 0 0 20px 0;
    padding-bottom: 10px;
    border-bottom: 1px solid #eee;
  }

  .social-user-list {
    display: flex;
    flex-direction: column;
  }

  .social-user-item {
    display: flex;
    align-items: center;
    padding: 12px 0;
    border-bottom: 1px solid #f5f5f5;
    
    &:last-child {
      border-bottom: none;
    }
  }

  .social-user-avatar {
    width: 50px;
    height: 50px;
    border-radius: 50%;
    object-fit: cover;
    margin-right: 15px;
    border: 1px solid #eee;
  }

  .social-user-info {
    flex: 1;
    min-width: 0; /* 确保文本可以正确截断 */
  }

  .social-user-name {
    font-weight: 600;
    font-size: 1.6rem;
    margin-bottom: 4px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .social-user-meta {
    font-size: 1.2rem;
    color: #888;
  }

  .social-action-btn {
    padding: 6px 16px;
    border-radius: 20px;
    border: 1px solid #4a90e2;
    background: white;
    color: #4a90e2;
    font-size: 1.4rem;
    cursor: pointer;
    transition: all 0.2s;
    
    &:hover {
      background: #f0f7ff;
    }
    
    &.following {
      background: #4a90e2;
      color: white;
      
      &:hover {
        background: #3a80d2;
      }
    }
  }

  .social-loading {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 40px 0;
    
    .loading-spinner {
      width: 40px;
      height: 40px;
      border: 3px solid #f3f3f3;
      border-top: 3px solid #4a90e2;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin-bottom: 16px;
    }
    
    p {
      color: #888;
      font-size: 1.4rem;
    }
  }

  .social-empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 40px 0;
    
    .empty-icon {
      font-size: 48px;
      margin-bottom: 16px;
      opacity: 0.5;
    }
    
    p {
      color: #888;
      font-size: 1.6rem;
    }
  }

  /* 动画 */
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  @keyframes slideUp {
    from { transform: translateY(20px); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  /* 修改现有样式，使 following 和 followers 链接可点击 */
  .follow-link, .follower-link {
    cursor: pointer;
    transition: color 0.2s;
    
    &:hover {
      color: #4a90e2;
      text-decoration: underline;
    }
  }
</style>

