
import React, { useState } from 'react';
import type { User } from '../types';
import { PaymentType } from '../types';
import { CreditCardIcon, XCircleIcon, QrCodeIcon, CalendarDaysIcon, InformationCircleIcon } from './Icons';

interface PaymentPortalProps {
    currentUser: User;
    paymentDetails: {
        title: string;
        amount: number;
        propertyTitle: string;
        rentAmount?: number;
        depositAmount?: number;
        dueDate?: string;
    };
    onPaymentSuccess: () => void;
    onClose: () => void;
    paymentType: PaymentType;
}

const PaymentPortal: React.FC<PaymentPortalProps> = ({ currentUser, paymentDetails, onPaymentSuccess, onClose, paymentType }) => {
    const [paymentMethod, setPaymentMethod] = useState('card');
    const [isPaying, setIsPaying] = useState(false);

    const handlePayment = () => {
        setIsPaying(true);
        // Simulate payment processing
        setTimeout(() => {
            setIsPaying(false);
            onPaymentSuccess();
        }, 1500);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4" onClick={onClose}>
            <div 
                className="max-w-md w-full bg-white p-8 rounded-lg shadow-xl relative"
                onClick={(e) => e.stopPropagation()}
            >
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 z-10">
                    <XCircleIcon className="w-8 h-8" />
                </button>
                <div className="text-center">
                    <h2 className="text-2xl font-bold mb-2">{paymentDetails.title}</h2>
                    <p className="text-neutral-600 mb-1">For: <span className="font-semibold">{paymentDetails.propertyTitle}</span></p>
                    <p className="text-4xl font-bold my-4">₹{paymentDetails.amount.toLocaleString('en-IN')}</p>
                </div>

                {paymentType === PaymentType.DEPOSIT && paymentDetails.rentAmount && paymentDetails.depositAmount && (
                    <div className="text-sm bg-blue-50 border border-blue-200 p-3 rounded-lg mb-6">
                        <p className="font-semibold text-blue-800 mb-2">Payment Breakdown:</p>
                        <div className="flex justify-between"><span>First Month's Rent:</span> <span>₹{paymentDetails.rentAmount.toLocaleString('en-IN')}</span></div>
                        <div className="flex justify-between"><span>Security Deposit:</span> <span>₹{paymentDetails.depositAmount.toLocaleString('en-IN')}</span></div>
                    </div>
                )}
                
                {paymentDetails.dueDate && (
                     <div className="text-sm text-center mb-6 flex items-center justify-center gap-2 text-neutral-600">
                        <CalendarDaysIcon className="w-4 h-4" />
                        Due by: {new Date(paymentDetails.dueDate).toLocaleDateString()}
                    </div>
                )}
                
                <div className="my-6">
                    <div className="flex border-b">
                        <button onClick={() => setPaymentMethod('card')} className={`flex-1 py-3 text-sm font-semibold border-b-2 flex items-center justify-center gap-2 ${paymentMethod === 'card' ? 'border-primary text-primary' : 'border-transparent text-neutral-500'}`}>
                            <CreditCardIcon className="w-5 h-5"/> Credit/Debit Card
                        </button>
                        <button onClick={() => setPaymentMethod('upi')} className={`flex-1 py-3 text-sm font-semibold border-b-2 flex items-center justify-center gap-2 ${paymentMethod === 'upi' ? 'border-primary text-primary' : 'border-transparent text-neutral-500'}`}>
                            <QrCodeIcon className="w-5 h-5"/> UPI / QR
                        </button>
                    </div>

                    {paymentMethod === 'card' && (
                        <div className="mt-6 space-y-4">
                            <div>
                                <label className="text-sm font-medium text-gray-700">Card Number</label>
                                <input type="text" placeholder="•••• •••• •••• ••••" className="w-full mt-1 p-2 border rounded-md" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium text-gray-700">Expiry</label>
                                    <input type="text" placeholder="MM/YY" className="w-full mt-1 p-2 border rounded-md" />
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-700">CVC</label>
                                    <input type="text" placeholder="•••" className="w-full mt-1 p-2 border rounded-md" />
                                </div>
                            </div>
                        </div>
                    )}
                    {paymentMethod === 'upi' && (
                        <div className="mt-6 text-center">
                            <p className="text-sm text-neutral-600 mb-4">Scan the QR code with your UPI app or enter your UPI ID.</p>
                            <div className="flex justify-center mb-4">
                                <QrCodeIcon className="w-40 h-40 text-neutral-800" />
                            </div>
                            <input type="text" placeholder="yourname@upi" className="w-full p-2 border rounded-md text-center" />
                        </div>
                    )}
                </div>

                <button 
                    onClick={handlePayment} 
                    disabled={isPaying}
                    className="w-full bg-secondary hover:bg-primary text-white font-bold py-3 px-4 rounded-lg transition-colors duration-300 disabled:bg-neutral-300"
                >
                    {isPaying ? 'Processing...' : `Pay ₹${paymentDetails.amount.toLocaleString('en-IN')}`}
                </button>
                 <p className="text-xs text-neutral-500 text-center mt-4 flex items-center justify-center gap-1">
                    <InformationCircleIcon className="w-4 h-4"/> Secure payments powered by a demo interface.
                </p>
            </div>
        </div>
    );
};

export default PaymentPortal;
