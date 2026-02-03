const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

export type AccountType = "CLIENT" | "FREELANCER";

export interface AuthUser {
  id: string;
  email: string;
  name: string | null;
  accountType: AccountType | null;
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

export async function updateProfile(
  name?: string,
  accountType?: AccountType
): Promise<{ user: AuthUser }> {
  const token = getToken();
  if (!token) throw new Error("Not authenticated");
  const res = await fetch(`${API_URL}/auth/profile`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ name, accountType }),
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

export interface Category {
  id: string;
  name: string;
  slug: string;
}

export interface ListingAuthor {
  id: string;
  email: string;
  name: string | null;
}

export interface Listing {
  id: string;
  title: string;
  description: string;
  categoryId: string;
  authorId: string;
  createdAt: string;
  category: Category;
  author: ListingAuthor;
}

export interface ListingsFeedResponse {
  items: Listing[];
  nextCursor?: string;
}

export async function getCategories(): Promise<Category[]> {
  const res = await fetch(`${API_URL}/listings/categories`);
  if (!res.ok) throw new Error("Failed to fetch categories");
  return res.json();
}

export async function getListingsFeed(
  take?: number,
  cursor?: string
): Promise<ListingsFeedResponse> {
  const params = new URLSearchParams();
  if (take != null) params.set("take", String(take));
  if (cursor) params.set("cursor", cursor);
  const url = `${API_URL}/listings/feed${params.toString() ? `?${params}` : ""}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch listings");
  return res.json();
}

export async function createListing(
  title: string,
  description: string,
  categoryId: string
): Promise<Listing> {
  const token = getToken();
  if (!token) throw new Error("Not authenticated");
  const res = await fetch(`${API_URL}/listings`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ title, description, categoryId }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const msg = Array.isArray(err.message) ? err.message[0] : err.message;
    throw new Error(msg ?? "Failed to create listing");
  }
  return res.json();
}
