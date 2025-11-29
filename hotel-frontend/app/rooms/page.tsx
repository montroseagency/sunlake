'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import api from '@/lib/api';
import { RoomListItem, Room } from '@/types/room';

export default function RoomsPage() {
  const [rooms, setRooms] = useState<RoomListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // Filters
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [capacity, setCapacity] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [roomType, setRoomType] = useState('');

  useEffect(() => {
    fetchRooms();
  }, [checkIn, checkOut, capacity, minPrice, maxPrice, roomType]);

  const fetchRooms = async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (checkIn) params.append('check_in', checkIn);
      if (checkOut) params.append('check_out', checkOut);
      if (capacity) params.append('capacity', capacity);
      if (minPrice) params.append('min_price', minPrice);
      if (maxPrice) params.append('max_price', maxPrice);
      if (roomType) params.append('room_type', roomType);

      const response = await api.get(`/rooms/?${params.toString()}`);
      setRooms(response.data.results || response.data);
    } catch (err) {
      console.error('Failed to fetch rooms:', err);
      setError('Failed to load rooms. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchRoomDetails = async (slug: string) => {
    setLoadingDetails(true);
    try {
      const response = await api.get(`/rooms/${slug}/`);
      setSelectedRoom(response.data);
      setCurrentImageIndex(0);
    } catch (err) {
      console.error('Failed to fetch room details:', err);
      alert('Failed to load room details');
    } finally {
      setLoadingDetails(false);
    }
  };

  const closeModal = () => {
    setSelectedRoom(null);
    setCurrentImageIndex(0);
  };

  const nextImage = () => {
    if (selectedRoom && selectedRoom.images.length > 0) {
      setCurrentImageIndex((prev) => (prev + 1) % selectedRoom.images.length);
    }
  };

  const prevImage = () => {
    if (selectedRoom && selectedRoom.images.length > 0) {
      setCurrentImageIndex((prev) => (prev - 1 + selectedRoom.images.length) % selectedRoom.images.length);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-display font-bold mb-8">Our Rooms</h1>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">Check-in</label>
              <input
                type="date"
                value={checkIn}
                onChange={(e) => setCheckIn(e.target.value)}
                className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">Check-out</label>
              <input
                type="date"
                value={checkOut}
                onChange={(e) => setCheckOut(e.target.value)}
                className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">Guests</label>
              <input
                type="number"
                min="1"
                value={capacity}
                onChange={(e) => setCapacity(e.target.value)}
                placeholder="1"
                className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">Room Type</label>
              <select
                value={roomType}
                onChange={(e) => setRoomType(e.target.value)}
                className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              >
                <option value="">All Types</option>
                <option value="STANDARD">Standard</option>
                <option value="DELUXE">Deluxe</option>
                <option value="SUITE">Suite</option>
                <option value="PENTHOUSE">Penthouse</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">Min Price</label>
              <input
                type="number"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                placeholder="0"
                className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">Max Price</label>
              <input
                type="number"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                placeholder="1000"
                className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-error text-white p-4 rounded-lg mb-8">
            {error}
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
            <p className="mt-4 text-neutral-600">Loading rooms...</p>
          </div>
        )}

        {/* No Results */}
        {!loading && rooms.length === 0 && (
          <div className="text-center py-12">
            <p className="text-lg text-neutral-600">No rooms found matching your criteria.</p>
            <button
              onClick={() => {
                setCheckIn('');
                setCheckOut('');
                setCapacity('');
                setMinPrice('');
                setMaxPrice('');
                setRoomType('');
              }}
              className="mt-4 text-primary-500 hover:underline"
            >
              Clear filters
            </button>
          </div>
        )}

        {/* Rooms Grid */}
        {!loading && rooms.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {rooms.map((room) => (
              <div key={room.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow">
                <div className="relative h-64">
                  <Image
                    src={room.primary_image || 'https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=800'}
                    alt={room.name}
                    fill
                    className="object-cover"
                  />
                </div>

                <div className="p-6">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-xl font-semibold">{room.name}</h3>
                    <span className="text-sm bg-primary-100 text-primary-700 px-2 py-1 rounded">
                      {room.room_type}
                    </span>
                  </div>

                  <p className="text-neutral-600 mb-4">
                    Up to {room.capacity} guest{room.capacity > 1 ? 's' : ''}
                  </p>

                  <div className="flex flex-wrap gap-2 mb-4">
                    {room.amenities.slice(0, 3).map((amenity) => (
                      <span key={amenity.id} className="text-xs bg-neutral-100 text-neutral-700 px-2 py-1 rounded">
                        {amenity.name}
                      </span>
                    ))}
                    {room.amenities.length > 3 && (
                      <span className="text-xs text-neutral-500">+{room.amenities.length - 3} more</span>
                    )}
                  </div>

                  <div className="flex justify-between items-center">
                    <div>
                      <span className="text-2xl font-bold text-primary-500">${room.base_price_per_night}</span>
                      <span className="text-neutral-600"> / night</span>
                    </div>
                    <button
                      onClick={() => fetchRoomDetails(room.slug)}
                      className="bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-lg transition-colors"
                    >
                      View Details
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Room Detail Modal - Professional Car Listing Style */}
      {selectedRoom && (
        <div className="fixed inset-0 bg-neutral-100 z-50 overflow-y-auto" onClick={closeModal}>
          <div className="min-h-screen flex items-center justify-center p-4 md:p-8">
            <div className="bg-white max-w-7xl w-full rounded-xl shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
              {loadingDetails ? (
                <div className="text-center py-12">
                  <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
                </div>
              ) : (
                <div className="flex flex-col lg:flex-row gap-0">
                  {/* Left Side - Image Gallery */}
                  <div className="lg:w-2/3 bg-white">
                    {/* Close Button - Top Right */}
                    <div className="absolute top-4 right-4 z-20">
                      <button
                        onClick={closeModal}
                        className="w-10 h-10 bg-white hover:bg-neutral-100 rounded-full flex items-center justify-center shadow-lg transition-colors"
                      >
                        <svg className="w-5 h-5 text-neutral-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>

                    {selectedRoom.images && selectedRoom.images.length > 0 ? (
                      <div className="p-4 md:p-8">
                        {/* Main Image with Dark Side Panels */}
                        <div className="relative bg-neutral-900 rounded-lg overflow-hidden">
                          <div className="relative aspect-[4/3]">
                            {/* Main Image */}
                            <img
                              src={selectedRoom.images[currentImageIndex].image_display || selectedRoom.images[currentImageIndex].image_url}
                              alt={selectedRoom.images[currentImageIndex].alt_text || selectedRoom.name}
                              className="w-full h-full object-cover"
                            />

                            {/* Dark Side Panels with Arrows */}
                            {selectedRoom.images.length > 1 && (
                              <>
                                {/* Left Dark Panel */}
                                <div className="absolute left-0 top-0 bottom-0 w-16 md:w-24 bg-gradient-to-r from-black/40 to-transparent flex items-center justify-center">
                                  <button
                                    onClick={prevImage}
                                    className="w-10 h-10 rounded-full bg-white/90 hover:bg-white flex items-center justify-center transition-all hover:scale-110 shadow-lg"
                                    aria-label="Previous image"
                                  >
                                    <svg className="w-5 h-5 text-neutral-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                                    </svg>
                                  </button>
                                </div>

                                {/* Right Dark Panel */}
                                <div className="absolute right-0 top-0 bottom-0 w-16 md:w-24 bg-gradient-to-l from-black/40 to-transparent flex items-center justify-center">
                                  <button
                                    onClick={nextImage}
                                    className="w-10 h-10 rounded-full bg-white/90 hover:bg-white flex items-center justify-center transition-all hover:scale-110 shadow-lg"
                                    aria-label="Next image"
                                  >
                                    <svg className="w-5 h-5 text-neutral-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                                    </svg>
                                  </button>
                                </div>
                              </>
                            )}
                          </div>

                          {/* Thumbnail Strip Below Main Image */}
                          {selectedRoom.images.length > 1 && (
                            <div className="bg-neutral-900 p-3 border-t border-neutral-800">
                              <div className="flex gap-2 overflow-x-auto">
                                {selectedRoom.images.map((image, index) => (
                                  <button
                                    key={image.id}
                                    onClick={() => setCurrentImageIndex(index)}
                                    className={`flex-shrink-0 w-16 h-12 md:w-20 md:h-16 rounded overflow-hidden transition-all ${
                                      currentImageIndex === index
                                        ? 'ring-2 ring-primary-500 opacity-100 scale-105'
                                        : 'opacity-50 hover:opacity-100'
                                    }`}
                                  >
                                    <img
                                      src={image.image_display || image.image_url}
                                      alt={`View ${index + 1}`}
                                      className="w-full h-full object-cover"
                                    />
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Image Counter */}
                        <div className="text-center mt-3 text-sm text-neutral-500">
                          Photo {currentImageIndex + 1} of {selectedRoom.images.length}
                        </div>
                      </div>
                    ) : (
                      <div className="p-8 flex items-center justify-center h-96">
                        <div className="text-center text-neutral-400">
                          <svg className="w-16 h-16 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <p>No images available</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Right Side - Info Card */}
                  <div className="lg:w-1/3 bg-neutral-50 border-t lg:border-t-0 lg:border-l border-neutral-200">
                    <div className="p-6 md:p-8 lg:sticky lg:top-0">
                      {/* Room Type Badge */}
                      <div className="text-xs font-semibold text-primary-600 uppercase tracking-wider mb-2">
                        {selectedRoom.room_type.replace('_', ' ')}
                      </div>

                      {/* Room Name */}
                      <h2 className="text-2xl md:text-3xl font-bold text-neutral-900 mb-4">
                        {selectedRoom.name}
                      </h2>

                      {/* Price */}
                      <div className="mb-6 pb-6 border-b border-neutral-200">
                        <div className="flex items-baseline gap-2">
                          <span className="text-3xl md:text-4xl font-bold text-neutral-900">
                            ${selectedRoom.base_price_per_night}
                          </span>
                          <span className="text-neutral-600">per night</span>
                        </div>
                      </div>

                      {/* Availability Status */}
                      <div className="mb-6 pb-6 border-b border-neutral-200">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-neutral-700">Current Status</span>
                          {selectedRoom.is_currently_available ? (
                            <span className="flex items-center gap-2 px-3 py-1.5 bg-green-100 text-green-800 rounded-full text-sm font-semibold">
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                              </svg>
                              Available
                            </span>
                          ) : (
                            <span className="flex items-center gap-2 px-3 py-1.5 bg-red-100 text-red-800 rounded-full text-sm font-semibold">
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                              </svg>
                              Busy
                            </span>
                          )}
                        </div>

                        {/* Upcoming Busy Periods */}
                        {selectedRoom.availability_periods && selectedRoom.availability_periods.length > 0 && (
                          <div className="mt-4">
                            <p className="text-sm font-medium text-neutral-700 mb-2">Upcoming Busy Periods:</p>
                            <div className="space-y-2 max-h-40 overflow-y-auto">
                              {selectedRoom.availability_periods.map((period: any) => (
                                <div
                                  key={period.id}
                                  className="flex items-center justify-between p-2 bg-neutral-100 rounded text-xs"
                                >
                                  <div>
                                    <span className="font-medium">
                                      {new Date(period.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                    </span>
                                    <span className="mx-1">-</span>
                                    <span className="font-medium">
                                      {new Date(period.end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                    </span>
                                  </div>
                                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                    period.status === 'BUSY' ? 'bg-red-200 text-red-800' :
                                    period.status === 'MAINTENANCE' ? 'bg-yellow-200 text-yellow-800' :
                                    'bg-gray-200 text-gray-800'
                                  }`}>
                                    {period.status_display}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Details */}
                      <div className="space-y-4 mb-6 pb-6 border-b border-neutral-200">
                        <div className="flex justify-between items-center">
                          <span className="text-neutral-600">Capacity</span>
                          <span className="font-semibold text-neutral-900">{selectedRoom.capacity} Guest{selectedRoom.capacity > 1 ? 's' : ''}</span>
                        </div>
                        {selectedRoom.size_sqm && (
                          <div className="flex justify-between items-center">
                            <span className="text-neutral-600">Room Size</span>
                            <span className="font-semibold text-neutral-900">{selectedRoom.size_sqm} m²</span>
                          </div>
                        )}
                      </div>

                      {/* Description */}
                      <div className="mb-6">
                        <p className="text-neutral-700 text-sm leading-relaxed">
                          {selectedRoom.description}
                        </p>
                      </div>

                      {/* Amenities */}
                      {selectedRoom.amenities && selectedRoom.amenities.length > 0 && (
                        <div className="mb-6">
                          <h3 className="font-semibold text-neutral-900 mb-3">Amenities</h3>
                          <div className="space-y-2">
                            {selectedRoom.amenities.map((amenity) => (
                              <div key={amenity.id} className="flex items-center gap-2 text-sm text-neutral-700">
                                <svg className="w-4 h-4 text-primary-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                <span>{amenity.name}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div className="space-y-3 pt-4">
                        <Link
                          href={`/booking?room=${selectedRoom.slug}`}
                          className="block w-full bg-primary-500 hover:bg-primary-600 text-white px-6 py-4 rounded-lg font-semibold text-center transition-colors shadow-sm"
                        >
                          Reserve This Room
                        </Link>
                        <button
                          onClick={closeModal}
                          className="block w-full bg-white hover:bg-neutral-50 text-neutral-700 px-6 py-3 rounded-lg font-medium text-center transition-colors border border-neutral-300"
                        >
                          Continue Browsing
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
