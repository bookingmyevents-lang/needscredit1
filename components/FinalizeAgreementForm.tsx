import React, { useState, useEffect } from 'react';
import type { Application, Property } from '../types';
import { XCircleIcon, PencilIcon } from './Icons';

interface FinalizeAgreementFormProps {
    details: { application: Application; property: Property };
    onClose: () => void;
    onSubmit: (applicationId: string, finalDetails: any) => void;
}

const FinalizeAgreementForm: React.FC<FinalizeAgreementFormProps> = ({ details, onClose, onSubmit }) => {
    const { application, property } = details;
    const [formData, setFormData] = useState({
        finalRentAmount: property.rent,
        finalDepositAmount: property.securityDeposit,
        moveInDate: application.moveInDate.split('T')[0],
        contractDuration: '11 Months',
        utilityResponsibilities: 'Electricity and water bills to be paid by the tenant. Maintenance is included in the rent.',
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(application.id, {
            ...formData,
            finalRentAmount: Number(formData.finalRentAmount),
            finalDepositAmount: Number(formData.finalDepositAmount),
        });
    };
    
    const today = new Date().toISOString().split('T')[0];

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4">
            <div 
                className="max-w-2xl w-full bg-white p-8 rounded-lg shadow-xl relative flex flex-col max-h-[90vh]"
                onClick={(e) => e.stopPropagation()}
            >
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 z-10">
                    <XCircleIcon className="w-8 h-8" />
                </button>

                <div className="text-center mb-6">
                    <h2 className="text-3xl font-bold">Finalize Rent Agreement</h2>
                    <p className="text-neutral-600">Confirm the rental terms for <span className="font-semibold">{property.title}</span>.</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4 overflow-y-auto custom-scrollbar pr-2">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="finalRentAmount" className="block text-sm font-medium text-gray-700">Final Rent Amount (₹)</label>
                            <input type="number" name="finalRentAmount" id="finalRentAmount" value={formData.finalRentAmount} onChange={handleChange} className="mt-1 block w-full p-2 border rounded-md" required />
                        </div>
                        <div>
                            <label htmlFor="finalDepositAmount" className="block text-sm font-medium text-gray-700">Security Deposit (₹)</label>
                            <input type="number" name="finalDepositAmount" id="finalDepositAmount" value={formData.finalDepositAmount} onChange={handleChange} className="mt-1 block w-full p-2 border rounded-md" required />
                        </div>
                    </div>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="moveInDate" className="block text-sm font-medium text-gray-700">Rent Start Date</label>
                            <input type="date" name="moveInDate" id="moveInDate" value={formData.moveInDate} onChange={handleChange} min={today} className="mt-1 block w-full p-2 border rounded-md" required />
                        </div>
                        <div>
                            <label htmlFor="contractDuration" className="block text-sm font-medium text-gray-700">Contract Duration</label>
                            <select name="contractDuration" id="contractDuration" value={formData.contractDuration} onChange={handleChange} className="mt-1 block w-full p-2 border rounded-md" required>
                                <option>11 Months</option>
                                <option>12 Months</option>
                                <option>24 Months</option>
                                <option>Other</option>
                            </select>
                        </div>
                    </div>
                    <div>
                        <label htmlFor="utilityResponsibilities" className="block text-sm font-medium text-gray-700">Utility Responsibilities</label>
                        <textarea name="utilityResponsibilities" id="utilityResponsibilities" value={formData.utilityResponsibilities} onChange={handleChange} rows={3} className="mt-1 block w-full p-2 border rounded-md" required></textarea>
                    </div>
                    <div className="pt-4 text-center">
                        <button type="submit" className="bg-secondary hover:bg-primary text-white font-bold py-3 px-8 rounded-lg transition-colors duration-300 flex items-center justify-center gap-2 w-full">
                            <PencilIcon className="w-5 h-5" />
                            Generate & Send Agreement
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default FinalizeAgreementForm;