<template>
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
          <wallet-item />
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
      <h1 class="header-title">Have Fun in iPoloGO</h1>
    </header>

    <!-- 整体内容区域 -->
    <div class="content-wrapper">
      <!-- History 抽屉 -->
      <transition name="slide-left">
        <div class="history-drawer" v-if="historyVisible">
          <h3>History</h3>
          <ul>
            <li v-for="(record, idx) in historyRecords" :key="idx" @click="loadHistory(idx)" class="history-item">
              {{ record.summary }}
            </li>
          </ul>
          <el-button type="text" @click="toggleHistory">Close</el-button>
        </div>
      </transition>

      <!-- 中间：Chat 模块 -->
      <div class="center-panel">
        <h3>Chat with iPoloGO</h3>
        <div class="chat-box">
          <div v-for="(msg, index) in chatMessages" :key="index" class="chat-message" :class="msg.sender" contenteditable="true" @blur="updateMessage(index, $event)">
            {{ msg.text }}
          </div>
        </div>
        <div class="chat-input">
          <el-input v-model="userChatInput" placeholder="Type your message..." clearable @keydown.native.enter="sendMessage" />
          <el-button type="warning" @click="finishConversation">Finish Conversation</el-button>
        </div>
      </div>

      <!-- 右侧：Trip Options 与 Map 模块 -->
      <div class="right-panel">
        <div class="options-panel">
          <h3>Trip Options</h3>
          <!-- Date 模块 -->
          <div class="trip-option date-option">
            <label>Date:</label>
            <div class="date-picker-container">
              <el-date-picker v-model="tripSelections.DateFrom" type="date" placeholder="From" />
              <span class="date-separator">to</span>
              <el-date-picker v-model="tripSelections.DateTo" type="date" placeholder="To" />
            </div>
          </div>

          <!-- Transportation 模块（整合在同一框内） -->
          <div class="trip-option">
            <label>
              <i class="el-icon-airplane" style="margin-right:5px"></i>
              Transportation:
            </label>
            <div class="trans-container">
              <el-select v-model="tripSelections.Transportation" multiple placeholder="Select transportation" filterable allow-create class="futuristic-select">
                <el-option v-for="item in tripOptionsData.Transportation" :key="item.name" :label="item.name" :value="item.name">
                  <template #default>
                    <i :class="item.icon" style="margin-right:5px"></i>{{ item.name }}
                  </template>
                </el-option>
              </el-select>
              <!-- 仅当单一交通工具选中时显示 Travel Class -->
              <div v-if="tripSelections.Transportation.length === 1" class="transport-class">
                <label>Class:</label>
                <el-select v-model="tripSelections.TransportationClass" placeholder="Select travel class" filterable class="futuristic-select">
                  <el-option v-for="option in availableTransportationClasses" :key="option" :label="option" :value="option" />
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
            <el-select v-model="tripSelections.Hotel" multiple placeholder="Select hotel options" filterable allow-create class="futuristic-select">
              <el-option-group v-for="group in groupedHotels" :key="group.label" :label="group.label">
                <el-option v-for="item in group.options" :key="item.name" :label="item.name" :value="item.name">
                  <template #default>
                    <i :class="item.icon" style="margin-right:5px"></i>{{ item.name }}
                  </template>
                </el-option>
              </el-option-group>
            </el-select>
          </div>

          <!-- Budget 模块 -->
          <div class="trip-option">
            <label>
              <i class="el-icon-money" style="margin-right:5px"></i>
              Budget:
            </label>
            <div class="budget-container">
              <!-- 第一行：货币与总预算 -->
              <div class="budget-row">
                <el-select v-model="tripSelections.Budget.Currency" placeholder="Select currency" style="width:150px" filterable class="futuristic-select">
                  <el-option v-for="currency in allCurrencies" :key="currency.name" :label="currency.flag + ' ' + currency.name" :value="currency.name" />
                </el-select>
                <el-input v-model="tripSelections.Budget.Total" placeholder="Enter total amount" style="width:150px; margin-left:10px;" />
              </div>
              <!-- 预算比例拖动条 -->
              <div class="budget-row">
                <label>Budget Proportions:</label>
              </div>
              <div class="budget-row slider-row">
                <span>Transportation:</span>
                <el-slider v-model="tripSelections.Budget.Transportation" :min="0" :max="100" show-input @change="updateBudgetProportions('Transportation', $event)" />
              </div>
              <div class="budget-row slider-row">
                <span>Hotel:</span>
                <el-slider v-model="tripSelections.Budget.Hotel" :min="0" :max="100" show-input @change="updateBudgetProportions('Hotel', $event)" />
              </div>
              <div class="budget-row slider-row">
                <span>Tickets:</span>
                <el-slider v-model="tripSelections.Budget.Tickets" :min="0" :max="100" show-input @change="updateBudgetProportions('Tickets', $event)" />
              </div>
              <div class="budget-row slider-row">
                <span>Activities:</span>
                <el-slider v-model="tripSelections.Budget.Activities" :min="0" :max="100" show-input @change="updateBudgetProportions('Activities', $event)" />
              </div>
              <p class="budget-totals">Total: {{ budgetTotal }}% (Must equal 100%)</p>
            </div>
          </div>

          <!-- Tickets 模块 -->
          <div class="trip-option">
            <label>
              <i class="el-icon-tickets" style="margin-right:5px"></i>
              Tickets:
            </label>
            <el-select v-model="tripSelections.Tickets" multiple placeholder="Select ticket options" filterable allow-create class="futuristic-select">
              <el-option v-for="item in tripOptionsData.Tickets" :key="item.name" :label="item.name" :value="item.name">
                <template #default>
                  <i :class="item.icon" style="margin-right:5px"></i>{{ item.name }}
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
            <el-select v-model="tripSelections.Activities" multiple placeholder="Select activities" filterable allow-create class="futuristic-select">
              <el-option-group v-for="(group, groupName) in tripOptionsData.Activities" :key="groupName" :label="groupName">
                <el-option v-for="item in group" :key="item.name" :label="item.name" :value="item.name">
                  <template #default>
                    <i :class="item.icon" style="margin-right:5px"></i>{{ item.name }}
                  </template>
                </el-option>
              </el-option-group>
            </el-select>
          </div>

          <!-- 自动生成的 Prompt -->
          <div class="trip-prompt">
            <p><strong>Constructed Prompt:</strong></p>
            <p>{{ tripPrompt }}</p>
            <el-button type="primary" @click="insertTripPrompt">Insert Prompt into Chat</el-button>
          </div>
        </div>

        <!-- Map 模块 -->
        <div class="map-panel">
          <h3>Map</h3>
          <div class="map-controls">
            <el-radio-group v-model="selectedMapType">
              <el-radio-button label="World Map">World Map</el-radio-button>
              <el-radio-button label="City Navigation">City Navigation</el-radio-button>
              <el-radio-button label="City Traffic">City Traffic</el-radio-button>
            </el-radio-group>
          </div>
          <div class="map-display">
            <p>Displaying: {{ selectedMapType }}</p>
            <p>From: {{ userLocation }} To: {{ selectedDestination }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted} from 'vue';
