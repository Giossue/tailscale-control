/// <reference types="vite/client" />

import type { TailscaleApi } from "./tailscale-api";

declare global {
  interface Window {
    tailscale: TailscaleApi;
  }
}
