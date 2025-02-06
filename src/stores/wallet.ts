import { ref } from 'vue';
import { defineStore } from 'pinia';
import { Web3 } from 'web3';
export const enum WALLET_STATUS {
  NONE = 'none',
  NO_PROVIDER = 'no_provider',
  UNCONNECTED = 'unconnected',
  CONNECTED = 'connected',
  USER_DENIED = 'user_denied',
  ERROR = 'error',
}

export const useWalletStore = defineStore('wallet', () => {
  const status = ref<WALLET_STATUS>(WALLET_STATUS.NONE);
  const address = ref('');
  let web3;

  function init() {
    if (window.ethereum) {
      status.value = WALLET_STATUS.UNCONNECTED;
      web3 = new Web3(window.ethereum);
      console.log(web3);
      if (window.ethereum.selectedAddress) {
        status.value = WALLET_STATUS.CONNECTED;
        address.value = window.ethereum.selectedAddress;
      }
      web3.eth.getAccounts().then((res) => console.log(res));
      console.log('end');
    } else {
      status.value = WALLET_STATUS.NO_PROVIDER;
    }
  }
  function connect() {
    window.ethereum.request({ method: 'eth_requestAccounts' }).then((res) => {
      status.value = WALLET_STATUS.CONNECTED;
      const arr = res as string[];
      if (arr && arr[0]) {
        address.value = arr[0];
      }
    });
  }

  return { status, address, init, connect };
});
