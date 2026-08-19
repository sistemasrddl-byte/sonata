import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";

import { db } from "@/lib/firebase";
import { getEscolaId } from "@/lib/escola";

import {
  ConfiguracaoFinanceiraAluno,
  FormaPagamento,
  Mensalidade,
  StatusMensalidade,
} from "@/types/mensalidade";

/* =========================================================
   COLEÇÕES
========================================================= */

function mensalidadesCollection() {
  const escolaId = getEscolaId();

  return collection(
    db,
    "escolas",
    escolaId,
    "mensalidades"
  );
}

function mensalidadeDoc(id: string) {
  const escolaId = getEscolaId();

  return doc(
    db,
    "escolas",
    escolaId,
    "mensalidades",
    id
  );
}

function configuracoesCollection() {
  const escolaId = getEscolaId();

  return collection(
    db,
    "escolas",
    escolaId,
    "configuracoesFinanceiras"
  );
}

function configuracaoDoc(id: string) {
  const escolaId = getEscolaId();

  return doc(
    db,
    "escolas",
    escolaId,
    "configuracoesFinanceiras",
    id
  );
}

/* =========================================================
   DATAS
========================================================= */

function dataHojeLocal(): string {
  const agora = new Date();

  const ano = agora.getFullYear();
  const mes = String(
    agora.getMonth() + 1
  ).padStart(2, "0");
  const dia = String(
    agora.getDate()
  ).padStart(2, "0");

  return `${ano}-${mes}-${dia}`;
}

function competenciaDaData(
  data: string
): string {
  return data.slice(0, 7);
}

function ultimoDiaDoMes(
  ano: number,
  mes: number
): number {
  return new Date(
    ano,
    mes,
    0
  ).getDate();
}

/**
 * Calcula a data de vencimento usando o mês da competência.
 *
 * Se o dia escolhido não existir naquele mês,
 * usa o último dia do mês.
 */
export function calcularDataVencimento(
  competencia: string,
  diaVencimento: number
): string {
  const [ano, mes] =
    competencia
      .split("-")
      .map(Number);

  const dia = Math.min(
    Math.max(
      diaVencimento,
      1
    ),
    ultimoDiaDoMes(
      ano,
      mes
    )
  );

  return `${ano}-${String(
    mes
  ).padStart(2, "0")}-${String(
    dia
  ).padStart(2, "0")}`;
}

/**
 * Calcula a primeira competência.
 *
 * Regra:
 * - se o dia escolhido ainda não passou neste mês,
 *   usa o mês atual;
 * - se já passou, usa o próximo mês.
 */
export function calcularPrimeiraCompetencia(
  dataRegistro: string,
  diaVencimento: number
): string {
  const [ano, mes, dia] =
    dataRegistro
      .split("-")
      .map(Number);

  if (
    diaVencimento >= dia
  ) {
    return `${ano}-${String(
      mes
    ).padStart(2, "0")}`;
  }

  const proximoMes =
    new Date(
      ano,
      mes,
      1
    );

  return `${proximoMes.getFullYear()}-${String(
    proximoMes.getMonth() + 1
  ).padStart(2, "0")}`;
}

/**
 * Soma meses a uma competência YYYY-MM.
 */
export function adicionarMeses(
  competencia: string,
  quantidade: number
): string {
  const [ano, mes] =
    competencia
      .split("-")
      .map(Number);

  const data = new Date(
    ano,
    mes - 1 + quantidade,
    1
  );

  return `${data.getFullYear()}-${String(
    data.getMonth() + 1
  ).padStart(2, "0")}`;
}

/* =========================================================
   MENSALIDADES
========================================================= */

export async function listarMensalidades(): Promise<
  Mensalidade[]
