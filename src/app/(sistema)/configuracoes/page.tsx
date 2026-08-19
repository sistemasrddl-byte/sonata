"use client";

import {
  Building2,
  MapPin,
  Phone,
  Save,
} from "lucide-react";
import {
  FormEvent,
  useEffect,
  useState,
} from "react";

import {
  buscarConfiguracaoEscola,
  salvarConfiguracaoEscola,
} from "@/services/escola-config.service";

import { ConfiguracaoEscola } from "@/types/escola";

const configuracaoInicial: ConfiguracaoEscola = {
  nome: "",
  telefone: "",
  endereco: "",
  cidade: "",
  estado: "",
};

export default function ConfiguracoesPage() {
  const [formulario, setFormulario] =
    useState<ConfiguracaoEscola>(
      configuracaoInicial
    );

  const [loading, setLoading] =
    useState(true);

  const [salvando, setSalvando] =
    useState(false);

  const [mensagem, setMensagem] =
    useState("");

  const [erro, setErro] =
    useState("");

  useEffect(() => {
    async function carregar() {
      try {
        setLoading(true);
        setErro("");

        const dados =
          await buscarConfiguracaoEscola();

        setFormulario(dados);
      } catch (error) {
        console.error(
          "Erro ao carregar configurações:",
          error
        );

        setErro(
          "Não foi possível carregar os dados da escola."
        );
      } finally {
        setLoading(false);
      }
    }

    carregar();
  }, []);

  function alterarCampo(
    campo: keyof ConfiguracaoEscola,
    valor: string
  ) {
    setFormulario((atual) => ({
      ...atual,
      [campo]: valor,
    }));

    setMensagem("");
    setErro("");
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!formulario.nome.trim()) {
      setErro(
        "Informe o nome da escola."
      );
      return;
    }

    try {
      setSalvando(true);
      setMensagem("");
      setErro("");

      await salvarConfiguracaoEscola(
        formulario
      );

      setMensagem(
        "Dados da escola salvos com sucesso."
      );
    } catch (error) {
      console.error(
        "Erro ao salvar configurações:",
        error
      );

      setErro(
        "Não foi possível salvar os dados da escola."
      );
    } finally {
      setSalvando(false);
    }
  }

