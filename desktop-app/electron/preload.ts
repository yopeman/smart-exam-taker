import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  secureGet: (key: string) => ipcRenderer.invoke('secure:get', key),
  secureSet: (key: string, value: string) => ipcRenderer.invoke('secure:set', key, value),
  secureDelete: (key: string) => ipcRenderer.invoke('secure:delete', key),
  secureClear: () => ipcRenderer.invoke('secure:clear'),
  setFullScreen: (flag: boolean) => ipcRenderer.invoke('window:set-fullscreen', flag),
  isFullScreen: () => ipcRenderer.invoke('window:is-fullscreen'),
  savePdfFromHtml: (html: string, defaultName: string) =>
    ipcRenderer.invoke('pdf:save-html', html, defaultName),
  onFullScreenChange: (callback: (value: boolean) => void) => {
    ipcRenderer.on('window:fullscreen-changed', (_event, value: boolean) => callback(value));
  },
  onBlur: (callback: () => void) => {
    ipcRenderer.on('window:blur', () => callback());
  },
  onFocus: (callback: () => void) => {
    ipcRenderer.on('window:focus', () => callback());
  },
  onMinimize: (callback: () => void) => {
    ipcRenderer.on('window:minimize', () => callback());
  },
});