declare module "electron" {
  export const app: {
    isPackaged: boolean;
    whenReady(): Promise<void>;
    on(event: "window-all-closed" | "activate", listener: () => void): void;
    quit(): void;
  };

  export class BrowserWindow {
    constructor(options: Record<string, unknown>);
    loadURL(url: string): Promise<void>;
    loadFile(path: string): Promise<void>;
    static getAllWindows(): BrowserWindow[];
  }

  export const ipcMain: {
    handle(channel: string, listener: (event: unknown, ...args: unknown[]) => unknown): void;
  };

  export const contextBridge: {
    exposeInMainWorld(apiKey: string, api: unknown): void;
  };

  export const ipcRenderer: {
    invoke(channel: string, ...args: unknown[]): Promise<unknown>;
  };
}
