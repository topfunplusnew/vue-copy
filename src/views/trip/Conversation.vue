<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';

const route = useRoute();
const prompt = ref('');

onMounted(() => {
  // 从 query 参数中获取生成的 prompt
  prompt.value = (route.query.prompt as string) || '';
});
</script>

<template>
  <div class="conversation">
    <h1>Conversation</h1>
    <div class="conversation-box">
      <pre>{{ prompt }}</pre>
    </div>
    <!-- 此处可扩展更多对话功能 -->
  </div>
</template>

<style scoped>
.conversation {
  padding: 2rem;
}
.conversation-box {
  background: rgba(255, 255, 255, 0.1);
  padding: 1rem;
  border-radius: 8px;
}
</style>
