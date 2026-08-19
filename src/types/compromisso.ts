export type StatusCompromisso =
  | "aberto"
  | "quitado";

export type CategoriaCompromisso =
  | "compras"
  | "fornecedores"
  | "equipamentos"
  | "instrumentos"
  | "materiais"
  | "outros";

export interface PagamentoCompromisso {
  id: string;
  data: string;
  valor: number;
  observacao?: string;
}

export interface Compromisso {
  id: string;
  descricao: string;
  valorTotal: number;
  totalPago: number;
  saldoDevedor: number;
  categoria: CategoriaCompromisso;
  dataCompra: string;
  status: StatusCompromisso;
  criadoEm?: string;
}
