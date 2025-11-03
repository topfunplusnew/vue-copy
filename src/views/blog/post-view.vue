<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { Plus, Delete, Close } from '@element-plus/icons-vue';
import { ElMessage, ElMessageBox, type UploadFile, type FormInstance } from 'element-plus';
import { useBlogStore } from '@/stores/blog';
import { useUserStore } from '@/stores/user';
// import commonHeader from '@/layout/common-header.vue';
import { getImageUrl } from '@/utils';
import { destinations } from '@/utils/destinations';

const props = defineProps({
  id: {
    type: Number,
  },
});
const emit = defineEmits(['close', 'show-preview']);

const store = useBlogStore();
const userStore = useUserStore();

const socialFilters = computed(() => store.socialFilters); // 社会过滤器
const createData = computed(() => store.createData); // 创建数据
const commentPermission = computed(() => store.commentPermission); // 评论权限

// 响应式数据
const tagInput = ref('');
const router = useRouter();
const formRef = ref<FormInstance>();

// 添加关闭组件方法
const closeDialog = () => {
  router.push('/userpage');
};

// 处理目的地选择变更
const handleDestinationsChange = (values: string[]) => {
  createData.value.location = values;
};

// 添加切换偏好的方法
const togglePreference = (id: number) => {
  const index = createData.value.social_filters.indexOf(id);
  if (index === -1) {
    createData.value.social_filters.push(id);
  } else {
    createData.value.social_filters.splice(index, 1);
  }

  // 触发表单验证，确保Categories字段的验证状态正确更新
  formRef.value?.validateField('social_filters');
};

// 显示登录确认弹窗
const showLoginConfirm = () => {
  return ElMessageBox.confirm('You need to login first to post a blog. Would you like to login now?', 'Login Required', {
    confirmButtonText: 'Go to Login',
    cancelButtonText: 'Cancel',
    type: 'warning',
  });
};

// 表单验证规则
const rules = {
  title: [
    { required: true, message: 'Please enter a title for your post', trigger: 'blur' },
    { max: 50, message: 'Title should not exceed 50 characters', trigger: 'blur' },
  ],
  content: [{ required: true, message: 'Please add some content to your post', trigger: 'blur' }],
  files: [
    {
      validator: (rule: object, value: string[], callback: (error?: Error) => void) => {
        if (createData.value.files.length === 0) {
          callback(new Error('Please upload at least one image'));
        } else {
          callback();
        }
      },
      trigger: 'change',
    },
  ],
  social_filters: [
    {
      validator: (rule: object, value: number[], callback: (error?: Error) => void) => {
        if (createData.value.social_filters.length === 0) {
          callback(new Error('Please select at least one category'));
        } else {
          callback();
        }
      },
      trigger: 'change',
    },
  ],
};

// 修改预览按钮点击处理
const handlePreviewClick = async () => {
  // 检查各个必填字段并收集缺失信息
  const missingFields = [];

  // 检查标题
  if (!createData.value.title.trim()) {
    missingFields.push('Title');
  }

  // 检查内容
  if (!createData.value.content.trim()) {
    missingFields.push('Content');
  }

  // 检查图片
  if (createData.value.files.length === 0) {
    missingFields.push('At least one image');
  }

  // 检查分类
  if (createData.value.social_filters.length === 0) {
    missingFields.push('At least one category');
  }

  // 如果有缺失字段，显示具体提示
  if (missingFields.length > 0) {
    const missingText = missingFields.join(', ');
    ElMessage({
      message: `Please complete the following required fields: ${missingText}`,
      type: 'warning',
      duration: 4000,
    });
    return;
  }

  // 所有验证通过，发送preview数据到父组件
  try {
    await formRef.value?.validate();

    // 发送preview数据到父组件
    emit('show-preview', {
      title: createData.value.title,
      content: createData.value.content,
      images: createData.value.files,
      tags: createData.value.tags,
      preferences: createData.value.social_filters,
      location: createData.value.location,
      isNFT: createData.value.isNFT,
    });
  } catch (error) {
    // 如果还有其他验证错误，显示通用提示
    ElMessage({
      message: 'Please check and complete all required fields',
      type: 'error',
      duration: 3000,
    });
    console.error('Error', error);
  }
};

