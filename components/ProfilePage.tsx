import React, { useState } from 'react';
import type { User } from '../types';
import { UserRole, NotificationType } from '../types';
import { PencilIcon, SaveIcon, MailIcon, PhoneIcon, UserCircleIcon, XCircleIcon } from './Icons';
import ImageUploader from './ImageUploader';

interface ProfilePageProps {
  user: User;
  onUpdateProfile: (updatedUser: User) => void;
  onBack: () => void;
}

const notificationLabels: Record<NotificationType, string> = {
    [NotificationType.NEW_VIEWING_REQUEST]: "New viewing requests on your properties",
    [NotificationType.APPLICATION_STATUS_UPDATE]: "Updates on your rental applications",
    [NotificationType.VIEWING_STATUS_UPDATE]: "Updates on your viewing requests",
    [NotificationType.RENT_DUE_SOON]: "Reminders when rent is due soon",
    [NotificationType.AGREEMENT_ACTION_REQUIRED]: "When a rental agreement needs your action",
    [NotificationType.NEW_PAYMENT_RECEIVED]: "Confirmation of payments you receive",
    [NotificationType.PLATFORM_FEE_DUE_OWNER]: "Platform fee payment reminders",
    [NotificationType.OFFLINE_PAYMENT_SUBMITTED]: "When a tenant submits offline payment proof",
    [NotificationType.OFFLINE_PAYMENT_CONFIRMED]: "Confirmation of your offline payment",
    [NotificationType.DEPOSIT_PAYMENT_DUE]: "Security deposit payment reminders",
    [NotificationType.KEYS_HANDOVER_READY]: "When a property is ready for key handover",
    [NotificationType.NEW_MAINTENANCE_REQUEST]: "When a new maintenance request is created",
    [NotificationType.MAINTENANCE_STATUS_UPDATE]: "Updates on maintenance request status",
    [NotificationType.NEW_BILL_GENERATED]: "When a new bill is generated for you",
    [NotificationType.REFUND_INITIATED]: "Notifications about refund status",
    [NotificationType.NEW_REVIEW_RECEIVED]: "When a new review is received for your property",
};

const ownerPreferences: NotificationType[] = [
    NotificationType.NEW_VIEWING_REQUEST,
    NotificationType.APPLICATION_STATUS_UPDATE,
    NotificationType.AGREEMENT_ACTION_REQUIRED,
    NotificationType.NEW_PAYMENT_RECEIVED,
    NotificationType.PLATFORM_FEE_DUE_OWNER,
    NotificationType.OFFLINE_PAYMENT_SUBMITTED,
    NotificationType.KEYS_HANDOVER_READY,
    NotificationType.NEW_MAINTENANCE_REQUEST,
    NotificationType.MAINTENANCE_STATUS_UPDATE,
    NotificationType.NEW_REVIEW_RECEIVED,
];

const renterPreferences: NotificationType[] = [
    NotificationType.APPLICATION_STATUS_UPDATE,
    NotificationType.VIEWING_STATUS_UPDATE,
    NotificationType.RENT_DUE_SOON,
    NotificationType.AGREEMENT_ACTION_REQUIRED,
    NotificationType.OFFLINE_PAYMENT_CONFIRMED,
    NotificationType.DEPOSIT_PAYMENT_DUE,
    NotificationType.KEYS_HANDOVER_READY,
    NotificationType.NEW_MAINTENANCE_REQUEST,
    NotificationType.MAINTENANCE_STATUS_UPDATE,
    NotificationType.NEW_BILL_GENERATED,
    NotificationType.REFUND_INITIATED,
];

