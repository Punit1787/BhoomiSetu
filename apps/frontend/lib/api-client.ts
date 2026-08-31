import { useAuthStore } from "./auth-store";
import type { AuthTokens, CaseDetail, CaseSummary } from "./types";

const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:8000";

async function refreshAccessToken(): Promise<string | null> {
  const state = useAuthStore.getState();
  if (!state.refreshToken || state.demoMode) return null;
  const response = await fetch(`${API_URL}/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh_token: state.refreshToken }),
  });
  if (!response.ok) return null;
  const tokens = (await response.json()) as AuthTokens;
  state.setSession(tokens);
  return tokens.access_token;
}

export async function apiFetch<T>(path: string, init: RequestInit = {}, retry = true): Promise<T> {
  const token = useAuthStore.getState().accessToken;
  const headers = new Headers(init.headers);
  if (!(init.body instanceof FormData)) headers.set("Content-Type", "application/json");
  if (token) headers.set("Authorization", `Bearer ${token}`);
  const response = await fetch(`${API_URL}${path}`, { ...init, headers });
  if (response.status === 401 && retry) {
    const refreshed = await refreshAccessToken();
    if (refreshed) return apiFetch<T>(path, init, false);
  }
  if (!response.ok) throw new Error((await response.text()) || `Request failed: ${response.status}`);
  return response.json() as Promise<T>;
}

export const api = {
  login: (email: string, password: string) => apiFetch<AuthTokens>("/auth/login", {
    method: "POST", body: JSON.stringify({ email, password }),
  }),
  cases: () => apiFetch<CaseSummary[]>("/cases"),
  caseDetail: (id: string) => apiFetch<CaseDetail>(`/cases/${id}`),
  transition: (id: string, notes: string) => apiFetch<CaseSummary>(`/cases/${id}/transition`, {
    method: "POST", body: JSON.stringify({ notes }),
  }),
};
