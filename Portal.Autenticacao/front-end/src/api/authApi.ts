import axios, { AxiosError } from "axios";
import type {
  ApiResponse,
  LoginInput,
  LoginOutput,
  PerfilOutput,
  RegistroInput,
  UsuarioOutput,
} from "@/types/auth";

const baseURL =
  (import.meta.env.VITE_AUTH_API_URL as string | undefined)?.trim() || "/api";

export const authHttp = axios.create({
  baseURL,
  headers: { "Content-Type": "application/json" },
});

authHttp.interceptors.request.use((config) => {
  const token = localStorage.getItem("auth_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export function extractApiError(err: unknown, fallback = "Erro inesperado"): string {
  if (err instanceof AxiosError) {
    const data = err.response?.data as ApiResponse<unknown> | undefined;
    if (data?.erros && data.erros.length > 0) return data.erros.join(", ");
    if (data?.mensagem) return data.mensagem;
    return err.message || fallback;
  }
  if (err instanceof Error) return err.message;
  return fallback;
}

async function unwrap<T>(p: Promise<{ data: ApiResponse<T> }>): Promise<T> {
  const res = await p;
  return res.data.resultado;
}

export const authApi = {
  login: (input: LoginInput) => unwrap<LoginOutput>(authHttp.post("/auth/login", input)),
  registrar: (input: RegistroInput) => unwrap<LoginOutput>(authHttp.post("/auth/registro", input)),
  listarPerfis: () => unwrap<PerfilOutput[]>(authHttp.get("/auth/perfis")),
  obterAtual: () => unwrap<UsuarioOutput>(authHttp.get("/auth/me")),
};
