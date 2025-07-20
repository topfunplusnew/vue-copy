<script setup lang="ts">
import { ref, reactive, computed } from 'vue';
import Captcha from '@/components/captcha-item.vue';
import { userSignup } from '@/services/api';
import { useRouter } from 'vue-router';
import { ElInput, ElMessage } from 'element-plus';
import { SuccessFilled } from '@element-plus/icons-vue';
import commonHeader from '@/layout/common-header.vue';

const msg = 'Join the iPoloGO Beta';
const router = useRouter();

// 页面状态：register, invitation, waiting, success
const currentStep = ref('register');
const errorMessage = ref('');
const isVerified = ref(true);
const isLoading = ref(false);
const signupSuccess = ref(false);

// 注册表单
const editForm = reactive({
  email: '',
  password: '',
  password_confirm: '',
  name: '',
});

// 邀请码表单
const invitationForm = reactive({
  invitationCode: '',
  email: ''
});

// 排队表单
const waitingForm = reactive({
  email: '',
  reason: ''
});

const passwordStrength = ref(0);
const passwordRequirements = reactive({
  length: false,
  uppercase: false,
  number: false,
  special: false
});

// 页面标题和描述
const pageContent = computed(() => {
  switch (currentStep.value) {
    case 'register':
      return {
        title: 'Join the iPoloGO Beta',
        subtitle: 'Create your account to get early access to our travel platform'
      };
    case 'invitation':
      return {
        title: 'Welcome to iPoloGO!',
        subtitle: 'Enter your invitation code to continue, or join our waitlist'
      };
    case 'waiting':
      return {
        title: 'Join Our Waitlist',
        subtitle: 'Get notified when iPoloGO launches publicly'
      };
    case 'success':
      return {
        title: 'You\'re All Set!',
        subtitle: 'We\'ll email you as soon as iPoloGO is ready for you'
      };
    default:
      return { title: '', subtitle: '' };
  }
});

const checkPasswordStrength = () => {
  let strength = 0;
  const password = editForm.password;

  passwordRequirements.length = password.length >= 8;
  if (passwordRequirements.length) strength += 1;

  passwordRequirements.uppercase = /[A-Z]/.test(password);
  if (passwordRequirements.uppercase) strength += 1;

  passwordRequirements.number = /[0-9]/.test(password);
  if (passwordRequirements.number) strength += 1;

  passwordRequirements.special = /[^A-Za-z0-9]/.test(password);
  if (passwordRequirements.special) strength += 1;

  passwordStrength.value = strength;
};

// 处理注册提交
const handleSignup = async () => {
  if (!editForm.email || !editForm.password || !editForm.password_confirm) {
    errorMessage.value = 'Please fill in all the fields.';
    return;
  }

  if (editForm.password !== editForm.password_confirm) {
    errorMessage.value = 'Passwords do not match.';
    return;
  }

  if (!isVerified.value) {
    errorMessage.value = 'Please complete the CAPTCHA.';
    return;
  }

  if (passwordStrength.value < 2) {
    const missingRequirements = [];
    if (!passwordRequirements.length) missingRequirements.push('at least 8 characters');
    if (!passwordRequirements.uppercase) missingRequirements.push('uppercase letter');
    if (!passwordRequirements.number) missingRequirements.push('number');
    if (!passwordRequirements.special) missingRequirements.push('special character');

    errorMessage.value = `Password is too weak. Please include: ${missingRequirements.join(', ')}`;
    return;
  }

  isLoading.value = true;
  errorMessage.value = '';

  try {
    await userSignup({
      email: editForm.email,
      password: editForm.password,
      password_confirm: editForm.password_confirm,
      name: editForm.name,
    });
    
    // 注册成功，进入邀请码步骤
    invitationForm.email = editForm.email;
    currentStep.value = 'invitation';
    signupSuccess.value = true;
  } catch (error: any) {
    if (error.response && error.response.data && error.response.data.message) {
      errorMessage.value = `Registration failed: ${error.response.data.message}`;
    } else {
      errorMessage.value = 'Registration failed. Please try again.';
    }
  } finally {
    isLoading.value = false;
  }
};

