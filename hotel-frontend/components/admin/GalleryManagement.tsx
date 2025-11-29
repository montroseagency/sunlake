'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';

interface GalleryImage {
  id: number;
  title: string;
  description: string;
  image_url: string;
  image_display: string;
  category: string;
  order: number;
  is_active: boolean;
  created_at: string;
}

interface Props {
  onUpdate: () => void;
}

const CATEGORIES = [
  { value: 'HOTEL', label: 'Hotel' },
  { value: 'ROOM', label: 'Room' },
  { value: 'DINING', label: 'Dining' },
  { value: 'FACILITIES', label: 'Facilities' },
  { value: 'EVENTS', label: 'Events' },
  { value: 'OTHER', label: 'Other' },
];

export default function GalleryManagement({ onUpdate }: Props) {
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingImage, setEditingImage] = useState<GalleryImage | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    image_url: '',
    category: 'OTHER',
    order: 0,
    is_active: true,
  });
  const [filterCategory, setFilterCategory] = useState<string>('');
  const [uploadMethod, setUploadMethod] = useState<'file' | 'url'>('file');

  useEffect(() => {
    fetchImages();
  }, [filterCategory]);

  const fetchImages = async () => {
    try {
      const params = filterCategory ? { category: filterCategory } : {};
      const response = await api.get('/gallery/', { params });
      const data = response.data.results || response.data || [];
      setImages(data);
    } catch (error) {
      console.error('Error fetching gallery images:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const submitData = new FormData();
      submitData.append('title', formData.title);
      submitData.append('description', formData.description);
      submitData.append('category', formData.category);
      submitData.append('order', formData.order.toString());
      submitData.append('is_active', formData.is_active.toString());

      if (uploadMethod === 'file' && imageFile) {
        submitData.append('image', imageFile);
      } else if (uploadMethod === 'url' && formData.image_url) {
        submitData.append('image_url', formData.image_url);
      }

      if (editingImage) {
        await api.patch(`/gallery/${editingImage.id}/`, submitData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      } else {
        await api.post('/gallery/', submitData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }

      fetchImages();
      onUpdate();
      resetForm();
      alert(editingImage ? 'Image updated successfully!' : 'Image added successfully!');
    } catch (error: any) {
      console.error('Error saving image:', error);
      alert(error.response?.data?.detail || 'Error saving image');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this image?')) return;

    try {
      await api.delete(`/gallery/${id}/`);
      fetchImages();
      onUpdate();
      alert('Image deleted successfully!');
    } catch (error) {
      console.error('Error deleting image:', error);
      alert('Error deleting image');
    }
  };

  const startEdit = (image: GalleryImage) => {
    setEditingImage(image);
    setFormData({
      title: image.title,
      description: image.description,
      image_url: image.image_url,
      category: image.category,
      order: image.order,
      is_active: image.is_active,
    });
    setImageFile(null);
    setUploadMethod(image.image_url ? 'url' : 'file');
    setShowForm(true);
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingImage(null);
    setImageFile(null);
    setFormData({
      title: '',
      description: '',
      image_url: '',
      category: 'OTHER',
      order: 0,
      is_active: true,
    });
    setUploadMethod('file');
  };

  if (loading) return <div className="text-center py-8">Loading gallery images...</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-neutral-900">Gallery Management</h2>
          <p className="text-sm text-neutral-600 mt-1">
            Manage hotel gallery images displayed on the website
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors"
        >
          {showForm ? 'Cancel' : 'Add New Image'}
        </button>
      </div>

      <div className="mb-6">
        <label className="block text-sm font-medium text-neutral-700 mb-2">
          Filter by Category
        </label>
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="w-64 px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
        >
          <option value="">All Categories</option>
          {CATEGORIES.map((cat) => (
            <option key={cat.value} value={cat.value}>
              {cat.label}
            </option>
          ))}
        </select>
      </div>

      {showForm && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h3 className="text-xl font-bold mb-4">
            {editingImage ? 'Edit Image' : 'Add New Image'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Category *
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Order
                </label>
                <input
                  type="number"
                  value={formData.order}
                  onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) })}
                  min="0"
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
                Upload Method *
              </label>
              <div className="flex gap-4 mb-3">
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

              {uploadMethod === 'file' ? (
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                  key="file-input"
                  className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                />
              ) : (
                <input
                  type="url"
                  value={formData.image_url || ''}
                  onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                  required
                  placeholder="https://example.com/image.jpg"
                  className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                />
              )}
            </div>

            {(imageFile || formData.image_url) && (
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Preview
                </label>
                {imageFile ? (
                  <img
                    src={URL.createObjectURL(imageFile)}
                    alt="Preview"
                    className="w-full max-w-md h-48 object-cover rounded-lg"
                  />
                ) : formData.image_url ? (
                  <img
                    src={formData.image_url}
                    alt="Preview"
                    className="w-full max-w-md h-48 object-cover rounded-lg"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/placeholder-image.jpg';
                    }}
                  />
                ) : null}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div className="flex gap-4">
              <button
                type="submit"
                className="px-6 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors"
              >
                {editingImage ? 'Update Image' : 'Add Image'}
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {images.map((image) => (
          <div key={image.id} className="bg-white rounded-lg shadow overflow-hidden">
            <img
              src={image.image_display || image.image_url}
              alt={image.title}
              className="w-full h-48 object-cover"
            />
            <div className="p-4">
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-lg font-bold text-neutral-900">{image.title}</h3>
                <span
                  className={`px-2 py-1 text-xs rounded ${
                    image.is_active
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {image.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
              <p className="text-sm text-neutral-600 mb-2">
                Category: {CATEGORIES.find((c) => c.value === image.category)?.label} • Order: {image.order}
              </p>
              {image.description && (
                <p className="text-sm text-neutral-700 mb-4">{image.description}</p>
              )}
              <div className="flex gap-2">
                <button
                  onClick={() => startEdit(image)}
                  className="flex-1 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors text-sm"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(image.id)}
                  className="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors text-sm"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {images.length === 0 && (
        <div className="text-center py-12 text-neutral-500">
          No images found. Add your first gallery image!
        </div>
      )}
    </div>
  );
}
