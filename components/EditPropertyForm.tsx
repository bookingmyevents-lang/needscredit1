import React, { useState, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import type { Property, FurnishingItem, Amenity } from '../types';
import { FurnishingStatus, Facing } from '../types';
import MapComponent from './MapComponent';
import * as L from 'leaflet';
import AmenitiesSelector from './AmenitiesSelector';
import { SparklesIcon, TrashIcon, UploadIcon, StarIcon } from './Icons';
import Breadcrumb from './Breadcrumb';

interface EditPropertyFormProps {
  property: Property;
  onSubmit: (updatedProperty: Property) => void;
  onCancel: () => void;
  onNavigateToHome: () => void;
  onNavigateToDashboard: () => void;
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

const EditPropertyForm: React.FC<EditPropertyFormProps> = ({ property, onSubmit, onCancel, onNavigateToHome, onNavigateToDashboard }) => {
  const [formData, setFormData] = useState<Property>(property);
  const [furnishingItems, setFurnishingItems] = useState<FurnishingItem[]>(property.furnishingItems || []);
  const [amenities, setAmenities] = useState<Amenity[]>(property.amenities || []);
  const [isGenerating, setIsGenerating] = useState(false);
  const [depositOption, setDepositOption] = useState<'1m' | '2m' | 'custom'>('custom');

  const today = new Date().toISOString().split('T')[0];
  const sixMonthsFromNow = new Date();
  sixMonthsFromNow.setMonth(sixMonthsFromNow.getMonth() + 6);
  const maxDate = sixMonthsFromNow.toISOString().split('T')[0];
  
  useEffect(() => {
    if (formData.rent > 0) {
        if (depositOption === '1m') {
            setFormData(prev => ({ ...prev, securityDeposit: prev.rent }));
        } else if (depositOption === '2m') {
            setFormData(prev => ({ ...prev, securityDeposit: prev.rent * 2 }));
        }
    }
  }, [formData.rent, depositOption]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    const numericFields = ['rent', 'bedrooms', 'bathrooms', 'sqft', 'latitude', 'longitude', 'securityDeposit', 'brokerage', 'balconies', 'viewingAdvance'];
    setFormData(prev => ({ ...prev, [name]: numericFields.includes(name) ? Number(value) : value }));
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

  const handleGenerateDescription = async () => {
    setIsGenerating(true);
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ ...formData, amenities, furnishingItems });
  };
  
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const currentImageCount = formData.images?.length || 0;
    if (files.length + currentImageCount > 10) {
        alert("You can upload a maximum of 10 images.");
        return;
    }

    const newImages: string[] = [];
    let filesProcessed = 0;

    Array.from(files).forEach((file: File) => {
        if (file.size > 2 * 1024 * 1024) { // 2MB size limit
            alert(`File ${file.name} is too large. Please select images under 2MB.`);
            return;
        }

        const reader = new FileReader();
        reader.onloadend = () => {
            newImages.push(reader.result as string);
            filesProcessed++;
            if (filesProcessed === files.length) {
                setFormData(prev => ({
                    ...prev,
                    images: [...(prev.images || []), ...newImages],
                }));
            }
        };
        reader.readAsDataURL(file);
    });
  };

  const handleDeleteImage = (indexToDelete: number) => {
      setFormData(prev => ({
          ...prev,
          images: (prev.images || []).filter((_, index) => index !== indexToDelete),
      }));
  };

  const handleSetCoverImage = (indexToSetAsCover: number) => {
      const currentImages = formData.images || [];
      if (indexToSetAsCover < 0 || indexToSetAsCover >= currentImages.length) return;

      const newCoverImage = currentImages[indexToSetAsCover];
      const otherImages = currentImages.filter((_, index) => index !== indexToSetAsCover);

      setFormData(prev => ({
          ...prev,
          images: [newCoverImage, ...otherImages],
      }));
  };

  const breadcrumbItems = [
    { label: 'Home', onClick: onNavigateToHome },
    { label: 'Dashboard', onClick: onNavigateToDashboard },
    { label: property.title.length > 30 ? `${property.title.substring(0, 30)}...` : property.title, onClick: onCancel },
    { label: 'Edit' }
  ];
  
  const FormInput = ({ id, name, label, type, value, onChange, placeholder }: { id: string, name: string, label: string, type: string, value: string | number, onChange: (e: React.ChangeEvent<HTMLInputElement>) => void, placeholder?: string }) => (
      <div>
        <label htmlFor={id} className="block text-sm font-medium text-gray-700">{label}</label>
        <input 
          type={type} 
          id={id} 
          name={name} 
          value={value} 
          onChange={onChange} 
          placeholder={placeholder}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
        />
      </div>
  );

  return (
    <div className="max-w-4xl mx-auto">
      <Breadcrumb items={breadcrumbItems} />
      <div className="bg-white p-8 rounded-lg shadow-xl border">
        <h2 className="text-3xl font-bold mb-6">Edit Property</h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          
           <div className="p-6 border border-gray-200 rounded-lg">
                <h3 className="text-xl font-semibold mb-4 text-neutral-800">1. Basic Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormInput id="title" name="title" label="Property Title" type="text" value={formData.title} onChange={handleChange as any} placeholder="e.g., Cozy Downtown Apartment"/>
                    <FormInput id="address" name="address" label="Address" type="text" value={formData.address} onChange={handleChange as any} placeholder="e.g., 123 Main St, Anytown"/>
                </div>
            </div>

            <div className="p-6 border border-gray-200 rounded-lg">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-semibold text-neutral-800">2. Price Details</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label htmlFor="rent" className="block text-sm font-medium text-gray-700">Monthly Rent</label>
                        <input type="number" id="rent" name="rent" value={formData.rent} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary" />
                    </div>
                    <div>
                        <label htmlFor="availableDate" className="block text-sm font-medium text-gray-700">Available From</label>
                        <input type="date" id="availableDate" name="availableDate" value={formData.availableDate.split('T')[0]} onChange={handleChange} min={today} max={maxDate} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary" />
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
                    <FormInput id="bedrooms" name="bedrooms" label="Bedrooms" type="number" value={formData.bedrooms} onChange={handleChange as any} />
                    <FormInput id="bathrooms" name="bathrooms" label="Bathrooms" type="number" value={formData.bathrooms} onChange={handleChange as any} />
                    <FormInput id="sqft" name="sqft" label="Square Feet" type="number" value={formData.sqft} onChange={handleChange as any} />
                    <FormInput id="brokerage" name="brokerage" label="Brokerage (₹)" type="number" value={formData.brokerage} onChange={handleChange as any} />
                    <FormInput id="balconies" name="balconies" label="Balconies" type="number" value={formData.balconies} onChange={handleChange as any} />
                    <FormInput id="viewingAdvance" name="viewingAdvance" label="Viewing Advance (₹)" type="number" value={formData.viewingAdvance} onChange={handleChange as any} />
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
                     <FormInput id="parking" name="parking" label="Parking" type="text" value={formData.parking} onChange={handleChange as any} placeholder="e.g., 1 Covered"/>
                     <FormInput id="floor" name="floor" label="Floor" type="text" value={formData.floor} onChange={handleChange as any} placeholder="e.g., 5 of 12"/>
                     <FormInput id="leaseType" name="leaseType" label="Lease Type" type="text" value={formData.leaseType} onChange={handleChange as any} placeholder="e.g., Family Only"/>
                     <FormInput id="ageOfProperty" name="ageOfProperty" label="Age of Property" type="text" value={formData.ageOfProperty} onChange={handleChange as any} placeholder="e.g., 3 years"/>
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
                        {isGenerating ? "Generating..." : <><SparklesIcon className="w-4 h-4" /><span>Generate with AI</span></>}
                      </button>
                  </div>
                  <textarea id="description" name="description" value={formData.description} onChange={handleChange} rows={6} className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"></textarea>
                </div>
            </div>
            
            <AmenitiesSelector
                selectedFurnishings={furnishingItems}
                selectedAmenities={amenities}
                onFurnishingChange={handleFurnishingChange}
                onAmenityChange={handleAmenityChange}
            />

            <div className="p-6 border border-gray-200 rounded-lg">
                <h3 className="text-xl font-semibold mb-4 text-neutral-800">5. Location</h3>
                <div className="h-64 rounded-lg overflow-hidden">
                    <MapComponent
                        center={[formData.latitude, formData.longitude]}
                        zoom={13}
                        onClick={handleMapClick}
                        markers={[{
                            id: 'edit-location',
                            position: [formData.latitude, formData.longitude],
                            content: 'Drag to pinpoint the location',
                            draggable: true,
                            onDragEnd: handleMarkerDrag,
                        }]}
                        className="h-full w-full"
                    />
                </div>
            </div>

             <div className="p-6 border border-gray-200 rounded-lg">
                <h3 className="text-xl font-semibold mb-4 text-neutral-800">6. Property Images</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {(formData.images || []).map((img, index) => (
                        <div key={index} className="relative group aspect-w-1 aspect-h-1">
                            <img src={img} alt={`Property image ${index + 1}`} className="w-full h-full object-cover rounded-md border" />
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 p-2 rounded-md">
                                <div className="flex gap-2">
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteImage(index)}
                                      className="p-2 bg-white/20 text-white rounded-full hover:bg-red-500"
                                      title="Delete Image"
                                    >
                                        <TrashIcon className="w-5 h-5" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleSetCoverImage(index)}
                                      disabled={index === 0}
                                      className="p-2 bg-white/20 text-white rounded-full hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                      title="Set as Cover Image"
                                    >
                                        <StarIcon className="w-5 h-5" />
                                    </button>
                                </div>
                                {index === 0 && <span className="text-xs text-white font-semibold bg-primary px-2 py-0.5 rounded-full">Cover</span>}
                            </div>
                        </div>
                    ))}
                    <label htmlFor="image-upload" className="cursor-pointer border-2 border-dashed border-gray-300 rounded-md flex flex-col items-center justify-center text-gray-400 hover:border-primary hover:text-primary transition-colors aspect-w-1 aspect-h-1">
                        <UploadIcon className="w-8 h-8" />
                        <span className="text-xs mt-2 text-center">Add Images</span>
                        <input id="image-upload" type="file" multiple accept="image/png, image/jpeg" onChange={handleImageUpload} className="sr-only" />
                    </label>
                </div>
            </div>

            <div className="p-6 border border-gray-200 rounded-lg">
                <h3 className="text-xl font-semibold mb-4 text-neutral-800">7. Virtual Tours</h3>
                <FormInput 
                    id="panoViewUrl" 
                    name="panoViewUrl" 
                    label="360° View URL" 
                    type="url" 
                    value={formData.panoViewUrl || ''} 
                    onChange={handleChange as any} 
                    placeholder="e.g., https://kuula.co/share/..."
                />
            </div>

          <div className="pt-4 flex gap-4">
            <button type="submit" className="flex-1 bg-secondary hover:bg-primary text-white font-bold py-3 px-4 rounded-lg transition-colors duration-300">Save Changes</button>
            <button type="button" onClick={onCancel} className="flex-1 bg-neutral-200 hover:bg-neutral-300 text-neutral-800 font-bold py-3 px-4 rounded-lg transition-colors duration-300">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditPropertyForm;