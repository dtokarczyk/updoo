const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

export type AccountType = 'CLIENT' | 'FREELANCER' | 'ADMIN';

export type UserLanguage = 'POLISH' | 'ENGLISH';

export interface AuthUser {
  id: string;
  email: string;
  name: string | null;
  surname: string | null;
  /** Avatar image URL (S3-compatible storage, 500x500). */
  avatarUrl?: string | null;
  /** Phone number – used only for important notifications about application status. */
  phone?: string | null;
  /** Linked company id. */
  companyId?: string | null;
  /** NIP of linked company (from Company.nip). */
  nipCompany?: string | null;
  accountType: AccountType | null;
  language: UserLanguage;
  /** Default message for freelancer applications (with portfolio links). */
  defaultMessage?: string | null;
  /** Skills directly attached to freelancer account. */
  skills?: Skill[];
  /** False when user signed in with Google only and has not set a password yet. */
  hasPassword?: boolean;
  /** Timestamp (version) of accepted terms of service, or null if not accepted. */
  acceptedTermsVersion?: string | null;
  /** Timestamp (version) of accepted privacy policy, or null if not accepted. */
  acceptedPrivacyPolicyVersion?: string | null;
}

export interface AuthResponse {
  access_token: string;
  user: AuthUser;
}

export async function register(
  email: string,
  password: string,
  confirmPassword: string,
  termsAccepted: boolean,
): Promise<AuthResponse> {
  const headers: HeadersInit = { 'Content-Type': 'application/json' };

  // Add Accept-Language header based on user locale
  if (typeof window !== 'undefined') {
    const { getUserLocale } = await import('./i18n');
    const locale = getUserLocale();
    headers['Accept-Language'] = locale;
  }

  const res = await fetch(`${API_URL}/auth/register`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ email, password, confirmPassword, termsAccepted }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const msg = Array.isArray(err.message) ? err.message[0] : err.message;
    throw new Error(msg ?? 'Registration failed');
  }
  return res.json();
}

export interface UpdateProfilePayload {
  name?: string;
  surname?: string;
  email?: string;
  phone?: string;
  /** Avatar image URL (after upload). */
  avatarUrl?: string | null;
  companyId?: string | null;
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
  payload: UpdateProfilePayload,
): Promise<{ user: AuthUser }> {
  const token = getToken();
  if (!token) throw new Error('Not authenticated');
  const body: Record<string, unknown> = {};
  if (payload.name !== undefined) body.name = payload.name;
  if (payload.surname !== undefined) body.surname = payload.surname;
  if (payload.email !== undefined) body.email = payload.email;
  if (payload.phone !== undefined) body.phone = payload.phone;
  if (payload.companyId !== undefined) body.companyId = payload.companyId;
  if (payload.accountType !== undefined) body.accountType = payload.accountType;
  if (payload.password !== undefined && payload.password.trim())
    body.password = payload.password;
  if (payload.oldPassword !== undefined && payload.oldPassword.trim())
    body.oldPassword = payload.oldPassword;
  if (payload.language !== undefined) body.language = payload.language;
  if (payload.skillIds !== undefined) body.skillIds = payload.skillIds;
  if (payload.defaultMessage !== undefined)
    body.defaultMessage = payload.defaultMessage;
  if (payload.avatarUrl !== undefined) body.avatarUrl = payload.avatarUrl;

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };

  // Add Accept-Language header based on user locale
  if (typeof window !== 'undefined') {
    const { getUserLocale } = await import('./i18n');
    const locale = getUserLocale();
    headers['Accept-Language'] = locale;
  }

  const res = await fetch(`${API_URL}/auth/profile`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const msg = Array.isArray(err.message) ? err.message[0] : err.message;
    throw new Error(msg ?? 'Update failed');
  }
  return res.json();
}

