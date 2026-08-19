"use client";

import {
  CircleDollarSign,
  Pencil,
  Trash2,
} from "lucide-react";

import { Aluno } from "@/types/aluno";
import AlunoFinanceiroDialog from "@/components/alunos/AlunoFinanceiroDialog";

interface AlunoTableProps {
  alunos: Aluno[];
  onEdit: (aluno: Aluno) => void;
  onDelete: (aluno: Aluno) => void;
}

function formatarData(data: string) {
  if (!data) {
    return "-";
  }

  const partes = data.split("-");

  if (partes.length !== 3) {
    return data;
  }

  return `${partes[2]}/${partes[1]}/${partes[0]}`;
}

import { useState } from "react";

export default function AlunoTable({
  alunos,
  onEdit,
  onDelete,
}: AlunoTableProps) {
  const [financeiroAluno, setFinanceiroAluno] = useState<Aluno | null>(null);

  if (alunos.length === 0) {
    return (
      <div className="rounded-xl border border-[#303030] bg-[#1c1c1c] px-5 py-12 text-center">
        <p className="text-sm text-gray-400">
          Nenhum aluno cadastrado.
        </p>

        <p className="mt-1 text-xs text-gray-600">
          Clique em &quot;Novo aluno&quot; para começar.
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
                Data de nascimento
              </th>

              <th className="px-5 py-3 text-left text-xs font-medium text-gray-500">
                Responsável
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
            {alunos.map((aluno) => (
              <tr
                key={aluno.id}
                className="hover:bg-[#202020]"
              >
                <td className="px-5 py-4 text-sm text-white">
                  {aluno.nome}
                </td>

                <td className="px-5 py-4 text-sm text-gray-400">
                  {formatarData(
                    aluno.dataNascimento
                  )}
                </td>

                <td className="px-5 py-4 text-sm text-gray-400">
                  {aluno.responsavel}
                </td>

                <td className="px-5 py-4">
                  <div className="flex flex-wrap gap-1.5">
                    {aluno.instrumentos.map(
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

                <td className="px-5 py-4">
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setFinanceiroAluno(aluno)
                      }
                      className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-400 hover:bg-green-500/10 hover:text-green-400"
                      title="Financeiro"
                    >
                      <CircleDollarSign size={17} />
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        onEdit(aluno)
                      }
                      className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-400 hover:bg-[#FDC700]/10 hover:text-[#FDC700]"
                      title="Editar"
                    >
                      <Pencil size={17} />
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        onDelete(aluno)
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
        {alunos.map((aluno) => (
          <div
            key={aluno.id}
            className="p-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-white">
                  {aluno.nome}
                </p>

                <p className="mt-1 text-xs text-gray-500">
                  Nascimento:{" "}
                  {formatarData(
                    aluno.dataNascimento
                  )}
                </p>

                <p className="mt-1 text-xs text-gray-500">
                  Responsável:{" "}
                  {aluno.responsavel}
                </p>

                <div className="mt-2 flex flex-wrap gap-1.5">
                  {aluno.instrumentos.map(
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

              <div className="flex shrink-0 gap-1">
                <button
                  type="button"
                  onClick={() =>
                    setFinanceiroAluno(aluno)
                  }
                  className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-400 hover:bg-green-500/10 hover:text-green-400"
                  title="Financeiro"
                >
                  <CircleDollarSign size={16} />
                </button>

                <button
                  type="button"
                  onClick={() =>
                    onEdit(aluno)
                  }
                  className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-400 hover:bg-[#FDC700]/10 hover:text-[#FDC700]"
                  title="Editar"
                >
                  <Pencil size={16} />
                </button>

                <button
                  type="button"
                  onClick={() =>
                    onDelete(aluno)
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

      <AlunoFinanceiroDialog
        aluno={financeiroAluno}
        open={Boolean(financeiroAluno)}
        onClose={() => setFinanceiroAluno(null)}
      />
    </div>
  );
}