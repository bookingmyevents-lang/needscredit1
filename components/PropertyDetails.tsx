import React, { useState, useMemo } from 'react';
import type { Property, Review, Amenity, FurnishingItem, NearbyPlace, User } from '../types';
import MapComponent from './MapComponent';
import * as Icons from './Icons';
import Breadcrumb from './Breadcrumb';
import PropertyCard from './PropertyCard';

interface PropertyDetailsProps {
  properties: Property[];
  users: User[];
  reviews: Review[];
  property: Property;
  owner?: User;
  onBack: () => void;
  onScheduleViewing: (property: Property) => void;
  onBookNow: (property: Property) => void;
  onNavigateToHome: () => void;
  onNavigateToBrowsing: () => void;
  currentUser: User | null;
  savedProperties: string[];
  onToggleSaveProperty: (propertyId: string) => void;
  onSelectProperty: (property: Property) => void;
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
        case 'Transport Hub':
            return <Icons.MapIcon className="w-5 h-5 text-secondary flex-shrink-0" />;
        default:
            return <Icons.LocationMarkerIcon className="w-5 h-5 text-secondary flex-shrink-0" />;
    }
};

// FIX: Define the missing DetailItem component that was likely removed by the file corruption.
const DetailItem: React.FC<{ icon: React.ReactNode; label: string; value: string | number }> = ({ icon, label, value }) => (
    <div className="flex items-start gap-3">
        <div className="flex-shrink-0 text-neutral-500">{icon}</div>
        <div>
            <p className="font-semibold text-neutral-800">{value}</p>
            <p className="text-xs text-neutral-500">{label}</p>
        </div>
    </div>
);


