<script setup lang="ts">
import iconTooling from '@/components/icons/IconTooling.vue'
</script>
<template>
  <div>
    <icon-tooling />
    main
    <router-link :to="{ name: 'home' }"><el-button>return</el-button></router-link>

  </div>
</template>
