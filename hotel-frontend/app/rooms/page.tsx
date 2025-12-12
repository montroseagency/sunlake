'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import api from '@/lib/api';
import { RoomListItem, Room } from '@/types/room';

interface RoomAvailability {
  id: number;
  room: number;
  room_name: string;
  start_date: string;
  end_date: string;
  status: 'BUSY' | 'MAINTENANCE' | 'BLOCKED';
  status_display: string;
  notes: string;
  booking: number | null;
  created_at: string;
}

export default function RoomsPage() {
  const [rooms, setRooms] = useState<RoomListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [availabilityData, setAvailabilityData] = useState<RoomAvailability[]>([]);

  // Filters
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [capacity, setCapacity] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [roomType, setRoomType] = useState('');
  const [viewType, setViewType] = useState('');
  const [bedType, setBedType] = useState('');
  const [accessibilityFilter, setAccessibilityFilter] = useState(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  useEffect(() => {
    fetchRooms();
    fetchAvailability();
  }, [checkIn, checkOut, capacity, minPrice, maxPrice, roomType, viewType, bedType, accessibilityFilter]);

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

      // Request rooms with images included
      params.append('include_images', 'true');

      const response = await api.get(`/rooms/?${params.toString()}`);
      let fetchedRooms = response.data.results || response.data;

      // Client-side filtering for new fields (backend may not support these yet)
      if (viewType) {
        fetchedRooms = fetchedRooms.filter((room: any) => room.view_type === viewType);
      }
      if (bedType) {
        fetchedRooms = fetchedRooms.filter((room: any) => room.bed_configuration === bedType);
      }
      if (accessibilityFilter) {
        fetchedRooms = fetchedRooms.filter((room: any) => room.wheelchair_accessible === true);
      }

      setRooms(fetchedRooms);
    } catch (err) {
      console.error('Failed to fetch rooms:', err);
      setError('Failed to load rooms. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailability = async () => {
    try {
      const response = await api.get('/room-availability/');
      const data = response.data.results || response.data || [];
      setAvailabilityData(data);
    } catch (err) {
      console.error('Failed to fetch availability:', err);
    }
  };

  const getRoomAvailabilityStatus = (roomId: number) => {
    if (!checkIn || !checkOut) {
      return { status: 'unknown', text: 'Select dates to check availability' };
    }

    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);

    // Find overlapping availability periods for this room
    const overlaps = availabilityData.filter((period) => {
      if (period.room !== roomId) return false;

      const periodStart = new Date(period.start_date);
      const periodEnd = new Date(period.end_date);

      // Check if date ranges overlap
      return checkInDate <= periodEnd && checkOutDate >= periodStart;
    });

    if (overlaps.length === 0) {
      return { status: 'available', text: 'Available for your dates' };
    }

    // Find the next available date
    const busyPeriods = availabilityData
      .filter((p) => p.room === roomId)
      .sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime());

    const firstBusyPeriod = busyPeriods[0];
    if (firstBusyPeriod) {
      const endDate = new Date(firstBusyPeriod.end_date);
      const formattedDate = endDate.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });

      if (overlaps[0].status === 'MAINTENANCE') {
        return {
          status: 'maintenance',
          text: `Under maintenance until ${formattedDate}`,
        };
      }

      return {
        status: 'busy',
        text: `Busy until ${formattedDate}`,
      };
    }

    return { status: 'busy', text: 'Not available for selected dates' };
  };

  const clearAllFilters = () => {
    setCheckIn('');
    setCheckOut('');
    setCapacity('');
    setMinPrice('');
    setMaxPrice('');
    setRoomType('');
    setViewType('');
    setBedType('');
    setAccessibilityFilter(false);
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
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

          {/* Advanced Filters Toggle */}
          <button
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            className="text-primary-500 hover:text-primary-600 font-medium text-sm mb-4 flex items-center gap-2"
          >
            {showAdvancedFilters ? '− Hide Advanced Filters' : '+ Show Advanced Filters'}
          </button>

          {/* Advanced Filters */}
          {showAdvancedFilters && (
            <div className="border-t border-neutral-200 pt-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">View Type</label>
                  <select
                    value={viewType}
                    onChange={(e) => setViewType(e.target.value)}
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="">Any View</option>
                    <option value="CITY">City View</option>
                    <option value="SEA">Sea View</option>
                    <option value="GARDEN">Garden View</option>
                    <option value="MOUNTAIN">Mountain View</option>
                    <option value="POOL">Pool View</option>
                    <option value="COURTYARD">Courtyard View</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Bed Type</label>
                  <select
                    value={bedType}
                    onChange={(e) => setBedType(e.target.value)}
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="">Any Bed</option>
                    <option value="SINGLE">Single</option>
                    <option value="TWIN">Twin</option>
                    <option value="DOUBLE">Double</option>
                    <option value="QUEEN">Queen</option>
                    <option value="KING">King</option>
                  </select>
                </div>
                <div className="flex items-end">
                  <label className="flex items-center h-[42px]">
                    <input
                      type="checkbox"
                      checked={accessibilityFilter}
                      onChange={(e) => setAccessibilityFilter(e.target.checked)}
                      className="mr-2 h-4 w-4 text-primary-500 border-neutral-300 rounded focus:ring-primary-500"
                    />
                    <span className="text-sm font-medium text-neutral-700">Wheelchair Accessible Only</span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Clear Filters */}
          {(checkIn || checkOut || capacity || minPrice || maxPrice || roomType || viewType || bedType || accessibilityFilter) && (
            <div className="border-t border-neutral-200 pt-4 mt-4">
              <button
                onClick={clearAllFilters}
                className="text-sm text-neutral-600 hover:text-neutral-800 underline"
              >
                Clear all filters
              </button>
            </div>
          )}
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
              onClick={clearAllFilters}
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
                    src={
                      (room as any).images?.[0]?.image_display ||
                      (room as any).images?.[0]?.image_url ||
                      room.primary_image ||
                      'https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=800'
                    }
                    alt={room.name}
                    fill
                    className="object-cover"
                  />
                  {/* Availability Badge */}
                  {(() => {
                    const availability = getRoomAvailabilityStatus(room.id);
                    const badgeColors = {
                      available: 'bg-green-500 text-white',
                      busy: 'bg-red-500 text-white',
                      maintenance: 'bg-yellow-500 text-white',
                      unknown: 'bg-neutral-500 text-white',
                    };
                    const icon = {
                      available: '✓',
                      busy: '✗',
                      maintenance: '⏰',
                      unknown: '?',
                    };
                    return (
                      <div className={`absolute top-3 right-3 px-3 py-1.5 rounded-lg ${badgeColors[availability.status as keyof typeof badgeColors]} shadow-lg text-sm font-medium flex items-center gap-1`}>
                        <span>{icon[availability.status as keyof typeof icon]}</span>
                        <span className="hidden sm:inline">{availability.status === 'available' ? 'Available' : availability.status === 'busy' ? 'Busy' : availability.status === 'maintenance' ? 'Maintenance' : 'Select Dates'}</span>
                      </div>
                    );
                  })()}
                </div>

                <div className="p-6">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-xl font-semibold">{room.name}</h3>
                    <span className="text-sm bg-primary-100 text-primary-700 px-2 py-1 rounded">
                      {room.room_type}
                    </span>
                  </div>

                  {/* Availability Details */}
                  {(() => {
                    const availability = getRoomAvailabilityStatus(room.id);
                    if (availability.status === 'unknown') {
                      return null; // Don't show details if dates not selected
                    }

                    const textColors = {
                      available: 'text-green-600',
                      busy: 'text-red-600',
                      maintenance: 'text-yellow-600',
                      unknown: 'text-neutral-500',
                    };

                    return (
                      <p className={`text-sm font-medium mb-3 ${textColors[availability.status]}`}>
                        {availability.text}
                      </p>
                    );
                  })()}

                  {/* Bed and Capacity Info */}
                  <div className="mb-3">
                    <p className="text-neutral-600 text-sm">
                      {room.bed_configuration && `${room.bed_configuration} Bed`}
                      {room.bed_configuration && room.max_occupancy && ' • '}
                      Up to {room.max_occupancy || room.capacity} guest{(room.max_occupancy || room.capacity) > 1 ? 's' : ''}
                    </p>
                    {room.view_type && room.view_type !== 'NO_VIEW' && (
                      <p className="text-xs text-neutral-500 mt-1">
                        {room.view_type.replace('_', ' ')} View
                      </p>
                    )}
                  </div>

                  {/* Quick Features */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {room.wifi && <span className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded">WiFi</span>}
                    {room.air_conditioning && <span className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded">A/C</span>}
                    {room.wheelchair_accessible && <span className="text-xs bg-green-50 text-green-700 px-2 py-1 rounded">♿ Accessible</span>}
                    {room.amenities.slice(0, 2).map((amenity) => (
                      <span key={amenity.id} className="text-xs bg-neutral-100 text-neutral-700 px-2 py-1 rounded">
                        {amenity.name}
                      </span>
                    ))}
                    {room.amenities.length > 2 && (
                      <span className="text-xs text-neutral-500">+{room.amenities.length - 2} more</span>
                    )}
                  </div>

                  <div className="flex justify-between items-center">
                    <div>
                      <span className="text-2xl font-bold text-primary-500">${room.base_price_per_night}</span>
                      <span className="text-neutral-600"> / night</span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => fetchRoomDetails(room.slug)}
                        className="border-2 border-primary-500 text-primary-600 hover:bg-primary-50 px-4 py-2 rounded-lg transition-colors font-medium"
                      >
                        Details
                      </button>
                      <Link
                        href={`/booking?room=${room.slug}`}
                        className="bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-lg transition-colors font-medium"
                      >
                        Book Now
                      </Link>
                    </div>
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
                          <span className="text-neutral-600">Max Occupancy</span>
                          <span className="font-semibold text-neutral-900">{selectedRoom.max_occupancy || selectedRoom.capacity} Guest{(selectedRoom.max_occupancy || selectedRoom.capacity) > 1 ? 's' : ''}</span>
                        </div>
                        {selectedRoom.bed_configuration && (
                          <div className="flex justify-between items-center">
                            <span className="text-neutral-600">Bed Configuration</span>
                            <span className="font-semibold text-neutral-900">
                              {selectedRoom.number_of_beds || 1} {selectedRoom.bed_configuration_display || selectedRoom.bed_configuration} {(selectedRoom.number_of_beds || 1) > 1 ? 'Beds' : 'Bed'}
                            </span>
                          </div>
                        )}
                        {selectedRoom.size_sqm && (
                          <div className="flex justify-between items-center">
                            <span className="text-neutral-600">Room Size</span>
                            <span className="font-semibold text-neutral-900">{selectedRoom.size_sqm} m²</span>
                          </div>
                        )}
                        {selectedRoom.view_type && selectedRoom.view_type !== 'NO_VIEW' && (
                          <div className="flex justify-between items-center">
                            <span className="text-neutral-600">View</span>
                            <span className="font-semibold text-neutral-900">{selectedRoom.view_type_display || selectedRoom.view_type.replace('_', ' ')}</span>
                          </div>
                        )}
                        {selectedRoom.check_in_time && selectedRoom.check_out_time && (
                          <div className="flex justify-between items-center">
                            <span className="text-neutral-600">Check-in / Check-out</span>
                            <span className="font-semibold text-neutral-900">{selectedRoom.check_in_time} / {selectedRoom.check_out_time}</span>
                          </div>
                        )}
                      </div>

                      {/* Description */}
                      <div className="mb-6 pb-6 border-b border-neutral-200">
                        <h3 className="font-semibold text-neutral-900 mb-2">About This Room</h3>
                        <p className="text-neutral-700 text-sm leading-relaxed">
                          {selectedRoom.description}
                        </p>
                      </div>

                      {/* In-Room Features */}
                      {(selectedRoom.wifi || selectedRoom.air_conditioning || selectedRoom.tv || selectedRoom.safe || selectedRoom.minibar) && (
                        <div className="mb-6 pb-6 border-b border-neutral-200">
                          <h3 className="font-semibold text-neutral-900 mb-3">Room Features</h3>
                          <div className="grid grid-cols-2 gap-2">
                            {selectedRoom.wifi && (
                              <div className="flex items-center gap-2 text-sm text-neutral-700">
                                <svg className="w-4 h-4 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                <span>WiFi</span>
                              </div>
                            )}
                            {selectedRoom.air_conditioning && (
                              <div className="flex items-center gap-2 text-sm text-neutral-700">
                                <svg className="w-4 h-4 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                <span>Air Conditioning</span>
                              </div>
                            )}
                            {selectedRoom.tv && (
                              <div className="flex items-center gap-2 text-sm text-neutral-700">
                                <svg className="w-4 h-4 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                <span>TV</span>
                              </div>
                            )}
                            {selectedRoom.telephone && (
                              <div className="flex items-center gap-2 text-sm text-neutral-700">
                                <svg className="w-4 h-4 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                <span>Telephone</span>
                              </div>
                            )}
                            {selectedRoom.safe && (
                              <div className="flex items-center gap-2 text-sm text-neutral-700">
                                <svg className="w-4 h-4 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                <span>Safe</span>
                              </div>
                            )}
                            {selectedRoom.minibar && (
                              <div className="flex items-center gap-2 text-sm text-neutral-700">
                                <svg className="w-4 h-4 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                <span>Minibar</span>
                              </div>
                            )}
                            {selectedRoom.coffee_maker && (
                              <div className="flex items-center gap-2 text-sm text-neutral-700">
                                <svg className="w-4 h-4 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                <span>Coffee Maker</span>
                              </div>
                            )}
                            {selectedRoom.hairdryer && (
                              <div className="flex items-center gap-2 text-sm text-neutral-700">
                                <svg className="w-4 h-4 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                <span>Hairdryer</span>
                              </div>
                            )}
                            {selectedRoom.bathrobe_slippers && (
                              <div className="flex items-center gap-2 text-sm text-neutral-700">
                                <svg className="w-4 h-4 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                <span>Bathrobe & Slippers</span>
                              </div>
                            )}
                            {selectedRoom.iron_ironing_board && (
                              <div className="flex items-center gap-2 text-sm text-neutral-700">
                                <svg className="w-4 h-4 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                <span>Iron & Ironing Board</span>
                              </div>
                            )}
                            {selectedRoom.has_balcony && (
                              <div className="flex items-center gap-2 text-sm text-neutral-700">
                                <svg className="w-4 h-4 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                <span>Balcony</span>
                              </div>
                            )}
                            {selectedRoom.soundproof && (
                              <div className="flex items-center gap-2 text-sm text-neutral-700">
                                <svg className="w-4 h-4 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                <span>Soundproof</span>
                              </div>
                            )}
                            {selectedRoom.has_kitchenette && (
                              <div className="flex items-center gap-2 text-sm text-neutral-700">
                                <svg className="w-4 h-4 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                <span>Kitchenette</span>
                              </div>
                            )}
                            {selectedRoom.has_seating_area && (
                              <div className="flex items-center gap-2 text-sm text-neutral-700">
                                <svg className="w-4 h-4 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                <span>Seating Area</span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Bathroom Features */}
                      {selectedRoom.bathroom_features && (
                        <div className="mb-6 pb-6 border-b border-neutral-200">
                          <h3 className="font-semibold text-neutral-900 mb-3">Bathroom</h3>
                          <div className="space-y-1">
                            {selectedRoom.bathroom_features.split('\n').filter(f => f.trim()).map((feature, idx) => (
                              <div key={idx} className="flex items-center gap-2 text-sm text-neutral-700">
                                <svg className="w-4 h-4 text-primary-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                <span>{feature.trim()}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Accessibility */}
                      {(selectedRoom.wheelchair_accessible || selectedRoom.accessible_bathroom) && (
                        <div className="mb-6 pb-6 border-b border-neutral-200">
                          <h3 className="font-semibold text-neutral-900 mb-3">Accessibility</h3>
                          <div className="space-y-2">
                            {selectedRoom.wheelchair_accessible && (
                              <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 px-3 py-2 rounded">
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" /></svg>
                                <span className="font-medium">Wheelchair Accessible</span>
                              </div>
                            )}
                            {selectedRoom.accessible_bathroom && (
                              <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 px-3 py-2 rounded">
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" /></svg>
                                <span className="font-medium">Accessible Bathroom</span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Room Policies */}
                      {(selectedRoom.smoking_policy || selectedRoom.pet_policy) && (
                        <div className="mb-6 pb-6 border-b border-neutral-200">
                          <h3 className="font-semibold text-neutral-900 mb-3">Room Policies</h3>
                          <div className="space-y-2 text-sm text-neutral-700">
                            {selectedRoom.smoking_policy && (
                              <div className="flex items-center gap-2">
                                <svg className="w-4 h-4 text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                <span>Smoking: {selectedRoom.smoking_policy_display || selectedRoom.smoking_policy.replace('_', ' ')}</span>
                              </div>
                            )}
                            {selectedRoom.pet_policy && (
                              <div className="flex items-center gap-2">
                                <svg className="w-4 h-4 text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                <span>Pets: {selectedRoom.pet_policy_display || selectedRoom.pet_policy.replace('_', ' ')}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Special Perks */}
                      {selectedRoom.special_perks && (
                        <div className="mb-6 pb-6 border-b border-neutral-200">
                          <h3 className="font-semibold text-neutral-900 mb-3">Special Perks</h3>
                          <div className="space-y-1">
                            {selectedRoom.special_perks.split('\n').filter(p => p.trim()).map((perk, idx) => (
                              <div key={idx} className="flex items-center gap-2 text-sm text-primary-700">
                                <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                                <span>{perk.trim()}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Virtual Tour */}
                      {selectedRoom.virtual_tour_url && (
                        <div className="mb-6 pb-6 border-b border-neutral-200">
                          <a
                            href={selectedRoom.virtual_tour_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-primary-500 hover:text-primary-600 font-medium"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                            <span>Take Virtual Tour</span>
                          </a>
                        </div>
                      )}

                      {/* Legacy Amenities */}
                      {selectedRoom.amenities && selectedRoom.amenities.length > 0 && (
                        <div className="mb-6">
                          <h3 className="font-semibold text-neutral-900 mb-3">Additional Amenities</h3>
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
