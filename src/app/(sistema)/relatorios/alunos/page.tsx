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
import { Aluno } from "@/types/aluno";

function formatarData(data: string) {
  if (!data) return "-";
  const [ano, mes, dia] = data.split("-");
  return `${dia}/${mes}/${ano}`;
}

function calcularIdade(data: string) {
  if (!data) return "-";
  const [ano, mes, dia] = data.split("-").map(Number);
  const hoje = new Date();
  let idade = hoje.getFullYear() - ano;
  if (
    hoje.getMonth() + 1 < mes ||
    (hoje.getMonth() + 1 === mes && hoje.getDate() < dia)
  ) idade--;
  return `${idade} anos`;
}

export default function RelatorioAlunosPage() {
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [loading, setLoading] = useState(true);
  const [atualizando, setAtualizando] = useState(false);
  const [busca, setBusca] = useState("");
  const [instrumentoFiltro, setInstrumentoFiltro] = useState("");

  async function carregarAlunos(silencioso = false) {
    try {
      silencioso ? setAtualizando(true) : setLoading(true);
      setAlunos(await listarAlunos());
    } catch (error) {
      console.error("Erro ao carregar relatório de alunos:", error);
    } finally {
      setLoading(false);
      setAtualizando(false);
    }
  }

  useEffect(() => {
    carregarAlunos();
  }, []);

  const instrumentos = useMemo(
    () =>
      Array.from(
        new Set(alunos.flatMap((aluno) => aluno.instrumentos))
      ).sort(),
    [alunos]
  );

  const alunosFiltrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();

    return [...alunos]
      .filter((aluno) => {
        if (
          instrumentoFiltro &&
          !aluno.instrumentos.includes(
            instrumentoFiltro as Aluno["instrumentos"][number]
          )
        ) return false;

        if (!termo) return true;

        return (
          aluno.nome.toLowerCase().includes(termo) ||
          aluno.responsavel.toLowerCase().includes(termo) ||
          aluno.instrumentos.some((i) =>
            i.toLowerCase().includes(termo)
          )
        );
      })
      .sort((a, b) => a.nome.localeCompare(b.nome));
  }, [alunos, busca, instrumentoFiltro]);

  function limparFiltros() {
    setBusca("");
    setInstrumentoFiltro("");
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
                Relatório de Alunos
              </h1>
              <p className="mt-1 text-sm text-gray-400">
                Alunos cadastrados na escola
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
              <h2 className="text-sm font-semibold text-white">Filtros</h2>
              <p className="mt-1 text-xs text-gray-600">
                Pesquise ou filtre por instrumento.
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

          <div className="grid gap-3 sm:grid-cols-2">
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
                  onChange={(e) => setBusca(e.target.value)}
                  placeholder="Aluno, responsável ou instrumento..."
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
                onChange={(e) => setInstrumentoFiltro(e.target.value)}
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
          </div>
        </div>

        <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-[#303030] bg-[#1c1c1c] p-4 print:border-gray-300 print:bg-white">
            <p className="text-xs text-gray-500">Total de alunos</p>
            <p className="mt-1 text-xl font-bold text-white print:text-black">
              {alunosFiltrados.length}
            </p>
          </div>

          {["Violão", "Teclado", "Bateria"].map((instrumento) => (
            <div
              key={instrumento}
              className="rounded-xl border border-[#303030] bg-[#1c1c1c] p-4 print:border-gray-300 print:bg-white"
            >
              <p className="text-xs text-gray-500">{instrumento}</p>
              <p className="mt-1 text-xl font-bold text-[#FDC700] print:text-black">
                {
                  alunos.filter((aluno) =>
                    aluno.instrumentos.includes(
                      instrumento as Aluno["instrumentos"][number]
                    )
                  ).length
                }
              </p>
            </div>
          ))}
        </div>

        <div className="mb-5 hidden print:block">
          <h1 className="text-2xl font-bold">Relatório de Alunos</h1>
          <p className="mt-1 text-sm">
            Total no resultado: {alunosFiltrados.length}
          </p>
        </div>

        <div className="overflow-hidden rounded-2xl border border-[#303030] bg-[#1c1c1c] print:border-gray-300 print:bg-white">
          <div className="flex items-center justify-between gap-3 border-b border-[#303030] px-4 py-4 print:border-gray-300">
            <div>
              <h2 className="text-sm font-semibold text-white print:text-black">
                Lista de alunos
              </h2>
              <p className="mt-1 text-xs text-gray-600">
                {alunosFiltrados.length} aluno(s) encontrado(s)
              </p>
            </div>

            <button
              type="button"
              onClick={() => carregarAlunos(true)}
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
          ) : alunosFiltrados.length === 0 ? (
            <div className="p-12 text-center">
              <FileText
                size={32}
                className="mx-auto text-gray-700"
              />
              <p className="mt-3 text-sm text-gray-400 print:text-gray-700">
                Nenhum aluno encontrado.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto print:overflow-visible">
              <table className="w-full min-w-[760px] print:min-w-0 print:w-full print:table-fixed">
                <thead className="border-b border-[#303030] bg-[#181818] print:border-gray-300 print:bg-gray-100">
                  <tr>
                    {["Nome", "Nascimento", "Idade", "Responsável", "Instrumentos"].map(
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
                  {alunosFiltrados.map((aluno) => (
                    <tr
                      key={aluno.id}
                      className="hover:bg-[#202020] print:hover:bg-transparent"
                    >
                      <td className="break-words px-3 py-2 text-sm font-medium text-white print:text-black">
                        {aluno.nome}
                      </td>
                      <td className="break-words px-3 py-2 text-sm text-gray-400 print:text-black">
                        {formatarData(aluno.dataNascimento)}
                      </td>
                      <td className="break-words px-3 py-2 text-sm text-gray-400 print:text-black">
                        {calcularIdade(aluno.dataNascimento)}
                      </td>
                      <td className="break-words px-3 py-2 text-sm text-gray-400 print:text-black">
                        {aluno.responsavel}
                      </td>
                      <td className="break-words px-3 py-2">
                        <div className="flex flex-wrap gap-1.5">
                          {aluno.instrumentos.map((instrumento) => (
                            <span
                              key={instrumento}
                              className="rounded-full bg-[#FDC700]/10 px-2.5 py-1 text-[10px] text-[#FDC700] print:border print:border-gray-400 print:bg-transparent print:text-black"
                            >
                              {instrumento}
                            </span>
                          ))}
                        </div>
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
