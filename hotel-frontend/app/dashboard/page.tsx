'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { motion, AnimatePresence } from 'framer-motion';

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

export default function ClientDashboard() {
  const [activeTab, setActiveTab] = useState<'overview' | 'reservations' | 'my-bookings'>('overview');
  const [user, setUser] = useState<any>(null);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [myBookings, setMyBookings] = useState<Booking[]>([]);
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
    // Load all rooms initially when component mounts
    fetchRooms();
    fetchMyBookings();
  }, [router]);

  // Re-fetch rooms when switching to reservations tab
  useEffect(() => {
    if (activeTab === 'reservations') {
      fetchRooms();
    }
  }, [activeTab]);

  const fetchRooms = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();

      // Add date filters if provided
      if (checkInDate && checkOutDate) {
        params.append('check_in', checkInDate);
        params.append('check_out', checkOutDate);
      } else {
        // If no dates selected, fetch rooms available starting from today
        // This shows only rooms that are currently not booked
        const today = new Date().toISOString().split('T')[0];
        const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
        params.append('check_in', today);
        params.append('check_out', tomorrow);
      }

      // Add capacity filter if it exceeds 1
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

  const fetchMyBookings = async () => {
    try {
      const response = await api.get('/bookings/my-bookings/');
      setMyBookings(response.data.results || response.data);
    } catch (error) {
      console.error('Failed to fetch bookings:', error);
    }
  };

  const handleSearchRooms = () => {
    // Allow search without dates to show all available rooms
    if (checkInDate && checkOutDate) {
      // Validate date range
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
    // Check if dates are selected
    if (!checkInDate || !checkOutDate) {
      // Scroll to top and highlight date fields
      window.scrollTo({ top: 0, behavior: 'smooth' });
      alert('⚠️ Please select check-in and check-out dates first to make a reservation.');
      return;
    }

    // Validate room capacity
    if (room.capacity < numberOfGuests) {
      alert(`⚠️ This room can only accommodate up to ${room.capacity} guest${room.capacity !== 1 ? 's' : ''}. You selected ${numberOfGuests} guest${numberOfGuests !== 1 ? 's' : ''}.\n\nPlease choose a different room or adjust the number of guests.`);
      return;
    }

    // Set selected room and populate form
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
      const response = await api.post('/bookings/', {
        room: selectedRoom?.id,
        check_in_date: checkInDate,
        check_out_date: checkOutDate,
        guest_name: bookingFormData.guest_name,
        guest_email: bookingFormData.guest_email,
        guest_phone: bookingFormData.guest_phone,
        number_of_guests: numberOfGuests,
        special_requests: bookingFormData.special_requests,
      });

      // Success - show confirmation
      alert(`🎉 Booking created successfully!\n\nBooking ID: ${response.data.id}\nTotal: $${response.data.total_price}\n\nCheck your email for confirmation details.`);

      // Reset form and close modal
      setShowBookingForm(false);
      setSelectedRoom(null);
      setBookingFormData({
        guest_name: '',
        guest_email: '',
        guest_phone: '',
        special_requests: '',
      });

      // Refresh bookings and switch to my-bookings tab
      await fetchMyBookings();
      setActiveTab('my-bookings');
    } catch (error: any) {
      console.error('Booking error:', error);

      // Display detailed error message
      let errorMessage = 'Failed to create booking. Please try again.';

      if (error.response?.data) {
        if (error.response.data.detail) {
          errorMessage = error.response.data.detail;
        } else if (error.response.data.message) {
          errorMessage = error.response.data.message;
        } else if (typeof error.response.data === 'object') {
          // Handle field-specific errors
          const errors = Object.entries(error.response.data)
            .map(([key, value]) => `${key}: ${value}`)
            .join('\n');
          errorMessage = errors || errorMessage;
        }
      }

      alert(`❌ Booking Failed\n\n${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const calculateNights = () => {
    if (!checkInDate || !checkOutDate) return 0;
    const start = new Date(checkInDate);
    const end = new Date(checkOutDate);
    return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  };

  const calculateTotalPrice = (basePrice: string) => {
    const nights = calculateNights();
    return (parseFloat(basePrice) * nights).toFixed(2);
  };

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    router.push('/');
  };

  const getUpcomingBookings = () => {
    return myBookings.filter(b => new Date(b.check_in_date) >= new Date()).length;
  };

  const getPastBookings = () => {
    return myBookings.filter(b => new Date(b.check_out_date) < new Date()).length;
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Modern Header with User Profile */}
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
                <p className="text-xs text-neutral-500">Genius Level 1</p>
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
                  : 'border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('my-bookings')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'my-bookings'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300'
              }`}
            >
              Bookings & Trips
            </button>
            <button
              onClick={() => setActiveTab('reservations')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'reservations'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300'
              }`}
            >
              Make a Reservation
            </button>
          </nav>
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AnimatePresence mode="wait">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="max-w-5xl mx-auto">
                <h2 className="text-3xl font-bold text-neutral-900 mb-8">Your Dashboard</h2>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-neutral-600">Total Bookings</p>
                        <p className="text-3xl font-bold text-neutral-900 mt-2">{myBookings.length}</p>
                      </div>
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                        <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-neutral-600">Upcoming Trips</p>
                        <p className="text-3xl font-bold text-neutral-900 mt-2">{getUpcomingBookings()}</p>
                      </div>
                      <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                        <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-neutral-600">Past Trips</p>
                        <p className="text-3xl font-bold text-neutral-900 mt-2">{getPastBookings()}</p>
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
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl shadow-lg p-8 mb-8 text-white">
                  <h3 className="text-2xl font-bold mb-4">Ready for your next trip?</h3>
                  <p className="text-blue-100 mb-6">Discover amazing stays and experiences around the world</p>
                  <button
                    onClick={() => setActiveTab('reservations')}
                    className="bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
                  >
                    Book a Room Now
                  </button>
                </div>

                {/* Recent Bookings Preview */}
                <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold text-neutral-900">Recent Bookings</h3>
                    <button
                      onClick={() => setActiveTab('my-bookings')}
                      className="text-sm font-medium text-blue-600 hover:text-blue-700"
                    >
                      View all
                    </button>
                  </div>
                  {myBookings.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                      </div>
                      <p className="text-neutral-600 mb-4">No bookings yet</p>
                      <button
                        onClick={() => setActiveTab('reservations')}
                        className="text-blue-600 hover:text-blue-700 font-medium"
                      >
                        Make your first reservation
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {myBookings.slice(0, 3).map((booking) => (
                        <div key={booking.id} className="flex items-center justify-between p-4 bg-neutral-50 rounded-lg hover:bg-neutral-100 transition-colors">
                          <div className="flex-1">
                            <h4 className="font-semibold text-neutral-900">{booking.room.name}</h4>
                            <p className="text-sm text-neutral-600 mt-1">
                              {new Date(booking.check_in_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {new Date(booking.check_out_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            </p>
                          </div>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            booking.status === 'CONFIRMED' ? 'bg-green-100 text-green-800' :
                            booking.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                            booking.status === 'CANCELLED' ? 'bg-red-100 text-red-800' :
                            'bg-blue-100 text-blue-800'
                          }`}>
                            {booking.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* Reservations Tab */}
          {activeTab === 'reservations' && (
            <motion.div
              key="reservations"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              {/* Date Selection */}
              <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-8 mb-8">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-neutral-900">Search for Your Perfect Stay</h2>
                  {(checkInDate || checkOutDate || numberOfGuests > 1) && (
                    <button
                      onClick={() => {
                        setCheckInDate('');
                        setCheckOutDate('');
                        setNumberOfGuests(1);
                        fetchRooms();
                      }}
                      className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                    >
                      Clear filters
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-neutral-700 mb-2">
                      Check-in Date
                    </label>
                    <input
                      type="date"
                      value={checkInDate}
                      onChange={(e) => setCheckInDate(e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      placeholder="Select date"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-neutral-700 mb-2">
                      Check-out Date
                    </label>
                    <input
                      type="date"
                      value={checkOutDate}
                      onChange={(e) => setCheckOutDate(e.target.value)}
                      min={checkInDate || new Date().toISOString().split('T')[0]}
                      className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      placeholder="Select date"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-neutral-700 mb-2">
                      Number of Guests
                    </label>
                    <input
                      type="number"
                      value={numberOfGuests}
                      onChange={(e) => setNumberOfGuests(parseInt(e.target.value) || 1)}
                      min="1"
                      max="10"
                      className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    />
                  </div>
                  <div className="flex items-end">
                    <button
                      onClick={handleSearchRooms}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors shadow-md hover:shadow-lg flex items-center justify-center space-x-2"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                      <span>Search</span>
                    </button>
                  </div>
                </div>

                {/* Search Summary */}
                <div className="mt-4 flex items-center justify-between">
                  <div className="flex items-center space-x-4 text-sm text-neutral-600">
                    {checkInDate && checkOutDate ? (
                      <div className="flex items-center space-x-2">
                        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <p>
                          <span className="font-semibold">{calculateNights()}</span> night{calculateNights() !== 1 ? 's' : ''}
                        </p>
                      </div>
                    ) : (
                      <p className="text-neutral-500 italic">Showing all currently available rooms. Select dates for specific availability.</p>
                    )}
                    {numberOfGuests > 1 && (
                      <div className="flex items-center space-x-2">
                        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        <p>
                          <span className="font-semibold">{numberOfGuests}</span> guest{numberOfGuests !== 1 ? 's' : ''}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Available Rooms */}
              <div>
                <h3 className="text-2xl font-bold text-neutral-900 mb-6">
                  {rooms.length > 0 ? `${rooms.length} Available ${rooms.length === 1 ? 'Room' : 'Rooms'}` : 'Available Rooms'}
                </h3>
                {loading ? (
                  <div className="text-center py-20">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                    <p className="mt-4 text-neutral-600">Searching for available rooms...</p>
                  </div>
                ) : rooms.length === 0 ? (
                  <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-16 text-center">
                    <div className="w-20 h-20 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-10 h-10 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                    <p className="text-lg font-semibold text-neutral-900 mb-2">
                      {checkInDate && checkOutDate
                        ? 'No rooms available for selected dates'
                        : 'Start your search'}
                    </p>
                    <p className="text-neutral-600">
                      {checkInDate && checkOutDate
                        ? 'Try different dates or contact us for availability'
                        : 'All rooms are currently booked. Try selecting different dates.'}
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {rooms.map((room) => (
                      <motion.div
                        key={room.id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.3 }}
                        className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden hover:shadow-xl transition-all duration-300 group"
                      >
                        <div className="flex flex-col md:flex-row">
                          {room.primary_image && (
                            <div className="md:w-72 h-56 md:h-auto relative overflow-hidden">
                              <img
                                src={room.primary_image}
                                alt={room.name}
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                              />
                              <div className="absolute top-3 right-3">
                                <button className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-md hover:bg-neutral-100 transition-colors">
                                  <svg className="w-5 h-5 text-neutral-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                  </svg>
                                </button>
                              </div>
                            </div>
                          )}
                          <div className="flex-1 p-6">
                            <div className="flex items-start justify-between mb-3">
                              <div>
                                <div className="flex items-center gap-2 mb-2">
                                  <h4 className="text-xl font-bold text-neutral-900">{room.name}</h4>
                                  <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full">
                                    Available
                                  </span>
                                </div>
                                <p className="text-sm text-neutral-600">{room.room_type}</p>
                              </div>
                            </div>

                            <div className="space-y-2 mb-4">
                              <div className="flex items-center text-sm text-neutral-600">
                                <svg className="w-5 h-5 mr-2 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                </svg>
                                Up to {room.capacity} guests
                              </div>
                            </div>

                            <div className="flex items-end justify-between mt-auto pt-4 border-t border-neutral-200">
                              <div>
                                <div className="flex items-baseline space-x-1">
                                  <span className="text-3xl font-bold text-neutral-900">
                                    ${room.base_price_per_night}
                                  </span>
                                  <span className="text-sm text-neutral-600">/night</span>
                                </div>
                                {checkInDate && checkOutDate && (
                                  <p className="text-sm text-green-600 font-semibold mt-1">
                                    ${calculateTotalPrice(room.base_price_per_night)} for {calculateNights()} night{calculateNights() !== 1 ? 's' : ''}
                                  </p>
                                )}
                              </div>
                              <button
                                onClick={() => handleSelectRoom(room)}
                                disabled={room.capacity < numberOfGuests}
                                className={`px-6 py-3 rounded-lg font-semibold transition-colors shadow-md hover:shadow-lg ${
                                  room.capacity < numberOfGuests
                                    ? 'bg-neutral-300 text-neutral-500 cursor-not-allowed'
                                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                                }`}
                                title={room.capacity < numberOfGuests ? `Room capacity (${room.capacity}) is less than number of guests (${numberOfGuests})` : 'Reserve this room'}
                              >
                                {checkInDate && checkOutDate ? 'Reserve' : 'Select Dates'}
                              </button>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* My Bookings Tab */}
          {activeTab === 'my-bookings' && (
            <motion.div
              key="my-bookings"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <h2 className="text-3xl font-bold text-neutral-900 mb-8">Your Bookings & Trips</h2>
              {myBookings.length === 0 ? (
                <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-16 text-center">
                  <div className="w-20 h-20 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-10 h-10 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <p className="text-lg font-semibold text-neutral-900 mb-2">No trips booked... yet!</p>
                  <p className="text-neutral-600 mb-6">Time to dust off your bags and start planning your next adventure</p>
                  <button
                    onClick={() => setActiveTab('reservations')}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors shadow-md hover:shadow-lg"
                  >
                    Start Searching
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  {myBookings.map((booking) => {
                    const isUpcoming = new Date(booking.check_in_date) >= new Date();
                    const isPast = new Date(booking.check_out_date) < new Date();

                    return (
                      <motion.div
                        key={booking.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                        className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden hover:shadow-lg transition-shadow"
                      >
                        <div className="flex flex-col md:flex-row">
                          {booking.room.primary_image && (
                            <div className="md:w-64 h-48 md:h-auto relative">
                              <img
                                src={booking.room.primary_image}
                                alt={booking.room.name}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          )}
                          <div className="flex-1 p-6">
                            <div className="flex items-start justify-between mb-4">
                              <div>
                                <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold mb-3 ${
                                  booking.status === 'CONFIRMED' ? 'bg-green-100 text-green-800' :
                                  booking.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                                  booking.status === 'CANCELLED' ? 'bg-red-100 text-red-800' :
                                  'bg-blue-100 text-blue-800'
                                }`}>
                                  {booking.status}
                                </span>
                                <h3 className="text-2xl font-bold text-neutral-900">{booking.room.name}</h3>
                                <p className="text-sm text-neutral-600 mt-1">{booking.room.room_type}</p>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 mb-4">
                              <div>
                                <p className="text-xs text-neutral-500 mb-1">Check-in</p>
                                <p className="font-semibold text-neutral-900">
                                  {new Date(booking.check_in_date).toLocaleDateString('en-US', {
                                    weekday: 'short',
                                    month: 'short',
                                    day: 'numeric',
                                    year: 'numeric'
                                  })}
                                </p>
                              </div>
                              <div>
                                <p className="text-xs text-neutral-500 mb-1">Check-out</p>
                                <p className="font-semibold text-neutral-900">
                                  {new Date(booking.check_out_date).toLocaleDateString('en-US', {
                                    weekday: 'short',
                                    month: 'short',
                                    day: 'numeric',
                                    year: 'numeric'
                                  })}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center space-x-6 text-sm text-neutral-600 mb-4">
                              <div className="flex items-center">
                                <svg className="w-5 h-5 mr-2 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                </svg>
                                {booking.number_of_guests} {booking.number_of_guests === 1 ? 'guest' : 'guests'}
                              </div>
                              <div className="flex items-center">
                                <svg className="w-5 h-5 mr-2 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                {booking.nights} {booking.nights === 1 ? 'night' : 'nights'}
                              </div>
                            </div>

                            <div className="flex items-end justify-between pt-4 border-t border-neutral-200">
                              <div>
                                <p className="text-xs text-neutral-500 mb-1">Total price</p>
                                <p className="text-2xl font-bold text-neutral-900">${booking.total_price}</p>
                              </div>
                              {isUpcoming && booking.status === 'CONFIRMED' && (
                                <button className="px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors">
                                  View Details
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Booking Form Modal */}
      <AnimatePresence>
        {showBookingForm && selectedRoom && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowBookingForm(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", duration: 0.5 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="sticky top-0 bg-white z-10 px-6 py-4 border-b border-neutral-200 rounded-t-2xl">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-neutral-900">Complete Your Reservation</h2>
                  <button
                    onClick={() => setShowBookingForm(false)}
                    className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-neutral-100 transition-colors"
                  >
                    <svg className="w-6 h-6 text-neutral-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              <div className="p-6">
                {/* Booking Summary Card */}
                <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-6 mb-6 border border-blue-100">
                  <h3 className="font-bold text-xl text-neutral-900 mb-4">{selectedRoom.name}</h3>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-xs text-neutral-600 mb-1">Check-in</p>
                      <p className="font-semibold text-neutral-900">
                        {new Date(checkInDate).toLocaleDateString('en-US', {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-neutral-600 mb-1">Check-out</p>
                      <p className="font-semibold text-neutral-900">
                        {new Date(checkOutDate).toLocaleDateString('en-US', {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-4 border-t border-blue-200">
                    <div className="text-sm text-neutral-600">
                      <span className="font-semibold">{calculateNights()}</span> nights · <span className="font-semibold">{numberOfGuests}</span> guests
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-neutral-900">
                        ${calculateTotalPrice(selectedRoom.base_price_per_night)}
                      </p>
                      <p className="text-xs text-neutral-600 text-right">Total price</p>
                    </div>
                  </div>
                </div>

                {/* Guest Information Form */}
                <form onSubmit={handleSubmitBooking} className="space-y-5">
                  <div>
                    <h4 className="font-semibold text-lg text-neutral-900 mb-4">Guest Information</h4>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-neutral-700 mb-2">
                      Full Name
                    </label>
                    <input
                      type="text"
                      required
                      value={bookingFormData.guest_name}
                      onChange={(e) => setBookingFormData({ ...bookingFormData, guest_name: e.target.value })}
                      className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      placeholder="Enter your full name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-neutral-700 mb-2">
                      Email Address
                    </label>
                    <input
                      type="email"
                      required
                      value={bookingFormData.guest_email}
                      onChange={(e) => setBookingFormData({ ...bookingFormData, guest_email: e.target.value })}
                      className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      placeholder="you@example.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-neutral-700 mb-2">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      required
                      value={bookingFormData.guest_phone}
                      onChange={(e) => setBookingFormData({ ...bookingFormData, guest_phone: e.target.value })}
                      className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      placeholder="+1 (555) 000-0000"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-neutral-700 mb-2">
                      Special Requests (Optional)
                    </label>
                    <textarea
                      value={bookingFormData.special_requests}
                      onChange={(e) => setBookingFormData({ ...bookingFormData, special_requests: e.target.value })}
                      rows={4}
                      className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none"
                      placeholder="Any special requirements or preferences..."
                    />
                  </div>

                  <div className="pt-4">
                    <button
                      type="submit"
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-lg font-semibold transition-colors shadow-lg hover:shadow-xl"
                    >
                      Complete Reservation
                    </button>
                    <p className="text-xs text-neutral-500 text-center mt-3">
                      By completing this booking, you agree to our terms and conditions
                    </p>
                  </div>
                </form>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