// 修改图片上传处理
const handleImageUpload = async (file: UploadFile) => {
  if (!userStore.isLogin()) {
    try {
      await showLoginConfirm();
      router.push({ name: 'login' });
    } catch {
      return;
    }
    return;
  }

  if (createData.value.files.length >= 9) {
    ElMessage({
      message: 'Maximum 9 images allowed',
      type: 'warning',
      duration: 2000,
    });
    return;
  }

  // 然后上传到服务器
  store
    .userPostimage(file)
    .then(() => {
      ElMessage({
        message: 'Image uploaded successfully',
        type: 'success',
        duration: 2000,
      });
      formRef.value?.validateField('files');
    })
    .catch((error) => {
      console.error('Upload error:', error);
      ElMessage({
        message: 'Failed to upload image',
        type: 'error',
        duration: 3000,
      });
    });
};

const removeImage = (index: number) => {
  createData.value.files.splice(index, 1);
  formRef.value?.validateField('files');
};

// 修改：标签处理函数
const handleTagInput = () => {
  const value = tagInput.value.trim();

  // 如果输入为空则返回
  if (!value) return;

  // 检查标签长度（不包括#号）
  if (value.length > 15) {
    ElMessage.warning('Tag length should not exceed 15 characters');
    return;
  }
  // 检查标签数量限制
  if (createData.value.tags.length >= 5) {
    ElMessage.warning('Maximum 5 tags allowed');
    return;
  }
  // 检查标签是否重复（考虑带#和不带#的情况）
  if (!createData.value.tags.some((tag) => tag.slice(1) === value)) {
    createData.value.tags.push(value);
    tagInput.value = ''; // 清空输入
  } else {
    ElMessage.warning('This tag already exists');
  }
};

// 新增：删除标签函数
const removeTag = (index: number) => {
  createData.value.tags.splice(index, 1);
};

// 发布相关函数
const saveDraft = () => {
  console.log('Draft Saved:', createData.value.title);
};

// 修改发布博客处理
async function postTweet() {
  // 首先检查各个必填字段并收集缺失信息
  const missingFields = [];

  // 检查标题
  if (!createData.value.title.trim()) {
    missingFields.push('Title');
  }

  // 检查内容
  if (!createData.value.content.trim()) {
    missingFields.push('Content');
  }

  // 检查图片
  if (createData.value.files.length === 0) {
    missingFields.push('At least one image');
  }

  // 检查分类
  if (createData.value.social_filters.length === 0) {
    missingFields.push('At least one category');
  }

  // 如果有缺失字段，显示具体提示
  if (missingFields.length > 0) {
    const missingText = missingFields.join(', ');
    ElMessage({
      message: `Please complete the following required fields before posting: ${missingText}`,
      type: 'warning',
      duration: 4000,
    });
    return;
  }

  try {
    await formRef.value?.validate();

    ElMessageBox.confirm('Are you sure you want to publish this blog?', 'Confirm Publication', {
      confirmButtonText: 'Publish',
      cancelButtonText: 'Continue Editing',
      type: 'info',
    }).then(() => {
      store
        .userPostblog()
        .then(() => {
          ElMessage.success('Blog posted successfully');
          router.push({ name: 'userpage' });
        })
        .catch((error) => {
          if (error.response?.status === 401) {
            ElMessage.error('Session expired, please login again');
            router.push({ name: 'login' });
          }
          ElMessage.error('Failed to post blog');
        });
    });
  } catch (error) {
    ElMessage({
      message: 'Please check and complete all required fields',
      type: 'error',
      duration: 3000,
    });
    console.error('Error', error);
  }
}

