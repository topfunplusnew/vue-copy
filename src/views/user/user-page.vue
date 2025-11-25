<script setup lang="ts">
import { ref, reactive, onMounted, computed, nextTick } from 'vue';
import { VueCropper } from 'vue-cropper';
import 'vue-cropper/dist/index.css';
import { useUserStore } from '@/stores/user';
import { useRouter, useRoute } from 'vue-router';
import { getImageUrl } from '@/utils';
import { ElMessage, ElMessageBox } from 'element-plus';
import type { IUser } from '@/types/user';
import { formatDate } from '@/utils/date';
import UserPageDialog from '@/views/user/user-page-dialog.vue';
import commonHeader from '@/layout/common-header.vue';
import { getUserProfile, updateUserProfile } from '@/services/user';
import type { UpdateUserProfileData } from '@/services/user/type';
import { getUserTimezone } from '@/utils/date';

// 关闭博客详情弹出层
const closeBlogDetail = () => {
  store.clearSelectedPost();
  document.body.style.overflow = '';
};
const store = useUserStore();
const router = useRouter();
const route = useRoute();

// const userProfile = computed(() => store.user); // user改成这种用法

onMounted(() => {
  // 确保页面滚动到顶部
  nextTick(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    document.body.scrollTop = 0;
    document.documentElement.scrollTop = 0;
  });

  store.getUserInfo().then(({ data }) => {
    editForm.name = data.name;
    editForm.avatar = data.avatar;
  });
  // 如果当前路由是 blogs，加载博客列表
  if (route.name === 'userpage-blogs') {
    store.getUserBlogList(true);
  }
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
  if (uploadfile.value) uploadfile.value.click();
}

const isFollowing = ref(false);

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
    store.uploadImage(image).then(({ data }) => {
      editForm.avatar = data.avatar;
    });
    showCropper.value = false;
  });
}

// 添加编辑个人信息相关状态
const showEditProfile = ref(false);
const loadingProfile = ref(false);
const editForm = reactive<UpdateUserProfileData>({
  name: '',
  avatar: '',
  affiliation: '',
  department: '',
  university: '',
  city: '',
  country: '',
  bio: '',
  homepage: '',
  orcid: '',
});

// 打开编辑弹窗时获取用户资料
function openEditProfile() {
  showEditProfile.value = true;
  loadingProfile.value = true;
  getUserProfile()
    .then(({ data }) => {
      // 只填充 UpdateUserProfileData 中的字段
      editForm.name = data.name || '';
      editForm.avatar = data.avatar || '';
      editForm.affiliation = data.affiliation || '';
      editForm.department = data.department || '';
      editForm.university = data.university || '';
      editForm.city = data.city || '';
      editForm.country = data.country || '';
      editForm.bio = data.bio || '';
      editForm.homepage = data.homepage || '';
      editForm.orcid = data.orcid || '';
    })
    .catch((error) => {
      console.error('Failed to fetch user profile:', error);
      ElMessage.error('Failed to fetch user profile, please try again later');
    })
    .finally(() => {
      loadingProfile.value = false;
    });
}

// 提交编辑
function submitProfileEdit() {
  updateUserProfile(editForm)
    .then((res) => {
      console.log(res);
      ElMessage.success('Profile updated successfully');
      // 更新 store 中的用户信息
      store.getUserInfo();
      showEditProfile.value = false;
    })
    .catch((error) => {
      console.error('Failed to update user profile:', error);
      ElMessage.error('Update failed, please try again later');
    });
}

// 取消编辑
function cancelProfileEdit() {
  // 重置表单
  editForm.name = '';
  editForm.avatar = '';
  editForm.affiliation = '';
  editForm.department = '';
  editForm.university = '';
  editForm.city = '';
  editForm.country = '';
  editForm.bio = '';
  editForm.homepage = '';
  editForm.orcid = '';
  showEditProfile.value = false;
}


