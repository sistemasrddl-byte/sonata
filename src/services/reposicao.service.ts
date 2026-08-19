import {
  addDoc,
  collection,
  getDocs,
  serverTimestamp,
  updateDoc,
  doc,
} from "firebase/firestore";

import { db } from "@/lib/firebase";
import { getEscolaId } from "@/lib/escola";

import { Reposicao } from "@/types/reposicao";
import { Instrumento } from "@/types/aula";

function reposicoesCollection() {
  const escolaId = getEscolaId();

  return collection(
    db,
    "escolas",
    escolaId,
    "reposicoes"
  );
}

function reposicaoDoc(id: string) {
  const escolaId = getEscolaId();

  return doc(
    db,
    "escolas",
    escolaId,
    "reposicoes",
    id
  );
}

/**
 * Lista todas as reposições da escola.
 */
export async function listarReposicoes(): Promise<
  Reposicao[]
> {
  const snapshot = await getDocs(
    reposicoesCollection()
  );

  return snapshot.docs.map((item) => {
    const data = item.data();

    return {
      id: item.id,

      alunoId: data.alunoId,

      professorId: data.professorId,

      instrumento:
        data.instrumento as Instrumento,

      data: data.data,

      horario: data.horario,

      aulaOrigemId:
        data.aulaOrigemId,

      observacao:
        data.observacao ?? "",

      ativo:
        data.ativo ?? true,

      tipo: "reposicao",

      criadoEm:
        data.criadoEm
          ?.toDate?.()
          ?.toISOString(),
    };
  });
}

/**
 * Cadastra uma nova reposição.
 */
export async function cadastrarReposicao(
  alunoId: string,
  professorId: string,
  instrumento: Instrumento,
  data: string,
  horario: string,
  aulaOrigemId: string,
  observacao?: string
): Promise<string> {
  const ref = await addDoc(
    reposicoesCollection(),
    {
      alunoId,
      professorId,
      instrumento,

      data,
      horario,

      aulaOrigemId,

      observacao:
        observacao?.trim() || "",

      tipo: "reposicao",

      ativo: true,

      criadoEm:
        serverTimestamp(),
    }
  );

  return ref.id;
}

/**
 * Atualiza uma reposição existente.
 */
export async function atualizarReposicao(
  id: string,
  alunoId: string,
  professorId: string,
  instrumento: Instrumento,
  data: string,
  horario: string,
  aulaOrigemId: string,
  observacao?: string
): Promise<void> {
  await updateDoc(
    reposicaoDoc(id),
    {
      alunoId,
      professorId,
      instrumento,

      data,
      horario,

      aulaOrigemId,

      observacao:
        observacao?.trim() || "",
    }
  );
}

/**
 * Desativa a reposição sem apagar
 * o registro do banco.
 */
export async function desativarReposicao(
  id: string
): Promise<void> {
  await updateDoc(
    reposicaoDoc(id),
    {
      ativo: false,
    }
  );
}