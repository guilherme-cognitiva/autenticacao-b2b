import { create } from "zustand";
import type { EmpresaOutput, LoginOutput, UsuarioOutput } from "@/types/auth";

const TOKEN_KEY = "auth_token";
const SESSION_KEY = "auth_session";

interface SessionState {
  token: string | null;
  expiraEm: string | null;
  usuario: UsuarioOutput | null;
  empresa: EmpresaOutput | null;
  setSession: (data: LoginOutput) => void;
  clear: () => void;
}

function readPersisted(): Pick<SessionState, "token" | "expiraEm" | "usuario" | "empresa"> {
  try {
    const token = localStorage.getItem(TOKEN_KEY);
    const raw = localStorage.getItem(SESSION_KEY);
    if (!token || !raw) {
      return { token: null, expiraEm: null, usuario: null, empresa: null };
    }
    const parsed = JSON.parse(raw) as Omit<LoginOutput, "token">;
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
    localStorage.setItem(TOKEN_KEY, data.token);
    localStorage.setItem(
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
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(SESSION_KEY);
    set({ token: null, expiraEm: null, usuario: null, empresa: null });
  },
}));
