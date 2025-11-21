<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, watch } from 'vue';
import { getPaperViewHistory } from '@/services/user';
import type { GetPaperViewHistoryParams } from '@/services/user/type';
import { ElMessage } from 'element-plus';
import { Loading } from '@element-plus/icons-vue';
import { getImageUrl } from '@/utils';
import { useConferenceStore } from '@/stores/conference'
import type { IConferenceEvent } from '@/types/conference';
interface PaperViewHistory {
  id: number;
  user_id: number;
  paper_id: number;
  view_duration: number | null;
  view_type: string;
  view_source: string | null;
  referrer_url: string | null;
  session_id: string | null;
  created_at: string;
  updated_at: string;
  paper: {
    id: number;
    title: string;
    abstract: string;
    venue: string;
    year: number;
    authors: Array<{ id: number; name: string; order: number; is_corresponding: boolean; affiliations: unknown[] }>;
    graphic_abstract?: string[];
    conference?: {
      id: number;
      name: string;
      abbreviation: string;
      logo: string;
      [key: string]: unknown;
    } | null;
    [key: string]: unknown;
  };
}

// 数据
const histories = ref<PaperViewHistory[]>([]);
const loading = ref(false);
const loadingMore = ref(false); // 移动端加载更多状态
const isMobile = ref(false); // 是否为移动端
const hasMore = ref(true); // 是否还有更多数据

// 防抖定时器
let scrollTimer: ReturnType<typeof setTimeout> | null = null;

// 分页
const pagination = ref({
  page: 1,
  per_page: 20,
  total: 0,
  pages: 0,
});

// 移动端分页配置
const mobilePagination = ref({
  page: 1,
  per_page: 8,
});

// 检测是否为移动端
const checkIsMobile = () => {
  const wasMobile = isMobile.value;
  isMobile.value = window.innerWidth <= 768;

  // 如果从PC端切换到移动端，需要重新加载数据
  if (!wasMobile && isMobile.value) {
    loadMobileHistories();
    window.addEventListener('scroll', handleScroll);
  }
  // 如果从移动端切换到PC端，需要重新加载数据并移除滚动监听
  else if (wasMobile && !isMobile.value) {
    window.removeEventListener('scroll', handleScroll);
    // 清理防抖定时器
    if (scrollTimer) {
      clearTimeout(scrollTimer);
      scrollTimer = null;
    }
    loadHistories();
  }
};

// 加载数据（PC端使用，替换数据）
const loadHistories = async (params?: GetPaperViewHistoryParams) => {
  loading.value = true;
  try {
    const response = await getPaperViewHistory(params);
    console.log(`res`, response);
    if (response.data) {
      histories.value = response.data.histories || [];
      pagination.value = {
        page: response.data.page || 1,
        per_page: response.data.per_page || 20,
        total: response.data.total || 0,
        pages: response.data.pages || 0,
      };
    }
  } catch (error) {
    console.error('load paper view history failed:', error);
    ElMessage.error('load data failed, please try again later');
  } finally {
    loading.value = false;
  }
};

// 移动端加载更多数据（追加数据）
const loadMoreHistories = async () => {
  if (loadingMore.value || !hasMore.value) return;

  // 清除防抖定时器，避免重复触发
  if (scrollTimer) {
    clearTimeout(scrollTimer);
    scrollTimer = null;
  }

  // 再次检查是否真的在底部
  const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
  const windowHeight = window.innerHeight;
  const documentHeight = document.documentElement.scrollHeight;
  const isAtBottom = scrollTop + windowHeight >= documentHeight - 50;

  // 如果不在底部，不加载
  if (!isAtBottom) {
    return;
  }

  loadingMore.value = true;
  try {
    const response = await getPaperViewHistory({
      page: mobilePagination.value.page,
      per_page: mobilePagination.value.per_page,
    });

    if (response.data) {
      const newHistories = response.data.histories || [];
      if (newHistories.length > 0) {
        histories.value = [...histories.value, ...newHistories];
        mobilePagination.value.page += 1;

        // 判断是否还有更多数据
        const totalLoaded = histories.value.length;
        hasMore.value = totalLoaded < (response.data.total || 0);

        // 加载完成后，向上滚动80px，避免立即再次触发加载
        setTimeout(() => {
          const currentScrollTop = window.pageYOffset || document.documentElement.scrollTop;
          const newScrollTop = Math.max(0, currentScrollTop - 80);
          window.scrollTo({
            top: newScrollTop,
            behavior: 'smooth',
          });
        }, 100);
      } else {
        hasMore.value = false;
      }
    }
  } catch (error) {
    console.error('load more histories failed:', error);
    ElMessage.error('load more histories failed, please try again later');
  } finally {
    loadingMore.value = false;
  }
};

