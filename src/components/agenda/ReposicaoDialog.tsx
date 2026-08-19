"use client";

import {
  FormEvent,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  CalendarClock,
  X,
} from "lucide-react";

import { Aula } from "@/types/aula";
import { Aluno } from "@/types/aluno";
import { Professor } from "@/types/professor";
import { Reposicao } from "@/types/reposicao";

import {
  atualizarReposicao,
  cadastrarReposicao,
} from "@/services/reposicao.service";

interface ReposicaoDialogProps {
  open: boolean;

  reposicao?: Reposicao | null;

  aulas: Aula[];

  alunos: Aluno[];

  professores: Professor[];

  reposicoes: Reposicao[];

  onClose: () => void;

  onSaved: () => void;
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

function formatarData(data: string) {
  if (!data) {
    return "";
  }

  const [ano, mes, dia] =
    data.split("-");

  return `${dia}/${mes}/${ano}`;
}

export default function ReposicaoDialog({
  open,
  reposicao = null,
  aulas,
  alunos,
  professores,
  reposicoes,
  onClose,
  onSaved,
}: ReposicaoDialogProps) {
  const [aulaOrigemId, setAulaOrigemId] =
    useState("");

  const [data, setData] =
    useState("");

  const [horario, setHorario] =
    useState("");

  const [observacao, setObservacao] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const editando =
    Boolean(reposicao);

  /*
   * Preenche os campos quando
   * estiver editando uma reposição.
   */
  useEffect(() => {
    if (!open) {
      return;
    }

    if (reposicao) {
      setAulaOrigemId(
        reposicao.aulaOrigemId
      );

      setData(
        reposicao.data
      );

      setHorario(
        reposicao.horario
      );

      setObservacao(
        reposicao.observacao ?? ""
      );
    } else {
      setAulaOrigemId("");
      setData("");
      setHorario("");
      setObservacao("");
    }

    setError("");
  }, [open, reposicao]);

  const aulasAtivas = useMemo(() => {
    return aulas
      .filter(
        (aula) => aula.ativo
      )
      .sort((a, b) =>
        a.horario.localeCompare(
          b.horario
        )
      );
  }, [aulas]);

  const aulaSelecionada =
    useMemo(() => {
      return aulas.find(
        (aula) =>
          aula.id ===
          aulaOrigemId
      );
    }, [
      aulas,
      aulaOrigemId,
    ]);

  const alunoSelecionado =
    useMemo(() => {
      if (!aulaSelecionada) {
        return undefined;
      }

      return alunos.find(
        (aluno) =>
          aluno.id ===
          aulaSelecionada.alunoId
      );
    }, [
      alunos,
      aulaSelecionada,
    ]);

  const professorSelecionado =
    useMemo(() => {
      if (!aulaSelecionada) {
        return undefined;
      }

      return professores.find(
        (professor) =>
          professor.id ===
          aulaSelecionada.professorId
      );
    }, [
      professores,
      aulaSelecionada,
    ]);

  if (!open) {
    return null;
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError("");

    if (!aulaOrigemId) {
      setError(
        "Selecione a aula que será reposta."
      );
      return;
    }

    if (!data) {
      setError(
        "Selecione a data da reposição."
      );
      return;
    }

    if (!horario) {
      setError(
        "Informe o horário da reposição."
      );
      return;
    }

    if (!aulaSelecionada) {
      setError(
        "A aula selecionada não foi encontrada."
      );
      return;
    }

    /*
     * Verifica conflito com aulas recorrentes
     * do mesmo aluno.
     */
    const conflitoAula =
      aulas.some((aula) => {
        if (!aula.ativo) {
          return false;
        }

        if (
          aula.alunoId !==
          aulaSelecionada.alunoId
        ) {
          return false;
        }

        const diasSemana: Record<
          number,
          string
        > = {
          0: "domingo",
          1: "segunda",
          2: "terça",
          3: "quarta",
          4: "quinta",
          5: "sexta",
          6: "sábado",
        };

        const dataObj =
          new Date(
            `${data}T12:00:00`
          );

        const diaSemana =
          diasSemana[
            dataObj.getDay()
          ];

        return (
          aula.diaSemana ===
            diaSemana &&
          aula.horario ===
            horario
        );
      });

    if (conflitoAula) {
      setError(
        "Este aluno já possui uma aula neste dia e horário."
      );
      return;
    }

    /*
     * Verifica conflito com outra reposição.
     *
     * Quando estamos editando, ignoramos
     * a própria reposição.
     */
    const conflitoReposicao =
      reposicoes.some(
        (item) => {
          if (
            !item.ativo
          ) {
            return false;
          }

          if (
            editando &&
            item.id ===
              reposicao?.id
          ) {
            return false;
          }

          return (
            item.alunoId ===
              aulaSelecionada.alunoId &&
            item.data === data &&
            item.horario ===
              horario
          );
        }
      );

    if (conflitoReposicao) {
      setError(
        "Este aluno já possui uma reposição neste dia e horário."
      );
      return;
    }

    try {
      setLoading(true);

      if (
        editando &&
        reposicao
      ) {
        await atualizarReposicao(
          reposicao.id,
          aulaSelecionada.alunoId,
          aulaSelecionada.professorId,
          aulaSelecionada.instrumento,
          data,
          horario,
          aulaSelecionada.id,
          observacao
        );
      } else {
        await cadastrarReposicao(
          aulaSelecionada.alunoId,
          aulaSelecionada.professorId,
          aulaSelecionada.instrumento,
          data,
          horario,
          aulaSelecionada.id,
          observacao
        );
      }

      onSaved();
      onClose();
    } catch (error) {
      console.error(
        "Erro ao salvar reposição:",
        error
      );

      setError(
        editando
          ? "Não foi possível atualizar a reposição."
          : "Não foi possível cadastrar a reposição."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-3 backdrop-blur-[2px] sm:p-4">

      <div className="flex max-h-[calc(100dvh-1.5rem)] w-full max-w-md flex-col overflow-hidden rounded-2xl border border-[#303030] bg-[#1c1c1c] shadow-2xl sm:max-h-[calc(100dvh-2rem)]">

        {/* Cabeçalho */}

        <div className="flex shrink-0 items-center justify-between border-b border-[#303030] px-5 py-4">

          <div className="flex items-center gap-3">

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FDC700]/10 text-[#FDC700]">
              <CalendarClock
                size={20}
              />
            </div>

            <div>
              <h2 className="text-lg font-semibold text-white">
                {editando
                  ? "Editar reposição"
                  : "Nova reposição"}
              </h2>

              <p className="mt-1 text-xs text-gray-500">
                {editando
                  ? "Altere os dados da reposição."
                  : "Agende uma nova data para uma aula."}
              </p>
            </div>

          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-400 transition hover:bg-[#292929] hover:text-white disabled:opacity-40"
          >
            <X size={19} />
          </button>

        </div>

        <form
          onSubmit={handleSubmit}
          className="min-h-0 flex-1 space-y-5 overflow-y-auto overscroll-contain p-5 pb-6 [scrollbar-width:thin]"
        >

          {/* Aula de origem */}

          <div>
            <label
              htmlFor="reposicao-aula"
              className="mb-2 block text-sm text-gray-300"
            >
              Aula que será reposta
            </label>

            <select
              id="reposicao-aula"
              value={aulaOrigemId}
              onChange={(event) =>
                setAulaOrigemId(
                  event.target.value
                )
              }
              disabled={loading}
              className="h-11 w-full rounded-lg border border-[#3a3a3a] bg-[#121212] px-3 text-sm text-white outline-none focus:border-[#FDC700]"
            >
              <option value="">
                Selecione a aula
              </option>

              {aulasAtivas.map(
                (aula) => {
                  const aluno =
                    alunos.find(
                      (item) =>
                        item.id ===
                        aula.alunoId
                    );

                  return (
                    <option
                      key={aula.id}
                      value={aula.id}
                    >
                      {aluno?.nome ??
                        "Aluno"}{" "}
                      —{" "}
                      {
                        nomesDias[
                          aula.diaSemana
                        ]
                      }{" "}
                      {
                        aula.horario
                      }{" "}
                      —{" "}
                      {
                        aula.instrumento
                      }
                    </option>
                  );
                }
              )}
            </select>
          </div>

          {/* Resumo */}

          {aulaSelecionada && (
            <div className="rounded-xl border border-[#303030] bg-[#151515] p-4">

              <p className="text-xs font-medium uppercase tracking-wide text-gray-600">
                Aula selecionada
              </p>

              <div className="mt-3 space-y-2">

                <div className="flex justify-between gap-3">
                  <span className="text-xs text-gray-500">
                    Aluno
                  </span>

                  <span className="text-right text-xs font-medium text-white">
                    {alunoSelecionado?.nome ??
                      "Não encontrado"}
                  </span>
                </div>

                <div className="flex justify-between gap-3">
                  <span className="text-xs text-gray-500">
                    Professor
                  </span>

                  <span className="text-right text-xs font-medium text-white">
                    {professorSelecionado?.nome ??
                      "Não encontrado"}
                  </span>
                </div>

                <div className="flex justify-between gap-3">
                  <span className="text-xs text-gray-500">
                    Instrumento
                  </span>

                  <span className="rounded-full bg-[#FDC700]/10 px-2 py-0.5 text-[10px] text-[#FDC700]">
                    {
                      aulaSelecionada.instrumento
                    }
                  </span>
                </div>

                <div className="flex justify-between gap-3">
                  <span className="text-xs text-gray-500">
                    Aula original
                  </span>

                  <span className="text-right text-xs text-gray-400">
                    {
                      nomesDias[
                        aulaSelecionada.diaSemana
                      ]
                    }{" "}
                    às{" "}
                    {
                      aulaSelecionada.horario
                    }
                  </span>
                </div>

              </div>
            </div>
          )}

          {/* Nova data */}

          <div>
            <label
              htmlFor="reposicao-data"
              className="mb-2 block text-sm text-gray-300"
            >
              Data da reposição
            </label>

            <input
              id="reposicao-data"
              type="date"
              value={data}
              onChange={(event) =>
                setData(
                  event.target.value
                )
              }
              disabled={loading}
              className="h-11 w-full rounded-lg border border-[#3a3a3a] bg-[#121212] px-3 text-sm text-white outline-none focus:border-[#FDC700]"
            />

            {data && (
              <p className="mt-1.5 text-xs text-gray-600">
                {formatarData(data)}
              </p>
            )}
          </div>

          {/* Horário */}

          <div>
            <label
              htmlFor="reposicao-horario"
              className="mb-2 block text-sm text-gray-300"
            >
              Horário
            </label>

            <input
              id="reposicao-horario"
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

          {/* Observação */}

          <div>
            <label
              htmlFor="reposicao-observacao"
              className="mb-2 block text-sm text-gray-300"
            >
              Observação{" "}
              <span className="text-gray-600">
                (opcional)
              </span>
            </label>

            <textarea
              id="reposicao-observacao"
              value={observacao}
              onChange={(event) =>
                setObservacao(
                  event.target.value
                )
              }
              disabled={loading}
              rows={3}
              placeholder="Ex.: Reposição da aula do dia 17/08."
              className="w-full resize-none rounded-lg border border-[#3a3a3a] bg-[#121212] px-3 py-3 text-sm text-white outline-none placeholder:text-gray-700 focus:border-[#FDC700]"
            />
          </div>

          {/* Erro */}

          {error && (
            <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-400">
              {error}
            </div>
          )}

          {/* Informação */}

          <div className="rounded-lg border border-[#303030] bg-[#151515] px-3 py-3">
            <p className="text-xs leading-5 text-gray-500">
              A reposição pertence somente à data
              escolhida. A aula recorrente original
              não será alterada.
            </p>
          </div>

          {/* Botões */}

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">

            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="h-11 rounded-lg border border-[#3a3a3a] px-5 text-sm text-gray-300 transition hover:bg-[#292929] disabled:opacity-40"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={
                loading ||
                !aulaOrigemId
              }
              className="h-11 rounded-lg bg-[#FDC700] px-5 text-sm font-bold text-black transition hover:bg-[#e6b500] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading
                ? "Salvando..."
                : editando
                  ? "Salvar alterações"
                  : "Cadastrar reposição"}
            </button>

          </div>

        </form>
      </div>
    </div>
  );
}