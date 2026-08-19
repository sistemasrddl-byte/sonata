import { Instrumento } from "@/types/aula";

export type StatusFrequencia =
  | "presente"
  | "falta"
  | "justificada"
  | "cancelada";

export type TipoFrequencia =
  | "aula"
  | "reposicao";

export interface Frequencia {
  id: string;

  alunoId: string;

  professorId: string;

  instrumento: Instrumento;

  data: string;

  horario: string;

  status: StatusFrequencia;

  tipo: TipoFrequencia;

  aulaId?: string;

  reposicaoId?: string;

  observacao?: string;

  criadoEm?: string;

  atualizadoEm?: string;
}