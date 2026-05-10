import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Building2, MapPin, UserPlus, Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { authApi, extractApiError } from "@/api/authApi";
import { useAuthStore } from "@/lib/auth-store";
import AuthShell from "@/components/auth/AuthShell";

const ESTADOS_BR = [
  "AC","AL","AM","AP","BA","CE","DF","ES","GO","MA","MG","MS","MT","PA","PB",
  "PE","PI","PR","RJ","RN","RO","RR","RS","SC","SE","SP","TO",
];

const onlyDigits = (v: string) => v.replace(/\D/g, "");

const schema = z.object({
  empresa: z.object({
    razaoSocial: z.string().min(1, "Informe a razão social").max(255),
    nomeFantasia: z.string().max(255).optional().or(z.literal("")),
    cnpj: z
      .string()
      .min(1, "Informe o CNPJ")
      .refine((v) => onlyDigits(v).length === 14, "CNPJ deve ter 14 dígitos"),
    email: z.string().min(1, "Informe o email da empresa").email("Email inválido"),
    telefone: z.string().max(20).optional().or(z.literal("")),
    perfis: z.array(z.string()).min(1, "Selecione ao menos um perfil"),
  }),
  endereco: z.object({
    cidade: z.string().min(1, "Informe a cidade").max(100),
    estado: z.string().length(2, "UF inválida"),
    cep: z
      .string()
      .min(1, "Informe o CEP")
      .refine((v) => onlyDigits(v).length === 8, "CEP deve ter 8 dígitos"),
  }),
  usuario: z.object({
    nome: z.string().min(1, "Informe seu nome").max(150),
    email: z.string().min(1, "Informe seu email").email("Email inválido"),
    senha: z.string().min(8, "Senha deve ter no mínimo 8 caracteres").max(100),
    telefone: z.string().max(20).optional().or(z.literal("")),
  }),
});

type FormData = z.infer<typeof schema>;

const PERFIS_DISPONIVEIS = [
  { value: "FORNECEDOR", label: "Fornecedor", description: "Vende produtos/serviços" },
  { value: "COMPRADOR", label: "Comprador", description: "Adquire produtos/serviços" },
  { value: "TRANSPORTADORA", label: "Transportadora", description: "Realiza fretes" },
];

const TABS = ["empresa", "endereco", "usuario"] as const;
type TabKey = (typeof TABS)[number];

