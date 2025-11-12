<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { useUserStore } from '@/stores/user';
import { useBlogStore } from '@/stores/blog';
import { useRouter } from 'vue-router';
import { getImageUrl } from '@/utils';
import { ElMessage, ElMessageBox } from 'element-plus';
import type { IBlog } from '@/types/blog';

const store = useUserStore();
const blogStore = useBlogStore();
const router = useRouter();

// 组件挂载时加载博客列表
onMounted(() => {
  store.getUserBlogList(true);
});

// 用户博客数据
const userPosts = computed(() => store.blogs);

// 搜索功能相关
const searchKeyword = ref('');
const isEditMode = ref(false);

// 切换编辑模式
const toggleEditMode = () => {
  isEditMode.value = !isEditMode.value;
};

// 搜索功能处理
const handleSearch = () => {
  const keyword = searchKeyword.value.toLowerCase().trim();
  if (!keyword) {
    return;
  }
  console.log('搜索关键词:', keyword);
};

// 删除博客
const deleteBlog = async (blogId?: number) => {
  if (!blogId) return;
  try {
    await ElMessageBox.confirm('Are you sure you want to delete this blog post?', 'Warning', {
      confirmButtonText: 'Delete',
      cancelButtonText: 'Cancel',
      type: 'warning',
    });

    await store.delUserBlogByID(blogId);
    ElMessage.success('Blog deleted successfully');
    store.getUserBlogList(true);
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('Failed to delete blog');
    }
  }
};

// 编辑博客
function gotoEidtPage(id?: number) {
  if (!id) return;
  router.push({
    name: 'PostView',
    params: { id },
  });
}

// 显示博客详情
const showBlogDetail = (id?: number) => {
  if (!id) return;
  store.getUserBlogByID(id);
  document.body.style.overflow = 'hidden';
};

// 收藏状态管理
const collectionStatusMap = ref<Map<number, boolean>>(new Map());

// 检查收藏状态
const checkCollectionStatus = async (blogId: number) => {
  if (!blogId || !store.isLogin()) {
    collectionStatusMap.value.set(blogId, false);
    return;
  }

  try {
    const response = await blogStore.checkUserLike(blogId);
    collectionStatusMap.value.set(blogId, response.is_collected);
  } catch (error) {
    console.error('Failed to check collection status:', error);
    collectionStatusMap.value.set(blogId, false);
  }
};

// 获取博客的收藏状态
const isCollected = (blogId: number | undefined): boolean => {
  if (!blogId) return false;
  return collectionStatusMap.value.get(blogId) || false;
};

// 监听博客列表变化，检查收藏状态
watch(
  () => userPosts.value.items,
  (newItems) => {
    if (newItems && newItems.length > 0 && store.isLogin()) {
      for (const blog of newItems) {
        if (blog.id && !collectionStatusMap.value.has(blog.id)) {
          checkCollectionStatus(blog.id);
        }
      }
    }
  },
  { immediate: true, deep: true },
);

// 滚动处理
const postsContainer = ref<HTMLElement | null>(null);
function handleScroll() {
  const container = postsContainer.value;
  if (!container) return;
  if (container.scrollTop + container.clientHeight >= container.scrollHeight - 100) {
    // loadPosts();
  }
}
</script>

<template>
  <section class="blog-area" ref="postsContainer" @scroll="handleScroll">
    <!-- 博客区域顶部操作栏 -->
    <div class="blog-area-header">
      <!-- 搜索框 -->
      <input class="blog-search-input" type="text" placeholder="Search your blog" v-model="searchKeyword" @input="handleSearch" />
      <!-- 编辑按钮 -->
      <el-button class="edit-mode-btn" :type="isEditMode ? 'primary' : 'default'" @click="toggleEditMode">
        {{ isEditMode ? 'Done' : 'EDIT BLOG' }}
      </el-button>
    </div>

    <div class="blog-posts">
      <div
        v-for="post in userPosts.items"
        :key="post.id"
        class="blog-post"
        :class="{
          'nft-post': post.isNFT,
          'edit-mode': isEditMode,
        }"
        @click="isEditMode ? null : showBlogDetail(post.id)"
      >
        <!-- 编辑模式下的操作按钮 -->
        <div v-if="isEditMode" class="blog-action-buttons">
          <el-button type="danger" class="delete-blog-btn" @click.prevent.stop="deleteBlog(post.id)"> Delete </el-button>
          <el-button type="primary" class="edit-blog-btn" @click.prevent.stop="gotoEidtPage(post.id)"> Edit </el-button>
        </div>

        <!-- 使用 el-carousel 代替单张图片显示 -->
        <el-carousel v-if="post.files && post.files.length > 0" :interval="3000" arrow="hover" height="200px" class="post-carousel" :touchable="true" :loop="true" :autoplay="false">
          <el-carousel-item v-for="(img, index) in post.files" :key="index">
            <img :src="getImageUrl(img)" alt="Blog Image" class="post-image" />
          </el-carousel-item>
        </el-carousel>

        <!-- 博客内容 -->
        <div class="post-content-userpage">
          <h2 class="post-title-userpage">{{ post.title }}</h2>
          <p class="post-text-userpage">{{ post.content }}</p>
        </div>

        <!-- 博客底部信息 -->
        <div class="post-footer-userpage">
          <!-- 作者信息 -->
          <div class="author-info">
            <img v-if="post.user?.avatar" :src="getImageUrl(post.user.avatar)" alt="Avatar" class="post-avatar" />
            <span class="author-name">{{ post.user?.name }}</span>
          </div>

          <!-- 统计信息 -->
          <div class="post-stats">
            <span class="collect" :class="{ collected: isCollected(post.id) }">
              <span class="star-icon">{{ isCollected(post.id) ? '⭐' : '☆' }}</span>
              <span class="collect-text">{{ isCollected(post.id) ? 'collected' : 'collect' }}</span>
            </span>
            <span class="comments">💬 {{ post.comments_count }}</span>
            <span class="coins" v-if="post.isNFT">₿ {{ post.coins }}</span>
          </div>
        </div>
      </div>
    </div>
    <!-- 底部加载提示 -->
    <div v-if="userPosts.loading" class="loading">Loading more posts...</div>
    <div v-if="!userPosts.has_next" class="no-more">No more posts</div>
  </section>
</template>

