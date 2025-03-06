<script setup lang="ts">
import { ref, computed, watch, onMounted, reactive } from 'vue';
import { useRoute } from 'vue-router';
import { ElMessage } from 'element-plus';
import { tripOptionsData, allCurrencies } from '@/assets/tripOptionsData.js';
import walletItem from '@/components/wallet-item.vue';
import { generateUserPrompt } from '@/stores/userprompt';
import { setTripOptions } from '@/stores/tripoption';
import { generateResponse } from '@/services/api';
import type { IChatReq } from '@/types/chat';


// interface ChatMessage { sender: string; text: string; }
// interface HistoryRecord { summary: string; messages: ChatMessage[]; }

interface ChatMessage { 
  sender: 'user' | 'assistant' | 'system'; 
  text: string; 
}


const chatMessages = ref<ChatMessage[]>([]);
const historyRecords = ref<HistoryRecord[]>([]);
const userChatInput = ref('');
const loading = ref(false);
const error = ref('');
const conversationId = ref(''); // 用于跟踪对话ID

const updateMessage = (index: number, event: Event) => {
  const target = event.target as HTMLElement;
  chatMessages.value[index].text = target.innerText;
};

// const sendMessage = () => {
//   if (!userChatInput.value.trim()) return;
//   chatMessages.value.push({ sender: 'user', text: userChatInput.value });
//   const agentReply = "iPoloGO: " + userChatInput.value;
//   chatMessages.value.push({ sender: 'agent', text: agentReply });
//   userChatInput.value = '';
// };

const sendToAI = async (content: string) => {
  if (!content.trim() || loading.value) return;
  loading.value = true;
  error.value = '';

  try {
    chatMessages.value.push({ sender: 'user', text: content });
    const chatReq: IChatReq = {
      prompt: content,
      Conversation_id: conversationId.value
    };
    const response = await generateResponse(chatReq);

    if (response.data.conversation_id) {
      conversationId.value = response.data.conversation_id;
    }

    chatMessages.value.push({ sender: 'assistant', text: response.data.message });
    userChatInput.value = '';
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to get response';
    ElMessage.error(error.value);
  } finally {
    loading.value = false;
  }
}

const handleUserInput = async (event: KeyboardEvent) => {
  if (event.shiftKey) return; // 如果按住 shift，允许换行
  
  if (userChatInput.value.trim()) {
    await sendToAI(userChatInput.value);
    userChatInput.value = ''; // 清空输入框，恢复到 placeholder 状态
  }
};

const finishConversation = () => {
  if (chatMessages.value.length === 0) {
    ElMessage.info("No conversation to finish.");
    return;
  }
  const summary = generateSummary(chatMessages.value);
  historyRecords.value.push({ summary, messages: [...chatMessages.value] });
  chatMessages.value = [];
};

const generateSummary = (messages: ChatMessage[]): string => {
  let summary = "General Conversation";
  if (messages.some(m => m.text.toLowerCase().includes("trip"))) {
    summary = "Trip planning: location to destination";
  }
  return summary;
};

const loadHistory = (index: number) => {
  const record = historyRecords.value[index];
  if (record) {
    chatMessages.value = [...record.messages];
  }
};

const tripSelections = reactive({
  Transportation: [] as string[],
  TransportationClass: '',
  Hotel: [] as string[],
  Tickets: [] as string[],
  Activities: [] as string[],
  Budget: {
    Currency: '',
    Total: '',
    Transportation: 25,
    Hotel: 25,
    Tickets: 25,
    Activities: 25
  },
  Duration: [] as [Date, Date] | [],
  DurationDays: 0
});

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

