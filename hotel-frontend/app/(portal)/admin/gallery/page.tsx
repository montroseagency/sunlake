'use client';

import GalleryManagementSimple from '@/components/admin/GalleryManagementSimple';
import AdminLayout from '@/components/admin/AdminLayout';

export default function AdminGalleryPage() {
  const handleUpdate = () => {
    // Refresh stats or trigger parent updates if needed
  };

  return (
    <AdminLayout title="Gallery Management">
      <GalleryManagementSimple onUpdate={handleUpdate} />
    </AdminLayout>
  );
}
