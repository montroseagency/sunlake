'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function BookingPage() {
  const [step, setStep] = useState(1);

  return (
    <div className="min-h-screen bg-neutral-50 py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <h1 className="text-4xl font-display font-bold text-center mb-8">Book Your Stay</h1>

        {/* Progress Steps */}
        <div className="flex justify-between mb-12">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center flex-1">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                step >= s ? 'bg-primary-500 text-white' : 'bg-neutral-300 text-neutral-600'
              }`}>
                {s}
              </div>
              {s < 3 && <div className={`flex-1 h-1 mx-4 ${step > s ? 'bg-primary-500' : 'bg-neutral-300'}`} />}
            </div>
          ))}
        </div>

        <div className="bg-white rounded-lg shadow-lg p-8">
          {step === 1 && (
            <div>
              <h2 className="text-2xl font-bold mb-6">Step 1: Select Room & Dates</h2>
              <p className="text-neutral-700 mb-6">
                Browse our available rooms and select your preferred dates.
              </p>
              <Link
                href="/rooms"
                className="inline-block bg-primary-500 hover:bg-primary-600 text-white px-6 py-3 rounded-lg font-medium transition-colors"
              >
                Browse Rooms
              </Link>
            </div>
          )}

          {step === 2 && (
            <div>
              <h2 className="text-2xl font-bold mb-6">Step 2: Guest Information</h2>
              <p className="text-neutral-700">Guest details form will go here...</p>
            </div>
          )}

          {step === 3 && (
            <div>
              <h2 className="text-2xl font-bold mb-6">Step 3: Confirmation</h2>
              <p className="text-neutral-700">Booking summary and confirmation...</p>
            </div>
          )}

          <div className="mt-8 pt-8 border-t border-neutral-200 flex justify-between">
            {step > 1 && (
              <button
                onClick={() => setStep(step - 1)}
                className="px-6 py-2 border-2 border-neutral-300 rounded-lg hover:bg-neutral-50 transition-colors"
              >
                Previous
              </button>
            )}
            {step < 3 && (
              <button
                onClick={() => setStep(step + 1)}
                className="ml-auto bg-primary-500 hover:bg-primary-600 text-white px-6 py-2 rounded-lg transition-colors"
              >
                Next Step
              </button>
            )}
          </div>
        </div>

        {/* Help Section */}
        <div className="mt-8 text-center">
          <p className="text-neutral-600 mb-2">Need help with your booking?</p>
          <Link href="/contact" className="text-primary-500 hover:underline font-medium">
            Contact Our Reservation Team
          </Link>
        </div>
      </div>
    </div>
  );
}
