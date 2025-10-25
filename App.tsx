

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
  const [dashboardView, setDashboardView] = useState('overview'); // Controls active tab in dashboards, or 'profile', 'activity'
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
      alert("Please log in as a renter to book a property. You will be returned to this page after logging in.");
      setPostLoginAction({ view: 'booking', propertyId: property.id, bookingType: 'direct' });
      setCurrentView('login');
      return;
    }
    setBookingType('direct');
    setSelectedProperty(property);
    setCurrentView('booking');
  };

  const handleApplicationSubmit = (property: Property, details: { proposedDateTime?: string; verificationData: any; }) => {
    if (!currentUser) return;

    if (details.proposedDateTime) {
      // Viewing request flow
      setPendingViewingDetails(details.verificationData);
      setPayingViewingAdvanceDetails({ property, proposedDateTime: details.proposedDateTime });
    } else {
      // Direct booking flow
      const newApplication: Application = {
          id: `app-direct-${Date.now()}`,
          propertyId: property.id,
          renterId: currentUser.id,
          renterName: currentUser.name,
          renterEmail: currentUser.email,
          moveInDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), // Default 2 weeks
          status: ApplicationStatus.PENDING,
          documents: { idProof: null, incomeProof: null },
      };

      setApplications(prev => [newApplication, ...prev]);
      addActivityLog(ActivityType.SUBMITTED_APPLICATION, `Submitted direct application for "${property.title}".`);
      
      addNotification(
          currentUser.id,
          NotificationType.APPLICATION_STATUS_UPDATE,
          `Your application for "${property.title}" has been submitted to the owner.`,
          newApplication.id
      );
      addNotification(
          property.ownerId,
          NotificationType.APPLICATION_STATUS_UPDATE,
          `${currentUser.name} has submitted a direct rental application for "${property.title}".`,
          newApplication.id
      );
      
      alert(`Your application for "${property.title}" has been submitted. The owner will review it shortly. You will now be taken to your dashboard.`);
      setCurrentView('dashboard');
      setDashboardView('applications');
    }
  };
  
  const handleToggleSaveProperty = useCallback((propertyId: string) => {
    if (!currentUser || currentUser.role !== UserRole.RENTER) {
        alert("Please log in as a renter to save properties. You will be redirected to the login page.");
        setCurrentView('login');
        return;
    }

    setSavedProperties(prev => {
        const isSaved = prev.includes(propertyId);
        const newSaved = isSaved ? prev.filter(id => id !== propertyId) : [...prev, propertyId];
        try {
            localStorage.setItem(`rent-ease-saved-properties-${currentUser.id}`, JSON.stringify(newSaved));
        } catch (error) {
            console.error("Failed to save properties to localStorage", error);
        }
        return newSaved;
    });
}, [currentUser]);

  const handleViewingPaymentSuccess = () => {
    if (!payingViewingAdvanceDetails || !currentUser || !pendingViewingDetails) return;
    const { property, proposedDateTime } = payingViewingAdvanceDetails;

    const newPayment: Payment = {
        id: `pay-${Date.now()}`,
        userId: currentUser.id,
        propertyId: property.id,
        type: PaymentType.VIEWING_ADVANCE,
        amount: property.viewingAdvance,
        paymentDate: new Date().toISOString(),
        status: 'Paid',
    };

    const newViewing: Viewing = {
      id: `view-${Date.now()}`,
      propertyId: property.id,
      tenantId: currentUser.id,
      ownerId: property.ownerId,
      advanceAmount: property.viewingAdvance,
      status: ViewingStatus.REQUESTED,
      scheduledAt: proposedDateTime,
      requestedAt: new Date().toISOString(),
      verificationData: pendingViewingDetails,
      paymentId: newPayment.id,
    };
    
    setPayments(prev => [newPayment, ...prev]);
    setViewings(prev => [newViewing, ...prev]);

    addActivityLog(ActivityType.REQUESTED_VIEWING, `Submitted verification and requested a viewing for "${property.title}".`);
    addNotification(
      currentUser.id,
      NotificationType.VIEWING_STATUS_UPDATE,
      `Your viewing request for "${property.title}" is under verification by the owner.`,
      property.id
    );
    addNotification(
      property.ownerId,
      NotificationType.NEW_VIEWING_REQUEST,
      `New tenant verification request for property: ${property.title}.`,
      property.id
    );

    setLastBookingDetails({ viewing: newViewing, property });
    setPayingViewingAdvanceDetails(null);
    setPendingViewingDetails(null);
    setCurrentView('bookingConfirmation');
  };

  const handleConfirmRent = (viewingId: string) => {
    const viewing = viewings.find(v => v.id === viewingId);
    if (!viewing || !currentUser) return;

    const property = properties.find(p => p.id === viewing.propertyId);
    if (!property) return;

    const newApplication: Application = {
        id: `app-from-viewing-${viewing.id}`,
        propertyId: property.id,
        renterId: currentUser.id,
        renterName: currentUser.name,
        renterEmail: currentUser.email,
        moveInDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), // Default 2 weeks
        status: ApplicationStatus.PENDING,
        documents: { idProof: null, incomeProof: null },
    };

    setApplications(prev => [newApplication, ...prev]);
    addActivityLog(ActivityType.SUBMITTED_APPLICATION, `Confirmed intent to rent and submitted application for "${property.title}" after viewing.`);
    
    addNotification(
        currentUser.id,
        NotificationType.APPLICATION_STATUS_UPDATE,
        `Your rent confirmation for "${property.title}" has been sent to the owner.`,
        newApplication.id
    );
    addNotification(
        property.ownerId,
        NotificationType.APPLICATION_STATUS_UPDATE,
        `Tenant ${currentUser.name} confirmed renting. Please finalize the rent agreement for "${property.title}".`,
        newApplication.id
    );
    
    alert(`Your application for "${property.title}" has been submitted. The owner will review it shortly.`);
    setCurrentView('dashboard');
    setDashboardView('applications');
  };
  
    const handleRefundViewingAdvance = useCallback((viewingId: string, reason: 'owner_declined' | 'tenant_rejected') => {
        const viewing = viewings.find(v => v.id === viewingId);
        if (!viewing?.paymentId) return;

        const paymentToRefund = payments.find(p => p.id === viewing.paymentId);
        if (!paymentToRefund || paymentToRefund.status === 'Refunded') return;

        setPayments(prev => prev.map(p => p.id === viewing.paymentId ? { ...p, status: 'Refunded' } : p));
        
        const property = properties.find(p => p.id === viewing.propertyId);

        let message = '';
        if (reason === 'owner_declined') {
            message = `Your viewing for "${property?.title}" was declined. Your advance of ₹${viewing.advanceAmount} will be refunded.`;
        } else { // tenant_rejected
            message = `Your refund of ₹${viewing.advanceAmount} for the viewing advance on "${property?.title}" has been initiated.`;
        }

        addNotification(viewing.tenantId, NotificationType.REFUND_INITIATED, message, viewing.id);

        if (reason === 'tenant_rejected') {
            const tenant = users.find(u => u.id === viewing.tenantId);
            addNotification(viewing.ownerId, NotificationType.VIEWING_STATUS_UPDATE, `${tenant?.name || 'A tenant'} is not interested in "${property?.title}" after viewing.`, viewing.id);
        }
    }, [viewings, payments, properties, users, addNotification]);

    const handleUpdateViewingStatus = (viewingId: string, status: ViewingStatus) => {
        let tenantId = '';
        let propertyTitle = '';
        setViewings(prev => prev.map(v => {
            if (v.id === viewingId) {
                tenantId = v.tenantId;
                propertyTitle = properties.find(p => p.id === v.propertyId)?.title || 'your property';
                return { ...v, status };
            }
            return v;
        }));

        let message = '';
        if (status === ViewingStatus.ACCEPTED) message = `Your viewing for "${propertyTitle}" has been approved by the owner.`;
        if (status === ViewingStatus.DECLINED) {
            handleRefundViewingAdvance(viewingId, 'owner_declined');
            return; // Exit early as refund function handles notification
        }
        if (status === ViewingStatus.COMPLETED) message = `Your viewing for "${propertyTitle}" has been marked as completed.`;

        if (message && tenantId) {
            addNotification(tenantId, NotificationType.VIEWING_STATUS_UPDATE, message, viewingId);
        }
    };
    
    const handleCancelViewing = (viewingId: string) => {
        handleUpdateViewingStatus(viewingId, ViewingStatus.CANCELLED);
    }
    
    const handleTenantRejection = (viewingId: string) => {
        setViewings(prev => prev.map(v => v.id === viewingId ? { ...v, status: ViewingStatus.TENANT_REJECTED } : v));
        handleRefundViewingAdvance(viewingId, 'tenant_rejected');
    };

    const handleUpdateApplicationStatus = (applicationId: string, status: ApplicationStatus) => {
        setApplications(prev => prev.map(app => app.id === applicationId ? { ...app, status } : app));
    };

    const handleInitiateFinalizeAgreement = (application: Application, property: Property) => {
        setFinalizingAgreementDetails({ application, property });
    };

    const handleFinalizeAgreement = (applicationId: string, finalDetails: any) => {
        const newAgreement: Agreement = {
            id: `agree-${applicationId}`,
            propertyId: finalDetails.propertyId,
            tenantId: finalDetails.tenantId,
            ownerId: finalDetails.ownerId,
            rentAmount: finalDetails.finalRentAmount,
            depositAmount: finalDetails.finalDepositAmount,
            startDate: finalDetails.moveInDate,
            endDate: new Date(new Date(finalDetails.moveInDate).setMonth(new Date(finalDetails.moveInDate).getMonth() + 11)).toISOString(), // Default 11 months for now
            signedByTenant: false,
            signedByOwner: false,
        };
        setAgreements(prev => [...prev, newAgreement]);

        setApplications(prev => prev.map(app => {
            if (app.id === applicationId) {
                return {
                    ...app,
                    status: ApplicationStatus.AGREEMENT_SENT,
                    ...finalDetails,
                };
            }
            return app;
        }));

        addNotification(finalDetails.tenantId, NotificationType.AGREEMENT_ACTION_REQUIRED, `Your rental agreement for "${finalDetails.propertyTitle}" is ready to be signed.`, applicationId);
        setFinalizingAgreementDetails(null);
    };

    const handleViewAgreementDetails = (agreement: Agreement, property: Property) => {
        setViewingAgreementDetails({ agreement, property });
    };

    const handleSignAgreement = (agreement: Agreement, property: Property) => {
        setSigningAgreementDetails({ agreement, property });
    };

    const handleInitiateSign = (agreementId: string) => {
        const generatedOtp = '123456'; // For demo purposes, use a fixed OTP
        console.log(`OTP for ${agreementId}: ${generatedOtp}`);
        setOtpVerificationDetails({ agreementId, generatedOtp, error: null });
    };

    const handleVerifyOtpAndSign = (otp: string) => {
        if (!otpVerificationDetails) return;
        
        if (otp.trim() === otpVerificationDetails.generatedOtp) {
            setAgreements(prev => prev.map(a => {
                if (a.id === otpVerificationDetails.agreementId) {
                    const isRenter = currentUser?.role === UserRole.RENTER;
                    const updatedAgreement = {
                        ...a,
                        signedByTenant: isRenter ? true : a.signedByTenant,
                        signedByOwner: !isRenter ? true : a.signedByOwner,
                    };

                    const application = applications.find(app => `agree-${app.id}` === a.id);
                    if (application) {
                        if (updatedAgreement.signedByTenant && updatedAgreement.signedByOwner) {
                            handleUpdateApplicationStatus(application.id, ApplicationStatus.AGREEMENT_SIGNED);
                            // Create new application for deposit
                            const depositApp: Application = {
                                ...application,
                                id: `deposit-${application.id}`,
                                status: ApplicationStatus.DEPOSIT_DUE,
                                amount: updatedAgreement.depositAmount + updatedAgreement.rentAmount, // Deposit + First Month's Rent
                                dueDate: new Date().toISOString(),
                            };
                            setApplications(prevApps => [...prevApps, depositApp]);
                            addNotification(application.renterId, NotificationType.DEPOSIT_PAYMENT_DUE, `Your security deposit and first month's rent for "${properties.find(p=>p.id===application.propertyId)?.title}" is now due.`, depositApp.id);
                        } else if (updatedAgreement.signedByTenant) {
                             addNotification(a.ownerId, NotificationType.AGREEMENT_ACTION_REQUIRED, `The tenant has signed the agreement for "${properties.find(p=>p.id===a.propertyId)?.title}". Please review and sign.`, application.id);
                        }
                    }
                    
                    return updatedAgreement;
                }
                return a;
            }));

            setOtpVerificationDetails(null);
            setSigningAgreementDetails(null);
        } else {
            setOtpVerificationDetails(prev => ({ ...prev!, error: "Invalid OTP. Please try again." }));
        }
    };
    
    const handleConfirmDepositPayment = (applicationId: string) => {
        let application: Application | undefined;
        setApplications(prev => prev.map(app => {
            if (app.id === applicationId) {
                application = { ...app, status: ApplicationStatus.MOVE_IN_READY };
                return application;
            }
            return app;
        }));
    
        if (application) {
            const property = properties.find(p => p.id === application.propertyId);
            addNotification(
                application.renterId,
                NotificationType.KEYS_HANDOVER_READY,
                `Payment confirmed for "${property?.title}"! You can now coordinate with the owner for key handover.`,
                applicationId
            );
            addActivityLog(
                ActivityType.APPROVED_APPLICATION,
                `Confirmed deposit payment for application on "${property?.title}".`
            );
        }
    };
    
    const handleConfirmKeyHandover = (applicationId: string) => {
        handleUpdateApplicationStatus(applicationId, ApplicationStatus.COMPLETED);
    };

    const handleInitiatePaymentFlow = (application: Application, property: Property) => {
        if (application.status === ApplicationStatus.RENT_DUE || application.status === ApplicationStatus.DEPOSIT_DUE) {
            setPayingRentDetails({ application, property });
        }
    };

    const handlePaymentSuccess = () => {
        if (payingRentDetails) {
            const { application, property } = payingRentDetails;
            const isDeposit = application.status === ApplicationStatus.DEPOSIT_DUE;
            
            setApplications(prev => prev.map(app => app.id === application.id ? { ...app, status: isDeposit ? ApplicationStatus.DEPOSIT_PAID : ApplicationStatus.RENT_PAID } : app));
            
            const newPayment: Payment = {
                id: `pay-${Date.now()}`,
                userId: currentUser!.id,
                propertyId: property.id,
                type: isDeposit ? PaymentType.DEPOSIT : PaymentType.RENT,
                amount: application.amount!,
                paymentDate: new Date().toISOString(),
                status: 'Paid',
            };
            setPayments(prev => [newPayment, ...prev]);

            setRecentlyPaidApplicationId(application.id);

            addActivityLog(isDeposit ? ActivityType.PAID_BILL : ActivityType.PAID_RENT, `Paid ${isDeposit ? "deposit and first month's rent" : 'rent'} of ₹${application.amount!.toLocaleString()} for "${property.title}".`);
            
            if (isDeposit) {
                addNotification(property.ownerId, NotificationType.NEW_PAYMENT_RECEIVED, `${currentUser!.name} has paid the deposit for "${property.title}". Please verify and confirm payment.`, application.id);
                addNotification(currentUser!.id, NotificationType.APPLICATION_STATUS_UPDATE, `Payment successful! Waiting for the owner to confirm receipt for "${property.title}".`, application.id);
            } else {
                 addNotification(property.ownerId, NotificationType.NEW_PAYMENT_RECEIVED, `${currentUser!.name} paid rent for "${property.title}".`, application.id);
            }
            
            setPayingRentDetails(null);
        }
        if(payingBillDetails){
            const {bill, property} = payingBillDetails;
            setBills(prev => prev.map(b => b.id === bill.id ? {...b, isPaid: true, paidOn: new Date().toISOString()} : b));
            const newPayment: Payment = {
                id: `pay-${Date.now()}`,
                userId: currentUser!.id,
                propertyId: property.id,
                type: PaymentType.BILL,
                amount: bill.amount!,
                paymentDate: new Date().toISOString(),
                status: 'Paid',
            };
            setPayments(prev => [newPayment, ...prev]);
            
            setRecentlyPaidApplicationId(`bill-${bill.id}`);

            addActivityLog(ActivityType.PAID_BILL, `Paid ${bill.type.toLowerCase()} bill of ₹${bill.amount.toLocaleString()} for "${property.title}".`);
            addNotification(property.ownerId, NotificationType.NEW_PAYMENT_RECEIVED, `${currentUser!.name} paid a bill for "${property.title}".`, bill.id);
            setPayingBillDetails(null);
        }
    };
    
    const handlePayBill = (billId: string) => {
        const bill = bills.find(b => b.id === billId);
        if (bill) {
            const property = properties.find(p => p.id === bill.propertyId);
            if(property) setPayingBillDetails({ bill, property });
        }
    };
    
    const handleEditProperty = (property: Property) => {
        setEditingProperty(property);
    };

    const handleUpdateProperty = (updatedProperty: Property) => {
        setProperties(prev => prev.map(p => p.id === updatedProperty.id ? updatedProperty : p));
        setEditingProperty(null);
        setDashboardView('properties');
    };

    const handlePostPropertyClick = () => {
        setIsPostingProperty(true);
    };

    const handleCreateProperty = (newPropertyData: Omit<Property, 'id' | 'ownerId' | 'availability' | 'postedDate' | 'reviews' | 'images' | 'nearbyPlaces'>) => {
        if (!currentUser) return;
        const newProperty: Property = {
            ...newPropertyData,
            id: `prop-${Date.now()}`,
            ownerId: currentUser.id,
            availability: 'available',
            postedDate: new Date().toISOString(),
            images: [`https://picsum.photos/seed/new-${Date.now()}/800/600`],
            reviewIds: [],
            nearbyPlaces: [],
        };
        setProperties(prev => [newProperty, ...prev]);
        setIsPostingProperty(false);
        setDashboardView('properties');
    };
    
    const handleUpdateProfile = (updatedUser: User) => {
        setUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
        setCurrentUser(updatedUser);
        localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users.map(u => u.id === updatedUser.id ? updatedUser : u)));
    };
    
    const handleSubmitVerification = (formData: Record<string, any>) => {
        if (!currentUser) return;
        setVerifications(prev => prev.map(v => v.tenantId === currentUser.id ? { ...v, formData, status: VerificationStatus.PENDING, submittedAt: new Date().toISOString() } : v));
        setUsers(prev => prev.map(u => u.id === currentUser.id ? {...u, kycStatus: 'Pending'} : u));
        setCurrentUser(prev => prev ? {...prev, kycStatus: 'Pending'} : null);
    };

    const handleUpdateKycStatus = (userId: string, status: 'Verified' | 'Rejected') => {
      const userKycStatus = status;
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, kycStatus: userKycStatus } : u));
      
      const verificationStatus = status === 'Verified' ? VerificationStatus.VERIFIED : VerificationStatus.REJECTED;
      setVerifications(prev => prev.map(v => v.tenantId === userId ? { ...v, status: verificationStatus } : v));
      
      addNotification(
          userId,
          NotificationType.APPLICATION_STATUS_UPDATE, // Re-using this type
          `Your KYC & Police Verification has been ${status.toLowerCase()}.`,
          userId // relatedId can be the user id itself
      );
    };

    const handleUpdateUserRole = (userId: string, role: UserRole) => {
        if (currentUser?.id === userId) {
            alert("For security reasons, you cannot change your own role.");
            return;
        }
        setUsers(prevUsers => {
            const updatedUsers = prevUsers.map(u => u.id === userId ? { ...u, role } : u);
            localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(updatedUsers));
            return updatedUsers;
        });
    };
    
    const handleAddMaintenanceRequest = (requestData: Omit<MaintenanceRequest, 'id' | 'createdAt' | 'status' | 'createdBy'>) => {
        if (!currentUser) return;
        const newRequest: MaintenanceRequest = {
            ...requestData,
            id: `mr-${Date.now()}`,
            createdBy: currentUser.id,
            status: MaintenanceStatus.OPEN,
            createdAt: new Date().toISOString(),
        };
        setMaintenanceRequests(prev => [newRequest, ...prev]);
        addNotification(requestData.assignedToId, NotificationType.NEW_MAINTENANCE_REQUEST, `You have a new maintenance request: "${requestData.title}".`, newRequest.id);
    };

    const handleUpdateMaintenanceStatus = (requestId: string, status: MaintenanceStatus) => {
        let request: MaintenanceRequest | undefined;
        setMaintenanceRequests(prev => prev.map(r => {
            if (r.id === requestId) {
                request = { ...r, status };
                return request;
            }
            return r;
        }));
        if(request){
            const otherUserId = currentUser?.id === request.assignedToId ? request.createdBy : request.assignedToId;
            addNotification(otherUserId, NotificationType.MAINTENANCE_STATUS_UPDATE, `Maintenance request "${request.title}" was updated to "${status}".`, requestId);
        }
    };
    
    const handleAddMaintenanceComment = (requestId: string, commentText: string) => {
        if (!currentUser || !commentText.trim()) return;
        let request: MaintenanceRequest | undefined;
        const newComment = {
            userId: currentUser.id,
            text: commentText.trim(),
            timestamp: new Date().toISOString(),
        };
        setMaintenanceRequests(prev => prev.map(r => {
            if (r.id === requestId) {
                request = { ...r, comments: [...(r.comments || []), newComment] };
                return request;
            }
            return r;
        }));
        if (request) {
            const otherUserId = currentUser.id === request.assignedToId ? request.createdBy : request.assignedToId;
            addNotification(otherUserId, NotificationType.MAINTENANCE_STATUS_UPDATE, `${currentUser.name} commented on "${request.title}".`, requestId);
        }
    };

    const handleGenerateBill = (billData: Omit<Bill, 'id' | 'isPaid'>) => {
        const newBill: Bill = {
            ...billData,
            id: `bill-${Date.now()}`,
            isPaid: false,
        };
        setBills(prev => [newBill, ...prev]);
        addNotification(billData.tenantId, NotificationType.NEW_BILL_GENERATED, `A new bill for ${billData.type.toLowerCase()} (₹${billData.amount}) has been generated.`, newBill.id);
    };

    const handleLeaveReview = useCallback((agreementId: string, reviewData: Omit<Review, 'id' | 'author' | 'role' | 'time' | 'userId'>) => {
        if (!currentUser) return;

        const agreement = agreements.find(a => a.id === agreementId);
        if (!agreement) return;

        const property = properties.find(p => p.id === agreement.propertyId);
        if (!property) return;
        
        const newReview: Review = {
            id: `review-${Date.now()}`,
            userId: currentUser.id,
            author: currentUser.name,
            role: 'Tenant',
            time: 'Just now',
            ...reviewData,
        };

        setReviews(prev => [newReview, ...prev]);
        
        setProperties(prev => prev.map(p =>
            p.id === property.id
                ? { ...p, reviewIds: [...(p.reviewIds || []), newReview.id] }
                : p
        ));
        
        setAgreements(prev => prev.map(a =>
            a.id === agreementId ? { ...a, reviewLeft: true } : a
        ));

        addActivityLog(ActivityType.LEFT_REVIEW, `left a review for "${property.title}".`);
        
        addNotification(
            property.ownerId,
            NotificationType.NEW_REVIEW_RECEIVED,
            `${currentUser.name} left a ${reviewData.rating}-star review for your property "${property.title}".`,
            property.id
        );
    }, [currentUser, agreements, properties, addActivityLog, addNotification]);


  const renterDashboardData = useMemo(() => {
    if (!currentUser || currentUser.role !== UserRole.RENTER) return null;
    return {
        agreements: agreements.filter(a => a.tenantId === currentUser.id).map(agreement => ({ agreement, property: properties.find(p => p.id === agreement.propertyId)! })).filter(item => item.property),
        viewings: viewings.filter(v => v.tenantId === currentUser.id).map(viewing => ({ viewing, property: properties.find(p => p.id === viewing.propertyId)! })).filter(item => item.property),
        applications: applications.filter(a => a.renterId === currentUser.id).map(application => ({ application, property: properties.find(p => p.id === application.propertyId)! })).filter(item => item.property),
        payments: payments.filter(p => p.userId === currentUser.id),
        bills: bills.filter(b => b.tenantId === currentUser.id),
        verification: verifications.find(v => v.tenantId === currentUser.id)!,
        maintenanceRequests: maintenanceRequests.filter(t => t.assignedToId === currentUser.id || t.createdBy === currentUser.id),
        savedProperties: properties.filter(p => savedProperties.includes(p.id)),
    };
  }, [currentUser, agreements, viewings, applications, payments, bills, verifications, properties, maintenanceRequests, savedProperties]);

  const ownerDashboardData = useMemo(() => {
      if (!currentUser || currentUser.role !== UserRole.OWNER) return null;
      const myPropertyIds = properties.filter(p => p.ownerId === currentUser.id).map(p => p.id);
      return {
          properties: properties.filter(p => myPropertyIds.includes(p.id)),
          viewings: viewings.filter(v => myPropertyIds.includes(v.propertyId)).map(viewing => ({ viewing, tenant: users.find(u => u.id === viewing.tenantId)!, property: properties.find(p => p.id === viewing.propertyId)! })).filter(item => item.tenant && item.property),
          applications: applications.filter(a => myPropertyIds.includes(a.propertyId)).map(application => ({ application, renter: users.find(u => u.id === application.renterId)!, property: properties.find(p => p.id === application.propertyId)! })).filter(item => item.renter && item.property),
          agreements: agreements.filter(a => myPropertyIds.includes(a.propertyId)).map(agreement => ({ agreement, property: properties.find(p => p.id === agreement.propertyId)! })).filter(item => item.property),
          paymentHistory: payments.filter(p => myPropertyIds.includes(p.propertyId)).map(payment => ({ payment, tenantName: users.find(u => u.id === payment.userId)?.name || 'Unknown', propertyTitle: properties.find(p => p.id === payment.propertyId)?.title || 'N/A' })),
          maintenanceRequests: maintenanceRequests.filter(t => myPropertyIds.includes(t.propertyId)),
          bills: bills.filter(b => myPropertyIds.includes(b.propertyId)),
          verifications: verifications,
      }
  }, [currentUser, properties, viewings, applications, agreements, payments, users, maintenanceRequests, bills, verifications]);

  const renderContent = () => {
    if (currentView === 'browsing') {
        return <PropertyList key={initialSearchTerm} properties={properties} users={users} onSelectProperty={handleSelectProperty} initialSearchTerm={initialSearchTerm} cityName={cityName} aiFilters={aiFilters} onAiFiltersApplied={() => setAiFilters(null)} currentUser={currentUser} savedProperties={savedProperties} onToggleSaveProperty={handleToggleSaveProperty} />;
    }
    if (currentView === 'propertyDetails') {
        if (selectedProperty) {
            return <PropertyDetails properties={properties} users={users} property={selectedProperty} owner={users.find(u => u.id === selectedProperty.ownerId)} onBack={handleGoBackToList} onScheduleViewing={handleScheduleViewingRequest} onBookNow={handleDirectBookingRequest} onNavigateToHome={resetToHome} onNavigateToBrowsing={handleGoBackToList} currentUser={currentUser} savedProperties={savedProperties} onToggleSaveProperty={handleToggleSaveProperty} onSelectProperty={handleSelectProperty} reviews={reviews}/>;
        }
        return null;
    }
    
    if (!currentUser) {
      if (currentView === 'login') {
        return <LoginPage users={users} onLogin={handleLogin} onBackToHome={resetToHome} onSignup={handleSignup} />;
      }
      return <HomePage properties={properties} onSearch={handleStartBrowsing} onSelectProperty={handleSelectProperty} cityName={cityName} onSmartSearchClick={() => setIsSmartSearchOpen(true)} onLoginClick={() => setCurrentView('login')} />;
    }
    
    if (editingProperty) {
        return <EditPropertyForm property={editingProperty} onSubmit={handleUpdateProperty} onCancel={() => setEditingProperty(null)} onNavigateToHome={resetToHome} onNavigateToDashboard={() => { setEditingProperty(null); setCurrentView('dashboard'); }}/>
    }

    if (isPostingProperty) {
        return <PostPropertyForm onSubmit={handleCreateProperty} onCancel={() => setIsPostingProperty(false)} />
    }
    
    if (dashboardView === 'profile') {
        return <ProfilePage user={currentUser} onUpdateProfile={handleUpdateProfile} onBack={() => setDashboardView('overview')} />
    }
    
    if (dashboardView === 'activity') {
        return <ActivityLogPage activities={activityLogs.filter(log => log.userId === currentUser.id)} onBack={() => setDashboardView('overview')} />
    }

    switch (currentView) {
       case 'booking':
        if (selectedProperty) {
          return <ApplicationForm property={selectedProperty} currentUser={currentUser} onSubmit={handleApplicationSubmit} onBack={() => setCurrentView('propertyDetails')} bookingType={bookingType} />;
        }
        return null;
      case 'dashboard':
        if (currentUser.role === UserRole.RENTER && renterDashboardData) {
          return <RenterDashboard 
                    user={currentUser} 
                    {...renterDashboardData} 
                    properties={properties}
                    users={users}
                    activeTab={dashboardView} 
                    onTabChange={setDashboardView} 
                    onSubmitVerification={handleSubmitVerification}
                    onPayBill={handlePayBill}
                    onRaiseDispute={(id, type) => alert(`Dispute raised for ${type} ID: ${id}`)}
                    onViewAgreementDetails={handleViewAgreementDetails}
                    onSignAgreement={handleSignAgreement}
                    onInitiatePaymentFlow={handleInitiatePaymentFlow}
                    onConfirmRent={handleConfirmRent}
                    onCancelViewing={handleCancelViewing}
                    onTenantReject={handleTenantRejection}
                    onAddMaintenanceRequest={handleAddMaintenanceRequest}
                    onUpdateMaintenanceStatus={handleUpdateMaintenanceStatus}
                    onAddMaintenanceComment={handleAddMaintenanceComment}
                    onToggleSaveProperty={handleToggleSaveProperty}
                    onSelectProperty={handleSelectProperty}
                    onBrowseClick={() => setCurrentView('browsing')}
                    recentlyPaidApplicationId={recentlyPaidApplicationId}
                    onClearRecentlyPaid={() => setRecentlyPaidApplicationId(null)}
                    onLeaveReview={handleLeaveReview}
                />;
        }
        if (currentUser.role === UserRole.OWNER && ownerDashboardData) {
          return <OwnerDashboard 
            user={currentUser} 
            {...ownerDashboardData} 
            users={users}
            activeTab={dashboardView} 
            onTabChange={setDashboardView} 
            onUpdateViewingStatus={handleUpdateViewingStatus}
            onUpdateApplicationStatus={handleUpdateApplicationStatus}
            onEditProperty={handleEditProperty}
            onPostPropertyClick={handlePostPropertyClick}
            onSignAgreement={handleSignAgreement}
            onViewAgreementDetails={handleViewAgreementDetails}
            onPayPlatformFee={() => alert('Redirect to platform fee payment')}
            onAcknowledgeOfflinePayment={() => alert('Offline payment acknowledged')}
            onMarkAsRented={(propId) => setProperties(props => props.map(p => p.id === propId ? {...p, availability: 'rented'} : p))}
            onInitiateFinalizeAgreement={handleInitiateFinalizeAgreement}
            onConfirmDepositPayment={handleConfirmDepositPayment}
            onConfirmKeyHandover={handleConfirmKeyHandover}
            onAddMaintenanceRequest={handleAddMaintenanceRequest}
            onUpdateMaintenanceStatus={handleUpdateMaintenanceStatus}
            onAddMaintenanceComment={handleAddMaintenanceComment}
            onGenerateBill={handleGenerateBill}
            onUpdateKycStatus={handleUpdateKycStatus}
          />;
        }
        if (currentUser.role === UserRole.SUPER_ADMIN) {
          return <SuperAdminDashboard 
                    properties={properties} 
                    applications={applications} 
                    users={users} 
                    disputes={disputes} 
                    onUpdateKycStatus={handleUpdateKycStatus} 
                    activityLogs={activityLogs} 
                    payments={payments}
                    viewings={viewings}
                    onUpdateViewingStatus={handleUpdateViewingStatus}
                    onRefundViewingAdvance={handleRefundViewingAdvance}
                    currentUser={currentUser}
                    onUpdateUserRole={handleUpdateUserRole}
                 />;
        }
        return null;
      case 'bookingConfirmation':
          if (lastBookingDetails) {
              return <BookingConfirmation bookingDetails={lastBookingDetails} onGoToDashboard={() => setCurrentView('dashboard')} onBrowseMore={() => { setLastBookingDetails(null); setCurrentView('browsing'); }} />
          }
          return null;
      default:
        return <HomePage properties={properties} onSearch={handleStartBrowsing} onSelectProperty={handleSelectProperty} cityName={cityName} onSmartSearchClick={() => setIsSmartSearchOpen(true)} onLoginClick={() => setCurrentView('login')} />;
    }
  };

  const dashboardSubViews = ['dashboard', 'profile', 'activity', 'myRentals', 'bills', 'history', 'properties', 'paymentHistory', 'maintenance', 'saved', 'viewings', 'verification', 'overview', 'actions', 'pastRentals', 'onboarding', 'activeRentals'];
  
  const isHomePage = !currentUser && currentView === 'home';
  // Views that will control their own layout (full-width, full-height, etc.)
  const fullLayoutViews = ['home', 'browsing', 'login', 'dashboard'];
  const requiresFullLayout = fullLayoutViews.includes(currentView);

  return (
    <div className="flex flex-col min-h-screen bg-neutral-50">
      <Header 
        currentUser={currentUser} 
        onLogout={handleLogout} 
        onLoginClick={() => setCurrentView('login')} 
        onSearch={handleStartBrowsing} 
        onHomeClick={resetToHome}
        onNavigate={(view) => {
            if (dashboardSubViews.includes(view)) {
                setCurrentView('dashboard');
                setDashboardView(view);
            }
        }}
        onPostPropertyClick={handlePostPropertyClick}
        notifications={notifications.filter(n => n.userId === currentUser?.id)}
        onMarkAllAsRead={() => setNotifications(prev => prev.map(n => n.userId === currentUser?.id ? {...n, isRead: true} : n))}
        onBrowseClick={() => setCurrentView('browsing')}
        searchSuggestions={[cityName, ...odishaDistricts]}
      />
      <main className="flex-grow">
        {requiresFullLayout ? (
          renderContent()
        ) : (
          <div className="container mx-auto px-4 md:px-8 py-8">
            {renderContent()}
          </div>
        )}
      </main>
      {isHomePage && <Footer onLocationSearch={handleStartBrowsing} nearbyLocations={nearbyLocations} />}

      {/* MODALS */}
      {viewingAgreementDetails && <AgreementView agreement={viewingAgreementDetails.agreement} property={viewingAgreementDetails.property} renter={users.find(u => u.id === viewingAgreementDetails.agreement.tenantId)!} owner={users.find(u => u.id === viewingAgreementDetails.agreement.ownerId)!} isReadOnly={true} onClose={() => setViewingAgreementDetails(null)} />}
      {payingRentDetails && currentUser && <PaymentPortal 
        currentUser={currentUser}
        paymentType={payingRentDetails.application.status === ApplicationStatus.DEPOSIT_DUE ? PaymentType.DEPOSIT : PaymentType.RENT} 
        paymentDetails={{ 
            title: payingRentDetails.application.status === ApplicationStatus.DEPOSIT_DUE ? "Deposit & First Month's Rent" : "Monthly Rent Payment", 
            amount: payingRentDetails.application.amount!, 
            dueDate: payingRentDetails.application.dueDate, 
            propertyTitle: payingRentDetails.property.title,
            rentAmount: payingRentDetails.application.status === ApplicationStatus.DEPOSIT_DUE ? payingRentDetails.application.finalRentAmount : payingRentDetails.application.amount,
            depositAmount: payingRentDetails.application.status === ApplicationStatus.DEPOSIT_DUE ? payingRentDetails.application.finalDepositAmount : undefined
        }} 
        onPaymentSuccess={handlePaymentSuccess} 
        onClose={() => setPayingRentDetails(null)} 
      />}
      {payingBillDetails && currentUser && <PaymentPortal currentUser={currentUser} paymentType={PaymentType.BILL} paymentDetails={{ title: `${payingBillDetails.bill.type} Bill`, amount: payingBillDetails.bill.amount, dueDate: payingBillDetails.bill.dueDate, propertyTitle: payingBillDetails.property.title }} onPaymentSuccess={handlePaymentSuccess} onClose={() => setPayingBillDetails(null)} />}
      {payingViewingAdvanceDetails && currentUser && <PaymentPortal currentUser={currentUser} paymentType={PaymentType.VIEWING_ADVANCE} paymentDetails={{ title: "Refundable Viewing Advance", amount: payingViewingAdvanceDetails.property.viewingAdvance, propertyTitle: payingViewingAdvanceDetails.property.title }} onPaymentSuccess={handleViewingPaymentSuccess} onClose={() => setPayingViewingAdvanceDetails(null)} />}
      {isSmartSearchOpen && <SmartSearchModal isOpen={isSmartSearchOpen} isLoading={isSmartSearchLoading} onClose={() => setIsSmartSearchOpen(false)} onSearch={() => {}} />}
      {signingAgreementDetails && currentUser && <AgreementSigningPage 
          agreement={signingAgreementDetails.agreement} 
          property={signingAgreementDetails.property} 
          currentUser={currentUser} 
          renter={users.find(u => u.id === signingAgreementDetails.agreement.tenantId)!}
          owner={users.find(u => u.id === signingAgreementDetails.agreement.ownerId)!}
          onInitiateSign={handleInitiateSign} 
          onClose={() => setSigningAgreementDetails(null)} 
      />}
      {otpVerificationDetails && <OtpVerificationModal isOpen={!!otpVerificationDetails} onClose={() => setOtpVerificationDetails(null)} onVerify={handleVerifyOtpAndSign} error={otpVerificationDetails.error} />}
      {finalizingAgreementDetails && <FinalizeAgreementForm details={finalizingAgreementDetails} onClose={() => setFinalizingAgreementDetails(null)} onSubmit={(appId, details) => handleFinalizeAgreement(appId, { ...details, propertyId: finalizingAgreementDetails.property.id, tenantId: finalizingAgreementDetails.application.renterId, ownerId: finalizingAgreementDetails.property.ownerId, propertyTitle: finalizingAgreementDetails.property.title })} />}
    </div>
  );
};

export default App;