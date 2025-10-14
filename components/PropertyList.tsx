

import React, { useState, useMemo, useEffect } from 'react';
import type { Property, User, AiFilters } from '../types';
import { FurnishingStatus } from '../types';
import PropertyCard from './PropertyCard';
import MapComponent from './MapComponent';
import { SearchIcon, ListBulletIcon, MapIcon, FilterIcon } from './Icons';
import * as L from 'leaflet';


interface PropertyListProps {
  properties: Property[];
  users: User[];
  onSelectProperty: (property: Property) => void;
  initialSearchTerm?: string;
  cityName: string;
  aiFilters?: AiFilters | null;
  onAiFiltersApplied: () => void;
}

interface FilterCheckboxProps {
    label: string;
    value: any;
    checked: boolean;
    onChange: (value: any, isChecked: boolean) => void;
}

const FilterCheckbox: React.FC<FilterCheckboxProps> = ({ label, value, checked, onChange }) => (
    <label className="flex items-center space-x-2 cursor-pointer">
        <input
            type="checkbox"
            checked={checked}
            onChange={(e) => onChange(value, e.target.checked)}
            className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
        />
        <span className="text-sm text-neutral-700">{label}</span>
    </label>
);

const PropertyList: React.FC<PropertyListProps> = ({ properties, users, onSelectProperty, initialSearchTerm = '', cityName, aiFilters, onAiFiltersApplied }) => {
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [searchTerm, setSearchTerm] = useState(initialSearchTerm);
  const [sortBy, setSortBy] = useState('relevance');
  const [userCoords, setUserCoords] = useState<{ lat: number; lon: number } | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [mapBounds, setMapBounds] = useState<L.LatLngBounds | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    priceRange: { min: '', max: '' },
    bedrooms: [] as number[],
    bathrooms: [] as number[],
    furnishing: [] as FurnishingStatus[],
    propertyAge: [] as string[],
  });
  const [amenitySearchTerm, setAmenitySearchTerm] = useState<string[]>([]);
  
  useEffect(() => {
    if (aiFilters) {
        setFilters(prev => ({
            ...prev,
            priceRange: { ...prev.priceRange, max: aiFilters.rent_max?.toString() || '' },
            bedrooms: aiFilters.bedrooms || [],
            bathrooms: aiFilters.bathrooms || [],
            furnishing: aiFilters.furnishing || [],
        }));
        setAmenitySearchTerm(aiFilters.amenities || []);
        onAiFiltersApplied(); // Signal to parent to clear the filters
    }
  }, [aiFilters, onAiFiltersApplied]);

  useEffect(() => {
    setSearchTerm(initialSearchTerm);
    setMapBounds(null); // Clear map search on new initial search

    if (initialSearchTerm.toLowerCase() === 'near me') {
      setIsLocating(true);
      setLocationError(null);
      setUserCoords(null);

      if (!navigator.geolocation) {
        setLocationError('Geolocation is not supported by your browser.');
        setIsLocating(false);
        setSearchTerm('');
        return;
      }
      
      const successCallback = (position: GeolocationPosition) => {
        setUserCoords({ lat: position.coords.latitude, lon: position.coords.longitude });
        setIsLocating(false);
      };

      const handleError = (error: GeolocationPositionError, isHighAccuracyAttempt: boolean) => {
        // If the high-accuracy attempt fails, try again with low accuracy.
        if (isHighAccuracyAttempt) {
          console.warn(`High accuracy geolocation error: ${error.message}. Trying low accuracy.`);
          navigator.geolocation.getCurrentPosition(
            successCallback,
            (lowAccuracyError) => handleError(lowAccuracyError, false),
            { enableHighAccuracy: false, timeout: 15000, maximumAge: 60000 }
          );
          return;
        }

        // Handle final errors after all attempts fail.
        console.error(`Geolocation error: ${error.message}`);
        let message = 'Could not get your location. Please enable location services and try again.';
        if (error.code === error.PERMISSION_DENIED) {
          message = 'Location permission denied. Please enable it in your browser settings to use this feature.';
        } else if (error.code === error.TIMEOUT) {
          message = 'Finding your location took too long. Please check your connection and try again.';
        }
        setLocationError(message);
        setIsLocating(false);
        setSearchTerm(''); // Clear 'near me' search if location fails
      };

      // First attempt with high accuracy
      navigator.geolocation.getCurrentPosition(
        successCallback,
        (error) => handleError(error, true),
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    } else {
        setUserCoords(null);
        setIsLocating(false);
        setLocationError(null);
    }
  }, [initialSearchTerm]);

  const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    if (!lat1 || !lon1 || !lat2 || !lon2) return Infinity;
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

    const parsePropertyAge = (ageString: string): number => {
      if (!ageString) return Infinity;
      const lowerCaseAge = ageString.toLowerCase();
      if (lowerCaseAge === 'new' || lowerCaseAge.includes('less than 1 year')) return 0;
      const match = ageString.match(/\d+/);
      return match ? parseInt(match[0], 10) : Infinity;
    };

  const sortedProperties = useMemo(() => {
    const availableProperties = properties.filter(p => p.availability === 'available');
    
    return [...availableProperties].sort((a, b) => {
      switch (sortBy) {
        case 'price_asc':
          return (a.rent || 0) - (b.rent || 0);
        case 'price_desc':
          return (b.rent || 0) - (a.rent || 0);
        case 'date_desc':
          return new Date(b.postedDate || 0).getTime() - new Date(a.postedDate || 0).getTime();
        default:
          return 0; // 'relevance' - no change for now
      }
    });
  }, [properties, sortBy]);

  const filteredProperties = useMemo(() => {
    let baseFiltered = sortedProperties;

    // 1. Map bounds filtering (highest priority)
    if (mapBounds) {
      baseFiltered = sortedProperties.filter(property => {
        const { latitude, longitude } = property;
        if (typeof latitude !== 'number' || typeof longitude !== 'number') return false;
        return mapBounds.contains([latitude, longitude]);
      });
    } 
    // 2. Text search or 'near me' filtering
    else if (searchTerm.toLowerCase() === 'near me' && userCoords) {
      const RADIUS_KM = 25; // 25km radius
      baseFiltered = sortedProperties
        .map(property => ({
          ...property,
          distance: getDistance(userCoords.lat, userCoords.lon, property.latitude, property.longitude)
        }))
        .filter(property => property.distance <= RADIUS_KM)
        .sort((a, b) => a.distance - b.distance);
    } else if (searchTerm && searchTerm.toLowerCase() !== 'near me') {
      baseFiltered = sortedProperties.filter(property => {
        const lowercasedSearchTerm = searchTerm.toLowerCase();
        const titleMatch = (property.title || '').toLowerCase().includes(lowercasedSearchTerm);
        const addressMatch = (property.address || '').toLowerCase().includes(lowercasedSearchTerm);
        return titleMatch || addressMatch;
      });
    }

    // 3. Apply granular filters
    return baseFiltered.filter(property => {
        const { priceRange, bedrooms, bathrooms, furnishing, propertyAge } = filters;

        // Price filter
        const rent = property.rent || 0;
        const minPrice = parseFloat(priceRange.min);
        const maxPrice = parseFloat(priceRange.max);
        if (!isNaN(minPrice) && rent < minPrice) return false;
        if (!isNaN(maxPrice) && rent > maxPrice) return false;

        // Bedrooms filter
        const propBedrooms = property.bedrooms || 0;
        if (bedrooms.length > 0) {
            const hasMatch = bedrooms.some(b => 
                b === 4 ? propBedrooms >= 4 : propBedrooms === b
            );
            if (!hasMatch) return false;
        }

        // Bathrooms filter
        const propBathrooms = property.bathrooms || 0;
        if (bathrooms.length > 0) {
            const hasMatch = bathrooms.some(b => 
                b === 4 ? propBathrooms >= 4 : propBathrooms === b
            );
            if (!hasMatch) return false;
        }

        // Furnishing filter
        if (furnishing.length > 0 && !furnishing.includes(property.furnishing)) {
            return false;
        }

        // Property age filter
        if (propertyAge.length > 0) {
            const age = parsePropertyAge(property.ageOfProperty);
            const ageMatch = propertyAge.some(range => {
                if (range === '0-1') return age >= 0 && age <= 1;
                if (range === '1-5') return age > 1 && age <= 5;
                if (range === '5-10') return age > 5 && age <= 10;
                if (range === '10+') return age > 10;
                return false;
            });
            if (!ageMatch) return false;
        }

        // Amenity filter
        if (amenitySearchTerm.length > 0) {
            const propertyAmenities = (property.amenities || []).map(a => a.name.toLowerCase());
            const description = (property.description || '').toLowerCase();
            const allSearchableText = [...propertyAmenities, description].join(' ');
            
            const hasAllAmenities = amenitySearchTerm.every(term => 
                allSearchableText.includes(term.toLowerCase())
            );
            if (!hasAllAmenities) return false;
        }
        
        return true;
    });
  }, [sortedProperties, searchTerm, userCoords, mapBounds, filters, amenitySearchTerm]);
  
  const propertiesWithCoords = useMemo(() => {
    return filteredProperties.filter(p => typeof p.latitude === 'number' && typeof p.longitude === 'number');
  }, [filteredProperties]);

  const displayLocation = mapBounds 
    ? 'the selected map area' 
    : (searchTerm.toLowerCase() === 'near me' && userCoords) 
    ? 'Near You' 
    : (initialSearchTerm || cityName);

  const mapCenter: [number, number] = useMemo(() => {
    if (userCoords && searchTerm.toLowerCase() === 'near me') {
        return [userCoords.lat, userCoords.lon];
    }
    if (propertiesWithCoords.length === 0) {
        return [20.2961, 85.8245]; // Default to Bhubaneswar center
    }
    const avgLat = propertiesWithCoords.reduce((sum, p) => sum + p.latitude, 0) / propertiesWithCoords.length;
    const avgLon = propertiesWithCoords.reduce((sum, p) => sum + p.longitude, 0) / propertiesWithCoords.length;
    return [avgLat, avgLon];
  }, [propertiesWithCoords, userCoords, searchTerm]);

  const mapMarkers = useMemo(() => {
      const formatRent = (rent: number): string => {
        const rentVal = rent || 0;
        if (rentVal >= 100000) {
          const lakhs = rentVal / 100000;
          return `₹${lakhs % 1 === 0 ? lakhs.toFixed(0) : lakhs.toFixed(1)}L`;
        }
        if (rentVal >= 1000) {
          return `₹${Math.round(rentVal / 1000)}K`;
        }
        return `₹${rentVal}`;
      };

      return propertiesWithCoords.map(property => {
          const imageUrl = property.images && property.images.length > 0
              ? property.images[0]
              : 'https://picsum.photos/seed/placeholder/200/150';
          
          const priceIcon = L.divIcon({
              html: `<div class="bg-primary text-white font-bold text-sm px-2 py-1 rounded-full shadow-lg flex items-center justify-center">${formatRent(property.rent)}</div>`,
              className: '', // important to clear default styling to avoid conflicts
              iconSize: L.point(65, 24),
              iconAnchor: [32, 12]
          });
          
          return {
              id: property.id,
              position: [property.latitude, property.longitude] as [number, number],
              icon: priceIcon,
              content: (
                  <div className="w-48">
                      <img src={imageUrl} alt={property.title || 'Property Image'} className="w-full h-24 object-cover rounded-md mb-2" />
                      <h4 className="font-bold text-md leading-tight">{property.title || 'Untitled Property'}</h4>
                      <p className="text-sm">₹{(property.rent || 0).toLocaleString('en-IN')}/month</p>
                      <a href="#" onClick={(e) => { e.preventDefault(); onSelectProperty(property); }} className="text-primary font-semibold text-sm hover:underline">
                          View Details &rarr;
                      </a>
                  </div>
              )
          };
      });
  }, [propertiesWithCoords, onSelectProperty]);

  const handleBoundsChange = (bounds: L.LatLngBounds) => {
    setMapBounds(bounds);
    setSearchTerm(''); // Clear text search when doing map search
    setUserCoords(null);
  };

  const handleMarkerClick = (propertyId: string) => {
    const property = properties.find(p => p.id === propertyId);
    if (property) {
        onSelectProperty(property);
    }
  };

  const handleSearchTermChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setMapBounds(null); // Clear map search when user types
  };

  const handlePriceFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, priceRange: { ...prev.priceRange, [name]: value } }));
  };

  const handleCheckboxFilterChange = (category: 'bedrooms' | 'bathrooms' | 'furnishing' | 'propertyAge', value: any, isChecked: boolean) => {
    setFilters(prev => {
        const currentValues = prev[category] as any[];
        const newValues = isChecked 
            ? [...currentValues, value]
            : currentValues.filter(item => item !== value);
        return { ...prev, [category]: newValues };
    });
  };

  const clearFilters = () => {
      setFilters({
          priceRange: { min: '', max: '' },
          bedrooms: [],
          bathrooms: [],
          furnishing: [],
          propertyAge: [],
      });
      setAmenitySearchTerm([]);
  };

  return (
    <div className="flex h-[calc(100vh-80px)]">
      {/* Left side: Property List */}
      <div className={`${viewMode === 'list' ? 'flex' : 'hidden'} w-full md:w-3/5 lg:w-2/5 flex-col bg-white`}>
        <div className="p-4 border-b">
          <h2 className="text-xl font-bold text-neutral-900">
            Flats for rent in <span className="text-primary">{displayLocation}</span>
          </h2>
          <p className="text-sm text-neutral-500">{filteredProperties.length} results</p>
        </div>
        
        {/* Filters and Sorting */}
        <div className="p-4 border-b flex flex-col sm:flex-row gap-4 justify-between items-center">
            <div className="relative w-full sm:flex-grow">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <SearchIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                    type="text"
                    value={searchTerm}
                    onChange={handleSearchTermChange}
                    placeholder="Search..."
                    className="block w-full rounded-md border-gray-300 pl-10 shadow-sm focus:border-primary focus:ring-primary sm:text-sm py-2"
                />
            </div>

            <div className="flex items-center gap-2 self-end sm:self-center flex-shrink-0">
              <div className="flex items-center gap-2">
                <label htmlFor="sort" className="text-sm font-medium text-gray-700 whitespace-nowrap">Sort by:</label>
                <select 
                  id="sort" 
                  value={sortBy} 
                  onChange={(e) => setSortBy(e.target.value)}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm py-2"
                  disabled={(searchTerm.toLowerCase() === 'near me' && !!userCoords) || !!mapBounds}
                >
                  <option value="relevance">Relevance</option>
                  <option value="date_desc">Newest</option>
                  <option value="price_asc">Price: Low to High</option>
                  <option value="price_desc">Price: High to Low</option>
                </select>
              </div>

               <button
                  onClick={() => setShowFilters(prev => !prev)}
                  title="More Filters"
                  className={`p-2 rounded-md transition-colors border ${showFilters ? 'bg-secondary/10 border-secondary text-secondary' : 'text-neutral-600 border-gray-300 hover:bg-neutral-100'}`}
                  aria-pressed={showFilters}
              >
                  <FilterIcon className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-1 bg-neutral-200 p-1 rounded-lg">
                  <button
                      onClick={() => setViewMode('list')}
                      title="List View"
                      className={`p-2 rounded-md transition-colors ${viewMode === 'list' ? 'bg-white shadow' : 'text-neutral-600 hover:bg-neutral-300'}`}
                      aria-pressed={viewMode === 'list'}
                  >
                      <ListBulletIcon className="w-5 h-5" />
                  </button>
                  <button
                      onClick={() => setViewMode('map')}
                      title="Map View"
                      className={`p-2 rounded-md transition-colors ${viewMode === 'map' ? 'bg-white shadow' : 'text-neutral-600 hover:bg-neutral-300'}`}
                      aria-pressed={viewMode === 'map'}
                  >
                      <MapIcon className="w-5 h-5" />
                  </button>
              </div>
            </div>
        </div>
        
        {/* Filter Panel */}
        {showFilters && (
            <div className="p-4 border-b bg-neutral-50/50">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                    {/* Price Range */}
                    <div>
                        <label className="block text-sm font-semibold text-neutral-800 mb-2">Price Range</label>
                        <div className="flex items-center gap-2">
                            <input type="number" name="min" placeholder="Min" value={filters.priceRange.min} onChange={handlePriceFilterChange} className="w-full text-sm rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"/>
                            <span className="text-neutral-500">-</span>
                            <input type="number" name="max" placeholder="Max" value={filters.priceRange.max} onChange={handlePriceFilterChange} className="w-full text-sm rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"/>
                        </div>
                    </div>
                    {/* Bedrooms */}
                    <div>
                        <label className="block text-sm font-semibold text-neutral-800 mb-2">Bedrooms</label>
                        <div className="flex flex-wrap gap-x-4 gap-y-2">
                            {[1, 2, 3, 4].map(num => (
                                <FilterCheckbox key={num} label={num === 4 ? '4+' : `${num}`} value={num} checked={filters.bedrooms.includes(num)} onChange={(val, isChecked) => handleCheckboxFilterChange('bedrooms', val, isChecked)} />
                            ))}
                        </div>
                    </div>
                    {/* Bathrooms */}
                    <div>
                        <label className="block text-sm font-semibold text-neutral-800 mb-2">Bathrooms</label>
                        <div className="flex flex-wrap gap-x-4 gap-y-2">
                            {[1, 2, 3, 4].map(num => (
                                <FilterCheckbox key={num} label={num === 4 ? '4+' : `${num}`} value={num} checked={filters.bathrooms.includes(num)} onChange={(val, isChecked) => handleCheckboxFilterChange('bathrooms', val, isChecked)} />
                            ))}
                        </div>
                    </div>
                    {/* Furnishing Status */}
                    <div>
                        <label className="block text-sm font-semibold text-neutral-800 mb-2">Furnishing</label>
                        <div className="flex flex-col gap-2">
                            {Object.values(FurnishingStatus).map(status => (
                                <FilterCheckbox key={status} label={status} value={status} checked={filters.furnishing.includes(status)} onChange={(val, isChecked) => handleCheckboxFilterChange('furnishing', val, isChecked)} />
                            ))}
                        </div>
                    </div>
                     {/* Property Age */}
                    <div>
                        <label className="block text-sm font-semibold text-neutral-800 mb-2">Property Age</label>
                        <div className="flex flex-col gap-2">
                             <FilterCheckbox label="New (0-1yr)" value="0-1" checked={filters.propertyAge.includes('0-1')} onChange={(val, isChecked) => handleCheckboxFilterChange('propertyAge', val, isChecked)} />
                             <FilterCheckbox label="1-5 years" value="1-5" checked={filters.propertyAge.includes('1-5')} onChange={(val, isChecked) => handleCheckboxFilterChange('propertyAge', val, isChecked)} />
                             <FilterCheckbox label="5-10 years" value="5-10" checked={filters.propertyAge.includes('5-10')} onChange={(val, isChecked) => handleCheckboxFilterChange('propertyAge', val, isChecked)} />
                             <FilterCheckbox label="10+ years" value="10+" checked={filters.propertyAge.includes('10+')} onChange={(val, isChecked) => handleCheckboxFilterChange('propertyAge', val, isChecked)} />
                        </div>
                    </div>
                </div>
                <div className="mt-4 pt-4 border-t text-right">
                    <button onClick={clearFilters} className="text-sm font-semibold text-primary hover:underline">Clear All Filters</button>
                </div>
            </div>
        )}

        <div className="flex-grow overflow-y-auto custom-scrollbar p-4">
          <div className="space-y-4">
            {isLocating ? (
              <div className="text-center py-12">
                <h3 className="text-xl font-semibold text-neutral-700">Finding properties near you...</h3>
                <p className="text-neutral-500 mt-2">Please wait a moment.</p>
              </div>
            ) : locationError ? (
              <div className="text-center py-12 m-4 p-4 bg-red-50 text-red-700 rounded-lg">
                <h3 className="text-xl font-semibold">Location Error</h3>
                <p className="mt-2">{locationError}</p>
              </div>
            ) : filteredProperties.length > 0 ? (
              filteredProperties.map((property) => {
                const owner = users.find(u => u.id === property.ownerId);
                return <PropertyCard key={property.id} property={property} owner={owner} onSelectProperty={onSelectProperty} />
              })
            ) : (
              <div className="text-center py-12">
                <h3 className="text-xl font-semibold text-neutral-700">No Properties Found</h3>
                <p className="text-neutral-500 mt-2">
                  {mapBounds
                    ? "Try adjusting the map area or clearing your search."
                    : searchTerm.toLowerCase() === 'near me'
                    ? "We couldn't find any available properties within a 25km radius."
                    : 'Try adjusting your search or filter criteria.'
                  }
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Right side: Map */}
      <div className={`${viewMode === 'list' ? 'hidden md:block md:w-2/5 lg:w-3/5' : 'w-full'} bg-neutral-200 relative`}>
         <MapComponent 
            center={mapCenter} 
            zoom={searchTerm.toLowerCase() === 'near me' ? 11 : 12} 
            markers={mapMarkers} 
            className="h-full w-full"
            onBoundsChange={handleBoundsChange}
            onMarkerClick={handleMarkerClick}
        />
        {/* Map view has its own controls overlay */}
        {viewMode === 'map' && (
             <div className="absolute top-4 right-4 z-[1000] flex items-center gap-1 bg-neutral-200 p-1 rounded-lg shadow-lg">
                  <button
                      onClick={() => setViewMode('list')}
                      title="List View"
                      className={`p-2 rounded-md transition-colors ${viewMode === 'map' ? 'text-neutral-600 hover:bg-neutral-300' : 'bg-white shadow'}`}
                      aria-pressed={viewMode !== 'map'}
                  >
                      <ListBulletIcon className="w-5 h-5" />
                  </button>
                  <button
                      onClick={() => setViewMode('map')}
                      title="Map View"
                      className={`p-2 rounded-md transition-colors ${viewMode === 'map' ? 'bg-white shadow' : 'text-neutral-600 hover:bg-neutral-300'}`}
                      aria-pressed={viewMode === 'map'}
                  >
                      <MapIcon className="w-5 h-5" />
                  </button>
              </div>
        )}
      </div>
    </div>
  );
};

export default PropertyList;