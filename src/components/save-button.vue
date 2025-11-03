<template>
  <div class="button-wrapper">
    <button class="confirm-button" role="button">Save Details</button>
  </div>
</template>
<<<<<<< HEAD
<script lang="ts">
export default {
  name: 'ConfirmButton',
};
</script>

<style lang="scss">
@use '../styles/utils/mixins' as *;
=======
<style>
.button-wrapper {
  width: 100%;
  display: flex;
  justify-content: flex-end;
}

@media (max-width: 768px) {
  .button-wrapper {
    justify-content: stretch;
  }
}
>>>>>>> origin/bugofblog-wy

.confirm-button {
  align-items: center;
  appearance: none;
  background-color: #fcfcfd;
  border-radius: 4px;
  border-width: 0;
  box-shadow:
    rgba(45, 35, 66, 0.4) 0 2px 4px,
    rgba(45, 35, 66, 0.3) 0 7px 13px -3px,
    #d6d6e7 0 -3px 0 inset;
  box-sizing: border-box;
  color: #36395a;
  cursor: pointer;
  display: inline-flex;
  font-family: 'JetBrains Mono', monospace;
  height: 58px;
  justify-content: center;
  line-height: 1;
  list-style: none;
  overflow: hidden;
  padding-left: 176px;
  padding-right: 176px;
  position: relative;
  text-align: center;
  text-decoration: none;
  transition:
    box-shadow 0.15s,
    transform 0.15s;
  user-select: none;
  -webkit-user-select: none;
  touch-action: manipulation;
  white-space: nowrap;
  will-change: box-shadow, transform;
  font-size: 18px;

  @include screen-mobile {
    padding-left: 20px;
    padding-right: 20px;
    margin-right: 30px;
  }
}

@media (max-width: 768px) {
  .confirm-button {
    width: 100%;
    padding-left: 20px;
    padding-right: 20px;
    font-size: 16px;
    height: 48px;
  }
}

.confirm-button:focus {
  box-shadow:
    #d6d6e7 0 0 0 1.5px inset,
    rgba(45, 35, 66, 0.4) 0 2px 4px,
    rgba(45, 35, 66, 0.3) 0 7px 13px -3px,
    #d6d6e7 0 -3px 0 inset;
}

.confirm-button:hover {
  box-shadow:
    rgba(45, 35, 66, 0.4) 0 4px 8px,
    rgba(45, 35, 66, 0.3) 0 7px 13px -3px,
    #d6d6e7 0 -3px 0 inset;
  transform: translateY(-2px);
}

.confirm-button:active {
  box-shadow: #d6d6e7 0 3px 7px inset;
  transform: translateY(2px);
}
</style>