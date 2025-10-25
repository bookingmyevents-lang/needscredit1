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
  currentUser: User | null;
  savedProperties: string[];
  onToggleSaveProperty: (propertyId: string) => void;
}

interface FilterCheckboxProps {
    label: string;
    value: any;
    checked: boolean;
    onChange: (value: any, isChecked: boolean) => void;
}

const cityCoordinates: { [key: string]: [number, number] } = {
    'bhubaneswar': [20.2961, 85.8245],
    'cuttack': [20.4624, 85.8833],
    'puri': [19.8135, 85.8312],
    'sambalpur': [21.4705, 83.9701],
    'rourkela': [22.2492, 84.8536],
    'balasore': [21.4925, 86.9325],
};


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

const PropertyList: React.FC<PropertyListProps> = ({ properties, users, onSelectProperty, initialSearchTerm = '', cityName, aiFilters, onAiFiltersApplied, currentUser, savedProperties, onToggleSaveProperty }) => {
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
  const [mapView, setMapView] = useState({ center: [20.9517, 85.0985] as [number, number], zoom: 8 }); // Center of Odisha, zoomed out
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 1024); // Use lg breakpoint for split view
  
  useEffect(() => {
    const handleResize = () => {
      setIsDesktop(window.innerWidth >= 1024);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
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
    // Attempt to get user's location on component mount to enable distance sorting
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserCoords({ lat: position.coords.latitude, lon: position.coords.longitude });
        },
        (error) => {
          console.warn("Could not get user location on mount:", error.message);
        },
        { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 }
      );
    }
  }, []); // Empty dependency array ensures this runs only once on mount

  // This effect handles the "near me" logic whenever the local searchTerm state is "near me"
  useEffect(() => {
    if (searchTerm.toLowerCase() === 'near me') {
      setMapBounds(null);
      setIsLocating(true);
      setLocationError(null);
      setUserCoords(null); // Reset before getting fresh coordinates for 'near me' search

      if (!navigator.geolocation) {
        setLocationError('Geolocation is not supported by your browser.');
        setIsLocating(false);
        return;
      }

      const successCallback = (position: GeolocationPosition) => {
        setUserCoords({ lat: position.coords.latitude, lon: position.coords.longitude });
        setSortBy('distance_asc'); // Automatically sort by distance for 'near me'
        setIsLocating(false);
      };

      const handleError = (error: GeolocationPositionError, isHighAccuracyAttempt: boolean) => {
        if (isHighAccuracyAttempt) {
          console.warn(`High accuracy geolocation error: ${error.message}. Trying low accuracy.`);
          navigator.geolocation.getCurrentPosition(
            successCallback,
            (lowAccuracyError) => handleError(lowAccuracyError, false),
            { enableHighAccuracy: false, timeout: 30000, maximumAge: 60000 }
          );
          return;
        }

        console.error(`Geolocation error: ${error.message}`);
        let message = 'Could not get your location. Please enable location services and try again.';
        if (error.code === error.PERMISSION_DENIED) {
          message = 'Location permission denied. Please enable it in your browser settings to use this feature.';
        } else if (error.code === error.TIMEOUT) {
          message = 'Finding your location took too long. Please check your connection and try again.';
        }
        setLocationError(message);
        setIsLocating(false);
      };

      navigator.geolocation.getCurrentPosition(
        successCallback,
        (error) => handleError(error, true),
        { enableHighAccuracy: true, timeout: 25000, maximumAge: 0 }
      );
    } else {
      setIsLocating(false);
      setLocationError(null);
      // We no longer reset userCoords or sortBy here, allowing distance sort to persist across text searches.
    }
  }, [searchTerm]);

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

  const finalProperties: (Property & { distance?: number })[] = useMemo(() => {
    let processedProperties = properties.filter(p => p.availability === 'available');

    // Add distance property to all properties if user location is available
    if (userCoords) {
        processedProperties = processedProperties.map(property => ({
            ...property,
            distance: getDistance(userCoords.lat, userCoords.lon, property.latitude, property.longitude)
        }));
    }

    // 1. Primary filtering (map, near me, or text search)
    let baseFiltered;
    if (mapBounds) {
        baseFiltered = processedProperties.filter(property => {
            const { latitude, longitude } = property;
            if (typeof latitude !== 'number' || typeof longitude !== 'number') return false;
            return mapBounds.contains([latitude, longitude]);
        });
    } else if (searchTerm.toLowerCase() === 'near me' && userCoords) {
        const RADIUS_KM = 25;
        baseFiltered = processedProperties.filter(property => (property as any).distance <= RADIUS_KM);
    } else if (searchTerm && searchTerm.toLowerCase() !== 'near me') {
        baseFiltered = processedProperties.filter(property => {
            const lowercasedSearchTerm = searchTerm.toLowerCase();
            const titleMatch = (property.title || '').toLowerCase().includes(lowercasedSearchTerm);
            const addressMatch = (property.address || '').toLowerCase().includes(lowercasedSearchTerm);
            return titleMatch || addressMatch;
        });
    } else {
        baseFiltered = processedProperties;
    }

    // 2. Granular filtering
    const granularFiltered = baseFiltered.filter(property => {
        const { priceRange, bedrooms, bathrooms, furnishing, propertyAge } = filters;
        if (priceRange.min && (property.rent || 0) < parseFloat(priceRange.min)) return false;
        if (priceRange.max && (property.rent || 0) > parseFloat(priceRange.max)) return false;
        if (bedrooms.length > 0 && !bedrooms.some(b => b === 4 ? (property.bedrooms || 0) >= 4 : property.bedrooms === b)) return false;
        if (bathrooms.length > 0 && !bathrooms.some(b => b === 4 ? (property.bathrooms || 0) >= 4 : property.bathrooms === b)) return false;
        if (furnishing.length > 0 && !furnishing.includes(property.furnishing)) return false;
        if (propertyAge.length > 0) {
            const age = parsePropertyAge(property.ageOfProperty);
            if (!propertyAge.some(range => {
                if (range === '0-1') return age >= 0 && age <= 1;
                if (range === '1-5') return age > 1 && age <= 5;
                if (range === '5-10') return age > 5 && age <= 10;
                if (range === '10+') return age > 10;
                return false;
            })) return false;
        }
        if (amenitySearchTerm.length > 0) {
            const propertyAmenities = (property.amenities || []).map(a => a.name.toLowerCase());
            const description = (property.description || '').toLowerCase();
            const allSearchableText = [...propertyAmenities, description].join(' ');
            if (!amenitySearchTerm.every(term => allSearchableText.includes(term.toLowerCase()))) return false;
        }
        return true;
    });

    // 3. Sorting
    return [...granularFiltered].sort((a, b) => {
        switch (sortBy) {
            case 'distance_asc':
                return (a.distance || Infinity) - (b.distance || Infinity);
            case 'price_asc':
                return (a.rent || 0) - (b.rent || 0);
            case 'price_desc':
                return (b.rent || 0) - (a.rent || 0);
            case 'date_desc':
                return new Date(b.postedDate || 0).getTime() - new Date(a.postedDate || 0).getTime();
            default: // 'relevance'
                return 0;
        }
    });
}, [properties, sortBy, searchTerm, userCoords, mapBounds, filters, amenitySearchTerm]);

  useEffect(() => {
    // This effect manages the map's view state based on search results.
    const propertiesWithCoords = finalProperties.filter(p => typeof p.latitude === 'number' && typeof p.longitude === 'number');

    // If user is panning/zooming map, don't override their view.
    if (mapBounds) {
        return;
    }

    // Priority 1: 'near me' search
    if (searchTerm.toLowerCase() === 'near me' && userCoords) {
        setMapView({ center: [userCoords.lat, userCoords.lon], zoom: 11 });
        return;
    }

    // Priority 2: Results found from text search
    if (propertiesWithCoords.length > 0) {
         const avgLat = propertiesWithCoords.reduce((sum, p) => sum + p.latitude, 0) / propertiesWithCoords.length;
         const avgLon = propertiesWithCoords.reduce((sum, p) => sum + p.longitude, 0) / propertiesWithCoords.length;
         // If there's only one result, zoom in closer
         const newZoom = propertiesWithCoords.length === 1 ? 14 : 12;
         setMapView({ center: [avgLat, avgLon], zoom: newZoom });
         return;
    }

    // Priority 3: No results, but searched term is a known city
    if (searchTerm) {
        const cityCoord = cityCoordinates[searchTerm.toLowerCase().trim()];
        if (cityCoord) {
            setMapView({ center: cityCoord, zoom: 12 });
            return;
        }
    }
    // Fallback: If no results for an unknown term, the map view state is not updated, so it doesn't move.
}, [finalProperties, searchTerm, userCoords, mapBounds]);
  
  const propertiesWithCoords = useMemo(() => {
    return finalProperties.filter(p => typeof p.latitude === 'number' && typeof p.longitude === 'number');
  }, [finalProperties]);

  const displayLocation = mapBounds 
    ? 'the selected map area' 
    : (searchTerm.toLowerCase() === 'near me' && userCoords) 
    ? 'Near You' 
    : (searchTerm || cityName);

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

  const ControlsAndList = (
    <div className="bg-white flex flex-col h-full border-r">
        {/* Controls */}
        <div className="flex-shrink-0 border-b">
            <div className="p-4 border-b">
                <h2 className="text-xl font-bold text-neutral-900">
                    Flats for rent in <span className="text-primary">{displayLocation}</span>
                </h2>
                <p className="text-sm text-neutral-500">{finalProperties.length} results</p>
            </div>
            
            <div className="p-4 flex flex-col sm:flex-row gap-4 justify-between items-center">
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

                <div className="flex items-center gap-2 self-end sm:self-center flex-shrink-0 w-full sm:w-auto">
                <div className="flex items-center gap-2 flex-grow">
                    <label htmlFor="sort" className="text-sm font-medium text-gray-700 whitespace-nowrap">Sort by:</label>
                    <select 
                    id="sort" 
                    value={sortBy} 
                    onChange={(e) => setSortBy(e.target.value)}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm py-2 disabled:bg-gray-100"
                    disabled={!!mapBounds}
                    >
                    <option value="relevance">Relevance</option>
                    {userCoords && <option value="distance_asc">Distance: Nearest</option>}
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
                </div>
            </div>
            
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
                    <div className="mt-4">
                        <label className="block text-sm font-semibold text-neutral-800 mb-2">Amenity Search</label>
                        <input
                            type="text"
                            placeholder="e.g., gym, pool, backup"
                            value={amenitySearchTerm.join(', ')}
                            onChange={(e) => setAmenitySearchTerm(e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
                            className="w-full text-sm rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
                        />
                        <p className="text-xs text-neutral-500 mt-1">Separate multiple amenities with a comma.</p>
                    </div>
                    <div className="mt-4 pt-4 border-t text-right">
                        <button onClick={clearFilters} className="text-sm font-semibold text-primary hover:underline">Clear All Filters</button>
                    </div>
                </div>
            )}
        </div>

        {/* List Content */}
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
                ) : finalProperties.length > 0 ? (
                finalProperties.map((property) => {
                    const owner = users.find(u => u.id === property.ownerId);
                    return <PropertyCard key={property.id} property={property} owner={owner} onSelectProperty={onSelectProperty} isSaved={savedProperties.includes(property.id)} onToggleSave={onToggleSaveProperty} currentUser={currentUser} />
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
  );

  if (isDesktop) {
    return (
        <div className="flex h-[calc(100vh-4rem)]">
            <div className={`transition-all duration-300 ease-in-out ${viewMode === 'list' ? 'w-1/2' : 'w-0'}`}>
                {viewMode === 'list' && ControlsAndList}
            </div>
            <div className="relative flex-grow">
                 <MapComponent 
                    center={mapView.center} 
                    zoom={mapView.zoom} 
                    markers={mapMarkers} 
                    className="h-full w-full"
                    onBoundsChange={handleBoundsChange}
                    onMarkerClick={handleMarkerClick}
                />
                <div className="absolute top-4 right-4 z-[1000] bg-white p-1 rounded-lg shadow-md flex items-center gap-1">
                    <button
                        onClick={() => setViewMode('list')}
                        title="Split View"
                        className={`p-2 rounded-md transition-colors ${viewMode === 'list' ? 'bg-primary text-white shadow' : 'text-neutral-600 hover:bg-neutral-100'}`}
                        aria-pressed={viewMode === 'list'}
                    >
                        <ListBulletIcon className="w-5 h-5" />
                    </button>
                    <button
                        onClick={() => setViewMode('map')}
                        title="Full Map View"
                        className={`p-2 rounded-md transition-colors ${viewMode === 'map' ? 'bg-primary text-white shadow' : 'text-neutral-600 hover:bg-neutral-100'}`}
                        aria-pressed={viewMode === 'map'}
                    >
                        <MapIcon className="w-5 h-5" />
                    </button>
                </div>
            </div>
        </div>
    );
  }

  // Mobile View
  return (
      <div className="h-[calc(100vh-4rem)] flex flex-col bg-white">
          {viewMode === 'list' ? (
              ControlsAndList
          ) : (
              <div className="h-full w-full">
                  <MapComponent 
                    center={mapView.center} 
                    zoom={mapView.zoom} 
                    markers={mapMarkers} 
                    className="h-full w-full"
                    onBoundsChange={handleBoundsChange}
                    onMarkerClick={handleMarkerClick}
                  />
              </div>
          )}
          
          <div className="fixed bottom-6 right-6 z-[1000]">
              <button
                  onClick={() => setViewMode(prev => prev === 'list' ? 'map' : 'list')}
                  className="p-4 bg-primary text-white rounded-full shadow-lg flex items-center justify-center"
                  aria-label={viewMode === 'list' ? 'Switch to map view' : 'Switch to list view'}
              >
                  {viewMode === 'list' ? <MapIcon className="w-6 h-6" /> : <ListBulletIcon className="w-6 h-6" />}
              </button>
          </div>
      </div>
  );
};

export default PropertyList;