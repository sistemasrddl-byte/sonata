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

import { listarAulas } from "@/services/aula.service";
import { listarAlunos } from "@/services/aluno.service";
import { listarProfessores } from "@/services/professor.service";
import { listarReposicoes } from "@/services/reposicao.service";

import { Aula } from "@/types/aula";
import { Aluno } from "@/types/aluno";
import { Professor } from "@/types/professor";
import { Reposicao } from "@/types/reposicao";

type TipoRegistro = "todos" | "recorrente" | "reposicao";
type StatusRegistro = "todos" | "Ativa" | "Inativa";

interface RegistroAula {
  id: string;
  tipo: "recorrente" | "reposicao";
  alunoId: string;
  professorId: string;
  instrumento: Aula["instrumento"];
  horario: string;
  diaSemana?: Aula["diaSemana"];
  data?: string;
  ativo: boolean;
}

const nomesDias: Record<string, string> = {
  domingo: "Domingo",
  segunda: "Segunda-feira",
  terça: "Terça-feira",
  quarta: "Quarta-feira",
  quinta: "Quinta-feira",
  sexta: "Sexta-feira",
  sábado: "Sábado",
};

function formatarData(data?: string) {
  if (!data) return "-";
  const [ano, mes, dia] = data.split("-");
  return `${dia}/${mes}/${ano}`;
}

