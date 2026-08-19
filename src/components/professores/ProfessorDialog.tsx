"use client";

import { FormEvent, useEffect, useState } from "react";
import { Check, X } from "lucide-react";

import {
  cadastrarProfessor,
  atualizarProfessor,
} from "@/services/professor.service";

import {
  Instrumento,
  Professor,
} from "@/types/professor";

interface ProfessorDialogProps {
  open: boolean;
  professor?: Professor | null;
  onClose: () => void;
  onSaved: () => void;
}

const instrumentos: Instrumento[] = [
  "Violão",
  "Teclado",
  "Bateria",
];

export default function ProfessorDialog({
  open,
  professor,
  onClose,
  onSaved,
}: ProfessorDialogProps) {
  const [nome, setNome] = useState("");
  const [instrumentosSelecionados, setInstrumentosSelecionados] =
    useState<Instrumento[]>([]);

  const [status, setStatus] =
    useState<Professor["status"]>("Ativo");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const editing = Boolean(professor);

  useEffect(() => {
    if (!open) {
      return;
    }

    setNome(professor?.nome ?? "");

    setInstrumentosSelecionados(
      professor?.instrumentos ?? []
    );

    setStatus(
      professor?.status ?? "Ativo"
    );

    setError("");
  }, [open, professor]);

  if (!open) {
    return null;
  }

  function alternarInstrumento(
    instrumento: Instrumento
  ) {
    setInstrumentosSelecionados((atual) => {
      if (atual.includes(instrumento)) {
        return atual.filter(
          (item) => item !== instrumento
        );
      }

      return [...atual, instrumento];
    });
  }

  function selecionarTodos() {
    setInstrumentosSelecionados([...instrumentos]);
  }

  function limparInstrumentos() {
    setInstrumentosSelecionados([]);
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError("");

    if (!nome.trim()) {
      setError("Digite o nome do professor.");
      return;
    }

    if (instrumentosSelecionados.length === 0) {
      setError(
        "Selecione pelo menos um instrumento."
      );
      return;
    }

    try {
      setLoading(true);

      if (professor) {
        await atualizarProfessor(
          professor.id,
          nome.trim(),
          instrumentosSelecionados,
          status
        );
      } else {
        await cadastrarProfessor(
          nome.trim(),
          instrumentosSelecionados,
          status
        );
      }

      onSaved();
      onClose();
    } catch (error) {
      console.error(error);

      setError(
        "Não foi possível salvar o professor."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-md rounded-2xl border border-[#333] bg-[#1c1c1c] shadow-2xl">

        {/* Cabeçalho */}
        <div className="flex items-center justify-between border-b border-[#303030] px-5 py-4">
          <div>
            <h2 className="text-lg font-semibold text-white">
              {editing
                ? "Editar professor"
                : "Novo professor"}
            </h2>

            <p className="mt-1 text-xs text-gray-500">
              Informe os instrumentos que ele ensina.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-400 hover:bg-[#292929] hover:text-white"
            aria-label="Fechar"
          >
            <X size={19} />
          </button>
        </div>

        {/* Formulário */}
        <form
          onSubmit={handleSubmit}
          className="space-y-5 p-5"
        >
          {/* Nome */}
          <div>
            <label
              htmlFor="nome-professor"
              className="mb-2 block text-sm text-gray-300"
            >
              Nome
            </label>

            <input
              id="nome-professor"
              value={nome}
              onChange={(event) =>
                setNome(event.target.value)
              }
              placeholder="Digite o nome do professor"
              disabled={loading}
              className="h-11 w-full rounded-lg border border-[#3a3a3a] bg-[#121212] px-3 text-white outline-none focus:border-[#FDC700]"
            />
          </div>

          {/* Situação */}
          <div>
            <label
              htmlFor="status-professor"
              className="mb-2 block text-sm text-gray-300"
            >
              Situação
            </label>

            <select
              id="status-professor"
              value={status}
              onChange={(event) =>
                setStatus(
                  event.target.value as Professor["status"]
                )
              }
              disabled={loading}
              className="h-11 w-full rounded-lg border border-[#3a3a3a] bg-[#121212] px-3 text-white outline-none focus:border-[#FDC700]"
            >
              <option value="Ativo">
                Ativo
              </option>
              <option value="Inativo">
                Inativo
              </option>
            </select>
          </div>

          {/* Instrumentos */}
          <div>
            <div className="mb-2 flex items-center justify-between gap-3">
              <label className="block text-sm text-gray-300">
                Instrumentos que ensina
              </label>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={selecionarTodos}
                  disabled={loading}
                  className="text-xs font-medium text-[#FDC700] hover:underline"
                >
                  Todos
                </button>

                <span className="text-xs text-gray-700">
                  |
                </span>

                <button
                  type="button"
                  onClick={limparInstrumentos}
                  disabled={loading}
                  className="text-xs text-gray-500 hover:text-white"
                >
                  Limpar
                </button>
              </div>
            </div>

            <div className="space-y-2">
              {instrumentos.map((instrumento) => {
                const selecionado =
                  instrumentosSelecionados.includes(
                    instrumento
                  );

                return (
                  <button
                    key={instrumento}
                    type="button"
                    onClick={() =>
                      alternarInstrumento(
                        instrumento
                      )
                    }
                    disabled={loading}
                    className={`
                      flex w-full items-center justify-between
                      rounded-lg border px-4 py-3
                      text-left text-sm transition
                      ${
                        selecionado
                          ? "border-[#FDC700] bg-[#FDC700]/10 text-white"
                          : "border-[#3a3a3a] bg-[#121212] text-gray-400 hover:border-[#555] hover:text-white"
                      }
                    `}
                  >
                    <span>
                      {instrumento}
                    </span>

                    <span
                      className={`
                        flex h-5 w-5 items-center justify-center
                        rounded border
                        ${
                          selecionado
                            ? "border-[#FDC700] bg-[#FDC700] text-black"
                            : "border-[#555]"
                        }
                      `}
                    >
                      {selecionado && (
                        <Check size={14} />
                      )}
                    </span>
                  </button>
                );
              })}
            </div>

            {instrumentosSelecionados.length > 0 && (
              <p className="mt-2 text-xs text-gray-500">
                {instrumentosSelecionados.length}{" "}
                instrumento
                {instrumentosSelecionados.length !== 1
                  ? "s"
                  : ""}{" "}
                selecionado
                {instrumentosSelecionados.length !== 1
                  ? "s"
                  : ""}
              </p>
            )}
          </div>

          {/* Erro */}
          {error && (
            <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-400">
              {error}
            </div>
          )}

          {/* Botões */}
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="h-11 rounded-lg border border-[#3a3a3a] px-5 text-sm text-gray-300 hover:bg-[#292929]"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={loading}
              className="h-11 rounded-lg bg-[#FDC700] px-5 text-sm font-bold text-black hover:bg-[#e6b500] disabled:opacity-60"
            >
              {loading
                ? "Salvando..."
                : editing
                  ? "Salvar alterações"
                  : "Cadastrar professor"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}