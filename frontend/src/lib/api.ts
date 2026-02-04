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
  /** Default message for freelancer applications (with portfolio links). */
  defaultMessage?: string | null;
  /** Skills directly attached to freelancer account. */
  skills?: Skill[];
}

export interface AuthResponse {
  access_token: string;
  user: AuthUser;
}

export async function register(
  email: string,
  password: string,
  confirmPassword: string,
  termsAccepted: boolean
): Promise<AuthResponse> {
  const headers: HeadersInit = { "Content-Type": "application/json" };

  // Add Accept-Language header based on user locale
  if (typeof window !== "undefined") {
    const { getUserLocale } = await import("./i18n");
    const locale = getUserLocale();
    headers["Accept-Language"] = locale;
  }

  const res = await fetch(`${API_URL}/auth/register`, {
    method: "POST",
    headers,
    body: JSON.stringify({ email, password, confirmPassword, termsAccepted }),
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
  /** Current password, required when changing password. */
  oldPassword?: string;
  language?: UserLanguage;
  /** When provided, replaces freelancer skills on the account. */
  skillIds?: string[];
  /** Default message for freelancer applications (with portfolio links). */
  defaultMessage?: string;
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
  if (payload.password !== undefined && payload.password.trim())
    body.password = payload.password;
  if (payload.oldPassword !== undefined && payload.oldPassword.trim())
    body.oldPassword = payload.oldPassword;
  if (payload.language !== undefined) body.language = payload.language;
  if (payload.skillIds !== undefined) body.skillIds = payload.skillIds;
  if (payload.defaultMessage !== undefined) body.defaultMessage = payload.defaultMessage;

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };

  // Add Accept-Language header based on user locale
  if (typeof window !== "undefined") {
    const { getUserLocale } = await import("./i18n");
    const locale = getUserLocale();
    headers["Accept-Language"] = locale;
  }

  const res = await fetch(`${API_URL}/auth/profile`, {
    method: "PATCH",
    headers,
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
  const headers: HeadersInit = { "Content-Type": "application/json" };

  // Add Accept-Language header based on user locale
  if (typeof window !== "undefined") {
    const { getUserLocale } = await import("./i18n");
    const locale = getUserLocale();
    headers["Accept-Language"] = locale;
  }

  const res = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers,
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
  if (user == null) return false;
  if (user.name == null || user.accountType == null) return true;
  if (user.accountType === "FREELANCER") {
    const skillsCount = user.skills?.length ?? 0;
    if (skillsCount === 0) return true;
    // Check if defaultMessage is missing (null or empty string)
    if (user.defaultMessage == null || user.defaultMessage.trim() === "") return true;
  }
  return false;
}

// Jobs & categories

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
  /** How many jobs in given category use this skill. */
  count: number;
}

export type JobStatus = "DRAFT" | "PUBLISHED";
export type JobLanguage = "ENGLISH" | "POLISH";
export type BillingType = "FIXED" | "HOURLY";
export type HoursPerWeek = "LESS_THAN_10" | "FROM_11_TO_20" | "FROM_21_TO_30" | "MORE_THAN_30";
export type ExperienceLevel = "JUNIOR" | "MID" | "SENIOR";
export type ProjectType = "ONE_TIME" | "CONTINUOUS";

export interface JobAuthor {
  id: string;
  email: string;
  name: string | null;
  surname: string | null;
}

/** Display "Name Surname" or fallback to name only or email. */
export function authorDisplayName(author: JobAuthor): string {
  const n = author.name?.trim();
  const s = author.surname?.trim();
  if (n && s) return `${n} ${s}`;
  if (n) return n;
  if (s) return s;
  return author.email || "";
}

export interface JobSkillRelation {
  skill: Skill;
}

/** Freelancer data in application (visible only to job author). */
export interface JobApplicationFreelancer {
  id: string;
  email: string;
  name: string | null;
  surname: string | null;
}

/** Application as seen by job author: full data. */
export interface JobApplicationFull {
  id: string;
  freelancer: JobApplicationFreelancer;
  message?: string;
  createdAt: string;
}

/** Application as seen by others: only initials. */
export interface JobApplicationDisplay {
  id: string;
  freelancerInitials: string;
  createdAt: string;
}

export type JobApplication =
  | JobApplicationFull
  | JobApplicationDisplay;

export function isApplicationFull(
  app: JobApplication
): app is JobApplicationFull {
  return "freelancer" in app;
}

export interface Job {
  id: string;
  title: string;
  description: string;
  categoryId: string;
  authorId: string;
  status: JobStatus;
  language: JobLanguage;
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
  author: JobAuthor;
  location: Location | null;
  skills: JobSkillRelation[];
  applications?: JobApplication[];
  currentUserApplied?: boolean;
  /** Optional message of the current user's application (if freelancer applied). */
  currentUserApplicationMessage?: string;
  isFavorite?: boolean;
  /** Number of applications for this job */
  applicationsCount?: number;
}

export interface PaginationInfo {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface JobsFeedResponse {
  items: Job[];
  pagination: PaginationInfo;
}

export async function getPopularSkillsForCategory(
  categoryId: string
): Promise<PopularSkill[]> {
  const params = new URLSearchParams();
  params.set("categoryId", categoryId);
  const res = await fetch(
    `${API_URL}/jobs/popular-skills?${params.toString()}`
  );
  if (!res.ok) throw new Error("Failed to fetch popular skills");
  return res.json();
}

export async function getCategories(): Promise<Category[]> {
  const headers: HeadersInit = {};
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  // Add Accept-Language header based on user locale
  if (typeof window !== "undefined") {
    const { getUserLocale } = await import("./i18n");
    const locale = getUserLocale();
    headers["Accept-Language"] = locale;
  }

  const res = await fetch(`${API_URL}/jobs/categories`, { headers });
  if (!res.ok) throw new Error("Failed to fetch categories");
  return res.json();
}

export async function getLocations(): Promise<Location[]> {
  const res = await fetch(`${API_URL}/jobs/locations`);
  if (!res.ok) throw new Error("Failed to fetch locations");
  return res.json();
}

export async function getSkills(): Promise<Skill[]> {
  const res = await fetch(`${API_URL}/jobs/skills`);
  if (!res.ok) throw new Error("Failed to fetch skills");
  return res.json();
}

export async function getJobsFeed(
  page: number = 1,
  pageSize: number = 15,
  categoryId?: string,
  language?: JobLanguage | "" | undefined,
  skillIds?: string[]
): Promise<JobsFeedResponse> {
  const params = new URLSearchParams();
  params.set("page", String(page));
  params.set("pageSize", String(pageSize));
  if (categoryId) params.set("categoryId", categoryId);
  if (language === "POLISH" || language === "ENGLISH") {
    params.set("language", language as JobLanguage);
  }
  if (skillIds && skillIds.length > 0) {
    params.set("skillIds", skillIds.join(","));
  }
  const url = `${API_URL}/jobs/feed?${params.toString()}`;
  const headers: HeadersInit = {};
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  // Add Accept-Language header based on user locale
  if (typeof window !== "undefined") {
    const { getUserLocale } = await import("./i18n");
    const locale = getUserLocale();
    headers["Accept-Language"] = locale;
  }

  const res = await fetch(url, { headers });
  if (!res.ok) throw new Error("Failed to fetch jobs");
  return res.json();
}

export async function getJob(id: string): Promise<Job> {
  const headers: HeadersInit = {};
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  // Add Accept-Language header based on user locale
  if (typeof window !== "undefined") {
    const { getUserLocale } = await import("./i18n");
    const locale = getUserLocale();
    headers["Accept-Language"] = locale;
  }

  const res = await fetch(`${API_URL}/jobs/${id}`, { headers });
  if (!res.ok) {
    if (res.status === 404) throw new Error("Oferta nie istnieje");
    throw new Error("Failed to fetch job");
  }
  return res.json();
}

export interface JobPrevNext {
  prev: { id: string; title: string } | null;
  next: { id: string; title: string } | null;
}

export async function getJobPrevNext(id: string): Promise<JobPrevNext> {
  const headers: HeadersInit = {};
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  // Add Accept-Language header based on user locale
  if (typeof window !== "undefined") {
    const { getUserLocale } = await import("./i18n");
    const locale = getUserLocale();
    headers["Accept-Language"] = locale;
  }

  const res = await fetch(`${API_URL}/jobs/${id}/prev-next`, { headers });
  if (!res.ok) {
    if (res.status === 404) throw new Error("Oferta nie istnieje");
    throw new Error("Failed to fetch prev/next jobs");
  }
  return res.json();
}

export async function publishJob(jobId: string): Promise<Job> {
  const token = getToken();
  if (!token) throw new Error("Not authenticated");
  const res = await fetch(`${API_URL}/jobs/${jobId}/publish`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const msg = Array.isArray(err.message) ? err.message[0] : err.message;
    throw new Error(msg ?? "Failed to publish job");
  }
  return res.json();
}

export interface CreateJobPayload {
  title: string;
  description: string;
  categoryId: string;
  language?: JobLanguage;
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

export async function createJob(payload: CreateJobPayload): Promise<Job> {
  const token = getToken();
  if (!token) throw new Error("Not authenticated");

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };

  // Add Accept-Language header based on user locale
  if (typeof window !== "undefined") {
    const { getUserLocale } = await import("./i18n");
    const locale = getUserLocale();
    headers["Accept-Language"] = locale;
  }

  const res = await fetch(`${API_URL}/jobs`, {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const msg = Array.isArray(err.message) ? err.message[0] : err.message;
    throw new Error(msg ?? "Failed to create job");
  }
  return res.json();
}

export async function updateJob(
  id: string,
  payload: CreateJobPayload
): Promise<Job> {
  const token = getToken();
  if (!token) throw new Error("Not authenticated");

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };

  // Add Accept-Language header based on user locale
  if (typeof window !== "undefined") {
    const { getUserLocale } = await import("./i18n");
    const locale = getUserLocale();
    headers["Accept-Language"] = locale;
  }

  const res = await fetch(`${API_URL}/jobs/${id}`, {
    method: "PATCH",
    headers,
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const msg = Array.isArray(err.message) ? err.message[0] : err.message;
    throw new Error(msg ?? "Failed to update job");
  }
  return res.json();
}

export async function applyToJob(
  jobId: string,
  message?: string
): Promise<{ ok: boolean }> {
  const token = getToken();
  if (!token) throw new Error("Zaloguj się, aby zgłosić się do oferty");

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };

  // Add Accept-Language header based on user locale
  if (typeof window !== "undefined") {
    const { getUserLocale } = await import("./i18n");
    const locale = getUserLocale();
    headers["Accept-Language"] = locale;
  }

  const res = await fetch(`${API_URL}/jobs/${jobId}/apply`, {
    method: "POST",
    headers,
    body: JSON.stringify({ message: message?.trim() || undefined }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const msg = Array.isArray(err.message) ? err.message[0] : err.message;
    throw new Error(msg ?? "Nie udało się zgłosić do oferty");
  }
  return res.json();
}

export async function addFavorite(jobId: string): Promise<{ ok: boolean }> {
  const token = getToken();
  if (!token) throw new Error("Zaloguj się, aby zapisać ofertę");
  const res = await fetch(`${API_URL}/jobs/${jobId}/favorite`, {
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

export async function removeFavorite(jobId: string): Promise<{ ok: boolean }> {
  const token = getToken();
  if (!token) throw new Error("Not authenticated");
  const res = await fetch(`${API_URL}/jobs/${jobId}/favorite`, {
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

export async function getFavoritesJobs(): Promise<Job[]> {
  const token = getToken();
  if (!token) throw new Error("Zaloguj się, aby zobaczyć ulubione");
  const headers: HeadersInit = { Authorization: `Bearer ${token}` };

  // Add Accept-Language header based on user locale
  if (typeof window !== "undefined") {
    const { getUserLocale } = await import("./i18n");
    const locale = getUserLocale();
    headers["Accept-Language"] = locale;
  }

  const res = await fetch(`${API_URL}/jobs/favorites`, { headers });
  if (!res.ok) throw new Error("Nie udało się załadować ulubionych");
  return res.json();
}

export async function getPendingJobs(
  page: number = 1,
  pageSize: number = 15
): Promise<JobsFeedResponse> {
  const token = getToken();
  if (!token) throw new Error("Not authenticated");
  const params = new URLSearchParams();
  params.set("page", String(page));
  params.set("pageSize", String(pageSize));
  const url = `${API_URL}/jobs/pending?${params.toString()}`;
  const headers: HeadersInit = { Authorization: `Bearer ${token}` };

  // Add Accept-Language header based on user locale
  if (typeof window !== "undefined") {
    const { getUserLocale } = await import("./i18n");
    const locale = getUserLocale();
    headers["Accept-Language"] = locale;
  }

  const res = await fetch(url, { headers });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const msg = Array.isArray(err.message) ? err.message[0] : err.message;
    throw new Error(msg ?? "Failed to fetch pending jobs");
  }
  return res.json();
}
