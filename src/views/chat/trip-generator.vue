<script setup lang="ts">
import { ref, computed, watch, onMounted, reactive, nextTick, onUnmounted } from 'vue';
import { ElMessage } from 'element-plus';
import { tripOptionsData, allCurrencies } from '@/utils/trip-options.ts';
import { useChatStore } from '@/stores/chat';
import { useRouter } from 'vue-router';

import commonHeader from '@/layout/common-header.vue';
import MarkdownIt from 'markdown-it';
import { 
  ChatDotRound, 
  MagicStick, 
  Document, 
  Collection, 
  Plus, 
  MapLocation, 
  ChatLineRound,
  ChatDotSquare,
  Right,
  StarFilled,
  CopyDocument,
  Edit,
  Star,
  Delete,
  Check
} from '@element-plus/icons-vue';
const md = new MarkdownIt();

const store = useChatStore();
const message = computed(()=> store.message);
const messages = computed(() => store.messages);
const conversations = computed(() => store.conversations);

const router = useRouter();

// 滚动到最新消息
const chatBoxRef = ref(null);

function scrollToBottom() {
  nextTick(() => {
    if (chatBoxRef.value) {
      const chatBox = chatBoxRef.value;
      chatBox.scrollTop = chatBox.scrollHeight;
    }
  });
}

// 监听消息变化，自动滚动到底部
watch(() => messages.value.length, () => {
  scrollToBottom();
});

function loadHistory(id: number | undefined) {
  if(id) {
    store.getChatsByConversationID(id)
      .then(() => {
        // 加载完成后滚动到底部
        scrollToBottom();
      })
      .catch(e => console.log(e));
  }
}

const userChatInput = ref('');
const showHistory = ref(false);
const showTripOptions = ref(false);
const editablePrompt = ref('');
const isLeftPanelCollapsed = ref(false); // State for collapsing the left panel

function toggleLeftPanel() {
  isLeftPanelCollapsed.value = !isLeftPanelCollapsed.value;
}

