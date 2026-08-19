import {
  doc,
  getDoc,
  setDoc,
} from "firebase/firestore";

import { db } from "@/lib/firebase";
import { getEscolaId } from "@/lib/escola";

import { ConfiguracaoEscola } from "@/types/escola";

const configuracaoPadrao: ConfiguracaoEscola = {
  nome: "",
  telefone: "",
  endereco: "",
  cidade: "",
  estado: "",
};

function configuracaoDoc() {
  const escolaId = getEscolaId();

  return doc(
    db,
    "escolas",
    escolaId,
    "configuracoes",
    "geral"
  );
}

export async function buscarConfiguracaoEscola(): Promise<ConfiguracaoEscola> {
  const snapshot = await getDoc(
    configuracaoDoc()
  );

  if (!snapshot.exists()) {
    return configuracaoPadrao;
  }

  const data = snapshot.data();

  return {
    nome: data.nome ?? "",
    telefone: data.telefone ?? "",
    endereco: data.endereco ?? "",
    cidade: data.cidade ?? "",
    estado: data.estado ?? "",
  };
}

export async function salvarConfiguracaoEscola(
  configuracao: ConfiguracaoEscola
): Promise<void> {
  await setDoc(
    configuracaoDoc(),
    {
      nome: configuracao.nome.trim(),
      telefone: configuracao.telefone.trim(),
      endereco: configuracao.endereco.trim(),
      cidade: configuracao.cidade.trim(),
      estado: configuracao.estado.trim(),
    },
    { merge: true }
  );
}
