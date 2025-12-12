'use client';

import RoomAvailabilityManagement from '@/components/admin/RoomAvailabilityManagement';
import AdminLayout from '@/components/admin/AdminLayout';

export default function AdminAvailabilityPage() {
  return (
    <AdminLayout title="Room Availability">
      <RoomAvailabilityManagement />
    </AdminLayout>
  );
}
