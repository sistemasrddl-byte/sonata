export type StatusMensalidade =
  | "pendente"
  | "pago"
  | "atrasado"
  | "cancelado";

export type FormaPagamento =
  | "dinheiro"
  | "pix"
  | "cartao"
  | "transferencia"
  | "outro";

export interface Mensalidade {
  id: string;

  alunoId: string;

  valor: number;

  /**
   * Mês ao qual a mensalidade pertence.
   * Formato: YYYY-MM
   */
  competencia: string;

  /**
   * Data em que a mensalidade foi gerada.
   * Formato: YYYY-MM-DD
   */
  dataGeracao: string;

  /**
   * Dia escolhido para vencimento.
   * Ex.: 5, 10, 30.
   */
  diaVencimento: number;

  /**
   * Data efetiva do vencimento.
   * Formato: YYYY-MM-DD
   */
  dataVencimento: string;

  status: StatusMensalidade;

  dataPagamento?: string;

  formaPagamento?: FormaPagamento;

  observacao?: string;

  criadoEm?: string;

  atualizadoEm?: string;
}

/**
 * Configuração financeira recorrente de um aluno.
 *
 * Ela define como as próximas mensalidades devem ser geradas.
 */
export interface ConfiguracaoFinanceiraAluno {
  id: string;

  alunoId: string;

  /**
   * Valor padrão para novas mensalidades.
   */
  valorMensalidade: number;

  /**
   * Dia padrão de vencimento.
   */
  diaVencimento: number;

  /**
   * Primeiro mês em que a escola começa a cobrar.
   * Formato: YYYY-MM
   */
  primeiraCompetencia: string;

  /**
   * Data em que a configuração foi criada.
   */
  dataInicio: string;

  ativo: boolean;

  criadoEm?: string;

  atualizadoEm?: string;
}
