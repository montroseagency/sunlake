'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';

interface Booking {
  id: number;
  room: {
    id: number;
    name: string;
    slug: string;
    room_type: string;
  };
  check_in_date: string;
  check_out_date: string;
  guest_name: string;
  guest_email: string;
  guest_phone: string;
  number_of_guests: number;
  special_requests: string;
  total_price: string;
  status: string;
  nights: number;
  created_at: string;
}

interface Props {
  onUpdate: () => void;
}

const STATUS_OPTIONS = [
  { value: 'PENDING', label: 'Pending', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'CONFIRMED', label: 'Confirmed', color: 'bg-green-100 text-green-800' },
  { value: 'CANCELLED', label: 'Cancelled', color: 'bg-red-100 text-red-800' },
  { value: 'CHECKED_IN', label: 'Checked In', color: 'bg-blue-100 text-blue-800' },
  { value: 'CHECKED_OUT', label: 'Checked Out', color: 'bg-gray-100 text-gray-800' },
];

export default function BookingsManagement({ onUpdate }: Props) {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [expandedBooking, setExpandedBooking] = useState<number | null>(null);

  useEffect(() => {
    fetchBookings();
  }, [filterStatus]);

  const fetchBookings = async () => {
    try {
      const params = filterStatus ? { status: filterStatus } : {};
      const response = await api.get('/bookings/', { params });
      const data = response.data.results || response.data || [];
      setBookings(data);
    } catch (error) {
      console.error('Error fetching bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (bookingId: number, newStatus: string) => {
    try {
      await api.patch(`/bookings/${bookingId}/update_status/`, { status: newStatus });
      fetchBookings();
      onUpdate();
      alert('Booking status updated successfully!');
    } catch (error: any) {
      console.error('Error updating status:', error);
      alert(error.response?.data?.detail || 'Error updating booking status');
    }
  };

  const handleDelete = async (bookingId: number) => {
    if (!confirm('Are you sure you want to delete this booking?')) return;

    try {
      await api.delete(`/bookings/${bookingId}/`);
      fetchBookings();
      onUpdate();
      alert('Booking deleted successfully!');
    } catch (error) {
      console.error('Error deleting booking:', error);
      alert('Error deleting booking');
    }
  };

  const toggleExpanded = (bookingId: number) => {
    setExpandedBooking(expandedBooking === bookingId ? null : bookingId);
  };

  const getStatusColor = (status: string) => {
    return STATUS_OPTIONS.find((s) => s.value === status)?.color || 'bg-gray-100 text-gray-800';
  };

  const getStatusLabel = (status: string) => {
    return STATUS_OPTIONS.find((s) => s.value === status)?.label || status;
  };

  if (loading) return <div className="text-center py-8">Loading bookings...</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-neutral-900">Bookings Management</h2>
          <p className="text-sm text-neutral-600 mt-1">
            View and manage all customer reservations
          </p>
        </div>
      </div>

      <div className="mb-6 flex gap-4">
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            Filter by Status
          </label>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-64 px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
          >
            <option value="">All Statuses</option>
            {STATUS_OPTIONS.map((status) => (
              <option key={status.value} value={status.value}>
                {status.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-neutral-200">
            <thead className="bg-neutral-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Booking ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Guest
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Room
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Check-in
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Check-out
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Total
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-neutral-200">
              {bookings.map((booking) => (
                <>
                  <tr key={booking.id} className="hover:bg-neutral-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-neutral-900">
                      #{booking.id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-neutral-900">{booking.guest_name}</div>
                      <div className="text-sm text-neutral-500">{booking.guest_email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-neutral-900">{booking.room.name}</div>
                      <div className="text-sm text-neutral-500">{booking.room.room_type}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500">
                      {new Date(booking.check_in_date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500">
                      {new Date(booking.check_out_date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-neutral-900">
                      ${booking.total_price}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <select
                        value={booking.status}
                        onChange={(e) => handleUpdateStatus(booking.id, e.target.value)}
                        className={`px-2 py-1 text-xs rounded ${getStatusColor(booking.status)}`}
                      >
                        {STATUS_OPTIONS.map((status) => (
                          <option key={status.value} value={status.value}>
                            {status.label}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button
                        onClick={() => toggleExpanded(booking.id)}
                        className="text-primary-600 hover:text-primary-900 mr-3"
                      >
                        {expandedBooking === booking.id ? 'Hide' : 'Details'}
                      </button>
                      <button
                        onClick={() => handleDelete(booking.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                  {expandedBooking === booking.id && (
                    <tr>
                      <td colSpan={8} className="px-6 py-4 bg-neutral-50">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <h4 className="font-semibold text-neutral-900 mb-2">Guest Information</h4>
                            <p className="text-sm text-neutral-700">
                              <strong>Name:</strong> {booking.guest_name}
                            </p>
                            <p className="text-sm text-neutral-700">
                              <strong>Email:</strong> {booking.guest_email}
                            </p>
                            <p className="text-sm text-neutral-700">
                              <strong>Phone:</strong> {booking.guest_phone}
                            </p>
                            <p className="text-sm text-neutral-700">
                              <strong>Number of Guests:</strong> {booking.number_of_guests}
                            </p>
                          </div>
                          <div>
                            <h4 className="font-semibold text-neutral-900 mb-2">Booking Details</h4>
                            <p className="text-sm text-neutral-700">
                              <strong>Nights:</strong> {booking.nights}
                            </p>
                            <p className="text-sm text-neutral-700">
                              <strong>Total Price:</strong> ${booking.total_price}
                            </p>
                            <p className="text-sm text-neutral-700">
                              <strong>Created:</strong>{' '}
                              {new Date(booking.created_at).toLocaleString()}
                            </p>
                            {booking.special_requests && (
                              <p className="text-sm text-neutral-700 mt-2">
                                <strong>Special Requests:</strong> {booking.special_requests}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {bookings.length === 0 && (
        <div className="text-center py-12 text-neutral-500">
          No bookings found.
        </div>
      )}
    </div>
  );
}
