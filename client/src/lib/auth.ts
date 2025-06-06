import { User } from "@/types/api";

export const AUTH_TOKEN_KEY = "wikistore_auth_token";
export const USER_KEY = "wikistore_user";

export function setAuthToken(token: string): void {
  localStorage.setItem(AUTH_TOKEN_KEY, token);
  // Trigger auth change event for same-tab updates
  window.dispatchEvent(new Event('authChange'));
}

export function getAuthToken(): string | null {
  return localStorage.getItem(AUTH_TOKEN_KEY);
}

export function removeAuthToken(): void {
  localStorage.removeItem(AUTH_TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function setUser(user: User): void {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function getUser(): User | null {
  const userStr = localStorage.getItem(USER_KEY);
  if (!userStr) return null;
  
  try {
    return JSON.parse(userStr);
  } catch {
    return null;
  }
}

export function isAuthenticated(): boolean {
  return !!getAuthToken();
}

export function isAdmin(): boolean {
  const user = getUser();
  return user?.tenantId === null;
}

export function isMerchant(): boolean {
  const user = getUser();
  return user?.tenantId !== null && user?.tenantId !== undefined;
}

export function getUserTenantId(): number | null {
  const user = getUser();
  return user?.tenantId || null;
}
