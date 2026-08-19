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
  Despesa,
  StatusDespesa,
} from "@/types/despesa";

function despesasCollection() {
  const escolaId = getEscolaId();

  return collection(
    db,
    "escolas",
    escolaId,
    "despesas"
  );
}

function despesaDoc(id: string) {
  const escolaId = getEscolaId();

  return doc(
    db,
    "escolas",
    escolaId,
    "despesas",
    id
  );
}

function normalizarStatus(
  data: Record<string, unknown>
): StatusDespesa {
  if (data.status === "paga") {
    return "paga";
  }

  if (data.status === "atrasada") {
    return "atrasada";
  }

  return "pendente";
}

export async function listarDespesas(): Promise<Despesa[]> {
  const snapshot = await getDocs(
    despesasCollection()
  );

  return snapshot.docs
    .map((item) => {
      const data = item.data();

      return {
        id: item.id,
        descricao: data.descricao ?? "",
        tipo:
          data.tipo === "variavel"
            ? "variavel"
            : "fixa",
        categoria:
          data.categoria ?? "outros",
        valor: Number(data.valor ?? 0),
        dataVencimento:
          data.dataVencimento ?? "",
        dataPagamento:
          data.dataPagamento ?? undefined,
        status: normalizarStatus(data),
        formaPagamento:
          data.formaPagamento ?? undefined,
        observacao:
          data.observacao ?? "",
        criadoEm:
          data.criadoEm
            ?.toDate?.()
            ?.toISOString(),
      } as Despesa;
    })
    .sort((a, b) =>
      a.dataVencimento.localeCompare(
        b.dataVencimento
      )
    );
}

export async function cadastrarDespesa(
  dados: Omit<Despesa, "id" | "criadoEm">
): Promise<string> {
  const ref = await addDoc(
    despesasCollection(),
    {
      ...dados,
      criadoEm: serverTimestamp(),
    }
  );

  return ref.id;
}

export async function atualizarDespesa(
  id: string,
  dados: Partial<Omit<Despesa, "id" | "criadoEm">>
): Promise<void> {
  await updateDoc(
    despesaDoc(id),
    dados
  );
}

export async function alterarStatusDespesa(
  id: string,
  status: StatusDespesa,
  dataPagamento?: string
): Promise<void> {
  await updateDoc(
    despesaDoc(id),
    {
      status,
      dataPagamento:
        status === "paga"
          ? dataPagamento ?? new Date().toISOString().slice(0, 10)
          : undefined,
    }
  );
}

export async function excluirDespesa(
  id: string
): Promise<void> {
  await deleteDoc(
    despesaDoc(id)
  );
}
