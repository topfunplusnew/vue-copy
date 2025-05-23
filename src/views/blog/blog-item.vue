<script lang="ts" setup>
import type { IBlog } from '@/types/blog';
import { getImageUrl } from '@/utils';

const props = defineProps<{post:IBlog}>();
const emits = defineEmits<{detail:[id:number]}>();

function onClick() {
  if(props.post.id) emits('detail', props.post.id);
}

</script>
<template>
  <div
    class="blog-item"
    :class="{ 'nft-blog': post.isNFT }"
    @click="onClick"
  >
    <!-- 博客图片 -->
    <el-carousel
      v-if="post.image && post.image.length > 0"
      indicator-position="outside"
      class="post-carousel"
      :autoplay="false"
      height="200px"
      :touchable="true"
      :loop="true"
    >
      <el-carousel-item
        v-for="(img, index) in post.image"
        :key="index"
      >
        <img
          :src="getImageUrl(img)"
          alt="Post Image"
          class="post-image"
        />
      </el-carousel-item>
    </el-carousel>

    <!-- 博客内容 -->
    <div class="post-content-userpage">
      <h2 class="post-title-userpage" :title="post.title">{{ post.title }}</h2>
      <p class="post-text-userpage" :title="post.content">{{ post.content }}</p>
    </div>

    <!-- 博客底部信息 -->
    <div class="post-footer-userpage">
      <!-- 作者信息 -->
      <div class="author-info">
        <img v-if="post.user?.avatar" :src="getImageUrl(post.user.avatar)" alt="Avatar" class="post-avatar" />
        <span class="author-name" :title="post.user?.name">{{ post.user?.name }}</span>
      </div>

      <!-- 统计信息 -->
      <div class="post-stats">
        <span class="likes">❤️ {{ post.likes }}</span>
        <span class="comments">💬 {{ post.comments_count }}</span>
        <span class="coins" v-if="post.isNFT">₿ {{ post.coins }}</span>
      </div>
    </div>
  </div>
</template>
