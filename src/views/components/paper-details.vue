<script setup lang="ts">
import { computed, onMounted, ref, watch, onUnmounted } from 'vue';
import { useRoute } from 'vue-router';
import { isEmpty, find, flatMap, get as lodashGet, uniqBy, defaultTo, template } from 'lodash';
import commonHeader from '@/layout/common-header.vue';
import { useConferenceStore } from '@/stores/conference';
import { getImageUrl } from '@/utils';
import { convertUTCToTimezone, formatRange } from '@/utils/date';
import type { TabKey } from '@/types/conference.ts';
import { getFileTypeByTabKey } from '@/utils/conference.ts';
import FileUpload from '@/components/file-upload.vue';
import type { IpaperDetail } from '@/types/paper';
import { getPaperDetail } from '@/services/api.ts';
import type { PaperDetail } from '@/components';
import { addPaperViewHistory } from '@/services/user';
import { useUserStore } from '@/stores/user';
import { getPaperComments, createPaperComment } from '@/services/paper';
import type { Comment, CreatePaperCommentData } from '@/services/paper/type';
import { ElMessage, ElIcon } from 'element-plus';
import { Loading } from '@element-plus/icons-vue';

const user = computed(() => {
  return useUserStore().user;
});
type AffRaw = {
  id: number;
  name?: string;
  department?: string;
  university?: string;
  city?: string;
  state?: string;
  country?: string;
};

type AffiliationLite = {
  id: number;
  originalId: number;
  name?: string;
  department?: string;
  university?: string;
  city?: string;
  state?: string;
  country?: string;
};
const props = defineProps<{
  paperId: string
}>()


const conferenceStore = useConferenceStore();
const route = useRoute();
const paperId = computed(() => Number(props.paperId));
const activeTab = ref<TabKey | 'Key Point'>('details');
const paperDetail = ref<IpaperDetail>({} as IpaperDetail);
const paperNotFound = ref(false);
const loading = ref(false);

// 检测是否为手机端
const checkIsMobile = () => {
  return window.innerWidth <= 768;
};

const isMobile = ref(checkIsMobile());

const handleResize = () => {
  isMobile.value = checkIsMobile();
};

// 记录论文浏览历史
const recordViewHistory = async (id: number) => {
  try {
    await addPaperViewHistory({
      paper_id: id,
      view_type: 'detail',
    });
  } catch (error) {
    // 静默失败，不影响页面展示
    console.error('Failed to record view history:', error);
  }
};

onMounted(async () => {
  loading.value = true;
  try {
    const res = await getPaperDetail(paperId.value + '');
    if (res.status === 200) {
      paperDetail.value = res.data;
      // 记录浏览历史
      recordViewHistory(paperId.value);
    }
  } catch (error) {
    paperNotFound.value = true;
    console.error('Failed to load paper detail:', error);
  } finally {
    loading.value = false;
  }

  // 加载评论
  await loadComments();

  window.addEventListener('resize', handleResize);
});

onUnmounted(() => {
  window.removeEventListener('resize', handleResize);
});

// 监听 paperId 变化，当路由参数变化时重新记录
watch(
  () => paperId.value,
  (newId) => {
    if (newId) {
      recordViewHistory(newId);
    }
  },
);

watch(
  () => conferenceStore.paperDetail,
  (newVal) => {
    if (newVal) {
      paperDetail.value = newVal as IpaperDetail;
    }
  },
  { immediate: true },
);

function switchTab(tab: TabKey | 'Key Point' | 'fulltext') {
  activeTab.value = tab;
}

function getPaperContent(): PaperDetail {
  if (activeTab.value === 'additional') {
    return {
      fileUrl: defaultTo(paperDetail.value?.addition_files, []),
    };
  }
  if (activeTab.value === 'Key Point') {
    return { fileUrl: '' };
  }
  const raw = lodashGet(paperDetail.value, getFileTypeByTabKey(activeTab.value as TabKey));
  return { fileUrl: defaultTo(raw, '') };
}

