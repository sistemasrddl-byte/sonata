"use client";

import {
  Pencil,
  Trash2,
} from "lucide-react";

import { Professor } from "@/types/professor";

interface ProfessorTableProps {
  professores: Professor[];
  onEdit: (professor: Professor) => void;
  onDelete: (professor: Professor) => void;
}

export default function ProfessorTable({
  professores,
  onEdit,
  onDelete,
}: ProfessorTableProps) {
  if (professores.length === 0) {
    return (
      <div className="rounded-xl border border-[#303030] bg-[#1c1c1c] px-5 py-12 text-center">
        <p className="text-sm text-gray-400">
          Nenhum professor cadastrado.
        </p>

        <p className="mt-1 text-xs text-gray-600">
          Clique em &quot;Novo professor&quot; para começar.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-[#303030] bg-[#1c1c1c]">
      {/* Desktop */}
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full">
          <thead className="border-b border-[#303030] bg-[#181818]">
            <tr>
              <th className="px-5 py-3 text-left text-xs font-medium text-gray-500">
                Nome
              </th>

              <th className="px-5 py-3 text-left text-xs font-medium text-gray-500">
                Instrumentos
              </th>

              <th className="px-5 py-3 text-right text-xs font-medium text-gray-500">
                Ações
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-[#292929]">
            {professores.map((professor) => (
              <tr
                key={professor.id}
                className="hover:bg-[#202020]"
              >
                {/* Nome */}
                <td className="px-5 py-4 text-sm text-white">
                  {professor.nome}
                </td>

                {/* Instrumentos */}
                <td className="px-5 py-4">
                  <div className="flex flex-wrap gap-1.5">
                    {professor.instrumentos.map(
                      (instrumento) => (
                        <span
                          key={instrumento}
                          className="rounded-full bg-[#FDC700]/10 px-2.5 py-1 text-xs text-[#FDC700]"
                        >
                          {instrumento}
                        </span>
                      )
                    )}
                  </div>
                </td>

                {/* Ações */}
                <td className="px-5 py-4">
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        onEdit(professor)
                      }
                      className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-400 hover:bg-[#FDC700]/10 hover:text-[#FDC700]"
                      title="Editar"
                    >
                      <Pencil size={17} />
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        onDelete(professor)
                      }
                      className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-400 hover:bg-red-500/10 hover:text-red-400"
                      title="Excluir"
                    >
                      <Trash2 size={17} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile */}
      <div className="divide-y divide-[#292929] md:hidden">
        {professores.map((professor) => (
          <div
            key={professor.id}
            className="p-4"
          >
            <div className="flex items-start justify-between gap-3">
              {/* Informações */}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-white">
                  {professor.nome}
                </p>

                <div className="mt-2 flex flex-wrap gap-1.5">
                  {professor.instrumentos.map(
                    (instrumento) => (
                      <span
                        key={instrumento}
                        className="rounded-full bg-[#FDC700]/10 px-2 py-1 text-[11px] text-[#FDC700]"
                      >
                        {instrumento}
                      </span>
                    )
                  )}
                </div>
              </div>

              {/* Ações */}
              <div className="flex shrink-0 gap-1">
                <button
                  type="button"
                  onClick={() =>
                    onEdit(professor)
                  }
                  className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-400 hover:bg-[#FDC700]/10 hover:text-[#FDC700]"
                  title="Editar"
                >
                  <Pencil size={16} />
                </button>

                <button
                  type="button"
                  onClick={() =>
                    onDelete(professor)
                  }
                  className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-400 hover:bg-red-500/10 hover:text-red-400"
                  title="Excluir"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}