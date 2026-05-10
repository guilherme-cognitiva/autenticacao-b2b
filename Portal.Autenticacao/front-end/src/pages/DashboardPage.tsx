import { LogOut, ShieldCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/lib/auth-store";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";

export default function DashboardPage() {
  const navigate = useNavigate();
  const { usuario, empresa, clear } = useAuthStore();

  function handleLogout() {
    clear();
    navigate("/login", { replace: true });
  }

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,hsl(var(--accent))_0%,hsl(var(--background))_42%,hsl(var(--muted))_100%)]">
      <header className="flex items-center justify-between border-b bg-card/80 px-4 py-4 backdrop-blur sm:px-8">
        <div className="flex items-center gap-2 text-primary">
          <span className="grid h-9 w-9 place-items-center rounded-md bg-primary text-primary-foreground">
            <ShieldCheck className="h-5 w-5" />
          </span>
          <div className="leading-tight">
            <p className="text-sm font-semibold">Portal B2B</p>
            <p className="text-xs text-muted-foreground">Sessão autenticada</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Button variant="outline" size="sm" onClick={handleLogout}>
            <LogOut className="h-4 w-4" /> Sair
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <div className="rounded-lg border bg-card p-6 shadow-elevated">
          <h1 className="text-2xl font-semibold tracking-tight text-primary">
            Olá, {usuario?.nome.split(" ")[0] ?? "usuário"}!
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Você está autenticado. Esta é uma tela de exemplo só para confirmar o login.
          </p>

          <dl className="mt-6 grid gap-4 sm:grid-cols-2">
            <Field label="Nome" value={usuario?.nome} />
            <Field label="Email" value={usuario?.email} />
            <Field label="Empresa" value={empresa?.razaoSocial} />
            <Field label="CNPJ" value={empresa?.cnpj} />
            <Field label="Perfis" value={empresa?.perfis.join(", ")} />
            <Field label="Status" value={usuario?.status} />
          </dl>
        </div>
      </main>
    </div>
  );
}

function Field({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="rounded-md border bg-muted/40 px-3 py-2">
      <dt className="text-xs uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 text-sm font-medium">{value || "—"}</dd>
    </div>
  );
}
