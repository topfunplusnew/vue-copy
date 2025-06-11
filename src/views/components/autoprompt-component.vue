<script setup lang="ts">
import { ref, computed, watch, reactive } from 'vue';
import { ElMessage } from 'element-plus';
import { tripOptionsData, allCurrencies } from '@/utils/trip-options.ts';
import VueDatePicker from '@vuepic/vue-datepicker';
import '@vuepic/vue-datepicker/dist/main.css';
import { 
  Close, 
  MagicStick 
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
  insertPrompt: [prompt: string];
}>();

// 旅行选项数据
const tripSelections = reactive({
  Transportation: [] as string[],
  TransportationClass: '',
  Hotel: [] as string[],
  Tickets: [] as string[],
  Activities: [] as string[],
  Budget: {
    Currency: 0,
    Total: 0,
    Transportation: 25,
    Hotel: 25,
    Tickets: 25,
    Activities: 25
  },
  Duration: null as [Date, Date] | null,
  DurationDays: 0
});

// 可编辑的提示文本
const editablePrompt = ref('');

// 可用的交通工具等级
const availableTransportationClasses = computed(() => {
  if (tripSelections.Transportation.length === 1) {
    const t = tripSelections.Transportation[0];
    if (t === "Flight") {
      return ["First Class", "Business Class", "Economy"];
    } else if (t === "Train") {
      return ["First Class", "Second Class"];
    } else if (t === "Bus") {
      return ["Standard"];
    } else {
      return ["Economy"];
    }
  }
  return [];
});

// 分组酒店选项
const groupedHotels = computed(() => {
  const groups: { [key: string]: {name:string, icon:string}[] } = {};
  tripOptionsData.Hotel.forEach(item => {
    const group = item.group || "Other";
    if (!groups[group]) {
      groups[group] = [];
    }
    groups[group].push(item);
  });
  return Object.keys(groups).map(key => ({ label: key, options: groups[key] }));
});

// 防止递归更新的标志
let isUpdatingBudget = false;

// 动态预算调整逻辑：按比例调整其他项，使总和为 100%
const updateBudgetProportions = (changedKey: keyof typeof tripSelections.Budget, newValue: number) => {
  if (isUpdatingBudget) return;
  isUpdatingBudget = true;

  const keys: (keyof typeof tripSelections.Budget)[] = ["Transportation", "Hotel", "Tickets", "Activities"];
  // 先更新当前修改的项
  tripSelections.Budget[changedKey] = newValue;

  const otherKeys = keys.filter(k => k !== changedKey);
  const desiredOthersSum = 100 - newValue;
  const othersCurrentSum = otherKeys.reduce((sum, key) => sum + tripSelections.Budget[key], 0);

  if (othersCurrentSum === 0) {
    // 如果其他项都为 0，则平分剩余比例
    const equalShare = desiredOthersSum / otherKeys.length;
    otherKeys.forEach(key => {
      tripSelections.Budget[key] = equalShare;
    });
  } else {
    // 按照当前比例调整其他项
    otherKeys.forEach(key => {
      const current = tripSelections.Budget[key];
      const proportion = current / othersCurrentSum;
      tripSelections.Budget[key] = Math.round(proportion * desiredOthersSum);
    });
    // 修正因四舍五入导致的误差
    const newOthersSum = otherKeys.reduce((sum, key) => sum + tripSelections.Budget[key], 0);
    const diff = desiredOthersSum - newOthersSum;
    if (otherKeys.length > 0) {
      tripSelections.Budget[otherKeys[0]] += diff;
    }
  }
  isUpdatingBudget = false;
};

// 监听预算变化
watch(() => tripSelections.Budget.Transportation, (val) => { updateBudgetProportions("Transportation", val); });
watch(() => tripSelections.Budget.Hotel, (val) => { updateBudgetProportions("Hotel", val); });
watch(() => tripSelections.Budget.Tickets, (val) => { updateBudgetProportions("Tickets", val); });
watch(() => tripSelections.Budget.Activities, (val) => { updateBudgetProportions("Activities", val); });

