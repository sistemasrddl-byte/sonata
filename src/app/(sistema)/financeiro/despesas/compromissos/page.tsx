"use client";

import {
  ArrowLeft,
  Check,
  ChevronDown,
  ChevronUp,
  CircleDollarSign,
  Pencil,
  Plus,
  ReceiptText,
  Trash2,
  X,
} from "lucide-react";

import {
  FormEvent,
  useEffect,
  useState,
} from "react";

import { useRouter } from "next/navigation";

import {
  atualizarCompromisso,
  cadastrarCompromisso,
  excluirCompromisso,
  listarCompromissos,
  listarPagamentosCompromisso,
  registrarPagamentoCompromisso,
} from "@/services/compromisso.service";

import {
  CategoriaCompromisso,
  Compromisso,
  PagamentoCompromisso,
} from "@/types/compromisso";

const categorias: {
  value: CategoriaCompromisso;
  label: string;
}[] = [
  { value: "compras", label: "Compras" },
  { value: "fornecedores", label: "Fornecedores" },
  { value: "equipamentos", label: "Equipamentos" },
  { value: "instrumentos", label: "Instrumentos" },
  { value: "materiais", label: "Materiais" },
  { value: "outros", label: "Outros" },
];

function hoje(): string {
  const data = new Date();

  return `${data.getFullYear()}-${String(
    data.getMonth() + 1
  ).padStart(2, "0")}-${String(
    data.getDate()
  ).padStart(2, "0")}`;
}

function moeda(valor: number): string {
  return new Intl.NumberFormat(
    "pt-BR",
    {
      style: "currency",
      currency: "BRL",
    }
  ).format(valor);
}

function formatarValorMoedaInput(valor: string): string {
  const digitos = valor.replace(/\D/g, "");

  if (!digitos) {
    return "";
  }

  const numero = Number(digitos) / 100;

  return new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numero);
}

function parseValorMoeda(valor: string): number {
  const digitos = valor.replace(/\D/g, "");

  if (!digitos) {
    return 0;
  }

  return Number(digitos) / 100;
}

function dataBR(data: string): string {
  if (!data) return "-";

  const [ano, mes, dia] =
    data.split("-");

  return `${dia}/${mes}/${ano}`;
}

const formularioInicial = {
  descricao: "",
  valorTotal: "",
  categoria:
    "compras" as CategoriaCompromisso,
  dataCompra: hoje(),
};

