<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue';
// import { userInfo, generateBlogs, BlogPost } from '@/data/psblog';
import walletItem from '@/components/wallet-item.vue';
import type { IBlogPost } from '@/types/blog';
import macauImg from '@/assets/macau.jpg';
import { VueCropper } from 'vue-cropper';
import 'vue-cropper/dist/index.css';
import { useUserStore } from '@/stores/user';
import type { IUserEdit } from '@/types/user';
import { useRouter } from 'vue-router';
import { getBlogPost, getMyBlogList, PostAvatar } from '@/services/api';


const store = useUserStore();
const router = useRouter();

// const userProfile = computed(() => store.user); // user改成这种用法

onMounted(() => {
  store.getUserInfo();
  getMyBlogList().then((res) => {
    console.log(res);
    userPosts.value = res.data.blogs;
  }).catch((e) => {
    console.log(e);
  });
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
const userPosts = ref<IBlogPost[]>([]);

// 博客详情相关的状态和方法
const selectedBlog = ref<IBlogPost | null>(null);

const showBlogDetail = (id: number) => {
  getBlogPost(id.toString()).then((res) => {
    selectedBlog.value = res.data;
  }).catch((e) => {
    console.log(e);
  });
  document.body.style.overflow = 'hidden';
};



const closeBlogDetail = () => {
  selectedBlog.value = null;
  document.body.style.overflow = '';
};

// function loadPosts() {
//   if (loading.value || noMorePosts.value) return;
//   loading.value = true;
//   setTimeout(() => {
//     const newPosts = generateBlogs(page.value, perPage);
//     if (newPosts.length < perPage) {
//       noMorePosts.value = true;
//     }
//     posts.value.push(...newPosts);
//     user.blogs.push(...newPosts);
//     page.value++;
//     loading.value = false;
//   }, 1000);
// }

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
      user.avatar = data; // 直接更新用户头像
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
  editForm.avatar = user.value?.avatar;
  showEditProfile.value = false;
}

// 在编辑页面上传头像
function handleEditAvatarUpload(event: Event) {
  const target = event.target as HTMLInputElement;
  const file = target.files ? target.files[0] : null;
  if (file) {
    const formData = new FormData();
    formData.append('file', file);
    PostAvatar({ image: formData }).then((res) => {
      console.log(res);
    }).catch((e) => {
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

</script>

<template>
  <div class="user-page">
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
        </div>
      </div>
    </header>

    <!-- 主体内容，使用 flex 布局让左侧个人信息 & 右侧博客并排 -->
    <section class="main-content">
      <!-- 左侧用户信息面板，固定宽度 & 100vh 高度 -->
      <aside class="sidebar" :class="{ 'wallet-connected': isWalletConnected }">
        <div class="profile-buttons">
          <button class="edit-profile-btn" @click="showEditProfile = true">
            EDIT PROFILE
          </button>
          <button class="logout-btn" @click="handleLogout">
            LOGOUT
          </button>
        </div>
        <div class="user-info">
          <div class="avatar-section">
            <div class="avatar-container">
              <img :src="displayAvatar" alt="User Avatar" class="avatar" />
              <input type="file" class="upload-avatar" accept="image/*" @change="handleAvatarUpload" />
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
          <div class="follow-section">
            <div class="follow-item">
              <span class="number">{{ user?.followings }}</span>
              <router-link to="/following" class="follow-link">Following</router-link>
            </div>
            <div class="follower-item">
              <span class="number">{{ user?.followers }}</span>
              <router-link to="/followers" class="follower-link">Followers</router-link>
            </div>
          </div>
        </div>
      </aside>

      <!-- 垂直分割线，与 sidebar 同高 (100vh) -->
      <div class="vertical-divider-us"></div>

      <!-- 右侧博客列表区，填满剩余宽度 -->
      <section class="blog-area" ref="postsContainer" @scroll="handleScroll">
        <div class="blog-posts">
          <div v-for="post in userPosts" :key="post.id" class="blog-post" :class="{ 'nft-post': post.isNFT }" @click="showBlogDetail(post.id)">
            <img v-if="post.image && post.image.length > 0" :src="post.image[0]" alt="Blog Image" class="post-image" />
            <div class="post-content">
              <h2>{{ post.title }}</h2>
              <p>{{ post.content }}</p>
            </div>
            <div class="post-footer">
              <img v-if="post.user && post.user.avatar" :src="post.user.avatar" alt="Avatar" class="post-avatar" />
              <div class="post-stats">
                <span class="likes">❤️ {{ post.likes }}</span>
                <span class="comments">💬 {{ post.comments }}</span>
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

    <!-- 博客详情弹出层 -->
 
    <div class="blog-detail-overlay" v-if="selectedBlog" @click.self="closeBlogDetail">
      <div class="blog-detail-container" :class="{ 'nft-post': selectedBlog.isNFT }">
        <div class="blog-detail-header">
          <h2>{{ selectedBlog.title }}</h2>
          <button class="close-button" @click="closeBlogDetail">×</button>
        </div>
        <div class="blog-detail-content">
          <img :src="selectedBlog.image[0]" alt="Blog Image" class="detail-image" />
          <div class="detail-info">
            <div class="author-info">
              <img :src="selectedBlog.user.avatar" alt="Author Avatar" class="author-avatar" />
              <span class="author-name">{{ selectedBlog.user.name }}</span>
            </div>
            <p class="content">{{ selectedBlog.content }}</p>
            <div class="detail-stats">
              <span class="likes">❤️ {{ selectedBlog.likes }}</span>
              <span class="comments">💬 {{ selectedBlog.comments }}</span>
              <span class="coins" v-if="selectedBlog.isNFT">💰 {{ selectedBlog.coins }}</span>
            </div>
            <div class="tags">
              <span v-for="tag in selectedBlog.tags" :key="tag" class="tag">
                {{ tag }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>

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
  </div>
</template>
