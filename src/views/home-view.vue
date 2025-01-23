<script setup lang="ts">
import wallectItem from '@/components/wallect-item.vue'
</script>

<template>
  <div class="home">
    <header>
      header
      <wallect-item />
    </header>
    <main>
      main
      <router-link :to="{ name: 'trip' }"><el-button>trip</el-button></router-link>
    </main>
    <footer>
      footer
    </footer>
  </div>
</template>
