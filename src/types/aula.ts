export type Instrumento =
  | "Violão"
  | "Teclado"
  | "Bateria";

export type DiaSemana =
  | "domingo"
  | "segunda"
  | "terça"
  | "quarta"
  | "quinta"
  | "sexta"
  | "sábado";

export interface Aula {
  id: string;
  alunoId: string;
  professorId: string;
  instrumento: Instrumento;
  diaSemana: DiaSemana;
  horario: string;
  tipo: "recorrente";
  ativo: boolean;
  criadoEm?: string;
  /** Data a partir da qual a aula começa a existir na agenda. */
  dataInicio?: string;
}