<script setup lang="ts">
import { ref } from 'vue';
import { ElDropdown, ElDropdownMenu, ElDropdownItem, ElMessage, ElMessageBox } from 'element-plus';
import { useUserStore } from '@/stores/user';
import router from '@/router';
const inputContent = ref('');


// 处理输入内容变化
const handleInputChange = () => {
    console.log('Input changed:', inputContent.value);
};

// 处理输入框提交
const handleSubmit = () => {
    console.log('Submitted:', inputContent.value);
};

const selectedLocation = ref('Singapore');
const locationOptions = ref(['Singapore', 'Taipei', 'Tokyo', 'Hong Kong']);
const handleLocationChange = (val: string) => {
    selectedLocation.value = val;
}
const selectTags = ref('More Topics')
const tagOptions = ref(['Food', 'Drink', 'Events', 'Local Attractions'])
const handleTagChange = (val: string) => {
    selectTags.value = val
    console.log(val);

}
const userStore = useUserStore();
// 语音输入功能
const startVoiceInput = () => {


    // 检查用户是否登录
    if (!userStore.isLogin()) {
        // 显示登录确认框
        ElMessageBox.confirm(
            'You need to log in to use voice input feature. Would you like to go to login page?',
            'Login Required',
            {
                confirmButtonText: 'Go to Login',
                cancelButtonText: 'Cancel',
                type: 'warning',
            }
        )
            .then(() => {
                // 确认后跳转到登录页面
                router.push({
                    name: 'login',
                });
            })
            .catch(() => {
                // 取消操作
                ElMessage.info('Voice input canceled');
            });
    } else {
        // 已登录用户执行语音识别
        // 检查浏览器是否支持语音识别
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
            const recognition = new SpeechRecognition();

            recognition.continuous = false;
            recognition.interimResults = false;
            recognition.lang = 'en-US';

            recognition.onstart = () => {
                ElMessage.info('Listening... Speak now!');
            };

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            recognition.onresult = (event: any) => {
                const transcript = event.results[0][0].transcript;
                inputContent.value = transcript;
                ElMessage.success('Voice input captured!');
            };

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            recognition.onerror = (event: any) => {
                ElMessage.error('Voice recognition error: ' + event.error);
            };

            recognition.start();
        } else {
            ElMessage.warning('Voice recognition not supported in this browser');
        }
    }
};
const uploadAttachment = () => {
    // 检查用户是否登录
    if (!userStore.isLogin()) {
        // 显示登录确认框
        ElMessageBox.confirm(
            'You need to log in to use upload input feature. Would you like to go to login page?',
            'Login Required',
            {
                confirmButtonText: 'Go to Login',
                cancelButtonText: 'Cancel',
                type: 'warning',
            }
        )
            .then(() => {
                // 确认后跳转到登录页面
                router.push({
                    name: 'login',
                });
            })
            .catch(() => {
                // 取消操作
                ElMessage.info('Upload input canceled');
            });
    } else {
        ElMessage.warning('File upload not supported in this browser');
    }

}
</script>

