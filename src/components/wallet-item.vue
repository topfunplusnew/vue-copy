<template>
  <div class="wallet-item">
    <button @click="connectWallet">CONNECT WALLET</button>
  </div>
</template>

<script lang="ts">
import { ref } from 'vue';
import Web3 from 'web3';

export default {
  name: 'WalletItem',
  setup() {
    const web3 = ref<Web3 | null>(null);

    const connectWallet = async () => {
      if (window.ethereum) {
        try {
          await window.ethereum.request({ method: 'eth_requestAccounts' });
          web3.value = new Web3(window.ethereum);
          console.log('Wallet connected');
        } catch (error) {
          console.error('User denied account access');
        }
      } else {
        console.error('No Ethereum provider found');
      }
    };

    return {
      connectWallet,
    };
  },
};
</script>

<style scoped lang="scss">
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
}
</style>
