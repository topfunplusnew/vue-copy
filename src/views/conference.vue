<script setup lang="ts">
import { ref, reactive, onMounted, computed, nextTick } from 'vue';
// import walletItem from '@/components/wallet-item.vue';
import { VueCropper } from 'vue-cropper';
import 'vue-cropper/dist/index.css';
import { useUserStore } from '@/stores/user';
import { useRouter } from 'vue-router';
import { getImageUrl } from '@/utils';
import { ElMessage, ElMessageBox } from 'element-plus';
// import type { IUser } from '@/types/user';
import { formatRange } from '@/utils/date';
// import type { IBlogComment } from '@/types/blog';
// import UserPageDialog from '@/views/user/user-page-dialog.vue';
// import type { IBlog } from '@/types/blog';
import commonHeader from '@/layout/common-header.vue';
import { useConferenceStore } from '@/stores/conference';

// ===== Academic Meetings types (temporary, will be moved to types/) =====


// const selectedBlog =ref<IBlog | null>(null); // 当前选中的博客详情
// 关闭博客详情弹出层
// const closeBlogDetail = () => {
//   store.clearSelectedPost();
//   document.body.style.overflow = '';
// };
const store = useUserStore();
const router = useRouter();
const conferencesStory = useConferenceStore()
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
  store.getUserBlogList(true);
  conferencesStory.getMyConference();//我的会议111
  conferencesStory.getConferenceList();

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

// const totalLikes = computed(() => posts.value.reduce((sum, post) => sum + post.likes, 0));


// const postsContainer = ref<HTMLElement | null>(null);

// 用户博客数据
// const userPosts = computed(() => store.blogs);



// const isFollowing = ref(false);

// const showBlogDetail = (id?: number) => {
//   if(!id) return;
//   store.getUserBlogByID(id).then(() => {
//     if(selectedBlog.value?.user.id) store.isFollowing(selectedBlog.value?.user.id).then(({data}) =>{
//       isFollowing.value = data as boolean;
//     })
//     document.body.style.overflow = 'hidden';
//   });
// };

// function gotoEidtPage(id?:number) {
//   if(!id) return;
//   router.push({
//     name:'PostView',
//     params: {id}
//   })
// }


