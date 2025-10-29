
    <!-- 查看用户所有计划 -->
<script setup lang="ts">
import { ref, reactive, watch } from 'vue';
import { ElMessage } from 'element-plus';
import { 
  Plus, 
  StarFilled,
  Right,
  Delete,
  Check
} from '@element-plus/icons-vue';
import type { Destination, TravelPlan, SavedPlanData, DayPlan, Attraction } from '@/types/base';

// Props
interface Props {
  visible: boolean;
  availableDestinations?: Destination[];
}

const props = withDefaults(defineProps<Props>(), {
  availableDestinations: () => []
});

// Emits
const emit = defineEmits<{
  close: [];
  save: [plan: SavedPlanData];
}>();

// 计划数据
const planData = reactive<TravelPlan>({
  title: '',
  content: '',
  duration: {
    startDate: '',
    endDate: ''
  },
  people: 1,
  budget: 0,
  days: []
});

// 添加新的一天
function addNewDay() {
  const dayNumber = planData.days.length + 1;
  planData.days.push({
    day: dayNumber,
    attractions: []
  });
}

// 删除某一天
function removeDay(dayIndex: number) {
  planData.days.splice(dayIndex, 1);
  // 重新编号剩余的天数
  planData.days.forEach((day, index) => {
    day.day = index + 1;
  });
}

// 添加景点到某一天
function addAttraction(dayIndex: number) {
  if (planData.days[dayIndex]) {
    const newAttraction: Attraction = {
      time: 9, // 默认上午9点
      timeFormatted: '09:00',
      budget: 0,
      currency: 'CNY',
      place_id: 0,
      placeName: ''
    };
    planData.days[dayIndex].attractions.push(newAttraction);
  }
}

// 删除景点
function removeAttraction(dayIndex: number, attractionIndex: number) {
  if (planData.days[dayIndex]) {
    planData.days[dayIndex].attractions.splice(attractionIndex, 1);
  }
}

// 更新景点时间
function updateAttractionTime(dayIndex: number, attractionIndex: number, timeStr: string) {
  if (planData.days[dayIndex] && planData.days[dayIndex].attractions[attractionIndex]) {
    const [hours, minutes] = timeStr.split(':').map(Number);
    planData.days[dayIndex].attractions[attractionIndex].time = hours + (minutes / 60);
  }
}

// 添加景点到计划
function addDestinationToPlan(destination: Destination) {
  // 如果没有天数，先添加第一天
  if (planData.days.length === 0) {
    addNewDay();
  }
  
  // 添加到最后一天
  const lastDayIndex = planData.days.length - 1;
  const newAttraction: Attraction = {
    time: 9,
    timeFormatted: '09:00',
    budget: 0,
    currency: 'CNY',
    place_id: 0,
    placeName: destination.name
  };
  planData.days[lastDayIndex].attractions.push(newAttraction);
  
  ElMessage.success(`Added ${destination.name} to Day ${planData.days[lastDayIndex].day}`);
}

// 截断文本
function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

// 保存计划
function savePlan() {
  const plan: SavedPlanData = {
    name: planData.title,
    content: planData.content,
    start_date: planData.duration.startDate,
    end_date: planData.duration.endDate,
    people: planData.people,
    budget: planData.budget,
    days: planData.days.map(day => ({
      day: day.day,
      attractions: day.attractions.map(attraction => ({
        time: attraction.time,
        budget: attraction.budget,
        currency: attraction.currency,
        place_id: attraction.place_id || 1,
        placeName: attraction.placeName
      }))
    }))
  };
  
  emit('save', plan);
  ElMessage.success('Plan saved successfully!');
}

// 监听visible变化，重置数据
watch(() => props.visible, (newVisible) => {
  if (newVisible) {
    // 可以在这里重置或预填充数据
  }
});
</script>

<style lang="scss" scoped>
@use '@/styles/components/plan-component.scss';
</style>


