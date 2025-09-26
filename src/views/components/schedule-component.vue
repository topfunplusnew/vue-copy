<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { ElMessage } from 'element-plus';

// 定义事件接口
interface ScheduleEvent {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD format
  time: string; // HH:MM format
  location?: string;
  description?: string;
  type: 'conference' | 'meeting' | 'deadline' | 'personal' | 'session' | 'custom';
  customColor?: string; // 自定义颜色 (hex格式)
  isUserSession?: boolean; // 是否为用户session
}

// 新事件表单接口
interface NewEventForm {
  title: string;
  date: Date | string;
  time: Date | string;
  location: string;
  description: string;
  type: 'conference' | 'meeting' | 'deadline' | 'personal' | 'session' | 'custom';
  customColor: string;
}

// Props
interface Props {
  visible: boolean;
  initialEvent?: Partial<ScheduleEvent>; // 从my_events传入的初始事件数据
}

const props = withDefaults(defineProps<Props>(), {
  visible: false,
  initialEvent: undefined
});

// Emits
const emit = defineEmits<{
  close: [];
  save: [event: ScheduleEvent];
}>();

// 响应式数据
const selectedDate = ref(new Date());
const events = ref<ScheduleEvent[]>([]);

// 移动端UI状态
const showAddEventForm = ref(false);
const isMobileDevice = ref(false);

// 新事件表单
const newEvent = ref<NewEventForm>({
  title: '',
  date: new Date(),
  time: new Date(),
  location: '',
  description: '',
  type: 'conference',
  customColor: '#6366f1' // 默认蓝色
});

// 预定义颜色选项
const predefinedColors = [
  '#6366f1', // 蓝紫色
  '#10b981', // 绿色
  '#ef4444', // 红色
  '#f59e0b', // 橙色
  '#ff8c00', // 深橙色(用户session)
  '#8b5cf6', // 紫色
  '#06b6d4', // 青色
  '#84cc16', // 亮绿色
  '#ec4899', // 粉色
  '#6b7280'  // 灰色
];

// 监听传入的初始事件数据
watch(() => props.initialEvent, (initialEvent) => {
  if (initialEvent && props.visible) {
    newEvent.value = {
      title: initialEvent.title || '',
      date: initialEvent.date ? new Date(initialEvent.date) : new Date(),
      time: initialEvent.time ? new Date(`1970-01-01T${initialEvent.time}:00`) : new Date(),
      location: initialEvent.location || '',
      description: initialEvent.description || '',
      type: initialEvent.type || 'conference',
      customColor: initialEvent.customColor || (initialEvent.type === 'session' ? '#ff8c00' : '#6366f1')
    };
  }
}, { immediate: true });

// 监听事件类型变化，自动调整默认颜色
watch(() => newEvent.value.type, (newType) => {
  if (newType === 'session' && newEvent.value.customColor === '#6366f1') {
    newEvent.value.customColor = '#ff8c00'; // 切换到session时使用橘色
  } else if (newType !== 'session' && newType !== 'custom' && newEvent.value.customColor === '#ff8c00') {
    newEvent.value.customColor = '#6366f1'; // 切换到其他类型时使用蓝色
  }
});

// 计算属性
const formatSelectedDate = computed(() => {
  return selectedDate.value.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
});

const selectedDateEvents = computed(() => {
  const dateStr = formatLocalDate(selectedDate.value);
  return events.value.filter(event => event.date === dateStr);
});

const canAddEvent = computed(() => {
  return newEvent.value.title.trim() !== '' && newEvent.value.date && newEvent.value.time;
});

// 统一的日期格式化函数，避免时区问题
const formatLocalDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// 方法
const closeModal = () => {
  emit('close');
};

const getEventsForDate = (dateStr: string) => {
  return events.value.filter(event => event.date === dateStr);
};

const isToday = (dateStr: string) => {
  const todayStr = formatLocalDate(new Date());
  return dateStr === todayStr;
};

const addEvent = () => {
  if (!canAddEvent.value) return;
  
  // 确保日期和时间是正确的格式
  const dateValue = newEvent.value.date instanceof Date 
    ? newEvent.value.date 
    : new Date(newEvent.value.date);
  const timeValue = newEvent.value.time instanceof Date 
    ? newEvent.value.time 
    : new Date(`1970-01-01T${newEvent.value.time}:00`);
  
  // 使用统一的日期格式化函数
  const formattedDate = formatLocalDate(dateValue);
  
  const event: ScheduleEvent = {
    id: Date.now().toString(),
    title: newEvent.value.title,
    date: formattedDate,
    time: formatTime(timeValue),
    location: newEvent.value.location,
    description: newEvent.value.description,
    type: newEvent.value.type,
    customColor: (newEvent.value.type === 'custom' || newEvent.value.type === 'session') ? newEvent.value.customColor : undefined,
    isUserSession: newEvent.value.type === 'session'
  };
  
  events.value.push(event);
  emit('save', event);
  
  ElMessage.success('Event added successfully!');
  resetNewEvent();
  
  // 切换到新添加事件的日期 - 构建正确的Date对象避免时区问题
  const [year, month, day] = event.date.split('-').map(Number);
  selectedDate.value = new Date(year, month - 1, day);
};

