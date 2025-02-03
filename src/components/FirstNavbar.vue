<template>
  <div class="first-navbar">
    <div class="navigation-buttons">
      <router-link :to="{ name: 'about' }"><button>ABOUT</button></router-link>
      <router-link :to="{ name: 'blog' }"><button>BLOG</button></router-link>
      <router-link :to="{ name: 'contact' }"><button>CONTACT</button></router-link>
    </div>
  </div>
</template>

<script lang="ts">
export default {
  name: "FirstNavbar",
};
</script>

<style scoped lang="scss">
.first-navbar {
  display: flex;
  justify-content: center;
  padding: 1rem;
  background-color: #f9f9f9;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);

  .navigation-buttons {
    display: flex;
    gap: 1rem;
  }

  button {
    background-color: #fff;
    color: #000;
    border: 1px solid #000;
    padding: 0.5rem 1rem;
    border-radius: 4px;
    cursor: pointer;
    font-weight: bold;
    transition: background-color 0.3s ease, color 0.3s ease;

    &:hover {
      background-color: #e0e0e0;
    }
  }
}
</style>
