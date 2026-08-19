"use client";

import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Check,
  CircleAlert,
  Clock,
  RotateCcw,
  X,
} from "lucide-react";

import {
  FormEvent,
  useEffect,
  useMemo,
  useState,
} from "react";

import { listarAulas } from "@/services/aula.service";
import { listarAlunos } from "@/services/aluno.service";
import {
  listarProfessores,
} from "@/services/professor.service";
import {
  listarReposicoes,
} from "@/services/reposicao.service";

import {
  atualizarFrequencia,
  cadastrarFrequencia,
  listarFrequencias,
} from "@/services/frequencia.service";

import {
  Aula,
  DiaSemana,
} from "@/types/aula";

import { Aluno } from "@/types/aluno";
import { Professor } from "@/types/professor";
import { Reposicao } from "@/types/reposicao";

import {
  Frequencia,
  StatusFrequencia,
} from "@/types/frequencia";

/* =========================================================
   DIAS
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
   DATAS
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

  const dia =
    resultado.getDay();

  const diferenca =
    dia === 0
      ? -6
      : 1 - dia;

  resultado.setDate(
    resultado.getDate() +
      diferenca
  );

  return resultado;
}

function adicionarDias(
  data: Date,
  quantidade: number
): Date {
  const resultado =
    new Date(data);

  resultado.setDate(
    resultado.getDate() +
      quantidade
  );

  return resultado;
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

function formatarPeriodo(
  inicio: Date,
  fim: Date
): string {
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
        month: "short",
      }
    )
      .format(fim)
      .replace(".", "");

  if (
    inicio.getMonth() ===
    fim.getMonth()
  ) {
    return `${inicio.getDate()}–${fim.getDate()} de ${mesInicio} de ${inicio.getFullYear()}`;
  }

  return `${inicio.getDate()} de ${mesInicio} – ${fim.getDate()} de ${mesFim} de ${inicio.getFullYear()}`;
}

/* =========================================================
   STATUS
========================================================= */

const statusInfo: Record<
  StatusFrequencia,
  {
    label: string;
    short: string;
    className: string;
  }
> = {
  presente: {
    label: "Presente",
    short: "P",
    className:
      "border-green-500/30 bg-green-500/10 text-green-400",
  },

  falta: {
    label: "Falta",
    short: "F",
    className:
      "border-red-500/30 bg-red-500/10 text-red-400",
  },

  justificada: {
    label: "Justificada",
    short: "J",
    className:
      "border-orange-500/30 bg-orange-500/10 text-orange-400",
  },

  cancelada: {
    label: "Cancelada",
    short: "C",
    className:
      "border-gray-500/30 bg-gray-500/10 text-gray-400",
  },
};

/* =========================================================
   TIPO INTERNO
========================================================= */

interface AulaFrequencia {
  chave: string;

  alunoId: string;

  professorId: string;

  instrumento: Aula["instrumento"];

  data: string;

  horario: string;

  tipo: "aula" | "reposicao";

  aulaId?: string;

  reposicaoId?: string;
}

/* =========================================================
   PÁGINA
========================================================= */