// 日期预设选项
const datePresets = [
  { label: 'Today', range: [new Date(), new Date()] },
  { label: 'Next 7 Days', range: [new Date(), new Date(Date.now() + 6 * 24 * 60 * 60 * 1000)] },
  { label: 'Next 14 Days', range: [new Date(), new Date(Date.now() + 13 * 24 * 60 * 60 * 1000)] },
  { label: 'Next 30 Days', range: [new Date(), new Date(Date.now() + 29 * 24 * 60 * 60 * 1000)] }
];

// 计算旅行天数
const calculateDuration = () => {
  if (tripSelections.Duration && tripSelections.Duration.length === 2) {
    const start = new Date(tripSelections.Duration[0]);
    const end = new Date(tripSelections.Duration[1]);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // 包含起始日
    tripSelections.DurationDays = diffDays;
  } else {
    tripSelections.DurationDays = 0;
  }
};

// 监听日期变化
watch(() => tripSelections.Duration, (newDates) => {
  if (newDates && newDates.length === 2) {
    calculateDuration();
  } else {
    tripSelections.DurationDays = 0;
  }
}, { deep: true });

// 根据用户选择生成旅行提示文本
const tripPrompt = computed(() => {
  const parts: string[] = [];

  // 旅行时间部分
  if (tripSelections.Duration && tripSelections.Duration.length === 2) {
    const startDate = tripSelections.Duration[0].toLocaleDateString();
    const endDate = tripSelections.Duration[1].toLocaleDateString();
    parts.push(`Plan a ${tripSelections.DurationDays}-day trip from ${startDate} to ${endDate}.`);
  }

  // 交通方式部分
  if (tripSelections.Transportation.length > 0) {
    const transportModes = tripSelections.Transportation.join(", ");
    parts.push(`Travel by ${transportModes}${tripSelections.TransportationClass ? ` (${tripSelections.TransportationClass})` : ''}.`);
  }

  // 酒店偏好部分
  if (tripSelections.Hotel.length > 0) {
    parts.push(`Stay in ${tripSelections.Hotel.join(", ")}.`);
  }

  // 门票部分
  if (tripSelections.Tickets.length > 0) {
    parts.push(`Include tickets for ${tripSelections.Tickets.join(", ")}.`);
  }

  // 活动部分
  if (tripSelections.Activities.length > 0) {
    parts.push(`Activities should include ${tripSelections.Activities.join(", ")}.`);
  }

  // 预算部分
  if (tripSelections.Budget.Total > 0) {
    const currency = allCurrencies[tripSelections.Budget.Currency]?.name || 'USD';
    parts.push(`Total budget: ${tripSelections.Budget.Total} ${currency}.`);

    // 预算分配
    const budgetDetails = [];
    if (tripSelections.Budget.Transportation > 0) {
      budgetDetails.push(`${tripSelections.Budget.Transportation}% for transportation`);
    }
    if (tripSelections.Budget.Hotel > 0) {
      budgetDetails.push(`${tripSelections.Budget.Hotel}% for accommodation`);
    }
    if (tripSelections.Budget.Tickets > 0) {
      budgetDetails.push(`${tripSelections.Budget.Tickets}% for tickets`);
    }
    if (tripSelections.Budget.Activities > 0) {
      budgetDetails.push(`${tripSelections.Budget.Activities}% for activities`);
    }

    if (budgetDetails.length > 0) {
      parts.push(`Budget allocation: ${budgetDetails.join(", ")}.`);
    }
  }

  return parts.length > 0 ? parts.join(" ") : "Please select travel options to generate a prompt.";
});

// 监视tripPrompt变化，自动更新可编辑内容
watch(tripPrompt, (newValue) => {
  editablePrompt.value = newValue;
});

// 插入旅行提示到聊天
function insertTripPrompt() {
  if (editablePrompt.value) {
    emit('insertPrompt', editablePrompt.value);
    emit('close');
  }
}
</script>