// 移动端初始加载
const loadMobileHistories = async () => {
  loading.value = true;
  mobilePagination.value.page = 1;
  hasMore.value = true;
  try {
    const response = await getPaperViewHistory({
      page: 1,
      per_page: mobilePagination.value.per_page,
    });

    if (response.data) {
      histories.value = response.data.histories || [];
      mobilePagination.value.page = 2;

      // 判断是否还有更多数据
      const totalLoaded = histories.value.length;
      hasMore.value = totalLoaded < (response.data.total || 0);
    }
  } catch (error) {
    console.error('load paper view history failed:', error);
    ElMessage.error('load data failed, please try again later');
  } finally {
    loading.value = false;
  }
};

// 处理分页变化（PC端）
const handlePageChange = (page: number) => {
  pagination.value.page = page;
  loadHistories({
    page,
    per_page: pagination.value.per_page,
  });
};

// 处理每页数量变化（PC端）
const handleSizeChange = (size: number) => {
  pagination.value.per_page = size;
  pagination.value.page = 1;
  loadHistories({
    page: 1,
    per_page: size,
  });
};

// 滚动监听（移动端）- 滚动到底部时自动加载，带防抖
const handleScroll = () => {
  // 清除之前的定时器
  if (scrollTimer) {
    clearTimeout(scrollTimer);
  }

  // 设置防抖，500ms后执行
  scrollTimer = setTimeout(() => {
    // 再次检查条件，确保在防抖期间状态没有改变
    if (!isMobile.value || loadingMore.value || !hasMore.value) {
      return;
    }

    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const windowHeight = window.innerHeight;
    const documentHeight = document.documentElement.scrollHeight;

    // 严格检查是否真的滚动到底部（距离底部50px以内）
    const isAtBottom = scrollTop + windowHeight >= documentHeight - 50;

    // 只有当真正在底部时才加载更多
    if (isAtBottom) {
      loadMoreHistories();
    }
  }, 500);
};
//会议类型
const conferenceType = computed(() => {
  return store.conferenceList.map((item: IConferenceEvent) => {
    return {
      conference_type: item.conference_type,
      id: item.id
    }
  })
})
const filterTitle = ref();
watch(filterTitle, (newValue) => {
  if (newValue !== 'All') {
    loadHistories({
      'conference_type': newValue,
    })
  }
},{
  immediate: true,
})
const store = useConferenceStore();
// 组件挂载时加载数据
onMounted(() => {
  checkIsMobile();
  window.addEventListener('resize', checkIsMobile);
  store.getConferencesList()
  if (isMobile.value) {
    loadMobileHistories();
    window.addEventListener('scroll', handleScroll);
  } else {
    loadHistories();
  }
});

// 组件卸载时清理
onUnmounted(() => {
  window.removeEventListener('resize', checkIsMobile);
  window.removeEventListener('scroll', handleScroll);
  // 清理防抖定时器
  if (scrollTimer) {
    clearTimeout(scrollTimer);
    scrollTimer = null;
  }
});

// 格式化作者显示
const formatAuthors = (authors: Array<{ name: string }>) => {
  if (!authors || authors.length === 0) return '';
  if (authors.length === 1) return authors[0].name;
  if (authors.length <= 3) {
    return authors.map((a) => a.name).join(', ');
  }
  return `${authors[0].name} et al.`;
};

