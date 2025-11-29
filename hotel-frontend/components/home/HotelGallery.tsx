'use client';

import React from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';

interface GalleryImage {
  src: string;
  alt: string;
  span?: 'single' | 'double';
}

const HotelGallery: React.FC = () => {
  const images: GalleryImage[] = [
    {
      src: '/images/Lira-Pipa-1024x682.jpg',
      alt: 'Elegant hotel room interior with modern furnishings',
      span: 'double'
    },
    {
      src: '/images/aspen_coffeetableround_1_.webp',
      alt: 'Stylish round coffee table with contemporary design',
      span: 'single'
    },
    {
      src: '/images/656a25603a4f6-101220336_2692262237698041_1141296651634212864_n (1).jpg',
      alt: 'Boutique hotel exterior view',
      span: 'single'
    },
    {
      src: 'https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=1200&q=80',
      alt: 'Luxurious hotel bedroom with city view',
      span: 'single'
    },
    {
      src: '/images/WhatsApp Image 2025-11-29 at 01.16.59 (1).jpeg',
      alt: 'Cozy hotel lounge area with ambient lighting',
      span: 'double'
    },
    {
      src: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=1200&q=80',
      alt: 'Elegant hotel restaurant and dining area',
      span: 'single'
    },
    {
      src: '/images/WhatsApp Image 2025-11-29 at 01.17.01.jpeg',
      alt: 'Modern hotel room detail and decor',
      span: 'single'
    },
    {
      src: 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=1200&q=80',
      alt: 'Hotel spa and wellness center with pool',
      span: 'double'
    },
    {
      src: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=1200&q=80',
      alt: 'Gourmet breakfast spread at hotel',
      span: 'single'
    },
    {
      src: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=1200&q=80',
      alt: 'Modern hotel bar with premium cocktails',
      span: 'single'
    },
    {
      src: 'https://images.unsplash.com/photo-1445019980597-93fa8acb246c?w=1200&q=80',
      alt: 'Stunning waterfront hotel terrace with ocean view',
      span: 'double'
    },
    {
      src: 'https://images.unsplash.com/photo-1566665797739-1674de7a421a?w=1200&q=80',
      alt: 'Boutique hotel lobby with elegant chandelier',
      span: 'single'
    },
    {
      src: 'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=1200&q=80',
      alt: 'Premium suite bathroom with marble finishes',
      span: 'single'
    },
    {
      src: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=1200&q=80',
      alt: 'Hotel rooftop infinity pool overlooking city',
      span: 'single'
    },
    {
      src: 'https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=1200&q=80',
      alt: 'Cozy hotel room with fireplace and mountain view',
      span: 'double'
    }
  ];

  return (
    <section className="bg-[#1a1a1a] py-20 md:py-28">
      <div className="max-w-7xl mx-auto px-6 md:px-8 lg:px-12">
        {/* Section Header */}
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <h2 className="text-sm md:text-base font-light text-neutral-400 tracking-[0.3em] uppercase mb-3">
            Gallery
          </h2>
          <p className="text-lg text-neutral-500">A glimpse of your stay</p>
        </motion.div>

        {/* Gallery Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {images.map((image, index) => (
            <motion.div
              key={index}
              className={`relative overflow-hidden rounded-2xl shadow-lg group ${
                image.span === 'double' ? 'lg:col-span-2' : 'lg:col-span-1'
              }`}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.6,
                ease: 'easeOut',
                delay: index * 0.1
              }}
              viewport={{ once: true, amount: 0.2 }}
              whileHover={{ scale: 1.02 }}
            >
              <div className="relative w-full h-64 md:h-80 lg:h-96 overflow-hidden">
                <Image
                  src={image.src}
                  alt={image.alt}
                  fill
                  className="object-cover transition-all duration-500 group-hover:scale-110 group-hover:brightness-110"
                  sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  quality={100}
                  priority={index < 3}
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all duration-500"></div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HotelGallery;
