import React, { useState, useRef } from 'react';
import type { Property, User } from '../types';
import { FurnishingStatus } from '../types';
import { BedIcon, BathIcon, RulerIcon, ShieldCheckIcon, ChevronLeftIcon, ChevronRightIcon, LocationMarkerIcon, HeartIcon } from './Icons';

interface PropertyCardProps {
  property: Property & { distance?: number };
  owner?: User;
  onSelectProperty: (property: Property) => void;
  isSaved: boolean;
  onToggleSave: (propertyId: string) => void;
  currentUser: User | null;
}

const PropertyCard: React.FC<PropertyCardProps> = ({ property, owner, onSelectProperty, isSaved, onToggleSave, currentUser }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);
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
  
  const handleSaveClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleSave(property.id);
  };

  return (
    <div
      className="bg-white rounded-lg shadow-md border border-neutral-200 overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
    >
      <div className="flex flex-col sm:flex-row">
        {/* Image Carousel */}
        <div
          className="relative w-full sm:w-2/5 group h-48 sm:h-auto"
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          <img
            src={displayImage}
            alt={property.title || 'Property Image'}
            className="w-full h-full object-cover cursor-pointer"
            onClick={() => onSelectProperty(property)}
            loading="lazy"
          />
           <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
           
           {(!currentUser || currentUser.role === 'RENTER') && (
              <button
                  onClick={handleSaveClick}
                  className="absolute top-2 right-2 bg-black/40 text-white p-2 rounded-full hover:bg-black/70 transition-colors"
                  title={isSaved ? "Unsave Property" : "Save Property"}
              >
                  <HeartIcon className={`w-5 h-5 transition-colors ${isSaved ? 'text-red-500 fill-current' : 'text-white'}`} />
              </button>
           )}

           {property.images?.length > 1 && (
            <>
              <button onClick={prevImage} className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/40 text-white p-1.5 rounded-full hover:bg-black/70 transition-opacity opacity-0 group-hover:opacity-100 focus:opacity-100 outline-none">
                <ChevronLeftIcon className="w-5 h-5" />
              </button>
              <button onClick={nextImage} className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/40 text-white p-1.5 rounded-full hover:bg-black/70 transition-opacity opacity-0 group-hover:opacity-100 focus:opacity-100 outline-none">
                <ChevronRightIcon className="w-5 h-5" />
              </button>
            </>
          )}
           {hasImages && property.images && (
            <div className="absolute bottom-2 right-2 text-white text-xs bg-black/50 px-2 py-1 rounded-full">
              {currentImageIndex + 1} / {property.images.length}
            </div>
          )}
        </div>

        {/* Property Info */}
        <div className="p-4 flex-grow w-full sm:w-3/5 flex flex-col justify-between">
            <div>
                 <div className="flex justify-between items-start">
                    <p className="text-2xl font-bold text-neutral-800">
                        ₹{(property.rent || 0).toLocaleString('en-IN')}
                        <span className="text-base font-normal text-neutral-500">/month</span>
                    </p>
                    {owner?.kycStatus === 'Verified' && (
                        <div className="flex-shrink-0 flex items-center gap-1 bg-green-100 text-green-700 text-xs font-semibold px-2 py-0.5 rounded-full" title="Owner's KYC is verified">
                            <ShieldCheckIcon className="w-3.5 h-3.5" />
                            Verified
                        </div>
                    )}
                </div>
                
                <h3 className="text-lg font-bold text-neutral-900 cursor-pointer hover:text-primary mt-1 truncate" onClick={() => onSelectProperty(property)}>
                    {property.title || 'Untitled Property'}
                </h3>
                <p className="text-sm text-neutral-500 flex items-center gap-1 truncate">
                    <LocationMarkerIcon className="w-4 h-4 flex-shrink-0" />
                    <span>{property.address || 'No address provided'}</span>
                </p>

                {property.distance !== undefined && (
                    <p className="text-sm text-blue-600 font-semibold mt-1">
                        {property.distance.toFixed(1)} km away
                    </p>
                )}

                <div className="my-4 py-3 border-y grid grid-cols-3 gap-2 text-center text-sm text-neutral-700">
                    <div className="flex flex-col items-center gap-1">
                        <BedIcon className="w-5 h-5 text-neutral-500"/>
                        <span className="font-semibold">{property.bedrooms || 0} Beds</span>
                    </div>
                    <div className="flex flex-col items-center gap-1 border-x">
                        <BathIcon className="w-5 h-5 text-neutral-500"/>
                        <span className="font-semibold">{property.bathrooms || 0} Baths</span>
                    </div>
                    <div className="flex flex-col items-center gap-1">
                        <RulerIcon className="w-5 h-5 text-neutral-500"/>
                        <span className="font-semibold">{(property.sqft || 0).toLocaleString()} sqft</span>
                    </div>
                </div>
            </div>

            <div className="flex justify-between items-center mt-2">
                 <span className={`inline-block text-xs font-semibold px-2 py-1 rounded-full ${
                        property.furnishing === FurnishingStatus.FURNISHED ? 'bg-green-100 text-green-800' :
                        property.furnishing === FurnishingStatus.SEMI_FURNISHED ? 'bg-yellow-100 text-yellow-800' :
                        'bg-neutral-200 text-neutral-700'
                    }`}>
                        {property.furnishing}
                </span>
                <button
                    onClick={() => onSelectProperty(property)}
                    className="px-4 py-2 bg-secondary hover:bg-primary text-white font-semibold rounded-md text-sm transition-colors duration-300"
                >
                    View Details
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default PropertyCard;