// 获取机构列表 - 按作者顺序合并去重并重新编号
const affiliations = computed((): AffiliationLite[] => {
  if (isEmpty(paperDetail.value?.authors)) return [];

  const sortedAuthors = [...paperDetail.value.authors];
  const allAffiliations = flatMap(sortedAuthors, (author: (typeof sortedAuthors)[0]) => {
    if (isEmpty(author.affiliations)) return [];
    return author.affiliations.map((affiliation: (typeof author.affiliations)[0]) => ({
      authorId: author.id,
      originalAffiliationId: affiliation.id,
      affiliation: affiliation as AffRaw,
    }));
  });

  // 使用 uniqBy 去重，保持顺序
  const uniqueAffiliationItems = uniqBy(allAffiliations, 'originalAffiliationId');

  // 使用 map 替代 forEach + push，更函数式
  return uniqueAffiliationItems.map((item: (typeof allAffiliations)[0], index: number) => ({
    id: index + 1,
    originalId: item.originalAffiliationId,
    name: item.affiliation.name,
    department: item.affiliation.department,
    university: item.affiliation.university,
    city: item.affiliation.city,
    state: item.affiliation.state,
    country: item.affiliation.country,
  }));
});

function getAffiliationNumber(originalId: number) {
  const aff = find(affiliations.value, (a: AffiliationLite) => a.originalId === originalId);
  return aff ? aff.id : 0;
}

// 评论相关状态
const comments = ref<Comment[]>([]);
const commentsTotal = ref(0);
const commentsLoading = ref(false);
const commentContent = ref(''); // 评论输入内容
const commentSubmitting = ref(false); // 评论提交中状态
const replyingTo = ref<Comment | null>(null); // 正在回复的评论
const replyContent = ref(''); // 回复输入内容
const replySubmitting = ref(false); // 回复提交中状态
const expandedReplies = ref<Set<number>>(new Set()); // 已展开的三级回复的二级回复ID集合

// 加载评论列表
const loadComments = async () => {
  if (!paperId.value) return;

  commentsLoading.value = true;
  try {
    const response = await getPaperComments(paperId.value);
    const responseData = lodashGet(response, 'data');
    if (responseData) {
      comments.value = defaultTo(lodashGet(responseData, 'items'), []);
      commentsTotal.value = defaultTo(lodashGet(responseData, 'total'), 0);
    }
  } catch (error) {
    console.error('Failed to load comments:', error);
    ElMessage.error('Failed to load comments');
  } finally {
    commentsLoading.value = false;
  }
};

// 提交评论
const submitComment = async () => {
  const trimmedContent = commentContent.value.trim();
  if (isEmpty(trimmedContent) || !paperId.value || commentSubmitting.value) return;

  commentSubmitting.value = true;
  try {
    const data: CreatePaperCommentData = {
      content: trimmedContent,
    };
    const response = await createPaperComment(paperId.value, data);
    const responseData = lodashGet(response, 'data');
    if (responseData) {
      ElMessage.success(lodashGet(responseData, 'message', 'Comment posted successfully'));
      commentContent.value = '';
      await loadComments();
    }
  } catch (error) {
    console.error('Failed to submit comment:', error);
    ElMessage.error('Failed to submit comment');
  } finally {
    commentSubmitting.value = false;
  }
};

// 提交回复
const submitReply = async () => {
  const trimmedContent = replyContent.value.trim();
  if (isEmpty(trimmedContent) || !paperId.value || !replyingTo.value || replySubmitting.value) return;

  replySubmitting.value = true;
  try {
    const data: CreatePaperCommentData = {
      content: trimmedContent,
      parent_id: lodashGet(replyingTo.value, 'id'),
    };
    const response = await createPaperComment(paperId.value, data);
    const responseData = lodashGet(response, 'data');
    if (responseData) {
      ElMessage.success(lodashGet(responseData, 'message', 'Reply posted successfully'));
      replyContent.value = '';
      replyingTo.value = null;
      await loadComments();
    }
  } catch (error) {
    console.error('Failed to submit reply:', error);
    ElMessage.error('Failed to submit reply');
  } finally {
    replySubmitting.value = false;
  }
};

// 格式化时间（将UTC时间转换为北京时间UTC+8）
const formatTime = (timeStr: string) => {
  // 解析UTC时间字符串为时间戳（毫秒）
  // 如果timeStr是ISO格式的UTC时间（如 "2024-01-01T12:00:00Z"），new Date会正确解析
  const utcTimestamp = new Date(timeStr).getTime();

  // 转换为北京时间（UTC+8，加8小时）
  const beijingTimestamp = utcTimestamp + 16 * 60 * 60 * 1000;

  // 获取当前UTC时间戳
  const nowUtcTimestamp = Date.now();

  // 转换为当前北京时间戳
  const nowBeijingTimestamp = nowUtcTimestamp + 8 * 60 * 60 * 1000;

  // 计算时间差（毫秒）
  const diffMs = nowBeijingTimestamp - beijingTimestamp;
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);

  if (diffDays > 0) {
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  } else if (diffHours > 0) {
    return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  } else {
    // 不满一个小时也显示"一小时前"
    return 'less than 1 hour ago';
  }
};