export default function RegistroPage() {
  const navigate = useNavigate();
  const setSession = useAuthStore((s) => s.setSession);
  const [tab, setTab] = useState<TabKey>("empresa");
  const [showPassword, setShowPassword] = useState(false);

  useQuery({
    queryKey: ["perfis"],
    queryFn: () => authApi.listarPerfis(),
    staleTime: 5 * 60 * 1000,
  });

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    mode: "onTouched",
    defaultValues: {
      empresa: { razaoSocial: "", nomeFantasia: "", cnpj: "", email: "", telefone: "", perfis: [] },
      endereco: { cidade: "", estado: "", cep: "" },
      usuario: { nome: "", email: "", senha: "", telefone: "" },
    },
  });

  const registroMutation = useMutation({
    mutationFn: (data: FormData) =>
      authApi.registrar({
        empresa: {
          razaoSocial: data.empresa.razaoSocial,
          nomeFantasia: data.empresa.nomeFantasia || null,
          cnpj: onlyDigits(data.empresa.cnpj),
          email: data.empresa.email,
          telefone: data.empresa.telefone || null,
          perfis: data.empresa.perfis,
        },
        endereco: {
          cidade: data.endereco.cidade,
          estado: data.endereco.estado,
          cep: onlyDigits(data.endereco.cep),
        },
        usuario: {
          nome: data.usuario.nome,
          email: data.usuario.email,
          senha: data.usuario.senha,
          telefone: data.usuario.telefone || null,
        },
      }),
    onSuccess: (result) => {
      setSession(result);
      toast.success("Cadastro concluído! Bem-vindo ao Portal B2B.");
      navigate("/dashboard", { replace: true });
    },
    onError: (err) => toast.error(extractApiError(err, "Falha ao cadastrar")),
  });

  async function avancarPara(proxima: TabKey) {
    let valido = true;
    if (tab === "empresa") {
      valido = await form.trigger(["empresa.razaoSocial", "empresa.cnpj", "empresa.email", "empresa.perfis"]);
    } else if (tab === "endereco") {
      valido = await form.trigger(["endereco.cidade", "endereco.estado", "endereco.cep"]);
    }
    if (!valido) {
      toast.error("Corrija os campos destacados antes de prosseguir.");
      return;
    }
    setTab(proxima);
  }

  const errs = form.formState.errors;

  return (
    <AuthShell
      wide
      title="Cadastrar empresa"
      description="Preencha os dados da sua empresa, endereço e do usuário administrador."
      footer={
        <span>
          Já tem conta?{" "}
          <Link to="/login" className="font-medium text-primary underline-offset-4 hover:underline">
            Entrar
          </Link>
        </span>
      }
    >
      <form onSubmit={form.handleSubmit((d) => registroMutation.mutate(d))} className="space-y-6">
        <Tabs value={tab} onValueChange={(v) => setTab(v as TabKey)}>
          <TabsList className="grid w-full grid-cols-3 gap-1 bg-muted/60 p-1">
            <TabsTrigger value="empresa" className="gap-2 data-[state=active]:bg-card data-[state=active]:text-primary">
              <Building2 className="h-4 w-4" /> Empresa
            </TabsTrigger>
            <TabsTrigger value="endereco" className="gap-2 data-[state=active]:bg-card data-[state=active]:text-primary">
              <MapPin className="h-4 w-4" /> Endereço
            </TabsTrigger>
            <TabsTrigger value="usuario" className="gap-2 data-[state=active]:bg-card data-[state=active]:text-primary">
              <UserPlus className="h-4 w-4" /> Usuário
            </TabsTrigger>
          </TabsList>

          {/* Empresa */}
          <TabsContent value="empresa" className="mt-5 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="razaoSocial">Razão social *</Label>
                <Input id="razaoSocial" maxLength={255} {...form.register("empresa.razaoSocial")} />
                {errs.empresa?.razaoSocial && (
                  <p className="text-xs text-destructive">{errs.empresa.razaoSocial.message}</p>
                )}
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="nomeFantasia">Nome fantasia</Label>
                <Input id="nomeFantasia" maxLength={255} {...form.register("empresa.nomeFantasia")} />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="cnpj">CNPJ *</Label>
                <Input id="cnpj" placeholder="00000000000000" maxLength={18} {...form.register("empresa.cnpj")} />
                {errs.empresa?.cnpj && (
                  <p className="text-xs text-destructive">{errs.empresa.cnpj.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="empresaTelefone">Telefone</Label>
                <Input id="empresaTelefone" maxLength={20} {...form.register("empresa.telefone")} />
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="empresaEmail">Email da empresa *</Label>
                <Input id="empresaEmail" type="email" {...form.register("empresa.email")} />
                {errs.empresa?.email && (
                  <p className="text-xs text-destructive">{errs.empresa.email.message}</p>
                )}
              </div>

              <div className="space-y-2 sm:col-span-2">
                <Label>Perfis da empresa *</Label>
                <Controller
                  control={form.control}
                  name="empresa.perfis"
                  render={({ field }) => (
                    <div className="grid gap-2 sm:grid-cols-3">
                      {PERFIS_DISPONIVEIS.map((p) => {
                        const checked = field.value.includes(p.value);
                        return (
                          <label
                            key={p.value}
                            className={`flex cursor-pointer items-start gap-3 rounded-md border p-3 transition-colors ${
                              checked
                                ? "border-primary bg-accent"
                                : "border-input hover:border-primary/40 hover:bg-muted/50"
                            }`}
                          >
                            <Checkbox
                              checked={checked}
                              onCheckedChange={(v) => {
                                if (v) field.onChange([...field.value, p.value]);
                                else field.onChange(field.value.filter((x) => x !== p.value));
                              }}
                            />
                            <div className="min-w-0">
                              <p className="text-sm font-medium leading-none">{p.label}</p>
                              <p className="mt-1 text-xs text-muted-foreground">{p.description}</p>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  )}
                />
                {errs.empresa?.perfis && (
                  <p className="text-xs text-destructive">{errs.empresa.perfis.message as string}</p>
                )}
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button type="button" onClick={() => avancarPara("endereco")}>
                Próximo
              </Button>
            </div>
          </TabsContent>

          {/* Endereço */}
          <TabsContent value="endereco" className="mt-5 space-y-4">
            <div className="grid gap-4 sm:grid-cols-6">
              <div className="space-y-1.5 sm:col-span-3">
                <Label htmlFor="cidade">Cidade *</Label>
                <Input id="cidade" maxLength={100} {...form.register("endereco.cidade")} />
                {errs.endereco?.cidade && (
                  <p className="text-xs text-destructive">{errs.endereco.cidade.message}</p>
                )}
              </div>

              <div className="space-y-1.5 sm:col-span-1">
                <Label htmlFor="estado">UF *</Label>
                <Controller
                  control={form.control}
                  name="endereco.estado"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger id="estado">
                        <SelectValue placeholder="UF" />
                      </SelectTrigger>
                      <SelectContent>
                        {ESTADOS_BR.map((uf) => (
                          <SelectItem key={uf} value={uf}>
                            {uf}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errs.endereco?.estado && (
                  <p className="text-xs text-destructive">{errs.endereco.estado.message}</p>
                )}
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="cep">CEP *</Label>
                <Input id="cep" placeholder="00000000" maxLength={9} {...form.register("endereco.cep")} />
                {errs.endereco?.cep && (
                  <p className="text-xs text-destructive">{errs.endereco.cep.message}</p>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <Button type="button" variant="outline" onClick={() => setTab("empresa")}>
                Voltar
              </Button>
              <Button type="button" onClick={() => avancarPara("usuario")}>
                Próximo
              </Button>
            </div>
          </TabsContent>

          {/* Usuário */}
          <TabsContent value="usuario" className="mt-5 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="nomeUsuario">Nome completo *</Label>
                <Input id="nomeUsuario" maxLength={150} {...form.register("usuario.nome")} />
                {errs.usuario?.nome && (
                  <p className="text-xs text-destructive">{errs.usuario.nome.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="emailUsuario">Email *</Label>
                <Input
                  id="emailUsuario"
                  type="email"
                  autoComplete="email"
                  {...form.register("usuario.email")}
                />
                {errs.usuario?.email && (
                  <p className="text-xs text-destructive">{errs.usuario.email.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="usuarioTelefone">Telefone</Label>
                <Input id="usuarioTelefone" maxLength={20} {...form.register("usuario.telefone")} />
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="senhaUsuario">Senha *</Label>
                <div className="relative">
                  <Input
                    id="senhaUsuario"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    placeholder="Mínimo 8 caracteres"
                    className="pr-9 hide-password-toggle"
                    {...form.register("usuario.senha")}
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
                {errs.usuario?.senha && (
                  <p className="text-xs text-destructive">{errs.usuario.senha.message}</p>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <Button type="button" variant="outline" onClick={() => setTab("endereco")}>
                Voltar
              </Button>
              <Button type="submit" disabled={registroMutation.isPending}>
                <UserPlus className="h-4 w-4" />
                {registroMutation.isPending ? "Cadastrando..." : "Concluir cadastro"}
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </form>
    </AuthShell>
  );
}
