"use client";

import {
  ArrowLeft,
  Check,
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  Clock3,
  Pencil,
  Plus,
  Receipt,
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

import {
  alterarStatusDespesa,
  atualizarDespesa,
  cadastrarDespesa,
  excluirDespesa,
  listarDespesas,
} from "@/services/despesa.service";

import {
  CategoriaDespesa,
  Despesa,
  FormaPagamentoDespesa,
  StatusDespesa,
  TipoDespesa,
} from "@/types/despesa";

const categorias: {
  value: CategoriaDespesa;
  label: string;
}[] = [
  { value: "aluguel", label: "Aluguel" },
  { value: "energia", label: "Energia" },
  { value: "agua", label: "Água" },
  { value: "internet", label: "Internet" },
  { value: "telefone", label: "Telefone" },
  { value: "salarios", label: "Salários" },
  { value: "impostos", label: "Impostos" },
  { value: "materiais", label: "Materiais" },
  { value: "manutencao", label: "Manutenção" },
  { value: "marketing", label: "Marketing" },
  { value: "transporte", label: "Transporte" },
  { value: "equipamentos", label: "Equipamentos" },
  { value: "taxas", label: "Taxas" },
  { value: "alimentacao", label: "Alimentação" },
  { value: "outros", label: "Outros" },
];

const formasPagamento: {
  value: FormaPagamentoDespesa;
  label: string;
}[] = [
  { value: "pix", label: "PIX" },
  { value: "dinheiro", label: "Dinheiro" },
  { value: "cartao", label: "Cartão" },
  { value: "transferencia", label: "Transferência" },
  { value: "boleto", label: "Boleto" },
  { value: "outro", label: "Outro" },
];

function dataHojeLocal(): string {
  const agora = new Date();

  return `${agora.getFullYear()}-${String(
    agora.getMonth() + 1
  ).padStart(2, "0")}-${String(
    agora.getDate()
  ).padStart(2, "0")}`;
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

function formatarMes(competencia: string): string {
  const [ano, mes] = competencia.split("-");

  return new Intl.DateTimeFormat("pt-BR", {
    month: "long",
    year: "numeric",
  }).format(
    new Date(Number(ano), Number(mes) - 1, 1)
  );
}

function adicionarMeses(
  competencia: string,
  quantidade: number
): string {
  const [ano, mes] = competencia
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

function statusCalculado(
  despesa: Despesa,
  hoje: string
): StatusDespesa {
  if (despesa.status === "paga") {
    return "paga";
  }

  if (
    despesa.dataVencimento &&
    despesa.dataVencimento < hoje
  ) {
    return "atrasada";
  }

  return "pendente";
}

function categoriaLabel(
  categoria: CategoriaDespesa
): string {
  return (
    categorias.find(
      (item) => item.value === categoria
    )?.label ?? "Outros"
  );
}

const statusInfo: Record<
  StatusDespesa,
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
  paga: {
    label: "Paga",
    className:
      "border-green-500/30 bg-green-500/10 text-green-400",
  },
  atrasada: {
    label: "Atrasada",
    className:
      "border-red-500/30 bg-red-500/10 text-red-400",
  },
};

const despesaInicial = {
  descricao: "",
  tipo: "fixa" as TipoDespesa,
  categoria: "outros" as CategoriaDespesa,
  valor: "",
  dataVencimento: dataHojeLocal(),
  dataPagamento: "",
  status: "pendente" as StatusDespesa,
  formaPagamento: "pix" as FormaPagamentoDespesa,
  observacao: "",
};

export default function DespesasPage() {
  const router = useRouter();

  const [despesas, setDespesas] =
    useState<Despesa[]>([]);
  const [loading, setLoading] =
    useState(true);
  const [salvando, setSalvando] =
    useState(false);

  const [competencia, setCompetencia] =
    useState(
      dataHojeLocal().slice(0, 7)
    );
  const [busca, setBusca] =
    useState("");
  const [filtroTipo, setFiltroTipo] =
    useState<"todos" | TipoDespesa>("todos");
  const [filtroStatus, setFiltroStatus] =
    useState<"todos" | StatusDespesa>("todos");

  const [modalAberto, setModalAberto] =
    useState(false);
  const [modalExclusaoAberto, setModalExclusaoAberto] =
    useState(false);

  const [despesaSelecionada, setDespesaSelecionada] =
    useState<Despesa | null>(null);
  const [despesaParaExcluir, setDespesaParaExcluir] =
    useState<Despesa | null>(null);

  const [formulario, setFormulario] =
    useState(despesaInicial);

  async function carregarDados() {
    try {
      setLoading(true);

      const dados =
        await listarDespesas();

      setDespesas(dados);
    } catch (error) {
      console.error(
        "Erro ao carregar despesas:",
        error
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    carregarDados();
  }, []);

  const despesasFiltradas = useMemo(() => {
    const hoje = dataHojeLocal();
    const termo = busca
      .trim()
      .toLowerCase();

    return despesas
      .filter((item) =>
        item.dataVencimento.startsWith(
          competencia
        )
      )
      .map((item) => ({
        ...item,
        status: statusCalculado(item, hoje),
      }))
      .filter((item) => {
        if (!termo) return true;

        return (
          item.descricao
            .toLowerCase()
            .includes(termo) ||
          categoriaLabel(item.categoria)
            .toLowerCase()
            .includes(termo)
        );
      })
      .filter((item) => {
        if (filtroTipo === "todos") {
          return true;
        }

        return item.tipo === filtroTipo;
      })
      .filter((item) => {
        if (filtroStatus === "todos") {
          return true;
        }

        return item.status === filtroStatus;
      })
      .sort((a, b) =>
        a.dataVencimento.localeCompare(
          b.dataVencimento
        )
      );
  }, [
    despesas,
    competencia,
    busca,
    filtroTipo,
    filtroStatus,
  ]);

  const resumo = useMemo(() => {
    let total = 0;
    let pagas = 0;
    let pendentes = 0;
    let atrasadas = 0;
    let fixas = 0;
    let variaveis = 0;

    const hoje = dataHojeLocal();

    despesas
      .filter((item) =>
        item.dataVencimento.startsWith(
          competencia
        )
      )
      .forEach((item) => {
        total += item.valor;

        if (item.tipo === "fixa") {
          fixas += item.valor;
        } else {
          variaveis += item.valor;
        }

        const status = statusCalculado(
          item,
          hoje
        );

        if (status === "paga") {
          pagas += item.valor;
        }

        if (status === "pendente") {
          pendentes += item.valor;
        }

        if (status === "atrasada") {
          atrasadas += item.valor;
        }
      });

    return {
      total,
      pagas,
      pendentes,
      atrasadas,
      fixas,
      variaveis,
    };
  }, [despesas, competencia]);

  function abrirNovaDespesa() {
    setDespesaSelecionada(null);

    setFormulario({
      ...despesaInicial,
      dataVencimento:
        `${competencia}-${String(
          new Date().getDate()
        ).padStart(2, "0")}`,
    });

    setModalAberto(true);
  }

  function abrirEdicao(
    despesa: Despesa
  ) {
    setDespesaSelecionada(despesa);

    setFormulario({
      descricao: despesa.descricao,
      tipo: despesa.tipo,
      categoria: despesa.categoria,
      valor: despesa.valor
        .toFixed(2)
        .replace(".", ","),
      dataVencimento:
        despesa.dataVencimento,
      dataPagamento:
        despesa.dataPagamento ?? "",
      status: despesa.status,
      formaPagamento:
        despesa.formaPagamento ?? "pix",
      observacao:
        despesa.observacao ?? "",
    });

    setModalAberto(true);
  }

  function fecharModal() {
    if (salvando) return;

    setModalAberto(false);
    setDespesaSelecionada(null);
  }

  async function salvar(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    const valorNumerico =
      normalizarValor(
        formulario.valor
      );

    if (!formulario.descricao.trim()) {
      alert("Informe a descrição da despesa.");
      return;
    }

    if (valorNumerico <= 0) {
      alert("Informe um valor válido.");
      return;
    }

    if (!formulario.dataVencimento) {
      alert("Informe a data de vencimento.");
      return;
    }

    try {
      setSalvando(true);

      const dados = {
        descricao:
          formulario.descricao.trim(),
        tipo: formulario.tipo,
        categoria:
          formulario.categoria,
        valor: valorNumerico,
        dataVencimento:
          formulario.dataVencimento,
        status:
          formulario.status,
        observacao:
          formulario.observacao.trim(),

        // O Firestore não aceita campos com valor undefined.
        // Só enviamos os campos de pagamento quando a despesa
        // estiver realmente marcada como paga.
        ...(formulario.status === "paga"
          ? {
              dataPagamento:
                formulario.dataPagamento ||
                dataHojeLocal(),
              formaPagamento:
                formulario.formaPagamento,
            }
          : {}),
      };

      if (despesaSelecionada) {
        await atualizarDespesa(
          despesaSelecionada.id,
          dados
        );
      } else {
        await cadastrarDespesa(
          dados
        );
      }

      fecharModal();
      await carregarDados();
    } catch (error) {
      console.error(
        "Erro ao salvar despesa:",
        error
      );

      alert(
        "Não foi possível salvar a despesa."
      );
    } finally {
      setSalvando(false);
    }
  }

  async function marcarComoPaga(
    despesa: Despesa
  ) {
    try {
      await alterarStatusDespesa(
        despesa.id,
        "paga",
        dataHojeLocal()
      );

      await carregarDados();
    } catch (error) {
      console.error(
        "Erro ao registrar pagamento da despesa:",
        error
      );

      alert(
        "Não foi possível registrar o pagamento."
      );
    }
  }

  function abrirExclusao(
    despesa: Despesa
  ) {
    setDespesaParaExcluir(
      despesa
    );
    setModalExclusaoAberto(true);
  }

  function fecharExclusao() {
    if (salvando) return;

    setModalExclusaoAberto(false);
    setDespesaParaExcluir(null);
  }

  async function confirmarExclusao() {
    if (!despesaParaExcluir) {
      return;
    }

    try {
      setSalvando(true);

      await excluirDespesa(
        despesaParaExcluir.id
      );

      fecharExclusao();
      await carregarDados();
    } catch (error) {
      console.error(
        "Erro ao excluir despesa:",
        error
      );

      alert(
        "Não foi possível excluir a despesa."
      );
    } finally {
      setSalvando(false);
    }
  }

  return (
    <main className="min-h-dvh bg-[#121212] text-white">
      <header className="border-b border-[#2c2c2c] bg-[#171717]">
        <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-500/10 text-red-400">
                <Receipt size={22} />
              </div>

              <div>
                <h1 className="text-xl font-bold text-[#FDC700] sm:text-2xl">
                  Despesas
                </h1>
                <p className="mt-1 text-sm text-gray-400">
                  Controle das despesas da escola
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() =>
                  router.push("/financeiro")
                }
                className="flex h-10 items-center justify-center gap-2 rounded-lg border border-[#303030] bg-[#1c1c1c] px-3 text-sm text-gray-400 transition hover:bg-[#292929] hover:text-white"
              >
                <ArrowLeft size={16} />
                Voltar
              </button>

              <button
                type="button"
                onClick={() =>
                  router.push(
                    "/financeiro/despesas/compromissos"
                  )
                }
                className="flex h-10 items-center justify-center gap-2 rounded-lg border border-[#FDC700]/40 bg-[#FDC700]/10 px-4 text-sm font-semibold text-[#FDC700] transition hover:bg-[#FDC700]/20"
              >
                <Wallet size={17} />
                Compras em aberto
              </button>

              <button
                type="button"
                onClick={abrirNovaDespesa}
                className="flex h-10 items-center justify-center gap-2 rounded-lg bg-[#FDC700] px-4 text-sm font-bold text-black transition hover:bg-[#e5b400]"
              >
                <Plus size={17} />
                Nova despesa
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
          <div className="rounded-xl border border-[#303030] bg-[#1c1c1c] p-4">
            <p className="text-xs text-gray-500">
              Total
            </p>
            <p className="mt-1 text-base font-bold text-white">
              {formatarMoeda(resumo.total)}
            </p>
          </div>

          <div className="rounded-xl border border-[#303030] bg-[#1c1c1c] p-4">
            <p className="text-xs text-gray-500">
              Fixas
            </p>
            <p className="mt-1 text-base font-bold text-white">
              {formatarMoeda(resumo.fixas)}
            </p>
          </div>

          <div className="rounded-xl border border-[#303030] bg-[#1c1c1c] p-4">
            <p className="text-xs text-gray-500">
              Variáveis
            </p>
            <p className="mt-1 text-base font-bold text-white">
              {formatarMoeda(resumo.variaveis)}
            </p>
          </div>

          <div className="rounded-xl border border-[#303030] bg-[#1c1c1c] p-4">
            <p className="text-xs text-gray-500">
              Pagas
            </p>
            <p className="mt-1 text-base font-bold text-green-400">
              {formatarMoeda(resumo.pagas)}
            </p>
          </div>

          <div className="rounded-xl border border-[#303030] bg-[#1c1c1c] p-4">
            <p className="text-xs text-gray-500">
              Pendentes
            </p>
            <p className="mt-1 text-base font-bold text-yellow-400">
              {formatarMoeda(
                resumo.pendentes +
                resumo.atrasadas
              )}
            </p>
          </div>
        </div>

        <div className="mt-5 rounded-xl border border-[#303030] bg-[#1c1c1c] p-3">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() =>
                  setCompetencia(
                    adicionarMeses(
                      competencia,
                      -1
                    )
                  )
                }
                className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-400 hover:bg-[#292929] hover:text-white"
              >
                <ChevronLeft size={19} />
              </button>

              <div className="min-w-[170px] text-center">
                <p className="text-sm font-semibold capitalize text-white">
                  {formatarMes(
                    competencia
                  )}
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setCompetencia(
                    adicionarMeses(
                      competencia,
                      1
                    )
                  )
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
                placeholder="Buscar despesa..."
                className="h-10 w-full rounded-lg border border-[#303030] bg-[#151515] pl-9 pr-3 text-sm text-white outline-none placeholder:text-gray-600 focus:border-[#FDC700]/50"
              />
            </div>
          </div>

          <div className="mt-3 flex flex-wrap gap-2 border-t border-[#292929] pt-3">
            {(
              [
                ["todos", "Todos"],
                ["fixa", "Fixas"],
                ["variavel", "Variáveis"],
              ] as const
            ).map(
              ([valor, label]) => (
                <button
                  key={valor}
                  type="button"
                  onClick={() =>
                    setFiltroTipo(
                      valor
                    )}
                  className={`rounded-lg border px-3 py-2 text-xs font-medium transition ${
                    filtroTipo === valor
                      ? "border-[#FDC700]/40 bg-[#FDC700]/10 text-[#FDC700]"
                      : "border-[#303030] bg-[#151515] text-gray-500 hover:bg-[#242424] hover:text-gray-300"
                  }`}
                >
                  {label}
                </button>
              )
            )}

            {(
              [
                ["todos", "Todas"],
                ["pendente", "Pendentes"],
                ["atrasada", "Atrasadas"],
                ["paga", "Pagas"],
              ] as const
            ).map(
              ([valor, label]) => (
                <button
                  key={valor}
                  type="button"
                  onClick={() =>
                    setFiltroStatus(
                      valor
                    )}
                  className={`rounded-lg border px-3 py-2 text-xs font-medium transition ${
                    filtroStatus === valor
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

        <div className="mt-5">
          {loading ? (
            <div className="rounded-xl border border-[#303030] bg-[#1c1c1c] p-12 text-center">
              <p className="text-sm text-gray-400">
                Carregando despesas...
              </p>
            </div>
          ) : despesasFiltradas.length === 0 ? (
            <div className="rounded-xl border border-[#303030] bg-[#1c1c1c] p-12 text-center">
              <Receipt
                size={32}
                className="mx-auto text-gray-700"
              />
              <p className="mt-3 text-sm text-gray-400">
                Nenhuma despesa encontrada.
              </p>
              <p className="mt-1 text-xs text-gray-600">
                Clique em "Nova despesa" para cadastrar a primeira.
              </p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl border border-[#303030] bg-[#1c1c1c]">
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full">
                  <thead className="border-b border-[#303030] bg-[#181818]">
                    <tr>
                      <th className="px-5 py-3 text-left text-xs font-medium text-gray-500">
                        Descrição
                      </th>
                      <th className="px-5 py-3 text-left text-xs font-medium text-gray-500">
                        Categoria
                      </th>
                      <th className="px-5 py-3 text-left text-xs font-medium text-gray-500">
                        Tipo
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
                    {despesasFiltradas.map(
                      (despesa) => (
                        <tr
                          key={despesa.id}
                          className="hover:bg-[#202020]"
                        >
                          <td className="px-5 py-4">
                            <p className="text-sm font-medium text-white">
                              {despesa.descricao}
                            </p>
                            {despesa.observacao && (
                              <p className="mt-1 text-xs text-gray-600">
                                {despesa.observacao}
                              </p>
                            )}
                          </td>

                          <td className="px-5 py-4 text-sm text-gray-400">
                            {categoriaLabel(
                              despesa.categoria
                            )}
                          </td>

                          <td className="px-5 py-4">
                            <span className="rounded-full bg-[#FDC700]/10 px-2.5 py-1 text-[11px] text-[#FDC700]">
                              {despesa.tipo ===
                              "fixa"
                                ? "Fixa"
                                : "Variável"}
                            </span>
                          </td>

                          <td className="px-5 py-4 text-sm text-gray-400">
                            {formatarData(
                              despesa.dataVencimento
                            )}
                          </td>

                          <td className="px-5 py-4 text-sm font-medium text-white">
                            {formatarMoeda(
                              despesa.valor
                            )}
                          </td>

                          <td className="px-5 py-4">
                            <span
                              className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-medium ${
                                statusInfo[
                                  despesa.status
                                ].className
                              }`}
                            >
                              {
                                statusInfo[
                                  despesa.status
                                ].label
                              }
                            </span>
                          </td>

                          <td className="px-5 py-4">
                            <div className="flex justify-end gap-1">
                              {despesa.status !==
                                "paga" && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    marcarComoPaga(
                                      despesa
                                    )
                                  }
                                  className="flex h-9 items-center gap-1.5 rounded-lg bg-green-500/10 px-3 text-xs font-medium text-green-400 hover:bg-green-500/20"
                                  title="Marcar como paga"
                                >
                                  <Check
                                    size={15}
                                  />
                                  Pagar
                                </button>
                              )}

                              <button
                                type="button"
                                onClick={() =>
                                  abrirEdicao(
                                    despesa
                                  )
                                }
                                className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-400 hover:bg-[#FDC700]/10 hover:text-[#FDC700]"
                                title="Editar"
                              >
                                <Pencil
                                  size={16}
                                />
                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  abrirExclusao(
                                    despesa
                                  )
                                }
                                className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-400 hover:bg-red-500/10 hover:text-red-400"
                                title="Excluir"
                              >
                                <Trash2
                                  size={16}
                                />
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              </div>

              <div className="divide-y divide-[#292929] md:hidden">
                {despesasFiltradas.map(
                  (despesa) => (
                    <div
                      key={despesa.id}
                      className="p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-white">
                            {despesa.descricao}
                          </p>

                          <p className="mt-1 text-xs text-gray-500">
                            {categoriaLabel(
                              despesa.categoria
                            )}{" "}
                            ·{" "}
                            {despesa.tipo ===
                            "fixa"
                              ? "Fixa"
                              : "Variável"}
                          </p>

                          <div className="mt-2 flex flex-wrap items-center gap-2">
                            <span className="text-sm font-semibold text-white">
                              {formatarMoeda(
                                despesa.valor
                              )}
                            </span>

                            <span className="text-xs text-gray-600">
                              vence{" "}
                              {formatarData(
                                despesa.dataVencimento
                              )}
                            </span>
                          </div>

                          <span
                            className={`mt-2 inline-flex rounded-full border px-2.5 py-1 text-[10px] font-medium ${
                              statusInfo[
                                despesa.status
                              ].className
                            }`}
                          >
                            {
                              statusInfo[
                                despesa.status
                              ].label
                            }
                          </span>
                        </div>

                        <div className="flex shrink-0 gap-1">
                          {despesa.status !==
                            "paga" && (
                            <button
                              type="button"
                              onClick={() =>
                                marcarComoPaga(
                                  despesa
                                )
                              }
                              className="flex h-9 w-9 items-center justify-center rounded-lg bg-green-500/10 text-green-400"
                              title="Marcar como paga"
                            >
                              <Check size={16} />
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() =>
                              abrirEdicao(
                                despesa
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
                                despesa
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
                  )
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {modalAberto && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-[#303030] bg-[#1c1c1c] shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#303030] px-5 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/10 text-red-400">
                  <Receipt size={20} />
                </div>

                <div>
                  <h2 className="text-lg font-semibold text-white">
                    {despesaSelecionada
                      ? "Editar despesa"
                      : "Nova despesa"}
                  </h2>
                  <p className="mt-1 text-xs text-gray-500">
                    Registre uma despesa fixa ou variável.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={fecharModal}
                disabled={salvando}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-400 hover:bg-[#292929] hover:text-white disabled:opacity-50"
              >
                <X size={19} />
              </button>
            </div>

            <form
              onSubmit={salvar}
              className="space-y-5 p-5"
            >
              <div>
                <label className="mb-2 block text-sm text-gray-300">
                  Descrição
                </label>
                <input
                  value={formulario.descricao}
                  onChange={(event) =>
                    setFormulario((atual) => ({
                      ...atual,
                      descricao:
                        event.target.value,
                    }))
                  }
                  disabled={salvando}
                  placeholder="Ex.: Aluguel da escola"
                  className="h-11 w-full rounded-lg border border-[#3a3a3a] bg-[#121212] px-3 text-sm text-white outline-none placeholder:text-gray-700 focus:border-[#FDC700]"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm text-gray-300">
                    Tipo
                  </label>

                  <select
                    value={formulario.tipo}
                    onChange={(event) =>
                      setFormulario(
                        (atual) => ({
                          ...atual,
                          tipo: event.target
                            .value as TipoDespesa,
                        })
                      )
                    }
                    disabled={salvando}
                    className="h-11 w-full rounded-lg border border-[#3a3a3a] bg-[#121212] px-3 text-sm text-white outline-none focus:border-[#FDC700]"
                  >
                    <option value="fixa">
                      Despesa fixa
                    </option>
                    <option value="variavel">
                      Despesa variável
                    </option>
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm text-gray-300">
                    Categoria
                  </label>

                  <select
                    value={formulario.categoria}
                    onChange={(event) =>
                      setFormulario(
                        (atual) => ({
                          ...atual,
                          categoria:
                            event.target
                              .value as CategoriaDespesa,
                        })
                      )
                    }
                    disabled={salvando}
                    className="h-11 w-full rounded-lg border border-[#3a3a3a] bg-[#121212] px-3 text-sm text-white outline-none focus:border-[#FDC700]"
                  >
                    {categorias.map(
                      (item) => (
                        <option
                          key={item.value}
                          value={item.value}
                        >
                          {item.label}
                        </option>
                      )
                    )}
                  </select>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm text-gray-300">
                    Valor
                  </label>

                  <input
                    value={formulario.valor}
                    onChange={(event) =>
                      setFormulario(
                        (atual) => ({
                          ...atual,
                          valor:
                            event.target.value,
                        })
                      )
                    }
                    disabled={salvando}
                    inputMode="decimal"
                    placeholder="0,00"
                    className="h-11 w-full rounded-lg border border-[#3a3a3a] bg-[#121212] px-3 text-sm text-white outline-none placeholder:text-gray-700 focus:border-[#FDC700]"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm text-gray-300">
                    Data de vencimento
                  </label>

                  <input
                    type="date"
                    value={
                      formulario.dataVencimento
                    }
                    onChange={(event) =>
                      setFormulario(
                        (atual) => ({
                          ...atual,
                          dataVencimento:
                            event.target
                              .value,
                        })
                      )
                    }
                    disabled={salvando}
                    className="h-11 w-full rounded-lg border border-[#3a3a3a] bg-[#121212] px-3 text-sm text-white outline-none focus:border-[#FDC700]"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm text-gray-300">
                  Status
                </label>

                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {(
                    [
                      ["pendente", "Pendente"],
                      ["paga", "Paga"],
                    ] as const
                  ).map(
                    ([valor, label]) => (
                      <button
                        key={valor}
                        type="button"
                        onClick={() =>
                          setFormulario(
                            (atual) => ({
                              ...atual,
                              status: valor,
                              dataPagamento:
                                valor ===
                                "paga"
                                  ? atual.dataPagamento ||
                                    dataHojeLocal()
                                  : "",
                            })
                          )
                        }
                        className={`rounded-lg border px-3 py-2.5 text-sm transition ${
                          formulario.status ===
                          valor
                            ? "border-[#FDC700] bg-[#FDC700]/10 text-[#FDC700]"
                            : "border-[#3a3a3a] bg-[#121212] text-gray-400 hover:border-[#555]"
                        }`}
                      >
                        {label}
                      </button>
                    )
                  )}
                </div>
              </div>

              {formulario.status ===
                "paga" && (
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm text-gray-300">
                      Data do pagamento
                    </label>

                    <input
                      type="date"
                      value={
                        formulario.dataPagamento
                      }
                      onChange={(event) =>
                        setFormulario(
                          (atual) => ({
                            ...atual,
                            dataPagamento:
                              event.target
                                .value,
                          })
                        )
                      }
                      disabled={salvando}
                      className="h-11 w-full rounded-lg border border-[#3a3a3a] bg-[#121212] px-3 text-sm text-white outline-none focus:border-[#FDC700]"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm text-gray-300">
                      Forma de pagamento
                    </label>

                    <select
                      value={
                        formulario.formaPagamento
                      }
                      onChange={(event) =>
                        setFormulario(
                          (atual) => ({
                            ...atual,
                            formaPagamento:
                              event.target
                                .value as FormaPagamentoDespesa,
                          })
                        )
                      }
                      disabled={salvando}
                      className="h-11 w-full rounded-lg border border-[#3a3a3a] bg-[#121212] px-3 text-sm text-white outline-none focus:border-[#FDC700]"
                    >
                      {formasPagamento.map(
                        (item) => (
                          <option
                            key={item.value}
                            value={item.value}
                          >
                            {item.label}
                          </option>
                        )
                      )}
                    </select>
                  </div>
                </div>
              )}

              <div>
                <label className="mb-2 block text-sm text-gray-300">
                  Observação
                </label>

                <textarea
                  value={
                    formulario.observacao
                  }
                  onChange={(event) =>
                    setFormulario(
                      (atual) => ({
                        ...atual,
                        observacao:
                          event.target.value,
                      })
                    )
                  }
                  disabled={salvando}
                  rows={3}
                  placeholder="Opcional"
                  className="w-full resize-none rounded-lg border border-[#3a3a3a] bg-[#121212] px-3 py-3 text-sm text-white outline-none placeholder:text-gray-700 focus:border-[#FDC700]"
                />
              </div>

              <div className="flex justify-end gap-2 border-t border-[#303030] pt-4">
                <button
                  type="button"
                  onClick={fecharModal}
                  disabled={salvando}
                  className="h-10 rounded-lg border border-[#303030] px-4 text-sm text-gray-400 hover:bg-[#292929] hover:text-white disabled:opacity-50"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={salvando}
                  className="h-10 rounded-lg bg-[#FDC700] px-5 text-sm font-bold text-black hover:bg-[#e5b400] disabled:opacity-50"
                >
                  {salvando
                    ? "Salvando..."
                    : "Salvar despesa"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {modalExclusaoAberto &&
        despesaParaExcluir && (
          <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-2xl border border-[#303030] bg-[#1c1c1c] p-5 shadow-2xl">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-500/10 text-red-400">
                  <Trash2 size={19} />
                </div>

                <div>
                  <h2 className="text-base font-semibold text-white">
                    Excluir despesa
                  </h2>

                  <p className="mt-2 text-sm leading-6 text-gray-400">
                    Deseja realmente excluir a despesa{" "}
                    <span className="font-medium text-white">
                      "{despesaParaExcluir.descricao}"
                    </span>
                    ? Esta ação não poderá ser desfeita.
                  </p>
                </div>
              </div>

              <div className="mt-5 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={fecharExclusao}
                  disabled={salvando}
                  className="h-10 rounded-lg border border-[#303030] px-4 text-sm text-gray-400 hover:bg-[#292929] hover:text-white disabled:opacity-50"
                >
                  Cancelar
                </button>

                <button
                  type="button"
                  onClick={confirmarExclusao}
                  disabled={salvando}
                  className="h-10 rounded-lg bg-red-500/10 px-4 text-sm font-semibold text-red-400 hover:bg-red-500/20 disabled:opacity-50"
                >
                  {salvando
                    ? "Excluindo..."
                    : "Excluir"}
                </button>
              </div>
            </div>
          </div>
        )}
    </main>
  );
}