const removeEvent = (eventId: string) => {
  // 不允许删除默认会议事件
  if (eventId.startsWith('default-conf-')) {
    ElMessage.warning('Cannot remove default conference events!');
    return;
  }
  
  const index = events.value.findIndex(event => event.id === eventId);
  if (index > -1) {
    events.value.splice(index, 1);
    ElMessage.success('Event removed successfully!');
  }
};

const resetNewEvent = () => {
  newEvent.value = {
    title: '',
    date: new Date(),
    time: new Date(),
    location: '',
    description: '',
    type: 'conference',
    customColor: '#6366f1'
  };
};

const formatTime = (time: Date) => {
  return time.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
};

// 生成会议默认日程（December 9-15, 2025）
const generateDefaultConferenceEvents = () => {
  const conferenceEvents = [];
  const startDate = new Date(2025, 11, 9); // December 9, 2025 (month is 0-indexed)
  const days = 7; // December 9-15 = 7 days
  
  for (let i = 0; i < days; i++) {
    const currentDate = new Date(startDate);
    currentDate.setDate(startDate.getDate() + i);
    const formattedDate = formatLocalDate(currentDate);
    
    const conferenceEvent = {
      id: `default-conf-${i}`,
      title: `NeurIPS 2025 - Day ${i + 1}`,
      date: formattedDate,
      time: '09:00',
      location: 'Vancouver Convention Centre, Vancouver',
      description: `Neural Information Processing Systems conference day ${i + 1}`,
      type: 'conference' as const,
      isUserSession: false
    };
    
    conferenceEvents.push(conferenceEvent);
  }
  
  return conferenceEvents;
};

// 从localStorage加载用户个人事件
const loadUserEvents = () => {
  try {
    const storedUserEvents = localStorage.getItem('user-schedule-events');
    return storedUserEvents ? JSON.parse(storedUserEvents) : [];
  } catch (error) {
    console.error('Failed to load user events from localStorage:', error);
    return [];
  }
};

// 加载所有事件（默认会议日程 + 用户个人日程）
const loadEvents = () => {
  try {
    // 生成默认会议日程
    const defaultEvents = generateDefaultConferenceEvents();
    
    // 加载用户个人日程
    const userEvents = loadUserEvents();
    
    // 合并所有事件
    events.value = [...defaultEvents, ...userEvents];
    
  } catch (error) {
    console.error('Failed to load events:', error);
  }
};

// 保存用户事件到localStorage（不包括默认会议事件）
const saveUserEvents = () => {
  try {
    // 只保存用户添加的事件，不保存默认会议事件
    const userEvents = events.value.filter(event => !event.id.startsWith('default-conf-'));
    localStorage.setItem('user-schedule-events', JSON.stringify(userEvents));
  } catch (error) {
    console.error('Failed to save user events to localStorage:', error);
  }
};

// 监听事件变化并保存用户事件
watch(events, saveUserEvents, { deep: true });

// 检测移动端
const checkMobile = () => {
  isMobileDevice.value = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth <= 768;
};

// 切换添加事件表单显示
const toggleAddEventForm = () => {
  showAddEventForm.value = !showAddEventForm.value;
};

// 获取有事件的日期
const getEventDates = computed(() => {
  return events.value.map(event => event.date);
});

// 检查某日期是否有事件
const hasEvents = (dateStr: string) => {
  return events.value.some(event => event.date === dateStr);
};

// 获取简化的显示标题
const getDisplayTitle = (event: ScheduleEvent) => {
  const title = event.title;
  
  // 提取会议缩写 (如 "NeurIPS 2025 - My Presentation" -> "NeurIPS")
  if (event.type === 'session' && event.isUserSession) {
    const match = title.match(/^([A-Z]+\s*\d*)/);
    return match ? match[1] : title.split(' ')[0];
  }
  
  // 对于其他事件，PC端限制长度为6个字符，移动端4个字符
  const maxLength = isMobileDevice.value ? 4 : 6;
  if (title.length > maxLength) {
    return title.substring(0, maxLength) + '...';
  }
  
  return title;
};

// 获取事件样式
const getEventStyle = (event: ScheduleEvent) => {
  // 对于自定义类型或有自定义颜色的session，使用自定义颜色
  if (event.type === 'custom' && event.customColor) {
    return {
      backgroundColor: event.customColor,
      borderColor: event.customColor
    };
  }
  
  // 对于用户session，如果有自定义颜色，使用自定义颜色
  if (event.type === 'session' && event.isUserSession && event.customColor) {
    return {
      backgroundColor: event.customColor,
      borderColor: event.customColor,
      boxShadow: `0 0 6px ${event.customColor}80`
    };
  }
  return {};
};

onMounted(() => {
  loadEvents();
  checkMobile();
  window.addEventListener('resize', checkMobile);
});

// 清理事件监听器
const cleanup = () => {
  window.removeEventListener('resize', checkMobile);
};
</script>

<style scoped>
@import '@/styles/components/_schedule.scss';
</style>


