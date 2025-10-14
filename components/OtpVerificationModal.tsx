import React, { useState, useRef, useEffect } from 'react';
import { XCircleIcon, LockClosedIcon } from './Icons';

interface OtpVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVerify: (otp: string) => void;
  error: string | null;
  isLoading?: boolean;
}

const OtpVerificationModal: React.FC<OtpVerificationModalProps> = ({ isOpen, onClose, onVerify, error, isLoading }) => {
  const [otp, setOtp] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      // Auto-focus the input when the modal opens
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      // Reset state when closing
      setOtp('');
    }
  }, [isOpen]);
  
  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length === 6 && !isLoading) {
      onVerify(otp);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Allow only numeric input and limit to 6 digits
    if (/^\d*$/.test(value) && value.length <= 6) {
      setOtp(value);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4" onClick={onClose}>
      <div 
        className="w-full max-w-md bg-white p-8 rounded-xl shadow-2xl relative" 
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
          <XCircleIcon className="w-6 h-6" />
        </button>

        <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100">
                <LockClosedIcon className="h-6 w-6 text-blue-600" />
            </div>
            <h2 className="text-2xl font-bold text-neutral-800 mt-4">Enter Verification Code</h2>
            <p className="text-neutral-500 mt-2 text-sm">A 6-digit code was sent to you for verification.</p>
        </div>

        <form onSubmit={handleSubmit} className="mt-8">
          <div className="flex flex-col items-center">
            <label htmlFor="otp-input" className="sr-only">OTP</label>
            <input
              ref={inputRef}
              id="otp-input"
              type="tel" // Use tel for better mobile numeric keyboard
              value={otp}
              onChange={handleInputChange}
              maxLength={6}
              className="w-full max-w-xs text-center text-3xl font-mono tracking-[1em] bg-gray-100 border-2 border-gray-300 rounded-md py-3 focus:border-primary focus:ring-primary"
              autoComplete="one-time-code"
              disabled={isLoading}
            />
          </div>
          
          {error && <p className="text-red-500 text-center text-sm mt-4">{error}</p>}

          <button
            type="submit"
            disabled={isLoading || otp.length !== 6}
            className="mt-6 w-full bg-secondary hover:bg-primary text-white font-bold py-3 px-4 rounded-lg transition-colors duration-300 flex items-center justify-center gap-2 disabled:bg-neutral-300 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Verifying...
              </>
            ) : "Verify & Sign"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default OtpVerificationModal;