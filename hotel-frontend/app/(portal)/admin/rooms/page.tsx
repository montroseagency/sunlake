'use client';

import RoomsManagement from '@/components/admin/RoomsManagement';
import AdminLayout from '@/components/admin/AdminLayout';

export default function AdminRoomsPage() {
  const handleUpdate = () => {
    // Refresh stats or trigger parent updates if needed
  };

  return (
    <AdminLayout title="Rooms Management">
      <RoomsManagement onUpdate={handleUpdate} />
    </AdminLayout>
  );
}
