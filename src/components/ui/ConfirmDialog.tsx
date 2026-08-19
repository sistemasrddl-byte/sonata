"use client";

import { AlertTriangle, X } from "lucide-react";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({
  open,
  title,
  description,
  confirmText = "Confirmar",
  cancelText = "Cancelar",
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!open) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 p-4 backdrop-blur-[2px]"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !loading) {
          onCancel();
        }
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        className="w-full max-w-md overflow-hidden rounded-2xl border border-[#353535] bg-[#1c1c1c] shadow-2xl"
      >
        {/* Cabeçalho */}
        <div className="flex items-start gap-4 border-b border-[#303030] px-5 py-5">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-red-500/10 text-red-400">
            <AlertTriangle size={22} />
          </div>

          <div className="min-w-0 flex-1">
            <h2 className="text-base font-semibold text-white">
              {title}
            </h2>

            <p className="mt-1 text-sm leading-5 text-gray-400">
              {description}
            </p>
          </div>

          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-gray-500 transition hover:bg-[#292929] hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
            aria-label="Fechar"
          >
            <X size={18} />
          </button>
        </div>

        {/* Informação */}
        <div className="px-5 pt-4">
          <div className="rounded-lg border border-[#303030] bg-[#151515] px-3 py-3">
            <p className="text-xs leading-5 text-gray-500">
              A aula será desativada, mas o registro permanecerá
              no banco de dados para preservar o histórico.
            </p>
          </div>
        </div>

        {/* Botões */}
        <div className="flex flex-col-reverse gap-2 px-5 py-5 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="h-10 rounded-lg border border-[#3a3a3a] px-5 text-sm font-medium text-gray-300 transition hover:bg-[#292929] hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
          >
            {cancelText}
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="h-10 rounded-lg bg-red-500 px-5 text-sm font-semibold text-white transition hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading
              ? "Desativando..."
              : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}