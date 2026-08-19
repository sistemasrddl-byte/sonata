export type Instrumento =
  | "Violão"
  | "Teclado"
  | "Bateria";

export type StatusProfessor =
  | "Ativo"
  | "Inativo";

export interface Professor {
  id: string;
  nome: string;
  instrumentos: Instrumento[];
  status: StatusProfessor;

  // Data usada pelo cadastro atual.
  criadoEm?: string;

  // Compatibilidade com relatórios/versões anteriores.
  telefone?: string;
  email?: string;
  createdAt?: Date;
  updatedAt?: Date;
}
