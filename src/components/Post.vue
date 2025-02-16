<template>
    <div class="post-container">
      <button @click="postToServer">Post</button>
    </div>
  </template>

<script lang="ts">
export default {
  name: 'UserPost',
  methods: {
    Logintoaccount() {
      // Add your post here
      console.log('Post button clicked');
    }
  }
}
</script>