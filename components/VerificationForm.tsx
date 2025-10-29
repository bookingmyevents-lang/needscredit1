import React, { useState } from 'react';
import type { Verification, User } from '../types';
import * as Icons from './Icons';

interface PoliceVerificationFormProps {
    verification: Verification;
    user: User;
    onSubmit: (data: Record<string, any>) => void;
}

const FormSection: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div className="p-4 border border-gray-200 rounded-lg">
        <h4 className="text-lg font-semibold text-neutral-800 mb-4">{title}</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {children}
        </div>
    </div>
);

const FormInput: React.FC<{ label: string; name: string; value: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; type?: string; placeholder?: string }> = 
({ label, name, value, onChange, type = 'text', placeholder }) => (
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
        />
    </div>
);

const PoliceVerificationForm: React.FC<PoliceVerificationFormProps> = ({ verification, user, onSubmit }) => {
    const [formData, setFormData] = useState({
        fullName: user.name || '',
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
        ...verification.formData,
    });
    const [consent, setConsent] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!consent) {
            alert("You must provide consent to submit the verification form.");
            return;
        }
        onSubmit(formData);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <FormSection title="Personal Information">
                <FormInput label="Full Name" name="fullName" value={formData.fullName} onChange={handleChange} />
                <FormInput label="Father's Name" name="fatherName" value={formData.fatherName} onChange={handleChange} />
                <FormInput label="Date of Birth" name="dateOfBirth" value={formData.dateOfBirth} onChange={handleChange} type="date" />
            </FormSection>

            <FormSection title="Address History">
                <FormInput label="Permanent Address" name="permanentAddress" value={formData.permanentAddress} onChange={handleChange} placeholder="As per your ID proof" />
                <FormInput label="Previous Rented Address" name="previousAddress" value={formData.previousAddress} onChange={handleChange} />
                <FormInput label="Duration of Stay (at previous address)" name="previousAddressDuration" value={formData.previousAddressDuration} onChange={handleChange} placeholder="e.g., 2 years" />
            </FormSection>

            <FormSection title="Employment Verification">
                <FormInput label="Employer Name" name="employerName" value={formData.employerName} onChange={handleChange} />
                <FormInput label="Employer Address" name="employerAddress" value={formData.employerAddress} onChange={handleChange} />
            </FormSection>

            <FormSection title="Rental History">
                <FormInput label="Previous Landlord Name" name="previousLandlordName" value={formData.previousLandlordName} onChange={handleChange} />
                <FormInput label="Previous Landlord Contact" name="previousLandlordContact" value={formData.previousLandlordContact} onChange={handleChange} type="tel" />
                <div className="md:col-span-2">
                    <FormInput label="Reason for Moving" name="reasonForMoving" value={formData.reasonForMoving} onChange={handleChange} />
                </div>
            </FormSection>

            <FormSection title="Emergency Contact">
                 <FormInput label="Contact Name" name="emergencyContactName" value={formData.emergencyContactName} onChange={handleChange} />
                 <FormInput label="Relation" name="emergencyContactRelation" value={formData.emergencyContactRelation} onChange={handleChange} />
                 <FormInput label="Phone Number" name="emergencyContactPhone" value={formData.emergencyContactPhone} onChange={handleChange} type="tel" />
            </FormSection>

            <div className="p-4 border border-gray-200 rounded-lg">
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
            
            <button type="submit" disabled={!consent} className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-secondary hover:bg-primary text-white font-semibold rounded-md transition-colors disabled:bg-neutral-300 disabled:cursor-not-allowed">
                <Icons.ShieldCheckIcon className="w-5 h-5" />
                Submit for Verification
            </button>
        </form>
    );
};

export default PoliceVerificationForm;
