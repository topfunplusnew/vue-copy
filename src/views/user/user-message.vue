<script setup lang="ts">
import { ref, computed, nextTick, onMounted } from 'vue';
import { Close, Search, Warning, ChatDotRound, Promotion } from '@element-plus/icons-vue';
import { getImageUrl } from '@/utils';
import { useUserStore } from '@/stores/user';
import type { IUser } from '@/types/user';

interface Message {
  id: number;
  content: string;
  senderId: number;
  timestamp: Date;
}

interface Chat {
  id: number;
  user: IUser;
  messages: Message[];
  lastMessage?: Message;
  unreadCount: number;
}

// Props
defineProps<{
  visible: boolean;
}>();

// Emits
const emit = defineEmits<{
  'update:visible': [value: boolean];
}>();

// Stores
const userStore = useUserStore();

// Reactive data
const searchQuery = ref('');
const selectedChat = ref<Chat | null>(null);
const newMessage = ref('');
const messagesContainer = ref<HTMLElement>();

// Mock data (replace with API calls)
const chats = ref<Chat[]>([
  {
    id: 1,
    user: { id: 2, name: 'Alice Johnson', avatar: '/default-avatar.png', isOnline: true },
    messages: [
      { id: 1, content: 'Hey! How are you?', senderId: 2, timestamp: new Date('2024-01-20 10:30') },
      { id: 2, content: "I'm good! Thanks for asking", senderId: 1, timestamp: new Date('2024-01-20 10:32') },
    ],
    unreadCount: 1,
  },
  {
    id: 2,
    user: { id: 3, name: 'Bob Smith', avatar: '/default-avatar.png', isOnline: false },
    messages: [{ id: 3, content: 'Are you free for a trip planning session?', senderId: 3, timestamp: new Date('2024-01-19 14:20') }],
    unreadCount: 0,
  },
]);

// Computed
const currentUserId = computed(() => userStore.user?.id || 1);

const filteredChats = computed(() => {
  if (!searchQuery.value) return chats.value;
  return chats.value.filter((chat) => chat.user.name.toLowerCase().includes(searchQuery.value.toLowerCase()));
});

// Methods
const closeModal = () => {
  emit('update:visible', false);
};

const handleSearch = () => {
  // API call for user search can be added here
  console.log('Searching for:', searchQuery.value);
};

const selectChat = (chat: Chat) => {
  selectedChat.value = chat;
  chat.unreadCount = 0; // Mark as read

  // Scroll to bottom of messages
  nextTick(() => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
    }
  });
};

const sendMessage = () => {
  if (!newMessage.value.trim() || !selectedChat.value) return;

  const message: Message = {
    id: Date.now(),
    content: newMessage.value,
    senderId: currentUserId.value,
    timestamp: new Date(),
  };

  selectedChat.value.messages.push(message);
  selectedChat.value.lastMessage = message;
  newMessage.value = '';

  // Scroll to bottom
  nextTick(() => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
    }
  });

  // TODO: Send to API
};

const formatTime = (timestamp?: Date) => {
  if (!timestamp) return '';

  const now = new Date();
  const diff = now.getTime() - timestamp.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'now';
  if (minutes < 60) return `${minutes}m`;
  if (hours < 24) return `${hours}h`;
  return `${days}d`;
};

// Update last messages
onMounted(() => {
  chats.value.forEach((chat) => {
    chat.lastMessage = chat.messages[chat.messages.length - 1];
  });
});
</script>

<template>
  <!-- 消息弹窗遮罩 -->
  <div class="message-overlay" v-if="visible" @click="closeModal">
    <!-- 消息弹窗主体 -->
    <div class="message-modal" @click.stop>
      <!-- 弹窗头部 -->
      <div class="modal-header">
        <h2 class="modal-title">Messages</h2>
        <button class="close-btn" @click="closeModal">
          <el-icon><Close /></el-icon>
        </button>
      </div>

      <!-- 弹窗内容 -->
      <div class="modal-content">
        <!-- 左侧聊天列表 -->
        <div class="chat-list-section">
          <!-- 搜索框 -->
          <div class="search-section">
            <el-input v-model="searchQuery" placeholder="Search users..." class="user-search" clearable @input="handleSearch">
              <template #prefix>
                <el-icon><Search /></el-icon>
              </template>
            </el-input>
          </div>

          <!-- 聊天列表 -->
          <div class="chat-list">
            <div v-for="chat in filteredChats" :key="chat.id" class="chat-item" :class="{ active: selectedChat?.id === chat.id }" @click="selectChat(chat)">
              <div class="chat-avatar">
                <img :src="getImageUrl(chat.user.avatar)" :alt="chat.user.name" />
                <div class="online-status" :class="{ online: chat.user.isOnline }"></div>
              </div>

              <div class="chat-info">
                <div class="chat-header">
                  <span class="username">{{ chat.user.name }}</span>
                  <span class="time">{{ formatTime(chat.lastMessage?.timestamp) }}</span>
                </div>
                <div class="last-message">
                  <span class="message-text">{{ chat.lastMessage?.content || 'No messages yet' }}</span>
                  <div class="unread-badge" v-if="chat.unreadCount > 0">{{ chat.unreadCount }}</div>
                </div>
              </div>
            </div>

            <!-- 无搜索结果 -->
            <div class="no-results" v-if="filteredChats.length === 0 && searchQuery">
              <el-icon><Warning /></el-icon>
              <span>No users found</span>
            </div>

            <!-- 空状态 -->
            <div class="empty-state" v-if="chats.length === 0">
              <el-icon><ChatDotRound /></el-icon>
              <span>No conversations yet</span>
            </div>
          </div>
        </div>

        <!-- 右侧聊天详情 -->
        <div class="chat-detail-section">
          <!-- 选中聊天时显示 -->
          <div v-if="selectedChat" class="chat-detail">
            <!-- 聊天头部 -->
            <div class="chat-detail-header">
              <div class="chat-user-info">
                <img :src="getImageUrl(selectedChat.user.avatar)" :alt="selectedChat.user.name" />
                <div class="user-details">
                  <span class="username">{{ selectedChat.user.name }}</span>
                  <span class="status" :class="{ online: selectedChat.user.isOnline }">
                    {{ selectedChat.user.isOnline ? 'Online' : 'Offline' }}
                  </span>
                </div>
              </div>
            </div>

            <!-- 消息列表 -->
            <div class="messages-container" ref="messagesContainer">
              <div v-for="message in selectedChat.messages" :key="message.id" class="message-item" :class="{ 'own-message': message.senderId === currentUserId }">
                <div class="message-bubble">
                  <span class="message-content">{{ message.content }}</span>
                  <span class="message-time">{{ formatTime(message.timestamp) }}</span>
                </div>
              </div>
            </div>

            <!-- 消息输入框 -->
            <div class="message-input-section">
              <el-input v-model="newMessage" placeholder="Type a message..." class="message-input" @keydown.enter="sendMessage">
                <template #append>
                  <button class="send-btn" @click="sendMessage" :disabled="!newMessage.trim()">
                    <el-icon><Promotion /></el-icon>
                  </button>
                </template>
              </el-input>
            </div>
          </div>

          <!-- 未选中聊天时的空状态 -->
          <div v-else class="chat-placeholder">
            <el-icon><ChatDotRound /></el-icon>
            <h3>Select a conversation</h3>
            <p>Choose a conversation from the list to start messaging</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
