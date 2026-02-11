/**
 * Shared auth types used by auth, account and company modules.
 */

export interface JwtPayload {
  sub: string;
  email: string;
}

export interface AuthResponseUser {
  id: string;
  email: string;
  name: string | null;
  surname: string | null;
  /** Avatar image URL (S3-compatible storage, 500x500). */
  avatarUrl: string | null;
  phone: string | null;
  /** NIP from linked company (company.nip). */
  nipCompany: string | null;
  companyId: string | null;
  accountType: string | null;
  language: string;
  defaultMessage: string | null;
  skills: { id: string; name: string }[];
  /** False when user signed up with Google only and has not set a password yet. */
  hasPassword: boolean;
  /** Timestamp (version) of accepted terms of service, or null if not accepted. */
  acceptedTermsVersion: string | null;
  /** Timestamp (version) of accepted privacy policy, or null if not accepted. */
  acceptedPrivacyPolicyVersion: string | null;
}

export interface AuthResponse {
  access_token: string;
  user: AuthResponseUser;
}

export interface CompanyPayload {
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
  updatedAt: Date;
}
