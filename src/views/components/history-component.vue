<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { ElMessage } from 'element-plus';
import { useChatStore } from '@/stores/chat';
import { useRouter } from 'vue-router';
import { 
  Close, 
  Search,
  Document,
  Right
} from '@element-plus/icons-vue';

// Props
interface Props {
  visible: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  visible: false
});

// Emits
const emit = defineEmits<{
  close: [];
  loadHistory: [id: number];
}>();

const store = useChatStore();
const router = useRouter();

const conversations = computed(() => store.conversations);
const searchQuery = ref('');

// 过滤对话列表
const filteredConversations = computed(() => {
  if (!searchQuery.value) {
    return conversations.value;
  }
  
  return conversations.value.filter(conversation => 
    (conversation.title || 'Untitled Conversation').toLowerCase().includes(searchQuery.value.toLowerCase()) ||
    (conversation.created_at || '').includes(searchQuery.value)
  );
});

// 处理搜索
const handleSearch = () => {
  // 搜索逻辑已在计算属性中处理
};

// 加载历史对话
function loadHistory(id: number | undefined) {
  if (id) {
    // 只负责emit事件，具体的加载逻辑由父组件处理
        emit('loadHistory', id);
        emit('close');
  }
}

// 格式化日期
const formatDate = (dateString: string | undefined) => {
  if (!dateString) return 'Unknown date';
  
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// 获取对话标题
const getConversationTitle = (conversation: any) => {
  return conversation.title || 'Untitled Conversation';
};

// 生命周期
onMounted(() => {
  // 当组件挂载时获取对话列表
  if (props.visible) {
    store.getConversasions().catch((e: any) => {
      console.error('Failed to load conversations:', e);
    });
  }
});

// 监听visible变化，获取数据
watch(() => props.visible, (newVisible) => {
  if (newVisible) {
    store.getConversasions().catch((e: any) => {
      console.error('Failed to load conversations:', e);
    });
  }
});
</script>

<template>
  <div class="history-overlay" @click.self="$emit('close')" v-if="visible">
    <div class="history-dialog">
      <!-- 弹窗头部 -->
      <div class="history-header">
        <h2 class="history-title">
          <el-icon class="title-icon"><Document /></el-icon>
          Conversation History
        </h2>
        <button class="close-btn" @click="$emit('close')">
          <el-icon><Close /></el-icon>
        </button>
      </div>

      <!-- 搜索区域 -->
      <div class="search-section">
        <el-input
          v-model="searchQuery"
          placeholder="Search conversations..."
          class="search-input"
          clearable
          @input="handleSearch"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
      </div>

      <!-- 主要内容区域 -->
      <div class="history-content">
        <!-- 空状态 -->
        <div v-if="filteredConversations.length === 0" class="empty-state">
          <div class="empty-content">
            <el-icon class="empty-icon"><Document /></el-icon>
            <p class="empty-text">No conversations found</p>
            <p class="empty-hint">
              {{ searchQuery ? 'Try adjusting your search terms' : 'Start a new chat to create history' }}
            </p>
          </div>
        </div>

        <!-- 对话列表 -->
        <div v-else class="conversations-list">
          <div class="conversations-scroll">
            <div
              v-for="(conversation, index) in filteredConversations"
              :key="conversation.id || index"
              class="conversation-card"
              @click="loadHistory(conversation.id)"
            >
              <div class="conversation-info">
                <h4 class="conversation-title">{{ getConversationTitle(conversation) }}</h4>
                <p class="conversation-date">{{ formatDate(conversation.created_at) }}</p>
              </div>
              <div class="conversation-action">
                <el-icon class="arrow-icon"><Right /></el-icon>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 底部操作按钮 -->
      <div class="history-footer">
        <div class="footer-info">
          <span v-if="filteredConversations.length > 0">
            {{ filteredConversations.length }} conversation(s) found
          </span>
        </div>
        <div class="footer-actions">
          <el-button @click="$emit('close')">Close</el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
@use '@/styles/pages/_generator-history.scss';
</style>
