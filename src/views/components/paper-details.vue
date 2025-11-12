<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import commonHeader from '@/layout/common-header.vue';
import { useConferenceStore } from '@/stores/conference';
import { getImageUrl } from '@/utils';
import type { TabKey } from '@/types/conference.ts';
import { getFileTypeByTabKey } from '@/utils/conference.ts';
import FileUpload from '@/components/file-upload.vue';
import type { IpaperDetail } from '@/types/paper';
import { getPaperDetail } from '@/services/api.ts';
import type { PaperDetail } from '@/components';
import { addPaperViewHistory } from '@/services/user';

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

const conferenceStore = useConferenceStore();
const route = useRoute();
const paperId = computed(() => Number(route.params.paperId));
const activeTab = ref<TabKey | 'keypoints' | 'fulltext'>('details');
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

  window.addEventListener('resize', handleResize);
});

// 监听 paperId 变化，当路由参数变化时重新记录
watch(
  () => paperId.value,
  (newId) => {
    if (newId) {
      recordViewHistory(newId);
    }
  }
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

function switchTab(tab: TabKey | 'keypoints' | 'fulltext') {
  activeTab.value = tab;
}

function getPaperContent(): PaperDetail {
  if (activeTab.value === 'additional') {
    return {
      fileUrl: paperDetail.value?.addition_files || [],
    };
  }
  if (activeTab.value === 'keypoints' || activeTab.value === 'fulltext') {
    return { fileUrl: '' };
  }
  const raw = paperDetail.value?.[getFileTypeByTabKey(activeTab.value as TabKey)];
  return { fileUrl: raw };
}

// 获取机构列表 - 按作者顺序合并去重并重新编号
const affiliations = computed((): AffiliationLite[] => {
  if (!paperDetail.value?.authors) return [];
  const sortedAuthors = [...paperDetail.value.authors];
  const allAffiliations: { authorId: number; originalAffiliationId: number; affiliation: AffRaw }[] = [];
  sortedAuthors.forEach((author) => {
    if (author.affiliations && author.affiliations.length > 0) {
      author.affiliations.forEach((affiliation) => {
        allAffiliations.push({
          authorId: author.id,
          originalAffiliationId: affiliation.id,
          affiliation: affiliation as AffRaw,
        });
      });
    }
  });
  const uniqueAffiliations = new Map();
  const affiliationList: AffiliationLite[] = [];
  let newId = 1;
  allAffiliations.forEach((item) => {
    if (!uniqueAffiliations.has(item.originalAffiliationId)) {
      const newAffiliation = {
        id: newId++,
        originalId: item.originalAffiliationId,
        name: item.affiliation.name,
        department: item.affiliation.department,
        university: item.affiliation.university,
        city: item.affiliation.city,
        state: item.affiliation.state,
        country: item.affiliation.country,
      };
      uniqueAffiliations.set(item.originalAffiliationId, newAffiliation);
      affiliationList.push(newAffiliation);
    }
  });
  return affiliationList;
});

function getAffiliationNumber(originalId: number) {
  const aff = affiliations.value.find((a) => a.originalId === originalId);
  return aff ? aff.id : 0;
}
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
          <div class="not-found-desc">
            Sorry, we couldn't find the paper you're looking for. It may have been deleted or the ID is incorrect.
          </div>
        </div>

        <!-- 正常显示文章详情 -->
        <template v-else-if="paperDetail?.id">
          <header class="event-header">
            <div class="conference-header">
              <div class="logo" v-if="paperDetail?.conference?.logo">
                <img :src="getImageUrl(paperDetail.conference.logo)" :alt="paperDetail.conference.abbreviation" />
              </div>
              <div class="conference-info">
                <div class="conference-name">{{ paperDetail?.conference?.abbreviation }}</div>
                <div class="conference-full-name">{{ paperDetail?.conference?.name }}</div>
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
                      <span v-for="(author, authorIndex) in paperDetail?.authors" :key="authorIndex" class="author-name">
                        {{ author.name
                        }}<template v-if="author?.affiliations?.length"
                          ><sup v-for="(aff, affIdx) in author.affiliations" :key="affIdx"
                            >{{ getAffiliationNumber(aff.id) }}<span v-if="affIdx < author.affiliations.length - 1"
                              >,</span
                            ></sup
                          ></template
                        ><span v-if="authorIndex < (paperDetail?.authors.length || 0) - 1">, </span>
                      </span>
                    </div>
                    <div v-else class="empty-state">
                      <div class="empty-text">No authors information available</div>
                    </div>
                  </div>

                  <div class="affiliations">
                    <div v-if="affiliations.length" class="affiliations-list">
                      <div v-for="aff in affiliations" :key="aff.id" class="affiliation">
                        <sup>{{ aff.id }}</sup
                        >{{ aff.university || aff.name }}{{ aff.department ? ', ' + aff.department : ''
                        }}{{ aff.city ? ', ' + aff.city : '' }}{{ aff.state ? ', ' + aff.state : ''
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
                <div class="mobile-title">Graphical Abstract</div>
                <template v-for="graphical in paperDetail?.graphic_abstract" :key="graphical">
                  <img :src="getImageUrl(graphical)" alt="Graphical Abstract" class="graphical-abstract-image-mobile" />
                </template>
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
                <button
                  :class="{ active: activeTab === 'video' }"
                  @click="switchTab('video')"
                  :disabled="paperDetail?.video_status !== 1"
                >
                  Video
                </button>
                <button :class="{ active: activeTab === 'keypoints' }" @click="switchTab('keypoints')">Key Points</button>
                <button
                  :class="{ active: activeTab === 'slides' }"
                  @click="paperDetail?.slide && switchTab('slides')"
                  :disabled="paperDetail?.slide_status !== 1"
                >
                  Slides
                </button>
                <button
                  :class="{ active: activeTab === 'poster' }"
                  @click="paperDetail?.poster && switchTab('poster')"
                  :disabled="paperDetail?.poster_status !== 1"
                >
                  Poster
                </button>
                <button
                  :class="{ active: activeTab === 'additional' }"
                  @click="paperDetail?.addition_files.length && switchTab('additional')"
                  :disabled="!paperDetail?.addition_files.length"
                >
                  Additional Info
                </button>
                <router-link
                  :to="{ name: 'MyEventDetail', params: { paperId: paperId.valueOf() } }"
                  v-if="paperDetail?.can_edit"
                >
                  Edit
                </router-link>
              </div>
            </div>

            <!-- Tab Content -->
            <div class="tab-content">
              <div v-if="activeTab === 'details'" class="details-content">
                <!-- <div class="paper-info">
                  <div class="info-section">
                    <h4>Authors</h4>
                    <div class="authors-list">
                      <span v-for="(author, authorIndex) in paperDetail?.authors" :key="authorIndex" class="author-name">
                        {{ author.name
                        }}<template v-if="author?.affiliations?.length"
                          ><sup v-for="(aff, affIdx) in author.affiliations" :key="affIdx"
                            >{{ getAffiliationNumber(aff.id) }}<span v-if="affIdx < author.affiliations.length - 1"
                              >,</span
                            ></sup
                          ></template
                        ><span v-if="authorIndex < (paperDetail?.authors.length || 0) - 1">, </span>
                      </span>
                    </div>
                  </div>

                  <div class="info-section">
                    <h4>Affiliations</h4>
                    <div class="affiliations-list">
                      <div v-for="aff in affiliations" :key="aff.id" class="affiliation">
                        <span class="affiliation-number"><sup>{{ aff.id }}</sup></span
                        >{{ aff.university || aff.name }}{{ aff.department ? ', ' + aff.department : ''
                        }}{{ aff.city ? ', ' + aff.city : '' }}{{ aff.state ? ', ' + aff.state : ''
                        }}{{ aff.country ? ', ' + aff.country : '' }}
                      </div>
                    </div>
                  </div>
                </div> -->

                <div class="detail-item">
                  <h5>DOI</h5>
                  <p>{{ paperDetail?.doi }}</p>
                </div>

                <div class="detail-item">
                  <h5>Abstract</h5>
                  <latex-content :latex="paperDetail?.abstract" />
                </div>

                <div class="detail-item">
                  <h5>Keywords</h5>
                  <div class="keywords-list">
                    <span v-for="keyword in paperDetail?.keywords" :key="keyword.order" class="keyword-tag">
                      {{ keyword.name }}
                    </span>
                  </div>
                </div>
              </div>

              <!-- <div v-if="activeTab === 'keypoints'" class="keypoints-content">
                <div class="empty-placeholder">
                  <p>Key points are not available for this paper.</p>
                </div>
              </div>

              <div v-if="activeTab === 'fulltext'" class="fulltext-content">
                <div class="empty-placeholder">
                  <p>Full text is not available for this paper.</p>
                </div>
              </div> -->

              <div v-if="activeTab === 'video'" class="videos-content">
                <template v-if="paperDetail?.video_status === 1">
                  <FileUpload
                    :tab-key="activeTab"
                    :paper-id="paperDetail?.id || 0"
                    :paper-detail="getPaperContent()"
                    :limit="1"
                    :is-show="false"
                    :is-file-list-show-config="{
                      [activeTab]: false,
                    }"
                  />
                </template>
                <div v-else class="access-restricted">
                  <p>Video content is only available to open access.</p>
                </div>
              </div>

              <div v-if="activeTab === 'slides'" class="slides-content">
                <FileUpload
                  :tab-key="activeTab"
                  :paper-id="paperDetail?.id || 0"
                  :paper-detail="getPaperContent()"
                  :limit="1"
                  class="slides-iframe"
                  :is-show="false"
                  :is-file-list-show-config="{
                    [activeTab]: false,
                  }"
                />
              </div>

              <div v-if="activeTab === 'poster'" class="poster-content">
                <FileUpload
                  :tab-key="activeTab"
                  :paper-id="paperDetail?.id || 0"
                  :paper-detail="getPaperContent()"
                  :limit="1"
                  class="poster-image"
                  :is-show="false"
                  :is-file-list-show-config="{
                    [activeTab]: false,
                  }"
                />
              </div>

              <div v-if="activeTab === 'additional'" class="additional-content">
                <template v-if="paperDetail?.addition_files">
                  <FileUpload
                    :tab-key="activeTab"
                    :paper-id="paperDetail?.id"
                    :paper-detail="getPaperContent()"
                    :limit="-1"
                    :is-show="false"
                    class="additional-iframe"
                  />
                </template>
              </div>
            </div>
          </div>
        </template>
      </section>
    </section>
  </div>
</template>

