import {
  addDoc,
  collection,
  getDocs,
  query,
  updateDoc,
  where,
  doc,
  serverTimestamp,
} from "firebase/firestore";

import { db } from "@/lib/firebase";
import { getEscolaId } from "@/lib/escola";

import {
  Frequencia,
  StatusFrequencia,
  TipoFrequencia,
} from "@/types/frequencia";

import { Instrumento } from "@/types/aula";

/* =========================================================
   COLLECTION
========================================================= */

function frequenciasCollection() {
  const escolaId = getEscolaId();

  return collection(
    db,
    "escolas",
    escolaId,
    "frequencias"
  );
}

/* =========================================================
   DOCUMENTO
========================================================= */

function frequenciaDoc(
  id: string
) {
  const escolaId = getEscolaId();

  return doc(
    db,
    "escolas",
    escolaId,
    "frequencias",
    id
  );
}

/* =========================================================
   LISTAR TODAS
========================================================= */

export async function listarFrequencias(): Promise<
  Frequencia[]
> {
  const snapshot = await getDocs(
    frequenciasCollection()
  );

  return snapshot.docs.map(
    (item) => {
      const data = item.data();

      return {
        id: item.id,

        alunoId:
          data.alunoId,

        professorId:
          data.professorId,

        instrumento:
          data.instrumento as Instrumento,

        data:
          data.data,

        horario:
          data.horario,

        status:
          data.status as StatusFrequencia,

        tipo:
          data.tipo as TipoFrequencia,

        aulaId:
          data.aulaId,

        reposicaoId:
          data.reposicaoId,

        observacao:
          data.observacao ?? "",

        criadoEm:
          data.criadoEm
            ?.toDate?.()
            ?.toISOString(),

        atualizadoEm:
          data.atualizadoEm
            ?.toDate?.()
            ?.toISOString(),
      };
    }
  );
}

/* =========================================================
   LISTAR POR DATA
========================================================= */

export async function listarFrequenciasPorData(
  data: string
): Promise<Frequencia[]> {
  const consulta = query(
    frequenciasCollection(),
    where(
      "data",
      "==",
      data
    )
  );

  const snapshot =
    await getDocs(consulta);

  return snapshot.docs.map(
    (item) => {
      const dados = item.data();

      return {
        id: item.id,

        alunoId:
          dados.alunoId,

        professorId:
          dados.professorId,

        instrumento:
          dados.instrumento as Instrumento,

        data:
          dados.data,

        horario:
          dados.horario,

        status:
          dados.status as StatusFrequencia,

        tipo:
          dados.tipo as TipoFrequencia,

        aulaId:
          dados.aulaId,

        reposicaoId:
          dados.reposicaoId,

        observacao:
          dados.observacao ?? "",

        criadoEm:
          dados.criadoEm
            ?.toDate?.()
            ?.toISOString(),

        atualizadoEm:
          dados.atualizadoEm
            ?.toDate?.()
            ?.toISOString(),
      };
    }
  );
}

/* =========================================================
   CADASTRAR
========================================================= */

interface CadastrarFrequenciaParams {
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
}

export async function cadastrarFrequencia(
  params: CadastrarFrequenciaParams
): Promise<string> {
  const ref = await addDoc(
    frequenciasCollection(),
    {
      alunoId:
        params.alunoId,

      professorId:
        params.professorId,

      instrumento:
        params.instrumento,

      data:
        params.data,

      horario:
        params.horario,

      status:
        params.status,

      tipo:
        params.tipo,

      aulaId:
        params.aulaId ?? null,

      reposicaoId:
        params.reposicaoId ?? null,

      observacao:
        params.observacao?.trim() ||
        "",

      criadoEm:
        serverTimestamp(),

      atualizadoEm:
        serverTimestamp(),
    }
  );

  return ref.id;
}

/* =========================================================
   ATUALIZAR
========================================================= */

export async function atualizarFrequencia(
  id: string,
  status: StatusFrequencia,
  observacao?: string
): Promise<void> {
  await updateDoc(
    frequenciaDoc(id),
    {
      status,

      observacao:
        observacao?.trim() ||
        "",

      atualizadoEm:
        serverTimestamp(),
    }
  );
}