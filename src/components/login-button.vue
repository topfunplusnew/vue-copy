<script setup lang="ts">
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { Auth } from '@/services/auth';

const router = useRouter();
const auth = new Auth();

const handleLoginClick = async () => {
  if (auth.get()) {
    // 已登录状态
    ElMessage({
      message: 'You are already logged in',
      type: 'info',
      duration: 2000
    });
    return;
  }
  // 未登录状态，跳转到登录页面
  router.push({ name: 'login' });
};
</script>

<template>
  <el-button 
    class="nav-button" 
    @click="handleLoginClick"
  >
    LOGIN
  </el-button>
</template> 