// 在编辑页面上传头像
function handleEditAvatarUpload(event: Event) {
  const target = event.target as HTMLInputElement;
  const file = target.files ? target.files[0] : null;
  if (file) {
    console.log(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      cropImage.value = e.target?.result as string;
    };
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
function unfollowUser(following: IUser) {
  ElMessageBox.confirm(`Are you sure you want to unfollow ${following.name}?`, 'Confirm Unfollow', {
    confirmButtonText: 'Unfollow',
    cancelButtonText: 'Cancel',
    type: 'warning',
  }).then(() => {
    // 模拟API调用
    if (following.id) store.unfollow(following.id).then(() => (isFollowing.value = false));
    ElMessage.success(`You have unfollowed ${following.name}`);
  });
}

// 切换关注状态
function toggleFollowUser(follower: IUser) {
  store.isFollowing(follower.id || 0).then(({ data }) => {
    if (data) {
      unfollowUser(follower);
      isFollowing.value = false;
    } else {
      if (follower.id) store.follow(follower.id).then(() => (isFollowing.value = true));
    }
  });
}

// 路由菜单
const menuItems = [
  { name: 'Home', route: 'userpage-home' },
  { name: 'Blogs', route: 'userpage-blogs' },
  { name: 'My Presentations', route: 'userpage-presentations' },
  { name: 'Resume (PDF)', route: 'userpage-resume' },
];

// 导航到指定路由
const navigateTo = (routeName: string) => {
  router.push({ name: routeName });
};

// 检查当前激活的路由
const isActiveRoute = (routeName: string) => {
  return route.name === routeName;
};

// 获取用户当前时区
const userTimezone = computed(() => getUserTimezone());

// 格式化时区显示（将时区名称转换为更友好的格式）
const formattedTimezone = computed(() => {
  const tz = userTimezone.value;
  // 将时区名称中的下划线替换为空格，并美化显示
  return tz.replace(/_/g, ' ');
});
</script>

<template>
  <div class="background-layer"></div>
  <div class="about layout-main">
    <commonHeader />

    <div class="user-page">
      <!-- 主体内容，使用 flex 布局让左侧个人信息 & 右侧博客并排 -->
      <section class="main-content">
        <!-- 左侧用户信息面板 -->
        <aside class="sidebar" :class="{ 'wallet-connected': isWalletConnected }">
          <div class="profile-buttons">
            <button class="edit-profile-btn" @click="openEditProfile">EDIT PROFILE</button>
            <!-- <button class="logout-btn" @click="handleLogout">LOGOUT</button> -->
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
            <div class="user-timezone">
              <span class="timezone-icon">🕐</span>
              <span class="timezone-text">{{ formattedTimezone }}</span>
            </div>
            <div class="user-institution">MUST</div>
            <!-- <div class="registration-time">Joined: {{ user?.created_at }}</div> -->
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

            <!-- 二级路由菜单 -->
            <div class="user-menu">
              <div v-for="item in menuItems" :key="item.route" class="menu-item" :class="{ active: isActiveRoute(item.route) }" @click="navigateTo(item.route)">
                {{ item.name }}
              </div>
            </div>
          </div>
        </aside>

        <!-- 垂直分割线，与 sidebar 同高 (100vh) -->
        <div class="vertical-divider-us"></div>

        <!-- 右侧内容区，使用 router-view 显示子路由 -->
        <div class="content-area">
          <router-view />
        </div>
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
      <el-dialog v-model="showCropper" class="crop-dialog" title="Edit Avatar" :close-on-click-modal="true" :show-close="true" destroy-on-close>
        <div class="avatar-cut">
          <vue-cropper ref="cropperRef" :img="cropImage" v-bind="cropOption" />
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
          <div v-if="loadingProfile" class="loading-container">
            <div class="loading-spinner"></div>
            <p>Loading...</p>
          </div>
          <div v-else>
            <input ref="uploadfile" style="display: none" type="file" class="upload-avatar" accept="image/*" @change="handleEditAvatarUpload" />
            <div class="edit-avatar-section avatar-container">
              <img :src="getImageUrl(editForm.avatar)" alt="Edit Avatar" class="edit-avatar" />
              <div class="avatar-upload-icon">
                <i class="el-icon-camera" @click.prevent.stop="onUpload">edit</i>
              </div>
            </div>
            <div class="edit-form">
              <div class="form-group">
                <label>Name</label>
                <input v-model="editForm.name" type="text" placeholder="Enter your name" />
              </div>
              <div class="form-group">
                <label>Affiliation</label>
                <input v-model="editForm.affiliation" type="text" placeholder="Enter your affiliation" />
              </div>
              <div class="form-group">
                <label>Department</label>
                <input v-model="editForm.department" type="text" placeholder="Enter your department" />
              </div>
              <div class="form-group">
                <label>University</label>
                <input v-model="editForm.university" type="text" placeholder="Enter your university" />
              </div>
              <div class="form-group">
                <label>City</label>
                <input v-model="editForm.city" type="text" placeholder="Enter your city" />
              </div>
              <div class="form-group">
                <label>Country</label>
                <input v-model="editForm.country" type="text" placeholder="Enter your country" />
              </div>
              <div class="form-group">
                <label>Bio</label>
                <textarea v-model="editForm.bio" placeholder="Enter your bio" rows="4"></textarea>
              </div>
              <div class="form-group">
                <label>Homepage</label>
                <input v-model="editForm.homepage" type="url" placeholder="Enter your homepage URL" />
              </div>
              <div class="form-group">
                <label>ORCID</label>
                <input v-model="editForm.orcid" type="text" placeholder="Enter your ORCID" />
              </div>
            </div>
            <div class="edit-buttons">
              <el-button type="primary" @click="submitProfileEdit">Save Changes</el-button>
              <el-button @click="cancelProfileEdit">Cancel</el-button>
            </div>
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
                  <img :src="`/images/${following.avatar}`" :alt="`${following.name}'s avatar`" class="social-user-avatar" />
                  <div class="social-user-info">
                    <div class="social-user-name">{{ following.name }}</div>
                    <div class="social-user-meta">Following since {{ formatDate(following.created_at) }}</div>
                  </div>
                  <button class="social-action-btn following" @click="unfollowUser(following)">Unfollow</button>
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
                  <img :src="follower.avatar" :alt="`${follower.name}'s avatar`" class="social-user-avatar" />
                  <div class="social-user-info">
                    <div class="social-user-name">{{ follower.name }}</div>
                    <div class="social-user-meta">Following since {{ formatDate(follower.created_at) }}</div>
                  </div>
                  <button class="social-action-btn" :class="{ following: isFollowing }" @click="toggleFollowUser(follower)">
                    {{ isFollowing ? 'Following' : 'Follow' }}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 博客详情弹出层 -->
      <user-page-dialog v-if="store.selectedPost" :is-following="isFollowing" @close="closeBlogDetail" @toggle-follow="toggleFollowUser" />
    </div>
  </div>
</template>

<style scoped>
/* 用户菜单样式 */
.user-menu {
  margin-top: 40px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.menu-item {
  padding: 12px 16px;
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.3s;
  color: #666;
  font-size: 20px;
}

.menu-item:hover {
  background-color: #f5f5f5;
  color: #333;
}

.menu-item.active {
  background-color: #627180;
  color: #fff;
  font-weight: 500;
}

/* 时区显示样式 */
.user-timezone {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  margin: 8px 0;
  padding: 6px 12px;
  background-color: transparent;
  border-radius: 4px;
  font-size: 14px;
  color: #666;
}

.timezone-icon {
  font-size: 16px;
}

.timezone-text {
  font-weight: 500;
  color: #333;
}

/* 内容区域样式 */
.content-area {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

/* 移动端响应式样式 */
@media (max-width: 768px) {
  /* 用户菜单在移动端横向排列 */
  .user-menu {
    flex-direction: row;
    gap: 12px;
    margin-top: 20px;
    justify-content: center;
  }

  .menu-item {
    flex: 1;
    text-align: center;
    padding: 10px 12px;
    font-size: 16px;
  }

  /* 确保侧边栏在移动端占满宽度 */
  .sidebar {
    width: 100% !important;
    max-width: 100% !important;
    min-height: 100vh !important;
  }

  /* 主内容区域在移动端垂直布局 */
  .main-content {
    flex-direction: column;
    gap: 20px;
  }

  /* 内容区域在移动端占满宽度 */
  .content-area {
    width: 100%;
    padding: 0 10px;
  }

  /* 时区显示在移动端调整 */
  .user-timezone {
    font-size: 12px;
    padding: 5px 10px;
    margin: 6px 0;
  }

  .timezone-icon {
    font-size: 14px;
  }
}
</style>
