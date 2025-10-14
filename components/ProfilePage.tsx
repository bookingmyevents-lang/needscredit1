import React, { useState } from 'react';
import type { User } from '../types';
import { PencilIcon, SaveIcon, MailIcon, PhoneIcon, UserCircleIcon, XCircleIcon } from './Icons';
import ImageUploader from './ImageUploader';

interface ProfilePageProps {
  user: User;
  onUpdateProfile: (updatedUser: User) => void;
  onBack: () => void;
}

const ProfilePage: React.FC<ProfilePageProps> = ({ user, onUpdateProfile, onBack }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: user.name,
    phoneNumber: user.phoneNumber || '',
    profilePictureUrl: user.profilePictureUrl || '',
    bio: user.bio || '',
  });

  const handleSave = () => {
    onUpdateProfile({
      ...user,
      name: formData.name,
      phoneNumber: formData.phoneNumber,
      profilePictureUrl: formData.profilePictureUrl,
      bio: formData.bio,
    });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setFormData({
      name: user.name,
      phoneNumber: user.phoneNumber || '',
      profilePictureUrl: user.profilePictureUrl || '',
      bio: user.bio || '',
    });
    setIsEditing(false);
  };

  const ProfileInfoRow: React.FC<{ icon: React.ReactNode; label: string; value: string; isEditable?: boolean }> = ({ icon, label, value, isEditable = false }) => (
    <div className="flex items-start gap-4 py-3">
      <div className="text-neutral-500 mt-1">{icon}</div>
      <div>
        <p className="text-sm text-neutral-500">{label}</p>
        <p className={`font-semibold ${isEditable ? 'text-neutral-800' : 'text-neutral-500'}`}>{value}</p>
      </div>
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto">
       <button onClick={onBack} className="mb-4 text-sm font-medium text-primary hover:underline">
            &larr; Back to Dashboard
        </button>
      <div className="bg-white p-8 rounded-lg shadow-lg border">
        <div className="flex flex-col sm:flex-row justify-between sm:items-start mb-6 gap-4">
          <div>
            <h2 className="text-3xl font-bold text-neutral-900">My Profile</h2>
            <p className="text-neutral-600">View and edit your personal information.</p>
          </div>
          {!isEditing ? (
            <button onClick={() => setIsEditing(true)} className="flex items-center gap-2 px-4 py-2 bg-secondary hover:bg-primary text-white font-semibold rounded-lg transition-colors duration-300 w-full sm:w-auto justify-center">
              <PencilIcon className="w-5 h-5" />
              Edit Profile
            </button>
          ) : (
             <div className="flex gap-2 w-full sm:w-auto">
                <button onClick={handleSave} className="flex-1 flex items-center gap-2 justify-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-colors duration-300">
                  <SaveIcon className="w-5 h-5" />
                  Save
                </button>
                 <button onClick={handleCancel} className="flex-1 flex items-center gap-2 justify-center px-4 py-2 bg-neutral-200 hover:bg-neutral-300 text-neutral-800 font-semibold rounded-lg transition-colors duration-300">
                  <XCircleIcon className="w-5 h-5" />
                  Cancel
                </button>
            </div>
          )}
        </div>
        
        {!isEditing ? (
            <>
                <div className="flex flex-col items-center text-center border-b pb-6 mb-6">
                    {user.profilePictureUrl ? (
                        <img src={user.profilePictureUrl} alt="Profile" className="w-32 h-32 rounded-full object-cover mb-4 border-4 border-white shadow-lg" />
                    ) : (
                        <UserCircleIcon className="w-32 h-32 text-neutral-300 mb-4" />
                    )}
                    <h3 className="text-2xl font-bold">{user.name}</h3>
                    <p className="text-neutral-500">{user.email}</p>
                    {user.bio && <p className="mt-4 text-neutral-600 max-w-md">{user.bio}</p>}
                </div>
                <div className="divide-y">
                    <ProfileInfoRow icon={<MailIcon className="w-6 h-6" />} label="Email Address" value={user.email} />
                    <ProfileInfoRow icon={<PhoneIcon className="w-6 h-6" />} label="Phone Number" value={user.phoneNumber || 'Not provided'} isEditable />
                </div>
            </>
        ) : (
            <div className="space-y-4">
                 <div className="flex justify-center">
                    <ImageUploader 
                        currentImageUrl={formData.profilePictureUrl}
                        onImageSelect={(base64) => setFormData(prev => ({...prev, profilePictureUrl: base64}))}
                        size="large"
                    />
                 </div>
                 <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700">Full Name</label>
                    <input 
                        type="text" 
                        id="name" 
                        value={formData.name}
                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                    />
                </div>
                <div>
                    <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700">Phone Number</label>
                    <input 
                        type="tel" 
                        id="phoneNumber" 
                        value={formData.phoneNumber}
                        onChange={(e) => setFormData(prev => ({ ...prev, phoneNumber: e.target.value }))}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                    />
                </div>
                 <div>
                    <label htmlFor="bio" className="block text-sm font-medium text-gray-700">Short Bio</label>
                    <textarea 
                        id="bio"
                        rows={3}
                        value={formData.bio}
                        onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                        placeholder="Tell us a little about yourself..."
                    />
                </div>
                <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email Address (cannot be changed)</label>
                    <input 
                        type="email" 
                        id="email" 
                        value={user.email}
                        disabled
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-neutral-100 text-neutral-500 cursor-not-allowed"
                    />
                </div>
            </div>
        )}
      </div>
    </div>
  );
};

export default ProfilePage;