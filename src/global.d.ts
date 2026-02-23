import type { Browser } from "webextension-polyfill";

declare global {
  const __DEV__: boolean;
  const __NAME__: string;
  const browser: Browser;

  namespace NodeJS {
    interface Global {
      __DEV__: boolean;
      __NAME__: string;
      browser: Browser;
    }
  }
}

export {};
