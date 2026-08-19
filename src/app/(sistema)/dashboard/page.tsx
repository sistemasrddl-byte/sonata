"use client";

import {
  CalendarDays,
  Clock,
  DollarSign,
  GraduationCap,
  Music2,
  RefreshCw,
  UserCheck,
  UserX,
  Users,
} from "lucide-react";
import {
  useEffect,
  useMemo,
  useState,
} from "react";

import { listarAlunos } from "@/services/aluno.service";
import { listarAulas } from "@/services/aula.service";
import { listarProfessores } from "@/services/professor.service";
import { listarReposicoes } from "@/services/reposicao.service";
import { listarFrequencias } from "@/services/frequencia.service";
import { listarMensalidadesDoAluno } from "@/services/mensalidade.service";

import { Aluno } from "@/types/aluno";
import { Aula, DiaSemana } from "@/types/aula";
import { Professor } from "@/types/professor";
import { Reposicao } from "@/types/reposicao";
import { Frequencia } from "@/types/frequencia";
import { Mensalidade } from "@/types/mensalidade";

interface ProximaAula {
  chave: string;
  data: string;
  horario: string;
  alunoNome: string;
  professorNome: string;
  instrumento: string;
  tipo: "aula" | "reposicao";
}

function inicioDaSemana(data: Date) {
  const resultado = new Date(data);
  resultado.setHours(0, 0, 0, 0);

  const dia = resultado.getDay();
  const diferenca = dia === 0 ? -6 : 1 - dia;

  resultado.setDate(
    resultado.getDate() + diferenca
  );

  return resultado;
}

function adicionarDias(
  data: Date,
  quantidade: number
) {
  const resultado = new Date(data);
  resultado.setDate(
    resultado.getDate() + quantidade
  );
  return resultado;
}

function dataParaString(data: Date) {
  const ano = data.getFullYear();
  const mes = String(
    data.getMonth() + 1
  ).padStart(2, "0");
  const dia = String(
    data.getDate()
  ).padStart(2, "0");

  return `${ano}-${mes}-${dia}`;
}

function formatarData(data: string) {
  if (!data) return "-";

  const [ano, mes, dia] =
    data.split("-");

  return `${dia}/${mes}/${ano}`;
}

function formatarDataCurta(data: string) {
  if (!data) return "-";

  const [ano, mes, dia] =
    data.split("-");

  return `${dia}/${mes}`;
}

function formatarMes(
  mes: string
) {
  const [ano, numeroMes] =
    mes.split("-");

  if (!ano || !numeroMes) {
    return mes;
  }

  return new Intl.DateTimeFormat(
    "pt-BR",
    {
      month: "long",
      year: "numeric",
    }
  ).format(
    new Date(
      Number(ano),
      Number(numeroMes) - 1,
      1
    )
  );
}

function inicioDoMes(
  mes: string
) {
  const [ano, numeroMes] =
    mes.split("-");

  return new Date(
    Number(ano),
    Number(numeroMes) - 1,
    1,
    0,
    0,
    0,
    0
  );
}

function fimDoMes(
  mes: string
) {
  const [ano, numeroMes] =
    mes.split("-");

  return new Date(
    Number(ano),
    Number(numeroMes),
    0,
    23,
    59,
    59,
    999
  );
}

