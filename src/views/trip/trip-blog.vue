<script setup lang="ts">
import { ref, onMounted } from 'vue';
import IconTooling from '@/components/icons/IconTooling.vue';
import { blogPosts } from '@/data/blogpost.ts'; // 确保路径正确


const msg= 'Our Latest Blog';

const posts = ref(blogPosts)
</script>

<template>
  <div class="home">
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
          <router-link :to="{ name: 'login' }"><el-button class="nav-button">Login</el-button></router-link>
          <router-link :to="{ name: 'signup' }"><el-button class="nav-button">Sign Up</el-button></router-link>
        </div>
      </div>

      <h1 class="header-title">{{ msg }}</h1>
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
          <h2 class="post-title">{{ post.title }}</h2>
          <div class="divider"></div>
        </div>
      </div>
    </div>


  </div>

</template>



