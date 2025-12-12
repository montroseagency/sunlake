'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import ImageUploadDnD, { ImageItem } from './ImageUploadDnD';
import ImageReorder from './ImageReorder';

interface Room {
  id: number;
  name: string;
  slug: string;
  description: string;
  room_type: string;
  capacity: number;
  size_sqm: string;
  base_price_per_night: string;
  images: RoomImage[];
  amenities: Amenity[];
  is_active: boolean;
  // New fields
  max_occupancy?: number;
  bed_configuration?: string;
  number_of_beds?: number;
  wifi?: boolean;
  air_conditioning?: boolean;
  tv?: boolean;
  telephone?: boolean;
  safe?: boolean;
  minibar?: boolean;
  coffee_maker?: boolean;
  bathrobe_slippers?: boolean;
  hairdryer?: boolean;
  iron_ironing_board?: boolean;
  view_type?: string;
  has_balcony?: boolean;
  soundproof?: boolean;
  special_perks?: string;
  bathroom_features?: string;
  wheelchair_accessible?: boolean;
  accessible_bathroom?: boolean;
  check_in_time?: string;
  check_out_time?: string;
  smoking_policy?: string;
  pet_policy?: string;
  has_kitchenette?: boolean;
  has_seating_area?: boolean;
  virtual_tour_url?: string;
}

interface RoomImage {
  id: number;
  image_url: string;
  image_display: string;
  alt_text: string;
  is_primary: boolean;
  order: number;
}

interface Amenity {
  id: number;
  name: string;
  icon: string;
}

interface Props {
  onUpdate: () => void;
}

