export type SupportedLanguage = 'en' | 'pl';

export interface Translations {
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