// function handleScroll() {
//   const container = postsContainer.value;
//   if (!container) return;
//   if (container.scrollTop + container.clientHeight >= container.scrollHeight - 100) {
//     // loadPosts();
//   }
// }

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
  if (file) {
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

// 添加编辑模式状态
// const isEditMode = ref(false);
// const selectedBlogId = ref<number | null>(null);

// 搜索功能相关
// const searchKeyword = ref('');
// const originalPosts = ref(); // 保存原始博客列表

// 切换编辑模式
// const toggleEditMode = () => {
//   isEditMode.value = !isEditMode.value;
//   if (!isEditMode.value) {
//     selectedBlogId.value = null;
//   }
// };

// 搜索功能处理
// const handleSearch = () => {
//   const keyword = searchKeyword.value.toLowerCase().trim();

//   if (!keyword) {
//     // 如果搜索框为空，显示所有博客
//     return;
//   }

//   // 这里可以调用store的搜索方法或者前端过滤
//   // 例如：store.searchUserBlogs(keyword);
//   console.log('搜索关键词:', keyword);
// };

// 删除博客
// const deleteBlog = async (blogId?: number) => {
//   if(!blogId) return;
//   try {
//     await ElMessageBox.confirm(
//       'Are you sure you want to delete this blog post?',
//       'Warning',
//       {
//         confirmButtonText: 'Delete',
//         cancelButtonText: 'Cancel',
//         type: 'warning',
//       }
//     );

//     await store.delUserBlogByID(blogId);
//     ElMessage.success('Blog deleted successfully');
//     store.getUserBlogList(true); // 刷新博客列表
//   } catch (error) {
//     if (error !== 'cancel') {
//       ElMessage.error('Failed to delete blog');
//     }
//   }
// };

// 编辑博客

// 评论功能
// const newComment = ref('');

// const submitComment = async () => {
//   if (!newComment.value.trim()) return;
//   if (!selectedBlog.value?.id) return;

//   // 用户已登录不用检查登录状态
//   store.commenttoBlog(selectedBlog.value?.id, newComment.value).then(res=>{
//     console.log(res);
//   }).catch(e=>{
//     console.log(e);
//   }).finally(()=>{
//     // 清空输入
//     newComment.value = '';
//     if(selectedBlog.value?.id) store.getUserBlogByID(selectedBlog.value?.id);

//     // 滚动到新评论
//     nextTick(() => {
//       scrollToComments();
//     });
//   });

//   // 模拟添加评论
//   ElMessage({
//     message: 'Comment submitted successfully!',
//     type: 'success'
//   });

//   newComment.value = '';
// }


// 评论相关的状态

// 评论长按删除功能
// const longPressTimeout = ref();
// // const longPressDuration = 800; // 长按时间阈值，单位为毫秒
// const activeComment = ref();

// 长按开始处理函数
// const handleTouchStart = (comment:IBlogComment) => {
//   console.log(comment);
//   // 检查是否是当前用户的评论
//   const currentUser = store.user;

//   // 如果不是当前用户的评论，不允许删除
//   if (!comment || !currentUser || comment.user.id !== currentUser.id) {
//     return;
//   }

//   longPressTimeout.value = setTimeout(() => {
//     activeComment.value = comment.id;
//   }, longPressDuration);
// };

// // 长按结束处理函数
// const handleTouchEnd = () => {
//   if (longPressTimeout.value) {
//     clearTimeout(longPressTimeout.value);
//     longPressTimeout.value = null;
//   }
// };

// 移动时取消长按
// const handleTouchMove = () => {
//   if (longPressTimeout.value) {
//     clearTimeout(longPressTimeout.value);
//     longPressTimeout.value = null;
//   }
// };

// // 确认删除评论
// const confirmDeleteComment = async (commentId?:number) => {
//   if(!commentId) return;
//   try {
//     // 调用删除评论API
//     await store.userDeleteComment(commentId);

//     // 刷新博客数据以更新评论列表
//     if(selectedBlog.value?.id) {
//       await store.getUserBlogByID(selectedBlog.value.id);
//     }

//     ElMessage.success('Comment deleted successfully');
//   } catch (error) {
//     console.error('Failed to delete comment:', error);
//     ElMessage.error('Failed to delete comment');
//   } finally {
//     activeComment.value = undefined;
//   }
// };

// 取消删除操作
// const cancelDeleteComment = () => {
//   activeComment.value = undefined;
// };
// const activeCommentId = ref<number | null>(null);
// const replyContent = ref('');
// const isSubmittingReply = ref(false);
// 展开回复相关的状态

// 添加回复目标状态
// const replyTarget = ref<{id: number, type: string, parentId?: number} | null>(null);

// 切换回复输入框显示状态
// const toggleReplyInput = (id: number|undefined, type: string = 'comment', parentId?: number) => {
//   if (!id) return;
//   // 如果当前已经是在回复这个评论/回复，则关闭回复框
//   if (replyTarget.value &&
//       replyTarget.value.id === id &&
//       replyTarget.value.type === type) {
//     replyTarget.value = null;
//     replyContent.value = '';
//   } else {
//     // 否则打开回复框
//     if (type === 'reply' && !parentId) {
//       console.error('回复需要提供父评论ID');
//       return;
//     }

//     replyTarget.value = {
//       id,
//       type,
//       parentId
//     };

//     // 添加延迟滚动到回复框，确保DOM已更新
//     nextTick(() => {
//       // 滚动到回复框
//       const replyInputContainer = document.querySelector('.reply-input-container-home');
//       if (replyInputContainer) {
//         replyInputContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
//       }
//     });

//     replyContent.value = '';
//   }
// };

// function scrollToComments() {
//   const commentsSection = document.querySelector('.comments-container') as HTMLElement;
//   const detailRight = document.querySelector('.detail-right');

//   if (commentsSection && detailRight) {
//     detailRight.scrollTo({
//       top: commentsSection.offsetTop - 20,
//       behavior: 'smooth'
//     });
//   }
// }

// 添加社交弹窗相关的状态和方法
const isSocialModalVisible = ref(false);
// const followings = computed(() => store.followings);
// const followers = computed(() => store.followers);
// const loadingFollowings = ref(false);
// const loadingFollowers = ref(false);

// 显示社交弹窗
function showSocialModal() {
  isSocialModalVisible.value = true;
  document.body.style.overflow = 'hidden'; // 防止背景滚动

  // 加载数据
  store.getFollowings();
  store.getFollowers();
}

// 关闭社交弹窗
// function closeSocialModal() {
//   isSocialModalVisible.value = false;
//   document.body.style.overflow = ''; // 恢复背景滚动
// }

// 取消关注用户
// function unfollowUser(following:IUser) {
//   ElMessageBox.confirm(
//     `Are you sure you want to unfollow ${following.name}?`,
//     'Confirm Unfollow',
//     {
//       confirmButtonText: 'Unfollow',
//       cancelButtonText: 'Cancel',
//       type: 'warning'
//     }
//   ).then(() => {
//     // 模拟API调用
//     if(following.id) store.unfollow(following.id).then(() => isFollowing.value = false);
//     ElMessage.success(`You have unfollowed ${following.name}`);
//   });
// }

// 切换关注状态
// function toggleFollowUser(follower:IUser) {
//   store.isFollowing(follower.id||0).then(({data}) =>{
//     if(data) {
//       unfollowUser(follower)
//       isFollowing.value = false;
//     } else {
//       if(follower.id) store.follow(follower.id).then(() => isFollowing.value = true);
//     }
//   });
// }

// 添加导航菜单状态管理
// const menuActive = ref(false);

// 切换菜单显示
// const toggleMenu = () => {
//   menuActive.value = !menuActive.value;
// };

// ===== Contact Info & CV Upload Modals =====
const showContactModal = ref(false);
const showCVModal = ref(false);

// Contact info form
const contactForm = reactive({
  email: '',
  phone: '',
  website: '',
  linkedin: '',
  twitter: '',
  orcid: ''
});

// CV upload
const cvFile = ref<File | null>(null);
const cvUploadRef = ref<HTMLElement | null>(null);
const uploadedCV = ref<{ file: File; uploadDate: string; url: string } | null>(null);

// CV Preview Modal
const showCVPreviewModal = ref(false);
const isMobile = computed(() => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth <= 768;
});

