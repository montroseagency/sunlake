'use client';

import { useState } from 'react';
import Image from 'next/image';

export default function AboutPage() {
  const [openValue, setOpenValue] = useState<number | null>(null);

  const toggleValue = (index: number) => {
    setOpenValue(openValue === index ? null : index);
  };

  const values = [
    {
      title: 'Excellence',
      summary: 'We strive for perfection in every detail.',
      description: 'We strive for perfection in every detail, from our rooms to our service, ensuring an exceptional experience. Our commitment to excellence means continuous improvement, attention to the smallest details, and never settling for anything less than outstanding. Every member of our team is trained to uphold the highest standards of quality and service.'
    },
    {
      title: 'Hospitality',
      summary: 'Genuine warmth and care are at the heart of everything we do.',
      description: 'Genuine warmth and care are at the heart of everything we do. Your comfort is our priority. We believe in treating every guest like family, anticipating needs before they arise, and creating personalized experiences that make each stay memorable. Our hospitality goes beyond service—it\'s about creating genuine connections and moments of delight.'
    },
    {
      title: 'Sustainability',
      summary: 'We\'re committed to environmental responsibility.',
      description: 'We\'re committed to environmental responsibility, implementing eco-friendly practices throughout our operations. From energy-efficient systems to waste reduction programs, locally sourced amenities, and water conservation initiatives, we actively work to minimize our environmental impact while maintaining the luxury experience our guests expect.'
    }
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative h-[400px] flex items-center justify-center">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: 'url(https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=1920)',
            filter: 'brightness(0.6)'
          }}
        />
        <div className="relative z-10 text-center text-white px-4">
          <h1 className="text-5xl md:text-6xl font-display font-bold mb-4">About Sunlake Hotel</h1>
          <p className="text-xl">Luxury, Comfort, and Unforgettable Experiences</p>
        </div>
      </section>

      {/* Our Story */}
      <section className="py-16 bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 overflow-hidden">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div className="animate-slideInLeft">
              <h2 className="text-4xl font-display font-bold mb-6">Our Story</h2>
              <p className="text-neutral-700 leading-relaxed mb-4">
                Founded in 2010, Sunlake Hotel has been a beacon of luxury and hospitality in the heart of the city.
                Our journey began with a simple vision: to create a home away from home where every guest feels special
                and every stay becomes a cherished memory.
              </p>
              <p className="text-neutral-700 leading-relaxed mb-4">
                Over the years, we've grown from a boutique hotel to a premier destination, yet we've never lost sight
                of what matters most - personalized service, attention to detail, and creating extraordinary experiences
                for our guests.
              </p>
              <p className="text-neutral-700 leading-relaxed">
                Today, Sunlake Hotel stands as a testament to our commitment to excellence, combining modern amenities
                with timeless elegance to offer an unparalleled hospitality experience.
              </p>
            </div>
            <div className="relative h-96 animate-slideInRight group">
              <div className="absolute inset-0 bg-gradient-to-r from-primary-500 to-amber-500 rounded-lg transform rotate-3 group-hover:rotate-6 transition-transform duration-500"></div>
              <Image
                src="https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800"
                alt="Hotel Building"
                fill
                className="object-cover rounded-lg shadow-xl relative z-10 transform group-hover:scale-105 transition-transform duration-500"
              />
            </div>
          </div>
        </div>
        <style jsx>{`
          @keyframes slideInLeft {
            from {
              opacity: 0;
              transform: translateX(-100px);
            }
            to {
              opacity: 1;
              transform: translateX(0);
            }
          }

          @keyframes slideInRight {
            from {
              opacity: 0;
              transform: translateX(100px);
            }
            to {
              opacity: 1;
              transform: translateX(0);
            }
          }

          .animate-slideInLeft {
            animation: slideInLeft 0.8s ease-out;
          }

          .animate-slideInRight {
            animation: slideInRight 0.8s ease-out;
          }
        `}</style>
      </section>

      {/* Our Values */}
      <section className="py-16 bg-neutral-50">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-display font-bold mb-12">Our Values</h2>
          <div className="max-w-5xl space-y-4">
            {values.map((value, index) => (
              <div
                key={index}
                className="bg-white rounded-lg shadow-md overflow-hidden transition-all duration-300 hover:shadow-xl transform hover:-translate-y-1"
                style={{
                  animation: `slideInLeft 0.5s ease-out ${index * 0.1}s both`
                }}
              >
                <button
                  onClick={() => toggleValue(index)}
                  className="w-full px-8 py-6 flex justify-between items-center hover:bg-neutral-50 transition-colors group"
                >
                  <div className="text-left flex-1">
                    <h3 className="text-2xl font-semibold text-neutral-900 mb-1 group-hover:text-primary-600 transition-colors">
                      {value.title}
                    </h3>
                    <p className="text-neutral-600">{value.summary}</p>
                  </div>
                  <svg
                    className={`w-6 h-6 text-primary-500 transition-transform duration-300 ml-4 flex-shrink-0 ${
                      openValue === index ? 'rotate-180' : ''
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>
                <div
                  className={`overflow-hidden transition-all duration-500 ease-in-out ${
                    openValue === index ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                  }`}
                >
                  <div className="px-8 pb-6 pt-2 border-t border-neutral-100">
                    <p className="text-neutral-700 leading-relaxed animate-fadeIn">
                      {value.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <style jsx>{`
          @keyframes slideInLeft {
            from {
              opacity: 0;
              transform: translateX(-50px);
            }
            to {
              opacity: 1;
              transform: translateX(0);
            }
          }
          @keyframes fadeIn {
            from {
              opacity: 0;
            }
            to {
              opacity: 1;
            }
          }
        `}</style>
      </section>

      {/* Why Choose Us Section */}
      <section className="py-20 bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 relative overflow-hidden">
        {/* Animated Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="snake-line"></div>
          <div className="snake-line" style={{ animationDelay: '2s' }}></div>
          <div className="snake-line" style={{ animationDelay: '4s' }}></div>
        </div>

        <div className="container mx-auto px-4 relative z-10">
          {/* Header Section with Better Typography */}
          <div className="text-center mb-16">
            <h2 className="text-5xl md:text-6xl font-display font-bold mb-6 text-neutral-900 leading-tight">
              Why Choose Sunlake Hotel
            </h2>
            <div className="w-32 h-1 bg-gradient-to-r from-primary-500 to-amber-500 mx-auto mb-6 rounded-full"></div>
            <p className="text-xl md:text-2xl text-neutral-900 max-w-4xl mx-auto leading-relaxed font-light">
              Experience the perfect blend of luxury, comfort, and exceptional service that sets us apart from the rest.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                title: 'Prime Location',
                description: 'Situated in the heart of the city with easy access to major attractions, shopping districts, and business centers.'
              },
              {
                title: '24/7 Concierge Service',
                description: 'Our dedicated team is available around the clock to assist with reservations, recommendations, and any special requests.'
              },
              {
                title: 'Luxurious Amenities',
                description: 'State-of-the-art fitness center, rooftop pool, spa facilities, and business center at your disposal.'
              },
              {
                title: 'Award-Winning Dining',
                description: 'Experience culinary excellence at our on-site restaurants featuring international and local cuisine.'
              },
              {
                title: 'Smart Room Technology',
                description: 'Modern rooms equipped with smart controls, high-speed WiFi, and premium entertainment systems.'
              },
              {
                title: 'Flexible Event Spaces',
                description: 'Versatile meeting rooms and banquet halls perfect for conferences, weddings, and special celebrations.'
              }
            ].map((feature, index) => (
              <div
                key={index}
                className="card-3d group"
                style={{
                  animation: `snakeIn 0.8s ease-out ${index * 0.15}s both`
                }}
              >
                <div className="card-3d-inner bg-white rounded-2xl p-8 h-full shadow-xl hover:shadow-2xl transition-all duration-500 relative overflow-hidden">
                  {/* Gradient Top Border */}
                  <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-500 to-orange-500 transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-500"></div>

                  {/* Number Badge */}
                  <div className="absolute top-6 right-6 w-12 h-12 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center text-white font-bold text-lg opacity-20 group-hover:opacity-100 transition-opacity duration-500">
                    {index + 1}
                  </div>

                  <div className="relative z-10">
                    <h3 className="text-2xl font-bold mb-4 text-neutral-900 group-hover:scale-105 transition-transform duration-300">
                      {feature.title}
                    </h3>
                    <p className="text-neutral-600 leading-relaxed group-hover:text-neutral-700 transition-all">
                      {feature.description}
                    </p>
                  </div>

                  {/* Bottom Accent Line */}
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 to-orange-500 transform origin-right scale-x-0 group-hover:scale-x-100 transition-transform duration-500 delay-100"></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <style jsx>{`
          .snake-line {
            position: absolute;
            width: 200%;
            height: 2px;
            background: linear-gradient(90deg,
              transparent 0%,
              rgba(251, 191, 36, 0.3) 25%,
              rgba(245, 158, 11, 0.5) 50%,
              rgba(251, 191, 36, 0.3) 75%,
              transparent 100%);
            animation: snakeMove 8s linear infinite;
            top: 20%;
          }

          .snake-line:nth-child(2) {
            top: 50%;
            animation-duration: 10s;
          }

          .snake-line:nth-child(3) {
            top: 80%;
            animation-duration: 12s;
          }

          @keyframes snakeMove {
            0% {
              transform: translateX(-50%) translateY(0) rotate(0deg);
            }
            50% {
              transform: translateX(-25%) translateY(-20px) rotate(2deg);
            }
            100% {
              transform: translateX(0%) translateY(0) rotate(0deg);
            }
          }

          @keyframes snakeIn {
            0% {
              opacity: 0;
              transform: translateX(-100px) translateY(30px) rotateY(-20deg);
            }
            100% {
              opacity: 1;
              transform: translateX(0) translateY(0) rotateY(0deg);
            }
          }

          .card-3d {
            perspective: 1000px;
          }

          .card-3d-inner {
            transform-style: preserve-3d;
            transition: transform 0.6s cubic-bezier(0.23, 1, 0.32, 1);
          }

          .card-3d:hover .card-3d-inner {
            transform: translateY(-12px) rotateX(5deg) rotateY(-5deg) scale(1.02);
          }

          .card-3d:nth-child(even):hover .card-3d-inner {
            transform: translateY(-12px) rotateX(5deg) rotateY(5deg) scale(1.02);
          }
        `}</style>
      </section>

    </div>
  );
}
