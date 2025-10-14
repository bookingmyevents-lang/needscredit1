import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
import type { Property, Application, Payment, User, Viewing, Agreement, Verification, Bill, Dispute, ActivityLog, Notification, AiFilters } from './types';
import { UserRole, ApplicationStatus, FurnishingStatus, Facing, ViewingStatus, VerificationStatus, BillType, DisputeStatus, ActivityType, NotificationType, PaymentType } from './types';
import { mockProperties, mockUsers, mockViewings, mockAgreements, mockVerifications, mockBills, mockDisputes, mockPayments, mockApplications, mockActivityLogs, mockNotifications } from './mockData';
import Header from './components/Header';
import PropertyList from './components/PropertyList';
import PropertyDetails from './components/PropertyDetails';
import OwnerDashboard from './components/OwnerDashboard';
import AgreementView from './components/AgreementView';
import PaymentPortal from './components/PaymentPortal';
import TenantDashboard from './components/RenterDashboard';
import LoginPage from './components/LoginPage';
import SuperAdminDashboard from './components/SuperAdminDashboard';
import HomePage from './components/HomePage';
import EditPropertyForm from './components/EditPropertyForm';
import PostPropertyForm from './components/PostPropertyForm';
import Footer from './components/Footer';
import BookViewingForm from './components/ApplicationForm';
import ProfilePage from './components/ProfilePage';
import ActivityLogPage from './components/ActivityLogPage';
import SmartSearchModal from './components/SmartSearchModal';
import AgreementSigningPage from './components/AgreementSigningPage';
import OtpVerificationModal from './components/OtpVerificationModal';
import BookingConfirmation from './components/BookingConfirmation';
import FinalizeAgreementForm from './components/FinalizeAgreementForm';
import * as Icons from './components/Icons';

const USERS_STORAGE_KEY = 'rent-ease-users';
const PLATFORM_FEE_AMOUNT = 500;
const SERVICE_FEE_PERCENTAGE = 0.025; // 2.5%

