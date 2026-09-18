import { Injectable, signal, computed } from '@angular/core';

export type Theme = 'light' | 'dark';

export const THEME_STORAGE_KEY = 'pos_theme';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  readonly currentTheme = signal<Theme>(this.getInitialTheme());
  readonly isDark = computed(() => this.currentTheme() === 'dark');

  constructor() {
    // Apply theme immediately on startup
    this.applyTheme(this.currentTheme());
  }

  getInitialTheme(): Theme {
    try {
      const saved = localStorage.getItem(THEME_STORAGE_KEY);
      if (saved === 'dark') {
        return 'dark';
      }
      if (saved === 'light') {
        return 'light';
      }
    } catch (e) {
      console.warn('Could not read theme from localStorage', e);
    }
    // Default theme is explicitly LIGHT
    return 'light';
  }

  setTheme(theme: Theme): void {
    if (this.currentTheme() === theme) return;
    this.currentTheme.set(theme);
    this.applyTheme(theme);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch (e) {
      console.warn('Could not save theme to localStorage', e);
    }
  }

  toggleTheme(): void {
    const nextTheme: Theme = this.isDark() ? 'light' : 'dark';
    this.setTheme(nextTheme);
  }

  private applyTheme(theme: Theme): void {
    if (typeof document === 'undefined') return;

    const root = document.documentElement;
    const body = document.body;

    root.setAttribute('data-theme', theme);
    root.style.colorScheme = theme;

    if (theme === 'dark') {
      root.classList.remove('theme-light');
      root.classList.add('theme-dark');
      if (body) {
        body.setAttribute('data-theme', 'dark');
        body.classList.remove('theme-light');
        body.classList.add('theme-dark');
      }
    } else {
      root.classList.remove('theme-dark');
      root.classList.add('theme-light');
      if (body) {
        body.setAttribute('data-theme', 'light');
        body.classList.remove('theme-dark');
        body.classList.add('theme-light');
      }
    }
  }
}
