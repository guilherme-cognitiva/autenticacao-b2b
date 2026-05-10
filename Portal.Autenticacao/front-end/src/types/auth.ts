export interface ApiResponse<T> {
  statusHttp: number;
  mensagem: string;
  resultado: T;
  erros: string[];
}

export interface UsuarioOutput {
  id: string;
  empresaId: string;
  nome: string;
  email: string;
  telefone?: string | null;
  status: string;
  dataCadastro: string;
}

export interface EmpresaOutput {
  id: string;
  razaoSocial: string;
  nomeFantasia?: string | null;
  cnpj: string;
  email: string;
  telefone?: string | null;
  status: string;
  perfis: string[];
}

export interface LoginOutput {
  token: string;
  expiraEm: string;
  usuario: UsuarioOutput;
  empresa: EmpresaOutput;
}

export interface PerfilOutput {
  id: string;
  nome: string;
}

export interface LoginInput {
  email: string;
  senha: string;
}

export interface RegistroInput {
  empresa: {
    razaoSocial: string;
    nomeFantasia?: string | null;
    cnpj: string;
    email: string;
    telefone?: string | null;
    perfis: string[];
  };
  endereco: {
    cidade: string;
    estado: string;
    cep: string;
  };
  usuario: {
    nome: string;
    email: string;
    senha: string;
    telefone?: string | null;
  };
}
