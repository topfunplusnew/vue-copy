<script setup lang="ts">
import { ref, reactive, onMounted, computed, nextTick } from 'vue';
import { VueCropper } from 'vue-cropper';
import 'vue-cropper/dist/index.css';
import { useUserStore } from '@/stores/user';
import { useRouter } from 'vue-router';
import { getImageUrl } from '@/utils';
import { ElMessage, ElMessageBox } from 'element-plus';
import { formatRange } from '@/utils/date';
import commonHeader from '@/layout/common-header.vue';
import { useConferenceStore } from '@/stores/conference';
const store = useUserStore();
const router = useRouter();
const conferencesStory = useConferenceStore();

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
  store.getUserBlogList(true);
  conferencesStory.getConferenceDetails(4);
  conferencesStory.getConferenceList();
});

function handleLogout() {
  store.logout();
  router.push({ name: 'login' });
}

const user = computed(() => store.user);
const uploadfile = ref<HTMLElement | null>(null);

function onUpload() {
  showCropper.value = true;
  if (uploadfile.value) uploadfile.value.click();
}
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

function cropSuccess() {
  cropperRef.value.getCropBlob((image: Blob) => {
    store.uploadImage(image).then(({ data }) => {
      editForm.avatar = data.avatar;
    });
    showCropper.value = false;
  });
}

const showEditProfile = ref(false);
const editForm = reactive({
  name: user.value?.name,
  avatar: user.value?.avatar,
});

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
  editForm.name = user.value?.name;
  editForm.avatar = user.value?.avatar;
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

function cancelCrop() {
  showCropper.value = false;
  if (showEditProfile.value) {
    editForm.avatar = user.value?.avatar;
  }
}

const isWalletConnected = computed(() => {
  return false;
});

const isSocialModalVisible = ref(false);

function showSocialModal() {
  isSocialModalVisible.value = true;
  document.body.style.overflow = 'hidden';

  store.getFollowings();
  store.getFollowers();
}
const showContactModal = ref(false);
const showCVModal = ref(false);

const contactForm = reactive({
  email: '',
  phone: '',
  website: '',
  linkedin: '',
  twitter: '',
  orcid: '',
});

const cvFile = ref<File | null>(null);
const cvUploadRef = ref<HTMLElement | null>(null);
const uploadedCV = ref<{ file: File; uploadDate: string; url: string } | null>(null);

const showCVPreviewModal = ref(false);
const isMobile = computed(() => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth <= 768;
});

const openContactModal = () => {
  showContactModal.value = true;
  document.body.style.overflow = 'hidden';
};

const closeContactModal = () => {
  showContactModal.value = false;
  document.body.style.overflow = '';
};

const submitContactInfo = () => {
  console.log('Contact info submitted:', contactForm);
  ElMessage.success('Contact information saved successfully!');
  closeContactModal();
};

const openCVModal = () => {
  showCVModal.value = true;
  document.body.style.overflow = 'hidden';
};

const closeCVModal = () => {
  showCVModal.value = false;
  document.body.style.overflow = '';
};

const handleCVUpload = (event: Event) => {
  const target = event.target as HTMLInputElement;
  const file = target.files ? target.files[0] : null;
  if (file) {
    cvFile.value = file;
    console.log('CV file selected:', file.name);
  }
};

const submitCV = () => {
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
};

const openCVPreview = () => {
  if (uploadedCV.value) {
    showCVPreviewModal.value = true;
    document.body.style.overflow = 'hidden';
  }
};

const closeCVPreview = () => {
  showCVPreviewModal.value = false;
  document.body.style.overflow = '';
};

const getCurrentCVFileName = () => {
  return uploadedCV.value?.file.name || 'document.pdf';
};

const openCVInNewTab = () => {
  if (uploadedCV.value?.url) {
    window.open(uploadedCV.value.url, '_blank');
  }
};

const withdrawCV = () => {
  ElMessageBox.confirm('Are you sure you want to withdraw your CV? This action cannot be undone.', 'Withdraw CV', {
    confirmButtonText: 'Withdraw',
    cancelButtonText: 'Cancel',
    type: 'warning',
  })
    .then(() => {
      if (uploadedCV.value?.url) {
        URL.revokeObjectURL(uploadedCV.value.url);
      }
      uploadedCV.value = null;
      console.log('CV withdrawn');
      ElMessage.success('CV withdrawn successfully!');
      closeCVPreview();
    })
};

const currentParticipations = computed(() => conferencesStory.details);
const featuredEvents = computed(() => conferencesStory.list);

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

            <!-- TODO 这里 如果已经登录，那么就展示My Events  -->
            <div v-if="store.isLogin()">
              <div v-if="currentParticipations" class="conference-list">
                <div class="conference-card">
                  <div class="conference-header">
                    <div class="conference-name-container">
                      <img
                        v-if="currentParticipations.logoUrl"
                        :src="currentParticipations.logoUrl"
                        :alt="currentParticipations.name + ' logo'"
                        class="conference-logo"
                        @error="handleLogoError"
                        @load="handleLogoLoad"
                      />
                      <div class="conference-name">{{ currentParticipations.name }}</div>
                    </div>
                    <div class="submission-count">{{ currentParticipations.sessions.length }} papers</div>
                  </div>
                  <div class="submission-list">
                    <div
                      v-for="(sub, idx) in currentParticipations.sessions"
                      :key="idx"
                      class="submission-item"
                      @click="router.push({ name: 'MyEventDetail', params: { conferenceId: currentParticipations.id, paperId: idx } })"
                    >
                      <div class="paper-title">{{ sub.session_name }}</div>
                      <div class="authors">
                        <span>{{ sub.chairperson }}</span>
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
                    <img v-if="evt.logoUrl" :src="evt.logoUrl" :alt="evt.name + ' logo'" class="featured-event-logo" @error="handleLogoError" @load="handleLogoLoad" />
                    <div class="featured-name">{{ evt.name }}</div>
                  </div>
                  <div class="featured-date">{{ formatRange(evt.start_time, evt.end_time) }}</div>
                </div>
                <div class="featured-meta">
                  <span class="featured-location">{{ evt.place_name }}</span>
                  <a v-if="evt.website" class="featured-link" :href="evt.website" target="_blank" rel="noopener">Website</a>
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
          <input ref="uploadfile" style="display: none" type="file" class="upload-avatar" accept="image/*" @change="handleEditAvatarUpload" />
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
              <input ref="cvUploadRef" type="file" accept=".pdf,.doc,.docx" @change="handleCVUpload" style="display: none" />
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
