<script setup lang="ts">
import { ref, computed, watch, onMounted, reactive, nextTick, onUnmounted } from 'vue';
import { ElMessage } from 'element-plus';
import { useChatStore } from '@/stores/chat';
import { useRouter } from 'vue-router';

import commonHeader from '@/layout/common-header.vue';
import MarkdownIt from 'markdown-it';
import PlanComponent from '@/views/components/plan-component.vue';
import HistoryComponent from '@/views/components/history-component.vue';
import AutopromptComponent from '@/views/components/autoprompt-component.vue';
import type { Destination, SavedPlanData } from '@/types/base';
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



const userChatInput = ref('');
const showAutoprompt = ref(false);
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

function toggleAutoprompt() {
  showAutoprompt.value = !showAutoprompt.value;
}

// 处理从autoprompt组件插入提示
function handleInsertPrompt(prompt: string) {
  userChatInput.value = prompt;
  showAutoprompt.value = false;
  
  // 聚焦到聊天输入框
  setTimeout(() => {
    const inputElement = document.querySelector('.chat-input textarea');
    if (inputElement) {
      (inputElement as HTMLTextAreaElement).focus();
    }
  }, 100);
}

const toggleHistory = () => {
  showHistory.value = !showHistory.value;
  if (showHistory.value) {
    // 获取对话历史
    store.getConversasions().catch((e: any) => {
      console.error('Failed to load conversations:', e);
    });
  }
};

// 处理历史对话加载
function handleHistoryLoad(conversationId: number) {
  // 在trip-generator页面内部，处理来自history组件的加载请求
  store.getChatsByConversationID(conversationId)
    .then(() => {
      scrollToBottom();
      ElMessage.success('Conversation loaded successfully');
      
      // 如果需要的话，可以提取destinations用于My Plan
      if (showMyPlan.value) {
        extractDestinationsFromChat();
      }
    })
    .catch((e: any) => {
      console.error('Failed to load conversation:', e);
      ElMessage.error('Failed to load conversation');
    });
}

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
      // 默认中心点（北京）
      const defaultCenter = { lat: 39.9042, lng: 116.4074 };
      
      // 创建地图实例
      (map.value as any) = new (window as any).google.maps.Map(mapDiv.value, {
        center: defaultCenter,
        zoom: 12,
        mapTypeControl: true,
        fullscreenControl: true,
        streetViewControl: false
      });
      
      console.log('Map initialized successfully');
      
      // 尝试获取用户当前位置
      getUserLocation();
      
    } catch (error) {
      console.error('Error initializing map:', error);
    }
  }
}

