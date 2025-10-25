import React, { useState } from 'react';
import type { Property, PoliceVerificationFormData, User } from '../types';
import { UploadIcon } from './Icons';

interface ApplicationFormProps {
  property: Property;
  currentUser: User | null;
  onSubmit: (property: Property, details: { proposedDateTime?: string; verificationData: any }) => void;
  onBack: () => void;
  bookingType: 'viewing' | 'direct';
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

const FormSection: React.FC<{ title: string; children: React.ReactNode; className?: string }> = ({ title, children, className }) => (
    <div className={`pt-6 mt-6 border-t first:mt-0 first:pt-0 first:border-t-0 ${className}`}>
        <h4 className="text-lg font-semibold text-gray-800 mb-4">{title}</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {children}
        </div>
    </div>
);

const FormInput: React.FC<{ label: string; name: string; value: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; type?: string; placeholder?: string; required?: boolean }> = 
({ label, name, value, onChange, type = 'text', placeholder, required = false }) => (
    <div>
        <label htmlFor={name} className="block text-sm font-medium text-gray-700">{label}</label>
        <input 
            type={type} 
            id={name} 
            name={name} 
            value={value} 
            onChange={onChange} 
            placeholder={placeholder}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
            required={required}
        />
    </div>
);


const ApplicationForm: React.FC<ApplicationFormProps> = ({ property, currentUser, onSubmit, onBack, bookingType }) => {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState('');
  const [formData, setFormData] = useState<PoliceVerificationFormData>({
    fullName: currentUser?.name || '',
    dateOfBirth: '',
    fatherName: '',
    permanentAddress: '',
    previousAddress: '',
    previousAddressDuration: '',
    employerName: '',
    employerAddress: '',
    previousLandlordName: '',
    previousLandlordContact: '',
    reasonForMoving: '',
    emergencyContactName: '',
    emergencyContactRelation: '',
    emergencyContactPhone: '',
  });
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState('');
  
  const availableDays = getNextSevenDays();
  const isViewingFlow = bookingType === 'viewing';

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const { name, value } = e.target;
      setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isViewingFlow && (!selectedDate || !selectedTimeSlot)) {
        setError('Please select both a date and a time slot for your viewing.');
        return;
    }
     if (!consent) {
        setError('You must agree to the declaration to proceed.');
        return;
    }
    setError('');
    
    const proposedDateTime = isViewingFlow
      ? new Date(`${selectedDate!.toISOString().split('T')[0]} ${selectedTimeSlot.split(' - ')[0]}`).toISOString()
      : undefined;
    
    onSubmit(property, { proposedDateTime, verificationData: formData });
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
                <h2 className="text-3xl font-bold mb-2">{isViewingFlow ? 'Book a Visit & Verify' : 'Submit Rental Application'}</h2>
                <p className="text-neutral-600 mb-6">{isViewingFlow ? 'Complete your verification and select a time to visit the property.' : 'Complete your verification to apply for this property directly.'}</p>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <FormSection title="Personal Information">
                        <FormInput label="Full Name" name="fullName" value={formData.fullName || ''} onChange={handleChange} required />
                        <FormInput label="Father's Name" name="fatherName" value={formData.fatherName || ''} onChange={handleChange} required/>
                        <FormInput label="Date of Birth" name="dateOfBirth" value={formData.dateOfBirth || ''} onChange={handleChange} type="date" required/>
                    </FormSection>

                    <FormSection title="Address History">
                        <div className="md:col-span-2">
                            <FormInput label="Permanent Address" name="permanentAddress" value={formData.permanentAddress || ''} onChange={handleChange} placeholder="As per your ID proof" required/>
                        </div>
                        <FormInput label="Previous Rented Address" name="previousAddress" value={formData.previousAddress || ''} onChange={handleChange} />
                        <FormInput label="Duration of Stay (at previous address)" name="previousAddressDuration" value={formData.previousAddressDuration || ''} onChange={handleChange} placeholder="e.g., 2 years" />
                    </FormSection>

                    <FormSection title="Employment Verification">
                        <FormInput label="Employer Name" name="employerName" value={formData.employerName || ''} onChange={handleChange} required/>
                        <FormInput label="Employer Address" name="employerAddress" value={formData.employerAddress || ''} onChange={handleChange} required/>
                    </FormSection>

                    <FormSection title="Rental History">
                        <FormInput label="Previous Landlord Name" name="previousLandlordName" value={formData.previousLandlordName || ''} onChange={handleChange} />
                        <FormInput label="Previous Landlord Contact" name="previousLandlordContact" value={formData.previousLandlordContact || ''} onChange={handleChange} type="tel" />
                        <div className="md:col-span-2">
                            <FormInput label="Reason for Moving" name="reasonForMoving" value={formData.reasonForMoving || ''} onChange={handleChange} />
                        </div>
                    </FormSection>
                    
                    <FormSection title="Emergency Contact">
                         <FormInput label="Contact Name" name="emergencyContactName" value={formData.emergencyContactName || ''} onChange={handleChange} required/>
                         <FormInput label="Relation" name="emergencyContactRelation" value={formData.emergencyContactRelation || ''} onChange={handleChange} required/>
                         <FormInput label="Phone Number" name="emergencyContactPhone" value={formData.emergencyContactPhone || ''} onChange={handleChange} type="tel" required/>
                    </FormSection>
                    
                    {isViewingFlow && (
                        <>
                            <FormSection title="Select a Date">
                                <div className="grid grid-cols-4 gap-2 md:col-span-2">
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
                            </FormSection>

                            {selectedDate && (
                            <FormSection title="Select a Time Slot">
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 md:col-span-2">
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
                            </FormSection>
                            )}
                        </>
                    )}
                    
                    {error && <p className="text-red-500 text-sm text-center">{error}</p>}

                    <div className="pt-6 border-t">
                         <div className="p-4 border border-gray-200 rounded-lg bg-neutral-50 mb-4">
                            <label className="flex items-start space-x-3 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={consent}
                                    onChange={(e) => setConsent(e.target.checked)}
                                    className="mt-1 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                                />
                                <span className="text-sm text-neutral-700">
                                    I hereby declare that the information provided is true to the best of my knowledge and grant permission to the property owner to verify this information for the purpose of my rental application, including conducting credit and background checks as permitted by law.
                                </span>
                            </label>
                        </div>
                        {isViewingFlow ? (
                             <div className="bg-blue-50 border-l-4 border-blue-500 text-blue-800 p-4 rounded-r-lg mb-4">
                                <h4 className="font-bold">Refundable Advance Payment</h4>
                                <p className="text-sm">A refundable advance of <span className="font-bold">₹{property.viewingAdvance.toLocaleString('en-IN')}</span> is required to book a viewing. This is refunded if the owner rejects your request or you mark yourself as not interested after a completed visit.</p>
                            </div>
                        ) : (
                             <div className="bg-blue-50 border-l-4 border-blue-500 text-blue-800 p-4 rounded-r-lg mb-4">
                                <h4 className="font-bold">Next Steps</h4>
                                <p className="text-sm">After you submit your application, the owner will review it. If approved, you will be notified to proceed with the rental agreement.</p>
                            </div>
                        )}
                        <button type="submit" className="w-full bg-secondary hover:bg-primary text-white font-bold py-3 px-4 rounded-lg transition-colors duration-300 disabled:bg-neutral-300" disabled={(isViewingFlow && (!selectedDate || !selectedTimeSlot)) || !consent}>
                            {isViewingFlow ? `Pay ₹${property.viewingAdvance.toLocaleString('en-IN')} & Request Viewing` : 'Submit Application'}
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

export default ApplicationForm;