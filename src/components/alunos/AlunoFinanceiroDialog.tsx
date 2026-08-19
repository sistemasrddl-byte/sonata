"use client";

import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  CreditCard,
  RefreshCw,
  X,
} from "lucide-react";

import { useEffect, useMemo, useState } from "react";

import {
  listarMensalidadesDoAluno,
} from "@/services/mensalidade.service";

import { Aluno } from "@/types/aluno";

import {
  FormaPagamento,
  Mensalidade,
  StatusMensalidade,
} from "@/types/mensalidade";

interface AlunoFinanceiroDialogProps {
  aluno: Aluno | null;
  open: boolean;
  onClose: () => void;
}

function formatarMoeda(valor: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(valor);
}

function formatarData(data: string) {
  if (!data) return "-";

  const [ano, mes, dia] = data.split("-");

  return `${dia}/${mes}/${ano}`;
}

function formatarCompetencia(competencia: string) {
  if (!competencia) return "-";

  const [ano, mes] = competencia.split("-");

  return new Intl.DateTimeFormat("pt-BR", {
    month: "long",
    year: "numeric",
  }).format(
    new Date(
      Number(ano),
      Number(mes) - 1,
      1
    )
  );
}

function statusAtual(
  mensalidade: Mensalidade
): StatusMensalidade {
  if (
    mensalidade.status === "pago" ||
    mensalidade.status === "cancelado"
  ) {
    return mensalidade.status;
  }

  const hoje = new Date();
  const hojeString =
    `${hoje.getFullYear()}-${String(
      hoje.getMonth() + 1
    ).padStart(2, "0")}-${String(
      hoje.getDate()
    ).padStart(2, "0")}`;

  if (
    mensalidade.dataVencimento &&
    mensalidade.dataVencimento < hojeString
  ) {
    return "atrasado";
  }

  return "pendente";
}

const statusConfig: Record<
  StatusMensalidade,
  {
    label: string;
    className: string;
  }
