<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { getPaperViewHistory } from '@/services/user';
import type { GetPaperViewHistoryParams } from '@/services/user/type';
import { ElMessage } from 'element-plus';
import { getImageUrl } from '@/utils';

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

// 分页
const pagination = ref({
  page: 1,
  per_page: 20,
  total: 0,
  pages: 0,
});

// 加载数据
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
    console.error('加载论文查看历史失败:', error);
    ElMessage.error('加载数据失败，请稍后重试');
  } finally {
    loading.value = false;
  }
};

// 处理分页变化
const handlePageChange = (page: number) => {
  pagination.value.page = page;
  loadHistories({
    page,
    per_page: pagination.value.per_page,
  });
};

// 处理每页数量变化
const handleSizeChange = (size: number) => {
  pagination.value.per_page = size;
  pagination.value.page = 1;
  loadHistories({
    page: 1,
    per_page: size,
  });
};

// 组件挂载时加载数据
onMounted(() => {
  loadHistories();
});

// 格式化时间显示（如 "8 minutes ago"）
const formatTimeAgo = (dateString: string) => {
  const now = new Date();
  const viewDate = new Date(dateString);
  const diffMs = now.getTime() - viewDate.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;

  // 超过7天显示具体日期
  return viewDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: viewDate.getFullYear() !== now.getFullYear() ? 'numeric' : undefined });
};

// 格式化作者显示
const formatAuthors = (authors: Array<{ name: string }>) => {
  if (!authors || authors.length === 0) return '';
  if (authors.length === 1) return authors[0].name;
  if (authors.length <= 3) {
    return authors.map((a) => a.name).join(', ');
  }
  return `${authors[0].name} et al.`;
};
</script>

<template>
  <div class="presentations-area">
    <div class="presentations-header">
      <h2>Paper View History</h2>
    </div>

    <el-table :data="histories" style="width: 100%" stripe v-loading="loading">
      <el-table-column label="Thumbnail" width="120" align="center">
        <template #default="{ row }">
          <div class="thumbnail-cell">
            <img :src="getImageUrl(row.paper?.conference?.logo)" :alt="row.paper?.conference?.abbreviation || row.paper.title" class="thumbnail-img" />
          </div>
        </template>
      </el-table-column>

      <el-table-column label="Title" min-width="300">
        <template #default="{ row }">
          <div class="title-cell">{{ row.paper.title }}</div>
        </template>
      </el-table-column>

      <el-table-column label="Time" width="150">
        <template #default="{ row }">
          <div class="time-cell">{{ formatTimeAgo(row.created_at) }}</div>
        </template>
      </el-table-column>

      <el-table-column label="Duration" width="100" align="center">
        <template #default="{ row }">
          <div class="duration-cell">{{ row.view_duration || 0 }}</div>
        </template>
      </el-table-column>

      <el-table-column label="Authors" min-width="200">
        <template #default="{ row }">
          <div class="authors-cell">{{ formatAuthors(row.paper.authors) }}</div>
        </template>
      </el-table-column>

      <el-table-column label="Venue" width="150">
        <template #default="{ row }">
          <div class="venue-cell">{{ row.paper.venue }} {{ row.paper.year }}</div>
        </template>
      </el-table-column>
    </el-table>

    <!-- 分页组件 -->
    <div class="pagination-container" v-if="pagination.total > 0">
      <el-pagination
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.per_page"
        :page-sizes="[10, 20, 50, 100]"
        :total="pagination.total"
        layout="total, sizes, prev, pager, next, jumper"
        @current-change="handlePageChange"
        @size-change="handleSizeChange"
      />
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
  font-size: 18px;
  font-weight: 700;
  color: #1a3566;
  line-height: 1.3;
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

/* 表格样式覆盖 */
:deep(.el-table) {
  border-radius: 8px;
  overflow: hidden;
}

:deep(.el-table th) {
  background-color: #f8f9fa;
  color: #1a3566;
  font-weight: 600;
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
</style>
