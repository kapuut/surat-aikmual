"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface SimpleAuthGuardProps {
  children: React.ReactNode;
  requiredRoles?: string[];
  unauthorizedRedirect?: string;
}

function getDashboardRoute(role?: string): string {
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

export default function SimpleAuthGuard({
  children,
  requiredRoles,
  unauthorizedRedirect,
}: SimpleAuthGuardProps) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Pertama cek dengan API verify (yang menggunakan httpOnly cookie)
        const response = await fetch('/api/auth/verify', {
          method: 'GET',
          credentials: 'include',
        });

        if (response.ok) {
          const data = await response.json();
          console.log('SimpleAuthGuard - API auth verified:', data);

          const userRole = String(data?.user?.role || '').trim();
          if (requiredRoles && requiredRoles.length > 0 && !requiredRoles.includes(userRole)) {
            setIsAuthenticated(false);
            const target = unauthorizedRedirect || getDashboardRoute(userRole);
            setTimeout(() => {
              router.push(target);
            }, 100);
            return;
          }

          setIsAuthenticated(true);
          return;
        }

        // Fallback ke local storage dan session cookie
        const userSession = localStorage.getItem('user-session');
        const sessionCookie = document.cookie
          .split('; ')
          .find(row => row.startsWith('user-session='));

        console.log('SimpleAuthGuard - Fallback check:', {
          userSession,
          sessionCookie: !!sessionCookie
        });

        if (userSession === 'active' || sessionCookie) {
          console.log('SimpleAuthGuard - User authenticated via fallback');
          setIsAuthenticated(true);
        } else {
          console.log('SimpleAuthGuard - User not authenticated, redirecting...');
          setIsAuthenticated(false);
          setTimeout(() => {
            router.push('/admin/login');
          }, 100);
        }
      } catch (error) {
        console.error('SimpleAuthGuard - Auth check failed:', error);
        setIsAuthenticated(false);
        setTimeout(() => {
          router.push('/admin/login');
        }, 100);
      }
    };

    checkAuth();
  }, [router, requiredRoles, unauthorizedRedirect]);

  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Redirecting to login...</div>
      </div>
    );
  }

  return <>{children}</>;
}