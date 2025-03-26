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
  <router-link :to="{
    name:'home',
    params: {id: post.id}
  }">
    <!-- 博客图片 -->
    <img
      v-if="post.image && post.image.length > 0"
      :src="getImageUrl(post.image[0])"
      alt="Post Image"
      class="post-image"
    />

    <!-- 博客内容 -->
    <section class="blog-text">
      <h2 class="post-title">{{ post.title }}</h2>
      <p class="post-content">{{ post.content }}</p>
    </section>

    <!-- 博客底部信息 -->
    <section class="post-footer">
      <!-- 作者信息 -->
      <div class="blog-user-info">
        <img v-if="post.user?.avatar" :src="getImageUrl(post.user.avatar)" alt="Avatar" class="user-avatar" />
        <span class="user-name">{{ post.user?.name }}</span>
      </div>

      <!-- 统计信息 -->
      <div class="blog-stats">
        <span class="blog-likes">❤️ {{ post.likes }}</span>
        <span class="blog-comments">💬 {{ post.comments_count }}</span>
        <span class="blog-coins" v-if="post.isNFT">₿ {{ post.coins }}</span>
      </div>
    </section>
  </router-link>
</div>
</template>