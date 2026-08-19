"use client";

import {
  BarChart3,
  Download,
  FileText,
  RefreshCw,
  RotateCcw,
  Search,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { listarAlunos } from "@/services/aluno.service";
import { listarMensalidades } from "@/services/mensalidade.service";

import { Aluno } from "@/types/aluno";
import {
  Mensalidade,
  StatusMensalidade,
} from "@/types/mensalidade";

type StatusFiltro =
  | "todos"
  | StatusMensalidade;

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

function formatarCompetencia(
  competencia: string
) {
  if (!competencia) return "-";

  const [ano, mes] =
    competencia.split("-");

  const data = new Date(
    Number(ano),
    Number(mes) - 1,
    1
  );

  return new Intl.DateTimeFormat(
    "pt-BR",
    {
      month: "long",
      year: "numeric",
    }
  ).format(data);
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

const formaPagamentoInfo: Record<
  string,
  string
> = {
  dinheiro: "Dinheiro",
  pix: "PIX",
  cartao: "Cartão",
  transferencia: "Transferência",
  outro: "Outro",
};

export default function RelatorioFinanceiroPage() {
  const [alunos, setAlunos] =
    useState<Aluno[]>([]);

  const [mensalidades, setMensalidades] =
    useState<Mensalidade[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [atualizando, setAtualizando] =
    useState(false);

  const hoje = dataHojeLocal();

  const [dataInicial, setDataInicial] =
    useState(inicioDoMes(hoje));

  const [dataFinal, setDataFinal] =
    useState(fimDoMes(hoje));

  const [alunoFiltro, setAlunoFiltro] =
    useState("");

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

      const [
        alunosData,
        mensalidadesData,
      ] = await Promise.all([
        listarAlunos(),
        listarMensalidades(),
      ]);

      setAlunos(alunosData);
      setMensalidades(
        mensalidadesData
      );
    } catch (error) {
      console.error(
        "Erro ao carregar relatório financeiro:",
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

  function buscarAluno(id: string) {
    return alunos.find(
      (aluno) => aluno.id === id
    );
  }

  const mensalidadesFiltradas =
    useMemo(() => {
      const termo =
        busca.trim().toLowerCase();

      return mensalidades
        .map((mensalidade) => ({
          ...mensalidade,
          status: statusDaMensalidade(
            mensalidade,
            hoje
          ),
        }))
        .filter((mensalidade) => {
          if (
            mensalidade.dataVencimento <
              dataInicial ||
            mensalidade.dataVencimento >
              dataFinal
          ) {
            return false;
          }

          if (
            alunoFiltro &&
            mensalidade.alunoId !==
              alunoFiltro
          ) {
            return false;
          }

          if (
            statusFiltro !== "todos" &&
            mensalidade.status !==
              statusFiltro
          ) {
            return false;
          }

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
            mensalidade.competencia
              .toLowerCase()
              .includes(termo) ||
            mensalidade.dataVencimento
              .includes(termo) ||
            mensalidade.dataPagamento
              ?.includes(termo)
          );
        })
        .sort((a, b) => {
          return (
            a.dataVencimento.localeCompare(
              b.dataVencimento
            ) ||
            (
              buscarAluno(a.alunoId)
                ?.nome ?? ""
            ).localeCompare(
              buscarAluno(b.alunoId)
                ?.nome ?? "",
              "pt-BR"
            )
          );
        });
    }, [
      mensalidades,
      alunos,
      hoje,
      dataInicial,
      dataFinal,
      alunoFiltro,
      statusFiltro,
      busca,
    ]);

  const resumo = useMemo(() => {
    let previsto = 0;
    let recebido = 0;
    let pendente = 0;
    let atrasado = 0;
    let cancelado = 0;

    mensalidadesFiltradas.forEach(
      (mensalidade) => {
        if (
          mensalidade.status !==
          "cancelado"
        ) {
          previsto += mensalidade.valor;
        }

        if (
          mensalidade.status === "pago"
        ) {
          recebido += mensalidade.valor;
        }

        if (
          mensalidade.status ===
          "pendente"
        ) {
          pendente += mensalidade.valor;
        }

        if (
          mensalidade.status ===
          "atrasado"
        ) {
          atrasado += mensalidade.valor;
        }

        if (
          mensalidade.status ===
          "cancelado"
        ) {
          cancelado += mensalidade.valor;
        }
      }
    );

    return {
      registros:
        mensalidadesFiltradas.length,
      previsto,
      recebido,
      pendente,
      atrasado,
      cancelado,
    };
  }, [mensalidadesFiltradas]);

  function limparFiltros() {
    const atual =
      dataHojeLocal();

    setDataInicial(
      inicioDoMes(atual)
    );
    setDataFinal(
      fimDoMes(atual)
    );
    setAlunoFiltro("");
    setStatusFiltro("todos");
    setBusca("");
  }

  return (
    <main className="min-h-dvh bg-[#121212] text-white print:bg-white print:text-black">
      <header className="border-b border-[#2c2c2c] bg-[#171717] print:hidden">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#FDC700]/10 text-[#FDC700]">
              <BarChart3 size={22} />
            </div>

            <div>
              <h1 className="text-xl font-bold text-[#FDC700] sm:text-2xl">
                Relatório Financeiro
              </h1>
              <p className="mt-1 text-sm text-gray-400">
                Mensalidades, vencimentos e recebimentos
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
                Filtre por período, aluno e situação.
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
                Aluno
              </label>
              <select
                value={alunoFiltro}
                onChange={(event) =>
                  setAlunoFiltro(
                    event.target.value
                  )
                }
                className="h-10 w-full rounded-lg border border-[#303030] bg-[#151515] px-3 text-sm text-white outline-none focus:border-[#FDC700]"
              >
                <option value="">
                  Todos os alunos
                </option>

                {[...alunos]
                  .sort((a, b) =>
                    a.nome.localeCompare(
                      b.nome,
                      "pt-BR"
                    )
                  )
                  .map((aluno) => (
                    <option
                      key={aluno.id}
                      value={aluno.id}
                    >
                      {aluno.nome}
                    </option>
                  ))}
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
                    event.target.value as StatusFiltro
                  )
                }
                className="h-10 w-full rounded-lg border border-[#303030] bg-[#151515] px-3 text-sm text-white outline-none focus:border-[#FDC700]"
              >
                <option value="todos">
                  Todas
                </option>
                <option value="pago">
                  Pagas
                </option>
                <option value="pendente">
                  Pendentes
                </option>
                <option value="atrasado">
                  Atrasadas
                </option>
                <option value="cancelado">
                  Canceladas
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
                  placeholder="Aluno, competência ou data..."
                  className="h-10 w-full rounded-lg border border-[#303030] bg-[#151515] pl-9 pr-3 text-sm text-white outline-none placeholder:text-gray-700 focus:border-[#FDC700]"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {[
            [
              "Mensalidades",
              resumo.registros,
              "text-white",
            ],
            [
              "Previsto",
              formatarMoeda(
                resumo.previsto
              ),
              "text-[#FDC700]",
            ],
            [
              "Recebido",
              formatarMoeda(
                resumo.recebido
              ),
              "text-green-400",
            ],
            [
              "Pendente",
              formatarMoeda(
                resumo.pendente
              ),
              "text-yellow-400",
            ],
            [
              "Atrasado",
              formatarMoeda(
                resumo.atrasado
              ),
              "text-red-400",
            ],
            [
              "Cancelado",
              formatarMoeda(
                resumo.cancelado
              ),
              "text-gray-400",
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
            Relatório Financeiro
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
                Histórico financeiro
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
          ) : mensalidadesFiltradas.length ===
            0 ? (
            <div className="p-12 text-center">
              <FileText
                size={32}
                className="mx-auto text-gray-700"
              />
              <p className="mt-3 text-sm text-gray-400 print:text-gray-700">
                Nenhuma mensalidade encontrada.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto print:overflow-visible">
              <table className="w-full min-w-[1100px] print:min-w-0 print:w-full print:table-fixed">
                <thead className="border-b border-[#303030] bg-[#181818] print:border-gray-300 print:bg-gray-100">
                  <tr>
                    {[
                      "Competência",
                      "Aluno",
                      "Vencimento",
                      "Valor",
                      "Status",
                      "Data do pagamento",
                      "Forma de pagamento",
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
                  {mensalidadesFiltradas.map(
                    (mensalidade) => (
                      <tr
                        key={mensalidade.id}
                        className="hover:bg-[#202020] print:hover:bg-transparent"
                      >
                        <td className="break-words px-3 py-2 text-sm text-gray-300 print:text-black">
                          {formatarCompetencia(
                            mensalidade.competencia
                          )}
                        </td>

                        <td className="break-words px-3 py-2 text-sm font-medium text-white print:text-black">
                          {buscarAluno(
                            mensalidade.alunoId
                          )?.nome ??
                            "Aluno não encontrado"}
                        </td>

                        <td className="break-words px-3 py-2 text-sm text-gray-300 print:text-black">
                          {formatarData(
                            mensalidade.dataVencimento
                          )}
                        </td>

                        <td className="break-words px-3 py-2 text-sm font-semibold text-white print:text-black">
                          {formatarMoeda(
                            mensalidade.valor
                          )}
                        </td>

                        <td className="break-words px-3 py-2">
                          <span
                            className={`inline-flex min-w-[72px] justify-center rounded-full border px-2.5 py-1 text-[10px] font-semibold ${statusInfo[mensalidade.status].className} print:border-gray-400 print:bg-transparent print:text-black`}
                          >
                            {
                              statusInfo[
                                mensalidade.status
                              ].label
                            }
                          </span>
                        </td>

                        <td className="break-words px-3 py-2 text-sm text-gray-300 print:text-black">
                          {mensalidade.dataPagamento
                            ? formatarData(
                                mensalidade.dataPagamento
                              )
                            : "-"}
                        </td>

                        <td className="break-words px-3 py-2 text-sm text-gray-400 print:text-black">
                          {mensalidade.formaPagamento
                            ? formaPagamentoInfo[
                                mensalidade.formaPagamento
                              ] ??
                              mensalidade.formaPagamento
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
      </div>
    </main>
  );
}