/** Remove avatar. Returns updated user. */
export async function removeAvatar(): Promise<{ user: AuthUser }> {
  const token = getToken();
  if (!token) throw new Error('Not authenticated');

  const headers: HeadersInit = {
    Authorization: `Bearer ${token}`,
  };
  if (typeof window !== 'undefined') {
    const { getUserLocale } = await import('./i18n');
    headers['Accept-Language'] = getUserLocale();
  }

  const res = await fetch(`${API_URL}/auth/avatar`, {
    method: 'DELETE',
    headers,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const msg = Array.isArray(err.message) ? err.message[0] : err.message;
    throw new Error(msg ?? 'Remove failed');
  }
  return res.json();
}

/** Upload avatar image (compressed to 500x500 on server). Returns updated user and avatarUrl. */
export async function uploadAvatar(
  file: File,
): Promise<{ user: AuthUser; avatarUrl: string }> {
  const token = getToken();
  if (!token) throw new Error('Not authenticated');
  const formData = new FormData();
  formData.append('file', file);

  const headers: HeadersInit = {
    Authorization: `Bearer ${token}`,
  };
  if (typeof window !== 'undefined') {
    const { getUserLocale } = await import('./i18n');
    headers['Accept-Language'] = getUserLocale();
  }

  const res = await fetch(`${API_URL}/auth/avatar`, {
    method: 'POST',
    headers,
    body: formData,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const msg = Array.isArray(err.message) ? err.message[0] : err.message;
    throw new Error(msg ?? 'Upload failed');
  }
  return res.json();
}

export async function login(
  email: string,
  password: string,
): Promise<AuthResponse> {
  const headers: HeadersInit = { 'Content-Type': 'application/json' };

  // Add Accept-Language header based on user locale
  if (typeof window !== 'undefined') {
    const { getUserLocale } = await import('./i18n');
    const locale = getUserLocale();
    headers['Accept-Language'] = locale;
  }

  const res = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const msg = Array.isArray(err.message) ? err.message[0] : err.message;
    throw new Error(msg ?? 'Login failed');
  }
  return res.json();
}

/** Request password reset email. Always returns success message to avoid email enumeration. */
export async function requestPasswordReset(
  email: string,
): Promise<{ message: string }> {
  const headers: HeadersInit = { 'Content-Type': 'application/json' };
  if (typeof window !== 'undefined') {
    const { getUserLocale } = await import('./i18n');
    const locale = getUserLocale();
    headers['Accept-Language'] = locale;
  }
  const res = await fetch(`${API_URL}/auth/forgot-password`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ email: email.trim().toLowerCase() }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const msg = Array.isArray(err.message) ? err.message[0] : err.message;
    throw new Error(msg ?? 'Request failed');
  }
  return res.json();
}

/** Reset password using token from email. */
export async function resetPassword(
  token: string,
  newPassword: string,
  confirmPassword: string,
): Promise<{ message: string }> {
  const headers: HeadersInit = { 'Content-Type': 'application/json' };
  if (typeof window !== 'undefined') {
    const { getUserLocale } = await import('./i18n');
    const locale = getUserLocale();
    headers['Accept-Language'] = locale;
  }
  const res = await fetch(`${API_URL}/auth/reset-password`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ token, newPassword, confirmPassword }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const msg = Array.isArray(err.message) ? err.message[0] : err.message;
    throw new Error(msg ?? 'Reset failed');
  }
  return res.json();
}

/** URL to redirect to for Google OAuth (backend initiates flow). */
export function getGoogleAuthUrl(): string {
  return `${API_URL}/auth/google`;
}

/** SessionStorage key for returnUrl when redirecting to OAuth (e.g. Google). */
export const OAUTH_RETURN_URL_KEY = 'oauth_return_url';

export interface ProfileResponse {
  user: AuthUser;
  needsAgreementsAcceptance: boolean;
}

/** Fetch current user with a given token (e.g. after OAuth callback). */
export async function getProfileWithToken(
  token: string,
): Promise<ProfileResponse> {
  const headers: HeadersInit = {
    Authorization: `Bearer ${token}`,
  };
  if (typeof window !== 'undefined') {
    const { getUserLocale } = await import('./i18n');
    const locale = getUserLocale();
    headers['Accept-Language'] = locale;
  }
  const res = await fetch(`${API_URL}/auth/profile`, {
    method: 'GET',
    headers,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const msg = Array.isArray(err.message) ? err.message[0] : err.message;
    throw new Error(msg ?? 'Failed to load profile');
  }
  return res.json();
}

/** Fetch profile (user + required agreement versions). Requires auth. */
export async function getProfile(): Promise<ProfileResponse | null> {
  const token = getToken();
  if (!token) return null;
  return getProfileWithToken(token);
}

/** Company data from profile (GUS-linked). */
export interface Company {
  id: string;
  regon: string;
  nip: string;
  name: string;
  voivodeship: string | null;
  county: string | null;
  commune: string | null;
  locality: string | null;
  postalCode: string | null;
  street: string | null;
  propertyNumber: string | null;
  apartmentNumber: string | null;
  type: string | null;
  isActive: boolean;
  updatedAt: string;
}

/** Get current user's linked company. Returns { company: null } if none. */
export async function getMyCompany(): Promise<{ company: Company | null }> {
  const token = getToken();
  if (!token) throw new Error('Not authenticated');
  const headers: HeadersInit = { Authorization: `Bearer ${token}` };
  if (typeof window !== 'undefined') {
    const { getUserLocale } = await import('./i18n');
    headers['Accept-Language'] = getUserLocale();
  }
  const res = await fetch(`${API_URL}/auth/company`, { headers });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const msg = Array.isArray(err.message) ? err.message[0] : err.message;
    throw new Error(msg ?? 'Failed to load company');
  }
  return res.json();
}

