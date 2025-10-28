<script setup lang="ts">
import { ref, reactive, onMounted, computed, nextTick } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import { VueCropper } from 'vue-cropper';
import 'vue-cropper/dist/index.css';
import { useUserStore } from '@/stores/user';
import { useConferenceStore } from '@/stores/conference';
import commonHeader from '@/layout/common-header.vue';
import { getImageUrl } from '@/utils';
import { formatRange } from '@/utils/date';

const store = useUserStore();
const router = useRouter();
<<<<<<< HEAD:src/views/conference-view.vue
const conferencesStory = useConferenceStore();
=======
const conferencesStore = useConferenceStore();

const showEditProfile = ref(false);
const editForm = reactive({
  name: '',
  avatar: '',
});

const showCropper = ref(false);
const cropperRef = ref();
const cropImage = ref('');
const uploadfile = ref<HTMLElement | null>(null);
const cropOption = {
  autoCrop: true,
  fixedBox: true,
  outputType: 'png',
  centerBox: true,
  infoTrue: true,
  full: false,
  canMoveBox: true,
  original: false,
  canScale: true,
  fixed: true,
  fixedNumber: [1, 1],
};

const isDragging = ref(false);
const dragOffset = reactive({ x: 0, y: 0 });
const editProfilePosition = reactive({ x: 0, y: 0 });

const showContactModal = ref(false);
const contactForm = reactive({
  email: '',
  phone: '',
  website: '',
  linkedin: '',
  twitter: '',
  orcid: '',
});

const showCVModal = ref(false);
const showCVPreviewModal = ref(false);
const cvFile = ref<File | null>(null);
const cvUploadRef = ref<HTMLElement | null>(null);
const uploadedCV = ref<{ file: File; uploadDate: string; url: string } | null>(null);

const user = computed(() => store.user);

const isWalletConnected = computed(() => {
  return false;
});

const isMobile = computed(() => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth <= 768;
});

const currentMyConferenceList = computed(() => conferencesStore.myConferenceList);
const featuredEvents = computed(() => conferencesStore.list);
>>>>>>> 77f9935f741c22c4bae183759e6095ae8494e9fc:src/views/conference.vue

onMounted(() => {
  nextTick(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    document.body.scrollTop = 0;
    document.documentElement.scrollTop = 0;
  });

  store.getUserInfo().then(({ data }) => {
    editForm.name = data.name;
    editForm.avatar = data.avatar;
  });
<<<<<<< HEAD:src/views/conference-view.vue
  store.getUserBlogList(true);
  conferencesStory.getMyConference();
  conferencesStory.getConferenceList();

=======
  conferencesStore.getMyConference();
  conferencesStore.getConferencesList();
>>>>>>> 77f9935f741c22c4bae183759e6095ae8494e9fc:src/views/conference.vue
});

function handleLogout() {
  store.logout();
  router.push({ name: 'login' });
}

function showSocialModal() {
  store.getFollowings();
  store.getFollowers();
}

<<<<<<< HEAD:src/views/conference-view.vue
const uploadfile = ref<HTMLElement | null>(null);

=======
>>>>>>> 77f9935f741c22c4bae183759e6095ae8494e9fc:src/views/conference.vue
function onUpload() {
  showCropper.value = true;
  if (uploadfile.value) uploadfile.value.click();
}

<<<<<<< HEAD:src/views/conference-view.vue
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
  autoCrop: true,
  fixedBox: true,
  outputType: 'png',
  centerBox: true,
  infoTrue: true,
  full: false,
  canMoveBox: true,
  original: false,
  canScale: true,
  fixed: true,
  fixedNumber: [1, 1],
};
const cropImage = ref('');


// 修改裁剪完成函数，直接更新头像
=======
>>>>>>> 77f9935f741c22c4bae183759e6095ae8494e9fc:src/views/conference.vue
function cropSuccess() {
  cropperRef.value.getCropBlob((image: Blob) => {
    store.uploadImage(image).then(({ data }) => {
<<<<<<< HEAD:src/views/conference-view.vue
      editForm.avatar = data.avatar;
=======
      editForm.avatar = data.avatar || '';
>>>>>>> 77f9935f741c22c4bae183759e6095ae8494e9fc:src/views/conference.vue
    });
    showCropper.value = false;
  });
}

function cancelCrop() {
  showCropper.value = false;
  if (showEditProfile.value) {
    editForm.avatar = user.value?.avatar || '';
  }
}