<template>
    <div class="conference-map-container">
        <div class="input-section">
            <div class="wanderboat-header">
                <h1 class="brand-name">Wanderboat</h1>
                <p class="greeting">What's on your mind <span class="wander-text">Wander?</span></p>
            </div>

            <div class="input-wrapper">
                <input v-model="inputContent" @input="handleInputChange" @keyup.enter="handleSubmit"
                    placeholder="Things to do, food and drink, local events" class="main-input" />
                <div class="input-actions">
                    <button class="action-icon yellow-icon">
                        <span class="icon">🚣</span>
                    </button>
                    <button class="action-icon">
                        <span class="icon" @click="uploadAttachment">📎</span>
                    </button>
                    <div class="spacer"></div>
                    <button class="action-icon">
                        <span class="icon" @click="startVoiceInput">🎤</span>
                    </button>
                    <button @click="handleSubmit" class="submit-button">
                        <span class="arrow-icon">↑</span>
                    </button>
                </div>
            </div>

            <div class="main-actions">
                <button class="action-button">
                    <span class="action-icon">🔍</span>
                    Search places
                </button>
                <button class="action-button">
                    <span class="action-icon">✏️</span>
                    Create a trip
                </button>
                <button class="action-button">
                    <span class="action-icon">🏨</span>
                    Find hotels
                </button>
            </div>
        </div>

        <div class="image-section">
            <!-- 顶部Discover标题和位置选择器 -->
            <div class="discover-header">
                <h2 class="discover-title">Discover</h2>
                <el-dropdown @command="handleLocationChange">
                    <span class="location-selector">
                        <span class="location-icon">📍</span>
                        <span class="location-name">{{ selectedLocation }}</span>
                        <span class="dropdown-icon">▼</span>
                    </span>
                    <template #dropdown>
                        <el-dropdown-menu>
                            <el-dropdown-item v-for="location in locationOptions" :key="location" :command="location">{{
                                location
                            }}</el-dropdown-item>
                        </el-dropdown-menu>
                    </template>
                </el-dropdown>
            </div>

            <!-- 顶部主题标签 -->
            <div class="topic-tags">
                <button class="topic-tag active">Today's Inspo</button>
                <button class="topic-tag">Bang!</button>
                <button class="topic-tag">Coffee Fix</button>

                <span class="topic-tag">Late-Night Bites </span>

                <el-dropdown @command="handleTagChange">
                    <span class="topic-tag more">{{ selectTags }} ▼</span>
                    <template #dropdown>
                        <el-dropdown-menu>
                            <el-dropdown-item v-for="tag in tagOptions" :key="tag" :command="tag">{{ tag
                            }}</el-dropdown-item>
                        </el-dropdown-menu>
                    </template>
                </el-dropdown>
            </div>

            <!-- 卡片网格布局 -->
            <div class="card-grid">
                <!-- 大卡片 -->
                <div class="card large-card">
                    <img src="https://picsum.photos/id/10/800/500" alt="Hiking" />
                    <div class="card-overlay">
                        <h3>Find me a good hike nearby</h3>
                    </div>
                </div>

                <!-- 中卡片 - 咖啡 -->
                <div class="card medium-card">
                    <img src="https://picsum.photos/id/42/400/300" alt="Coffee" />
                    <div class="card-overlay">
                        <p>I need a coffee break, what's close?</p>
                    </div>
                </div>

                <!-- 中卡片 - 甜点 -->
                <div class="card medium-card">
                    <img src="https://picsum.photos/id/292/400/300" alt="Dessert" />
                    <div class="card-overlay">
                        <p>Popular dessert places near me</p>
                    </div>
                </div>

                <!-- 中卡片 - 气球 -->
                <div class="card medium-card">
                    <img src="https://picsum.photos/id/129/400/300" alt="Events" />
                    <div class="card-overlay">
                        <p>Take me to the latest events</p>
                    </div>
                </div>

                <!-- 小卡片 - 餐厅 -->
                <div class="card small-card">
                    <img src="https://picsum.photos/id/431/300/200" alt="Restaurant" />
                    <div class="card-overlay">
                        <p>I want to check out the latest restaurant openings</p>
                    </div>
                </div>

                <!-- 小卡片 - 艺术装置 -->
                <div class="card small-card">
                    <img src="https://picsum.photos/id/87/300/200" alt="Art" />
                    <div class="card-overlay">
                        <p>Find art installations around me</p>
                    </div>
                </div>

                <!-- 小卡片 - 煎饼 -->
                <div class="card small-card">
                    <img src="https://picsum.photos/id/433/300/200" alt="Breakfast" />
                    <div class="card-overlay">
                        <p>Best breakfast spots this weekend</p>
                    </div>
                </div>

                <!-- 小卡片 - 户外 -->
                <div class="card small-card">
                    <img src="https://picsum.photos/id/252/300/200" alt="Outdoor" />
                    <div class="card-overlay">
                        <p>Outdoor activities for sunny days</p>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>
