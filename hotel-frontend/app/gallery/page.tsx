'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
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

const CATEGORY_LABELS: { [key: string]: string } = {
  'HOTEL': 'Hotel',
  'ROOM': 'Rooms',
  'DINING': 'Dining',
  'FACILITIES': 'Facilities',
  'EVENTS': 'Events',
  'OTHER': 'Other',
};

export default function GalleryPage() {
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('');

  useEffect(() => {
    fetchImages();
  }, [selectedCategory]);

  const fetchImages = async () => {
    try {
      const params = selectedCategory ? { category: selectedCategory } : {};
      const response = await api.get('/gallery/', { params });
      const data = response.data.results || response.data || [];
      // Filter to only show active images and sort by order
      const activeImages = data
        .filter((img: GalleryImage) => img.is_active)
        .sort((a: GalleryImage, b: GalleryImage) => a.order - b.order);
      setImages(activeImages);
    } catch (error) {
      console.error('Error fetching gallery images:', error);
    } finally {
      setLoading(false);
    }
  };

  const categories = Object.keys(CATEGORY_LABELS);

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative h-[300px] flex items-center justify-center bg-gradient-to-r from-primary-500 to-primary-700">
        <div className="text-center text-white px-4">
          <h1 className="text-5xl md:text-6xl font-display font-bold mb-4">Gallery</h1>
          <p className="text-xl">Explore our beautiful hotel and facilities</p>
        </div>
      </section>

      {/* Category Filter */}
      <section className="py-8 bg-white border-b">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap gap-3 justify-center">
            <button
              onClick={() => setSelectedCategory('')}
              className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                selectedCategory === ''
                  ? 'bg-primary-500 text-white'
                  : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
              }`}
            >
              All
            </button>
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                  selectedCategory === category
                    ? 'bg-primary-500 text-white'
                    : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                }`}
              >
                {CATEGORY_LABELS[category]}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Gallery Grid */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          {loading ? (
            <div className="text-center py-12">
              <p className="text-lg text-neutral-600">Loading gallery...</p>
            </div>
          ) : images.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-lg text-neutral-600">No images available in this category.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {images.map((image) => (
                <div key={image.id} className="group relative h-80 overflow-hidden rounded-lg shadow-lg cursor-pointer">
                  <img
                    src={image.image_display || image.image_url}
                    alt={image.title}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                      <p className="text-sm font-medium mb-1">{CATEGORY_LABELS[image.category]}</p>
                      <h3 className="text-xl font-semibold">{image.title}</h3>
                      {image.description && (
                        <p className="text-sm mt-2 opacity-90">{image.description}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-neutral-50">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-display font-bold mb-4">Ready to Experience Sunlake Hotel?</h2>
          <p className="text-lg text-neutral-600 mb-8">Book your stay and create unforgettable memories</p>
          <a
            href="/rooms"
            className="inline-block bg-primary-500 hover:bg-primary-600 text-white px-8 py-4 rounded-lg text-lg font-medium transition-colors"
          >
            View Our Rooms
          </a>
        </div>
      </section>
    </div>
  );
}