> {
  const snapshot =
    await getDocs(
      mensalidadesCollection()
    );

  return snapshot.docs.map(
    (item) => {
      const data =
        item.data();

      return {
        id: item.id,
        alunoId:
          data.alunoId ?? "",
        valor:
          Number(
            data.valor ?? 0
          ),
        competencia:
          data.competencia ?? "",
        dataGeracao:
          data.dataGeracao ?? "",
        diaVencimento:
          Number(
            data.diaVencimento ?? 1
          ),
        dataVencimento:
          data.dataVencimento ?? "",
        status:
          data.status ??
          "pendente",
        dataPagamento:
          data.dataPagamento ??
          undefined,
        formaPagamento:
          data.formaPagamento ??
          undefined,
        observacao:
          data.observacao ??
          undefined,
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

export async function listarMensalidadesDoAluno(
  alunoId: string
): Promise<Mensalidade[]> {
  const consulta =
    query(
      mensalidadesCollection(),
      where(
        "alunoId",
        "==",
        alunoId
      )
    );

  const snapshot =
    await getDocs(
      consulta
    );

  return snapshot.docs.map(
    (item) => {
      const data =
        item.data();

      return {
        id: item.id,
        alunoId:
          data.alunoId ?? "",
        valor:
          Number(
            data.valor ?? 0
          ),
        competencia:
          data.competencia ?? "",
        dataGeracao:
          data.dataGeracao ?? "",
        diaVencimento:
          Number(
            data.diaVencimento ?? 1
          ),
        dataVencimento:
          data.dataVencimento ?? "",
        status:
          data.status ??
          "pendente",
        dataPagamento:
          data.dataPagamento ??
          undefined,
        formaPagamento:
          data.formaPagamento ??
          undefined,
        observacao:
          data.observacao ??
          undefined,
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

export async function cadastrarMensalidade(
  dados: {
    alunoId: string;
    valor: number;
    competencia: string;
    dataGeracao: string;
    diaVencimento: number;
    dataVencimento: string;
    status?: StatusMensalidade;
    observacao?: string;
  }
): Promise<string> {
  const ref =
    await addDoc(
      mensalidadesCollection(),
      {
        alunoId:
          dados.alunoId,
        valor:
          dados.valor,
        competencia:
          dados.competencia,
        dataGeracao:
          dados.dataGeracao,
        diaVencimento:
          dados.diaVencimento,
        dataVencimento:
          dados.dataVencimento,
        status:
          dados.status ??
          "pendente",
        observacao:
          dados.observacao ??
          "",
        criadoEm:
          serverTimestamp(),
        atualizadoEm:
          serverTimestamp(),
      }
    );

  return ref.id;
}

export async function atualizarMensalidade(
  id: string,
  dados: Partial<{
    valor: number;
    competencia: string;
    dataGeracao: string;
    diaVencimento: number;
    dataVencimento: string;
    status: StatusMensalidade;
    dataPagamento: string;
    formaPagamento: FormaPagamento;
    observacao: string;
  }>
): Promise<void> {
  await updateDoc(
    mensalidadeDoc(id),
    {
      ...dados,
      atualizadoEm:
        serverTimestamp(),
    }
  );
}

export async function excluirMensalidade(
  id: string
): Promise<void> {
  await deleteDoc(
    mensalidadeDoc(id)
  );
}

/* =========================================================
   CONFIGURAÇÃO FINANCEIRA DO ALUNO
========================================================= */

function converterConfiguracao(
  item: any
): ConfiguracaoFinanceiraAluno {
  return {
    id: item.id,
    alunoId:
      item.alunoId ?? "",
    valorMensalidade:
      Number(
        item.valorMensalidade ??
          200
      ),
    diaVencimento:
      Number(
        item.diaVencimento ??
          1
      ),
    primeiraCompetencia:
      item.primeiraCompetencia ??
      "",
    dataInicio:
      item.dataInicio ??
      "",
    ativo:
      item.ativo !== false,
    criadoEm:
      item.criadoEm
        ?.toDate?.()
        ?.toISOString(),
    atualizadoEm:
      item.atualizadoEm
        ?.toDate?.()
        ?.toISOString(),
  };
}

export async function listarConfiguracoesFinanceiras(): Promise<
  ConfiguracaoFinanceiraAluno[]
> {
  const snapshot =
    await getDocs(
      configuracoesCollection()
    );

  return snapshot.docs.map(
    (item) =>
      converterConfiguracao({
        id: item.id,
        ...item.data(),
      })
  );
}

export async function buscarConfiguracaoFinanceira(
  alunoId: string
): Promise<
  ConfiguracaoFinanceiraAluno | null
> {
  const consulta =
    query(
      configuracoesCollection(),
      where(
        "alunoId",
        "==",
        alunoId
      )
    );

  const snapshot =
    await getDocs(
      consulta
    );

  if (
    snapshot.empty
  ) {
    return null;
  }

  const item =
    snapshot.docs[0];

  return converterConfiguracao({
    id: item.id,
    ...item.data(),
  });
}

export async function salvarConfiguracaoFinanceira(
  dados: {
    alunoId: string;
    valorMensalidade: number;
    diaVencimento: number;
    primeiraCompetencia: string;
    dataInicio?: string;
    ativo?: boolean;
  }
): Promise<string> {
  const existente =
    await buscarConfiguracaoFinanceira(
      dados.alunoId
    );

  if (existente) {
    await updateDoc(
      configuracaoDoc(
        existente.id
      ),
      {
        valorMensalidade:
          dados.valorMensalidade,
        diaVencimento:
          dados.diaVencimento,
        primeiraCompetencia:
          dados.primeiraCompetencia,
        dataInicio:
          dados.dataInicio ??
          dataHojeLocal(),
        ativo:
          dados.ativo ??
          true,
        atualizadoEm:
          serverTimestamp(),
      }
    );

    return existente.id;
  }

  const ref =
    await addDoc(
      configuracoesCollection(),
      {
        alunoId:
          dados.alunoId,
        valorMensalidade:
          dados.valorMensalidade,
        diaVencimento:
          dados.diaVencimento,
        primeiraCompetencia:
          dados.primeiraCompetencia,
        dataInicio:
          dados.dataInicio ??
          dataHojeLocal(),
        ativo:
          dados.ativo ??
          true,
        criadoEm:
          serverTimestamp(),
        atualizadoEm:
          serverTimestamp(),
      }
    );

  return ref.id;
}
