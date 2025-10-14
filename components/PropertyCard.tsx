import React, { useState } from 'react';
import type { Property, User } from '../types';
import { FurnishingStatus } from '../types';
import { BedIcon, BathIcon, RulerIcon, ShareIcon, HeartIcon, BuildingIcon, CompassIcon, CarIcon, ShieldCheckIcon, MailIcon, PhoneIcon, XCircleIcon } from './Icons';

interface PropertyCardProps {
  property: Property;
  owner?: User;
  onSelectProperty: (property: Property) => void;
}

const PropertyCard: React.FC<PropertyCardProps> = ({ property, owner, onSelectProperty }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const touchStartX = React.useRef<number | null>(null);
  const touchEndX = React.useRef<number | null>(null);
  const minSwipeDistance = 50;


  const hasImages = Array.isArray(property.images) && property.images.length > 0;
  const displayImage = hasImages ? property.images[currentImageIndex] : 'https://picsum.photos/seed/placeholder/800/600';

  const nextImage = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!Array.isArray(property.images) || property.images.length <= 1) return;
    setCurrentImageIndex((prevIndex) => (prevIndex + 1) % property.images.length);
  };

  const prevImage = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!Array.isArray(property.images) || property.images.length <= 1) return;
    setCurrentImageIndex((prevIndex) => (prevIndex - 1 + property.images.length) % property.images.length);
  };

  const onTouchStart = (e: React.TouchEvent) => {
    touchEndX.current = null; // reset end on new touch
    touchStartX.current = e.targetTouches[0].clientX;
  };

  const onTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const onTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return;
    const distance = touchStartX.current - touchEndX.current;
    
    if (distance > minSwipeDistance) {
      nextImage();
    } else if (distance < -minSwipeDistance) {
      prevImage();
    }

    touchStartX.current = null;
    touchEndX.current = null;
  };


  const timeSince = (dateString: string) => {
    if (!dateString) return 'recently';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return 'recently';
    }

    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    if (seconds < 2) return "just now";

    const intervals: { [key: string]: number } = {
        year: 31536000,
        month: 2592000,
        day: 86400,
        hour: 3600,
        minute: 60,
        second: 1
    };

    for (const i in intervals) {
        const counter = Math.floor(seconds / intervals[i]);
        if (counter > 0) {
            if (counter === 1) {
                return `${counter} ${i} ago`;
            } else {
                return `${counter} ${i}s ago`;
            }
        }
    }
    return "just now";
  };


  return (
    <div
      className="bg-white rounded-lg shadow-md border border-neutral-200 overflow-hidden transition-shadow duration-300 hover:shadow-xl"
    >
      <div className="flex flex-col sm:flex-row">
        {/* Image Carousel */}
        <div
          className="relative w-full sm:w-2/5 group"
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          <img
            src={displayImage}
            alt={property.title || 'Property Image'}
            className="w-full h-48 object-cover cursor-pointer"
            onClick={() => onSelectProperty(property)}
            loading="lazy"
          />
           <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
           {property.images?.length > 1 && (
            <>
              <button onClick={prevImage} className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 text-white p-1 rounded-full hover:bg-black/80 transition-opacity opacity-0 group-hover:opacity-100">&lt;</button>
              <button onClick={nextImage} className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 text-white p-1 rounded-full hover:bg-black/80 transition-opacity opacity-0 group-hover:opacity-100">&gt;</button>
            </>
          )}
           {hasImages && property.images && (
            <div className="absolute bottom-2 left-2 text-white text-xs bg-black/50 px-1.5 py-0.5 rounded">
              {currentImageIndex + 1} / {property.images.length}
            </div>
          )}
        </div>

        {/* Property Info */}
        <div className="p-4 flex-grow w-full sm:w-3/5">
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center gap-2 mb-1">
                 <p className="text-sm text-neutral-500">{property.bedrooms || 0} BHK Flat for Rent</p>
                 {property.furnishing && (
                    <span className={`inline-block text-xs font-semibold px-2 py-0.5 rounded-full ${
                        property.furnishing === FurnishingStatus.FURNISHED ? 'bg-green-100 text-green-800' :
                        property.furnishing === FurnishingStatus.SEMI_FURNISHED ? 'bg-yellow-100 text-yellow-800' :
                        'bg-neutral-200 text-neutral-700'
                    }`}>
                        {property.furnishing}
                    </span>
                 )}
              </div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-neutral-800 cursor-pointer hover:text-primary" onClick={() => onSelectProperty(property)}>{property.title || 'Untitled Property'}</h3>
                {owner?.kycStatus === 'Verified' && (
                    <div className="flex-shrink-0 flex items-center gap-1 bg-green-100 text-green-700 text-xs font-semibold px-2 py-0.5 rounded-full" title="Owner's KYC is verified">
                        <ShieldCheckIcon className="w-3.5 h-3.5" />
                        Verified Owner
                    </div>
                )}
              </div>
              <p className="text-sm text-neutral-600">{property.address || 'No address provided'}</p>
            </div>
            <div className="flex gap-2 text-neutral-500">
                <button className="p-2 hover:bg-neutral-100 rounded-full"><ShareIcon className="w-5 h-5"/></button>
                <button className="p-2 hover:bg-neutral-100 rounded-full"><HeartIcon className="w-5 h-5"/></button>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 my-3 text-center">
             <div className="text-neutral-700">
                <p className="font-bold text-lg">₹{(property.rent || 0).toLocaleString('en-IN')}</p>
                <p className="text-xs text-neutral-500">Rent</p>
            </div>
             <div className="text-neutral-700">
                <p className="font-bold text-lg">{(property.sqft || 0).toLocaleString('en-IN')}</p>
                <p className="text-xs text-neutral-500">Sqft</p>
            </div>
             <div className="text-neutral-700">
                <p className="font-bold text-lg">₹{(property.securityDeposit || 0).toLocaleString('en-IN')}</p>
                <p className="text-xs text-neutral-500">Deposit</p>
            </div>
          </div>
          
           <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs text-neutral-600 mb-4 border-t pt-3">
              <div className="flex items-center gap-1.5" title="Furnishing Status">
                <BuildingIcon className="w-4 h-4 text-neutral-400" />
                <span>{property.furnishing || 'N/A'}</span>
              </div>
              <div className="flex items-center gap-1.5" title="Bathrooms">
                <BathIcon className="w-4 h-4 text-neutral-400" />
                <span>{property.bathrooms || 0} Bathrooms</span>
              </div>
              <div className="flex items-center gap-1.5" title="Facing Direction">
                <CompassIcon className="w-4 h-4 text-neutral-400" />
                <span>{property.facing || 'N/A'}</span>
              </div>
              <div className="flex items-center gap-1.5" title="Parking">
                <CarIcon className="w-4 h-4 text-neutral-400" />
                <span>{property.parking || 'N/A'}</span>
              </div>
          </div>

          <div className="flex justify-between items-center border-t pt-3">
             <p className="text-xs text-neutral-500">Posted {timeSince(property.postedDate)}</p>
             <button
                onClick={() => onSelectProperty(property)}
                className="px-4 py-2 bg-secondary hover:bg-primary text-white font-semibold rounded-md text-sm transition-colors duration-300"
              >
                Schedule Viewing
              </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PropertyCard;