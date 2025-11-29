'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import RoomsManagement from '@/components/admin/RoomsManagement';
import GalleryManagement from '@/components/admin/GalleryManagement';
import BookingsManagement from '@/components/admin/BookingsManagement';

interface User {
  id: number;
  username: string;
  email: string;
  role: string;
}

type Tab = 'overview' | 'rooms' | 'gallery' | 'bookings';

export default function AdminDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [stats, setStats] = useState({
    totalRooms: 0,
    totalBookings: 0,
    activeBookings: 0,
    totalGalleryImages: 0,
  });

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
    fetchStats();
  }, [router]);

  const fetchStats = async () => {
    try {
      const [roomsRes, bookingsRes, galleryRes] = await Promise.all([
        api.get('/rooms/'),
        api.get('/bookings/').catch(() => ({ data: [] })),
        api.get('/gallery/').catch(() => ({ data: [] })),
      ]);

      const rooms = roomsRes.data.results || roomsRes.data || [];
      const bookings = bookingsRes.data.results || bookingsRes.data || [];
      const gallery = galleryRes.data.results || galleryRes.data || [];

      setStats({
        totalRooms: rooms.length,
        totalBookings: bookings.length,
        activeBookings: bookings.filter((b: any) =>
          b.status === 'CONFIRMED' || b.status === 'PENDING'
        ).length,
        totalGalleryImages: gallery.length,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    router.push('/admin/login');
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-display font-bold text-neutral-900">
                Sunlake Hotel Admin
              </h1>
              <p className="text-sm text-neutral-600">
                Welcome back, {user.username} ({user.role})
              </p>
            </div>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="border-b border-neutral-200">
            <nav className="flex -mb-px">
              {[
                { id: 'overview', label: 'Overview' },
                { id: 'rooms', label: 'Rooms' },
                { id: 'gallery', label: 'Gallery' },
                { id: 'bookings', label: 'Bookings' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as Tab)}
                  className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {activeTab === 'overview' && (
          <div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-neutral-600 mb-1">Total Rooms</p>
                    <p className="text-3xl font-bold text-primary-500">{stats.totalRooms}</p>
                  </div>
                  <div className="text-4xl">🏨</div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-neutral-600 mb-1">Total Bookings</p>
                    <p className="text-3xl font-bold text-secondary-500">{stats.totalBookings}</p>
                  </div>
                  <div className="text-4xl">📅</div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-neutral-600 mb-1">Active Bookings</p>
                    <p className="text-3xl font-bold text-green-500">{stats.activeBookings}</p>
                  </div>
                  <div className="text-4xl">✓</div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-neutral-600 mb-1">Gallery Images</p>
                    <p className="text-3xl font-bold text-purple-500">{stats.totalGalleryImages}</p>
                  </div>
                  <div className="text-4xl">🖼️</div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold text-neutral-900 mb-4">Quick Access</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button
                  onClick={() => setActiveTab('rooms')}
                  className="p-4 border-2 border-primary-500 text-primary-500 rounded-lg hover:bg-primary-50 transition-colors text-left"
                >
                  <div className="font-medium mb-2">Manage Rooms</div>
                  <div className="text-sm text-neutral-600">Add, edit, or delete rooms and upload images</div>
                </button>
                <button
                  onClick={() => setActiveTab('gallery')}
                  className="p-4 border-2 border-purple-500 text-purple-500 rounded-lg hover:bg-purple-50 transition-colors text-left"
                >
                  <div className="font-medium mb-2">Manage Gallery</div>
                  <div className="text-sm text-neutral-600">Upload and organize hotel gallery images</div>
                </button>
                <button
                  onClick={() => setActiveTab('bookings')}
                  className="p-4 border-2 border-secondary-500 text-secondary-500 rounded-lg hover:bg-secondary-50 transition-colors text-left"
                >
                  <div className="font-medium mb-2">Manage Bookings</div>
                  <div className="text-sm text-neutral-600">View and update customer reservations</div>
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'rooms' && <RoomsManagement onUpdate={fetchStats} />}
        {activeTab === 'gallery' && <GalleryManagement onUpdate={fetchStats} />}
        {activeTab === 'bookings' && <BookingsManagement onUpdate={fetchStats} />}
      </main>
    </div>
  );
}