<template>
  <div class="autoprompt-overlay" @click.self="$emit('close')" v-if="visible">
    <div class="autoprompt-dialog">
      <!-- 弹窗头部 -->
      <div class="autoprompt-header">
        <h2 class="autoprompt-title">
          <el-icon class="title-icon"><MagicStick /></el-icon>
          Generate Travel Prompt
        </h2>
        <button class="close-btn" @click="$emit('close')">
          <el-icon><Close /></el-icon>
        </button>
      </div>

      <!-- 主要内容区域 -->
      <div class="autoprompt-content">
        <div class="options-scroll">
          <!-- Duration 模块 - 重新设计 -->
          <div class="trip-option">
            <label>
              <i class="el-icon-date" style="margin-right:5px"></i>
              Trip Duration:
            </label>
            <div class="date-section">
              <div class="date-picker-wrapper">
                <VueDatePicker 
                  v-model="tripSelections.Duration"
                  range
                  :enable-time-picker="false"
                  :preset-ranges="datePresets"
                  placeholder="Select dates"
                  format="MM/dd/yyyy"
                  :clearable="true"
                  :auto-apply="true"
                  class="custom-date-picker"
                />
              </div>
              <div v-if="tripSelections.DurationDays > 0" class="duration-display">
                <span class="duration-badge">{{ tripSelections.DurationDays }} days</span>
              </div>
            </div>
          </div>

          <!-- Transportation 模块 -->
          <div class="trip-option">
            <label>
              <i class="el-icon-airplane" style="margin-right:5px"></i>
              Transportation:
            </label>
            <div class="trans-container">
              <el-select
                v-model="tripSelections.Transportation"
                multiple
                placeholder="Select transportation"
                filterable
                allow-create
                class="futuristic-select"
                :teleported="false"
                :max-collapse-tags="2"
              >
                <el-option
                  v-for="item in tripOptionsData.Transportation"
                  :key="item.name"
                  :label="item.name"
                  :value="item.name"
                >
                  <template #default>
                    <i :class="item.icon" style="margin-right:5px"></i>
                    {{ item.name }}
                  </template>
                </el-option>
              </el-select>
              <!-- 仅当单一交通工具选中时显示 Travel Class -->
              <div
                v-if="tripSelections.Transportation.length === 1"
                class="transport-class"
              >
                <label>Class:</label>
                <el-select
                  v-model="tripSelections.TransportationClass"
                  placeholder="Select travel class"
                  filterable
                  class="futuristic-select"
                  :teleported="false"
                >
                  <el-option
                    v-for="option in availableTransportationClasses"
                    :key="option"
                    :label="option"
                    :value="option"
                  />
                </el-select>
              </div>
            </div>
          </div>

          <!-- Hotel 模块 -->
          <div class="trip-option">
            <label>
              <i class="el-icon-star-on" style="margin-right:5px"></i>
              Hotel:
            </label>
            <el-select
              v-model="tripSelections.Hotel"
              multiple
              placeholder="Select hotel options"
              filterable
              allow-create
              class="futuristic-select"
              :teleported="false"
              :max-collapse-tags="2"
            >
              <el-option-group
                v-for="group in groupedHotels"
                :key="group.label"
                :label="group.label"
              >
                <el-option
                  v-for="item in group.options"
                  :key="item.name"
                  :label="item.name"
                  :value="item.name"
                >
                  <template #default>
                    <i :class="item.icon" style="margin-right:5px"></i>
                    {{ item.name }}
                  </template>
                </el-option>
              </el-option-group>
            </el-select>
          </div>

          <!-- Budget 模块 -->
          <div class="trip-option">
            <div class="budget-container">
              <label>
                <i class="el-icon-money" style="margin-right:5px"></i>
                Budget:
              </label>
              <!-- 货币与总预算 -->
              <div class="budget-row">
                <el-select
                  v-model="tripSelections.Budget.Currency"
                  placeholder="Currency"
                  filterable
                  class="futuristic-select currency-select"
                  :teleported="false"
                >
                  <el-option
                    v-for="currency in allCurrencies"
                    :key="currency.name"
                    :label="currency.flag + ' ' + currency.name"
                    :value="currency.name"
                  />
                </el-select>
                <el-input
                  v-model="tripSelections.Budget.Total"
                  placeholder="Enter amount"
                  class="budget-input"
                />
              </div>
              <!-- 预算比例拖动条 -->
              <div class="budget-row slider-row">
                <span>Transportation:</span>
                <el-slider
                  v-model="tripSelections.Budget.Transportation"
                  :min="0"
                  :max="100"
                  show-input
                  @change="(val) => updateBudgetProportions('Transportation', val as number)"
                />
              </div>
              <div class="budget-row slider-row">
                <span>Hotel:</span>
                <el-slider
                  v-model="tripSelections.Budget.Hotel"
                  :min="0"
                  :max="100"
                  show-input
                  @change="(val) => updateBudgetProportions('Hotel', val as number)"
                />
              </div>
              <div class="budget-row slider-row">
                <span>Tickets:</span>
                <el-slider
                  v-model="tripSelections.Budget.Tickets"
                  :min="0"
                  :max="100"
                  show-input
                  @change="(val) => updateBudgetProportions('Tickets', val as number)"
                />
              </div>
              <div class="budget-row slider-row">
                <span>Activities:</span>
                <el-slider
                  v-model="tripSelections.Budget.Activities"
                  :min="0"
                  :max="100"
                  show-input
                  @change="(val) => updateBudgetProportions('Activities', val as number)"
                />
              </div>
            </div>
          </div>

          <!-- Tickets 模块 -->
          <div class="trip-option">
            <label>
              <i class="el-icon-tickets" style="margin-right:5px"></i>
              Tickets:
            </label>
            <el-select
              v-model="tripSelections.Tickets"
              multiple
              placeholder="Select ticket options"
              filterable
              allow-create
              class="futuristic-select"
              :teleported="false"
              :max-collapse-tags="2"
            >
              <el-option
                v-for="item in tripOptionsData.Tickets"
                :key="item.name"
                :label="item.name"
                :value="item.name"
              >
                <template #default>
                  <i :class="item.icon" style="margin-right:5px"></i>
                  {{ item.name }}
                </template>
              </el-option>
            </el-select>
          </div>

          <!-- Activities 模块 -->
          <div class="trip-option">
            <label>
              <i class="el-icon-s-custom" style="margin-right:5px"></i>
              Activities:
            </label>
            <el-select
              v-model="tripSelections.Activities"
              multiple
              placeholder="Select activities"
              filterable
              allow-create
              class="futuristic-select"
              :teleported="false"
              :max-collapse-tags="2"
            >
              <el-option-group
                v-for="(group, groupName) in tripOptionsData.Activities"
                :key="groupName"
                :label="groupName"
              >
                <el-option
                  v-for="item in group"
                  :key="item.name"
                  :label="item.name"
                  :value="item.name"
                >
                  <template #default>
                    <i :class="item.icon" style="margin-right:5px"></i>
                    {{ item.name }}
                  </template>
                </el-option>
              </el-option-group>
            </el-select>
          </div>
        </div>

        <!-- 旅行提示生成结果 -->
        <div class="prompt-result">
          <span>Generated Prompt</span>
          <el-input
            v-model="editablePrompt"
            type="textarea"
            :rows="3"
            placeholder="Your travel prompt will appear here"
            resize="none"
            class="editable-prompt"
          ></el-input>
        </div>
      </div>

      <!-- 底部操作按钮 -->
      <div class="autoprompt-footer">
        <div class="footer-info">
          <span v-if="tripPrompt !== 'Please select travel options to generate a prompt.'">
            Prompt ready to use
          </span>
        </div>
        <div class="footer-actions">
          <el-button @click="$emit('close')">Cancel</el-button>
          <el-button
            type="primary"
            @click="insertTripPrompt" 
            :disabled="!tripPrompt || tripPrompt === 'Please select travel options to generate a prompt.'"
          >
            Insert into Chat
          </el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
@import '@/styles/pages/_generator-generatep.scss';
</style>
