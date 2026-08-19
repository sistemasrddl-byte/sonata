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
  Instrumento,
  Professor,
} from "@/types/professor";

function professoresCollection() {
  const escolaId = getEscolaId();

  return collection(
    db,
    "escolas",
    escolaId,
    "professores"
  );
}

function professorDoc(id: string) {
  const escolaId = getEscolaId();

  return doc(
    db,
    "escolas",
    escolaId,
    "professores",
    id
  );
}

export async function listarProfessores(): Promise<
  Professor[]
> {
  const snapshot = await getDocs(
    professoresCollection()
  );

  return snapshot.docs.map((item) => {
    const data = item.data();

    return {
      id: item.id,
      nome: data.nome ?? "",
      instrumentos: Array.isArray(data.instrumentos)
        ? data.instrumentos
        : data.instrumento
          ? [data.instrumento]
          : [],
      status:
        data.status === "Inativo"
          ? "Inativo"
          : "Ativo",
      criadoEm:
        data.criadoEm
          ?.toDate?.()
          ?.toISOString(),
    };
  });
}

export async function cadastrarProfessor(
  nome: string,
  instrumentos: Instrumento[],
  status: Professor["status"] = "Ativo"
): Promise<string> {
  const ref = await addDoc(
    professoresCollection(),
    {
      nome,
      instrumentos,
      status,
      criadoEm: serverTimestamp(),
    }
  );

  return ref.id;
}

export async function atualizarProfessor(
  id: string,
  nome: string,
  instrumentos: Instrumento[],
  status: Professor["status"] = "Ativo"
): Promise<void> {
  await updateDoc(
    professorDoc(id),
    {
      nome,
      instrumentos,
      status,
    }
  );
}

export async function excluirProfessor(
  id: string
): Promise<void> {
  await deleteDoc(
    professorDoc(id)
  );
}
