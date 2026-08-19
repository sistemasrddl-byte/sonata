"use client";

import {
  BarChart3,
  CalendarDays,
  Check,
  ChevronDown,
  CircleAlert,
  Clock,
  Download,
  FileText,
  RotateCcw,
  Search,
  Users,
  X,
} from "lucide-react";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import { listarAulas } from "@/services/aula.service";
import { listarAlunos } from "@/services/aluno.service";
import { listarProfessores } from "@/services/professor.service";
import { listarReposicoes } from "@/services/reposicao.service";
import { listarFrequencias } from "@/services/frequencia.service";

import { Aula, DiaSemana } from "@/types/aula";
import { Aluno } from "@/types/aluno";
import { Professor } from "@/types/professor";
import { Reposicao } from "@/types/reposicao";
import {
  Frequencia,
  StatusFrequencia,
} from "@/types/frequencia";

type FiltroStatus =
  | "todos"
  | StatusFrequencia;

interface RegistroRelatorio {
  chave: string;
  alunoId: string;
  professorId: string;
  instrumento: Aula["instrumento"];
  data: string;
  horario: string;
  tipo: "aula" | "reposicao";
  frequencia?: Frequencia;
}

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

function inicioDoDia(data: Date) {
  const resultado = new Date(data);
  resultado.setHours(0, 0, 0, 0);
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

function formatarData(data: string) {
  if (!data) return "-";

  const [ano, mes, dia] =
    data.split("-");

  return `${dia}/${mes}/${ano}`;
}

function formatarDataLonga(
  data: string
) {
  if (!data) return "-";

  const [ano, mes, dia] =
    data.split("-");

  return new Intl.DateTimeFormat(
    "pt-BR",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }
  )
    .format(
      new Date(
        Number(ano),
        Number(mes) - 1,
        Number(dia)
      )
    )
    .replace(".", "");
}

function primeiroDiaDoMesAtual() {
  const agora = new Date();

  return dataParaString(
    new Date(
      agora.getFullYear(),
      agora.getMonth(),
      1
    )
  );
}

function hojeString() {
  return dataParaString(new Date());
}

function calcularPercentual(
  presentes: number,
  faltas: number,
  justificadas: number
) {
  const consideradas =
    presentes +
    faltas +
    justificadas;

  if (!consideradas) {
    return 0;
  }

  return Math.round(
    (presentes / consideradas) * 100
  );
}

function nomeInstrumento(
  instrumento: Aula["instrumento"]
) {
  return instrumento;
}

export default function RelatorioFrequenciaPage() {
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

  const [atualizando, setAtualizando] =
    useState(false);

  const [dataInicio, setDataInicio] =
    useState(
      primeiroDiaDoMesAtual()
    );

  const [dataFim, setDataFim] =
    useState(hojeString());

  const [alunoFiltro, setAlunoFiltro] =
    useState("");

  const [
    instrumentoFiltro,
    setInstrumentoFiltro,
  ] = useState("");

  const [
    professorFiltro,
    setProfessorFiltro,
  ] = useState("");

  const [statusFiltro, setStatusFiltro] =
    useState<FiltroStatus>("todos");

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

      setAulas(aulasData);
      setReposicoes(reposicoesData);
      setAlunos(alunosData);
      setProfessores(
        professoresData
      );
      setFrequencias(
        frequenciasData
      );
    } catch (error) {
      console.error(
        "Erro ao carregar relatório de frequência:",
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

  function buscarProfessor(id: string) {
    return professores.find(
      (professor) =>
        professor.id === id
    );
  }

  /*
   * Monta as ocorrências das aulas recorrentes
   * dentro do período escolhido.
   */
  const registros = useMemo<
    RegistroRelatorio[]
  >(() => {
    if (
      !dataInicio ||
      !dataFim ||
      dataInicio > dataFim
    ) {
      return [];
    }

    const resultado: RegistroRelatorio[] =
      [];

    const inicio = new Date(
      `${dataInicio}T00:00:00`
    );

    const fim = new Date(
      `${dataFim}T00:00:00`
    );

    aulas
      .filter(
        (aula) => aula.ativo
      )
      .forEach((aula) => {
        const dataInicioAula =
          aula.dataInicio ??
          aula.criadoEm?.slice(0, 10);

        let data =
          new Date(inicio);

        if (
          dataInicioAula &&
          dataInicioAula >
            dataParaString(data)
        ) {
          data = new Date(
            `${dataInicioAula}T00:00:00`
          );
        }

        while (data <= fim) {
          const diaDaSemana =
            data.getDay();

          const indice =
            diaDaSemana === 0
              ? -1
              : diaDaSemana - 1;

          if (
            dias[indice] ===
            aula.diaSemana
          ) {
            const dataString =
              dataParaString(data);

            if (
              dataString >=
                dataInicio &&
              dataString <= dataFim
            ) {
              const frequencia =
                frequencias.find(
                  (item) =>
                    item.data ===
                      dataString &&
                    item.horario ===
                      aula.horario &&
                    item.alunoId ===
                      aula.alunoId &&
                    item.aulaId ===
                      aula.id
                );

              resultado.push({
                chave: `aula-${aula.id}-${dataString}`,
                alunoId:
                  aula.alunoId,
                professorId:
                  aula.professorId,
                instrumento:
                  aula.instrumento,
                data: dataString,
                horario:
                  aula.horario,
                tipo: "aula",
                frequencia,
              });
            }
          }

          data = adicionarDias(
            data,
            1
          );
        }
      });

    reposicoes
      .filter(
        (reposicao) =>
          reposicao.ativo &&
          reposicao.data >=
            dataInicio &&
          reposicao.data <= dataFim
      )
      .forEach((reposicao) => {
        const frequencia =
          frequencias.find(
            (item) =>
              item.data ===
                reposicao.data &&
              item.horario ===
                reposicao.horario &&
              item.alunoId ===
                reposicao.alunoId &&
              item.reposicaoId ===
                reposicao.id
          );

        resultado.push({
          chave: `reposicao-${reposicao.id}`,
          alunoId:
            reposicao.alunoId,
          professorId:
            reposicao.professorId,
          instrumento:
            reposicao.instrumento,
          data: reposicao.data,
          horario:
            reposicao.horario,
          tipo: "reposicao",
          frequencia,
        });
      });

    return resultado.sort((a, b) => {
      if (a.data !== b.data) {
        return a.data.localeCompare(
          b.data
        );
      }

      return a.horario.localeCompare(
        b.horario
      );
    });
  }, [
    aulas,
    reposicoes,
    frequencias,
    dataInicio,
    dataFim,
  ]);

  const registrosFiltrados =
    useMemo(() => {
      const termo =
        busca.trim().toLowerCase();

      return registros.filter(
        (registro) => {
          const aluno =
            buscarAluno(
              registro.alunoId
            );

          const professor =
            buscarProfessor(
              registro.professorId
            );

          if (
            alunoFiltro &&
            registro.alunoId !==
              alunoFiltro
          ) {
            return false;
          }

          if (
            instrumentoFiltro &&
            registro.instrumento !==
              instrumentoFiltro
          ) {
            return false;
          }

          if (
            professorFiltro &&
            registro.professorId !==
              professorFiltro
          ) {
            return false;
          }

          if (
            statusFiltro !== "todos"
          ) {
            if (
              registro.frequencia
                ?.status !==
                statusFiltro
            ) {
              return false;
            }
          }

          if (!termo) {
            return true;
          }

          return (
            aluno?.nome
              .toLowerCase()
              .includes(termo) ||
            professor?.nome
              .toLowerCase()
              .includes(termo) ||
            registro.instrumento
              .toLowerCase()
              .includes(termo)
          );
        }
      );
    }, [
      registros,
      alunoFiltro,
      instrumentoFiltro,
      professorFiltro,
      statusFiltro,
      busca,
      alunos,
      professores,
    ]);

  const resumo = useMemo(() => {
    const previstas =
      registrosFiltrados.length;

    const registradas =
      registrosFiltrados.filter(
        (item) =>
          !!item.frequencia
      ).length;

    const presentes =
      registrosFiltrados.filter(
        (item) =>
          item.frequencia
            ?.status ===
          "presente"
      ).length;

    const faltas =
      registrosFiltrados.filter(
        (item) =>
          item.frequencia
            ?.status === "falta"
      ).length;

    const justificadas =
      registrosFiltrados.filter(
        (item) =>
          item.frequencia
            ?.status ===
          "justificada"
      ).length;

    const canceladas =
      registrosFiltrados.filter(
        (item) =>
          item.frequencia
            ?.status ===
          "cancelada"
      ).length;

    const percentual =
      calcularPercentual(
        presentes,
        faltas,
        justificadas
      );

    return {
      previstas,
      registradas,
      presentes,
      faltas,
      justificadas,
      canceladas,
      percentual,
    };
  }, [registrosFiltrados]);

  const instrumentos = useMemo(
    () =>
      Array.from(
        new Set(
          aulas.map(
            (aula) =>
              aula.instrumento
          )
        )
      ).sort(),
    [aulas]
  );

  const alunosOrdenados = useMemo(
    () =>
      [...alunos].sort(
        (a, b) =>
          a.nome.localeCompare(
            b.nome
          )
      ),
    [alunos]
  );

  const professoresOrdenados =
    useMemo(
      () =>
        [...professores].sort(
          (a, b) =>
            a.nome.localeCompare(
              b.nome
            )
        ),
      [professores]
    );

  function limparFiltros() {
    setAlunoFiltro("");
    setInstrumentoFiltro("");
    setProfessorFiltro("");
    setStatusFiltro("todos");
    setBusca("");
    setDataInicio(
      primeiroDiaDoMesAtual()
    );
    setDataFim(hojeString());
  }

  function imprimirRelatorio() {
    window.print();
  }

  const filtrosAtivos =
    !!alunoFiltro ||
    !!instrumentoFiltro ||
    !!professorFiltro ||
    statusFiltro !== "todos" ||
    !!busca;

  return (
    <main className="min-h-dvh bg-[#121212] text-white print:bg-white print:text-black">

      <header className="border-b border-[#2c2c2c] bg-[#171717] print:hidden">
        <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

            <div className="flex items-center gap-3">

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#FDC700]/10 text-[#FDC700]">
                <BarChart3 size={22} />
              </div>

              <div>
                <h1 className="text-xl font-bold text-[#FDC700] sm:text-2xl">
                  Relatório de Frequência
                </h1>

                <p className="mt-1 text-sm text-gray-400">
                  Presenças e faltas dos alunos
                </p>
              </div>

            </div>

            <button
              type="button"
              onClick={
                imprimirRelatorio
              }
              className="flex h-10 items-center justify-center gap-2 rounded-lg bg-[#FDC700] px-4 text-sm font-semibold text-black transition hover:bg-[#e8b900]"
            >
              <Download
                size={16}
              />
              Imprimir relatório
            </button>

          </div>

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
                Selecione o período e refine o relatório.
              </p>
            </div>

            <button
              type="button"
              onClick={
                limparFiltros
              }
              className="flex items-center gap-2 rounded-lg border border-[#303030] px-3 py-2 text-xs text-gray-500 transition hover:bg-[#292929] hover:text-white"
            >
              <RotateCcw
                size={14}
              />
              Limpar
            </button>

          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">

            <div>
              <label className="mb-1.5 block text-xs text-gray-500">
                Data inicial
              </label>

              <input
                type="date"
                value={dataInicio}
                onChange={(event) =>
                  setDataInicio(
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
                value={dataFim}
                onChange={(event) =>
                  setDataFim(
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

                {alunosOrdenados.map(
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

            <div>
              <label className="mb-1.5 block text-xs text-gray-500">
                Instrumento
              </label>

              <select
                value={
                  instrumentoFiltro
                }
                onChange={(event) =>
                  setInstrumentoFiltro(
                    event.target.value
                  )
                }
                className="h-10 w-full rounded-lg border border-[#303030] bg-[#151515] px-3 text-sm text-white outline-none focus:border-[#FDC700]"
              >
                <option value="">
                  Todos os instrumentos
                </option>

                {instrumentos.map(
                  (instrumento) => (
                    <option
                      key={instrumento}
                      value={
                        instrumento
                      }
                    >
                      {instrumento}
                    </option>
                  )
                )}
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-xs text-gray-500">
                Professor
              </label>

              <select
                value={
                  professorFiltro
                }
                onChange={(event) =>
                  setProfessorFiltro(
                    event.target.value
                  )
                }
                className="h-10 w-full rounded-lg border border-[#303030] bg-[#151515] px-3 text-sm text-white outline-none focus:border-[#FDC700]"
              >
                <option value="">
                  Todos os professores
                </option>

                {professoresOrdenados.map(
                  (professor) => (
                    <option
                      key={professor.id}
                      value={
                        professor.id
                      }
                    >
                      {professor.nome}
                    </option>
                  )
                )}
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
                      .value as FiltroStatus
                  )
                }
                className="h-10 w-full rounded-lg border border-[#303030] bg-[#151515] px-3 text-sm text-white outline-none focus:border-[#FDC700]"
              >
                <option value="todos">
                  Todas
                </option>
                <option value="presente">
                  Presentes
                </option>
                <option value="falta">
                  Faltas
                </option>
                <option value="justificada">
                  Justificadas
                </option>
                <option value="cancelada">
                  Canceladas
                </option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-xs text-gray-500">
                Pesquisa
              </label>

              <div className="relative">
                <Search
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600"
                />

                <input
                  type="text"
                  value={busca}
                  onChange={(event) =>
                    setBusca(
                      event.target
                        .value
                    )
                  }
                  placeholder="Pesquisar aluno, professor ou instrumento..."
                  className="h-10 w-full rounded-lg border border-[#303030] bg-[#151515] pl-9 pr-3 text-sm text-white outline-none placeholder:text-gray-700 focus:border-[#FDC700]"
                />
              </div>
            </div>

          </div>

          {dataInicio >
            dataFim && (
            <div className="mt-3 flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-400">
              <CircleAlert
                size={14}
              />
              A data inicial não pode ser posterior à data final.
            </div>
          )}

        </div>

        {/* Cabeçalho para impressão */}

        <div className="mb-5 hidden print:block">
          <h1 className="text-2xl font-bold">
            Relatório de Frequência
          </h1>

          <p className="mt-1 text-sm">
            Período:{" "}
            {formatarDataLonga(
              dataInicio
            )}{" "}
            até{" "}
            {formatarDataLonga(
              dataFim
            )}
          </p>

          {filtrosAtivos && (
            <p className="mt-1 text-xs">
              Filtros aplicados:
              {alunoFiltro &&
                ` aluno ${
                  buscarAluno(
                    alunoFiltro
                  )?.nome ?? ""
                }`}
              {instrumentoFiltro &&
                ` • instrumento ${instrumentoFiltro}`}
              {professorFiltro &&
                ` • professor ${
                  buscarProfessor(
                    professorFiltro
                  )?.nome ?? ""
                }`}
              {statusFiltro !==
                "todos" &&
                ` • status ${
                  statusInfo[
                    statusFiltro
                  ].label
                }`}
              {busca &&
                ` • pesquisa "${busca}"`}
            </p>
          )}
        </div>

        {/* Resumo */}

        <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">

          <div className="rounded-xl border border-[#303030] bg-[#1c1c1c] p-4 print:border-gray-300 print:bg-white">
            <p className="text-xs text-gray-500">
              Aulas previstas
            </p>
            <p className="mt-1 text-xl font-bold text-white print:text-black">
              {resumo.previstas}
            </p>
          </div>

          <div className="rounded-xl border border-[#303030] bg-[#1c1c1c] p-4 print:border-gray-300 print:bg-white">
            <p className="text-xs text-gray-500">
              Registradas
            </p>
            <p className="mt-1 text-xl font-bold text-white print:text-black">
              {resumo.registradas}
            </p>
          </div>

          <div className="rounded-xl border border-[#303030] bg-[#1c1c1c] p-4 print:border-gray-300 print:bg-white">
            <p className="text-xs text-gray-500">
              Presentes
            </p>
            <p className="mt-1 text-xl font-bold text-green-400 print:text-black">
              {resumo.presentes}
            </p>
          </div>

          <div className="rounded-xl border border-[#303030] bg-[#1c1c1c] p-4 print:border-gray-300 print:bg-white">
            <p className="text-xs text-gray-500">
              Faltas
            </p>
            <p className="mt-1 text-xl font-bold text-red-400 print:text-black">
              {resumo.faltas}
            </p>
          </div>

          <div className="rounded-xl border border-[#303030] bg-[#1c1c1c] p-4 print:border-gray-300 print:bg-white">
            <p className="text-xs text-gray-500">
              Justificadas
            </p>
            <p className="mt-1 text-xl font-bold text-orange-400 print:text-black">
              {resumo.justificadas}
            </p>
          </div>

          <div className="rounded-xl border border-[#303030] bg-[#1c1c1c] p-4 print:border-gray-300 print:bg-white">
            <p className="text-xs text-gray-500">
              Frequência
            </p>
            <p className="mt-1 text-xl font-bold text-[#FDC700] print:text-black">
              {resumo.percentual}%
            </p>
          </div>

        </div>

        {/* Lista */}

        <div className="overflow-hidden rounded-2xl border border-[#303030] bg-[#1c1c1c] print:rounded-none print:border-gray-300 print:bg-white">

          <div className="flex items-center justify-between gap-3 border-b border-[#303030] px-4 py-4 print:border-gray-300">
            <div>
              <h2 className="text-sm font-semibold text-white print:text-black">
                Detalhamento
              </h2>

              <p className="mt-1 text-xs text-gray-600">
                {registrosFiltrados.length} registro(s) no período
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                carregarDados(true)
              }
              disabled={atualizando}
              className="flex h-9 items-center gap-2 rounded-lg border border-[#303030] px-3 text-xs text-gray-500 transition hover:bg-[#292929] hover:text-white disabled:opacity-50 print:hidden"
            >
              <RotateCcw
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
              <RotateCcw
                size={24}
                className="mx-auto animate-spin text-[#FDC700]"
              />
              <p className="mt-3 text-sm text-gray-500">
                Carregando relatório...
              </p>
            </div>
          ) : registrosFiltrados.length ===
            0 ? (
            <div className="p-12 text-center">
              <FileText
                size={32}
                className="mx-auto text-gray-700 print:text-gray-400"
              />

              <p className="mt-3 text-sm text-gray-400 print:text-gray-700">
                Nenhum registro encontrado.
              </p>

              <p className="mt-1 text-xs text-gray-600 print:text-gray-500">
                Tente alterar o período ou os filtros.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto print:overflow-visible">

              <table className="w-full min-w-[900px] print:min-w-0 print:w-full print:table-fixed">

                <thead className="border-b border-[#303030] bg-[#181818] print:border-gray-300 print:bg-gray-100">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 print:w-[14%] print:px-2 print:py-2 print:text-[9px]">
                      Data
                    </th>

                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 print:w-[10%] print:px-2 print:py-2 print:text-[9px]">
                      Horário
                    </th>

                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 print:w-[18%] print:px-2 print:py-2 print:text-[9px]">
                      Aluno
                    </th>

                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 print:w-[17%] print:px-2 print:py-2 print:text-[9px]">
                      Instrumento
                    </th>

                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 print:w-[23%] print:px-2 print:py-2 print:text-[9px]">
                      Professor
                    </th>

                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 print:w-[9%] print:px-2 print:py-2 print:text-[9px]">
                      Tipo
                    </th>

                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 print:w-[14%] print:px-2 print:py-2 print:text-[9px]">
                      Status
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-[#292929] print:divide-gray-300">

                  {registrosFiltrados.map(
                    (registro) => {
                      const aluno =
                        buscarAluno(
                          registro.alunoId
                        );

                      const professor =
                        buscarProfessor(
                          registro.professorId
                        );

                      const status =
                        registro.frequencia
                          ?.status;

                      return (
                        <tr
                          key={
                            registro.chave
                          }
                          className="hover:bg-[#202020] print:hover:bg-transparent"
                        >

                          <td className="px-4 py-3 text-sm text-gray-300 print:px-2 print:py-2 print:text-[10px] print:text-black">
                            {formatarData(
                              registro.data
                            )}
                          </td>

                          <td className="px-4 py-3 text-sm font-medium text-white print:px-2 print:py-2 print:text-[10px] print:text-black">
                            {registro.horario}
                          </td>

                          <td className="px-4 py-3 text-sm text-gray-300 print:px-2 print:py-2 print:text-[10px] print:text-black">
                            {aluno?.nome ??
                              "Aluno não encontrado"}
                          </td>

                          <td className="px-4 py-3 text-sm text-gray-400 print:px-2 print:py-2 print:text-[10px] print:text-black">
                            {nomeInstrumento(
                              registro.instrumento
                            )}
                          </td>

                          <td className="px-4 py-3 text-sm text-gray-400 print:px-2 print:py-2 print:text-[10px] print:text-black">
                            {professor?.nome ??
                              "Professor não encontrado"}
                          </td>

                          <td className="px-4 py-3 print:px-2 print:py-2 print:text-[10px]">
                            <span
                              className={`rounded-full px-2.5 py-1 text-[10px] ${
                                registro.tipo ===
                                "reposicao"
                                  ? "bg-blue-500/10 text-blue-400 print:bg-transparent print:text-black"
                                  : "bg-[#FDC700]/10 text-[#FDC700] print:bg-transparent print:text-black"
                              }`}
                            >
                              {registro.tipo ===
                              "reposicao"
                                ? "Reposição"
                                : "Aula"}
                            </span>
                          </td>

                          <td className="px-4 py-3 print:px-2 print:py-2 print:text-[10px]">
                            {status ? (
                              <span
                                className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-medium ${statusInfo[status].className} print:border-gray-400 print:bg-transparent print:text-black`}
                              >
                                {statusInfo[
                                  status
                                ].label}
                              </span>
                            ) : (
                              <span className="inline-flex rounded-full border border-gray-500/30 bg-gray-500/10 px-2.5 py-1 text-[10px] text-gray-500 print:border-gray-400 print:bg-transparent print:text-gray-600">
                                Não registrada
                              </span>
                            )}
                          </td>

                        </tr>
                      );
                    }
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
