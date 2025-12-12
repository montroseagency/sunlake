'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import api from '@/lib/api';
import AdminLayout from '@/components/admin/AdminLayout';
import { FaBed, FaCalendarAlt, FaClipboardList, FaImages, FaEnvelope, FaComments, FaArrowUp, FaArrowDown } from 'react-icons/fa';
import { MdDashboard } from 'react-icons/md';

export default function AdminDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState({
    totalRooms: 0,
    totalBookings: 0,
    activeBookings: 0,
    totalGalleryImages: 0,
    totalContacts: 0,
    unreadContacts: 0,
  });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const [roomsRes, bookingsRes, galleryRes, contactsRes] = await Promise.all([
        api.get('/rooms/'),
        api.get('/bookings/').catch(() => ({ data: [] })),
        api.get('/gallery/').catch(() => ({ data: [] })),
        api.get('/contact/').catch(() => ({ data: [] })),
      ]);

      const rooms = roomsRes.data.results || roomsRes.data || [];
      const bookings = bookingsRes.data.results || bookingsRes.data || [];
      const gallery = galleryRes.data.results || galleryRes.data || [];
      const contacts = contactsRes.data.results || contactsRes.data || [];

      setStats({
        totalRooms: rooms.length,
        totalBookings: bookings.length,
        activeBookings: bookings.filter((b: any) =>
          b.status === 'CONFIRMED' || b.status === 'PENDING'
        ).length,
        totalGalleryImages: gallery.length,
        totalContacts: contacts.length,
        unreadContacts: contacts.filter((c: any) => !c.is_read).length,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const statCards = [
    {
      title: 'Total Rooms',
      value: stats.totalRooms,
      icon: FaBed,
      color: 'from-blue-500 to-blue-600',
      textColor: 'text-blue-600',
      bgColor: 'bg-blue-50',
      iconBg: 'bg-blue-100',
    },
    {
      title: 'Total Bookings',
      value: stats.totalBookings,
      icon: FaClipboardList,
      color: 'from-amber-500 to-amber-600',
      textColor: 'text-amber-600',
      bgColor: 'bg-amber-50',
      iconBg: 'bg-amber-100',
    },
    {
      title: 'Active Bookings',
      value: stats.activeBookings,
      icon: FaCalendarAlt,
      color: 'from-green-500 to-green-600',
      textColor: 'text-green-600',
      bgColor: 'bg-green-50',
      iconBg: 'bg-green-100',
      trend: '+12%',
      trendUp: true,
    },
    {
      title: 'Gallery Images',
      value: stats.totalGalleryImages,
      icon: FaImages,
      color: 'from-purple-500 to-purple-600',
      textColor: 'text-purple-600',
      bgColor: 'bg-purple-50',
      iconBg: 'bg-purple-100',
    },
    {
      title: 'Contact Messages',
      value: stats.totalContacts,
      icon: FaEnvelope,
      color: 'from-orange-500 to-orange-600',
      textColor: 'text-orange-600',
      bgColor: 'bg-orange-50',
      iconBg: 'bg-orange-100',
      badge: stats.unreadContacts > 0 ? `${stats.unreadContacts} unread` : null,
    },
  ];

  const quickAccessCards = [
    {
      title: 'Manage Rooms',
      description: 'Add, edit, or delete rooms and upload images',
      icon: FaBed,
      path: '/admin/rooms',
      color: 'text-primary-600 border-primary-200 hover:bg-primary-50',
      iconColor: 'text-primary-600',
    },
    {
      title: 'Room Availability',
      description: 'Manage room availability calendar',
      icon: FaCalendarAlt,
      path: '/admin/availability',
      color: 'text-blue-600 border-blue-200 hover:bg-blue-50',
      iconColor: 'text-blue-600',
    },
    {
      title: 'Manage Gallery',
      description: 'Upload and organize hotel gallery images',
      icon: FaImages,
      path: '/admin/gallery',
      color: 'text-purple-600 border-purple-200 hover:bg-purple-50',
      iconColor: 'text-purple-600',
    },
    {
      title: 'Manage Bookings',
      description: 'View and update customer reservations',
      icon: FaClipboardList,
      path: '/admin/bookings',
      color: 'text-amber-600 border-amber-200 hover:bg-amber-50',
      iconColor: 'text-amber-600',
    },
    {
      title: 'Contact Messages',
      description: 'View and manage customer inquiries',
      icon: FaEnvelope,
      path: '/admin/contacts',
      color: 'text-orange-600 border-orange-200 hover:bg-orange-50',
      iconColor: 'text-orange-600',
    },
    {
      title: 'Messages',
      description: 'Real-time messaging with guests',
      icon: FaComments,
      path: '/admin/messages',
      color: 'text-green-600 border-green-200 hover:bg-green-50',
      iconColor: 'text-green-600',
    },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.4,
      },
    },
  };

  return (
    <AdminLayout title="Dashboard Overview">
      <div className="space-y-6">
        {/* Stats Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6"
        >
          {statCards.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={index}
                variants={itemVariants}
                whileHover={{ y: -4, scale: 1.02 }}
                className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all cursor-pointer border border-neutral-100"
              >
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className={`p-3 rounded-lg ${stat.iconBg}`}>
                      <Icon className={`w-6 h-6 ${stat.textColor}`} />
                    </div>
                    {stat.trend && (
                      <div className={`flex items-center gap-1 text-xs font-medium ${stat.trendUp ? 'text-green-600' : 'text-red-600'}`}>
                        {stat.trendUp ? <FaArrowUp /> : <FaArrowDown />}
                        {stat.trend}
                      </div>
                    )}
                  </div>

                  <div>
                    <p className="text-sm text-neutral-600 font-medium mb-1">{stat.title}</p>
                    <p className={`text-3xl font-bold ${stat.textColor}`}>
                      {stat.value}
                    </p>
                    {stat.badge && (
                      <span className="inline-block mt-2 px-2 py-1 bg-red-100 text-red-600 text-xs font-medium rounded-full">
                        {stat.badge}
                      </span>
                    )}
                  </div>
                </div>

                {/* Gradient bottom border */}
                <div className={`h-1 bg-gradient-to-r ${stat.color} rounded-b-xl`} />
              </motion.div>
            );
          })}
        </motion.div>

        {/* Quick Access Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-xl shadow-md border border-neutral-100"
        >
          <div className="p-6 border-b border-neutral-100">
            <h2 className="text-xl font-display font-bold text-neutral-900">Quick Access</h2>
            <p className="text-sm text-neutral-600 mt-1">Navigate to commonly used management tools</p>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {quickAccessCards.map((card, index) => {
                const Icon = card.icon;
                return (
                  <motion.button
                    key={index}
                    onClick={() => router.push(card.path)}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.98 }}
                    className={`p-5 border-2 rounded-xl transition-all text-left ${card.color}`}
                  >
                    <div className="flex items-start gap-4">
                      <div className={`p-3 rounded-lg bg-neutral-50 ${card.iconColor}`}>
                        <Icon className="w-6 h-6" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold mb-1">{card.title}</h3>
                        <p className="text-sm text-neutral-600">{card.description}</p>
                      </div>
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </div>
        </motion.div>
      </div>
    </AdminLayout>
  );
}
