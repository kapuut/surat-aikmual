"use client";

import { usePathname } from "next/navigation";
import SekretarisLayout from "@/components/layout/SekretarisLayout";
import SimpleAuthGuard from "@/components/auth/SimpleAuthGuard";

export default function SekretarisRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  // Skip layout for login page
  if (pathname === "/sekretaris/login") {
    return <>{children}</>;
  }

  return (
    <SimpleAuthGuard>
      <SekretarisLayout>{children}</SekretarisLayout>
    </SimpleAuthGuard>
  );
}
