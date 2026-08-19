"use client";

import Image from "next/image";
import Link from "next/link";
import { FormEvent, useState } from "react";
import {
  ArrowLeft,
  Building2,
  Lock,
  Mail,
  Music2,
  User,
} from "lucide-react";
import { useRouter } from "next/navigation";
import {
  createUserWithEmailAndPassword,
  updateProfile,
} from "firebase/auth";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";

import { auth, db } from "@/lib/firebase";

export default function CadastroPage() {
  const router = useRouter();

  const [nome, setNome] = useState("");
  const [escola, setEscola] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] =
    useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleCadastro(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError("");

    if (!nome.trim()) {
      setError("Digite seu nome.");
      return;
    }

    if (!escola.trim()) {
      setError("Digite o nome da escola.");
      return;
    }

    if (!email.trim()) {
      setError("Digite seu e-mail.");
      return;
    }

    if (senha.length < 6) {
      setError(
        "A senha deve ter pelo menos 6 caracteres."
      );
      return;
    }

    if (senha !== confirmarSenha) {
      setError("As senhas não conferem.");
      return;
    }

    try {
      setLoading(true);

      const credential =
        await createUserWithEmailAndPassword(
          auth,
          email.trim(),
          senha
        );

      const user = credential.user;

      await updateProfile(user, {
        displayName: nome.trim(),
      });

      await setDoc(
        doc(db, "escolas", user.uid),
        {
          nome: escola.trim(),
          proprietarioId: user.uid,
          proprietarioNome: nome.trim(),
          email: email.trim(),
          criadoEm: serverTimestamp(),
        }
      );

      router.replace("/dashboard");
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

        if (code === "auth/email-already-in-use") {
          setError(
            "Este e-mail já possui uma conta."
          );
        } else if (
          code === "auth/invalid-email"
        ) {
          setError("Digite um e-mail válido.");
        } else if (
          code === "auth/weak-password"
        ) {
          setError(
            "A senha escolhida é muito fraca."
          );
        } else {
          setError(
            "Não foi possível criar a conta. Tente novamente."
          );
        }
      } else {
        setError(
          "Não foi possível criar a conta. Tente novamente."
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
          <div className="rounded-2xl border border-[#333] bg-[#1c1c1c] px-5 py-6 shadow-2xl sm:px-8">
            <div className="mb-5 flex flex-col items-center">
              <Image
                src="/logo.png"
                alt="SONATA"
                width={110}
                height={110}
                priority
                className="h-24 w-24 object-contain"
              />

              <h1 className="mt-2 text-2xl font-bold tracking-wide text-[#FDC700]">
                Criar conta
              </h1>

              <p className="mt-1 text-center text-sm text-gray-400">
                Crie sua escola no SONATA
              </p>
            </div>

            <form
              onSubmit={handleCadastro}
              className="space-y-3"
            >
              <div>
                <label
                  htmlFor="nome"
                  className="mb-1.5 block text-sm text-gray-300"
                >
                  Seu nome
                </label>

                <div className="relative">
                  <User
                    size={18}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
                  />

                  <input
                    id="nome"
                    type="text"
                    value={nome}
                    onChange={(event) =>
                      setNome(event.target.value)
                    }
                    placeholder="Digite seu nome"
                    disabled={loading}
                    className="h-11 w-full rounded-lg border border-[#3a3a3a] bg-[#121212] pl-10 pr-3 text-sm text-white outline-none focus:border-[#FDC700] disabled:opacity-60"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="escola"
                  className="mb-1.5 block text-sm text-gray-300"
                >
                  Nome da escola
                </label>

                <div className="relative">
                  <Building2
                    size={18}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
                  />

                  <input
                    id="escola"
                    type="text"
                    value={escola}
                    onChange={(event) =>
                      setEscola(event.target.value)
                    }
                    placeholder="Nome da sua escola"
                    disabled={loading}
                    className="h-11 w-full rounded-lg border border-[#3a3a3a] bg-[#121212] pl-10 pr-3 text-sm text-white outline-none focus:border-[#FDC700] disabled:opacity-60"
                  />
                </div>
              </div>

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
                    placeholder="seu@email.com"
                    disabled={loading}
                    className="h-11 w-full rounded-lg border border-[#3a3a3a] bg-[#121212] pl-10 pr-3 text-sm text-white outline-none focus:border-[#FDC700] disabled:opacity-60"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="senha"
                  className="mb-1.5 block text-sm text-gray-300"
                >
                  Senha
                </label>

                <div className="relative">
                  <Lock
                    size={18}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
                  />

                  <input
                    id="senha"
                    type="password"
                    autoComplete="new-password"
                    value={senha}
                    onChange={(event) =>
                      setSenha(event.target.value)
                    }
                    placeholder="Mínimo de 6 caracteres"
                    disabled={loading}
                    className="h-11 w-full rounded-lg border border-[#3a3a3a] bg-[#121212] pl-10 pr-3 text-sm text-white outline-none focus:border-[#FDC700] disabled:opacity-60"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="confirmarSenha"
                  className="mb-1.5 block text-sm text-gray-300"
                >
                  Confirmar senha
                </label>

                <div className="relative">
                  <Lock
                    size={18}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
                  />

                  <input
                    id="confirmarSenha"
                    type="password"
                    autoComplete="new-password"
                    value={confirmarSenha}
                    onChange={(event) =>
                      setConfirmarSenha(
                        event.target.value
                      )
                    }
                    placeholder="Digite a senha novamente"
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
                className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-[#FDC700] text-sm font-bold text-black transition hover:bg-[#e6b500] disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Music2 size={18} />

                {loading
                  ? "Criando conta..."
                  : "Criar minha conta"}
              </button>
            </form>

            <div className="mt-5 border-t border-[#303030] pt-4 text-center">
              <p className="text-sm text-gray-400">
                Já possui uma conta?
              </p>

              <Link
                href="/"
                className="mt-1 inline-flex items-center gap-1 text-sm font-medium text-[#FDC700] hover:underline"
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