// 切换回复输入框
const toggleReply = (comment: Comment) => {
  const isSameComment = lodashGet(replyingTo.value, 'id') === comment.id;
  replyingTo.value = isSameComment ? null : comment;
  replyContent.value = '';
};

// 切换展开/折叠三级回复
const toggleExpandReplies = (replyId: number) => {
  if (expandedReplies.value.has(replyId)) {
    expandedReplies.value.delete(replyId);
  } else {
    expandedReplies.value.add(replyId);
  }
};

// 递归计算所有嵌套回复的总数
const countAllNestedReplies = (replies: Comment[] | undefined): number => {
  if (isEmpty(replies)) return 0;

  return (replies as Comment[]).reduce((count, reply) => {
    const currentCount = 1; // 当前回复
    const nestedCount = isEmpty(reply.replies) ? 0 : countAllNestedReplies(reply.replies);
    return count + currentCount + nestedCount;
  }, 0);
};

// 递归添加所有嵌套回复（三级及以上）
const addNestedReplies = (nestedReplies: Comment[] | undefined, targetUserName: string, result: Array<{ reply: Comment; isNested: boolean; targetUser?: string }>) => {
  if (isEmpty(nestedReplies)) return;

  (nestedReplies as Comment[]).forEach((nestedReply) => {
    // 添加当前层级的嵌套回复
    result.push({
      reply: nestedReply,
      isNested: true,
      targetUser: targetUserName,
    });

    // 递归处理更深层级的回复
    if (!isEmpty(nestedReply.replies)) {
      addNestedReplies(nestedReply.replies, lodashGet(nestedReply, 'user.name', 'Anonymous'), result);
    }
  });
};

// 获取所有需要平级显示的回复（二级回复 + 展开的三级及以上回复）
const getFlattenedReplies = (replies: Comment[] | undefined): Array<{ reply: Comment; isNested: boolean; targetUser?: string }> => {
  if (isEmpty(replies)) return [];

  return flatMap(replies, (reply: Comment) => {
    const result: Array<{ reply: Comment; isNested: boolean; targetUser?: string }> = [
      { reply, isNested: false }, // 添加二级回复（完整显示）
    ];

    // 如果已展开，递归添加所有三级及以上回复（A->B格式）
    if (expandedReplies.value.has(reply.id) && !isEmpty(reply.replies)) {
      addNestedReplies(reply.replies, lodashGet(reply, 'user.name', 'Anonymous'), result);
    }

    return result;
  });
};
</script>

