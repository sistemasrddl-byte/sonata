"use client";

import {
  FormEvent,
  useEffect,
  useMemo,
  useState,
} from "react";

import { Check, X } from "lucide-react";

import { Aluno } from "@/types/aluno";
import {
  Aula,
  DiaSemana,
  Instrumento,
} from "@/types/aula";
import { Professor } from "@/types/professor";

import {
  atualizarAula,
  cadastrarAula,
} from "@/services/aula.service";

interface AulaDialogProps {
  open: boolean;
  aula?: Aula | null;
  alunos: Aluno[];
  professores: Professor[];
  aulas: Aula[];
  onClose: () => void;
  onSaved: () => void;
}

const dias: {
  value: DiaSemana;
  label: string;
}[] = [
  {
    value: "segunda",
    label: "Segunda-feira",
  },
  {
    value: "terça",
    label: "Terça-feira",
  },
  {
    value: "quarta",
    label: "Quarta-feira",
  },
  {
    value: "quinta",
    label: "Quinta-feira",
  },
  {
    value: "sexta",
    label: "Sexta-feira",
  },
  {
    value: "sábado",
    label: "Sábado",
  },
];

export default function AulaDialog({
  open,
  aula,
  alunos,
  professores,
  aulas,
  onClose,
  onSaved,
}: AulaDialogProps) {
  const [alunoId, setAlunoId] =
    useState("");

  const [professorId, setProfessorId] =
    useState("");

  const [instrumento, setInstrumento] =
    useState<Instrumento | "">("");

  const [diaSemana, setDiaSemana] =
    useState<DiaSemana>("segunda");

  const [horario, setHorario] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const editando = Boolean(aula);

  useEffect(() => {
    if (!open) {
      return;
    }

    setAlunoId(aula?.alunoId ?? "");
    setProfessorId(
      aula?.professorId ?? ""
    );
    setInstrumento(
      aula?.instrumento ?? ""
    );
    setDiaSemana(
      aula?.diaSemana ?? "segunda"
    );
    setHorario(aula?.horario ?? "");
    setError("");
  }, [open, aula]);

  const alunoSelecionado = useMemo(() => {
    return alunos.find(
      (aluno) => aluno.id === alunoId
    );
  }, [alunos, alunoId]);

  const professorSelecionado =
    useMemo(() => {
      return professores.find(
        (professor) =>
          professor.id === professorId
      );
    }, [professores, professorId]);

  const instrumentosDisponiveis =
    useMemo(() => {
      if (
        !alunoSelecionado ||
        !professorSelecionado
      ) {
        return [];
      }

      return alunoSelecionado.instrumentos.filter(
        (item) =>
          professorSelecionado.instrumentos.includes(
            item
          )
      );
    }, [
      alunoSelecionado,
      professorSelecionado,
    ]);

  useEffect(() => {
    if (
      instrumento &&
      !instrumentosDisponiveis.includes(
        instrumento
      )
    ) {
      setInstrumento("");
    }
  }, [
    instrumento,
    instrumentosDisponiveis,
  ]);

  if (!open) {
    return null;
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError("");

    if (!alunoId) {
      setError(
        "Selecione o aluno."
      );
      return;
    }

    if (!professorId) {
      setError(
        "Selecione o professor."
      );
      return;
    }

    if (!instrumento) {
      setError(
        "Selecione o instrumento."
      );
      return;
    }

    if (!horario) {
      setError(
        "Informe o horário da aula."
      );
      return;
    }

    /*
     * Quando estamos editando uma aula,
     * ignoramos a própria aula na verificação.
     */
    const conflitoAluno = aulas.some(
      (item) =>
        item.ativo &&
        item.id !== aula?.id &&
        item.alunoId === alunoId &&
        item.diaSemana === diaSemana &&
        item.horario === horario
    );

    if (conflitoAluno) {
      setError(
        "Este aluno já possui uma aula neste dia e horário."
      );
      return;
    }

    try {
      setLoading(true);

      if (aula) {
        await atualizarAula(
          aula.id,
          alunoId,
          professorId,
          instrumento,
          diaSemana,
          horario
        );
      } else {
        await cadastrarAula(
          alunoId,
          professorId,
          instrumento,
          diaSemana,
          horario
        );
      }

      onSaved();
      onClose();
    } catch (error) {
      console.error(
        "Erro ao salvar aula:",
        error
      );

      setError(
        "Não foi possível salvar a aula."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-3 sm:p-4">
      <div className="flex max-h-[calc(100dvh-1.5rem)] w-full max-w-md flex-col overflow-hidden rounded-2xl border border-[#303030] bg-[#1c1c1c] shadow-2xl sm:max-h-[calc(100dvh-2rem)]">

        {/* Cabeçalho */}
        <div className="flex shrink-0 items-center justify-between border-b border-[#303030] px-5 py-4">
          <div>
            <h2 className="text-lg font-semibold text-white">
              {editando
                ? "Editar aula"
                : "Nova aula"}
            </h2>

            <p className="mt-1 text-xs text-gray-500">
              {editando
                ? "Altere os dados da aula."
                : "Cadastre uma aula recorrente."}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-400 hover:bg-[#292929] hover:text-white"
          >
            <X size={19} />
          </button>
        </div>

        {/* Formulário */}
        <form
          onSubmit={handleSubmit}
          className="min-h-0 flex-1 space-y-5 overflow-y-auto overscroll-contain p-5 pb-6 [scrollbar-width:thin]"
        >
          {/* Aluno */}
          <div>
            <label
              htmlFor="aula-aluno"
              className="mb-2 block text-sm text-gray-300"
            >
              Aluno
            </label>

            <select
              id="aula-aluno"
              value={alunoId}
              onChange={(event) =>
                setAlunoId(
                  event.target.value
                )
              }
              disabled={loading}
              className="h-11 w-full rounded-lg border border-[#3a3a3a] bg-[#121212] px-3 text-sm text-white outline-none focus:border-[#FDC700]"
            >
              <option value="">
                Selecione o aluno
              </option>

              {alunos.map((aluno) => (
                <option
                  key={aluno.id}
                  value={aluno.id}
                >
                  {aluno.nome}
                </option>
              ))}
            </select>
          </div>

          {/* Professor */}
          <div>
            <label
              htmlFor="aula-professor"
              className="mb-2 block text-sm text-gray-300"
            >
              Professor
            </label>

            <select
              id="aula-professor"
              value={professorId}
              onChange={(event) =>
                setProfessorId(
                  event.target.value
                )
              }
              disabled={loading}
              className="h-11 w-full rounded-lg border border-[#3a3a3a] bg-[#121212] px-3 text-sm text-white outline-none focus:border-[#FDC700]"
            >
              <option value="">
                Selecione o professor
              </option>

              {professores.map(
                (professor) => (
                  <option
                    key={professor.id}
                    value={professor.id}
                  >
                    {professor.nome}
                  </option>
                )
              )}
            </select>
          </div>

          {/* Instrumento */}
          <div>
            <label className="mb-2 block text-sm text-gray-300">
              Instrumento
            </label>

            {!alunoId ||
            !professorId ? (
              <div className="rounded-lg border border-dashed border-[#3a3a3a] bg-[#121212] px-3 py-3 text-xs text-gray-500">
                Selecione o aluno e o
                professor primeiro.
              </div>
            ) : instrumentosDisponiveis.length ===
              0 ? (
              <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-3 text-xs text-red-400">
                O aluno e o professor não
                possuem instrumentos em
                comum.
              </div>
            ) : (
              <div className="space-y-2">
                {instrumentosDisponiveis.map(
                  (item) => {
                    const selecionado =
                      instrumento === item;

                    return (
                      <button
                        key={item}
                        type="button"
                        onClick={() =>
                          setInstrumento(
                            item
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
                          {item}
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
                            <Check
                              size={14}
                            />
                          )}
                        </span>
                      </button>
                    );
                  }
                )}
              </div>
            )}
          </div>

          {/* Dia */}
          <div>
            <label
              htmlFor="aula-dia"
              className="mb-2 block text-sm text-gray-300"
            >
              Dia da semana
            </label>

            <select
              id="aula-dia"
              value={diaSemana}
              onChange={(event) =>
                setDiaSemana(
                  event.target
                    .value as DiaSemana
                )
              }
              disabled={loading}
              className="h-11 w-full rounded-lg border border-[#3a3a3a] bg-[#121212] px-3 text-sm text-white outline-none focus:border-[#FDC700]"
            >
              {dias.map((dia) => (
                <option
                  key={dia.value}
                  value={dia.value}
                >
                  {dia.label}
                </option>
              ))}
            </select>
          </div>

          {/* Horário */}
          <div>
            <label
              htmlFor="aula-horario"
              className="mb-2 block text-sm text-gray-300"
            >
              Horário
            </label>

            <input
              id="aula-horario"
              type="time"
              value={horario}
              onChange={(event) =>
                setHorario(
                  event.target.value
                )
              }
              disabled={loading}
              className="h-11 w-full rounded-lg border border-[#3a3a3a] bg-[#121212] px-3 text-sm text-white outline-none focus:border-[#FDC700]"
            />
          </div>

          {/* Informação */}
          <div className="rounded-lg border border-[#303030] bg-[#151515] px-3 py-3">
            <p className="text-xs leading-5 text-gray-500">
              O professor pode ter vários
              alunos no mesmo horário.
              Um aluno não pode ter duas
              aulas simultâneas.
            </p>
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
              disabled={
                loading ||
                instrumentosDisponiveis.length ===
                  0
              }
              className="h-11 rounded-lg bg-[#FDC700] px-5 text-sm font-bold text-black hover:bg-[#e6b500] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading
                ? "Salvando..."
                : editando
                  ? "Salvar alterações"
                  : "Cadastrar aula"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}