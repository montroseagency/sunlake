'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import ImageUploadDnD, { ImageItem } from './ImageUploadDnD';
import ImageReorder, { UploadedImage } from './ImageReorder';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface GalleryCategory {
  id: number;
  name: string;
  slug: string;
  description: string;
  order: number;
  is_active: boolean;
  image_count: number;
  created_at: string;
  updated_at: string;
}

interface GalleryImage {
  id: number;
  category: number;
  category_name: string;
  image?: string;
  image_url?: string;
  image_display?: string;
  alt_text: string;
  order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface Props {
  onUpdate: () => void;
}

function SortableCategory({ category, onEdit, onDelete }: {
  category: GalleryCategory;
  onEdit: (cat: GalleryCategory) => void;
  onDelete: (id: number) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: category.id.toString() });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      className="flex items-center justify-between p-4 bg-white border border-neutral-200 rounded-lg hover:border-primary-500"
    >
      <div className="flex items-center gap-3 flex-1">
        <button
          type="button"
          {...listeners}
          className="cursor-move text-neutral-400 hover:text-neutral-600"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
          </svg>
        </button>
        <div className="flex-1">
          <h3 className="font-medium text-neutral-900">{category.name}</h3>
          {category.description && (
            <p className="text-sm text-neutral-500">{category.description}</p>
          )}
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-neutral-500">{category.image_count} images</span>
          <span className={`px-2 py-1 rounded text-xs ${category.is_active ? 'bg-green-100 text-green-700' : 'bg-neutral-100 text-neutral-600'}`}>
            {category.is_active ? 'Active' : 'Inactive'}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-2 ml-4">
        <button
          type="button"
          onClick={() => onEdit(category)}
          className="px-3 py-1 text-sm text-primary-600 hover:bg-primary-50 rounded"
        >
          Edit
        </button>
        <button
          type="button"
          onClick={() => {
            if (confirm(`Delete category "${category.name}"? This will also delete all images in this category.`)) {
              onDelete(category.id);
            }
          }}
          className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded"
        >
          Delete
        </button>
      </div>
    </div>
  );
}