// 获取用户当前位置
function getUserLocation() {
  if (navigator.geolocation) {
    // 显示定位提示
    const locationMessage = ElMessage({
      message: '🌍 正在获取您的当前位置...',
      type: 'info',
      duration: 0,
      showClose: false
    });
    
    navigator.geolocation.getCurrentPosition(
      // 成功获取位置
      (position) => {
        const userLat = position.coords.latitude;
        const userLng = position.coords.longitude;
        
        console.log('User location:', { lat: userLat, lng: userLng });
        
        // 关闭定位提示
        locationMessage.close();
        
        // 将地图中心设置为用户当前位置
        const userLocation = new (window as any).google.maps.LatLng(userLat, userLng);
        (map.value as any).setCenter(userLocation);
        (map.value as any).setZoom(15);
        
        // 创建醒目的用户位置标记
        const userLocationIcon = {
          url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
            <svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
              <!-- 外圈脉冲效果 -->
              <circle cx="20" cy="20" r="18" fill="#4285F4" fill-opacity="0.2">
                <animate attributeName="r" values="12;20;12" dur="2s" repeatCount="indefinite"/>
                <animate attributeName="fill-opacity" values="0.3;0.1;0.3" dur="2s" repeatCount="indefinite"/>
              </circle>
              <!-- 中圈 -->
              <circle cx="20" cy="20" r="12" fill="#4285F4" fill-opacity="0.4">
                <animate attributeName="r" values="8;12;8" dur="1.5s" repeatCount="indefinite"/>
              </circle>
              <!-- 内核 -->
              <circle cx="20" cy="20" r="8" fill="#1976D2" stroke="#ffffff" stroke-width="3"/>
              <!-- 中心点 -->
              <circle cx="20" cy="20" r="4" fill="#ffffff"/>
              <!-- 人形图标 -->
              <path d="M20 14c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 8c-2.7 0-5.8 1.29-6 2v1h12v-1c-.2-.71-3.3-2-6-2z" fill="#1976D2"/>
            </svg>
          `),
          scaledSize: new (window as any).google.maps.Size(40, 40),
          anchor: new (window as any).google.maps.Point(20, 20)
        };

        const userMarker = new (window as any).google.maps.Marker({
          position: userLocation,
          map: map.value,
          title: '🧭 Your current location',
          icon: userLocationIcon,
          animation: (window as any).google.maps.Animation.DROP,
          zIndex: 1000 // 确保在最顶层显示
        });
        
        // 添加信息窗口
        const userInfoWindow = new (window as any).google.maps.InfoWindow({
          content: `
            <div style="padding: 10px; text-align: center;">
              <h4 style="margin: 0 0 8px 0; color: #333;">📍 Your current location</h4>
              <p style="margin: 0; color: #666; font-size: 12px;">
                Latitude: ${userLat.toFixed(6)}<br>
                Longitude: ${userLng.toFixed(6)}
              </p>
            </div>
          `
        });
        
        // 点击标记显示信息
        userMarker.addListener('click', () => {
          userInfoWindow.open(map.value, userMarker);
        });
        
        // 保存标记引用
        markers.value.push(userMarker);
        infoWindows.value.push(userInfoWindow);
        
        // 成功提示
        ElMessage({
          message: '📍 Your current location is located',
          type: 'success',
          duration: 3000
        });
      },
      
      // 获取位置失败
      (error) => {
        // 关闭定位提示
        locationMessage.close();
        
        console.warn('Geolocation error:', error);
        
        let errorMessage = 'Failed to get your location information';
        switch(error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location access denied, using default location';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information is not available, using default location';
            break;
          case error.TIMEOUT:
            errorMessage = 'Location request timed out, using default location';
            break;
        }
        
        ElMessage({
          message: `⚠️ ${errorMessage}`,
          type: 'warning',
          duration: 3000
        });
      },
      
      // 配置选项
      {
        enableHighAccuracy: true, // 启用高精度
        timeout: 10000,          // 10秒超时
        maximumAge: 300000       // 5分钟内的缓存位置有效
      }
    );
  } else {
    ElMessage({
      message: '⚠️ Your browser does not support geolocation',
      type: 'warning',
      duration: 3000
    });
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
// 处理 AI 回复中的地名标记：支持 **鼓浪屿** 和 @location{鼓浪屿} 两种格式
function processMessageContent(content: string): string {
  // 将 **地名** 变成可点击标签
  content = content.replace(/\*\*([\w\s\u4e00-\u9fa5]+)\*\*/g, (_, placeName) => {
    return `<span class="location-tag" data-location="${placeName}">${placeName}</span>`;
  });

  // 将 @location{地名} 转换为同样的点击标签
  content = content.replace(/@location\{([^}]+)\}/g, (_, placeName) => {
    return `<span class="location-tag" data-location="${placeName}">${placeName}</span>`;
  });

  return content;
}


// 添加My Plan相关状态
const showMyPlan = ref(false);

// 添加History相关状态
const showHistory = ref(false);

// 从聊天中提取的可用景点
const availableDestinations = ref<Destination[]>([]);

// Chatbox功能：回到聊天界面并聚焦输入框
function focusOnChat() {
  // 关闭所有弹窗
  showHistory.value = false;
  showAutoprompt.value = false;
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
  const destinations: Destination[] = [];
  
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

// 处理计划保存
function handlePlanSave(plan: SavedPlanData) {
  console.log('Saving plan:', plan);
  showMyPlan.value = false;
  ElMessage.success('Plan saved successfully!');
}

onMounted(async() => {
  const query = router.currentRoute.value.query;
  
  // 处理直接发送消息
  if(query && query.prompt && query.prompt.length > 0) {
    await store.chat(query.prompt as string);
  }
  
  // 处理从其他页面跳转过来的历史对话加载
  if(query && query.conversationId) {
    const conversationId = parseInt(query.conversationId as string);
    if (!isNaN(conversationId)) {
      store.getChatsByConversationID(conversationId)
        .then(() => {
          scrollToBottom();
          ElMessage.success('Historical conversation loaded successfully');
          // 清除URL中的conversationId参数
          router.replace({ name: 'generator' });
        })
        .catch((e: any) => {
          console.error('Failed to load conversation:', e);
          ElMessage.error('Failed to load conversation');
          // 清除URL中的conversationId参数
          router.replace({ name: 'generator' });
        });
    }
  }

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
    // 现在这个功能在 plan 组件中，可以通过事件或其他方式通知
    console.log('Location to add to plan:', { name, lat, lng, description });
    ElMessage.info(`Location "${name}" noted. Please use the My Plan panel to add it manually.`);
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
              <el-button class="nav-item-btn" @click.stop="toggleAutoprompt">
                <el-icon class="nav-icon"><MagicStick /></el-icon>
                <span v-if="!isLeftPanelCollapsed">Auto Prompt</span>
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

  <!-- History组件 -->
  <HistoryComponent 
    :visible="showHistory"
    @close="showHistory = false"
    @load-history="handleHistoryLoad"
  />

  <!-- Autoprompt组件 -->
  <AutopromptComponent 
    :visible="showAutoprompt"
    @close="showAutoprompt = false"
    @insert-prompt="handleInsertPrompt"
  />

  <!-- My Plan弹窗 -->
  <PlanComponent 
    :visible="showMyPlan"
    :available-destinations="availableDestinations"
    @close="showMyPlan = false"
    @save="handlePlanSave"
  />
</template>


<style scoped>
.location-tag {
  color: #1a73e8;
  cursor: pointer;
  text-decoration: underline;
  font-weight: 500;
}
.location-tag:hover {
  text-decoration: none;
  color: #0b66c3;
}
</style>