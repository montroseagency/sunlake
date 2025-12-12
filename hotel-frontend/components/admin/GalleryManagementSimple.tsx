'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';

interface GalleryCategory {
  id: number;
  name: string;
  display_name: string;
  order: number;
}

interface GalleryImage {
  id: number;
  category: number;
  category_name: string;
  image_url: string;
  image_display: string;
  order: number;
  created_at: string;
}

interface Props {
  onUpdate: () => void;
}

export default function GalleryManagementSimple({ onUpdate }: Props) {
  const [categories, setCategories] = useState<GalleryCategory[]>([]);
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploadingImages, setUploadingImages] = useState<File[]>([]);
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  useEffect(() => {
    fetchCategories();
    fetchImages();
  }, []);

  useEffect(() => {
    if (selectedCategory) {
      fetchImages();
    }
  }, [selectedCategory]);

  const fetchCategories = async () => {
    try {
      const response = await api.get('/gallery-categories/');
      const data = response.data.results || response.data || [];
      setCategories(data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchImages = async () => {
    try {
      const params = selectedCategory ? { category: selectedCategory } : {};
      const response = await api.get('/gallery/', { params });
      const data = response.data.results || response.data || [];
      setImages(data);
    } catch (error) {
      console.error('Error fetching images:', error);
    }
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;

    try {
      await api.post('/gallery-categories/', {
        name: newCategoryName.toUpperCase().replace(/\s+/g, '_'),
        display_name: newCategoryName,
        order: categories.length,
      });
      setNewCategoryName('');
      setShowCategoryForm(false);
      fetchCategories();
      alert('Category created successfully!');
    } catch (error: any) {
      console.error('Error creating category:', error);
      alert(error.response?.data?.detail || 'Error creating category');
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setUploadingImages(Array.from(e.target.files));
    }
  };

  const handleUploadImages = async () => {
    if (!selectedCategory || uploadingImages.length === 0) {
      alert('Please select a category and choose images to upload');
      return;
    }

    try {
      // Upload all images
      for (const imageFile of uploadingImages) {
        const formData = new FormData();
        formData.append('category', selectedCategory.toString());
        formData.append('image', imageFile);
        formData.append('order', '0');

        await api.post('/gallery/', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }

      setUploadingImages([]);
      fetchImages();
      onUpdate();
      alert(`${uploadingImages.length} image(s) uploaded successfully!`);

      // Reset file input
      const fileInput = document.getElementById('image-upload') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
    } catch (error: any) {
      console.error('Error uploading images:', error);
      alert(error.response?.data?.detail || 'Error uploading images');
    }
  };

  const handleDeleteImage = async (imageId: number) => {
    if (!confirm('Are you sure you want to delete this image?')) return;

    try {
      await api.delete(`/gallery/${imageId}/`);
      fetchImages();
      onUpdate();
      alert('Image deleted successfully!');
    } catch (error: any) {
      console.error('Error deleting image:', error);
      alert(error.response?.data?.detail || 'Error deleting image');
    }
  };

  const handleDeleteCategory = async (categoryId: number) => {
    if (!confirm('Are you sure you want to delete this category? All images in this category will be deleted.')) return;

    try {
      await api.delete(`/gallery-categories/${categoryId}/`);
      fetchCategories();
      if (selectedCategory === categoryId) {
        setSelectedCategory(null);
      }
      onUpdate();
      alert('Category deleted successfully!');
    } catch (error: any) {
      console.error('Error deleting category:', error);
      alert(error.response?.data?.detail || 'Error deleting category');
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Categories Management */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">Gallery Categories</h2>
          <button
            onClick={() => setShowCategoryForm(!showCategoryForm)}
            className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors"
          >
            {showCategoryForm ? 'Cancel' : '+ New Category'}
          </button>
        </div>

        {/* New Category Form */}
        {showCategoryForm && (
          <form onSubmit={handleCreateCategory} className="mb-6 p-4 bg-neutral-50 rounded-lg">
            <div className="flex gap-2">
              <input
                type="text"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="Category name (e.g., Hotel Exterior, Dining)"
                className="flex-1 px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-green-500"
                required
              />
              <button
                type="submit"
                className="px-6 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors"
              >
                Create
              </button>
            </div>
          </form>
        )}

        {/* Categories Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {categories.map((category) => (
            <div
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                selectedCategory === category.id
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-neutral-200 hover:border-primary-300'
              }`}
            >
              <div className="flex items-start justify-between">
                <h3 className="font-semibold text-neutral-900">{category.display_name}</h3>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteCategory(category.id);
                  }}
                  className="text-red-500 hover:text-red-700 text-sm"
                >
                  ✕
                </button>
              </div>
              <p className="text-sm text-neutral-500 mt-1">
                {images.filter(img => img.category === category.id).length} images
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Image Upload Section */}
      {selectedCategory && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-bold mb-4">
            Upload Images to{' '}
            {categories.find(c => c.id === selectedCategory)?.display_name}
          </h2>

          <div className="space-y-4">
            {/* File Input */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Select Images (Multiple)
              </label>
              <input
                id="image-upload"
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileSelect}
                className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
              {uploadingImages.length > 0 && (
                <p className="text-sm text-neutral-600 mt-2">
                  {uploadingImages.length} image(s) selected
                </p>
              )}
            </div>

            {/* Upload Button */}
            <button
              onClick={handleUploadImages}
              disabled={uploadingImages.length === 0}
              className="px-6 py-3 bg-primary-500 hover:bg-primary-600 disabled:bg-neutral-300 disabled:cursor-not-allowed text-white rounded-lg font-semibold transition-colors"
            >
              Upload {uploadingImages.length > 0 ? `${uploadingImages.length} Image(s)` : 'Images'}
            </button>
          </div>
        </div>
      )}

      {/* Images Grid */}
      {selectedCategory && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-bold mb-4">Images</h2>

          {images.filter(img => img.category === selectedCategory).length === 0 ? (
            <p className="text-neutral-500 text-center py-8">No images in this category yet</p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {images
                .filter(img => img.category === selectedCategory)
                .map((image) => (
                  <div key={image.id} className="relative group">
                    <img
                      src={image.image_display}
                      alt={`Gallery image ${image.id}`}
                      className="w-full h-48 object-cover rounded-lg"
                    />
                    <button
                      onClick={() => handleDeleteImage(image.id)}
                      className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      🗑️
                    </button>
                  </div>
                ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
