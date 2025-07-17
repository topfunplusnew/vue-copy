
<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { ElMessage } from 'element-plus';

// 类型定义
interface Workshop {
  id: number;
  title: string;
  time: string;
  speaker: string;
  description: string;
  tags: string[];
  meetingId: number;
  meetingName: string;
}

interface Meeting {
  id: number;
  name: string;
  date: string;
  location: string;
  workshops: Workshop[];
}

// 定义事件
const emit = defineEmits<{
  close: [];
  confirm: [workshops: Workshop[]];
}>();

// 响应式数据
const searchQuery = ref('');
const selectedMeeting = ref<Meeting | null>(null);
const selectedWorkshops = ref<Workshop[]>([]);

// 移动端选中工作坊弹窗状态
const mobileSelectedDrawer = ref(false);

// 模拟会议数据
const meetings = ref<Meeting[]>([
  {
    id: 1,
    name: 'Tech Innovation Summit 2024',
    date: '2024-03-15',
    location: 'San Francisco, CA',
    workshops: [
      {
        id: 101,
        title: 'AI in Travel Industry',
        time: '09:00 - 10:30',
        speaker: 'Dr. Sarah Chen',
        description: 'Explore how artificial intelligence is transforming the travel and tourism industry.',
        tags: ['AI', 'Travel', 'Innovation'],
        meetingId: 1,
        meetingName: 'Tech Innovation Summit 2024'
      },
      {
        id: 102,
        title: 'Sustainable Tourism Practices',
        time: '11:00 - 12:30',
        speaker: 'Mark Johnson',
        description: 'Learn about eco-friendly travel practices and sustainable tourism development.',
        tags: ['Sustainability', 'Environment', 'Tourism'],
        meetingId: 1,
        meetingName: 'Tech Innovation Summit 2024'
      },
      {
        id: 103,
        title: 'Digital Marketing for Travel',
        time: '14:00 - 15:30',
        speaker: 'Lisa Wang',
        description: 'Master digital marketing strategies specifically for travel businesses.',
        tags: ['Marketing', 'Digital', 'Strategy'],
        meetingId: 1,
        meetingName: 'Tech Innovation Summit 2024'
      }
    ]
  },
  {
    id: 2,
    name: 'Global Travel Conference',
    date: '2024-03-20',
    location: 'New York, NY',
    workshops: [
      {
        id: 201,
        title: 'Virtual Reality in Tourism',
        time: '10:00 - 11:30',
        speaker: 'Alex Rodriguez',
        description: 'Discover how VR technology is enhancing travel experiences.',
        tags: ['VR', 'Technology', 'Experience'],
        meetingId: 2,
        meetingName: 'Global Travel Conference'
      },
      {
        id: 202,
        title: 'Cultural Exchange Programs',
        time: '13:00 - 14:30',
        speaker: 'Emily Davis',
        description: 'Building bridges through cultural exchange and community tourism.',
        tags: ['Culture', 'Exchange', 'Community'],
        meetingId: 2,
        meetingName: 'Global Travel Conference'
      }
    ]
  },
  {
    id: 3,
    name: 'Adventure Travel Expo',
    date: '2024-03-25',
    location: 'Denver, CO',
    workshops: [
      {
        id: 301,
        title: 'Safety in Adventure Tourism',
        time: '09:30 - 11:00',
        speaker: 'Captain Tom Wilson',
        description: 'Essential safety protocols and risk management in adventure travel.',
        tags: ['Safety', 'Adventure', 'Risk Management'],
        meetingId: 3,
        meetingName: 'Adventure Travel Expo'
      },
      {
        id: 302,
        title: 'Photography in Nature',
        time: '11:30 - 13:00',
        speaker: 'Natalie Green',
        description: 'Capture stunning nature photography during your adventures.',
        tags: ['Photography', 'Nature', 'Adventure'],
        meetingId: 3,
        meetingName: 'Adventure Travel Expo'
      }
    ]
  }
]);

// 计算属性
const filteredMeetings = computed(() => {
  if (!searchQuery.value) {
    return meetings.value;
  }
  
  return meetings.value.filter(meeting => 
    meeting.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
    meeting.location.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
    meeting.workshops.some(workshop => 
      workshop.title.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      workshop.speaker.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      workshop.tags.some(tag => tag.toLowerCase().includes(searchQuery.value.toLowerCase()))
    )
  );
});

// 方法
const handleSearch = () => {
  // 搜索逻辑已在计算属性中处理
};

const selectMeeting = (meeting: Meeting) => {
  selectedMeeting.value = meeting;
};

