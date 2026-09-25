export type SupportedLang = 'uz' | 'ru' | 'en';

export interface LanguageOption {
  code: SupportedLang;
  name: string;
  flag: string;
}

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  { code: 'uz', name: 'O‘zbekcha', flag: '🇺🇿' },
  { code: 'ru', name: 'Русский', flag: '🇷🇺' },
  { code: 'en', name: 'English', flag: '🇬🇧' }
];

export const DEFAULT_LANGUAGE: SupportedLang = 'uz';
export const LANGUAGE_STORAGE_KEY = 'pos_language';
