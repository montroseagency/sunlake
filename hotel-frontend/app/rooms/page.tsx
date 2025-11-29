'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import api from '@/lib/api';
import { RoomListItem } from '@/types/room';

export default function RoomsPage() {
  const [rooms, setRooms] = useState<RoomListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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
                    <Link
                      href={`/rooms/${room.slug}`}
                      className="bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-lg transition-colors"
                    >
                      View Details
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
