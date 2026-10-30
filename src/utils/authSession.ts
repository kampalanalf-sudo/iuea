import { ProfileCategory, UserProfileAccount } from '../types/distribution';

const SESSION_STORAGE_KEY = 'tank_dist_verified_session_v1';
const SESSION_TTL_MS = 8 * 60 * 60 * 1000; // 8 hours
const SESSION_SECRET_SALT = 'TANK-DIST-AUTH-GUARD-2026-V1';

export interface VerifiedAuthSession {
  sessionId: string;
  profileId: string;
  email: string;
  category: ProfileCategory;
  issuedAt: number;
  expiresAt: number;
  signature: string;
}

function computeSessionSignature(
  profileId: string,
  email: string,
  category: ProfileCategory,
  issuedAt: number,
  expiresAt: number
): string {
  const payload = `${profileId}|${email.toLowerCase()}|${category}|${issuedAt}|${expiresAt}|${SESSION_SECRET_SALT}`;
  let h1 = 0xdeadbeef ^ payload.length;
  let h2 = 0x41c6ce57 ^ payload.length;
  for (let i = 0; i < payload.length; i++) {
    const ch = payload.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 =
    Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^
    Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 =
    Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^
    Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (
    (h2 >>> 0).toString(16).padStart(8, '0') +
    (h1 >>> 0).toString(16).padStart(8, '0')
  );
}

export function createVerifiedAuthSession(
  profile: UserProfileAccount
): VerifiedAuthSession {
  const issuedAt = Date.now();
  const expiresAt = issuedAt + SESSION_TTL_MS;
  const signature = computeSessionSignature(
    profile.id,
    profile.email,
    profile.category,
    issuedAt,
    expiresAt
  );

  const session: VerifiedAuthSession = {
    sessionId: `sess-${issuedAt.toString(36)}-${signature.slice(0, 6)}`,
    profileId: profile.id,
    email: profile.email.toLowerCase(),
    category: profile.category,
    issuedAt,
    expiresAt,
    signature,
  };

  if (typeof window !== 'undefined') {
    try {
      sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
    } catch {
      // ignore storage errors
    }
  }

  return session;
}

export function clearVerifiedAuthSession(): void {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.removeItem(SESSION_STORAGE_KEY);
    localStorage.removeItem('tank_dist_is_authenticated_v3');
    localStorage.removeItem('tank_dist_is_authenticated_v4');
    localStorage.removeItem('tank_dist_active_profile_id_v3');
  } catch {
    // ignore
  }
}

export function verifyActiveProfileFromSession(
  profiles: UserProfileAccount[]
): { profile: UserProfileAccount; session: VerifiedAuthSession } | null {
  if (typeof window === 'undefined') return null;

  try {
    const raw = sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as Partial<VerifiedAuthSession>;
    if (
      !parsed ||
      typeof parsed.profileId !== 'string' ||
      typeof parsed.email !== 'string' ||
      typeof parsed.category !== 'string' ||
      typeof parsed.issuedAt !== 'number' ||
      typeof parsed.expiresAt !== 'number' ||
      typeof parsed.signature !== 'string'
    ) {
      clearVerifiedAuthSession();
      return null;
    }

    const now = Date.now();
    if (now >= parsed.expiresAt || parsed.issuedAt > now + 60_000) {
      clearVerifiedAuthSession();
      return null;
    }

    const expectedSig = computeSessionSignature(
      parsed.profileId,
      parsed.email,
      parsed.category as ProfileCategory,
      parsed.issuedAt,
      parsed.expiresAt
    );

    if (expectedSig !== parsed.signature) {
      clearVerifiedAuthSession();
      return null;
    }

    const matchedProfile = profiles.find(
      (p) =>
        p.id === parsed.profileId &&
        p.email.toLowerCase() === parsed.email!.toLowerCase() &&
        p.category === parsed.category
    );

    if (!matchedProfile) {
      clearVerifiedAuthSession();
      return null;
    }

    return {
      profile: matchedProfile,
      session: parsed as VerifiedAuthSession,
    };
  } catch {
    clearVerifiedAuthSession();
    return null;
  }
}
