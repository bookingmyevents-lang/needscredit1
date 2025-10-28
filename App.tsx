import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
import type { Property, Application, Payment, User, Viewing, Agreement, Verification, Bill, Dispute, ActivityLog, Notification, AiFilters, MaintenanceRequest, Review } from './types';
import { UserRole, ApplicationStatus, FurnishingStatus, Facing, ViewingStatus, VerificationStatus, BillType, DisputeStatus, ActivityType, NotificationType, PaymentType, MaintenanceStatus, MaintenanceCategory } from './types';
import { mockProperties, mockUsers, mockViewings, mockAgreements, mockVerifications, mockBills, mockDisputes, mockPayments, mockApplications, mockActivityLogs, mockMaintenanceRequests, mockReviews } from './mockData';
import Header from './components/Header';
import PropertyList from './components/PropertyList';
import PropertyDetails from './components/PropertyDetails';
import OwnerDashboard from './components/OwnerDashboard';
import AgreementView from './components/AgreementView';
import PaymentPortal from './components/PaymentPortal';
import RenterDashboard from './components/RenterDashboard';
import LoginPage from './components/LoginPage';
import SuperAdminDashboard from './components/SuperAdminDashboard';
import HomePage from './components/HomePage';
import EditPropertyForm from './components/EditPropertyForm';
import PostPropertyForm from './components/PostPropertyForm';
import Footer from './components/Footer';
import ApplicationForm from './components/ApplicationForm';
import ProfilePage from './components/ProfilePage';
import ActivityLogPage from './components/ActivityLogPage';
import SmartSearchModal from './components/SmartSearchModal';
import AgreementSigningPage from './components/AgreementSigningPage';
import OtpVerificationModal from './components/OtpVerificationModal';
import BookingConfirmation from './components/BookingConfirmation';
import FinalizeAgreementForm from './components/FinalizeAgreementForm';
import * as Icons from './components/Icons';

const odishaDistricts = [
    'Angul', 'Balangir', 'Balasore', 'Bargarh', 'Bhadrak', 'Boudh', 'Cuttack',
    'Deogarh', 'Dhenkanal', 'Gajapati', 'Ganjam', 'Jagatsinghpur', 'Jajpur',
    'Jharsuguda', 'Kalahandi', 'Kandhamal', 'Kendrapara', 'Keonjhar', 'Khordha',
    'Koraput', 'Malkangiri', 'Mayurbhanj', 'Nabarangpur', 'Nayagarh', 'Nuapada',
    'Puri', 'Rayagada', 'Sambalpur', 'Subarnapur', 'Sundargarh'
];

const USERS_STORAGE_KEY = 'rent-ease-users';
const PLATFORM_FEE_AMOUNT = 500;
const SERVICE_FEE_PERCENTAGE = 0.025; // 2.5%

const getDefaultNotificationPreferences = (role: UserRole) => {
    const allPreferences: Partial<Record<NotificationType, boolean>> = {};
    for (const type in NotificationType) {
        allPreferences[type as NotificationType] = true;
    }
    return allPreferences;
};


const loadInitialUsers = (): User[] => {
    try {
        const storedUsers = localStorage.getItem(USERS_STORAGE_KEY);
        if (storedUsers) {
            const parsedUsers = JSON.parse(storedUsers);
            if (Array.isArray(parsedUsers) && parsedUsers.length > 0) {
                 return parsedUsers.map((user: User) => ({
                    ...user,
                    notificationPreferences: user.notificationPreferences || getDefaultNotificationPreferences(user.role)
                }));
            }
        }
    } catch (error) {
        console.error("Failed to process users from localStorage", error);
    }
    // Fallback for first load or if localStorage is empty/corrupted
    const usersWithPrefs = mockUsers.map(user => ({
        ...user,
        notificationPreferences: user.notificationPreferences || getDefaultNotificationPreferences(user.role)
    }));
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(usersWithPrefs));
    return usersWithPrefs;
};


