"use client";

import {
  Check,
  Monitor,
  Moon,
  Palette,
  Sun,
} from "lucide-react";
import { useEffect, useState } from "react";

type Tema = "dark" | "light" | "system";

const opcoes: {
  valor: Tema;
  titulo: string;
  descricao: string;
}[] = [
  {
    valor: "dark",
    titulo: "Escuro",
    descricao: "Tema escuro, ideal para uso no dia a dia.",
  },
  {
    valor: "light",
    titulo: "Claro",
    descricao: "Tema claro, com fundo branco e maior luminosidade.",
  },
  {
    valor: "system",
    titulo: "Automático",
    descricao: "Acompanha automaticamente o tema do dispositivo.",
  },
];

const icones = {
  dark: Moon,
  light: Sun,
  system: Monitor,
};

export default function AparenciaPage() {
  const [tema, setTema] = useState<Tema>("dark");
  const [carregado, setCarregado] = useState(false);

  useEffect(() => {
    const salvo = localStorage.getItem("sonata-theme") as Tema | null;
    const inicial: Tema =
      salvo === "light" || salvo === "system" || salvo === "dark"
        ? salvo
        : "dark";

    setTema(inicial);
    setCarregado(true);
  }, []);

  function alterarTema(novoTema: Tema) {
    setTema(novoTema);
    localStorage.setItem("sonata-theme", novoTema);

    if (novoTema === "system") {
      const claro = window.matchMedia(
        "(prefers-color-scheme: light)"
      ).matches;
      document.documentElement.dataset.theme = claro
        ? "light"
        : "dark";
    } else {
      document.documentElement.dataset.theme = novoTema;
    }

    window.dispatchEvent(new Event("sonata-theme-change"));
  }

  return (
    <main className="min-h-dvh bg-[#121212] text-white">
      <header className="border-b border-[#2c2c2c] bg-[#171717]">
        <div className="mx-auto max-w-5xl px-4 py-5 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#FDC700]/10 text-[#FDC700]">
              <Palette size={22} />
            </div>

            <div>
              <h1 className="text-xl font-bold text-[#FDC700] sm:text-2xl">
                Aparência
              </h1>
              <p className="mt-1 text-sm text-gray-400">
                Personalize a aparência do sistema.
              </p>
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-4 py-5 sm:px-6 lg:px-8">
        <section className="overflow-hidden rounded-2xl border border-[#303030] bg-[#1c1c1c]">
          <div className="border-b border-[#303030] px-5 py-4 sm:px-6">
            <h2 className="text-sm font-semibold text-white">
              Tema do sistema
            </h2>
            <p className="mt-1 text-xs text-gray-500">
              Escolha como o SONATA deve ser exibido.
            </p>
          </div>

          <div className="space-y-3 p-5 sm:p-6">
            {opcoes.map((opcao) => {
              const Icon = icones[opcao.valor];
              const selecionado = tema === opcao.valor;

              return (
                <button
                  key={opcao.valor}
                  type="button"
                  disabled={!carregado}
                  onClick={() => alterarTema(opcao.valor)}
                  className={`flex w-full items-center gap-4 rounded-xl border p-4 text-left transition ${
                    selecionado
                      ? "border-[#FDC700] bg-[#FDC700]/10"
                      : "border-[#3a3a3a] bg-[#121212] hover:border-[#666]"
                  }`}
                >
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
                      selecionado
                        ? "bg-[#FDC700] text-black"
                        : "bg-[#252525] text-gray-400"
                    }`}
                  >
                    <Icon size={19} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p
                      className={`text-sm font-semibold ${
                        selecionado
                          ? "text-[#FDC700]"
                          : "text-white"
                      }`}
                    >
                      {opcao.titulo}
                    </p>
                    <p className="mt-1 text-xs text-gray-500">
                      {opcao.descricao}
                    </p>
                  </div>

                  <div
                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
                      selecionado
                        ? "border-[#FDC700] bg-[#FDC700] text-black"
                        : "border-[#555] text-transparent"
                    }`}
                  >
                    <Check size={13} />
                  </div>
                </button>
              );
            })}
          </div>
        </section>
      </div>
    </main>
  );
}
