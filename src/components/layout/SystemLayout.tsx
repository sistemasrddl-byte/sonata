"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import {
  CalendarDays,
  ChartNoAxesColumn,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  Menu,
  Music2,
  Settings,
  Users,
  Wallet,
  X,
} from "lucide-react";
import { ReactNode, useState } from "react";

import { auth } from "@/lib/firebase";

interface SystemLayoutProps {
  children: ReactNode;
}

const menuItems = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Alunos",
    href: "/alunos",
    icon: Users,
  },
  {
    label: "Professores",
    href: "/professores",
    icon: GraduationCap,
  },
  {
    label: "Agenda",
    href: "/agenda",
    icon: CalendarDays,
  },
  {
    label: "Frequência",
    href: "/frequencia",
    icon: Music2,
  },
  {
    label: "Financeiro",
    href: "/financeiro",
    icon: Wallet,
  },
  {
    label: "Relatórios",
    href: "/relatorios",
    icon: ChartNoAxesColumn,
  },
  {
    label: "Configurações",
    href: "/configuracoes",
    icon: Settings,
  },
];

export default function SystemLayout({
  children,
}: SystemLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  async function handleLogout() {
    try {
      setLoggingOut(true);

      await signOut(auth);

      router.replace("/");
    } catch (error) {
      console.error("Erro ao sair:", error);
      setLoggingOut(false);
    }
  }

  function isActive(href: string) {
    if (href === "/dashboard") {
      return pathname === "/dashboard";
    }

    return pathname.startsWith(href);
  }

  return (
    <div className="min-h-dvh bg-[#121212] text-white">
      {/* SIDEBAR DESKTOP */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 border-r border-[#2c2c2c] bg-[#171717] lg:flex lg:flex-col">
        {/* Logo */}
        <div className="flex h-20 items-center gap-3 border-b border-[#2c2c2c] px-5">
          <Image
            src="/logo.png"
            alt="SONATA"
            width={48}
            height={48}
            className="h-11 w-11 rounded-lg object-contain"
          />

          <div>
            <h1 className="text-lg font-bold tracking-wide text-[#FDC700]">
              SONATA
            </h1>

            <p className="text-[11px] text-gray-500">
              Sistema de Gestão 1.2
            </p>
          </div>
        </div>

        {/* Navegação */}
        <nav className="flex-1 overflow-y-auto px-3 py-5">
          <p className="mb-3 px-3 text-[10px] font-semibold uppercase tracking-wider text-gray-600">
            Menu principal
          </p>

          <div className="space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`
                    flex items-center gap-3 rounded-lg px-3 py-2.5
                    text-sm transition
                    ${
                      active
                        ? "bg-[#FDC700]/10 text-[#FDC700]"
                        : "text-gray-400 hover:bg-[#222] hover:text-white"
                    }
                  `}
                >
                  <Icon
                    size={19}
                    className={
                      active
                        ? "text-[#FDC700]"
                        : "text-gray-500"
                    }
                  />

                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        </nav>

        {/* Rodapé da Sidebar */}
        <div className="border-t border-[#2c2c2c] p-3">
          <button
            type="button"
            onClick={handleLogout}
            disabled={loggingOut}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-gray-400 transition hover:bg-red-500/10 hover:text-red-400 disabled:opacity-50"
          >
            <LogOut size={19} />

            {loggingOut ? "Saindo..." : "Sair"}
          </button>

          <p className="mt-3 px-3 text-[10px] text-gray-600">
            © 2026 SONATA
          </p>
        </div>
      </aside>

      {/* HEADER MOBILE */}
      <header className="fixed inset-x-0 top-0 z-30 flex h-16 items-center justify-between border-b border-[#2c2c2c] bg-[#171717]/95 px-4 backdrop-blur lg:hidden print:hidden">
        <button
          type="button"
          onClick={() => setMobileMenuOpen(true)}
          className="flex h-10 w-10 items-center justify-center rounded-lg text-gray-300 transition hover:bg-[#252525]"
          aria-label="Abrir menu"
        >
          <Menu size={22} />
        </button>

        <div className="flex items-center gap-2">
          <Image
            src="/logo.png"
            alt="SONATA"
            width={36}
            height={36}
            className="h-8 w-8 object-contain"
          />

          <span className="font-bold text-[#FDC700]">
            SONATA
          </span>
        </div>

        <div className="h-10 w-10" />
      </header>

      {/* MENU MOBILE */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Fundo */}
          <button
            type="button"
            aria-label="Fechar menu"
            onClick={() => setMobileMenuOpen(false)}
            className="absolute inset-0 bg-black/60"
          />

          {/* Menu */}
          <aside className="relative flex h-full w-[280px] max-w-[85vw] flex-col border-r border-[#333] bg-[#171717] shadow-2xl">
            <div className="flex h-20 items-center justify-between border-b border-[#2c2c2c] px-5">
              <div className="flex items-center gap-3">
                <Image
                  src="/logo.png"
                  alt="SONATA"
                  width={45}
                  height={45}
                  className="h-10 w-10 object-contain"
                />

                <div>
                  <h1 className="font-bold text-[#FDC700]">
                    SONATA
                  </h1>

                  <p className="text-[10px] text-gray-500">
                    Sistema de Gestão
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-400 hover:bg-[#252525]"
                aria-label="Fechar menu"
              >
                <X size={20} />
              </button>
            </div>

            <nav className="flex-1 overflow-y-auto px-3 py-5">
              <p className="mb-3 px-3 text-[10px] font-semibold uppercase tracking-wider text-gray-600">
                Menu principal
              </p>

              <div className="space-y-1">
                {menuItems.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.href);

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`
                        flex items-center gap-3 rounded-lg px-3 py-3
                        text-sm transition
                        ${
                          active
                            ? "bg-[#FDC700]/10 text-[#FDC700]"
                            : "text-gray-400 hover:bg-[#222] hover:text-white"
                        }
                      `}
                    >
                      <Icon size={19} />

                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </nav>

            <div className="border-t border-[#2c2c2c] p-3">
              <button
                type="button"
                onClick={handleLogout}
                disabled={loggingOut}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-sm text-gray-400 transition hover:bg-red-500/10 hover:text-red-400 disabled:opacity-50"
              >
                <LogOut size={19} />

                {loggingOut ? "Saindo..." : "Sair"}
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* CONTEÚDO */}
      <div className="min-h-dvh lg:pl-64">
        <div className="pt-16 lg:pt-0">
          {children}
        </div>
      </div>
    </div>
  );
}