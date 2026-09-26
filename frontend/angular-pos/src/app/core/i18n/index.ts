import { UZ_TRANSLATIONS } from './uz';
import { OZ_TRANSLATIONS } from './oz';
import { RU_TRANSLATIONS } from './ru';
import { EN_TRANSLATIONS } from './en';
import { SupportedLang } from './lang.types';

export * from './lang.types';
export * from './uz';
export * from './oz';
export * from './ru';
export * from './en';

export const TRANSLATIONS_MAP: Record<SupportedLang, Record<string, any>> = {
  uz: UZ_TRANSLATIONS,
  oz: OZ_TRANSLATIONS,
  ru: RU_TRANSLATIONS,
  en: EN_TRANSLATIONS
};
