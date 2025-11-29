'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Testimonial {
  title: string;
  text: string;
  name: string;
  location: string;
  source: string;
}

const GuestReviewsCarousel: React.FC = () => {
  const [activeIndex, setActiveIndex] = useState(0);

  const testimonials: Testimonial[] = [
    {
      title: "Outstanding Experience",
      text: "Sunlake Hotel offers an incredible location right in the heart of the city, just steps away from major attractions. The rooms were impeccably clean, and the staff went above and beyond to make our stay memorable. We would absolutely return!",
      name: "Sarah",
      location: "Seattle, USA",
      source: "TripAdvisor"
    },
    {
      title: "Cozy and Inviting",
      text: "The atmosphere at Sunlake is wonderfully warm and welcoming. Breakfast was exceptional with plenty of fresh options, and the front desk team provided excellent recommendations for local restaurants and hidden gems. Highly recommend!",
      name: "Marcus",
      location: "Copenhagen, Denmark",
      source: "Google Reviews"
    },
    {
      title: "Ideal Weekend Retreat",
      text: "We enjoyed wonderfully peaceful rooms with incredibly comfortable beds. The hotel's proximity to public transportation made exploring the area effortless, and our room had a stunning view. Perfect for a relaxing getaway!",
      name: "Emily",
      location: "Barcelona, Spain",
      source: "Booking.com"
    }
  ];

  const nextTestimonial = () => {
    setActiveIndex((prev) => (prev + 1) % testimonials.length);
  };

  const prevTestimonial = () => {
    setActiveIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  const goToTestimonial = (index: number) => {
    setActiveIndex(index);
  };

  // Auto-play functionality
  useEffect(() => {
    const interval = setInterval(() => {
      nextTestimonial();
    }, 8000);

    return () => clearInterval(interval);
  }, [activeIndex]);

  return (
    <section
      className="relative py-20 md:py-24 bg-cover bg-center"
      style={{
        backgroundImage: 'url(/images/Lira-Pipa-1024x682.jpg)',
      }}
    >
      {/* Overlay */}
      <div className="absolute inset-0 bg-neutral-900/75"></div>

      {/* Content */}
      <div className="relative z-10 max-w-5xl mx-auto px-4 md:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <h2 className="text-4xl md:text-5xl font-display font-bold text-white mb-4">
            Guest Reviews
          </h2>
          <p className="text-lg md:text-xl text-neutral-300">
            Hear what our guests have to say about their stay
          </p>
        </motion.div>

        {/* Carousel Container */}
        <div className="relative">
          {/* Left Arrow */}
          <button
            onClick={prevTestimonial}
            className="absolute top-1/2 -translate-y-1/2 left-4 md:left-12 z-20 w-12 h-12 rounded-full bg-secondary-500 hover:bg-secondary-600 text-white flex items-center justify-center transition-all duration-300 hover:scale-110 shadow-lg"
            aria-label="Previous review"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          {/* Right Arrow */}
          <button
            onClick={nextTestimonial}
            className="absolute top-1/2 -translate-y-1/2 right-4 md:right-12 z-20 w-12 h-12 rounded-full bg-secondary-500 hover:bg-secondary-600 text-white flex items-center justify-center transition-all duration-300 hover:scale-110 shadow-lg"
            aria-label="Next review"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>

          {/* Testimonial Card */}
          <div className="max-w-5xl mx-auto px-16 md:px-20">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeIndex}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.35, ease: "easeOut" }}
                whileHover={{ scale: 1.01 }}
                className="bg-white rounded-2xl shadow-xl p-6 md:p-10 transition-transform duration-300"
              >
                <div className="flex flex-col md:flex-row md:items-center md:gap-8">
                  {/* Left side - Quote and Title */}
                  <div className="md:w-1/3 mb-4 md:mb-0">
                    <div className="text-5xl text-secondary-500 mb-3 leading-none">&ldquo;</div>
                    <h3 className="text-xl md:text-2xl font-bold text-neutral-900">
                      {testimonials[activeIndex].title}
                    </h3>
                  </div>

                  {/* Right side - Review and Author */}
                  <div className="md:w-2/3 md:border-l md:border-neutral-200 md:pl-8">
                    {/* Review Text */}
                    <p className="text-base text-neutral-700 leading-relaxed mb-4">
                      {testimonials[activeIndex].text}
                    </p>

                    {/* Author Info */}
                    <div className="flex items-center justify-between pt-4 border-t border-neutral-100">
                      <div>
                        <p className="font-semibold text-base text-neutral-900">
                          {testimonials[activeIndex].name}
                        </p>
                        <p className="text-sm text-neutral-600">
                          {testimonials[activeIndex].location}
                        </p>
                      </div>
                      <div className="text-xs text-neutral-500 italic">
                        {testimonials[activeIndex].source}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Dots Indicators */}
          <div className="flex items-center justify-center gap-2 mt-8">
            {testimonials.map((_, index) => (
              <button
                key={index}
                onClick={() => goToTestimonial(index)}
                className={`rounded-full transition-all duration-300 ${
                  index === activeIndex
                    ? 'w-10 h-3 bg-secondary-500'
                    : 'w-3 h-3 bg-neutral-400 hover:bg-neutral-300'
                }`}
                aria-label={`Go to review ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default GuestReviewsCarousel;