// 处理邀请码提交
const handleInvitationCode = async () => {
  if (!invitationForm.invitationCode.trim()) {
    errorMessage.value = 'Please enter your invitation code.';
    return;
  }

  isLoading.value = true;
  errorMessage.value = '';

  try {
    // 这里应该调用验证邀请码的API
    // await validateInvitationCode(invitationForm.invitationCode);
    
    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // 验证成功，进入成功页面
    currentStep.value = 'success';
    ElMessage.success('Invitation code verified successfully!');
  } catch (error) {
    errorMessage.value = 'Invalid invitation code. Please check and try again.';
  } finally {
    isLoading.value = false;
  }
};

// 加入等待列表
const joinWaitlist = async () => {
  if (!waitingForm.email.trim()) {
    errorMessage.value = 'Please enter your email address.';
    return;
  }

  isLoading.value = true;
  errorMessage.value = '';

  try {
    // 这里应该调用加入等待列表的API
    // await joinWaitingList(waitingForm);
    
    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    currentStep.value = 'success';
    ElMessage.success('Successfully joined the waitlist!');
  } catch (error) {
    errorMessage.value = 'Failed to join waitlist. Please try again.';
  } finally {
    isLoading.value = false;
  }
};

// 切换到等待列表
const switchToWaitlist = () => {
  waitingForm.email = invitationForm.email;
  currentStep.value = 'waiting';
  errorMessage.value = '';
};

// 返回邀请码输入
const backToInvitation = () => {
  currentStep.value = 'invitation';
  errorMessage.value = '';
};

// 完成流程，跳转到主页
const completeProcess = () => {
  setTimeout(() => {
    router.push({ name: 'home' });
  }, 2000);
};

// 当成功页面显示时，自动跳转
if (currentStep.value === 'success') {
  completeProcess();
}
</script>

