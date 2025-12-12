'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { motion } from 'framer-motion';
import { FaClipboardList, FaCalendarCheck, FaHistory, FaDollarSign, FaBed, FaPhone, FaArrowUp, FaComments } from 'react-icons/fa';
import { MdLogout } from 'react-icons/md';
import Image from 'next/image';

interface Room {
  id: number;
  name: string;
  slug: string;
  room_type: string;
  capacity: number;
  base_price_per_night: string;
  primary_image: string;
  images?: Array<{
    id: number;
    image_display: string;
    image_url: string;
  }>;
}

interface Booking {
  id: number;
  room: Room;
  check_in_date: string;
  check_out_date: string;
  guest_name: string;
  guest_email: string;
  guest_phone: string;
  number_of_guests: number;
  total_price: string;
  status: string;
  nights: number;
  created_at: string;
}

export default function ClientDashboard() {
  const [user, setUser] = useState<any>(null);
  const [myBookings, setMyBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    const userData = localStorage.getItem('user');

    if (!token || !userData) {
      router.push('/');
      return;
    }

    setUser(JSON.parse(userData));
    fetchMyBookings();
  }, [router]);

  const fetchMyBookings = async () => {
    try {
      const response = await api.get('/bookings/my-bookings/');
      setMyBookings(response.data.results || response.data);
    } catch (error) {
      console.error('Failed to fetch bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    router.push('/');
  };

  const getUpcomingBookings = () => {
    return myBookings.filter(b => new Date(b.check_in_date) >= new Date());
  };

  const getPastBookings = () => {
    return myBookings.filter(b => new Date(b.check_out_date) < new Date());
  };

  const getTotalSpent = () => {
    return myBookings
      .filter(b => b.status === 'CONFIRMED' || b.status === 'COMPLETED')
      .reduce((sum, b) => sum + parseFloat(b.total_price), 0)
      .toFixed(2);
  };

  const statCards = [
    {
      title: 'Total Bookings',
      value: myBookings.length,
      icon: FaClipboardList,
      color: 'from-blue-500 to-blue-600',
      textColor: 'text-blue-600',
      bgColor: 'bg-blue-50',
      iconBg: 'bg-blue-100',
    },
    {
      title: 'Upcoming Stays',
      value: getUpcomingBookings().length,
      icon: FaCalendarCheck,
      color: 'from-green-500 to-green-600',
      textColor: 'text-green-600',
      bgColor: 'bg-green-50',
      iconBg: 'bg-green-100',
      trend: getUpcomingBookings().length > 0 ? '+' + getUpcomingBookings().length : null,
      trendUp: true,
    },
    {
      title: 'Past Trips',
      value: getPastBookings().length,
      icon: FaHistory,
      color: 'from-purple-500 to-purple-600',
      textColor: 'text-purple-600',
      bgColor: 'bg-purple-50',
      iconBg: 'bg-purple-100',
    },
    {
      title: 'Total Spent',
      value: `$${getTotalSpent()}`,
      icon: FaDollarSign,
      color: 'from-amber-500 to-amber-600',
      textColor: 'text-amber-600',
      bgColor: 'bg-amber-50',
      iconBg: 'bg-amber-100',
    },
  ];

  const quickActions = [
    {
      title: 'Book New Room',
      description: 'Discover and reserve your next stay',
      icon: FaBed,
      path: '/rooms',
      color: 'text-primary-600 border-primary-200 hover:bg-primary-50',
      iconColor: 'text-primary-600',
    },
    {
      title: 'Contact Support',
      description: 'Get help with your reservations',
      icon: FaPhone,
      path: '/contact',
      color: 'text-blue-600 border-blue-200 hover:bg-blue-50',
      iconColor: 'text-blue-600',
    },
    {
      title: 'Messages',
      description: 'Chat with hotel staff',
      icon: FaComments,
      path: '#messages',
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

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Modern Header */}
      <div className="bg-white border-b border-neutral-200 shadow-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center space-x-4">
              <div className="w-14 h-14 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-lg">
                {user.first_name?.[0] || user.email?.[0] || 'U'}
              </div>
              <div>
                <h1 className="text-xl font-bold text-neutral-900">
                  Welcome back, {user.first_name || 'Guest'}!
                </h1>
                <p className="text-sm text-neutral-600">Manage your stays and reservations</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-neutral-700 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
            >
              <MdLogout className="w-5 h-5" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* Stats Grid */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
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
                          <FaArrowUp />
                          {stat.trend}
                        </div>
                      )}
                    </div>

                    <div>
                      <p className="text-sm text-neutral-600 font-medium mb-1">{stat.title}</p>
                      <p className={`text-3xl font-bold ${stat.textColor}`}>
                        {stat.value}
                      </p>
                    </div>
                  </div>

                  {/* Gradient bottom border */}
                  <div className={`h-1 bg-gradient-to-r ${stat.color} rounded-b-xl`} />
                </motion.div>
              );
            })}
          </motion.div>

          {/* Quick Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-xl shadow-md border border-neutral-100"
          >
            <div className="p-6 border-b border-neutral-100">
              <h2 className="text-xl font-display font-bold text-neutral-900">Quick Actions</h2>
              <p className="text-sm text-neutral-600 mt-1">Common tasks at your fingertips</p>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {quickActions.map((action, index) => {
                  const Icon = action.icon;
                  return (
                    <motion.button
                      key={index}
                      onClick={() => action.path.startsWith('#') ? null : router.push(action.path)}
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.98 }}
                      className={`p-5 border-2 rounded-xl transition-all text-left ${action.color}`}
                    >
                      <div className="flex items-start gap-4">
                        <div className={`p-3 rounded-lg bg-neutral-50 ${action.iconColor}`}>
                          <Icon className="w-6 h-6" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold mb-1">{action.title}</h3>
                          <p className="text-sm text-neutral-600">{action.description}</p>
                        </div>
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            </div>
          </motion.div>

          {/* Messages Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white rounded-xl shadow-md border border-neutral-100"
          >
            <div className="p-6 border-b border-neutral-100">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-display font-bold text-neutral-900">Messages</h2>
                  <p className="text-sm text-neutral-600 mt-1">Stay in touch with our team</p>
                </div>
                <button className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg text-sm font-medium transition-colors">
                  New Message
                </button>
              </div>
            </div>

            <div className="p-6">
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FaComments className="w-8 h-8 text-neutral-400" />
                </div>
                <p className="text-neutral-600 mb-4">No messages yet</p>
                <p className="text-sm text-neutral-500">
                  Need help? Start a conversation with our support team
                </p>
              </div>
            </div>
          </motion.div>

          {/* Bookings Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-white rounded-xl shadow-md border border-neutral-100"
          >
            <div className="p-6 border-b border-neutral-100">
              <h2 className="text-xl font-display font-bold text-neutral-900">
                {getUpcomingBookings().length > 0 ? 'Upcoming Stays' : 'Recent Bookings'}
              </h2>
              <p className="text-sm text-neutral-600 mt-1">
                {getUpcomingBookings().length > 0
                  ? `You have ${getUpcomingBookings().length} upcoming ${getUpcomingBookings().length === 1 ? 'stay' : 'stays'}`
                  : 'Your booking history'}
              </p>
            </div>

            <div className="p-6">
              {loading ? (
                <div className="text-center py-12">
                  <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
                  <p className="mt-4 text-neutral-600">Loading bookings...</p>
                </div>
              ) : myBookings.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FaClipboardList className="w-8 h-8 text-neutral-400" />
                  </div>
                  <p className="text-neutral-600 mb-4">No bookings yet</p>
                  <button
                    onClick={() => router.push('/rooms')}
                    className="inline-flex items-center gap-2 bg-primary-500 hover:bg-primary-600 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                  >
                    <FaBed className="w-4 h-4" />
                    Book Your First Stay
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {(getUpcomingBookings().length > 0 ? getUpcomingBookings() : myBookings.slice(0, 5)).map((booking) => {
                    const isUpcoming = new Date(booking.check_in_date) >= new Date();
                    const isPast = new Date(booking.check_out_date) < new Date();

                    return (
                      <motion.div
                        key={booking.id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        whileHover={{ scale: 1.01 }}
                        className="flex flex-col sm:flex-row gap-4 p-4 border border-neutral-200 rounded-xl hover:shadow-md transition-all"
                      >
                        {/* Room Image */}
                        <div className="relative w-full sm:w-32 h-32 rounded-lg overflow-hidden flex-shrink-0">
                          <Image
                            src={
                              booking.room.images?.[0]?.image_display ||
                              booking.room.images?.[0]?.image_url ||
                              booking.room.primary_image ||
                              'https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=400'
                            }
                            alt={booking.room.name}
                            fill
                            className="object-cover"
                          />
                        </div>

                        {/* Booking Details */}
                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <h3 className="font-bold text-lg text-neutral-900">{booking.room.name}</h3>
                              <p className="text-sm text-neutral-600">{booking.room.room_type}</p>
                            </div>
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                              booking.status === 'CONFIRMED' ? 'bg-green-100 text-green-700' :
                              booking.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' :
                              booking.status === 'CANCELLED' ? 'bg-red-100 text-red-700' :
                              'bg-blue-100 text-blue-700'
                            }`}>
                              {booking.status}
                            </span>
                          </div>

                          <div className="flex flex-wrap gap-4 text-sm text-neutral-600 mb-3">
                            <div className="flex items-center gap-1">
                              <FaCalendarCheck className="w-4 h-4 text-neutral-400" />
                              <span>
                                {new Date(booking.check_in_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                {' - '}
                                {new Date(booking.check_out_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                              </span>
                            </div>
                            <div>
                              {booking.nights} {booking.nights === 1 ? 'night' : 'nights'}
                            </div>
                            <div>
                              {booking.number_of_guests} {booking.number_of_guests === 1 ? 'guest' : 'guests'}
                            </div>
                          </div>

                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm text-neutral-500">Total Price</p>
                              <p className="text-xl font-bold text-neutral-900">${booking.total_price}</p>
                            </div>
                            {isUpcoming && (
                              <span className="text-xs bg-primary-100 text-primary-700 px-3 py-1 rounded-full font-medium">
                                {Math.ceil((new Date(booking.check_in_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} days away
                              </span>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}

                  {myBookings.length > 5 && getUpcomingBookings().length === 0 && (
                    <button
                      onClick={() => router.push('/rooms')}
                      className="w-full py-3 text-sm font-medium text-primary-600 hover:text-primary-700 border border-primary-200 hover:bg-primary-50 rounded-lg transition-colors"
                    >
                      View All Bookings ({myBookings.length})
                    </button>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
