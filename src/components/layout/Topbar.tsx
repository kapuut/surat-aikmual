'use client';

import { useAuth } from '@/lib/useAuth';

interface TopbarProps {
  title: string;
  description?: string;
}

export default function Topbar({ title, description }: TopbarProps) {
  const { user } = useAuth();

  return (
    <header className="fixed top-0 left-64 right-0 h-20 bg-white border-b border-gray-200 shadow-sm z-30">
      <div className="h-full px-8 flex items-center justify-between">
        {/* Left Side - Title */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
          {description && <p className="text-sm text-gray-600 mt-1">{description}</p>}
        </div>

        {/* Right Side - User Info */}
        <div className="text-right">
          <p className="text-sm font-medium text-gray-900">Selamat datang,</p>
          <p className="text-base font-bold text-blue-900">{user?.nama || 'User'}</p>
        </div>
      </div>
    </header>
  );
}