function handleUserInput(event: Event | KeyboardEvent) {
  if ((event as KeyboardEvent).shiftKey) return; // 如果按住 shift，允许换行

  if (userChatInput.value.trim()) {
    // await sendToAI(userChatInput.value);
    store.chat(userChatInput.value.trim()).then(()=>{
      userChatInput.value = ''; // 清空输入框，恢复到 placeholder 状态
    }).catch(e=>{
      console.log(e);
      if(e.status == 401) ElMessage.error('Please login');
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

  return parts.length > 0 ? parts.join(" ") : "Please select travel options to generate a prompt.";
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

// 编辑消息相关
const editingMessageId = ref(-1);
const editedMessageContent = ref('');

// 复制消息
function copyMessage(content: string) {
  navigator.clipboard.writeText(content)
    .then(() => {
      ElMessage.success('消息已复制到剪贴板');
    })
    .catch(() => {
      ElMessage.error('复制失败，请重试');
    });
}

// 开始编辑消息
function editMessage(index: number, content: string) {
  editingMessageId.value = index;
  editedMessageContent.value = content;
}

// 保存编辑的消息
function saveEdit(index: number) {
  if (editedMessageContent.value.trim()) {
    // 更新消息内容
    store.updateUserMessage(index, editedMessageContent.value);
    
    // 重新发送消息获取回复
    store.regenerateResponse(index).catch(e => {
      console.error(e);
      ElMessage.error('获取回复失败');
    });
    
    // 重置编辑状态
    editingMessageId.value = -1;
    editedMessageContent.value = '';
  }
}

// 取消编辑
function cancelEdit() {
  editingMessageId.value = -1;
  editedMessageContent.value = '';
}

// 地图相关变量
const mapDiv = ref(null);
const map = ref(null);
const markers = ref<any[]>([]);
const infoWindows = ref<any[]>([]);

// 初始化Google Maps
function initializeMap() {
  if (mapDiv.value) {
    try {
      // 创建地图实例
      map.value = new window.google.maps.Map(mapDiv.value, {
        center: { lat: 39.9042, lng: 116.4074 }, // 默认中心点（北京）
        zoom: 12, // 默认缩放级别
        mapTypeControl: true,
        fullscreenControl: true,
        streetViewControl: false
      });
      console.log('Map initialized successfully');
    } catch (error) {
      console.error('Error initializing map:', error);
    }
  }
}

// 地理编码：将地点名称转换为坐标
async function geocodeLocation(placeName: string): Promise<{lat: number, lng: number} | null> {
  if (!window.google || !window.google.maps) {
    console.error('Google Maps API not loaded');
    return null;
  }
  
  return new Promise((resolve, reject) => {
    const geocoder = new window.google.maps.Geocoder();
    
    geocoder.geocode({ address: placeName }, (results: any, status: any) => {
      if (status === 'OK' && results && results.length > 0) {
        const location = results[0].geometry.location;
        resolve({
          lat: location.lat(),
          lng: location.lng()
        });
      } else {
        console.warn(`Geocoding failed for ${placeName}: ${status}`);
        // 如果地理编码失败，使用模拟坐标（仅用于演示）
        resolve({
          lat: 39.9042 + (Math.random() - 0.5) * 0.1,
          lng: 116.4074 + (Math.random() - 0.5) * 0.1
        });
      }
    });
  });
}

// 在地图上添加标记
function addMarkerToMap(location: {name: string, lat: number, lng: number, description?: string}) {
  if (!map.value || !window.google) return;
  
  // 清除之前的标记
  clearMarkers();
  
  // 创建新标记
  const marker = new window.google.maps.Marker({
    position: { lat: location.lat, lng: location.lng },
    map: map.value,
    title: location.name,
    animation: window.google.maps.Animation.DROP
  });
  
  // 创建信息窗口内容，包含添加到计划的按钮
  const infoContent = `
    <div class="info-window">
      <h3>${location.name}</h3>
      ${location.description ? `<p>${location.description}</p>` : ''}
      <button class="add-to-plan-btn" onclick="window.addLocationToPlan('${location.name}', ${location.lat}, ${location.lng}, '${location.description || ''}')">
        Add to My Plan
      </button>
    </div>
  `;
  
  const infoWindow = new window.google.maps.InfoWindow({
    content: infoContent
  });
  
  // 点击标记时显示信息窗口
  marker.addListener('click', () => {
    infoWindow.open(map.value, marker);
  });
  
  // 保存标记和信息窗口的引用
  markers.value.push(marker);
  infoWindows.value.push(infoWindow);
  
  // 自动打开信息窗口并聚焦到该位置
  infoWindow.open(map.value, marker);
  map.value.setCenter({ lat: location.lat, lng: location.lng });
  map.value.setZoom(15);
}

// 清除所有标记
function clearMarkers() {
  markers.value.forEach(marker => {
    marker.setMap(null);
  });
  markers.value = [];
  
  infoWindows.value.forEach(infoWindow => {
    infoWindow.close();
  });
  infoWindows.value = [];
}

// 处理聊天消息中地点的点击
async function handleLocationClick(event: MouseEvent) {
  const target = event.target as HTMLElement;
  
  if (target.classList.contains('location-tag')) {
    // 获取地点名称
    const placeName = target.getAttribute('data-location');
    if (!placeName) return;
    
    // 显示加载状态
    ElMessage({
      message: `定位 ${placeName} 中...`,
      type: 'info',
      duration: 2000
    });
    
    try {
      // 地理编码获取坐标
      const coordinates = await geocodeLocation(placeName);
      
      if (coordinates) {
        // 在地图上添加标记
        addMarkerToMap({
          name: placeName,
          lat: coordinates.lat,
          lng: coordinates.lng,
          description: `从聊天中点击的地点: ${placeName}`
        });
        
        ElMessage({
          message: `已在地图上标记 ${placeName}`,
          type: 'success',
          duration: 2000
        });
      }
    } catch (error) {
      console.error('Error locating place:', error);
      ElMessage.error('无法定位该地点');
    }
  }
}

// 处理AI回复中的地点标记
function processMessageContent(content: string): string {
  // 匹配粗体文本，可能是地点名称
  // 例如：**北京故宫**、**长城**、**上海东方明珠**
  const placeRegex = /\*\*([\w\s\u4e00-\u9fa5]+)\*\*/g;
  
  // 将匹配到的地点名称转换为可点击的元素
  return content.replace(placeRegex, (match, placeName) => {
    return `<span class="location-tag" data-location="${placeName}">${match}</span>`;
  });
}

// 添加My Plan相关状态
const showMyPlan = ref(false);
const myPlan = ref({
  title: '',
  destinations: [] as Array<{
    id: string;
    name: string;
    description: string;
    day: number;
    coordinates?: { lat: number, lng: number };
    addedAt: Date;
  }>,
  duration: {
    startDate: '',
    endDate: '',
    totalDays: 0
  },
  notes: ''
});

// 从聊天中提取的可用景点
const availableDestinations = ref<Array<{
  name: string;
  content: string;
  messageIndex: number;
  coordinates?: { lat: number, lng: number };
}>>([]);

// Chatbox功能：回到聊天界面并聚焦输入框
function focusOnChat() {
  // 关闭所有弹窗
  showHistory.value = false;
  showTripOptions.value = false;
  showMyPlan.value = false;
  
  // 滚动到聊天底部
  scrollToBottom();
  
  // 聚焦到输入框
  nextTick(() => {
    const inputElement = document.querySelector('.chat-input textarea');
    if (inputElement) {
      (inputElement as HTMLTextAreaElement).focus();
    }
  });
  
  ElMessage({
    message: 'Returned to chat',
    type: 'info',
    duration: 1500
  });
}

// My Plan相关功能
function toggleMyPlan() {
  showMyPlan.value = !showMyPlan.value;
  if (showMyPlan.value) {
    extractDestinationsFromChat();
  }
}

// 从聊天消息中提取景点信息
function extractDestinationsFromChat() {
  const destinations: Array<{
    name: string;
    content: string;
    messageIndex: number;
    coordinates?: { lat: number, lng: number };
  }> = [];
  
  messages.value.forEach((msg, index) => {
    if (msg.role === 'assistant') {
      // 使用正则表达式匹配可能的景点名称
      const placeRegex = /\*\*([\w\s\u4e00-\u9fa5]+)\*\*/g;
      let match;
      
      while ((match = placeRegex.exec(msg.content)) !== null) {
        const placeName = match[1];
        if (!destinations.some(d => d.name === placeName)) {
          destinations.push({
            name: placeName,
            content: msg.content.substring(match.index - 50, match.index + 100),
            messageIndex: index
          });
        }
      }
    }
  });
  
  availableDestinations.value = destinations;
}

// 添加景点到My Plan
function addDestinationToPlan(destination: any) {
  const newDestination = {
    id: Date.now().toString(),
    name: destination.name,
    description: destination.content || '',
    day: myPlan.value.destinations.length + 1,
    coordinates: destination.coordinates,
    addedAt: new Date()
  };
  
  myPlan.value.destinations.push(newDestination);
  
  ElMessage({
    message: `Added ${destination.name} to your plan`,
    type: 'success',
    duration: 2000
  });
}

// 从My Plan中移除景点
function removeDestinationFromPlan(destinationId: string) {
  myPlan.value.destinations = myPlan.value.destinations.filter(d => d.id !== destinationId);
  // 重新排序天数
  myPlan.value.destinations.forEach((dest, index) => {
    dest.day = index + 1;
  });
}

// 保存计划
function savePlan() {
  if (!myPlan.value.title.trim()) {
    ElMessage.error('Please enter a plan title');
    return;
  }
  
  // 这里可以调用API保存计划
  console.log('Saving plan:', myPlan.value);
  
  ElMessage({
    message: 'Plan saved successfully',
    type: 'success',
    duration: 2000
  });
  
  showMyPlan.value = false;
}

onMounted(async() => {
  const query = router.currentRoute.value.query;
  if(query && query.prompt && query.prompt.length > 0) {
    await store.chat(query.prompt as string);
  }
  store.getConversasions()
  // const {prompt, location, destination} = router.currentRoute.value.query;

  // 为聊天区域添加事件委托
  if (chatBoxRef.value) {
    chatBoxRef.value.addEventListener('click', handleLocationClick);
  }
  
  // 设置全局初始化函数
  window.initMap = initializeMap;
  
  // 检查Google Maps API是否已加载
  if (window.google && window.google.maps) {
    console.log('Google Maps API already loaded');
    initializeMap();
  } else {
    // 加载Google Maps API
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=AIzaSyDG1OwabKoD6wmMgWp_HxoNY_J7GgxvAO8&callback=initMap`;
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);
    
    console.log('Loading Google Maps API');
  }

  // 为地图信息窗口按钮添加全局函数
  window.addLocationToPlan = (name: string, lat: number, lng: number, description: string) => {
    const destination = {
      name,
      coordinates: { lat, lng },
      content: description || `Location: ${name}`
    };
    addDestinationToPlan(destination);
  };
});

onUnmounted(() => {
  // 移除事件监听器
  if (chatBoxRef.value) {
    chatBoxRef.value.removeEventListener('click', handleLocationClick);
  }
});

</script>

<template>
  <div class="background-layer"></div>
  <div class="generator layout-main">
    <!-- Header -->
    <common-header />

    <!-- 外层内容容器 -->
    <div class="content-wrapper">
      <!-- 主体三栏布局 -->
      <div class="main-layout">
        <!-- 左侧：可折叠导航模块 -->
        <div
          :class="['left-navigation-panel', { collapsed: isLeftPanelCollapsed }]"
          @click="toggleLeftPanel"
        >
          <div class="nav-button-group" @click.stop>
            <el-tooltip content="Chatbox" placement="right" :disabled="!isLeftPanelCollapsed" :open-delay="300">
              <el-button class="nav-item-btn" @click.stop="focusOnChat">
                <el-icon class="nav-icon"><ChatDotRound /></el-icon>
                <span v-if="!isLeftPanelCollapsed">Chatbox</span>
              </el-button>
            </el-tooltip>
            <el-tooltip content="Generate Plan" placement="right" :disabled="!isLeftPanelCollapsed" :open-delay="300">
              <el-button class="nav-item-btn" @click.stop="toggleTripOptions">
                <el-icon class="nav-icon"><MagicStick /></el-icon>
                <span v-if="!isLeftPanelCollapsed">Generate Plan</span>
              </el-button>
            </el-tooltip>
            <el-tooltip content="History" placement="right" :disabled="!isLeftPanelCollapsed" :open-delay="300">
              <el-button class="nav-item-btn" @click.stop="toggleHistory">
                <el-icon class="nav-icon"><Document /></el-icon>
                <span v-if="!isLeftPanelCollapsed">History</span>
              </el-button>
            </el-tooltip>
            <el-tooltip content="My Plan" placement="right" :disabled="!isLeftPanelCollapsed" :open-delay="300">
              <el-button class="nav-item-btn" @click.stop="toggleMyPlan">
                <el-icon class="nav-icon"><StarFilled /></el-icon>
                <span v-if="!isLeftPanelCollapsed">My Plan</span>
              </el-button>
            </el-tooltip>
            <el-tooltip content="New Chat" placement="right" :disabled="!isLeftPanelCollapsed" :open-delay="300">
              <el-button class="nav-item-btn" @click="finishConversation">
                <el-icon class="nav-icon"><Plus /></el-icon>
                <span v-if="!isLeftPanelCollapsed">New Chat</span>
              </el-button>
            </el-tooltip>
          </div>
        </div>

        <!-- 中间：Chatbox 模块 -->
        <div class="center-chat-panel">
          <div class="chat-box-placeholder">
            <div class="chat-box" ref="chatBoxRef">
              <div
                v-for="(msg, index) in messages"
                :key="index"
                class="chat-message"
                :class="msg.role"
              >
                <!-- 如果是用户消息且正在编辑 -->
                <div v-if="msg.role === 'user' && editingMessageId === index">
                  <el-input
                    v-model="editedMessageContent"
                    type="textarea"
                    :rows="3"
                    autofocus
                    @blur="cancelEdit"
                    @keydown.enter.prevent="saveEdit(index)"
                  />
                  <div class="edit-actions">
                    <el-button size="small" @click="cancelEdit">Cancel</el-button>
                    <el-button size="small" type="primary" @click="saveEdit(index)">Save</el-button>
                  </div>
                </div>
                
                <!-- 正常显示消息 - 使用processMessageContent处理AI回复 -->
                <div v-else v-html="msg.role === 'assistant' ? processMessageContent(msg.content) : md.render(msg.content)"></div>
                
                <!-- 用户消息的操作按钮 -->
                <div v-if="msg.role === 'user'" class="message-actions">
                  <el-tooltip content="Copy" placement="top" :show-after="300">
                    <div class="action-btn" @click="copyMessage(msg.content)">
                      <el-icon><CopyDocument /></el-icon>
                    </div>
                  </el-tooltip>
                  
                  <el-tooltip content="Edit Message" placement="top" :show-after="300">
                    <div class="action-btn" @click="editMessage(index, msg.content)">
                      <el-icon><Edit /></el-icon>
                    </div>
                  </el-tooltip>
                </div>
              </div>
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
                :rows="2"
                clearable
                @keydown.enter.prevent="handleUserInput"
              />
            </div>
          </div>
        </div>

        <!-- 右侧：地图模块 -->
        <div class="right-map-panel">
          <div id="map" ref="mapDiv" class="map-container"></div>
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
                  
                  class="futuristic-date-picker"
                />
                <!-- <div v-if="tripSelections.DurationDays > 0"
                  class="duration-display">
                  {{ tripSelections.DurationDays }} days
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
            <span>Generated Plan</span>
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

        <div class="trip-options-modal-footer">
          <el-button @click="toggleTripOptions" class="action-btn cancel-btn">Cancel</el-button>
          <el-button @click="insertTripPrompt" class="action-btn primary-btn" :disabled="!tripPrompt">
            Insert into Chat
          </el-button>
        </div>
      </div>
    </div>
  </transition>

  <!-- My Plan弹窗 -->
  <transition name="slide-up">
    <div class="plan-modal" v-if="showMyPlan">
      <div class="plan-modal-content">
        <div class="plan-modal-header">
          <h3>My Travel Plan</h3>
          <button class="close-btn" @click="toggleMyPlan">&times;</button>
        </div>

        <div class="plan-modal-body">
          <!-- 计划标题和基本信息 -->
          <div class="plan-info-section">
            <div class="plan-field">
              <label>Plan Title:</label>
              <el-input 
                v-model="myPlan.title" 
                placeholder="Enter your travel plan title"
                class="plan-title-input"
              />
            </div>
            
            <div class="plan-field">
              <label>Duration:</label>
              <div class="duration-inputs">
                <el-date-picker
                  v-model="myPlan.duration.startDate"
                  type="date"
                  placeholder="Start Date"
                  format="YYYY-MM-DD"
                  value-format="YYYY-MM-DD"
                />
                <span class="duration-separator">to</span>
                <el-date-picker
                  v-model="myPlan.duration.endDate"
                  type="date"
                  placeholder="End Date"
                  format="YYYY-MM-DD"
                  value-format="YYYY-MM-DD"
                />
              </div>
            </div>
          </div>

          <!-- 可用景点（从聊天中提取） -->
          <div class="available-destinations-section">
            <h4>Available Destinations from Chat</h4>
            <div v-if="availableDestinations.length === 0" class="empty-destinations">
              <p>No destinations found in chat. Generate some travel suggestions first!</p>
            </div>
            <div v-else class="destinations-grid">
              <div 
                v-for="destination in availableDestinations" 
                :key="destination.name"
                class="destination-card"
              >
                <div class="destination-info">
                  <h5>{{ destination.name }}</h5>
                  <p>{{ destination.content.substring(0, 80) }}...</p>
                </div>
                <el-button 
                  size="small" 
                  type="primary"
                  @click="addDestinationToPlan(destination)"
                  :disabled="myPlan.destinations.some(d => d.name === destination.name)"
                >
                  {{ myPlan.destinations.some(d => d.name === destination.name) ? 'Added' : 'Add' }}
                </el-button>
              </div>
            </div>
          </div>

          <!-- 已添加的景点 -->
          <div class="plan-destinations-section">
            <h4>Your Itinerary ({{ myPlan.destinations.length }} destinations)</h4>
            <div v-if="myPlan.destinations.length === 0" class="empty-plan">
              <p>No destinations added to your plan yet.</p>
            </div>
            <div v-else class="plan-destinations">
              <div 
                v-for="destination in myPlan.destinations" 
                :key="destination.id"
                class="plan-destination-item"
              >
                <div class="destination-day">Day {{ destination.day }}</div>
                <div class="destination-details">
                  <h5>{{ destination.name }}</h5>
                  <p>{{ destination.description.substring(0, 100) }}...</p>
                  <small>Added: {{ destination.addedAt.toLocaleDateString() }}</small>
                </div>
                <div class="destination-actions">
                  <el-button 
                    size="small" 
                    type="danger" 
                    @click="removeDestinationFromPlan(destination.id)"
                  >
                    <el-icon><Delete /></el-icon>
                  </el-button>
                </div>
              </div>
            </div>
          </div>

          <!-- 计划备注 -->
          <div class="plan-notes-section">
            <label>Notes:</label>
            <el-input
              v-model="myPlan.notes"
              type="textarea"
              :rows="3"
              placeholder="Add any additional notes for your travel plan..."
            />
          </div>
        </div>

        <div class="plan-modal-footer">
          <el-button @click="toggleMyPlan" class="action-btn cancel-btn">Cancel</el-button>
          <el-button 
            @click="savePlan" 
            class="action-btn primary-btn"
            :disabled="!myPlan.title.trim() || myPlan.destinations.length === 0"
          >
            <el-icon><Check /></el-icon>
            Save Plan
          </el-button>
        </div>
      </div>
    </div>
  </transition>
</template>

<style>
/* 可点击的地点标签样式 */
.location-tag {
  color: #1a73e8;
  font-weight: bold;
  cursor: pointer;
  transition: background-color 0.2s;
  padding: 0 2px;
  border-radius: 3px;
}

.location-tag:hover {
  background-color: rgba(26, 115, 232, 0.1);
  text-decoration: underline;
}

/* 地图容器样式 */
.map-container {
  width: 100%;
  height: 100%;
  min-height: 400px;
  border-radius: 8px;
}

/* 信息窗口样式 */
.info-window h3 {
  margin: 5px 0;
  font-size: 16px;
  color: #1a3566;
}

.info-window p {
  margin: 5px 0;
  font-size: 14px;
  color: #555;
}
</style>