function dataEstaNoMes(
  data: string,
  mes: string
) {
  return data.startsWith(`${mes}-`);
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

function diaSemanaDaData(
  data: Date
): DiaSemana {
  const nomes: DiaSemana[] = [
    "domingo",
    "segunda",
    "terça",
    "quarta",
    "quinta",
    "sexta",
    "sábado",
  ];

  return nomes[data.getDay()];
}

function statusMensalidade(
  mensalidade: Mensalidade
) {
  if (
    mensalidade.status === "pago" ||
    mensalidade.status === "cancelado"
  ) {
    return mensalidade.status;
  }

  const hoje = dataParaString(
    new Date()
  );

  if (
    mensalidade.dataVencimento &&
    mensalidade.dataVencimento < hoje
  ) {
    return "atrasado";
  }

  return "pendente";
}

function ocorrenciasDoMes(
  aula: Aula,
  mes: string
) {
  if (
    !aula.ativo ||
    aula.diaSemana === "domingo"
  ) {
    return [] as string[];
  }

  const inicio = inicioDoMes(mes);
  const fim = fimDoMes(mes);
  const ordem: Record<
    DiaSemana,
    number
  > = {
    domingo: 0,
    segunda: 1,
    terça: 2,
    quarta: 3,
    quinta: 4,
    sexta: 5,
    sábado: 6,
  };

  const ocorrencias: string[] = [];
  const cursor = new Date(inicio);

  while (cursor <= fim) {
    if (
      ordem[aula.diaSemana] ===
      cursor.getDay()
    ) {
      ocorrencias.push(
        dataParaString(cursor)
      );
    }

    cursor.setDate(
      cursor.getDate() + 1
    );
  }

  return ocorrencias;
}

function obterAulasDoMes(
  aulas: Aula[],
  reposicoes: Reposicao[],
  alunos: Aluno[],
  professores: Professor[],
  mes: string,
  agora: Date
): ProximaAula[] {
  const resultado: ProximaAula[] = [];

  for (const aula of aulas) {
    const ocorrencias =
      ocorrenciasDoMes(
        aula,
        mes
      );

    for (const data of ocorrencias) {
      const horarioData = new Date(
        `${data}T${aula.horario}:00`
      );

      if (
        mes ===
          dataParaString(agora).slice(0, 7) &&
        horarioData < agora
      ) {
        continue;
      }

      resultado.push({
        chave: `aula-${aula.id}-${data}`,
        data,
        horario: aula.horario,
        alunoNome:
          alunos.find(
            (item) =>
              item.id === aula.alunoId
          )?.nome ?? "Aluno",
        professorNome:
          professores.find(
            (item) =>
              item.id === aula.professorId
          )?.nome ?? "Professor",
        instrumento:
          aula.instrumento,
        tipo: "aula",
      });
    }
  }

  for (const reposicao of reposicoes) {
    if (
      !reposicao.ativo ||
      !dataEstaNoMes(
        reposicao.data,
        mes
      )
    ) {
      continue;
    }

    const data = new Date(
      `${reposicao.data}T${reposicao.horario}:00`
    );

    if (
      mes ===
        dataParaString(agora).slice(0, 7) &&
      data < agora
    ) {
      continue;
    }

    resultado.push({
      chave: `reposicao-${reposicao.id}`,
      data: reposicao.data,
      horario: reposicao.horario,
      alunoNome:
        alunos.find(
          (item) =>
            item.id ===
            reposicao.alunoId
        )?.nome ?? "Aluno",
      professorNome:
        professores.find(
          (item) =>
            item.id ===
            reposicao.professorId
        )?.nome ?? "Professor",
      instrumento:
        reposicao.instrumento,
      tipo: "reposicao",
    });
  }

  return resultado
    .sort((a, b) =>
      `${a.data}T${a.horario}`.localeCompare(
        `${b.data}T${b.horario}`
      )
    )
    .slice(0, 5);
}


function obterAulasDaSemana(
  aulas: Aula[],
  reposicoes: Reposicao[],
  alunos: Aluno[],
  professores: Professor[],
  agora: Date
): ProximaAula[] {
  const inicio = inicioDaSemana(agora);
  const fim = adicionarDias(inicio, 6);
  const resultado: ProximaAula[] = [];

  const ordem: Record<DiaSemana, number> = {
    domingo: 0,
    segunda: 1,
    terça: 2,
    quarta: 3,
    quinta: 4,
    sexta: 5,
    sábado: 6,
  };

  for (const aula of aulas) {
    if (
      !aula.ativo ||
      aula.diaSemana === "domingo"
    ) continue;

    const dia = adicionarDias(
      inicio,
      ordem[aula.diaSemana]
    );

    const data = dataParaString(dia);
    const horarioData = new Date(
      `${data}T${aula.horario}:00`
    );

    if (horarioData < agora) continue;

    resultado.push({
      chave: `aula-${aula.id}-${data}`,
      data,
      horario: aula.horario,
      alunoNome:
        alunos.find(
          (item) => item.id === aula.alunoId
        )?.nome ?? "Aluno",
      professorNome:
        professores.find(
          (item) => item.id === aula.professorId
        )?.nome ?? "Professor",
      instrumento: aula.instrumento,
      tipo: "aula",
    });
  }

  for (const reposicao of reposicoes) {
    if (!reposicao.ativo) continue;

    const data = new Date(
      `${reposicao.data}T${reposicao.horario}:00`
    );

    if (
      data < agora ||
      data < inicio ||
      data > fim
    ) continue;

    resultado.push({
      chave: `reposicao-${reposicao.id}`,
      data: reposicao.data,
      horario: reposicao.horario,
      alunoNome:
        alunos.find(
          (item) => item.id === reposicao.alunoId
        )?.nome ?? "Aluno",
      professorNome:
        professores.find(
          (item) => item.id === reposicao.professorId
        )?.nome ?? "Professor",
      instrumento: reposicao.instrumento,
      tipo: "reposicao",
    });
  }

  return resultado
    .sort((a, b) =>
      `${a.data}T${a.horario}`.localeCompare(
        `${b.data}T${b.horario}`
      )
    )
    .slice(0, 5);
}

export default function DashboardPage() {
  const [alunos, setAlunos] =
    useState<Aluno[]>([]);

  const [professores, setProfessores] =
    useState<Professor[]>([]);

  const [aulas, setAulas] =
    useState<Aula[]>([]);

  const [reposicoes, setReposicoes] =
    useState<Reposicao[]>([]);

  const [frequencias, setFrequencias] =
    useState<Frequencia[]>([]);

  const [mensalidades, setMensalidades] =
    useState<Mensalidade[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [erro, setErro] =
    useState("");

  const [mesSelecionado, setMesSelecionado] =
    useState(() => {
      const hoje = new Date();

      return `${hoje.getFullYear()}-${String(
        hoje.getMonth() + 1
      ).padStart(2, "0")}`;
    });

  const [modoPeriodo, setModoPeriodo] =
    useState<"semana" | "mes">("semana");

  async function carregarDados() {
    try {
      setLoading(true);
      setErro("");

      const [
        alunosData,
        professoresData,
        aulasData,
        reposicoesData,
        frequenciasData,
      ] = await Promise.all([
        listarAlunos(),
        listarProfessores(),
        listarAulas(),
        listarReposicoes(),
        listarFrequencias(),
      ]);

      setAlunos(alunosData);
      setProfessores(professoresData);
      setAulas(aulasData);
      setReposicoes(
        reposicoesData
      );
      setFrequencias(
        frequenciasData
      );

      // Cada aluno possui seu próprio histórico financeiro.
      // Mantemos uma lista única para o resumo do mês.
      const financeiros =
        await Promise.all(
          alunosData.map((aluno) =>
            listarMensalidadesDoAluno(
              aluno.id
            )
          )
        );

      setMensalidades(
        financeiros.flat()
      );
    } catch (error) {
      console.error(
        "Erro ao carregar dashboard:",
        error
      );

      setErro(
        "Não foi possível carregar todos os dados do dashboard."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    carregarDados();
  }, []);

  const agora = new Date();

  const inicioSemanaSelecionada =
    inicioDaSemana(agora);

  const fimSemanaSelecionada =
    adicionarDias(
      inicioSemanaSelecionada,
      6
    );

  const inicioSemanaString =
    dataParaString(
      inicioSemanaSelecionada
    );

  const fimSemanaString =
    dataParaString(
      fimSemanaSelecionada
    );

  const frequenciasDaSemana =
    useMemo(
      () =>
        frequencias.filter(
          (frequencia) =>
            frequencia.data >=
              inicioSemanaString &&
            frequencia.data <=
              fimSemanaString
        ),
      [
        frequencias,
        inicioSemanaString,
        fimSemanaString,
      ]
    );

  const aulasDaSemana =
    useMemo(() => {
      const recorrentes =
        aulas.filter(
          (aula) =>
            aula.ativo &&
            aula.diaSemana !==
              "domingo"
        ).length;

      const reposicoesDaSemana =
        reposicoes.filter(
          (reposicao) =>
            reposicao.ativo &&
            reposicao.data >=
              inicioSemanaString &&
            reposicao.data <=
              fimSemanaString
        ).length;

      return {
        recorrentes,
        reposicoes:
          reposicoesDaSemana,
        total:
          recorrentes +
          reposicoesDaSemana,
      };
    }, [
      aulas,
      reposicoes,
      inicioSemanaString,
      fimSemanaString,
    ]);

  const inicioMesSelecionado =
    inicioDoMes(mesSelecionado);

  const fimMesSelecionado =
    fimDoMes(mesSelecionado);

  const inicioMesString =
    `${mesSelecionado}-01`;

  const fimMesString =
    dataParaString(
      fimMesSelecionado
    );

  const frequenciasDoMes =
    useMemo(
      () =>
        frequencias.filter(
          (frequencia) =>
            dataEstaNoMes(
              frequencia.data,
              mesSelecionado
            )
        ),
      [
        frequencias,
        mesSelecionado,
      ]
    );

  const frequenciasSelecionadas =
    modoPeriodo === "semana"
      ? frequenciasDaSemana
      : frequenciasDoMes;

  const presentes =
    frequenciasSelecionadas.filter(
      (item) =>
        item.status ===
        "presente"
    ).length;

  const faltas =
    frequenciasSelecionadas.filter(
      (item) =>
        item.status ===
        "falta"
    ).length;

  const justificadas =
    frequenciasSelecionadas.filter(
      (item) =>
        item.status ===
        "justificada"
    ).length;

  const totalFrequencias =
    presentes +
    faltas +
    justificadas;

  const percentualPresenca =
    totalFrequencias > 0
      ? Math.round(
          (presentes /
            totalFrequencias) *
            100
        )
      : 0;

  const aulasDoMes =
    useMemo(() => {
      const recorrentes =
        aulas.reduce(
          (total, aula) =>
            total +
            ocorrenciasDoMes(
              aula,
              mesSelecionado
            ).length,
          0
        );

      const reposicoesDoMes =
        reposicoes.filter(
          (reposicao) =>
            reposicao.ativo &&
            dataEstaNoMes(
              reposicao.data,
              mesSelecionado
            )
        ).length;

      return {
        recorrentes,
        reposicoes:
          reposicoesDoMes,
        total:
          recorrentes +
          reposicoesDoMes,
      };
    }, [
      aulas,
      reposicoes,
      mesSelecionado,
    ]);

  const proximasAulas =
    useMemo(
      () =>
        obterAulasDoMes(
          aulas,
          reposicoes,
          alunos,
          professores,
          mesSelecionado,
          agora
        ),
      [
        aulas,
        reposicoes,
        alunos,
        professores,
        mesSelecionado,
        agora.toDateString(),
        agora.getHours(),
        agora.getMinutes(),
      ]
    );

  const financeiroMes =
    useMemo(() => {
      const doMes =
        mensalidades.filter(
          (item) =>
            item.competencia ===
            mesSelecionado
        );

      const recebido =
        mensalidades
          .filter(
            (item) =>
              item.status ===
                "pago" &&
              Boolean(
                item.dataPagamento
              ) &&
              item.dataPagamento!.startsWith(
                mesSelecionado
              )
          )
          .reduce(
            (total, item) =>
              total + item.valor,
            0
          );

      const pendente =
        doMes
          .filter(
            (item) =>
              statusMensalidade(
                item
              ) === "pendente"
          )
          .reduce(
            (total, item) =>
              total + item.valor,
            0
          );

      const atrasado =
        doMes
          .filter(
            (item) =>
              statusMensalidade(
                item
              ) === "atrasado"
          )
          .reduce(
            (total, item) =>
              total + item.valor,
            0
          );

      const previsto =
        doMes.reduce(
          (total, item) =>
            total + item.valor,
          0
        );

      return {
        recebido,
        pendente,
        atrasado,
        previsto,
      };
    }, [
      mensalidades,
      mesSelecionado,
    ]);

  const financeiroSemana =
    useMemo(() => {
      const recebido =
        mensalidades
          .filter(
            (item) =>
              item.status === "pago" &&
              Boolean(item.dataPagamento) &&
              item.dataPagamento! >=
                inicioSemanaString &&
              item.dataPagamento! <=
                fimSemanaString
          )
          .reduce(
            (total, item) =>
              total + item.valor,
            0
          );

      const previsto =
        mensalidades
          .filter(
            (item) =>
              item.dataVencimento >=
                inicioSemanaString &&
              item.dataVencimento <=
                fimSemanaString
          )
          .reduce(
            (total, item) =>
              total + item.valor,
            0
          );

      const pendente =
        mensalidades
          .filter(
            (item) =>
              item.dataVencimento >=
                inicioSemanaString &&
              item.dataVencimento <=
                fimSemanaString &&
              statusMensalidade(item) ===
                "pendente"
          )
          .reduce(
            (total, item) =>
              total + item.valor,
            0
          );

      const atrasado =
        mensalidades
          .filter(
            (item) =>
              item.dataVencimento >=
                inicioSemanaString &&
              item.dataVencimento <=
                fimSemanaString &&
              statusMensalidade(item) ===
                "atrasado"
          )
          .reduce(
            (total, item) =>
              total + item.valor,
            0
          );

      return {
        recebido,
        previsto,
        pendente,
        atrasado,
      };
    }, [
      mensalidades,
      inicioSemanaString,
      fimSemanaString,
    ]);

  const financeiroSelecionado =
    modoPeriodo === "semana"
      ? financeiroSemana
      : financeiroMes;

  const proximasAulasSelecionadas =
    modoPeriodo === "semana"
      ? obterAulasDaSemana(
          aulas,
          reposicoes,
          alunos,
          professores,
          agora
        )
      : obterAulasDoMes(
          aulas,
          reposicoes,
          alunos,
          professores,
          mesSelecionado,
          agora
        );

  const alunosPorInstrumento =
    useMemo(() => {
      const contador: Record<
        string,
        number
      > = {};

      for (const aluno of alunos) {
        for (const instrumento of aluno.instrumentos ?? []) {
          contador[instrumento] =
            (contador[instrumento] ?? 0) +
            1;
        }
      }

      return Object.entries(
        contador
      ).sort(
        (a, b) => b[1] - a[1]
      );
    }, [alunos]);

  const faltasPorAluno =
    useMemo(() => {
      const contador: Record<
        string,
        number
      > = {};

      for (const frequencia of frequenciasSelecionadas) {
        if (
          frequencia.status !==
          "falta"
        ) {
          continue;
        }

        contador[
          frequencia.alunoId
        ] =
          (contador[
            frequencia.alunoId
          ] ?? 0) + 1;
      }

      return Object.entries(
        contador
      )
        .map(
          ([alunoId, total]) => ({
            aluno:
              alunos.find(
                (item) =>
                  item.id === alunoId
              )?.nome ??
              "Aluno",
            total,
          })
        )
        .sort(
          (a, b) =>
            b.total - a.total
        )
        .slice(0, 5);
    }, [
      frequenciasSelecionadas,
      alunos,
    ]);

  const recebimentoPercentual =
    financeiroSelecionado.previsto > 0
      ? Math.round(
          (financeiroSelecionado.recebido /
            financeiroSelecionado.previsto) *
            100
        )
      : 0;

  const aulasHoje =
    proximasAulasSelecionadas.filter(
      (aula) =>
        aula.data ===
        dataParaString(agora)
    );

  const periodo =
    modoPeriodo === "semana"
      ? `${formatarData(
          inicioSemanaString
        )} – ${formatarData(
          fimSemanaString
        )}`
      : formatarMes(
          mesSelecionado
        );

  const cards = [
    {
      title: "Alunos cadastrados",
      value: String(
        alunos.length
      ),
      icon: Users,
    },
    {
      title: "Professores",
      value: String(
        professores.filter(
          (item) =>
            item.status ===
            "Ativo"
        ).length
      ),
      icon: GraduationCap,
    },
    {
      title:
        modoPeriodo === "semana"
          ? "Aulas esta semana"
          : "Aulas no mês",
      value: String(
        modoPeriodo === "semana"
          ? aulasDaSemana.total
          : aulasDoMes.total
      ),
      icon: CalendarDays,
    },
    {
      title:
        modoPeriodo === "semana"
          ? "Presenças na semana"
          : "Presenças no mês",
      value: String(
        presentes
      ),
      icon: UserCheck,
    },
    {
      title:
        modoPeriodo === "semana"
          ? "Faltas na semana"
          : "Faltas no mês",
      value: String(
        faltas
      ),
      icon: UserX,
    },
    {
      title:
        modoPeriodo === "semana"
          ? "Recebido na semana"
          : "Recebido no mês",
      value: formatarMoeda(
        financeiroSelecionado.recebido
      ),
      icon: DollarSign,
    },
  ];

  return (
    <main className="min-h-dvh bg-[#121212] text-white">
      <header className="border-b border-[#2c2c2c] bg-[#171717]">
        <div className="mx-auto flex min-h-20 max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <div>
            <h1 className="text-xl font-bold text-[#FDC700] sm:text-2xl">
              Dashboard
            </h1>

            <p className="mt-1 text-sm text-gray-400">
              Visão geral da Escola de Música
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() =>
                setModoPeriodo(
                  (atual) =>
                    atual === "semana"
                      ? "mes"
                      : "semana"
                )
              }
              className="flex items-center gap-2 rounded-lg border border-[#333] bg-[#1c1c1c] px-3 py-2 text-sm text-gray-300 transition hover:border-[#FDC700]/50 hover:text-white"
              title="Alternar entre semana e mês"
            >
              <CalendarDays
                size={17}
                className="text-[#FDC700]"
              />
              {modoPeriodo === "semana"
                ? "Esta semana"
                : "Este mês"}
            </button>

            {modoPeriodo === "mes" && (
              <input
                type="month"
                value={mesSelecionado}
                onChange={(event) =>
                  setMesSelecionado(
                    event.target.value
                  )
                }
                className="w-[132px] rounded-lg border border-[#333] bg-[#1c1c1c] px-2 py-2 text-sm text-white outline-none [color-scheme:dark]"
                aria-label="Selecionar mês do dashboard"
              />
            )}
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
        {erro && (
          <div className="mb-5 flex items-center gap-3 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            <span className="flex-1">
              {erro}
            </span>

            <button
              type="button"
              onClick={carregarDados}
              className="text-xs font-medium text-red-300 hover:underline"
            >
              Tentar novamente
            </button>
          </div>
        )}

        {loading ? (
          <div className="flex min-h-[60vh] items-center justify-center">
            <div className="text-center">
              <RefreshCw
                size={28}
                className="mx-auto animate-spin text-[#FDC700]"
              />

              <p className="mt-3 text-sm text-gray-500">
                Carregando dashboard...
              </p>
            </div>
          </div>
        ) : (
          <>
            <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
              {cards.map(
                (card) => {
                  const Icon =
                    card.icon;

                  return (
                    <div
                      key={
                        card.title
                      }
                      className="rounded-xl border border-[#303030] bg-[#1c1c1c] p-4 transition hover:border-[#FDC700]/40"
                    >
                      <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-[#FDC700]/10">
                        <Icon
                          size={19}
                          className="text-[#FDC700]"
                        />
                      </div>

                      <p className="text-xs text-gray-400">
                        {
                          card.title
                        }
                      </p>

                      <p className="mt-1 text-xl font-bold text-white">
                        {
                          card.value
                        }
                      </p>
                    </div>
                  );
                }
              )}
            </section>

            <section className="mt-5 grid gap-5 lg:grid-cols-2">
              <div className="rounded-xl border border-[#303030] bg-[#1c1c1c] p-5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h2 className="font-semibold">
                      Presenças x Faltas
                    </h2>

                    <p className="mt-1 text-xs text-gray-500">
                      {periodo}
                    </p>
                  </div>

                  <UserCheck
                    size={20}
                    className="text-[#FDC700]"
                  />
                </div>

                <div className="mt-7 grid grid-cols-[1fr_auto] items-center gap-6">
                  <div className="space-y-5">
                    <div>
                      <div className="mb-2 flex items-center justify-between text-xs">
                        <span className="text-gray-400">
                          Presenças
                        </span>

                        <span className="font-semibold text-green-400">
                          {presentes}
                        </span>
                      </div>

                      <div className="h-2 overflow-hidden rounded-full bg-[#292929]">
                        <div
                          className="h-full rounded-full bg-green-500"
                          style={{
                            width: `${
                              totalFrequencias
                                ? (presentes /
                                    totalFrequencias) *
                                  100
                                : 0
                            }%`,
                          }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="mb-2 flex items-center justify-between text-xs">
                        <span className="text-gray-400">
                          Faltas
                        </span>

                        <span className="font-semibold text-red-400">
                          {faltas}
                        </span>
                      </div>

                      <div className="h-2 overflow-hidden rounded-full bg-[#292929]">
                        <div
                          className="h-full rounded-full bg-red-500"
                          style={{
                            width: `${
                              totalFrequencias
                                ? (faltas /
                                    totalFrequencias) *
                                  100
                                : 0
                            }%`,
                          }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="mb-2 flex items-center justify-between text-xs">
                        <span className="text-gray-400">
                          Justificadas
                        </span>

                        <span className="font-semibold text-orange-400">
                          {justificadas}
                        </span>
                      </div>

                      <div className="h-2 overflow-hidden rounded-full bg-[#292929]">
                        <div
                          className="h-full rounded-full bg-orange-500"
                          style={{
                            width: `${
                              totalFrequencias
                                ? (justificadas /
                                    totalFrequencias) *
                                  100
                                : 0
                            }%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex h-28 w-28 flex-col items-center justify-center rounded-full border-8 border-[#292929]">
                    <span className="text-2xl font-bold text-white">
                      {
                        percentualPresenca
                      }%
                    </span>

                    <span className="text-[10px] text-gray-500">
                      presença
                    </span>
                  </div>
                </div>

                {totalFrequencias ===
                  0 && (
                  <div className="mt-5 rounded-lg border border-[#303030] bg-[#151515] px-3 py-2 text-center text-xs text-gray-600">
                    Nenhuma frequência registrada nesta semana.
                  </div>
                )}
              </div>

              <div className="rounded-xl border border-[#303030] bg-[#1c1c1c] p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="font-semibold">
                      Próximas aulas
                    </h2>

                    <p className="mt-1 text-xs text-gray-500">
                      Próximos horários do mês selecionado
                    </p>
                  </div>

                  <Clock
                    size={20}
                    className="text-[#FDC700]"
                  />
                </div>

                {proximasAulasSelecionadas.length ===
                0 ? (
                  <div className="flex min-h-64 items-center justify-center text-center">
                    <div>
                      <CalendarDays
                        size={38}
                        className="mx-auto text-[#FDC700]/60"
                      />

                      <p className="mt-3 text-sm text-gray-400">
                        Nenhuma aula encontrada
                      </p>

                      <p className="mt-1 text-xs text-gray-600">
                        Não há aulas futuras para o mês selecionado.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="mt-5 divide-y divide-[#292929] overflow-hidden rounded-xl border border-[#303030]">
                    {proximasAulasSelecionadas.map(
                      (aula) => (
                        <div
                          key={
                            aula.chave
                          }
                          className="flex items-center gap-3 bg-[#151515] px-3 py-3"
                        >
                          <div className="flex w-14 shrink-0 flex-col items-center">
                            <span className="text-sm font-bold text-white">
                              {
                                aula.horario
                              }
                            </span>

                            <span className="mt-0.5 text-[10px] text-gray-600">
                              {
                                formatarDataCurta(
                                  aula.data
                                )
                              }
                            </span>
                          </div>

                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium text-white">
                              {
                                aula.alunoNome
                              }
                            </p>

                            <p className="mt-0.5 truncate text-xs text-gray-500">
                              Prof.{" "}
                              {
                                aula.professorNome
                              }{" "}
                              •{" "}
                              {
                                aula.instrumento
                              }
                            </p>
                          </div>

                          <span
                            className={`shrink-0 rounded-full px-2 py-1 text-[10px] ${
                              aula.tipo ===
                              "reposicao"
                                ? "bg-blue-500/10 text-blue-400"
                                : "bg-[#FDC700]/10 text-[#FDC700]"
                            }`}
                          >
                            {aula.tipo ===
                            "reposicao"
                              ? "Reposição"
                              : "Aula"}
                          </span>
                        </div>
                      )
                    )}
                  </div>
                )}
              </div>
            </section>

            <section className="mt-5 rounded-xl border border-[#303030] bg-[#1c1c1c] p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#FDC700]/10">
                  <DollarSign
                    size={20}
                    className="text-[#FDC700]"
                  />
                </div>

                <div>
                  <h2 className="font-semibold">
                    Financeiro
                  </h2>

                  <p className="text-xs text-gray-500">
                    {modoPeriodo === "semana"
                      ? "Resumo financeiro da semana"
                      : "Resumo das mensalidades do mês selecionado"}
                  </p>
                </div>
              </div>

              <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="rounded-lg border border-[#303030] bg-[#151515] p-4">
                  <p className="text-xs text-gray-500">
                    Recebido
                  </p>

                  <p className="mt-1 text-lg font-bold text-green-400">
                    {
                      formatarMoeda(
                        financeiroMes.recebido
                      )
                    }
                  </p>
                </div>

                <div className="rounded-lg border border-[#303030] bg-[#151515] p-4">
                  <p className="text-xs text-gray-500">
                    Pendente
                  </p>

                  <p className="mt-1 text-lg font-bold text-[#FDC700]">
                    {
                      formatarMoeda(
                        financeiroMes.pendente
                      )
                    }
                  </p>
                </div>

                <div className="rounded-lg border border-[#303030] bg-[#151515] p-4">
                  <p className="text-xs text-gray-500">
                    Em atraso
                  </p>

                  <p className="mt-1 text-lg font-bold text-red-400">
                    {
                      formatarMoeda(
                        financeiroMes.atrasado
                      )
                    }
                  </p>
                </div>
              </div>
            </section>

            <section className="mt-5 grid gap-5 lg:grid-cols-3">
              <div className="rounded-xl border border-[#303030] bg-[#1c1c1c] p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="font-semibold">
                      Recebimento do mês
                    </h2>
                    <p className="mt-1 text-xs text-gray-500">
                      Percentual recebido sobre o previsto
                    </p>
                  </div>
                  <DollarSign
                    size={20}
                    className="text-[#FDC700]"
                  />
                </div>

                <div className="mt-5">
                  <div className="flex items-end justify-between gap-3">
                    <span className="text-2xl font-bold text-green-400">
                      {recebimentoPercentual}%
                    </span>
                    <span className="text-xs text-gray-500">
                      {formatarMoeda(
                        financeiroSelecionado.recebido
                      )}{" "}
                      de{" "}
                      {formatarMoeda(
                        financeiroSelecionado.previsto
                      )}
                    </span>
                  </div>

                  <div className="mt-3 h-3 overflow-hidden rounded-full bg-[#292929]">
                    <div
                      className="h-full rounded-full bg-green-500"
                      style={{
                        width: `${Math.min(
                          recebimentoPercentual,
                          100
                        )}%`,
                      }}
                    />
                  </div>

                  {financeiroSelecionado.atrasado > 0 && (
                    <p className="mt-3 text-xs text-red-400">
                      Atenção:{" "}
                      {formatarMoeda(
                        financeiroSelecionado.atrasado
                      )}{" "}
                      em atraso.
                    </p>
                  )}
                </div>
              </div>

              <div className="rounded-xl border border-[#303030] bg-[#1c1c1c] p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="font-semibold">
                      Alunos por instrumento
                    </h2>
                    <p className="mt-1 text-xs text-gray-500">
                      Distribuição dos alunos cadastrados
                    </p>
                  </div>
                  <Music2
                    size={20}
                    className="text-[#FDC700]"
                  />
                </div>

                <div className="mt-4 space-y-3">
                  {alunosPorInstrumento.length === 0 ? (
                    <p className="py-4 text-center text-xs text-gray-600">
                      Nenhum instrumento cadastrado.
                    </p>
                  ) : (
                    alunosPorInstrumento.map(
                      ([instrumento, total]) => (
                        <div
                          key={instrumento}
                          className="flex items-center justify-between rounded-lg bg-[#151515] px-3 py-2"
                        >
                          <span className="text-sm text-gray-300">
                            {instrumento}
                          </span>
                          <span className="font-semibold text-[#FDC700]">
                            {total}
                          </span>
                        </div>
                      )
                    )
                  )}
                </div>
              </div>

              <div className="rounded-xl border border-[#303030] bg-[#1c1c1c] p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="font-semibold">
                      Maiores faltas
                    </h2>
                    <p className="mt-1 text-xs text-gray-500">
                      Alunos com mais faltas no mês
                    </p>
                  </div>
                  <UserX
                    size={20}
                    className="text-red-400"
                  />
                </div>

                <div className="mt-4 space-y-3">
                  {faltasPorAluno.length === 0 ? (
                    <p className="py-4 text-center text-xs text-gray-600">
                      Nenhuma falta registrada.
                    </p>
                  ) : (
                    faltasPorAluno.map(
                      (item) => (
                        <div
                          key={item.aluno}
                          className="flex items-center justify-between rounded-lg bg-[#151515] px-3 py-2"
                        >
                          <span className="truncate pr-3 text-sm text-gray-300">
                            {item.aluno}
                          </span>
                          <span className="shrink-0 font-semibold text-red-400">
                            {item.total}
                          </span>
                        </div>
                      )
                    )
                  )}
                </div>
              </div>
            </section>

            {aulasHoje.length > 0 && (
              <section className="mt-5 rounded-xl border border-[#FDC700]/30 bg-[#FDC700]/5 p-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#FDC700]/10">
                    <Clock
                      size={20}
                      className="text-[#FDC700]"
                    />
                  </div>
                  <div>
                    <h2 className="font-semibold">
                      Aulas de hoje
                    </h2>
                    <p className="text-xs text-gray-500">
                      {formatarData(
                        dataParaString(
                          agora
                        )
                      )}
                    </p>
                  </div>
                </div>

                <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {aulasHoje.map(
                    (aula) => (
                      <div
                        key={aula.chave}
                        className="rounded-lg border border-[#303030] bg-[#151515] px-3 py-3"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-bold text-white">
                            {aula.horario}
                          </span>
                          <span className="text-[10px] text-[#FDC700]">
                            {aula.tipo ===
                            "reposicao"
                              ? "Reposição"
                              : "Aula"}
                          </span>
                        </div>
                        <p className="mt-1 text-sm text-gray-300">
                          {aula.alunoNome}
                        </p>
                        <p className="text-xs text-gray-600">
                          {aula.instrumento}
                        </p>
                      </div>
                    )
                  )}
                </div>
              </section>
            )}

            <div className="mt-4 flex items-center justify-end">
              <button
                type="button"
                onClick={carregarDados}
                className="flex items-center gap-2 rounded-lg border border-[#303030] px-3 py-2 text-xs text-gray-500 transition hover:bg-[#1c1c1c] hover:text-white"
              >
                <RefreshCw
                  size={14}
                />
                Atualizar dashboard
              </button>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
