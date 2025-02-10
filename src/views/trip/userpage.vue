<template>

  <div class="userpage">
    <div class="home">
    <!-- Header 区域 -->
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
    </div>
    <!-- 左侧：用户信息侧边栏 -->
    <div class="sidebar">
      <div class="user-info">
        <img class="avatar" src="https://via.placeholder.com/150" alt="User Avatar" />
        <div class="username">John Doe</div>
        <div class="bio">Blockchain enthusiast & NFT collector</div>
        <div class="stats">
          <div class="stat">
            <span class="number">120</span>
            <span class="label">Likes</span>
          </div>
          <div class="stat">
            <span class="number">80</span>
            <span class="label">Following</span>
          </div>
          <div class="stat">
            <span class="number">200</span>
            <span class="label">Followers</span>
          </div>
          <div class="stat">
            <span class="number">350</span>
            <span class="label">Coins</span>
          </div>
          <!-- 额外信息 -->
          <div class="stat">
            <span class="number">Gold</span>
            <span class="label">Reputation</span>
          </div>
          <div class="stat">
            <span class="number">5</span>
            <span class="label">NFTs</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 右侧：用户发布的帖子 -->
    <div class="posts">
      <div class="posts-grid">
        <div class="post-card" v-for="post in posts" :key="post.id">
          <img class="post-image" :src="post.image" alt="Post Image" />
          <div class="post-stats">
            <div class="stat-item">
              <i class="el-icon-like"></i>
              <span>{{ post.likes }}</span>
            </div>
            <div class="stat-item">
              <i class="el-icon-chat-line-round"></i>
              <span>{{ post.comments }}</span>
            </div>
            <div class="stat-item">
              <i class="el-icon-coin"></i>
              <span>{{ post.coins }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Post {
  id: number;
  image: string;
  likes: number;
  comments: number;
  coins: number;
}

const posts: Post[] = [
  { id: 1, image: 'https://via.placeholder.com/300x200', likes: 45, comments: 10, coins: 5 },
  { id: 2, image: 'https://via.placeholder.com/300x200', likes: 60, comments: 20, coins: 8 },
  { id: 3, image: 'https://via.placeholder.com/300x200', likes: 30, comments: 5, coins: 3 },
  { id: 4, image: 'https://via.placeholder.com/300x200', likes: 75, comments: 15, coins: 10 },
  { id: 5, image: 'https://via.placeholder.com/300x200', likes: 90, comments: 25, coins: 12 },
  { id: 6, image: 'https://via.placeholder.com/300x200', likes: 55, comments: 12, coins: 7 }
];
</script>

