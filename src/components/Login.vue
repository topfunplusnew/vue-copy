<template>
  <div class="login">
    <button @click="Logintoaccount">Login</button>
  </div>
</template>

<script lang="ts">
export default {
  name: 'UserLogin',
  methods: {
    Logintoaccount() {
      // Add your login logic here
      console.log('Login button clicked');
    }
  }
}
</script>

<style scoped lang="scss">
.login {
  display: flex;
  gap: 1rem;

  button {
    background-color: rgba(255, 255, 255, 0.4);
    transform: scale(1.1);
    color: #000;
    border: none;
    border-radius: 4px;
    padding: 0.5rem 1rem;
    cursor: pointer;
    font-weight: bold;
    transition: background-color 0.3s ease;

    &:hover {
      background-color: #e6b800;
    }
  }
}
</style>
