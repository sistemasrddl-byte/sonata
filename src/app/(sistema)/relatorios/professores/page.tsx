"use client";

import {
  BarChart3,
  Download,
  FileText,
  RefreshCw,
  RotateCcw,
  Search,
  Users,
} from "lucide-react";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import { listarAulas } from "@/services/aula.service";
import { listarAlunos } from "@/services/aluno.service";
import { listarProfessores } from "@/services/professor.service";

import { Aula } from "@/types/aula";
import { Aluno } from "@/types/aluno";
import { Professor } from "@/types/professor";

type FiltroStatus =
  | "todos"
  | "Ativo"
  | "Inativo";

interface ProfessorRelatorio {
  professor: Professor;
  instrumentos: string[];
  alunosIds: string[];
  aulas: Aula[];
}

function nomeInstrumento(
  instrumento: Aula["instrumento"]
) {
  return instrumento;
}

export default function RelatorioProfessoresPage() {
  const [professores, setProfessores] =
    useState<Professor[]>([]);

  const [alunos, setAlunos] =
    useState<Aluno[]>([]);

  const [aulas, setAulas] =
    useState<Aula[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [atualizando, setAtualizando] =
    useState(false);

  const [busca, setBusca] =
    useState("");

  const [instrumentoFiltro, setInstrumentoFiltro] =
    useState("");

  const [statusFiltro, setStatusFiltro] =
    useState<FiltroStatus>("todos");

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
        professoresData,
        alunosData,
        aulasData,
      ] = await Promise.all([
        listarProfessores(),
        listarAlunos(),
        listarAulas(),
      ]);

      /*
       * Compatibilidade com registros antigos:
       * alguns professores podem estar salvos no
       * Firestore dentro de { professor: {...} },
       * enquanto outros podem estar no formato plano.
       *
       * O relatório normaliza os dois formatos para
       * que nome, status, telefone e e-mail apareçam
       * corretamente sem alterar os dados do banco.
       */
      const professoresNormalizados =
        professoresData.map((registro) => {
          const bruto =
            registro as Professor & {
              professor?: Partial<Professor>;
            };

          const dados =
            bruto.professor ?? bruto;

          return {
            ...dados,
            id:
              registro.id ??
              dados.id,
            createdAt:
              registro.createdAt ??
              dados.createdAt,
            updatedAt:
              registro.updatedAt ??
              dados.updatedAt,
          } as Professor;
        });

      setProfessores(
        professoresNormalizados
      );

      setAlunos(alunosData);
      setAulas(aulasData);
    } catch (error) {
      console.error(
        "Erro ao carregar relatório de professores:",
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

  const instrumentos =
    useMemo(
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

  const dadosProfessores =
    useMemo<ProfessorRelatorio[]>(
      () =>
        professores.map(
          (professor) => {
            const aulasDoProfessor =
              aulas.filter(
                (aula) =>
                  aula.professorId ===
                  professor.id &&
                  aula.ativo
              );

            const alunosIds =
              Array.from(
                new Set(
                  aulasDoProfessor.map(
                    (aula) =>
                      aula.alunoId
                  )
                )
              );

            const instrumentos =
              Array.from(
                new Set(
                  aulasDoProfessor.map(
                    (aula) =>
                      aula.instrumento
                  )
                )
              ).sort();

            return {
              professor,
              instrumentos,
              alunosIds,
              aulas: aulasDoProfessor,
            };
          }
        ),
      [professores, aulas]
    );

  const professoresFiltrados =
    useMemo(() => {
      const termo =
        busca.trim().toLowerCase();

      return dadosProfessores
        .filter((item) => {
          const professor =
            item.professor;

          if (
            statusFiltro !==
              "todos" &&
            professor.status !==
              statusFiltro
          ) {
            return false;
          }

          if (
            instrumentoFiltro &&
            !item.instrumentos.includes(
              instrumentoFiltro
            )
          ) {
            return false;
          }

          if (!termo) {
            return true;
          }

          return (
            professor.nome
              .toLowerCase()
              .includes(termo) ||
            item.instrumentos.some(
              (instrumento) =>
                instrumento
                  .toLowerCase()
                  .includes(termo)
            )
          );
        })
        .sort((a, b) =>
          a.professor.nome.localeCompare(
            b.professor.nome
          )
        );
    }, [
      dadosProfessores,
      busca,
      instrumentoFiltro,
      statusFiltro,
    ]);

  const resumo = useMemo(() => {
    const ativos =
      professores.filter(
        (professor) =>
          professor.status ===
          "Ativo"
      ).length;

    const inativos =
      professores.filter(
        (professor) =>
          professor.status ===
          "Inativo"
      ).length;

    const aulasAtivas =
      aulas.filter(
        (aula) => aula.ativo
      );

    const alunosComProfessor =
      new Set(
        aulasAtivas.map(
          (aula) =>
            aula.alunoId
        )
      ).size;

    return {
      total: professores.length,
      ativos,
      inativos,
      aulasAtivas:
        aulasAtivas.length,
      alunosComProfessor,
    };
  }, [professores, aulas]);

  function buscarAluno(id: string) {
    return alunos.find(
      (aluno) =>
        aluno.id === id
    );
  }

  function limparFiltros() {
    setBusca("");
    setInstrumentoFiltro("");
    setStatusFiltro("todos");
  }

  function imprimirRelatorio() {
    window.print();
  }

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
                  Relatório de Professores
                </h1>

                <p className="mt-1 text-sm text-gray-400">
                  Professores e distribuição das aulas
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
                Pesquise e filtre os professores por nome ou instrumento.
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

          <div className="grid gap-3 sm:grid-cols-3">

            <div className="sm:col-span-1">
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
                      event.target.value
                    )
                  }
                  placeholder="Nome ou instrumento..."
                  className="h-10 w-full rounded-lg border border-[#303030] bg-[#151515] pl-9 pr-3 text-sm text-white outline-none placeholder:text-gray-700 focus:border-[#FDC700]"
                />
              </div>
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
                Situação
              </label>

              <select
                value={
                  statusFiltro
                }
                onChange={(event) =>
                  setStatusFiltro(
                    event.target
                      .value as FiltroStatus
                  )
                }
                className="h-10 w-full rounded-lg border border-[#303030] bg-[#151515] px-3 text-sm text-white outline-none focus:border-[#FDC700]"
              >
                <option value="todos">
                  Todos
                </option>
                <option value="Ativo">
                  Ativos
                </option>
                <option value="Inativo">
                  Inativos
                </option>
              </select>
            </div>

          </div>

        </div>

        <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">

          <div className="rounded-xl border border-[#303030] bg-[#1c1c1c] p-4 print:border-gray-300 print:bg-white">
            <p className="text-xs text-gray-500">
              Total de professores
            </p>

            <p className="mt-1 text-xl font-bold text-white print:text-black">
              {resumo.total}
            </p>
          </div>

          <div className="rounded-xl border border-[#303030] bg-[#1c1c1c] p-4 print:border-gray-300 print:bg-white">
            <p className="text-xs text-gray-500">
              Ativos
            </p>

            <p className="mt-1 text-xl font-bold text-green-400 print:text-black">
              {resumo.ativos}
            </p>
          </div>

          <div className="rounded-xl border border-[#303030] bg-[#1c1c1c] p-4 print:border-gray-300 print:bg-white">
            <p className="text-xs text-gray-500">
              Inativos
            </p>

            <p className="mt-1 text-xl font-bold text-red-400 print:text-black">
              {resumo.inativos}
            </p>
          </div>

          <div className="rounded-xl border border-[#303030] bg-[#1c1c1c] p-4 print:border-gray-300 print:bg-white">
            <p className="text-xs text-gray-500">
              Aulas cadastradas ativas
            </p>

            <p className="mt-1 text-xl font-bold text-[#FDC700] print:text-black">
              {resumo.aulasAtivas}
            </p>
          </div>

        </div>

        <div className="mb-5 hidden print:block">
          <h1 className="text-2xl font-bold">
            Relatório de Professores
          </h1>

          <p className="mt-1 text-sm">
            Professores no resultado:{" "}
            {professoresFiltrados.length}
          </p>
        </div>

        <div className="overflow-hidden rounded-2xl border border-[#303030] bg-[#1c1c1c] print:border-gray-300 print:bg-white">

          <div className="flex items-center justify-between gap-3 border-b border-[#303030] px-4 py-4 print:border-gray-300">

            <div>
              <h2 className="text-sm font-semibold text-white print:text-black">
                Lista de professores
              </h2>

              <p className="mt-1 text-xs text-gray-600">
                {professoresFiltrados.length} professor(es) encontrado(s)
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                carregarDados(true)
              }
              disabled={
                atualizando
              }
              className="flex h-9 items-center gap-2 rounded-lg border border-[#303030] px-3 text-xs text-gray-500 transition hover:bg-[#292929] hover:text-white disabled:opacity-50 print:hidden"
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
          ) : professoresFiltrados.length ===
            0 ? (
            <div className="p-12 text-center">
              <FileText
                size={32}
                className="mx-auto text-gray-700 print:text-gray-400"
              />

              <p className="mt-3 text-sm text-gray-400 print:text-gray-700">
                Nenhum professor encontrado.
              </p>

              <p className="mt-1 text-xs text-gray-600 print:text-gray-500">
                Tente alterar os filtros.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">

              <table className="w-full min-w-[650px]">

                <thead className="border-b border-[#303030] bg-[#181818] print:border-gray-300 print:bg-gray-100">

                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">
                      Professor
                    </th>

                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">
                      Instrumentos
                    </th>

                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">
                      Alunos
                    </th>

                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">
                      Aulas
                    </th>

                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">
                      Status
                    </th>
                  </tr>

                </thead>

                <tbody className="divide-y divide-[#292929] print:divide-gray-300">

                  {professoresFiltrados.map(
                    (item) => {

                      const professor =
                        item.professor;

                      return (
                        <tr
                          key={
                            professor.id
                          }
                          className="hover:bg-[#202020] print:hover:bg-transparent"
                        >

                          <td className="px-4 py-3 text-sm font-medium text-white print:text-black">
                            {professor.nome}
                          </td>

                          <td className="px-4 py-3">
                            <div className="flex flex-wrap gap-1.5">

                              {item.instrumentos.length >
                              0 ? (
                                item.instrumentos.map(
                                  (
                                    instrumento
                                  ) => (
                                    <span
                                      key={
                                        instrumento
                                      }
                                      className="rounded-full bg-[#FDC700]/10 px-2.5 py-1 text-[10px] text-[#FDC700] print:border print:border-gray-400 print:bg-transparent print:text-black"
                                    >
                                      {nomeInstrumento(
                                        instrumento as Aula["instrumento"]
                                      )}
                                    </span>
                                  )
                                )
                              ) : (
                                <span className="text-xs text-gray-600">
                                  Sem aulas
                                </span>
                              )}

                            </div>
                          </td>

                          <td className="px-4 py-3 text-sm text-gray-300 print:text-black">
                            {item.alunosIds.length}
                          </td>

                          <td className="px-4 py-3 text-sm text-gray-300 print:text-black">
                            {item.aulas.length}
                          </td>

                          <td className="px-4 py-3">

                            <span
                              className={`inline-flex min-w-[68px] justify-center rounded-full border px-2.5 py-1 text-[10px] font-semibold ${
                                professor.status ===
                                "Ativo"
                                  ? "border-green-500/30 bg-green-500/10 text-green-400 print:border-gray-400 print:bg-transparent print:text-black"
                                  : "border-red-500/30 bg-red-500/10 text-red-400 print:border-gray-400 print:bg-transparent print:text-black"
                              }`}
                            >
                              {professor.status ===
                              "Ativo"
                                ? "Ativo"
                                : "Inativo"}
                            </span>

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

        {professoresFiltrados.length > 0 && (
          <div className="mt-4 rounded-xl border border-[#303030] bg-[#1c1c1c] p-4 print:border-gray-300 print:bg-white">

            <div className="flex items-center gap-3">

              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#FDC700]/10 text-[#FDC700]">
                <Users
                  size={17}
                />
              </div>

              <div>
                <p className="text-sm font-medium text-white print:text-black">
                  Alunos com professor
                </p>

                <p className="mt-0.5 text-xs text-gray-600">
                  Quantidade de alunos que possuem pelo menos uma aula ativa cadastrada.
                </p>
              </div>

              <p className="ml-auto text-lg font-bold text-[#FDC700] print:text-black">
                {resumo.alunosComProfessor}
              </p>

            </div>

          </div>
        )}

      </div>
    </main>
  );
}