/** Link company to user by NIP (find in DB or fetch from GUS, then assign). */
export async function linkCompanyByNip(
  nip: string,
): Promise<{ user: AuthUser; company: Company }> {
  const token = getToken();
  if (!token) throw new Error('Not authenticated');
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
  if (typeof window !== 'undefined') {
    const { getUserLocale } = await import('./i18n');
    headers['Accept-Language'] = getUserLocale();
  }
  const res = await fetch(`${API_URL}/auth/company/link`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ nip: nip.trim().replace(/\s/g, '').replace(/-/g, '') }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const msg = Array.isArray(err.message) ? err.message[0] : err.message;
    throw new Error(msg ?? 'Failed to link company');
  }
  return res.json();
}

/** Refresh current user's company data from GUS. */
export async function refreshCompany(): Promise<{ company: Company }> {
  const token = getToken();
  if (!token) throw new Error('Not authenticated');
  const headers: HeadersInit = { Authorization: `Bearer ${token}` };
  if (typeof window !== 'undefined') {
    const { getUserLocale } = await import('./i18n');
    headers['Accept-Language'] = getUserLocale();
  }
  const res = await fetch(`${API_URL}/auth/company/refresh`, {
    method: 'POST',
    headers,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const msg = Array.isArray(err.message) ? err.message[0] : err.message;
    throw new Error(msg ?? 'Failed to refresh company');
  }
  return res.json();
}

export const AUTH_TOKEN_KEY = 'auth_token';
export const AUTH_USER_KEY = 'auth_user';
export const DRAFT_JOB_KEY = 'draft_job';

/** Cookie name for auth token so server can pass it when fetching draft jobs. */
export const AUTH_TOKEN_COOKIE = 'auth_token';

const AUTH_COOKIE_MAX_AGE_DAYS = 7;

export function setAuth(data: AuthResponse): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(AUTH_TOKEN_KEY, data.access_token);
  localStorage.setItem(AUTH_USER_KEY, JSON.stringify(data.user));
  document.cookie = `${AUTH_TOKEN_COOKIE}=${encodeURIComponent(data.access_token)}; path=/; max-age=${AUTH_COOKIE_MAX_AGE_DAYS * 24 * 60 * 60}; SameSite=Lax`;
}

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(AUTH_TOKEN_KEY);
}

export function getStoredUser(): AuthUser | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(AUTH_USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

export function updateStoredUser(user: AuthUser): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
}

export function clearAuth(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(AUTH_TOKEN_KEY);
  localStorage.removeItem(AUTH_USER_KEY);
  document.cookie = `${AUTH_TOKEN_COOKIE}=; path=/; max-age=0`;
}

// Draft job functions
export function saveDraftJob(payload: CreateJobPayload): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(DRAFT_JOB_KEY, JSON.stringify(payload));
}

export function getDraftJob(): CreateJobPayload | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(DRAFT_JOB_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as CreateJobPayload;
  } catch {
    return null;
  }
}

export function clearDraftJob(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(DRAFT_JOB_KEY);
}

/** True if user has not completed basic onboarding (name, surname, account type). Rest is validated inside onboarding flow. */
export function needsOnboarding(user: AuthUser | null): boolean {
  if (user == null) return false;
  if (user.name == null || user.surname == null || user.accountType == null)
    return true;
  return false;
}

/** Current terms of service markdown from API. */
export async function getTermsContent(): Promise<string> {
  const res = await fetch(`${API_URL}/agreements/terms`);
  if (!res.ok) throw new Error('Failed to fetch terms');
  const data = await res.json();
  return data.content ?? '';
}

/** Current privacy policy markdown from API. */
export async function getPrivacyPolicyContent(): Promise<string> {
  const res = await fetch(`${API_URL}/agreements/privacy-policy`);
  if (!res.ok) throw new Error('Failed to fetch privacy policy');
  const data = await res.json();
  return data.content ?? '';
}

