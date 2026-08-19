"use client";

import {
  Plus,
  RefreshCw,
  Search,
  Users,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import ProfessorDialog from "@/components/professores/ProfessorDialog";
import ProfessorTable from "@/components/professores/ProfessorTable";
import ConfirmDialog from "@/components/ui/ConfirmDialog";

import {
  excluirProfessor,
  listarProfessores,
} from "@/services/professor.service";

import { Professor } from "@/types/professor";

export default function ProfessoresPage() {
  const [professores, setProfessores] =
    useState<Professor[]>([]);

  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const [dialogOpen, setDialogOpen] =
    useState(false);

  const [professorSelecionado, setProfessorSelecionado] =
    useState<Professor | null>(null);

  const [professorParaExcluir, setProfessorParaExcluir] =
    useState<Professor | null>(null);

  const [excluindoId, setExcluindoId] =
    useState<string | null>(null);

  async function carregarProfessores() {
    try {
      setLoading(true);

      const dados = await listarProfessores();

      setProfessores(dados);
    } catch (error) {
      console.error(
        "Erro ao carregar professores:",
        error
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    carregarProfessores();
  }, []);

  const professoresFiltrados = useMemo(() => {
    const termo = search
      .trim()
      .toLowerCase();

    if (!termo) {
      return professores;
    }

    return professores.filter((professor) =>
      professor.nome
        .toLowerCase()
        .includes(termo)
    );
  }, [professores, search]);

  function handleNovo() {
    setProfessorSelecionado(null);
    setDialogOpen(true);
  }

  function handleEdit(professor: Professor) {
    setProfessorSelecionado(professor);
    setDialogOpen(true);
  }

  function handleDelete(professor: Professor) {
    setProfessorParaExcluir(professor);
  }

  async function confirmarExclusaoProfessor() {
    if (!professorParaExcluir) {
      return;
    }

    try {
      setExcluindoId(professorParaExcluir.id);
      await excluirProfessor(professorParaExcluir.id);
      setProfessorParaExcluir(null);
      await carregarProfessores();
    } catch (error) {
      console.error(error);
      alert("Não foi possível excluir o professor.");
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
                Professores
              </h1>

              <p className="mt-1 text-sm text-gray-400">
                Gerencie os professores da escola.
              </p>
            </div>

            <button
              type="button"
              onClick={handleNovo}
              className="flex h-10 shrink-0 items-center gap-2 rounded-lg bg-[#FDC700] px-4 text-sm font-bold text-black transition hover:bg-[#e6b500]"
            >
              <Plus size={18} />

              <span className="hidden sm:inline">
                Novo professor
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
                Professores cadastrados
              </p>

              <p className="text-xl font-bold">
                {professores.length}
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
              placeholder="Buscar professor..."
              className="h-11 w-full rounded-lg border border-[#3a3a3a] bg-[#1c1c1c] pl-10 pr-4 text-sm text-white outline-none focus:border-[#FDC700]"
            />
          </div>

          <button
            type="button"
            onClick={carregarProfessores}
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
              Carregando professores...
            </p>
          </div>
        ) : (
          <ProfessorTable
            professores={professoresFiltrados}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        )}
      </div>

      <ProfessorDialog
        open={dialogOpen}
        professor={professorSelecionado}
        onClose={() => setDialogOpen(false)}
        onSaved={carregarProfessores}
      />

      <ConfirmDialog
        open={Boolean(professorParaExcluir)}
        title="Excluir professor"
        description={
          professorParaExcluir
            ? `Deseja realmente excluir o professor "${professorParaExcluir.nome}"? Esta ação não poderá ser desfeita.`
            : ""
        }
        confirmText="Excluir"
        cancelText="Cancelar"
        loading={Boolean(excluindoId)}
        onCancel={() => setProfessorParaExcluir(null)}
        onConfirm={confirmarExclusaoProfessor}
      />
    </main>
  );
}