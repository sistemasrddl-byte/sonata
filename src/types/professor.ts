export type Instrumento =
  | "Violão"
  | "Teclado"
  | "Bateria";

export interface Professor {
  id: string;
  nome: string;
  instrumentos: Instrumento[];
  criadoEm?: string;
}