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
const featuredConferenceList = computed(() => conferencesStore.conferenceList);
const isLoadingMyEvents = ref(true);

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
  isLoadingMyEvents.value = true;
  conferencesStore.getMyConference().finally(() => {
    isLoadingMyEvents.value = false;
  });
  conferencesStore.getConferencesList();
});

function handleLogout() {
  store.logout();
  router.push({ name: 'login' });
}

function showSocialModal() {
  store.getFollowings();
  store.getFollowers();
}

function onUpload() {
  showCropper.value = true;
  if (uploadfile.value) uploadfile.value.click();
}

function cropSuccess() {
  cropperRef.value.getCropBlob((image: Blob) => {
    store.uploadImage(image).then(({ data }) => {
      editForm.avatar = data.avatar || '';
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
  editForm.name = user.value?.name || '';
  editForm.avatar = user.value?.avatar || '';
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

function openContactModal() {
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

function withdrawCV() {
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
    .catch(() => { });
}

function handleLogoError(event: Event) {
  const img = event.target as HTMLImageElement;
  console.error('Logo failed to load:', img.src);
  img.style.display = 'none';
}

function handleLogoLoad(event: Event) {
  const img = event.target as HTMLImageElement;
  console.log('Logo loaded successfully:', img.src);
}

// 格式化字符串，使第一个字母大写，其他字母小写
function formatFirstLetterUppercase(str: string): string {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}
</script>
  
  <template>
    <div class="background-layer"></div>
    <div class="about layout-main">
      <commonHeader />

    <div class="user-page">
      <section class="main-content">
        <!-- <div class="sidebar" :class="{ 'wallet-connected': isWalletConnected }">
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
        </div> -->

        <div class="vertical-divider-us"></div>
        <section class="events">

          <div class="current-participations">
            <div class="section-header-with-avatar">
              <div class="left-section">
                <router-link v-if="store.isLogin()" :to="{ name: 'userpage' }" class="user-avatar-link">
                  <img :src="getImageUrl(user?.avatar)" alt="User Avatar" class="user-avatar-small" />
                </router-link>
                <div class="section-title">My Events</div>
              </div>
              <button v-if="store.isLogin()" class="sign-out-btn" @click="handleLogout">
                <svg class="sign-out-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M17 16L21 12M21 12L17 8M21 12H7" stroke="currentColor" stroke-width="2.5"
                    stroke-linecap="round" stroke-linejoin="round" />
                  <path
                    d="M13 16V17C13 18.6569 11.6569 20 10 20H6C4.34315 20 3 18.6569 3 17V7C3 5.34315 4.34315 4 6 4H10C11.6569 4 13 5.34315 13 7V8"
                    stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />
                </svg>
                <span class="sign-out-text">Sign Out</span>
              </button>
            </div>

            <div v-if="store.isLogin()">
              <div v-if="isLoadingMyEvents" class="loading-state">
                <div class="loading-spinner"></div>
                <div class="loading-text">Loading events...</div>
              </div>
              <template v-else-if="currentMyConferenceList?.length">
                <div class="conference-list" v-for="cur in currentMyConferenceList" :key="cur.id">
                  <div class="conference-card">
                    <div class="conference-header">
                      <div class="conference-name-container">
                        <img v-if="cur.logo" :src="getImageUrl(cur.logo)" :alt="cur.name + ' logo'"
                          class="conference-logo" @error="handleLogoError" @load="handleLogoLoad" />
                        <div class="conference-name">{{ cur.name }}</div>
                      </div>
                    </div>

                    <div class="submission-list">
                      <router-link :to="{ name: 'MyEventDetail', params: { paperId: sub.paper_id } }"
                        v-for="sub in cur.my_papers" :key="sub.paper_id" class="submission-item">
                        <div class="paper-title">{{ sub.paper_title }}</div>
                        <div class="authors">
                          <span v-for="(author, i) in sub.authors" :key="i" class="author"> {{ author }}<span
                              v-if="i < sub.authors.length - 1">, </span> </span>
                        </div>
                      </router-link>
                    </div>
                  </div>
                </div>
              </template>

              <div v-else class="empty-state-redesigned">
                <div class="empty-icon">📝</div>
                <div class="empty-title">No Events Yet</div>
                <div class="empty-desc">You haven't participated in any conferences yet.</div>
                <div class="empty-hint">Submit a paper or register for a conference to get started!</div>
                <div class="empty-desc">Already have a conference paper? Please contact us at ipologo.os@gmail.com
                  with your paper details to receive the link.</div>
              </div>
            </div>
            <div v-else class="login-prompt">
              <div class="login-icon">🔒</div>
              <div class="login-message">Sign in to view your events</div>
              <el-button type="primary" class="login-btn" @click="router.push({ name: 'login' })">
                Sign In
              </el-button>
            </div>
          </div>

          <div class="featured-events">
            <div class="section-header">
              <div class="section-title">Featured Events</div>
            </div>

            <div v-if="featuredConferenceList.length > 0" class="featured-list">
              <router-link :to="{ name: 'FeaturedEvents', params: { conferenceId: featuredConference.id } }"
                v-for="featuredConference in featuredConferenceList" :key="featuredConference.id" class="featured-card">
                <div class="featured-header">
                  <div class="featured-name-container-1">
                    <img v-if="featuredConference.logo" :src="getImageUrl(featuredConference.logo)"
                      :alt="featuredConference.name + ' logo'" class="featured-event-logo" @error="handleLogoError"
                      @load="handleLogoLoad" />
                    <div class="featured-name">{{ featuredConference.name }}</div>
                  </div>
                  <div class="featured-date">
                    <span>{{ formatRange(featuredConference.start_time, featuredConference.end_time) }}</span>
                  </div>
                </div>
                <div class="featured-meta">
                  <span class="featured-location">{{ featuredConference.place_name }}</span>
                  <a v-if="featuredConference.website" class="featured-link" :href="featuredConference.website"
                    target="_blank" rel="noopener" @click.stop> Website </a>
                </div>
                <div v-if="featuredConference.keywords?.length" class="featured-topics">
                  <span class="topic-tag" v-for="(t, i) in featuredConference.keywords" :key="i">
                    {{ i === 0 ? formatFirstLetterUppercase(t.name) : t.name }}
                  </span>

                </div>
              </router-link>
            </div>

            <div v-else class="empty-state">
              <div class="empty-title">No featured events</div>
              <div class="empty-desc">We will curate high-quality conferences here soon.</div>
            </div>
          </div>
        </section>
      </section>

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

      <div class="edit-profile-modal" v-if="showEditProfile">
        <div class="edit-profile-container" :style="{
          transform: `translate(${editProfilePosition.x}px, ${editProfilePosition.y}px)`,
        }" @mousedown="startDrag" @mousemove="onDrag" @mouseup="stopDrag" @mouseleave="stopDrag">
          <h2>Edit Profile</h2>
          <input ref="uploadfile" style="display: none" type="file" class="upload-avatar" accept="image/*"
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
              <input ref="cvUploadRef" type="file" accept=".pdf,.doc,.docx" @change="handleCVUpload"
                style="display: none" />
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

<style scoped>
  .loading-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 40px 0;
  }
  
  .loading-spinner {
    width: 40px;
    height: 40px;
    border: 4px solid #f3f3f3;
    border-top: 4px solid #1890ff;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin-bottom: 16px;
  }
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  
  .loading-text {
    color: #606266;
    font-size: 14px;
  }
</style>
