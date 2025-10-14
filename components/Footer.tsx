
import React from 'react';
import { LocationMarkerIcon } from './Icons';

interface FooterProps {
  onLocationSearch: (location: string) => void;
  nearbyLocations: string[];
}

const Footer: React.FC<FooterProps> = ({ onLocationSearch, nearbyLocations }) => {

  const handleLinkClick = (e: React.MouseEvent<HTMLAnchorElement>, location: string) => {
    e.preventDefault();
    onLocationSearch(location);
  }

  const renderLocationList = () => {
      if (nearbyLocations.length > 0) {
          return (
              <>
                 <li>
                    <a href="#" onClick={(e) => handleLinkClick(e, 'near me')} className="flex items-center gap-2 hover:text-white transition-colors font-semibold text-secondary">
                        <LocationMarkerIcon className="w-4 h-4" />
                        Flats for rent near me
                    </a>
                </li>
                {nearbyLocations.map((loc) => (
                    <li key={loc}>
                        <a href="#" onClick={(e) => handleLinkClick(e, loc)} className="hover:text-white transition-colors">
                            Flats for rent in {loc}
                        </a>
                    </li>
                ))}
              </>
          )
      }
      return <li className="text-neutral-400">Could not load nearby locations. Please enable location services.</li>
  }

  return (
    <footer className="bg-neutral-900 text-neutral-300">
      <div className="container mx-auto px-4 md:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="col-span-full lg:col-span-1">
                 <a href="/" className="flex items-center gap-3 mb-4">
                    <LocationMarkerIcon className="w-8 h-8 text-secondary" />
                    <h1 className="text-2xl font-bold text-white">RentEase</h1>
                </a>
                <p className="text-sm text-neutral-400">Your partner in finding the perfect rental property. Seamless, secure, and simple.</p>
            </div>
          <div className="col-span-full lg:col-span-3">
            <h3 className="font-bold text-white mb-4">Find Properties for Rent</h3>
            <ul className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-2 text-sm">
                {renderLocationList()}
            </ul>
          </div>
        </div>
        <div className="mt-12 pt-8 border-t border-neutral-700 text-center text-sm text-neutral-500">
          <p>&copy; {new Date().getFullYear()} RentEase. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;