export default function GalleryManagementNew({ onUpdate }: Props) {
  const [activeTab, setActiveTab] = useState<'categories' | 'images'>('categories');

  // Categories state
  const [categories, setCategories] = useState<GalleryCategory[]>([]);
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<GalleryCategory | null>(null);
  const [categoryFormData, setCategoryFormData] = useState({
    name: '',
    description: '',
    is_active: true,
  });

  // Images state
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [stagedImages, setStagedImages] = useState<ImageItem[]>([]);
  const [uploading, setUploading] = useState(false);

  const [loading, setLoading] = useState(true);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    if (selectedCategory) {
      fetchImages(selectedCategory);
    }
  }, [selectedCategory]);

  const fetchCategories = async () => {
    try {
      const response = await api.get('/gallery-categories/');
      setCategories(response.data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchImages = async (categoryId: number) => {
    try {
      const response = await api.get('/gallery/', { params: { category: categoryId } });
      setImages(response.data.results || response.data || []);
    } catch (error) {
      console.error('Error fetching images:', error);
    }
  };

  const handleCategoryDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = categories.findIndex((cat) => cat.id.toString() === active.id);
      const newIndex = categories.findIndex((cat) => cat.id.toString() === over.id);

      const reorderedCategories = arrayMove(categories, oldIndex, newIndex);
      setCategories(reorderedCategories);

      // Send reorder to backend
      const categoryOrders = reorderedCategories.map((cat, index) => ({
        id: cat.id,
        order: index,
      }));

      api.patch('/gallery-categories/reorder/', { categories: categoryOrders })
        .catch((error) => {
          console.error('Error reordering categories:', error);
          fetchCategories(); // Revert on error
        });
    }
  };

  const handleCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingCategory) {
        await api.patch(`/gallery-categories/${editingCategory.id}/`, categoryFormData);
        alert('Category updated successfully!');
      } else {
        await api.post('/gallery-categories/', categoryFormData);
        alert('Category created successfully!');
      }
      fetchCategories();
      onUpdate();
      resetCategoryForm();
    } catch (error: any) {
      console.error('Error saving category:', error);
      alert(error.response?.data?.detail || error.response?.data?.name?.[0] || 'Error saving category');
    }
  };

  const handleDeleteCategory = async (id: number) => {
    try {
      await api.delete(`/gallery-categories/${id}/`);
      fetchCategories();
      onUpdate();
      if (selectedCategory === id) {
        setSelectedCategory(null);
      }
      alert('Category deleted successfully!');
    } catch (error: any) {
      console.error('Error deleting category:', error);
      alert(error.response?.data?.detail || 'Error deleting category');
    }
  };

  const handleEditCategory = (category: GalleryCategory) => {
    setEditingCategory(category);
    setCategoryFormData({
      name: category.name,
      description: category.description,
      is_active: category.is_active,
    });
    setShowCategoryForm(true);
  };

  const resetCategoryForm = () => {
    setShowCategoryForm(false);
    setEditingCategory(null);
    setCategoryFormData({
      name: '',
      description: '',
      is_active: true,
    });
  };

  const handleBulkUpload = async () => {
    if (!selectedCategory || stagedImages.length === 0) return;

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('category_id', selectedCategory.toString());

      // Separate files and URLs
      stagedImages.forEach((img) => {
        if (img.file) {
          formData.append('images', img.file);
        } else if (img.url) {
          formData.append('image_urls', img.url);
        }
      });

      const response = await api.post('/gallery/bulk_upload/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      alert(`Successfully uploaded ${response.data.total_uploaded} images!`);
      setStagedImages([]);
      fetchImages(selectedCategory);
      fetchCategories(); // Update image counts
      onUpdate();
    } catch (error: any) {
      console.error('Error uploading images:', error);
      alert(error.response?.data?.detail || 'Error uploading images');
    } finally {
      setUploading(false);
    }
  };

  const handleImageReorder = async (reorderedImages: UploadedImage[]) => {
    const imageOrders = reorderedImages.map((img) => ({
      id: img.id,
      order: img.order,
    }));

    try {
      await api.patch('/gallery/reorder/', { images: imageOrders });
    } catch (error) {
      console.error('Error reordering images:', error);
      if (selectedCategory) {
        fetchImages(selectedCategory); // Revert on error
      }
    }
  };

  const handleDeleteImage = async (id: number) => {
    try {
      await api.delete(`/gallery/${id}/`);
      if (selectedCategory) {
        fetchImages(selectedCategory);
      }
      fetchCategories(); // Update image counts
      onUpdate();
    } catch (error) {
      console.error('Error deleting image:', error);
      alert('Error deleting image');
    }
  };

  const handleRemoveStagedImage = (id: string) => {
    setStagedImages(stagedImages.filter((img) => img.id !== id));
  };

  if (loading) {
    return <div className="text-center py-8">Loading gallery...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex gap-2 border-b border-neutral-200">
        <button
          onClick={() => setActiveTab('categories')}
          className={`px-4 py-2 font-medium border-b-2 transition-colors ${
            activeTab === 'categories'
              ? 'border-primary-500 text-primary-600'
              : 'border-transparent text-neutral-600 hover:text-neutral-900'
          }`}
        >
          Categories ({categories.length})
        </button>
        <button
          onClick={() => setActiveTab('images')}
          className={`px-4 py-2 font-medium border-b-2 transition-colors ${
            activeTab === 'images'
              ? 'border-primary-500 text-primary-600'
              : 'border-transparent text-neutral-600 hover:text-neutral-900'
          }`}
        >
          Manage Images
        </button>
      </div>

      {/* Categories Tab */}
      {activeTab === 'categories' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Gallery Categories</h3>
            <button
              onClick={() => setShowCategoryForm(true)}
              className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600"
            >
              + Add Category
            </button>
          </div>

          {/* Category Form */}
          {showCategoryForm && (
            <div className="bg-neutral-50 p-6 rounded-lg border border-neutral-200">
              <h4 className="font-medium text-neutral-900 mb-4">
                {editingCategory ? 'Edit Category' : 'New Category'}
              </h4>
              <form onSubmit={handleCategorySubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Category Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={categoryFormData.name}
                    onChange={(e) => setCategoryFormData({ ...categoryFormData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={categoryFormData.description}
                    onChange={(e) => setCategoryFormData({ ...categoryFormData, description: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="category_active"
                    checked={categoryFormData.is_active}
                    onChange={(e) => setCategoryFormData({ ...categoryFormData, is_active: e.target.checked })}
                    className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                  />
                  <label htmlFor="category_active" className="text-sm text-neutral-700">
                    Active
                  </label>
                </div>
                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600"
                  >
                    {editingCategory ? 'Update Category' : 'Create Category'}
                  </button>
                  <button
                    type="button"
                    onClick={resetCategoryForm}
                    className="px-4 py-2 bg-neutral-200 text-neutral-700 rounded-lg hover:bg-neutral-300"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Categories List */}
          {categories.length === 0 ? (
            <div className="text-center py-12 text-neutral-500">
              No categories yet. Create your first category to start organizing images.
            </div>
          ) : (
            <div>
              <p className="text-sm text-neutral-500 mb-3">Drag categories to reorder</p>
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleCategoryDragEnd}
              >
                <SortableContext
                  items={categories.map((cat) => cat.id.toString())}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-2">
                    {categories.map((category) => (
                      <SortableCategory
                        key={category.id}
                        category={category}
                        onEdit={handleEditCategory}
                        onDelete={handleDeleteCategory}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            </div>
          )}
        </div>
      )}

      {/* Images Tab */}
      {activeTab === 'images' && (
        <div className="space-y-6">
          {/* Category Selector */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Select Category *
            </label>
            <select
              value={selectedCategory || ''}
              onChange={(e) => setSelectedCategory(Number(e.target.value) || null)}
              className="w-full max-w-md px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="">-- Select a category --</option>
              {categories.filter(c => c.is_active).map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name} ({cat.image_count} images)
                </option>
              ))}
            </select>
          </div>

          {selectedCategory ? (
            <>
              {/* Upload Images */}
              <div className="bg-neutral-50 p-6 rounded-lg border border-neutral-200">
                <h4 className="font-medium text-neutral-900 mb-4">Upload New Images</h4>
                <ImageUploadDnD
                  images={stagedImages}
                  onImagesChange={setStagedImages}
                  onRemove={handleRemoveStagedImage}
                  maxImages={50}
                  allowUrls={true}
                />
                {stagedImages.length > 0 && (
                  <div className="mt-4">
                    <button
                      onClick={handleBulkUpload}
                      disabled={uploading}
                      className="px-6 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {uploading ? 'Uploading...' : `Upload ${stagedImages.length} Image${stagedImages.length > 1 ? 's' : ''}`}
                    </button>
                  </div>
                )}
              </div>

              {/* Existing Images */}
              <div>
                <h4 className="font-medium text-neutral-900 mb-4">Existing Images</h4>
                <ImageReorder
                  images={images}
                  onReorder={handleImageReorder}
                  onDelete={handleDeleteImage}
                />
              </div>
            </>
          ) : (
            <div className="text-center py-12 text-neutral-500">
              Please select a category to manage images
            </div>
          )}
        </div>
      )}
    </div>
  );
}
