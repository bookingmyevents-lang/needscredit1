import React, { useState, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import type { Property, FurnishingItem, Amenity } from '../types';
import { FurnishingStatus, Facing } from '../types';
import MapComponent from './MapComponent';
import * as L from 'leaflet';
import AmenitiesSelector from './AmenitiesSelector';
import { SparklesIcon } from './Icons';

interface PostPropertyFormProps {
  onSubmit: (newPropertyData: Omit<Property, 'id' | 'images' | 'ownerId' | 'availability' | 'postedDate' | 'reviews' | 'nearbyPlaces'>) => void;
  onCancel: () => void;
}

const DepositButton: React.FC<{ label: string; isActive: boolean; onClick: () => void }> = ({ label, isActive, onClick }) => (
    <button
        type="button"
        onClick={onClick}
        className={`px-4 py-2 text-sm font-semibold rounded-md border transition-colors ${
            isActive ? 'bg-primary text-white border-primary' : 'bg-white text-neutral-700 border-gray-300 hover:bg-gray-50'
        }`}
    >
        {label}
    </button>
);


const PostPropertyForm: React.FC<PostPropertyFormProps> = ({ onSubmit, onCancel }) => {
  const today = new Date().toISOString().split('T')[0];
  const sixMonthsFromNow = new Date();
  sixMonthsFromNow.setMonth(sixMonthsFromNow.getMonth() + 6);
  const maxDate = sixMonthsFromNow.toISOString().split('T')[0];

  const [formData, setFormData] = useState({
    title: '',
    address: '',
    rent: 0,
    bedrooms: 0,
    bathrooms: 0,
    sqft: 0,
    description: '',
    latitude: 20.2961,
    longitude: 85.8245,
    furnishing: FurnishingStatus.UNFURNISHED,
    facing: Facing.NORTH,
    parking: 'None',
    projectName: '',
    securityDeposit: 0,
    brokerage: 0,
    balconies: 0,
    floor: '',
    leaseType: 'Any',
    ageOfProperty: 'New',
    viewingAdvance: 500,
    availableDate: today,
  });
  
  const [furnishingItems, setFurnishingItems] = useState<FurnishingItem[]>([]);
  const [amenities, setAmenities] = useState<Amenity[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [depositOption, setDepositOption] = useState<'1m' | '2m' | 'custom'>('custom');

  useEffect(() => {
    if (formData.rent > 0) {
        if (depositOption === '1m') {
            setFormData(prev => ({ ...prev, securityDeposit: prev.rent }));
        } else if (depositOption === '2m') {
            setFormData(prev => ({ ...prev, securityDeposit: prev.rent * 2 }));
        }
    }
  }, [formData.rent, depositOption]);


  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.title.trim()) newErrors.title = 'Property title is required.';
    if (!formData.address.trim()) newErrors.address = 'Address is required.';
    if (formData.rent <= 0) newErrors.rent = 'Rent must be a positive number.';
    if (formData.bedrooms <= 0) newErrors.bedrooms = 'Bedrooms must be a positive number.';
    if (formData.bathrooms <= 0) newErrors.bathrooms = 'Bathrooms must be a positive number.';
    if (formData.sqft <= 0) newErrors.sqft = 'Square footage must be a positive number.';
    if (!formData.description.trim()) newErrors.description = 'Description is required.';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    const isNumericField = ['rent', 'bedrooms', 'bathrooms', 'sqft', 'latitude', 'longitude', 'securityDeposit', 'brokerage', 'balconies', 'viewingAdvance'].includes(name);
    setFormData(prev => ({ ...prev, [name]: isNumericField ? Number(value) : value }));
    if (errors[name]) {
        setErrors(prevErrors => {
            const newErrors = { ...prevErrors };
            delete newErrors[name];
            return newErrors;
        });
    }
  };

  const handleDepositInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDepositOption('custom');
    handleChange(e);
  };
  
  const handleMapClick = (coords: L.LatLng) => {
    setFormData(prev => ({ ...prev, latitude: coords.lat, longitude: coords.lng }));
  };

  const handleMarkerDrag = (coords: L.LatLng) => {
    setFormData(prev => ({ ...prev, latitude: coords.lat, longitude: coords.lng }));
  };

  const handleFurnishingChange = (itemName: string, quantity: number, icon: string) => {
    setFurnishingItems(prev => {
        const existingItemIndex = prev.findIndex(item => item.name === itemName);
        if (quantity <= 0) {
            return prev.filter(item => item.name !== itemName);
        }
        if (existingItemIndex > -1) {
            const updatedItems = [...prev];
            updatedItems[existingItemIndex] = { ...updatedItems[existingItemIndex], quantity };
            return updatedItems;
        } else {
            return [...prev, { name: itemName, quantity, icon }];
        }
    });
  };

  const handleAmenityChange = (amenityName: string, isChecked: boolean, icon: string) => {
      setAmenities(prev => {
          if (isChecked) {
              if (!prev.some(a => a.name === amenityName)) {
                  return [...prev, { name: amenityName, icon }];
              }
          } else {
              return prev.filter(a => a.name !== amenityName);
          }
          return prev;
      });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
        onSubmit({ ...formData, amenities, furnishingItems });
    }
  };

  const handleGenerateDescription = async () => {
    setIsGenerating(true);
    setErrors(prev => ({ ...prev, description: '' })); // Clear previous error
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

        const furnishingList = furnishingItems.map(item => `${item.quantity} ${item.name}`).join(', ');
        const amenitiesList = amenities.map(item => item.name).join(', ');

        const prompt = `Write a compelling and professional real estate listing description for a rental property with the following details:
        - Property Title: ${formData.title || 'A beautiful property'}
        - Type: ${formData.bedrooms} BHK
        - Rent: ₹${formData.rent.toLocaleString()}/month
        - Size: ${formData.sqft} sq. ft.
        - Furnishing Status: ${formData.furnishing}
        - Furnishings Included: ${furnishingList || 'None'}
        - Society Amenities: ${amenitiesList || 'None'}
        - Location Details: Located at ${formData.address}
        - Floor: ${formData.floor || 'Not specified'}
        - Parking: ${formData.parking || 'Not specified'}
        - Facing: ${formData.facing}
        - Additional Info: Age of property is ${formData.ageOfProperty}, suitable for ${formData.leaseType}.

        The description should be appealing to potential tenants, highlighting the key features and lifestyle benefits. Be descriptive and engaging. Do not use markdown.`;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });
        
        const generatedDescription = response.text;
        setFormData(prev => ({ ...prev, description: generatedDescription }));

    } catch (error) {
        console.error("AI description generation failed:", error);
        alert("Sorry, we couldn't generate a description at this time. Please try again later.");
    } finally {
        setIsGenerating(false);
    }
  };
  
  const FormInput = ({ id, name, label, type, value, onChange, error, placeholder }: { id: string, name: string, label: string, type: string, value: string | number, onChange: (e: React.ChangeEvent<HTMLInputElement>) => void, error?: string, placeholder?: string }) => (
      <div>
        <label htmlFor={id} className="block text-sm font-medium text-gray-700">{label}</label>
        <input 
          type={type} 
          id={id} 
          name={name} 
          value={value} 
          onChange={onChange} 
          placeholder={placeholder}
          className={`mt-1 block w-full px-3 py-2 border ${error ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary`}
        />
        {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
      </div>
  );

  return (
    <div className="max-w-4xl mx-auto bg-white p-8 rounded-lg shadow-xl">
      <h2 className="text-3xl font-bold mb-6">List Your Property for Rent</h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="p-6 border border-gray-200 rounded-lg">
            <h3 className="text-xl font-semibold mb-4 text-neutral-800">1. Basic Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormInput id="title" name="title" label="Property Title" type="text" value={formData.title} onChange={handleChange} error={errors.title} placeholder="e.g., Cozy Downtown Apartment"/>
                <FormInput id="address" name="address" label="Address" type="text" value={formData.address} onChange={handleChange} error={errors.address} placeholder="e.g., 123 Main St, Anytown"/>
            </div>
        </div>

        <div className="p-6 border border-gray-200 rounded-lg">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-neutral-800">2. Price Details</h3>
                <a href="#" className="text-sm font-semibold text-primary hover:underline">Get a callback</a>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label htmlFor="rent" className="block text-sm font-medium text-gray-700">Monthly Rent</label>
                    <input type="number" id="rent" name="rent" value={formData.rent} onChange={handleChange} className={`mt-1 block w-full px-3 py-2 border ${errors.rent ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary`} />
                     {errors.rent && <p className="text-red-500 text-xs mt-1">{errors.rent}</p>}
                </div>
                <div>
                    <label htmlFor="availableDate" className="block text-sm font-medium text-gray-700">Available From</label>
                    <input type="date" id="availableDate" name="availableDate" value={formData.availableDate} onChange={handleChange} min={today} max={maxDate} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary" />
                    <p className="text-xs text-neutral-500 mt-1">Available date should be within 6 months from the current date.</p>
                </div>
            </div>
            <div className="mt-6">
                <label htmlFor="securityDeposit" className="block text-sm font-medium text-gray-700">Security Deposit</label>
                <div className="mt-1">
                    <input type="number" id="securityDeposit" name="securityDeposit" value={formData.securityDeposit} onChange={handleDepositInputChange} className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary" />
                </div>
                <div className="flex items-center gap-2 mt-2">
                    <DepositButton label="1 Month" isActive={depositOption === '1m'} onClick={() => setDepositOption('1m')} />
                    <DepositButton label="2 Months" isActive={depositOption === '2m'} onClick={() => setDepositOption('2m')} />
                    <DepositButton label="Custom" isActive={depositOption === 'custom'} onClick={() => setDepositOption('custom')} />
                </div>
            </div>
        </div>
        
        <div className="p-6 border border-gray-200 rounded-lg">
            <h3 className="text-xl font-semibold mb-4 text-neutral-800">3. Specifications</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <FormInput id="bedrooms" name="bedrooms" label="Bedrooms" type="number" value={formData.bedrooms} onChange={handleChange} error={errors.bedrooms} />
                <FormInput id="bathrooms" name="bathrooms" label="Bathrooms" type="number" value={formData.bathrooms} onChange={handleChange} error={errors.bathrooms} />
                <FormInput id="sqft" name="sqft" label="Square Feet" type="number" value={formData.sqft} onChange={handleChange} error={errors.sqft} />
                <FormInput id="brokerage" name="brokerage" label="Brokerage (₹)" type="number" value={formData.brokerage} onChange={handleChange} />
                <FormInput id="balconies" name="balconies" label="Balconies" type="number" value={formData.balconies} onChange={handleChange} />
                <FormInput id="viewingAdvance" name="viewingAdvance" label="Viewing Advance (₹)" type="number" value={formData.viewingAdvance} onChange={handleChange} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
                <div>
                    <label htmlFor="furnishing" className="block text-sm font-medium text-gray-700">Furnishing Status</label>
                    <select id="furnishing" name="furnishing" value={formData.furnishing} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary">
                        {Object.values(FurnishingStatus).map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                </div>
                 <div>
                    <label htmlFor="facing" className="block text-sm font-medium text-gray-700">Facing</label>
                    <select id="facing" name="facing" value={formData.facing} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary">
                        {Object.values(Facing).map(f => <option key={f} value={f}>{f}</option>)}
                    </select>
                </div>
                 <FormInput id="parking" name="parking" label="Parking" type="text" value={formData.parking} onChange={handleChange} placeholder="e.g., 1 Covered"/>
                 <FormInput id="floor" name="floor" label="Floor" type="text" value={formData.floor} onChange={handleChange} placeholder="e.g., 5 of 12"/>
                 <FormInput id="leaseType" name="leaseType" label="Lease Type" type="text" value={formData.leaseType} onChange={handleChange} placeholder="e.g., Family Only"/>
                 <FormInput id="ageOfProperty" name="ageOfProperty" label="Age of Property" type="text" value={formData.ageOfProperty} onChange={handleChange} placeholder="e.g., 3 years"/>
            </div>
        </div>

        <div className="p-6 border border-gray-200 rounded-lg">
            <h3 className="text-xl font-semibold mb-4 text-neutral-800">4. Description & Features</h3>
            <div>
              <div className="flex justify-between items-center mb-1">
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700">Description</label>
                  <button
                    type="button"
                    onClick={handleGenerateDescription}
                    disabled={isGenerating}
                    className="flex items-center gap-1.5 px-3 py-1 bg-secondary/10 text-secondary font-semibold rounded-md transition-colors duration-300 text-xs hover:bg-secondary/20 disabled:opacity-50 disabled:cursor-wait"
                  >
                    {isGenerating ? (
                      <>
                        <svg className="animate-spin h-4 w-4 text-secondary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span>Generating...</span>
                      </>
                    ) : (
                      <>
                        <SparklesIcon className="w-4 h-4" />
                        <span>Generate with AI</span>
                      </>
                    )}
                  </button>
              </div>
              <textarea id="description" name="description" value={formData.description} onChange={handleChange} rows={6} className={`block w-full px-3 py-2 border ${errors.description ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary`}></textarea>
              {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description}</p>}
            </div>
        </div>

        <AmenitiesSelector
          selectedFurnishings={furnishingItems}
          selectedAmenities={amenities}
          onFurnishingChange={handleFurnishingChange}
          onAmenityChange={handleAmenityChange}
        />

        <div className="p-6 border border-gray-200 rounded-lg">
            <h3 className="text-xl font-semibold mb-4 text-neutral-800">6. Location</h3>
            <p className="text-sm text-neutral-500 mb-4">Click on the map or drag the marker to set the property's precise location.</p>
            <div className="h-64 rounded-lg overflow-hidden">
                <MapComponent
                    center={[formData.latitude, formData.longitude]}
                    zoom={13}
                    onClick={handleMapClick}
                    markers={[{
                        id: 'post-location',
                        position: [formData.latitude, formData.longitude],
                        content: 'Drag to pinpoint the location',
                        draggable: true,
                        onDragEnd: handleMarkerDrag,
                    }]}
                    className="h-full w-full"
                />
            </div>
            <div className="grid grid-cols-2 gap-4 mt-4">
                <FormInput id="latitude" name="latitude" label="Latitude" type="number" value={formData.latitude} onChange={handleChange} />
                <FormInput id="longitude" name="longitude" label="Longitude" type="number" value={formData.longitude} onChange={handleChange} />
            </div>
        </div>

        <div>
            <h4 className="block text-sm font-medium text-gray-700 mb-2">7. Images</h4>
            <div className="p-6 text-center border-2 border-gray-300 border-dashed rounded-md">
                <p className="text-sm text-neutral-500">A default image will be assigned. Image uploads are not available in this demo.</p>
            </div>
        </div>

        <div className="pt-4 flex gap-4">
          <button type="submit" className="flex-1 bg-secondary hover:bg-primary text-white font-bold py-3 px-4 rounded-lg transition-colors duration-300">Post Property</button>
          <button type="button" onClick={onCancel} className="flex-1 bg-neutral-200 hover:bg-neutral-300 text-neutral-800 font-bold py-3 px-4 rounded-lg transition-colors duration-300">Cancel</button>
        </div>
      </form>
    </div>
  );
};

export default PostPropertyForm;