> = {
  pago: {
    label: "Pago",
    className:
      "border-green-500/30 bg-green-500/10 text-green-400",
  },
  pendente: {
    label: "Pendente",
    className:
      "border-yellow-500/30 bg-yellow-500/10 text-yellow-400",
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

function formaPagamentoLabel(
  forma?: FormaPagamento
) {
  const labels: Record<
    FormaPagamento,
    string
  > = {
    pix: "PIX",
    dinheiro: "Dinheiro",
    cartao: "Cartão",
    transferencia: "Transferência",
    outro: "Outro",
  };

  return forma
    ? labels[forma]
    : "-";
}

export default function AlunoFinanceiroDialog({
  aluno,
  open,
  onClose,
}: AlunoFinanceiroDialogProps) {
  const [mensalidades, setMensalidades] =
    useState<Mensalidade[]>([]);

  const [loading, setLoading] =
    useState(false);

  useEffect(() => {
    if (!open || !aluno) {
      return;
    }

    async function carregar() {
      try {
        setLoading(true);

        const dados =
          await listarMensalidadesDoAluno(
            aluno!.id
          );

        setMensalidades(
          dados.sort((a, b) =>
            b.competencia.localeCompare(
              a.competencia
            )
          )
        );
      } catch (error) {
        console.error(
          "Erro ao carregar histórico financeiro:",
          error
        );
      } finally {
        setLoading(false);
      }
    }

    carregar();
  }, [open, aluno]);

  const proximaMensalidade =
    useMemo(() => {
      const abertas =
        mensalidades.filter(
          (item) =>
            statusAtual(item) ===
              "pendente" ||
            statusAtual(item) ===
              "atrasado"
        );

      return (
        [...abertas].sort(
          (a, b) =>
            a.dataVencimento.localeCompare(
              b.dataVencimento
            )
        )[0] ?? null
      );
    }, [mensalidades]);

  const totalPago = useMemo(
    () =>
      mensalidades
        .filter(
          (item) =>
            item.status === "pago"
        )
        .reduce(
          (total, item) =>
            total + item.valor,
          0
        ),
    [mensalidades]
  );

  if (!open || !aluno) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-[#303030] bg-[#1c1c1c] shadow-2xl">

        <div className="flex items-center justify-between border-b border-[#303030] px-5 py-4">
          <div>
            <h2 className="text-lg font-semibold text-white">
              Financeiro do aluno
            </h2>

            <p className="mt-1 text-sm text-gray-400">
              {aluno.nome}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-400 hover:bg-[#292929] hover:text-white"
            aria-label="Fechar"
          >
            <X size={19} />
          </button>
        </div>

        <div className="overflow-y-auto p-5">

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">

            <div className="rounded-xl border border-[#303030] bg-[#151515] p-4">
              <p className="text-xs text-gray-500">
                Próxima cobrança
              </p>

              <p className="mt-1 text-lg font-bold text-white">
                {proximaMensalidade
                  ? formatarMoeda(
                      proximaMensalidade.valor
                    )
                  : "—"}
              </p>

              <p className="mt-1 text-xs text-gray-600">
                {proximaMensalidade
                  ? `Vence ${formatarData(
                      proximaMensalidade.dataVencimento
                    )}`
                  : "Nenhuma pendência"}
              </p>
            </div>

            <div className="rounded-xl border border-[#303030] bg-[#151515] p-4">
              <p className="text-xs text-gray-500">
                Situação
              </p>

              {proximaMensalidade ? (
                <span
                  className={`mt-2 inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${
                    statusConfig[
                      statusAtual(
                        proximaMensalidade
                      )
                    ].className
                  }`}
                >
                  {
                    statusConfig[
                      statusAtual(
                        proximaMensalidade
                      )
                    ].label
                  }
                </span>
              ) : (
                <p className="mt-2 text-sm text-gray-400">
                  Em dia
                </p>
              )}
            </div>

            <div className="rounded-xl border border-[#303030] bg-[#151515] p-4">
              <p className="text-xs text-gray-500">
                Total recebido
              </p>

              <p className="mt-1 text-lg font-bold text-green-400">
                {formatarMoeda(
                  totalPago
                )}
              </p>
            </div>

          </div>

          <div className="mt-5">

            <div className="mb-3 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-white">
                  Histórico de mensalidades
                </h3>

                <p className="mt-1 text-xs text-gray-600">
                  Os valores registrados no passado não são recalculados.
                </p>
              </div>
            </div>

            {loading ? (
              <div className="rounded-xl border border-[#303030] bg-[#151515] p-10 text-center">
                <RefreshCw
                  size={22}
                  className="mx-auto animate-spin text-[#FDC700]"
                />

                <p className="mt-3 text-sm text-gray-500">
                  Carregando histórico...
                </p>
              </div>
            ) : mensalidades.length === 0 ? (
              <div className="rounded-xl border border-[#303030] bg-[#151515] p-10 text-center">
                <CreditCard
                  size={28}
                  className="mx-auto text-gray-700"
                />

                <p className="mt-3 text-sm text-gray-500">
                  Nenhuma mensalidade registrada para este aluno.
                </p>
              </div>
            ) : (
              <div className="overflow-hidden rounded-xl border border-[#303030]">

                <div className="hidden overflow-x-auto md:block">
                  <table className="w-full">
                    <thead className="border-b border-[#303030] bg-[#181818]">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">
                          Competência
                        </th>

                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">
                          Vencimento
                        </th>

                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">
                          Valor
                        </th>

                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">
                          Status
                        </th>

                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">
                          Pagamento
                        </th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-[#292929]">
                      {mensalidades.map(
                        (mensalidade) => {
                          const status =
                            statusAtual(
                              mensalidade
                            );

                          return (
                            <tr
                              key={
                                mensalidade.id
                              }
                              className="hover:bg-[#202020]"
                            >
                              <td className="px-4 py-4 text-sm capitalize text-gray-300">
                                {formatarCompetencia(
                                  mensalidade.competencia
                                )}
                              </td>

                              <td className="px-4 py-4 text-sm text-gray-400">
                                {formatarData(
                                  mensalidade.dataVencimento
                                )}
                              </td>

                              <td className="px-4 py-4 text-sm font-medium text-white">
                                {formatarMoeda(
                                  mensalidade.valor
                                )}
                              </td>

                              <td className="px-4 py-4">
                                <span
                                  className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-medium ${statusConfig[status].className}`}
                                >
                                  {
                                    statusConfig[
                                      status
                                    ].label
                                  }
                                </span>
                              </td>

                              <td className="px-4 py-4 text-xs text-gray-500">
                                {mensalidade.dataPagamento ? (
                                  <div>
                                    <p>
                                      {formatarData(
                                        mensalidade.dataPagamento
                                      )}
                                    </p>

                                    <p className="mt-1 text-gray-600">
                                      {formaPagamentoLabel(
                                        mensalidade.formaPagamento
                                      )}
                                    </p>
                                  </div>
                                ) : (
                                  "-"
                                )}
                              </td>
                            </tr>
                          );
                        }
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="divide-y divide-[#292929] md:hidden">
                  {mensalidades.map(
                    (mensalidade) => {
                      const status =
                        statusAtual(
                          mensalidade
                        );

                      return (
                        <div
                          key={
                            mensalidade.id
                          }
                          className="p-4"
                        >
                          <div className="flex items-start justify-between gap-3">

                            <div>
                              <p className="text-sm font-medium capitalize text-white">
                                {formatarCompetencia(
                                  mensalidade.competencia
                                )}
                              </p>

                              <p className="mt-1 text-xs text-gray-500">
                                Vencimento:{" "}
                                {formatarData(
                                  mensalidade.dataVencimento
                                )}
                              </p>
                            </div>

                            <p className="text-sm font-bold text-white">
                              {formatarMoeda(
                                mensalidade.valor
                              )}
                            </p>
                          </div>

                          <div className="mt-3 flex flex-wrap items-center gap-2">
                            <span
                              className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-medium ${statusConfig[status].className}`}
                            >
                              {
                                statusConfig[
                                  status
                                ].label
                              }
                            </span>

                            {mensalidade.dataPagamento && (
                              <span className="text-[11px] text-gray-500">
                                Pago em{" "}
                                {formatarData(
                                  mensalidade.dataPagamento
                                )}{" "}
                                •{" "}
                                {formaPagamentoLabel(
                                  mensalidade.formaPagamento
                                )}
                              </span>
                            )}
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

      </div>
    </div>
  );
}
