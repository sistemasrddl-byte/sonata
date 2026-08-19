import { Instrumento } from "@/types/aula";

export interface Reposicao {
  id: string;

  alunoId: string;

  professorId: string;

  instrumento: Instrumento;

  data: string;

  horario: string;

  /**
   * Aula recorrente que originou a reposição.
   */
  aulaOrigemId: string;

  /**
   * Observação opcional sobre a reposição.
   */
  observacao?: string;

  /**
   * Permite cancelar a reposição
   * sem apagar o registro do banco.
   */
  ativo: boolean;

  tipo: "reposicao";

  criadoEm?: string;
}