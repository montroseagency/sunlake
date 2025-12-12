'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import CustomerMessaging from '@/components/messaging/CustomerMessaging';

interface Room {
  id: number;
  name: string;
  slug: string;
  room_type: string;
  capacity: number;
  base_price_per_night: string;
  primary_image: string;
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

type GateStatus = 'active' | 'pending' | 'expired';

interface BookingWithGate extends Booking {
  gateStatus: GateStatus;
  daysRemaining?: number;
  daysUntilCheckIn?: number;
}

export default function EnhancedDashboard() {
  const [activeTab, setActiveTab] = useState<'overview' | 'active' | 'past' | 'new-booking' | 'messages'>('overview');
  const [user, setUser] = useState<any>(null);
  const [allBookings, setAllBookings] = useState<Booking[]>([]);
  const [activeBookings, setActiveBookings] = useState<BookingWithGate[]>([]);
  const [pastBookings, setPastBookings] = useState<BookingWithGate[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkInDate, setCheckInDate] = useState('');
  const [checkOutDate, setCheckOutDate] = useState('');
  const [numberOfGuests, setNumberOfGuests] = useState(1);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [bookingFormData, setBookingFormData] = useState({
    guest_name: '',
    guest_email: '',
    guest_phone: '',
    special_requests: '',
  });
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
      const bookings = response.data.results || response.data;
      setAllBookings(bookings);
      categorizeBookings(bookings);
    } catch (error) {
      console.error('Failed to fetch bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const categorizeBookings = (bookings: Booking[]) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const active: BookingWithGate[] = [];
    const past: BookingWithGate[] = [];

    bookings.forEach((booking) => {
      const checkIn = new Date(booking.check_in_date);
      const checkOut = new Date(booking.check_out_date);
      checkIn.setHours(0, 0, 0, 0);
      checkOut.setHours(0, 0, 0, 0);

      let gateStatus: GateStatus;
      let daysRemaining: number | undefined;
      let daysUntilCheckIn: number | undefined;

      if (today >= checkIn && today <= checkOut) {
        // Currently staying
        gateStatus = 'active';
        daysRemaining = Math.ceil((checkOut.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      } else if (today < checkIn) {
        // Upcoming booking
        gateStatus = 'pending';
        daysUntilCheckIn = Math.ceil((checkIn.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      } else {
        // Past booking
        gateStatus = 'expired';
      }

      const bookingWithGate: BookingWithGate = {
        ...booking,
        gateStatus,
        daysRemaining,
        daysUntilCheckIn,
      };

      if (gateStatus === 'expired') {
        past.push(bookingWithGate);
      } else {
        active.push(bookingWithGate);
      }
    });

    // Sort active by check-in date (soonest first)
    active.sort((a, b) => new Date(a.check_in_date).getTime() - new Date(b.check_in_date).getTime());

    // Sort past by check-out date (most recent first)
    past.sort((a, b) => new Date(b.check_out_date).getTime() - new Date(a.check_out_date).getTime());

    setActiveBookings(active);
    setPastBookings(past);
  };

  const fetchRooms = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();

      if (checkInDate && checkOutDate) {
        params.append('check_in', checkInDate);
        params.append('check_out', checkOutDate);
      } else {
        const today = new Date().toISOString().split('T')[0];
        const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
        params.append('check_in', today);
        params.append('check_out', tomorrow);
      }

      if (numberOfGuests > 1) {
        params.append('capacity', numberOfGuests.toString());
      }

      const response = await api.get(`/rooms/?${params.toString()}`);
      setRooms(response.data.results || response.data);
    } catch (error) {
      console.error('Failed to fetch rooms:', error);
      setRooms([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchRooms = () => {
    if (checkInDate && checkOutDate) {
      const checkIn = new Date(checkInDate);
      const checkOut = new Date(checkOutDate);

      if (checkOut <= checkIn) {
        alert('Check-out date must be after check-in date');
        return;
      }
    }
    fetchRooms();
  };

  const handleSelectRoom = (room: Room) => {
    if (!checkInDate || !checkOutDate) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      alert('Please select check-in and check-out dates first');
      return;
    }

    if (room.capacity < numberOfGuests) {
      alert(`This room can only accommodate up to ${room.capacity} guest(s)`);
      return;
    }

    setSelectedRoom(room);
    setBookingFormData({
      guest_name: `${user?.first_name || ''} ${user?.last_name || ''}`.trim(),
      guest_email: user?.email || '',
      guest_phone: user?.phone || '',
      special_requests: '',
    });
    setShowBookingForm(true);
  };

  const handleSubmitBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await api.post('/bookings/', {
        room: selectedRoom?.id,
        check_in_date: checkInDate,
        check_out_date: checkOutDate,
        guest_name: bookingFormData.guest_name,
        guest_email: bookingFormData.guest_email,
        guest_phone: bookingFormData.guest_phone,
        number_of_guests: numberOfGuests,
        special_requests: bookingFormData.special_requests,
      });

      alert('Booking created successfully!');
      setShowBookingForm(false);
      setSelectedRoom(null);
      await fetchMyBookings();
      setActiveTab('active');
    } catch (error: any) {
      console.error('Booking error:', error);
      alert(error.response?.data?.detail || 'Failed to create booking');
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

  const calculateNights = () => {
    if (!checkInDate || !checkOutDate) return 0;
    const start = new Date(checkInDate);
    const end = new Date(checkOutDate);
    return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  };

  const getGateIcon = (status: GateStatus) => {
    switch (status) {
      case 'active':
        return (
          <div className="flex items-center gap-2 text-green-600">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
              </svg>
            </div>
            <span className="font-semibold">Gate Open</span>
          </div>
        );
      case 'pending':
        return (
          <div className="flex items-center gap-2 text-amber-600">
            <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <span className="font-semibold">Pending</span>
          </div>
        );
      case 'expired':
        return (
          <div className="flex items-center gap-2 text-neutral-400">
            <div className="w-10 h-10 bg-neutral-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <span className="font-semibold">Gate Closed</span>
          </div>
        );
    }
  };

  if (!user) return null;

  const token = localStorage.getItem('access_token');

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <div className="bg-white border-b border-neutral-200 shadow-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                {user.first_name?.[0] || user.email?.[0] || 'U'}
              </div>
              <div>
                <h1 className="text-lg font-semibold text-neutral-900">
                  {user.first_name ? `${user.first_name} ${user.last_name || ''}` : user.email}
                </h1>
                <p className="text-xs text-neutral-500">Customer Dashboard</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="px-4 py-2 text-sm font-medium text-neutral-700 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg transition-colors"
            >
              Sign out
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white border-b border-neutral-200">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8" aria-label="Tabs">
            <button
              onClick={() => setActiveTab('overview')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'overview'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-neutral-500 hover:text-neutral-700'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('active')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors relative ${
                activeTab === 'active'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-neutral-500 hover:text-neutral-700'
              }`}
            >
              Active Bookings
              {activeBookings.length > 0 && (
                <span className="ml-2 px-2 py-0.5 bg-green-500 text-white text-xs rounded-full">
                  {activeBookings.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('past')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'past'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-neutral-500 hover:text-neutral-700'
              }`}
            >
              Past Experiences
            </button>
            <button
              onClick={() => {
                setActiveTab('new-booking');
                fetchRooms();
              }}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'new-booking'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-neutral-500 hover:text-neutral-700'
              }`}
            >
              New Booking
            </button>
            <button
              onClick={() => setActiveTab('messages')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'messages'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-neutral-500 hover:text-neutral-700'
              }`}
            >
              Messages
            </button>
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AnimatePresence mode="wait">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white rounded-xl shadow-sm p-6 border border-neutral-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-neutral-500">Total Bookings</p>
                      <p className="text-3xl font-bold text-neutral-900 mt-1">{allBookings.length}</p>
                    </div>
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm p-6 border border-neutral-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-neutral-500">Active Trips</p>
                      <p className="text-3xl font-bold text-green-600 mt-1">{activeBookings.length}</p>
                    </div>
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                      <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm p-6 border border-neutral-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-neutral-500">Past Stays</p>
                      <p className="text-3xl font-bold text-neutral-900 mt-1">{pastBookings.length}</p>
                    </div>
                    <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                      <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-white rounded-xl shadow-sm p-6 border border-neutral-200">
                <h2 className="text-xl font-semibold text-neutral-900 mb-4">Quick Actions</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <button
                    onClick={() => {
                      setActiveTab('new-booking');
                      fetchRooms();
                    }}
                    className="flex items-center gap-4 p-4 border-2 border-dashed border-neutral-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
                  >
                    <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                    </div>
                    <div className="text-left">
                      <p className="font-semibold text-neutral-900">Make a Reservation</p>
                      <p className="text-sm text-neutral-500">Book your next stay</p>
                    </div>
                  </button>

                  <button
                    onClick={() => setActiveTab('active')}
                    className="flex items-center gap-4 p-4 border-2 border-neutral-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
                  >
                    <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center text-white">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                    </div>
                    <div className="text-left">
                      <p className="font-semibold text-neutral-900">View Active Bookings</p>
                      <p className="text-sm text-neutral-500">Check your upcoming trips</p>
                    </div>
                  </button>
                </div>
              </div>

              {/* Recent Activity */}
              {activeBookings.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm p-6 border border-neutral-200">
                  <h2 className="text-xl font-semibold text-neutral-900 mb-4">Upcoming Stay</h2>
                  {activeBookings.slice(0, 1).map((booking) => (
                    <div key={booking.id} className="flex items-center gap-4 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
                      <img
                        src={booking.room.primary_image || '/placeholder-room.jpg'}
                        alt={booking.room.name}
                        className="w-24 h-24 object-cover rounded-lg"
                      />
                      <div className="flex-1">
                        <h3 className="font-semibold text-neutral-900">{booking.room.name}</h3>
                        <p className="text-sm text-neutral-600">
                          {new Date(booking.check_in_date).toLocaleDateString()} - {new Date(booking.check_out_date).toLocaleDateString()}
                        </p>
                        {booking.gateStatus === 'active' && booking.daysRemaining && (
                          <p className="text-sm text-green-600 font-medium mt-1">
                            {booking.daysRemaining} day{booking.daysRemaining !== 1 ? 's' : ''} remaining
                          </p>
                        )}
                        {booking.gateStatus === 'pending' && booking.daysUntilCheckIn && (
                          <p className="text-sm text-amber-600 font-medium mt-1">
                            Check-in in {booking.daysUntilCheckIn} day{booking.daysUntilCheckIn !== 1 ? 's' : ''}
                          </p>
                        )}
                      </div>
                      {getGateIcon(booking.gateStatus)}
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* Active Bookings Tab */}
          {activeTab === 'active' && (
            <motion.div
              key="active"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-neutral-900">Active Bookings & Upcoming Trips</h2>
              </div>

              {activeBookings.length === 0 ? (
                <div className="bg-white rounded-xl shadow-sm p-12 text-center border border-neutral-200">
                  <svg className="w-16 h-16 text-neutral-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  <p className="text-neutral-600 mb-4">No active bookings</p>
                  <button
                    onClick={() => {
                      setActiveTab('new-booking');
                      fetchRooms();
                    }}
                    className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                  >
                    Book Now
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-6">
                  {activeBookings.map((booking) => (
                    <div key={booking.id} className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden hover:shadow-md transition-shadow">
                      <div className="flex flex-col md:flex-row">
                        <img
                          src={booking.room.primary_image || '/placeholder-room.jpg'}
                          alt={booking.room.name}
                          className="w-full md:w-64 h-48 object-cover"
                        />
                        <div className="flex-1 p-6">
                          <div className="flex items-start justify-between mb-4">
                            <div>
                              <h3 className="text-xl font-semibold text-neutral-900">{booking.room.name}</h3>
                              <p className="text-sm text-neutral-500">{booking.room.room_type}</p>
                            </div>
                            {getGateIcon(booking.gateStatus)}
                          </div>

                          <div className="grid grid-cols-2 gap-4 mb-4">
                            <div>
                              <p className="text-xs text-neutral-500">Check-in</p>
                              <p className="font-medium text-neutral-900">
                                {new Date(booking.check_in_date).toLocaleDateString('en-US', {
                                  weekday: 'short',
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric'
                                })}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-neutral-500">Check-out</p>
                              <p className="font-medium text-neutral-900">
                                {new Date(booking.check_out_date).toLocaleDateString('en-US', {
                                  weekday: 'short',
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric'
                                })}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-neutral-500">Guests</p>
                              <p className="font-medium text-neutral-900">{booking.number_of_guests}</p>
                            </div>
                            <div>
                              <p className="text-xs text-neutral-500">Total Price</p>
                              <p className="font-medium text-neutral-900">${booking.total_price}</p>
                            </div>
                          </div>

                          {booking.gateStatus === 'active' && (
                            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                              <div className="flex items-center gap-2 mb-2">
                                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <p className="font-semibold text-green-900">You're currently checked in!</p>
                              </div>
                              <p className="text-sm text-green-700">
                                Enjoy your stay! {booking.daysRemaining} day{booking.daysRemaining !== 1 ? 's' : ''} remaining.
                              </p>
                            </div>
                          )}

                          {booking.gateStatus === 'pending' && (
                            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                              <div className="flex items-center gap-2 mb-2">
                                <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <p className="font-semibold text-amber-900">Upcoming Reservation</p>
                              </div>
                              <p className="text-sm text-amber-700">
                                Your stay begins in {booking.daysUntilCheckIn} day{booking.daysUntilCheckIn !== 1 ? 's' : ''}. We're looking forward to welcoming you!
                              </p>
                            </div>
                          )}

                          <div className="mt-4 flex gap-2">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                              booking.status === 'CONFIRMED' ? 'bg-green-100 text-green-700' :
                              booking.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' :
                              'bg-neutral-100 text-neutral-700'
                            }`}>
                              {booking.status}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* Past Bookings Tab */}
          {activeTab === 'past' && (
            <motion.div
              key="past"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-neutral-900">Past Experiences</h2>
              </div>

              {pastBookings.length === 0 ? (
                <div className="bg-white rounded-xl shadow-sm p-12 text-center border border-neutral-200">
                  <svg className="w-16 h-16 text-neutral-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-neutral-600">No past stays yet</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {pastBookings.map((booking) => (
                    <div key={booking.id} className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden hover:shadow-md transition-shadow group">
                      <div className="relative">
                        <img
                          src={booking.room.primary_image || '/placeholder-room.jpg'}
                          alt={booking.room.name}
                          className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute top-4 right-4">
                          {getGateIcon(booking.gateStatus)}
                        </div>
                      </div>
                      <div className="p-6">
                        <h3 className="text-lg font-semibold text-neutral-900 mb-2">{booking.room.name}</h3>
                        <p className="text-sm text-neutral-500 mb-4">
                          {new Date(booking.check_in_date).toLocaleDateString()} - {new Date(booking.check_out_date).toLocaleDateString()}
                        </p>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs text-neutral-500">Duration</p>
                            <p className="font-medium text-neutral-900">{booking.nights} night{booking.nights !== 1 ? 's' : ''}</p>
                          </div>
                          <button
                            onClick={() => setActiveTab('new-booking')}
                            className="px-4 py-2 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                          >
                            Book Again
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* New Booking Tab - Keep existing implementation but trigger fetchRooms */}
          {activeTab === 'new-booking' && (
            <motion.div
              key="new-booking"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <div className="bg-white rounded-xl shadow-sm p-6 border border-neutral-200 mb-6">
                <h2 className="text-xl font-semibold text-neutral-900 mb-4">Search Available Rooms</h2>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">Check-in</label>
                    <input
                      type="date"
                      value={checkInDate}
                      onChange={(e) => setCheckInDate(e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">Check-out</label>
                    <input
                      type="date"
                      value={checkOutDate}
                      onChange={(e) => setCheckOutDate(e.target.value)}
                      min={checkInDate || new Date().toISOString().split('T')[0]}
                      className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">Guests</label>
                    <select
                      value={numberOfGuests}
                      onChange={(e) => setNumberOfGuests(Number(e.target.value))}
                      className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      {[1, 2, 3, 4, 5, 6].map((num) => (
                        <option key={num} value={num}>{num} Guest{num > 1 ? 's' : ''}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex items-end">
                    <button
                      onClick={handleSearchRooms}
                      className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                    >
                      Search
                    </button>
                  </div>
                </div>
                {calculateNights() > 0 && (
                  <p className="text-sm text-neutral-600 mt-2">
                    {calculateNights()} night{calculateNights() !== 1 ? 's' : ''}
                  </p>
                )}
              </div>

              {loading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
                </div>
              ) : rooms.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-xl">
                  <p className="text-neutral-600">No rooms available for selected dates</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {rooms.map((room) => (
                    <div key={room.id} className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden hover:shadow-md transition-shadow">
                      <img
                        src={room.primary_image || '/placeholder-room.jpg'}
                        alt={room.name}
                        className="w-full h-48 object-cover"
                      />
                      <div className="p-4">
                        <h3 className="font-semibold text-neutral-900 mb-1">{room.name}</h3>
                        <p className="text-sm text-neutral-500 mb-3">{room.room_type}</p>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs text-neutral-500">From</p>
                            <p className="text-xl font-bold text-neutral-900">${room.base_price_per_night}</p>
                            <p className="text-xs text-neutral-500">per night</p>
                          </div>
                          <button
                            onClick={() => handleSelectRoom(room)}
                            className="px-4 py-2 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600"
                          >
                            Book Now
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* Messages Tab */}
          {activeTab === 'messages' && user && (
            <motion.div
              key="messages"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="h-[600px]"
            >
              <CustomerMessaging
                userId={user.id}
                userEmail={user.email}
                userName={user.first_name ? `${user.first_name} ${user.last_name || ''}`.trim() : user.email}
                token={typeof window !== 'undefined' ? localStorage.getItem('access_token') || '' : ''}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Booking Form Modal */}
      {showBookingForm && selectedRoom && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">Complete Your Booking</h2>
                <button
                  onClick={() => setShowBookingForm(false)}
                  className="text-neutral-500 hover:text-neutral-700"
                >
                  ✕
                </button>
              </div>
            </div>
            <form onSubmit={handleSubmitBooking} className="p-6 space-y-4">
              <div className="bg-neutral-50 p-4 rounded-lg">
                <h3 className="font-semibold mb-2">{selectedRoom.name}</h3>
                <p className="text-sm text-neutral-600">
                  {new Date(checkInDate).toLocaleDateString()} - {new Date(checkOutDate).toLocaleDateString()}
                </p>
                <p className="text-sm text-neutral-600">{numberOfGuests} Guest(s) • {calculateNights()} Night(s)</p>
                <p className="text-xl font-bold mt-2">${(parseFloat(selectedRoom.base_price_per_night) * calculateNights()).toFixed(2)}</p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={bookingFormData.guest_name}
                  onChange={(e) => setBookingFormData({ ...bookingFormData, guest_name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Email *</label>
                <input
                  type="email"
                  required
                  value={bookingFormData.guest_email}
                  onChange={(e) => setBookingFormData({ ...bookingFormData, guest_email: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Phone *</label>
                <input
                  type="tel"
                  required
                  value={bookingFormData.guest_phone}
                  onChange={(e) => setBookingFormData({ ...bookingFormData, guest_phone: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Special Requests</label>
                <textarea
                  value={bookingFormData.special_requests}
                  onChange={(e) => setBookingFormData({ ...bookingFormData, special_requests: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>

              <div className="flex gap-2 pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
                >
                  {loading ? 'Booking...' : 'Confirm Booking'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowBookingForm(false)}
                  className="px-6 py-3 bg-neutral-200 rounded-lg hover:bg-neutral-300"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