// Open contact info modal
const openContactModal = () => {
  showContactModal.value = true;
  document.body.style.overflow = 'hidden';
};

// Close contact info modal
const closeContactModal = () => {
  showContactModal.value = false;
  document.body.style.overflow = '';
};

// Submit contact info
const submitContactInfo = () => {
  // TODO: Implement API call to save contact info
  console.log('Contact info submitted:', contactForm);
  ElMessage.success('Contact information saved successfully!');
  closeContactModal();
};

// Open CV upload modal
const openCVModal = () => {
  showCVModal.value = true;
  document.body.style.overflow = 'hidden';
};

// Close CV upload modal
const closeCVModal = () => {
  showCVModal.value = false;
  document.body.style.overflow = '';
};

// Handle CV file selection
const handleCVUpload = (event: Event) => {
  const target = event.target as HTMLInputElement;
  const file = target.files ? target.files[0] : null;
  if (file) {
    cvFile.value = file;
    console.log('CV file selected:', file.name);
  }
};

// Submit CV
const submitCV = () => {
  if (!cvFile.value) {
    ElMessage.warning('Please select a CV file first');
    return;
  }

  // Store uploaded CV
  uploadedCV.value = {
    file: cvFile.value,
    uploadDate: new Date().toLocaleDateString(),
    url: URL.createObjectURL(cvFile.value)
  };

  // TODO: Implement API call to upload CV
  console.log('CV uploaded:', cvFile.value);
  ElMessage.success('CV uploaded successfully!');
  closeCVModal();
  cvFile.value = null;
};

// Open CV for viewing
const openCVPreview = () => {
  if (uploadedCV.value) {
    showCVPreviewModal.value = true;
    document.body.style.overflow = 'hidden';
  }
};

// Close CV preview modal
const closeCVPreview = () => {
  showCVPreviewModal.value = false;
  document.body.style.overflow = '';
};

// Get current CV filename
const getCurrentCVFileName = () => {
  return uploadedCV.value?.file.name || 'document.pdf';
};

// Open CV in new tab (for mobile)
const openCVInNewTab = () => {
  if (uploadedCV.value?.url) {
    window.open(uploadedCV.value.url, '_blank');
  }
};

// Remove/Withdraw CV
const withdrawCV = () => {
  ElMessageBox.confirm(
    'Are you sure you want to withdraw your CV? This action cannot be undone.',
    'Withdraw CV',
    {
      confirmButtonText: 'Withdraw',
      cancelButtonText: 'Cancel',
      type: 'warning',
    }
  ).then(() => {
    // Clean up the blob URL to prevent memory leaks
    if (uploadedCV.value?.url) {
      URL.revokeObjectURL(uploadedCV.value.url);
    }

    // Clear the uploaded CV
    uploadedCV.value = null;

    // TODO: Implement API call to remove CV from server
    console.log('CV withdrawn');
    ElMessage.success('CV withdrawn successfully!');

    // Close the preview modal
    closeCVPreview();
  }).catch(() => {
    // User cancelled the action
  });
};

