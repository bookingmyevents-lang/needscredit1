import React, { useState } from 'react';
import type { Property } from '../types';
import { SearchIcon, LocationMarkerIcon, SparklesIcon, ShieldCheckIcon, PencilIcon, CreditCardIcon, UserGroupIcon, CheckCircleIcon } from './Icons';
import PropertyCard from './PropertyCard';

interface HomePageProps {
  properties: Property[];
  onSearch: (searchTerm: string) => void;
  onSelectProperty: (property: Property) => void;
  cityName: string;
  onSmartSearchClick: () => void;
  onLoginClick: () => void;
}

const HomePage: React.FC<HomePageProps> = ({ properties, onSearch, onSelectProperty, cityName, onSmartSearchClick, onLoginClick }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(searchTerm);
  };
  
  const handleLocationClick = (e: React.MouseEvent<HTMLAnchorElement>, location: string) => {
    e.preventDefault();
    onSearch(location);
  };

  const featuredProperties = properties.filter(p => p.availability === 'available').slice(0, 3);
  const popularLocalities = ['Bhubaneswar', 'Cuttack', 'Puri', 'Sambalpur', 'Rourkela', 'Balasore'];

  return (
    <div className="bg-neutral-50">
      {/* Hero Section */}
      <div className="relative h-[calc(100vh-4rem)] min-h-[600px] bg-cover bg-center flex items-center justify-center text-white" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1616046229478-9901c5536a45?q=80&w=2070&auto=format&fit=crop')" }}>
        <div className="absolute inset-0 bg-gradient-to-t from-primary/80 to-secondary/40"></div>
        <div className="relative z-10 text-center p-4">
          <h1 className="text-4xl md:text-6xl font-extrabold mb-2 text-shadow-lg">Property for rent. Simplified.</h1>
          <p className="text-lg md:text-xl text-neutral-200 mb-8">Discover verified properties from trusted owners across {cityName}.</p>
          
          <form onSubmit={handleSearchSubmit} className="max-w-3xl mx-auto bg-white rounded-lg p-2 flex items-center shadow-2xl">
             <div className="flex items-center pl-4 pr-2">
                <p className="text-sm font-semibold text-neutral-800">Rent</p>
            </div>
            <div className="h-8 border-l border-neutral-300"></div>

            <div className="relative flex-grow">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                <SearchIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={`Search City, Locality, Project in ${cityName}...`}
                className="block w-full rounded-full border-transparent pl-11 pr-32 py-3 text-gray-900 focus:ring-0 focus:outline-none"
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-2">
                <button
                    type="button"
                    onClick={() => onSearch('near me')}
                    className="flex items-center gap-1.5 text-sm text-primary font-semibold hover:bg-secondary/10 px-3 py-1.5 rounded-full transition-colors"
                >
                    <LocationMarkerIcon className="w-5 h-5" />
                    Near me
                </button>
              </div>
            </div>
            <button
              type="submit"
              className="ml-2 px-6 py-3 bg-secondary hover:bg-primary text-white font-semibold rounded-lg transition-colors duration-300 whitespace-nowrap hidden sm:block"
            >
              Search
            </button>
            <button
              type="button"
              onClick={onSmartSearchClick}
              title="Smart Search"
              className="ml-2 p-3 bg-accent hover:bg-yellow-500 text-neutral-900 font-semibold rounded-full transition-colors duration-300 flex-shrink-0"
            >
                <SparklesIcon className="w-6 h-6" />
            </button>
          </form>

           <div className="mt-6 text-center">
              <p className="text-neutral-200 text-sm">
                  Are you a property owner?{' '}
                  <button onClick={onLoginClick} className="font-semibold text-accent hover:underline">
                      List your property for FREE
                  </button>
              </p>
          </div>
        </div>
      </div>

      {/* Services Section */}
      <div className="bg-white py-24">
        <div className="container mx-auto px-4 md:px-8 text-center">
            <h2 className="text-4xl font-bold text-neutral-900 mb-4">Everything you need. All in one place.</h2>
            <p className="text-lg text-neutral-600 mb-16 max-w-3xl mx-auto">From finding the perfect home to paying your rent, we've got you covered with a seamless and secure experience.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                <div className="text-center p-6 transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 bg-white rounded-2xl">
                    <div className="inline-block bg-gradient-to-br from-primary/10 to-secondary/10 text-primary rounded-full p-5 mb-4 ring-8 ring-primary/5">
                        <ShieldCheckIcon className="w-10 h-10"/>
                    </div>
                    <h3 className="text-xl font-bold mb-2">Verified Properties</h3>
                    <p className="text-neutral-600 text-sm">Rest easy with our curated list of verified properties and owners.</p>
                </div>
                 <div className="text-center p-6 transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 bg-white rounded-2xl">
                    <div className="inline-block bg-gradient-to-br from-primary/10 to-secondary/10 text-primary rounded-full p-5 mb-4 ring-8 ring-primary/5">
                        <PencilIcon className="w-10 h-10"/>
                    </div>
                    <h3 className="text-xl font-bold mb-2">Digital Agreements</h3>
                    <p className="text-neutral-600 text-sm">Sign your rental agreements online. It's fast, secure, and paperless.</p>
                </div>
                <div className="text-center p-6 transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 bg-white rounded-2xl">
                    <div className="inline-block bg-gradient-to-br from-primary/10 to-secondary/10 text-primary rounded-full p-5 mb-4 ring-8 ring-primary/5">
                        <CreditCardIcon className="w-10 h-10"/>
                    </div>
                    <h3 className="text-xl font-bold mb-2">Online Rent Payments</h3>
                    <p className="text-neutral-600 text-sm">Pay your rent on time, every time, with automated reminders and multiple payment options.</p>
                </div>
                <div className="text-center p-6 transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 bg-white rounded-2xl">
                    <div className="inline-block bg-gradient-to-br from-primary/10 to-secondary/10 text-primary rounded-full p-5 mb-4 ring-8 ring-primary/5">
                        <UserGroupIcon className="w-10 h-10"/>
                    </div>
                    <h3 className="text-xl font-bold mb-2">Dedicated Support</h3>
                    <p className="text-neutral-600 text-sm">Our team is here to help with any issues, from disputes to support queries.</p>
                </div>
            </div>
        </div>
      </div>

      {/* Popular Localities Section */}
      <div className="bg-neutral-50 py-24">
        <div className="container mx-auto px-4 md:px-8">
          <h2 className="text-4xl font-bold text-neutral-900 mb-12 text-center">Explore popular cities &amp; districts in {cityName}</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 md:gap-6">
            {popularLocalities.map(loc => (
                <a href="#" key={loc} onClick={(e) => handleLocationClick(e, loc)} className="block p-6 bg-white rounded-xl border shadow-sm hover:shadow-lg hover:border-primary transition-all group hover:scale-105">
                    <h3 className="font-bold text-lg text-neutral-800">{loc}</h3>
                    <p className="text-sm text-primary font-semibold mt-2 group-hover:underline">View Properties &rarr;</p>
                </a>
            ))}
          </div>
        </div>
      </div>
      
      {/* Featured Properties Section */}
      {featuredProperties.length > 0 && (
        <div className="bg-white py-24">
          <div className="container mx-auto px-4 md:px-8">
            <h2 className="text-4xl font-bold text-neutral-900 mb-12 text-center">Featured Properties</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {featuredProperties.map(property => (
                <PropertyCard key={property.id} property={property} onSelectProperty={onSelectProperty} isSaved={false} onToggleSave={() => onLoginClick()} currentUser={null} />
              ))}
            </div>
            <div className="text-center mt-16">
                  <button onClick={() => onSearch('')} className="px-8 py-3 bg-primary hover:bg-secondary text-white font-bold rounded-lg transition-colors duration-300">
                      View All Properties
                  </button>
            </div>
          </div>
        </div>
      )}

      {/* For Owners CTA Section */}
      <div className="py-24 bg-white">
        <div className="container mx-auto px-4 md:px-8">
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden grid grid-cols-1 md:grid-cols-2 items-center">
                <div className="p-8 md:p-12">
                    <h2 className="text-4xl font-bold text-neutral-900 mb-4">Become a RentEase Host</h2>
                    <p className="text-neutral-600 mb-8 max-w-2xl">Join thousands of owners who trust us to find the right tenants. Our platform makes management simple and secure.</p>
                    <ul className="space-y-4 mb-10 text-neutral-700">
                        <li className="flex items-center gap-3"><CheckCircleIcon className="w-6 h-6 text-green-500" /> Verified Tenant Profiles</li>
                        <li className="flex items-center gap-3"><CheckCircleIcon className="w-6 h-6 text-green-500" /> Easy Listing Management</li>
                        <li className="flex items-center gap-3"><CheckCircleIcon className="w-6 h-6 text-green-500" /> Secure Online Payments</li>
                    </ul>
                    <button onClick={onLoginClick} className="px-8 py-3 bg-secondary hover:bg-primary text-white font-bold rounded-lg transition-colors duration-300 text-lg">
                        List Your Property Now
                    </button>
                </div>
                <div className="h-64 md:h-full">
                    <img src="https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?q=80&w=2070&auto=format&fit=crop" alt="Modern living room" className="w-full h-full object-cover" />
                </div>
            </div>
        </div>
      </div>

    </div>
  );
};

export default HomePage;