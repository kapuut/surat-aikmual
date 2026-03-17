"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AuthUser, UserRole } from '@/lib/types';
import { hasPermission, getDashboardRoute } from '@/lib/auth';

interface RoleGuardProps {
  children: React.ReactNode;
  allowedRoles: UserRole[];
  requiredResource?: keyof import('@/lib/types').RolePermissions;
  requiredAction?: keyof import('@/lib/types').Permission;
  fallbackRoute?: string;
}

export default function RoleGuard({ 
  children, 
  allowedRoles, 
  requiredResource, 
  requiredAction,
  fallbackRoute 
}: RoleGuardProps) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    let isMounted = true;

    async function checkAuth() {
      try {
        const response = await fetch('/api/auth/verify', {
          method: 'GET',
          credentials: 'include',
        });

        if (!response.ok) {
          throw new Error('Unauthorized');
        }

        const data = await response.json();
        const userData: AuthUser = {
          id: data.user.id,
          username: data.user.username,
          email: data.user.email,
          nama: data.user.nama,
          role: data.user.role,
          nik: data.user.nik,
          alamat: data.user.alamat,
          telepon: data.user.telepon,
        };

        if (!isMounted) return;

        // Check role permission
        if (!allowedRoles.includes(userData.role)) {
          const redirectTarget = fallbackRoute || getDashboardRoute(userData.role);
          router.replace(redirectTarget);
          return;
        }

        // Check specific resource permission if required
        if (requiredResource && requiredAction) {
          if (!hasPermission(userData.role, requiredResource, requiredAction)) {
            const redirectTarget = fallbackRoute || getDashboardRoute(userData.role);
            router.replace(redirectTarget);
            return;
          }
        }

        setUser(userData);
        setIsLoading(false);
      } catch (error) {
        console.error('Auth check failed:', error);
        const loginFallback = fallbackRoute || resolveDefaultLoginRoute(allowedRoles);
        router.replace(loginFallback);
      }
    }

    checkAuth();

    return () => {
      isMounted = false;
    };
  }, [allowedRoles, fallbackRoute, requiredAction, requiredResource, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Memuat...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect to login
  }

  return <>{children}</>;
}

// Specific role guards
export function AdminGuard({ children, fallbackRoute }: { children: React.ReactNode; fallbackRoute?: string }) {
  return (
    <RoleGuard allowedRoles={['admin']} fallbackRoute={fallbackRoute}>
      {children}
    </RoleGuard>
  );
}

export function SecretaryGuard({ children, fallbackRoute }: { children: React.ReactNode; fallbackRoute?: string }) {
  return (
    <RoleGuard allowedRoles={['admin', 'sekretaris']} fallbackRoute={fallbackRoute}>
      {children}
    </RoleGuard>
  );
}

export function HeadVillageGuard({ children, fallbackRoute }: { children: React.ReactNode; fallbackRoute?: string }) {
  return (
    <RoleGuard allowedRoles={['admin', 'kepala_desa']} fallbackRoute={fallbackRoute}>
      {children}
    </RoleGuard>
  );
}

export function CitizenGuard({ children, fallbackRoute }: { children: React.ReactNode; fallbackRoute?: string }) {
  return (
    <RoleGuard allowedRoles={['masyarakat']} fallbackRoute={fallbackRoute}>
      {children}
    </RoleGuard>
  );
}

export function StaffGuard({ children, fallbackRoute }: { children: React.ReactNode; fallbackRoute?: string }) {
  return (
    <RoleGuard allowedRoles={['admin', 'sekretaris', 'kepala_desa']} fallbackRoute={fallbackRoute}>
      {children}
    </RoleGuard>
  );
}

function resolveDefaultLoginRoute(roles: UserRole[]): string {
  if (roles.includes('masyarakat')) {
    return '/login';
  }

  if (roles.includes('sekretaris') && !roles.includes('admin')) {
    return '/sekretaris/login';
  }

  if (roles.includes('kepala_desa') && !roles.includes('admin')) {
    return '/kepala-desa/login';
  }

  return '/admin/login';
}