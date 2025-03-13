<script setup lang="ts">
import { ref, computed, watch, onMounted, reactive } from 'vue';
import { ElMessage } from 'element-plus';
import { tripOptionsData, allCurrencies } from '@/utils/trip-options.ts';
import { useChatStore } from '@/stores/chat';
import commonHeader from '@/layout/common-header.vue';
import MarkdownIt from 'markdown-it';
const md = new MarkdownIt();

const store = useChatStore();
const message = computed(()=> store.message);
const messages = computed(() => store.messages);
const conversations = computed(() => store.conversations);

function loadHistory(id:number|undefined) {
  if(id) store.getChatsByConversationID(id).catch(e=>console.log(e));
}

const userChatInput = ref('');
const showHistory = ref(false);
const showTripOptions = ref(false);
const editablePrompt = ref('');

function handleUserInput(event: Event | KeyboardEvent) {
  if ((event as KeyboardEvent).shiftKey) return; // 如果按住 shift，允许换行

  if (userChatInput.value.trim()) {
    // await sendToAI(userChatInput.value);
    store.chat(userChatInput.value.trim()).then(()=>{
      userChatInput.value = ''; // 清空输入框，恢复到 placeholder 状态
    }).catch(e=>{
      console.log(e);
      if(e.status == 401) ElMessage.error('请登录');
    })
  }
};

const finishConversation = () => {
  store.clear()
};

function toggleTripOptions() {
  showTripOptions.value = !showTripOptions.value;
}

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
// 修改后的动态预算调整逻辑：按比例调整其他项，使总和为 100%
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

watch(() => tripSelections.Budget.Transportation, (val) => { updateBudgetProportions("Transportation", val); });
watch(() => tripSelections.Budget.Hotel, (val) => { updateBudgetProportions("Hotel", val); });
watch(() => tripSelections.Budget.Tickets, (val) => { updateBudgetProportions("Tickets", val); });
watch(() => tripSelections.Budget.Activities, (val) => { updateBudgetProportions("Activities", val); });

// Date Element Plus 组件

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

// 根据用户选择生成旅行提示文本
const tripPrompt = computed(() => {
  const parts: string[] = [];

  // 旅行时间部分
  if (tripSelections.Duration.length === 2) {
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

  return parts.length > 0 ? parts.join(" ") : "请选择旅行选项生成提示。";
});

// 监视tripPrompt变化，自动更新可编辑内容
watch(tripPrompt, (newValue) => {
  editablePrompt.value = newValue;
});

// 将生成的旅行提示插入到聊天输入框
function insertTripPrompt() {
  if (editablePrompt.value) {
    userChatInput.value = editablePrompt.value;
    toggleTripOptions(); // 关闭选项弹窗
    // 可选：自动聚焦到聊天输入框
    setTimeout(() => {
      const inputElement = document.querySelector('.chat-input textarea');
      if (inputElement) {
        (inputElement as HTMLTextAreaElement).focus();
      }
    }, 100);
  }
}


const toggleHistory = () => {
  showHistory.value = !showHistory.value;
};


onMounted(() => {
  store.getConversions();
});

</script>

<template>
  <div class="background-layer"></div>
  <div class="home">
    <!-- Header -->
    <common-header />

    <!-- 外层内容容器 -->
    <div class="content-wrapper">
      <!-- 主体布局：聊天面板 + 右侧信息面板 -->
      <div class="main-content">
        <!-- 中间：Chat 模块 -->
        <div class="center-panel">
          <div class="chat-header">
            <div class="header-title">
              <h2>Chat with iPoloGO</h2>
            </div>
            <div class="header-actions">
              <el-button class="action-btn primary-btn" @click.stop="toggleHistory">
                <i class="el-icon-document" style="margin-right: 6px"></i> History
              </el-button>
              <el-button class="action-btn primary-btn trip-options-btn" @click.stop="toggleTripOptions">
                <i class="el-icon-magic-stick" style="margin-right: 6px"></i> Generate Token
              </el-button>
              <el-button class="action-btn warning-btn" @click="finishConversation">
                <i class="el-icon-close" style="margin-right: 6px"></i>
                Finish Conversation
              </el-button>
            </div>
          </div>
          <div class="chat-box">
            <div
              v-for="(msg, index) in messages"
              :key="index"
              class="chat-message"
              :class="msg.role"
              v-html="md.render(msg.content)"
            ></div>
            <div
              v-if="message.length > 0"
              class="chat-message ai"
            >{{ message }}</div>
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
          </div>
        </div>
      </div>
    </div>
  </div>

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

  <!-- 旅行选项弹窗背景遮罩 -->
  <div class="modal-overlay" v-if="showTripOptions" @click="toggleTripOptions"></div>

  <!-- 旅行选项弹窗 -->
  <transition name="slide-up">
    <div class="trip-options-modal" v-if="showTripOptions">
      <div class="trip-options-modal-content">
        <div class="trip-options-modal-header">
          <h3>Generate Travel Token</h3>
          <button class="close-btn" @click="toggleTripOptions">&times;</button>
        </div>

        <div class="trip-options-modal-body">
          <div class="trip-options-scrollable">
            <!-- Duration 模块 -->
            <div class="trip-option">
              <label>
                <i class="el-icon-date" style="margin-right:5px"></i>
                Trip Duration:
              </label>
              <div class="date-picker-container">
                <el-date-picker
                  v-model="tripSelections.Duration"
                  type="daterange"
                  start-placeholder="Start Date"
                  end-placeholder="End Date"
                  :shortcuts="dateShortcuts"
                  class="futuristic-date-picker"
                />
                <div v-if="tripSelections.DurationDays > 0" class="duration-display">
                  {{ tripSelections.DurationDays }} days
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

          <!-- 旅行提示生成结果 -->
          <div class="trip-prompt-result">
            <h4>Generated Token</h4>
            <el-input
              v-model="editablePrompt"
              type="textarea"
              :rows="4"
              placeholder="Your travel prompt will appear here"
              resize="none"
              class="editable-prompt"
            ></el-input>
          </div>
        </div>

        <div class="trip-options-modal-footer">
          <el-button @click="toggleTripOptions" class="action-btn cancel-btn">Cancel</el-button>
          <el-button @click="insertTripPrompt" class="action-btn primary-btn" :disabled="!tripPrompt">
            Insert into Chat
          </el-button>
        </div>
      </div>
    </div>
  </transition>
</template>
