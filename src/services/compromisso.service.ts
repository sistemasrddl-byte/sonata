import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  updateDoc,
  writeBatch,
} from "firebase/firestore";

import { db } from "@/lib/firebase";
import { getEscolaId } from "@/lib/escola";

import {
  Compromisso,
  PagamentoCompromisso,
} from "@/types/compromisso";

function compromissosCollection() {
  return collection(
    db,
    "escolas",
    getEscolaId(),
    "compromissos"
  );
}

function compromissoDoc(id: string) {
  return doc(
    db,
    "escolas",
    getEscolaId(),
    "compromissos",
    id
  );
}

function pagamentosCollection(
  compromissoId: string
) {
  return collection(
    db,
    "escolas",
    getEscolaId(),
    "compromissos",
    compromissoId,
    "pagamentos"
  );
}

function normalizarCompromisso(
  id: string,
  data: Record<string, unknown>
): Compromisso {
  const valorTotal = Number(
    data.valorTotal ?? 0
  );

  const totalPago = Number(
    data.totalPago ?? 0
  );

  const saldoDevedor = Math.max(
    0,
    valorTotal - totalPago
  );

  return {
    id,
    descricao:
      typeof data.descricao === "string"
        ? data.descricao
        : "",
    valorTotal,
    totalPago,
    saldoDevedor,
    categoria:
      data.categoria === "fornecedores" ||
      data.categoria === "equipamentos" ||
      data.categoria === "instrumentos" ||
      data.categoria === "materiais" ||
      data.categoria === "outros"
        ? data.categoria
        : "compras",
    dataCompra:
      typeof data.dataCompra === "string"
        ? data.dataCompra
        : "",
    status:
      data.status === "quitado"
        ? "quitado"
        : "aberto",
    criadoEm:
      data.criadoEm &&
      typeof (
        data.criadoEm as {
          toDate?: () => Date;
        }
      ).toDate === "function"
        ? (
            data.criadoEm as {
              toDate: () => Date;
            }
          ).toDate().toISOString()
        : undefined,
  };
}

export async function listarCompromissos(): Promise<Compromisso[]> {
  const snapshot = await getDocs(
    compromissosCollection()
  );

  return snapshot.docs
    .map((item) =>
      normalizarCompromisso(
        item.id,
        item.data()
      )
    )
    .sort((a, b) =>
      b.dataCompra.localeCompare(
        a.dataCompra
      )
    );
}

export async function cadastrarCompromisso(
  dados: Omit<
    Compromisso,
    | "id"
    | "totalPago"
    | "saldoDevedor"
    | "status"
    | "criadoEm"
  >
): Promise<string> {
  const ref = await addDoc(
    compromissosCollection(),
    {
      ...dados,
      totalPago: 0,
      status: "aberto",
      criadoEm: serverTimestamp(),
    }
  );

  return ref.id;
}

export async function atualizarCompromisso(
  compromissoId: string,
  dados: Pick<
    Compromisso,
    "descricao" | "valorTotal" | "categoria" | "dataCompra"
  >
): Promise<void> {
  const snapshot = await getDoc(
    compromissoDoc(compromissoId)
  );

  if (!snapshot.exists()) {
    throw new Error("Compromisso não encontrado.");
  }

  const atual = snapshot.data();
  const totalPago = Number(atual.totalPago ?? 0);
  const valorTotal = Number(dados.valorTotal);

  if (!Number.isFinite(valorTotal) || valorTotal <= 0) {
    throw new Error("Informe um valor total válido.");
  }

  if (valorTotal < totalPago) {
    throw new Error(
      `O valor total não pode ser menor que o total já pago (${new Intl.NumberFormat(
        "pt-BR",
        {
          style: "currency",
          currency: "BRL",
        }
      ).format(totalPago)}).`
    );
  }

  await updateDoc(compromissoDoc(compromissoId), {
    descricao: dados.descricao.trim(),
    valorTotal,
    categoria: dados.categoria,
    dataCompra: dados.dataCompra,
    status: totalPago >= valorTotal ? "quitado" : "aberto",
  });
}

export async function listarPagamentosCompromisso(
  compromissoId: string
): Promise<PagamentoCompromisso[]> {
  const snapshot = await getDocs(
    pagamentosCollection(compromissoId)
  );

  return snapshot.docs
    .map((item) => {
      const data = item.data();

      return {
        id: item.id,
        data:
          typeof data.data === "string"
            ? data.data
            : "",
        valor: Number(data.valor ?? 0),
        observacao:
          typeof data.observacao === "string"
            ? data.observacao
            : "",
      };
    })
    .sort((a, b) =>
      b.data.localeCompare(a.data)
    );
}

export async function registrarPagamentoCompromisso(
  compromissoId: string,
  pagamento: Omit<PagamentoCompromisso, "id">
): Promise<void> {
  const compromissoSnapshot =
    await getDoc(
      compromissoDoc(compromissoId)
    );

  if (!compromissoSnapshot.exists()) {
    throw new Error(
      "Compromisso não encontrado."
    );
  }

  const dados =
    compromissoSnapshot.data();

  const valorTotal = Number(
    dados.valorTotal ?? 0
  );

  const totalPagoAtual = Number(
    dados.totalPago ?? 0
  );

  const valorPagamento = Number(
    pagamento.valor
  );

  if (
    !Number.isFinite(valorPagamento) ||
    valorPagamento <= 0
  ) {
    throw new Error(
      "Informe um valor de pagamento válido."
    );
  }

  const saldoAtual = Math.max(
    0,
    valorTotal - totalPagoAtual
  );

  if (valorPagamento > saldoAtual) {
    throw new Error(
      "O pagamento não pode ser maior que o saldo devedor."
    );
  }

  const novoTotalPago =
    totalPagoAtual +
    valorPagamento;

  const novoStatus =
    novoTotalPago >= valorTotal
      ? "quitado"
      : "aberto";

  const batch = writeBatch(db);

  const pagamentoRef = doc(
    pagamentosCollection(
      compromissoId
    )
  );

  batch.set(pagamentoRef, {
    ...pagamento,
    criadoEm: serverTimestamp(),
  });

  batch.update(
    compromissoDoc(compromissoId),
    {
      totalPago: novoTotalPago,
      status: novoStatus,
    }
  );

  await batch.commit();
}

export async function excluirCompromisso(
  compromissoId: string
): Promise<void> {
  const pagamentosSnapshot =
    await getDocs(
      pagamentosCollection(
        compromissoId
      )
    );

  const batch = writeBatch(db);

  pagamentosSnapshot.docs.forEach(
    (item) => {
      batch.delete(item.ref);
    }
  );

  batch.delete(
    compromissoDoc(compromissoId)
  );

  await batch.commit();
}
