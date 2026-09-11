const hasElectronAPI = () =>
  typeof window !== 'undefined' && !!(window as any).electronAPI;

export const secureStorage = {
  async getItem(key: string): Promise<string | null> {
    try {
      if (hasElectronAPI()) {
        return await (window as any).electronAPI.secureGet(key);
      }
      return localStorage.getItem(key);
    } catch (error) {
      console.error(`Error getting secure item ${key}:`, error);
      return null;
    }
  },

  async setItem(key: string, value: string): Promise<void> {
    try {
      if (hasElectronAPI()) {
        await (window as any).electronAPI.secureSet(key, value);
        return;
      }
      localStorage.setItem(key, value);
    } catch (error) {
      console.error(`Error setting secure item ${key}:`, error);
      throw error;
    }
  },

  async removeItem(key: string): Promise<void> {
    try {
      if (hasElectronAPI()) {
        await (window as any).electronAPI.secureDelete(key);
        return;
      }
      localStorage.removeItem(key);
    } catch (error) {
      console.error(`Error removing secure item ${key}:`, error);
      throw error;
    }
  },

  async clear(): Promise<void> {
    try {
      if (hasElectronAPI()) {
        await (window as any).electronAPI.secureClear();
        return;
      }
      localStorage.removeItem('auth_token');
      localStorage.removeItem('refresh_token');
    } catch (error) {
      console.error('Error clearing secure storage:', error);
      throw error;
    }
  },
};