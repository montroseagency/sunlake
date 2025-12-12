'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import api from '@/lib/api';
import Image from 'next/image';
import { FaCalendarAlt, FaUsers, FaCheckCircle, FaArrowLeft, FaArrowRight, FaBed, FaUser, FaEnvelope, FaPhone } from 'react-icons/fa';

interface Room {
  id: number;
  name: string;
  slug: string;
  room_type: string;
  capacity: number;
  max_occupancy: number;
  base_price_per_night: string;
  primary_image: string;
  images?: Array<{
    id: number;
    image_display: string;
    image_url: string;
  }>;
  amenities: Array<{
    id: number;
    name: string;
    icon: string;
  }>;
}

function BookingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const roomSlug = searchParams.get('room');

  const [step, setStep] = useState(1); // 1: Dates, 2: Guest Info, 3: Confirmation
  const [room, setRoom] = useState<Room | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form data
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [numberOfGuests, setNumberOfGuests] = useState(1);
  const [guestName, setGuestName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [specialRequests, setSpecialRequests] = useState('');
  const [createAccount, setCreateAccount] = useState(false);
  const [accountPassword, setAccountPassword] = useState('');

  // Booking confirmation
  const [bookingId, setBookingId] = useState<number | null>(null);
  const [totalPrice, setTotalPrice] = useState('0');

  useEffect(() => {
    if (roomSlug) {
      fetchRoom(roomSlug);
    } else {
      // No room selected, redirect to rooms page
      router.push('/rooms');
    }
  }, [roomSlug, router]);

  useEffect(() => {
    // Pre-fill guest info if user is logged in
    const userData = localStorage.getItem('user');
    if (userData) {
      const user = JSON.parse(userData);
      setGuestName(`${user.first_name || ''} ${user.last_name || ''}`.trim());
      setGuestEmail(user.email || '');
      setGuestPhone(user.phone || '');
    }
  }, []);

  const fetchRoom = async (slug: string) => {
    try {
      const response = await api.get(`/rooms/${slug}/`);
      setRoom(response.data);
    } catch (error) {
      console.error('Failed to fetch room:', error);
      router.push('/rooms');
    } finally {
      setLoading(false);
    }
  };

  const calculateNights = () => {
    if (!checkIn || !checkOut) return 0;
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  };

  const calculateTotal = () => {
    if (!room) return '0';
    const nights = calculateNights();
    return (parseFloat(room.base_price_per_night) * nights).toFixed(2);
  };

  const handleNextStep = () => {
    if (step === 1) {
      // Validate dates
      if (!checkIn || !checkOut) {
        alert('Please select check-in and check-out dates');
        return;
      }
      const start = new Date(checkIn);
      const end = new Date(checkOut);
      if (end <= start) {
        alert('Check-out date must be after check-in date');
        return;
      }
      if (room && numberOfGuests > (room.max_occupancy || room.capacity)) {
        alert(`This room can only accommodate up to ${room.max_occupancy || room.capacity} guests`);
        return;
      }
    } else if (step === 2) {
      // Validate guest info
      if (!guestName || !guestEmail || !guestPhone) {
        alert('Please fill in all required guest information');
        return;
      }
      if (createAccount && !accountPassword) {
        alert('Please provide a password to create your account');
        return;
      }
    }
    setStep(step + 1);
  };

  const handlePrevStep = () => {
    setStep(step - 1);
  };

  const handleSubmitBooking = async () => {
    setSubmitting(true);
    try {
      // Create booking
      const bookingResponse = await api.post('/bookings/', {
        room: room?.id,
        check_in_date: checkIn,
        check_out_date: checkOut,
        guest_name: guestName,
        guest_email: guestEmail,
        guest_phone: guestPhone,
        number_of_guests: numberOfGuests,
        special_requests: specialRequests,
      });

      setBookingId(bookingResponse.data.id);
      setTotalPrice(bookingResponse.data.total_price);

      // If create account is checked, create account and associate booking
      if (createAccount && accountPassword) {
        try {
          const nameParts = guestName.split(' ');
          const firstName = nameParts[0] || '';
          const lastName = nameParts.slice(1).join(' ') || '';

          await api.post('/auth/register/', {
            email: guestEmail,
            password: accountPassword,
            first_name: firstName,
            last_name: lastName,
            phone: guestPhone,
          });

          // Auto-login after registration
          const loginResponse = await api.post('/auth/login/', {
            email: guestEmail,
            password: accountPassword,
          });

          localStorage.setItem('access_token', loginResponse.data.access);
          localStorage.setItem('refresh_token', loginResponse.data.refresh);
          localStorage.setItem('user', JSON.stringify(loginResponse.data.user));
        } catch (accountError: any) {
          console.error('Failed to create account:', accountError);
          // Don't fail the booking if account creation fails
          alert('Booking successful, but account creation failed. You can create an account later.');
        }
      }

      setStep(3);
    } catch (error: any) {
      console.error('Booking error:', error);
      let errorMessage = 'Failed to create booking. Please try again.';
      if (error.response?.data) {
        if (error.response.data.detail) {
          errorMessage = error.response.data.detail;
        } else if (typeof error.response.data === 'object') {
          const errors = Object.entries(error.response.data)
            .map(([key, value]) => `${key}: ${value}`)
            .join('\n');
          errorMessage = errors || errorMessage;
        }
      }
      alert(`Booking Failed\n\n${errorMessage}`);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-b-4 border-primary-600 mb-4"></div>
          <p className="text-neutral-600 text-lg">Loading room details...</p>
        </div>
      </div>
    );
  }

  if (!room) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <div className="bg-white border-b border-neutral-200 shadow-sm">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <button
              onClick={() => router.push('/rooms')}
              className="flex items-center gap-2 text-neutral-600 hover:text-primary-600 transition-colors"
            >
              <FaArrowLeft className="w-4 h-4" />
              <span className="font-medium">Back to Rooms</span>
            </button>
            <h1 className="text-xl font-bold text-neutral-900">Complete Your Booking</h1>
            <div className="w-24"></div> {/* Spacer for centering */}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Progress Steps */}
          <div className="mb-8">
            <div className="flex items-center justify-center">
              {[1, 2, 3].map((stepNum) => (
                <div key={stepNum} className="flex items-center">
                  <div
                    className={`flex items-center justify-center w-12 h-12 rounded-full font-bold transition-all ${
                      step >= stepNum
                        ? 'bg-primary-500 text-white shadow-lg'
                        : 'bg-neutral-200 text-neutral-500'
                    }`}
                  >
                    {stepNum}
                  </div>
                  {stepNum < 3 && (
                    <div
                      className={`w-20 h-1 mx-2 transition-all ${
                        step > stepNum ? 'bg-primary-500' : 'bg-neutral-200'
                      }`}
                    ></div>
                  )}
                </div>
              ))}
            </div>
            <div className="flex justify-center mt-4 gap-24">
              <span className={`text-sm font-medium ${step >= 1 ? 'text-primary-600' : 'text-neutral-500'}`}>
                Dates & Guests
              </span>
              <span className={`text-sm font-medium ${step >= 2 ? 'text-primary-600' : 'text-neutral-500'}`}>
                Guest Info
              </span>
              <span className={`text-sm font-medium ${step >= 3 ? 'text-primary-600' : 'text-neutral-500'}`}>
                Confirmation
              </span>
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2">
              <AnimatePresence mode="wait">
                {/* Step 1: Dates & Guests */}
                {step === 1 && (
                  <motion.div
                    key="step1"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="bg-white rounded-xl shadow-lg border border-neutral-200 p-8"
                  >
                    <h2 className="text-2xl font-bold text-neutral-900 mb-6">Select Your Dates</h2>

                    <div className="space-y-6">
                      <div className="grid md:grid-cols-2 gap-6">
                        <div>
                          <label className="flex items-center gap-2 text-sm font-semibold text-neutral-700 mb-2">
                            <FaCalendarAlt className="text-primary-500" />
                            Check-in Date
                          </label>
                          <input
                            type="date"
                            value={checkIn}
                            onChange={(e) => setCheckIn(e.target.value)}
                            min={new Date().toISOString().split('T')[0]}
                            className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                          />
                        </div>

                        <div>
                          <label className="flex items-center gap-2 text-sm font-semibold text-neutral-700 mb-2">
                            <FaCalendarAlt className="text-primary-500" />
                            Check-out Date
                          </label>
                          <input
                            type="date"
                            value={checkOut}
                            onChange={(e) => setCheckOut(e.target.value)}
                            min={checkIn || new Date().toISOString().split('T')[0]}
                            className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="flex items-center gap-2 text-sm font-semibold text-neutral-700 mb-2">
                          <FaUsers className="text-primary-500" />
                          Number of Guests
                        </label>
                        <input
                          type="number"
                          value={numberOfGuests}
                          onChange={(e) => setNumberOfGuests(parseInt(e.target.value) || 1)}
                          min="1"
                          max={room.max_occupancy || room.capacity}
                          className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                        />
                        <p className="text-xs text-neutral-500 mt-2">
                          Maximum {room.max_occupancy || room.capacity} guests
                        </p>
                      </div>

                      {checkIn && checkOut && (
                        <div className="bg-primary-50 border border-primary-200 rounded-lg p-4">
                          <p className="text-primary-900 font-semibold">
                            {calculateNights()} night{calculateNights() !== 1 ? 's' : ''} • Total: ${calculateTotal()}
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="mt-8 flex justify-end">
                      <button
                        onClick={handleNextStep}
                        className="flex items-center gap-2 bg-primary-500 hover:bg-primary-600 text-white px-8 py-3 rounded-lg font-semibold transition-all shadow-lg hover:shadow-xl"
                      >
                        Continue
                        <FaArrowRight />
                      </button>
                    </div>
                  </motion.div>
                )}

                {/* Step 2: Guest Information */}
                {step === 2 && (
                  <motion.div
                    key="step2"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="bg-white rounded-xl shadow-lg border border-neutral-200 p-8"
                  >
                    <h2 className="text-2xl font-bold text-neutral-900 mb-6">Guest Information</h2>

                    <div className="space-y-6">
                      <div>
                        <label className="flex items-center gap-2 text-sm font-semibold text-neutral-700 mb-2">
                          <FaUser className="text-primary-500" />
                          Full Name *
                        </label>
                        <input
                          type="text"
                          value={guestName}
                          onChange={(e) => setGuestName(e.target.value)}
                          placeholder="John Doe"
                          className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                          required
                        />
                      </div>

                      <div>
                        <label className="flex items-center gap-2 text-sm font-semibold text-neutral-700 mb-2">
                          <FaEnvelope className="text-primary-500" />
                          Email Address *
                        </label>
                        <input
                          type="email"
                          value={guestEmail}
                          onChange={(e) => setGuestEmail(e.target.value)}
                          placeholder="john@example.com"
                          className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                          required
                        />
                      </div>

                      <div>
                        <label className="flex items-center gap-2 text-sm font-semibold text-neutral-700 mb-2">
                          <FaPhone className="text-primary-500" />
                          Phone Number *
                        </label>
                        <input
                          type="tel"
                          value={guestPhone}
                          onChange={(e) => setGuestPhone(e.target.value)}
                          placeholder="+1 (555) 000-0000"
                          className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                          required
                        />
                      </div>

                      <div>
                        <label className="text-sm font-semibold text-neutral-700 mb-2 block">
                          Special Requests (Optional)
                        </label>
                        <textarea
                          value={specialRequests}
                          onChange={(e) => setSpecialRequests(e.target.value)}
                          rows={4}
                          placeholder="Early check-in, specific floor, dietary requirements, etc."
                          className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all resize-none"
                        />
                      </div>

                      {/* Create Account Option */}
                      <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-6">
                        <div className="flex items-start gap-3">
                          <input
                            type="checkbox"
                            id="createAccount"
                            checked={createAccount}
                            onChange={(e) => setCreateAccount(e.target.checked)}
                            className="mt-1 w-5 h-5 text-primary-600 border-neutral-300 rounded focus:ring-primary-500"
                          />
                          <div className="flex-1">
                            <label htmlFor="createAccount" className="font-semibold text-neutral-900 cursor-pointer">
                              Create an account for faster future bookings
                            </label>
                            <p className="text-sm text-neutral-600 mt-1">
                              Save your information, track bookings, and get exclusive offers
                            </p>
                            {createAccount && (
                              <div className="mt-4">
                                <label className="text-sm font-semibold text-neutral-700 mb-2 block">
                                  Choose a Password *
                                </label>
                                <input
                                  type="password"
                                  value={accountPassword}
                                  onChange={(e) => setAccountPassword(e.target.value)}
                                  placeholder="Minimum 8 characters"
                                  className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                                  minLength={8}
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-8 flex justify-between">
                      <button
                        onClick={handlePrevStep}
                        className="flex items-center gap-2 text-neutral-600 hover:text-neutral-900 px-6 py-3 rounded-lg font-semibold transition-all"
                      >
                        <FaArrowLeft />
                        Back
                      </button>
                      <button
                        onClick={handleNextStep}
                        className="flex items-center gap-2 bg-primary-500 hover:bg-primary-600 text-white px-8 py-3 rounded-lg font-semibold transition-all shadow-lg hover:shadow-xl"
                      >
                        Review Booking
                        <FaArrowRight />
                      </button>
                    </div>
                  </motion.div>
                )}

                {/* Step 3: Confirmation */}
                {step === 3 && (
                  <motion.div
                    key="step3"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-white rounded-xl shadow-lg border border-neutral-200 p-8"
                  >
                    {bookingId ? (
                      <div className="text-center">
                        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                          <FaCheckCircle className="w-12 h-12 text-green-600" />
                        </div>
                        <h2 className="text-3xl font-bold text-neutral-900 mb-4">Booking Confirmed!</h2>
                        <p className="text-lg text-neutral-600 mb-6">
                          Your booking has been successfully created.
                        </p>

                        <div className="bg-primary-50 border border-primary-200 rounded-lg p-6 mb-8">
                          <p className="text-sm text-neutral-600 mb-2">Booking ID</p>
                          <p className="text-3xl font-bold text-primary-600 mb-4">#{bookingId}</p>
                          <p className="text-sm text-neutral-600">
                            A confirmation email has been sent to <strong>{guestEmail}</strong>
                          </p>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                          <button
                            onClick={() => router.push('/dashboard')}
                            className="bg-primary-500 hover:bg-primary-600 text-white px-8 py-3 rounded-lg font-semibold transition-all shadow-lg hover:shadow-xl"
                          >
                            View My Bookings
                          </button>
                          <button
                            onClick={() => router.push('/rooms')}
                            className="border-2 border-primary-500 text-primary-600 hover:bg-primary-50 px-8 py-3 rounded-lg font-semibold transition-all"
                          >
                            Book Another Room
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <h2 className="text-2xl font-bold text-neutral-900 mb-6">Review & Confirm</h2>

                        <div className="space-y-6">
                          <div className="border border-neutral-200 rounded-lg p-4">
                            <h3 className="font-semibold text-neutral-900 mb-3">Booking Details</h3>
                            <div className="space-y-2 text-sm">
                              <div className="flex justify-between">
                                <span className="text-neutral-600">Check-in:</span>
                                <span className="font-medium text-neutral-900">
                                  {new Date(checkIn).toLocaleDateString('en-US', {
                                    weekday: 'short', month: 'short', day: 'numeric', year: 'numeric'
                                  })}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-neutral-600">Check-out:</span>
                                <span className="font-medium text-neutral-900">
                                  {new Date(checkOut).toLocaleDateString('en-US', {
                                    weekday: 'short', month: 'short', day: 'numeric', year: 'numeric'
                                  })}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-neutral-600">Guests:</span>
                                <span className="font-medium text-neutral-900">{numberOfGuests}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-neutral-600">Nights:</span>
                                <span className="font-medium text-neutral-900">{calculateNights()}</span>
                              </div>
                            </div>
                          </div>

                          <div className="border border-neutral-200 rounded-lg p-4">
                            <h3 className="font-semibold text-neutral-900 mb-3">Guest Information</h3>
                            <div className="space-y-2 text-sm">
                              <div className="flex justify-between">
                                <span className="text-neutral-600">Name:</span>
                                <span className="font-medium text-neutral-900">{guestName}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-neutral-600">Email:</span>
                                <span className="font-medium text-neutral-900">{guestEmail}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-neutral-600">Phone:</span>
                                <span className="font-medium text-neutral-900">{guestPhone}</span>
                              </div>
                              {specialRequests && (
                                <div className="pt-2 border-t border-neutral-100">
                                  <p className="text-neutral-600 mb-1">Special Requests:</p>
                                  <p className="font-medium text-neutral-900">{specialRequests}</p>
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="bg-primary-50 border border-primary-200 rounded-lg p-6">
                            <div className="flex justify-between items-center">
                              <span className="text-lg font-semibold text-neutral-900">Total Amount</span>
                              <span className="text-3xl font-bold text-primary-600">${calculateTotal()}</span>
                            </div>
                          </div>
                        </div>

                        <div className="mt-8 flex justify-between">
                          <button
                            onClick={handlePrevStep}
                            disabled={submitting}
                            className="flex items-center gap-2 text-neutral-600 hover:text-neutral-900 px-6 py-3 rounded-lg font-semibold transition-all disabled:opacity-50"
                          >
                            <FaArrowLeft />
                            Back
                          </button>
                          <button
                            onClick={handleSubmitBooking}
                            disabled={submitting}
                            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-lg font-semibold transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {submitting ? (
                              <>
                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                Processing...
                              </>
                            ) : (
                              <>
                                <FaCheckCircle />
                                Confirm Booking
                              </>
                            )}
                          </button>
                        </div>
                      </>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Sidebar - Room Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl shadow-lg border border-neutral-200 p-6 sticky top-8">
                <h3 className="text-lg font-bold text-neutral-900 mb-4">Your Selection</h3>

                <div className="relative h-48 rounded-lg overflow-hidden mb-4">
                  <Image
                    src={
                      room.images?.[0]?.image_display ||
                      room.images?.[0]?.image_url ||
                      room.primary_image ||
                      'https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=600'
                    }
                    alt={room.name}
                    fill
                    className="object-cover"
                  />
                </div>

                <h4 className="text-xl font-bold text-neutral-900 mb-2">{room.name}</h4>
                <p className="text-sm text-neutral-600 mb-4">{room.room_type}</p>

                <div className="border-t border-neutral-200 pt-4 space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-neutral-600">Base Price</span>
                    <span className="font-medium text-neutral-900">${room.base_price_per_night}/night</span>
                  </div>
                  {checkIn && checkOut && (
                    <>
                      <div className="flex justify-between text-sm">
                        <span className="text-neutral-600">Nights</span>
                        <span className="font-medium text-neutral-900">{calculateNights()}</span>
                      </div>
                      <div className="border-t border-neutral-200 pt-3 flex justify-between">
                        <span className="font-semibold text-neutral-900">Total</span>
                        <span className="text-2xl font-bold text-primary-600">${calculateTotal()}</span>
                      </div>
                    </>
                  )}
                </div>

                {room.amenities && room.amenities.length > 0 && (
                  <div className="border-t border-neutral-200 mt-4 pt-4">
                    <h5 className="font-semibold text-neutral-900 mb-3 text-sm">Amenities</h5>
                    <div className="flex flex-wrap gap-2">
                      {room.amenities.slice(0, 6).map((amenity) => (
                        <span
                          key={amenity.id}
                          className="px-3 py-1 bg-neutral-100 text-neutral-700 text-xs rounded-full"
                        >
                          {amenity.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function BookingPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="inline-block animate-spin rounded-full h-16 w-16 border-b-4 border-primary-600"></div>
      </div>
    }>
      <BookingContent />
    </Suspense>
  );
}
