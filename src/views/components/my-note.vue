<script setup lang="ts">
import { ref,onMounted ,computed} from 'vue';
import { Document, Edit } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import router from '@/router';

// Define the note data structure

import { useUserStore } from '@/stores/user';
// Mock data

const store = useUserStore();
const notes=computed(()=>store.notes);
onMounted(() => {
    store.getUserInfo().then(()=>{
        store.getMyNoteList();
    }).catch(()=>{
        ElMessage.error('Failed to load notes');
        router.push({ path: '/login' });
    })
        
});
// const notes = ref<INote[]>([
//   {
//     id: 1,
//     eventType: 'presentation',
//     time: '1 day ago',
//     subject: 'We-S2-T10.2 Presentation',
//     content: 'The rapid adoption of Large Language Models (LLMs) in unmanned systems has significantly enhanced the semantic understanding and autonomous task execution capabilities of Unmanned Aerial Vehicle (UAV)...'
//   },
//   {
//     id: 2,
//     eventType: 'presentation',
//     time: '1 day ago',
//     subject: 'Mo-Online.a252 Presentation',
//     content: 'DAO'
//   }
// ]);

// Conference selection
const selectedConference = ref('smc2025');

// Handle edit action
const handleEdit = (noteId: number) => {
  console.log('Edit note:', noteId);
  // Implement edit functionality here
};
</script>

<template>
  <div class="my-notes">
    <header class="notes-header">
      <h2 class="notes-title">My Notes</h2>
    </header>
    <div class="conference-bar">
      <el-select v-model="selectedConference" placeholder="Select Conference" class="conference-bar-select">
        <el-option label="SMC 2025 - IEEE International Conference on Systems, Man, and Cybernetics" value="smc2025" />
      </el-select>
    </div>
    <main class="notes-content">
      <table class="notes-table">
        <thead>
          <tr class="table-header-row">
            <th class="table-header">Event</th>
            <th class="table-header">Time</th>
            <th class="table-header">Subject</th>
            <th class="table-header">My Note</th>
            <th class="table-header"></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="note in notes" :key="note.id" class="table-row">
            <td class="table-cell">
              <div class="event-icon">
                <el-icon class="icon"><Document /></el-icon>
              </div>
            </td>
            <td class="table-cell">{{ note.time }}</td>
            <td class="table-cell">{{ note.subject }}</td>
            <td class="table-cell note-content">{{ note.content }}</td>
            <td class="table-cell action-cell">
              <el-button size="small" @click="handleEdit(note.id)" class="edit-button">
                <el-icon class="edit-icon"><Edit /></el-icon>
              </el-button>
            </td>
          </tr>
        </tbody>
      </table>
    </main>
  </div>
</template>

<style scoped>
.my-notes {
  width: 100%;
  background-color: #fff;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.notes-header {
  display: flex;
  justify-content: flex-start;
  align-items: center;
  background-color: #fff;
  padding: 12px 20px;
}

.notes-title {
  font-size: 24px;
  font-weight: 600;
  color: #333;
  margin: 0;
}

.conference-bar {
  background-color: #ffa500;
  padding: 8px 20px;
  display: flex;
  justify-content: flex-end;
  align-items: center;
}

.conference-bar-select {
  width: 400px;
  background-color: rgba(255, 255, 255, 0.9);
  border: none;
}

.notes-content {
  padding: 0;
}

.notes-table {
  width: 100%;
  border-collapse: collapse;
}

.table-header-row {
  background-color: #808080;
  color: #fff;
}

.table-header {
  font-weight: 600;
  text-align: left;
  padding: 12px 16px;
  font-size: 14px;
  border-bottom: none;
}

.table-row {
  border-bottom: 1px solid #e8e8e8;
  transition: background-color 0.3s;
}

.table-row:nth-child(odd) {
  background-color: #f9f9f9;
}

.table-row:hover {
  background-color: #fafbfc;
}

.table-cell {
  padding: 16px;
  color: #333;
}

.event-icon {
  width: 40px;
  height: 40px;
  background-color: #1e90ff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.icon {
  font-size: 20px;
  color: #fff;
}

.note-content {
  max-width: 500px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.action-cell {
  text-align: center;
}

.edit-button {
  padding: 4px 8px;
  border-radius: 4px;
  background-color: #ffa500;
  border-color: #ffa500;
  color: #fff;
}

.edit-button:hover {
  background-color: #ff8c00;
  border-color: #ff8c00;
  color: #fff;
}

.edit-icon {
  font-size: 14px;
}

/* Mobile responsiveness */
@media (max-width: 768px) {
  .notes-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }

  .conference-bar {
    justify-content: flex-start;
  }

  .conference-bar-select {
    width: 100%;
  }

  .notes-content {
    padding: 0;
  }

  .table-header, .table-cell {
    padding: 8px 12px;
    font-size: 13px;
  }

  .note-content {
    max-width: 200px;
  }
}
</style>