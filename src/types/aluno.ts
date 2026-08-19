export type Instrumento =
  | "Violão"
  | "Teclado"
  | "Bateria";

export interface Aluno {
  id: string;
  nome: string;
  dataNascimento: string;
  responsavel: string;
  instrumentos: Instrumento[];
  criadoEm?: string;
}