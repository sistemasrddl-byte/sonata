"use client";

import Image from "next/image";
import { FormEvent, useState } from "react";
import {
  Lock,
  Mail,
  Music2,
  UserPlus,
  KeyRound,
} from "lucide-react";
import Link from "next/link";

import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");

    if (!email.trim() || !password) {
      setError("Digite seu e-mail e sua senha.");
      return;
    }

    try {
      setLoading(true);

      await signInWithEmailAndPassword(
        auth,
        email.trim(),
        password
      );

      router.push("/dashboard");
    } catch (error) {
      console.error(error);

      setError("E-mail ou senha inválidos.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="h-dvh w-full overflow-hidden bg-[#121212] flex items-center justify-center p-2 sm:p-4">
      <div className="w-full max-w-md max-h-full">
        <div className="w-full rounded-2xl border border-[#333] bg-[#1c1c1c] shadow-2xl px-4 py-4 sm:px-8 sm:py-7">

          <div className="flex flex-col items-center mb-4 sm:mb-6">
            <Image
              src="/logo.png"
              alt="Escola de Música"
              width={180}
              height={180}
              priority
              className="w-24 h-24 sm:w-40 sm:h-40 object-contain"
            />

            <h1 className="mt-2 text-2xl sm:text-3xl font-bold text-[#FDC700] tracking-wide">
              SONATA
            </h1>

            <p className="mt-0.5 text-sm sm:text-base text-gray-400">
              Sistema de Gestão
            </p>
          </div>

          <form
            onSubmit={handleLogin}
            className="space-y-3 sm:space-y-4"
          >
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-300 mb-1.5"
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
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="Digite seu e-mail"
                  disabled={loading}
                  className="w-full h-11 rounded-lg bg-[#121212] border border-[#3a3a3a] pl-10 pr-4 text-sm sm:text-base text-white placeholder:text-gray-600 outline-none transition focus:border-[#FDC700] focus:ring-1 focus:ring-[#FDC700] disabled:opacity-60"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-300 mb-1.5"
              >
                Senha
              </label>

              <div className="relative">
                <Lock
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
                />

                <input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Digite sua senha"
                  disabled={loading}
                  className="w-full h-11 rounded-lg bg-[#121212] border border-[#3a3a3a] pl-10 pr-4 text-sm sm:text-base text-white placeholder:text-gray-600 outline-none transition focus:border-[#FDC700] focus:ring-1 focus:ring-[#FDC700] disabled:opacity-60"
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
              className="w-full h-11 rounded-lg bg-[#FDC700] text-black font-bold flex items-center justify-center gap-2 transition hover:bg-[#e6b500] active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <Music2 size={19} />

              {loading ? "Entrando..." : "Entrar"}
            </button>
          </form>

          <div className="mt-4 flex items-center justify-between gap-3 text-xs sm:text-sm">
  <Link
    href="/recuperar-senha"
    className="flex items-center gap-1.5 text-gray-400 transition hover:text-[#FDC700]"
  >
    <KeyRound size={15} />
    Esqueci minha senha
  </Link>
</div>

<div className="mt-4 border-t border-[#303030] pt-4 text-center">
  <p className="text-xs text-gray-500 sm:text-sm">
    Ainda não possui uma conta?
  </p>

  <Link
    href="/cadastro"
    className="mt-1 inline-flex items-center gap-1.5 text-sm font-semibold text-[#FDC700] hover:underline"
  >
    <UserPlus size={16} />
    Criar minha conta
  </Link>
</div>

          <div className="text-center mt-4 sm:mt-6">
            <p className="text-[11px] sm:text-xs text-gray-500">
              © 2026 SONATA — Escola de Música
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}