// ===== Academic Meetings: current participations (Top section on right) =====
// TODO: Replace mock data with store-driven data
const currentParticipations = computed(() => conferencesStory.myConference)//会议详情


// ===== Featured Events (Other conferences) =====

const featuredEvents = computed(() => conferencesStory.list);//会议列表




// Logo debugging functions
const handleLogoError = (event: Event) => {
  const img = event.target as HTMLImageElement;
  console.error('Logo failed to load:', img.src);
  img.style.display = 'none';
};

const handleLogoLoad = (event: Event) => {
  const img = event.target as HTMLImageElement;
  console.log('Logo loaded successfully:', img.src);
};


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

            <!-- Additional Profile Buttons -->
            <div class="additional-buttons">
              <button class="contact-info-btn" @click="openContactModal">CONTACT INFO</button>
              <button v-if="!uploadedCV" class="upload-cv-btn" @click="openCVModal">UPLOAD CV</button>
              <button v-else class="view-cv-btn" @click="openCVPreview">VIEW CV</button>
            </div>
          </div>
        </aside>

        <!-- 垂直分割线，与 sidebar 同高 (100vh) -->
        <div class="vertical-divider-us"></div>
        <!-- 右侧会议内容区域 -->
        <section class="events">
          <!-- 顶部：正在参与的会议 -->
          <div class="current-participations">
            <div class="section-title">My Events</div>

            <div v-if="currentParticipations?.length" class="conference-list" v-for="cur in currentParticipations"
              :key="cur.id">
              <div class="conference-card">
                <div class="conference-header">
                  <div class="conference-name-container">
                    <img v-if="cur.logo" :src="cur.logo" :alt="cur.name + ' logo'" class="conference-logo"
                      @error="handleLogoError" @load="handleLogoLoad" />
                    <div class="conference-name">{{ cur.name }}</div>
                  </div>
                  <!-- <div class="submission-count">{{ currentParticipations.my_papers.length }} papers</div> -->
                </div>

                <div class="submission-list">
                  <div v-for="(sub, idx) in cur.my_papers" :key="idx" class="submission-item"
                    @click="router.push({ name: 'MyEventDetail', params: { conferenceId: cur.id, paperId: idx } })">
                    <div class="paper-title">{{ sub.paper_title }}</div>
                    <div class="authors">
                      <span v-for="(author, i) in sub.authors" :key="i" class="author">
                        {{ author }}<span v-if="i < sub.authors.length - 1">, </span>
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div v-else class="empty-state">
              <div class="empty-title">No current participations</div>
              <div class="empty-desc">When you join or submit to a conference, it will appear here.</div>
            </div>
          </div>

          <!-- 精选 Events：其他会议推荐 -->
          <div class="featured-events">
            <div class="section-header">
              <div class="section-title">Featured Events</div>
            </div>

            <div v-if="featuredEvents.length > 0" class="featured-list">
              <div v-for="evt in featuredEvents" :key="evt.id" class="featured-card"
                @click="router.push({ name: 'FeaturedEvents', params: { conferenceId: evt.id } })">
                <div class="featured-header">
                  <div class="featured-name-container">
                    <img v-if="evt.logo" :src="evt.logo" :alt="evt.name + ' logo'" class="featured-event-logo"
                      @error="handleLogoError" @load="handleLogoLoad" />
                    <div class="featured-name">{{ evt.name }}</div>
                  </div>
                  <div class="featured-date">{{ formatRange(evt.start_time, evt.end_time) }}</div>
                </div>
                <div class="featured-meta">
                  <span class="featured-location">{{ evt.place_name }}</span>
                  <a v-if="evt.website" class="featured-link" :href="evt.website" target="_blank"
                    rel="noopener">Website</a>
                </div>
                <div v-if="evt.keywords?.length" class="featured-topics">
                  <span class="topic-tag" v-for="(t, i) in evt.keywords" :key="i">{{ t.name }}</span>
                </div>
              </div>
            </div>

            <div v-else class="empty-state">
              <div class="empty-title">No featured events</div>
              <div class="empty-desc">We will curate high-quality conferences here soon.</div>
            </div>
          </div>
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
      <el-dialog v-model="showCropper" class="crop-dialog" title="Edit Avatar" :close-on-click-modal="true"
        :show-close="true" destroy-on-close>
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
        <div class="edit-profile-container" :style="{
          transform: `translate(${editProfilePosition.x}px, ${editProfilePosition.y}px)`,
        }" @mousedown="startDrag" @mousemove="onDrag" @mouseup="stopDrag" @mouseleave="stopDrag">
          <h2>Edit Profile</h2>
          <input ref="uploadfile" style="display: none;" type="file" class="upload-avatar" accept="image/*"
            @change="handleEditAvatarUpload" />
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

      <!-- Contact Info Modal -->
      <div class="contact-modal" v-if="showContactModal">
        <div class="contact-modal-container">
          <div class="modal-header">
            <h2>Contact Information</h2>
            <button class="close-btn" @click="closeContactModal">×</button>
          </div>
          <div class="modal-content">
            <div class="form-group">
              <label>Email</label>
              <input v-model="contactForm.email" type="email" placeholder="your.email@example.com" />
            </div>
            <div class="form-group">
              <label>Phone</label>
              <input v-model="contactForm.phone" type="tel" placeholder="+1 (555) 123-4567" />
            </div>
            <div class="form-group">
              <label>Website</label>
              <input v-model="contactForm.website" type="url" placeholder="https://yourwebsite.com" />
            </div>
            <div class="form-group">
              <label>LinkedIn</label>
              <input v-model="contactForm.linkedin" type="url" placeholder="https://linkedin.com/in/yourprofile" />
            </div>
            <div class="form-group">
              <label>Twitter</label>
              <input v-model="contactForm.twitter" type="text" placeholder="@yourusername" />
            </div>
            <div class="form-group">
              <label>ORCID</label>
              <input v-model="contactForm.orcid" type="text" placeholder="0000-0000-0000-0000" />
            </div>
          </div>
          <div class="modal-footer">
            <el-button @click="closeContactModal">Cancel</el-button>
            <el-button type="primary" @click="submitContactInfo">Save</el-button>
          </div>
        </div>
      </div>

      <!-- CV Upload Modal -->
      <div class="cv-modal" v-if="showCVModal">
        <div class="cv-modal-container">
          <div class="modal-header">
            <h2>Upload CV</h2>
            <button class="close-btn" @click="closeCVModal">×</button>
          </div>
          <div class="modal-content">
            <div class="upload-area">
              <input ref="cvUploadRef" type="file" accept=".pdf,.doc,.docx" @change="handleCVUpload"
                style="display: none;" />
              <div class="upload-zone" @click="cvUploadRef?.click()">
                <div class="upload-icon">📄</div>
                <div class="upload-text">
                  <p>Click to select CV file</p>
                  <p class="upload-hint">Supports PDF, DOC, DOCX files</p>
                </div>
              </div>
              <div v-if="cvFile" class="selected-file">
                <span class="file-icon">📎</span>
                <span class="file-name">{{ cvFile.name }}</span>
                <span class="file-size">({{ (cvFile.size / 1024 / 1024).toFixed(2) }} MB)</span>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <el-button @click="closeCVModal">Cancel</el-button>
            <el-button type="primary" @click="submitCV" :disabled="!cvFile">Upload</el-button>
          </div>
        </div>
      </div>
    </div>

    <!-- CV Preview Modal -->
    <div v-if="showCVPreviewModal" class="pdf-modal-overlay" @click="closeCVPreview">
      <div class="pdf-modal" @click.stop>
        <div class="pdf-modal-header">
          <h3>{{ getCurrentCVFileName() }}</h3>
          <div class="header-actions">
            <button @click="withdrawCV" class="withdraw-btn">Withdraw CV</button>
            <button @click="closeCVPreview" class="close-btn">×</button>
          </div>
        </div>
        <div class="pdf-modal-content">
          <iframe v-if="uploadedCV?.url && !isMobile" :src="uploadedCV.url" class="pdf-viewer" frameborder="0">
          </iframe>
          <div v-else-if="uploadedCV?.url && isMobile" class="mobile-pdf-viewer">
            <!-- Mobile PDF display using object tag -->
            <object :data="uploadedCV.url" type="application/pdf" class="mobile-pdf-iframe">
              <embed :src="uploadedCV.url" type="application/pdf" class="mobile-pdf-iframe">
              <div class="pdf-fallback-mobile">
                <div class="pdf-icon">📄</div>
                <p>{{ getCurrentCVFileName() }}</p>
              </div>
            </object>
            <!-- Mobile action buttons -->
            <div class="mobile-pdf-actions">
              <a :href="uploadedCV.url" :download="getCurrentCVFileName()" class="download-btn">
                Download CV
              </a>
              <button @click="openCVInNewTab" class="open-btn">
                Open in New Tab
              </button>
              <button @click="withdrawCV" class="withdraw-btn-mobile">
                Withdraw CV
              </button>
            </div>
          </div>
          <div v-else class="pdf-loading">Loading CV...</div>
        </div>
      </div>
    </div>
  </div>
</template>