// 格式化查看时长（view_duration 现在是时间戳，计算与当前时间的差值）
const formatViewDuration = (viewTimestamp: number | null) => {
  if (!viewTimestamp) return '0 hours ago';

  const now = Math.floor(Date.now() / 1000); // 当前时间戳（秒）
  const diffSeconds = now - viewTimestamp;
  const diffHours = Math.floor(diffSeconds / 3600);

  if (diffHours < 1) {
    return '1 hour ago';
  }

  return `${diffHours} hours ago`;
};
</script>

<template>
  <div class="presentations-area">
    <div class="presentations-header">
      <h2>View History</h2>
      <el-select v-model="filterTitle" placeholder="Filter by Events" style="width: 300px; margin-left: 20px">
        <el-option label="All" value="All" />
        <el-option v-for="title in conferenceType" :key="title.id" :label="title.conference_type"
          :value="title.conference_type" />
      </el-select>
    </div>

    <div class="table-wrapper" :class="{ 'mobile-table': isMobile }">
      <el-table :data="histories" style="width: 100%" stripe v-loading="loading">
        <el-table-column :width="isMobile ? 40 : 120" align="center">
          <template #default="{ row }">
            <div class="thumbnail-cell">
              <img
                :src="row.paper?.conference?.logo ? getImageUrl(row.paper.conference.logo) : 'https://via.placeholder.com/50x50/627180/ffffff?text=Paper'"
                :alt="row.paper?.conference?.abbreviation || row.paper.title" class="thumbnail-img" />
            </div>
          </template>
        </el-table-column>

        <el-table-column label="Title" :min-width="isMobile ? 90 : 300" align="center" >

          <template #default="{ row }">
            <router-link :to="{name:'PaperDetail',params:{paperId:row.paper.id}}" class="title-cell">{{ row.paper.title }}</router-link>
          </template>
        </el-table-column>

        <el-table-column label="Duration" :width="isMobile ? 80 : 150" align="center">
          <template #default="{ row }">
            <div class="duration-cell">{{ formatViewDuration(row.view_duration) }}</div>
          </template>
        </el-table-column>

        <el-table-column label="Authors" :min-width="isMobile ? 70 : 200" align="center">
          <template #default="{ row }">
            <div class="authors-cell">{{ formatAuthors(row.paper.authors) }}</div>
          </template>
        </el-table-column>

        <el-table-column label="Venue" :width="isMobile ? 80 : 150" align="center">
          <template #default="{ row }">
            <div class="venue-cell">{{ row.paper.venue }} {{ row.paper.year }}</div>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- PC端分页组件 -->
    <div class="pagination-container" v-if="!isMobile && pagination.total > 0">
      <el-pagination v-model:current-page="pagination.page" v-model:page-size="pagination.per_page"
        :page-sizes="[10, 20, 50, 100]" :total="pagination.total" layout="total, sizes, prev, pager, next, jumper"
        @current-change="handlePageChange" @size-change="handleSizeChange" />
    </div>

    <!-- 移动端加载更多提示 -->
    <div class="mobile-load-more" v-if="isMobile">
      <div v-if="loadingMore" class="loading-more-text">
        <el-icon class="is-loading">
          <Loading />
        </el-icon>
        <span>Loading...</span>
      </div>
      <div v-else-if="!hasMore && histories.length > 0" class="no-more-text">All data loaded</div>
    </div>
  </div>
</template>

