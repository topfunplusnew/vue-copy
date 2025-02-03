<script setup lang="ts">
import iconTooling from '@/components/icons/IconTooling.vue'
</script>
<template>
  <div>
    <iconTooling />
    main
    <router-link :to="{ name: 'home' }"><el-button>HOME</el-button></router-link>
    <router-link :to="{ name: 'trip' }"><el-button>ABOUT</el-button></router-link>
    <router-link :to="{ name: 'trip' }"><el-button>BLOG</el-button></router-link>
    <router-link :to="{ name: 'trip' }"><el-button>CONTACT US</el-button></router-link>
  </div>
</template>
