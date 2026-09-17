function getSavedServerBase(): string {
  try {
    if (typeof localStorage !== 'undefined') {
      const saved = localStorage.getItem('pos_server_url');
      if (saved && saved.trim()) {
        return saved.trim().replace(/\/+$/, '');
      }
    }
  } catch (e) { }

  if (typeof window !== 'undefined' && (window as any).__POS_SERVER_URL__) {
    return (window as any).__POS_SERVER_URL__.replace(/\/+$/, '');
  }

  return 'http://localhost:8080';
}

export const environment = {
  production: false,
  get apiUrl(): string {
    return `${getSavedServerBase()}/api`;
  },
  get wsUrl(): string {
    return `${getSavedServerBase()}/ws`;
  },
  get baseUrl(): string {
    return getSavedServerBase();
  },
  setServerUrl(url: string): void {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('pos_server_url', url.trim().replace(/\/+$/, ''));
      }
    } catch (e) { }
  },
  appVersion: '1.0.0',
  syncInterval: 30000,
  offlineSimulation: false
};
