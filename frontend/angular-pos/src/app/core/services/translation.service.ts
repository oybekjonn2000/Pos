import { Injectable, signal, computed } from '@angular/core';
import {
  SupportedLang,
  LanguageOption,
  SUPPORTED_LANGUAGES,
  DEFAULT_LANGUAGE,
  LANGUAGE_STORAGE_KEY
} from '../i18n/lang.types';
import { TRANSLATIONS_MAP } from '../i18n';

@Injectable({
  providedIn: 'root'
})
export class TranslationService {
  readonly currentLang = signal<SupportedLang>(this.getInitialLang());
  readonly lang = this.currentLang.asReadonly();
  readonly availableLanguages = SUPPORTED_LANGUAGES;

  readonly currentLanguageOption = computed(() => {
    const code = this.currentLang();
    return SUPPORTED_LANGUAGES.find(l => l.code === code) || SUPPORTED_LANGUAGES[0];
  });

  readonly currencySymbol = computed(() => {
    switch (this.currentLang()) {
      case 'uz': return "so'm";
      case 'oz': return "сўм";
      case 'ru': return 'сум';
      case 'en': return 'UZS';
      default: return "so'm";
    }
  });

  constructor() {
    this.applyLanguageToDom(this.currentLang());
  }

  getInitialLang(): SupportedLang {
    try {
      const saved = localStorage.getItem(LANGUAGE_STORAGE_KEY);
      if (saved === 'uz' || saved === 'oz' || saved === 'ru' || saved === 'en') {
        return saved as SupportedLang;
      }
    } catch (e) {
      console.warn('Could not read language from localStorage', e);
    }
    return DEFAULT_LANGUAGE; // Default is explicitly 'uz' as requested
  }

  setLanguage(lang: SupportedLang): void {
    if (this.currentLang() === lang) return;
    this.currentLang.set(lang);
    try {
      localStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
    } catch (e) {
      console.warn('Could not save language to localStorage', e);
    }
    this.applyLanguageToDom(lang);

    // Notify any external listeners (Electron, mobile webview, etc.)
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('pos:language-changed', { detail: { lang } }));
    }
  }

  private applyLanguageToDom(lang: SupportedLang): void {
    if (typeof document !== 'undefined') {
      document.documentElement.lang = lang;
    }
  }

  /**
   * Translate a dot-notated key. Fallback order: current language -> 'uz' -> key itself.
   */
  t(key: string, params?: Record<string, any>): string {
    if (!key) return '';

    const lang = this.currentLang();
    let text = this.resolveKey(lang, key);

    // Fallback to default language 'uz' if translation missing in current lang
    if (text === undefined && lang !== DEFAULT_LANGUAGE) {
      text = this.resolveKey(DEFAULT_LANGUAGE, key);
    }

    if (text === undefined) {
      console.warn(`[i18n] Missing translation for key "${key}" in language "${lang}"`);
      // Return readable tail of the key
      const parts = key.split('.');
      return parts[parts.length - 1] || key;
    }

    if (params && typeof text === 'string') {
      text = this.interpolate(text, params);
    }

    return text;
  }

  
  has(key: string): boolean {
    if (!key || typeof key !== 'string') return false;
    return this.resolveKey(this.currentLang(), key) !== undefined || this.resolveKey(DEFAULT_LANGUAGE, key) !== undefined;
  }

  translateMessageOrKey(msg: string): string {
    if (!msg || typeof msg !== 'string') return msg;
    if (this.has(msg)) {
      return this.t(msg);
    }
    const lower = msg.toLowerCase().trim();
    if (lower.includes('muvaffaqiyatli saqlandi') || lower.includes('saqlandi')) {
      return this.t('toast.saved');
    }
    if (lower.includes("muvaffaqiyatli o'chirildi") || lower.includes("o'chirildi")) {
      return this.t('toast.deleted');
    }
    if (lower.includes('muvaffaqiyatli yangilandi') || lower.includes('yangilandi')) {
      return this.t('toast.updated');
    }
    if (lower.includes('xatolik')) {
      return this.t('toast.errorOccurred');
    }
    if (lower.includes('aloqa uzildi') || lower.includes("aloqa yo'q")) {
      return this.t('toast.connectionLost');
    }
    if (lower.includes("to'lov muvaffaqiyatli")) {
      return this.t('orders.paymentSuccess');
    }
    return msg;
  }

  instant(key: string, params?: Record<string, any>): string {
    return this.t(key, params);
  }

  private resolveKey(lang: SupportedLang, key: string): string | undefined {
    const dict = TRANSLATIONS_MAP[lang];
    if (!dict) return undefined;

    const parts = key.split('.');
    let curr: any = dict;
    for (const p of parts) {
      if (curr && typeof curr === 'object' && p in curr) {
        curr = curr[p];
      } else {
        return undefined;
      }
    }
    return typeof curr === 'string' ? curr : undefined;
  }

  private interpolate(text: string, params: Record<string, any>): string {
    return text.replace(/{{\s*([\w]+)\s*}}|{\s*([\w]+)\s*}|:([\w]+)/g, (match, p1, p2, p3) => {
      const paramName = p1 || p2 || p3;
      return paramName in params ? String(params[paramName]) : match;
    });
  }

  formatCurrency(amount: number): string {
    const num = Math.round(amount || 0);
    const formatted = num.toLocaleString(this.getLocaleString());
    return `${formatted} ${this.currencySymbol()}`;
  }

  formatDate(dateInput: Date | string | number): string {
    if (!dateInput) return '';
    const date = new Date(dateInput);
    if (isNaN(date.getTime())) return '';

    const lang = this.currentLang();
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();

    if (lang === 'en') {
      return `${month}/${day}/${year}`;
    }
    return `${day}.${month}.${year}`;
  }

  formatDateTime(dateInput: Date | string | number): string {
    if (!dateInput) return '';
    const date = new Date(dateInput);
    if (isNaN(date.getTime())) return '';

    const dateStr = this.formatDate(date);
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${dateStr} ${hours}:${minutes}`;
  }

  private getLocaleString(): string {
    switch (this.currentLang()) {
      case 'uz': return 'uz-UZ';
      case 'ru': return 'ru-RU';
      case 'en': return 'en-US';
      default: return 'uz-UZ';
    }
  }
}