const loadInitialUsers = (): User[] => {
    try {
        const storedUsers = localStorage.getItem(USERS_STORAGE_KEY);
        if (storedUsers) {
            const parsedUsers = JSON.parse(storedUsers);
            if (Array.isArray(parsedUsers) && parsedUsers.length > 0) {
                return parsedUsers;
            }
        }
    } catch (error) {
        console.error("Failed to process users from localStorage", error);
    }
    // Fallback for first load or if localStorage is empty/corrupted
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(mockUsers));
    return mockUsers;
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
  const [notifications, setNotifications] = useState<Notification[]>(mockNotifications);

  // View state
  const [currentView, setCurrentView] = useState('home'); // home, login, browsing, propertyDetails, booking, dashboard, etc.
  const [loggedInView, setLoggedInView] = useState('dashboard'); // 'dashboard', 'profile', 'activity'
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [editingProperty, setEditingProperty] = useState<Property | null>(null);
  const [isPostingProperty, setIsPostingProperty] = useState(false);
  const [initialSearchTerm, setInitialSearchTerm] = useState<string>('');
  const [cityName, setCityName] = useState<string>('Your City');
  const [nearbyLocations, setNearbyLocations] = useState<string[]>([]);
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
  const [postLoginAction, setPostLoginAction] = useState<{ view: string; propertyId: string } | null>(null);
  const [payingViewingAdvanceDetails, setPayingViewingAdvanceDetails] = useState<{ property: Property; proposedDateTime: string } | null>(null);
  const [pendingViewingDetails, setPendingViewingDetails] = useState<any>(null);
  const [finalizingAgreementDetails, setFinalizingAgreementDetails] = useState<{ application: Application; property: Property } | null>(null);


  const generateRentCycleEvents = useCallback(() => {
    const today = new Date();
    const allNewNotifications: Notification[] = [];
    const allNewApplications: Application[] = [];
    const allNewActivityLogs: ActivityLog[] = [];

    const activeAgreements = agreements.filter(a => a.signedByOwner && a.signedByTenant);

    // --- 1. Generate rent due soon notifications (PRE-DUE DATE REMINDER) ---
    const notificationWindowDays = 5;
    activeAgreements.forEach(agreement => {
        const startDate = new Date(agreement.startDate);
        if (startDate > today) return;

        const dueDay = startDate.getDate();
        const currentMonthDueDate = new Date(today.getFullYear(), today.getMonth(), dueDay);

        // Use setHours to compare dates only, ignoring time.
        const todayDateOnly = new Date(new Date().setHours(0,0,0,0));
        const dueDateOnly = new Date(new Date(currentMonthDueDate).setHours(0,0,0,0));
        
        if (todayDateOnly > dueDateOnly) return; // If due date for this month has already passed, the other logic will handle/has handled it.

        const timeDiff = dueDateOnly.getTime() - todayDateOnly.getTime();
        const dayDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));

        if (dayDiff >= 0 && dayDiff <= notificationWindowDays) {
            const existingNotification = [...notifications, ...allNewNotifications].find(n =>
                n.userId === agreement.tenantId &&
                n.relatedId === agreement.propertyId &&
                n.type === NotificationType.RENT_DUE_SOON &&
                new Date(n.timestamp).getMonth() === today.getMonth() &&
                new Date(n.timestamp).getFullYear() === today.getFullYear()
            );

            if (!existingNotification) {
                const tenant = users.find(u => u.id === agreement.tenantId);
                const property = properties.find(p => p.id === agreement.propertyId);
                if (!tenant || !property) return;
                
                const daysRemaining = dayDiff === 0 ? 'today' : dayDiff === 1 ? 'tomorrow' : `in ${dayDiff} days`;

                const newNotification: Notification = {
                    id: `notif-rent-soon-${agreement.id}-${today.getFullYear()}-${today.getMonth()}`,
                    userId: tenant.id,
                    type: NotificationType.RENT_DUE_SOON,
                    message: `Reminder: Your rent of ₹${agreement.rentAmount.toLocaleString()} for "${property.title}" is due ${daysRemaining}.`,
                    timestamp: new Date().toISOString(),
                    isRead: false,
                    relatedId: property.id,
                };
                allNewNotifications.push(newNotification);
            }
        }
    });

    // --- 2. Generate monthly rent dues on load (ON/AFTER DUE DATE) ---
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
                type: ActivityType.PAID_BILL,
                message: `Rent bill of ₹${agreement.rentAmount.toLocaleString()} generated for "${property.title}".`,
                timestamp: new Date().toISOString(),
            };
            allNewActivityLogs.push(newLog);

            // Also check if a RENT_DUE_SOON notification for this due date already exists to avoid duplicates.
            const existingNotification = [...notifications, ...allNewNotifications].find(n =>
                n.userId === agreement.tenantId &&
                n.relatedId === agreement.propertyId &&
                n.type === NotificationType.RENT_DUE_SOON &&
                new Date(n.timestamp).getMonth() === today.getMonth() &&
                new Date(n.timestamp).getFullYear() === today.getFullYear()
            );

            if (!existingNotification) {
                 const newNotification: Notification = {
                    id: `notif-rent-due-${newRentApplication.id}`,
                    userId: tenant.id,
                    type: NotificationType.RENT_DUE_SOON,
                    message: `Your rent of ₹${agreement.rentAmount.toLocaleString()} for "${property.title}" is now due.`,
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
  }, [agreements, applications, notifications, users, properties, setApplications, setActivityLogs, setNotifications]);


  useEffect(() => {
    // Initial check on mount
    generateRentCycleEvents();
    
    // Set up a periodic check (e.g., every hour) to ensure reminders are timely
    const intervalId = setInterval(generateRentCycleEvents, 60 * 60 * 1000);
    
    // --- Fallback location logic ---
    const setFallbackLocationData = () => {
      console.warn("Using fallback location data to avoid API rate limits during development.");
      setCityName("Bhubaneswar");
      setNearbyLocations(["Cuttack", "Puri", "Patia", "Saheed Nagar", "Chandrasekharpur"]);
    };
    
    setFallbackLocationData();
    
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
      setCurrentView('home');
      setSelectedProperty(null);
      setEditingProperty(null);
      setIsPostingProperty(false);
      setInitialSearchTerm('');
      setLoggedInView('dashboard');
      if (currentUser) {
          setCurrentView('dashboard');
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
                setCurrentView(postLoginAction.view);
                setPostLoginAction(null); // Reset after use
                return; // Prevent redirecting to dashboard
            }
        }

        setLoggedInView('dashboard');
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
    };
    
    // Update users list using a functional update for safety
    setUsers(currentUsers => {
      const updatedUsers = [...currentUsers, newUser];
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(updatedUsers));
      return updatedUsers;
    });

    // Auto-login the new user
    setCurrentUser(newUser);
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

  const handleScheduleViewing = (property: Property, details: { proposedDateTime: string; verificationData: any; }) => {
    if (!currentUser || currentUser.role !== UserRole.RENTER) {
      alert("Please log in as a renter to schedule a viewing. You will be returned to this page after logging in.");
      setPostLoginAction({ view: 'booking', propertyId: property.id }); // Store intended action
      setCurrentView('login');
      return;
    }
    
    setPendingViewingDetails(details.verificationData);
    setPayingViewingAdvanceDetails({ property, proposedDateTime: details.proposedDateTime });
  };
  
  const handleViewingPaymentSuccess = () => {
    if (!payingViewingAdvanceDetails || !currentUser || !pendingViewingDetails) return;
    const { property, proposedDateTime } = payingViewingAdvanceDetails;

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
    };
    setViewings(prev => [newViewing, ...prev]);

    const newPayment: Payment = {
        id: `pay-${Date.now()}`,
        userId: currentUser.id,
        propertyId: property.id,
        type: PaymentType.VIEWING_ADVANCE,
        amount: property.viewingAdvance,
        paymentDate: new Date().toISOString(),
        status: 'Paid',
    };
    setPayments(prev => [newPayment, ...prev]);

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
    
    alert('Your interest has been confirmed! The owner will now prepare the rental agreement. You can track progress in your dashboard.');
    setCurrentView('dashboard');
  };
  
  const handleCancelViewing = (viewingId: string) => {
    const viewing = viewings.find(v => v.id === viewingId);
    if (!viewing) return;

    setViewings(prev => prev.map(v => v.id === viewingId ? { ...v, status: ViewingStatus.CANCELLED } : v));
    
    // Refund logic
    const advancePayment = payments.find(p => 
        p.userId === viewing.tenantId && 
        p.propertyId === viewing.propertyId && 
        p.type === PaymentType.VIEWING_ADVANCE &&
        p.status === 'Paid'
    );

    if (advancePayment) {
        setPayments(prev => prev.map(p => p.id === advancePayment.id ? { ...p, status: 'Refunded' } : p));
        const refundPayment: Payment = {
            id: `refund-${Date.now()}`,
            userId: viewing.tenantId,
            propertyId: viewing.propertyId,
            type: PaymentType.REFUND,
            amount: advancePayment.amount,
            paymentDate: new Date().toISOString(),
            status: 'Paid',
        };
        setPayments(prev => [...prev, refundPayment]);

        addNotification(viewing.tenantId, NotificationType.VIEWING_STATUS_UPDATE, `Your viewing advance of ₹${advancePayment.amount} has been refunded.`, viewing.id);
    }
    
    alert("You have marked the property as 'Not Interested'. The viewing is cancelled and your advance will be refunded.");
  };

  const handleUpdateViewingStatus = (viewingId: string, status: ViewingStatus) => {
    const viewing = viewings.find(v => v.id === viewingId);
    if (!viewing) return;
    
    setViewings(prev => prev.map(v => 
      v.id === viewingId 
        ? { ...v, status }
        : v
    ));

    const property = properties.find(p => p.id === viewing.propertyId);
    if (!property) return;

    if (status === ViewingStatus.DECLINED) {
        const advancePayment = payments.find(p => 
            p.userId === viewing.tenantId && 
            p.propertyId === viewing.propertyId && 
            p.type === PaymentType.VIEWING_ADVANCE &&
            p.status === 'Paid'
        );
        
        if (advancePayment) {
            setPayments(prev => prev.map(p => p.id === advancePayment.id ? { ...p, status: 'Refunded' } : p));
            
            const refundPayment: Payment = {
                id: `refund-${Date.now()}`,
                userId: viewing.tenantId,
                propertyId: viewing.propertyId,
                type: PaymentType.REFUND,
                amount: advancePayment.amount,
                paymentDate: new Date().toISOString(),
                status: 'Paid', // 'Paid' from platform's perspective to tenant
            };
            setPayments(prev => [...prev, refundPayment]);
            
            addNotification(
                viewing.tenantId,
                NotificationType.VIEWING_STATUS_UPDATE,
                `Your viewing request for "${property.title}" was not accepted. Your booking amount of ₹${advancePayment.amount} has been refunded.`,
                viewing.id
            );
            alert("Viewing declined. The advance payment has been refunded to the tenant.");
        } else {
             addNotification(
                viewing.tenantId,
                NotificationType.VIEWING_STATUS_UPDATE,
                `Your viewing for "${property.title}" has been rejected.`,
                viewing.id
            );
            alert("Viewing declined.");
        }
    } else if (status === ViewingStatus.ACCEPTED) {
        const scheduledAt = viewing.scheduledAt ? new Date(viewing.scheduledAt).toLocaleString() : 'the agreed time';
        addNotification(
           viewing.tenantId,
           NotificationType.VIEWING_STATUS_UPDATE,
           `Owner has approved your visit for "${property.title}" on ${scheduledAt}.`,
           viewing.id
       );
    } else {
         addNotification(
            viewing.tenantId,
            NotificationType.VIEWING_STATUS_UPDATE,
            `Your viewing for "${property.title}" has been updated to: ${status.toLowerCase()}.`,
            viewing.id
        );
    }
  };

  const handleInitiateFinalizeAgreement = (application: Application, property: Property) => {
    setFinalizingAgreementDetails({ application, property });
  };

  const handleFinalizeAgreement = (applicationId: string, finalDetails: any) => {
      const application = applications.find(a => a.id === applicationId);
      if (!application || !currentUser) return;

      const updatedApp = {
        ...application,
        ...finalDetails,
        status: ApplicationStatus.AGREEMENT_SENT,
      };
      setApplications(prev => prev.map(a => a.id === applicationId ? updatedApp : a));

      const newAgreement: Agreement = {
        id: `agree-${application.id}`,
        propertyId: application.propertyId,
        tenantId: application.renterId,
        ownerId: currentUser.id,
        rentAmount: finalDetails.finalRentAmount,
        depositAmount: finalDetails.finalDepositAmount,
        startDate: finalDetails.moveInDate,
        signedByTenant: false,
        signedByOwner: false,
      };
      setAgreements(prev => [...prev, newAgreement]);

      addActivityLog(ActivityType.AGREEMENT_ACTION_REQUIRED, `Finalized and sent rental agreement for "${finalizingAgreementDetails?.property.title}".`);
      addNotification(
        application.renterId,
        NotificationType.AGREEMENT_ACTION_REQUIRED,
        `The rental agreement for "${finalizingAgreementDetails?.property.title}" is ready for your review and signature.`,
        newAgreement.id
      );
      setFinalizingAgreementDetails(null);
      alert('Agreement finalized and sent to the tenant for signature.');
  };

  const handleUpdateApplicationStatus = (applicationId: string, status: ApplicationStatus) => {
    const application = applications.find(a => a.id === applicationId);
    if (!application) return;

    // This function now primarily handles REJECT. The "Approve" flow is replaced by Finalize Agreement.
    if (status === ApplicationStatus.REJECTED) {
       setApplications(prev => prev.map(app =>
        app.id === applicationId ? { ...app, status } : app
      ));

      const property = properties.find(p => p.id === application.propertyId);
      if (property) {
          addNotification(
              application.renterId,
              NotificationType.APPLICATION_STATUS_UPDATE,
              `Your application for "${property.title}" is now ${status}.`,
              application.id
          );
      }
      alert(`Application status updated to ${status}.`);
    } else {
        // Legacy "Approve" for applications not from viewings
        handlePayPlatformFee(applicationId);
    }
  };

  const handleSubmitVerification = (formData: Record<string, any>) => {
      if (!currentUser) return;
      
      // Update verifications state
      setVerifications(prev => prev.map(v => 
          v.tenantId === currentUser.id 
          ? { ...v, status: VerificationStatus.PENDING, formData, submittedAt: new Date().toISOString() }
          : v
      ));

      // Also update the user's KYC status to Pending
      const updatedUser = { ...currentUser, kycStatus: 'Pending' as 'Pending' };
      setCurrentUser(updatedUser);
      const updatedUsers = users.map(u => u.id === currentUser.id ? updatedUser : u);
      setUsers(updatedUsers);
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(updatedUsers));


      alert("Verification details submitted for review.");
  };

  const handlePayBill = (billId: string) => {
      const bill = bills.find(b => b.id === billId);
      if (!bill) return;
      const property = properties.find(p => p.id === bill.propertyId);
      if (!property) return;

      setPayingBillDetails({ bill, property });
  }
  
  const handleBillPaymentSuccess = () => {
    if (!payingBillDetails) return;
    const { bill } = payingBillDetails;
    
    setBills(prev => prev.map(b => 
      b.id === bill.id 
      ? { ...b, isPaid: true, paidOn: new Date().toISOString() }
      : b
    ));
    addActivityLog(ActivityType.PAID_BILL, `Paid ${bill.type.toLowerCase()} bill of ₹${bill.amount}.`);
    setPayingBillDetails(null);
    alert("Bill paid successfully!");
  }


  const handleRaiseDispute = (relatedId: string, type: 'Viewing' | 'Payment' | 'Property') => {
    if (!currentUser) return;
    const newDispute: Dispute = {
      id: `disp-${Date.now()}`,
      relatedId,
      type,
      status: DisputeStatus.OPEN,
      raisedBy: currentUser.id,
      messages: [{ userId: currentUser.id, text: `Dispute opened for ${type} ID: ${relatedId}.`, timestamp: new Date().toISOString() }]
    };
    setDisputes(prev => [newDispute, ...prev]);
    addActivityLog(ActivityType.RAISED_DISPUTE, `Raised a dispute regarding ${type} ID: ${relatedId}.`);
    alert(`Dispute raised successfully. An admin will review it shortly.`);
  };

  const handleUpdateKycStatus = (userId: string, kycStatus: 'Verified' | 'Rejected') => {
      const updatedUsers = users.map(u => 
          u.id === userId
          ? { ...u, kycStatus }
          : u
      );
      setUsers(updatedUsers);
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(updatedUsers));
      alert(`User KYC status updated to ${kycStatus}.`);
  };
  
  const handleSelectPropertyForEdit = (property: Property) => {
    setEditingProperty(property);
  };

  const handleUpdateProperty = (updatedProperty: Property) => {
    setProperties(prevProperties =>
      prevProperties.map(p => (p.id === updatedProperty.id ? updatedProperty : p))
    );
    setEditingProperty(null);
  };

  const handleCancelEdit = () => {
    setEditingProperty(null);
  };

  const handleShowPostPropertyForm = () => {
    setIsPostingProperty(true);
  };
  
  const handleCancelPostProperty = () => {
    setIsPostingProperty(false);
  };
  
  const handleAddProperty = (newPropertyData: Omit<Property, 'id' | 'images' | 'ownerId' | 'availability' | 'postedDate' | 'reviews' | 'nearbyPlaces'>) => {
    if (!currentUser) return;
    const newProperty: Property = {
      ...newPropertyData,
      id: `prop-${Date.now()}`,
      ownerId: currentUser.id,
      images: [`https://picsum.photos/seed/new${Date.now()}/800/600`],
      availability: 'available',
      postedDate: new Date().toISOString(),
      reviews: [],
      nearbyPlaces: [],
    };
    setProperties(prev => [newProperty, ...prev]);
    setIsPostingProperty(false);
  };

  const handleLocationSearch = (location: string) => {
    setInitialSearchTerm(location);
    setSelectedProperty(null);
    setCurrentView('browsing');
    window.scrollTo(0, 0);
  };

  const handleNavigateToProfile = () => {
    setLoggedInView('profile');
  };

  const handleNavigateToActivity = () => {
    setLoggedInView('activity');
  };
  
  const handleNavigateToDashboard = () => {
    setLoggedInView('dashboard');
    setCurrentView('dashboard');
    setSelectedProperty(null);
    setEditingProperty(null);
    setIsPostingProperty(false);
  };

  const handleNavigateToBrowsing = () => {
    setCurrentView('browsing');
    setSelectedProperty(null);
  };

  const handleUpdateProfile = (updatedUser: User) => {
    setCurrentUser(updatedUser);
    const updatedUsers = users.map(u => (u.id === updatedUser.id ? updatedUser : u));
    setUsers(updatedUsers);

    try {
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(updatedUsers));
    } catch (error) {
      console.error("Failed to save users to localStorage", error);
    }
    
    setLoggedInView('dashboard');
    alert("Profile updated successfully!");
  };

  const handleViewAgreementDetails = (agreement: Agreement, property: Property) => {
    setViewingAgreementDetails({ agreement, property });
  };

  const handleCloseAgreementDetails = () => {
    setViewingAgreementDetails(null);
  };
  
  const handleMarkAllNotificationsAsRead = () => {
    if (!currentUser) return;
    setNotifications(prev => 
        prev.map(n => 
            n.userId === currentUser.id ? { ...n, isRead: true } : n
        )
    );
  };

  const handleSmartSearch = async (query: string) => {
    setIsSmartSearchLoading(true);
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
        
        const responseSchema = {
            type: Type.OBJECT,
            properties: {
                location: { type: Type.STRING, description: 'The city, neighborhood, or specific area the user wants to live in.' },
                rent_max: { type: Type.NUMBER, description: 'The maximum monthly rent the user is willing to pay.' },
                bedrooms: { type: Type.ARRAY, items: { type: Type.NUMBER }, description: 'An array of acceptable bedroom counts (e.g., [2, 3] for 2 or 3 BHK).' },
                bathrooms: { type: Type.ARRAY, items: { type: Type.NUMBER }, description: 'An array of acceptable bathroom counts.' },
                furnishing: { type: Type.ARRAY, items: { type: Type.STRING, enum: ['Furnished', 'Semi-Furnished', 'Unfurnished'] }, description: 'The desired furnishing status.'},
                amenities: { type: Type.ARRAY, items: { type: Type.STRING }, description: 'A list of desired amenities like "gym", "pool", or "parking".' },
            },
        };

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `Parse the following user query to find a rental property. Extract the details into a JSON object matching the provided schema. Query: "${query}"`,
            config: {
                responseMimeType: "application/json",
                responseSchema: responseSchema,
            },
        });
        
        const resultJson = JSON.parse(response.text);
        
        const filters: AiFilters = {
            rent_max: resultJson.rent_max,
            bedrooms: resultJson.bedrooms,
            bathrooms: resultJson.bathrooms,
            furnishing: resultJson.furnishing,
            amenities: resultJson.amenities,
        };

        setAiFilters(filters);
        setInitialSearchTerm(resultJson.location || '');
        setCurrentView('browsing');

    } catch (error) {
        console.error("Smart Search API call failed:", error);
        alert("Sorry, the Smart Search failed. Please try a simpler search or use the manual filters.");
    } finally {
        setIsSmartSearchLoading(false);
        setIsSmartSearchOpen(false);
    }
  };
  
  const handleAiFiltersApplied = () => {
      setAiFilters(null);
  };

  const handleViewAgreementToSign = (agreement: Agreement, property: Property) => {
    setSigningAgreementDetails({ agreement, property });
  };
  
  const handleCloseSigningAgreement = () => {
    setSigningAgreementDetails(null);
  };

  const handleSignAgreement = (agreementId: string) => {
    if (!currentUser) return;

    const agreementToUpdate = agreements.find(a => a.id === agreementId);
    if (!agreementToUpdate) return;

    const updatedAgreement = { ...agreementToUpdate };
    if (currentUser.role === UserRole.RENTER) {
        updatedAgreement.signedByTenant = true;
    } else if (currentUser.role === UserRole.OWNER) {
        updatedAgreement.signedByOwner = true;
    }
    
    setAgreements(agreements.map(a => a.id === agreementId ? updatedAgreement : a));
    setSigningAgreementDetails(null); 

    const property = properties.find(p => p.id === updatedAgreement.propertyId);
    if (!property) return;

    if (updatedAgreement.signedByTenant && updatedAgreement.signedByOwner) {
        const application = applications.find(a => a.id === agreementId.replace('agree-', ''));
        if (application) {
            const totalDue = updatedAgreement.depositAmount + updatedAgreement.rentAmount;
            setApplications(prev => prev.map(a => a.id === application.id ? { ...a, status: ApplicationStatus.DEPOSIT_DUE, amount: totalDue } : a));
            addNotification(
                updatedAgreement.tenantId, 
                NotificationType.DEPOSIT_PAYMENT_DUE,
                `Agreement for "${property.title}" is signed! Please pay the security deposit and first month's rent of ₹${totalDue.toLocaleString()} to finalize the move-in.`,
                application.id
            );
        }
        
        addActivityLog(ActivityType.SIGNED_AGREEMENT, `Rental agreement for "${property.title}" is now active. Deposit payment is due.`);
        addNotification(
            updatedAgreement.ownerId, 
            NotificationType.APPLICATION_STATUS_UPDATE,
            `The agreement for "${property.title}" is fully signed. Waiting for tenant to pay deposit.`,
            updatedAgreement.id
        );
        alert("Agreement fully signed! The tenant has been notified to pay the security deposit and first rent.");
    } else {
        if (currentUser.role === UserRole.RENTER) {
            addNotification(
                updatedAgreement.ownerId, 
                NotificationType.AGREEMENT_ACTION_REQUIRED, 
                `${currentUser.name} has signed the agreement for "${property.title}". Your signature is now required.`, 
                updatedAgreement.id
            );
        }
        alert("Agreement signed. Waiting for the other party to sign.");
    }
  };

  const handleInitiateSignature = (agreementId: string) => {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    // In a real app, you would send this OTP via SMS/email.
    alert(`DEMO: Your OTP for signing is: ${otp}`);
    setOtpVerificationDetails({
        agreementId: agreementId,
        generatedOtp: otp,
        error: null,
    });
    // Close the agreement page modal, as the OTP modal will take over
    setSigningAgreementDetails(null);
  };

  const handleVerifyOtpAndSign = (enteredOtp: string) => {
    if (!otpVerificationDetails) return;
    if (enteredOtp === otpVerificationDetails.generatedOtp) {
        handleSignAgreement(otpVerificationDetails.agreementId);
        setOtpVerificationDetails(null); // Close OTP modal on success
    } else {
        setOtpVerificationDetails(prev => ({
            ...prev!,
            error: "Invalid OTP. Please try again.",
        }));
    }
  };

  const handleInitiatePaymentFlow = (application: Application, property: Property) => {
    setPaymentChoiceDetails({ application, property });
  };
  
  const handleSelectPaymentMethod = (method: 'online' | 'offline') => {
      if (!paymentChoiceDetails) return;
      if (method === 'online') {
          setPayingRentDetails(paymentChoiceDetails);
      } else {
          setOfflinePaymentDetails(paymentChoiceDetails);
      }
      setPaymentChoiceDetails(null);
  };
  
  const handleSubmitOfflinePayment = (upiId: string) => {
      if (!offlinePaymentDetails || !currentUser) return;
      const { application, property } = offlinePaymentDetails;

      setApplications(prev => prev.map(app => 
          app.id === application.id 
          ? { ...app, status: ApplicationStatus.OFFLINE_PAYMENT_PENDING, offlinePaymentDetails: { upiTransactionId: upiId, acknowledged: false } }
          : app
      ));

      addActivityLog(ActivityType.PAID_RENT, `Submitted offline rent payment for "${property.title}" with UPI ID: ${upiId}.`);
      addNotification(
          property.ownerId,
          NotificationType.OFFLINE_PAYMENT_SUBMITTED,
          `${currentUser.name} has submitted an offline payment for "${property.title}". Please acknowledge it.`,
          application.id
      );

      setOfflinePaymentDetails(null);
      alert("Offline payment details submitted. Please wait for the owner to acknowledge receipt.");
  };

  const handleAcknowledgeOfflinePayment = (applicationId: string) => {
      const application = applications.find(a => a.id === applicationId);
      const property = properties.find(p => p.id === application?.propertyId);
      if (!application || !property) return;
      
      setApplications(prev => prev.map(app => 
          app.id === applicationId 
          ? { ...app, status: ApplicationStatus.RENT_PAID, offlinePaymentDetails: { ...app.offlinePaymentDetails!, acknowledged: true } }
          : app
      ));
      
      const newPayment: Payment = {
          id: `pay-${Date.now()}`,
          userId: application.renterId,
          propertyId: property.id,
          type: PaymentType.RENT,
          amount: application.amount!,
          paymentDate: new Date().toISOString(),
          status: 'Paid',
      };
      setPayments(prev => [newPayment, ...prev]);

      addActivityLog(ActivityType.PAID_RENT, `Acknowledged offline rent payment for "${property.title}".`);
      addNotification(
          application.renterId,
          NotificationType.OFFLINE_PAYMENT_CONFIRMED,
          `Your offline payment for "${property.title}" has been acknowledged by the owner.`,
          application.id
      );

      alert("Offline payment acknowledged successfully.");
  };

  const handlePayPlatformFee = (applicationId: string) => {
      const application = applications.find(a => a.id === applicationId);
      const property = properties.find(p => p.id === application?.propertyId);
      if (!application || !property || !currentUser) return;
      
      setApplications(prev => prev.map(app => 
          app.id === applicationId 
          ? { ...app, status: ApplicationStatus.RENT_DUE, platformFee: { ...app.platformFee!, paid: true } }
          : app
      ));

      setUsers(prev => prev.map(u => 
          u.id === currentUser.id 
          ? { ...u, ownerCredit: (u.ownerCredit || 0) + application.platformFee!.amount }
          : u
      ));

      addActivityLog(ActivityType.PAID_BILL, `Paid platform fee of ₹${application.platformFee!.amount} for "${property.title}".`);
      
      const agreement = agreements.find(a => a.id === `agree-${application.id}`);
      addNotification(
          application.renterId,
          NotificationType.AGREEMENT_ACTION_REQUIRED,
          `Your rental agreement for "${property.title}" is ready to be signed.`,
          agreement ? agreement.id : application.id
      );

      alert("Platform fee paid. The rental agreement has been sent to the tenant, and their first rent is now due.");
  };

  const handleRentPaymentSuccess = () => {
      if (!payingRentDetails || !currentUser) return;
      const { application, property } = payingRentDetails;
      
      const owner = users.find(u => u.id === property.ownerId);
      if (!owner) return;

      let rentAmountForFee = 0;
      
      if (application.status === ApplicationStatus.DEPOSIT_DUE) {
          const agreement = agreements.find(a => a.propertyId === property.id && a.tenantId === currentUser.id);
          if (agreement) {
              rentAmountForFee = agreement.rentAmount; // Fee on first month's rent portion
          }
      } else { // Regular monthly rent
          rentAmountForFee = application.amount!;
      }
      
      const serviceFee = rentAmountForFee * SERVICE_FEE_PERCENTAGE;
      const netAmountToOwner = application.amount! - serviceFee;

      const feePayment: Payment = {
          id: `fee-${Date.now()}`,
          userId: owner.id, // Fee is associated with the owner
          propertyId: property.id,
          type: PaymentType.PLATFORM_FEE,
          amount: serviceFee,
          paymentDate: new Date().toISOString(),
          status: 'Paid',
      };

      if (application.status === ApplicationStatus.DEPOSIT_DUE) {
          setApplications(prev => prev.map(app => app.id === application.id ? { ...app, status: ApplicationStatus.MOVE_IN_READY } : app));
          setProperties(prev => prev.map(p => p.id === property.id ? { ...p, availability: 'rented' } : p));
          
          const newPayment: Payment = {
              id: `pay-deposit-${Date.now()}`,
              userId: currentUser.id, propertyId: property.id, type: PaymentType.DEPOSIT,
              amount: application.amount!, paymentDate: new Date().toISOString(), status: 'Paid',
          };
          setPayments(prev => [...prev, newPayment, feePayment]);

          addActivityLog(ActivityType.PAID_RENT, `Paid deposit and first rent of ₹${application.amount!.toLocaleString()} for "${property.title}".`);
          addNotification(property.ownerId, NotificationType.KEYS_HANDOVER_READY, `Payment of ₹${application.amount!.toLocaleString()} received for "${property.title}". After fees, ₹${netAmountToOwner.toLocaleString()} has been credited. Please coordinate key handover.`, application.id);
          addNotification(currentUser.id, NotificationType.KEYS_HANDOVER_READY, `Payment successful for "${property.title}"! You can now coordinate with the owner for key handover.`, application.id);

          setPayingRentDetails(null);
          alert("Payment successful! The owner has been notified to arrange key handover.");
          return;
      }
      
      // This is for regular monthly rent
      setApplications(prev => prev.map(app =>
          app.id === application.id ? { ...app, status: ApplicationStatus.RENT_PAID } : app
      ));

      const newPayment: Payment = {
          id: `pay-${Date.now()}`,
          userId: currentUser.id,
          propertyId: property.id,
          type: PaymentType.RENT,
          amount: application.amount!,
          paymentDate: new Date().toISOString(),
          status: 'Paid',
      };
      setPayments(prev => [...prev, newPayment, feePayment]);

      addActivityLog(ActivityType.PAID_RENT, `Paid rent of ₹${application.amount!.toLocaleString()} for "${property.title}".`);
      
      const ownerMessage = `${currentUser.name} has paid the rent (₹${application.amount!.toLocaleString()}) for "${property.title}". Your account has been credited with ₹${netAmountToOwner.toLocaleString()} after a ${SERVICE_FEE_PERCENTAGE * 100}% service fee.`;
      
      addNotification(property.ownerId, NotificationType.NEW_PAYMENT_RECEIVED, ownerMessage, application.id);

      setPayingRentDetails(null);
      alert("Payment successful! Your dashboard has been updated.");
  };
  
  const handleMarkPropertyAsRented = (propertyId: string) => {
    const property = properties.find(p => p.id === propertyId);
    if (!property) return;

    setProperties(prevProperties =>
      prevProperties.map(p => (p.id === propertyId ? { ...p, availability: 'rented' } : p))
    );
    
    addActivityLog(ActivityType.APPROVED_APPLICATION, `Manually marked property "${property.title}" as rented.`);
    alert("Property has been successfully marked as rented.");
  };

  const handleConfirmKeyHandover = (applicationId: string) => {
    const application = applications.find(a => a.id === applicationId);
    if (!application) return;

    setApplications(prev => prev.map(app => app.id === applicationId ? { ...app, status: ApplicationStatus.COMPLETED } : app));
    
    const property = properties.find(p => p.id === application.propertyId);
    addActivityLog(ActivityType.APPROVED_APPLICATION, `Key handover completed for "${property?.title}". The rental is now active.`);
    addNotification(
        application.renterId,
        NotificationType.APPLICATION_STATUS_UPDATE,
        `The owner has confirmed key handover for "${property?.title}". Welcome to your new home!`,
        application.id
    );

    alert('Key handover confirmed. The rental process is complete.');
  };
  
  const PaymentChoiceModal: React.FC<{
      onSelect: (method: 'online' | 'offline') => void;
      onClose: () => void;
  }> = ({ onSelect, onClose }) => (
       <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4">
          <div className="max-w-sm w-full mx-auto bg-white p-8 rounded-lg shadow-xl relative">
              <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
                  <Icons.XCircleIcon className="w-6 h-6" />
              </button>
              <h2 className="text-xl font-bold text-center mb-6">Choose Payment Method</h2>
              <div className="space-y-4">
                  <button onClick={() => onSelect('online')} className="w-full text-left p-4 border rounded-lg hover:bg-gray-50 flex items-center gap-4">
                      <img src="https://razorpay.com/assets/razorpay-logo.svg" alt="Razorpay" className="h-6" />
                      <div>
                          <p className="font-semibold">Online Payment</p>
                          <p className="text-sm text-neutral-500">Pay via UPI, Cards, Netbanking</p>
                      </div>
                  </button>
                  <button onClick={() => onSelect('offline')} className="w-full text-left p-4 border rounded-lg hover:bg-gray-50 flex items-center gap-4">
                      <Icons.BanknotesIcon className="w-6 h-6 text-primary" />
                      <div>
                          <p className="font-semibold">Offline Payment</p>
                          <p className="text-sm text-neutral-500">Pay directly and provide transaction ID</p>
                      </div>
                  </button>
              </div>
          </div>
      </div>
  );
  
  const OfflinePaymentModal: React.FC<{
      onSubmit: (upiId: string) => void;
      onClose: () => void;
  }> = ({ onSubmit, onClose }) => {
      const [upiId, setUpiId] = useState('');
      const handleSubmit = (e: React.FormEvent) => {
          e.preventDefault();
          if (upiId.trim()) {
              onSubmit(upiId.trim());
          }
      };
      return (
          <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4">
              <form onSubmit={handleSubmit} className="max-w-sm w-full mx-auto bg-white p-8 rounded-lg shadow-xl relative">
                  <button type="button" onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
                      <Icons.XCircleIcon className="w-6 h-6" />
                  </button>
                  <h2 className="text-xl font-bold mb-2">Submit Offline Payment</h2>
                  <p className="text-sm text-neutral-500 mb-6">Please enter the UPI transaction ID for your payment to the landlord.</p>
                  <div>
                      <label htmlFor="upiId" className="block text-sm font-medium text-gray-700">UPI Transaction ID</label>
                      <input type="text" id="upiId" value={upiId} onChange={e => setUpiId(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary" required />
                  </div>
                  <div className="mt-6">
                      <button type="submit" className="w-full bg-secondary hover:bg-primary text-white font-bold py-3 px-4 rounded-lg transition-colors duration-300">Submit for Acknowledgment</button>
                  </div>
              </form>
          </div>
      );
  };

  const renderContent = () => {
    const mainContainerClasses = currentView === 'browsing' ? "" : (currentView === 'propertyDetails' ? "bg-neutral-100" : "container mx-auto p-4 md:p-8");
    
    if (currentView === 'login') {
      return <LoginPage users={users} onLogin={handleLogin} onBackToHome={resetToHome} onSignup={handleSignup} />;
    }
    
    if (paymentChoiceDetails) {
        return <PaymentChoiceModal onClose={() => setPaymentChoiceDetails(null)} onSelect={handleSelectPaymentMethod} />;
    }
    
    if (offlinePaymentDetails) {
        return <OfflinePaymentModal onClose={() => setOfflinePaymentDetails(null)} onSubmit={handleSubmitOfflinePayment} />;
    }

    if (payingRentDetails && currentUser) {
        const isDepositPayment = payingRentDetails.application.status === ApplicationStatus.DEPOSIT_DUE;
        return (
            <PaymentPortal
                paymentDetails={{
                    title: isDepositPayment ? 'Deposit & First Rent' : 'Online Rent Payment',
                    amount: payingRentDetails.application.amount!,
                    dueDate: payingRentDetails.application.dueDate,
                    propertyTitle: payingRentDetails.property.title
                }}
                onPaymentSuccess={handleRentPaymentSuccess}
                onClose={() => setPayingRentDetails(null)}
            />
        );
    }
    
    if (payingBillDetails && currentUser) {
        const { bill, property } = payingBillDetails;
        return (
            <PaymentPortal
                paymentDetails={{
                    title: `${bill.type.charAt(0).toUpperCase() + bill.type.slice(1).toLowerCase()} Bill Payment`,
                    amount: bill.amount,
                    dueDate: bill.dueDate,
                    propertyTitle: property.title
                }}
                onPaymentSuccess={handleBillPaymentSuccess}
                onClose={() => setPayingBillDetails(null)}
            />
        );
    }
     if (payingViewingAdvanceDetails && currentUser) {
        const { property } = payingViewingAdvanceDetails;
        return (
            <PaymentPortal
                paymentDetails={{
                    title: 'Viewing Advance Payment',
                    amount: property.viewingAdvance,
                    propertyTitle: property.title
                }}
                onPaymentSuccess={handleViewingPaymentSuccess}
                onClose={() => setPayingViewingAdvanceDetails(null)}
            />
        );
    }
    
    if (signingAgreementDetails && currentUser) {
      const { agreement, property } = signingAgreementDetails;
      return (
        <AgreementSigningPage
          agreement={agreement}
          property={property}
          currentUser={currentUser}
          onInitiateSign={handleInitiateSignature}
          onClose={handleCloseSigningAgreement}
        />
      );
    }

    if (currentUser) {
       const userNotifications = notifications.filter(n => n.userId === currentUser.id);

       const header = (
          <Header 
              currentUser={currentUser} 
              onLogout={handleLogout} 
              onSearch={handleLocationSearch} 
              onNavigateToProfile={handleNavigateToProfile} 
              onNavigateToActivity={handleNavigateToActivity} 
              notifications={userNotifications} 
              onMarkAllAsRead={handleMarkAllNotificationsAsRead}
              onBrowseClick={handleNavigateToBrowsing}
              onNavigateToDashboard={handleNavigateToDashboard}
          />
       );

       if (currentView === 'propertyDetails' && selectedProperty) {
            const owner = users.find(u => u.id === selectedProperty.ownerId);
            return (
                <div className="min-h-screen font-sans flex flex-col">
                    {header}
                    <main className="flex-grow bg-neutral-100">
                        <PropertyDetails
                            property={selectedProperty}
                            owner={owner}
                            onBack={handleGoBackToList}
                            onScheduleViewing={() => setCurrentView('booking')}
                            onNavigateToHome={resetToHome}
                            onNavigateToBrowsing={handleNavigateToBrowsing}
                        />
                    </main>
                </div>
            );
        }

        if (currentView === 'booking' && selectedProperty) {
            return (
                 <div className="min-h-screen bg-neutral-100 font-sans flex flex-col">
                    {header}
                    <main className="flex-grow container mx-auto p-4 md:p-8">
                      <BookViewingForm 
                        property={selectedProperty} 
                        onSubmit={handleScheduleViewing} 
                        onBack={() => setCurrentView('propertyDetails')} 
                      />
                    </main>
                    <Footer onLocationSearch={handleLocationSearch} nearbyLocations={nearbyLocations} />
                  </div>
            );
        }
        
        if (currentView === 'bookingConfirmation' && lastBookingDetails) {
             return (
                <div className="min-h-screen bg-neutral-100 font-sans flex flex-col">
                    {header}
                    <main className="flex-grow container mx-auto p-4 md:p-8">
                        <BookingConfirmation 
                            bookingDetails={lastBookingDetails} 
                            onGoToDashboard={() => {
                                setCurrentView('dashboard');
                                setLoggedInView('dashboard');
                                setLastBookingDetails(null);
                            }}
                            onBrowseMore={() => {
                                setCurrentView('browsing');
                                setLastBookingDetails(null);
                                setSelectedProperty(null);
                            }}
                        />
                    </main>
                    <Footer onLocationSearch={handleLocationSearch} nearbyLocations={nearbyLocations} />
                </div>
             );
        }

       if (currentView === 'browsing') {
        return (
            <div className="min-h-screen font-sans flex flex-col">
                {header}
                <main className="flex-grow">
                    <PropertyList 
                        properties={properties} 
                        users={users} 
                        onSelectProperty={handleSelectProperty} 
                        initialSearchTerm={initialSearchTerm} 
                        cityName={cityName} 
                        aiFilters={aiFilters} 
                        onAiFiltersApplied={handleAiFiltersApplied} 
                    />
                </main>
            </div>
        );
      }
      
       if (loggedInView === 'profile') {
            return (
              <div className="min-h-screen bg-neutral-100 font-sans flex flex-col">
                {header}
                <main className="flex-grow container mx-auto p-4 md:p-8">
                  <ProfilePage user={currentUser} onUpdateProfile={handleUpdateProfile} onBack={() => setLoggedInView('dashboard')} />
                </main>
                <Footer onLocationSearch={handleLocationSearch} nearbyLocations={nearbyLocations} />
              </div>
            );
        }

        if (loggedInView === 'activity') {
            const userActivity = activityLogs.filter(log => log.userId === currentUser.id);
             return (
              <div className="min-h-screen bg-neutral-100 font-sans flex flex-col">
                {header}
                <main className="flex-grow container mx-auto p-4 md:p-8">
                  <ActivityLogPage activities={userActivity} onBack={() => setLoggedInView('dashboard')} />
                </main>
                <Footer onLocationSearch={handleLocationSearch} nearbyLocations={nearbyLocations} />
              </div>
            );
        }

       let view;
        switch(currentUser.role) {
          case UserRole.RENTER:
            const renterApplications = applications.filter(a => a.renterId === currentUser.id);
            const renterPayments = payments.filter(p => p.userId === currentUser.id);
            const renterAgreements = agreements.filter(a => a.tenantId === currentUser.id);
            const renterViewings = viewings.filter(v => v.tenantId === currentUser.id);
            const renterBills = bills.filter(b => b.tenantId === currentUser.id);
            const renterVerification = verifications.find(v => v.tenantId === currentUser.id);
            
            const safeAgreements = renterAgreements.map(a => {
                const property = properties.find(p => p.id === a.propertyId);
                return property ? { agreement: a, property } : null;
            }).filter((a): a is { agreement: Agreement, property: Property } => a !== null);
            
            const safeViewings = renterViewings.map(v => {
                const property = properties.find(p => p.id === v.propertyId);
                return property ? { viewing: v, property } : null;
            }).filter((v): v is { viewing: Viewing, property: Property } => v !== null);

            const safeRenterApplications = renterApplications.map(app => {
                const property = properties.find(p => p.id === app.propertyId);
                return property ? { application: app, property } : null;
            }).filter((a): a is { application: Application, property: Property } => a !== null);
            
            const safeVerification = renterVerification || { 
                id: `fallback-ver-${currentUser.id}`, 
                tenantId: currentUser.id, 
                status: VerificationStatus.NOT_SUBMITTED, 
                formData: {}, 
                submittedAt: '' 
            };

            view = <TenantDashboard
                        user={currentUser}
                        agreements={safeAgreements}
                        viewings={safeViewings}
                        applications={safeRenterApplications}
                        payments={renterPayments}
                        properties={properties}
                        bills={renterBills}
                        verification={safeVerification}
                        onSubmitVerification={handleSubmitVerification}
                        onPayBill={handlePayBill}
                        onRaiseDispute={(relatedId, type) => handleRaiseDispute(relatedId, type as any)}
                        onViewAgreementDetails={handleViewAgreementDetails}
                        onSignAgreement={handleViewAgreementToSign}
                        onInitiatePaymentFlow={handleInitiatePaymentFlow}
                        onConfirmRent={handleConfirmRent}
                        onCancelViewing={handleCancelViewing}
                   />;
            break;
          case UserRole.OWNER:
            if (editingProperty) {
              view = <EditPropertyForm property={editingProperty} onSubmit={handleUpdateProperty} onCancel={handleCancelEdit} onNavigateToHome={resetToHome} onNavigateToDashboard={handleNavigateToDashboard} />;
            } else if (isPostingProperty) {
              view = <PostPropertyForm onSubmit={handleAddProperty} onCancel={handleCancelPostProperty} />;
            } else {
              const ownerProperties = properties.filter(p => p.ownerId === currentUser.id);
              const ownerPropertyIds = ownerProperties.map(p => p.id);
              const ownerViewings = viewings.filter(v => ownerPropertyIds.includes(v.propertyId));
              const ownerApplications = applications.filter(a => ownerPropertyIds.includes(a.propertyId));
              const ownerAgreements = agreements.filter(a => ownerPropertyIds.includes(a.propertyId));
              const ownerPayments = payments.filter(p => ownerPropertyIds.includes(p.propertyId) || p.userId === currentUser.id);

              const safePaymentHistory = ownerPayments.map(payment => {
                const tenant = users.find(u => u.id === payment.userId);
                const property = properties.find(p => p.id === payment.propertyId);
                return {
                    payment,
                    tenantName: tenant?.name || 'Unknown User',
                    propertyTitle: property?.title || 'Deleted Property',
                };
              });

              const safeOwnerViewings = ownerViewings.map(v => {
                  const tenant = users.find(u => u.id === v.tenantId);
                  const property = properties.find(p => p.id === v.propertyId);
                  return (tenant && property) ? { viewing: v, tenant, property } : null;
              }).filter((v): v is { viewing: Viewing, tenant: User, property: Property } => v !== null);

              const safeOwnerApplications = ownerApplications.map(app => {
                  const renter = users.find(u => u.id === app.renterId);
                  const property = properties.find(p => p.id === app.propertyId);
                  return (renter && property) ? { application: app, renter, property } : null;
              }).filter((app): app is { application: Application, renter: User, property: Property } => app !== null);
              
              const safeOwnerAgreements = ownerAgreements.map(a => {
                  const property = properties.find(p => p.id === a.propertyId);
                  return property ? { agreement: a, property } : null;
              }).filter((a): a is { agreement: Agreement, property: Property } => a !== null);


              view = <OwnerDashboard 
                      user={currentUser}
                      properties={ownerProperties} 
                      viewings={safeOwnerViewings}
                      applications={safeOwnerApplications}
                      agreements={safeOwnerAgreements}
                      paymentHistory={safePaymentHistory}
                      onUpdateViewingStatus={handleUpdateViewingStatus}
                      onUpdateApplicationStatus={handleUpdateApplicationStatus}
                      onEditProperty={handleSelectPropertyForEdit}
                      onPostPropertyClick={handleShowPostPropertyForm}
                      onSignAgreement={handleViewAgreementToSign}
                      onViewAgreementDetails={handleViewAgreementDetails}
                      onPayPlatformFee={handlePayPlatformFee}
                      onAcknowledgeOfflinePayment={handleAcknowledgeOfflinePayment}
                      onMarkAsRented={handleMarkPropertyAsRented}
                      onInitiateFinalizeAgreement={handleInitiateFinalizeAgreement}
                      onConfirmKeyHandover={handleConfirmKeyHandover}
                    />;
            }
            break;
          case UserRole.SUPER_ADMIN:
            view = <SuperAdminDashboard properties={properties} applications={applications} users={users} disputes={disputes} onUpdateKycStatus={handleUpdateKycStatus} />;
            break;
          default:
            view = <div>Invalid user role.</div>
        }

        return (
           <div className="min-h-screen bg-neutral-100 font-sans flex flex-col">
            {header}
            <main className="flex-grow container mx-auto p-4 md:p-8">
              {view}
            </main>
            <Footer onLocationSearch={handleLocationSearch} nearbyLocations={nearbyLocations} />
          </div>
        );
    }

    // Public (logged-out) view
    let publicView;
    switch(currentView) {
        case 'propertyDetails':
            if (selectedProperty) {
              const owner = users.find(u => u.id === selectedProperty.ownerId);
              publicView = <PropertyDetails property={selectedProperty} owner={owner} onBack={handleGoBackToList} onScheduleViewing={() => setCurrentView('booking')} onNavigateToHome={resetToHome} onNavigateToBrowsing={handleNavigateToBrowsing} />;
            } else {
               publicView = <HomePage properties={properties} onSearch={handleStartBrowsing} onSelectProperty={handleSelectProperty} cityName={cityName} onSmartSearchClick={() => setIsSmartSearchOpen(true)} onLoginClick={() => setCurrentView('login')} />;
            }
            break;
        case 'browsing':
            publicView = <PropertyList properties={properties} users={users} onSelectProperty={handleSelectProperty} initialSearchTerm={initialSearchTerm} cityName={cityName} aiFilters={aiFilters} onAiFiltersApplied={handleAiFiltersApplied} />;
            break;
        case 'booking':
             if (selectedProperty) {
                publicView = <BookViewingForm property={selectedProperty} onSubmit={handleScheduleViewing} onBack={() => setCurrentView('propertyDetails')} />;
             } else {
                 publicView = <HomePage properties={properties} onSearch={handleStartBrowsing} onSelectProperty={handleSelectProperty} cityName={cityName} onSmartSearchClick={() => setIsSmartSearchOpen(true)} onLoginClick={() => setCurrentView('login')} />;
             }
            break;
        case 'bookingConfirmation':
            if (lastBookingDetails) {
                publicView = <BookingConfirmation 
                    bookingDetails={lastBookingDetails} 
                    onGoToDashboard={() => {
                        setCurrentView('dashboard');
                        setLoggedInView('dashboard');
                        setLastBookingDetails(null);
                    }}
                    onBrowseMore={() => {
                        setCurrentView('browsing');
                        setLastBookingDetails(null);
                        setSelectedProperty(null);
                    }}
                />;
            } else {
                // Fallback if state is lost
                publicView = <HomePage properties={properties} onSearch={handleStartBrowsing} onSelectProperty={handleSelectProperty} cityName={cityName} onSmartSearchClick={() => setIsSmartSearchOpen(true)} onLoginClick={() => setCurrentView('login')} />;
            }
            break;
        case 'home':
        default:
            publicView = <HomePage properties={properties} onSearch={handleStartBrowsing} onSelectProperty={handleSelectProperty} cityName={cityName} onSmartSearchClick={() => setIsSmartSearchOpen(true)} onLoginClick={() => setCurrentView('login')} />;
            break;
    }

    return (
       <div className="min-h-screen font-sans flex flex-col">
        <SmartSearchModal isOpen={isSmartSearchOpen} isLoading={isSmartSearchLoading} onClose={() => setIsSmartSearchOpen(false)} onSearch={handleSmartSearch} />
        <Header onLoginClick={() => setCurrentView('login')} onSearch={handleLocationSearch} currentUser={null} />
        <main className={`flex-grow ${mainContainerClasses}`}>
          {publicView}
        </main>
        {currentView === 'home' && <Footer onLocationSearch={handleLocationSearch} nearbyLocations={nearbyLocations} />}
      </div>
    );
  }

  return (
    <>
      {renderContent()}
      {viewingAgreementDetails && (() => {
        const { agreement, property } = viewingAgreementDetails;
        const tenant = users.find(u => u.id === agreement.tenantId);
        const owner = users.find(u => u.id === agreement.ownerId);

        if (!tenant || !owner) return null;

        return (
          <AgreementView
            agreement={agreement}
            property={property}
            renter={tenant}
            owner={owner}
            isReadOnly
            onClose={handleCloseAgreementDetails}
          />
        );
      })()}
      {otpVerificationDetails && (
        <OtpVerificationModal
          isOpen={!!otpVerificationDetails}
          onClose={() => setOtpVerificationDetails(null)}
          onVerify={handleVerifyOtpAndSign}
          error={otpVerificationDetails.error}
        />
      )}
       {finalizingAgreementDetails && (
        <FinalizeAgreementForm
          details={finalizingAgreementDetails}
          onClose={() => setFinalizingAgreementDetails(null)}
          onSubmit={handleFinalizeAgreement}
        />
      )}
    </>
  );
};

export default App;
