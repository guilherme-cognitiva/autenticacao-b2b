import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { Eye, EyeOff, LogIn, Mail, Lock } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { authApi, extractApiError } from "@/api/authApi";
import { useAuthStore } from "@/lib/auth-store";
import AuthShell from "@/components/auth/AuthShell";

const schema = z.object({
  email: z.string().min(1, "Informe o email").email("Email inválido"),
  senha: z.string().min(1, "Informe a senha"),
});
type FormData = z.infer<typeof schema>;

export default function LoginPage() {
  const navigate = useNavigate();
  const setSession = useAuthStore((s) => s.setSession);
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", senha: "" },
  });

  const loginMutation = useMutation({
    mutationFn: (data: FormData) => authApi.login(data),
    onSuccess: (result) => {
      setSession(result);
      toast.success(`Bem-vindo, ${result.usuario.nome.split(" ")[0]}!`);
      navigate("/dashboard", { replace: true });
    },
    onError: (err) => toast.error(extractApiError(err, "Falha ao entrar")),
  });

  return (
    <AuthShell
      title="Entrar"
      description="Acesse sua conta do Portal B2B com seu email corporativo."
      footer={
        <span>
          Ainda não tem conta?{" "}
          <Link to="/registro" className="font-medium text-primary underline-offset-4 hover:underline">
            Cadastrar empresa
          </Link>
        </span>
      }
    >
      <form onSubmit={form.handleSubmit((d) => loginMutation.mutate(d))} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="seu@empresa.com.br"
              className="pl-9"
              {...form.register("email")}
            />
          </div>
          {form.formState.errors.email && (
            <p className="text-xs text-destructive">{form.formState.errors.email.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="senha">Senha</Label>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="senha"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              placeholder="••••••••"
              className="pl-9 pr-9 hide-password-toggle"
              {...form.register("senha")}
            />
            <button
              type="button"
              onClick={() => setShowPassword((s) => !s)}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
              aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {form.formState.errors.senha && (
            <p className="text-xs text-destructive">{form.formState.errors.senha.message}</p>
          )}
        </div>

        <Button type="submit" className="w-full" size="lg" disabled={loginMutation.isPending}>
          <LogIn className="h-4 w-4" />
          {loginMutation.isPending ? "Entrando..." : "Entrar"}
        </Button>
      </form>
    </AuthShell>
  );
}
