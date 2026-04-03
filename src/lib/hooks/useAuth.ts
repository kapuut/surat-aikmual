'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { AuthUser } from '@/lib/types';

function getDashboardRouteByRole(role: string): string {
  switch (role) {
    case 'admin':
      return '/admin/dashboard';
    case 'sekretaris':
      return '/sekretaris/dashboard';
    case 'kepala_desa':
      return '/kepala-desa/dashboard';
    case 'masyarakat':
      return '/dashboard';
    default:
      return '/login';
  }
}

/**
 * Hook untuk mendapatkan informasi user dan authentication status
 * Fetch user data dari API dan maintain authentication state
 */
export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/me', {
          credentials: 'include',
        });

        if (response.ok) {
          const data = await response.json();
          setUser(data.user);
          setIsAuthenticated(true);
        } else {
          setUser(null);
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error('Auth check error:', error);
        setIsAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });

      setUser(null);
      setIsAuthenticated(false);
      router.push('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return {
    user,
    loading,
    isAuthenticated,
    logout,
  };
}

/**
 * Hook yang memastikan user sudah authenticated
 * Otomatis redirect ke login jika belum authenticated
 */
export function useRequireAuth() {
  const { user, loading, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/login');
    }
  }, [loading, isAuthenticated, router]);

  return { user, loading, isAuthenticated };
}

/**
 * Hook untuk role-based access control
 * Memastikan user memiliki role yang diizinkan
 */
export function useRequireRole(allowedRoles: string[]) {
  const { user, loading, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!isAuthenticated) {
        router.push('/login');
      } else if (user && !allowedRoles.includes(user.role)) {
        router.push(getDashboardRouteByRole(user.role));
      }
    }
  }, [loading, isAuthenticated, user, allowedRoles, router]);

  return { user, loading, isAuthenticated };
}
