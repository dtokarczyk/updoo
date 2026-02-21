import { PROJECT_NAME } from '@/constants';
import type { Locale } from '@/lib/i18n';

export interface PageMeta {
  title: string;
  description: string;
}

export interface DefaultMeta extends PageMeta {
  template: string;
}

/** Label for "all categories" in offers list (e.g. "Wszystkie" / "All"). */
export const allCategoriesLabelByLocale: Record<Locale, string> = {
  pl: 'Wszystkie',
  en: 'All',
};

const metadataByLocale: Record<
  Locale,
  {
    default: DefaultMeta;
    home: PageMeta;
    login: PageMeta;
    forgotPassword: PageMeta;
    resetPassword: PageMeta;
    register: PageMeta;
    admin: PageMeta;
    favorites: PageMeta;
    my: PageMeta;
    onboarding: PageMeta;
    profileEdit: PageMeta;
    profileCreate: PageMeta;
    jobNew: PageMeta;
    jobEdit: PageMeta;
    offers: PageMeta;
    jobDetail: (title: string) => PageMeta;
    offersCategory: (categoryName: string, page: number) => PageMeta;
    companyList: PageMeta;
    blog: PageMeta;
    blogPost: (title: string) => PageMeta;
  }
> = {
  pl: {
    default: {
      title: PROJECT_NAME,
      template: `%s | ${PROJECT_NAME}`,
      description:
        'Publikuj i szukaj ofert dla freelancerów. Połącz firmy z najlepszymi wykonawcami.',
    },
    home: {
      title: 'Praca Online i zlecenia dla freelancerów',
      description:
        'Zlecenia dla firm i freelancerów w jednym miejscu. Publikuj projekty, zbieraj oferty i współpracuj ze sprawdzonymi specjalistami.',
    },
    login: {
      title: 'Logowanie',
      description: `Zaloguj się do ${PROJECT_NAME}. Wprowadź adres e-mail i hasło, aby uzyskać dostęp do ofert i swojego konta.`,
    },
    forgotPassword: {
      title: 'Odzyskiwanie hasła',
      description:
        'Wprowadź adres e-mail powiązany z kontem. Wyślemy link do ustawienia nowego hasła.',
    },
    resetPassword: {
      title: 'Ustaw nowe hasło',
      description: `Wprowadź nowe hasło do konta w ${PROJECT_NAME}.`,
    },
    register: {
      title: 'Rejestracja',
      description: `Zarejestruj się w ${PROJECT_NAME}. Załóż konto w 30 sekund i zacznij przeglądać oferty lub publikować zlecenia.`,
    },
    admin: {
      title: 'Panel administracyjny',
      description: `Panel administracyjny ${PROJECT_NAME}. Zarządzaj ofertami i generuj oferty z wykorzystaniem AI.`,
    },
    favorites: {
      title: 'Ulubione ogłoszenia',
      description: `Twoja lista ulubionych ofert w ${PROJECT_NAME}. Szybki dostęp do zapisanych ogłoszeń.`,
    },
    my: {
      title: 'Moje',
      description: `Twoje ostatnie aplikacje i ulubione oferty w ${PROJECT_NAME}.`,
    },
    onboarding: {
      title: 'Konfiguracja konta',
      description: `Dokończ konfigurację konta w ${PROJECT_NAME}. Wybierz typ konta (klient lub freelancer) i uzupełnij profil.`,
    },
    profileEdit: {
      title: 'Edycja profilu',
      description: `Zmień dane profilu w ${PROJECT_NAME}: imię, nazwisko, e-mail, hasło lub domyślną wiadomość powitalną.`,
    },
    profileCreate: {
      title: 'Załóż profil wykonawcy',
      description: `Utwórz profil firmy lub osoby prywatnej w ${PROJECT_NAME}. Po weryfikacji profil będzie widoczny publicznie.`,
    },
    jobNew: {
      title: 'Nowe ogłoszenie',
      description: `Dodaj nowe ogłoszenie w ${PROJECT_NAME}. Wypełnij szczegóły oferty, kategorię i warunki współpracy.`,
    },
    jobEdit: {
      title: 'Edycja ogłoszenia',
      description: `Edytuj ogłoszenie w ${PROJECT_NAME}. Po zapisie oferta wróci do statusu szkicu i będzie wymagała ponownej akceptacji.`,
    },
    offers: {
      title: 'Ogłoszenia',
      description: `Przeglądaj oferty pracy dla freelancerów w ${PROJECT_NAME}. Filtruj po kategorii i języku ogłoszenia.`,
    },
    jobDetail: (title: string) => ({
      title,
      description: `Szczegóły oferty: ${title}. Zobacz opis, stawkę, wymagania i zgłoś się do oferty w ${PROJECT_NAME}.`,
    }),
    offersCategory: (categoryName: string, page: number) => ({
      title:
        page > 1
          ? `Ogłoszenia: ${categoryName} (strona ${page})`
          : `Ogłoszenia: ${categoryName}`,
      description: `Przeglądaj oferty w kategorii ${categoryName} w ${PROJECT_NAME}. Strona ${page}.`,
    }),
    companyList: {
      title: 'Wizytówki',
      description: `Lista zweryfikowanych wizytówek wykonawców i firm w ${PROJECT_NAME}.`,
    },
    blog: {
      title: `Blog - ${PROJECT_NAME}`,
      description:
        'Odkryj najnowsze artykuły i poradniki. Wiedza o zleceniach i freelancingu.',
    },
    blogPost: (title: string) => ({
      title: `${title} | Blog - ${PROJECT_NAME}`,
      description: `Przeczytaj wpis na blogu: ${title}.`,
    }),
  },
  en: {
    default: {
      title: PROJECT_NAME,
      template: `%s | ${PROJECT_NAME}`,
      description:
        'Publish and find freelancer job offers. Connect companies with the best contractors.',
    },
    home: {
      title: `${PROJECT_NAME} - Freelancer Job Board | Find Gigs or Hire Top Talent`,
      description:
        'The platform connecting companies with freelancers. Browse job listings, post offers, and find the perfect gig or contractor. Fast, simple, no middlemen.',
    },
    login: {
      title: 'Login',
      description: `Log in to ${PROJECT_NAME}. Enter your email and password to access job offers and your account.`,
    },
    forgotPassword: {
      title: 'Forgot password',
      description:
        'Enter the email address associated with your account. We will send you a link to set a new password.',
    },
    resetPassword: {
      title: 'Set new password',
      description: `Enter your new password for your ${PROJECT_NAME} account.`,
    },
    register: {
      title: 'Register',
      description: `Sign up for ${PROJECT_NAME}. Create an account in 30 seconds and start browsing jobs or publishing listings.`,
    },
    admin: {
      title: 'Admin panel',
      description: `${PROJECT_NAME} admin panel. Manage job offers and generate listings with AI.`,
    },
    favorites: {
      title: 'Favorite jobs',
      description: `Your list of favorite job offers in ${PROJECT_NAME}. Quick access to saved listings.`,
    },
    my: {
      title: 'My',
      description: `Your recent applications and favorite offers on ${PROJECT_NAME}.`,
    },
    onboarding: {
      title: 'Account setup',
      description: `Complete your ${PROJECT_NAME} account setup. Choose account type (client or freelancer) and fill in your profile.`,
    },
    profileEdit: {
      title: 'Edit profile',
      description: `Update your ${PROJECT_NAME} profile: name, email, password, or default welcome message.`,
    },
    profileCreate: {
      title: 'Create contractor profile',
      description: `Create a company or individual profile on ${PROJECT_NAME}. After verification the profile will be publicly visible.`,
    },
    jobNew: {
      title: 'New job listing',
      description: `Add a new job listing on ${PROJECT_NAME}. Fill in offer details, category, and terms.`,
    },
    jobEdit: {
      title: 'Edit job listing',
      description: `Edit your job listing on ${PROJECT_NAME}. After saving, the offer will return to draft status and require re-approval.`,
    },
    offers: {
      title: 'Job listings',
      description: `Browse freelancer job offers on ${PROJECT_NAME}. Filter by category and listing language.`,
    },
    jobDetail: (title: string) => ({
      title,
      description: `Job details: ${title}. View description, rate, requirements and apply on ${PROJECT_NAME}.`,
    }),
    offersCategory: (categoryName: string, page: number) => ({
      title:
        page > 1
          ? `Jobs: ${categoryName} (page ${page})`
          : `Jobs: ${categoryName}`,
      description: `Browse job offers in ${categoryName} on ${PROJECT_NAME}. Page ${page}.`,
    }),
    companyList: {
      title: 'Visiting cards',
      description: `List of verified visiting cards of contractors and companies on ${PROJECT_NAME}.`,
    },
    blog: {
      title: `Blog - ${PROJECT_NAME}`,
      description:
        'Discover the latest articles and guides. Knowledge about gigs and freelancing.',
    },
    blogPost: (title: string) => ({
      title: `${title} | Blog - ${PROJECT_NAME}`,
      description: `Read blog post: ${title}.`,
    }),
  },
};

export function getMetadataConfig(locale: Locale) {
  return metadataByLocale[locale];
}

/** Base Open Graph fields required by validators (og:url, og:type). Use in generateMetadata openGraph to avoid missing required props when overriding. */
export function getDefaultOpenGraph(
  baseUrl: string,
  path = '/',
): { url: string; type: 'website' } {
  const base = baseUrl.replace(/\/$/, '');
  const pathNorm = path.startsWith('/') ? path : `/${path}`;
  return {
    url: pathNorm === '/' ? base : `${base}${pathNorm}`,
    type: 'website',
  };
}
