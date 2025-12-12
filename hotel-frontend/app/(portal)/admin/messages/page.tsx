'use client';

import { useEffect, useState } from 'react';
import AdminMessaging from '@/components/messaging/AdminMessaging';
import AdminLayout from '@/components/admin/AdminLayout';

export default function AdminMessagesPage() {
  const [token, setToken] = useState('');

  useEffect(() => {
    const accessToken = localStorage.getItem('access_token');
    if (accessToken) {
      setToken(accessToken);
    }
  }, []);

  return (
    <AdminLayout title="Messages">
      <div className="h-[700px] bg-white rounded-lg shadow overflow-hidden">
        <AdminMessaging token={token} />
      </div>
    </AdminLayout>
  );
}
