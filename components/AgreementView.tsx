import React from 'react';
import type { Agreement, Property, User } from '../types';
import { mockAgreementText } from '../mockData';
import { XCircleIcon } from './Icons';

interface AgreementViewProps {
  agreement: Agreement;
  property: Property;
  renter: User;
  owner: User;
  isReadOnly?: boolean;
  onClose?: () => void;
  onSign?: () => void;
}

const AgreementView: React.FC<AgreementViewProps> = ({
  agreement,
  property,
  renter,
  owner,
  isReadOnly = false,
  onClose,
  onSign,
}) => {
  const formattedMoveInDate = new Date(agreement.startDate).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const agreementContent = mockAgreementText
    .replace('the Landlord', owner.name)
    .replace('the Tenant', renter.name)
    .replace('the address specified in the application', property.address)
    .replace('the agreed-upon move-in date', formattedMoveInDate)
    .replace('the monthly rent specified in the application', `₹${agreement.rentAmount.toLocaleString('en-IN')}`)
    .replace('[Security Deposit Amount]', `₹${agreement.depositAmount.toLocaleString('en-IN')}`);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4" onClick={onClose}>
      <div 
        className="max-w-4xl w-full bg-white p-8 rounded-lg shadow-xl relative flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()} // Prevent clicks inside the modal from closing it
      >
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 z-10">
          <XCircleIcon className="w-8 h-8" />
        </button>

        <h2 className="text-3xl font-bold text-center mb-2 flex-shrink-0">Rental Agreement</h2>
        <p className="text-center text-neutral-600 mb-6 flex-shrink-0">For: <span className="font-semibold">{property.title}</span></p>
        
        <div className="grid grid-cols-2 gap-4 mb-6 text-center">
            <div className={`p-3 rounded-lg border-2 ${agreement.signedByTenant ? 'border-green-500 bg-green-50' : 'border-gray-300 bg-gray-50'}`}>
                <p className="font-semibold">{renter.name} (Tenant)</p>
                <p className={`text-sm font-bold ${agreement.signedByTenant ? 'text-green-700' : 'text-gray-500'}`}>{agreement.signedByTenant ? 'SIGNED' : 'PENDING'}</p>
            </div>
             <div className={`p-3 rounded-lg border-2 ${agreement.signedByOwner ? 'border-green-500 bg-green-50' : 'border-gray-300 bg-gray-50'}`}>
                <p className="font-semibold">{owner.name} (Owner)</p>
                <p className={`text-sm font-bold ${agreement.signedByOwner ? 'text-green-700' : 'text-gray-500'}`}>{agreement.signedByOwner ? 'SIGNED' : 'PENDING'}</p>
            </div>
        </div>

        <div className="prose max-w-none p-6 border rounded-md bg-neutral-50 h-72 overflow-y-auto flex-grow custom-scrollbar">
          <pre className="whitespace-pre-wrap font-sans text-sm">{agreementContent}</pre>
        </div>

        <div className="mt-8 text-center flex-shrink-0">
          {isReadOnly ? (
             <button 
                onClick={onClose} 
                className="bg-primary hover:bg-secondary text-white font-bold py-3 px-8 rounded-lg transition-colors duration-300"
              >
                Close
              </button>
          ) : (
            <>
              <p className="mb-4 text-sm text-neutral-600">By clicking "Sign Agreement", you agree to the terms and conditions outlined above.</p>
              <button 
                onClick={onSign} 
                className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-8 rounded-lg transition-colors duration-300"
              >
                Sign Agreement
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AgreementView;
