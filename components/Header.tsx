import React, { useState, useEffect, useRef } from 'react';
import { UserRole } from '../types';
import type { User, Notification } from '../types';
import { HomeIcon, LogoutIcon, UserCircleIcon, ListBulletIcon, CreditCardIcon, BanknotesIcon, StarIcon, PencilIcon, SearchIcon, LocationMarkerIcon, BellIcon } from './Icons';

interface HeaderProps {
  currentUser: User | null;
  onLogout?: () => void;
  onLoginClick?: () => void;
  onSearch?: (searchTerm: string) => void;
  onNavigateToProfile?: () => void;
  onNavigateToActivity?: () => void;
  notifications?: Notification[];
  onMarkAllAsRead?: () => void;
  onBrowseClick?: () => void;
  onNavigateToDashboard?: () => void;
}

const timeSince = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + " years ago";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + " months ago";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + " days ago";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + " hours ago";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + " minutes ago";
    return "Just now";
};

const Header: React.FC<HeaderProps> = ({ currentUser, onLogout, onLoginClick, onSearch, onNavigateToProfile, onNavigateToActivity, notifications = [], onMarkAllAsRead, onBrowseClick, onNavigateToDashboard }) => {
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isNotifMenuOpen, setIsNotifMenuOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const notifMenuRef = useRef<HTMLDivElement>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const unreadCount = notifications.filter(n => !n.isRead).length;

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSearch && searchTerm.trim()) {
      onSearch(searchTerm.trim());
      setSearchTerm('');
    }
  };

  const handleNearMeClick = () => {
    if (onSearch) {
      onSearch('near me');
    }
  };
  
  // Close menu on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setIsProfileMenuOpen(false);
      }
      if (notifMenuRef.current && !notifMenuRef.current.contains(event.target as Node)) {
        setIsNotifMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleNotifToggle = () => {
    setIsNotifMenuOpen(prev => !prev);
  };

  const getRoleName = (role: UserRole) => {
    switch (role) {
      case UserRole.RENTER: return 'Renter';
      case UserRole.OWNER: return 'Owner';
      case UserRole.SUPER_ADMIN: return 'Super Admin';
      default: return '';
    }
  };

  return (
    <header className="bg-white shadow-md sticky top-0 z-10">
      <div className="container mx-auto px-4 md:px-8 py-3 flex justify-between items-center gap-4">
        <a href="/" className="flex items-center gap-3 cursor-pointer flex-shrink-0">
          <HomeIcon className="w-8 h-8 text-primary" />
          <h1 className="text-2xl font-bold text-neutral-900 hidden sm:block">RentEase</h1>
        </a>

        {/* Search Bar - Hidden on mobile */}
        {onSearch && (
          <div className="flex-grow max-w-xl hidden md:block">
            <form onSubmit={handleSearchSubmit} className="w-full">
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <SearchIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by location..."
                  className="block w-full rounded-md border-gray-300 pl-10 pr-28 shadow-sm focus:border-primary focus:ring-primary sm:text-sm py-2"
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-1.5">
                  <button
                    type="button"
                    onClick={handleNearMeClick}
                    className="flex items-center gap-1.5 text-sm text-primary font-semibold hover:bg-secondary/10 px-2 py-1 rounded-md transition-colors"
                  >
                    <LocationMarkerIcon className="w-5 h-5" />
                    Near me
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}

        {/* Right side controls */}
        {currentUser && onLogout ? (
           <div className="relative flex items-center gap-2 flex-shrink-0">
                <button 
                  onClick={onBrowseClick}
                  className="hidden sm:flex items-center gap-2 px-4 py-2 bg-neutral-100 hover:bg-secondary/10 text-neutral-800 font-semibold rounded-lg transition-colors duration-300"
                >
                    <SearchIcon className="w-5 h-5" />
                    Browse
                </button>
               {/* Notification Bell */}
                <div className="relative">
                    <button
                        onClick={handleNotifToggle}
                        title="Notifications"
                        className="flex items-center justify-center p-2 bg-neutral-100 hover:bg-secondary/20 text-neutral-600 hover:text-primary rounded-full transition-colors duration-300"
                    >
                        <BellIcon className="w-6 h-6" />
                        {unreadCount > 0 && (
                            <span className="absolute top-0 right-0 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white ring-2 ring-white">
                                {unreadCount > 9 ? '9+' : unreadCount}
                            </span>
                        )}
                    </button>
                    {isNotifMenuOpen && (
                        <div ref={notifMenuRef} className="absolute right-0 mt-2 w-80 origin-top-right bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-20">
                            <div className="p-3 border-b flex justify-between items-center">
                                <h4 className="font-semibold text-gray-800">Notifications</h4>
                                {unreadCount > 0 && (
                                    <button onClick={() => { onMarkAllAsRead?.(); }} className="text-xs font-semibold text-primary hover:underline">
                                        Mark all as read
                                    </button>
                                )}
                            </div>
                            <div className="max-h-96 overflow-y-auto custom-scrollbar">
                                {notifications.length > 0 ? (
                                    notifications.map(notif => (
                                        <div key={notif.id} className={`p-3 border-b last:border-b-0 hover:bg-gray-50 ${!notif.isRead ? 'bg-blue-50/50' : ''}`}>
                                            <p className="text-sm text-gray-700">{notif.message}</p>
                                            <p className="text-xs text-gray-400 mt-1">{timeSince(notif.timestamp)}</p>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-center text-sm text-gray-500 py-6">No new notifications.</p>
                                )}
                            </div>
                            <div className="p-2 text-center border-t">
                                <a href="#" onClick={(e) => { e.preventDefault(); setIsNotifMenuOpen(false); }} className="text-sm font-semibold text-primary hover:underline">Close</a>
                            </div>
                        </div>
                    )}
                </div>
              
              {/* Profile Button */}
              <div className="relative">
                <button
                    onClick={() => setIsProfileMenuOpen(prev => !prev)}
                    title="My Profile"
                    className="flex items-center justify-center bg-neutral-100 hover:bg-secondary/20 text-neutral-600 hover:text-primary rounded-full transition-colors duration-300 w-10 h-10 overflow-hidden"
                >
                    {currentUser.profilePictureUrl ? (
                        <img src={currentUser.profilePictureUrl} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                        <UserCircleIcon className="w-6 h-6" />
                    )}
                </button>
                
                {isProfileMenuOpen && (
                    <div ref={profileMenuRef} className="absolute right-0 mt-2 w-56 origin-top-right bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none py-1 z-20">
                        <div className="px-4 py-3">
                            <p className="text-sm font-medium text-gray-900 truncate">{currentUser.name}</p>
                            <p className="text-sm text-gray-500 truncate">{currentUser.email}</p>
                            <p className="text-xs mt-1 inline-flex items-center px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-semibold">{getRoleName(currentUser.role)}</p>
                        </div>
                        <div className="border-t border-gray-100"></div>
                        <a href="#" onClick={(e) => { e.preventDefault(); onNavigateToDashboard?.(); setIsProfileMenuOpen(false); }} className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                            <HomeIcon className="w-5 h-5 text-gray-500"/> My Dashboard
                        </a>
                        <a href="#" onClick={(e) => { e.preventDefault(); onNavigateToActivity?.(); setIsProfileMenuOpen(false); }} className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                            <ListBulletIcon className="w-5 h-5 text-gray-500"/> My Activity
                        </a>
                        <a href="#" className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                            <CreditCardIcon className="w-5 h-5 text-gray-500"/> My Transactions
                        </a>
                        <a href="#" className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                            <BanknotesIcon className="w-5 h-5 text-gray-500"/> Home Loans
                        </a>
                        <a href="#" className="flex items-center justify-between gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                              <span className="flex items-center gap-3">
                                  <StarIcon className="w-5 h-5 text-gray-500"/> My Reviews
                              </span>
                              <span className="bg-green-100 text-green-800 text-xs font-medium px-2 py-0.5 rounded-full">NEW</span>
                        </a>
                        <a href="#" onClick={(e) => { e.preventDefault(); onNavigateToProfile?.(); setIsProfileMenuOpen(false); }} className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                            <PencilIcon className="w-5 h-5 text-gray-500"/> Edit Profile
                        </a>
                        <div className="border-t border-gray-100"></div>
                        <button
                              onClick={onLogout}
                              className="w-full text-left flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-red-50 hover:text-red-700"
                          >
                              <LogoutIcon className="w-5 h-5"/>
                              Logout
                          </button>
                    </div>
                )}
              </div>
          </div>
        ) : (
          <button
            onClick={onLoginClick}
            className="flex-shrink-0 flex items-center gap-2 px-4 py-2 bg-secondary hover:bg-primary text-white font-semibold rounded-lg transition-colors duration-300"
          >
            <UserCircleIcon className="w-5 h-5" />
            <span className="hidden md:block">Login / Sign Up</span>
          </button>
        )}
      </div>
    </header>
  );
};

export default Header;
