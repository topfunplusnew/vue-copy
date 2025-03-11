<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import { getImageUrl } from '@/utils';
import { formatDate } from '@/utils/date';
import { useBlogStore } from '@/stores/blog';
import commonHeader from '@/layout/common-header.vue';

const msg = 'Our Latest Blog';
const store = useBlogStore();
const selectedosPost = computed(()=> store.blog); // 添加选中的博客状态
const dialogVisible = ref(false); // 控制弹窗显示


const blogs = computed(() => store.blogos);


const showOsBlogDetail = async (id: number) => {
  store.getBlogByID(id).then(() =>{
    dialogVisible.value = true;
  }).catch(e => {
    console.log(e)
    ElMessage.error(e)
  })
};



// 加载更多博客
const loadMorePosts = async () => {
  store.getBlogosList();
};

// 截断文本
const truncateText = (text:string, maxLength:number) => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

// 在组件挂载时初始化数据
onMounted(() => {
  // 从API获取官方博客列表
  store.getBlogosList(true);
});


</script>

<template>
  <div class="background-layer"></div>
  <div class="home">
    <!-- Header -->
    <common-header />

    <div class="blogos-header-title">{{ msg }}</div>

    <!-- 改进的Blog Content部分 -->
    <div class="blogos-page-container">
      <!-- 加载中显示 -->
      <div v-if="!blogs" class="blogos-loading-blogs">
        <div class="blogos-loading-spinner"></div>
        <p>Loading blogs...</p>
      </div>

      <!-- 响应式博客网格 -->
      <div class="blogos-grid" v-else>
        <div
          v-for="post in blogs.items"
          :key="post.id"
          class="blogos-card"
          @click="showOsBlogDetail(post.id)"
        >
          <div class="blogos-card-image" :style="{ backgroundImage: `url(${getImageUrl(post.image[0])})` }">
            <div class="blogos-card-overlay">
              <div class="blogos-categories">
                <span v-for="(tag, index) in post.tags" :key="index"
                class="blogos-category-badge">
                  {{ tag }}
                </span>
              </div>
            </div>
          </div>
          <div class="blogos-card-content">
            <div class="blogos-card-meta">
              <span class="reading-time"><i class="el-icon-time"></i> {{ Math.ceil(post.content.length / 1000) }} min read</span>
              <span class="blogos-date">{{ formatDate(post.created_at) }}</span>
            </div>
            <div class="blog-card-title">{{ post.title }}</div>
            <div class="blog-card-excerpt">{{ truncateText(post.content, 120) }}</div>
            <div class="blogos-card-footer">
              <div class="blogos-author-info">
                <span class="blogos-author-name">{{ post.user?.name || 'Anonymous' }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 加载更多按钮 -->
      <div class="blogos-load-more-container" v-if="blogs.has_next">
        <button class="blogos-load-more-button" @click="loadMorePosts" :disabled="blogs.loading">
          {{ blogs.loading ? 'Loading...' : 'Load More' }}
        </button>
      </div>

      <!-- 无结果提示 -->
      <div class="blogos-no-results" v-if="blogs.total === 0">
        <h3>No posts found</h3>
        <p>Try adjusting your search or filters.</p>
      </div>
    </div>

    <!-- Blog Detail Dialog -->
    <el-dialog
      v-model="dialogVisible"
      :title="selectedosPost?.title"
      custom-class="blogos-detail-dialog"
      :close-on-click-modal="true"
      :show-close="true"
      width="90%"
      top="5vh"
      destroy-on-close
    >
      <div class="blogos-detail-container">
        <!-- 博客详情头部 -->
        <div class="blogos-detail-header">
          <div class="blogos-author-container">
            <div class="blogos-author-info">
              <h4 class="blogos-author-name">{{ selectedosPost?.user?.name || 'Anonymous' }}</h4>
              <div class="blogos-publish-date">
                {{ formatDate(selectedosPost?.created_at) }}
              </div>
            </div>
          </div>
          <div class="blogos-categories-container">
            <span v-for="(tag, index) in selectedosPost?.tags" :key="index"
            class="blogos-detail-category">
              {{ tag }}
            </span>
          </div>
        </div>

        <!-- 博客详情内容区 -->
        <div class="blogos-detail-content">
          <!-- 博客轮播图 -->
          <div class="blogos-image-carousel" v-if="selectedosPost?.image && selectedosPost.image.length > 0">
            <el-carousel :interval="4000" type="card" height="400px">
              <el-carousel-item v-for="(image, index) in selectedosPost.image" :key="index">
                <img :src="getImageUrl(image)" :alt="`Blog image ${index + 1}`" class="carousel-image" />
              </el-carousel-item>
            </el-carousel>
          </div>

          <!-- 或者显示单张特色图片 -->
          <div class="blogos-featured-image" v-else-if="selectedosPost?.image && selectedosPost.image[0]">
            <img :src="selectedosPost.image[0]" :alt="selectedosPost.title" class="blogos-featured-image" />
          </div>

          <!-- 博客正文 -->
          <div class="blogos-text-content">
            <p>{{ selectedosPost?.content }}</p>
          </div>

          <!-- 标签区域 -->
          <div class="blogos-tags-container" v-if="selectedosPost?.tags && selectedosPost.tags.length > 0">
            <h4>Tags:</h4>
            <div class="blogos-tag-list">
              <span v-for="(tag, index) in selectedosPost.tags" :key="index" class="blogos-tag">
                #{{ tag }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </el-dialog>
  </div>
</template>


