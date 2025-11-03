/// <reference types="vite/client" />

import type { MetaMaskInpageProvider } from '@metamask/providers';

declare global {
  interface Window {
    ethereum: MetaMaskInpageProvider;
  }
}

// 声明虚拟模块
declare module 'virtual:gallery' {
  const gallery: string[];
  export default gallery;
}
