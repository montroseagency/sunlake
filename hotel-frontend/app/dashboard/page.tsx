'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';

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
  const [activeTab, setActiveTab] = useState<'reservations' | 'my-bookings'>('reservations');
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
    fetchRooms();
    fetchMyBookings();
  }, [router]);

  const fetchRooms = async () => {
    try {
      const params = new URLSearchParams();
      if (checkInDate && checkOutDate) {
        params.append('check_in', checkInDate);
        params.append('check_out', checkOutDate);
      }

      const response = await api.get(`/rooms/?${params.toString()}`);
      setRooms(response.data.results || response.data);
    } catch (error) {
      console.error('Failed to fetch rooms:', error);
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
    if (!checkInDate || !checkOutDate) {
      alert('Please select check-in and check-out dates');
      return;
    }
    fetchRooms();
  };

  const handleSelectRoom = (room: Room) => {
    if (!checkInDate || !checkOutDate) {
      alert('Please select dates first');
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
      setActiveTab('my-bookings');
      fetchMyBookings();
    } catch (error: any) {
      console.error('Booking error:', error);
      alert(error.response?.data?.detail || error.response?.data?.message || 'Failed to create booking');
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

  if (!user) return null;

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Dashboard Header */}
      <div className="bg-primary-500 text-white py-8">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl font-bold">Welcome, {user.first_name || user.email}!</h1>
          <p className="text-primary-100 mt-2">Manage your reservations and bookings</p>
        </div>
      </div>

      {/* Dashboard Navigation */}
      <div className="bg-white shadow-sm border-b border-neutral-200 sticky top-16 z-40">
        <div className="container mx-auto px-4">
          <div className="flex space-x-8">
            <button
              onClick={() => setActiveTab('reservations')}
              className={`py-4 px-2 font-medium border-b-2 transition-colors ${
                activeTab === 'reservations'
                  ? 'border-primary-500 text-primary-500'
                  : 'border-transparent text-neutral-600 hover:text-neutral-900'
              }`}
            >
              Make a Reservation
            </button>
            <button
              onClick={() => setActiveTab('my-bookings')}
              className={`py-4 px-2 font-medium border-b-2 transition-colors ${
                activeTab === 'my-bookings'
                  ? 'border-primary-500 text-primary-500'
                  : 'border-transparent text-neutral-600 hover:text-neutral-900'
              }`}
            >
              My Bookings
            </button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Reservations Tab */}
        {activeTab === 'reservations' && (
          <div>
            {/* Date Selection */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-8">
              <h2 className="text-2xl font-bold mb-6">Find Available Rooms</h2>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Check-in Date *
                  </label>
                  <input
                    type="date"
                    value={checkInDate}
                    onChange={(e) => setCheckInDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Check-out Date *
                  </label>
                  <input
                    type="date"
                    value={checkOutDate}
                    onChange={(e) => setCheckOutDate(e.target.value)}
                    min={checkInDate || new Date().toISOString().split('T')[0]}
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Guests
                  </label>
                  <input
                    type="number"
                    value={numberOfGuests}
                    onChange={(e) => setNumberOfGuests(parseInt(e.target.value))}
                    min="1"
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div className="flex items-end">
                  <button
                    onClick={handleSearchRooms}
                    className="w-full bg-primary-500 hover:bg-primary-600 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                  >
                    Search Rooms
                  </button>
                </div>
              </div>
              {checkInDate && checkOutDate && (
                <p className="mt-4 text-sm text-neutral-600">
                  {calculateNights()} night{calculateNights() !== 1 ? 's' : ''} selected
                </p>
              )}
            </div>

            {/* Available Rooms */}
            <div>
              <h3 className="text-xl font-bold mb-4">Available Rooms ({rooms.length})</h3>
              {loading ? (
                <div className="text-center py-12">Loading rooms...</div>
              ) : rooms.length === 0 ? (
                <div className="bg-white rounded-lg shadow-md p-12 text-center">
                  <p className="text-neutral-600">
                    {checkInDate && checkOutDate
                      ? 'No rooms available for selected dates'
                      : 'Please select dates to see available rooms'}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {rooms.map((room) => (
                    <div key={room.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                      {room.primary_image && (
                        <img
                          src={room.primary_image}
                          alt={room.name}
                          className="w-full h-48 object-cover"
                        />
                      )}
                      <div className="p-4">
                        <h4 className="text-lg font-bold text-neutral-900">{room.name}</h4>
                        <p className="text-sm text-neutral-600 mb-2">{room.room_type}</p>
                        <p className="text-sm text-neutral-600 mb-2">Capacity: {room.capacity} guests</p>
                        <div className="flex justify-between items-center mt-4">
                          <div>
                            <p className="text-2xl font-bold text-primary-500">
                              ${room.base_price_per_night}
                              <span className="text-sm text-neutral-600">/night</span>
                            </p>
                            {checkInDate && checkOutDate && (
                              <p className="text-sm text-neutral-600">
                                Total: ${calculateTotalPrice(room.base_price_per_night)}
                              </p>
                            )}
                          </div>
                          <button
                            onClick={() => handleSelectRoom(room)}
                            className="bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                          >
                            Book
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* My Bookings Tab */}
        {activeTab === 'my-bookings' && (
          <div>
            <h2 className="text-2xl font-bold mb-6">My Bookings</h2>
            {myBookings.length === 0 ? (
              <div className="bg-white rounded-lg shadow-md p-12 text-center">
                <p className="text-neutral-600 mb-4">You don't have any bookings yet</p>
                <button
                  onClick={() => setActiveTab('reservations')}
                  className="bg-primary-500 hover:bg-primary-600 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                >
                  Make a Reservation
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {myBookings.map((booking) => (
                  <div key={booking.id} className="bg-white rounded-lg shadow-md p-6">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-neutral-900">{booking.room.name}</h3>
                        <p className="text-neutral-600 mt-2">
                          Check-in: {new Date(booking.check_in_date).toLocaleDateString()}
                        </p>
                        <p className="text-neutral-600">
                          Check-out: {new Date(booking.check_out_date).toLocaleDateString()}
                        </p>
                        <p className="text-neutral-600">
                          Guests: {booking.number_of_guests} | Nights: {booking.nights}
                        </p>
                        <p className="text-2xl font-bold text-primary-500 mt-2">
                          Total: ${booking.total_price}
                        </p>
                      </div>
                      <div>
                        <span
                          className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                            booking.status === 'CONFIRMED'
                              ? 'bg-green-100 text-green-800'
                              : booking.status === 'PENDING'
                              ? 'bg-yellow-100 text-yellow-800'
                              : booking.status === 'CANCELLED'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {booking.status}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Booking Form Modal */}
      {showBookingForm && selectedRoom && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-neutral-200 flex justify-between items-center sticky top-0 bg-white rounded-t-2xl">
              <h2 className="text-2xl font-bold text-neutral-900">Complete Your Booking</h2>
              <button
                onClick={() => setShowBookingForm(false)}
                className="text-neutral-500 hover:text-neutral-700 text-2xl leading-none"
              >
                &times;
              </button>
            </div>

            <div className="p-6">
              <div className="bg-neutral-50 rounded-lg p-4 mb-6">
                <h3 className="font-bold text-lg mb-2">{selectedRoom.name}</h3>
                <p className="text-neutral-600">Check-in: {new Date(checkInDate).toLocaleDateString()}</p>
                <p className="text-neutral-600">Check-out: {new Date(checkOutDate).toLocaleDateString()}</p>
                <p className="text-neutral-600">Nights: {calculateNights()}</p>
                <p className="text-neutral-600">Guests: {numberOfGuests}</p>
                <p className="text-2xl font-bold text-primary-500 mt-2">
                  Total: ${calculateTotalPrice(selectedRoom.base_price_per_night)}
                </p>
              </div>

              <form onSubmit={handleSubmitBooking} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={bookingFormData.guest_name}
                    onChange={(e) => setBookingFormData({ ...bookingFormData, guest_name: e.target.value })}
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={bookingFormData.guest_email}
                    onChange={(e) => setBookingFormData({ ...bookingFormData, guest_email: e.target.value })}
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Phone *
                  </label>
                  <input
                    type="tel"
                    required
                    value={bookingFormData.guest_phone}
                    onChange={(e) => setBookingFormData({ ...bookingFormData, guest_phone: e.target.value })}
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Special Requests (Optional)
                  </label>
                  <textarea
                    value={bookingFormData.special_requests}
                    onChange={(e) => setBookingFormData({ ...bookingFormData, special_requests: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-primary-500 hover:bg-primary-600 text-white py-3 rounded-lg font-medium transition-colors"
                >
                  Confirm Booking
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
