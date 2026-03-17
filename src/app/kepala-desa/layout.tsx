"use client";

import { usePathname } from "next/navigation";
import KepalaDesaLayout from "@/components/layout/KepalaDesaLayout";
import SimpleAuthGuard from "@/components/auth/SimpleAuthGuard";

export default function KepalaDesaRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  // Skip layout for login page
  if (pathname === "/kepala-desa/login") {
    return <>{children}</>;
  }

  return (
    <SimpleAuthGuard>
      <KepalaDesaLayout>{children}</KepalaDesaLayout>
    </SimpleAuthGuard>
  );
}
