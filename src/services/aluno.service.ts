import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";

import { db } from "@/lib/firebase";
import { getEscolaId } from "@/lib/escola";

import {
  Aluno,
  Instrumento,
} from "@/types/aluno";

function alunosCollection() {
  const escolaId = getEscolaId();

  return collection(
    db,
    "escolas",
    escolaId,
    "alunos"
  );
}

function alunoDoc(id: string) {
  const escolaId = getEscolaId();

  return doc(
    db,
    "escolas",
    escolaId,
    "alunos",
    id
  );
}

export async function listarAlunos(): Promise<Aluno[]> {
  const snapshot = await getDocs(
    alunosCollection()
  );

  return snapshot.docs.map((item) => {
    const data = item.data();

    return {
      id: item.id,
      nome: data.nome ?? "",
      dataNascimento:
        data.dataNascimento ?? "",
      responsavel:
        data.responsavel ?? "",

      instrumentos: Array.isArray(
        data.instrumentos
      )
        ? data.instrumentos
        : data.instrumento
          ? [data.instrumento]
          : [],

      criadoEm:
        data.criadoEm
          ?.toDate?.()
          ?.toISOString(),
    };
  });
}

export async function cadastrarAluno(
  nome: string,
  dataNascimento: string,
  responsavel: string,
  instrumentos: Instrumento[]
): Promise<string> {
  const ref = await addDoc(
    alunosCollection(),
    {
      nome,
      dataNascimento,
      responsavel,
      instrumentos,
      criadoEm: serverTimestamp(),
    }
  );

  return ref.id;
}

export async function atualizarAluno(
  id: string,
  nome: string,
  dataNascimento: string,
  responsavel: string,
  instrumentos: Instrumento[]
): Promise<void> {
  await updateDoc(
    alunoDoc(id),
    {
      nome,
      dataNascimento,
      responsavel,
      instrumentos,
    }
  );
}

export async function excluirAluno(
  id: string
): Promise<void> {
  await deleteDoc(
    alunoDoc(id)
  );
}