
import React from 'react';
import { CreditCardIcon, XCircleIcon } from './Icons';

interface PaymentDetails {
  title: string;
  amount: number;
  dueDate?: string;
  propertyTitle: string;
}

interface PaymentPortalProps {
  paymentDetails: PaymentDetails;
  onPaymentSuccess: () => void;
  onClose: () => void;
}

const PaymentPortal: React.FC<PaymentPortalProps> = ({ paymentDetails, onPaymentSuccess, onClose }) => {
  const { title, amount, dueDate, propertyTitle } = paymentDetails;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4">
        <div className="max-w-md w-full mx-auto bg-white p-8 rounded-lg shadow-xl relative">
            <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
                <XCircleIcon className="w-6 h-6" />
            </button>
            
            <div className="text-center mb-6">
                 <img src="https://razorpay.com/assets/razorpay-logo.svg" alt="Razorpay" className="h-8 mx-auto mb-2" />
                 <h2 className="text-2xl font-bold text-center">{title}</h2>
                 <p className="text-center text-neutral-600">For: <span className="font-semibold">{propertyTitle}</span></p>
            </div>


            <div className="bg-primary text-white rounded-lg p-6 mb-6 text-center">
                <p className="text-lg">Amount Due</p>
                <p className="text-5xl font-bold tracking-tight">₹{(amount || 0).toLocaleString('en-IN')}</p>
                {dueDate && (
                    <p className="text-sm opacity-80">
                        Due Date: {new Date(dueDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                    </p>
                )}
            </div>

            <div className="space-y-4">
                <button 
                onClick={onPaymentSuccess} 
                className="w-full flex items-center justify-center gap-3 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition-colors duration-300"
                >
                Pay with UPI
                </button>
                <button 
                onClick={onPaymentSuccess} 
                className="w-full flex items-center justify-center gap-3 bg-neutral-800 hover:bg-neutral-900 text-white font-bold py-3 px-4 rounded-lg transition-colors duration-300"
                >
                <CreditCardIcon className="w-6 h-6" />
                Pay with Debit/Credit Card
                </button>
                <button 
                onClick={onPaymentSuccess} 
                className="w-full bg-gray-200 hover:bg-gray-300 text-neutral-800 font-bold py-3 px-4 rounded-lg transition-colors duration-300"
                >
                Pay with Bank Transfer
                </button>
            </div>

            <p className="text-xs text-center text-neutral-500 mt-6">
                All transactions are secure and encrypted. A receipt will be generated automatically.
            </p>
        </div>
    </div>
  );
};

export default PaymentPortal;