async function editTweet() {
  // 首先检查各个必填字段并收集缺失信息
  const missingFields = [];

  // 检查标题
  if (!createData.value.title.trim()) {
    missingFields.push('Title');
  }

  // 检查内容
  if (!createData.value.content.trim()) {
    missingFields.push('Content');
  }

  // 检查图片
  if (createData.value.files.length === 0) {
    missingFields.push('At least one image');
  }

  // 检查分类
  if (createData.value.social_filters.length === 0) {
    missingFields.push('At least one category');
  }

  // 如果有缺失字段，显示具体提示
  if (missingFields.length > 0) {
    const missingText = missingFields.join(', ');
    ElMessage({
      message: `Please complete the following required fields before editing: ${missingText}`,
      type: 'warning',
      duration: 4000,
    });
    return;
  }

  try {
    await formRef.value?.validate();

    ElMessageBox.confirm('Are you sure you want to edit this blog?', 'Confirm Publication', {
      confirmButtonText: 'Edit',
      cancelButtonText: 'Continue Editing',
      type: 'info',
    }).then(() => {
      store
        .editmyblog()
        .then(() => {
          ElMessage.success('Blog posted successfully');
          router.push({ name: 'userpage' });
        })
        .catch((error) => {
          if (error.response?.status === 401) {
            ElMessage.error('Session expired, please login again');
            router.push({ name: 'login' });
          }
          ElMessage.error('Failed to post blog');
        });
    });
  } catch (error) {
    ElMessage({
      message: 'Please check and complete all required fields',
      type: 'error',
      duration: 3000,
    });
    console.error('Error', error);
  }
}

// 添加计算属性来判断是否可以预览
const canPreview = computed(() => {
  return createData.value.title.trim() !== '' && createData.value.content.trim() !== '' && createData.value.files.length > 0 && createData.value.social_filters.length > 0;
});

// 添加判断是否为移动端视图的计算属性
const isMobileView = ref(window.innerWidth <= 768);

// 滑动相关的响应式数据
const touchStartX = ref(0);
const touchStartY = ref(0);
const touchCurrentX = ref(0);
const isSwipingToClose = ref(false);
const swipeThreshold = 100; // 滑动阈值（像素）

// 拖拽排序相关的响应式数据
const draggedIndex = ref<number | null>(null);
const isDragging = ref(false);
const draggedElement = ref<HTMLElement | null>(null);
const galleryElement = ref<HTMLElement | null>(null);

// 移动端长按拖拽相关数据
const isLongPressing = ref(false);
const longPressTimer = ref<number | null>(null);
const touchStartPos = ref({ x: 0, y: 0 });
const currentTouchPos = ref({ x: 0, y: 0 });
const longPressThreshold = 600; // 长按阈值（毫秒）
const moveThreshold = 10; // 移动阈值（像素）

// 窗口大小变化处理函数
const handleResize = () => {
  isMobileView.value = window.innerWidth <= 768;
};

// 触摸开始事件
const handleTouchStart = (event: TouchEvent) => {
  if (!isMobileView.value) return;

  const touch = event.touches[0];
  touchStartX.value = touch.clientX;
  touchStartY.value = touch.clientY;
  touchCurrentX.value = touch.clientX;
  isSwipingToClose.value = false;
};

// 触摸移动事件
const handleTouchMove = (event: TouchEvent) => {
  if (!isMobileView.value) return;

  const touch = event.touches[0];
  touchCurrentX.value = touch.clientX;

  const deltaX = touch.clientX - touchStartX.value;
  const deltaY = Math.abs(touch.clientY - touchStartY.value);

  // 检查是否是向右滑动且垂直偏移不大
  if (deltaX > 30 && deltaY < 100) {
    isSwipingToClose.value = true;

    // 添加视觉反馈：根据滑动距离调整透明度
    const swipeProgress = Math.min(deltaX / swipeThreshold, 1);
    const postCard = document.querySelector('.post-card') as HTMLElement;
    if (postCard) {
      postCard.style.opacity = `${1 - swipeProgress * 0.3}`;
      postCard.style.transform = `translateX(${deltaX * 0.3}px)`;
    }
  }
};

// 触摸结束事件
const handleTouchEnd = (event: TouchEvent) => {
  if (!isMobileView.value) {
    isSwipingToClose.value = false;
    return;
  }

  const deltaX = touchCurrentX.value - touchStartX.value;
  const deltaY = Math.abs(event.changedTouches[0].clientY - touchStartY.value);

  // 重置视觉效果
  const postCard = document.querySelector('.post-card') as HTMLElement;
  if (postCard) {
    postCard.style.opacity = '1';
    postCard.style.transform = 'translateX(0px)';
  }

  // 检查是否满足退出条件：向右滑动距离大于阈值且垂直偏移小
  if (isSwipingToClose.value && deltaX > swipeThreshold && deltaY < 100) {
    // 显示确认对话框，与桌面端保持一致
    closeDialog();
  }

  isSwipingToClose.value = false;
};