function submitProfileEdit() {
  store
    .editUserInfo(editForm)
    .then((res) => {
      console.log(res);
    })
    .catch((e) => console.log(e));
  showEditProfile.value = false;
}

function cancelProfileEdit() {
<<<<<<< HEAD:src/views/conference-view.vue
  editForm.name = user.value?.name;
  editForm.avatar = user.value?.avatar;
=======
  editForm.name = user.value?.name || '';
  editForm.avatar = user.value?.avatar || '';
>>>>>>> 77f9935f741c22c4bae183759e6095ae8494e9fc:src/views/conference.vue
  showEditProfile.value = false;
}

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

<<<<<<< HEAD:src/views/conference-view.vue
// 修改取消裁剪函数
function cancelCrop() {
  showCropper.value = false;
  // 如果在编辑个人信息中
  if (showEditProfile.value) {
    editForm.avatar = user.value?.avatar;
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
  document.body.style.overflow = 'hidden';

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
  orcid: '',
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
=======
function openContactModal() {
>>>>>>> 77f9935f741c22c4bae183759e6095ae8494e9fc:src/views/conference.vue
  showContactModal.value = true;
  document.body.style.overflow = 'hidden';
}

function closeContactModal() {
  showContactModal.value = false;
  document.body.style.overflow = '';
}

function submitContactInfo() {
  console.log('Contact info submitted:', contactForm);
  ElMessage.success('Contact information saved successfully!');
  closeContactModal();
}

function openCVModal() {
  showCVModal.value = true;
  document.body.style.overflow = 'hidden';
}

function closeCVModal() {
  showCVModal.value = false;
  document.body.style.overflow = '';
}

function handleCVUpload(event: Event) {
  const target = event.target as HTMLInputElement;
  const file = target.files ? target.files[0] : null;
  if (file) {
    cvFile.value = file;
    console.log('CV file selected:', file.name);
  }
}

function submitCV() {
  if (!cvFile.value) {
    ElMessage.warning('Please select a CV file first');
    return;
  }

  uploadedCV.value = {
    file: cvFile.value,
    uploadDate: new Date().toLocaleDateString(),
    url: URL.createObjectURL(cvFile.value),
  };

  console.log('CV uploaded:', cvFile.value);
  ElMessage.success('CV uploaded successfully!');
  closeCVModal();
  cvFile.value = null;
}

function openCVPreview() {
  if (uploadedCV.value) {
    showCVPreviewModal.value = true;
    document.body.style.overflow = 'hidden';
  }
}

function closeCVPreview() {
  showCVPreviewModal.value = false;
  document.body.style.overflow = '';
}

function getCurrentCVFileName() {
  return uploadedCV.value?.file.name || 'document.pdf';
}

function openCVInNewTab() {
  if (uploadedCV.value?.url) {
    window.open(uploadedCV.value.url, '_blank');
  }
}

<<<<<<< HEAD:src/views/conference-view.vue
// Remove/Withdraw CV
const withdrawCV = () => {
=======
function withdrawCV() {
>>>>>>> 77f9935f741c22c4bae183759e6095ae8494e9fc:src/views/conference.vue
  ElMessageBox.confirm('Are you sure you want to withdraw your CV? This action cannot be undone.', 'Withdraw CV', {
    confirmButtonText: 'Withdraw',
    cancelButtonText: 'Cancel',
    type: 'warning',
  })
    .then(() => {
      if (uploadedCV.value?.url) {
        URL.revokeObjectURL(uploadedCV.value.url);
      }
<<<<<<< HEAD:src/views/conference-view.vue

      // Clear the uploaded CV
      uploadedCV.value = null;

      // TODO: Implement API call to remove CV from server
      console.log('CV withdrawn');
      ElMessage.success('CV withdrawn successfully!');

      // Close the preview modal
      closeCVPreview();
    })
};

const currentParticipations = computed(() => conferencesStory.details);
const featuredEvents = computed(() => conferencesStory.list);

const handleLogoError = (event: Event) => {
=======
      uploadedCV.value = null;
      console.log('CV withdrawn');
      ElMessage.success('CV withdrawn successfully!');
      closeCVPreview();
    })
    .catch(() => {});
}

function handleLogoError(event: Event) {
>>>>>>> 77f9935f741c22c4bae183759e6095ae8494e9fc:src/views/conference.vue
  const img = event.target as HTMLImageElement;
  console.error('Logo failed to load:', img.src);
  img.style.display = 'none';
}

function handleLogoLoad(event: Event) {
  const img = event.target as HTMLImageElement;
  console.log('Logo loaded successfully:', img.src);
}
</script>

<template>
  <div class="background-layer"></div>
  <div class="about layout-main">
    <commonHeader />

    <div class="user-page">
      <section class="main-content">
        <aside class="sidebar" :class="{ 'wallet-connected': isWalletConnected }">
          <div class="profile-buttons">
            <button class="edit-profile-btn" @click="showEditProfile = true">EDIT PROFILE</button>
            <button class="logout-btn" @click="handleLogout">LOGOUT</button>
          </div>
          <div class="user-info">
            <div class="avatar-section">
              <div class="avatar-container">
                <img :src="getImageUrl(user?.avatar)" alt="User Avatar" class="avatar" />
                <div class="avatar-upload-icon">
                  <i class="el-icon-camera"></i>
                </div>
              </div>
            </div>
            <div class="username">{{ user?.name }}</div>
            <div class="user-id">ID: {{ user?.id }}</div>
            <div class="user-institution">MUST</div>
            <div class="stats">
              <div class="stat">
                <span class="number">{{ user?.likes }}</span>
                <span class="label">Likes</span>
              </div>
            </div>
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

            <div class="additional-buttons">
              <button class="contact-info-btn" @click="openContactModal">CONTACT INFO</button>
              <button v-if="!uploadedCV" class="upload-cv-btn" @click="openCVModal">UPLOAD CV</button>
              <button v-else class="view-cv-btn" @click="openCVPreview">VIEW CV</button>
            </div>
          </div>
        </aside>

        <div class="vertical-divider-us"></div>
        <section class="events">
          <div class="current-participations">
            <div class="section-title">My Events</div>

<<<<<<< HEAD:src/views/conference-view.vue
            <!-- TODO 这里 如果已经登录，那么就展示My Events  -->
            <div v-if="store.isLogin()">
              <div v-if="currentParticipations" class="conference-list" v-for="cur in currentParticipations"
                :key="cur.id">
                <div class="conference-card">
                  <div class="conference-header">
                    <div class="conference-name-container">
                      <img v-if="cur.logoUrl" :src="cur.logoUrl" :alt="cur.name + ' logo'" class="conference-logo"
                        @error="handleLogoError" @load="handleLogoLoad" />
                      <div class="conference-name">{{ cur.name }}</div>
                    </div>
                    <div class="submission-count">{{ cur.sessions.length }} papers</div>
                  </div>

                  <div class="submission-list">
                    <div v-for="(sub, idx) in cur.sessions" :key="idx" class="submission-item"
                      @click="router.push({ name: 'MyEventDetail', params: { conferenceId: cur.id, paperId: sub.id } })">
                      <div class="paper-title">{{ sub.session_name }}</div>
                      <div class="authors">
                        <span v-for="(author, i) in sub.chairperson" :key="i" class="author">
                          {{ author }}<span v-if="i < sub.chairperson.length - 1">, </span>
                        </span>
=======
            <template v-if="currentMyConferenceList?.length">
              <div class="conference-list" v-for="cur in currentMyConferenceList" :key="cur.id">
                <div class="conference-card">
                  <div class="conference-header">
                    <div class="conference-name-container">
                      <img v-if="cur.logo" :src="cur.logo" :alt="cur.name + ' logo'" class="conference-logo" @error="handleLogoError" @load="handleLogoLoad" />
                      <div class="conference-name">{{ cur.name }}</div>
                    </div>
                  </div>

                  <div class="submission-list">
                    <div
                      v-for="sub in cur.my_papers"
                      :key="sub.paper_id"
                      class="submission-item"
                      @click="router.push({ name: 'MyEventDetail', params: { conferenceId: cur.id, paperId: sub.paper_id } })"
                    >
                      <div class="paper-title">{{ sub.paper_title }}</div>
                      <div class="authors">
                        <span v-for="(author, i) in sub.authors" :key="i" class="author"> {{ author }}<span v-if="i < sub.authors.length - 1">, </span> </span>
>>>>>>> 77f9935f741c22c4bae183759e6095ae8494e9fc:src/views/conference.vue
                      </div>
                    </div>
                  </div>
                </div>
              </div>
<<<<<<< HEAD:src/views/conference-view.vue
=======
            </template>
>>>>>>> 77f9935f741c22c4bae183759e6095ae8494e9fc:src/views/conference.vue

              <div v-else class="empty-state">
                <div class="empty-title">No current participations</div>
                <div class="empty-desc">When you join or submit to a conference, it will appear here.</div>
              </div>
            </div>
            <div v-else>
              <el-button type="primary" @click="router.push({ name: 'login' })">Login to check detail</el-button>
            </div>
          </div>

          <div class="featured-events">
            <div class="section-header">
              <div class="section-title">Featured Events</div>
            </div>

            <div v-if="featuredEvents.length > 0" class="featured-list">
              <div v-for="evt in featuredEvents" :key="evt.id" class="featured-card" @click="router.push({ name: 'FeaturedEvents', params: { conferenceId: evt.id } })">
                <div class="featured-header">
                  <div class="featured-name-container">
                    <img v-if="evt.logo" :src="evt.logo" :alt="evt.name + ' logo'" class="featured-event-logo" @error="handleLogoError" @load="handleLogoLoad" />
                    <div class="featured-name">{{ evt.name }}</div>
                  </div>
                  <div class="featured-date">{{ formatRange(evt.start_time, evt.end_time) }}</div>
                </div>
                <div class="featured-meta">
                  <span class="featured-location">{{ evt.place_name }}</span>
                  <a v-if="evt.website" class="featured-link" :href="evt.website" target="_blank" rel="noopener"> Website </a>
                </div>
                <div v-if="evt.keywords?.length" class="featured-topics">
                  <span class="topic-tag" v-for="(t, i) in evt.keywords" :key="i">
                    {{ t.name }}
                  </span>
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

<<<<<<< HEAD:src/views/conference-view.vue

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
=======
      <el-dialog v-model="showCropper" class="crop-dialog" title="Edit Avatar" :close-on-click-modal="true" :show-close="true" destroy-on-close>
>>>>>>> 77f9935f741c22c4bae183759e6095ae8494e9fc:src/views/conference.vue
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
<<<<<<< HEAD:src/views/conference-view.vue
          <input ref="uploadfile" style="display: none" type="file" class="upload-avatar" accept="image/*"
            @change="handleEditAvatarUpload" />
=======
          <input ref="uploadfile" style="display: none" type="file" class="upload-avatar" accept="image/*" @change="handleEditAvatarUpload" />
>>>>>>> 77f9935f741c22c4bae183759e6095ae8494e9fc:src/views/conference.vue
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

      <div class="cv-modal" v-if="showCVModal">
        <div class="cv-modal-container">
          <div class="modal-header">
            <h2>Upload CV</h2>
            <button class="close-btn" @click="closeCVModal">×</button>
          </div>
          <div class="modal-content">
            <div class="upload-area">
<<<<<<< HEAD:src/views/conference-view.vue
              <input ref="cvUploadRef" type="file" accept=".pdf,.doc,.docx" @change="handleCVUpload"
                style="display: none" />
=======
              <input ref="cvUploadRef" type="file" accept=".pdf,.doc,.docx" @change="handleCVUpload" style="display: none" />
>>>>>>> 77f9935f741c22c4bae183759e6095ae8494e9fc:src/views/conference.vue
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
          <iframe v-if="uploadedCV?.url && !isMobile" :src="uploadedCV.url" class="pdf-viewer" frameborder="0"></iframe>
          <div v-else-if="uploadedCV?.url && isMobile" class="mobile-pdf-viewer">
            <object :data="uploadedCV.url" type="application/pdf" class="mobile-pdf-iframe">
              <embed :src="uploadedCV.url" type="application/pdf" class="mobile-pdf-iframe" />
              <div class="pdf-fallback-mobile">
                <div class="pdf-icon">📄</div>
                <p>{{ getCurrentCVFileName() }}</p>
              </div>
            </object>
            <div class="mobile-pdf-actions">
              <a :href="uploadedCV.url" :download="getCurrentCVFileName()" class="download-btn"> Download CV </a>
              <button @click="openCVInNewTab" class="open-btn">Open in New Tab</button>
              <button @click="withdrawCV" class="withdraw-btn-mobile">Withdraw CV</button>
            </div>
          </div>
          <div v-else class="pdf-loading">Loading CV...</div>
        </div>
      </div>
    </div>
  </div>
</template>
