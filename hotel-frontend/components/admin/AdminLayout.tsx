'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AdminSidebar from './AdminSidebar';

interface User {
  id: number;
  username: string;
  email: string;
  role: string;
}

interface AdminLayoutProps {
  children: React.ReactNode;
  title?: string;
}

export default function AdminLayout({ children, title }: AdminLayoutProps) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const token = localStorage.getItem('access_token');

    if (!storedUser || !token) {
      router.push('/admin/login');
      return;
    }

    const userData = JSON.parse(storedUser);

    if (userData.role !== 'ADMIN' && userData.role !== 'STAFF') {
      router.push('/admin/login');
      return;
    }

    setUser(userData);
    setLoading(false);
  }, [router]);

  const handleLogout = () => {
    localStorage.clear();
    router.push('/admin/login');
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 flex">
      {/* Sidebar */}
      <AdminSidebar
        onLogout={handleLogout}
        userName={user.username}
        userRole={user.role}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        {title && (
          <header className="bg-white shadow-sm border-b border-neutral-200">
            <div className="px-6 py-4">
              <h1 className="text-2xl font-display font-bold text-neutral-900">
                {title}
              </h1>
            </div>
          </header>
        )}

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
