import React from 'react';
import { CreditCardIcon, XCircleIcon, BuildingLibraryIcon, QrCodeIcon, CalendarDaysIcon, InformationCircleIcon } from './Icons';
import { PaymentType, User } from '../types';

declare var Razorpay: any;

// NOTE: In a real-world application, this key should be stored in an environment variable.
const RAZORPAY_KEY_ID = 'rzp_test_RN0UxTJr3WL4Ap';


interface PaymentDetails {
  title: string;
  amount: number;
  dueDate?: string;
  propertyTitle: string;
  rentAmount?: number;
  depositAmount?: number;
}

interface PaymentPortalProps {
  currentUser: User;
  paymentDetails: PaymentDetails;
  onPaymentSuccess: () => void;
  onClose: () => void;
  paymentType: PaymentType;
}

const PaymentOptionButton: React.FC<{
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}> = ({ icon, label, onClick }) => (
  <button
    onClick={onClick}
    className="w-full flex items-center gap-4 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-primary hover:shadow-sm transition-all duration-200 group"
  >
    <div className="text-primary transition-colors group-hover:text-secondary">{icon}</div>
    <span className="text-lg font-semibold text-gray-700 transition-colors group-hover:text-secondary">{label}</span>
  </button>
);


const PaymentPortal: React.FC<PaymentPortalProps> = ({ currentUser, paymentDetails, onPaymentSuccess, onClose, paymentType }) => {
  const { title, amount, dueDate, propertyTitle, rentAmount, depositAmount } = paymentDetails;
  
  const handlePayment = () => {
    const options = {
      key: RAZORPAY_KEY_ID,
      amount: amount * 100, // Razorpay amount is in paise
      currency: "INR",
      name: "RentEase",
      description: title,
      image: "https://i.imgur.com/3g7QJ2w.png", // A placeholder icon for RentEase
      handler: (response: any) => {
        console.log("Razorpay payment successful:", response);
        // In a real app, you would verify the signature on your backend.
        // For this demo, we assume success.
        onPaymentSuccess();
      },
      prefill: {
        name: currentUser.name,
        email: currentUser.email,
        contact: currentUser.phoneNumber || '',
      },
      notes: {
        property: propertyTitle,
        payment_type: paymentType,
      },
      theme: {
        color: "#0D47A1", // RentEase primary color
      },
      modal: {
        ondismiss: () => {
          console.log("Razorpay checkout closed.");
          // Can add logic here if needed, e.g. show a message.
        },
      },
    };

    try {
      const rzp = new Razorpay(options);
      rzp.open();
    } catch (error) {
      console.error("Razorpay Error:", error);
      alert("Payment gateway could not be loaded. Please check your internet connection or try again later.");
    }
  };

  const renderContextualInfo = () => {
    if (paymentType === PaymentType.VIEWING_ADVANCE) {
      return (
        <div className="bg-blue-50 border-l-4 border-blue-500 text-blue-800 p-4 rounded-r-lg my-6 text-sm flex items-start gap-3">
          <InformationCircleIcon className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-bold">This is a refundable advance.</h4>
            <p className="mt-1">This amount is required to secure your viewing slot. It will be refunded if the owner declines your request or if you decide not to proceed after the viewing.</p>
          </div>
        </div>
      );
    }
    return null;
  };

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

            {renderContextualInfo()}

            {paymentType === PaymentType.DEPOSIT && depositAmount && rentAmount ? (
                <div className="bg-primary text-white rounded-lg p-6 mb-8">
                    <div className="text-center border-b border-white/20 pb-4 mb-4">
                        <p className="text-lg">Total Amount Due</p>
                        <p className="text-5xl font-bold tracking-tight">₹{(amount || 0).toLocaleString('en-IN')}</p>
                    </div>
                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                            <span>Security Deposit</span>
                            <span className="font-semibold">₹{depositAmount.toLocaleString('en-IN')}</span>
                        </div>
                        <div className="flex justify-between">
                            <span>First Month's Rent</span>
                            <span className="font-semibold">₹{rentAmount.toLocaleString('en-IN')}</span>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="bg-primary text-white rounded-lg p-6 mb-8 text-center">
                    <p className="text-lg">Amount Due</p>
                    <p className="text-5xl font-bold tracking-tight">₹{(amount || 0).toLocaleString('en-IN')}</p>
                    {dueDate && (
                        <p className="text-sm opacity-80">
                            Due Date: {new Date(dueDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                        </p>
                    )}
                </div>
            )}

            <div className="space-y-3">
              <PaymentOptionButton
                icon={<QrCodeIcon className="w-6 h-6" />}
                label="UPI / QR Code"
                onClick={handlePayment}
              />
              <PaymentOptionButton
                icon={<CreditCardIcon className="w-6 h-6" />}
                label="Debit / Credit Card"
                onClick={handlePayment}
              />
               <PaymentOptionButton
                icon={<BuildingLibraryIcon className="w-6 h-6" />}
                label="Net Banking"
                onClick={handlePayment}
              />
               <PaymentOptionButton
                icon={<CalendarDaysIcon className="w-6 h-6" />}
                label="Buy Now Pay Later"
                onClick={handlePayment}
              />
            </div>

            <p className="text-xs text-center text-neutral-500 mt-6">
                All transactions are secure and encrypted. A receipt will be generated automatically.
            </p>
        </div>
    </div>
  );
};

export default PaymentPortal;