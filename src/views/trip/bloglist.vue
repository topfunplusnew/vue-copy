<script setup lang="ts">
import { ref, onMounted } from 'vue';

const msg= 'Our Latest Blog';

const posts = ref<BlogPost[]>([
  {
    id: '1',
    title: 'Technology, Leisure, and Budget: The Future of Travel',
    readingTime: '12 min read',
    categories: ['Technology', 'Leisure', 'Budget']
  },
  {
    id: '2',
    title: 'AI and The Travel Industry',
    readingTime: '05 min read',
    categories: ['AI', 'Innovation']
  }
])
</script>

<template>
  <div class="blog">
    <!-- 改进后的 Header -->
    <header class="header">
      <div class="nav-container">
        <div class="left-nav">
          <router-link :to="{ name: 'home' }"><el-button class="nav-button">HOME</el-button></router-link>
          <router-link :to="{ name: 'about' }"><el-button class="nav-button">ABOUT</el-button></router-link>
          <router-link :to="{ name: 'blog' }"><el-button class="nav-button">BLOG</el-button></router-link>
          <router-link :to="{ name: 'contact' }"><el-button class="nav-button">CONTACT</el-button></router-link>
        </div>
        <div class="right-nav">
          <wallet-item />
          <Login />
          <Signup />
        </div>
      </div>

      <h3 class="header-title">{{ msg }}</h3>
    </header>

    <!-- Blog Content -->
    <div class="blog-container">

      <div class="post-list">
        <div
          v-for="post in posts"
          :key="post.id"
          class="post-item"
        >
          <div class="meta-line">
            <span class="reading-time">{{ post.readingTime }}</span>
            <div class="categories">
              <span
                v-for="(category, index) in post.categories"
                :key="index"
                class="category-tag"
              >
                {{ category }}
              </span>
            </div>
          </div>
          <h3 class="post-title">{{ post.title }}</h3>
          <div class="divider"></div>
        </div>
      </div>
    </div>
  </div>
</template>

