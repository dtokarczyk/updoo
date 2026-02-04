const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

export type AccountType = "CLIENT" | "FREELANCER" | "ADMIN";

export type UserLanguage = "POLISH" | "ENGLISH";

export interface AuthUser {
  id: string;
  email: string;
  name: string | null;
  surname: string | null;
  accountType: AccountType | null;
  language: UserLanguage;
}

export interface AuthResponse {
  access_token: string;
  user: AuthUser;
}

export async function register(
  email: string,
  password: string
): Promise<AuthResponse> {
  const res = await fetch(`${API_URL}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const msg = Array.isArray(err.message) ? err.message[0] : err.message;
    throw new Error(msg ?? "Registration failed");
  }
  return res.json();
}

export interface UpdateProfilePayload {
  name?: string;
  surname?: string;
  email?: string;
  accountType?: AccountType;
  password?: string;
  language?: UserLanguage;
}

export async function updateProfile(
  payload: UpdateProfilePayload
): Promise<{ user: AuthUser }> {
  const token = getToken();
  if (!token) throw new Error("Not authenticated");
  const body: Record<string, unknown> = {};
  if (payload.name !== undefined) body.name = payload.name;
  if (payload.surname !== undefined) body.surname = payload.surname;
  if (payload.email !== undefined) body.email = payload.email;
  if (payload.accountType !== undefined) body.accountType = payload.accountType;
  if (payload.password !== undefined && payload.password.trim()) body.password = payload.password;
  if (payload.language !== undefined) body.language = payload.language;
  const res = await fetch(`${API_URL}/auth/profile`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const msg = Array.isArray(err.message) ? err.message[0] : err.message;
    throw new Error(msg ?? "Update failed");
  }
  return res.json();
}

export async function login(
  email: string,
  password: string
): Promise<AuthResponse> {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const msg = Array.isArray(err.message) ? err.message[0] : err.message;
    throw new Error(msg ?? "Login failed");
  }
  return res.json();
}

export const AUTH_TOKEN_KEY = "auth_token";
export const AUTH_USER_KEY = "auth_user";

export function setAuth(data: AuthResponse): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(AUTH_TOKEN_KEY, data.access_token);
  localStorage.setItem(AUTH_USER_KEY, JSON.stringify(data.user));
}

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(AUTH_TOKEN_KEY);
}

export function getStoredUser(): AuthUser | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(AUTH_USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

export function updateStoredUser(user: AuthUser): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
}

export function clearAuth(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(AUTH_TOKEN_KEY);
  localStorage.removeItem(AUTH_USER_KEY);
}

/** True if user has not completed onboarding (missing name or account type). */
export function needsOnboarding(user: AuthUser | null): boolean {
  return user != null && (user.name == null || user.accountType == null);
}

// Listings & categories

/** Display order: 1. Wszystkie (link only), 2. Programowanie, 3. Design, 4. Marketing, 5. Pisanie, 6. Prace biurowe, 7. Inne */
const CATEGORY_ORDER = [
  "programming",
  "design",
  "marketing",
  "writing",
  "office-working",
  "other",
];

export function sortCategoriesByOrder(categories: Category[]): Category[] {
  return [...categories].sort((a, b) => {
    const indexA = CATEGORY_ORDER.indexOf(a.slug);
    const indexB = CATEGORY_ORDER.indexOf(b.slug);
    const orderA = indexA === -1 ? CATEGORY_ORDER.length : indexA;
    const orderB = indexB === -1 ? CATEGORY_ORDER.length : indexB;
    return orderA - orderB;
  });
}

export interface Category {
  id: string;
  name: string;
  slug: string;
}

export interface Location {
  id: string;
  name: string;
  slug: string;
}

export interface Skill {
  id: string;
  name: string;
}

export interface PopularSkill extends Skill {
  /** How many listings in given category use this skill. */
  count: number;
}

export type ListingStatus = "DRAFT" | "PUBLISHED";
export type ListingLanguage = "ENGLISH" | "POLISH";
export type BillingType = "FIXED" | "HOURLY";
export type HoursPerWeek = "LESS_THAN_10" | "FROM_11_TO_20" | "FROM_21_TO_30" | "MORE_THAN_30";
export type ExperienceLevel = "JUNIOR" | "MID" | "SENIOR";
export type ProjectType = "ONE_TIME" | "CONTINUOUS";

export interface ListingAuthor {
  id: string;
  email: string;
  name: string | null;
  surname: string | null;
}

/** Display "Name Surname" or fallback to name only or email. */
export function authorDisplayName(author: ListingAuthor): string {
  const n = author.name?.trim();
  const s = author.surname?.trim();
  if (n && s) return `${n} ${s}`;
  if (n) return n;
  if (s) return s;
  return author.email || "";
}

export interface ListingSkillRelation {
  skill: Skill;
}

/** Freelancer data in application (visible only to listing author). */
export interface ListingApplicationFreelancer {
  id: string;
  email: string;
  name: string | null;
  surname: string | null;
}

/** Application as seen by listing author: full data. */
export interface ListingApplicationFull {
  id: string;
  freelancer: ListingApplicationFreelancer;
  message?: string;
  createdAt: string;
}

/** Application as seen by others: only initials. */
export interface ListingApplicationDisplay {
  id: string;
  freelancerInitials: string;
  createdAt: string;
}

export type ListingApplication =
  | ListingApplicationFull
  | ListingApplicationDisplay;

export function isApplicationFull(
  app: ListingApplication
): app is ListingApplicationFull {
  return "freelancer" in app;
}

export interface Listing {
  id: string;
  title: string;
  description: string;
  categoryId: string;
  authorId: string;
  status: ListingStatus;
  language: ListingLanguage;
  billingType: BillingType;
  hoursPerWeek: HoursPerWeek | null;
  rate: string;
  rateNegotiable?: boolean;
  currency: string;
  experienceLevel: ExperienceLevel;
  locationId: string | null;
  isRemote: boolean;
  projectType: ProjectType;
  deadline: string | null;
  createdAt: string;
  category: Category;
  author: ListingAuthor;
  location: Location | null;
  skills: ListingSkillRelation[];
  applications?: ListingApplication[];
  currentUserApplied?: boolean;
  /** Optional message of the current user's application (if freelancer applied). */
  currentUserApplicationMessage?: string;
  isFavorite?: boolean;
}

export interface PaginationInfo {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface ListingsFeedResponse {
  items: Listing[];
  pagination: PaginationInfo;
}

export async function getPopularSkillsForCategory(
  categoryId: string
): Promise<PopularSkill[]> {
  const params = new URLSearchParams();
  params.set("categoryId", categoryId);
  const res = await fetch(
    `${API_URL}/listings/popular-skills?${params.toString()}`
  );
  if (!res.ok) throw new Error("Failed to fetch popular skills");
  return res.json();
}

export async function getCategories(): Promise<Category[]> {
  const headers: HeadersInit = {};
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${API_URL}/listings/categories`, { headers });
  if (!res.ok) throw new Error("Failed to fetch categories");
  return res.json();
}

