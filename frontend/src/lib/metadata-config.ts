import type { Locale } from "@/lib/i18n";

export interface PageMeta {
  title: string;
  description: string;
}

export interface DefaultMeta extends PageMeta {
  template: string;
}

/** Label for "all categories" in offers list (e.g. "Wszystkie" / "All"). */
export const allCategoriesLabelByLocale: Record<Locale, string> = {
  pl: "Wszystkie",
  en: "All",
};

const metadataByLocale: Record<
  Locale,
  {
    default: DefaultMeta;
    home: PageMeta;
    login: PageMeta;
    register: PageMeta;
    admin: PageMeta;
    favorites: PageMeta;
    onboarding: PageMeta;
    profileEdit: PageMeta;
    jobNew: PageMeta;
    jobEdit: PageMeta;
    offers: PageMeta;
    jobDetail: (title: string) => PageMeta;
    offersCategory: (categoryName: string, page: number) => PageMeta;
  }
> = {
  pl: {
    default: {
      title: "Oferi",
      template: "%s | Oferi",
      description:
        "Publikuj i szukaj ofert dla freelancerów. Połącz firmy z najlepszymi wykonawcami.",
    },
    home: {
      title: "Oferi - Oferty dla freelancerów | Znajdź zlecenia lub zatrudnij najlepszych",
      description:
        "Platforma łącząca firmy z freelancerami. Przeglądaj ogłoszenia, publikuj oferty i znajdź idealne zlecenie lub wykonawcę. Szybko, prosto, bez pośredników.",
    },
    login: {
      title: "Logowanie",
      description:
        "Zaloguj się do Oferi. Wprowadź adres e-mail i hasło, aby uzyskać dostęp do ofert i swojego konta.",
    },
    register: {
      title: "Rejestracja",
      description:
        "Zarejestruj się w Oferi. Załóż konto w 30 sekund i zacznij przeglądać oferty lub publikować zlecenia.",
    },
    admin: {
      title: "Panel administracyjny",
      description:
        "Panel administracyjny Oferi. Zarządzaj ofertami i generuj oferty z wykorzystaniem AI.",
    },
    favorites: {
      title: "Ulubione ogłoszenia",
      description:
        "Twoja lista ulubionych ofert w Oferi. Szybki dostęp do zapisanych ogłoszeń.",
    },
    onboarding: {
      title: "Konfiguracja konta",
      description:
        "Dokończ konfigurację konta w Oferi. Wybierz typ konta (klient lub freelancer) i uzupełnij profil.",
    },
    profileEdit: {
      title: "Edycja profilu",
      description:
        "Zmień dane profilu w Oferi: imię, nazwisko, e-mail, hasło lub domyślną wiadomość powitalną.",
    },
    jobNew: {
      title: "Nowe ogłoszenie",
      description:
        "Dodaj nowe ogłoszenie w Oferi. Wypełnij szczegóły oferty, kategorię i warunki współpracy.",
    },
    jobEdit: {
      title: "Edycja ogłoszenia",
      description:
        "Edytuj ogłoszenie w Oferi. Po zapisie oferta wróci do statusu szkicu i będzie wymagała ponownej akceptacji.",
    },
    offers: {
      title: "Ogłoszenia",
      description:
        "Przeglądaj oferty pracy dla freelancerów w Oferi. Filtruj po kategorii i języku ogłoszenia.",
    },
    jobDetail: (title: string) => ({
      title,
      description: `Szczegóły oferty: ${title}. Zobacz opis, stawkę, wymagania i zgłoś się do oferty w Oferi.`,
    }),
    offersCategory: (categoryName: string, page: number) => ({
      title: page > 1 ? `Ogłoszenia: ${categoryName} (strona ${page})` : `Ogłoszenia: ${categoryName}`,
      description: `Przeglądaj oferty w kategorii ${categoryName} w Oferi. Strona ${page}.`,
    }),
  },
  en: {
    default: {
      title: "Oferi",
      template: "%s | Oferi",
      description:
        "Publish and find freelancer job offers. Connect companies with the best contractors.",
    },
    home: {
      title: "Oferi - Freelancer Job Board | Find Gigs or Hire Top Talent",
      description:
        "The platform connecting companies with freelancers. Browse job listings, post offers, and find the perfect gig or contractor. Fast, simple, no middlemen.",
    },
    login: {
      title: "Login",
      description:
        "Log in to Oferi. Enter your email and password to access job offers and your account.",
    },
    register: {
      title: "Register",
      description:
        "Sign up for Oferi. Create an account in 30 seconds and start browsing jobs or publishing listings.",
    },
    admin: {
      title: "Admin panel",
      description:
        "Oferi admin panel. Manage job offers and generate listings with AI.",
    },
    favorites: {
      title: "Favorite jobs",
      description:
        "Your list of favorite job offers in Oferi. Quick access to saved listings.",
    },
    onboarding: {
      title: "Account setup",
      description:
        "Complete your Oferi account setup. Choose account type (client or freelancer) and fill in your profile.",
    },
    profileEdit: {
      title: "Edit profile",
      description:
        "Update your Oferi profile: name, email, password, or default welcome message.",
    },
    jobNew: {
      title: "New job listing",
      description:
        "Add a new job listing on Oferi. Fill in offer details, category, and terms.",
    },
    jobEdit: {
      title: "Edit job listing",
      description:
        "Edit your job listing on Oferi. After saving, the offer will return to draft status and require re-approval.",
    },
    offers: {
      title: "Job listings",
      description:
        "Browse freelancer job offers on Oferi. Filter by category and listing language.",
    },
    jobDetail: (title: string) => ({
      title,
      description: `Job details: ${title}. View description, rate, requirements and apply on Oferi.`,
    }),
    offersCategory: (categoryName: string, page: number) => ({
      title: page > 1 ? `Jobs: ${categoryName} (page ${page})` : `Jobs: ${categoryName}`,
      description: `Browse job offers in ${categoryName} on Oferi. Page ${page}.`,
    }),
  },
};

export function getMetadataConfig(locale: Locale) {
  return metadataByLocale[locale];
}