<template>
  <div v-if="visible" class="schedule-modal-overlay" @click="closeModal">
    <div class="schedule-modal" @click.stop>
      <div class="schedule-header">
        <h2>My Schedule</h2>
        <button class="close-btn" @click="closeModal">×</button>
      </div>
      
      <div class="schedule-content">
        <div class="calendar-container">
          <el-calendar v-model="selectedDate" class="custom-calendar">
            <template #date-cell="{ data }">
              <div class="calendar-cell" :class="{ 'has-events': hasEvents(data.day) }">
                <div class="date-number">{{ data.day.split('-')[2] }}</div>
                <div v-if="getEventsForDate(data.day)" class="events-container">
                  <div 
                    v-for="event in getEventsForDate(data.day)" 
                    :key="event.id"
                    class="event-item"
                    :class="`event-${event.type}`"
                    :style="getEventStyle(event)"
                  >
                    <span class="event-title">{{ getDisplayTitle(event) }}</span>
                    <span class="event-time" v-if="!isMobileDevice">{{ event.time }}</span>
                  </div>
                </div>
                <div v-if="hasEvents(data.day)" class="event-indicator"></div>
                <div v-if="isToday(data.day)" class="today-indicator"></div>
              </div>
            </template>
          </el-calendar>
        </div>
        
        <div class="schedule-sidebar">
          <div class="events-list">
            <div class="events-header">
              <h3>Events for {{ formatSelectedDate }}</h3>
              <div v-if="isMobileDevice" class="mobile-events-summary">
                {{ selectedDateEvents.length }} event{{ selectedDateEvents.length !== 1 ? 's' : '' }}
              </div>
            </div>
            <div v-if="selectedDateEvents.length === 0" class="no-events">
              No events scheduled for this date
            </div>
            <div v-else class="events-list-container">
              <div 
                v-for="event in selectedDateEvents" 
                :key="event.id"
                class="event-detail"
                :class="`event-${event.type}`"
              >
                <div class="event-header">
                  <h4>{{ event.title }}</h4>
                  <button 
                    v-if="!event.id.startsWith('default-conf-')"
                    class="remove-event-btn" 
                    @click="removeEvent(event.id)"
                  >×</button>
                </div>
                <div class="event-info">
                  <div class="event-time">{{ event.time }}</div>
                  <div class="event-location" v-if="event.location">{{ event.location }}</div>
                  <div class="event-description" v-if="event.description">{{ event.description }}</div>
                </div>
              </div>
            </div>
          </div>
          
          <div class="add-event-section">
            <div class="add-event-header" @click="toggleAddEventForm">
              <h3>Add New Event</h3>
              <button class="dropdown-toggle" :class="{ active: showAddEventForm }">
                {{ showAddEventForm ? '▲' : '▼' }}
              </button>
            </div>
            <div v-if="showAddEventForm" class="add-event-form">
            <el-form :model="newEvent" label-position="top">
              <el-form-item label="Event Title">
                <el-input v-model="newEvent.title" placeholder="Enter event title" />
              </el-form-item>
              <el-form-item label="Date">
                <el-date-picker 
                  v-model="newEvent.date" 
                  type="date" 
                  placeholder="Select date"
                  style="width: 100%"
                />
              </el-form-item>
              <el-form-item label="Time">
                <el-time-picker 
                  v-model="newEvent.time" 
                  placeholder="Select time"
                  style="width: 100%"
                />
              </el-form-item>
              <el-form-item label="Location">
                <el-input v-model="newEvent.location" placeholder="Enter location" />
              </el-form-item>
              <el-form-item label="Type">
                <el-select v-model="newEvent.type" placeholder="Select event type" style="width: 100%">
                  <el-option label="Conference" value="conference" />
                  <el-option label="Meeting" value="meeting" />
                  <el-option label="Deadline" value="deadline" />
                  <el-option label="Personal" value="personal" />
                  <el-option label="My Session" value="session" />
                  <el-option label="Custom" value="custom" />
                </el-select>
              </el-form-item>
              <el-form-item label="Color" v-if="newEvent.type === 'custom' || newEvent.type === 'session'">
                <div class="color-picker-container">
                  <div class="predefined-colors">
                    <div 
                      v-for="color in predefinedColors" 
                      :key="color"
                      class="color-circle"
                      :class="{ active: newEvent.customColor === color }"
                      :style="{ backgroundColor: color }"
                      @click="newEvent.customColor = color"
                    ></div>
                  </div>
                  <input 
                    type="color" 
                    v-model="newEvent.customColor" 
                    class="custom-color-input"
                  />
                </div>
              </el-form-item>
              <el-form-item label="Description">
                <el-input 
                  v-model="newEvent.description" 
                  type="textarea" 
                  :rows="3"
                  placeholder="Enter description (optional)"
                />
              </el-form-item>
              <el-form-item>
                <el-button type="primary" @click="addEvent" :disabled="!canAddEvent">
                  Add Event
                </el-button>
                <el-button @click="resetNewEvent">Reset</el-button>
              </el-form-item>
            </el-form>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>