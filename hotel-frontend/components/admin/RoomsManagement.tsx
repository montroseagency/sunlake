'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';

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
  });
  const [newImageFile, setNewImageFile] = useState<File | null>(null);
  const [newImageUrl, setNewImageUrl] = useState('');
  const [newImageAlt, setNewImageAlt] = useState('');
  const [uploadMethod, setUploadMethod] = useState<'file' | 'url'>('file');
  const [formImages, setFormImages] = useState<Array<{ file?: File; url?: string; alt: string }>>([]);

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

    console.log('===== FORM SUBMIT START =====');
    console.log('formImages array:', formImages);
    console.log('formImages length:', formImages.length);
    console.log('Is editing?', !!editingRoom);

    try {
      let roomSlug = editingRoom?.slug;
      const isNewRoom = !editingRoom;

      // Prepare data for submission - convert empty strings to null for numeric fields
      const submitData = {
        ...formData,
        size_sqm: formData.size_sqm === '' ? null : formData.size_sqm,
        base_price_per_night: formData.base_price_per_night === '' ? null : formData.base_price_per_night,
      };

      if (editingRoom) {
        console.log('Updating existing room:', editingRoom.slug);
        await api.patch(`/rooms/${editingRoom.slug}/`, submitData);
      } else {
        console.log('Creating new room...');
        const response = await api.post('/rooms/', submitData);
        roomSlug = response.data.slug;
        console.log('Created room response:', response.data);
        console.log('Created room with slug:', roomSlug);
      }

      // Upload images if any were added
      console.log('Checking images to upload...');
      console.log('formImages.length:', formImages.length);
      console.log('roomSlug:', roomSlug);
      console.log('Should upload?', formImages.length > 0 && roomSlug);

      if (formImages.length > 0 && roomSlug) {
        console.log('Starting image upload loop for', formImages.length, 'images');
        for (let i = 0; i < formImages.length; i++) {
          const img = formImages[i];
          console.log(`Processing image ${i}:`, img);

          // Skip images that have neither file nor URL
          if (!img.file && !img.url) {
            console.warn('Image has neither file nor URL! Skipping...', img);
            continue;
          }

          const imageFormData = new FormData();

          if (img.file) {
            imageFormData.append('image', img.file);
            console.log('Uploading file:', img.file.name, 'size:', img.file.size);
          } else if (img.url) {
            imageFormData.append('image_url', img.url);
            console.log('Uploading URL:', img.url);
          }

          if (img.alt) {
            imageFormData.append('alt_text', img.alt);
          }

          // Mark first image as primary if this is a new room
          const isPrimary = (isNewRoom && i === 0) ? 'true' : 'false';
          imageFormData.append('is_primary', isPrimary);
          imageFormData.append('order', i.toString());

          console.log(`Uploading image ${i} to /rooms/${roomSlug}/add_image/ as primary:`, isPrimary);

          try {
            const uploadResponse = await api.post(`/rooms/${roomSlug}/add_image/`, imageFormData, {
              headers: { 'Content-Type': 'multipart/form-data' },
            });
            console.log(`Image ${i} uploaded successfully:`, uploadResponse.data);
          } catch (imgError: any) {
            console.error(`Failed to upload image ${i}:`, imgError);
            console.error('Error response:', imgError.response?.data);
            throw imgError;
          }
        }
        console.log('All images uploaded successfully');
      } else {
        console.log('Skipping image upload - no images or no slug');
      }

      console.log('===== FORM SUBMIT SUCCESS =====');
      fetchRooms();
      onUpdate();
      resetForm();
      alert(editingRoom ? 'Room updated successfully!' : 'Room and images created successfully!');
    } catch (error: any) {
      console.error('===== FORM SUBMIT ERROR =====');
      console.error('Error saving room:', error);
      console.error('Error response:', error.response?.data);
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

  const handleAddImage = async (roomSlug: string) => {
    if (uploadMethod === 'file' && !newImageFile) {
      alert('Please select an image file');
      return;
    }
    if (uploadMethod === 'url' && !newImageUrl) {
      alert('Please enter an image URL');
      return;
    }

    try {
      const formData = new FormData();

      if (uploadMethod === 'file' && newImageFile) {
        formData.append('image', newImageFile);
      } else if (uploadMethod === 'url') {
        formData.append('image_url', newImageUrl);
      }

      formData.append('alt_text', newImageAlt || '');
      formData.append('is_primary', 'false');
      formData.append('order', '0');

      await api.post(`/rooms/${roomSlug}/add_image/`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      fetchRooms();
      setNewImageFile(null);
      setNewImageUrl('');
      setNewImageAlt('');
      alert('Image added successfully!');
    } catch (error: any) {
      console.error('Error adding image:', error);
      alert(error.response?.data?.detail || 'Error adding image');
    }
  };

  const handleRemoveImage = async (roomSlug: string, imageId: number) => {
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
    });
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
    });
    setFormImages([]);
    setNewImageFile(null);
    setNewImageUrl('');
    setNewImageAlt('');
    setUploadMethod('file');
  };

  const handleAddFormImage = () => {
    console.log('handleAddFormImage called');
    console.log('uploadMethod:', uploadMethod);
    console.log('newImageFile:', newImageFile);
    console.log('newImageUrl:', newImageUrl);

    if (uploadMethod === 'file' && !newImageFile) {
      alert('Please select an image file');
      return;
    }
    if (uploadMethod === 'url' && !newImageUrl) {
      alert('Please enter an image URL');
      return;
    }

    const newImage = uploadMethod === 'file'
      ? { file: newImageFile!, alt: newImageAlt }
      : { url: newImageUrl, alt: newImageAlt };

    console.log('Adding image to formImages:', newImage);
    setFormImages([...formImages, newImage]);
    setNewImageFile(null);
    setNewImageUrl('');
    setNewImageAlt('');
    console.log('Image added! formImages will be:', [...formImages, newImage]);
  };

  const handleRemoveFormImage = (index: number) => {
    setFormImages(formImages.filter((_, i) => i !== index));
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
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Room Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Room Type *
                </label>
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
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Capacity *
                </label>
                <input
                  type="number"
                  value={formData.capacity}
                  onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) })}
                  required
                  min="1"
                  className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Size (sqm)
                </label>
                <input
                  type="number"
                  value={formData.size_sqm}
                  onChange={(e) => setFormData({ ...formData, size_sqm: e.target.value })}
                  step="0.01"
                  className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Base Price per Night *
                </label>
                <input
                  type="number"
                  value={formData.base_price_per_night}
                  onChange={(e) => setFormData({ ...formData, base_price_per_night: e.target.value })}
                  required
                  step="0.01"
                  className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Status
                </label>
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

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Description *
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                required
                rows={4}
                className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Amenities
              </label>
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

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-neutral-700">
                  Room Images {formImages.length > 0 && (
                    <span className="ml-2 px-2 py-0.5 bg-green-100 text-green-800 text-xs font-semibold rounded">
                      {formImages.length} image{formImages.length !== 1 ? 's' : ''} ready to upload
                    </span>
                  )}
                </label>
                {!editingRoom && formImages.length === 0 && (
                  <span className="text-xs text-orange-600 font-medium">
                    Click "Add Image" button after selecting a file
                  </span>
                )}
              </div>

              {formImages.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  {formImages.map((img, index) => (
                    <div key={index} className="relative">
                      <img
                        src={img.file ? URL.createObjectURL(img.file) : img.url}
                        alt={img.alt || 'Room image'}
                        className="w-full h-32 object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveFormImage(index)}
                        className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white p-1 rounded text-xs"
                      >
                        Remove
                      </button>
                      {img.alt && (
                        <p className="text-xs text-neutral-600 mt-1 truncate">{img.alt}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}

              <div className="space-y-3 border border-neutral-200 rounded-lg p-4 bg-neutral-50">
                <div className="flex gap-4 mb-2">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="file"
                      checked={uploadMethod === 'file'}
                      onChange={() => setUploadMethod('file')}
                      className="mr-2"
                    />
                    Upload File
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="url"
                      checked={uploadMethod === 'url'}
                      onChange={() => setUploadMethod('url')}
                      className="mr-2"
                    />
                    Image URL
                  </label>
                </div>

                <div className="flex gap-2">
                  {uploadMethod === 'file' ? (
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setNewImageFile(e.target.files?.[0] || null)}
                      className="flex-1 px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 bg-white"
                    />
                  ) : (
                    <input
                      type="text"
                      placeholder="Image URL"
                      value={newImageUrl}
                      onChange={(e) => setNewImageUrl(e.target.value)}
                      className="flex-1 px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 bg-white"
                    />
                  )}
                  <input
                    type="text"
                    placeholder="Alt text (optional)"
                    value={newImageAlt}
                    onChange={(e) => setNewImageAlt(e.target.value)}
                    className="flex-1 px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 bg-white"
                  />
                  <button
                    type="button"
                    onClick={handleAddFormImage}
                    className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors whitespace-nowrap"
                  >
                    Add Image
                  </button>
                </div>

                {(newImageFile || newImageUrl) && (
                  <div className="mt-3">
                    <p className="text-sm text-neutral-600 mb-2">Preview:</p>
                    <img
                      src={newImageFile ? URL.createObjectURL(newImageFile) : newImageUrl}
                      alt="Preview"
                      className="w-full max-w-md h-48 object-cover rounded-lg"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/placeholder-image.jpg';
                      }}
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-4">
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
                  {room.room_type} • Capacity: {room.capacity} • ${room.base_price_per_night}/night
                </p>
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

            <div className="mb-4">
              <h4 className="font-semibold text-neutral-900 mb-2">Images ({room.images?.length || 0})</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                {room.images?.map((image) => (
                  <div key={image.id} className="relative">
                    <img
                      src={image.image_display || image.image_url}
                      alt={image.alt_text}
                      className="w-full h-32 object-cover rounded-lg"
                    />
                    <button
                      onClick={() => handleRemoveImage(room.slug, image.id)}
                      className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white p-1 rounded text-xs"
                    >
                      Remove
                    </button>
                    {image.is_primary && (
                      <span className="absolute bottom-2 left-2 bg-primary-500 text-white px-2 py-1 rounded text-xs">
                        Primary
                      </span>
                    )}
                  </div>
                ))}
              </div>

              <div className="space-y-3">
                <div className="flex gap-4 mb-2">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="file"
                      checked={uploadMethod === 'file'}
                      onChange={() => setUploadMethod('file')}
                      className="mr-2"
                    />
                    Upload File
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="url"
                      checked={uploadMethod === 'url'}
                      onChange={() => setUploadMethod('url')}
                      className="mr-2"
                    />
                    Image URL
                  </label>
                </div>

                <div className="flex gap-2">
                  {uploadMethod === 'file' ? (
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setNewImageFile(e.target.files?.[0] || null)}
                      className="flex-1 px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    />
                  ) : (
                    <input
                      type="text"
                      placeholder="Image URL"
                      value={newImageUrl}
                      onChange={(e) => setNewImageUrl(e.target.value)}
                      className="flex-1 px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    />
                  )}
                  <input
                    type="text"
                    placeholder="Alt text (optional)"
                    value={newImageAlt}
                    onChange={(e) => setNewImageAlt(e.target.value)}
                    className="flex-1 px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  />
                  <button
                    onClick={() => handleAddImage(room.slug)}
                    className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors whitespace-nowrap"
                  >
                    Add Image
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