<style scoped>
.presentations-area {
  padding: 20px;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.presentations-header {
  margin-bottom: 24px;
  display: flex;
  justify-content: space-between;
}

.presentations-header h2 {
  font-size: 24px;
  font-weight: 600;
  color: #1a3566;
  margin: 0;
}

/* 缩略图单元格 */
.thumbnail-cell {
  display: flex;
  justify-content: center;
  align-items: center;
}

.thumbnail-img {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid #e0e4e8;
}

/* 标题单元格 */
.title-cell {
  display: inline-block;
  text-align: left;
  font-size: 18px;
  font-weight: 700;
  color: #1a3566;
  line-height: 1.3;
  text-decoration: none;
}

/* 时间单元格 */
.time-cell {
  font-size: 13px;
  color: #9ca3af;
}

/* 时长单元格 */
.duration-cell {
  font-size: 13px;
  color: #9ca3af;
}

/* 作者单元格 */
.authors-cell {
  font-size: 15px;
  font-weight: 600;
  color: #1a3566;
}

/* 会议单元格 */
.venue-cell {
  font-size: 15px;
  font-weight: 600;
  color: #1a3566;
}

/* 表格容器 */
.table-wrapper {
  width: 100%;
  overflow-x: visible;
}

.table-wrapper.mobile-table {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

.table-wrapper.mobile-table::-webkit-scrollbar {
  height: 4px;
}

.table-wrapper.mobile-table::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 2px;
}

.table-wrapper.mobile-table::-webkit-scrollbar-thumb {
  background: #1a3566;
  border-radius: 2px;
}

/* 表格样式覆盖 */
:deep(.el-table) {
  border-radius: 8px;
  overflow: hidden;
  min-width: 100%;
}

:deep(.el-table th) {
  background-color: #f8f9fa;
  color: #1a3566;
  font-weight: 600;
  font-size: 26px;
}

:deep(.el-table td) {
  padding: 12px 0;
}

:deep(.el-table--striped .el-table__body tr.el-table__row--striped td) {
  background-color: #fafbfc;
}

/* 分页容器 */
.pagination-container {
  margin-top: 24px;
  display: flex;
  justify-content: flex-end;
}

/* 移动端加载更多提示 */
.mobile-load-more {
  margin-top: 20px;
  padding: 16px 0;
  text-align: center;
}

.loading-more-text {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: #1a3566;
  font-size: 14px;
}

.loading-more-text .el-icon {
  font-size: 16px;
}

.no-more-text {
  color: #9ca3af;
  font-size: 14px;
}

:deep(.el-pagination) {
  color: #1a3566;
}

:deep(.el-pagination .el-pager li) {
  color: #1a3566;
}

:deep(.el-pagination .el-pager li.is-active) {
  color: #fff;
  background-color: #1a3566;
}

:deep(.el-pagination button) {
  color: #1a3566;
}

:deep(.el-pagination .el-select .el-input__inner) {
  color: #1a3566;
}

/* 移动端响应式样式 */
@media (max-width: 768px) {
  .presentations-area {
    padding: 10px;
  }

  .presentations-header h2 {
    font-size: 20px;
  }

  /* 表格容器在移动端 */
  .table-wrapper.mobile-table {
    overflow-x: visible;
    width: 100%;
  }

  /* 表格在移动端优化 */
  :deep(.el-table) {
    font-size: 11px;
    width: 100% !important;
  }

  :deep(.el-table th),
  :deep(.el-table td) {
    padding: 8px 4px;
  }

  :deep(.el-table th) {

    padding: 6px 4px;
    white-space: nowrap;
    font-size: 12px;
  }

  /* 标题列和作者列在移动端允许换行 */
  :deep(.el-table td:nth-child(2)),
  :deep(.el-table td:nth-child(4)) {
    white-space: normal;
  }

  /* 标题单元格在移动端调整 */
  .title-cell {
    font-size: 11px;
    line-height: 1.3;
    word-break: break-word;
    overflow: hidden;
    text-overflow: ellipsis;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
  }

  /* 时长单元格在移动端 */
  .duration-cell {
    font-size: 10px;
    white-space: nowrap;
  }

  /* 作者单元格在移动端调整 */
  .authors-cell {
    font-size: 10px;
    white-space: normal;
    word-break: break-word;
    overflow: hidden;
    text-overflow: ellipsis;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
  }

  /* 会议单元格在移动端调整 */
  .venue-cell {
    font-size: 10px;
    white-space: nowrap;
  }

  /* 缩略图在移动端缩小 */
  .thumbnail-img {
    width: 30px;
    height: 30px;
  }

  /* 分页在移动端居中 */
  .pagination-container {
    justify-content: center;
    margin-top: 16px;
  }

  /* 分页组件在移动端优化 */
  :deep(.el-pagination) {
    font-size: 12px;
  }

  :deep(.el-pagination .el-pager li) {
    min-width: 28px;
    height: 28px;
    line-height: 28px;
    font-size: 12px;
  }

  :deep(.el-pagination button) {
    width: 28px;
    height: 28px;
  }
}
</style>