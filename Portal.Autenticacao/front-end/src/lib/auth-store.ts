import { create } from "zustand";
import type { EmpresaOutput, LoginOutput, UsuarioOutput } from "@/types/auth";

// Padrao do portal B2B: token vive em sessionStorage (some ao fechar navegador).
// Chave alinhada com o front do produtos-service (`portal_b2b_jwt`) para o portal
// pai conseguir, no futuro, injetar o token via query string em qualquer MS.
const TOKEN_KEY = "portal_b2b_jwt";
const SESSION_KEY = "portal_b2b_session";

interface SessionState {
  token: string | null;
  expiraEm: string | null;
  usuario: UsuarioOutput | null;
  empresa: EmpresaOutput | null;
  setSession: (data: LoginOutput) => void;
  clear: () => void;
}

function tokenExpirado(expiraEm: string | null): boolean {
  if (!expiraEm) return false;
  const exp = new Date(expiraEm).getTime();
  if (Number.isNaN(exp)) return true;
  return Date.now() >= exp;
}

function readPersisted(): Pick<SessionState, "token" | "expiraEm" | "usuario" | "empresa"> {
  try {
    const token = sessionStorage.getItem(TOKEN_KEY);
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!token || !raw) {
      return { token: null, expiraEm: null, usuario: null, empresa: null };
    }
    const parsed = JSON.parse(raw) as Omit<LoginOutput, "token">;

    // Se ja expirou, limpa imediatamente e nao restaura
    if (tokenExpirado(parsed.expiraEm)) {
      sessionStorage.removeItem(TOKEN_KEY);
      sessionStorage.removeItem(SESSION_KEY);
      return { token: null, expiraEm: null, usuario: null, empresa: null };
    }

    return {
      token,
      expiraEm: parsed.expiraEm,
      usuario: parsed.usuario,
      empresa: parsed.empresa,
    };
  } catch {
    return { token: null, expiraEm: null, usuario: null, empresa: null };
  }
}

export const useAuthStore = create<SessionState>((set) => ({
  ...readPersisted(),
  setSession: (data) => {
    sessionStorage.setItem(TOKEN_KEY, data.token);
    sessionStorage.setItem(
      SESSION_KEY,
      JSON.stringify({ expiraEm: data.expiraEm, usuario: data.usuario, empresa: data.empresa }),
    );
    set({
      token: data.token,
      expiraEm: data.expiraEm,
      usuario: data.usuario,
      empresa: data.empresa,
    });
  },
  clear: () => {
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(SESSION_KEY);
    set({ token: null, expiraEm: null, usuario: null, empresa: null });
  },
}));

// Helper pra usar fora do React (ex: interceptor axios)
export function getAuthToken(): string | null {
  return sessionStorage.getItem(TOKEN_KEY);
}

export function clearAuth(): void {
  sessionStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(SESSION_KEY);
  useAuthStore.setState({ token: null, expiraEm: null, usuario: null, empresa: null });
}
