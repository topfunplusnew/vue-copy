<template>
  <div class="wallet-item">
    <div v-if="status == WALLET_STATUS.CONNECTED" class="wallet-item-address" v-text="address"></div>
    <div v-else-if="status == WALLET_STATUS.NO_PROVIDER" class="wallet-item-address"><a href="https://metamask.io/download/">install MetaMask</a></div>
    <button v-else @click="onConnect">WALLET</button>
  </div>
</template>

<script lang="ts" setup>
import { onMounted, computed } from 'vue';
import { useWalletStore, WALLET_STATUS } from '@/stores/wallet';

const store = useWalletStore();

const status = computed(() => store.status);
const address = computed(() => store.address);

const WALLET_EVENT = {
  CONNECTED: 'connected',
  USER_DENIED: 'user_denied',
  NO_PROVIDER: 'no_provider',
} as const;

const emit = defineEmits<{
  (e: 'connected', address: string): void;
  (e: 'user_denied'): void;
  (e: 'no_provider'): void;
}>();

function onConnect() {
  store.connect();
  emit(WALLET_EVENT.CONNECTED, address.value);
}

onMounted(() => {
  try {
    store.init();
  } catch (e) {
    console.log(e);
  }
});
</script>

<style lang="scss">
.wallet-item {
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
  &-address {
    display: inline-block;
  }
}
</style>
