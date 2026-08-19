"use client";

import {
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  Clock3,
  CreditCard,
  Pencil,
  Plus,
  Search,
  Trash2,
  Wallet,
  X,
} from "lucide-react";

import {
  FormEvent,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useRouter } from "next/navigation";

import { listarAlunos } from "@/services/aluno.service";

import {
  adicionarMeses,
  atualizarMensalidade,
  cadastrarMensalidade,
  calcularDataVencimento,
  calcularPrimeiraCompetencia,
  excluirMensalidade,
  listarConfiguracoesFinanceiras,
  listarMensalidades,
  salvarConfiguracaoFinanceira,
} from "@/services/mensalidade.service";

import { Aluno } from "@/types/aluno";

import {
  ConfiguracaoFinanceiraAluno,
  FormaPagamento,
  Mensalidade,
  StatusMensalidade,
} from "@/types/mensalidade";

/* =========================================================
   DATAS / FORMATAÇÃO
========================================================= */

function dataHojeLocal(): string {
  const agora = new Date();

  return `${agora.getFullYear()}-${String(
    agora.getMonth() + 1
  ).padStart(2, "0")}-${String(
    agora.getDate()
  ).padStart(2, "0")}`;
}

function competenciaAtual(): string {
  return dataHojeLocal().slice(0, 7);
}

function formatarMoeda(valor: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(valor);
}

function formatarData(data: string): string {
  if (!data) return "-";

  const [ano, mes, dia] = data.split("-");

  if (!ano || !mes || !dia) {
    return data;
  }

  return `${dia}/${mes}/${ano}`;
}

function formatarCompetencia(competencia: string): string {
  if (!competencia) return "-";

  const [ano, mes] = competencia.split("-");

  const data = new Date(
    Number(ano),
    Number(mes) - 1,
    1
  );

  return new Intl.DateTimeFormat("pt-BR", {
    month: "long",
    year: "numeric",
  }).format(data);
}

function normalizarValor(valor: string): number {
  const limpo = valor
    .replace(/[^\d,.-]/g, "")
    .replace(/\./g, "")
    .replace(",", ".");

  const numero = Number(limpo);

  return Number.isFinite(numero)
    ? numero
    : 0;
}

function statusDaMensalidade(
  mensalidade: Mensalidade,
  hoje: string
): StatusMensalidade {
  if (
    mensalidade.status === "pago" ||
    mensalidade.status === "cancelado"
  ) {
    return mensalidade.status;
  }

  if (
    mensalidade.dataVencimento &&
    mensalidade.dataVencimento < hoje
  ) {
    return "atrasado";
  }

  return "pendente";
}

/* =========================================================
   STATUS
========================================================= */

const statusInfo: Record<
  StatusMensalidade,
  {
    label: string;
    className: string;
  }
> = {
  pendente: {
    label: "Pendente",
    className:
      "border-yellow-500/30 bg-yellow-500/10 text-yellow-400",
  },

  pago: {
    label: "Pago",
    className:
      "border-green-500/30 bg-green-500/10 text-green-400",
  },

  atrasado: {
    label: "Atrasado",
    className:
      "border-red-500/30 bg-red-500/10 text-red-400",
  },

  cancelado: {
    label: "Cancelado",
    className:
      "border-gray-500/30 bg-gray-500/10 text-gray-400",
  },
};

/* =========================================================
   PÁGINA
========================================================= */

