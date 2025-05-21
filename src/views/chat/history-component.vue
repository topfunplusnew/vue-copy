<script setup lang="ts">
import { ref, computed, watch, onMounted, reactive } from 'vue';

import { useChatStore } from '@/stores/chat';
import { useRouter } from 'vue-router';

import MarkdownIt from 'markdown-it';
const md = new MarkdownIt();

const store = useChatStore();
const message = computed(()=> store.message);
const messages = computed(() => store.messages);
const conversations = computed(() => store.conversations);

const router = useRouter();

function loadHistory(id:number|undefined) {
  if(id) store.getChatsByConversationID(id).catch(e=>console.log(e));
}

const showHistory = ref(false);

const toggleHistory = () => {
  showHistory.value = !showHistory.value;
};


onMounted(async() => {
  const query = router.currentRoute.value.query;
  if(query && query.prompt && query.prompt.length > 0) {
    await store.chat(query.prompt as string);
  }
  store.getConversasions()
  // const {prompt, location, destination} = router.currentRoute.value.query;

});

</script>

<template>
  <!-- 历史记录模态窗口背景遮罩 -->
  <div class="modal-overlay" v-if="showHistory" @click="toggleHistory"></div>
  <!-- 历史记录模态窗口 -->
  <transition name="slide-up">
    <div class="history-modal" v-if="showHistory">
      <div class="history-modal-content">
        <div class="history-modal-header">
          <h3>Conversation History</h3>
          <button class="close-btn" @click="toggleHistory">&times;</button>
        </div>

        <div class="history-modal-body">
          <div v-if="conversations.length === 0" class="empty-history">
            <i class="el-icon-chat-dot-square"></i>
            <p>No previous conversations found</p>
            <p class="empty-hint">Start a new chat to create history</p>
          </div>

          <ul class="history-list" v-else>
            <li
              v-for="(conversation, idx) in conversations"
              :key="idx"
              @click="loadHistory(conversation.id); toggleHistory();"
              class="history-item"
            >
              <div class="history-item-content">
                <span class="history-title">{{ conversation.title || 'Untitled Conversation' }}</span>
                <span class="history-date">{{ conversation.created_at }}</span>
              </div>
              <i class="el-icon-right"></i>
            </li>
          </ul>
        </div>

        <div class="history-modal-footer">
          <el-button @click="toggleHistory" class="action-btn cancel-btn">Close</el-button>
        </div>
      </div>
    </div>
  </transition>


</template>
