"use client";

import {
  BarChart3,
  Download,
  FileText,
  ReceiptText,
  RefreshCw,
  RotateCcw,
  Search,
} from "lucide-react";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import { listarDespesas } from "@/services/despesa.service";
import { listarCompromissos } from "@/services/compromisso.service";

import {
  CategoriaDespesa,
  Despesa,
  StatusDespesa,
  TipoDespesa,
} from "@/types/despesa";

import {
  CategoriaCompromisso,
  Compromisso,
} from "@/types/compromisso";

type StatusFiltro =
  | "todos"
  | StatusDespesa;

type TipoFiltro =
  | "todos"
  | TipoDespesa;

function dataHojeLocal() {
  const agora = new Date();

  return `${agora.getFullYear()}-${String(
    agora.getMonth() + 1
  ).padStart(2, "0")}-${String(
    agora.getDate()
  ).padStart(2, "0")}`;
}

function inicioDoMes(data: string) {
  return `${data.slice(0, 7)}-01`;
}

function fimDoMes(data: string) {
  const [ano, mes] = data
    .split("-")
    .map(Number);

  const ultimoDia = new Date(
    ano,
    mes,
    0
  ).getDate();

  return `${ano}-${String(mes).padStart(
    2,
    "0"
  )}-${String(ultimoDia).padStart(
    2,
    "0"
  )}`;
}

function formatarData(data?: string) {
  if (!data) return "-";

  const partes = data.split("-");

  if (partes.length !== 3) {
    return data;
  }

  return `${partes[2]}/${partes[1]}/${partes[0]}`;
}

function formatarMoeda(valor: number) {
  return new Intl.NumberFormat(
    "pt-BR",
    {
      style: "currency",
      currency: "BRL",
    }
  ).format(valor);
}

function categoriaLabel(
  categoria: CategoriaDespesa
) {
  const labels: Record<
    CategoriaDespesa,
    string
  > = {
    aluguel: "Aluguel",
    energia: "Energia",
    agua: "Água",
    internet: "Internet",
    telefone: "Telefone",
    salarios: "Salários",
    impostos: "Impostos",
    materiais: "Materiais",
    manutencao: "Manutenção",
    marketing: "Marketing",
    transporte: "Transporte",
    equipamentos: "Equipamentos",
    taxas: "Taxas",
    alimentacao: "Alimentação",
    outros: "Outros",
  };

  return labels[categoria] ?? categoria;
}

function categoriaCompromissoLabel(
  categoria: CategoriaCompromisso
) {
  const labels: Record<CategoriaCompromisso, string> = {
    compras: "Compras",
    fornecedores: "Fornecedores",
    equipamentos: "Equipamentos",
    instrumentos: "Instrumentos",
    materiais: "Materiais",
    outros: "Outros",
  };

  return labels[categoria] ?? categoria;
}