<template>
    <transition name="slide-from-left">
      <div v-if="visible" class="plan-overlay">
        <div class="plan-panel"> 
          
          <!-- 弹窗头部 -->
          <div class="plan-header">
            <div class="plan-header-left">
              <h2>
                <el-icon><StarFilled /></el-icon>
                My Travel Plan
              </h2>
            </div>
            <div class="plan-header-actions">
              <el-button 
                size="small" 
                @click="$emit('close')"
                class="close-btn"
              >
                <el-icon><Right /></el-icon>
              </el-button>
            </div>
          </div>
  
          <!-- 弹窗内容 -->
          <div class="plan-content">
            
            <!-- 基本信息部分 -->
            <div class="plan-section">
              <h3>Basic Information</h3>
              <div class="basic-info-grid">
                <!-- 计划名称 -->
                <div class="info-row">
                  <label>Plan Name</label>
                  <el-input 
                    v-model="planData.title" 
                    placeholder="Enter your travel plan name"
                    size="small"
                  />
                </div>
                
                <!-- 描述 -->
                <div class="info-row">
                  <label>Description</label>
                  <el-input 
                    v-model="planData.content" 
                    type="textarea"
                    :rows="2"
                    placeholder="Describe your travel plan"
                    size="small"
                  />
                </div>
  
                <!-- 日期和人数 -->
                <div class="info-row-group">
                  <div class="numbers-group">
                    <div class="number-item">
                      <label>People</label>
                      <el-input-number 
                        v-model="planData.people" 
                        :min="1"
                        :max="20"
                        size="small"
                      />
                    </div>
                    <div class="number-item">
                      <label>Budget (¥)</label>
                      <el-input-number 
                        v-model="planData.budget" 
                        :min="0"
                        :step="100"
                        size="small"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
  
            <!-- 行程安排部分 -->
            <div class="plan-section">
              <div class="section-header">
                <h3>Daily Itinerary</h3>
                <el-button 
                  size="small" 
                  type="primary" 
                  @click="addNewDay"
                  class="add-day-btn"
                >
                  <el-icon><Plus /></el-icon>
                  Add Day
                </el-button>
              </div>
  
              <div v-if="planData.days.length === 0" class="empty-state">
                <div class="empty-icon">📅</div>
                <p>No days planned yet</p>
                <p class="hint">Click "Add Day" to start planning your itinerary</p>
              </div>
  
              <div v-else class="days-container">
                <div 
                  v-for="(day, dayIndex) in planData.days" 
                  :key="dayIndex"
                  class="day-card"
                >
                  <!-- 天数标题栏 -->
                  <div class="day-header">
                    <div class="day-title">
                      <span class="day-number">Day {{ day.day }}</span>
                      <span class="attractions-count">{{ day.attractions.length }} stops</span>
                    </div>
                    <el-button 
                      size="small" 
                      type="danger"
                      text
                      @click="removeDay(dayIndex)"
                      class="remove-day-btn"
                    >
                      <el-icon><Delete /></el-icon>
                    </el-button>
                  </div>
                  
                  <!-- 景点列表 -->
                  <div class="attractions-container">
                    <div 
                      v-for="(attraction, attractionIndex) in day.attractions"
                      :key="attractionIndex" 
                      class="attraction-card"
                    >
                      <div class="attraction-time">
                        <el-time-select
                          v-model="attraction.timeFormatted"
                          start="06:00"
                          step="00:30"
                          end="23:30"
                          placeholder="Time"
                          size="small"
                          @change="updateAttractionTime(dayIndex, attractionIndex, $event)"
                        />
                      </div>
                      
                      <div class="attraction-details">
                        <el-input 
                          v-model="attraction.placeName" 
                          placeholder="Enter attraction name"
                          size="small"
                          class="place-input"
                        />
                        <div class="budget-row">
                          <el-input-number 
                            v-model="attraction.budget" 
                            :min="0"
                            :step="10"
                            placeholder="Budget"
                            size="small"
                            class="budget-input"
                          />
                          <el-select 
                            v-model="attraction.currency" 
                            size="small"
                            class="currency-select"
                          >
                            <el-option label="¥" value="CNY" />
                            <el-option label="$" value="USD" />
                            <el-option label="€" value="EUR" />
                            <el-option label="¥" value="JPY" />
                          </el-select>
                        </div>
                      </div>
                      
                      <el-button 
                        size="small" 
                        type="danger"
                        text
                        @click="removeAttraction(dayIndex, attractionIndex)"
                        class="remove-attraction-btn"
                      >
                        <el-icon><Delete /></el-icon>
                      </el-button>
                    </div>
                    
                    <!-- 添加景点按钮 -->
                    <div class="add-attraction-container">
                      <el-button 
                        size="small" 
                        type="primary"
                        text
                        @click="addAttraction(dayIndex)"
                        class="add-attraction-btn"
                      >
                        <el-icon><Plus /></el-icon>
                        Add Stop
                      </el-button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
  
            <!-- 可选景点部分 -->
            <div class="plan-section" v-if="availableDestinations.length > 0">
              <h3>Suggested Destinations</h3>
              <div class="destinations-grid">
                <div 
                  v-for="(destination, index) in availableDestinations"
                  :key="index" 
                  class="destination-card"
                >
                  <div class="destination-info">
                    <div class="destination-name">{{ destination.name }}</div>
                    <div class="destination-desc">{{ truncateText(destination.content, 60) }}</div>
                  </div>
                  <el-button 
                    size="small" 
                    type="primary"
                    @click="addDestinationToPlan(destination)"
                    class="add-destination-btn"
                  >
                    <el-icon><Plus /></el-icon>
                  </el-button>
                </div>
              </div>
            </div>
  
          </div>
  
          <!-- 弹窗底部操作 -->
          <div class="plan-footer">
            <el-button @click="$emit('close')" size="small">
              Cancel
            </el-button>
            <el-button 
              type="primary" 
              @click="savePlan"
              :disabled="!planData.title.trim() || planData.days.length === 0"
              size="small"
            >
              <el-icon><Check /></el-icon>
              Save Plan
            </el-button>
          </div>
  
        </div>
      </div>
    </transition>
  </template>