export default function RelatorioAulasPage() {
  const [aulas, setAulas] = useState<Aula[]>([]);
  const [reposicoes, setReposicoes] = useState<Reposicao[]>([]);
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [professores, setProfessores] = useState<Professor[]>([]);

  const [loading, setLoading] = useState(true);
  const [atualizando, setAtualizando] = useState(false);

  const [busca, setBusca] = useState("");
  const [instrumentoFiltro, setInstrumentoFiltro] = useState("");
  const [tipoFiltro, setTipoFiltro] = useState<TipoRegistro>("todos");
  const [statusFiltro, setStatusFiltro] =
    useState<StatusRegistro>("todos");

  async function carregarDados(silencioso = false) {
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
      ] = await Promise.all([
        listarAulas(),
        listarReposicoes(),
        listarAlunos(),
        listarProfessores(),
      ]);

      setAulas(aulasData);
      setReposicoes(reposicoesData);
      setAlunos(alunosData);
      setProfessores(professoresData);
    } catch (error) {
      console.error("Erro ao carregar relatório de aulas:", error);
    } finally {
      setLoading(false);
      setAtualizando(false);
    }
  }

  useEffect(() => {
    carregarDados();
  }, []);

  const registros = useMemo<RegistroAula[]>(() => {
    const recorrentes: RegistroAula[] = aulas.map((aula) => ({
      id: aula.id,
      tipo: "recorrente",
      alunoId: aula.alunoId,
      professorId: aula.professorId,
      instrumento: aula.instrumento,
      horario: aula.horario,
      diaSemana: aula.diaSemana,
      ativo: aula.ativo,
    }));

    const repos: RegistroAula[] = reposicoes.map((reposicao) => ({
      id: reposicao.id,
      tipo: "reposicao",
      alunoId: reposicao.alunoId,
      professorId: reposicao.professorId,
      instrumento: reposicao.instrumento,
      horario: reposicao.horario,
      data: reposicao.data,
      ativo: reposicao.ativo,
    }));

    return [...recorrentes, ...repos];
  }, [aulas, reposicoes]);

  const instrumentos = useMemo(
    () =>
      Array.from(
        new Set(registros.map((registro) => registro.instrumento))
      ).sort(),
    [registros]
  );

  const registrosFiltrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();

    return [...registros]
      .filter((registro) => {
        if (
          tipoFiltro !== "todos" &&
          registro.tipo !== tipoFiltro
        ) {
          return false;
        }

        if (
          statusFiltro !== "todos" &&
          (registro.ativo ? "Ativa" : "Inativa") !== statusFiltro
        ) {
          return false;
        }

        if (
          instrumentoFiltro &&
          registro.instrumento !== instrumentoFiltro
        ) {
          return false;
        }

        if (!termo) return true;

        const aluno = alunos.find(
          (item) => item.id === registro.alunoId
        );

        const professor = professores.find(
          (item) => item.id === registro.professorId
        );

        return (
          aluno?.nome.toLowerCase().includes(termo) ||
          professor?.nome.toLowerCase().includes(termo) ||
          registro.instrumento.toLowerCase().includes(termo) ||
          registro.horario.includes(termo) ||
          (registro.diaSemana &&
            nomesDias[registro.diaSemana]
              .toLowerCase()
              .includes(termo))
        );
      })
      .sort((a, b) => {
        if (a.tipo !== b.tipo) {
          return a.tipo === "recorrente" ? -1 : 1;
        }

        if (a.tipo === "reposicao" && b.tipo === "reposicao") {
          return (
            (a.data ?? "").localeCompare(b.data ?? "") ||
            a.horario.localeCompare(b.horario)
          );
        }

        return (
          (a.diaSemana ?? "").localeCompare(b.diaSemana ?? "") ||
          a.horario.localeCompare(b.horario)
        );
      });
  }, [
    registros,
    busca,
    instrumentoFiltro,
    tipoFiltro,
    statusFiltro,
    alunos,
    professores,
  ]);

  const resumo = useMemo(() => {
    const recorrentes = registros.filter(
      (registro) => registro.tipo === "recorrente"
    );

    const repos = registros.filter(
      (registro) => registro.tipo === "reposicao"
    );

    return {
      total: registros.length,
      recorrentes: recorrentes.length,
      reposicoes: repos.length,
      ativas: registros.filter((registro) => registro.ativo).length,
      inativas: registros.filter((registro) => !registro.ativo).length,
    };
  }, [registros]);

  function nomeAluno(id: string) {
    return alunos.find((aluno) => aluno.id === id)?.nome ?? "Aluno não encontrado";
  }

  function nomeProfessor(id: string) {
    return (
      professores.find((professor) => professor.id === id)?.nome ??
      "Professor não encontrado"
    );
  }

  function limparFiltros() {
    setBusca("");
    setInstrumentoFiltro("");
    setTipoFiltro("todos");
    setStatusFiltro("todos");
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
                Relatório de Aulas
              </h1>
              <p className="mt-1 text-sm text-gray-400">
                Aulas recorrentes e reposições cadastradas
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => window.print()}
            className="flex h-10 items-center justify-center gap-2 rounded-lg bg-[#FDC700] px-4 text-sm font-semibold text-black hover:bg-[#e8b900]"
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
                Pesquise e filtre as aulas cadastradas.
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

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="lg:col-span-1">
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
                  onChange={(event) => setBusca(event.target.value)}
                  placeholder="Aluno, professor, instrumento..."
                  className="h-10 w-full rounded-lg border border-[#303030] bg-[#151515] pl-9 pr-3 text-sm text-white outline-none placeholder:text-gray-700 focus:border-[#FDC700]"
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs text-gray-500">
                Instrumento
              </label>
              <select
                value={instrumentoFiltro}
                onChange={(event) => setInstrumentoFiltro(event.target.value)}
                className="h-10 w-full rounded-lg border border-[#303030] bg-[#151515] px-3 text-sm text-white outline-none focus:border-[#FDC700]"
              >
                <option value="">Todos os instrumentos</option>
                {instrumentos.map((instrumento) => (
                  <option key={instrumento} value={instrumento}>
                    {instrumento}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-xs text-gray-500">
                Tipo
              </label>
              <select
                value={tipoFiltro}
                onChange={(event) =>
                  setTipoFiltro(event.target.value as TipoRegistro)
                }
                className="h-10 w-full rounded-lg border border-[#303030] bg-[#151515] px-3 text-sm text-white outline-none focus:border-[#FDC700]"
              >
                <option value="todos">Todos</option>
                <option value="recorrente">Aulas recorrentes</option>
                <option value="reposicao">Reposições</option>
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-xs text-gray-500">
                Situação
              </label>
              <select
                value={statusFiltro}
                onChange={(event) =>
                  setStatusFiltro(event.target.value as StatusRegistro)
                }
                className="h-10 w-full rounded-lg border border-[#303030] bg-[#151515] px-3 text-sm text-white outline-none focus:border-[#FDC700]"
              >
                <option value="todos">Todas</option>
                <option value="Ativa">Ativas</option>
                <option value="Inativa">Inativas</option>
              </select>
            </div>
          </div>
        </div>

        <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-5">
          {[
            ["Total", resumo.total, "text-white"],
            ["Recorrentes", resumo.recorrentes, "text-[#FDC700]"],
            ["Reposições", resumo.reposicoes, "text-[#FDC700]"],
            ["Ativas", resumo.ativas, "text-green-400"],
            ["Inativas", resumo.inativas, "text-red-400"],
          ].map(([titulo, valor, classe]) => (
            <div
              key={String(titulo)}
              className="rounded-xl border border-[#303030] bg-[#1c1c1c] p-4 print:border-gray-300 print:bg-white"
            >
              <p className="text-xs text-gray-500">{titulo}</p>
              <p
                className={`mt-1 text-xl font-bold ${classe} print:text-black`}
              >
                {valor}
              </p>
            </div>
          ))}
        </div>

        <div className="mb-5 hidden print:block">
          <h1 className="text-2xl font-bold">Relatório de Aulas</h1>
          <p className="mt-1 text-sm">
            Registros no resultado: {registrosFiltrados.length}
          </p>
        </div>

        <div className="overflow-hidden rounded-2xl border border-[#303030] bg-[#1c1c1c] print:border-gray-300 print:bg-white">
          <div className="flex items-center justify-between gap-3 border-b border-[#303030] px-4 py-4 print:border-gray-300">
            <div>
              <h2 className="text-sm font-semibold text-white print:text-black">
                Lista de aulas
              </h2>
              <p className="mt-1 text-xs text-gray-600">
                {registrosFiltrados.length} registro(s) encontrado(s)
              </p>
            </div>

            <button
              type="button"
              onClick={() => carregarDados(true)}
              disabled={atualizando}
              className="flex h-9 items-center gap-2 rounded-lg border border-[#303030] px-3 text-xs text-gray-500 hover:bg-[#292929] hover:text-white disabled:opacity-50 print:hidden"
            >
              <RefreshCw
                size={14}
                className={atualizando ? "animate-spin" : ""}
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
          ) : registrosFiltrados.length === 0 ? (
            <div className="p-12 text-center">
              <FileText
                size={32}
                className="mx-auto text-gray-700"
              />
              <p className="mt-3 text-sm text-gray-400 print:text-gray-700">
                Nenhuma aula encontrada.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto print:overflow-visible">
              <table className="w-full min-w-[950px] print:min-w-0 print:w-full print:table-fixed">
                <thead className="border-b border-[#303030] bg-[#181818] print:border-gray-300 print:bg-gray-100">
                  <tr>
                    {[
                      "Data / Dia",
                      "Horário",
                      "Aluno",
                      "Professor",
                      "Instrumento",
                      "Tipo",
                      "Situação",
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
                  {registrosFiltrados.map((registro) => (
                    <tr
                      key={`${registro.tipo}-${registro.id}`}
                      className="hover:bg-[#202020] print:hover:bg-transparent"
                    >
                      <td className="break-words px-3 py-2 text-sm text-gray-300 print:text-black">
                        {registro.tipo === "reposicao"
                          ? formatarData(registro.data)
                          : nomesDias[registro.diaSemana ?? ""] ?? "-"}
                      </td>

                      <td className="break-words px-3 py-2 text-sm font-medium text-white print:text-black">
                        {registro.horario}
                      </td>

                      <td className="break-words px-3 py-2 text-sm text-gray-300 print:text-black">
                        {nomeAluno(registro.alunoId)}
                      </td>

                      <td className="break-words px-3 py-2 text-sm text-gray-300 print:text-black">
                        {nomeProfessor(registro.professorId)}
                      </td>

                      <td className="break-words px-3 py-2">
                        <span className="rounded-full bg-[#FDC700]/10 px-2.5 py-1 text-[10px] text-[#FDC700] print:border print:border-gray-400 print:bg-transparent print:text-black">
                          {registro.instrumento}
                        </span>
                      </td>

                      <td className="break-words px-3 py-2">
                        <span className="rounded-full border border-[#303030] px-2.5 py-1 text-[10px] text-gray-400 print:border-gray-400 print:text-black">
                          {registro.tipo === "reposicao"
                            ? "Reposição"
                            : "Recorrente"}
                        </span>
                      </td>

                      <td className="break-words px-3 py-2">
                        <span
                          className={`inline-flex min-w-[62px] justify-center rounded-full border px-2.5 py-1 text-[10px] font-semibold ${
                            registro.ativo
                              ? "border-green-500/30 bg-green-500/10 text-green-400 print:border-gray-400 print:bg-transparent print:text-black"
                              : "border-red-500/30 bg-red-500/10 text-red-400 print:border-gray-400 print:bg-transparent print:text-black"
                          }`}
                        >
                          {registro.ativo ? "Ativa" : "Inativa"}
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
