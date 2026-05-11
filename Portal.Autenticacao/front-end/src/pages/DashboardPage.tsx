import {
  LogOut,
  ShieldCheck,
  Users,
  Package,
  Truck,
  ShoppingCart,
  Store,
  Handshake,
  ClipboardList,
  Map,
  Building2,
  ArrowUpRight,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/lib/auth-store";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";

interface ModuleCard {
  key: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  href?: string;
  status: "ativo" | "pendente";
}

const MODULES: ModuleCard[] = [
  {
    key: "usuarios",
    title: "Usuários",
    description: "Cadastro de usuários e gestão de empresas do portal.",
    icon: Users,
    status: "ativo",
  },
  {
    key: "produtos",
    title: "Produtos",
    description: "Catálogo de produtos, categorias, unidades de medida e transportes.",
    icon: Package,
    href: "/produtos/",
    status: "ativo",
  },
  {
    key: "fornecimentos",
    title: "Fornecimentos",
    description: "Ofertas de fornecedores com preço, quantidade e local de origem.",
    icon: Store,
    status: "pendente",
  },
  {
    key: "demanda",
    title: "Demandas",
    description: "Necessidades de compra cadastradas pelos compradores.",
    icon: ClipboardList,
    status: "pendente",
  },
  {
    key: "mercado",
    title: "Mercado",
    description: "Visão consolidada de oferta x demanda do portal.",
    icon: Building2,
    status: "pendente",
  },
  {
    key: "negociacao",
    title: "Negociação",
    description: "Processos de negociação direta, leilão direto e leilão reverso.",
    icon: Handshake,
    status: "pendente",
  },
  {
    key: "pedidos",
    title: "Pedidos",
    description: "Pedidos confirmados e acompanhamento dos status de cada um.",
    icon: ShoppingCart,
    status: "pendente",
  },
  {
    key: "logistica",
    title: "Logística",
    description: "Solicitações de frete, cotações e seleção de transportadora.",
    icon: Map,
    href: "/logistica/",
    status: "ativo",
  },
];

export default function DashboardPage() {
  const navigate = useNavigate();
  const { usuario, empresa, clear } = useAuthStore();

  function handleLogout() {
    clear();
    navigate("/login", { replace: true });
  }

  function handleClickModule(mod: ModuleCard) {
    if (mod.status !== "ativo" || !mod.href) return;
    window.location.assign(mod.href);
  }

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,hsl(var(--accent))_0%,hsl(var(--background))_42%,hsl(var(--muted))_100%)]">
      <header className="sticky top-0 z-10 flex items-center justify-between border-b bg-card/80 px-4 py-4 backdrop-blur sm:px-8">
        <div className="flex items-center gap-2 text-primary">
          <span className="grid h-9 w-9 place-items-center rounded-md bg-primary text-primary-foreground">
            <ShieldCheck className="h-5 w-5" />
          </span>
          <div className="leading-tight">
            <p className="text-sm font-semibold">Portal B2B</p>
            <p className="text-xs text-muted-foreground">{empresa?.razaoSocial ?? "Sessão autenticada"}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden text-right sm:block">
            <p className="text-sm font-medium leading-tight">{usuario?.nome}</p>
            <p className="text-xs text-muted-foreground leading-tight">{usuario?.email}</p>
          </div>
          <ThemeToggle />
          <Button variant="outline" size="sm" onClick={handleLogout}>
            <LogOut className="h-4 w-4" /> Sair
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
        <section className="mb-8">
          <h1 className="text-2xl font-semibold tracking-tight text-primary sm:text-3xl">
            Olá, {usuario?.nome.split(" ")[0] ?? "usuário"}!
          </h1>
          <p className="mt-1 text-sm text-muted-foreground sm:text-base">
            Bem-vindo ao Portal B2B. Selecione um módulo abaixo para começar.
          </p>
          {empresa?.perfis && empresa.perfis.length > 0 && (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="text-xs uppercase tracking-wide text-muted-foreground">
                Perfis da empresa:
              </span>
              {empresa.perfis.map((p) => (
                <span
                  key={p}
                  className="rounded-md border border-primary/20 bg-accent px-2 py-0.5 text-xs font-medium text-primary"
                >
                  {p}
                </span>
              ))}
            </div>
          )}
        </section>

        <section>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {MODULES.map((mod) => {
              const Icon = mod.icon;
              const isActive = mod.status === "ativo" && !!mod.href;
              const isCurrent = mod.key === "usuarios";
              return (
                <button
                  key={mod.key}
                  type="button"
                  disabled={!isActive && !isCurrent}
                  onClick={() => handleClickModule(mod)}
                  className={`group relative flex flex-col items-start gap-3 rounded-lg border bg-card p-5 text-left shadow-card transition-all
                    ${isActive ? "hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-elevated cursor-pointer" : ""}
                    ${isCurrent ? "border-primary/40 ring-1 ring-primary/20" : ""}
                    ${!isActive && !isCurrent ? "opacity-60 cursor-not-allowed" : ""}`}
                >
                  <div className="flex w-full items-start justify-between">
                    <span
                      className={`grid h-10 w-10 place-items-center rounded-md ${
                        isActive || isCurrent
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                    </span>
                    {isActive && (
                      <ArrowUpRight className="h-4 w-4 text-muted-foreground transition-colors group-hover:text-primary" />
                    )}
                  </div>

                  <div className="flex-1">
                    <h2 className="text-base font-semibold leading-tight text-foreground">{mod.title}</h2>
                    <p className="mt-1 text-sm text-muted-foreground">{mod.description}</p>
                  </div>

                  <div className="mt-1">
                    {isCurrent && (
                      <span className="inline-flex items-center rounded-md bg-success/10 px-2 py-0.5 text-xs font-medium text-success">
                        Você está aqui
                      </span>
                    )}
                    {isActive && !isCurrent && (
                      <span className="inline-flex items-center rounded-md bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                        Disponível
                      </span>
                    )}
                    {!isActive && !isCurrent && (
                      <span className="inline-flex items-center rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                        Aguardando front
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </section>
      </main>

      <footer className="px-4 py-6 text-center text-xs text-muted-foreground sm:px-8">
        © {new Date().getFullYear()} Portal B2B · {empresa?.razaoSocial ?? ""}
      </footer>
    </div>
  );
}