import { useRoute } from 'vue-router';
import { ElMessage } from 'element-plus';
import { tripOptionsData, allCurrencies } from '@/assets/tripOptionsData.js';

const route = useRoute();
const prompt = ref('');

onMounted(() => {
  prompt.value = (route.quey.prompt as string) || '';
});
/* ===============================
   Chat 与 History 数据
============================== */
interface ChatMessage { sender: string; text: string; }
interface HistoryRecord { summary: string; messages: ChatMessage[]; }
const chatMessages = ref<ChatMessage[]>([
  { sender: 'user', text: "Hi, I'm planning a trip." },
  { sender: 'agent', text: "Hello! How can I help you today?" }
]);
const historyRecords = ref<HistoryRecord[]>([]);
const userChatInput = ref('');
const updateMessage = (index: number, event: Event) => {
  const target = event.target as HTMLElement;
  chatMessages.value[index].text = target.innerText;
};
const sendMessage = () => {
  if (!userChatInput.value.trim()) return;
  chatMessages.value.push({ sender: 'user', text: userChatInput.value });
  const agentReply = "Agent reply to: " + userChatInput.value;
  chatMessages.value.push({ sender: 'agent', text: agentReply });
  userChatInput.value = '';
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

/* ===============================
   Trip Options 数据
============================== */
const tripSelections = ref({
  DateFrom: '',
  DateTo: '',
  Transportation: [] as string[],
  TransportationClass: '', // 交通舱位
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
  }
});

