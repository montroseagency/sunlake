import Link from 'next/link';
import HotelHighlights from '@/components/home/HotelHighlights';
import GuestReviewsCarousel from '@/components/home/GuestReviewsCarousel';
import HotelGallery from '@/components/home/HotelGallery';

export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative h-[600px] flex items-center justify-center text-white">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: 'url(https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1920)',
            filter: 'brightness(0.7)'
          }}
        />
        <div className="relative z-10 text-center px-4 max-w-4xl">
          <h1 className="text-5xl md:text-6xl font-display font-bold mb-4">
            Welcome to Sunlake Hotel
          </h1>
          <p className="text-xl md:text-2xl mb-8 text-neutral-100">
            Experience Luxury & Comfort
          </p>
          <div className="flex gap-4 justify-center">
            <Link
              href="/rooms"
              className="bg-primary-500 hover:bg-primary-600 text-white px-6 py-3 rounded-lg text-lg font-medium transition-colors"
            >
              Explore Rooms
            </Link>
            <Link
              href="/booking"
              className="bg-white bg-opacity-10 backdrop-blur-sm border-2 border-white text-white hover:bg-white hover:text-primary-500 px-6 py-3 rounded-lg text-lg font-medium transition-all"
            >
              Book Now
            </Link>
          </div>
        </div>
      </section>

      {/* Hotel Highlights Section - Boutique Style */}
      <HotelHighlights />

      {/* Hotel Gallery */}
      <HotelGallery />

      {/* Guest Reviews Carousel */}
      <GuestReviewsCarousel />

      {/* CTA Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-display font-bold mb-4">Ready to Book Your Stay?</h2>
          <p className="text-lg text-neutral-600 mb-8">
            Browse our luxurious rooms and find the perfect accommodation for you
          </p>
          <Link
            href="/rooms"
            className="inline-block bg-primary-500 hover:bg-primary-600 text-white px-8 py-4 rounded-lg text-lg font-medium transition-colors"
          >
            View All Rooms
          </Link>
        </div>
      </section>
    </div>
  );
}