// 触摸取消事件（当触摸被意外中断时）
const handleTouchCancel = () => {
  if (!isMobileView.value) return;

  // 重置视觉效果
  const postCard = document.querySelector('.post-card') as HTMLElement;
  if (postCard) {
    postCard.style.opacity = '1';
    postCard.style.transform = 'translateX(0px)';
  }

  isSwipingToClose.value = false;
};

// 拖拽排序相关函数
const handleDragStart = (event: DragEvent, index: number) => {
  if (createData.value.files.length < 2) return;

  draggedIndex.value = index;
  isDragging.value = true;
  draggedElement.value = event.target as HTMLElement;

  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/html', '');
  }
};

const handleDragEnd = () => {
  isDragging.value = false;
  draggedIndex.value = null;
  draggedElement.value = null;
};

const handleDragOver = (event: DragEvent) => {
  event.preventDefault();
  if (event.dataTransfer) {
    event.dataTransfer.dropEffect = 'move';
  }
};

const handleDrop = (event: DragEvent) => {
  event.preventDefault();

  if (draggedIndex.value === null || !galleryElement.value) {
    return;
  }

  // 获取拖拽容器的边界信息
  const galleryRect = galleryElement.value.getBoundingClientRect();
  const dropX = event.clientX - galleryRect.left;
  const dropY = event.clientY - galleryRect.top;

  // 获取所有图片项的位置信息
  const imageItems = Array.from(galleryElement.value.querySelectorAll('.image-item'));
  let targetIndex = draggedIndex.value;

  // 计算应该插入的位置
  for (let i = 0; i < imageItems.length; i++) {
    if (i === draggedIndex.value) continue;

    const itemRect = (imageItems[i] as HTMLElement).getBoundingClientRect();
    const itemX = itemRect.left - galleryRect.left;
    const itemY = itemRect.top - galleryRect.top;
    const itemCenterX = itemX + itemRect.width / 2;
    const itemCenterY = itemY + itemRect.height / 2;

    // 如果拖拽点在当前项目之前（考虑网格布局）
    if (dropY < itemCenterY || (dropY === itemCenterY && dropX < itemCenterX)) {
      targetIndex = i;
      break;
    }
    // 如果是最后一个元素，放到末尾
    if (i === imageItems.length - 1) {
      targetIndex = imageItems.length;
    }
  }

  // 如果位置没有改变，不进行移动
  if (targetIndex === draggedIndex.value) {
    return;
  }

  // 重新排列图片数组
  const images = [...createData.value.files];
  const draggedImage = images[draggedIndex.value];

  // 移除原位置的图片
  images.splice(draggedIndex.value, 1);

  // 调整目标位置（如果目标位置在原位置之后，需要减1）
  const adjustedTargetIndex = targetIndex > draggedIndex.value ? targetIndex - 1 : targetIndex;

  // 在新位置插入图片
  images.splice(adjustedTargetIndex, 0, draggedImage);

  createData.value.files = images;
};

// 移动端长按拖拽相关函数
const handleTouchStartForDrag = (event: TouchEvent, index: number) => {
  if (!isMobileView.value || createData.value.files.length < 2) return;

  const touch = event.touches[0];
  touchStartPos.value = { x: touch.clientX, y: touch.clientY };
  currentTouchPos.value = { x: touch.clientX, y: touch.clientY };

  // 清除之前的定时器
  if (longPressTimer.value) {
    clearTimeout(longPressTimer.value);
  }

  // 设置长按定时器
  longPressTimer.value = window.setTimeout(() => {
    // 检查是否在阈值范围内（避免滑动时触发）
    const deltaX = Math.abs(currentTouchPos.value.x - touchStartPos.value.x);
    const deltaY = Math.abs(currentTouchPos.value.y - touchStartPos.value.y);

    if (deltaX < moveThreshold && deltaY < moveThreshold) {
      isLongPressing.value = true;
      draggedIndex.value = index;
      isDragging.value = true;

      // 提供触觉反馈（如果支持）
      if (navigator.vibrate) {
        navigator.vibrate(50);
      }

      // 阻止默认行为
      event.preventDefault();
    }
  }, longPressThreshold);
};

