export type TipoDespesa = "fixa" | "variavel";

export type StatusDespesa = "pendente" | "paga" | "atrasada";

export type FormaPagamentoDespesa =
  | "pix"
  | "dinheiro"
  | "cartao"
  | "transferencia"
  | "boleto"
  | "outro";

export type CategoriaDespesa =
  | "aluguel"
  | "energia"
  | "agua"
  | "internet"
  | "telefone"
  | "salarios"
  | "impostos"
  | "materiais"
  | "manutencao"
  | "marketing"
  | "transporte"
  | "equipamentos"
  | "taxas"
  | "alimentacao"
  | "outros";

export interface Despesa {
  id: string;
  descricao: string;
  tipo: TipoDespesa;
  categoria: CategoriaDespesa;
  valor: number;
  dataVencimento: string;
  dataPagamento?: string;
  status: StatusDespesa;
  formaPagamento?: FormaPagamentoDespesa;
  observacao?: string;
  criadoEm?: string;
}