export default function RoomsManagement({ onUpdate }: Props) {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [amenities, setAmenities] = useState<Amenity[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    room_type: 'STANDARD',
    capacity: 2,
    size_sqm: '',
    base_price_per_night: '',
    amenities: [] as number[],
    is_active: true,
    // New fields
    max_occupancy: 2,
    bed_configuration: 'QUEEN',
    number_of_beds: 1,
    wifi: true,
    air_conditioning: true,
    tv: true,
    telephone: true,
    safe: false,
    minibar: false,
    coffee_maker: false,
    bathrobe_slippers: false,
    hairdryer: true,
    iron_ironing_board: false,
    view_type: 'NO_VIEW',
    has_balcony: false,
    soundproof: false,
    special_perks: '',
    bathroom_features: '',
    wheelchair_accessible: false,
    accessible_bathroom: false,
    check_in_time: '14:00',
    check_out_time: '11:00',
    smoking_policy: 'NON_SMOKING',
    pet_policy: 'NOT_ALLOWED',
    has_kitchenette: false,
    has_seating_area: false,
    virtual_tour_url: '',
  });
  const [stagedImages, setStagedImages] = useState<StagedImage[]>([]);
  const [expandedSections, setExpandedSections] = useState({
    basic: true,
    bed: true,
    features: true,
    view: true,
    bathroom: true,
    accessibility: true,
    policies: true,
    extras: true,
    media: true,
  });

  useEffect(() => {
    fetchRooms();
    fetchAmenities();
  }, []);

  const fetchRooms = async () => {
    try {
      const response = await api.get('/rooms/');
      const data = response.data.results || response.data || [];
      setRooms(data);
    } catch (error) {
      console.error('Error fetching rooms:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAmenities = async () => {
    try {
      const response = await api.get('/amenities/');
      setAmenities(response.data.results || response.data || []);
    } catch (error) {
      console.error('Error fetching amenities:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      let roomSlug = editingRoom?.slug;
      const isNewRoom = !editingRoom;

      // Prepare data for submission - convert empty strings to null for numeric/time fields
      const submitData = {
        ...formData,
        size_sqm: formData.size_sqm === '' ? null : formData.size_sqm,
        base_price_per_night: formData.base_price_per_night === '' ? null : formData.base_price_per_night,
        check_in_time: formData.check_in_time || null,
        check_out_time: formData.check_out_time || null,
        special_perks: formData.special_perks || '',
        bathroom_features: formData.bathroom_features || '',
        virtual_tour_url: formData.virtual_tour_url || '',
      };

      if (editingRoom) {
        await api.patch(`/rooms/${editingRoom.slug}/`, submitData);
      } else {
        const response = await api.post('/rooms/', submitData);
        roomSlug = response.data.slug;
      }

      // Use bulk upload for staged images
      if (stagedImages.length > 0 && roomSlug) {
        const uploadFormData = new FormData();

        stagedImages.forEach((img, index) => {
          if (img.file) {
            uploadFormData.append('images', img.file);
          }
        });

        // Add URLs separately
        const urls = stagedImages.filter(img => img.url).map(img => img.url);
        urls.forEach(url => {
          uploadFormData.append('image_urls', url!);
        });

        await api.post(`/rooms/${roomSlug}/bulk_add_images/`, uploadFormData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }

      fetchRooms();
      onUpdate();
      resetForm();
      alert(editingRoom ? 'Room updated successfully!' : 'Room and images created successfully!');
    } catch (error: any) {
      console.error('Error saving room:', error);
      alert(error.response?.data?.detail || error.response?.data?.message || 'Error saving room');
    }
  };

  const handleDelete = async (slug: string) => {
    if (!confirm('Are you sure you want to delete this room?')) return;

    try {
      await api.delete(`/rooms/${slug}/`);
      fetchRooms();
      onUpdate();
      alert('Room deleted successfully!');
    } catch (error) {
      console.error('Error deleting room:', error);
      alert('Error deleting room');
    }
  };

  const handleImageReorder = async (roomSlug: string, reorderedImages: RoomImage[]) => {
    try {
      const imageOrders = reorderedImages.map(img => ({
        id: img.id,
        order: img.order,
      }));

      await api.post(`/rooms/${roomSlug}/reorder_images/`, { images: imageOrders });
      fetchRooms();
    } catch (error) {
      console.error('Error reordering images:', error);
      alert('Error reordering images');
    }
  };

  const handleImageDelete = async (roomSlug: string, imageId: number) => {
    if (!confirm('Are you sure you want to remove this image?')) return;

    try {
      await api.delete(`/rooms/${roomSlug}/remove_image/${imageId}/`);
      fetchRooms();
      alert('Image removed successfully!');
    } catch (error) {
      console.error('Error removing image:', error);
      alert('Error removing image');
    }
  };

  const handleSetPrimaryImage = async (roomSlug: string, imageId: number) => {
    try {
      await api.patch(`/rooms/${roomSlug}/set_primary_image/${imageId}/`);
      fetchRooms();
      alert('Primary image updated!');
    } catch (error) {
      console.error('Error setting primary image:', error);
      alert('Error setting primary image');
    }
  };

  const startEdit = (room: Room) => {
    setEditingRoom(room);
    setFormData({
      name: room.name,
      description: room.description,
      room_type: room.room_type,
      capacity: room.capacity,
      size_sqm: room.size_sqm || '',
      base_price_per_night: room.base_price_per_night,
      amenities: room.amenities.map((a) => a.id),
      is_active: room.is_active,
      max_occupancy: room.max_occupancy || 2,
      bed_configuration: room.bed_configuration || 'QUEEN',
      number_of_beds: room.number_of_beds || 1,
      wifi: room.wifi ?? true,
      air_conditioning: room.air_conditioning ?? true,
      tv: room.tv ?? true,
      telephone: room.telephone ?? true,
      safe: room.safe ?? false,
      minibar: room.minibar ?? false,
      coffee_maker: room.coffee_maker ?? false,
      bathrobe_slippers: room.bathrobe_slippers ?? false,
      hairdryer: room.hairdryer ?? true,
      iron_ironing_board: room.iron_ironing_board ?? false,
      view_type: room.view_type || 'NO_VIEW',
      has_balcony: room.has_balcony ?? false,
      soundproof: room.soundproof ?? false,
      special_perks: room.special_perks || '',
      bathroom_features: room.bathroom_features || '',
      wheelchair_accessible: room.wheelchair_accessible ?? false,
      accessible_bathroom: room.accessible_bathroom ?? false,
      check_in_time: room.check_in_time || '14:00',
      check_out_time: room.check_out_time || '11:00',
      smoking_policy: room.smoking_policy || 'NON_SMOKING',
      pet_policy: room.pet_policy || 'NOT_ALLOWED',
      has_kitchenette: room.has_kitchenette ?? false,
      has_seating_area: room.has_seating_area ?? false,
      virtual_tour_url: room.virtual_tour_url || '',
    });
    setStagedImages([]);
    setShowForm(true);
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingRoom(null);
    setFormData({
      name: '',
      description: '',
      room_type: 'STANDARD',
      capacity: 2,
      size_sqm: '',
      base_price_per_night: '',
      amenities: [],
      is_active: true,
      max_occupancy: 2,
      bed_configuration: 'QUEEN',
      number_of_beds: 1,
      wifi: true,
      air_conditioning: true,
      tv: true,
      telephone: true,
      safe: false,
      minibar: false,
      coffee_maker: false,
      bathrobe_slippers: false,
      hairdryer: true,
      iron_ironing_board: false,
      view_type: 'NO_VIEW',
      has_balcony: false,
      soundproof: false,
      special_perks: '',
      bathroom_features: '',
      wheelchair_accessible: false,
      accessible_bathroom: false,
      check_in_time: '14:00',
      check_out_time: '11:00',
      smoking_policy: 'NON_SMOKING',
      pet_policy: 'NOT_ALLOWED',
      has_kitchenette: false,
      has_seating_area: false,
      virtual_tour_url: '',
    });
    setStagedImages([]);
  };

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  if (loading) return <div className="text-center py-8">Loading rooms...</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-neutral-900">Rooms Management</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors"
        >
          {showForm ? 'Cancel' : 'Add New Room'}
        </button>
      </div>

{showForm && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h3 className="text-xl font-bold mb-4">
            {editingRoom ? 'Edit Room' : 'Add New Room'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information Section */}
            <div className="border border-neutral-200 rounded-lg">
              <button
                type="button"
                onClick={() => toggleSection('basic')}
                className="w-full flex items-center justify-between p-4 bg-neutral-50 hover:bg-neutral-100 rounded-t-lg transition-colors"
              >
                <h4 className="font-semibold text-neutral-900">Basic Information</h4>
                <span className="text-neutral-600">{expandedSections.basic ? '−' : '+'}</span>
              </button>
              {expandedSections.basic && (
                <div className="p-4 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-2">Room Name *</label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                        className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-2">Room Type *</label>
                      <select
                        value={formData.room_type}
                        onChange={(e) => setFormData({ ...formData, room_type: e.target.value })}
                        required
                        className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                      >
                        <option value="STANDARD">Standard Room</option>
                        <option value="DELUXE">Deluxe Room</option>
                        <option value="SUITE">Suite</option>
                        <option value="PENTHOUSE">Penthouse</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-2">Size (sqm)</label>
                      <input
                        type="number"
                        value={formData.size_sqm}
                        onChange={(e) => setFormData({ ...formData, size_sqm: e.target.value })}
                        step="0.01"
                        className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-2">Base Price per Night *</label>
                      <input
                        type="number"
                        value={formData.base_price_per_night}
                        onChange={(e) => setFormData({ ...formData, base_price_per_night: e.target.value })}
                        required
                        step="0.01"
                        className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">Description *</label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      required
                      rows={4}
                      className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <div>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.is_active}
                        onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                        className="mr-2"
                      />
                      Active
                    </label>
                  </div>
                </div>
              )}
            </div>

            {/* Bed & Capacity Section */}
            <div className="border border-neutral-200 rounded-lg">
              <button
                type="button"
                onClick={() => toggleSection('bed')}
                className="w-full flex items-center justify-between p-4 bg-neutral-50 hover:bg-neutral-100 transition-colors"
              >
                <h4 className="font-semibold text-neutral-900">Bed Configuration & Capacity</h4>
                <span className="text-neutral-600">{expandedSections.bed ? '−' : '+'}</span>
              </button>
              {expandedSections.bed && (
                <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">Bed Type</label>
                    <select
                      value={formData.bed_configuration}
                      onChange={(e) => setFormData({ ...formData, bed_configuration: e.target.value })}
                      className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="SINGLE">Single</option>
                      <option value="TWIN">Twin</option>
                      <option value="DOUBLE">Double</option>
                      <option value="QUEEN">Queen</option>
                      <option value="KING">King</option>
                      <option value="SOFA_BED">Sofa Bed</option>
                      <option value="BUNK_BED">Bunk Bed</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">Number of Beds</label>
                    <input
                      type="number"
                      value={formData.number_of_beds}
                      onChange={(e) => setFormData({ ...formData, number_of_beds: parseInt(e.target.value) || 1 })}
                      min="1"
                      className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">Max Occupancy *</label>
                    <input
                      type="number"
                      value={formData.max_occupancy}
                      onChange={(e) => setFormData({ ...formData, max_occupancy: parseInt(e.target.value) || 2 })}
                      required
                      min="1"
                      className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">Standard Capacity (Deprecated)</label>
                    <input
                      type="number"
                      value={formData.capacity}
                      onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) || 2 })}
                      min="1"
                      className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 bg-neutral-100"
                      disabled
                    />
                  </div>
                </div>
              )}
            </div>

            {/* In-Room Features Section */}
            <div className="border border-neutral-200 rounded-lg">
              <button
                type="button"
                onClick={() => toggleSection('features')}
                className="w-full flex items-center justify-between p-4 bg-neutral-50 hover:bg-neutral-100 transition-colors"
              >
                <h4 className="font-semibold text-neutral-900">In-Room Features</h4>
                <span className="text-neutral-600">{expandedSections.features ? '−' : '+'}</span>
              </button>
              {expandedSections.features && (
                <div className="p-4 grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { key: 'wifi', label: 'WiFi' },
                    { key: 'air_conditioning', label: 'Air Conditioning' },
                    { key: 'tv', label: 'TV' },
                    { key: 'telephone', label: 'Telephone' },
                    { key: 'safe', label: 'Safe' },
                    { key: 'minibar', label: 'Minibar' },
                    { key: 'coffee_maker', label: 'Coffee Maker' },
                    { key: 'bathrobe_slippers', label: 'Bathrobe & Slippers' },
                    { key: 'hairdryer', label: 'Hairdryer' },
                    { key: 'iron_ironing_board', label: 'Iron & Ironing Board' },
                  ].map(({ key, label }) => (
                    <label key={key} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData[key as keyof typeof formData] as boolean}
                        onChange={(e) => setFormData({ ...formData, [key]: e.target.checked })}
                        className="mr-2"
                      />
                      {label}
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* View & Perks Section */}
            <div className="border border-neutral-200 rounded-lg">
              <button
                type="button"
                onClick={() => toggleSection('view')}
                className="w-full flex items-center justify-between p-4 bg-neutral-50 hover:bg-neutral-100 transition-colors"
              >
                <h4 className="font-semibold text-neutral-900">View & Special Perks</h4>
                <span className="text-neutral-600">{expandedSections.view ? '−' : '+'}</span>
              </button>
              {expandedSections.view && (
                <div className="p-4 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-2">View Type</label>
                      <select
                        value={formData.view_type}
                        onChange={(e) => setFormData({ ...formData, view_type: e.target.value })}
                        className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                      >
                        <option value="NO_VIEW">No Specific View</option>
                        <option value="CITY">City View</option>
                        <option value="SEA">Sea View</option>
                        <option value="GARDEN">Garden View</option>
                        <option value="MOUNTAIN">Mountain View</option>
                        <option value="POOL">Pool View</option>
                        <option value="COURTYARD">Courtyard View</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.has_balcony}
                        onChange={(e) => setFormData({ ...formData, has_balcony: e.target.checked })}
                        className="mr-2"
                      />
                      Has Balcony
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.soundproof}
                        onChange={(e) => setFormData({ ...formData, soundproof: e.target.checked })}
                        className="mr-2"
                      />
                      Soundproof
                    </label>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">Special Perks (one per line)</label>
                    <textarea
                      value={formData.special_perks}
                      onChange={(e) => setFormData({ ...formData, special_perks: e.target.value })}
                      rows={3}
                      placeholder="e.g., Free breakfast&#10;Complimentary spa access"
                      className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Bathroom Features Section */}
            <div className="border border-neutral-200 rounded-lg">
              <button
                type="button"
                onClick={() => toggleSection('bathroom')}
                className="w-full flex items-center justify-between p-4 bg-neutral-50 hover:bg-neutral-100 transition-colors"
              >
                <h4 className="font-semibold text-neutral-900">Bathroom Amenities</h4>
                <span className="text-neutral-600">{expandedSections.bathroom ? '−' : '+'}</span>
              </button>
              {expandedSections.bathroom && (
                <div className="p-4">
                  <label className="block text-sm font-medium text-neutral-700 mb-2">Bathroom Features (one per line)</label>
                  <textarea
                    value={formData.bathroom_features}
                    onChange={(e) => setFormData({ ...formData, bathroom_features: e.target.value })}
                    rows={4}
                    placeholder="e.g., Bathtub&#10;Shower&#10;Premium toiletries"
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              )}
            </div>

            {/* Accessibility Section */}
            <div className="border border-neutral-200 rounded-lg">
              <button
                type="button"
                onClick={() => toggleSection('accessibility')}
                className="w-full flex items-center justify-between p-4 bg-neutral-50 hover:bg-neutral-100 transition-colors"
              >
                <h4 className="font-semibold text-neutral-900">Accessibility Features</h4>
                <span className="text-neutral-600">{expandedSections.accessibility ? '−' : '+'}</span>
              </button>
              {expandedSections.accessibility && (
                <div className="p-4 grid grid-cols-2 gap-3">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.wheelchair_accessible}
                      onChange={(e) => setFormData({ ...formData, wheelchair_accessible: e.target.checked })}
                      className="mr-2"
                    />
                    Wheelchair Accessible
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.accessible_bathroom}
                      onChange={(e) => setFormData({ ...formData, accessible_bathroom: e.target.checked })}
                      className="mr-2"
                    />
                    Accessible Bathroom
                  </label>
                </div>
              )}
            </div>

            {/* Policies Section */}
            <div className="border border-neutral-200 rounded-lg">
              <button
                type="button"
                onClick={() => toggleSection('policies')}
                className="w-full flex items-center justify-between p-4 bg-neutral-50 hover:bg-neutral-100 transition-colors"
              >
                <h4 className="font-semibold text-neutral-900">Room Policies</h4>
                <span className="text-neutral-600">{expandedSections.policies ? '−' : '+'}</span>
              </button>
              {expandedSections.policies && (
                <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">Check-in Time</label>
                    <input
                      type="time"
                      value={formData.check_in_time}
                      onChange={(e) => setFormData({ ...formData, check_in_time: e.target.value })}
                      className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">Check-out Time</label>
                    <input
                      type="time"
                      value={formData.check_out_time}
                      onChange={(e) => setFormData({ ...formData, check_out_time: e.target.value })}
                      className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">Smoking Policy</label>
                    <select
                      value={formData.smoking_policy}
                      onChange={(e) => setFormData({ ...formData, smoking_policy: e.target.value })}
                      className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="NON_SMOKING">Non-Smoking</option>
                      <option value="SMOKING">Smoking Allowed</option>
                      <option value="DESIGNATED_AREA">Designated Smoking Area</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">Pet Policy</label>
                    <select
                      value={formData.pet_policy}
                      onChange={(e) => setFormData({ ...formData, pet_policy: e.target.value })}
                      className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="NOT_ALLOWED">Not Allowed</option>
                      <option value="SMALL_PETS">Small Pets Only</option>
                      <option value="ALL_PETS">All Pets Welcome</option>
                      <option value="SERVICE_ANIMALS">Service Animals Only</option>
                    </select>
                  </div>
                </div>
              )}
            </div>

            {/* Optional Extras Section */}
            <div className="border border-neutral-200 rounded-lg">
              <button
                type="button"
                onClick={() => toggleSection('extras')}
                className="w-full flex items-center justify-between p-4 bg-neutral-50 hover:bg-neutral-100 transition-colors"
              >
                <h4 className="font-semibold text-neutral-900">Optional Extras</h4>
                <span className="text-neutral-600">{expandedSections.extras ? '−' : '+'}</span>
              </button>
              {expandedSections.extras && (
                <div className="p-4 grid grid-cols-2 gap-3">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.has_kitchenette}
                      onChange={(e) => setFormData({ ...formData, has_kitchenette: e.target.checked })}
                      className="mr-2"
                    />
                    Kitchenette
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.has_seating_area}
                      onChange={(e) => setFormData({ ...formData, has_seating_area: e.target.checked })}
                      className="mr-2"
                    />
                    Seating Area
                  </label>
                </div>
              )}
            </div>

            {/* Media Section */}
            <div className="border border-neutral-200 rounded-lg">
              <button
                type="button"
                onClick={() => toggleSection('media')}
                className="w-full flex items-center justify-between p-4 bg-neutral-50 hover:bg-neutral-100 transition-colors"
              >
                <h4 className="font-semibold text-neutral-900">Images & Virtual Tour</h4>
                <span className="text-neutral-600">{expandedSections.media ? '−' : '+'}</span>
              </button>
              {expandedSections.media && (
                <div className="p-4 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">Virtual Tour URL</label>
                    <input
                      type="url"
                      value={formData.virtual_tour_url}
                      onChange={(e) => setFormData({ ...formData, virtual_tour_url: e.target.value })}
                      placeholder="https://example.com/virtual-tour"
                      className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-3">Room Images</label>
                    <ImageUploadDnD
                      images={stagedImages}
                      onImagesChange={setStagedImages}
                      onRemove={(id) => setStagedImages(stagedImages.filter(img => img.id !== id))}
                      maxImages={20}
                      allowUrls={true}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Legacy Amenities (Deprecated) */}
            <div className="border border-neutral-200 rounded-lg">
              <div className="p-4 bg-neutral-50">
                <h4 className="font-semibold text-neutral-900 mb-2">Legacy Amenities (Deprecated)</h4>
                <p className="text-xs text-neutral-600 mb-3">These will be removed in a future update. Use In-Room Features instead.</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {amenities.map((amenity) => (
                    <label key={amenity.id} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.amenities.includes(amenity.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFormData({
                              ...formData,
                              amenities: [...formData.amenities, amenity.id],
                            });
                          } else {
                            setFormData({
                              ...formData,
                              amenities: formData.amenities.filter((id) => id !== amenity.id),
                            });
                          }
                        }}
                        className="mr-2"
                      />
                      {amenity.name}
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <button
                type="submit"
                className="px-6 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors"
              >
                {editingRoom ? 'Update Room' : 'Create Room'}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="px-6 py-2 bg-neutral-200 hover:bg-neutral-300 text-neutral-700 rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="space-y-4">
        {rooms.map((room) => (
          <div key={room.id} className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-xl font-bold text-neutral-900">{room.name}</h3>
                <p className="text-sm text-neutral-600">
                  {room.room_type} • Max Occupancy: {room.max_occupancy || room.capacity} • ${room.base_price_per_night}/night
                </p>
                {room.bed_configuration && (
                  <p className="text-xs text-neutral-500 mt-1">
                    {room.number_of_beds || 1} {room.bed_configuration} bed{(room.number_of_beds || 1) > 1 ? 's' : ''}
                    {room.view_type && room.view_type !== 'NO_VIEW' && ` • ${room.view_type.replace('_', ' ')} View`}
                  </p>
                )}
                <span
                  className={`inline-block px-2 py-1 text-xs rounded mt-2 ${
                    room.is_active
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {room.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => startEdit(room)}
                  className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors text-sm"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(room.slug)}
                  className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors text-sm"
                >
                  Delete
                </button>
              </div>
            </div>

            <p className="text-neutral-700 mb-4">{room.description}</p>

            {/* Display new features if available */}
            {(room.wifi || room.air_conditioning || room.tv || room.has_balcony) && (
              <div className="mb-4">
                <h4 className="font-semibold text-neutral-900 text-sm mb-2">Features</h4>
                <div className="flex flex-wrap gap-2">
                  {room.wifi && <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">WiFi</span>}
                  {room.air_conditioning && <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">A/C</span>}
                  {room.tv && <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">TV</span>}
                  {room.has_balcony && <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">Balcony</span>}
                  {room.minibar && <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">Minibar</span>}
                  {room.safe && <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">Safe</span>}
                  {room.wheelchair_accessible && <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">♿ Accessible</span>}
                </div>
              </div>
            )}

            <div className="mb-4">
              <h4 className="font-semibold text-neutral-900 mb-3">
                Images ({room.images?.length || 0})
              </h4>
              {room.images && room.images.length > 0 ? (
                <ImageReorder
                  images={room.images}
                  onReorder={(reorderedImages) => handleImageReorder(room.slug, reorderedImages)}
                  onDelete={(imageId) => handleImageDelete(room.slug, imageId)}
                  onSetPrimary={(imageId) => handleSetPrimaryImage(room.slug, imageId)}
                  showPrimaryOption={true}
                />
              ) : (
                <p className="text-sm text-neutral-500 italic">No images uploaded yet</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
