"use client";

import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/useAuth";
import Footer from "./Footer";

/**
 * FooterWrapper — tampilkan Footer hanya pada halaman publik atau beranda setelah login.
 *
 * Tampil di:
 *   - Semua halaman saat belum login (public pages)
 *   - Halaman "/" dan "/beranda" saat sudah login
 *
 * Disembunyikan (conditional render) saat:
 *   - User sudah login DAN berada di halaman fitur (dashboard, permohonan, dll.)
 */
export default function FooterWrapper() {
  const pathname = usePathname();
  const { isAuthenticated, loading } = useAuth();

  if (loading) return null;

  const showFooter =
    !isAuthenticated ||
    pathname === "/" ||
    pathname === "/beranda";

  if (!showFooter) return null;

  return <Footer />;
}