const ProfilePage: React.FC<ProfilePageProps> = ({ user, onUpdateProfile, onBack }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedUser, setEditedUser] = useState<User>(user);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEditedUser(prev => ({ ...prev, [name]: value }));
  };

  const handleBankInfoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEditedUser(prev => ({ ...prev, bankInfo: { ...prev.bankInfo, [name]: value } as User['bankInfo'] }));
  };
  
  const handleNotificationChange = (type: NotificationType, isEnabled: boolean) => {
      setEditedUser(prev => ({
          ...prev,
          notificationPreferences: {
              ...prev.notificationPreferences,
              [type]: isEnabled,
          }
      }));
  };

  const handleSave = () => {
    onUpdateProfile(editedUser);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedUser(user);
    setIsEditing(false);
  };

  const preferencesToShow = user.role === UserRole.OWNER ? ownerPreferences : renterPreferences;

  return (
    <div className="max-w-4xl mx-auto">
      <button onClick={onBack} className="mb-4 text-sm font-medium text-primary hover:underline">
        &larr; Back to Dashboard
      </button>
      <div className="bg-white p-8 rounded-lg shadow-lg border">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-8 mb-8 pb-8 border-b">
          <ImageUploader 
            currentImageUrl={editedUser.profilePictureUrl}
            onImageSelect={(base64) => setEditedUser(prev => ({...prev, profilePictureUrl: base64}))}
          />
          <div className="flex-grow text-center sm:text-left">
            {isEditing ? (
              <input type="text" name="name" value={editedUser.name} onChange={handleInputChange} className="text-3xl font-bold text-neutral-900 border-b-2 w-full mb-2"/>
            ) : (
              <h2 className="text-3xl font-bold text-neutral-900">{editedUser.name}</h2>
            )}
            <p className="text-neutral-600 flex items-center gap-2 justify-center sm:justify-start"><MailIcon className="w-5 h-5"/> {editedUser.email}</p>
            {isEditing ? (
                <input type="text" name="phoneNumber" value={editedUser.phoneNumber || ''} onChange={handleInputChange} className="text-neutral-600 border-b-2 w-full mt-1" placeholder="Phone Number"/>
            ) : (
                <p className="text-neutral-600 flex items-center gap-2 justify-center sm:justify-start"><PhoneIcon className="w-5 h-5"/> {editedUser.phoneNumber || 'Not provided'}</p>
            )}
             <div className="mt-4">
              <span className={`inline-flex items-center px-3 py-1 text-sm font-semibold rounded-full ${user.kycStatus === 'Verified' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                {user.kycStatus}
              </span>
            </div>
          </div>
          {!isEditing && (
            <button onClick={() => setIsEditing(true)} className="flex items-center gap-2 px-4 py-2 bg-neutral-200 hover:bg-neutral-300 text-neutral-800 font-semibold rounded-lg transition-colors duration-300">
              <PencilIcon className="w-5 h-5"/> Edit Profile
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
                 <h3 className="text-xl font-bold mb-4">About Me</h3>
                {isEditing ? (
                    <textarea name="bio" value={editedUser.bio || ''} onChange={handleInputChange} rows={5} className="w-full p-2 border rounded-md" placeholder="Tell us a little about yourself..."></textarea>
                ) : (
                    <p className="text-neutral-700 whitespace-pre-wrap">{editedUser.bio || 'No bio provided.'}</p>
                )}
                 {user.role === UserRole.OWNER && (
                    <div className="mt-6">
                        <h3 className="text-xl font-bold mb-4">Bank Information</h3>
                        {isEditing ? (
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium">Account Holder Name</label>
                                    <input type="text" name="accountHolder" value={editedUser.bankInfo?.accountHolder || ''} onChange={handleBankInfoChange} className="w-full mt-1 p-2 border rounded-md" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium">Account Number</label>
                                    <input type="text" name="accountNumber" value={editedUser.bankInfo?.accountNumber || ''} onChange={handleBankInfoChange} className="w-full mt-1 p-2 border rounded-md" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium">IFSC Code</label>
                                    <input type="text" name="ifscCode" value={editedUser.bankInfo?.ifscCode || ''} onChange={handleBankInfoChange} className="w-full mt-1 p-2 border rounded-md" />
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-2 text-sm text-neutral-700">
                                <p><strong>Account Holder:</strong> {user.bankInfo?.accountHolder || 'N/A'}</p>
                                <p><strong>Account Number:</strong> {user.bankInfo?.accountNumber || 'N/A'}</p>
                                <p><strong>IFSC Code:</strong> {user.bankInfo?.ifscCode || 'N/A'}</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
            <div>
                <h3 className="text-xl font-bold mb-4">Notification Preferences</h3>
                <div className="space-y-3">
                    {preferencesToShow.map(type => (
                        <div key={type} className="flex items-center justify-between">
                            <label htmlFor={type} className="text-sm text-neutral-700">{notificationLabels[type]}</label>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input 
                                    type="checkbox" 
                                    id={type}
                                    checked={editedUser.notificationPreferences?.[type] ?? true} 
                                    onChange={(e) => handleNotificationChange(type, e.target.checked)}
                                    className="sr-only peer"
                                    disabled={!isEditing}
                                />
                                <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-focus:ring-4 peer-focus:ring-blue-300 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                            </label>
                        </div>
                    ))}
                </div>
            </div>
        </div>

        {isEditing && (
          <div className="mt-8 pt-6 border-t flex justify-end gap-4">
            <button onClick={handleCancel} className="flex items-center gap-2 px-4 py-2 bg-neutral-200 hover:bg-neutral-300 text-neutral-800 font-semibold rounded-lg transition-colors duration-300">
              <XCircleIcon className="w-5 h-5"/> Cancel
            </button>
            <button onClick={handleSave} className="flex items-center gap-2 px-4 py-2 bg-secondary hover:bg-primary text-white font-semibold rounded-lg transition-colors duration-300">
              <SaveIcon className="w-5 h-5"/> Save Changes
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfilePage;