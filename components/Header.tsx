
import React, { useState, useEffect, useRef } from 'react';
import { UserRole } from '../types';
import type { User, Notification } from '../types';
import { HomeIcon, LogoutIcon, UserCircleIcon, ListBulletIcon, CreditCardIcon, BanknotesIcon, StarIcon, PencilIcon, SearchIcon, LocationMarkerIcon, BellIcon, BuildingIcon, PlusCircleIcon, DocumentCheckIcon, ClipboardDocumentListIcon, HeartIcon, ArrowLeftIcon, DocumentTextIcon, Bars3Icon, XCircleIcon } from './Icons';

interface HeaderProps {
  currentUser: User | null;
  onLogout?: () => void;
  onLoginClick?: () => void;
  onSearch?: (searchTerm: string) => void;
  onNavigate?: (view: string) => void;
  onPostPropertyClick?: () => void;
  notifications?: Notification[];
  onMarkAllAsRead?: () => void;
  onBrowseClick?: () => void;
  onHomeClick?: () => void;
  searchSuggestions?: string[];
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

const Header: React.FC<HeaderProps> = ({ currentUser, onLogout, onLoginClick, onSearch, onNavigate, onPostPropertyClick, notifications = [], onMarkAllAsRead, onBrowseClick, onHomeClick, searchSuggestions = [] }) => {
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isNotifMenuOpen, setIsNotifMenuOpen] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const notifMenuRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const mobileSearchInputRef = useRef<HTMLInputElement>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const unreadCount = notifications.filter(n => !n.isRead).length;

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSearch && searchTerm.trim()) {
      onSearch(searchTerm.trim());
      setSearchTerm('');
      if (isMobileSearchOpen) {
          setIsMobileSearchOpen(false);
      }
    }
  };

  const handleNearMeClick = () => {
    if (onSearch) {
      onSearch('near me');
      if (isMobileSearchOpen) {
          setIsMobileSearchOpen(false);
      }
    }
  };

  const handleNavClick = (view: string) => {
    onNavigate?.(view);
    setIsProfileMenuOpen(false);
    setIsMobileMenuOpen(false);
  };
  
  const handleMobileMenuNav = (action: (() => void) | undefined) => {
    action?.();
    setIsMobileMenuOpen(false);
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
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target as Node)) {
        setIsMobileMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  // Focus input when mobile search opens
  useEffect(() => {
    if (isMobileSearchOpen) {
        setTimeout(() => {
            mobileSearchInputRef.current?.focus();
        }, 100);
    }
  }, [isMobileSearchOpen]);

  useEffect(() => {
    // Prevent body scroll when mobile menu is open
    document.body.style.overflow = isMobileMenuOpen ? 'hidden' : 'auto';
  }, [isMobileMenuOpen]);

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

  const renderOwnerMenu = () => (
    <>
      <a href="#" onClick={(e) => { e.preventDefault(); handleNavClick('overview'); }} className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
          <HomeIcon className="w-5 h-5 text-gray-500"/> My Dashboard
      </a>
       <a href="#" onClick={(e) => { e.preventDefault(); handleNavClick('properties'); }} className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
          <BuildingIcon className="w-5 h-5 text-gray-500"/> My Properties
      </a>
      <a href="#" onClick={(e) => { e.preventDefault(); handleNavClick('applications'); }} className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
          <DocumentTextIcon className="w-5 h-5 text-gray-500"/> Applications & Rentals
      </a>
      <a href="#" onClick={(e) => { e.preventDefault(); handleMobileMenuNav(onPostPropertyClick); setIsProfileMenuOpen(false); }} className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
          <PlusCircleIcon className="w-5 h-5 text-gray-500"/> Post New Property
      </a>
       <a href="#" onClick={(e) => { e.preventDefault(); handleNavClick('paymentHistory'); }} className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
          <CreditCardIcon className="w-5 h-5 text-gray-500"/> Payment History
      </a>
    </>
  );

  const renderRenterMenu = () => (
     <>
      <a href="#" onClick={(e) => { e.preventDefault(); handleNavClick('overview'); }} className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
          <HomeIcon className="w-5 h-5 text-gray-500"/> My Dashboard
      </a>
       <a href="#" onClick={(e) => { e.preventDefault(); handleNavClick('applications'); }} className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
          <DocumentTextIcon className="w-5 h-5 text-gray-500"/> Applications & Rentals
      </a>
      <a href="#" onClick={(e) => { e.preventDefault(); handleNavClick('saved'); }} className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
          <HeartIcon className="w-5 h-5 text-gray-500"/> Saved Properties
      </a>
       <a href="#" onClick={(e) => { e.preventDefault(); handleNavClick('bills'); }} className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
          <BanknotesIcon className="w-5 h-5 text-gray-500"/> Bills & Payments
      </a>
       <a href="#" onClick={(e) => { e.preventDefault(); handleNavClick('history'); }} className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
          <CreditCardIcon className="w-5 h-5 text-gray-500"/> Payment History
      </a>
    </>
  );

  return (
    <>
      <header className="bg-white shadow-md sticky top-0 z-20">
        <div className="container mx-auto px-4 md:px-8 py-3 flex justify-between items-center gap-4">
          <button onClick={onHomeClick} className="flex items-center gap-3 cursor-pointer flex-shrink-0">
            <HomeIcon className="w-8 h-8 text-primary" />
            <h1 className="text-2xl font-bold text-neutral-900 hidden sm:block">RentEase</h1>
          </button>

          {/* Search Bar - Desktop */}
          {onSearch && (
            <div className="flex-grow max-w-xl hidden md:flex">
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
                    list="location-suggestions"
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
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Mobile Search Button */}
            {onSearch && (
              <button
                onClick={() => setIsMobileSearchOpen(true)}
                title="Search Properties"
                className="flex items-center justify-center p-2 bg-neutral-100 hover:bg-secondary/20 text-neutral-600 hover:text-primary rounded-full transition-colors duration-300 md:hidden"
              >
                <SearchIcon className="w-6 h-6" />
              </button>
            )}

            {currentUser && onLogout ? (
              <div className="relative flex items-center gap-2">
                  <button 
                    onClick={onBrowseClick}
                    className="hidden md:flex items-center gap-2 px-4 py-2 bg-neutral-100 hover:bg-secondary/10 text-neutral-800 font-semibold rounded-lg transition-colors duration-300"
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
                
                {/* Profile Button - Desktop */}
                <div className="relative hidden md:block">
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
                          {currentUser.role === UserRole.OWNER && renderOwnerMenu()}
                          {currentUser.role === UserRole.RENTER && renderRenterMenu()}
                          
                          <div className="border-t border-gray-100"></div>
                          <a href="#" onClick={(e) => { e.preventDefault(); handleNavClick('activity'); }} className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                              <ListBulletIcon className="w-5 h-5 text-gray-500"/> My Activity
                          </a>
                          <a href="#" onClick={(e) => { e.preventDefault(); handleNavClick('profile'); }} className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
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
                {/* Hamburger Menu - Mobile */}
                <button
                  onClick={() => setIsMobileMenuOpen(true)}
                  className="p-2 text-neutral-600 hover:bg-neutral-100 rounded-full md:hidden"
                >
                  <Bars3Icon className="w-6 h-6" />
                </button>
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
        </div>
      </header>

      {/* Datalist for suggestions */}
      {searchSuggestions.length > 0 && (
        <datalist id="location-suggestions">
          {searchSuggestions.map(suggestion => (
            <option key={suggestion} value={suggestion} />
          ))}
        </datalist>
      )}
      
      {/* Mobile Search Overlay */}
      {isMobileSearchOpen && (
        <div className="fixed inset-0 z-30 bg-white animate-fade-in">
          <div className="p-3 flex items-center gap-2 border-b">
            <button
              onClick={() => setIsMobileSearchOpen(false)}
              className="p-2 text-neutral-600 hover:bg-neutral-100 rounded-full"
            >
              <ArrowLeftIcon className="w-6 h-6" />
            </button>
            <form onSubmit={handleSearchSubmit} className="flex-grow">
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <SearchIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  ref={mobileSearchInputRef}
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by location..."
                  className="block w-full rounded-md border-gray-300 pl-10 shadow-sm focus:border-primary focus:ring-primary sm:text-sm py-2"
                  list="location-suggestions"
                />
              </div>
            </form>
          </div>
          <div className="p-4">
            <button
              type="button"
              onClick={handleNearMeClick}
              className="w-full flex items-center justify-center gap-2 text-lg text-primary font-semibold hover:bg-secondary/10 px-3 py-3 rounded-lg transition-colors"
            >
              <LocationMarkerIcon className="w-6 h-6" />
              Find properties near me
            </button>
          </div>
        </div>
      )}
       {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && currentUser && (
        <>
            <div className="fixed inset-0 bg-black/40 z-40 animate-fade-in-fast" onClick={() => setIsMobileMenuOpen(false)}></div>
            <div ref={mobileMenuRef} className="fixed top-0 right-0 bottom-0 w-80 bg-white shadow-lg z-50 flex flex-col animate-slide-in">
                <div className="p-4 border-b flex justify-between items-center">
                    <h3 className="font-bold text-lg">Menu</h3>
                    <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 text-neutral-500 hover:bg-neutral-100 rounded-full">
                        <XCircleIcon className="w-6 h-6"/>
                    </button>
                </div>
                <div className="flex-grow overflow-y-auto">
                    <div className="p-4 border-b">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-full overflow-hidden bg-neutral-100">
                                {currentUser.profilePictureUrl ? (
                                    <img src={currentUser.profilePictureUrl} alt="Profile" className="w-full h-full object-cover" />
                                ) : (
                                    <UserCircleIcon className="w-full h-full text-neutral-400" />
                                )}
                            </div>
                            <div>
                                <p className="font-bold text-neutral-800">{currentUser.name}</p>
                                <p className="text-sm text-neutral-500">{getRoleName(currentUser.role)}</p>
                            </div>
                        </div>
                    </div>
                    <nav className="py-2">
                        <a href="#" onClick={(e) => { e.preventDefault(); handleMobileMenuNav(onBrowseClick); }} className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-100">
                            <SearchIcon className="w-5 h-5 text-gray-500"/> Browse Properties
                        </a>
                        {currentUser.role === UserRole.OWNER && renderOwnerMenu()}
                        {currentUser.role === UserRole.RENTER && renderRenterMenu()}
                        <div className="my-2 border-t"></div>
                        <a href="#" onClick={(e) => { e.preventDefault(); handleNavClick('activity'); }} className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-100">
                            <ListBulletIcon className="w-5 h-5 text-gray-500"/> My Activity
                        </a>
                        <a href="#" onClick={(e) => { e.preventDefault(); handleNavClick('profile'); }} className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-100">
                            <PencilIcon className="w-5 h-5 text-gray-500"/> Edit Profile
                        </a>
                    </nav>
                </div>
                <div className="p-4 border-t">
                    <button onClick={() => handleMobileMenuNav(onLogout)} className="w-full text-left flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-red-50 hover:text-red-700 rounded-lg">
                        <LogoutIcon className="w-5 h-5"/>
                        Logout
                    </button>
                </div>
            </div>
        </>
      )}
    </>
  );
};

export default Header;
