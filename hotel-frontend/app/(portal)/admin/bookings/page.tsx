'use client';

import BookingsManagement from '@/components/admin/BookingsManagement';
import AdminLayout from '@/components/admin/AdminLayout';

export default function AdminBookingsPage() {
  const handleUpdate = () => {
    // Refresh stats or trigger parent updates if needed
  };

  return (
    <AdminLayout title="Bookings Management">
      <BookingsManagement onUpdate={handleUpdate} />
    </AdminLayout>
  );
}
