import React, { useState } from 'react';
import type { Property, Review, Amenity, FurnishingItem, NearbyPlace, User } from '../types';
import MapComponent from './MapComponent';
import * as Icons from './Icons';
import Breadcrumb from './Breadcrumb';

interface PropertyDetailsProps {
  property: Property;
  owner?: User;
  onBack: () => void;
  onScheduleViewing: (property: Property) => void;
  onNavigateToHome: () => void;
  onNavigateToBrowsing: () => void;
}

const InfoCard: React.FC<{ title: string; children: React.ReactNode; className?: string }> = ({ title, children, className = '' }) => (
  <div className={`bg-white rounded-lg shadow-md border border-neutral-200 p-6 mb-6 ${className}`}>
    <h3 className="text-xl font-bold text-neutral-800 mb-4">{title}</h3>
    {children}
  </div>
);

const AmenityIcon: React.FC<{ name: string }> = ({ name }) => {
    const IconComponent = (Icons as any)[name] || Icons.CheckIcon;
    return <IconComponent className="w-5 h-5 text-secondary" />;
};

const NearbyPlaceIcon: React.FC<{ type: NearbyPlace['type'] }> = ({ type }) => {
    switch (type) {
        case 'School':
        case 'IT Park':
            return <Icons.BuildingIcon className="w-5 h-5 text-secondary flex-shrink-0" />;
        case 'Hospital':
            return <Icons.PlusCircleIcon className="w-5 h-5 text-secondary flex-shrink-0" />;
        case 'Restaurant':
            return <Icons.RestaurantIcon className="w-5 h-5 text-secondary flex-shrink-0" />;
        case 'Shopping':
            return <Icons.CreditCardIcon className="w-5 h-5 text-secondary flex-shrink-0" />;
        case 'Park':
            return <Icons.YardIcon className="w-5 h-5 text-secondary flex-shrink-0" />;
        default:
            return <Icons.LocationMarkerIcon className="w-5 h-5 text-secondary flex-shrink-0" />;
    }
};

