'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface CardData {
  title: string;
  description: string;
}

const HotelHighlights: React.FC = () => {
  const cards: CardData[] = [
    {
      title: "Unique and personal",
      description: "Our wish is to offer you a unique and more personal hotel experience. We want you to feel at home when you're staying with us – with a warm atmosphere, attentive staff, and details that make your stay memorable."
    },
    {
      title: "The extra mile",
      description: "We focus on delivering that little extra that makes your stay special: curated local tips, complimentary access to a nearby fitness center, and handpicked restaurant recommendations."
    },
    {
      title: "Transport and parking",
      description: "The airport coach and most city buses stop just a short walk from the hotel. Nearby parking and clear directions make arriving and departing simple, whether you travel by car or public transport."
    }
  ];

  return (
    <section className="bg-[#f3e9da] py-20 md:py-24">
      <div className="max-w-6xl mx-auto px-4 md:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          viewport={{ once: true, amount: 0.3 }}
        >
          <h2 className="text-4xl md:text-5xl font-semibold text-neutral-900 mb-4">
            Welcome to our Boutique hotel
          </h2>
          <p className="text-lg md:text-xl text-neutral-600 max-w-2xl mx-auto">
            A unique hotel experience in Bergen.
          </p>
        </motion.div>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 mt-12">
          {cards.map((card, index) => (
            <motion.div
              key={index}
              className="flex flex-col h-full bg-white rounded-3xl shadow-[0_18px_45px_rgba(15,23,42,0.06)] p-8 transition-transform duration-300"
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              whileHover={{ y: -8, scale: 1.02 }}
              transition={{
                duration: 0.6,
                ease: "easeOut",
                delay: index * 0.15
              }}
              viewport={{ once: true, amount: 0.3 }}
            >
              <h3 className="text-2xl font-semibold text-neutral-900 mb-4">
                {card.title}
              </h3>
              <p className="text-base md:text-lg text-neutral-700 leading-relaxed">
                {card.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HotelHighlights;
