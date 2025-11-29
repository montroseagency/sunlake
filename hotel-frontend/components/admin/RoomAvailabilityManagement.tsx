'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';

interface Room {
  id: number;
  name: string;
  slug: string;
  room_type: string;
}

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

export default function RoomAvailabilityManagement() {
  const [availabilities, setAvailabilities] = useState<RoomAvailability[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRoom, setSelectedRoom] = useState<string>('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    room: '',
    start_date: '',
    end_date: '',
    status: 'BLOCKED',
    notes: '',
  });

  useEffect(() => {
    fetchRooms();
    fetchAvailabilities();
  }, []);

  useEffect(() => {
    fetchAvailabilities();
  }, [selectedRoom]);

  const fetchRooms = async () => {
    try {
      const response = await api.get('/rooms/');
      const data = response.data.results || response.data || [];
      setRooms(data);
    } catch (error) {
      console.error('Error fetching rooms:', error);
    }
  };

  const fetchAvailabilities = async () => {
    try {
      const params = selectedRoom ? { room: selectedRoom } : {};
      const response = await api.get('/room-availability/', { params });
      const data = response.data.results || response.data || [];
      setAvailabilities(data);
    } catch (error) {
      console.error('Error fetching availabilities:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await api.post('/room-availability/', formData);
      setShowAddForm(false);
      setFormData({
        room: '',
        start_date: '',
        end_date: '',
        status: 'BLOCKED',
        notes: '',
      });
      fetchAvailabilities();
      alert('Busy period added successfully!');
    } catch (error: any) {
      console.error('Error adding busy period:', error);
      const errorMsg = error.response?.data?.non_field_errors?.[0] ||
                      error.response?.data?.message ||
                      'Error adding busy period';
      alert(errorMsg);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this busy period?')) return;

    try {
      await api.delete(`/room-availability/${id}/`);
      fetchAvailabilities();
      alert('Busy period deleted successfully!');
    } catch (error) {
      console.error('Error deleting busy period:', error);
      alert('Error deleting busy period');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'BUSY':
        return 'bg-red-100 text-red-800';
      case 'MAINTENANCE':
        return 'bg-yellow-100 text-yellow-800';
      case 'BLOCKED':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading) return <div className="text-center py-8">Loading...</div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold text-neutral-900">Room Availability Management</h2>

        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-medium transition-colors"
        >
          {showAddForm ? 'Cancel' : 'Add Busy Period'}
        </button>
      </div>

      {/* Filter */}
      <div className="bg-white rounded-lg shadow p-4">
        <label className="block text-sm font-medium text-neutral-700 mb-2">
          Filter by Room
        </label>
        <select
          value={selectedRoom}
          onChange={(e) => setSelectedRoom(e.target.value)}
          className="w-full md:w-64 px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        >
          <option value="">All Rooms</option>
          {rooms.map((room) => (
            <option key={room.id} value={room.id}>
              {room.name}
            </option>
          ))}
        </select>
      </div>

      {/* Add Form */}
      {showAddForm && (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-xl font-bold mb-4">Add New Busy Period</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Room <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.room}
                onChange={(e) => setFormData({ ...formData, room: e.target.value })}
                required
                className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="">Select a room</option>
                {rooms.map((room) => (
                  <option key={room.id} value={room.id}>
                    {room.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Start Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  required
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  End Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                  required
                  min={formData.start_date || new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Status <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                required
                className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="BLOCKED">Blocked by Admin</option>
                <option value="MAINTENANCE">Under Maintenance</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Notes
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
                className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                placeholder="Optional notes about this busy period..."
              />
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                className="px-6 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-medium transition-colors"
              >
                Add Busy Period
              </button>
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-6 py-2 bg-neutral-200 hover:bg-neutral-300 text-neutral-700 rounded-lg font-medium transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Availabilities List */}
      {availabilities.length === 0 ? (
        <div className="text-center py-12 bg-neutral-50 rounded-lg">
          <p className="text-neutral-600">No busy periods found.</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-neutral-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Room
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Start Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    End Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Notes
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200">
                {availabilities.map((availability) => (
                  <tr key={availability.id} className="hover:bg-neutral-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-neutral-900">
                        {availability.room_name}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-neutral-900">
                        {formatDate(availability.start_date)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-neutral-900">
                        {formatDate(availability.end_date)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(availability.status)}`}>
                        {availability.status_display}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-neutral-600 max-w-xs truncate">
                        {availability.notes || '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {!availability.booking && (
                        <button
                          onClick={() => handleDelete(availability.id)}
                          className="text-red-600 hover:text-red-800 font-medium"
                        >
                          Delete
                        </button>
                      )}
                      {availability.booking && (
                        <span className="text-neutral-400 text-xs">
                          (Linked to booking)
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
