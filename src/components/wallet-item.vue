<template>
  <div class="wallet-item">
    <div v-if="status == WALLET_STATUS.CONNECTED">{{ address }}</div>
    <div v-else-if="status == WALLET_STATUS.NO_PROVIDER"><a href="https://metamask.io/download/">WALLET</a></div>
    <div v-else @click="onConnect">WALLET</div>
  </div>
</template>

<script lang="ts" setup>
import { onMounted, computed } from 'vue';
import { useWalletStore, WALLET_STATUS } from '@/stores/wallet';

const store = useWalletStore();

const status = computed(() => store.status);
const address = computed(() => maskText(store.address));

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

function maskText(text: string): string {
  return text.slice(0, 4) + "****" + text.slice(-3);
}
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
  cursor: pointer;
}
</style>