"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AuthUser } from '@/lib/types';
import { getUser, getDashboardRoute } from '@/lib/auth';

interface AuthGuardProps {
  children: React.ReactNode;
  redirectTo?: string;
}

export default function AuthGuard({ children, redirectTo }: AuthGuardProps) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Cek authentication dengan memanggil API yang mengverifikasi cookie httpOnly
        const response = await fetch('/api/auth/verify', {
          method: 'GET',
          credentials: 'include', // Include httpOnly cookies
        });

        if (response.ok) {
          const data = await response.json();
          console.log('Auth verified:', data);
          
          // Set user data from response
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
          
          setUser(userData);
          setIsAuthenticated(true);
        } else {
          console.log('Auth failed, redirecting to login');
          setIsAuthenticated(false);
          setTimeout(() => {
            router.push(redirectTo || '/login');
          }, 100);
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        setIsAuthenticated(false);
        setTimeout(() => {
          router.push(redirectTo || '/login');
        }, 100);
      }
    };

    checkAuth();
  }, [router, redirectTo]);

  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}