export default function FrequenciaPage() {
  const [aulas, setAulas] =
    useState<Aula[]>([]);

  const [reposicoes, setReposicoes] =
    useState<Reposicao[]>([]);

  const [alunos, setAlunos] =
    useState<Aluno[]>([]);

  const [professores, setProfessores] =
    useState<Professor[]>([]);

  const [frequencias, setFrequencias] =
    useState<Frequencia[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [salvando, setSalvando] =
    useState<string | null>(null);

  const [semanaOffset, setSemanaOffset] =
    useState(0);

  const [agora, setAgora] =
    useState(new Date());

  /* =======================================================
     MODAL JUSTIFICATIVA
  ======================================================= */

  const [
    justificativaAberta,
    setJustificativaAberta,
  ] = useState(false);

  const [
    aulaJustificativa,
    setAulaJustificativa,
  ] = useState<AulaFrequencia | null>(
    null
  );

  const [
    justificativa,
    setJustificativa,
  ] = useState("");

  const [
    salvandoJustificativa,
    setSalvandoJustificativa,
  ] = useState(false);

  const [
    erroJustificativa,
    setErroJustificativa,
  ] = useState("");

  /* =======================================================
     ATUALIZAR HORÁRIO
  ======================================================= */

  useEffect(() => {
    const intervalo =
      setInterval(() => {
        setAgora(
          new Date()
        );
      }, 30000);

    return () => {
      clearInterval(
        intervalo
      );
    };
  }, []);

  /* =======================================================
     SEMANA
  ======================================================= */

  const semanaAtual =
    useMemo(() => {
      const inicio =
        inicioDaSemana(
          agora
        );

      return adicionarDias(
        inicio,
        semanaOffset * 7
      );
    }, [
      agora,
      semanaOffset,
    ]);

  const fimDaSemana =
    useMemo(() => {
      return adicionarDias(
        semanaAtual,
        5
      );
    }, [semanaAtual]);

  /* =======================================================
     CARREGAR DADOS
  ======================================================= */

  async function carregarDados() {
    try {
      setLoading(true);

      const [
        aulasData,
        reposicoesData,
        alunosData,
        professoresData,
        frequenciasData,
      ] = await Promise.all([
        listarAulas(),
        listarReposicoes(),
        listarAlunos(),
        listarProfessores(),
        listarFrequencias(),
      ]);

      setAulas(
        aulasData
      );

      setReposicoes(
        reposicoesData
      );

      setAlunos(
        alunosData
      );

      setProfessores(
        professoresData
      );

      setFrequencias(
        frequenciasData
      );
    } catch (error) {
      console.error(
        "Erro ao carregar frequência:",
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
     CONVERTER CRIADO EM
  ======================================================= */

  function dataDoRegistro(
    frequencia: Frequencia
  ): Date | null {
    if (
      !frequencia.criadoEm
    ) {
      return null;
    }

    const data =
      new Date(
        frequencia.criadoEm
      );

    if (
      Number.isNaN(
        data.getTime()
      )
    ) {
      return null;
    }

    return data;
  }

  /* =======================================================
     VERIFICAR SE A FREQUÊNCIA FOI REGISTRADA HOJE
  ======================================================= */

  function foiRegistradaHoje(
    frequencia: Frequencia
  ): boolean {
    const criadoEm =
      dataDoRegistro(
        frequencia
      );

    if (!criadoEm) {
      return false;
    }

    return mesmaData(
      criadoEm,
      agora
    );
  }

  /* =======================================================
     PODE REGISTRAR UMA NOVA FREQUÊNCIA?
  ======================================================= */

  function podeRegistrarNovaFrequencia(
    data: string,
    horario: string
  ): boolean {
    const hojeString =
      dataParaString(
        agora
      );

    /*
     * Aula de dia anterior:
     *
     * Se ainda não existe frequência,
     * continua disponível para lançamento.
     */
    if (
      data <
      hojeString
    ) {
      return true;
    }

    /*
     * Aula futura:
     * não pode lançar.
     */
    if (
      data >
      hojeString
    ) {
      return false;
    }

    /*
     * Aula de hoje:
     * somente depois do horário.
     */

    const [
      hora,
      minuto,
    ] = horario
      .split(":")
      .map(Number);

    const horarioAula =
      new Date(agora);

    horarioAula.setHours(
      hora,
      minuto,
      0,
      0
    );

    return (
      agora >=
      horarioAula
    );
  }

  /* =======================================================
     PODE ALTERAR UMA FREQUÊNCIA EXISTENTE?
  ======================================================= */

  function podeAlterarFrequencia(
    frequencia: Frequencia
  ): boolean {
    /*
     * Só pode alterar se o registro
     * foi criado hoje.
     */
    return foiRegistradaHoje(
      frequencia
    );
  }

  /* =======================================================
     MONTAR AULAS DA SEMANA
  ======================================================= */

  const aulasDaSemana =
    useMemo<AulaFrequencia[]>(
      () => {
        const resultado: AulaFrequencia[] =
          [];

        dias.forEach(
          (
            dia,
            index
          ) => {
            const data =
              adicionarDias(
                semanaAtual,
                index
              );

            const dataString =
              dataParaString(
                data
              );

            aulas
              .filter((aula) => {
                if (
                  !aula.ativo ||
                  aula.diaSemana !== dia
                ) {
                  return false;
                }

                /*
                 * A aula só passa a existir na frequência
                 * a partir da sua data de início.
                 *
                 * Para aulas novas, usamos dataInicio.
                 * Para aulas antigas, usamos criadoEm como
                 * compatibilidade.
                 */
                const dataInicio =
                  aula.dataInicio ??
                  aula.criadoEm?.slice(0, 10);

                if (!dataInicio) {
                  return true;
                }

                return dataString >= dataInicio;
              })
              .forEach(
                (aula) => {
                  resultado.push({
                    chave: `aula-${aula.id}-${dataString}`,

                    alunoId:
                      aula.alunoId,

                    professorId:
                      aula.professorId,

                    instrumento:
                      aula.instrumento,

                    data:
                      dataString,

                    horario:
                      aula.horario,

                    tipo:
                      "aula",

                    aulaId:
                      aula.id,
                  });
                }
              );
          }
        );

        reposicoes
          .filter(
            (reposicao) =>
              reposicao.ativo
          )
          .forEach(
            (reposicao) => {
              const inicio =
                dataParaString(
                  semanaAtual
                );

              const fim =
                dataParaString(
                  fimDaSemana
                );

              if (
                reposicao.data >=
                  inicio &&
                reposicao.data <=
                  fim
              ) {
                resultado.push({
                  chave: `reposicao-${reposicao.id}`,

                  alunoId:
                    reposicao.alunoId,

                  professorId:
                    reposicao.professorId,

                  instrumento:
                    reposicao.instrumento,

                  data:
                    reposicao.data,

                  horario:
                    reposicao.horario,

                  tipo:
                    "reposicao",

                  reposicaoId:
                    reposicao.id,
                });
              }
            }
          );

        return resultado.sort(
          (a, b) => {
            if (
              a.data !==
              b.data
            ) {
              return a.data.localeCompare(
                b.data
              );
            }

            return a.horario.localeCompare(
              b.horario
            );
          }
        );
      },
      [
        aulas,
        reposicoes,
        semanaAtual,
        fimDaSemana,
      ]
    );

  /* =======================================================
     ENCONTRAR FREQUÊNCIA
  ======================================================= */

  function encontrarFrequencia(
    aula: AulaFrequencia
  ) {
    return frequencias.find(
      (frequencia) => {
        if (
          frequencia.data !==
          aula.data
        ) {
          return false;
        }

        if (
          frequencia.horario !==
          aula.horario
        ) {
          return false;
        }

        if (
          frequencia.alunoId !==
          aula.alunoId
        ) {
          return false;
        }

        if (
          aula.tipo ===
          "aula"
        ) {
          return (
            frequencia.aulaId ===
            aula.aulaId
          );
        }

        return (
          frequencia.reposicaoId ===
          aula.reposicaoId
        );
      }
    );
  }

  /* =======================================================
     SALVAR / ATUALIZAR
  ======================================================= */

  async function salvarStatus(
    aula: AulaFrequencia,
    status: StatusFrequencia,
    observacao = ""
  ) {
    const frequenciaExistente =
      encontrarFrequencia(
        aula
      );

    /*
     * Se já existe frequência:
     *
     * só permite alterar se ela
     * tiver sido registrada hoje.
     */
    if (
      frequenciaExistente
    ) {
      if (
        !podeAlterarFrequencia(
          frequenciaExistente
        )
      ) {
        return;
      }
    }

    /*
     * Se não existe frequência:
     *
     * verifica se a aula já aconteceu.
     */
    else if (
      !podeRegistrarNovaFrequencia(
        aula.data,
        aula.horario
      )
    ) {
      return;
    }

    const chave =
      aula.chave;

    try {
      setSalvando(
        chave
      );

      if (
        frequenciaExistente
      ) {
        await atualizarFrequencia(
          frequenciaExistente.id,
          status,
          observacao
        );

        setFrequencias(
          (atual) =>
            atual.map(
              (item) =>
                item.id ===
                frequenciaExistente.id
                  ? {
                      ...item,
                      status,
                      observacao,
                    }
                  : item
            )
        );
      } else {
        const id =
          await cadastrarFrequencia(
            {
              alunoId:
                aula.alunoId,

              professorId:
                aula.professorId,

              instrumento:
                aula.instrumento,

              data:
                aula.data,

              horario:
                aula.horario,

              status,

              tipo:
                aula.tipo,

              aulaId:
                aula.aulaId,

              reposicaoId:
                aula.reposicaoId,

              observacao,
            }
          );

        setFrequencias(
          (atual) => [
            ...atual,
            {
              id,

              alunoId:
                aula.alunoId,

              professorId:
                aula.professorId,

              instrumento:
                aula.instrumento,

              data:
                aula.data,

              horario:
                aula.horario,

              status,

              tipo:
                aula.tipo,

              aulaId:
                aula.aulaId,

              reposicaoId:
                aula.reposicaoId,

              observacao,

              /*
               * O Firestore cria o timestamp
               * real no banco.
               *
               * Aqui não precisamos definir
               * criadoEm manualmente.
               */
            },
          ]
        );
      }
    } catch (error) {
      console.error(
        "Erro ao salvar frequência:",
        error
      );
    } finally {
      setSalvando(
        null
      );
    }
  }

  /* =======================================================
     ALTERAR STATUS
  ======================================================= */

  function alterarStatus(
    aula: AulaFrequencia,
    status: StatusFrequencia
  ) {
    const existente =
      encontrarFrequencia(
        aula
      );

    /*
     * Registro antigo:
     * não pode mais ser alterado.
     */

    if (
      existente &&
      !podeAlterarFrequencia(
        existente
      )
    ) {
      return;
    }

    /*
     * Aula sem registro:
     * precisa ter acontecido.
     */

    if (
      !existente &&
      !podeRegistrarNovaFrequencia(
        aula.data,
        aula.horario
      )
    ) {
      return;
    }

    /*
     * Justificada abre modal.
     */

    if (
      status ===
      "justificada"
    ) {
      setAulaJustificativa(
        aula
      );

      setJustificativa(
        existente?.status ===
          "justificada"
          ? existente.observacao ??
              ""
          : ""
      );

      setErroJustificativa(
        ""
      );

      setJustificativaAberta(
        true
      );

      return;
    }

    /*
     * Outros status:
     * salva imediatamente.
     */

    salvarStatus(
      aula,
      status,
      ""
    );
  }

  /* =======================================================
     SALVAR JUSTIFICATIVA
  ======================================================= */

  async function confirmarJustificativa(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (
      !aulaJustificativa
    ) {
      return;
    }

    const texto =
      justificativa.trim();

    if (!texto) {
      setErroJustificativa(
        "Informe o motivo da falta justificada."
      );

      return;
    }

    try {
      setSalvandoJustificativa(
        true
      );

      await salvarStatus(
        aulaJustificativa,
        "justificada",
        texto
      );

      setJustificativaAberta(
        false
      );

      setAulaJustificativa(
        null
      );

      setJustificativa(
        ""
      );
    } catch (error) {
      console.error(
        "Erro ao salvar justificativa:",
        error
      );

      setErroJustificativa(
        "Não foi possível salvar a justificativa."
      );
    } finally {
      setSalvandoJustificativa(
        false
      );
    }
  }

  /* =======================================================
     FECHAR MODAL
  ======================================================= */

  function fecharJustificativa() {
    if (
      salvandoJustificativa
    ) {
      return;
    }

    setJustificativaAberta(
      false
    );

    setAulaJustificativa(
      null
    );

    setJustificativa(
      ""
    );

    setErroJustificativa(
      ""
    );
  }

  /* =======================================================
     CONTADORES
  ======================================================= */

  const totalAulas =
    aulasDaSemana.length;

  const totalRegistradas =
    aulasDaSemana.filter(
      (aula) =>
        encontrarFrequencia(
          aula
        )
    ).length;

  const totalPresentes =
    aulasDaSemana.filter(
      (aula) =>
        encontrarFrequencia(
          aula
        )?.status ===
        "presente"
    ).length;

  const totalFaltas =
    aulasDaSemana.filter(
      (aula) =>
        encontrarFrequencia(
          aula
        )?.status ===
        "falta"
    ).length;

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
                Frequência
              </h1>

              <p className="mt-1 text-sm text-gray-400">
                Controle de presença dos alunos
              </p>

            </div>

            <button
              type="button"
              onClick={
                carregarDados
              }
              className="flex h-10 items-center gap-2 rounded-lg border border-[#303030] bg-[#1c1c1c] px-3 text-sm text-gray-400 transition hover:bg-[#292929] hover:text-white"
              title="Atualizar"
            >

              <RotateCcw
                size={16}
              />

              <span className="hidden sm:inline">
                Atualizar
              </span>

            </button>

          </div>

        </div>

      </header>

      {/* =================================================
          CONTEÚDO
      ================================================== */}

      <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">

        {/* =================================================
            NAVEGAÇÃO DA SEMANA
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

            <div className="text-center">

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

            </div>

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

          {semanaOffset !==
            0 && (
            <div className="border-t border-[#303030] px-4 py-2 text-center">

              <button
                type="button"
                onClick={() =>
                  setSemanaOffset(
                    0
                  )
                }
                className="text-xs text-[#FDC700] hover:underline"
              >
                Voltar para a semana atual
              </button>

            </div>
          )}

        </div>

        {/* =================================================
            RESUMO
        ================================================== */}

        <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">

          <div className="rounded-xl border border-[#303030] bg-[#1c1c1c] p-4">

            <div className="flex items-center gap-3">

              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#FDC700]/10 text-[#FDC700]">
                <CalendarDays
                  size={18}
                />
              </div>

              <div>

                <p className="text-xs text-gray-500">
                  Aulas
                </p>

                <p className="text-lg font-bold text-white">
                  {totalAulas}
                </p>

              </div>

            </div>

          </div>

          <div className="rounded-xl border border-[#303030] bg-[#1c1c1c] p-4">

            <div className="flex items-center gap-3">

              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500/10 text-blue-400">
                <Clock
                  size={18}
                />
              </div>

              <div>

                <p className="text-xs text-gray-500">
                  Registradas
                </p>

                <p className="text-lg font-bold text-white">
                  {totalRegistradas}
                </p>

              </div>

            </div>

          </div>

          <div className="rounded-xl border border-[#303030] bg-[#1c1c1c] p-4">

            <div className="flex items-center gap-3">

              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-green-500/10 text-green-400">
                <Check
                  size={18}
                />
              </div>

              <div>

                <p className="text-xs text-gray-500">
                  Presentes
                </p>

                <p className="text-lg font-bold text-white">
                  {totalPresentes}
                </p>

              </div>

            </div>

          </div>

          <div className="rounded-xl border border-[#303030] bg-[#1c1c1c] p-4">

            <div className="flex items-center gap-3">

              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-500/10 text-red-400">
                <CircleAlert
                  size={18}
                />
              </div>

              <div>

                <p className="text-xs text-gray-500">
                  Faltas
                </p>

                <p className="text-lg font-bold text-white">
                  {totalFaltas}
                </p>

              </div>

            </div>

          </div>

        </div>

        {/* =================================================
            LISTA
        ================================================== */}

        {loading ? (

          <div className="rounded-xl border border-[#303030] bg-[#1c1c1c] p-12 text-center">

            <p className="text-sm text-gray-400">
              Carregando frequência...
            </p>

          </div>

        ) : aulasDaSemana.length ===
          0 ? (

          <div className="rounded-xl border border-[#303030] bg-[#1c1c1c] p-12 text-center">

            <CalendarDays
              size={32}
              className="mx-auto text-gray-700"
            />

            <p className="mt-3 text-sm text-gray-400">
              Nenhuma aula encontrada nesta semana.
            </p>

          </div>

        ) : (

          <div className="space-y-4">

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

                const dataString =
                  dataParaString(
                    dataDia
                  );

                const aulasDia =
                  aulasDaSemana.filter(
                    (aula) =>
                      aula.data ===
                      dataString
                  );

                if (
                  aulasDia.length ===
                  0
                ) {
                  return null;
                }

                const ehHoje =
                  mesmaData(
                    dataDia,
                    agora
                  );

                return (

                  <section
                    key={dia}
                    className={`overflow-hidden rounded-xl border bg-[#1c1c1c] ${
                      ehHoje
                        ? "border-[#FDC700]/50"
                        : "border-[#303030]"
                    }`}
                  >

                    {/* Cabeçalho */}

                    <div
                      className={`flex items-center justify-between border-b px-4 py-3 ${
                        ehHoje
                          ? "border-[#FDC700]/20 bg-[#FDC700]/5"
                          : "border-[#303030]"
                      }`}
                    >

                      <div className="flex items-center gap-3">

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

                        {ehHoje && (
                          <span className="rounded-full bg-[#FDC700]/10 px-2 py-1 text-[9px] font-medium text-[#FDC700]">
                            Hoje
                          </span>
                        )}

                      </div>

                      <p className="text-xs text-gray-600">
                        {aulasDia.length}{" "}
                        aula
                        {aulasDia.length !==
                        1
                          ? "s"
                          : ""}
                      </p>

                    </div>

                    {/* Aulas */}

                    <div className="divide-y divide-[#292929]">

                      {aulasDia.map(
                        (aula) => {

                          const aluno =
                            buscarAluno(
                              aula.alunoId
                            );

                          const professor =
                            buscarProfessor(
                              aula.professorId
                            );

                          const frequencia =
                            encontrarFrequencia(
                              aula
                            );

                          const salvandoAtual =
                            salvando ===
                            aula.chave;

                          /*
                           * Se não tem registro:
                           * verifica se já pode lançar.
                           *
                           * Se tem registro:
                           * verifica se foi lançado hoje.
                           */

                          const podeRegistrar =
                            frequencia
                              ? podeAlterarFrequencia(
                                  frequencia
                                )
                              : podeRegistrarNovaFrequencia(
                                  aula.data,
                                  aula.horario
                                );

                          const registroEncerrado =
                            !!frequencia &&
                            !podeAlterarFrequencia(
                              frequencia
                            );

                          return (

                            <div
                              key={
                                aula.chave
                              }
                              className={`p-4 transition ${
                                !podeRegistrar
                                  ? "bg-[#181818]"
                                  : ""
                              }`}
                            >

                              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

                                {/* Informações */}

                                <div
                                  className={`flex min-w-0 items-start gap-3 ${
                                    !podeRegistrar
                                      ? "opacity-50"
                                      : ""
                                  }`}
                                >

                                  <div
                                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
                                      aula.tipo ===
                                      "reposicao"
                                        ? "bg-blue-500/10 text-blue-400"
                                        : "bg-[#FDC700]/10 text-[#FDC700]"
                                    }`}
                                  >

                                    {aula.tipo ===
                                    "reposicao" ? (
                                      <RotateCcw
                                        size={
                                          18
                                        }
                                      />
                                    ) : (
                                      <Clock
                                        size={
                                          18
                                        }
                                      />
                                    )}

                                  </div>

                                  <div className="min-w-0">

                                    <div className="flex flex-wrap items-center gap-2">

                                      <span className="text-sm font-bold text-white">
                                        {
                                          aula.horario
                                        }
                                      </span>

                                      <span
                                        className={`rounded-full px-2 py-0.5 text-[10px] ${
                                          aula.tipo ===
                                          "reposicao"
                                            ? "bg-blue-500/10 text-blue-400"
                                            : "bg-[#FDC700]/10 text-[#FDC700]"
                                        }`}
                                      >
                                        {
                                          aula.instrumento
                                        }
                                      </span>

                                      {aula.tipo ===
                                        "reposicao" && (
                                        <span className="rounded-full bg-blue-500/10 px-2 py-0.5 text-[10px] text-blue-400">
                                          Reposição
                                        </span>
                                      )}

                                    </div>

                                    <p className="mt-1 truncate text-sm font-medium text-white">
                                      {
                                        aluno?.nome ??
                                        "Aluno não encontrado"
                                      }
                                    </p>

                                    <p className="mt-0.5 truncate text-xs text-gray-500">
                                      Prof.{" "}
                                      {
                                        professor?.nome ??
                                        "Professor não encontrado"
                                      }
                                    </p>

                                  </div>

                                </div>

                                {/* STATUS */}

                                <div
                                  className={`flex flex-wrap items-center gap-2 ${
                                    !podeRegistrar
                                      ? "opacity-35"
                                      : ""
                                  }`}
                                >

                                  {(
                                    [
                                      "presente",
                                      "falta",
                                      "justificada",
                                      "cancelada",
                                    ] as StatusFrequencia[]
                                  ).map(
                                    (
                                      status
                                    ) => {

                                      const selecionado =
                                        frequencia?.status ===
                                        status;

                                      const info =
                                        statusInfo[
                                          status
                                        ];

                                      return (

                                        <button
                                          key={
                                            status
                                          }
                                          type="button"
                                          disabled={
                                            salvandoAtual ||
                                            !podeRegistrar
                                          }
                                          onClick={() =>
                                            alterarStatus(
                                              aula,
                                              status
                                            )
                                          }
                                          title={
                                            registroEncerrado
                                              ? "Registro encerrado. A frequência não pode mais ser alterada."
                                              : !podeRegistrar
                                                ? "A frequência só poderá ser registrada após o horário da aula."
                                                : info.label
                                          }
                                          className={`flex h-9 items-center gap-2 rounded-lg border px-3 text-xs font-medium transition disabled:cursor-not-allowed disabled:opacity-50 ${
                                            selecionado
                                              ? info.className
                                              : "border-[#303030] bg-[#151515] text-gray-500 hover:border-[#4a4a4a] hover:text-gray-300"
                                          }`}
                                        >

                                          {status ===
                                            "presente" && (
                                            <Check
                                              size={
                                                14
                                              }
                                            />
                                          )}

                                          {status ===
                                            "falta" && (
                                            <X
                                              size={
                                                14
                                              }
                                            />
                                          )}

                                          {status ===
                                            "justificada" && (
                                            <CircleAlert
                                              size={
                                                14
                                              }
                                            />
                                          )}

                                          {status ===
                                            "cancelada" && (
                                            <CalendarDays
                                              size={
                                                14
                                              }
                                            />
                                          )}

                                          <span className="hidden sm:inline">
                                            {
                                              info.label
                                            }
                                          </span>

                                          <span className="sm:hidden">
                                            {
                                              info.short
                                            }
                                          </span>

                                        </button>

                                      );
                                    }
                                  )}

                                </div>

                              </div>

                              {/* STATUS / MENSAGEM */}

                              <div
                                className={`mt-3 border-t border-[#292929] pt-3 ${
                                  !podeRegistrar
                                    ? "opacity-70"
                                    : ""
                                }`}
                              >

                                {salvandoAtual ? (

                                  <p className="text-xs text-gray-600">
                                    Salvando frequência...
                                  </p>

                                ) : frequencia ? (

                                  <div className="space-y-1">

                                    <div className="flex flex-wrap items-center gap-2">

                                      <p
                                        className={`text-xs ${
                                          statusInfo[
                                            frequencia.status
                                          ].className
                                            .split(
                                              " "
                                            )
                                            .find(
                                              (
                                                classe
                                              ) =>
                                                classe.startsWith(
                                                  "text-"
                                                )
                                            ) ??
                                          "text-gray-400"
                                        }`}
                                      >
                                        Status:{" "}
                                        {
                                          statusInfo[
                                            frequencia.status
                                          ].label
                                        }
                                      </p>

                                      {registroEncerrado && (
                                        <span className="rounded-full bg-gray-500/10 px-2 py-0.5 text-[10px] text-gray-500">
                                          Histórico
                                        </span>
                                      )}

                                    </div>

                                    {frequencia.status ===
                                      "justificada" &&
                                      frequencia.observacao && (

                                      <p className="text-xs text-gray-500">
                                        Motivo:{" "}
                                        {
                                          frequencia.observacao
                                        }
                                      </p>

                                    )}

                                    {registroEncerrado && (

                                      <div className="flex items-center gap-2 pt-1">

                                        <Clock
                                          size={
                                            13
                                          }
                                          className="text-gray-600"
                                        />

                                        <p className="text-xs text-gray-600">
                                          Registro encerrado.
                                          A frequência não
                                          pode mais ser
                                          alterada.
                                        </p>

                                      </div>

                                    )}

                                  </div>

                                ) : !podeRegistrar ? (

                                  <div className="flex items-center gap-2">

                                    <Clock
                                      size={
                                        13
                                      }
                                      className="text-gray-600"
                                    />

                                    <p className="text-xs text-gray-600">
                                      Aula ainda não iniciada.
                                      A frequência poderá
                                      ser registrada após o
                                      horário da aula.
                                    </p>

                                  </div>

                                ) : (

                                  <p className="text-xs text-gray-600">
                                    Frequência ainda não registrada.
                                  </p>

                                )}

                              </div>

                            </div>

                          );
                        }
                      )}

                    </div>

                  </section>

                );
              }
            )}

          </div>

        )}

      </div>

      {/* =====================================================
          MODAL — FALTA JUSTIFICADA
      ====================================================== */}

      {justificativaAberta &&
        aulaJustificativa && (

        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">

          <div className="w-full max-w-md overflow-hidden rounded-2xl border border-[#303030] bg-[#1c1c1c] shadow-2xl">

            {/* Cabeçalho */}

            <div className="flex items-center justify-between border-b border-[#303030] px-5 py-4">

              <div className="flex items-center gap-3">

                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500/10 text-orange-400">
                  <CircleAlert
                    size={20}
                  />
                </div>

                <div>

                  <h2 className="text-lg font-semibold text-white">
                    Falta justificada
                  </h2>

                  <p className="mt-1 text-xs text-gray-500">
                    Informe o motivo da ausência.
                  </p>

                </div>

              </div>

              <button
                type="button"
                onClick={
                  fecharJustificativa
                }
                disabled={
                  salvandoJustificativa
                }
                className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-400 transition hover:bg-[#292929] hover:text-white disabled:opacity-40"
              >
                <X
                  size={19}
                />
              </button>

            </div>

            {/* Formulário */}

            <form
              onSubmit={
                confirmarJustificativa
              }
              className="space-y-5 p-5"
            >

              <div className="rounded-xl border border-[#303030] bg-[#151515] p-4">

                <div className="flex items-center justify-between gap-3">

                  <div>

                    <p className="text-sm font-medium text-white">
                      {
                        buscarAluno(
                          aulaJustificativa.alunoId
                        )?.nome ??
                        "Aluno"
                      }
                    </p>

                    <p className="mt-1 text-xs text-gray-500">
                      {
                        aulaJustificativa.horario
                      }{" "}
                      ·{" "}
                      {
                        aulaJustificativa.instrumento
                      }
                    </p>

                  </div>

                  <span className="rounded-full bg-orange-500/10 px-2.5 py-1 text-[10px] text-orange-400">
                    Justificada
                  </span>

                </div>

              </div>

              <div>

                <label
                  htmlFor="motivo-justificativa"
                  className="mb-2 block text-sm text-gray-300"
                >
                  Motivo da justificativa
                </label>

                <textarea
                  id="motivo-justificativa"
                  value={
                    justificativa
                  }
                  onChange={(event) =>
                    setJustificativa(
                      event.target.value
                    )
                  }
                  disabled={
                    salvandoJustificativa
                  }
                  autoFocus
                  rows={4}
                  maxLength={500}
                  placeholder="Ex.: Aluno apresentou atestado médico."
                  className="w-full resize-none rounded-xl border border-[#3a3a3a] bg-[#121212] px-3 py-3 text-sm text-white outline-none placeholder:text-gray-700 focus:border-orange-400"
                />

                <div className="mt-1 flex justify-between">

                  <p className="text-[11px] text-gray-600">
                    Esse motivo ficará salvo no histórico.
                  </p>

                  <p className="text-[11px] text-gray-700">
                    {justificativa.length}/500
                  </p>

                </div>

              </div>

              {erroJustificativa && (

                <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-400">
                  {erroJustificativa}
                </div>

              )}

              <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">

                <button
                  type="button"
                  onClick={
                    fecharJustificativa
                  }
                  disabled={
                    salvandoJustificativa
                  }
                  className="h-11 rounded-lg border border-[#3a3a3a] px-5 text-sm text-gray-300 transition hover:bg-[#292929] disabled:opacity-40"
                >
                  Voltar
                </button>

                <button
                  type="submit"
                  disabled={
                    salvandoJustificativa ||
                    !justificativa.trim()
                  }
                  className="h-11 rounded-lg bg-orange-500 px-5 text-sm font-bold text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {salvandoJustificativa
                    ? "Salvando..."
                    : "Salvar justificativa"}
                </button>

              </div>

            </form>

          </div>

        </div>

      )}

    </main>
  );
}