import React from 'react';
import type { Agreement, Property, User } from '../types';
import { UserRole } from '../types';
import { mockAgreementText } from '../mockData';
import { XCircleIcon, CheckCircleIcon, PencilIcon } from './Icons';

interface AgreementSigningPageProps {
  agreement: Agreement;
  property: Property;
  currentUser: User;
  onInitiateSign: (agreementId: string) => void;
  onClose: () => void;
}

const AgreementSigningPage: React.FC<AgreementSigningPageProps> = ({
  agreement,
  property,
  currentUser,
  onInitiateSign,
  onClose,
}) => {
  const renter = { name: "Renter" }; // Placeholder, assuming names are fetched elsewhere if needed
  const owner = { name: "Owner" };

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

    const canRenterSign = currentUser.role === UserRole.RENTER && !agreement.signedByTenant;
    const canOwnerSign = currentUser.role === UserRole.OWNER && agreement.signedByTenant && !agreement.signedByOwner;
    const canSign = canRenterSign || canOwnerSign;
    const isFullySigned = agreement.signedByTenant && agreement.signedByOwner;
    
    let buttonText = "Sign Agreement";
    let buttonDisabled = !canSign;
    let helperText = "By clicking 'Sign Agreement', you agree to the terms and conditions outlined above.";

    if (isFullySigned) {
        buttonText = "Agreement Complete";
        helperText = "This agreement has been signed by both parties.";
    } else if (currentUser.role === UserRole.OWNER && !agreement.signedByTenant) {
        buttonText = "Waiting for Tenant";
        helperText = "You can sign this agreement after the tenant has signed.";
    }


  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4" onClick={onClose}>
      <div 
        className="max-w-4xl w-full bg-white p-8 rounded-lg shadow-xl relative flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()} // Prevent clicks inside the modal from closing it
      >
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 z-10">
          <XCircleIcon className="w-8 h-8" />
        </button>

        <h2 className="text-3xl font-bold text-center mb-2 flex-shrink-0">Sign Your Rental Agreement</h2>
        <p className="text-center text-neutral-600 mb-6 flex-shrink-0">For: <span className="font-semibold">{property.title}</span></p>
        
        <div className="grid grid-cols-2 gap-4 mb-6 text-center">
            <div className={`p-3 rounded-lg border-2 ${agreement.signedByTenant ? 'border-green-500 bg-green-50' : 'border-gray-300 bg-gray-50'}`}>
                <p className="font-semibold">Tenant Signature</p>
                <p className={`text-sm font-bold ${agreement.signedByTenant ? 'text-green-700' : 'text-gray-500'}`}>{agreement.signedByTenant ? 'SIGNED' : 'PENDING'}</p>
            </div>
             <div className={`p-3 rounded-lg border-2 ${agreement.signedByOwner ? 'border-green-500 bg-green-50' : 'border-gray-300 bg-gray-50'}`}>
                <p className="font-semibold">Owner Signature</p>
                <p className={`text-sm font-bold ${agreement.signedByOwner ? 'text-green-700' : 'text-gray-500'}`}>{agreement.signedByOwner ? 'SIGNED' : 'PENDING'}</p>
            </div>
        </div>
        
        <div className="prose max-w-none p-6 border rounded-md bg-neutral-50 h-72 overflow-y-auto flex-grow custom-scrollbar">
          <pre className="whitespace-pre-wrap font-sans text-sm">{agreementContent}</pre>
        </div>

        <div className="mt-8 text-center flex-shrink-0">
          <p className="mb-4 text-sm text-neutral-600">{helperText}</p>
          <button 
            onClick={() => onInitiateSign(agreement.id)} 
            disabled={buttonDisabled}
            className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-8 rounded-lg transition-colors duration-300 flex items-center justify-center gap-2 w-full max-w-xs mx-auto disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {isFullySigned ? <CheckCircleIcon className="w-6 h-6" /> : <PencilIcon className="w-5 h-5" />}
            {buttonText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AgreementSigningPage;