const groupedHotels = computed(() => {
  const groups: { [key: string]: any[] } = {};
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
// 修改后的动态预算调整逻辑：按比例调整其他项，使总和为 100%
const updateBudgetProportions = (changedKey: keyof typeof tripSelections.Budget, newValue: number) => {
  if (isUpdatingBudget) return;
  isUpdatingBudget = true;

  const keys: (keyof typeof tripSelections.Budget)[] = ["Transportation", "Hotel", "Tickets", "Activities"];
  // 先更新当前修改的项
  tripSelections.Budget[changedKey] = newValue;

  const otherKeys = keys.filter(k => k !== changedKey);
  const desiredOthersSum = 100 - newValue;
  let othersCurrentSum = otherKeys.reduce((sum, key) => sum + tripSelections.Budget[key], 0);

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

watch(() => tripSelections.Budget.Transportation, (val) => { updateBudgetProportions("Transportation", val); });
watch(() => tripSelections.Budget.Hotel, (val) => { updateBudgetProportions("Hotel", val); });
watch(() => tripSelections.Budget.Tickets, (val) => { updateBudgetProportions("Tickets", val); });
watch(() => tripSelections.Budget.Activities, (val) => { updateBudgetProportions("Activities", val); });

const budgetTotal = computed(() => {
  const b = tripSelections.Budget;
  return b.Transportation + b.Hotel + b.Tickets + b.Activities;
});


// Date Element Plus 组件

const datepickervalue = ref('')

const dateShortcuts = [
  {
    text: 'Today',
    value: () => {
      const start = new Date();
      const end = new Date();
      return [start, end];
    }
  },
  {
    text: 'Next 7 Days',
    value: () => {
      const start = new Date();
      const end = new Date();
      end.setDate(end.getDate() + 6);
      return [start, end];
    }
  },
  {
    text: 'Next 30 Days',
    value: () => {
      const start = new Date();
      const end = new Date();
      end.setDate(end.getDate() + 29);
      return [start, end];
    }
  },
  {
    text: 'Next 90 Days',
    value: () => {
      const start = new Date();
      const end = new Date();
      end.setDate(end.getDate() + 89);
      return [start, end];
    }
  },
  {
    text: 'This Month',
    value: () => {
      const start = new Date();
      start.setDate(1);
      const end = new Date(start.getFullYear(), start.getMonth() + 1, 0);
      return [start, end];
    }
  },
  {
    text: 'Next Month',
    value: () => {
      const start = new Date();
      start.setMonth(start.getMonth() + 1, 1);
      const end = new Date(start.getFullYear(), start.getMonth() + 1, 0);
      return [start, end];
    }
  }
];

const disabledDate = (date: Date) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const start = new Date(today);
  const end = new Date(today);
  end.setDate(start.getDate() + 1);
  return date < start || date >= end;
};

const calculateDuration = () => {
  if (tripSelections.Duration.length === 2) {
    const start = new Date(tripSelections.Duration[0]);
    const end = new Date(tripSelections.Duration[1]);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // 包含起始日
    tripSelections.DurationDays = diffDays;
  } else {
    tripSelections.DurationDays = 0;
  }
};

watch(() => tripSelections.Duration, (newDates) => {
  if (newDates && newDates.length === 2) {
    calculateDuration();
  } else {
    tripSelections.DurationDays = 0;
  }
}, { deep: true });

// 以下 tripPrompt 作为备用生成逻辑
const tripPrompt = computed(() => {
  let parts: string[] = [];
  if (tripSelections.Duration.length === 2) {
    const startDate = new Date(tripSelections.Duration[0]).toLocaleDateString();
    const endDate = new Date(tripSelections.Duration[1]).toLocaleDateString();
    parts.push(`I plan to travel from ${startDate} to ${endDate} (${tripSelections.DurationDays} days).`);
  }
  if (tripSelections.Transportation.length) {
    const trans = tripSelections.Transportation.join(", ");
    const tClass = tripSelections.TransportationClass ? ` (${tripSelections.TransportationClass})` : "";
    parts.push(`My chosen transportation is ${trans}${tClass}.`);
  }
  if (tripSelections.Hotel.length) {
    parts.push(`I prefer to stay at ${tripSelections.Hotel.join(", ")}.`);
  }
  if (tripSelections.Budget.Currency || tripSelections.Budget.Total) {
    const currency = tripSelections.Budget.Currency || "";
    const total = tripSelections.Budget.Total || "";
    parts.push(`My total budget is ${currency} ${total} with proportions: Transportation ${tripSelections.Budget.Transportation}%, Hotel ${tripSelections.Budget.Hotel}%, Tickets ${tripSelections.Budget.Tickets}%, Activities ${tripSelections.Budget.Activities}%.`);
  }
  if (tripSelections.Tickets.length) {
    parts.push(`I plan to purchase ${tripSelections.Tickets.join(", ")}.`);
  }
  if (tripSelections.Activities.length) {
    parts.push(`I intend to participate in ${tripSelections.Activities.join(", ")}.`);
  }
  return parts.join(" ");
});

// const insertTripPrompt = () => {
//   if (tripPrompt.value) {
//     userChatInput.value = tripPrompt.value;
//   }
// };

const insertTripPrompt = async () => {
  if (tripPrompt.value && !loading.value) {
    await sendToAI(tripPrompt.value);
  }
};

const selectedMapType = ref('World Map');
const userLocation = ref('Current Location');
const selectedDestination = ref('Destination');

const historyVisible = ref(false);
const toggleHistory = () => {
  historyVisible.value = !historyVisible.value;
};

const route = useRoute();
// 页面加载时：如果路由 query 中传入了 prompt，则直接使用；否则调用 generateUserPrompt 生成默认文本
onMounted(() => {
  const initialPrompt = route.query.prompt as string;
  if (initialPrompt) {
    // 直接发送初始 prompt，不需要保存在输入框中
    sendToAI(initialPrompt);
  } else {
    // 生成默认 prompt 并发送
    const defaultPrompt = generateUserPrompt("Current Location", "Destination", []);
    sendToAI(defaultPrompt);
  }
  
  // 移除延时发送的部分，因为已经在上面直接发送了
  // setTimeout(() => {
  //   sendToAI(userChatInput.value);
  // }, 200);
});
</script>

<template>
  <div class="background-layer"></div>
  <div class="home">
    <!-- Header -->
    <header class="header">
      <div class="nav-container">
        <div class="left-nav">
          <router-link :to="{ name: 'home' }">
            <el-button class="nav-button">HOME</el-button>
          </router-link>
          <router-link :to="{ name: 'about' }">
            <el-button class="nav-button">ABOUT</el-button>
          </router-link>
          <router-link :to="{ name: 'blog' }">
            <el-button class="nav-button">BLOG</el-button>
          </router-link>
          <router-link :to="{ name: 'contact' }">
            <el-button class="nav-button">CONTACT</el-button>
          </router-link>
        </div>
        <div class="right-nav">
          <!-- <wallet-item /> -->
          <router-link :to="{ name: 'login' }">
            <el-button class="nav-button">Login</el-button>
          </router-link>
          <router-link :to="{ name: 'signup' }">
            <el-button class="nav-button">Sign Up</el-button>
          </router-link>
          <!-- History 切换按钮 -->
          <el-button class="nav-button" @click="toggleHistory">
            {{ historyVisible ? 'Hide History' : 'Show History' }}
          </el-button>
        </div>
      </div>
      <!-- <h2 class="header-title">Have Fun in iPoloGO</h2> -->
    </header>

    <!-- 外层内容容器 -->
    <div class="content-wrapper">
      <!-- History 抽屉 (固定定位) -->
      <transition name="slide-left">
        <div class="history-drawer" v-if="historyVisible">
          <h3>History</h3>
          <ul>
            <li
              v-for="(record, idx) in historyRecords"
              :key="idx"
              @click="loadHistory(idx)"
              class="history-item"
            >
              {{ record.summary }}  
            </li>
          </ul>
          <el-button type="text" @click="toggleHistory">Close</el-button>
        </div>
      </transition>

      <!-- 主体布局：聊天面板 + 右侧信息面板 -->
      <div class="main-content">
        <!-- 中间：Chat 模块 -->
        <div class="center-panel">
          <h3>Chat with iPoloGO</h3>
          <div class="chat-box">
            <div
              v-for="(msg, index) in chatMessages"
              :key="index"
              class="chat-message"
              :class="msg.sender"
              contenteditable="true"
              @blur="updateMessage(index, $event)"
            >
              {{ msg.text }}
            </div>
          </div>
          <div class="chat-input">
            <el-input
              v-model="userChatInput"
              placeholder="Type your message..."
              class="chat-input-box"
              type="textarea"
              :rows="3"
              clearable
              @keydown.enter.prevent="handleUserInput"
            />
            <button class="warning" @click="finishConversation">
              Finish Conversation
            </button>
          </div>
        </div>

        <!-- 右侧：Trip Options 与 Map 模块 -->
        <div class="right-panel">
          <!-- Trip Options -->
          <div class="options-panel">
            <h3>Trip Options</h3>

            <!-- Date 模块 -->
            <div class="trip-option date-option">
              <label>Date:</label>
              <div class="date-picker-container">
                <el-date-picker
                  v-model="tripSelections.Duration"
                  type="datetimerange"
                  :shortcuts="dateShortcuts"
                  range-separator="To"
                  start-placeholder="Start date"
                  end-placeholder="End date"
                  format="YYYY-MM-DD"
                  value-format="YYYY-MM-DD"
                  @change="calculateDuration"
                />
                <!-- <div class="duration-display" v-if="tripSelections.DurationDays > 0">
                  Duration: {{ tripSelections.DurationDays }} days
                </div> -->
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
                    style="width:150px"
                    filterable
                    class="futuristic-select"
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
                    placeholder="Enter total amount"
                    style="width:150px; margin-left:10px;"
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
                    @change="(val) => updateBudgetProportions('Transportation', val)"
                  />
                </div>
                <div class="budget-row slider-row">
                  <span>Hotel:</span>
                  <el-slider
                    v-model="tripSelections.Budget.Hotel"
                    :min="0"
                    :max="100"
                    show-input
                    @change="(val) => updateBudgetProportions('Hotel', val)"
                  />
                </div>
                <div class="budget-row slider-row">
                  <span>Tickets:</span>
                  <el-slider
                    v-model="tripSelections.Budget.Tickets"
                    :min="0"
                    :max="100"
                    show-input
                    @change="(val) => updateBudgetProportions('Tickets', val)"
                  />
                </div>
                <div class="budget-row slider-row">
                  <span>Activities:</span>
                  <el-slider
                    v-model="tripSelections.Budget.Activities"
                    :min="0"
                    :max="100"
                    show-input
                    @change="(val) => updateBudgetProportions('Activities', val)"
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

          <div class="trip-prompt">
            <p>{{ tripPrompt }}</p>
            <!-- Insert按钮：风格加大，统一处理 -->
            <el-button class="insert-btn" @click="insertTripPrompt">
              Insert Prompt into Chat
            </el-button>
          </div>

          <!-- Map 模块：Map 和三种地图下拉放在同一行 -->
          <div class="map-panel">
            <div class="map-header-row">
              <!-- 标题/标签 与下拉 在一行 -->
              <label class="map-label">Map:</label>
              <el-select
                v-model="selectedMapType"
                placeholder="Select a map type"
                class="map-select"
              >
                <el-option label="World Map" value="World Map" />
                <el-option label="City Navigation" value="City Navigation" />
                <el-option label="City Traffic" value="City Traffic" />
              </el-select>
            </div>
            <div class="map-display">
              <p>Displaying: {{ selectedMapType }}</p>
              <p>From: {{ userLocation }} To: {{ selectedDestination }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

