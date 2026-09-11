export {};

declare global {
  interface Window {
    electronAPI?: {
      secureGet: (key: string) => Promise<string | null>;
      secureSet: (key: string, value: string) => Promise<void>;
      secureDelete: (key: string) => Promise<void>;
      secureClear: () => Promise<void>;
      setFullScreen: (flag: boolean) => Promise<void>;
      isFullScreen: () => Promise<boolean>;
      savePdfFromHtml: (html: string, defaultName: string) => Promise<{ canceled: boolean; filePath?: string }>;
      onFullScreenChange: (callback: (value: boolean) => void) => void;
      onBlur: (callback: () => void) => void;
      onFocus: (callback: () => void) => void;
      onMinimize: (callback: () => void) => void;
    };
  }
}