export default function FinanceiroPage() {
  const router = useRouter();

  const [alunos, setAlunos] =
    useState<Aluno[]>([]);

  const [mensalidades, setMensalidades] =
    useState<Mensalidade[]>([]);

  const [
    configuracoes,
    setConfiguracoes,
  ] = useState<
    ConfiguracaoFinanceiraAluno[]
  >([]);

  const [loading, setLoading] =
    useState(true);

  const [salvando, setSalvando] =
    useState(false);

  const [busca, setBusca] =
    useState("");

  const [filtroStatus, setFiltroStatus] =
    useState<"todos" | StatusMensalidade>(
      "todos"
    );

  const [competenciaFiltro, setCompetenciaFiltro] =
    useState(competenciaAtual());

  const [modalAberto, setModalAberto] =
    useState(false);

  const [modalPagamentoAberto, setModalPagamentoAberto] =
    useState(false);

  const [modalEdicaoAberto, setModalEdicaoAberto] =
    useState(false);

  const [modalExclusaoAberto, setModalExclusaoAberto] =
    useState(false);

  const [mensalidadeParaExcluir, setMensalidadeParaExcluir] =
    useState<Mensalidade | null>(null);

  const [mensalidadeSelecionada, setMensalidadeSelecionada] =
    useState<Mensalidade | null>(null);

  /* =======================================================
     FORMULÁRIO DE NOVA CONFIGURAÇÃO
  ======================================================= */

  const [alunoId, setAlunoId] =
    useState("");

  const [valor, setValor] =
    useState("200,00");

  const [diaVencimento, setDiaVencimento] =
    useState(String(
      Number(
        dataHojeLocal().slice(8, 10)
      )
    ));

  const [primeiraCompetencia, setPrimeiraCompetencia] =
    useState(competenciaAtual());

  const [observacao, setObservacao] =
    useState("");

  /* =======================================================
     FORMULÁRIO DE PAGAMENTO
  ======================================================= */

  const [dataPagamento, setDataPagamento] =
    useState(dataHojeLocal());

  const [formaPagamento, setFormaPagamento] =
    useState<FormaPagamento>("pix");

  /* =======================================================
     FORMULÁRIO DE EDIÇÃO
  ======================================================= */

  const [valorEdicao, setValorEdicao] =
    useState("");

  const [vencimentoEdicao, setVencimentoEdicao] =
    useState("");

  const [observacaoEdicao, setObservacaoEdicao] =
    useState("");

  /* =======================================================
     CARREGAR
  ======================================================= */

  async function carregarDados() {
    try {
      setLoading(true);

      const [
        alunosData,
        mensalidadesData,
        configuracoesData,
      ] = await Promise.all([
        listarAlunos(),
        listarMensalidades(),
        listarConfiguracoesFinanceiras(),
      ]);

      setAlunos(alunosData);
      setMensalidades(mensalidadesData);
      setConfiguracoes(
        configuracoesData
      );
    } catch (error) {
      console.error(
        "Erro ao carregar financeiro:",
        error
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    carregarDados();
  }, []);

  /* =======================================================
     ALUNOS
  ======================================================= */

  const alunosAtivos = useMemo(
    () =>
      [...alunos].sort(
        (a, b) =>
          a.nome.localeCompare(
            b.nome,
            "pt-BR"
          )
      ),
    [alunos]
  );

  function buscarAluno(id: string) {
    return alunos.find(
      (aluno) =>
        aluno.id === id
    );
  }

  /* =======================================================
     FILTROS
  ======================================================= */

  const mensalidadesFiltradas =
    useMemo(() => {
      const hoje =
        dataHojeLocal();

      const termo =
        busca
          .trim()
          .toLowerCase();

      return [...mensalidades]
        .filter(
          (mensalidade) =>
            mensalidade.competencia ===
            competenciaFiltro
        )
        .filter(
          (mensalidade) => {
            if (!termo) {
              return true;
            }

            const aluno =
              buscarAluno(
                mensalidade.alunoId
              );

            return (
              aluno?.nome
                .toLowerCase()
                .includes(termo) ||
              mensalidade.status
                .toLowerCase()
                .includes(termo)
            );
          }
        )
        .filter(
          (mensalidade) => {
            if (
              filtroStatus ===
              "todos"
            ) {
              return true;
            }

            return (
              statusDaMensalidade(
                mensalidade,
                dataHojeLocal()
              ) ===
              filtroStatus
            );
          }
        )
        .sort((a, b) => {
          const nomeA =
            buscarAluno(
              a.alunoId
            )?.nome ?? "";

          const nomeB =
            buscarAluno(
              b.alunoId
            )?.nome ?? "";

          return nomeA.localeCompare(
            nomeB,
            "pt-BR"
          );
        })
        .map((item) => {
          const status =
            statusDaMensalidade(
              item,
              hoje
            );

          return {
            ...item,
            status,
          };
        });
    }, [
      mensalidades,
      competenciaFiltro,
      busca,
      filtroStatus,
      alunos,
    ]);

  /* =======================================================
     RESUMO
  ======================================================= */

  const resumo = useMemo(() => {
    const hoje =
      dataHojeLocal();

    const registros =
      mensalidades.filter(
        (item) =>
          item.competencia ===
          competenciaFiltro
      );

    let recebido = 0;
    let pendente = 0;
    let atrasado = 0;

    registros.forEach(
      (item) => {
        const status =
          statusDaMensalidade(
            item,
            hoje
          );

        if (
          status === "pago"
        ) {
          recebido += item.valor;
        }

        if (
          status === "pendente"
        ) {
          pendente += item.valor;
        }

        if (
          status === "atrasado"
        ) {
          atrasado += item.valor;
        }
      }
    );

    return {
      recebido,
      pendente,
      atrasado,
      total:
        recebido +
        pendente +
        atrasado,
    };
  }, [
    mensalidades,
    competenciaFiltro,
  ]);

  /* =======================================================
     MODAL NOVA MENSALIDADE
  ======================================================= */

  function abrirNovaMensalidade() {
    const hoje =
      dataHojeLocal();

    const dia =
      Number(
        hoje.slice(8, 10)
      );

    setAlunoId("");
    setValor("200,00");
    setDiaVencimento(
      String(dia)
    );
    setPrimeiraCompetencia(
      competenciaAtual()
    );
    setObservacao("");
    setModalAberto(true);
  }

  function fecharModal() {
    if (salvando) return;

    setModalAberto(false);
  }

  function atualizarDiaVencimento(
    valorDia: string
  ) {
    const numero =
      Number(valorDia);

    if (
      !Number.isFinite(
        numero
      )
    ) {
      setDiaVencimento("");
      return;
    }

    const limitado =
      Math.min(
        Math.max(
          numero,
          1
        ),
        31
      );

    setDiaVencimento(
      String(limitado)
    );
  }

  const vencimentoPreview =
    useMemo(() => {
      if (
        !primeiraCompetencia ||
        !diaVencimento
      ) {
        return "";
      }

      return calcularDataVencimento(
        primeiraCompetencia,
        Number(
          diaVencimento
        )
      );
    }, [
      primeiraCompetencia,
      diaVencimento,
    ]);

  /* =======================================================
     CADASTRAR PRIMEIRA MENSALIDADE
  ======================================================= */

  async function salvarNovaMensalidade(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!alunoId) {
      alert(
        "Selecione um aluno."
      );
      return;
    }

    const valorNumerico =
      normalizarValor(
        valor
      );

    const dia =
      Number(
        diaVencimento
      );

    if (
      valorNumerico <= 0
    ) {
      alert(
        "Informe um valor válido."
      );
      return;
    }

    if (
      dia < 1 ||
      dia > 31
    ) {
      alert(
        "Informe um dia de vencimento entre 1 e 31."
      );
      return;
    }

    if (
      !primeiraCompetencia
    ) {
      alert(
        "Escolha o primeiro mês de recebimento."
      );
      return;
    }

    try {
      setSalvando(true);

      const dataGeracao =
        dataHojeLocal();

      /*
       * Se o primeiro mês escolhido já passou do
       * dia de vencimento, a primeira cobrança deve
       * ir automaticamente para o próximo mês.
       *
       * Ex.: hoje 18/08 + vencimento dia 10
       * -> setembro, e não 10/08.
       */
      const hojeCompetencia =
        competenciaAtual();

      let competenciaFinal =
        primeiraCompetencia;

      if (
        primeiraCompetencia ===
          hojeCompetencia &&
        dia < Number(
          dataGeracao.slice(8, 10)
        )
      ) {
        competenciaFinal =
          adicionarMeses(
            primeiraCompetencia,
            1
          );
      }

      /*
       * Se o usuário escolheu um mês anterior
       * ao mês atual, não permitimos criar uma
       * primeira mensalidade já vencida.
       */
      if (
        competenciaFinal <
        hojeCompetencia
      ) {
        alert(
          "O primeiro mês de recebimento não pode ser anterior ao mês atual."
        );
        return;
      }

      const dataVencimento =
        calcularDataVencimento(
          competenciaFinal,
          dia
        );

      const mensalidadeExistente =
        mensalidades.find(
          (item) =>
            item.alunoId ===
              alunoId &&
            item.competencia ===
              competenciaFinal
        );

      if (
        mensalidadeExistente
      ) {
        alert(
          "Esse aluno já possui uma mensalidade para o primeiro mês de recebimento."
        );
        return;
      }

      await salvarConfiguracaoFinanceira(
        {
          alunoId,
          valorMensalidade:
            valorNumerico,
          diaVencimento:
            dia,
          primeiraCompetencia:
            competenciaFinal,
          dataInicio:
            dataGeracao,
          ativo: true,
        }
      );

      await cadastrarMensalidade(
        {
          alunoId,
          valor:
            valorNumerico,
          competencia:
            competenciaFinal,
          dataGeracao,
          diaVencimento:
            dia,
          dataVencimento,
          status:
            "pendente",
          observacao,
        }
      );

      setModalAberto(false);

      await carregarDados();
    } catch (error) {
      console.error(
        "Erro ao cadastrar mensalidade:",
        error
      );

      alert(
        "Não foi possível cadastrar a mensalidade."
      );
    } finally {
      setSalvando(false);
    }
  }

  /* =======================================================
     PAGAMENTO
  ======================================================= */

  function abrirPagamento(
    mensalidade: Mensalidade
  ) {
    setMensalidadeSelecionada(
      mensalidade
    );

    setDataPagamento(
      dataHojeLocal()
    );

    setFormaPagamento(
      "pix"
    );

    setModalPagamentoAberto(
      true
    );
  }

  function fecharPagamento() {
    if (salvando) return;

    setModalPagamentoAberto(
      false
    );

    setMensalidadeSelecionada(
      null
    );
  }

  async function registrarPagamento(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (
      !mensalidadeSelecionada
    ) {
      return;
    }

    try {
      setSalvando(true);

      const mensalidade =
        mensalidadeSelecionada;

      await atualizarMensalidade(
        mensalidade.id,
        {
          status: "pago",
          dataPagamento,
          formaPagamento,
        }
      );

      /*
       * Ao registrar o pagamento, prepara
       * automaticamente a próxima mensalidade.
       */
      const proximaCompetencia =
        adicionarMeses(
          mensalidade.competencia,
          1
        );

      const proximaExistente =
        mensalidades.find(
          (item) =>
            item.alunoId ===
              mensalidade.alunoId &&
            item.competencia ===
              proximaCompetencia
        );

      if (
        !proximaExistente
      ) {
        const proximaConfiguracao =
          configuracoes.find(
            (item) =>
              item.alunoId ===
              mensalidade.alunoId &&
              item.ativo
          );

        const proximoValor =
          proximaConfiguracao
            ?.valorMensalidade ??
          mensalidade.valor;

        const proximoDia =
          proximaConfiguracao
            ?.diaVencimento ??
          mensalidade.diaVencimento;

        const proximoVencimento =
          calcularDataVencimento(
            proximaCompetencia,
            proximoDia
          );

        await cadastrarMensalidade(
          {
            alunoId:
              mensalidade.alunoId,
            valor:
              proximoValor,
            competencia:
              proximaCompetencia,
            dataGeracao:
              dataHojeLocal(),
            diaVencimento:
              proximoDia,
            dataVencimento:
              proximoVencimento,
            status:
              "pendente",
          }
        );
      }

      setModalPagamentoAberto(
        false
      );

      setMensalidadeSelecionada(
        null
      );

      await carregarDados();
    } catch (error) {
      console.error(
        "Erro ao registrar pagamento:",
        error
      );

      alert(
        "Não foi possível registrar o pagamento."
      );
    } finally {
      setSalvando(false);
    }
  }

  /* =======================================================
     EDITAR
  ======================================================= */

  function abrirEdicao(
    mensalidade: Mensalidade
  ) {
    setMensalidadeSelecionada(
      mensalidade
    );

    setValorEdicao(
      mensalidade.valor
        .toFixed(2)
        .replace(".", ",")
    );

    setVencimentoEdicao(
      mensalidade.dataVencimento
    );

    setObservacaoEdicao(
      mensalidade.observacao ??
        ""
    );

    setModalEdicaoAberto(
      true
    );
  }

  function fecharEdicao() {
    if (salvando) return;

    setModalEdicaoAberto(
      false
    );

    setMensalidadeSelecionada(
      null
    );
  }

  async function salvarEdicao(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (
      !mensalidadeSelecionada
    ) {
      return;
    }

    const valorNumerico =
      normalizarValor(
        valorEdicao
      );

    if (
      valorNumerico <= 0
    ) {
      alert(
        "Informe um valor válido."
      );
      return;
    }

    try {
      setSalvando(true);

      await atualizarMensalidade(
        mensalidadeSelecionada.id,
        {
          valor:
            valorNumerico,
          dataVencimento:
            vencimentoEdicao,
          diaVencimento:
            Number(
              vencimentoEdicao.slice(
                8,
                10
              )
            ),
          observacao:
            observacaoEdicao,
        }
      );

      setModalEdicaoAberto(
        false
      );

      setMensalidadeSelecionada(
        null
      );

      await carregarDados();
    } catch (error) {
      console.error(
        "Erro ao editar mensalidade:",
        error
      );

      alert(
        "Não foi possível editar a mensalidade."
      );
    } finally {
      setSalvando(false);
    }
  }

  /* =======================================================
     EXCLUIR
  ======================================================= */

  function abrirExclusao(
    mensalidade: Mensalidade
  ) {
    setMensalidadeParaExcluir(
      mensalidade
    );

    setModalExclusaoAberto(
      true
    );
  }

  function fecharExclusao() {
    if (salvando) return;

    setModalExclusaoAberto(
      false
    );

    setMensalidadeParaExcluir(
      null
    );
  }

  async function confirmarExclusao() {
    if (
      !mensalidadeParaExcluir
    ) {
      return;
    }

    try {
      setSalvando(true);

      await excluirMensalidade(
        mensalidadeParaExcluir.id
      );

      setModalExclusaoAberto(
        false
      );

      setMensalidadeParaExcluir(
        null
      );

      await carregarDados();
    } catch (error) {
      console.error(
        "Erro ao excluir mensalidade:",
        error
      );

      alert(
        "Não foi possível excluir a mensalidade."
      );
    } finally {
      setSalvando(false);
    }
  }

  /* =======================================================
     NAVEGAÇÃO DO MÊS
  ======================================================= */

  function alterarMes(
    quantidade: number
  ) {
    setCompetenciaFiltro(
      adicionarMeses(
        competenciaFiltro,
        quantidade
      )
    );
  }

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <main className="min-h-dvh bg-[#121212] text-white">

      {/* HEADER */}

      <header className="border-b border-[#2c2c2c] bg-[#171717]">

        <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

            <div>
              <h1 className="text-xl font-bold text-[#FDC700] sm:text-2xl">
                Financeiro
              </h1>

              <p className="mt-1 text-sm text-gray-400">
                Controle de mensalidades e recebimentos
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => router.push("/financeiro/despesas")}
                className="flex h-10 items-center justify-center gap-2 rounded-lg border border-[#FDC700]/40 bg-[#FDC700]/10 px-4 text-sm font-semibold text-[#FDC700] transition hover:bg-[#FDC700]/20"
              >
                <Wallet size={17} />
                <span>Despesas</span>
              </button>

              <button
                type="button"
                onClick={abrirNovaMensalidade}
                className="flex h-10 items-center justify-center gap-2 rounded-lg bg-[#FDC700] px-4 text-sm font-bold text-black transition hover:bg-[#e5b400]"
              >
                <Plus size={17} />
                Nova mensalidade
              </button>
            </div>

          </div>

        </div>

      </header>

      <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">

        {/* RESUMO */}

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">

          <div className="rounded-xl border border-[#303030] bg-[#1c1c1c] p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-green-500/10 text-green-400">
                <Wallet size={18} />
              </div>
              <div>
                <p className="text-xs text-gray-500">
                  Recebido
                </p>
                <p className="text-base font-bold text-white">
                  {formatarMoeda(
                    resumo.recebido
                  )}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-[#303030] bg-[#1c1c1c] p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-yellow-500/10 text-yellow-400">
                <Clock3 size={18} />
              </div>
              <div>
                <p className="text-xs text-gray-500">
                  Pendente
                </p>
                <p className="text-base font-bold text-white">
                  {formatarMoeda(
                    resumo.pendente
                  )}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-[#303030] bg-[#1c1c1c] p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-500/10 text-red-400">
                <CircleDollarSign size={18} />
              </div>
              <div>
                <p className="text-xs text-gray-500">
                  Atrasado
                </p>
                <p className="text-base font-bold text-white">
                  {formatarMoeda(
                    resumo.atrasado
                  )}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-[#303030] bg-[#1c1c1c] p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#FDC700]/10 text-[#FDC700]">
                <CircleDollarSign size={18} />
              </div>
              <div>
                <p className="text-xs text-gray-500">
                  Total previsto
                </p>
                <p className="text-base font-bold text-white">
                  {formatarMoeda(
                    resumo.total
                  )}
                </p>
              </div>
            </div>
          </div>

        </div>

        {/* FILTROS */}

        <div className="mt-5 rounded-xl border border-[#303030] bg-[#1c1c1c] p-3">

          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">

            <div className="flex items-center justify-between gap-2">

              <button
                type="button"
                onClick={() =>
                  alterarMes(-1)
                }
                className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-400 hover:bg-[#292929] hover:text-white"
              >
                <ChevronLeft size={19} />
              </button>

              <div className="min-w-[170px] text-center">
                <p className="text-sm font-semibold capitalize text-white">
                  {formatarCompetencia(
                    competenciaFiltro
                  )}
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  alterarMes(1)
                }
                className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-400 hover:bg-[#292929] hover:text-white"
              >
                <ChevronRight size={19} />
              </button>

            </div>

            <div className="relative w-full lg:max-w-xs">

              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600"
              />

              <input
                value={busca}
                onChange={(event) =>
                  setBusca(
                    event.target.value
                  )
                }
                placeholder="Buscar aluno..."
                className="h-10 w-full rounded-lg border border-[#303030] bg-[#151515] pl-9 pr-3 text-sm text-white outline-none placeholder:text-gray-600 focus:border-[#FDC700]/50"
              />

            </div>

          </div>

          <div className="mt-3 flex flex-wrap gap-2 border-t border-[#292929] pt-3">

            {(
              [
                ["todos", "Todas"],
                ["pendente", "Pendentes"],
                ["atrasado", "Atrasadas"],
                ["pago", "Pagas"],
                ["cancelado", "Canceladas"],
              ] as const
            ).map(
              ([valorFiltro, label]) => (
                <button
                  key={valorFiltro}
                  type="button"
                  onClick={() =>
                    setFiltroStatus(
                      valorFiltro
                    )
                  }
                  className={`rounded-lg border px-3 py-2 text-xs font-medium transition ${
                    filtroStatus ===
                    valorFiltro
                      ? "border-[#FDC700]/40 bg-[#FDC700]/10 text-[#FDC700]"
                      : "border-[#303030] bg-[#151515] text-gray-500 hover:bg-[#242424] hover:text-gray-300"
                  }`}
                >
                  {label}
                </button>
              )
            )}

          </div>

        </div>

        {/* LISTA */}

        <div className="mt-5">

          {loading ? (

            <div className="rounded-xl border border-[#303030] bg-[#1c1c1c] p-12 text-center">
              <p className="text-sm text-gray-400">
                Carregando financeiro...
              </p>
            </div>

          ) : mensalidadesFiltradas.length === 0 ? (

            <div className="rounded-xl border border-[#303030] bg-[#1c1c1c] p-12 text-center">

              <CircleDollarSign
                size={32}
                className="mx-auto text-gray-700"
              />

              <p className="mt-3 text-sm text-gray-400">
                Nenhuma mensalidade encontrada.
              </p>

              <p className="mt-1 text-xs text-gray-600">
                {filtroStatus === "atrasado"
                  ? "Nenhuma mensalidade atrasada neste mês."
                  : 'Clique em "Nova mensalidade" para cadastrar a primeira.'}
              </p>

            </div>

          ) : (

            <div className="overflow-hidden rounded-xl border border-[#303030] bg-[#1c1c1c]">

              {/* DESKTOP */}

              <div className="hidden overflow-x-auto md:block">

                <table className="w-full">

                  <thead className="border-b border-[#303030] bg-[#181818]">

                    <tr>

                      <th className="px-5 py-3 text-left text-xs font-medium text-gray-500">
                        Aluno
                      </th>

                      <th className="px-5 py-3 text-left text-xs font-medium text-gray-500">
                        Competência
                      </th>

                      <th className="px-5 py-3 text-left text-xs font-medium text-gray-500">
                        Vencimento
                      </th>

                      <th className="px-5 py-3 text-left text-xs font-medium text-gray-500">
                        Valor
                      </th>

                      <th className="px-5 py-3 text-left text-xs font-medium text-gray-500">
                        Status
                      </th>

                      <th className="px-5 py-3 text-right text-xs font-medium text-gray-500">
                        Ações
                      </th>

                    </tr>

                  </thead>

                  <tbody className="divide-y divide-[#292929]">

                    {mensalidadesFiltradas.map(
                      (mensalidade) => {

                        const aluno =
                          buscarAluno(
                            mensalidade.alunoId
                          );

                        const status =
                          statusDaMensalidade(
                            mensalidade,
                            dataHojeLocal()
                          );

                        return (

                          <tr
                            key={
                              mensalidade.id
                            }
                            className="hover:bg-[#202020]"
                          >

                            <td className="px-5 py-4">

                              <p className="text-sm font-medium text-white">
                                {aluno?.nome ??
                                  "Aluno não encontrado"}
                              </p>

                              <div className="mt-1 flex flex-wrap gap-1">

                                {aluno?.instrumentos.map(
                                  (instrumento) => (
                                    <span
                                      key={
                                        instrumento
                                      }
                                      className="rounded-full bg-[#FDC700]/10 px-2 py-0.5 text-[10px] text-[#FDC700]"
                                    >
                                      {instrumento}
                                    </span>
                                  )
                                )}

                              </div>

                            </td>

                            <td className="px-5 py-4 text-sm capitalize text-gray-400">
                              {formatarCompetencia(
                                mensalidade.competencia
                              )}
                            </td>

                            <td className="px-5 py-4 text-sm text-gray-400">
                              {formatarData(
                                mensalidade.dataVencimento
                              )}
                            </td>

                            <td className="px-5 py-4 text-sm font-medium text-white">
                              {formatarMoeda(
                                mensalidade.valor
                              )}
                            </td>

                            <td className="px-5 py-4">

                              <span
                                className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-medium ${statusInfo[status].className}`}
                              >
                                {
                                  statusInfo[
                                    status
                                  ].label
                                }
                              </span>

                            </td>

                            <td className="px-5 py-4">

                              <div className="flex justify-end gap-1">

                                {status !==
                                  "pago" &&
                                  status !==
                                    "cancelado" && (

                                    <button
                                      type="button"
                                      onClick={() =>
                                        abrirPagamento(
                                          mensalidade
                                        )
                                      }
                                      className="flex h-9 items-center gap-1.5 rounded-lg bg-green-500/10 px-3 text-xs font-medium text-green-400 hover:bg-green-500/20"
                                    >
                                      <Check
                                        size={15}
                                      />
                                      Receber
                                    </button>

                                  )}

                                <button
                                  type="button"
                                  onClick={() =>
                                    abrirEdicao(
                                      mensalidade
                                    )
                                  }
                                  className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-400 hover:bg-[#FDC700]/10 hover:text-[#FDC700]"
                                  title="Editar"
                                >
                                  <Pencil size={16} />
                                </button>

                                <button
                                  type="button"
                                  onClick={() =>
                                    abrirExclusao(
                                      mensalidade
                                    )
                                  }
                                  className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-400 hover:bg-red-500/10 hover:text-red-400"
                                  title="Excluir"
                                >
                                  <Trash2 size={16} />
                                </button>

                              </div>

                            </td>

                          </tr>

                        );
                      }
                    )}

                  </tbody>

                </table>

              </div>

              {/* MOBILE */}

              <div className="divide-y divide-[#292929] md:hidden">

                {mensalidadesFiltradas.map(
                  (mensalidade) => {

                    const aluno =
                      buscarAluno(
                        mensalidade.alunoId
                      );

                    const status =
                      statusDaMensalidade(
                        mensalidade,
                        dataHojeLocal()
                      );

                    return (

                      <div
                        key={
                          mensalidade.id
                        }
                        className="p-4"
                      >

                        <div className="flex items-start justify-between gap-3">

                          <div className="min-w-0">

                            <p className="truncate text-sm font-medium text-white">
                              {aluno?.nome ??
                                "Aluno não encontrado"}
                            </p>

                            <p className="mt-1 text-xs capitalize text-gray-500">
                              {formatarCompetencia(
                                mensalidade.competencia
                              )}
                            </p>

                            <div className="mt-2 flex flex-wrap items-center gap-2">

                              <span className="text-sm font-semibold text-white">
                                {formatarMoeda(
                                  mensalidade.valor
                                )}
                              </span>

                              <span className="text-xs text-gray-600">
                                vence{" "}
                                {formatarData(
                                  mensalidade.dataVencimento
                                )}
                              </span>

                            </div>

                            <span
                              className={`mt-2 inline-flex rounded-full border px-2.5 py-1 text-[10px] font-medium ${statusInfo[status].className}`}
                            >
                              {
                                statusInfo[
                                  status
                                ].label
                              }
                            </span>

                          </div>

                          <div className="flex shrink-0 gap-1">

                            {status !==
                              "pago" &&
                              status !==
                                "cancelado" && (

                                <button
                                  type="button"
                                  onClick={() =>
                                    abrirPagamento(
                                      mensalidade
                                    )
                                  }
                                  className="flex h-9 w-9 items-center justify-center rounded-lg bg-green-500/10 text-green-400"
                                  title="Registrar pagamento"
                                >
                                  <Check size={16} />
                                </button>

                              )}

                            <button
                              type="button"
                              onClick={() =>
                                abrirEdicao(
                                  mensalidade
                                )
                              }
                              className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-400 hover:bg-[#FDC700]/10 hover:text-[#FDC700]"
                              title="Editar"
                            >
                              <Pencil size={16} />
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                abrirExclusao(
                                  mensalidade
                                )
                              }
                              className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-400 hover:bg-red-500/10 hover:text-red-400"
                              title="Excluir"
                            >
                              <Trash2 size={16} />
                            </button>

                          </div>

                        </div>

                      </div>

                    );
                  }
                )}

              </div>

            </div>

          )}

        </div>

      </div>

      {/* =====================================================
          MODAL — NOVA MENSALIDADE
      ====================================================== */}

      {modalAberto && (

        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">

          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-[#303030] bg-[#1c1c1c] shadow-2xl">

            <div className="flex items-center justify-between border-b border-[#303030] px-5 py-4">

              <div className="flex items-center gap-3">

                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FDC700]/10 text-[#FDC700]">
                  <CircleDollarSign size={20} />
                </div>

                <div>
                  <h2 className="text-lg font-semibold text-white">
                    Nova mensalidade
                  </h2>
                  <p className="mt-1 text-xs text-gray-500">
                    Configure o primeiro recebimento do aluno.
                  </p>
                </div>

              </div>

              <button
                type="button"
                onClick={
                  fecharModal
                }
                className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-400 hover:bg-[#292929] hover:text-white"
              >
                <X size={19} />
              </button>

            </div>

            <form
              onSubmit={
                salvarNovaMensalidade
              }
              className="space-y-5 p-5"
            >

              <div>

                <label className="mb-2 block text-sm text-gray-300">
                  Aluno
                </label>

                <select
                  value={alunoId}
                  onChange={(event) =>
                    setAlunoId(
                      event.target.value
                    )
                  }
                  required
                  className="h-11 w-full rounded-xl border border-[#3a3a3a] bg-[#121212] px-3 text-sm text-white outline-none focus:border-[#FDC700]"
                >
                  <option value="">
                    Selecione um aluno
                  </option>

                  {alunosAtivos.map(
                    (aluno) => (
                      <option
                        key={aluno.id}
                        value={aluno.id}
                      >
                        {aluno.nome}
                      </option>
                    )
                  )}

                </select>

              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

                <div>

                  <label className="mb-2 block text-sm text-gray-300">
                    Valor da mensalidade
                  </label>

                  <div className="relative">

                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-gray-600">
                      R$
                    </span>

                    <input
                      value={valor}
                      onChange={(event) =>
                        setValor(
                          event.target.value
                        )
                      }
                      inputMode="decimal"
                      className="h-11 w-full rounded-xl border border-[#3a3a3a] bg-[#121212] pl-10 pr-3 text-sm text-white outline-none focus:border-[#FDC700]"
                    />

                  </div>

                </div>

                <div>

                  <label className="mb-2 block text-sm text-gray-300">
                    Dia do vencimento
                  </label>

                  <input
                    type="number"
                    min={1}
                    max={31}
                    value={diaVencimento}
                    onChange={(event) =>
                      atualizarDiaVencimento(
                        event.target.value
                      )
                    }
                    className="h-11 w-full rounded-xl border border-[#3a3a3a] bg-[#121212] px-3 text-sm text-white outline-none focus:border-[#FDC700]"
                  />

                </div>

              </div>

              <div>

                <label className="mb-2 block text-sm text-gray-300">
                  Primeiro mês de recebimento
                </label>

                <input
                  type="month"
                  value={
                    primeiraCompetencia
                  }
                  onChange={(event) =>
                    setPrimeiraCompetencia(
                      event.target.value
                    )
                  }
                  className="h-11 w-full rounded-xl border border-[#3a3a3a] bg-[#121212] px-3 text-sm text-white outline-none focus:border-[#FDC700]"
                />

                <p className="mt-2 text-xs text-gray-600">
                  Você pode escolher o mês em que deseja começar a cobrar.
                </p>

              </div>

              {vencimentoPreview && (

                <div className="rounded-xl border border-[#FDC700]/20 bg-[#FDC700]/5 p-4">

                  <div className="flex items-start gap-3">

                    <CalendarDays
                      size={18}
                      className="mt-0.5 shrink-0 text-[#FDC700]"
                    />

                    <div>

                      <p className="text-xs text-gray-500">
                        Primeiro vencimento
                      </p>

                      <p className="mt-1 text-sm font-semibold capitalize text-white">
                        {formatarData(
                          vencimentoPreview
                        )}
                      </p>

                      <p className="mt-1 text-xs text-gray-600">
                        Competência:{" "}
                        {formatarCompetencia(
                          primeiraCompetencia
                        )}
                      </p>

                    </div>

                  </div>

                </div>

              )}

              <div>

                <label className="mb-2 block text-sm text-gray-300">
                  Observação
                  <span className="ml-1 text-xs text-gray-600">
                    (opcional)
                  </span>
                </label>

                <textarea
                  value={observacao}
                  onChange={(event) =>
                    setObservacao(
                      event.target.value
                    )
                  }
                  rows={3}
                  placeholder="Ex.: valor promocional, desconto..."
                  className="w-full resize-none rounded-xl border border-[#3a3a3a] bg-[#121212] px-3 py-3 text-sm text-white outline-none placeholder:text-gray-700 focus:border-[#FDC700]"
                />

              </div>

              <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">

                <button
                  type="button"
                  onClick={
                    fecharModal
                  }
                  disabled={salvando}
                  className="h-11 rounded-lg border border-[#3a3a3a] px-5 text-sm text-gray-300 hover:bg-[#292929] disabled:opacity-40"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={salvando}
                  className="h-11 rounded-lg bg-[#FDC700] px-5 text-sm font-bold text-black hover:bg-[#e5b400] disabled:opacity-50"
                >
                  {salvando
                    ? "Salvando..."
                    : "Gerar mensalidade"}
                </button>

              </div>

            </form>

          </div>

        </div>

      )}

      {/* =====================================================
          MODAL — PAGAMENTO
      ====================================================== */}

      {modalPagamentoAberto &&
        mensalidadeSelecionada && (

        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">

          <div className="w-full max-w-md overflow-hidden rounded-2xl border border-[#303030] bg-[#1c1c1c] shadow-2xl">

            <div className="flex items-center justify-between border-b border-[#303030] px-5 py-4">

              <div className="flex items-center gap-3">

                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-500/10 text-green-400">
                  <Check size={20} />
                </div>

                <div>
                  <h2 className="text-lg font-semibold text-white">
                    Registrar pagamento
                  </h2>
                  <p className="mt-1 text-xs text-gray-500">
                    Confirme os dados do recebimento.
                  </p>
                </div>

              </div>

              <button
                type="button"
                onClick={
                  fecharPagamento
                }
                className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-400 hover:bg-[#292929] hover:text-white"
              >
                <X size={19} />
              </button>

            </div>

            <form
              onSubmit={
                registrarPagamento
              }
              className="space-y-5 p-5"
            >

              <div className="rounded-xl border border-[#303030] bg-[#151515] p-4">

                <p className="text-sm font-medium text-white">
                  {
                    buscarAluno(
                      mensalidadeSelecionada.alunoId
                    )?.nome ??
                    "Aluno"
                  }
                </p>

                <div className="mt-2 flex items-center justify-between gap-3">

                  <p className="text-xs capitalize text-gray-500">
                    {formatarCompetencia(
                      mensalidadeSelecionada.competencia
                    )}
                  </p>

                  <p className="text-lg font-bold text-green-400">
                    {formatarMoeda(
                      mensalidadeSelecionada.valor
                    )}
                  </p>

                </div>

              </div>

              <div>

                <label className="mb-2 block text-sm text-gray-300">
                  Data do pagamento
                </label>

                <input
                  type="date"
                  value={dataPagamento}
                  onChange={(event) =>
                    setDataPagamento(
                      event.target.value
                    )
                  }
                  required
                  className="h-11 w-full rounded-xl border border-[#3a3a3a] bg-[#121212] px-3 text-sm text-white outline-none focus:border-[#FDC700]"
                />

              </div>

              <div>

                <label className="mb-2 block text-sm text-gray-300">
                  Forma de pagamento
                </label>

                <select
                  value={
                    formaPagamento
                  }
                  onChange={(event) =>
                    setFormaPagamento(
                      event.target.value as FormaPagamento
                    )
                  }
                  className="h-11 w-full rounded-xl border border-[#3a3a3a] bg-[#121212] px-3 text-sm text-white outline-none focus:border-[#FDC700]"
                >
                  <option value="pix">
                    PIX
                  </option>
                  <option value="dinheiro">
                    Dinheiro
                  </option>
                  <option value="cartao">
                    Cartão
                  </option>
                  <option value="transferencia">
                    Transferência
                  </option>
                  <option value="outro">
                    Outro
                  </option>
                </select>

              </div>

              <div className="rounded-xl border border-green-500/20 bg-green-500/5 p-3">

                <p className="text-xs text-green-400">
                  Ao registrar o pagamento, a próxima mensalidade será preparada automaticamente.
                </p>

              </div>

              <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">

                <button
                  type="button"
                  onClick={
                    fecharPagamento
                  }
                  disabled={salvando}
                  className="h-11 rounded-lg border border-[#3a3a3a] px-5 text-sm text-gray-300 hover:bg-[#292929] disabled:opacity-40"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={salvando}
                  className="h-11 rounded-lg bg-green-500 px-5 text-sm font-bold text-black hover:bg-green-400 disabled:opacity-50"
                >
                  {salvando
                    ? "Registrando..."
                    : "Confirmar pagamento"}
                </button>

              </div>

            </form>

          </div>

        </div>

      )}

      {/* =====================================================
          MODAL — EXCLUSÃO
      ====================================================== */}

      {modalExclusaoAberto &&
        mensalidadeParaExcluir && (

        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">

          <div className="w-full max-w-md overflow-hidden rounded-2xl border border-[#303030] bg-[#1c1c1c] shadow-2xl">

            <div className="flex items-center justify-between border-b border-[#303030] px-5 py-4">

              <div className="flex items-center gap-3">

                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/10 text-red-400">
                  <Trash2 size={19} />
                </div>

                <div>
                  <h2 className="text-lg font-semibold text-white">
                    Excluir mensalidade
                  </h2>

                  <p className="mt-1 text-xs text-gray-500">
                    Esta ação não poderá ser desfeita.
                  </p>
                </div>

              </div>

              <button
                type="button"
                onClick={
                  fecharExclusao
                }
                disabled={salvando}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-400 hover:bg-[#292929] hover:text-white disabled:opacity-40"
              >
                <X size={19} />
              </button>

            </div>

            <div className="space-y-5 p-5">

              <div className="rounded-xl border border-[#303030] bg-[#151515] p-4">

                <p className="text-sm font-medium text-white">
                  {
                    buscarAluno(
                      mensalidadeParaExcluir.alunoId
                    )?.nome ??
                    "Aluno não encontrado"
                  }
                </p>

                <div className="mt-2 flex items-center justify-between gap-3">

                  <p className="text-xs capitalize text-gray-500">
                    {formatarCompetencia(
                      mensalidadeParaExcluir.competencia
                    )}
                  </p>

                  <p className="text-sm font-semibold text-white">
                    {formatarMoeda(
                      mensalidadeParaExcluir.valor
                    )}
                  </p>

                </div>

                <p className="mt-1 text-xs text-gray-600">
                  Vencimento:{" "}
                  {formatarData(
                    mensalidadeParaExcluir.dataVencimento
                  )}
                </p>

              </div>

              <p className="text-sm leading-6 text-gray-400">
                Tem certeza que deseja excluir esta mensalidade?
              </p>

              <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">

                <button
                  type="button"
                  onClick={
                    fecharExclusao
                  }
                  disabled={salvando}
                  className="h-11 rounded-lg border border-[#3a3a3a] px-5 text-sm text-gray-300 hover:bg-[#292929] disabled:opacity-40"
                >
                  Cancelar
                </button>

                <button
                  type="button"
                  onClick={
                    confirmarExclusao
                  }
                  disabled={salvando}
                  className="h-11 rounded-lg bg-red-500 px-5 text-sm font-bold text-white hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {salvando
                    ? "Excluindo..."
                    : "Sim, excluir"}
                </button>

              </div>

            </div>

          </div>

        </div>
      )}

      {/* =====================================================
          MODAL — EDIÇÃO
      ====================================================== */}

      {modalEdicaoAberto &&
        mensalidadeSelecionada && (

        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">

          <div className="w-full max-w-md overflow-hidden rounded-2xl border border-[#303030] bg-[#1c1c1c] shadow-2xl">

            <div className="flex items-center justify-between border-b border-[#303030] px-5 py-4">

              <div>
                <h2 className="text-lg font-semibold text-white">
                  Editar mensalidade
                </h2>
                <p className="mt-1 text-xs text-gray-500">
                  Altere os dados desta cobrança.
                </p>
              </div>

              <button
                type="button"
                onClick={
                  fecharEdicao
                }
                className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-400 hover:bg-[#292929] hover:text-white"
              >
                <X size={19} />
              </button>

            </div>

            <form
              onSubmit={
                salvarEdicao
              }
              className="space-y-5 p-5"
            >

              <div>

                <p className="text-sm font-medium text-white">
                  {
                    buscarAluno(
                      mensalidadeSelecionada.alunoId
                    )?.nome ??
                    "Aluno"
                  }
                </p>

                <p className="mt-1 text-xs capitalize text-gray-500">
                  {formatarCompetencia(
                    mensalidadeSelecionada.competencia
                  )}
                </p>

              </div>

              <div>

                <label className="mb-2 block text-sm text-gray-300">
                  Valor
                </label>

                <input
                  value={valorEdicao}
                  onChange={(event) =>
                    setValorEdicao(
                      event.target.value
                    )
                  }
                  inputMode="decimal"
                  className="h-11 w-full rounded-xl border border-[#3a3a3a] bg-[#121212] px-3 text-sm text-white outline-none focus:border-[#FDC700]"
                />

              </div>

              <div>

                <label className="mb-2 block text-sm text-gray-300">
                  Data de vencimento
                </label>

                <input
                  type="date"
                  value={
                    vencimentoEdicao
                  }
                  onChange={(event) =>
                    setVencimentoEdicao(
                      event.target.value
                    )
                  }
                  required
                  className="h-11 w-full rounded-xl border border-[#3a3a3a] bg-[#121212] px-3 text-sm text-white outline-none focus:border-[#FDC700]"
                />

              </div>

              <div>

                <label className="mb-2 block text-sm text-gray-300">
                  Observação
                </label>

                <textarea
                  value={
                    observacaoEdicao
                  }
                  onChange={(event) =>
                    setObservacaoEdicao(
                      event.target.value
                    )
                  }
                  rows={3}
                  className="w-full resize-none rounded-xl border border-[#3a3a3a] bg-[#121212] px-3 py-3 text-sm text-white outline-none focus:border-[#FDC700]"
                />

              </div>

              <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">

                <button
                  type="button"
                  onClick={
                    fecharEdicao
                  }
                  disabled={salvando}
                  className="h-11 rounded-lg border border-[#3a3a3a] px-5 text-sm text-gray-300 hover:bg-[#292929]"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={salvando}
                  className="h-11 rounded-lg bg-[#FDC700] px-5 text-sm font-bold text-black hover:bg-[#e5b400] disabled:opacity-50"
                >
                  {salvando
                    ? "Salvando..."
                    : "Salvar alterações"}
                </button>

              </div>

            </form>

          </div>

        </div>

      )}

    </main>
  );
}
