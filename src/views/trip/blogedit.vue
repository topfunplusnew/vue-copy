<!-- BlogEditor.vue -->
<script setup lang="ts">
import { ref, reactive } from 'vue'
import { ElButton, ElForm, ElFormItem, ElInput } from 'element-plus'

const props = defineProps<{
  postId?: string
}>()

const form = reactive({
  title: '',
  modules: [] as BlogModule[]
})

// 添加新模块
function addModule(type: BlogModule['type']) {
  form.modules.push({
    type,
    content: ''
  })
}

// 保存逻辑
function savePost() {
  const post: BlogPost = {
    id: props.postId || Date.now().toString(),
    title: form.title,
    modules: form.modules,
    createdAt: new Date()
  }

  // 保存到localStorage
  const posts = JSON.parse(localStorage.getItem('blogPosts') || '[]')
  const index = posts.findIndex((p: BlogPost) => p.id === post.id)
  if (index >= 0) {
    posts[index] = post
  } else {
    posts.push(post)
  }
  localStorage.setItem('blogPosts', JSON.stringify(posts))
}
</script>

<template>
    <header class="header">
    <!-- 放置按钮在最上面，并居中显示 -->
    <div class="nav-buttons">
      <router-link :to="{ name: 'home' }"><el-button>HOME</el-button></router-link>
      <router-link :to="{ name: 'about' }"><el-button>ABOUT</el-button></router-link>
      <router-link :to="{ name: 'blog' }"><el-button>BLOG</el-button></router-link>
      <router-link :to="{ name: 'contact' }"><el-button>CONTACT US</el-button></router-link>
    </div>
  </header>

  <div class="editor-container">
    <el-form :model="form">
      <el-form-item label="Title">
        <el-input v-model="form.title" placeholder="Describe somthing" />
      </el-form-item>

      <div class="module-controls">
        <el-button @click="addModule('text')">Add Text</el-button>
        <el-button @click="addModule('image')">Add Image</el-button>
        <el-button @click="addModule('video')">Add Video</el-button>
      </div>

      <div v-for="(module, index) in form.modules" :key="index" class="module-item">
        <el-input
          v-if="module.type === 'text'"
          v-model="module.content"
          type="textarea"
          rows="4"
        />

        <el-upload
          v-if="module.type === 'image'"
          action="your-upload-api"
          :show-file-list="false"
        >
          <el-button>Upload Image</el-button>
        </el-upload>

        <el-input
          v-if="module.type === 'video'"
          v-model="module.content"
          placeholder="Enter the link of Video"
        />
      </div>

      <el-button type="primary" @click="savePost">Save</el-button>
    </el-form>
  </div>
</template>