export default function CompromissosPage() {
  const router = useRouter();

  const [compromissos, setCompromissos] =
    useState<Compromisso[]>([]);
  const [loading, setLoading] =
    useState(true);
  const [salvando, setSalvando] =
    useState(false);

  const [formulario, setFormulario] =
    useState(formularioInicial);
  const [modalAberto, setModalAberto] =
    useState(false);

  const [
    compromissoEditando,
    setCompromissoEditando,
  ] = useState<Compromisso | null>(null);

  const [
    compromissoParaExcluir,
    setCompromissoParaExcluir,
  ] = useState<Compromisso | null>(null);

  const [
    compromissoPagamento,
    setCompromissoPagamento,
  ] = useState<Compromisso | null>(
    null
  );

  const [
    pagamentoFormulario,
    setPagamentoFormulario,
  ] = useState({
    data: hoje(),
    valor: "",
    observacao: "",
  });

  const [
    historicoAberto,
    setHistoricoAberto,
  ] = useState<string | null>(null);

  const [
    historicos,
    setHistoricos,
  ] = useState<
    Record<string, PagamentoCompromisso[]>
  >({});

  async function carregar() {
    try {
      setLoading(true);

      setCompromissos(
        await listarCompromissos()
      );
    } catch (error) {
      console.error(
        "Erro ao carregar compromissos:",
        error
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    carregar();
  }, []);

  async function abrirHistorico(
    compromisso: Compromisso
  ) {
    if (
      historicoAberto ===
      compromisso.id
    ) {
      setHistoricoAberto(null);
      return;
    }

    try {
      const pagamentos =
        await listarPagamentosCompromisso(
          compromisso.id
        );

      setHistoricos(
        (atual) => ({
          ...atual,
          [compromisso.id]:
            pagamentos,
        })
      );

      setHistoricoAberto(
        compromisso.id
      );
    } catch (error) {
      console.error(
        "Erro ao carregar histórico:",
        error
      );
    }
  }

  function abrirNovo() {
    setCompromissoEditando(null);
    setFormulario(formularioInicial);
    setModalAberto(true);
  }

  function abrirEdicao(
    compromisso: Compromisso
  ) {
    setCompromissoEditando(compromisso);
    setFormulario({
      descricao: compromisso.descricao,
      valorTotal: new Intl.NumberFormat("pt-BR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(compromisso.valorTotal),
      categoria: compromisso.categoria,
      dataCompra: compromisso.dataCompra,
    });
    setModalAberto(true);
  }

  async function salvarCompromisso(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    const valor = parseValorMoeda(
      formulario.valorTotal
    );

    if (!formulario.descricao.trim()) {
      alert(
        "Informe a descrição da compra."
      );
      return;
    }

    if (
      !Number.isFinite(valor) ||
      valor <= 0
    ) {
      alert(
        "Informe um valor total válido."
      );
      return;
    }

    try {
      setSalvando(true);

      if (compromissoEditando) {
        await atualizarCompromisso(
          compromissoEditando.id,
          {
            descricao:
              formulario.descricao.trim(),
            valorTotal: valor,
            categoria:
              formulario.categoria,
            dataCompra:
              formulario.dataCompra,
          }
        );
      } else {
        await cadastrarCompromisso({
          descricao:
            formulario.descricao.trim(),
          valorTotal: valor,
          categoria:
            formulario.categoria,
          dataCompra:
            formulario.dataCompra,
        });
      }

      setModalAberto(false);
      setCompromissoEditando(null);
      await carregar();
    } catch (error) {
      console.error(
        "Erro ao cadastrar compromisso:",
        error
      );

      alert(
        "Não foi possível cadastrar a compra."
      );
    } finally {
      setSalvando(false);
    }
  }

  function abrirPagamento(
    compromisso: Compromisso
  ) {
    setCompromissoPagamento(
      compromisso
    );

    setPagamentoFormulario({
      data: hoje(),
      valor: "",
      observacao: "",
    });
  }

  async function salvarPagamento(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!compromissoPagamento) {
      return;
    }

    const valor = parseValorMoeda(
      pagamentoFormulario.valor
    );

    if (
      !Number.isFinite(valor) ||
      valor <= 0
    ) {
      alert(
        "Informe um valor de pagamento válido."
      );
      return;
    }

    try {
      setSalvando(true);

      await registrarPagamentoCompromisso(
        compromissoPagamento.id,
        {
          data:
            pagamentoFormulario.data,
          valor,
          observacao:
            pagamentoFormulario.observacao.trim(),
        }
      );

      setCompromissoPagamento(
        null
      );

      await carregar();
    } catch (error) {
      console.error(
        "Erro ao registrar pagamento:",
        error
      );

      alert(
        error instanceof Error
          ? error.message
          : "Não foi possível registrar o pagamento."
      );
    } finally {
      setSalvando(false);
    }
  }

  function excluir(
    compromisso: Compromisso
  ) {
    setCompromissoParaExcluir(
      compromisso
    );
  }

  async function confirmarExclusao() {
    if (!compromissoParaExcluir) {
      return;
    }

    try {
      setSalvando(true);

      await excluirCompromisso(
        compromissoParaExcluir.id
      );

      setCompromissoParaExcluir(null);
      await carregar();
    } catch (error) {
      console.error(
        "Erro ao excluir compromisso:",
        error
      );

      alert(
        "Não foi possível excluir o compromisso."
      );
    } finally {
      setSalvando(false);
    }
  }

  const totalEmAberto =
    compromissos.reduce(
      (total, item) =>
        total + item.saldoDevedor,
      0
    );

  const totalOriginal =
    compromissos.reduce(
      (total, item) =>
        total + item.valorTotal,
      0
    );

  const totalPago =
    compromissos.reduce(
      (total, item) =>
        total + item.totalPago,
      0
    );

  return (
    <main className="min-h-dvh bg-[#121212] text-white">
      <header className="border-b border-[#2c2c2c] bg-[#171717]">
        <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#FDC700]/10 text-[#FDC700]">
                <ReceiptText size={22} />
              </div>

              <div>
                <h1 className="text-xl font-bold text-[#FDC700] sm:text-2xl">
                  Compras em aberto
                </h1>
                <p className="mt-1 text-sm text-gray-400">
                  Controle de compras e dívidas pagas aos poucos
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() =>
                  router.push(
                    "/financeiro/despesas"
                  )
                }
                className="flex h-10 items-center gap-2 rounded-lg border border-[#303030] bg-[#1c1c1c] px-3 text-sm text-gray-400 hover:bg-[#292929] hover:text-white"
              >
                <ArrowLeft size={16} />
                Voltar
              </button>

              <button
                type="button"
                onClick={abrirNovo}
                className="flex h-10 items-center gap-2 rounded-lg bg-[#FDC700] px-4 text-sm font-bold text-black hover:bg-[#e5b400]"
              >
                <Plus size={17} />
                Nova compra
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-[#303030] bg-[#1c1c1c] p-4">
            <p className="text-xs text-gray-500">
              Valor contratado
            </p>
            <p className="mt-1 text-lg font-bold text-white">
              {moeda(totalOriginal)}
            </p>
          </div>

          <div className="rounded-xl border border-[#303030] bg-[#1c1c1c] p-4">
            <p className="text-xs text-gray-500">
              Total pago
            </p>
            <p className="mt-1 text-lg font-bold text-green-400">
              {moeda(totalPago)}
            </p>
          </div>

          <div className="rounded-xl border border-[#303030] bg-[#1c1c1c] p-4">
            <p className="text-xs text-gray-500">
              Saldo devedor
            </p>
            <p className="mt-1 text-lg font-bold text-yellow-400">
              {moeda(totalEmAberto)}
            </p>
          </div>
        </div>

        <div className="mt-5 rounded-xl border border-[#303030] bg-[#1c1c1c]">
          <div className="border-b border-[#303030] px-5 py-4">
            <h2 className="text-sm font-semibold text-white">
              Compras e compromissos
            </h2>
            <p className="mt-1 text-xs text-gray-600">
              Cada pagamento pode ter um valor diferente. O saldo é abatido automaticamente.
            </p>
          </div>

          {loading ? (
            <div className="p-10 text-center text-sm text-gray-500">
              Carregando...
            </div>
          ) : compromissos.length === 0 ? (
            <div className="p-12 text-center">
              <ReceiptText
                size={34}
                className="mx-auto text-gray-700"
              />
              <p className="mt-3 text-sm text-gray-400">
                Nenhuma compra em aberto.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-[#292929]">
              {compromissos.map(
                (compromisso) => (
                  <div
                    key={
                      compromisso.id
                    }
                    className="p-5"
                  >
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-sm font-semibold text-white">
                            {
                              compromisso.descricao
                            }
                          </h3>

                          <span className="rounded-full bg-[#FDC700]/10 px-2.5 py-1 text-[10px] text-[#FDC700]">
                            {
                              categorias.find(
                                (item) =>
                                  item.value ===
                                  compromisso.categoria
                              )?.label
                            }
                          </span>

                          <span
                            className={`rounded-full border px-2.5 py-1 text-[10px] ${
                              compromisso.status ===
                              "quitado"
                                ? "border-green-500/30 bg-green-500/10 text-green-400"
                                : "border-yellow-500/30 bg-yellow-500/10 text-yellow-400"
                            }`}
                          >
                            {compromisso.status ===
                            "quitado"
                              ? "Quitado"
                              : "Em aberto"}
                          </span>
                        </div>

                        <p className="mt-1 text-xs text-gray-600">
                          Compra em{" "}
                          {dataBR(
                            compromisso.dataCompra
                          )}
                        </p>
                      </div>

                      <div className="grid grid-cols-3 gap-4 lg:min-w-[420px]">
                        <div>
                          <p className="text-[11px] text-gray-600">
                            Total
                          </p>
                          <p className="mt-1 text-sm font-medium text-white">
                            {moeda(
                              compromisso.valorTotal
                            )}
                          </p>
                        </div>

                        <div>
                          <p className="text-[11px] text-gray-600">
                            Pago
                          </p>
                          <p className="mt-1 text-sm font-medium text-green-400">
                            {moeda(
                              compromisso.totalPago
                            )}
                          </p>
                        </div>

                        <div>
                          <p className="text-[11px] text-gray-600">
                            Saldo
                          </p>
                          <p className="mt-1 text-sm font-medium text-yellow-400">
                            {moeda(
                              compromisso.saldoDevedor
                            )}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {compromisso.status !==
                          "quitado" && (
                          <button
                            type="button"
                            onClick={() =>
                              abrirPagamento(
                                compromisso
                              )
                            }
                            className="flex h-9 items-center gap-1.5 rounded-lg bg-green-500/10 px-3 text-xs font-medium text-green-400 hover:bg-green-500/20"
                          >
                            <CircleDollarSign
                              size={15}
                            />
                            Registrar pagamento
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() =>
                            abrirEdicao(
                              compromisso
                            )
                          }
                          className="flex h-9 items-center justify-center gap-1.5 rounded-lg border border-[#303030] bg-[#1c1c1c] px-3 text-xs text-gray-400 hover:border-[#FDC700]/40 hover:bg-[#FDC700]/10 hover:text-[#FDC700]"
                          title="Editar compra"
                        >
                          <Pencil size={15} />
                          Editar
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            abrirHistorico(
                              compromisso
                            )
                          }
                          className="flex h-9 items-center gap-1.5 rounded-lg border border-[#303030] px-3 text-xs text-gray-400 hover:bg-[#292929] hover:text-white"
                        >
                          {historicoAberto ===
                          compromisso.id ? (
                            <ChevronUp
                              size={15}
                            />
                          ) : (
                            <ChevronDown
                              size={15}
                            />
                          )}
                          Histórico
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            excluir(
                              compromisso
                            )
                          }
                          className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 hover:bg-red-500/10 hover:text-red-400"
                          title="Excluir"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>

                    {historicoAberto ===
                      compromisso.id && (
                      <div className="mt-4 rounded-xl border border-[#303030] bg-[#151515]">
                        <div className="border-b border-[#292929] px-4 py-3">
                          <p className="text-xs font-semibold text-gray-300">
                            Histórico de pagamentos
                          </p>
                        </div>

                        {(
                          historicos[
                            compromisso.id
                          ] ?? []
                        ).length === 0 ? (
                          <p className="p-4 text-xs text-gray-600">
                            Nenhum pagamento registrado.
                          </p>
                        ) : (
                          <div className="divide-y divide-[#292929]">
                            {(
                              historicos[
                                compromisso.id
                              ] ?? []
                            ).map(
                              (pagamento) => (
                                <div
                                  key={
                                    pagamento.id
                                  }
                                  className="flex items-center justify-between gap-3 px-4 py-3"
                                >
                                  <div>
                                    <p className="text-xs text-gray-400">
                                      {dataBR(
                                        pagamento.data
                                      )}
                                    </p>
                                    {pagamento.observacao && (
                                      <p className="mt-1 text-[11px] text-gray-600">
                                        {
                                          pagamento.observacao
                                        }
                                      </p>
                                    )}
                                  </div>

                                  <p className="text-sm font-semibold text-green-400">
                                    {moeda(
                                      pagamento.valor
                                    )}
                                  </p>
                                </div>
                              )
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
              )}
            </div>
          )}
        </div>
      </div>

      {modalAberto && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-[#303030] bg-[#1c1c1c] shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#303030] px-5 py-4">
              <div>
                <h2 className="text-lg font-semibold text-white">
                  {compromissoEditando
                    ? "Editar compra"
                    : "Nova compra em aberto"}
                </h2>
                <p className="mt-1 text-xs text-gray-500">
                  {compromissoEditando
                    ? "Corrija os dados da compra. O valor total não pode ser menor que o total já pago."
                    : "Informe o valor total da compra. Os pagamentos serão registrados separadamente."}
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setModalAberto(false)
                }
                disabled={salvando}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-400 hover:bg-[#292929] hover:text-white"
              >
                <X size={19} />
              </button>
            </div>

            <form
              onSubmit={
                salvarCompromisso
              }
              className="space-y-5 p-5"
            >
              <div>
                <label className="mb-2 block text-sm text-gray-300">
                  Descrição
                </label>

                <input
                  value={
                    formulario.descricao
                  }
                  onChange={(event) =>
                    setFormulario(
                      (atual) => ({
                        ...atual,
                        descricao:
                          event.target.value,
                      })
                    )
                  }
                  placeholder="Ex.: Conta Samara"
                  disabled={salvando}
                  className="h-11 w-full rounded-lg border border-[#3a3a3a] bg-[#121212] px-3 text-sm text-white outline-none placeholder:text-gray-700 focus:border-[#FDC700]"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm text-gray-300">
                    Valor total
                  </label>

                  <input
                    value={
                      formulario.valorTotal
                    }
                    onChange={(event) =>
                      setFormulario(
                        (atual) => ({
                          ...atual,
                          valorTotal:
                            formatarValorMoedaInput(
                              event.target.value
                            ),
                        })
                      )
                    }
                    inputMode="numeric"
                    placeholder="0,00"
                    disabled={salvando}
                    className="h-11 w-full rounded-lg border border-[#3a3a3a] bg-[#121212] px-3 text-sm text-white outline-none placeholder:text-gray-700 focus:border-[#FDC700]"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm text-gray-300">
                    Data da compra
                  </label>

                  <input
                    type="date"
                    value={
                      formulario.dataCompra
                    }
                    onChange={(event) =>
                      setFormulario(
                        (atual) => ({
                          ...atual,
                          dataCompra:
                            event.target
                              .value,
                        })
                      )
                    }
                    disabled={salvando}
                    className="h-11 w-full rounded-lg border border-[#3a3a3a] bg-[#121212] px-3 text-sm text-white outline-none focus:border-[#FDC700]"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm text-gray-300">
                  Categoria
                </label>

                <select
                  value={
                    formulario.categoria
                  }
                  onChange={(event) =>
                    setFormulario(
                      (atual) => ({
                        ...atual,
                        categoria:
                          event.target
                            .value as CategoriaCompromisso,
                      })
                    )
                  }
                  disabled={salvando}
                  className="h-11 w-full rounded-lg border border-[#3a3a3a] bg-[#121212] px-3 text-sm text-white outline-none focus:border-[#FDC700]"
                >
                  {categorias.map(
                    (item) => (
                      <option
                        key={
                          item.value
                        }
                        value={
                          item.value
                        }
                      >
                        {item.label}
                      </option>
                    )
                  )}
                </select>
              </div>

              <div className="flex justify-end gap-2 border-t border-[#303030] pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setModalAberto(false);
                    setCompromissoEditando(null);
                  }}
                  disabled={salvando}
                  className="h-10 rounded-lg border border-[#303030] px-4 text-sm text-gray-400 hover:bg-[#292929]"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={salvando}
                  className="h-10 rounded-lg bg-[#FDC700] px-5 text-sm font-bold text-black hover:bg-[#e5b400]"
                >
                  {salvando
                    ? "Salvando..."
                    : compromissoEditando
                    ? "Salvar alterações"
                    : "Salvar compra"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {compromissoParaExcluir && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md overflow-hidden rounded-2xl border border-[#303030] bg-[#1c1c1c] shadow-2xl">
            <div className="flex items-start justify-between border-b border-[#303030] px-5 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/10 text-red-400">
                  <Trash2 size={19} />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-white">
                    Excluir compra
                  </h2>
                  <p className="mt-1 text-xs text-gray-500">
                    Esta ação não poderá ser desfeita.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() =>
                  setCompromissoParaExcluir(null)
                }
                disabled={salvando}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-400 hover:bg-[#292929] hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <div className="px-5 py-5">
              <p className="text-sm leading-6 text-gray-400">
                Deseja realmente excluir a compra{" "}
                <span className="font-semibold text-white">
                  "{compromissoParaExcluir.descricao}"
                </span>{" "}
                e todo o histórico de pagamentos?
              </p>
            </div>

            <div className="flex justify-end gap-2 border-t border-[#303030] px-5 py-4">
              <button
                type="button"
                onClick={() =>
                  setCompromissoParaExcluir(null)
                }
                disabled={salvando}
                className="h-10 rounded-lg border border-[#303030] px-4 text-sm text-gray-400 hover:bg-[#292929] hover:text-white disabled:opacity-50"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={confirmarExclusao}
                disabled={salvando}
                className="h-10 rounded-lg bg-red-500/10 px-4 text-sm font-semibold text-red-400 hover:bg-red-500/20 disabled:opacity-50"
              >
                {salvando
                  ? "Excluindo..."
                  : "Excluir compra"}
              </button>
            </div>
          </div>
        </div>
      )}

      {compromissoPagamento && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-[#303030] bg-[#1c1c1c] shadow-2xl">
            <div className="flex items-start justify-between border-b border-[#303030] px-5 py-4">
              <div>
                <h2 className="text-lg font-semibold text-white">
                  Registrar pagamento
                </h2>

                <p className="mt-1 text-xs text-gray-500">
                  {compromissoPagamento.descricao}
                </p>

                <p className="mt-2 text-sm text-yellow-400">
                  Saldo atual:{" "}
                  {moeda(
                    compromissoPagamento.saldoDevedor
                  )}
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setCompromissoPagamento(
                    null
                  )
                }
                disabled={salvando}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-400 hover:bg-[#292929] hover:text-white"
              >
                <X size={19} />
              </button>
            </div>

            <form
              onSubmit={
                salvarPagamento
              }
              className="space-y-5 p-5"
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm text-gray-300">
                    Valor pago
                  </label>

                  <input
                    value={
                      pagamentoFormulario.valor
                    }
                    onChange={(event) =>
                      setPagamentoFormulario(
                        (atual) => ({
                          ...atual,
                          valor:
                            formatarValorMoedaInput(
                              event.target.value
                            ),
                        })
                      )
                    }
                    inputMode="numeric"
                    placeholder="0,00"
                    disabled={salvando}
                    className="h-11 w-full rounded-lg border border-[#3a3a3a] bg-[#121212] px-3 text-sm text-white outline-none placeholder:text-gray-700 focus:border-[#FDC700]"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm text-gray-300">
                    Data do pagamento
                  </label>

                  <input
                    type="date"
                    value={
                      pagamentoFormulario.data
                    }
                    onChange={(event) =>
                      setPagamentoFormulario(
                        (atual) => ({
                          ...atual,
                          data:
                            event.target
                              .value,
                        })
                      )
                    }
                    disabled={salvando}
                    className="h-11 w-full rounded-lg border border-[#3a3a3a] bg-[#121212] px-3 text-sm text-white outline-none focus:border-[#FDC700]"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm text-gray-300">
                  Observação
                </label>

                <textarea
                  value={
                    pagamentoFormulario.observacao
                  }
                  onChange={(event) =>
                    setPagamentoFormulario(
                      (atual) => ({
                        ...atual,
                        observacao:
                          event.target
                            .value,
                      })
                    )
                  }
                  rows={3}
                  disabled={salvando}
                  placeholder="Opcional"
                  className="w-full resize-none rounded-lg border border-[#3a3a3a] bg-[#121212] px-3 py-3 text-sm text-white outline-none placeholder:text-gray-700 focus:border-[#FDC700]"
                />
              </div>

              <div className="flex justify-end gap-2 border-t border-[#303030] pt-4">
                <button
                  type="button"
                  onClick={() =>
                    setCompromissoPagamento(
                      null
                    )
                  }
                  disabled={salvando}
                  className="h-10 rounded-lg border border-[#303030] px-4 text-sm text-gray-400 hover:bg-[#292929]"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={salvando}
                  className="flex h-10 items-center gap-2 rounded-lg bg-[#FDC700] px-5 text-sm font-bold text-black hover:bg-[#e5b400]"
                >
                  <Check size={16} />
                  {salvando
                    ? "Salvando..."
                    : "Registrar pagamento"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
