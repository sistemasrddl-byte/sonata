"use client";

import Image from "next/image";
import Link from "next/link";
import { FormEvent, useState } from "react";
import {
  ArrowLeft,
  LockKeyhole,
  Mail,
  Send,
} from "lucide-react";
import { sendPasswordResetEmail } from "firebase/auth";

import { auth } from "@/lib/firebase";

export default function RecuperarSenhaPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  async function handleRecuperarSenha(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError("");
    setSuccess(false);

    if (!email.trim()) {
      setError("Digite seu e-mail.");
      return;
    }

    try {
      setLoading(true);

      await sendPasswordResetEmail(
        auth,
        email.trim()
      );

      setSuccess(true);
    } catch (error: unknown) {
      console.error(error);

      if (
        error &&
        typeof error === "object" &&
        "code" in error
      ) {
        const code = String(
          (error as { code: unknown }).code
        );

        if (code === "auth/invalid-email") {
          setError("Digite um e-mail válido.");
        } else {
          setError(
            "Não foi possível enviar o e-mail de recuperação."
          );
        }
      } else {
        setError(
          "Não foi possível enviar o e-mail de recuperação."
        );
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="h-dvh w-full overflow-y-auto bg-[#121212] p-4 text-white">
      <div className="flex min-h-full items-center justify-center">
        <div className="w-full max-w-md">
          <div className="rounded-2xl border border-[#333] bg-[#1c1c1c] px-5 py-7 shadow-2xl sm:px-8">
            <div className="mb-6 flex flex-col items-center">
              <Image
                src="/logo.png"
                alt="SONATA"
                width={110}
                height={110}
                priority
                className="h-24 w-24 object-contain"
              />

              <div className="mt-3 flex h-11 w-11 items-center justify-center rounded-full bg-[#FDC700]/10">
                <LockKeyhole
                  size={22}
                  className="text-[#FDC700]"
                />
              </div>

              <h1 className="mt-3 text-2xl font-bold text-[#FDC700]">
                Recuperar senha
              </h1>

              <p className="mt-1 text-center text-sm text-gray-400">
                Informe seu e-mail para receber o
                link de recuperação.
              </p>
            </div>

            {success ? (
              <div className="space-y-4">
                <div className="rounded-lg border border-green-500/30 bg-green-500/10 px-4 py-4 text-center">
                  <p className="text-sm font-medium text-green-400">
                    E-mail enviado!
                  </p>

                  <p className="mt-2 text-xs leading-5 text-gray-400">
                    Verifique sua caixa de entrada e
                    siga as instruções para criar uma
                    nova senha.
                  </p>
                </div>

                <Link
                  href="/"
                  className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-[#FDC700] text-sm font-bold text-black hover:bg-[#e6b500]"
                >
                  <ArrowLeft size={17} />
                  Voltar para o login
                </Link>
              </div>
            ) : (
              <form
                onSubmit={handleRecuperarSenha}
                className="space-y-4"
              >
                <div>
                  <label
                    htmlFor="email"
                    className="mb-1.5 block text-sm text-gray-300"
                  >
                    E-mail
                  </label>

                  <div className="relative">
                    <Mail
                      size={18}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
                    />

                    <input
                      id="email"
                      type="email"
                      autoComplete="email"
                      value={email}
                      onChange={(event) =>
                        setEmail(event.target.value)
                      }
                      placeholder="Digite seu e-mail"
                      disabled={loading}
                      className="h-11 w-full rounded-lg border border-[#3a3a3a] bg-[#121212] pl-10 pr-3 text-sm text-white outline-none focus:border-[#FDC700] disabled:opacity-60"
                    />
                  </div>
                </div>

                {error && (
                  <div
                    role="alert"
                    className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-400"
                  >
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-[#FDC700] text-sm font-bold text-black hover:bg-[#e6b500] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Send size={17} />

                  {loading
                    ? "Enviando..."
                    : "Enviar link de recuperação"}
                </button>
              </form>
            )}

            <div className="mt-5 border-t border-[#303030] pt-4 text-center">
              <Link
                href="/"
                className="inline-flex items-center gap-1 text-sm text-gray-400 hover:text-[#FDC700]"
              >
                <ArrowLeft size={15} />
                Voltar para o login
              </Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}