const handleTouchMoveForDrag = (event: TouchEvent) => {
  if (!isMobileView.value) return;

  const touch = event.touches[0];
  currentTouchPos.value = { x: touch.clientX, y: touch.clientY };

  // 如果移动距离超过阈值，取消长按
  const deltaX = Math.abs(currentTouchPos.value.x - touchStartPos.value.x);
  const deltaY = Math.abs(currentTouchPos.value.y - touchStartPos.value.y);

  if ((deltaX > moveThreshold || deltaY > moveThreshold) && !isLongPressing.value) {
    if (longPressTimer.value) {
      clearTimeout(longPressTimer.value);
      longPressTimer.value = null;
    }
  }

  // 如果正在拖拽，阻止页面滚动
  if (isLongPressing.value && isDragging.value) {
    event.preventDefault();
  }
};

const handleTouchEndForDrag = (event: TouchEvent) => {
  if (!isMobileView.value) return;

  // 清除长按定时器
  if (longPressTimer.value) {
    clearTimeout(longPressTimer.value);
    longPressTimer.value = null;
  }

  // 如果正在拖拽，执行放置逻辑
  if (isLongPressing.value && isDragging.value && galleryElement.value) {
    const touch = event.changedTouches[0];
    const fakeDropEvent = {
      preventDefault: () => {},
      clientX: touch.clientX,
      clientY: touch.clientY,
    } as DragEvent;

    handleDrop(fakeDropEvent);
  }

  // 重置所有状态
  isLongPressing.value = false;
  isDragging.value = false;
  draggedIndex.value = null;
};

onMounted(async () => {
  await store.getSocialFilter();
  store.postReset(props.id);
  // 添加窗口大小变化监听
  window.addEventListener('resize', handleResize);
});

onUnmounted(() => {
  // 移除窗口大小变化监听
  window.removeEventListener('resize', handleResize);
});
</script>

