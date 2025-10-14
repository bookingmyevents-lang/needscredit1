
import React, { useState } from 'react';
import type { Verification } from '../types';
import { VerificationStatus } from '../types';
import * as Icons from './Icons';

interface VerificationFormProps {
    verification: Verification;
    onSubmit: (data: Record<string, any>) => void;
}

const VerificationForm: React.FC<VerificationFormProps> = ({ verification, onSubmit }) => {
    const [formData, setFormData] = useState({
        fullName: '',
        pan: '',
        employer: '',
        ...verification.formData,
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(formData);
    };

    if (verification.status === VerificationStatus.PENDING) {
        return <div className="p-6 bg-yellow-100 text-yellow-800 rounded-lg text-center">Your verification is under review.</div>;
    }
    if (verification.status === VerificationStatus.VERIFIED) {
        return <div className="p-6 bg-green-100 text-green-800 rounded-lg text-center flex items-center justify-center gap-2"><Icons.CheckCircleIcon className="w-6 h-6" /> Your profile is verified.</div>;
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4 p-6 border rounded-lg bg-white">
            <h3 className="text-lg font-bold">Background Verification</h3>
            <p className="text-sm text-neutral-500">Please fill out the form to complete your profile verification.</p>
            <div>
                <label className="block text-sm font-medium">Full Name (as per ID)</label>
                <input type="text" name="fullName" value={formData.fullName} onChange={handleChange} className="w-full mt-1 p-2 border rounded-md" required />
            </div>
             <div>
                <label className="block text-sm font-medium">PAN / National ID</label>
                <input type="text" name="pan" value={formData.pan} onChange={handleChange} className="w-full mt-1 p-2 border rounded-md" required />
            </div>
             <div>
                <label className="block text-sm font-medium">Current Employer</label>
                <input type="text" name="employer" value={formData.employer} onChange={handleChange} className="w-full mt-1 p-2 border rounded-md" required />
            </div>
            <button type="submit" className="px-4 py-2 bg-secondary text-white font-semibold rounded-md">Submit for Verification</button>
        </form>
    );
};

export default VerificationForm;
