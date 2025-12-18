import type { API } from '../preload/index';

declare global {
  interface Window {
    api: API;
  }
  
  const __APP_VERSION__: string;
}

export {};