const isWorkshopSelected = (workshopId: number) => {
  return selectedWorkshops.value.some(workshop => workshop.id === workshopId);
};

const toggleWorkshop = (workshop: Workshop) => {
  const index = selectedWorkshops.value.findIndex(w => w.id === workshop.id);
  if (index > -1) {
    selectedWorkshops.value.splice(index, 1);
  } else {
    selectedWorkshops.value.push(workshop);
  }
};

const removeWorkshop = (workshopId: number) => {
  selectedWorkshops.value = selectedWorkshops.value.filter(w => w.id !== workshopId);
};

// 新增：点击选中的workshop时切换到对应会议
const switchToMeeting = (workshop: Workshop) => {
  const targetMeeting = meetings.value.find(meeting => meeting.id === workshop.meetingId);
  if (targetMeeting) {
    selectedMeeting.value = targetMeeting;
    ElMessage.info(`Switched to ${workshop.meetingName}`);
  }
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

const confirmSelection = () => {
  if (selectedWorkshops.value.length === 0) {
    ElMessage.warning('Please select at least one workshop');
    return;
  }
  
  ElMessage.success(`${selectedWorkshops.value.length} workshop(s) added to your schedule`);
  emit('confirm', selectedWorkshops.value);
  emit('close');
};

// 移动端抽屉控制
const showMobileSelected = () => {
  mobileSelectedDrawer.value = true;
};

const closeMobileSelected = () => {
  mobileSelectedDrawer.value = false;
};

// 生命周期
onMounted(() => {
  // 默认选择第一个会议
  if (meetings.value.length > 0) {
    selectedMeeting.value = meetings.value[0];
  }
});
</script>

<style scoped>
@import '@/styles/components/_meeting-component.scss';
</style>


<template>
  <div class="meeting-overlay" @click.self="$emit('close')">
    <div class="meeting-dialog">
      <!-- 弹窗头部 -->
      <div class="meeting-header">
        <h2 class="meeting-title">
          <el-icon class="title-icon"><Calendar /></el-icon>
          Meetings & Workshops
        </h2>
        <button class="close-btn" @click="$emit('close')">
          <el-icon><Close /></el-icon>
        </button>
      </div>

      <!-- 搜索区域 -->
      <div class="search-section">
        <el-input
          v-model="searchQuery"
          placeholder="Search meetings or workshops..."
          class="search-input"
          clearable
          @input="handleSearch"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
      </div>

      <!-- 主要内容区域 - 三栏布局 -->
      <div class="meeting-content">
        <!-- 左栏：会议列表 -->
        <div class="meetings-list">
          <h3 class="section-title">Available Meetings</h3>
          <div class="meetings-scroll">
            <div
              v-for="meeting in filteredMeetings"
              :key="meeting.id"
              class="meeting-card"
              :class="{ 'active': selectedMeeting?.id === meeting.id }"
              @click="selectMeeting(meeting)"
            >
              <div class="meeting-info">
                <h4 class="meeting-name">{{ meeting.name }}</h4>
                <p class="meeting-date">{{ formatDate(meeting.date) }}</p>
                <p class="meeting-location">📍 {{ meeting.location }}</p>
                <span class="workshop-count">{{ meeting.workshops.length }} workshops</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 中栏：工作坊列表 -->
        <div class="workshops-section">
          <div class="workshops-list" v-if="selectedMeeting">
            <h3 class="section-title">
              Workshops for {{ selectedMeeting.name }}
            </h3>
            <div class="workshops-scroll">
              <div
                v-for="workshop in selectedMeeting.workshops"
                :key="workshop.id"
                class="workshop-card"
                :class="{ 'selected': isWorkshopSelected(workshop.id) }"
                @click="toggleWorkshop(workshop)"
              >
                <div class="workshop-header">
                  <h4 class="workshop-title">{{ workshop.title }}</h4>
                  <span class="workshop-time">🕐 {{ workshop.time }}</span>
                </div>
                <p class="workshop-speaker">👤 {{ workshop.speaker }}</p>
                <p class="workshop-description">{{ workshop.description }}</p>
                <div class="workshop-tags">
                  <span v-for="tag in workshop.tags" :key="tag" class="workshop-tag">
                    {{ tag }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 右栏：选择的工作坊 (PC端显示) -->
        <div class="selected-workshops desktop-only">
          <h3 class="section-title">
            My Selected Workshops
            <span v-if="selectedWorkshops.length > 0" class="selected-count-badge">
              {{ selectedWorkshops.length }}
            </span>
          </h3>
          <div class="selected-scroll">
            <div v-if="selectedWorkshops.length === 0" class="no-selection">
              <div class="no-selection-content">
                <el-icon class="no-selection-icon"><Calendar /></el-icon>
                <p class="no-selection-text">No workshops selected</p>
                <p class="no-selection-hint">Click on workshops to add them to your schedule</p>
              </div>
            </div>
            <div
              v-for="workshop in selectedWorkshops"
              :key="workshop.id"
              class="selected-workshop-item"
              @click="switchToMeeting(workshop)"
            >
              <div class="selected-workshop-info">
                <h5 class="selected-title">{{ workshop.title }}</h5>
                <div class="selected-details">
                  <span class="selected-time">🕐 {{ workshop.time }}</span>
                  <span class="selected-speaker">👤 {{ workshop.speaker }}</span>
                </div>
                <div class="selected-tags">
                  <span v-for="tag in workshop.tags.slice(0, 2)" :key="tag" class="selected-tag">
                    {{ tag }}
                  </span>
                </div>
              </div>
              <button
                class="remove-btn"
                @click.stop="removeWorkshop(workshop.id)"
                title="Remove workshop"
              >
                <el-icon><Close /></el-icon>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- 底部操作按钮 -->
      <div class="meeting-footer">
        <div class="footer-info">
          <span v-if="selectedWorkshops.length > 0">
            {{ selectedWorkshops.length }} workshop(s) selected
          </span>
        </div>
        <div class="footer-actions">
          <el-button @click="$emit('close')">Cancel</el-button>
          <el-button
            type="primary"
            :disabled="selectedWorkshops.length === 0"
            @click="confirmSelection"
          >
            Confirm Selection
          </el-button>
        </div>
      </div>
    </div>

    <!-- 移动端浮动选择按钮 -->
    <button 
      v-if="selectedWorkshops.length > 0"
      class="mobile-selected-fab mobile-only"
      @click="showMobileSelected"
    >
      <el-icon class="fab-icon"><List /></el-icon>
      <span class="fab-count">{{ selectedWorkshops.length }}</span>
    </button>

    <!-- 移动端选中工作坊抽屉 -->
    <div 
      v-if="mobileSelectedDrawer" 
      class="mobile-drawer-overlay mobile-only"
      @click="closeMobileSelected"
    >
      <div class="mobile-drawer" @click.stop>
        <!-- 抽屉头部 -->
        <div class="mobile-drawer-header">
          <div class="drawer-handle"></div>
          <h3 class="drawer-title">
            My Selected Workshops
            <span class="drawer-count">{{ selectedWorkshops.length }}</span>
          </h3>
          <button class="drawer-close-btn" @click="closeMobileSelected">
            <el-icon><Close /></el-icon>
          </button>
        </div>

        <!-- 抽屉内容 -->
        <div class="mobile-drawer-content">
          <div v-if="selectedWorkshops.length === 0" class="drawer-no-selection">
            <el-icon class="no-selection-icon"><Calendar /></el-icon>
            <p class="no-selection-text">No workshops selected</p>
          </div>
          <div
            v-for="workshop in selectedWorkshops"
            :key="workshop.id"
            class="drawer-workshop-item"
            @click="switchToMeeting(workshop); closeMobileSelected();"
          >
            <div class="drawer-workshop-info">
              <h5 class="drawer-workshop-title">{{ workshop.title }}</h5>
              <div class="drawer-details">
                <span class="drawer-time">🕐 {{ workshop.time }}</span>
                <span class="drawer-speaker">👤 {{ workshop.speaker }}</span>
              </div>
              <div class="drawer-tags">
                <span v-for="tag in workshop.tags.slice(0, 3)" :key="tag" class="drawer-tag">
                  {{ tag }}
                </span>
              </div>
            </div>
            <button
              class="drawer-remove-btn"
              @click.stop="removeWorkshop(workshop.id)"
              title="Remove workshop"
            >
              <el-icon><Close /></el-icon>
            </button>
          </div>
        </div>

        <!-- 抽屉底部操作 -->
        <div class="mobile-drawer-actions">
          <el-button @click="closeMobileSelected" class="drawer-action-btn">
            Continue Browsing
          </el-button>
          <el-button
            type="primary"
            :disabled="selectedWorkshops.length === 0"
            @click="confirmSelection"
            class="drawer-action-btn"
          >
            Confirm ({{ selectedWorkshops.length }})
          </el-button>
        </div>
      </div>
    </div>
  </div>
</template>