function statusDaDespesa(
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

const formaPagamentoInfo: Record<
  string,
  string
> = {
  pix: "PIX",
  dinheiro: "Dinheiro",
  cartao: "Cartão",
  transferencia: "Transferência",
  boleto: "Boleto",
  outro: "Outro",
};

export default function RelatorioDespesasPage() {
  const hoje = dataHojeLocal();

  const [despesas, setDespesas] =
    useState<Despesa[]>([]);
  const [compromissos, setCompromissos] =
    useState<Compromisso[]>([]);
  const [loading, setLoading] =
    useState(true);
  const [atualizando, setAtualizando] =
    useState(false);

  const [dataInicial, setDataInicial] =
    useState(inicioDoMes(hoje));

  const [dataFinal, setDataFinal] =
    useState(fimDoMes(hoje));

  const [tipoFiltro, setTipoFiltro] =
    useState<TipoFiltro>("todos");

  const [statusFiltro, setStatusFiltro] =
    useState<StatusFiltro>("todos");

  const [busca, setBusca] =
    useState("");

  async function carregarDados(
    silencioso = false
  ) {
    try {
      if (silencioso) {
        setAtualizando(true);
      } else {
        setLoading(true);
      }

      const [despesasData, compromissosData] =
        await Promise.all([
          listarDespesas(),
          listarCompromissos(),
        ]);

      setDespesas(despesasData);
      setCompromissos(compromissosData);
    } catch (error) {
      console.error(
        "Erro ao carregar relatório de despesas:",
        error
      );
    } finally {
      setLoading(false);
      setAtualizando(false);
    }
  }

  useEffect(() => {
    carregarDados();
  }, []);

  const despesasFiltradas =
    useMemo(() => {
      const termo =
        busca.trim().toLowerCase();

      return despesas
        .map((despesa) => ({
          ...despesa,
          status: statusDaDespesa(
            despesa,
            hoje
          ),
        }))
        .filter((despesa) => {
          if (
            despesa.dataVencimento <
              dataInicial ||
            despesa.dataVencimento >
              dataFinal
          ) {
            return false;
          }

          if (
            tipoFiltro !== "todos" &&
            despesa.tipo !== tipoFiltro
          ) {
            return false;
          }

          if (
            statusFiltro !== "todos" &&
            despesa.status !==
              statusFiltro
          ) {
            return false;
          }

          if (!termo) {
            return true;
          }

          return (
            despesa.descricao
              .toLowerCase()
              .includes(termo) ||
            categoriaLabel(
              despesa.categoria
            )
              .toLowerCase()
              .includes(termo) ||
            despesa.dataVencimento.includes(
              termo
            ) ||
            despesa.dataPagamento?.includes(
              termo
            )
          );
        })
        .sort((a, b) =>
          a.dataVencimento.localeCompare(
            b.dataVencimento
          )
        );
    }, [
      despesas,
      hoje,
      dataInicial,
      dataFinal,
      tipoFiltro,
      statusFiltro,
      busca,
    ]);

  const compromissosAbertos = useMemo(() => {
    const termo = busca.trim().toLowerCase();

    return compromissos
      .filter((compromisso) => {
        if (compromisso.status === "quitado") {
          return false;
        }

        if (
          compromisso.dataCompra < dataInicial ||
          compromisso.dataCompra > dataFinal
        ) {
          return false;
        }

        if (!termo) {
          return true;
        }

        return (
          compromisso.descricao
            .toLowerCase()
            .includes(termo) ||
          categoriaCompromissoLabel(
            compromisso.categoria
          )
            .toLowerCase()
            .includes(termo) ||
          compromisso.dataCompra.includes(termo)
        );
      })
      .sort((a, b) =>
        a.dataCompra.localeCompare(b.dataCompra)
      );
  }, [
    compromissos,
    dataInicial,
    dataFinal,
    busca,
  ]);

  const totalEmAberto = useMemo(
    () =>
      compromissosAbertos.reduce(
        (total, compromisso) =>
          total + compromisso.saldoDevedor,
        0
      ),
    [compromissosAbertos]
  );

  const resumo = useMemo(() => {
    let total = 0;
    let fixas = 0;
    let variaveis = 0;
    let pagas = 0;
    let pendentes = 0;
    let atrasadas = 0;

    despesasFiltradas.forEach(
      (despesa) => {
        total += despesa.valor;

        if (despesa.tipo === "fixa") {
          fixas += despesa.valor;
        }

        if (
          despesa.tipo === "variavel"
        ) {
          variaveis += despesa.valor;
        }

        if (despesa.status === "paga") {
          pagas += despesa.valor;
        }

        if (
          despesa.status === "pendente"
        ) {
          pendentes += despesa.valor;
        }

        if (
          despesa.status === "atrasada"
        ) {
          atrasadas += despesa.valor;
        }
      }
    );

    return {
      registros:
        despesasFiltradas.length,
      total,
      fixas,
      variaveis,
      pagas,
      pendentes,
      atrasadas,
      emAberto: totalEmAberto,
    };
  }, [despesasFiltradas, totalEmAberto]);

  function limparFiltros() {
    const atual =
      dataHojeLocal();

    setDataInicial(
      inicioDoMes(atual)
    );

    setDataFinal(
      fimDoMes(atual)
    );

    setTipoFiltro("todos");
    setStatusFiltro("todos");
    setBusca("");
  }

  return (
    <main className="min-h-dvh bg-[#121212] text-white print:bg-white print:text-black">
      <header className="border-b border-[#2c2c2c] bg-[#171717] print:hidden">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#FDC700]/10 text-[#FDC700]">
              <ReceiptText size={22} />
            </div>

            <div>
              <h1 className="text-xl font-bold text-[#FDC700] sm:text-2xl">
                Relatório de Despesas
              </h1>
              <p className="mt-1 text-sm text-gray-400">
                Despesas fixas, variáveis, pagamentos e valores pendentes
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => window.print()}
            className="flex h-10 items-center justify-center gap-2 rounded-lg bg-[#FDC700] px-4 text-sm font-semibold text-black"
          >
            <Download size={16} />
            Imprimir relatório
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8 print:max-w-none print:px-0 print:py-0">
        <div className="mb-5 rounded-2xl border border-[#303030] bg-[#1c1c1c] p-4 sm:p-5 print:hidden">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold text-white">
                Filtros
              </h2>
              <p className="mt-1 text-xs text-gray-600">
                Filtre por período, tipo, situação e descrição.
              </p>
            </div>

            <button
              type="button"
              onClick={limparFiltros}
              className="flex items-center gap-2 rounded-lg border border-[#303030] px-3 py-2 text-xs text-gray-500 hover:bg-[#292929] hover:text-white"
            >
              <RotateCcw size={14} />
              Limpar
            </button>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <div>
              <label className="mb-1.5 block text-xs text-gray-500">
                Data inicial
              </label>
              <input
                type="date"
                value={dataInicial}
                onChange={(event) =>
                  setDataInicial(
                    event.target.value
                  )
                }
                className="h-10 w-full rounded-lg border border-[#303030] bg-[#151515] px-3 text-sm text-white outline-none focus:border-[#FDC700]"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs text-gray-500">
                Data final
              </label>
              <input
                type="date"
                value={dataFinal}
                onChange={(event) =>
                  setDataFinal(
                    event.target.value
                  )
                }
                className="h-10 w-full rounded-lg border border-[#303030] bg-[#151515] px-3 text-sm text-white outline-none focus:border-[#FDC700]"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs text-gray-500">
                Tipo
              </label>
              <select
                value={tipoFiltro}
                onChange={(event) =>
                  setTipoFiltro(
                    event.target
                      .value as TipoFiltro
                  )
                }
                className="h-10 w-full rounded-lg border border-[#303030] bg-[#151515] px-3 text-sm text-white outline-none focus:border-[#FDC700]"
              >
                <option value="todos">
                  Todas
                </option>
                <option value="fixa">
                  Fixas
                </option>
                <option value="variavel">
                  Variáveis
                </option>
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-xs text-gray-500">
                Situação
              </label>
              <select
                value={statusFiltro}
                onChange={(event) =>
                  setStatusFiltro(
                    event.target
                      .value as StatusFiltro
                  )
                }
                className="h-10 w-full rounded-lg border border-[#303030] bg-[#151515] px-3 text-sm text-white outline-none focus:border-[#FDC700]"
              >
                <option value="todos">
                  Todas
                </option>
                <option value="paga">
                  Pagas
                </option>
                <option value="pendente">
                  Pendentes
                </option>
                <option value="atrasada">
                  Atrasadas
                </option>
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-xs text-gray-500">
                Pesquisa
              </label>

              <div className="relative">
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
                  placeholder="Descrição, categoria ou data..."
                  className="h-10 w-full rounded-lg border border-[#303030] bg-[#151515] pl-9 pr-3 text-sm text-white outline-none placeholder:text-gray-700 focus:border-[#FDC700]"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-7">
          {[
            [
              "Despesas",
              resumo.registros,
              "text-white",
            ],
            [
              "Total",
              formatarMoeda(
                resumo.total
              ),
              "text-[#FDC700]",
            ],
            [
              "Fixas",
              formatarMoeda(
                resumo.fixas
              ),
              "text-white",
            ],
            [
              "Variáveis",
              formatarMoeda(
                resumo.variaveis
              ),
              "text-white",
            ],
            [
              "Pagas",
              formatarMoeda(
                resumo.pagas
              ),
              "text-green-400",
            ],
            [
              "Pendentes",
              formatarMoeda(
                resumo.pendentes
              ),
              "text-yellow-400",
            ],
            [
              "Em aberto",
              formatarMoeda(
                resumo.emAberto
              ),
              "text-orange-400",
            ],
          ].map(
            ([titulo, valor, classe]) => (
              <div
                key={String(titulo)}
                className="rounded-xl border border-[#303030] bg-[#1c1c1c] p-4 print:border-gray-300 print:bg-white"
              >
                <p className="text-xs text-gray-500">
                  {titulo}
                </p>

                <p
                  className={`mt-1 text-lg font-bold ${classe} print:text-black`}
                >
                  {valor}
                </p>
              </div>
            )
          )}
        </div>

        <div className="mb-5 hidden print:block">
          <h1 className="text-2xl font-bold">
            Relatório de Despesas
          </h1>

          <p className="mt-1 text-sm">
            Período:{" "}
            {formatarData(
              dataInicial
            )}{" "}
            a{" "}
            {formatarData(
              dataFinal
            )}
          </p>
        </div>

        <div className="overflow-hidden rounded-2xl border border-[#303030] bg-[#1c1c1c] print:border-gray-300 print:bg-white">
          <div className="flex items-center justify-between gap-3 border-b border-[#303030] px-4 py-4 print:border-gray-300">
            <div>
              <h2 className="text-sm font-semibold text-white print:text-black">
                Histórico de despesas
              </h2>

              <p className="mt-1 text-xs text-gray-600">
                {resumo.registros} registro(s) encontrado(s)
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                carregarDados(true)
              }
              disabled={atualizando}
              className="flex h-9 items-center gap-2 rounded-lg border border-[#303030] px-3 text-xs text-gray-500 hover:bg-[#292929] hover:text-white disabled:opacity-50 print:hidden"
            >
              <RefreshCw
                size={14}
                className={
                  atualizando
                    ? "animate-spin"
                    : ""
                }
              />
              Atualizar
            </button>
          </div>

          {loading ? (
            <div className="p-12 text-center">
              <RefreshCw
                size={24}
                className="mx-auto animate-spin text-[#FDC700]"
              />

              <p className="mt-3 text-sm text-gray-500">
                Carregando relatório...
              </p>
            </div>
          ) : despesasFiltradas.length ===
            0 ? (
            <div className="p-12 text-center">
              <FileText
                size={32}
                className="mx-auto text-gray-700"
              />

              <p className="mt-3 text-sm text-gray-400 print:text-gray-700">
                Nenhuma despesa encontrada.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto print:overflow-visible">
              <table className="w-full min-w-[1200px] print:min-w-0 print:w-full print:table-fixed">
                <thead className="border-b border-[#303030] bg-[#181818] print:border-gray-300 print:bg-gray-100">
                  <tr>
                    {[
                      "Descrição",
                      "Categoria",
                      "Tipo",
                      "Vencimento",
                      "Valor",
                      "Status",
                      "Data do pagamento",
                      "Forma de pagamento",
                    ].map(
                      (titulo) => (
                        <th
                          key={titulo}
                          className="break-words px-3 py-2 text-left text-xs font-medium text-gray-500"
                        >
                          {titulo}
                        </th>
                      )
                    )}
                  </tr>
                </thead>

                <tbody className="divide-y divide-[#292929] print:divide-gray-300">
                  {despesasFiltradas.map(
                    (despesa) => (
                      <tr
                        key={despesa.id}
                        className="hover:bg-[#202020] print:hover:bg-transparent"
                      >
                        <td className="break-words px-3 py-2 text-sm font-medium text-white print:text-black">
                          {despesa.descricao}
                        </td>

                        <td className="break-words px-3 py-2 text-sm text-gray-300 print:text-black">
                          {categoriaLabel(
                            despesa.categoria
                          )}
                        </td>

                        <td className="break-words px-3 py-2">
                          <span className="rounded-full bg-[#FDC700]/10 px-2.5 py-1 text-[10px] text-[#FDC700]">
                            {despesa.tipo ===
                            "fixa"
                              ? "Fixa"
                              : "Variável"}
                          </span>
                        </td>

                        <td className="break-words px-3 py-2 text-sm text-gray-300 print:text-black">
                          {formatarData(
                            despesa.dataVencimento
                          )}
                        </td>

                        <td className="break-words px-3 py-2 text-sm font-semibold text-white print:text-black">
                          {formatarMoeda(
                            despesa.valor
                          )}
                        </td>

                        <td className="break-words px-3 py-2">
                          <span
                            className={`inline-flex min-w-[72px] justify-center rounded-full border px-2.5 py-1 text-[10px] font-semibold ${statusInfo[despesa.status].className} print:border-gray-400 print:bg-transparent print:text-black`}
                          >
                            {
                              statusInfo[
                                despesa.status
                              ].label
                            }
                          </span>
                        </td>

                        <td className="break-words px-3 py-2 text-sm text-gray-300 print:text-black">
                          {despesa.dataPagamento
                            ? formatarData(
                                despesa.dataPagamento
                              )
                            : "-"}
                        </td>

                        <td className="break-words px-3 py-2 text-sm text-gray-400 print:text-black">
                          {despesa.formaPagamento
                            ? formaPagamentoInfo[
                                despesa.formaPagamento
                              ] ??
                              despesa.formaPagamento
                            : "-"}
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="overflow-hidden rounded-2xl border border-[#303030] bg-[#1c1c1c] print:border-gray-300 print:bg-white">
          <div className="flex items-center justify-between gap-3 border-b border-[#303030] px-4 py-4 print:border-gray-300">
            <div>
              <h2 className="text-sm font-semibold text-white print:text-black">
                Compras e despesas em aberto
              </h2>
              <p className="mt-1 text-xs text-gray-600">
                {compromissosAbertos.length} compromisso(s) em aberto no período
              </p>
            </div>
          </div>

          {compromissosAbertos.length === 0 ? (
            <div className="p-10 text-center">
              <ReceiptText
                size={30}
                className="mx-auto text-gray-700"
              />
              <p className="mt-3 text-sm text-gray-400 print:text-gray-700">
                Nenhuma compra em aberto no período selecionado.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto print:overflow-visible">
              <table className="w-full min-w-[1050px] print:min-w-0 print:w-full print:table-fixed">
                <thead className="border-b border-[#303030] bg-[#181818] print:border-gray-300 print:bg-gray-100">
                  <tr>
                    {[
                      "Descrição",
                      "Categoria",
                      "Data da compra",
                      "Valor total",
                      "Pago",
                      "Saldo devedor",
                      "Status",
                    ].map((titulo) => (
                      <th
                        key={titulo}
                        className="break-words px-3 py-2 text-left text-xs font-medium text-gray-500"
                      >
                        {titulo}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody className="divide-y divide-[#292929] print:divide-gray-300">
                  {compromissosAbertos.map((compromisso) => (
                    <tr
                      key={compromisso.id}
                      className="hover:bg-[#202020] print:hover:bg-transparent"
                    >
                      <td className="break-words px-3 py-2 text-sm font-medium text-white print:text-black">
                        {compromisso.descricao}
                      </td>

                      <td className="break-words px-3 py-2 text-sm text-gray-300 print:text-black">
                        {categoriaCompromissoLabel(
                          compromisso.categoria
                        )}
                      </td>

                      <td className="break-words px-3 py-2 text-sm text-gray-300 print:text-black">
                        {formatarData(
                          compromisso.dataCompra
                        )}
                      </td>

                      <td className="break-words px-3 py-2 text-sm font-semibold text-white print:text-black">
                        {formatarMoeda(
                          compromisso.valorTotal
                        )}
                      </td>

                      <td className="break-words px-3 py-2 text-sm font-semibold text-green-400 print:text-black">
                        {formatarMoeda(
                          compromisso.totalPago
                        )}
                      </td>

                      <td className="break-words px-3 py-2 text-sm font-bold text-orange-400 print:text-black">
                        {formatarMoeda(
                          compromisso.saldoDevedor
                        )}
                      </td>

                      <td className="break-words px-3 py-2">
                        <span className="inline-flex min-w-[82px] justify-center rounded-full border border-yellow-500/30 bg-yellow-500/10 px-2.5 py-1 text-[10px] font-semibold text-yellow-400 print:border-gray-400 print:bg-transparent print:text-black">
                          Em aberto
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
