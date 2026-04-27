"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { FiMenu, FiX } from "react-icons/fi";
import { useAuth } from "@/lib/hooks";

const NAV_ITEMS = [
  { label: "Beranda", href: "/#beranda" },
  { label: "Permohonan Surat", href: "/#layanan" },
  { label: "Alur Pengajuan", href: "/#alur-pengajuan" },
  { label: "Lacak Surat", href: "/tracking" },
  { label: "Kontak", href: "/#kontak" },
] as const;

function getDashboardRouteByRole(role?: string): string {
  switch (role) {
    case "admin":
      return "/admin/dashboard";
    case "sekretaris":
      return "/sekretaris/dashboard";
    case "kepala_desa":
      return "/kepala-desa/dashboard";
    case "masyarakat":
      return "/dashboard";
    default:
      return "/dashboard";
  }
}

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, loading, isAuthenticated, logout } = useAuth();

  const dashboardHref = getDashboardRouteByRole(user?.role);

  const handleCloseMenu = () => {
    setIsMenuOpen(false);
  };

  const handleLogout = async () => {
    handleCloseMenu();
    await logout();
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 w-full border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur-sm">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="flex h-20 items-center justify-between gap-4">
          <Link href="/" onClick={handleCloseMenu} className="flex min-w-0 items-center gap-3 transition-opacity hover:opacity-85">
            <div className="flex-shrink-0 rounded-2xl bg-slate-50 p-1.5 ring-1 ring-slate-200">
              <Image
                src="/images/logo-desa.png"
                alt="Logo Desa Aikmual"
                width={46}
                height={40}
                className="object-contain"
              />
            </div>
            <div className="flex min-w-0 flex-col -space-y-1.5">
              <h1 className="truncate text-xl font-extrabold leading-none text-slate-900 md:text-2xl">
                Sistem Pelayanan Surat
              </h1>
              <p className="text-sm font-medium leading-none text-slate-600 md:text-base">Desa Aikmual</p>
            </div>
          </Link>

          <div className="flex items-center gap-3 xl:gap-5">
            <nav className="hidden items-center gap-1 xl:flex xl:gap-2">
              {NAV_ITEMS.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="rounded-full px-3 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-sky-50 hover:text-sky-700 xl:px-4 xl:text-base"
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            {!loading && !isAuthenticated && (
              <Link
                href="/login"
                onClick={handleCloseMenu}
                className="hidden items-center rounded-full bg-blue-600 px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-blue-700 sm:inline-flex md:px-5 md:text-base"
              >
                <span>Masuk / Daftar</span>
              </Link>
            )}

            {!loading && isAuthenticated && (
              <div className="hidden items-center gap-2 sm:flex">
                <Link
                  href={dashboardHref}
                  onClick={handleCloseMenu}
                  className="inline-flex items-center rounded-full bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-emerald-700 md:px-5 md:text-base"
                >
                  Dashboard
                </Link>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="inline-flex items-center rounded-full border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
                >
                  Keluar
                </button>
              </div>
            )}

            <button
              type="button"
              aria-label={isMenuOpen ? "Tutup menu" : "Buka menu"}
              aria-expanded={isMenuOpen}
              onClick={() => setIsMenuOpen((previous) => !previous)}
              className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 transition-colors hover:bg-slate-50 xl:hidden"
            >
              {isMenuOpen ? <FiX className="h-5 w-5" /> : <FiMenu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {isMenuOpen && (
          <div className="border-t border-slate-200 py-4 xl:hidden">
            <nav className="flex flex-col gap-1">
              {NAV_ITEMS.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={handleCloseMenu}
                  className="rounded-xl px-3 py-3 text-sm font-semibold text-slate-700 transition-colors hover:bg-sky-50 hover:text-sky-700"
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            {!loading && !isAuthenticated && (
              <Link
                href="/login"
                onClick={handleCloseMenu}
                className="mt-4 inline-flex w-full items-center justify-center rounded-xl bg-blue-600 px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-blue-700 sm:hidden"
              >
                <span>Masuk / Daftar</span>
              </Link>
            )}

            {!loading && isAuthenticated && (
              <div className="mt-4 space-y-2 sm:hidden">
                <Link
                  href={dashboardHref}
                  onClick={handleCloseMenu}
                  className="inline-flex w-full items-center justify-center rounded-xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-emerald-700"
                >
                  Dashboard
                </Link>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="inline-flex w-full items-center justify-center rounded-xl border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
                >
                  Keluar
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