<template>
  <div class="background-layer"></div>

  <div class="paper-details-page main" v-loading.fullscreen.lock="loading">
    <commonHeader />

    <section class="main-content">
      <section class="right-panel">
        <!-- 文章不存在时的错误提示 -->
        <div v-if="paperNotFound" class="paper-not-found">
          <div class="not-found-icon">📄</div>
          <div class="not-found-title">The paper does not exist</div>
          <div class="not-found-desc">Sorry, we couldn't find the paper you're looking for. It may have been deleted or
            the ID is incorrect.</div>
        </div>

        <!-- 正常显示文章详情 -->
        <template v-else-if="paperDetail?.id">
          <header class="event-header">
            <div class="conference-header">
              <div class="logo" v-if="paperDetail?.conference?.logo">
                <img :src="getImageUrl(paperDetail.conference.logo)" :alt="paperDetail.conference.abbreviation" />
              </div>
              <div class="conference-info">
                <router-link v-if="paperDetail?.conference.id" :to="{name:'FeaturedEvents',params:{conferenceId:paperDetail?.conference.id}}" class="conference-full-name">{{ paperDetail?.conference?.name }}</router-link>
            
              </div>
            </div>
            <div class="meta">
              <div class="paper-info-section">
                <!-- 左侧：Graphical Abstract (Desktop only) -->
                <div class="graphical-abstract-desktop" v-if="paperDetail?.graphic_abstract?.length">
                  <template v-for="graphical in paperDetail?.graphic_abstract" :key="graphical">
                    <img :src="getImageUrl(graphical)" alt="Graphical Abstract" class="graphical-abstract-image" />
                  </template>
                </div>

                <!-- 右侧：title、authors、affiliations 整体 -->
                <div class="text-content">
                  <div class="title">{{ paperDetail?.title }}</div>

                  <div class="authors">
                    <div v-if="paperDetail?.authors?.length" class="authors-list">
                      <span v-for="(author, authorIndex) in paperDetail?.authors" :key="authorIndex"
                        class="author-name">
                        {{ author.name
                        }}<template v-if="author?.affiliations?.length"><sup
                            v-for="(aff, affIdx) in author.affiliations" :key="affIdx">{{ getAffiliationNumber(aff.id)
                            }}<span v-if="affIdx < author.affiliations.length - 1">,</span></sup></template><span
                          v-if="authorIndex < (paperDetail?.authors.length || 0) - 1">, </span>
                      </span>
                    </div>
                    <div v-else class="empty-state">
                      <div class="empty-text">No authors information available</div>
                    </div>
                  </div>

                  <div class="affiliations">
                    <div v-if="affiliations.length" class="affiliations-list">
                      <div v-for="aff in affiliations" :key="aff.id" class="affiliation">
                        <sup>{{ aff.id }}</sup>{{ aff.university || aff.name }}{{ aff.department ? ', ' + aff.department
                          : '' }}{{
                          aff.city ? ', ' + aff.city : '' }}{{ aff.state ? ', ' + aff.state : ''
                        }}{{ aff.country ? ', ' + aff.country : '' }}
                      </div>
                    </div>
                    <div v-else class="empty-state">
                      <div class="empty-text">No affiliation information available</div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Graphical Abstract (Mobile only) -->
              <div class="graphical-abstract-mobile" v-if="paperDetail?.graphic_abstract?.length">
                
                <template v-for="graphical in paperDetail?.graphic_abstract" :key="graphical">
                  <img :src="getImageUrl(graphical)" alt="Graphical Abstract" class="graphical-abstract-image-mobile" />
                </template>
              </div>
            </div>

            <!-- View Sessions Link -->
            <div class="conference-links">
              <router-link 
                v-if="paperDetail?.conference?.id" 
                :to="{ name: 'ConferenceSessions', params: { conferenceId: paperDetail.conference.id } }" 
                class="conf-link">
                <span class="link-icon">📋</span> View Conference Sessions
              </router-link>
            </div>

            <!-- Session Information -->
            <div class="meta" v-if="paperDetail?.session || paperDetail?.conference">
              <div class="session-notice">
                <div class="session-header" v-if="paperDetail?.conference">
                  <div class="conference-details">
                    <div class="detail-row">
                      <span class="detail-icon">📅</span>
                      <span class="detail-text">{{ formatRange(paperDetail.conference.start_time, paperDetail.conference.end_time) }}</span>
                    </div>
                    <div class="detail-row" v-if="paperDetail.conference.city">
                      <span class="detail-icon">📍</span>
                      <span class="detail-text">{{ paperDetail.conference.city }}{{ paperDetail.conference.country ? ', ' + paperDetail.conference.country : '' }}</span>
                    </div>
                  </div>
                </div>
                <div class="session-content" v-if="paperDetail?.session">
                  <div class="schedule-details">
                    <div class="schedule-row">
                      <span class="schedule-label">📅 Date And Time:</span>
                      <span class="schedule-value">{{ convertUTCToTimezone(paperDetail.session.start_time) }}</span>
                    </div>
                    <div class="schedule-row">
                      <span class="schedule-label">🏢 Room:</span>
                      <span class="schedule-value">{{ paperDetail.session.room_info }}</span>
                    </div>
                    <div class="schedule-row">
                      <span class="schedule-label">🎯 Session:</span>
                      <span class="schedule-value">{{ paperDetail.session.session_name }}</span>
                    </div>
                    <div class="schedule-row" v-if="paperDetail.session.chairperson">
                      <span class="schedule-label">👤 Chair:</span>
                      <span class="schedule-value">{{ paperDetail.session.chairperson }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </header>

          <!-- Tab Container -->
          <div class="tab-container">
            <div class="left-nav-wrapper">
              <!-- Navigation Buttons -->
              <div class="left-nav">
                <button :class="{ active: activeTab === 'details' }" @click="switchTab('details')">Details</button>
                <button :class="{ active: activeTab === 'fulltext' }" @click="switchTab('fulltext')">Full Text</button>
                <button :class="{ active: activeTab === 'video' }" @click="switchTab('video')"
                  :disabled="paperDetail?.video_status !== 1">Video</button>
                <button :class="{ active: activeTab === 'Key Point' }" @click="switchTab('Key Point')">Key
                  Points</button>
                <button :class="{ active: activeTab === 'slides' }" @click="paperDetail?.slide && switchTab('slides')"
                  :disabled="paperDetail?.slide_status !== 1">Slides</button>
                <button :class="{ active: activeTab === 'poster' }" @click="paperDetail?.poster && switchTab('poster')"
                  :disabled="paperDetail?.poster_status !== 1">Poster</button>
                <button :class="{ active: activeTab === 'additional' }"
                  @click="paperDetail?.addition_files.length && switchTab('additional')"
                  :disabled="!paperDetail?.addition_files.length">
                  More Info
                </button>
                <router-link :to="{ name: 'MyEventDetail', params: { paperId: paperId.valueOf() } }"
                  v-if="paperDetail?.can_edit">
                  Edit </router-link>
              </div>
            </div>

            <!-- Tab Content -->
            <div class="tab-content">
              <div v-if="activeTab === 'details'" class="details-content">
                <div class="detail-item">
                  <h5>DOI</h5>
                  <p>{{ paperDetail?.doi }}</p>
                </div>
                <div class="detail-item">
                  <h5 class="detail-title">Abstract</h5>
                  <latex-content :latex="paperDetail?.abstract" />
                </div>
              </div>

              <div v-if="activeTab === 'fulltext'" class="full-content">
                <FileUpload :tab-key="activeTab" :paper-id="paperDetail?.id || 0" :paper-detail="getPaperContent()"
                  :limit="1" class="poster-image" :is-show="false" :is-file-list-show-config="{
                    [activeTab]: false,
                  }" />
              </div>
              <div v-if="activeTab === 'video'" class="videos-content">
                <template v-if="paperDetail?.video_status === 1">
                  <FileUpload :tab-key="activeTab" :paper-id="paperDetail?.id || 0" :paper-detail="getPaperContent()"
                    :limit="1" :is-show="false" :is-file-list-show-config="{
                      [activeTab]: false,
                    }" />
                </template>
                <div v-else class="access-restricted">
                  <p>Video content is only available to open access.</p>
                </div>
              </div>

              <div v-if="activeTab === 'slides'" class="slides-content">
                <FileUpload :tab-key="activeTab" :paper-id="paperDetail?.id || 0" :paper-detail="getPaperContent()"
                  :limit="1" class="slides-iframe" :is-show="false" :is-file-list-show-config="{
                    [activeTab]: false,
                  }" />
              </div>

              <div v-if="activeTab === 'poster'" class="poster-content">
                <FileUpload :tab-key="activeTab" :paper-id="paperDetail?.id || 0" :paper-detail="getPaperContent()"
                  :limit="1" class="poster-image" :is-show="false" :is-file-list-show-config="{
                    [activeTab]: false,
                  }" />
              </div>

              <div v-if="activeTab === 'additional'" class="additional-content">
                <template v-if="paperDetail?.addition_files">
                  <FileUpload :tab-key="activeTab" :paper-id="paperDetail?.id" :paper-detail="getPaperContent()"
                    :limit="-1" :is-show="false" class="additional-iframe" />
                </template>
              </div>
              <div v-if="activeTab === 'Key Point'" class="keypoints-content">
                <div class="key-takeaways-header">
                  <h2 class="title">Key Takeaways</h2>
                </div>

                <ul class="key-points-list">
                  <li class="key-point-item" v-for="point in paperDetail?.key_points" :key="point">{{ point }}</li>
                </ul>
              </div>
            </div>
          </div>
          <!-- 评论区域 -->
          <div class="comments-section">
            <!-- 评论头部 -->
            <div class="comments-header">
              <h3 class="comments-title">
                Comments <span class="comments-count">{{ commentsTotal }}</span>
              </h3>
            </div>

            <!-- 评论输入框 -->
            <div class="comment-input-area">
              <div class="comment-input-wrapper">
                <img v-if="user?.avatar" :src="getImageUrl(user.avatar)" alt="avatar" class="comment-avatar" />
                <div v-else class="comment-avatar-placeholder">{{ user?.name?.[0] || 'U' }}</div>
                <input v-model="commentContent" type="text" class="comment-input" placeholder="Write a comment..."
                  @keyup.enter="submitComment" :disabled="commentSubmitting" />
                <button class="comment-submit-btn" @click="submitComment"
                  :disabled="commentSubmitting || !commentContent.trim()">
                  {{ commentSubmitting ? 'Posting...' : 'Post' }}
                </button>
              </div>
            </div>

            <!-- 评论列表 -->
            <div class="comments-list">
              <!-- 加载图标 -->
              <div v-if="commentsLoading" class="comments-loading">
                <el-icon class="is-loading">
                  <Loading />
                </el-icon>
              </div>
              <template v-else>
                <div v-for="comment in comments" :key="comment.id" class="comment-item">
                  <!-- 主评论 -->
                  <div class="comment-main">
                    <img v-if="comment.user?.avatar" :src="getImageUrl(comment.user.avatar)" alt="avatar"
                      class="comment-user-avatar" />
                    <div v-else class="comment-user-avatar-placeholder">
                      {{ comment.user?.name?.[0] || 'U' }}
                    </div>
                    <div class="comment-content-wrapper">
                      <div class="comment-user-info">
                        <span class="comment-username">{{ comment.user?.name || 'Anonymous' }}</span>
                      </div>
                      <div class="comment-text">{{ comment.content }}</div>
                      <div class="comment-actions">
                        <span class="comment-time">{{ formatTime(comment.updated_at) }}</span>
                        <div class="comment-buttons">
                          <button class="comment-btn reply-btn" @click="toggleReply(comment)">Reply</button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- 回复输入框（回复顶级评论） -->
                  <div v-if="replyingTo?.id === comment.id" class="reply-input-area">
                    <div class="reply-input-wrapper">
                      <img v-if="user?.avatar" :src="getImageUrl(user.avatar)" alt="avatar" class="reply-avatar" />
                      <div v-else class="reply-avatar-placeholder">{{ user?.name?.[0] || 'U' }}</div>
                      <input v-model="replyContent" type="text" class="reply-input" placeholder="Reply to comment..."
                        @keyup.enter="submitReply" :disabled="replySubmitting" />
                      <button class="reply-submit-btn" @click="submitReply"
                        :disabled="replySubmitting || !replyContent.trim()">
                        {{ replySubmitting ? 'Sending...' : 'Send' }}
                      </button>
                    </div>
                  </div>

                  <!-- 回复列表（二级回复和三级及以上回复平级显示） -->
                  <div v-if="comment.replies && comment.replies.length > 0" class="replies-list">
                    <template v-for="item in getFlattenedReplies(comment.replies)" :key="item.reply.id">
                      <!-- 二级回复（完整显示） -->
                      <div v-if="!item.isNested" class="reply-item">
                        <img v-if="item.reply.user?.avatar" :src="getImageUrl(item.reply.user.avatar)" alt="avatar"
                          class="reply-user-avatar" />
                        <div v-else class="reply-user-avatar-placeholder">
                          {{ item.reply.user?.name?.[0] || 'U' }}
                        </div>
                        <div class="reply-content-wrapper">
                          <div class="reply-user-info">
                            <span class="reply-username">{{ item.reply.user?.name || 'Anonymous' }}</span>
                            <span v-if="item.reply.is_owner_reply" class="owner-badge">UP</span>
                          </div>
                          <div class="reply-text">{{ item.reply.content }}</div>
                          <div class="reply-actions">
                            <span class="reply-time">{{ formatTime(item.reply.updated_at) }}</span>
                            <div class="reply-buttons">
                              <button class="reply-btn-small" @click="toggleReply(item.reply)">Reply</button>
                              <!-- 查看更多回复按钮 -->
                              <button v-if="item.reply.replies && item.reply.replies.length > 0"
                                class="expand-replies-btn" @click="toggleExpandReplies(item.reply.id)">
                                {{ expandedReplies.has(item.reply.id) ? 'Hide replies' : `View more replies
                                (${countAllNestedReplies(item.reply.replies)})` }}
                              </button>
                            </div>
                          </div>
                        </div>
                        <!-- 回复输入框（回复回复） -->
                        <div v-if="replyingTo?.id === item.reply.id" class="reply-input-area-nested">
                          <div class="reply-input-wrapper">
                            <img v-if="user?.avatar" :src="getImageUrl(user.avatar)" alt="avatar"
                              class="reply-avatar" />
                            <div v-else class="reply-avatar-placeholder">{{ user?.name?.[0] || 'U' }}</div>
                            <input v-model="replyContent" type="text" class="reply-input"
                              placeholder="Reply to comment..." @keyup.enter="submitReply"
                              :disabled="replySubmitting" />
                            <button class="reply-submit-btn" @click="submitReply"
                              :disabled="replySubmitting || !replyContent.trim()">
                              {{ replySubmitting ? 'Sending...' : 'Send' }}
                            </button>
                          </div>
                        </div>
                      </div>

                      <!-- 三级及以上回复（A->B格式，与二级回复平级） -->
                      <div v-else class="nested-reply-item-flat">
                        <div class="nested-reply-avatar-section">
                          <img v-if="item.reply.user?.avatar" :src="getImageUrl(item.reply.user.avatar)" alt="avatar"
                            class="nested-reply-avatar" />
                          <div v-else class="nested-reply-avatar-placeholder">
                            {{ item.reply.user?.name?.[0] || 'U' }}
                          </div>
                        </div>
                        <div class="nested-reply-content-section">
                          <div class="nested-reply-header">
                            <span class="nested-reply-author">{{ item.reply.user?.name || 'Anonymous' }}</span>
                            <span class="nested-reply-arrow">→</span>
                            <span class="nested-reply-target">{{ item.targetUser || 'Anonymous' }}</span>
                          </div>
                          <div class="nested-reply-content">{{ item.reply.content }}</div>
                          <div class="nested-reply-footer">
                            <span class="nested-reply-time">{{ formatTime(item.reply.updated_at) }}</span>
                            <button class="nested-reply-btn" @click="toggleReply(item.reply)">Reply</button>
                          </div>
                        </div>
                        <!-- 回复输入框（回复嵌套回复） -->
                        <div v-if="replyingTo?.id === item.reply.id" class="reply-input-area-nested">
                          <div class="reply-input-wrapper">
                            <img v-if="user?.avatar" :src="getImageUrl(user.avatar)" alt="avatar"
                              class="reply-avatar" />
                            <div v-else class="reply-avatar-placeholder">{{ user?.name?.[0] || 'U' }}</div>
                            <input v-model="replyContent" type="text" class="reply-input"
                              placeholder="Reply to comment..." @keyup.enter="submitReply"
                              :disabled="replySubmitting" />
                            <button class="reply-submit-btn" @click="submitReply"
                              :disabled="replySubmitting || !replyContent.trim()">
                              {{ replySubmitting ? 'Sending...' : 'Send' }}
                            </button>
                          </div>
                        </div>
                      </div>
                    </template>
                  </div>
                </div>

                <!-- 空状态 -->
                <div v-if="comments.length === 0" class="comments-empty">
                  <p>No comments yet, be the first to comment!</p>
                </div>
              </template>
            </div>
          </div>
          <div class="profiles">
            <div class="profile-title">
              <img src="../../assets/cap.png" alt="cap" class="profile-icon" />
              <span class="title">Profiles</span>
            </div>

            <div v-if="paperDetail?.authors?.length" class="authors-cards-section">
              <h4 class="authors-section-title">Authors</h4>
              <div class="authors-cards-container">
                <template v-for="author in paperDetail.authors" :key="author.id">

                  <router-link class="author-card"
                    :to="author.user_id == user!.id ? { name: 'userpage' } : { name: 'otheruser', params: { id: author.id } }"
                    v-if="author.user_id">
                    <div class="author-avatar-wrapper">
                      <img v-if="author.avatar" :src="getImageUrl(author.avatar)" :alt="author.name"
                        class="author-avatar" />
                      <div v-else class="author-avatar-placeholder">{{ author.name?.[0] || 'A' }}</div>
                    </div>
                    <div class="author-name">{{ author.name }}</div>
                  </router-link>
                  <div v-else class="author-card">
                    <div class="author-avatar-wrapper">
                      <img v-if="author.avatar" :src="getImageUrl(author.avatar)" :alt="author.name"
                        class="author-avatar" />
                      <div v-else class="author-avatar-placeholder">{{ author.name?.[0] || 'A' }}</div>
                    </div>
                    <div class="author-name">{{ author.name }}</div>
                  </div>
                </template>
              </div>
            </div>
          </div>
        </template>
      </section>
    </section>
  </div>
</template>

<style lang="scss" scoped>
@use '../../styles/pages/_paper-details.scss' as *;
</style>
