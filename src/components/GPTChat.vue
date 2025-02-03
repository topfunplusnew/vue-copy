<template>
  <div class="gpt-chat">
    <div class="messages">
      <div v-for="message in messages" :key="message.id" class="message">
        <span>{{ message.sender }}:</span> {{ message.text }}
      </div>
    </div>
    <input v-model="newMessage" @keyup.enter="sendMessage" placeholder="Type a message..." />
    <button @click="sendMessage">Send</button>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue';

export default defineComponent({
  name: 'GPTChat',
  setup() {
    const messages = ref([]);
    const newMessage = ref('');

    const sendMessage = async () => {
      if (newMessage.value.trim() === '') return;

      messages.value.push({ id: Date.now(), sender: 'User', text: newMessage.value });
      const response = await fetchGPTResponse(newMessage.value);
      messages.value.push({ id: Date.now() + 1, sender: 'GPT', text: response });

      newMessage.value = '';
    };

    const fetchGPTResponse = async (message: string) => {
      // Replace with actual API call to GPT model
      return `Response to: ${message}`;
    };

    return {
      messages,
      newMessage,
      sendMessage
    };
  }
});
</script>

<style scoped>
.gpt-chat {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1rem;
  border: 1px solid #ccc;
  border-radius: 8px;
}

.messages {
  flex: 1;
  overflow-y: auto;
}

.message {
  margin-bottom: 0.5rem;
}

input {
  padding: 0.5rem;
  border: 1px solid #ccc;
  border-radius: 4px;
}

button {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  background-color: #4CAF50;
  color: #fff;
  cursor: pointer;
  font-weight: bold;
  transition: background-color 0.3s ease;

  &:hover {
    background-color: #45a049;
  }
}
</style>