export async function getLocations(): Promise<Location[]> {
  const res = await fetch(`${API_URL}/listings/locations`);
  if (!res.ok) throw new Error("Failed to fetch locations");
  return res.json();
}

export async function getSkills(): Promise<Skill[]> {
  const res = await fetch(`${API_URL}/listings/skills`);
  if (!res.ok) throw new Error("Failed to fetch skills");
  return res.json();
}

export async function getListingsFeed(
  page: number = 1,
  pageSize: number = 15,
  categoryId?: string,
  language?: ListingLanguage | "" | undefined,
  skillIds?: string[]
): Promise<ListingsFeedResponse> {
  const params = new URLSearchParams();
  params.set("page", String(page));
  params.set("pageSize", String(pageSize));
  if (categoryId) params.set("categoryId", categoryId);
  if (language === "POLISH" || language === "ENGLISH") {
    params.set("language", language as ListingLanguage);
  }
  if (skillIds && skillIds.length > 0) {
    params.set("skillIds", skillIds.join(","));
  }
  const url = `${API_URL}/listings/feed?${params.toString()}`;
  const headers: HeadersInit = {};
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(url, { headers });
  if (!res.ok) throw new Error("Failed to fetch listings");
  return res.json();
}

export async function getListing(id: string): Promise<Listing> {
  const headers: HeadersInit = {};
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${API_URL}/listings/${id}`, { headers });
  if (!res.ok) {
    if (res.status === 404) throw new Error("Ogłoszenie nie istnieje");
    throw new Error("Failed to fetch listing");
  }
  return res.json();
}

export async function publishListing(listingId: string): Promise<Listing> {
  const token = getToken();
  if (!token) throw new Error("Not authenticated");
  const res = await fetch(`${API_URL}/listings/${listingId}/publish`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const msg = Array.isArray(err.message) ? err.message[0] : err.message;
    throw new Error(msg ?? "Failed to publish listing");
  }
  return res.json();
}

export interface CreateListingPayload {
  title: string;
  description: string;
  categoryId: string;
  language?: ListingLanguage;
  billingType: BillingType;
  hoursPerWeek?: HoursPerWeek;
  rate: number;
  rateNegotiable?: boolean;
  currency: string;
  experienceLevel: ExperienceLevel;
  locationId?: string | null;
  isRemote: boolean;
  projectType: ProjectType;
  /** Number of days to collect offers (7–30). */
  offerDays?: number;
  skillIds?: string[];
  newSkillNames?: string[];
}

export async function createListing(payload: CreateListingPayload): Promise<Listing> {
  const token = getToken();
  if (!token) throw new Error("Not authenticated");
  const res = await fetch(`${API_URL}/listings`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const msg = Array.isArray(err.message) ? err.message[0] : err.message;
    throw new Error(msg ?? "Failed to create listing");
  }
  return res.json();
}

export async function updateListing(
  id: string,
  payload: CreateListingPayload
): Promise<Listing> {
  const token = getToken();
  if (!token) throw new Error("Not authenticated");
  const res = await fetch(`${API_URL}/listings/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const msg = Array.isArray(err.message) ? err.message[0] : err.message;
    throw new Error(msg ?? "Failed to update listing");
  }
  return res.json();
}

