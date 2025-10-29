<template>
  <div class="ipologo-plan-modal" v-if="visible" @click.self="closeModal">
    <div class="modal-content">
      <!-- Header -->
      <div class="modal-header">
        <h2 class="modal-title">
          <el-icon><Location /></el-icon>
          iPoloGO AI Travel Planner
        </h2>
        <button class="close-btn" @click="closeModal">
          <el-icon><Close /></el-icon>
        </button>
      </div>

      <!-- Body -->
      <div class="modal-body">
        <!-- 1. Title Input -->
        <div class="form-section">
          <label class="form-label">Travel Title</label>
          <el-input
            v-model="formData.title"
            placeholder="Enter your travel plan title..."
            class="title-input"
          />
        </div>

        <!-- 2. Date Selection -->
        <div class="form-section">
          <div class="date-section">
            <div class="date-header">
              <label class="form-label">Set Travel Duration</label>
              <div class="date-controls">
                <div class="duration-input">
                  <label class="sub-label">Number of Days</label>
                  <el-input-number
                    v-model="formData.duration"
                    :min="1"
                    :max="30"
                    controls-position="right"
                    class="duration-number"
                  />
                </div>
                <div class="date-toggle">
                  <label class="sub-label">Choose dates</label>
                  <el-switch
                    v-model="formData.enableDateSelection"
                    active-text="Enable"
                    inactive-text="Disable"
                    class="date-switch"
                  />
                </div>
              </div>
            </div>
            
            <div v-if="formData.enableDateSelection" class="date-inputs">
              <div class="date-range">
                <div class="date-picker">
                  <label class="sub-label">Start Date</label>
                  <el-date-picker
                    v-model="formData.startDate"
                    type="date"
                    placeholder="Select start date"
                    class="date-selector"
                  />
                </div>
                <div class="date-picker">
                  <label class="sub-label">End Date</label>
                  <el-date-picker
                    v-model="formData.endDate"
                    type="date"
                    placeholder="Select end date"
                    class="date-selector"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 3. Group Composition -->
        <div class="form-section">
          <label class="form-label">Travel Group</label>
          
          <!-- Who are you traveling with -->
          <div class="travel-with">
            <label class="sub-label">Who are you traveling with?</label>
            <div class="travel-options">
              <el-radio-group v-model="formData.travelWith" class="travel-radio-group">
                <el-radio label="solo">Solo</el-radio>
                <el-radio label="companion">Companion</el-radio>
                <el-radio label="family">Family</el-radio>
                <el-radio label="team">Team</el-radio>
              </el-radio-group>
            </div>
          </div>

          <!-- Group Size -->
          <div class="group-size">
            <div class="size-input">
              <label class="sub-label">Adults</label>
              <el-input-number
                v-model="formData.adults"
                :min="1"
                :max="20"
                controls-position="right"
                class="size-number"
              />
            </div>
            <div class="size-input">
              <label class="sub-label">Children</label>
              <el-input-number
                v-model="formData.children"
                :min="0"
                :max="10"
                controls-position="right"
                class="size-number"
              />
            </div>
          </div>

          <!-- Pet Option -->
          <div class="pet-option">
            <el-checkbox v-model="formData.hasPet" class="pet-checkbox">
              Traveling with pets
            </el-checkbox>
          </div>
        </div>

        <!-- 4. Travel Preferences -->
        <div class="form-section">
          <label class="form-label">Travel Pace</label>
          <div class="preference-options">
            <el-radio-group v-model="formData.travelPace" class="pace-radio-group">
              <el-radio label="intensive" class="pace-option">
                <div class="pace-content">
                  <el-icon><Lightning /></el-icon>
                  <div class="pace-text">
                    <span>Intensive</span>
                    <small>Packed schedule, see everything</small>
                  </div>
                </div>
              </el-radio>
              <el-radio label="moderate" class="pace-option">
                <div class="pace-content">
                  <el-icon><Timer /></el-icon>
                  <div class="pace-text">
                    <span>Moderate</span>
                    <small>Balanced pace, good mix</small>
                  </div>
                </div>
              </el-radio>
              <el-radio label="relaxed" class="pace-option">
                <div class="pace-content">
                  <el-icon><Sunny /></el-icon>
                  <div class="pace-text">
                    <span>Relaxed</span>
                    <small>Take it easy, enjoy the moment</small>
                  </div>
                </div>
              </el-radio>
            </el-radio-group>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div class="modal-footer">
        <div class="footer-left">
          <div class="credits-info">
            <el-icon><Coin /></el-icon>
            <span>Available Credits: {{ availableCredits }}</span>
          </div>
        </div>
        <div class="footer-right">
          <el-button @click="closeModal" class="cancel-btn">Cancel</el-button>
          <el-button type="primary" @click="startPlanning" class="start-btn">
            Start iPoloGO Planning
          </el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { 
  Location, 
  Close, 
  Lightning, 
  Timer, 
  Sunny, 
  Coin, 
  Right 
} from '@element-plus/icons-vue';

interface Props {
  visible: boolean;
}

interface Emits {
  (e: 'close'): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();
const router = useRouter();

// Form data
const formData = reactive({
  title: '',
  enableDateSelection: false,
  duration: 3,
  startDate: '' as string,
  endDate: '' as string,
  travelWith: 'solo',
  adults: 1,
  children: 0,
  hasPet: false,
  travelPace: 'moderate'
});

// Available credits (mock data)
const availableCredits = ref(150);

// Methods
const closeModal = () => {
  emit('close');
};

const startPlanning = () => {
  // Validate form data
  if (!formData.title.trim()) {
    ElMessage.error('Please enter a travel title');
    return;
  }

  // Log form data for debugging
  console.log('Starting planning with data:', formData);
  
  // Navigate to iPoloGO-result page
  router.push({ 
    name: 'iPoloGO-result',
    query: {
      title: formData.title,
      duration: formData.duration.toString(),
      travelWith: formData.travelWith,
      adults: formData.adults.toString(),
      children: formData.children.toString(),
      hasPet: formData.hasPet.toString(),
      travelPace: formData.travelPace,
      ...(formData.enableDateSelection && formData.startDate && formData.endDate && {
        startDate: formData.startDate,
        endDate: formData.endDate
      })
    }
  });
  
  // Close modal
  closeModal();
};
</script>

<style scoped>
@use '@/styles/components/_ipologo-plan.scss';
</style>
     