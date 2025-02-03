<template>
  <div class="signup">
    <button @click="signuptoaccount">Sign Up</button>
  </div>
</template>

<script lang="ts">
export default {
  methods: {
    signuptoaccount() {
      console.log('Signup button clicked');
    }
  }
}
</script>

<style scoped lang="scss">
.signup {
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