export async function applyToListing(
  listingId: string,
  message?: string
): Promise<{ ok: boolean }> {
  const token = getToken();
  if (!token) throw new Error("Zaloguj się, aby zgłosić się do oferty");
  const res = await fetch(`${API_URL}/listings/${listingId}/apply`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ message: message?.trim() || undefined }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const msg = Array.isArray(err.message) ? err.message[0] : err.message;
    throw new Error(msg ?? "Nie udało się zgłosić do oferty");
  }
  return res.json();
}

export async function addFavorite(listingId: string): Promise<{ ok: boolean }> {
  const token = getToken();
  if (!token) throw new Error("Zaloguj się, aby zapisać ogłoszenie");
  const res = await fetch(`${API_URL}/listings/${listingId}/favorite`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const msg = Array.isArray(err.message) ? err.message[0] : err.message;
    throw new Error(msg ?? "Nie udało się dodać do ulubionych");
  }
  return res.json();
}

export async function removeFavorite(listingId: string): Promise<{ ok: boolean }> {
  const token = getToken();
  if (!token) throw new Error("Not authenticated");
  const res = await fetch(`${API_URL}/listings/${listingId}/favorite`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const msg = Array.isArray(err.message) ? err.message[0] : err.message;
    throw new Error(msg ?? "Nie udało się usunąć z ulubionych");
  }
  return res.json();
}

export async function getFavoritesListings(): Promise<Listing[]> {
  const token = getToken();
  if (!token) throw new Error("Zaloguj się, aby zobaczyć ulubione");
  const res = await fetch(`${API_URL}/listings/favorites`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Nie udało się załadować ulubionych");
  return res.json();
}