const PropertyDetails: React.FC<PropertyDetailsProps> = ({ properties, users, reviews, property, owner, onBack, onScheduleViewing, onBookNow, onNavigateToHome, onNavigateToBrowsing, currentUser, savedProperties, onToggleSaveProperty, onSelectProperty }) => {
  const [mainImage, setMainImage] = useState(property.images?.[0] || 'https://picsum.photos/seed/placeholder/800/600');
  const [showAllAmenities, setShowAllAmenities] = useState(false);
  const [isPanoModalOpen, setIsPanoModalOpen] = useState(false);
  
  const isSaved = savedProperties.includes(property.id);

  const safeAmenities = property.amenities || [];
  const safeFurnishingItems = property.furnishingItems || [];
  
  const propertyReviews = useMemo(() => {
    return (property.reviewIds || [])
        .map(id => reviews.find(r => r.id === id))
        .filter((r): r is Review => r !== undefined);
  }, [property.reviewIds, reviews]);


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

  const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
      if (!lat1 || !lon1 || !lat2 || !lon2 || (lat1 === lat2 && lon1 === lon2)) return 0;
      const R = 6371; // Radius of the earth in km
      const dLat = (lat2 - lat1) * Math.PI / 180;
      const dLon = (lon2 - lon1) * Math.PI / 180;
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return R * c; // Distance in km
  };

  const similarProperties = useMemo(() => {
    if (!properties || !property) return [];

    const RADIUS_KM = 5;
    const PRICE_PERCENT_DIFF = 0.20; // +/- 20%

    return properties
      .filter(p => 
          p.id !== property.id && 
          p.availability === 'available' &&
          p.bedrooms === property.bedrooms &&
          Math.abs(p.rent - property.rent) <= property.rent * PRICE_PERCENT_DIFF &&
          getDistance(property.latitude, property.longitude, p.latitude, p.longitude) <= RADIUS_KM
      )
      .slice(0, 3); // Limit to 3 similar properties
  }, [properties, property]);

  const handleToggleSave = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleSaveProperty(property.id);
  };

  return (
    <>
      <Breadcrumb items={breadcrumbItems} />
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Main Content */}
        <div className="lg:w-2/3">
          {/* Image Gallery */}
          <div className="mb-6">
            <img src={mainImage} alt={property.title} className="w-full h-96 object-cover rounded-lg shadow-lg mb-2" />
            <div className="flex gap-2 overflow-x-auto custom-scrollbar pb-2">
              {property.images?.map((img, index) => (
                <img
                  key={index}
                  src={img}
                  alt={`Thumbnail ${index + 1}`}
                  className={`w-24 h-24 object-cover rounded-md cursor-pointer border-2 ${mainImage === img ? 'border-primary' : 'border-transparent'}`}
                  onClick={() => setMainImage(img)}
                />
              ))}
            </div>
          </div>

          {/* Property Header */}
          <div className="bg-white rounded-lg shadow-md border border-neutral-200 p-6 mb-6">
             <div className="flex justify-between items-start">
                <div>
                    <h1 className="text-3xl font-bold text-neutral-900">{property.title}</h1>
                    <p className="text-neutral-600 mt-1 flex items-center gap-1"><Icons.LocationMarkerIcon className="w-5 h-5"/> {property.address}</p>
                </div>
                <div className="flex items-center gap-2">
                   <button onClick={handleToggleSave} className="p-2 bg-neutral-100 hover:bg-neutral-200 rounded-full" title={isSaved ? "Unsave" : "Save"}>
                       <Icons.HeartIcon className={`w-6 h-6 ${isSaved ? 'text-red-500 fill-current' : 'text-neutral-600'}`} />
                   </button>
                   <button className="p-2 bg-neutral-100 hover:bg-neutral-200 rounded-full" title="Share">
                       <Icons.ShareIcon className="w-6 h-6 text-neutral-600" />
                   </button>
                </div>
             </div>
             <div className="mt-4 pt-4 border-t flex flex-wrap items-end justify-between gap-4">
                <div>
                    <p className="text-3xl font-bold text-primary">₹{property.rent.toLocaleString()}<span className="text-lg font-normal text-neutral-500">/month</span></p>
                    <p className="text-sm text-neutral-500">Security Deposit: ₹{property.securityDeposit.toLocaleString()}</p>
                </div>
                 <div className="flex flex-wrap gap-4 text-center">
                    <div className="flex flex-col items-center gap-1"><Icons.BedIcon className="w-6 h-6 text-neutral-500"/> <span className="text-sm font-semibold">{property.bedrooms} Beds</span></div>
                    <div className="flex flex-col items-center gap-1"><Icons.BathIcon className="w-6 h-6 text-neutral-500"/> <span className="text-sm font-semibold">{property.bathrooms} Baths</span></div>
                    <div className="flex flex-col items-center gap-1"><Icons.RulerIcon className="w-6 h-6 text-neutral-500"/> <span className="text-sm font-semibold">{property.sqft.toLocaleString()} sqft</span></div>
                </div>
             </div>
          </div>
          
          {/* Description */}
          <InfoCard title="About this property">
            <p className="text-neutral-700 whitespace-pre-line">{property.description}</p>
          </InfoCard>

          {/* FIX: Replaced huge block of corrupted text with the correct InfoCard for Details. */}
          <InfoCard title="Details">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-y-4 text-sm">
                <DetailItem icon={<Icons.CubeIcon className="w-5 h-5"/>} label="Project" value={property.projectName} />
                <DetailItem icon={<Icons.CheckCircleIcon className="w-5 h-5"/>} label="Availability" value={availableFromText()} />
                <DetailItem icon={<Icons.CalendarDaysIcon className="w-5 h-5"/>} label="Posted On" value={new Date(property.postedDate).toLocaleDateString()} />
                <DetailItem icon={<Icons.UserGroupIcon className="w-5 h-5"/>} label="Lease Type" value={property.leaseType} />
                <DetailItem icon={<Icons.MapIcon className="w-5 h-5"/>} label="Facing" value={property.facing} />
                <DetailItem icon={<Icons.ClockIcon className="w-5 h-5"/>} label="Property Age" value={property.ageOfProperty} />
                <DetailItem icon={<Icons.BuildingIcon className="w-5 h-5"/>} label="Floor" value={property.floor} />
                <DetailItem icon={<Icons.CreditCardIcon className="w-5 h-5"/>} label="Brokerage" value={property.brokerage > 0 ? `₹${property.brokerage.toLocaleString()}` : 'No Brokerage'} />
                <DetailItem icon={<Icons.KeyIcon className="w-5 h-5"/>} label="Viewing Advance" value={`₹${property.viewingAdvance.toLocaleString()}`} />
            </div>
          </InfoCard>

          {/* FIX: Re-added the rest of the component body that was overwritten by the corrupted code. */}
          {safeAmenities.length > 0 && (
            <InfoCard title="Amenities">
                <ul className="grid grid-cols-2 md:grid-cols-3 gap-4 text-neutral-700">
                    {displayedAmenities.map((amenity: Amenity) => (
                        <li key={amenity.name} className="flex items-center gap-3">
                            <AmenityIcon name={amenity.icon} />
                            <span>{amenity.name}</span>
                        </li>
                    ))}
                </ul>
                {safeAmenities.length > 8 && (
                    <button onClick={() => setShowAllAmenities(!showAllAmenities)} className="text-primary font-semibold mt-4">
                        {showAllAmenities ? 'Show less' : `+${safeAmenities.length - 8} more`}
                    </button>
                )}
            </InfoCard>
          )}

          {safeFurnishingItems.length > 0 && (
            <InfoCard title="Furnishing Details">
                <ul className="grid grid-cols-2 md:grid-cols-3 gap-4 text-neutral-700">
                    {safeFurnishingItems.map((item: FurnishingItem) => (
                        <li key={item.name} className="flex items-center gap-3">
                            <AmenityIcon name={item.icon} />
                            <span>{item.name} {item.quantity > 1 ? `(x${item.quantity})` : ''}</span>
                        </li>
                    ))}
                </ul>
            </InfoCard>
          )}
          
          {property.nearbyPlaces && property.nearbyPlaces.length > 0 && (
            <InfoCard title="What's Nearby?">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                    {property.nearbyPlaces.map((place: NearbyPlace) => (
                        <div key={place.name} className="flex items-center gap-3">
                            <NearbyPlaceIcon type={place.type} />
                            <div>
                                <p className="font-semibold text-neutral-800">{place.name}</p>
                                <p className="text-sm text-neutral-500">{place.type} &bull; {place.distance}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </InfoCard>
          )}
          
          <InfoCard title="Location">
            {hasCoordinates ? (
                <div className="h-80 rounded-lg overflow-hidden">
                    <MapComponent center={[property.latitude, property.longitude]} zoom={15} markers={mapMarkers} />
                </div>
            ) : (
                <p>Location data is not available for this property.</p>
            )}
          </InfoCard>

          <InfoCard title="Reviews & Ratings">
            {propertyReviews.length > 0 ? (
                <div className="space-y-6">
                    {propertyReviews.map(review => (
                        <div key={review.id} className="border-b pb-6 last:border-b-0">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="font-bold text-neutral-800">{review.author}</div>
                                <div className="text-xs text-neutral-500">{review.time}</div>
                            </div>
                            <div className="flex items-center gap-1 mb-2">
                                {[...Array(5)].map((_, i) => (
                                    <Icons.StarIcon key={i} className={`w-5 h-5 ${i < review.rating ? 'text-yellow-400' : 'text-gray-300'}`} />
                                ))}
                            </div>
                            <div className="text-sm">
                                <p className="font-semibold text-green-600">What I liked:</p>
                                <p className="text-neutral-700">{review.goodThings}</p>
                                <p className="font-semibold text-red-600 mt-2">What can be improved:</p>
                                <p className="text-neutral-700">{review.needsImprovement}</p>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <p className="text-neutral-600">No reviews yet for this property.</p>
            )}
          </InfoCard>

          {owner && (
            <InfoCard title="About the Owner">
                <div className="flex items-center gap-4">
                    <img src={owner.profilePictureUrl || 'https://i.pravatar.cc/150'} alt={owner.name} className="w-16 h-16 rounded-full object-cover" />
                    <div>
                        <h4 className="text-lg font-bold">{owner.name}</h4>
                        {owner.kycStatus === 'Verified' && <div className="text-sm font-semibold text-green-600 flex items-center gap-1"><Icons.ShieldCheckIcon className="w-4 h-4" /> Verified Owner</div>}
                    </div>
                </div>
                <p className="text-neutral-700 mt-4">{owner.bio}</p>
            </InfoCard>
          )}
        </div>

        {/* Sidebar */}
        <div className="lg:w-1/3">
            <div className="sticky top-24 space-y-6">
                <div className="bg-white p-6 rounded-lg shadow-lg border">
                    <h3 className="text-xl font-bold mb-4">Interested in this property?</h3>
                    {property.availability === 'available' ? (
                        <div className="space-y-3">
                            <button onClick={() => onScheduleViewing(property)} className="w-full bg-secondary hover:bg-primary text-white font-bold py-3 px-4 rounded-lg transition-colors">Schedule a Visit</button>
                            <button onClick={() => onBookNow(property)} className="w-full bg-primary/10 hover:bg-primary/20 text-primary font-bold py-3 px-4 rounded-lg transition-colors">Book Now & Apply</button>
                        </div>
                    ) : (
                        <p className="p-3 bg-red-100 text-red-800 text-center font-semibold rounded-md">This property has been rented out.</p>
                    )}
                </div>
                {property.panoViewUrl && (
                     <div className="bg-white p-6 rounded-lg shadow-lg border text-center">
                        <h3 className="text-xl font-bold mb-2">Take a Virtual Tour</h3>
                        <p className="text-sm text-neutral-600 mb-4">Explore the property from the comfort of your home.</p>
                        <button onClick={() => setIsPanoModalOpen(true)} className="w-full bg-accent hover:bg-yellow-500 text-neutral-900 font-bold py-3 px-4 rounded-lg transition-colors">
                            View 360° Tour
                        </button>
                     </div>
                )}
            </div>
        </div>
      </div>

      {similarProperties.length > 0 && (
        <div className="mt-12 pt-12 border-t">
            <h2 className="text-3xl font-bold text-neutral-900 mb-8 text-center">Similar Properties You Might Like</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {similarProperties.map(p => (
                    <PropertyCard 
                        key={p.id} 
                        property={p}
                        owner={users.find(u => u.id === p.ownerId)}
                        onSelectProperty={onSelectProperty}
                        currentUser={currentUser}
                        isSaved={savedProperties.includes(p.id)}
                        onToggleSave={onToggleSaveProperty}
                    />
                ))}
            </div>
        </div>
      )}
      
      {isPanoModalOpen && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center" onClick={() => setIsPanoModalOpen(false)}>
            <button onClick={() => setIsPanoModalOpen(false)} className="absolute top-4 right-4 text-white hover:text-gray-300 z-50">
                <Icons.XCircleIcon className="w-10 h-10" />
            </button>
            <div className="w-full h-full p-4" onClick={e => e.stopPropagation()}>
                <iframe
                    src={property.panoViewUrl}
                    className="w-full h-full border-0"
                    allowFullScreen
                    title="360 Pano View"
                ></iframe>
            </div>
        </div>
      )}
    </>
  );
};

export default PropertyDetails;