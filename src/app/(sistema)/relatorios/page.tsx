"use client";

import {
  BarChart3,
  CalendarDays,
  ChevronRight,
  CircleDollarSign,
  GraduationCap,
  Music2,
  ReceiptText,
  Users,
} from "lucide-react";

import { useRouter } from "next/navigation";
import { useState } from "react";

type TipoRelatorio =
  | "frequencia"
  | "alunos"
  | "professores"
  | "aulas"
  | "financeiro"
  | "despesas";

const relatorios = [
  {
    id: "frequencia" as TipoRelatorio,
    titulo: "Frequência",
    descricao:
      "Presenças, faltas e aproveitamento dos alunos.",
    icon: CalendarDays,
    detalhe:
      "Consulte a frequência dos alunos por período, aluno, professor e instrumento.",
  },
  {
    id: "alunos" as TipoRelatorio,
    titulo: "Alunos",
    descricao:
      "Dados e situação dos alunos cadastrados.",
    icon: Users,
    detalhe:
      "Visualize informações dos alunos cadastrados, responsáveis e instrumentos.",
  },
  {
    id: "professores" as TipoRelatorio,
    titulo: "Professores",
    descricao:
      "Professores, aulas e distribuição de alunos.",
    icon: GraduationCap,
    detalhe:
      "Consulte os professores cadastrados e a distribuição das aulas.",
  },
  {
    id: "aulas" as TipoRelatorio,
    titulo: "Aulas",
    descricao:
      "Aulas realizadas por período.",
    icon: Music2,
    detalhe:
      "Consulte as aulas por período, aluno, professor, instrumento e horário.",
  },
  {
    id: "financeiro" as TipoRelatorio,
    titulo: "Financeiro",
    descricao:
      "Mensalidades e recebimentos.",
    icon: CircleDollarSign,
    detalhe:
      "Consulte mensalidades pagas, pendentes e atrasadas.",
  },
  {
    id: "despesas" as TipoRelatorio,
    titulo: "Despesas",
    descricao:
      "Despesas fixas, variáveis e pagamentos.",
    icon: ReceiptText,
    detalhe:
      "Consulte despesas por período, tipo, situação, categoria e pagamento.",
  },
];

export default function RelatoriosPage() {
  const router = useRouter();

  const [selecionado, setSelecionado] =
    useState<TipoRelatorio>(
      "financeiro"
    );

  const relatorioSelecionado =
    relatorios.find(
      (relatorio) =>
        relatorio.id === selecionado
    ) ?? relatorios[0];

  function selecionarRelatorio(
    id: TipoRelatorio
  ) {
    setSelecionado(id);
  }

  function abrirRelatorio() {
    if (selecionado === "frequencia") {
      router.push(
        "/relatorios/frequencia"
      );
      return;
    }

    if (selecionado === "alunos") {
      router.push(
        "/relatorios/alunos"
      );
      return;
    }

    if (
      selecionado === "professores"
    ) {
      router.push(
        "/relatorios/professores"
      );
      return;
    }

    if (selecionado === "aulas") {
      router.push(
        "/relatorios/aulas"
      );
      return;
    }

    if (
      selecionado === "financeiro"
    ) {
      router.push(
        "/relatorios/financeiro"
      );
      return;
    }

    if (selecionado === "despesas") {
      router.push(
        "/relatorios/despesas"
      );
    }
  }

  return (
    <main className="min-h-dvh bg-[#121212] text-white">
      <header className="border-b border-[#2c2c2c] bg-[#171717]">
        <div className="mx-auto max-w-6xl px-4 py-5 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#FDC700]/10 text-[#FDC700]">
              <BarChart3 size={22} />
            </div>

            <div>
              <h1 className="text-xl font-bold text-[#FDC700] sm:text-2xl">
                Relatórios
              </h1>

              <p className="mt-1 text-sm text-gray-400">
                Consulte e acompanhe as informações da escola
              </p>
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="grid gap-5 lg:grid-cols-[300px_1fr]">
          <section className="rounded-2xl border border-[#303030] bg-[#1c1c1c] p-3">
            <p className="px-3 pb-2 pt-1 text-[11px] font-medium uppercase tracking-wide text-gray-600">
              Tipos de relatório
            </p>

            <div className="space-y-1">
              {relatorios.map(
                (relatorio) => {
                  const Icon =
                    relatorio.icon;

                  const ativo =
                    selecionado ===
                    relatorio.id;

                  return (
                    <button
                      key={relatorio.id}
                      type="button"
                      onClick={() =>
                        selecionarRelatorio(
                          relatorio.id
                        )
                      }
                      className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition ${
                        ativo
                          ? "bg-[#FDC700]/10 text-[#FDC700]"
                          : "text-gray-400 hover:bg-[#242424] hover:text-white"
                      }`}
                    >
                      <div
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                          ativo
                            ? "bg-[#FDC700]/10"
                            : "bg-[#151515]"
                        }`}
                      >
                        <Icon size={17} />
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium">
                          {
                            relatorio.titulo
                          }
                        </p>

                        <p className="mt-0.5 truncate text-[11px] text-gray-600">
                          {
                            relatorio.descricao
                          }
                        </p>
                      </div>

                      <ChevronRight
                        size={16}
                        className={
                          ativo
                            ? "text-[#FDC700]"
                            : "text-gray-700"
                        }
                      />
                    </button>
                  );
                }
              )}
            </div>
          </section>

          <section className="rounded-2xl border border-[#303030] bg-[#1c1c1c]">
            <div className="border-b border-[#303030] p-5 sm:p-6">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#FDC700]/10 text-[#FDC700]">
                  {(() => {
                    const Icon =
                      relatorioSelecionado.icon;

                    return (
                      <Icon size={23} />
                    );
                  })()}
                </div>

                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-[#FDC700]">
                    Relatório selecionado
                  </p>

                  <h2 className="mt-1 text-xl font-semibold text-white">
                    {
                      relatorioSelecionado.titulo
                    }
                  </h2>

                  <p className="mt-2 max-w-xl text-sm leading-6 text-gray-400">
                    {
                      relatorioSelecionado.detalhe
                    }
                  </p>
                </div>
              </div>
            </div>

            <div className="p-5 sm:p-6">
              <div className="rounded-xl border border-[#FDC700]/20 bg-[#FDC700]/5 p-5">
                <h3 className="text-sm font-semibold text-white">
                  Relatório{" "}
                  {relatorioSelecionado.titulo.toLowerCase()}
                </h3>

                <p className="mt-1 text-xs leading-5 text-gray-500">
                  {relatorioSelecionado.detalhe}
                </p>

                <button
                  type="button"
                  onClick={
                    abrirRelatorio
                  }
                  className="mt-4 rounded-lg bg-[#FDC700] px-4 py-2 text-xs font-semibold text-black"
                >
                  Abrir relatório
                </button>
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