<template>
  <!-- 内容卡片 - 直接作为组件内容 -->
  <el-card class="post-card" @touchstart="handleTouchStart" @touchmove="handleTouchMove" @touchend="handleTouchEnd" @touchcancel="handleTouchCancel">
    <!-- 添加新的关闭按钮到卡片头部 - 只在桌面端显示 -->
    <div v-if="!isMobileView" class="card-close-btn" @click="closeDialog()">
      <el-icon><Close /></el-icon>
    </div>

    <template #header>
      <div class="post-card-header">
        <div class="post-title">Post Your Blog</div>
        <el-button type="primary" @click="handlePreviewClick" :disabled="!canPreview" class="preview-btn"> Preview </el-button>
      </div>
    </template>

    <!-- 博客创建表单 -->
    <el-form :model="createData" label-position="top" :rules="rules" ref="formRef">
      <!-- 标题输入 -->
      <el-form-item label="Title" prop="title">
        <el-input
          v-model="createData.title"
          type="textarea"
          :autosize="{ minRows: 1, maxRows: 2 }"
          placeholder="Enter a catchy title"
          maxlength="50"
          show-word-limit
          :rows="isMobileView ? 1 : 2"
        ></el-input>
      </el-form-item>

      <!-- 社交筛选器 -->
      <el-form-item label="Categories" prop="social_filters">
        <div class="filter-tags">
          <el-tag
            v-for="option in socialFilters"
            :key="option.id"
            :class="{ 'active-tag': createData.social_filters.includes(option.id) }"
            @click="togglePreference(option.id)"
            effect="plain"
            class="filter-tag"
          >
            <span class="filter-icon">{{ option.icon }}</span>
            <span>{{ option.name }}</span>
          </el-tag>
        </div>
      </el-form-item>

      <!-- 内容输入 -->
      <el-form-item label="Content" prop="content">
        <el-input
          v-model="createData.content"
          type="textarea"
          :autosize="{ minRows: isMobileView ? 3 : 4, maxRows: isMobileView ? 5 : 8 }"
          placeholder="What's happening? Share your experience..."
        ></el-input>
      </el-form-item>

      <!-- 图片上传 -->
      <el-form-item label="Photos" prop="files">
        <div class="upload-section">
          <el-upload class="image-uploader" :show-file-list="false" :on-change="handleImageUpload" :auto-upload="false" :multiple="true" accept="image/*">
            <el-button type="primary" size="large">
              <el-icon><Plus /></el-icon>
              Select Images
            </el-button>
          </el-upload>
          <span class="upload-hint" v-if="!createData.files.length">Upload up to 9 images, double click to delete</span>
        </div>

        <!-- 图片展示区域 -->
        <div class="images-gallery" v-if="createData.files.length" ref="galleryElement" @dragover="handleDragOver" @drop="handleDrop">
          <div
            v-for="(image, index) in createData.files"
            :key="index"
            class="image-item"
            :class="{ 'long-pressing': isLongPressing && draggedIndex === index }"
            :draggable="!isMobileView && createData.files.length >= 2"
            @dragstart="!isMobileView && handleDragStart($event, index)"
            @dragend="!isMobileView && handleDragEnd"
            @touchstart="handleTouchStartForDrag($event, index)"
            @touchmove="handleTouchMoveForDrag"
            @touchend="handleTouchEndForDrag"
          >
            <img :src="getImageUrl(image)" :alt="`Image ${index + 1}`" />
            <div class="image-overlay">
              <button class="delete-btn" @click.stop="removeImage(index)" title="Remove image">
                <el-icon><Delete /></el-icon>
              </button>
            </div>
          </div>
          <div class="images-counter">
            {{ createData.files.length }}/9 images
            <span v-if="createData.files.length >= 2 && !isMobileView" class="drag-hint">• Drag to reorder</span>
            <span v-if="createData.files.length >= 2 && isMobileView" class="drag-hint">• Long press to reorder</span>
          </div>
        </div>
      </el-form-item>

      <!-- 标签输入 -->
      <el-form-item prop="tags" label="Tags">
        <!-- 标签输入区域 -->
        <div class="tag-input-wrapper">
          <el-input
            type="textarea"
            v-model="tagInput"
            :autosize="{ minRows: 1, maxRows: 1 }"
            placeholder="Type tag and press Enter"
            @keydown.prevent.stop.enter="handleTagInput"
            maxlength="15"
          ></el-input>
        </div>

        <!-- 标签显示区域 -->
        <div class="tags-display">
          <div v-if="createData.tags.length === 0" class="no-tags-hint">No tags added yet</div>
          <div v-else class="tags-list">
            <el-tag v-for="(tag, index) in createData.tags" :key="index" closable @close="removeTag(index)" effect="plain" class="post-tag"> #{{ tag }} </el-tag>
            <span class="tag-counter">{{ createData.tags.length }}/5</span>
          </div>
        </div>
      </el-form-item>

      <!-- 选择目的地 -->
      <el-form-item label="Destination">
        <el-select v-model="createData.location" multiple filterable placeholder="Select destinations" @change="handleDestinationsChange" style="max-width: 500px; width: 100%">
          <el-option v-for="dest in destinations" :key="dest.value" :label="dest.label" :value="dest.value" />
        </el-select>
      </el-form-item>

      <!-- 评论权限 -->
      <el-form-item label="Who can reply?">
        <el-radio-group v-model="createData.comment_permission">
          <el-radio v-for="option in commentPermission" :key="option.id" :label="option.id"> {{ option.name }} can reply </el-radio>
        </el-radio-group>
      </el-form-item>

      <!-- NFT 选项 -->
      <!-- <el-form-item>
        <el-checkbox v-model="createData.isNFT">
          <div class="nft-option">
            <span class="nft-icon">🖼️</span>
            Make your NFT
          </div>
        </el-checkbox>
      </el-form-item> -->

      <!-- 操作按钮 -->
      <el-form-item>
        <div class="action-buttons">
          <el-button @click="saveDraft" plain>Save Draft</el-button>
          <el-button v-if="id" @click="editTweet" type="primary">Edit</el-button>
          <el-button v-else @click="postTweet" type="primary">Post</el-button>
        </div>
      </el-form-item>
    </el-form>
  </el-card>
</template>
