import React from 'react';
import type { Amenity, FurnishingItem } from '../types';
import { availableAmenities, availableFurnishings } from '../amenitiesData';
import * as Icons from './Icons';

interface AmenitiesSelectorProps {
  selectedFurnishings: FurnishingItem[];
  selectedAmenities: Amenity[];
  onFurnishingChange: (name: string, quantity: number, icon: string) => void;
  onAmenityChange: (name: string, isChecked: boolean, icon: string) => void;
}

const AmenitiesSelector: React.FC<AmenitiesSelectorProps> = ({
  selectedFurnishings,
  selectedAmenities,
  onFurnishingChange,
  onAmenityChange,
}) => {
  const IconComponent: React.FC<{ name: string }> = ({ name }) => {
    const Icon = (Icons as any)[name] || Icons.CheckIcon;
    return <Icon className="w-6 h-6 text-neutral-600" />;
  };

  const selectedFurnishingMap = new Map(selectedFurnishings.map(item => [item.name, item.quantity]));
  const selectedAmenitySet = new Set(selectedAmenities.map(item => item.name));

  return (
    <div className="space-y-6">
      <div className="p-6 border border-gray-200 rounded-lg">
        <h3 className="text-xl font-semibold mb-1 text-neutral-800">4. Furnishings & Amenities</h3>
        <p className="text-sm text-neutral-500 mb-4">Select the items and features available in the property.</p>

        <div>
          <h4 className="font-semibold text-neutral-700 mb-3">Flat Furnishings</h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {availableFurnishings.map(item => {
              const quantity = Number(selectedFurnishingMap.get(item.name) || 0);
              return (
                <div key={item.name} className={`p-3 border rounded-lg flex flex-col items-center justify-center text-center transition-all ${quantity > 0 ? 'bg-secondary/10 border-secondary' : 'bg-neutral-50'}`}>
                  <IconComponent name={item.icon} />
                  <p className="text-sm font-medium mt-2 mb-3">{item.name}</p>
                  <div className="flex items-center gap-2">
                    <button type="button" onClick={() => onFurnishingChange(item.name, quantity - 1, item.icon)} className="p-1.5 bg-neutral-200 rounded-full disabled:opacity-50" disabled={quantity === 0}>
                      <Icons.MinusIcon className="w-4 h-4" />
                    </button>
                    <span className="font-bold text-lg w-6 text-center">{quantity}</span>
                    <button type="button" onClick={() => onFurnishingChange(item.name, quantity + 1, item.icon)} className="p-1.5 bg-neutral-200 rounded-full">
                      <Icons.PlusIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-6 pt-6 border-t">
          <h4 className="font-semibold text-neutral-700 mb-3">Society Amenities</h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {availableAmenities.map(item => {
              const isChecked = selectedAmenitySet.has(item.name);
              return (
                <label key={item.name} className={`p-3 border rounded-lg flex items-center gap-3 cursor-pointer transition-all ${isChecked ? 'bg-secondary/10 border-secondary' : 'bg-neutral-50'}`}>
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={(e) => onAmenityChange(item.name, e.target.checked, item.icon)}
                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                  />
                   <IconComponent name={item.icon} />
                  <p className="text-sm font-medium">{item.name}</p>
                </label>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AmenitiesSelector;