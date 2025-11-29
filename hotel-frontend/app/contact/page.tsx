'use client';

import { useState } from 'react';
import api from '@/lib/api';

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
  });
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await api.post('/contact/', formData);
      setSubmitted(true);
      setFormData({
        name: '',
        email: '',
        phone: '',
        subject: '',
        message: '',
      });
      setTimeout(() => setSubmitted(false), 5000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to send message. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative h-[300px] flex items-center justify-center bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50">
        <div className="text-center text-neutral-900 px-4">
          <h1 className="text-5xl md:text-6xl font-display font-bold mb-4">Contact Us</h1>
          <p className="text-xl">We'd love to hear from you</p>
        </div>
      </section>

      {/* Contact Content */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Contact Info */}
            <div>
              <h2 className="text-3xl font-display font-bold mb-4">Get in Touch</h2>
              <p className="text-neutral-600 mb-8 leading-relaxed">
                Have a question or need assistance? Our team is here to help. Reach out to us through any of the following channels.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Address Card */}
                <div
                  className="card-3d group"
                  style={{ animation: 'fadeInUp 0.5s ease-out 0.1s both' }}
                >
                  <div className="card-3d-inner bg-white rounded-2xl p-8 h-full shadow-xl hover:shadow-2xl transition-all duration-500 relative overflow-hidden">
                    {/* Gradient Top Border */}
                    <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-500 to-orange-500 transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-500"></div>

                    <div className="relative z-10">
                      <h3 className="text-2xl font-bold mb-4 text-neutral-900 group-hover:scale-105 transition-transform duration-300">
                        Address
                      </h3>
                      <p className="text-neutral-600 leading-relaxed group-hover:text-neutral-700 transition-all">
                        123 Luxury Avenue<br />
                        Miami, FL 33139<br />
                        United States
                      </p>
                    </div>

                    {/* Bottom Accent Line */}
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 to-orange-500 transform origin-right scale-x-0 group-hover:scale-x-100 transition-transform duration-500 delay-100"></div>
                  </div>
                </div>

                {/* Phone Card */}
                <div
                  className="card-3d group"
                  style={{ animation: 'fadeInUp 0.5s ease-out 0.2s both' }}
                >
                  <div className="card-3d-inner bg-white rounded-2xl p-8 h-full shadow-xl hover:shadow-2xl transition-all duration-500 relative overflow-hidden">
                    {/* Gradient Top Border */}
                    <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-500 to-orange-500 transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-500"></div>

                    <div className="relative z-10">
                      <h3 className="text-2xl font-bold mb-4 text-neutral-900 group-hover:scale-105 transition-transform duration-300">
                        Phone
                      </h3>
                      <p className="text-neutral-600 leading-relaxed group-hover:text-neutral-700 transition-all">
                        <span className="block">Front Desk: +1 (555) 123-4567</span>
                        <span className="block">Reservations: +1 (555) 123-4568</span>
                      </p>
                    </div>

                    {/* Bottom Accent Line */}
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 to-orange-500 transform origin-right scale-x-0 group-hover:scale-x-100 transition-transform duration-500 delay-100"></div>
                  </div>
                </div>

                {/* Email Card */}
                <div
                  className="card-3d group"
                  style={{ animation: 'fadeInUp 0.5s ease-out 0.3s both' }}
                >
                  <div className="card-3d-inner bg-white rounded-2xl p-8 h-full shadow-xl hover:shadow-2xl transition-all duration-500 relative overflow-hidden">
                    {/* Gradient Top Border */}
                    <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-500 to-orange-500 transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-500"></div>

                    <div className="relative z-10">
                      <h3 className="text-2xl font-bold mb-4 text-neutral-900 group-hover:scale-105 transition-transform duration-300">
                        Email
                      </h3>
                      <p className="text-neutral-600 leading-relaxed group-hover:text-neutral-700 transition-all">
                        <span className="block">General: info@sunlakehotel.com</span>
                        <span className="block">Reservations: bookings@sunlakehotel.com</span>
                      </p>
                    </div>

                    {/* Bottom Accent Line */}
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 to-orange-500 transform origin-right scale-x-0 group-hover:scale-x-100 transition-transform duration-500 delay-100"></div>
                  </div>
                </div>

                {/* Hours Card */}
                <div
                  className="card-3d group"
                  style={{ animation: 'fadeInUp 0.5s ease-out 0.4s both' }}
                >
                  <div className="card-3d-inner bg-white rounded-2xl p-8 h-full shadow-xl hover:shadow-2xl transition-all duration-500 relative overflow-hidden">
                    {/* Gradient Top Border */}
                    <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-500 to-orange-500 transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-500"></div>

                    <div className="relative z-10">
                      <h3 className="text-2xl font-bold mb-4 text-neutral-900 group-hover:scale-105 transition-transform duration-300">
                        Hours
                      </h3>
                      <p className="text-neutral-600 leading-relaxed group-hover:text-neutral-700 transition-all">
                        <span className="block">Front Desk: 24/7</span>
                        <span className="block">Check-in: 3:00 PM</span>
                        <span className="block">Check-out: 11:00 AM</span>
                      </p>
                    </div>

                    {/* Bottom Accent Line */}
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 to-orange-500 transform origin-right scale-x-0 group-hover:scale-x-100 transition-transform duration-500 delay-100"></div>
                  </div>
                </div>
              </div>

              {/* Map Placeholder */}
              <div
                className="mt-8 h-64 bg-neutral-200 rounded-xl flex items-center justify-center overflow-hidden shadow-sm"
                style={{ animation: 'fadeInUp 0.5s ease-out 0.5s both' }}
              >
                <p className="text-neutral-600">Map Placeholder - Integrate Google Maps</p>
              </div>
            </div>

            <style jsx>{`
              @keyframes fadeInUp {
                from {
                  opacity: 0;
                  transform: translateY(30px);
                }
                to {
                  opacity: 1;
                  transform: translateY(0);
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

            {/* Contact Form */}
            <div>
              <div className="bg-white rounded-lg shadow-lg p-8">
                <h2 className="text-2xl font-bold mb-6">Send us a Message</h2>

                {submitted && (
                  <div className="mb-6 p-4 bg-green-500 text-white rounded-lg">
                    Thank you! Your message has been sent successfully. We will get back to you soon!
                  </div>
                )}

                {error && (
                  <div className="mb-6 p-4 bg-red-500 text-white rounded-lg">
                    {error}
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">
                      Name <span className="text-error">*</span>
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="Your full name"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-1">
                        Email <span className="text-error">*</span>
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        placeholder="your@email.com"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-1">
                        Phone
                      </label>
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        placeholder="+1 (555) 123-4567"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">
                      Subject <span className="text-error">*</span>
                    </label>
                    <select
                      name="subject"
                      value={formData.subject}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    >
                      <option value="">Select a subject</option>
                      <option value="reservation">Reservation Inquiry</option>
                      <option value="general">General Question</option>
                      <option value="feedback">Feedback</option>
                      <option value="event">Event Booking</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">
                      Message <span className="text-error">*</span>
                    </label>
                    <textarea
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      required
                      rows={6}
                      className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                      placeholder="How can we help you?"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 hover:from-amber-100 hover:via-orange-100 hover:to-yellow-100 text-neutral-900 py-3 rounded-lg font-medium shadow-md hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-300 border border-neutral-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Sending...' : 'Send Message'}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
