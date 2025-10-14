import React from 'react';
import type { Viewing, Property } from '../types';
import * as Icons from './Icons';

interface BookingConfirmationProps {
  bookingDetails: { viewing: Viewing; property: Property };
  onGoToDashboard: () => void;
  onBrowseMore: () => void;
}

const BookingConfirmation: React.FC<BookingConfirmationProps> = ({ bookingDetails, onGoToDashboard, onBrowseMore }) => {
  const { viewing, property } = bookingDetails;
  const scheduledDate = viewing.scheduledAt ? new Date(viewing.scheduledAt) : null;

  return (
    <div className="max-w-2xl mx-auto text-center py-12 px-4">
      <div className="inline-block bg-green-100 p-4 rounded-full mb-4">
        <Icons.CheckCircleIcon className="w-12 h-12 text-green-600" />
      </div>
      <h1 className="text-3xl font-bold text-neutral-800 mb-2">Viewing Requested Successfully!</h1>
      <p className="text-neutral-600 mb-8">The owner has been notified. You can track the status of your request in your dashboard.</p>

      <div className="bg-white p-6 rounded-lg shadow-md border text-left mb-8">
        <h2 className="text-xl font-bold mb-4">Booking Summary</h2>
        <div className="flex flex-col sm:flex-row gap-4">
          <img src={property.images[0]} alt={property.title} className="w-full sm:w-1/3 h-32 object-cover rounded-lg" />
          <div className="flex-grow">
            <h3 className="font-bold text-lg">{property.title}</h3>
            <p className="text-sm text-neutral-600">{property.address}</p>
            {scheduledDate && (
              <div className="mt-3 pt-3 border-t">
                <div className="flex items-center gap-2 text-sm">
                  <Icons.CalendarDaysIcon className="w-5 h-5 text-primary" />
                  <span className="font-semibold">Proposed Date:</span>
                  <span>{scheduledDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                </div>
                <div className="flex items-center gap-2 text-sm mt-1">
                  <Icons.ClockIcon className="w-5 h-5 text-primary" />
                  <span className="font-semibold">Proposed Time:</span>
                  <span>{scheduledDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <button
          onClick={onGoToDashboard}
          className="w-full sm:w-auto px-6 py-3 bg-primary hover:bg-secondary text-white font-bold rounded-lg transition-colors duration-300"
        >
          Go to My Dashboard
        </button>
        <button
          onClick={onBrowseMore}
          className="w-full sm:w-auto px-6 py-3 bg-neutral-200 hover:bg-neutral-300 text-neutral-800 font-bold rounded-lg transition-colors duration-300"
        >
          Browse More Properties
        </button>
      </div>
    </div>
  );
};

export default BookingConfirmation;