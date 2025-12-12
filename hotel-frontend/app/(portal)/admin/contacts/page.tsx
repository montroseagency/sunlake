'use client';

import ContactMessagesManagement from '@/components/admin/ContactMessagesManagement';
import AdminLayout from '@/components/admin/AdminLayout';

export default function AdminContactsPage() {
  return (
    <AdminLayout title="Contact Messages">
      <ContactMessagesManagement />
    </AdminLayout>
  );
}
