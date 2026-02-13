# Audyt SEO – frontend Hoplo

Data: 2025-02-13  
Ostatnia weryfikacja kodu: 2025-02-13

## Podsumowanie

| Obszar | Status | Uwagi |
|--------|--------|--------|
| Metadata (title, description) | ✅ OK | Centralna konfiguracja, locale, szablony |
| Open Graph | ✅ OK | Root: domyślny `/og-fallback.png`. Ogłoszenia: obraz z API (w prod: publiczny NEXT_PUBLIC_API_URL). |
| Twitter Cards | ✅ OK | Root layout + job layout (summary_large_image). |
| robots.txt | ✅ OK | `app/robots.ts` – allow /, disallow admin/my/profile/login/register/onboarding/job/new|edit, sitemap + host. |
| sitemap.xml | ✅ OK | `app/sitemap.ts` – home, /jobs/all/1, /jobs/{category}/1 dla każdej kategorii. |
| Viewport | ✅ OK | Bez `userScalable`/`maximumScale` – zoom dozwolony (dostępność, mobile usability). |
| Obrazy (alt) | ✅ OK | OG preview: `alt={job.title}`; cover firmy: opisowy alt; avatary: `alt=""` (dekoracyjne). |
| Nagłówki (h1) | ✅ OK | Jedno h1 na stronę, sensowne hierarchie |
| JSON-LD (structured data) | ✅ OK | JobPosting + hiringOrganization na /job/[slugId] (`JobPostingJsonLd.tsx`). |
| Canonical | ⚠️ Opcjonalnie | Przydatne przy paginacji i duplikatach |
| Język (lang) | ✅ OK | `html lang={locale}` (pl/en) |

---

## 1. Metadata (title, description)

**Status: OK**

- Root layout: `generateMetadata()` z `metadataBase`, `title` (default + template), `description`, `openGraph`.
- Wszystkie główne ścieżki mają własne metadata w layoutach (login, register, job/[slugId], offers, jobs/[category]/[page], my, profile, admin itd.).
- Konfiguracja w `src/lib/metadata-config.ts` z wersjami PL/EN.
- Strona ogłoszenia: dynamiczny tytuł i opis z API.

---

## 2. Open Graph i Twitter

**Status: OK (zweryfikowano)**

- **Root layout:** `openGraph.images` z `/og-fallback.png` (1200×630), `twitter.card: summary_large_image`, title, description. Plik `public/og-fallback.png` jest w projekcie.
- **Job layout:** OG i Twitter (title, description, image). Obraz OG: `${API_URL}/jobs/${id}/og-image`. W produkcji `NEXT_PUBLIC_API_URL` musi być publiczny (np. api.hoplo.pl), żeby crawlery i udostępnianie widziały obraz ogłoszenia.
- **Fallback przy 404 ogłoszenia:** job layout zwraca metadata ofert z `/og-fallback.png`.

---

## 3. robots.txt i sitemap.xml

**Status: OK (zweryfikowano)**

