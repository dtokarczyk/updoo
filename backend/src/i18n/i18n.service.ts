import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

export type SupportedLanguage = 'en' | 'pl';

interface Translations {
  validation: {
    [key: string]: string;
  };
  errors: {
    [key: string]: string;
  };
  messages?: {
    [key: string]: string;
  };
}

@Injectable()
export class I18nService {
  private translations: Map<SupportedLanguage, Translations> = new Map();

  constructor() {
    this.loadTranslations();
  }

  private loadTranslations(): void {
    const languages: SupportedLanguage[] = ['en', 'pl'];

    // Try multiple paths: dist (production), src (development), and project root
    const possiblePaths = [
      path.join(__dirname, 'translations'), // dist/src/i18n/translations or src/i18n/translations
      path.join(process.cwd(), 'dist', 'src', 'i18n', 'translations'), // Production build
      path.join(process.cwd(), 'src', 'i18n', 'translations'), // Development
    ];

    let translationsDir: string | null = null;
    for (const possiblePath of possiblePaths) {
      const testFile = path.join(possiblePath, 'en.json');
      if (fs.existsSync(testFile)) {
        translationsDir = possiblePath;
        break;
      }
    }

    if (!translationsDir) {
      console.error(`Translation directory not found. Tried:`, possiblePaths);
      return;
    }

    console.log(`Loading translations from: ${translationsDir}`);

    for (const lang of languages) {
      const filePath = path.join(translationsDir, `${lang}.json`);
      try {
        if (!fs.existsSync(filePath)) {
          console.error(`Translation file not found: ${filePath}`);
          continue;
        }
        const content = fs.readFileSync(filePath, 'utf-8');
        const parsed = JSON.parse(content);
        this.translations.set(lang, parsed);
        console.log(`✓ Loaded translations for ${lang} from ${filePath}`);
        console.log(
          `  Available keys: validation (${Object.keys(parsed.validation || {}).length}), errors (${Object.keys(parsed.errors || {}).length})`,
        );
      } catch (error) {
        console.error(
          `Failed to load translations for ${lang} from ${filePath}:`,
          error,
        );
      }
    }

    // Log summary
    const loadedLangs = Array.from(this.translations.keys());
    if (loadedLangs.length === 0) {
      console.error('⚠️  WARNING: No translations loaded!');
    } else {
      console.log(
        `✓ Successfully loaded translations for: ${loadedLangs.join(', ')}`,
      );
    }
  }

  /**
   * Parses Accept-Language header and returns language code.
   * Accepts "pl", "en", "pl-PL", "en-US", etc.
   * Returns "pl" for Polish, "en" for English, default "en" otherwise.
   */
  parseLanguageFromHeader(acceptLanguage?: string): SupportedLanguage {
    if (!acceptLanguage) return 'en';

    const normalized = acceptLanguage.toLowerCase().trim();
    const langCode = normalized.split('-')[0];

    if (langCode === 'pl') return 'pl';
    if (langCode === 'en') return 'en';

    return 'en';
  }

  /**
   * Gets translation for a key in the specified language.
   * Falls back to English if translation not found.
   */
  translate(
    key: string,
    lang: SupportedLanguage,
    params?: Record<string, string | number>,
  ): string {
    const keys = key.split('.');

    // Try requested language first
    const translations = this.translations.get(lang);
    if (translations) {
      let value: any = translations;
      let found = true;

      for (const k of keys) {
        value = value?.[k];
        if (value === undefined) {
          found = false;
          break;
        }
      }

      if (found && typeof value === 'string') {
        // Replace placeholders
        if (params) {
          return value.replace(/\{(\w+)\}/g, (match, paramKey) => {
            return params[paramKey]?.toString() || match;
          });
        }
        return value;
      }
    }

    // Fallback to English
    const enTranslations = this.translations.get('en');
    if (enTranslations) {
      let value: any = enTranslations;
      let found = true;

      for (const k of keys) {
        value = value?.[k];
        if (value === undefined) {
          found = false;
          break;
        }
      }

      if (found && typeof value === 'string') {
        // Replace placeholders
        if (params) {
          return value.replace(/\{(\w+)\}/g, (match, paramKey) => {
            return params[paramKey]?.toString() || match;
          });
        }
        return value;
      }
    }

    // If translation not found, return the key
    return key;
  }

  /**
   * Gets validation message translation.
   * @param constraint - The constraint key (e.g., 'titleRequired', 'isEmail', 'minLength')
   * @param property - The property name that failed validation
   * @param lang - The language code
   * @param customParams - Additional parameters for the translation (e.g., constraint value for minLength)
   */
  getValidationMessage(
    constraint: string,
    property: string,
    lang: SupportedLanguage,
    customParams?: Record<string, string | number>,
  ): string {
    const params = {
      property,
      constraint: customParams?.constraint?.toString() || '',
      ...customParams,
    };

    // Try specific validation key first (e.g., validation.titleRequired)
    const specificKey = `validation.${constraint}`;
    const specificMessage = this.translate(specificKey, lang, params);

    // If translation was found (not the same as key), return it
    if (specificMessage !== specificKey) {
      return specificMessage;
    }

    // Fallback to generic validation key (e.g., validation.isNotEmpty)
    // This handles cases where we have generic validators like isNotEmpty, isEmail, etc.
    const genericKey = `validation.${constraint}`;
    const genericMessage = this.translate(genericKey, lang, params);

    // If still not found, return the constraint key as fallback
    return genericMessage !== genericKey ? genericMessage : constraint;
  }
}
