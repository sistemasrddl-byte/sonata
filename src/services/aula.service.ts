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
  Aula,
  DiaSemana,
  Instrumento,
} from "@/types/aula";

function dataHojeLocal(): string {
  const agora = new Date();

  const ano = agora.getFullYear();
  const mes = String(agora.getMonth() + 1).padStart(2, "0");
  const dia = String(agora.getDate()).padStart(2, "0");

  return `${ano}-${mes}-${dia}`;
}

function aulasCollection() {
  const escolaId = getEscolaId();

  return collection(
    db,
    "escolas",
    escolaId,
    "aulas"
  );
}

function aulaDoc(id: string) {
  const escolaId = getEscolaId();

  return doc(
    db,
    "escolas",
    escolaId,
    "aulas",
    id
  );
}

export async function listarAulas(): Promise<Aula[]> {
  const snapshot = await getDocs(
    aulasCollection()
  );

  return snapshot.docs.map((item) => {
    const data = item.data();

    return {
      id: item.id,
      alunoId: data.alunoId,
      professorId: data.professorId,
      instrumento: data.instrumento,
      diaSemana: data.diaSemana,
      horario: data.horario,
      tipo: "recorrente",
      ativo: data.ativo ?? true,
      criadoEm:
        data.criadoEm
          ?.toDate?.()
          ?.toISOString(),
      dataInicio:
        data.dataInicio ??
        data.criadoEm
          ?.toDate?.()
          ?.toISOString()
          ?.slice(0, 10),
    };
  });
}

export async function cadastrarAula(
  alunoId: string,
  professorId: string,
  instrumento: Instrumento,
  diaSemana: DiaSemana,
  horario: string
): Promise<string> {
  const ref = await addDoc(
    aulasCollection(),
    {
      alunoId,
      professorId,
      instrumento,
      diaSemana,
      horario,
      tipo: "recorrente",
      ativo: true,
      dataInicio: dataHojeLocal(),
      criadoEm: serverTimestamp(),
    }
  );

  return ref.id;
}

export async function atualizarAula(
  id: string,
  alunoId: string,
  professorId: string,
  instrumento: Instrumento,
  diaSemana: DiaSemana,
  horario: string
): Promise<void> {
  await updateDoc(
    aulaDoc(id),
    {
      alunoId,
      professorId,
      instrumento,
      diaSemana,
      horario,
    }
  );
}

/**
 * Desativa a aula sem apagar o documento.
 * Isso preserva o histórico para frequência
 * e relatórios futuros.
 */
export async function desativarAula(
  id: string
): Promise<void> {
  await updateDoc(
    aulaDoc(id),
    {
      ativo: false,
    }
  );
}

/**
 * Mantemos esta função caso futuramente
 * precisemos realmente remover um registro.
 *
 * Para a interface da Agenda, entretanto,
 * vamos usar desativarAula().
 */
export async function excluirAula(
  id: string
): Promise<void> {
  await deleteDoc(
    aulaDoc(id)
  );
}