- **`app/robots.ts`:** `allow: /`, `disallow`: /admin, /my, /profile, /login, /register, /onboarding, /job/new, /job/*/edit. `sitemap` i `host` z `NEXT_PUBLIC_APP_URL` (domyślnie https://hoplo.pl).
- **`app/sitemap.ts`:** wpisy dla `/`, `/jobs/all/1`, `/jobs/{category}/1` dla każdej kategorii z `getCategoriesServer()`. Opcjonalnie na przyszłość: dynamiczna lista URL-i ogłoszeń z API.

---

## 4. Viewport

**Status: OK (zweryfikowano)**

W `layout.tsx`:

```ts
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  // Allow zoom for accessibility (WCAG) and better mobile usability / SEO
};
```

- Brak `maximumScale` i `userScalable: false` – zoom jest dozwolony (dostępność, mobile usability, SEO).

---

## 5. Obrazy – atrybut `alt`

**Status: OK (zweryfikowano)**

- **JobDetailClient:** podgląd OG ma `alt={job.title}`. Avatar autora: `alt=""` (dekoracyjny, obok jest imię).  
- **company/[slug]:** cover photo ma opisowy alt (np. „Cover photo for {profile.name}”).  
- **CoverPhotoUpload, login, register:** `alt=""` – przyjmowane jako dekoracyjne; w razie potrzeby dodać opis przy logo.  
- Avatary z pustym `alt` są akceptowalne przy tekście w kontekście.

---

## 6. Nagłówki (h1)

**Status: OK**

- Strona główna: h1 w HeroBanner.  
- Ogłoszenie: h1 z tytułem w JobDetailClient.  
- Firma: h1 z nazwą profilu (lub „Profil nie znaleziony”).  
- My, profile, applications, jobs, favorites: po jednym h1 na widok.  
Hierarchia jest spójna.

---

## 7. JSON-LD (structured data)

**Status: Ogłoszenia – wdrożone**

- Na `/job/[slugId]`: komponent `JobPostingJsonLd` renderuje `<script type="application/ld+json">` z pełnym schematem **JobPosting** (tytuł, opis, datePosted, hiringOrganization, jobLocation, baseSalary, employmentType, validThrough, directApply, url). **hiringOrganization** to Organization z nazwą autora oferty.
- Ogłoszenia w statusie PUBLISHED mają pełne dane strukturalne dla Google Job Search.
- **Opcjonalnie (niski priorytet):** WebSite + Organization na stronie głównej – mniej kontekstu dla wyszukiwarki.

---

## 8. Canonical i hreflang

**Status: Opcjonalne**

- **Canonical:** Nie ustawiane. Przydatne przy: paginacji (`/jobs/all/2` → canonical na siebie), ewentualnie wersji mobile/desktop jeśli URL się różnią (u was pewnie ten sam URL).
- **hreflang:** Język wybierany jest przez cookie/localStorage (ta sama ścieżka dla pl/en). Dla jednego URL z wyborem języka hreflang jest trudniejszy (zazwyczaj stosuje się przy osobnych URL-e, np. /en/, /pl/). Można dodać `x-default` w metadata, ale nie jest to krytyczne.

---

## 9. Język i locale

**Status: OK**

- `<html lang={locale}>` ustawione (pl/en).  
- `getLocaleFromRequest()` używane w layoutach do metadata i treści.

---

## 10. Inne

- **Strona 404:** Warto sprawdzić, czy jest custom 404 z sensownym tytułem i meta (np. `notFound()` + layout lub `not-found.tsx`).  
- **Performance:** Obrazy przez `next/image` z `remotePatterns` – dobre dla LCP.  
- **Semantyka:** `<main>`, sekcje, nagłówki – wyglądają poprawnie.

---

## Plan wdrożenia (krótki)

1. **Wysoki priorytet** ✅ Zrobione (zweryfikowano 2025-02-13)  
   - ✅ `app/robots.ts` i `app/sitemap.ts` – działają, poprawne reguły i wpisy.  
   - ✅ Viewport: tylko `width` + `initialScale`, zoom dozwolony.  
   - ✅ Root metadata: domyślny OG image (`/og-fallback.png`) i Twitter card.  
   - ✅ Plik `public/og-fallback.png` (1200×630 px) – upewnij się, że jest w repo (commit) przed wdrożeniem.  
   - W produkcji: `NEXT_PUBLIC_API_URL` musi być publiczny (np. api.hoplo.pl), żeby OG image ogłoszeń działał przy udostępnianiu.

2. **Średni priorytet** ✅ Zrobione  
   - ✅ Opisowe `alt` dla cover photo (firma) i podglądu OG (ogłoszenie).  
   - ✅ JSON-LD JobPosting + hiringOrganization na stronie ogłoszenia (`JobPostingJsonLd.tsx`).

3. **Niski priorytet** (opcjonalnie)  
   - Canonical przy paginacji.  
   - WebSite/Organization JSON-LD na stronie głównej.
