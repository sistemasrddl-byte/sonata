"use client";

import {
  Eye,
  EyeOff,
  KeyRound,
  LogOut,
  Mail,
  Save,
  UserRound,
} from "lucide-react";
import {
  FormEvent,
  useEffect,
  useState,
} from "react";

import "@/lib/firebase";

import {
  EmailAuthProvider,
  getAuth,
  onAuthStateChanged,
  reauthenticateWithCredential,
  signOut,
  updatePassword,
  updateProfile,
  User,
} from "firebase/auth";

export default function ConfiguracoesUsuarioPage() {
  const [usuario, setUsuario] =
    useState<User | null>(null);

  const [nome, setNome] =
    useState("");

  const [senhaAtual, setSenhaAtual] =
    useState("");

  const [novaSenha, setNovaSenha] =
    useState("");

  const [confirmarSenha, setConfirmarSenha] =
    useState("");

  const [mostrarSenhaAtual, setMostrarSenhaAtual] =
    useState(false);

  const [mostrarNovaSenha, setMostrarNovaSenha] =
    useState(false);

  const [mostrarConfirmarSenha, setMostrarConfirmarSenha] =
    useState(false);

  const [loading, setLoading] =
    useState(true);

  const [salvandoNome, setSalvandoNome] =
    useState(false);

  const [alterandoSenha, setAlterandoSenha] =
    useState(false);

  const [saindo, setSaindo] =
    useState(false);

  const [mensagem, setMensagem] =
    useState("");

  const [erro, setErro] =
    useState("");

  useEffect(() => {
    const auth = getAuth();

    const unsubscribe =
      onAuthStateChanged(auth, (user) => {
        setUsuario(user);
        setNome(user?.displayName ?? "");
        setLoading(false);
      });

    return unsubscribe;
  }, []);

  function limparMensagens() {
    setMensagem("");
    setErro("");
  }

  async function salvarNome(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    limparMensagens();

    if (!usuario) {
      setErro(
        "Nenhum usuário está conectado."
      );
      return;
    }

    if (!nome.trim()) {
      setErro(
        "Informe o nome do usuário."
      );
      return;
    }

    try {
      setSalvandoNome(true);

      await updateProfile(usuario, {
        displayName: nome.trim(),
      });

      setNome(nome.trim());

      setMensagem(
        "Nome do usuário atualizado com sucesso."
      );
    } catch (error) {
      console.error(
        "Erro ao atualizar nome:",
        error
      );

      setErro(
        "Não foi possível atualizar o nome do usuário."
      );
    } finally {
      setSalvandoNome(false);
    }
  }

  async function alterarSenha(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    limparMensagens();

    if (!usuario?.email) {
      setErro(
        "Não foi possível identificar o e-mail da conta."
      );
      return;
    }

    if (!senhaAtual) {
      setErro(
        "Informe a senha atual."
      );
      return;
    }

    if (!novaSenha) {
      setErro(
        "Informe a nova senha."
      );
      return;
    }

    if (novaSenha.length < 6) {
      setErro(
        "A nova senha deve ter pelo menos 6 caracteres."
      );
      return;
    }

    if (novaSenha !== confirmarSenha) {
      setErro(
        "A confirmação da nova senha não confere."
      );
      return;
    }

    if (senhaAtual === novaSenha) {
      setErro(
        "A nova senha deve ser diferente da senha atual."
      );
      return;
    }

    try {
      setAlterandoSenha(true);

      const credencial =
        EmailAuthProvider.credential(
          usuario.email,
          senhaAtual
        );

      await reauthenticateWithCredential(
        usuario,
        credencial
      );

      await updatePassword(
        usuario,
        novaSenha
      );

      setSenhaAtual("");
      setNovaSenha("");
      setConfirmarSenha("");

      setMensagem(
        "Senha alterada com sucesso."
      );
    } catch (error: unknown) {
      console.error(
        "Erro ao alterar senha:",
        error
      );

      const codigo =
        typeof error === "object" &&
        error !== null &&
        "code" in error
          ? String(
              (error as { code?: unknown }).code
            )
          : "";

      if (
        codigo ===
        "auth/invalid-credential"
      ) {
        setErro(
          "A senha atual está incorreta."
        );
      } else if (
        codigo ===
        "auth/weak-password"
      ) {
        setErro(
          "A nova senha é muito fraca. Use pelo menos 6 caracteres."
        );
      } else if (
        codigo ===
        "auth/requires-recent-login"
      ) {
        setErro(
          "Por segurança, faça login novamente e tente alterar a senha."
        );
      } else {
        setErro(
          "Não foi possível alterar a senha."
        );
      }
    } finally {
      setAlterandoSenha(false);
    }
  }

  async function sair() {
    try {
      setSaindo(true);

      const auth = getAuth();

      await signOut(auth);

      window.location.href = "/login";
    } catch (error) {
      console.error(
        "Erro ao sair da conta:",
        error
      );

      setSaindo(false);
      setErro(
        "Não foi possível sair da conta."
      );
    }
  }

  if (loading) {
    return (
      <main className="min-h-dvh bg-[#121212] text-white">
        <div className="flex min-h-dvh items-center justify-center text-sm text-gray-500">
          Carregando conta...
        </div>
      </main>
    );
  }

  if (!usuario) {
    return (
      <main className="min-h-dvh bg-[#121212] text-white">
        <div className="mx-auto max-w-3xl px-4 py-10">
          <div className="rounded-2xl border border-[#303030] bg-[#1c1c1c] p-6 text-center">
            <p className="text-sm text-gray-400">
              Nenhum usuário está conectado.
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-dvh bg-[#121212] text-white">
      <header className="border-b border-[#2c2c2c] bg-[#171717]">
        <div className="mx-auto max-w-5xl px-4 py-5 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#FDC700]/10 text-[#FDC700]">
              <UserRound size={22} />
            </div>

            <div>
              <h1 className="text-xl font-bold text-[#FDC700] sm:text-2xl">
                Usuário / Conta
              </h1>

              <p className="mt-1 text-sm text-gray-400">
                Gerencie seus dados de acesso.
              </p>
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-5xl space-y-5 px-4 py-5 sm:px-6 lg:px-8">
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

        {/* Dados da conta */}
        <section className="overflow-hidden rounded-2xl border border-[#303030] bg-[#1c1c1c]">
          <div className="border-b border-[#303030] px-5 py-4 sm:px-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#FDC700]/10 text-[#FDC700]">
                <UserRound size={19} />
              </div>

              <div>
                <h2 className="text-sm font-semibold text-white">
                  Dados da conta
                </h2>

                <p className="mt-1 text-xs text-gray-500">
                  Atualize o nome exibido no sistema.
                </p>
              </div>
            </div>
          </div>

          <form
            onSubmit={salvarNome}
            className="space-y-5 p-5 sm:p-6"
          >
            <div>
              <label
                htmlFor="nome-usuario"
                className="mb-2 block text-sm text-gray-300"
              >
                Nome do usuário
              </label>

              <input
                id="nome-usuario"
                value={nome}
                onChange={(event) => {
                  setNome(event.target.value);
                  limparMensagens();
                }}
                disabled={salvandoNome}
                placeholder="Digite seu nome"
                className="h-11 w-full rounded-lg border border-[#3a3a3a] bg-[#121212] px-3 text-sm text-white outline-none placeholder:text-gray-700 focus:border-[#FDC700]"
              />
            </div>

            <div>
              <label
                htmlFor="email-usuario"
                className="mb-2 block text-sm text-gray-300"
              >
                E-mail da conta
              </label>

              <div className="relative">
                <Mail
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600"
                />

                <input
                  id="email-usuario"
                  value={usuario.email ?? ""}
                  readOnly
                  className="h-11 w-full rounded-lg border border-[#303030] bg-[#151515] pl-9 pr-3 text-sm text-gray-400 outline-none"
                />
              </div>

              <p className="mt-1.5 text-[11px] text-gray-600">
                O e-mail é o endereço utilizado para acessar a conta.
              </p>
            </div>

            <div className="flex justify-end border-t border-[#303030] pt-5">
              <button
                type="submit"
                disabled={salvandoNome}
                className="flex h-11 items-center gap-2 rounded-lg bg-[#FDC700] px-5 text-sm font-semibold text-black transition hover:bg-[#e8b900] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Save size={17} />
                {salvandoNome
                  ? "Salvando..."
                  : "Salvar nome"}
              </button>
            </div>
          </form>
        </section>

        {/* Alterar senha */}
        <section className="overflow-hidden rounded-2xl border border-[#303030] bg-[#1c1c1c]">
          <div className="border-b border-[#303030] px-5 py-4 sm:px-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#FDC700]/10 text-[#FDC700]">
                <KeyRound size={19} />
              </div>

              <div>
                <h2 className="text-sm font-semibold text-white">
                  Alterar senha
                </h2>

                <p className="mt-1 text-xs text-gray-500">
                  Informe sua senha atual e escolha uma nova senha.
                </p>
              </div>
            </div>
          </div>

          <form
            onSubmit={alterarSenha}
            className="space-y-5 p-5 sm:p-6"
          >
            <div>
              <label
                htmlFor="senha-atual"
                className="mb-2 block text-sm text-gray-300"
              >
                Senha atual
              </label>

              <div className="relative">
                <input
                  id="senha-atual"
                  type={
                    mostrarSenhaAtual
                      ? "text"
                      : "password"
                  }
                  value={senhaAtual}
                  onChange={(event) => {
                    setSenhaAtual(event.target.value);
                    limparMensagens();
                  }}
                  disabled={alterandoSenha}
                  autoComplete="current-password"
                  className="h-11 w-full rounded-lg border border-[#3a3a3a] bg-[#121212] px-3 pr-11 text-sm text-white outline-none focus:border-[#FDC700]"
                />

                <button
                  type="button"
                  onClick={() =>
                    setMostrarSenhaAtual(
                      (valor) => !valor
                    )
                  }
                  className="absolute right-0 top-0 flex h-11 w-11 items-center justify-center text-gray-500 hover:text-white"
                  aria-label={
                    mostrarSenhaAtual
                      ? "Ocultar senha"
                      : "Mostrar senha"
                  }
                >
                  {mostrarSenhaAtual ? (
                    <EyeOff size={17} />
                  ) : (
                    <Eye size={17} />
                  )}
                </button>
              </div>
            </div>

            <div>
              <label
                htmlFor="nova-senha"
                className="mb-2 block text-sm text-gray-300"
              >
                Nova senha
              </label>

              <div className="relative">
                <input
                  id="nova-senha"
                  type={
                    mostrarNovaSenha
                      ? "text"
                      : "password"
                  }
                  value={novaSenha}
                  onChange={(event) => {
                    setNovaSenha(event.target.value);
                    limparMensagens();
                  }}
                  disabled={alterandoSenha}
                  autoComplete="new-password"
                  className="h-11 w-full rounded-lg border border-[#3a3a3a] bg-[#121212] px-3 pr-11 text-sm text-white outline-none focus:border-[#FDC700]"
                />

                <button
                  type="button"
                  onClick={() =>
                    setMostrarNovaSenha(
                      (valor) => !valor
                    )
                  }
                  className="absolute right-0 top-0 flex h-11 w-11 items-center justify-center text-gray-500 hover:text-white"
                  aria-label={
                    mostrarNovaSenha
                      ? "Ocultar senha"
                      : "Mostrar senha"
                  }
                >
                  {mostrarNovaSenha ? (
                    <EyeOff size={17} />
                  ) : (
                    <Eye size={17} />
                  )}
                </button>
              </div>
            </div>

            <div>
              <label
                htmlFor="confirmar-senha"
                className="mb-2 block text-sm text-gray-300"
              >
                Confirmar nova senha
              </label>

              <div className="relative">
                <input
                  id="confirmar-senha"
                  type={
                    mostrarConfirmarSenha
                      ? "text"
                      : "password"
                  }
                  value={confirmarSenha}
                  onChange={(event) => {
                    setConfirmarSenha(
                      event.target.value
                    );
                    limparMensagens();
                  }}
                  disabled={alterandoSenha}
                  autoComplete="new-password"
                  className="h-11 w-full rounded-lg border border-[#3a3a3a] bg-[#121212] px-3 pr-11 text-sm text-white outline-none focus:border-[#FDC700]"
                />

                <button
                  type="button"
                  onClick={() =>
                    setMostrarConfirmarSenha(
                      (valor) => !valor
                    )
                  }
                  className="absolute right-0 top-0 flex h-11 w-11 items-center justify-center text-gray-500 hover:text-white"
                  aria-label={
                    mostrarConfirmarSenha
                      ? "Ocultar senha"
                      : "Mostrar senha"
                  }
                >
                  {mostrarConfirmarSenha ? (
                    <EyeOff size={17} />
                  ) : (
                    <Eye size={17} />
                  )}
                </button>
              </div>

              <p className="mt-1.5 text-[11px] text-gray-600">
                A nova senha deve ter pelo menos 6 caracteres.
              </p>
            </div>

            <div className="flex justify-end border-t border-[#303030] pt-5">
              <button
                type="submit"
                disabled={alterandoSenha}
                className="flex h-11 items-center gap-2 rounded-lg bg-[#FDC700] px-5 text-sm font-semibold text-black transition hover:bg-[#e8b900] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <KeyRound size={17} />
                {alterandoSenha
                  ? "Alterando..."
                  : "Alterar senha"}
              </button>
            </div>
          </form>
        </section>

        {/* Sair */}
        <section className="rounded-2xl border border-red-500/20 bg-[#1c1c1c] p-5 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-sm font-semibold text-white">
                Sair da conta
              </h2>

              <p className="mt-1 text-xs text-gray-500">
                Encerra a sessão neste dispositivo.
              </p>
            </div>

            <button
              type="button"
              onClick={sair}
              disabled={saindo}
              className="flex h-10 items-center justify-center gap-2 rounded-lg border border-red-500/30 px-4 text-sm font-medium text-red-400 transition hover:bg-red-500/10 hover:text-red-300 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <LogOut size={17} />
              {saindo
                ? "Saindo..."
                : "Sair da conta"}
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}