// Transportation：如果只选择了一项，则显示 Travel Class
const availableTransportationClasses = computed(() => {
  if (tripSelections.value.Transportation.length === 1) {
    const t = tripSelections.value.Transportation[0];
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

// Hotels 分组，根据 hotel 数据中的 group 属性
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

// Budget 部分：确保四个比例之和为 100%
const updateBudgetProportions = (changedKey: keyof typeof tripSelections.value.Budget, newValue: number) => {
  const keys: (keyof typeof tripSelections.value.Budget)[] = ["Transportation", "Hotel", "Tickets", "Activities"];
  const otherKeys = keys.filter(k => k !== changedKey);
  tripSelections.value.Budget[changedKey] = newValue;
  const remaining = 100 - newValue;
  const equalValue = Math.round(remaining / otherKeys.length);
  otherKeys.forEach(k => {
    tripSelections.value.Budget[k] = equalValue;
  });
};

watch(() => tripSelections.value.Budget.Transportation, (val) => { updateBudgetProportions("Transportation", val); });
watch(() => tripSelections.value.Budget.Hotel, (val) => { updateBudgetProportions("Hotel", val); });
watch(() => tripSelections.value.Budget.Tickets, (val) => { updateBudgetProportions("Tickets", val); });
watch(() => tripSelections.value.Budget.Activities, (val) => { updateBudgetProportions("Activities", val); });

const budgetTotal = computed(() => {
  const b = tripSelections.value.Budget;
  return b.Transportation + b.Hotel + b.Tickets + b.Activities;
});

// 生成标准英文 Prompt，仅包含用户选择的内容
const tripPrompt = computed(() => {
  let parts: string[] = [];
  if (tripSelections.value.DateFrom || tripSelections.value.DateTo) {
    const from = tripSelections.value.DateFrom || "a certain date";
    const to = tripSelections.value.DateTo || "a certain destination";
    parts.push(`I plan to travel from ${from} to ${to}.`);
  }
  if (tripSelections.value.Transportation.length) {
    const trans = tripSelections.value.Transportation.join(", ");
    const tClass = tripSelections.value.TransportationClass ? ` (${tripSelections.value.TransportationClass})` : "";
    parts.push(`My chosen transportation is ${trans}${tClass}.`);
  }
  if (tripSelections.value.Hotel.length) {
    parts.push(`I prefer to stay at ${tripSelections.value.Hotel.join(", ")}.`);
  }
  if (tripSelections.value.Budget.Currency || tripSelections.value.Budget.Total) {
    const currency = tripSelections.value.Budget.Currency || "";
    const total = tripSelections.value.Budget.Total || "";
    parts.push(`My total budget is ${currency} ${total} with proportions: Transportation ${tripSelections.value.Budget.Transportation}%, Hotel ${tripSelections.value.Budget.Hotel}%, Tickets ${tripSelections.value.Budget.Tickets}%, Activities ${tripSelections.value.Budget.Activities}%.`);
  }
  if (tripSelections.value.Tickets.length) {
    parts.push(`I plan to purchase ${tripSelections.value.Tickets.join(", ")}.`);
  }
  if (tripSelections.value.Activities.length) {
    parts.push(`I intend to participate in ${tripSelections.value.Activities.join(", ")}.`);
  }
  return parts.join(" ");
});
const insertTripPrompt = () => {
  if (tripPrompt.value) {
    userChatInput.value = tripPrompt.value;
  }
};

/* ===============================
   Map 模块数据
============================== */
const selectedMapType = ref('World Map');
const userLocation = ref('Current Location');
const selectedDestination = ref('Destination');

/* ===============================
   History 面板控制
============================== */
const historyVisible = ref(false);
const toggleHistory = () => {
  historyVisible.value = !historyVisible.value;
};
</script>
