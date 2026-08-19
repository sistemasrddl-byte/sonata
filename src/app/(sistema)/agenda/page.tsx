"use client";

import {
  CalendarClock,
  ChevronLeft,
  ChevronRight,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import AulaDialog from "@/components/agenda/AulaDialog";
import ReposicaoDialog from "@/components/agenda/ReposicaoDialog";
import ConfirmDialog from "@/components/ui/ConfirmDialog";

import {
  desativarAula,
  listarAulas,
} from "@/services/aula.service";

import {
  listarAlunos,
} from "@/services/aluno.service";

import {
  listarProfessores,
} from "@/services/professor.service";

import {
  desativarReposicao,
  listarReposicoes,
} from "@/services/reposicao.service";

import {
  Aula,
  DiaSemana,
} from "@/types/aula";

import { Aluno } from "@/types/aluno";
import { Professor } from "@/types/professor";
import { Reposicao } from "@/types/reposicao";

/* =========================================================
   DIAS DA AGENDA
========================================================= */

const dias: DiaSemana[] = [
  "segunda",
  "terça",
  "quarta",
  "quinta",
  "sexta",
  "sábado",
];

const nomesDias: Record<
  DiaSemana,
  string
> = {
  domingo: "Domingo",
  segunda: "Segunda",
  terça: "Terça",
  quarta: "Quarta",
  quinta: "Quinta",
  sexta: "Sexta",
  sábado: "Sábado",
};

/* =========================================================
   FUNÇÕES DE DATA
========================================================= */

function inicioDaSemana(
  data: Date
): Date {
  const resultado = new Date(data);

  resultado.setHours(
    0,
    0,
    0,
    0
  );

  const dia = resultado.getDay();

  const diferenca =
    dia === 0
      ? -6
      : 1 - dia;

  resultado.setDate(
    resultado.getDate() + diferenca
  );

  return resultado;
}

function adicionarDias(
  data: Date,
  quantidade: number
): Date {
  const resultado = new Date(data);

  resultado.setDate(
    resultado.getDate() + quantidade
  );

  return resultado;
}

function formatarData(
  data: Date
): string {
  return new Intl.DateTimeFormat(
    "pt-BR",
    {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }
  ).format(data);
}

function formatarDiaMes(
  data: Date
): string {
  return new Intl.DateTimeFormat(
    "pt-BR",
    {
      day: "2-digit",
      month: "short",
    }
  )
    .format(data)
    .replace(".", "");
}

function formatarPeriodo(
  inicio: Date,
  fim: Date
): string {
  const mesmoAno =
    inicio.getFullYear() ===
    fim.getFullYear();

  const mesmoMes =
    inicio.getMonth() ===
    fim.getMonth();

  if (mesmoAno && mesmoMes) {
    const mes =
      new Intl.DateTimeFormat(
        "pt-BR",
        {
          month: "long",
        }
      ).format(inicio);

    return `${inicio.getDate()} – ${fim.getDate()} de ${mes} de ${inicio.getFullYear()}`;
  }

  if (mesmoAno) {
    const mesInicio =
      new Intl.DateTimeFormat(
        "pt-BR",
        {
          month: "short",
        }
      )
        .format(inicio)
        .replace(".", "");

    const mesFim =
      new Intl.DateTimeFormat(
        "pt-BR",
        {
          month: "long",
        }
      ).format(fim);

    return `${inicio.getDate()} de ${mesInicio} – ${fim.getDate()} de ${mesFim} de ${inicio.getFullYear()}`;
  }

  return `${formatarData(
    inicio
  )} – ${formatarData(fim)}`;
}

function mesmaData(
  primeira: Date,
  segunda: Date
): boolean {
  return (
    primeira.getFullYear() ===
      segunda.getFullYear() &&
    primeira.getMonth() ===
      segunda.getMonth() &&
    primeira.getDate() ===
      segunda.getDate()
  );
}

function dataParaString(
  data: Date
): string {
  const ano =
    data.getFullYear();

  const mes = String(
    data.getMonth() + 1
  ).padStart(2, "0");

  const dia = String(
    data.getDate()
  ).padStart(2, "0");

  return `${ano}-${mes}-${dia}`;
}

/* =========================================================
   PÁGINA
========================================================= */

export default function AgendaPage() {
  const [aulas, setAulas] =
    useState<Aula[]>([]);

  const [alunos, setAlunos] =
    useState<Aluno[]>([]);

  const [professores, setProfessores] =
    useState<Professor[]>([]);

  const [reposicoes, setReposicoes] =
    useState<Reposicao[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [dialogOpen, setDialogOpen] =
    useState(false);

  const [
    reposicaoDialogOpen,
    setReposicaoDialogOpen,
  ] = useState(false);

  const [
    aulaSelecionada,
    setAulaSelecionada,
  ] = useState<Aula | null>(null);

  const [
    reposicaoSelecionada,
    setReposicaoSelecionada,
  ] = useState<Reposicao | null>(null);

  const [
    desativandoId,
    setDesativandoId,
  ] = useState<string | null>(null);

  const [
    aulaParaDesativar,
    setAulaParaDesativar,
  ] = useState<Aula | null>(null);

  const [
    reposicaoParaDesativar,
    setReposicaoParaDesativar,
  ] = useState<Reposicao | null>(null);

  /*
   * 0  = semana atual
   * -1 = semana anterior
   * +1 = próxima semana
   */
  const [
    semanaOffset,
    setSemanaOffset,
  ] = useState(0);

  /* =======================================================
     DATA DA SEMANA
  ======================================================= */

  const semanaAtual = useMemo(() => {
    const hoje = new Date();

    const inicioAtual =
      inicioDaSemana(hoje);

    return adicionarDias(
      inicioAtual,
      semanaOffset * 7
    );
  }, [semanaOffset]);

  const fimDaSemana = useMemo(() => {
    return adicionarDias(
      semanaAtual,
      5
    );
  }, [semanaAtual]);

  const hoje = useMemo(
    () => new Date(),
    []
  );

  /* =======================================================
     CARREGAR DADOS
  ======================================================= */

  async function carregarDados() {
    try {
      setLoading(true);

      const [
        aulasData,
        alunosData,
        professoresData,
        reposicoesData,
      ] = await Promise.all([
        listarAulas(),
        listarAlunos(),
        listarProfessores(),
        listarReposicoes(),
      ]);

      setAulas(aulasData);
      setAlunos(alunosData);
      setProfessores(
        professoresData
      );
      setReposicoes(
        reposicoesData
      );
    } catch (error) {
      console.error(
        "Erro ao carregar agenda:",
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
     BUSCAS
  ======================================================= */

  function buscarAluno(
    id: string
  ) {
    return alunos.find(
      (aluno) =>
        aluno.id === id
    );
  }

  function buscarProfessor(
    id: string
  ) {
    return professores.find(
      (professor) =>
        professor.id === id
    );
  }

  /* =======================================================
     AULAS RECORRENTES
  ======================================================= */

  function aulasDoDia(
    dia: DiaSemana,
    dataDia: Date
  ) {
    const dataDiaString =
      dataParaString(dataDia);

    return aulas
      .filter((aula) => {
        if (
          aula.diaSemana !== dia ||
          !aula.ativo
        ) {
          return false;
        }

        /*
         * Novas aulas possuem dataInicio.
         *
         * Aulas antigas, cadastradas antes desta regra,
         * não possuem dataInicio. Nesse caso usamos criadoEm
         * como compatibilidade para impedir ocorrências
         * anteriores ao cadastro.
         */
        const inicio =
          aula.dataInicio ??
          aula.criadoEm?.slice(0, 10);

        if (!inicio) {
          return true;
        }

        return dataDiaString >= inicio;
      })
      .sort((a, b) =>
        a.horario.localeCompare(
          b.horario
        )
      );
  }

  /* =======================================================
     AÇÕES — AULA
  ======================================================= */

  function abrirNovaAula() {
    setAulaSelecionada(null);
    setDialogOpen(true);
  }

  function abrirEdicao(
    aula: Aula
  ) {
    setAulaSelecionada(aula);
    setDialogOpen(true);
  }

  function fecharDialog() {
    setDialogOpen(false);
    setAulaSelecionada(null);
  }

  function solicitarDesativacao(
    aula: Aula
  ) {
    setAulaParaDesativar(aula);
  }

  async function confirmarDesativacao() {
    if (!aulaParaDesativar) {
      return;
    }

    try {
      setDesativandoId(
        aulaParaDesativar.id
      );

      await desativarAula(
        aulaParaDesativar.id
      );

      setAulaParaDesativar(null);

      await carregarDados();
    } catch (error) {
      console.error(
        "Erro ao desativar aula:",
        error
      );
    } finally {
      setDesativandoId(null);
    }
  }

  /* =======================================================
     AÇÕES — REPOSIÇÃO
  ======================================================= */

  function abrirNovaReposicao() {
    setReposicaoSelecionada(null);
    setReposicaoDialogOpen(true);
  }

  function abrirEdicaoReposicao(
    reposicao: Reposicao
  ) {
    setReposicaoSelecionada(
      reposicao
    );

    setReposicaoDialogOpen(true);
  }

  function fecharReposicaoDialog() {
    setReposicaoDialogOpen(false);
    setReposicaoSelecionada(null);
  }

  function solicitarDesativacaoReposicao(
    reposicao: Reposicao
  ) {
    setReposicaoParaDesativar(
      reposicao
    );
  }

  async function confirmarDesativacaoReposicao() {
    if (!reposicaoParaDesativar) {
      return;
    }

    try {
      setDesativandoId(
        reposicaoParaDesativar.id
      );

      await desativarReposicao(
        reposicaoParaDesativar.id
      );

      setReposicaoParaDesativar(
        null
      );

      await carregarDados();
    } catch (error) {
      console.error(
        "Erro ao cancelar reposição:",
        error
      );
    } finally {
      setDesativandoId(null);
    }
  }

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <main className="min-h-dvh bg-[#121212] text-white">

      {/* =================================================
          CABEÇALHO
      ================================================== */}

      <header className="border-b border-[#2c2c2c] bg-[#171717]">
        <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">

          <div className="flex items-center justify-between gap-3">

            <div>
              <h1 className="text-xl font-bold text-[#FDC700] sm:text-2xl">
                Agenda
              </h1>

              <p className="mt-1 text-sm text-gray-400">
                Aulas da semana
              </p>
            </div>

            <div className="flex items-center gap-2">

              {/* Reposição */}

              <button
                type="button"
                onClick={
                  abrirNovaReposicao
                }
                className="flex h-10 items-center gap-2 rounded-lg border border-[#FDC700]/40 bg-[#FDC700]/10 px-4 text-sm font-medium text-[#FDC700] transition hover:bg-[#FDC700]/20"
              >
                <CalendarClock
                  size={17}
                />

                <span className="hidden sm:inline">
                  Reposição
                </span>

                <span className="sm:hidden">
                  Rep.
                </span>
              </button>

              {/* Nova aula */}

              <button
                type="button"
                onClick={
                  abrirNovaAula
                }
                className="flex h-10 items-center gap-2 rounded-lg bg-[#FDC700] px-4 text-sm font-bold text-black transition hover:bg-[#e6b500]"
              >
                <Plus size={18} />

                <span className="hidden sm:inline">
                  Nova aula
                </span>

                <span className="sm:hidden">
                  Nova
                </span>
              </button>

            </div>
          </div>
        </div>
      </header>

      {/* =================================================
          CONTEÚDO
      ================================================== */}

      <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">

        {/* =================================================
            NAVEGAÇÃO
        ================================================== */}

        <div className="mb-5 rounded-xl border border-[#303030] bg-[#1c1c1c]">

          <div className="flex items-center justify-between p-3">

            <button
              type="button"
              onClick={() =>
                setSemanaOffset(
                  (valor) =>
                    valor - 1
                )
              }
              className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-400 transition hover:bg-[#292929] hover:text-white"
              title="Semana anterior"
            >
              <ChevronLeft
                size={20}
              />
            </button>

            <button
              type="button"
              onClick={() =>
                setSemanaOffset(0)
              }
              className="min-w-0 text-center"
              title="Voltar para a semana atual"
            >
              <p className="text-sm font-semibold text-white">
                {semanaOffset ===
                0
                  ? "Semana atual"
                  : "Semana"}
              </p>

              <p className="mt-0.5 text-xs text-gray-500">
                {formatarPeriodo(
                  semanaAtual,
                  fimDaSemana
                )}
              </p>
            </button>

            <button
              type="button"
              onClick={() =>
                setSemanaOffset(
                  (valor) =>
                    valor + 1
                )
              }
              className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-400 transition hover:bg-[#292929] hover:text-white"
              title="Próxima semana"
            >
              <ChevronRight
                size={20}
              />
            </button>

          </div>

          {semanaOffset !== 0 && (
            <div className="border-t border-[#303030] px-4 py-2 text-center">
              <button
                type="button"
                onClick={() =>
                  setSemanaOffset(0)
                }
                className="text-xs text-[#FDC700] hover:underline"
              >
                Voltar para a semana atual
              </button>
            </div>
          )}

        </div>

        {/* =================================================
            CARREGANDO
        ================================================== */}

        {loading ? (
          <div className="rounded-xl border border-[#303030] bg-[#1c1c1c] p-12 text-center">
            <p className="text-sm text-gray-400">
              Carregando agenda...
            </p>
          </div>
        ) : (
          <>

            {/* =============================================
                DESKTOP
            ============================================== */}

            <div className="hidden overflow-x-auto lg:block">

              <div className="grid min-w-[900px] grid-cols-6 gap-3">

                {dias.map(
                  (
                    dia,
                    index
                  ) => {
                    const dataDia =
                      adicionarDias(
                        semanaAtual,
                        index
                      );

                    const aulasDia =
                      aulasDoDia(
                        dia,
                        dataDia
                      );

                    const dataDiaString =
                      dataParaString(
                        dataDia
                      );

                    const reposicoesDia =
                      reposicoes
                        .filter(
                          (
                            reposicao
                          ) =>
                            reposicao.ativo &&
                            reposicao.data ===
                              dataDiaString
                        )
                        .sort(
                          (
                            a,
                            b
                          ) =>
                            a.horario.localeCompare(
                              b.horario
                            )
                        );

                    const ehHoje =
                      mesmaData(
                        dataDia,
                        hoje
                      );

                    return (
                      <div
                        key={dia}
                        className={`min-h-[500px] rounded-xl border bg-[#1c1c1c] ${
                          ehHoje
                            ? "border-[#FDC700]/60"
                            : "border-[#303030]"
                        }`}
                      >

                        {/* Cabeçalho */}

                        <div
                          className={`border-b px-3 py-3 text-center ${
                            ehHoje
                              ? "border-[#FDC700]/30 bg-[#FDC700]/5"
                              : "border-[#303030]"
                          }`}
                        >

                          <p className="text-sm font-semibold text-[#FDC700]">
                            {
                              nomesDias[
                                dia
                              ]
                            }
                          </p>

                          <p className="mt-1 text-xs text-gray-500">
                            {formatarDiaMes(
                              dataDia
                            )}
                          </p>

                          {ehHoje && (
                            <span className="mt-1 inline-block rounded-full bg-[#FDC700]/10 px-2 py-0.5 text-[9px] font-medium text-[#FDC700]">
                              Hoje
                            </span>
                          )}

                          <p className="mt-1 text-[10px] text-gray-600">
                            {aulasDia.length +
                              reposicoesDia.length}{" "}
                            aula
                            {aulasDia.length +
                              reposicoesDia.length !==
                            1
                              ? "s"
                              : ""}
                          </p>

                        </div>

                        {/* Cards */}

                        <div className="space-y-2 p-2">

                          {/* Aulas recorrentes */}

                          {aulasDia.map(
                            (
                              aula
                            ) => {
                              const aluno =
                                buscarAluno(
                                  aula.alunoId
                                );

                              const professor =
                                buscarProfessor(
                                  aula.professorId
                                );

                              const desativando =
                                desativandoId ===
                                aula.id;

                              return (
                                <div
                                  key={
                                    aula.id
                                  }
                                  className="group rounded-lg border border-[#383838] bg-[#151515] p-3 transition hover:border-[#4a4a4a]"
                                >

                                  <div className="flex items-center justify-between gap-2">

                                    <span className="text-xs font-bold text-[#FDC700]">
                                      {
                                        aula.horario
                                      }
                                    </span>

                                    <span className="rounded-full bg-[#FDC700]/10 px-2 py-0.5 text-[10px] text-[#FDC700]">
                                      {
                                        aula.instrumento
                                      }
                                    </span>

                                  </div>

                                  <p className="mt-2 truncate text-sm font-medium text-white">
                                    {
                                      aluno?.nome ??
                                      "Aluno não encontrado"
                                    }
                                  </p>

                                  <p className="mt-1 truncate text-xs text-gray-500">
                                    Prof.{" "}
                                    {
                                      professor?.nome ??
                                      "Professor não encontrado"
                                    }
                                  </p>

                                  <div className="mt-3 flex justify-end gap-1 border-t border-[#292929] pt-2">

                                    <button
                                      type="button"
                                      onClick={() =>
                                        abrirEdicao(
                                          aula
                                        )
                                      }
                                      disabled={
                                        desativando
                                      }
                                      className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 transition hover:bg-[#FDC700]/10 hover:text-[#FDC700] disabled:opacity-40"
                                      title="Editar aula"
                                    >
                                      <Pencil
                                        size={
                                          15
                                        }
                                      />
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() =>
                                        solicitarDesativacao(
                                          aula
                                        )
                                      }
                                      disabled={
                                        desativando
                                      }
                                      className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 transition hover:bg-red-500/10 hover:text-red-400 disabled:opacity-40"
                                      title="Desativar aula"
                                    >
                                      <Trash2
                                        size={
                                          15
                                        }
                                      />
                                    </button>

                                  </div>

                                </div>
                              );
                            }
                          )}

                          {/* Reposições */}

                          {reposicoesDia.map(
                            (
                              reposicao
                            ) => {
                              const aluno =
                                buscarAluno(
                                  reposicao.alunoId
                                );

                              const professor =
                                buscarProfessor(
                                  reposicao.professorId
                                );

                              const desativando =
                                desativandoId ===
                                reposicao.id;

                              return (
                                <div
                                  key={`reposicao-${reposicao.id}`}
                                  className="rounded-lg border border-blue-500/30 bg-blue-500/5 p-3"
                                >

                                  <div className="flex items-center justify-between gap-2">

                                    <span className="text-xs font-bold text-blue-400">
                                      {
                                        reposicao.horario
                                      }
                                    </span>

                                    <span className="rounded-full bg-blue-500/10 px-2 py-0.5 text-[10px] text-blue-400">
                                      Reposição
                                    </span>

                                  </div>

                                  <p className="mt-2 truncate text-sm font-medium text-white">
                                    {
                                      aluno?.nome ??
                                      "Aluno não encontrado"
                                    }
                                  </p>

                                  <p className="mt-1 truncate text-xs text-gray-500">
                                    Prof.{" "}
                                    {
                                      professor?.nome ??
                                      "Professor não encontrado"
                                    }
                                  </p>

                                  <div className="mt-2 flex items-center justify-between gap-2">

                                    <span className="text-[10px] text-blue-400">
                                      {
                                        reposicao.instrumento
                                      }
                                    </span>

                                    {reposicao.observacao && (
                                      <span className="max-w-[120px] truncate text-[10px] text-gray-600">
                                        {
                                          reposicao.observacao
                                        }
                                      </span>
                                    )}

                                  </div>

                                  {/* Ações da reposição */}

                                  <div className="mt-3 flex justify-end gap-1 border-t border-blue-500/10 pt-2">

                                    <button
                                      type="button"
                                      onClick={() =>
                                        abrirEdicaoReposicao(
                                          reposicao
                                        )
                                      }
                                      disabled={
                                        desativando
                                      }
                                      className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 transition hover:bg-blue-500/10 hover:text-blue-400 disabled:opacity-40"
                                      title="Editar reposição"
                                    >
                                      <Pencil
                                        size={
                                          15
                                        }
                                      />
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() =>
                                        solicitarDesativacaoReposicao(
                                          reposicao
                                        )
                                      }
                                      disabled={
                                        desativando
                                      }
                                      className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 transition hover:bg-red-500/10 hover:text-red-400 disabled:opacity-40"
                                      title="Cancelar reposição"
                                    >
                                      <Trash2
                                        size={
                                          15
                                        }
                                      />
                                    </button>

                                  </div>

                                </div>
                              );
                            }
                          )}

                          {/* Nenhuma aula */}

                          {aulasDia.length ===
                            0 &&
                            reposicoesDia.length ===
                              0 && (
                              <p className="px-2 py-6 text-center text-xs text-gray-600">
                                Nenhuma aula
                              </p>
                            )}

                        </div>

                      </div>
                    );
                  }
                )}

              </div>
            </div>

            {/* =============================================
                MOBILE
            ============================================== */}

            <div className="space-y-3 lg:hidden">

              {dias.map(
                (
                  dia,
                  index
                ) => {
                  const dataDia =
                    adicionarDias(
                      semanaAtual,
                      index
                    );

                  const aulasDia =
                    aulasDoDia(
                      dia,
                      dataDia
                    );

                  const dataDiaString =
                    dataParaString(
                      dataDia
                    );

                  const reposicoesDia =
                    reposicoes
                      .filter(
                        (
                          reposicao
                        ) =>
                          reposicao.ativo &&
                          reposicao.data ===
                            dataDiaString
                      )
                      .sort(
                        (
                          a,
                          b
                        ) =>
                          a.horario.localeCompare(
                            b.horario
                          )
                      );

                  const ehHoje =
                    mesmaData(
                      dataDia,
                      hoje
                    );

                  return (
                    <div
                      key={dia}
                      className={`rounded-xl border bg-[#1c1c1c] ${
                        ehHoje
                          ? "border-[#FDC700]/60"
                          : "border-[#303030]"
                      }`}
                    >

                      {/* Cabeçalho */}

                      <div
                        className={`flex items-center justify-between border-b px-4 py-3 ${
                          ehHoje
                            ? "border-[#FDC700]/30 bg-[#FDC700]/5"
                            : "border-[#303030]"
                        }`}
                      >

                        <div>
                          <p className="text-sm font-semibold text-[#FDC700]">
                            {
                              nomesDias[
                                dia
                              ]
                            }
                          </p>

                          <p className="mt-0.5 text-xs text-gray-500">
                            {formatarDiaMes(
                              dataDia
                            )}
                          </p>
                        </div>

                        <div className="text-right">

                          {ehHoje && (
                            <span className="mb-1 inline-block rounded-full bg-[#FDC700]/10 px-2 py-0.5 text-[9px] text-[#FDC700]">
                              Hoje
                            </span>
                          )}

                          <p className="text-xs text-gray-600">
                            {aulasDia.length +
                              reposicoesDia.length}{" "}
                            aula
                            {aulasDia.length +
                              reposicoesDia.length !==
                            1
                              ? "s"
                              : ""}
                          </p>

                        </div>

                      </div>

                      {/* Cards */}

                      <div className="p-2">

                        {aulasDia.length ===
                          0 &&
                        reposicoesDia.length ===
                          0 ? (
                          <p className="px-2 py-4 text-center text-xs text-gray-600">
                            Nenhuma aula
                          </p>
                        ) : (
                          <div className="space-y-2">

                            {/* Aulas */}

                            {aulasDia.map(
                              (
                                aula
                              ) => {
                                const aluno =
                                  buscarAluno(
                                    aula.alunoId
                                  );

                                const professor =
                                  buscarProfessor(
                                    aula.professorId
                                  );

                                const desativando =
                                  desativandoId ===
                                  aula.id;

                                return (
                                  <div
                                    key={
                                      aula.id
                                    }
                                    className="rounded-lg border border-[#383838] bg-[#151515] p-3"
                                  >

                                    <div className="flex items-start justify-between gap-3">

                                      <div className="min-w-0 flex-1">

                                        <p className="text-xs font-bold text-[#FDC700]">
                                          {
                                            aula.horario
                                          }
                                        </p>

                                        <p className="mt-1 truncate text-sm font-medium text-white">
                                          {
                                            aluno?.nome ??
                                            "Aluno não encontrado"
                                          }
                                        </p>

                                        <p className="mt-1 truncate text-xs text-gray-500">
                                          Prof.{" "}
                                          {
                                            professor?.nome ??
                                            "Professor não encontrado"
                                          }
                                        </p>

                                      </div>

                                      <span className="shrink-0 rounded-full bg-[#FDC700]/10 px-2 py-1 text-[10px] text-[#FDC700]">
                                        {
                                          aula.instrumento
                                        }
                                      </span>

                                    </div>

                                    <div className="mt-3 flex justify-end gap-1 border-t border-[#292929] pt-2">

                                      <button
                                        type="button"
                                        onClick={() =>
                                          abrirEdicao(
                                            aula
                                          )
                                        }
                                        disabled={
                                          desativando
                                        }
                                        className="flex h-9 items-center gap-2 rounded-lg px-3 text-xs text-gray-400 transition hover:bg-[#FDC700]/10 hover:text-[#FDC700] disabled:opacity-40"
                                      >
                                        <Pencil
                                          size={
                                            15
                                          }
                                        />

                                        Editar
                                      </button>

                                      <button
                                        type="button"
                                        onClick={() =>
                                          solicitarDesativacao(
                                            aula
                                          )
                                        }
                                        disabled={
                                          desativando
                                        }
                                        className="flex h-9 items-center gap-2 rounded-lg px-3 text-xs text-gray-400 transition hover:bg-red-500/10 hover:text-red-400 disabled:opacity-40"
                                      >
                                        <Trash2
                                          size={
                                            15
                                          }
                                        />

                                        Desativar
                                      </button>

                                    </div>

                                  </div>
                                );
                              }
                            )}

                            {/* Reposições */}

                            {reposicoesDia.map(
                              (
                                reposicao
                              ) => {
                                const aluno =
                                  buscarAluno(
                                    reposicao.alunoId
                                  );

                                const professor =
                                  buscarProfessor(
                                    reposicao.professorId
                                  );

                                const desativando =
                                  desativandoId ===
                                  reposicao.id;

                                return (
                                  <div
                                    key={`reposicao-${reposicao.id}`}
                                    className="rounded-lg border border-blue-500/30 bg-blue-500/5 p-3"
                                  >

                                    <div className="flex items-start justify-between gap-3">

                                      <div className="min-w-0 flex-1">

                                        <p className="text-xs font-bold text-blue-400">
                                          {
                                            reposicao.horario
                                          }
                                        </p>

                                        <p className="mt-1 truncate text-sm font-medium text-white">
                                          {
                                            aluno?.nome ??
                                            "Aluno não encontrado"
                                          }
                                        </p>

                                        <p className="mt-1 truncate text-xs text-gray-500">
                                          Prof.{" "}
                                          {
                                            professor?.nome ??
                                            "Professor não encontrado"
                                          }
                                        </p>

                                        <p className="mt-2 text-[10px] text-blue-400">
                                          Reposição ·{" "}
                                          {
                                            reposicao.instrumento
                                          }
                                        </p>

                                      </div>

                                      <span className="shrink-0 rounded-full bg-blue-500/10 px-2 py-1 text-[10px] text-blue-400">
                                        Reposição
                                      </span>

                                    </div>

                                    {reposicao.observacao && (
                                      <p className="mt-2 border-t border-blue-500/10 pt-2 text-[10px] text-gray-600">
                                        {
                                          reposicao.observacao
                                        }
                                      </p>
                                    )}

                                    {/* Ações */}

                                    <div className="mt-3 flex justify-end gap-1 border-t border-blue-500/10 pt-2">

                                      <button
                                        type="button"
                                        onClick={() =>
                                          abrirEdicaoReposicao(
                                            reposicao
                                          )
                                        }
                                        disabled={
                                          desativando
                                        }
                                        className="flex h-9 items-center gap-2 rounded-lg px-3 text-xs text-gray-400 transition hover:bg-blue-500/10 hover:text-blue-400 disabled:opacity-40"
                                      >
                                        <Pencil
                                          size={
                                            15
                                          }
                                        />

                                        Editar
                                      </button>

                                      <button
                                        type="button"
                                        onClick={() =>
                                          solicitarDesativacaoReposicao(
                                            reposicao
                                          )
                                        }
                                        disabled={
                                          desativando
                                        }
                                        className="flex h-9 items-center gap-2 rounded-lg px-3 text-xs text-gray-400 transition hover:bg-red-500/10 hover:text-red-400 disabled:opacity-40"
                                      >
                                        <Trash2
                                          size={
                                            15
                                          }
                                        />

                                        Cancelar
                                      </button>

                                    </div>

                                  </div>
                                );
                              }
                            )}

                          </div>
                        )}

                      </div>

                    </div>
                  );
                }
              )}

            </div>

          </>
        )}
      </div>

      {/* =====================================================
          AULA
      ====================================================== */}

      <AulaDialog
        open={dialogOpen}
        aula={aulaSelecionada}
        alunos={alunos}
        professores={professores}
        aulas={aulas}
        onClose={
          fecharDialog
        }
        onSaved={
          carregarDados
        }
      />

      {/* =====================================================
          REPOSIÇÃO
      ====================================================== */}

      <ReposicaoDialog
        open={
          reposicaoDialogOpen
        }
        reposicao={
          reposicaoSelecionada
        }
        aulas={aulas}
        alunos={alunos}
        professores={professores}
        reposicoes={
          reposicoes
        }
        onClose={
          fecharReposicaoDialog
        }
        onSaved={
          carregarDados
        }
      />

      {/* =====================================================
          CONFIRMAR DESATIVAÇÃO DA AULA
      ====================================================== */}

      <ConfirmDialog
        open={Boolean(
          aulaParaDesativar
        )}
        title="Desativar aula"
        description={
          aulaParaDesativar
            ? `Deseja desativar a aula de ${
                buscarAluno(
                  aulaParaDesativar.alunoId
                )?.nome ??
                "este aluno"
              } às ${
                aulaParaDesativar.horario
              } de ${
                nomesDias[
                  aulaParaDesativar
                    .diaSemana
                ]
              }?`
            : ""
        }
        confirmText="Desativar"
        cancelText="Cancelar"
        loading={Boolean(
          desativandoId
        )}
        onCancel={() =>
          setAulaParaDesativar(
            null
          )
        }
        onConfirm={
          confirmarDesativacao
        }
      />

      {/* =====================================================
          CONFIRMAR CANCELAMENTO DA REPOSIÇÃO
      ====================================================== */}

      <ConfirmDialog
        open={Boolean(
          reposicaoParaDesativar
        )}
        title="Cancelar reposição"
        description={
          reposicaoParaDesativar
            ? `Deseja cancelar a reposição de ${
                buscarAluno(
                  reposicaoParaDesativar.alunoId
                )?.nome ??
                "este aluno"
              } às ${
                reposicaoParaDesativar.horario
              } do dia ${
                reposicaoParaDesativar.data
                  .split("-")
                  .reverse()
                  .join("/")
              }?`
            : ""
        }
        confirmText="Cancelar reposição"
        cancelText="Voltar"
        loading={Boolean(
          desativandoId
        )}
        onCancel={() =>
          setReposicaoParaDesativar(
            null
          )
        }
        onConfirm={
          confirmarDesativacaoReposicao
        }
      />

    </main>
  );
}