const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  
  // App-wide state
  const [properties, setProperties] = useState<Property[]>(mockProperties);
  const [applications, setApplications] = useState<Application[]>(mockApplications);
  const [users, setUsers] = useState<User[]>(loadInitialUsers);
  const [viewings, setViewings] = useState<Viewing[]>(mockViewings);
  const [agreements, setAgreements] = useState<Agreement[]>(mockAgreements);
  const [verifications, setVerifications] = useState<Verification[]>(mockVerifications);
  const [bills, setBills] = useState<Bill[]>(mockBills);
  const [disputes, setDisputes] = useState<Dispute[]>(mockDisputes);
  const [payments, setPayments] = useState<Payment[]>(mockPayments);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>(mockActivityLogs);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [maintenanceRequests, setMaintenanceRequests] = useState<MaintenanceRequest[]>(mockMaintenanceRequests);
  const [savedProperties, setSavedProperties] = useState<string[]>([]);
  const [reviews, setReviews] = useState<Review[]>(mockReviews);

  // View state
  const [currentView, setCurrentView] = useState('home'); // home, login, browsing, propertyDetails, booking, dashboard, etc.
  const [dashboardView, setDashboardView] = useState('overview'); // Controls active tab in dashboards, or 'profile', 'activity', 'onboarding', 'pastRentals', 'activeRentals', 'maintenance'
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [editingProperty, setEditingProperty] = useState<Property | null>(null);
  const [isPostingProperty, setIsPostingProperty] = useState(false);
  const [initialSearchTerm, setInitialSearchTerm] = useState<string>('');
  const [cityName, setCityName] = useState<string>('Odisha');
  const [nearbyLocations, setNearbyLocations] = useState<string[]>(odishaDistricts);
  const [viewingAgreementDetails, setViewingAgreementDetails] = useState<{ agreement: Agreement; property: Property } | null>(null);
  const [signingAgreementDetails, setSigningAgreementDetails] = useState<{ agreement: Agreement; property: Property } | null>(null);
  const [payingRentDetails, setPayingRentDetails] = useState<{ application: Application; property: Property } | null>(null);
  const [payingBillDetails, setPayingBillDetails] = useState<{ bill: Bill; property: Property } | null>(null);
  const [paymentChoiceDetails, setPaymentChoiceDetails] = useState<{ application: Application; property: Property } | null>(null);
  const [offlinePaymentDetails, setOfflinePaymentDetails] = useState<{ application: Application; property: Property } | null>(null);
  const [isSmartSearchOpen, setIsSmartSearchOpen] = useState(false);
  const [isSmartSearchLoading, setIsSmartSearchLoading] = useState(false);
  const [aiFilters, setAiFilters] = useState<AiFilters | null>(null);
  const [otpVerificationDetails, setOtpVerificationDetails] = useState<{ agreementId: string; generatedOtp: string; error: string | null; } | null>(null);
  const [lastBookingDetails, setLastBookingDetails] = useState<{ viewing: Viewing; property: Property } | null>(null);
  const [postLoginAction, setPostLoginAction] = useState<{ view: string; propertyId: string; bookingType?: 'viewing' | 'direct' } | null>(null);
  const [payingViewingAdvanceDetails, setPayingViewingAdvanceDetails] = useState<{ property: Property; proposedDateTime: string } | null>(null);
  const [pendingViewingDetails, setPendingViewingDetails] = useState<any>(null);
  const [finalizingAgreementDetails, setFinalizingAgreementDetails] = useState<{ application: Application; property: Property } | null>(null);
  const [bookingType, setBookingType] = useState<'viewing' | 'direct'>('viewing');
  const [recentlyPaidApplicationId, setRecentlyPaidApplicationId] = useState<string | null>(null);

  useEffect(() => {
    if (currentUser && currentUser.role === UserRole.RENTER) {
        try {
            const storedSaved = localStorage.getItem(`rent-ease-saved-properties-${currentUser.id}`);
            if (storedSaved) {
                setSavedProperties(JSON.parse(storedSaved));
            } else {
                setSavedProperties([]);
            }
        } catch (error) {
            console.error("Failed to load saved properties from localStorage", error);
            setSavedProperties([]);
        }
    } else {
        // Clear saved properties if user logs out or is not a renter
        setSavedProperties([]);
    }
}, [currentUser]);

  const generateRentCycleEvents = useCallback(() => {
    const today = new Date();
    const allNewNotifications: Notification[] = [];
    const allNewApplications: Application[] = [];
    const allNewActivityLogs: ActivityLog[] = [];

    const activeAgreements = agreements.filter(a => a.signedByOwner && a.signedByTenant);

    // --- 1. Generate 3-day pre-due date reminders ---
    const PRE_DUE_REMINDER_DAYS = 3;
    activeAgreements.forEach(agreement => {
        const startDate = new Date(agreement.startDate);
        if (startDate > today) return;

        const dueDay = startDate.getDate();
        let nextDueDate;
        // If today's date is already past this month's due day, the next due date is next month.
        if (today.getDate() > dueDay) {
            nextDueDate = new Date(today.getFullYear(), today.getMonth() + 1, dueDay);
        } else {
            // Otherwise, the next due date is this month.
            nextDueDate = new Date(today.getFullYear(), today.getMonth(), dueDay);
        }
        
        const todayDateOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const timeDiff = nextDueDate.getTime() - todayDateOnly.getTime();
        const dayDiff = Math.round(timeDiff / (1000 * 3600 * 24));

        if (dayDiff === PRE_DUE_REMINDER_DAYS) {
            // Check if a 3-day reminder for this specific due date has been sent
            const existingNotification = [...notifications, ...allNewNotifications].find(n =>
                n.userId === agreement.tenantId &&
                n.relatedId === agreement.propertyId &&
                n.type === NotificationType.RENT_DUE_SOON &&
                n.message.includes('in 3 days') && // Specific message check
                new Date(n.timestamp).getMonth() === today.getMonth() && // Check if created this month
                new Date(n.timestamp).getFullYear() === today.getFullYear()
            );

            if (!existingNotification) {
                const tenant = users.find(u => u.id === agreement.tenantId);
                const property = properties.find(p => p.id === agreement.propertyId);
                if (!tenant || !property) return;
                
                const newNotification: Notification = {
                    id: `notif-rent-3day-${agreement.id}-${nextDueDate.getFullYear()}-${nextDueDate.getMonth()}`,
                    userId: tenant.id,
                    type: NotificationType.RENT_DUE_SOON,
                    message: `Reminder: Your rent of ₹${agreement.rentAmount.toLocaleString()} for "${property.title}" is due in 3 days.`,
                    timestamp: new Date().toISOString(),
                    isRead: false,
                    relatedId: property.id,
                };
                allNewNotifications.push(newNotification);
            }
        }
    });

    // --- 2. Generate monthly rent dues & "due now" notifications on/after due date ---
    activeAgreements.forEach(agreement => {
        const startDate = new Date(agreement.startDate);
        if (startDate > today) return;

        const dueDay = startDate.getDate();
        const currentMonthDueDate = new Date(today.getFullYear(), today.getMonth(), dueDay);

        // This check is key: only generate if due date is today or in the past for the current month
        if (today < currentMonthDueDate) return;

        const existingRentApplication = [...applications, ...allNewApplications].find(app =>
            app.propertyId === agreement.propertyId &&
            app.renterId === agreement.tenantId &&
            (app.status === ApplicationStatus.RENT_DUE || app.status === ApplicationStatus.RENT_PAID || app.status === ApplicationStatus.OFFLINE_PAYMENT_PENDING) &&
            app.dueDate &&
            new Date(app.dueDate).getMonth() === today.getMonth() &&
            new Date(app.dueDate).getFullYear() === today.getFullYear()
        );

        if (!existingRentApplication) {
            const tenant = users.find(u => u.id === agreement.tenantId);
            const property = properties.find(p => p.id === agreement.propertyId);
            if (!tenant || !property) return;

            const newRentApplication: Application = {
                id: `rent-${agreement.id}-${today.getFullYear()}-${today.getMonth()}`,
                propertyId: agreement.propertyId,
                renterId: agreement.tenantId,
                renterName: tenant.name,
                renterEmail: tenant.email,
                moveInDate: agreement.startDate,
                status: ApplicationStatus.RENT_DUE,
                documents: { idProof: null, incomeProof: null },
                amount: agreement.rentAmount,
                dueDate: currentMonthDueDate.toISOString(),
            };
            allNewApplications.push(newRentApplication);

            const newLog: ActivityLog = {
                id: `log-rent-${newRentApplication.id}`,
                userId: tenant.id,
                type: ActivityType.GENERATED_BILL,
                message: `Rent bill of ₹${agreement.rentAmount.toLocaleString()} generated for "${property.title}".`,
                timestamp: new Date().toISOString(),
            };
            allNewActivityLogs.push(newLog);

            // Check if a "due now" notification for this due date already exists to avoid duplicates.
            const existingDueNowNotification = [...notifications, ...allNewNotifications].find(n =>
                n.userId === agreement.tenantId &&
                n.relatedId === agreement.propertyId &&
                n.type === NotificationType.RENT_DUE_SOON &&
                n.message.includes('is now due') &&
                new Date(n.timestamp).getMonth() === today.getMonth() &&
                new Date(n.timestamp).getFullYear() === today.getFullYear()
            );

            if (!existingDueNowNotification) {
                 const newNotification: Notification = {
                    id: `notif-rent-due-${newRentApplication.id}`,
                    userId: tenant.id,
                    type: NotificationType.RENT_DUE_SOON,
                    message: `Your rent of ₹${agreement.rentAmount.toLocaleString()} for "${property.title}" is now due. Please pay to avoid penalties.`,
                    timestamp: new Date().toISOString(),
                    isRead: false,
                    relatedId: property.id,
                };
                allNewNotifications.push(newNotification);
            }
        }
    });
    
    // --- 3. Apply all state updates ---
    if (allNewApplications.length > 0) {
      setApplications(prev => [...prev, ...allNewApplications]);
    }
    if (allNewActivityLogs.length > 0) {
      setActivityLogs(prev => [...prev, ...allNewActivityLogs]);
    }
    if (allNewNotifications.length > 0) {
      setNotifications(prev => [...prev, ...allNewNotifications]);
    }
  }, [agreements, applications, notifications, users, properties]);


  useEffect(() => {
    // Initial check on mount
    generateRentCycleEvents();
    
    // Set up a periodic check (e.g., every hour) to ensure reminders are timely
    const intervalId = setInterval(generateRentCycleEvents, 60 * 60 * 1000);
    
    // Cleanup on unmount
    return () => clearInterval(intervalId);
  }, [generateRentCycleEvents]); // Run only once on mount

  const addActivityLog = useCallback((type: ActivityType, message: string) => {
    if (!currentUser) return;
    const newLog: ActivityLog = {
      id: `log-${Date.now()}`,
      userId: currentUser.id,
      type,
      message,
      timestamp: new Date().toISOString(),
    };
    setActivityLogs(prev => [newLog, ...prev]);
  }, [currentUser]);
  
  const addNotification = useCallback((userId: string, type: NotificationType, message: string, relatedId: string) => {
    const newNotif: Notification = {
        id: `notif-${Date.now()}`,
        userId,
        type,
        message,
        timestamp: new Date().toISOString(),
        isRead: false,
        relatedId,
    };
    setNotifications(prev => [newNotif, ...prev]);
  }, []);


  const resetToHome = () => {
      setSelectedProperty(null);
      setEditingProperty(null);
      setIsPostingProperty(false);
      setInitialSearchTerm('');
      
      if (currentUser) {
          const defaultView = 'overview';
          setDashboardView(defaultView);
          setCurrentView('dashboard');
      } else {
          setCurrentView('home');
          setDashboardView('overview'); // Reset for next login
      }
  }

  const handleLogin = (email: string, pass: string) => {
    const user = users.find(u => u.email.toLowerCase() === email.trim().toLowerCase());
    if (user && user.password === pass) {
        setCurrentUser(user);

        if (postLoginAction) {
            const propertyToSelect = properties.find(p => p.id === postLoginAction.propertyId);
            if (propertyToSelect) {
                setSelectedProperty(propertyToSelect);
                if(postLoginAction.bookingType) {
                    setBookingType(postLoginAction.bookingType);
                }
                setCurrentView(postLoginAction.view);
                setPostLoginAction(null); // Reset after use
                return; // Prevent redirecting to dashboard
            }
        }

        setDashboardView('overview');
        setCurrentView('dashboard');
    } else {
        alert("Login failed. Please check your email and password. For the demo, select a role on the login page to auto-fill credentials.");
    }
  };

  const handleSignup = (name: string, email: string, pass: string, role: UserRole, profilePictureUrl: string): boolean => {
    if (users.some(u => u.email.toLowerCase() === email.trim().toLowerCase())) {
      alert('An account with this email already exists.');
      return false;
    }
    
    const newUser: User = {
      id: `user-${Date.now()}`,
      name: name.trim(),
      email: email.trim(),
      password: pass,
      role,
      kycStatus: 'Not Verified',
      profilePictureUrl,
      notificationPreferences: getDefaultNotificationPreferences(role),
    };
    
    // Update users list using a functional update for safety
    setUsers(currentUsers => {
      const updatedUsers = [...currentUsers, newUser];
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(updatedUsers));
      return updatedUsers;
    });

    // Auto-login the new user
    setCurrentUser(newUser);
    setDashboardView('overview');
    setCurrentView('dashboard');
    
    return true;
  };

  const handleLogout = () => {
    setCurrentUser(null);
    resetToHome();
  };

  const handleSelectProperty = (property: Property) => {
    setSelectedProperty(property);
    setCurrentView('propertyDetails');
    if (currentUser) {
      addActivityLog(ActivityType.VIEWED_PROPERTY, `Viewed property details for "${property.title}".`);
    }
  };

  const handleGoBackToList = () => {
    setSelectedProperty(null);
    setCurrentView('browsing');
  };
  
  const handleStartBrowsing = (searchTerm: string) => {
    setInitialSearchTerm(searchTerm);
    setCurrentView('browsing');
  };

  const handleScheduleViewingRequest = (property: Property) => {
    if (!currentUser || currentUser.role !== UserRole.RENTER) {
      alert("Please log in as a renter to schedule a viewing. You will be returned to this page after logging in.");
      setPostLoginAction({ view: 'booking', propertyId: property.id, bookingType: 'viewing' });
      setCurrentView('login');
      return;
    }
    setBookingType('viewing');
    setSelectedProperty(property);
    setCurrentView('booking');
  };

  const handleDirectBookingRequest = (property: Property) => {
    if (!currentUser || currentUser.role !== UserRole.RENTER) {
      alert("Please log in as a renter to apply directly. You will be returned to this page after logging in.");
      setPostLoginAction({ view: 'booking', propertyId: property.id, bookingType: 'direct' });
      setCurrentView('login');
      return;
    }
    setBookingType('direct');
    setSelectedProperty(property);
    setCurrentView('booking');
  };

  const handleApplicationSubmit = (property: Property, details: { proposedDateTime?: string, verificationData: any }) => {
    if (!currentUser) return;
    
    if (bookingType === 'viewing') {
      const newViewing: Viewing = {
        id: `view-${Date.now()}`,
        propertyId: property.id,
        tenantId: currentUser.id,
        ownerId: property.ownerId,
        advanceAmount: property.viewingAdvance,
        status: ViewingStatus.REQUESTED,
        scheduledAt: details.proposedDateTime!,
        requestedAt: new Date().toISOString(),
        verificationData: details.verificationData,
      };
      // For demo, we are moving to payment right away. In real app, might wait for owner pre-approval.
      setPendingViewingDetails(newViewing);
      setPayingViewingAdvanceDetails({ property, proposedDateTime: details.proposedDateTime! });
      
    } else { // Direct application
       const newApplication: Application = {
        id: `app-${Date.now()}`,
        propertyId: property.id,
        renterId: currentUser.id,
        renterName: currentUser.name,
        renterEmail: currentUser.email,
        moveInDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // Default move-in 1 week from now
        status: ApplicationStatus.PENDING,
        documents: { idProof: null, incomeProof: null },
      };
      setApplications(prev => [...prev, newApplication]);
      addActivityLog(ActivityType.SUBMITTED_APPLICATION, `Submitted application for "${property.title}".`);
      addNotification(property.ownerId, NotificationType.APPLICATION_STATUS_UPDATE, `${currentUser.name} has submitted an application for your property "${property.title}".`, property.id);
      
      setDashboardView('myRentals');
      setCurrentView('dashboard');
    }
  };

  const handleViewingPaymentSuccess = () => {
      if (!pendingViewingDetails || !payingViewingAdvanceDetails || !currentUser) return;

      const newPayment: Payment = {
          id: `pay-${Date.now()}`,
          userId: currentUser.id,
          propertyId: pendingViewingDetails.propertyId,
          type: PaymentType.VIEWING_ADVANCE,
          amount: pendingViewingDetails.advanceAmount,
          paymentDate: new Date().toISOString(),
          status: 'Paid',
      };
      const finalViewing: Viewing = {
          ...pendingViewingDetails,
          paymentId: newPayment.id,
          status: ViewingStatus.REQUESTED, // Officially requested after payment
      };

      setViewings(prev => [...prev, finalViewing]);
      setPayments(prev => [...prev, newPayment]);
      
      addActivityLog(ActivityType.REQUESTED_VIEWING, `Requested a viewing for "${payingViewingAdvanceDetails.property.title}".`);
      addNotification(pendingViewingDetails.ownerId, NotificationType.NEW_VIEWING_REQUEST, `${currentUser.name} has requested a viewing for your property "${payingViewingAdvanceDetails.property.title}".`, pendingViewingDetails.propertyId);

      setLastBookingDetails({ viewing: finalViewing, property: payingViewingAdvanceDetails.property });
      setCurrentView('bookingConfirmation');

      // Cleanup
      setPayingViewingAdvanceDetails(null);
      setPendingViewingDetails(null);
  };
  
  const handleUpdateViewingStatus = (viewingId: string, status: ViewingStatus) => {
    setViewings(prev => prev.map(v => v.id === viewingId ? { ...v, status } : v));
    const viewing = viewings.find(v => v.id === viewingId);
    if (viewing) {
        let message = `Your viewing request for "${properties.find(p=>p.id === viewing.propertyId)?.title}" has been ${status.toLowerCase()}.`;
        addNotification(viewing.tenantId, NotificationType.VIEWING_STATUS_UPDATE, message, viewing.propertyId);
    }
  };

  const handleUpdateApplicationStatus = (applicationId: string, status: ApplicationStatus) => {
    setApplications(prev => prev.map(a => a.id === applicationId ? { ...a, status } : a));
  };
  
  const handleEditProperty = (property: Property) => {
    setEditingProperty(property);
    setCurrentView('editProperty');
  };

  const handleUpdateProperty = (updatedProperty: Property) => {
      setProperties(prev => prev.map(p => p.id === updatedProperty.id ? updatedProperty : p));
      setEditingProperty(null);
      setDashboardView('properties');
      setCurrentView('dashboard');
  };

  const handlePostNewProperty = (newPropertyData: Omit<Property, 'id' | 'ownerId' | 'availability' | 'postedDate' | 'reviewIds' | 'images' | 'nearbyPlaces'>) => {
      if (!currentUser) return;
      const newProperty: Property = {
          id: `prop-${Date.now()}`,
          ownerId: currentUser.id,
          ...newPropertyData,
          availability: 'available',
          postedDate: new Date().toISOString(),
          reviewIds: [],
          images: [`https://picsum.photos/seed/newprop${Date.now()}/800/600`], // Placeholder image
          nearbyPlaces: [], // Could be auto-generated later
      };
      setProperties(prev => [newProperty, ...prev]);
      setIsPostingProperty(false);
      setDashboardView('properties');
      setCurrentView('dashboard');
  };

  const handleToggleSaveProperty = (propertyId: string) => {
      if (!currentUser) {
          alert('Please log in to save properties.');
          return;
      }
      setSavedProperties(prev => {
          const newSaved = prev.includes(propertyId)
              ? prev.filter(id => id !== propertyId)
              : [...prev, propertyId];
          localStorage.setItem(`rent-ease-saved-properties-${currentUser.id}`, JSON.stringify(newSaved));
          return newSaved;
      });
  };
  
  const handleInitiateFinalizeAgreement = (application: Application, property: Property) => {
      setFinalizingAgreementDetails({ application, property });
  };

  const handleFinalizeAgreementSubmit = (applicationId: string, finalDetails: any) => {
      const { finalRentAmount, finalDepositAmount, moveInDate, contractDuration } = finalDetails;
      // 1. Update the application with new status and details
      setApplications(prev => prev.map(app => 
          app.id === applicationId 
          ? { ...app, status: ApplicationStatus.AGREEMENT_SENT, finalRentAmount, finalDepositAmount, moveInDate, contractDuration } 
          : app
      ));

      // 2. Create a new Agreement
      const originalApp = applications.find(a => a.id === applicationId);
      if (originalApp) {
          const newAgreement: Agreement = {
              id: `agree-${applicationId}`,
              propertyId: originalApp.propertyId,
              tenantId: originalApp.renterId,
              ownerId: properties.find(p => p.id === originalApp.propertyId)!.ownerId,
              rentAmount: finalRentAmount,
              depositAmount: finalDepositAmount,
              startDate: moveInDate,
              endDate: new Date(new Date(moveInDate).setMonth(new Date(moveInDate).getMonth() + parseInt(contractDuration))).toISOString(),
              signedByTenant: false,
              signedByOwner: false,
          };
          setAgreements(prev => [...prev, newAgreement]);
           addNotification(originalApp.renterId, NotificationType.AGREEMENT_ACTION_REQUIRED, `Your rental agreement for "${properties.find(p=>p.id === originalApp.propertyId)?.title}" is ready to be signed.`, originalApp.propertyId);
      }

      // 3. Close the modal
      setFinalizingAgreementDetails(null);
  };
  
  const handleSignAgreement = (agreement: Agreement, property: Property) => {
      setSigningAgreementDetails({ agreement, property });
  };
  
  const handleInitiateSign = (agreementId: string) => {
      const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
      console.log(`OTP for agreement ${agreementId}: ${generatedOtp}`);
      setOtpVerificationDetails({ agreementId, generatedOtp, error: null });
  };

  const handleVerifyOtpAndSign = (otp: string) => {
    if (!otpVerificationDetails || !currentUser) return;
    if (otp === otpVerificationDetails.generatedOtp) {
        setAgreements(prev => prev.map(a => {
            if (a.id === otpVerificationDetails.agreementId) {
                const isRenter = currentUser.role === UserRole.RENTER;
                const updatedAgreement = { ...a, signedByTenant: isRenter ? true : a.signedByTenant, signedByOwner: !isRenter ? true : a.signedByOwner };
                
                // Check if both have signed to advance the application status
                if (updatedAgreement.signedByTenant && updatedAgreement.signedByOwner) {
                    const appId = a.id.replace('agree-', '');
                    setApplications(apps => apps.map(app => app.id === appId ? { ...app, status: ApplicationStatus.DEPOSIT_DUE } : app));
                    // Also create a new "deposit" application
                     const originalApp = applications.find(app => app.id === appId);
                     if(originalApp){
                        const depositAndRentAmount = (originalApp.finalRentAmount || 0) + (originalApp.finalDepositAmount || 0);
                        const depositApplication: Application = {
                            id: `deposit-${appId}`,
                            propertyId: originalApp.propertyId,
                            renterId: originalApp.renterId,
                            renterName: originalApp.renterName,
                            renterEmail: originalApp.renterEmail,
                            moveInDate: originalApp.moveInDate,
                            status: ApplicationStatus.DEPOSIT_DUE,
                            documents: { idProof: null, incomeProof: null },
                            amount: depositAndRentAmount,
                        };
                         setApplications(prevApps => [...prevApps, depositApplication]);
                         addNotification(originalApp.renterId, NotificationType.DEPOSIT_PAYMENT_DUE, `Your security deposit and first month's rent for "${properties.find(p=>p.id === originalApp.propertyId)?.title}" is now due.`, originalApp.propertyId);
                     }
                }
                
                return updatedAgreement;
            }
            return a;
        }));
        setOtpVerificationDetails(null);
        setSigningAgreementDetails(null);
    } else {
        setOtpVerificationDetails(prev => ({ ...prev!, error: 'Invalid OTP. Please try again.' }));
    }
  };

  const handleAddMaintenanceRequest = (requestData: Omit<MaintenanceRequest, 'id' | 'createdAt' | 'status' | 'createdBy'>) => {
    if (!currentUser) return;
    const newRequest: MaintenanceRequest = {
        id: `task-${Date.now()}`,
        ...requestData,
        createdBy: currentUser.id,
        status: MaintenanceStatus.OPEN,
        createdAt: new Date().toISOString(),
    };
    setMaintenanceRequests(prev => [newRequest, ...prev]);
    
    const property = properties.find(p => p.id === newRequest.propertyId);
    addActivityLog(ActivityType.CREATED_MAINTENANCE_REQUEST, `Created a new maintenance request: "${newRequest.title}" for ${property?.title}.`);
    
    if (newRequest.assignedToId !== currentUser.id) {
        addNotification(newRequest.assignedToId, NotificationType.NEW_MAINTENANCE_REQUEST, `${currentUser.name} assigned a new maintenance task to you: "${newRequest.title}".`, newRequest.propertyId);
    }
  };

  const handleUpdateMaintenanceStatus = (requestId: string, status: MaintenanceStatus) => {
    setMaintenanceRequests(prev => prev.map(req => req.id === requestId ? { ...req, status } : req));
    
    const request = maintenanceRequests.find(r => r.id === requestId);
    if(request) {
        const creator = users.find(u => u.id === request.createdBy);
        const assignee = users.find(u => u.id === request.assignedToId);
        
        if (creator && currentUser?.id !== creator.id) {
             addNotification(creator.id, NotificationType.MAINTENANCE_STATUS_UPDATE, `The status of your request "${request.title}" has been updated to ${status}.`, request.propertyId);
        }
        if (assignee && currentUser?.id !== assignee.id) {
            addNotification(assignee.id, NotificationType.MAINTENANCE_STATUS_UPDATE, `The status of a task assigned to you, "${request.title}", has been updated to ${status}.`, request.propertyId);
        }
    }
  };

  const handleAddMaintenanceComment = (requestId: string, commentText: string) => {
    if (!currentUser) return;
    const request = maintenanceRequests.find(r => r.id === requestId);
    if (!request) return;

    const newComment = { userId: currentUser.id, text: commentText, timestamp: new Date().toISOString() };
    setMaintenanceRequests(prev => prev.map(req => req.id === requestId ? { ...req, comments: [...(req.comments || []), newComment] } : req));

    const otherPartyId = request.createdBy === currentUser.id ? request.assignedToId : request.createdBy;
    addNotification(otherPartyId, NotificationType.MAINTENANCE_STATUS_UPDATE, `${currentUser.name} commented on maintenance request: "${request.title}".`, request.propertyId);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header
        currentUser={currentUser}
        onLogout={handleLogout}
        onLoginClick={() => setCurrentView('login')}
        onSearch={handleStartBrowsing}
        onNavigate={(view) => { setDashboardView(view); setCurrentView('dashboard'); }}
        onPostPropertyClick={() => { setIsPostingProperty(true); setCurrentView('postProperty'); }}
        notifications={notifications.filter(n => n.userId === currentUser?.id)}
        onBrowseClick={() => setCurrentView('browsing')}
        onHomeClick={resetToHome}
        searchSuggestions={odishaDistricts}
      />
      <main className="flex-grow">
        {currentView === 'home' && <HomePage properties={properties} onSearch={handleStartBrowsing} onSelectProperty={handleSelectProperty} cityName={cityName} onSmartSearchClick={() => setIsSmartSearchOpen(true)} onLoginClick={() => setCurrentView('login')} />}
        {currentView === 'login' && <LoginPage users={users} onLogin={handleLogin} onBackToHome={resetToHome} onSignup={handleSignup}/>}
        {currentView === 'browsing' && <PropertyList properties={properties} users={users} onSelectProperty={handleSelectProperty} initialSearchTerm={initialSearchTerm} cityName={cityName} aiFilters={aiFilters} onAiFiltersApplied={() => setAiFilters(null)} currentUser={currentUser} savedProperties={savedProperties} onToggleSaveProperty={handleToggleSaveProperty} />}
        {currentView === 'propertyDetails' && selectedProperty && <PropertyDetails properties={properties} users={users} reviews={reviews} property={selectedProperty} owner={users.find(u => u.id === selectedProperty.ownerId)} onBack={handleGoBackToList} onScheduleViewing={handleScheduleViewingRequest} onBookNow={handleDirectBookingRequest} onNavigateToHome={resetToHome} onNavigateToBrowsing={() => setCurrentView('browsing')} currentUser={currentUser} savedProperties={savedProperties} onToggleSaveProperty={handleToggleSaveProperty} onSelectProperty={handleSelectProperty} />}
        {currentView === 'booking' && selectedProperty && currentUser && <ApplicationForm property={selectedProperty} currentUser={currentUser} onSubmit={handleApplicationSubmit} onBack={() => setCurrentView('propertyDetails')} bookingType={bookingType}/>}
        {currentView === 'dashboard' && currentUser && currentUser.role === UserRole.OWNER && <OwnerDashboard user={currentUser} properties={properties.filter(p => p.ownerId === currentUser.id)} viewings={viewings.filter(v => v.ownerId === currentUser.id).map(v => ({ viewing: v, tenant: users.find(u => u.id === v.tenantId)!, property: properties.find(p => p.id === v.propertyId)! }))} applications={applications.filter(a => properties.some(p => p.id === a.propertyId && p.ownerId === currentUser.id)).map(app => ({ application: app, renter: users.find(u => u.id === app.renterId)!, property: properties.find(p => p.id === app.propertyId)! }))} agreements={agreements.filter(a => a.ownerId === currentUser.id).map(a => ({ agreement: a, property: properties.find(p => p.id === a.propertyId)! }))} paymentHistory={payments.filter(p => properties.some(prop => prop.id === p.propertyId && prop.ownerId === currentUser.id)).map(p => ({ payment: p, tenantName: users.find(u => u.id === p.userId)?.name || 'Unknown', propertyTitle: properties.find(prop => prop.id === p.propertyId)?.title || 'N/A' }))} maintenanceRequests={maintenanceRequests.filter(req => properties.some(p => p.id === req.propertyId && p.ownerId === currentUser.id))} users={users} bills={bills.filter(b => properties.some(p => p.id === b.propertyId && p.ownerId === currentUser.id))} verifications={verifications} activeTab={dashboardView} onTabChange={setDashboardView} onUpdateViewingStatus={handleUpdateViewingStatus} onUpdateApplicationStatus={handleUpdateApplicationStatus} onEditProperty={handleEditProperty} onPostPropertyClick={() => { setIsPostingProperty(true); setCurrentView('postProperty'); }} onViewAgreementDetails={(agreement, property) => setViewingAgreementDetails({ agreement, property })} onSignAgreement={handleSignAgreement} onPayPlatformFee={() => {}} onAcknowledgeOfflinePayment={() => {}} onMarkAsRented={() => {}} onInitiateFinalizeAgreement={handleInitiateFinalizeAgreement} onConfirmDepositPayment={()=>{}} onConfirmKeyHandover={()=>{}} onAddMaintenanceRequest={handleAddMaintenanceRequest} onUpdateMaintenanceStatus={handleUpdateMaintenanceStatus} onAddMaintenanceComment={handleAddMaintenanceComment} onGenerateBill={()=>{}} onUpdateKycStatus={()=>{}} />}
        {currentView === 'dashboard' && currentUser && currentUser.role === UserRole.RENTER && <RenterDashboard user={currentUser} agreements={agreements.filter(a => a.tenantId === currentUser.id).map(a => ({ agreement: a, property: properties.find(p => p.id === a.propertyId)! }))} viewings={viewings.filter(v => v.tenantId === currentUser.id).map(v => ({ viewing: v, property: properties.find(p => p.id === v.propertyId)! }))} applications={applications.filter(a => a.renterId === currentUser.id).map(a => ({ application: a, property: properties.find(p => p.id === a.propertyId)!}))} payments={payments.filter(p => p.userId === currentUser.id)} properties={properties} bills={bills.filter(b => b.tenantId === currentUser.id)} verification={verifications.find(v => v.tenantId === currentUser.id) || { id: '', tenantId: currentUser.id, status: VerificationStatus.NOT_SUBMITTED, formData: {}, submittedAt: '' }} maintenanceRequests={maintenanceRequests.filter(req => agreements.some(a => a.tenantId === currentUser.id && a.propertyId === req.propertyId))} users={users} savedProperties={properties.filter(p => savedProperties.includes(p.id))} activeTab={dashboardView} onTabChange={setDashboardView} onSubmitVerification={() => {}} onPayBill={() => {}} onRaiseDispute={() => {}} onViewAgreementDetails={(agreement, property) => setViewingAgreementDetails({ agreement, property })} onSignAgreement={handleSignAgreement} onInitiatePaymentFlow={() => {}} onConfirmRent={() => {}} onCancelViewing={() => {}} onTenantReject={() => {}} onAddMaintenanceRequest={handleAddMaintenanceRequest} onUpdateMaintenanceStatus={handleUpdateMaintenanceStatus} onAddMaintenanceComment={handleAddMaintenanceComment} onToggleSaveProperty={handleToggleSaveProperty} onSelectProperty={handleSelectProperty} onBrowseClick={() => setCurrentView('browsing')} recentlyPaidApplicationId={recentlyPaidApplicationId} onClearRecentlyPaid={() => setRecentlyPaidApplicationId(null)} onLeaveReview={()=>{}} />}
        {currentView === 'dashboard' && currentUser && currentUser.role === UserRole.SUPER_ADMIN && <SuperAdminDashboard properties={properties} applications={applications} users={users} disputes={disputes} activityLogs={activityLogs} payments={payments} viewings={viewings} onUpdateKycStatus={() => {}} onUpdateViewingStatus={()=>{}} onRefundViewingAdvance={()=>{}} currentUser={currentUser} onUpdateUserRole={()=>{}} />}
        {currentView === 'editProperty' && editingProperty && <EditPropertyForm property={editingProperty} onSubmit={handleUpdateProperty} onCancel={() => { setEditingProperty(null); setCurrentView('dashboard'); }} onNavigateToHome={resetToHome} onNavigateToDashboard={() => setCurrentView('dashboard')} />}
        {currentView === 'postProperty' && isPostingProperty && <PostPropertyForm onSubmit={handlePostNewProperty} onCancel={() => { setIsPostingProperty(false); setCurrentView('dashboard'); }} />}
        {currentView === 'dashboard' && dashboardView === 'profile' && currentUser && <ProfilePage user={currentUser} onUpdateProfile={(u) => setUsers(prev => prev.map(user => user.id === u.id ? u : user))} onBack={() => setDashboardView('overview')} />}
        {currentView === 'dashboard' && dashboardView === 'activity' && currentUser && <ActivityLogPage activities={activityLogs.filter(log => log.userId === currentUser.id)} onBack={() => setDashboardView('overview')} />}
        {currentView === 'bookingConfirmation' && lastBookingDetails && <BookingConfirmation bookingDetails={lastBookingDetails} onGoToDashboard={() => { setDashboardView('viewings'); setCurrentView('dashboard'); }} onBrowseMore={() => setCurrentView('browsing')} />}
      </main>
      
      {/* Modals and Overlays */}
      {viewingAgreementDetails && <AgreementView agreement={viewingAgreementDetails.agreement} property={viewingAgreementDetails.property} renter={users.find(u=>u.id === viewingAgreementDetails.agreement.tenantId)!} owner={users.find(u=>u.id === viewingAgreementDetails.agreement.ownerId)!} isReadOnly={true} onClose={() => setViewingAgreementDetails(null)}/>}
      {signingAgreementDetails && currentUser && <AgreementSigningPage agreement={signingAgreementDetails.agreement} property={signingAgreementDetails.property} currentUser={currentUser} renter={users.find(u=>u.id === signingAgreementDetails.agreement.tenantId)!} owner={users.find(u=>u.id === signingAgreementDetails.agreement.ownerId)!} onInitiateSign={handleInitiateSign} onClose={() => setSigningAgreementDetails(null)}/>}
      {payingViewingAdvanceDetails && currentUser && <PaymentPortal currentUser={currentUser} paymentDetails={{ title: 'Viewing Advance Payment', amount: payingViewingAdvanceDetails.property.viewingAdvance, propertyTitle: payingViewingAdvanceDetails.property.title }} onPaymentSuccess={handleViewingPaymentSuccess} onClose={() => setPayingViewingAdvanceDetails(null)} paymentType={PaymentType.VIEWING_ADVANCE} />}
      {isSmartSearchOpen && <SmartSearchModal isOpen={isSmartSearchOpen} isLoading={isSmartSearchLoading} onClose={() => setIsSmartSearchOpen(false)} onSearch={() => {}} />}
      {otpVerificationDetails && <OtpVerificationModal isOpen={!!otpVerificationDetails} onClose={() => setOtpVerificationDetails(null)} onVerify={handleVerifyOtpAndSign} error={otpVerificationDetails.error} />}
      {finalizingAgreementDetails && <FinalizeAgreementForm details={finalizingAgreementDetails} onClose={() => setFinalizingAgreementDetails(null)} onSubmit={handleFinalizeAgreementSubmit} />}

      {(currentView === 'home' || currentView === 'browsing' || currentView === 'propertyDetails') && <Footer onLocationSearch={handleStartBrowsing} nearbyLocations={nearbyLocations} />}
    </div>
  );
};

export default App;