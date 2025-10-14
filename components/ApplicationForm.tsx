import React, { useState } from 'react';
import type { Property } from '../types';
import { UploadIcon } from './Icons';

interface BookViewingFormProps {
  property: Property;
  onSubmit: (property: Property, details: { proposedDateTime: string; verificationData: any }) => void;
  onBack: () => void;
}

const timeSlots = [
    '10:00 AM - 11:00 AM',
    '11:00 AM - 12:00 PM',
    '02:00 PM - 03:00 PM',
    '03:00 PM - 04:00 PM',
    '04:00 PM - 05:00 PM',
];

const getNextSevenDays = () => {
    const days = [];
    const today = new Date();
    for (let i = 1; i <= 7; i++) {
        const nextDay = new Date(today);
        nextDay.setDate(today.getDate() + i);
        days.push(nextDay);
    }
    return days;
};

const BookViewingForm: React.FC<BookViewingFormProps> = ({ property, onSubmit, onBack }) => {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState('');
  const [verificationData, setVerificationData] = useState({
      fullName: '',
      employmentDetails: '',
      idProof: null as File | null,
  });
  const [error, setError] = useState('');
  
  const availableDays = getNextSevenDays();

  const handleVerificationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const { name, value } = e.target;
      setVerificationData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
          setVerificationData(prev => ({ ...prev, idProof: e.target.files![0] }));
      }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDate || !selectedTimeSlot) {
        setError('Please select both a date and a time slot for your viewing.');
        return;
    }
    if (!verificationData.fullName || !verificationData.employmentDetails) {
        setError('Please fill in all verification details.');
        return;
    }
    setError('');
    
    const startTime = selectedTimeSlot.split(' - ')[0];
    const dateString = selectedDate.toISOString().split('T')[0];
    const proposedDateTime = new Date(`${dateString} ${startTime}`).toISOString();
    
    const finalVerificationData = {
        fullName: verificationData.fullName,
        employmentDetails: verificationData.employmentDetails,
        // In a real app, you would upload this file and get a URL.
        // For this demo, we'll use a placeholder PDF URL for display.
        idProofUrl: verificationData.idProof ? 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf' : undefined,
    };
    
    onSubmit(property, { proposedDateTime, verificationData: finalVerificationData });
  };

  const formatDate = (date: Date) => date.toLocaleDateString('en-US', { day: 'numeric' });
  const formatDay = (date: Date) => date.toLocaleDateString('en-US', { weekday: 'short' });

  return (
    <div className="max-w-4xl mx-auto bg-white p-8 rounded-lg shadow-xl">
       <button onClick={onBack} className="mb-6 text-sm font-medium text-primary hover:underline">
            &larr; Back to Property Details
        </button>
        <div className="grid md:grid-cols-2 gap-8 md:gap-12">
            <div className="order-2 md:order-1">
                <h2 className="text-3xl font-bold mb-2">Book a Visit & Verify</h2>
                <p className="text-neutral-600 mb-6">Complete your verification and select a time to visit the property.</p>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-lg font-semibold text-gray-800 mb-3">1. Background Verification</label>
                        <div className="space-y-4">
                            <div>
                                <label htmlFor="fullName" className="block text-sm font-medium text-gray-700">Full Name</label>
                                <input type="text" id="fullName" name="fullName" value={verificationData.fullName} onChange={handleVerificationChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary" required />
                            </div>
                            <div>
                                <label htmlFor="employmentDetails" className="block text-sm font-medium text-gray-700">Employment Details (e.g., Company, Role)</label>
                                <input type="text" id="employmentDetails" name="employmentDetails" value={verificationData.employmentDetails} onChange={handleVerificationChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary" required />
                            </div>
                            <div>
                                <label htmlFor="idProof" className="block text-sm font-medium text-gray-700">ID Proof (e.g., Aadhar, PAN)</label>
                                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                                    <div className="space-y-1 text-center">
                                        <UploadIcon className="mx-auto h-12 w-12 text-gray-400" />
                                        <div className="flex text-sm text-gray-600">
                                            <label htmlFor="idProof" className="relative cursor-pointer bg-white rounded-md font-medium text-primary hover:text-secondary focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-primary">
                                                <span>Upload a file</span>
                                                <input id="idProof" name="idProof" type="file" className="sr-only" onChange={handleFileChange} />
                                            </label>
                                            <p className="pl-1">or drag and drop</p>
                                        </div>
                                        <p className="text-xs text-gray-500">{verificationData.idProof ? verificationData.idProof.name : 'PNG, JPG, PDF up to 2MB'}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div>
                        <label className="block text-lg font-semibold text-gray-800 mb-3">2. Select a Date</label>
                        <div className="grid grid-cols-4 gap-2">
                            {availableDays.map(day => {
                                const isSelected = selectedDate?.toDateString() === day.toDateString();
                                return (
                                    <button
                                        type="button"
                                        key={day.toISOString()}
                                        onClick={() => setSelectedDate(day)}
                                        className={`p-3 text-center rounded-lg border-2 transition-colors ${
                                            isSelected
                                                ? 'bg-primary/10 border-primary text-primary ring-2 ring-primary'
                                                : 'bg-white text-neutral-700 border-gray-300 hover:bg-gray-50'
                                        }`}
                                    >
                                        <p className="font-bold text-lg">{formatDate(day)}</p>
                                        <p className="text-xs">{formatDay(day)}</p>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {selectedDate && (
                    <div>
                        <label className="block text-lg font-semibold text-gray-800 mb-3">3. Select a Time Slot</label>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                            {timeSlots.map(slot => (
                                <button
                                    type="button"
                                    key={slot}
                                    onClick={() => setSelectedTimeSlot(slot)}
                                    className={`p-3 text-sm font-semibold rounded-md border-2 transition-colors ${
                                        selectedTimeSlot === slot
                                            ? 'bg-primary/10 border-primary text-primary ring-2 ring-primary'
                                            : 'bg-white text-neutral-700 border-gray-300 hover:bg-gray-50'
                                    }`}
                                >
                                    {slot}
                                </button>
                            ))}
                        </div>
                    </div>
                    )}
                    
                    {error && <p className="text-red-500 text-sm text-center">{error}</p>}

                    <div className="pt-6 border-t">
                        <div className="bg-blue-50 border-l-4 border-blue-500 text-blue-800 p-4 rounded-r-lg mb-4">
                            <h4 className="font-bold">Refundable Advance Payment</h4>
                            <p className="text-sm">A refundable advance of <span className="font-bold">₹{property.viewingAdvance.toLocaleString('en-IN')}</span> is required to book a viewing. This is refunded if the owner rejects your request or you mark yourself as not interested after a completed visit.</p>
                        </div>
                        <button type="submit" className="w-full bg-secondary hover:bg-primary text-white font-bold py-3 px-4 rounded-lg transition-colors duration-300 disabled:bg-neutral-300" disabled={!selectedDate || !selectedTimeSlot || !verificationData.fullName}>
                            Pay ₹{property.viewingAdvance.toLocaleString('en-IN')} & Request Viewing
                        </button>
                    </div>
                </form>
            </div>
            <div className="order-1 md:order-2">
                <div className="sticky top-24">
                    <img src={property.images[0]} alt={property.title} className="w-full h-64 object-cover rounded-lg mb-4 shadow-lg" />
                    <h3 className="text-xl font-bold">{property.title}</h3>
                    <p className="text-neutral-600 text-sm">{property.address}</p>
                </div>
            </div>
        </div>
    </div>
  );
};

export default BookViewingForm;