function formatarTelefone(valor: string): string {
  const numeros = valor.replace(/\D/g, "").slice(0, 11);

  if (numeros.length <= 2) {
    return numeros.length
      ? `(${numeros}`
      : "";
  }

  if (numeros.length <= 6) {
    return `(${numeros.slice(0, 2)}) ${numeros.slice(2)}`;
  }

  if (numeros.length <= 10) {
    return `(${numeros.slice(0, 2)}) ${numeros.slice(
      2,
      6
    )}-${numeros.slice(6)}`;
  }

  return `(${numeros.slice(0, 2)}) ${numeros.slice(
    2,
    7
  )}-${numeros.slice(7)}`;
}

  return (
    <main className="min-h-dvh bg-[#121212] text-white">
      <header className="border-b border-[#2c2c2c] bg-[#171717]">
        <div className="mx-auto max-w-5xl px-4 py-5 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#FDC700]/10 text-[#FDC700]">
              <Building2 size={22} />
            </div>

            <div>
              <h1 className="text-xl font-bold text-[#FDC700] sm:text-2xl">
                Configurações
              </h1>

              <p className="mt-1 text-sm text-gray-400">
                Gerencie os dados da escola.
              </p>
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-4 py-5 sm:px-6 lg:px-8">
        <section className="overflow-hidden rounded-2xl border border-[#303030] bg-[#1c1c1c]">
          <div className="border-b border-[#303030] px-5 py-4 sm:px-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#FDC700]/10 text-[#FDC700]">
                <MapPin size={19} />
              </div>

              <div>
                <h2 className="text-sm font-semibold text-white">
                  Dados da escola
                </h2>

                <p className="mt-1 text-xs text-gray-500">
                  Essas informações poderão ser usadas futuramente em relatórios e documentos.
                </p>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="p-10 text-center text-sm text-gray-500">
              Carregando configurações...
            </div>
          ) : (
            <form
              onSubmit={handleSubmit}
              className="space-y-5 p-5 sm:p-6"
            >
              <div>
                <label
                  htmlFor="nome-escola"
                  className="mb-2 block text-sm text-gray-300"
                >
                  Nome da escola
                </label>

                <input
                  id="nome-escola"
                  value={formulario.nome}
                  onChange={(event) =>
                    alterarCampo(
                      "nome",
                      event.target.value
                    )
                  }
                  disabled={salvando}
                  placeholder="Digite o nome da escola"
                  className="h-11 w-full rounded-lg border border-[#3a3a3a] bg-[#121212] px-3 text-sm text-white outline-none placeholder:text-gray-700 focus:border-[#FDC700]"
                />
              </div>

              <div>
                <label
                  htmlFor="telefone-escola"
                  className="mb-2 block text-sm text-gray-300"
                >
                  Telefone / WhatsApp
                </label>

                <div className="relative">
                  <Phone
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600"
                  />

                  <input
                    id="telefone-escola"
                    value={formulario.telefone}
                   onChange={(event) =>
                    alterarCampo(
                      "telefone",
                      formatarTelefone(event.target.value)
                    )
                  }
                    disabled={salvando}
                    placeholder="(00) 00000-0000"
                    className="h-11 w-full rounded-lg border border-[#3a3a3a] bg-[#121212] pl-9 pr-3 text-sm text-white outline-none placeholder:text-gray-700 focus:border-[#FDC700]"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="endereco-escola"
                  className="mb-2 block text-sm text-gray-300"
                >
                  Endereço
                </label>

                <input
                  id="endereco-escola"
                  value={formulario.endereco}
                  onChange={(event) =>
                    alterarCampo(
                      "endereco",
                      event.target.value
                    )
                  }
                  disabled={salvando}
                  placeholder="Rua, número, bairro..."
                  className="h-11 w-full rounded-lg border border-[#3a3a3a] bg-[#121212] px-3 text-sm text-white outline-none placeholder:text-gray-700 focus:border-[#FDC700]"
                />
              </div>

              <div className="grid gap-5 sm:grid-cols-[1fr_180px]">
                <div>
                  <label
                    htmlFor="cidade-escola"
                    className="mb-2 block text-sm text-gray-300"
                  >
                    Cidade
                  </label>

                  <input
                    id="cidade-escola"
                    value={formulario.cidade}
                    onChange={(event) =>
                      alterarCampo(
                        "cidade",
                        event.target.value
                      )
                    }
                    disabled={salvando}
                    placeholder="Cidade"
                    className="h-11 w-full rounded-lg border border-[#3a3a3a] bg-[#121212] px-3 text-sm text-white outline-none placeholder:text-gray-700 focus:border-[#FDC700]"
                  />
                </div>

                <div>
                  <label
                    htmlFor="estado-escola"
                    className="mb-2 block text-sm text-gray-300"
                  >
                    Estado
                  </label>

                  <input
                    id="estado-escola"
                    value={formulario.estado}
                    onChange={(event) =>
                      alterarCampo(
                        "estado",
                        event.target.value
                      )
                    }
                    disabled={salvando}
                    placeholder="MA"
                    maxLength={2}
                    className="h-11 w-full rounded-lg border border-[#3a3a3a] bg-[#121212] px-3 text-sm uppercase text-white outline-none placeholder:text-gray-700 focus:border-[#FDC700]"
                  />
                </div>
              </div>

              {erro && (
                <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                  {erro}
                </div>
              )}

              {mensagem && (
                <div className="rounded-lg border border-green-500/20 bg-green-500/10 px-4 py-3 text-sm text-green-400">
                  {mensagem}
                </div>
              )}

              <div className="flex justify-end border-t border-[#303030] pt-5">
                <button
                  type="submit"
                  disabled={salvando}
                  className="flex h-11 items-center gap-2 rounded-lg bg-[#FDC700] px-5 text-sm font-semibold text-black transition hover:bg-[#e8b900] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Save size={17} />
                  {salvando
                    ? "Salvando..."
                    : "Salvar alterações"}
                </button>
              </div>
            </form>
          )}
        </section>
      </div>
    </main>
  );
}
