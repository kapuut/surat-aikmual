"use client";

import { usePathname } from 'next/navigation';
import SimpleAuthGuard from '@/components/auth/SimpleAuthGuard';
import AdminLayout from '@/components/layout/AdminLayout';

export default function AdminRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  
  // Jika di halaman login, tidak perlu AuthGuard dan Layout
  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  // Untuk halaman admin lainnya, gunakan SimpleAuthGuard + AdminLayout terpusat
  return (
    <SimpleAuthGuard requiredRoles={['admin']} unauthorizedRedirect="/admin/login">
      <AdminLayout>
        {children}
      </AdminLayout>
    </SimpleAuthGuard>
  );
}