<template>
  <div class="background-layer"></div>
  <div class="invitation layout-main">
    <commonHeader />
    
    <div class="invitation-hero">
      <div class="header-title-invitation">{{ pageContent.title }}</div>
      <div class="invitation-subtitle">{{ pageContent.subtitle }}</div>
    </div>

    <div class="invitation-container" :class="{ 'success': currentStep === 'success' }">
      
      <!-- 成功页面 -->
      <div v-if="currentStep === 'success'" class="success-message">
        <div class="success-icon">
          <el-icon><SuccessFilled /></el-icon>
        </div>
        <h3>Welcome to iPoloGO Beta!</h3>
        <p>We'll notify you via email as soon as our platform is ready for you to explore.</p>
        <div class="success-actions">
          <el-button @click="completeProcess" type="primary" class="continue-button">
            Continue to Dashboard
          </el-button>
        </div>
      </div>

      <!-- 注册表单 -->
      <form @submit.prevent="handleSignup" v-else-if="currentStep === 'register'">
        <div class="form-title-invitation">Create Your Beta Account</div>
        <p v-if="errorMessage" class="error-message">{{ errorMessage }}</p>

        <div class="form-group-invitation">
          <label for="username">Username</label>
          <el-input type="text" id="username" v-model="editForm.name"
          placeholder="How should we call you?" />
        </div>

        <div class="form-group-invitation">
          <label for="email">Email</label>
          <el-input type="email" id="email" v-model="editForm.email"
          placeholder="example@domain.com" required />
        </div>

        <div class="form-group-invitation">
          <label for="password">Password</label>
          <el-input
            v-model="editForm.password"
            id="password"
            type="password"
            placeholder="Min 8 characters with letters, numbers & symbols"
            show-password
            @input="checkPasswordStrength"
            required
          />
        </div>
        
        <div class="password-strength-invitation">
          <div class="strength-meter-invitation">
            <div
              class="strength-bar-invitation"
              :style="{ width: `${passwordStrength * 25}%` }"
              :class="{
                'weak': passwordStrength === 1,
                'medium': passwordStrength === 2,
                'strong': passwordStrength === 3,
                'very-strong': passwordStrength === 4
              }"
            ></div>
          </div>
          <span class="strength-text-invitation" v-if="editForm.password">
            {{ ['Weak', 'Fair', 'Good', 'Strong'][passwordStrength - 1] || 'Too Weak' }}
          </span>
        </div>

        <div class="form-group-invitation">
          <label for="confirmPassword">Confirm Password</label>
          <el-input
            v-model="editForm.password_confirm"
            id="confirmPassword"
            type="password"
            placeholder="Re-enter password"
            show-password
            required
          />
        </div>

        <button type="submit" class="invitation-button" :disabled="isLoading">
          <span v-if="!isLoading">Create Account</span>
          <span v-else class="loading-spinner"></span>
        </button>

        <div class="login-link">
          Already have an account? <router-link :to="{ name: 'login' }">Log in</router-link>
        </div>
      </form>

      <!-- 邀请码输入 -->
      <div v-else-if="currentStep === 'invitation'" class="invitation-step">
        <div class="form-title-invitation">Enter Invitation Code</div>
        <p class="step-description">
          Enter your invitation code below to get immediate access to iPoloGO Beta.
        </p>
        <p v-if="errorMessage" class="error-message">{{ errorMessage }}</p>

        <div class="form-group-invitation">
          <label for="invitationCode">Invitation Code</label>
          <el-input
            v-model="invitationForm.invitationCode"
            id="invitationCode"
            placeholder="Enter your invitation code"
            class="invitation-code-input"
          />
        </div>

        <div class="invitation-actions">
          <button @click="handleInvitationCode" class="invitation-button" :disabled="isLoading">
            <span v-if="!isLoading">Verify Code</span>
            <span v-else class="loading-spinner"></span>
          </button>

          <div class="or-divider">
            <span>or</span>
          </div>

          <button @click="switchToWaitlist" class="waitlist-button" type="button">
            Join Waitlist Instead
          </button>
        </div>

        <div class="help-text">
          <p>Don't have an invitation code? Join our waitlist and we'll send you one as soon as spots become available.</p>
        </div>
      </div>

      <!-- 等待列表 -->
      <div v-else-if="currentStep === 'waiting'" class="waiting-step">
        <div class="form-title-invitation">Join Our Waitlist</div>
        <p class="step-description">
          Be among the first to know when iPoloGO Beta opens to the public.
        </p>
        <p v-if="errorMessage" class="error-message">{{ errorMessage }}</p>

        <div class="form-group-invitation">
          <label for="waitingEmail">Email Address</label>
          <el-input
            v-model="waitingForm.email"
            id="waitingEmail"
            type="email"
            placeholder="your.email@domain.com"
          />
        </div>

        <div class="form-group-invitation">
          <label for="reason">Why are you interested in iPoloGO? (Optional)</label>
          <el-input
            v-model="waitingForm.reason"
            id="reason"
            type="textarea"
            placeholder="Tell us about your travel interests..."
            :rows="3"
          />
        </div>

        <div class="waiting-actions">
          <button @click="joinWaitlist" class="invitation-button" :disabled="isLoading">
            <span v-if="!isLoading">Join Waitlist</span>
            <span v-else class="loading-spinner"></span>
          </button>

          <button @click="backToInvitation" class="back-button" type="button">
            Back to Invitation Code
          </button>
        </div>

        <div class="help-text">
          <p>We'll email you as soon as iPoloGO Beta becomes available. No spam, we promise!</p>
        </div>
      </div>

    </div>
  </div>
</template>

<style scoped>
@import '@/styles/pages/invitation.scss';
</style>
