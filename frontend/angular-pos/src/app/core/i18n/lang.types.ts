export type SupportedLang = 'uz' | 'oz' | 'ru' | 'en';

export interface LanguageOption {
  code: SupportedLang;
  name: string;
  flag: string;
}

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  { code: 'uz', name: 'O‘zbekcha', flag: 'UZ' },
  { code: 'oz', name: 'Ўзбекча', flag: 'UZ' },
  { code: 'ru', name: 'Русский', flag: 'RU' },
  { code: 'en', name: 'English', flag: 'EN' }
];

export const DEFAULT_LANGUAGE: SupportedLang = 'uz';
export const LANGUAGE_STORAGE_KEY = 'pos_language';
