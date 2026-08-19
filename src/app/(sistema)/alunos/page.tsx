"use client";

import {
  Plus,
  RefreshCw,
  Search,
  Users,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import AlunoDialog from "@/components/alunos/AlunoDialog";
import AlunoTable from "@/components/alunos/AlunoTable";
import ConfirmDialog from "@/components/ui/ConfirmDialog";

import {
  excluirAluno,
  listarAlunos,
} from "@/services/aluno.service";

import { Aluno } from "@/types/aluno";

export default function AlunosPage() {
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const [dialogOpen, setDialogOpen] = useState(false);

  const [alunoSelecionado, setAlunoSelecionado] =
    useState<Aluno | null>(null);

  const [alunoParaExcluir, setAlunoParaExcluir] =
    useState<Aluno | null>(null);

  const [excluindoId, setExcluindoId] =
    useState<string | null>(null);

  async function carregarAlunos() {
    try {
      setLoading(true);

      const dados = await listarAlunos();

      setAlunos(dados);
    } catch (error) {
      console.error(
        "Erro ao carregar alunos:",
        error
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    carregarAlunos();
  }, []);

  const alunosFiltrados = useMemo(() => {
    const termo = search.trim().toLowerCase();

    if (!termo) {
      return alunos;
    }

    return alunos.filter((aluno) => {
      return (
        aluno.nome
          .toLowerCase()
          .includes(termo) ||
        aluno.responsavel
          .toLowerCase()
          .includes(termo)
      );
    });
  }, [alunos, search]);

  function handleNovo() {
    setAlunoSelecionado(null);
    setDialogOpen(true);
  }

  function handleEdit(aluno: Aluno) {
    setAlunoSelecionado(aluno);
    setDialogOpen(true);
  }

  function handleDelete(aluno: Aluno) {
    setAlunoParaExcluir(aluno);
  }

  async function confirmarExclusaoAluno() {
    if (!alunoParaExcluir) {
      return;
    }

    try {
      setExcluindoId(alunoParaExcluir.id);
      await excluirAluno(alunoParaExcluir.id);
      setAlunoParaExcluir(null);
      await carregarAlunos();
    } catch (error) {
      console.error(error);
      alert("Não foi possível excluir o aluno.");
    } finally {
      setExcluindoId(null);
    }
  }

  return (
    <main className="min-h-dvh bg-[#121212] text-white">
      <header className="border-b border-[#2c2c2c] bg-[#171717]">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-5 sm:px-6 lg:px-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-xl font-bold text-[#FDC700] sm:text-2xl">
                Alunos
              </h1>

              <p className="mt-1 text-sm text-gray-400">
                Gerencie os alunos da escola.
              </p>
            </div>

            <button
              type="button"
              onClick={handleNovo}
              className="flex h-10 shrink-0 items-center gap-2 rounded-lg bg-[#FDC700] px-4 text-sm font-bold text-black transition hover:bg-[#e6b500]"
            >
              <Plus size={18} />

              <span className="hidden sm:inline">
                Novo aluno
              </span>

              <span className="sm:hidden">
                Novo
              </span>
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
        {/* Resumo */}
        <div className="mb-5 rounded-xl border border-[#303030] bg-[#1c1c1c] p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#FDC700]/10">
              <Users
                size={20}
                className="text-[#FDC700]"
              />
            </div>

            <div>
              <p className="text-xs text-gray-500">
                Alunos cadastrados
              </p>

              <p className="text-xl font-bold">
                {alunos.length}
              </p>
            </div>
          </div>
        </div>

        {/* Busca */}
        <div className="mb-5 flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
            />

            <input
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Buscar por aluno ou responsável..."
              className="h-11 w-full rounded-lg border border-[#3a3a3a] bg-[#1c1c1c] pl-10 pr-4 text-sm text-white outline-none focus:border-[#FDC700]"
            />
          </div>

          <button
            type="button"
            onClick={carregarAlunos}
            disabled={loading}
            className="flex h-11 items-center justify-center gap-2 rounded-lg border border-[#3a3a3a] bg-[#1c1c1c] px-4 text-sm text-gray-300 hover:bg-[#252525] disabled:opacity-50"
          >
            <RefreshCw
              size={17}
              className={
                loading ? "animate-spin" : ""
              }
            />

            Atualizar
          </button>
        </div>

        {/* Lista */}
        {loading ? (
          <div className="rounded-xl border border-[#303030] bg-[#1c1c1c] px-5 py-12 text-center">
            <RefreshCw
              size={24}
              className="mx-auto animate-spin text-[#FDC700]"
            />

            <p className="mt-3 text-sm text-gray-400">
              Carregando alunos...
            </p>
          </div>
        ) : (
          <AlunoTable
            alunos={alunosFiltrados}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        )}
      </div>

      <AlunoDialog
        open={dialogOpen}
        aluno={alunoSelecionado}
        onClose={() => setDialogOpen(false)}
        onSaved={carregarAlunos}
      />

      <ConfirmDialog
        open={Boolean(alunoParaExcluir)}
        title="Excluir aluno"
        description={
          alunoParaExcluir
            ? `Deseja realmente excluir o aluno "${alunoParaExcluir.nome}"? Esta ação não poderá ser desfeita.`
            : ""
        }
        confirmText="Excluir"
        cancelText="Cancelar"
        loading={Boolean(excluindoId)}
        onCancel={() => setAlunoParaExcluir(null)}
        onConfirm={confirmarExclusaoAluno}
      />
    </main>
  );
}