const PropertyDetails: React.FC<PropertyDetailsProps> = ({ property, owner, onBack, onScheduleViewing, onNavigateToHome, onNavigateToBrowsing }) => {
  const [mainImage, setMainImage] = useState(property.images?.[0] || 'https://picsum.photos/seed/placeholder/800/600');
  const [showAllAmenities, setShowAllAmenities] = useState(false);

  const safeAmenities = property.amenities || [];
  const safeFurnishingItems = property.furnishingItems || [];
  const safeReviews = property.reviews || [];

  const displayedAmenities = showAllAmenities ? safeAmenities : safeAmenities.slice(0, 8);

  const hasCoordinates = typeof property.latitude === 'number' && typeof property.longitude === 'number';

  const mapMarkers = hasCoordinates ? [{
      id: property.id,
      position: [property.latitude, property.longitude] as [number, number],
      content: `<b>${property.title || 'Property Location'}</b><br/>${property.address || ''}`
  }] : [];
  
  const addressParts = (property.address || '').split(',').map(p => p.trim());
  const locality = addressParts.length > 1 ? addressParts[1] : (addressParts[0] || '');
  
  const availableFromText = () => {
    if (property.availability !== 'available') {
        return 'Rented';
    }
    if (!property.availableDate) {
        return 'Available now';
    }
    const availableDate = new Date(property.availableDate);
    const today = new Date();
    // Set hours to 0 to compare dates only
    today.setHours(0,0,0,0);
    
    if (availableDate <= today) {
        return 'Available now';
    }
    return availableDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  };
  
  const breadcrumbItems = [
    { label: 'Home', onClick: onNavigateToHome },
    { label: 'Properties', onClick: onNavigateToBrowsing },
    { label: property.title.length > 40 ? `${property.title.substring(0, 40)}...` : property.title }
  ];

  const subject = encodeURIComponent(`Inquiry about your property: "${property.title}"`);
  const body = encodeURIComponent(
    `Hi ${owner?.name || 'Owner'},\n\nI am interested in your property listed on RentEase located at ${property.address} (ID: ${property.id}).\n\n[Your message here]\n\nThank you.`
  );
  const mailtoLink = `mailto:${owner?.email}?subject=${subject}&body=${body}`;

  return (
    <div className="bg-neutral-100">
       <div className="container mx-auto py-6">
          <Breadcrumb items={breadcrumbItems} />
          
          <div className="flex justify-between items-start mb-2">
              <div>
                  <h2 className="text-3xl font-bold text-neutral-900">{property.title || 'Property Details'}</h2>
                  <p className="text-neutral-600 flex items-center gap-2 mt-1">
                      <Icons.LocationIcon className="w-5 h-5" />
                      {property.address || 'Address not available'}
                  </p>
              </div>
              <div className="flex items-center gap-2">
                  <button className="p-3 bg-white border rounded-full text-neutral-600 hover:text-primary hover:border-primary transition">
                      <Icons.ShareIcon className="w-5 h-5" />
                  </button>
                  <button className="p-3 bg-white border rounded-full text-neutral-600 hover:text-primary hover:border-primary transition">
                      <Icons.HeartIcon className="w-5 h-5" />
                  </button>
              </div>
          </div>

          <div className="grid grid-cols-4 gap-2 mb-6">
                <div className="col-span-4 md:col-span-3">
                     <img src={mainImage} alt="Main property view" className="w-full h-[450px] object-cover rounded-lg" />
                </div>
                <div className="col-span-4 md:col-span-1 grid grid-cols-4 md:grid-cols-2 md:grid-rows-2 gap-2">
                    {property.images?.slice(1, 5)?.map((img, index) => (
                        <img
                            key={index}
                            src={img}
                            alt={`Thumbnail ${index + 1}`}
                            className={`w-full h-full object-cover rounded-md cursor-pointer border-2 ${mainImage === img ? 'border-primary' : 'border-transparent'}`}
                            onClick={() => setMainImage(img)}
                        />
                    ))}
                </div>
          </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
                <InfoCard title="Overview">
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
                        <div><p className="text-sm text-neutral-500">Project Name</p><p className="font-semibold">{property.projectName || 'N/A'}</p></div>
                        <div><p className="text-sm text-neutral-500">Security</p><p className="font-semibold">₹{(property.securityDeposit || 0).toLocaleString('en-IN')}</p></div>
                         <div><p className="text-sm text-neutral-500">Brokerage</p><p className="font-semibold">₹{(property.brokerage || 0).toLocaleString('en-IN')}</p></div>
                        <div><p className="text-sm text-neutral-500">Built up area</p><p className="font-semibold">{(property.sqft || 0)} sq.ft</p></div>
                         <div><p className="text-sm text-neutral-500">Furnishing</p><p className="font-semibold">{property.furnishing || 'N/A'}</p></div>
                        <div><p className="text-sm text-neutral-500">Bathrooms</p><p className="font-semibold">{property.bathrooms || 0}</p></div>
                        <div><p className="text-sm text-neutral-500">Balcony</p><p className="font-semibold">{property.balconies || 0}</p></div>
                        <div><p className="text-sm text-neutral-500">Available from</p><p className="font-semibold">{availableFromText()}</p></div>
                         <div><p className="text-sm text-neutral-500">Floor number</p><p className="font-semibold">{property.floor || 'N/A'}</p></div>
                         <div><p className="text-sm text-neutral-500">Lease type</p><p className="font-semibold">{property.leaseType || 'N/A'}</p></div>
                        <div><p className="text-sm text-neutral-500">Age of property</p><p className="font-semibold">{property.ageOfProperty || 'N/A'}</p></div>
                        <div><p className="text-sm text-neutral-500">Parking</p><p className="font-semibold">{property.parking || 'N/A'}</p></div>
                    </div>
                </InfoCard>

                <InfoCard title="About this property">
                    <p className="text-neutral-700 leading-relaxed">{property.description || 'No description provided.'}</p>
                </InfoCard>

                 {safeFurnishingItems.length > 0 && <InfoCard title="What this place offers (Furnishings)">
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                        {safeFurnishingItems.map((item) => (
                            <div key={item.name} className="flex flex-col items-center justify-center gap-2 text-center bg-neutral-50 p-4 rounded-lg border">
                                <AmenityIcon name={item.icon} />
                                <p className="font-semibold text-sm mt-1">{item.name}</p>
                                <span className="text-xs text-neutral-600 bg-neutral-200 px-2 py-0.5 rounded-full">
                                    Quantity: {item.quantity}
                                </span>
                            </div>
                        ))}
                    </div>
                </InfoCard>}

                {safeAmenities.length > 0 && (
                    <InfoCard title="Amenities">
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                            {displayedAmenities.map((amenity) => (
                                <div key={amenity.name} className="flex items-center gap-3 bg-neutral-50 p-3 rounded-lg border">
                                    <AmenityIcon name={amenity.icon} />
                                    <p className="text-sm font-medium text-neutral-700">{amenity.name}</p>
                                </div>
                            ))}
                        </div>
                        {safeAmenities.length > 8 && (
                            <button 
                                onClick={() => setShowAllAmenities(!showAllAmenities)} 
                                className="text-primary font-semibold mt-6 block text-center w-full hover:underline"
                            >
                                {showAllAmenities ? 'Show Less' : `Show All ${safeAmenities.length} Amenities`}
                            </button>
                        )}
                    </InfoCard>
                )}

                {safeReviews.length > 0 && <InfoCard title={`Resident reviews for ${locality}`}>
                    <div className="space-y-4">
                        {safeReviews.map(review => (
                            <div key={review.id} className="border-t pt-4">
                                <div className="flex items-center justify-between">
                                    <p className="font-bold">{review.author} <span className="text-sm font-normal text-neutral-500">({review.role})</span></p>
                                    <div className="flex items-center gap-1 bg-green-600 text-white px-2 py-0.5 rounded-md text-sm">
                                        <span>{review.rating}</span>
                                        <Icons.StarIcon className="w-3 h-3"/>
                                    </div>
                                </div>
                                <p className="text-xs text-neutral-500 mb-2">{review.time}</p>
                                <p className="text-sm text-neutral-700"><span className="font-semibold text-green-700">Good things here:</span> {review.goodThings}</p>
                                <p className="text-sm text-neutral-700 mt-1"><span className="font-semibold text-red-700">Things need improvement:</span> {review.needsImprovement}</p>
                            </div>
                        ))}
                    </div>
                </InfoCard>}

                <InfoCard title={`Explore Neighbourhood - ${locality}`}>
                    <div className="h-64 bg-neutral-200 rounded-md mb-4 flex items-center justify-center">
                        {hasCoordinates ? (
                            <MapComponent center={[property.latitude, property.longitude]} zoom={15} markers={mapMarkers} className="h-full w-full rounded-md" />
                        ) : (
                            <p className="text-neutral-500">Map location not available.</p>
                        )}
                    </div>
                </InfoCard>
            </div>

            <div className="lg:col-span-1">
                <div className="sticky top-24">
                     <InfoCard title="Around This Property">
                         <ul className="space-y-4">
                            {(property.nearbyPlaces || []).map(place => (
                                 <li key={place.name} className="flex items-center gap-3 text-sm">
                                     <div className="bg-neutral-100 p-2 rounded-full">
                                        <NearbyPlaceIcon type={place.type} />
                                     </div>
                                     <div className="flex justify-between items-center w-full">
                                        <div>
                                            <p className="font-semibold">{place.name}</p>
                                            <p className="text-xs text-neutral-500">{place.type}</p>
                                        </div>
                                        <span className="text-neutral-600 text-right font-medium text-xs bg-neutral-100 px-2 py-1 rounded-full">{place.distance}</span>
                                     </div>
                                 </li>
                            ))}
                         </ul>
                          {hasCoordinates ? (
                              <a 
                                  href={`https://www.google.com/maps/search/?api=1&query=${property.latitude},${property.longitude}`} 
                                  target="_blank" 
                                  rel="noopener noreferrer" 
                                  className="text-primary font-semibold mt-4 block text-sm hover:underline"
                              >
                                  View more on Maps
                              </a>
                          ) : (
                              <p className="text-neutral-400 mt-4 block text-sm">Map view not available</p>
                          )}
                     </InfoCard>
                </div>
            </div>
        </div>

       </div>
       <div className="sticky bottom-0 bg-white shadow-[0_-2px_10px_rgba(0,0,0,0.1)] p-4 z-20">
            <div className="container mx-auto flex justify-between items-center">
                <div>
                     <p className="text-2xl font-bold text-primary">
                        ₹{(property.rent || 0).toLocaleString('en-IN')}
                        <span className="text-base font-normal text-neutral-700">/month</span>
                    </p>
                    <p className="text-sm text-neutral-500">Refundable advance: ₹{property.viewingAdvance.toLocaleString('en-IN')}</p>
                </div>
                {property.availability === 'available' ? (
                     <div className="flex items-center gap-4">
                        <a
                            href={owner ? mailtoLink : '#'}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`flex items-center gap-2 px-6 py-3 bg-neutral-200 hover:bg-neutral-300 text-neutral-800 font-bold rounded-lg transition-colors duration-300 text-center ${!owner && 'opacity-50 cursor-not-allowed'}`}
                            onClick={(e) => !owner && e.preventDefault()}
                            aria-disabled={!owner}
                        >
                            <Icons.MailIcon className="w-5 h-5" />
                            Contact Owner
                        </a>
                        <button
                            onClick={() => onScheduleViewing(property)}
                            className="px-6 py-3 bg-secondary hover:bg-primary text-white font-bold rounded-lg transition-colors duration-300"
                            >
                            Schedule a Viewing
                        </button>
                    </div>
                ) : (
                     <p className="px-6 py-3 bg-neutral-200 text-neutral-600 font-bold rounded-lg">Already Rented</p>
                )}
            </div>
       </div>
    </div>
  );
};

export default PropertyDetails;