/** Accept current terms and privacy policy. Backend records current versions. */
export async function acceptAgreements(): Promise<{ user: AuthUser }> {
  const token = getToken();
  if (!token) throw new Error('Not authenticated');
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
  if (typeof window !== 'undefined') {
    const { getUserLocale } = await import('./i18n');
    const locale = getUserLocale();
    headers['Accept-Language'] = locale;
  }
  const res = await fetch(`${API_URL}/auth/accept-agreements`, {
    method: 'POST',
    headers,
    body: JSON.stringify({}),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const msg = Array.isArray(err.message) ? err.message[0] : err.message;
    throw new Error(msg ?? 'Failed to accept agreements');
  }
  return res.json();
}

// Jobs & categories

/** Display order: 1. Wszystkie (link only), 2. Programowanie, 3. Design, 4. Marketing, 5. Pisanie, 6. Prace biurowe, 7. Inne */
const CATEGORY_ORDER = [
  'programming',
  'design',
  'marketing',
  'writing',
  'office-working',
  'other',
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

export interface ContractorProfileOwner {
  id: string;
  name: string | null;
  surname: string | null;
}

export interface Profile {
  id: string;
  name: string;
  slug: string;
  website: string | null;
  email: string | null;
  phone: string | null;
  isVerified: boolean;
  aboutUs: string | null;
  /** Cover photo URL (16:9). */
  coverPhotoUrl?: string | null;
  locationId: string | null;
  location?: Location | null;
  ownerId: string;
  owner?: ContractorProfileOwner;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProfilePayload {
  name: string;
  website?: string;
  email?: string;
  phone?: string;
  locationId?: string;
  aboutUs?: string;
}

export interface PopularSkill extends Skill {
  /** How many jobs in given category use this skill. */
  count: number;
}

export type JobStatus = 'DRAFT' | 'PUBLISHED' | 'CLOSED' | 'REJECTED';
export type JobLanguage = 'ENGLISH' | 'POLISH';
export type BillingType = 'FIXED' | 'HOURLY';
export type HoursPerWeek =
  | 'LESS_THAN_10'
  | 'FROM_11_TO_20'
  | 'FROM_21_TO_30'
  | 'MORE_THAN_30';
export type ExperienceLevel = 'JUNIOR' | 'MID' | 'SENIOR';
export type ProjectType = 'ONE_TIME' | 'CONTINUOUS';

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
  return author.email || '';
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

/** Application as seen by others: display name (first name + first letter of surname) and/or initials. */
export interface JobApplicationDisplay {
  id: string;
  /** First name + first letter of surname (e.g. "Jan K."). */
  freelancerDisplayName?: string;
  freelancerInitials: string;
  createdAt: string;
}

export type JobApplication = JobApplicationFull | JobApplicationDisplay;

export function isApplicationFull(
  app: JobApplication,
): app is JobApplicationFull {
  return 'freelancer' in app;
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
  rate: string | null;
  rateNegotiable?: boolean;
  currency: string;
  experienceLevel: ExperienceLevel;
  locationId: string | null;
  isRemote: boolean;
  projectType: ProjectType;
  deadline: string | null;
  closedAt: string | null;
  rejectedAt?: string | null;
  rejectedReason?: string | null;
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
  categoryId: string,
): Promise<PopularSkill[]> {
  const params = new URLSearchParams();
  params.set('categoryId', categoryId);
  const res = await fetch(
    `${API_URL}/jobs/popular-skills?${params.toString()}`,
  );
  if (!res.ok) throw new Error('Failed to fetch popular skills');
  return res.json();
}

export async function getCategories(): Promise<Category[]> {
  const headers: HeadersInit = {};
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  // Add Accept-Language header based on user locale
  if (typeof window !== 'undefined') {
    const { getUserLocale } = await import('./i18n');
    const locale = getUserLocale();
    headers['Accept-Language'] = locale;
  }

  const res = await fetch(`${API_URL}/jobs/categories`, { headers });
  if (!res.ok) throw new Error('Failed to fetch categories');
  return res.json();
}

export async function getLocations(): Promise<Location[]> {
  const res = await fetch(`${API_URL}/jobs/locations`);
  if (!res.ok) throw new Error('Failed to fetch locations');
  return res.json();
}

export async function createContractorProfile(
  data: CreateProfilePayload,
): Promise<Profile> {
  const token = getToken();
  if (!token) throw new Error('Not authenticated');
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
  if (typeof window !== 'undefined') {
    const { getUserLocale } = await import('./i18n');
    const locale = getUserLocale();
    headers['Accept-Language'] = locale;
  }
  const res = await fetch(`${API_URL}/profiles`, {
    method: 'POST',
    headers,
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const msg = Array.isArray(err.message) ? err.message[0] : err.message;
    throw new Error(msg ?? 'Failed to create profile');
  }
  return res.json();
}

export async function getMyProfiles(): Promise<Profile[]> {
  const token = getToken();
  if (!token) throw new Error('Not authenticated');
  const headers: HeadersInit = { Authorization: `Bearer ${token}` };
  if (typeof window !== 'undefined') {
    const { getUserLocale } = await import('./i18n');
    const locale = getUserLocale();
    headers['Accept-Language'] = locale;
  }
  const res = await fetch(`${API_URL}/profiles/my`, { headers });
  if (!res.ok) throw new Error('Failed to fetch profiles');
  return res.json();
}

export async function getContractorProfile(id: string): Promise<Profile> {
  const token = getToken();
  if (!token) throw new Error('Not authenticated');
  const headers: HeadersInit = { Authorization: `Bearer ${token}` };
  if (typeof window !== 'undefined') {
    const { getUserLocale } = await import('./i18n');
    const locale = getUserLocale();
    headers['Accept-Language'] = locale;
  }
  const res = await fetch(`${API_URL}/profiles/${id}`, { headers });
  if (!res.ok) {
    if (res.status === 404) throw new Error('Profile not found');
    throw new Error('Failed to fetch profile');
  }
  return res.json();
}

export async function getProfileBySlug(slug: string): Promise<Profile> {
  const headers: HeadersInit = {};
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  if (typeof window !== 'undefined') {
    const { getUserLocale } = await import('./i18n');
    const locale = getUserLocale();
    headers['Accept-Language'] = locale;
  }
  const res = await fetch(`${API_URL}/profiles/slug/${encodeURIComponent(slug)}`, {
    headers,
  });
  if (!res.ok) {
    if (res.status === 404) throw new Error('Profile not found');
    throw new Error('Failed to fetch profile');
  }
  return res.json();
}

export async function updateContractorProfile(
  id: string,
  data: Partial<CreateProfilePayload>,
): Promise<Profile> {
  const token = getToken();
  if (!token) throw new Error('Not authenticated');
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
  if (typeof window !== 'undefined') {
    const { getUserLocale } = await import('./i18n');
    const locale = getUserLocale();
    headers['Accept-Language'] = locale;
  }
  const res = await fetch(`${API_URL}/profiles/${id}`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const msg = Array.isArray(err.message) ? err.message[0] : err.message;
    throw new Error(msg ?? 'Failed to update profile');
  }
  return res.json();
}

export async function deleteContractorProfile(id: string): Promise<void> {
  const token = getToken();
  if (!token) throw new Error('Not authenticated');
  const headers: HeadersInit = { Authorization: `Bearer ${token}` };
  const res = await fetch(`${API_URL}/profiles/${id}`, {
    method: 'DELETE',
    headers,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const msg = Array.isArray(err.message) ? err.message[0] : err.message;
    throw new Error(msg ?? 'Failed to delete profile');
  }
}

/** Upload cover photo for profile (16:9 crop applied on client). Returns updated profile. */
export async function uploadProfileCover(
  profileId: string,
  file: Blob,
): Promise<Profile> {
  const token = getToken();
  if (!token) throw new Error('Not authenticated');
  const formData = new FormData();
  formData.append('file', file, 'cover.jpg');
  const headers: HeadersInit = { Authorization: `Bearer ${token}` };
  if (typeof window !== 'undefined') {
    const { getUserLocale } = await import('./i18n');
    headers['Accept-Language'] = getUserLocale();
  }
  const res = await fetch(`${API_URL}/profiles/${profileId}/cover`, {
    method: 'POST',
    headers,
    body: formData,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const msg = Array.isArray(err.message) ? err.message[0] : err.message;
    throw new Error(msg ?? 'Failed to upload cover');
  }
  return res.json();
}

/** Remove cover photo from profile. Returns updated profile. */
export async function removeProfileCover(profileId: string): Promise<Profile> {
  const token = getToken();
  if (!token) throw new Error('Not authenticated');
  const headers: HeadersInit = { Authorization: `Bearer ${token}` };
  if (typeof window !== 'undefined') {
    const { getUserLocale } = await import('./i18n');
    headers['Accept-Language'] = getUserLocale();
  }
  const res = await fetch(`${API_URL}/profiles/${profileId}/cover`, {
    method: 'DELETE',
    headers,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const msg = Array.isArray(err.message) ? err.message[0] : err.message;
    throw new Error(msg ?? 'Failed to remove cover');
  }
  return res.json();
}

export async function getSkills(): Promise<Skill[]> {
  const res = await fetch(`${API_URL}/jobs/skills`);
  if (!res.ok) throw new Error('Failed to fetch skills');
  return res.json();
}

export async function getJobsFeed(
  page: number = 1,
  pageSize: number = 15,
  categoryId?: string,
  language?: JobLanguage | '' | undefined,
  skillIds?: string[],
): Promise<JobsFeedResponse> {
  const params = new URLSearchParams();
  params.set('page', String(page));
  params.set('pageSize', String(pageSize));
  if (categoryId) params.set('categoryId', categoryId);
  if (language === 'POLISH' || language === 'ENGLISH') {
    params.set('language', language as JobLanguage);
  }
  if (skillIds && skillIds.length > 0) {
    params.set('skillIds', skillIds.join(','));
  }
  const url = `${API_URL}/jobs/feed?${params.toString()}`;
  const headers: HeadersInit = {};
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  // Add Accept-Language header based on user locale
  if (typeof window !== 'undefined') {
    const { getUserLocale } = await import('./i18n');
    const locale = getUserLocale();
    headers['Accept-Language'] = locale;
  }

  const res = await fetch(url, { headers });
  if (!res.ok) throw new Error('Failed to fetch jobs');
  return res.json();
}

export async function getJob(id: string): Promise<Job> {
  const headers: HeadersInit = {};
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  // Add Accept-Language header based on user locale
  if (typeof window !== 'undefined') {
    const { getUserLocale } = await import('./i18n');
    const locale = getUserLocale();
    headers['Accept-Language'] = locale;
  }

  const res = await fetch(`${API_URL}/jobs/${id}`, { headers });
  if (!res.ok) {
    if (res.status === 404) throw new Error('Oferta nie istnieje');
    throw new Error('Failed to fetch job');
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
  if (typeof window !== 'undefined') {
    const { getUserLocale } = await import('./i18n');
    const locale = getUserLocale();
    headers['Accept-Language'] = locale;
  }

  const res = await fetch(`${API_URL}/jobs/${id}/prev-next`, { headers });
  if (!res.ok) {
    if (res.status === 404) throw new Error('Oferta nie istnieje');
    throw new Error('Failed to fetch prev/next jobs');
  }
  return res.json();
}

/**
 * Server-side job fetch. Accepts locale and optional token (no localStorage).
 * Returns null on 404 or error so server can show not-found.
 */
export async function getJobServer(
  id: string,
  locale: string,
  token?: string | null,
): Promise<Job | null> {
  try {
    const headers: HeadersInit = {
      'Accept-Language': locale === 'en' ? 'en' : 'pl',
    };
    if (token) headers.Authorization = `Bearer ${token}`;
    const res = await fetch(`${API_URL}/jobs/${id}`, {
      headers,
      cache: 'no-store',
    });
    if (!res.ok) return null;
    return (await res.json()) as Job;
  } catch {
    return null;
  }
}

/**
 * Server-side prev/next fetch. Accepts locale and optional token.
 * Returns empty prev/next on error.
 */
export async function getJobPrevNextServer(
  id: string,
  locale: string,
  token?: string | null,
): Promise<JobPrevNext> {
  try {
    const headers: HeadersInit = {
      'Accept-Language': locale === 'en' ? 'en' : 'pl',
    };
    if (token) headers.Authorization = `Bearer ${token}`;
    const res = await fetch(`${API_URL}/jobs/${id}/prev-next`, {
      headers,
      cache: 'no-store',
    });
    if (!res.ok) return { prev: null, next: null };
    return (await res.json()) as JobPrevNext;
  } catch {
    return { prev: null, next: null };
  }
}

export async function publishJob(jobId: string): Promise<Job> {
  const token = getToken();
  if (!token) throw new Error('Not authenticated');
  const res = await fetch(`${API_URL}/jobs/${jobId}/publish`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const msg = Array.isArray(err.message) ? err.message[0] : err.message;
    throw new Error(msg ?? 'Failed to publish job');
  }
  return res.json();
}

export async function rejectJob(
  jobId: string,
  reason: string,
): Promise<Job> {
  const token = getToken();
  if (!token) throw new Error('Not authenticated');
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
  if (typeof window !== 'undefined') {
    const { getUserLocale } = await import('./i18n');
    const locale = getUserLocale();
    headers['Accept-Language'] = locale === 'en' ? 'en' : 'pl';
  }
  const res = await fetch(`${API_URL}/jobs/${jobId}/reject`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({ reason: reason.trim() }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const msg = Array.isArray(err.message) ? err.message[0] : err.message;
    throw new Error(msg ?? 'Failed to reject job');
  }
  return res.json();
}

export async function closeJob(jobId: string): Promise<Job> {
  const token = getToken();
  if (!token) throw new Error('Not authenticated');
  const res = await fetch(`${API_URL}/jobs/${jobId}/close`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const msg = Array.isArray(err.message) ? err.message[0] : err.message;
    throw new Error(msg ?? 'Failed to close job');
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
  rate: number | null;
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
  if (!token) throw new Error('Not authenticated');

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };

  // Add Accept-Language header based on user locale
  if (typeof window !== 'undefined') {
    const { getUserLocale } = await import('./i18n');
    const locale = getUserLocale();
    headers['Accept-Language'] = locale;
  }

  const res = await fetch(`${API_URL}/jobs`, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const msg = Array.isArray(err.message) ? err.message[0] : err.message;
    throw new Error(msg ?? 'Failed to create job');
  }
  return res.json();
}

export async function updateJob(
  id: string,
  payload: CreateJobPayload,
): Promise<Job> {
  const token = getToken();
  if (!token) throw new Error('Not authenticated');

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };

  // Add Accept-Language header based on user locale
  if (typeof window !== 'undefined') {
    const { getUserLocale } = await import('./i18n');
    const locale = getUserLocale();
    headers['Accept-Language'] = locale;
  }

  const res = await fetch(`${API_URL}/jobs/${id}`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const msg = Array.isArray(err.message) ? err.message[0] : err.message;
    throw new Error(msg ?? 'Failed to update job');
  }
  return res.json();
}

export async function applyToJob(
  jobId: string,
  message?: string,
): Promise<{ ok: boolean }> {
  const token = getToken();
  if (!token) throw new Error('Zaloguj się, aby zgłosić się do oferty');

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };

  // Add Accept-Language header based on user locale
  if (typeof window !== 'undefined') {
    const { getUserLocale } = await import('./i18n');
    const locale = getUserLocale();
    headers['Accept-Language'] = locale;
  }

  const res = await fetch(`${API_URL}/jobs/${jobId}/apply`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ message: message?.trim() || undefined }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const msg = Array.isArray(err.message) ? err.message[0] : err.message;
    throw new Error(msg ?? 'Nie udało się zgłosić do oferty');
  }
  return res.json();
}

export async function addFavorite(jobId: string): Promise<{ ok: boolean }> {
  const token = getToken();
  if (!token) throw new Error('Zaloguj się, aby zapisać ofertę');
  const res = await fetch(`${API_URL}/jobs/${jobId}/favorite`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const msg = Array.isArray(err.message) ? err.message[0] : err.message;
    throw new Error(msg ?? 'Nie udało się dodać do ulubionych');
  }
  return res.json();
}

export async function removeFavorite(jobId: string): Promise<{ ok: boolean }> {
  const token = getToken();
  if (!token) throw new Error('Not authenticated');
  const res = await fetch(`${API_URL}/jobs/${jobId}/favorite`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const msg = Array.isArray(err.message) ? err.message[0] : err.message;
    throw new Error(msg ?? 'Nie udało się usunąć z ulubionych');
  }
  return res.json();
}

export async function getFavoritesJobs(): Promise<Job[]> {
  const token = getToken();
  if (!token) throw new Error('Zaloguj się, aby zobaczyć ulubione');
  const headers: HeadersInit = { Authorization: `Bearer ${token}` };

  // Add Accept-Language header based on user locale
  if (typeof window !== 'undefined') {
    const { getUserLocale } = await import('./i18n');
    const locale = getUserLocale();
    headers['Accept-Language'] = locale;
  }

  const res = await fetch(`${API_URL}/jobs/favorites`, { headers });
  if (!res.ok) throw new Error('Nie udało się załadować ulubionych');
  return res.json();
}

/**
 * Server-side fetch – accepts token and locale (no localStorage).
 * Returns empty array on error.
 */
export async function getFavoritesJobsServer(
  locale: string,
  token: string,
): Promise<Job[]> {
  try {
    const headers: HeadersInit = {
      Authorization: `Bearer ${token}`,
      'Accept-Language': locale === 'en' ? 'en' : 'pl',
    };
    const res = await fetch(`${API_URL}/jobs/favorites`, {
      headers,
      cache: 'no-store',
    });
    if (!res.ok) return [];
    return (await res.json()) as Job[];
  } catch {
    return [];
  }
}

export async function getPendingJobs(
  page: number = 1,
  pageSize: number = 15,
): Promise<JobsFeedResponse> {
  const token = getToken();
  if (!token) throw new Error('Not authenticated');
  const params = new URLSearchParams();
  params.set('page', String(page));
  params.set('pageSize', String(pageSize));
  const url = `${API_URL}/jobs/pending?${params.toString()}`;
  const headers: HeadersInit = { Authorization: `Bearer ${token}` };

  // Add Accept-Language header based on user locale
  if (typeof window !== 'undefined') {
    const { getUserLocale } = await import('./i18n');
    const locale = getUserLocale();
    headers['Accept-Language'] = locale;
  }

  const res = await fetch(url, { headers });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const msg = Array.isArray(err.message) ? err.message[0] : err.message;
    throw new Error(msg ?? 'Failed to fetch pending jobs');
  }
  return res.json();
}

export interface UserApplication {
  id: string;
  createdAt: string;
  message?: string;
  job: Job;
}

export async function getUserApplications(): Promise<UserApplication[]> {
  const token = getToken();
  if (!token) throw new Error('Not authenticated');
  const headers: HeadersInit = { Authorization: `Bearer ${token}` };

  // Add Accept-Language header based on user locale
  if (typeof window !== 'undefined') {
    const { getUserLocale } = await import('./i18n');
    const locale = getUserLocale();
    headers['Accept-Language'] = locale;
  }

  const res = await fetch(`${API_URL}/jobs/my-applications`, { headers });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const msg = Array.isArray(err.message) ? err.message[0] : err.message;
    throw new Error(msg ?? 'Failed to fetch user applications');
  }
  return res.json();
}

/**
 * Server-side fetch – accepts token and locale (no localStorage).
 * Returns empty array on error.
 */
export async function getUserApplicationsServer(
  locale: string,
  token: string,
): Promise<UserApplication[]> {
  try {
    const headers: HeadersInit = {
      Authorization: `Bearer ${token}`,
      'Accept-Language': locale === 'en' ? 'en' : 'pl',
    };
    const res = await fetch(`${API_URL}/jobs/my-applications`, {
      headers,
      cache: 'no-store',
    });
    if (!res.ok) return [];
    return (await res.json()) as UserApplication[];
  } catch {
    return [];
  }
}

export async function getUserJobs(): Promise<Job[]> {
  const token = getToken();
  if (!token) throw new Error('Not authenticated');
  const headers: HeadersInit = { Authorization: `Bearer ${token}` };

  // Add Accept-Language header based on user locale
  if (typeof window !== 'undefined') {
    const { getUserLocale } = await import('./i18n');
    const locale = getUserLocale();
    headers['Accept-Language'] = locale;
  }

  const res = await fetch(`${API_URL}/jobs/my-jobs`, { headers });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const msg = Array.isArray(err.message) ? err.message[0] : err.message;
    throw new Error(msg ?? 'Failed to fetch user jobs');
  }
  return res.json();
}

export async function generateAiJob(): Promise<{
  ok: boolean;
  message: string;
  jobId?: string;
  categorySlug?: string;
}> {
  const token = getToken();
  if (!token) throw new Error('Not authenticated');
  const res = await fetch(`${API_URL}/content-generator/generate-job`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const msg = Array.isArray(err.message) ? err.message[0] : err.message;
    throw new Error(msg ?? 'Failed to generate job');
  }
  return res.json();
}

// ─── Notification preferences ────────────────────────────────────────

export type NotificationType = 'NEW_JOB_MATCHING_SKILLS';
export type NotificationFrequency = 'INSTANT' | 'DAILY_DIGEST';

export interface NotificationPreference {
  type: NotificationType;
  enabled: boolean;
  frequency: NotificationFrequency;
}

/** Get all notification preferences for the current user. */
export async function getNotificationPreferences(): Promise<
  NotificationPreference[]
> {
  const token = getToken();
  if (!token) throw new Error('Not authenticated');
  const headers: HeadersInit = { Authorization: `Bearer ${token}` };
  const res = await fetch(`${API_URL}/notifications/preferences`, { headers });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const msg = Array.isArray(err.message) ? err.message[0] : err.message;
    throw new Error(msg ?? 'Failed to fetch notification preferences');
  }
  return res.json();
}

/** Update a single notification preference. */
export async function updateNotificationPreference(
  type: NotificationType,
  data: { enabled?: boolean; frequency?: NotificationFrequency },
): Promise<NotificationPreference> {
  const token = getToken();
  if (!token) throw new Error('Not authenticated');
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
  const res = await fetch(`${API_URL}/notifications/preferences`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({ type, ...data }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const msg = Array.isArray(err.message) ? err.message[0] : err.message;
    throw new Error(msg ?? 'Failed to update notification preference');
  }
  return res.json();
}
