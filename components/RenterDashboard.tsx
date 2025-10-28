import React, { useState, useMemo, useEffect } from 'react';
import type { User, Agreement, Property, Viewing, Bill, Verification, Application, Payment, MaintenanceRequest, Review } from '../types';
import { BillType, ApplicationStatus, PaymentType, ViewingStatus, MaintenanceStatus, VerificationStatus, UserRole } from '../types';
import * as Icons from './Icons';
import PoliceVerificationForm from './VerificationForm';
import CreateMaintenanceRequestModal from './CreateMaintenanceRequestModal';
import MaintenanceRequestCard from './MaintenanceRequestCard';
import PropertyCard from './PropertyCard';
import OnboardingTracker from './OnboardingTracker';
import LeaveReviewModal from './LeaveReviewModal';
import RentCycleTracker from './RentCycleTracker';


// Component-specific props
interface RenterDashboardProps {
  user: User;
  agreements: { agreement: Agreement, property: Property }[];
  viewings: { viewing: Viewing, property: Property }[];
  applications: { application: Application, property: Property }[];
  payments: Payment[];
  properties: Property[];
  bills: Bill[];
  verification: Verification;
  maintenanceRequests: MaintenanceRequest[];
  users: User[];
  savedProperties: Property[];
  activeTab: string;
  onTabChange: (tab: string) => void;
  onSubmitVerification: (formData: Record<string, any>) => void;
  onPayBill: (billId: string) => void;
  onRaiseDispute: (relatedId: string, type: 'Viewing' | 'Payment' | 'Property') => void;
  onViewAgreementDetails: (agreement: Agreement, property: Property) => void;
  onSignAgreement: (agreement: Agreement, property: Property) => void;
  onInitiatePaymentFlow: (application: Application, property: Property) => void;
  onConfirmRent: (viewingId: string) => void;
  onCancelViewing: (viewingId: string) => void;
  onTenantReject: (viewingId: string) => void;
  onAddMaintenanceRequest: (requestData: Omit<MaintenanceRequest, 'id' | 'createdAt' | 'status' | 'createdBy'>) => void;
  onUpdateMaintenanceStatus: (requestId: string, status: MaintenanceStatus) => void;
  onAddMaintenanceComment: (requestId: string, commentText: string) => void;
  onToggleSaveProperty: (propertyId: string) => void;
  onSelectProperty: (property: Property) => void;
  onBrowseClick: () => void;
  recentlyPaidApplicationId: string | null;
  onClearRecentlyPaid: () => void;
  onLeaveReview: (agreementId: string, reviewData: Omit<Review, 'id' | 'author' | 'role' | 'time' | 'userId'>) => void;
}

interface WelcomeHomeMessageProps {
  userName: string;
  onManageClick: () => void;
}

const WelcomeHomeMessage: React.FC<WelcomeHomeMessageProps> = ({ userName, onManageClick }) => {
  // Array to render multiple confetti pieces
  const confettiPieces = Array.from({ length: 20 });

  return (
    <div className="welcome-home-container">
      {/* Confetti pieces */}
      {confettiPieces.map((_, i) => (
        <div key={i} className={`confetti confetti-piece-${i}`}></div>
      ))}
      <div className="welcome-home-card">
        <div className="relative inline-block">
          <Icons.HomeIcon className="w-20 h-20 text-primary opacity-20" />
          <Icons.CheckCircleIcon className="w-16 h-16 text-green-500 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
        </div>
        <h2>Welcome Home, {userName}!</h2>
        <p>Congratulations! Your rental process is complete. We wish you all the best in your new home.</p>
        <button onClick={onManageClick}>Manage Your Tenancy</button>
      </div>
    </div>
  );
};

const PaymentSuccessMessage: React.FC<{
  size?: 'large' | 'small';
  onComplete: () => void;
  message?: string;
}> = ({ size = 'large', onComplete, message }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onComplete();
    }, 3500); // Animation duration + a little extra
    return () => clearTimeout(timer);
  }, [onComplete]);

  if (size === 'small') {
    return (
      <div className="payment-success-inline">
        <svg className="animation-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52">
          <circle className="payment-success-circle" cx="26" cy="26" r="25" fill="none" />
          <path className="payment-success-checkmark" fill="none" d="M14,27 L22,35 L38,18" />
        </svg>
        <span>{message || 'Payment Successful!'}</span>
      </div>
    );
  }

  return (
    <div className="payment-success-container">
      <div className="payment-success-animation">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52">
          <circle className="payment-success-circle" cx="26" cy="26" r="25" fill="none" />
          <path className="payment-success-checkmark" fill="none" d="M14,27 L22,35 L38,18" />
        </svg>
      </div>
      <h3>{message || 'Payment Successful!'}</h3>
    </div>
  );
};


// Reusable components within the dashboard
const SidebarButton: React.FC<{ id: string; label: string; count?: number; icon: React.ReactNode; activeTab: string; onTabChange: (tab: string) => void }> = ({ id, label, count, icon, activeTab, onTabChange }) => (
    <button
        onClick={() => onTabChange(id)}
        className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold rounded-lg transition-colors ${
            activeTab === id 
            ? 'bg-primary/10 text-primary' 
            : 'text-neutral-600 hover:bg-neutral-100'
        }`}
    >
        {icon}
        <span className="flex-grow text-left">{label}</span>
        {typeof count !== 'undefined' && count > 0 && 
            <span className="bg-primary/20 text-primary text-xs font-bold rounded-full px-2 py-0.5">{count}</span>}
    </button>
);

const KycStatusBadge: React.FC<{ status: 'Verified' | 'Pending' | 'Rejected' | 'Not Verified', large?: boolean }> = ({ status, large = false }) => {
    const statusInfo = {
        Verified: { text: 'KYC Verified', color: 'bg-green-100 text-green-800', icon: <Icons.ShieldCheckIcon className="w-4 h-4" /> },
        Pending: { text: 'KYC Pending', color: 'bg-yellow-100 text-yellow-800', icon: <Icons.ClockIcon className="w-4 h-4" /> },
        Rejected: { text: 'KYC Rejected', color: 'bg-red-100 text-red-800', icon: <Icons.XCircleIcon className="w-4 h-4" /> },
        'Not Verified': { text: 'Not Verified', color: 'bg-gray-100 text-gray-800', icon: <Icons.ExclamationTriangleIcon className="w-4 h-4" /> },
    }[status];
    const sizeClass = large ? 'px-3 py-1.5 text-base' : 'px-2.5 py-1 text-xs';
    return <span className={`inline-flex items-center gap-1.5 font-semibold rounded-full ${sizeClass} ${statusInfo.color}`}>{statusInfo.icon}{statusInfo.text}</span>;
};

const StatCard: React.FC<{ icon: React.ReactNode, title: string, value: React.ReactNode, color: string }> = ({ icon, title, value, color }) => (
    <div className="bg-white p-6 rounded-lg shadow-md border flex items-start gap-4">
        <div className={`p-3 rounded-full ${color}`}>{icon}</div>
        <div>
            {typeof value === 'string' || typeof value === 'number' ? <p className="text-3xl font-bold text-neutral-800">{value}</p> : value}
            <h4 className="text-sm font-medium text-neutral-500">{title}</h4>
        </div>
    </div>
);

// Main Component
const RenterDashboard: React.FC<RenterDashboardProps> = (props) => {
    const { user, agreements, viewings, applications, payments, properties, bills, verification, maintenanceRequests, users, savedProperties, activeTab, onTabChange, onSubmitVerification, onPayBill, onRaiseDispute, onViewAgreementDetails, onSignAgreement, onInitiatePaymentFlow, onConfirmRent, onCancelViewing, onTenantReject, onAddMaintenanceRequest, onUpdateMaintenanceStatus, onAddMaintenanceComment, onToggleSaveProperty, onSelectProperty, onBrowseClick, recentlyPaidApplicationId, onClearRecentlyPaid, onLeaveReview } = props;

    // ... State and Memos ...
    const [paymentFilterType, setPaymentFilterType] = useState('');
    const [paymentFilterStatus, setPaymentFilterStatus] = useState('');
    const [paymentFilterStartDate, setPaymentFilterStartDate] = useState('');
    const [paymentFilterEndDate, setPaymentFilterEndDate] = useState('');
    const [billFilter, setBillFilter] = useState<'all' | 'utilities' | 'rent'>('all');
    const [isCreateRequestModalOpen, setIsCreateRequestModalOpen] = useState(false);
    const [requestSortBy, setRequestSortBy] = useState('dueDate-asc');
    const [requestFilterStatus, setRequestFilterStatus] = useState<MaintenanceStatus | 'All'>('All');
    const [requestFilterProperty, setRequestFilterProperty] = useState<string>('All');
    const [requestFilterAssignee, setRequestFilterAssignee] = useState<string>('All');
    const [reviewingAgreement, setReviewingAgreement] = useState<{ agreement: Agreement, property: Property } | null>(null);

    const pendingAgreementSignatures = agreements.filter(a => a.agreement.signedByOwner && !a.agreement.signedByTenant).length;
    const sortedPayments = [...payments].sort((a, b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime());

    const activeAgreements = agreements.filter(a => a.agreement.signedByTenant && a.agreement.signedByOwner);
    const propertiesForMaintenance = useMemo(() => activeAgreements.map(a => a.property), [activeAgreements]);
    const relevantUsersForMaintenance = useMemo(() => {
        const ownerIds = new Set(activeAgreements.map(a => a.property.ownerId));
        return users.filter(u => u.id === user.id || ownerIds.has(u.id));
    }, [users, activeAgreements, user.id]);

    const rentBillableItems = useMemo(() => {
        const applicationItems = applications.map(({ application, property }) => {
            let item = null;
            if ([ApplicationStatus.RENT_DUE, ApplicationStatus.RENT_PAID, ApplicationStatus.OFFLINE_PAYMENT_PENDING].includes(application.status)) {
                item = { id: application.id, type: 'rent' as const, title: 'Monthly Rent', propertyTitle: property.title, amount: application.amount!, status: application.status === ApplicationStatus.RENT_PAID ? 'Paid' as const : application.status === ApplicationStatus.OFFLINE_PAYMENT_PENDING ? 'Pending' as const : 'Unpaid' as const, date: application.dueDate!, rawDate: new Date(application.dueDate!), data: { application, property } };
            } else if ([ApplicationStatus.DEPOSIT_DUE, ApplicationStatus.DEPOSIT_PAID].includes(application.status)) {
                 const status = application.status === ApplicationStatus.DEPOSIT_PAID ? 'Pending' : 'Unpaid';
                item = { id: application.id, type: 'deposit' as const, title: 'Deposit & First Rent', propertyTitle: property.title, amount: application.amount!, status: status as 'Unpaid' | 'Pending', date: new Date().toISOString(), rawDate: new Date(), data: { application, property } };
            }
            return item;
        }).filter((item): item is NonNullable<typeof item> => item !== null);
        
        const unpaid = applicationItems.filter(item => item.status === 'Unpaid' || item.status === 'Pending');
        const paid = applicationItems.filter(item => item.status === 'Paid');
        
        unpaid.sort((a, b) => a.rawDate.getTime() - b.rawDate.getTime());
        paid.sort((a, b) => b.rawDate.getTime() - a.rawDate.getTime());

        return [...unpaid, ...paid];
    }, [applications, properties]);

    const utilityBillItems = useMemo(() => {
        const billItems = bills.map(bill => {
            const property = properties.find(p => p.id === bill.propertyId);
            return { id: `bill-${bill.id}`, type: 'bill' as const, title: `${bill.type.charAt(0) + bill.type.slice(1).toLowerCase()} Bill`, propertyTitle: property?.title || 'N/A', amount: bill.amount, status: bill.isPaid ? 'Paid' as const : 'Unpaid' as const, date: bill.isPaid ? bill.paidOn! : bill.dueDate, rawDate: new Date(bill.isPaid ? bill.paidOn! : bill.dueDate), data: bill };
        });
        
        const unpaid = billItems.filter(item => item.status === 'Unpaid');
        const paid = billItems.filter(item => item.status === 'Paid');

        unpaid.sort((a, b) => a.rawDate.getTime() - b.rawDate.getTime());
        paid.sort((a, b) => b.rawDate.getTime() - a.rawDate.getTime());
        
        return [...unpaid, ...paid];
    }, [bills, properties]);
    
    const actionItems = useMemo(() => {
        const items = [];
        if (user.kycStatus !== 'Verified') {
            items.push({ id: 'verify', text: 'Complete your KYC verification', action: () => onTabChange('verification'), icon: <Icons.ShieldCheckIcon className="w-5 h-5 text-yellow-600"/> });
        }
        agreements.forEach(({agreement, property}) => {
            if (agreement.signedByOwner && !agreement.signedByTenant) {
                items.push({ id: `sign-${agreement.id}`, text: `Sign agreement for "${property.title}"`, action: () => onSignAgreement(agreement, property), icon: <Icons.PencilIcon className="w-5 h-5 text-blue-600"/> });
            }
        });
        const unpaidItems = [...rentBillableItems, ...utilityBillItems].filter(i => i.status === 'Unpaid');
        unpaidItems.slice(0, 2).forEach(item => {
             items.push({ id: `pay-${item.id}`, text: `Pay ${item.title.toLowerCase()} of ₹${item.amount.toLocaleString()}`, action: () => {
                 if (item.type === 'bill') onPayBill((item.data as Bill).id);
                 else onInitiatePaymentFlow((item.data as any).application, (item.data as any).property);
            }, icon: <Icons.BanknotesIcon className="w-5 h-5 text-red-600"/> });
        });
        return items;
    }, [user.kycStatus, agreements, rentBillableItems, utilityBillItems, onTabChange, onSignAgreement, onPayBill, onInitiatePaymentFlow]);

    const { BillCard } = useMemo(() => {
        const getBillIcon = (type: BillType | 'RENT' | 'DEPOSIT') => {
            switch (type) {
                case BillType.ELECTRICITY:
                    return <Icons.BoltIcon className="w-6 h-6 text-yellow-600" />;
                case BillType.WATER:
                    return <Icons.WaterDropIcon className="w-6 h-6 text-blue-600" />;
                case BillType.MAINTENANCE:
                    return <Icons.ClipboardDocumentListIcon className="w-6 h-6 text-gray-600" />;
                case 'RENT':
                    return <Icons.BanknotesIcon className="w-6 h-6 text-green-600" />;
                case 'DEPOSIT':
                    return <Icons.KeyIcon className="w-6 h-6 text-indigo-600" />;
                default:
                    return <Icons.CreditCardIcon className="w-6 h-6 text-gray-500" />;
            }
        };
        const getPaymentStatusBadge = (status: 'Paid' | 'Unpaid' | 'Pending' | 'Failed' | 'Refunded') => {
            const statusInfo = {
                Paid: { text: 'Paid', color: 'bg-green-100 text-green-800' },
                Unpaid: { text: 'Unpaid', color: 'bg-red-100 text-red-800' },
                Pending: { text: 'Owner Confirmation', color: 'bg-yellow-100 text-yellow-800' },
                Failed: { text: 'Failed', color: 'bg-red-100 text-red-800' },
                Refunded: { text: 'Refunded', color: 'bg-blue-100 text-blue-800' },
            };
            const info = statusInfo[status] || { text: status, color: 'bg-gray-100 text-gray-800' };
            return <span className={`px-2 py-1 text-xs font-bold rounded-full ${info.color}`}>{info.text}</span>;
        };

        const BillCard: React.FC<{ item: (typeof utilityBillItems)[0] | (typeof rentBillableItems)[0] }> = ({ item }) => {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const itemDueDate = new Date(item.rawDate);
            itemDueDate.setHours(0, 0, 0, 0);

            const isOverdue = item.status === 'Unpaid' && itemDueDate < today;
            const isRecentPayment = item.status === 'Paid' && item.id === recentlyPaidApplicationId;

            const renderDateInfo = () => {
                if (item.status === 'Paid') {
                    return <p className="text-xs text-neutral-500">Paid on {new Date(item.date).toLocaleDateString()}</p>;
                }
                if (item.status === 'Pending') {
                    return <p className="text-xs font-semibold text-yellow-600">Awaiting owner confirmation</p>;
                }
                if (isOverdue) {
                    return <p className="text-xs font-bold text-red-600">Overdue since {new Date(item.date).toLocaleDateString()}</p>;
                }
                return <p className="text-xs text-neutral-500">Due by {new Date(item.date).toLocaleDateString()}</p>;
            };

            return (
                <div className="p-4 border rounded-lg flex flex-col sm:flex-row items-start gap-4">
                    <div className="p-2 bg-neutral-100 rounded-full">
                        {getBillIcon(item.type === 'bill' ? (item.data as Bill).type : item.type.toUpperCase() as 'RENT' | 'DEPOSIT')}
                    </div>
                    <div className="flex-grow">
                        <div className="flex justify-between items-start">
                            <div>
                                <h4 className="font-bold">{item.title}</h4>
                                <p className="text-xs text-neutral-500">{item.propertyTitle}</p>
                            </div>
                            {getPaymentStatusBadge(item.status)}
                        </div>
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mt-3 gap-2">
                            <div>
                                <p className="text-xl font-bold">₹{item.amount.toLocaleString()}</p>
                                {renderDateInfo()}
                            </div>
                             {isRecentPayment ? (
                                <PaymentSuccessMessage onComplete={onClearRecentlyPaid} size="small" message="Paid Successfully!" />
                            ) : item.status === 'Unpaid' ? (
                                <button
                                    onClick={() => {
                                        if (item.type === 'bill') {
                                            onPayBill((item.data as Bill).id);
                                        } else {
                                            onInitiatePaymentFlow((item.data as any).application, (item.data as any).property);
                                        }
                                    }}
                                    className={`px-4 py-2 text-white font-semibold rounded-md text-sm w-full sm:w-auto transition-colors ${
                                        isOverdue ? 'bg-red-600 hover:bg-red-700' : 'bg-secondary hover:bg-primary'
                                    }`}
                                >
                                    Pay Now
                                </button>
                            ) : null}
                        </div>
                    </div>
                </div>
            );
        };

        return { BillCard };
    }, [onPayBill, onInitiatePaymentFlow, recentlyPaidApplicationId, onClearRecentlyPaid]);

    const handleReviewSubmit = (agreementId: string, reviewData: Omit<Review, 'id' | 'author' | 'role' | 'time' | 'userId'>) => {
        onLeaveReview(agreementId, reviewData);
        setReviewingAgreement(null);
    };

    // Render Functions
    const renderOverview = () => (
        <div className="space-y-8">
            <div>
                <h2 className="text-3xl font-bold text-neutral-900">Welcome, {user.name.split(' ')[0]}!</h2>
                <p className="text-neutral-600">Here's an overview of your rental activity.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard icon={<Icons.ShieldCheckIcon className="w-6 h-6 text-blue-800"/>} title="Verification Status" value={<KycStatusBadge status={user.kycStatus} large />} color="bg-blue-100" />
                <StatCard icon={<Icons.BanknotesIcon className="w-6 h-6 text-red-800"/>} title="Upcoming Payments" value={[...rentBillableItems, ...utilityBillItems].filter(i => i.status === 'Unpaid' || i.status === 'Pending').length} color="bg-red-100" />
                <StatCard icon={<Icons.DocumentCheckIcon className="w-6 h-6 text-green-800"/>} title="Active Rentals" value={activeAgreements.length} color="bg-green-100" />
                <StatCard icon={<Icons.PencilIcon className="w-6 h-6 text-indigo-800"/>} title="Pending Agreements" value={pendingAgreementSignatures} color="bg-indigo-100" />
            </div>
            
            {actionItems.length > 0 && (
                <div className="bg-white p-6 rounded-lg shadow-md border">
                    <h3 className="text-xl font-semibold text-neutral-800 mb-4 flex items-center gap-2"><Icons.ExclamationTriangleIcon className="w-6 h-6 text-yellow-500"/> Action Items</h3>
                    <div className="space-y-3">
                        {actionItems.map(item => (
                            <div key={item.id} className="p-3 bg-neutral-50 rounded-lg border flex justify-between items-center">
                                <div className="flex items-center gap-3">{item.icon} <p className="text-sm font-medium text-neutral-700">{item.text}</p></div>
                                <button onClick={item.action} className="text-sm font-semibold text-primary hover:underline">Take Action &rarr;</button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {[...rentBillableItems, ...utilityBillItems].filter(i => i.status === 'Unpaid').length > 0 && (
                 <div className="bg-white p-6 rounded-lg shadow-md border">
                    <h3 className="text-xl font-semibold text-neutral-800 mb-4 flex items-center gap-2"><Icons.CalendarDaysIcon className="w-6 h-6 text-blue-500"/> Upcoming Payments</h3>
                    <div className="space-y-4">{[...rentBillableItems, ...utilityBillItems].filter(item => item.status === 'Unpaid').slice(0,3).map(item => <BillCard key={item.id} item={item} />)}</div>
                </div>
            )}
        </div>
    );
    
    const renderVerification = () => (
        <div className="bg-white p-6 rounded-lg shadow-md border">
            <h3 className="text-2xl font-bold text-neutral-800 mb-2 flex items-center gap-2">
                <Icons.ShieldCheckIcon className="w-6 h-6 text-primary"/>
                Police Verification
            </h3>
            <p className="text-neutral-600 mb-6">Complete the background check form as required by local authorities. This information is shared securely with the property owner for verification purposes.</p>
            
            {verification.status === VerificationStatus.VERIFIED && (
                <div className="p-6 bg-green-50 text-green-800 rounded-lg text-center flex items-center justify-center gap-2 border border-green-200">
                    <Icons.CheckCircleIcon className="w-6 h-6" /> Your profile verification is complete and approved.
                </div>
            )}
            {verification.status === VerificationStatus.PENDING && (
                <div className="p-6 bg-yellow-50 text-yellow-800 rounded-lg text-center flex items-center justify-center gap-2 border border-yellow-200">
                    <Icons.ClockIcon className="w-6 h-6" /> Your verification is under review by the property owner.
                </div>
            )}
            {(verification.status === VerificationStatus.NOT_SUBMITTED || verification.status === VerificationStatus.REJECTED) && (
                <>
                    {verification.status === VerificationStatus.REJECTED && (
                        <div className="p-4 mb-4 bg-red-50 text-red-800 rounded-lg border border-red-200">
                            Your previous verification submission was rejected. Please review the details and resubmit.
                        </div>
                    )}
                    <PoliceVerificationForm 
                        verification={verification}
                        onSubmit={onSubmitVerification}
                        user={user}
                    />
                </>
            )}
        </div>
    );
    
    const renderViewings = () => {
        const sortedViewings = [...viewings].sort((a, b) => new Date(b.viewing.requestedAt).getTime() - new Date(a.viewing.requestedAt).getTime());
        const getViewingStatusInfo = (status: ViewingStatus) => {
                switch (status) {
                    case ViewingStatus.REQUESTED: return { text: 'Requested', color: 'bg-yellow-100 text-yellow-800' };
                    case ViewingStatus.ACCEPTED: return { text: 'Accepted', color: 'bg-green-100 text-green-800' };
                    case ViewingStatus.DECLINED: return { text: 'Declined', color: 'bg-red-100 text-red-800' };
                    case ViewingStatus.COMPLETED: return { text: 'Decision Required', color: 'bg-blue-100 text-blue-800' };
                    case ViewingStatus.CANCELLED: return { text: 'Cancelled', color: 'bg-gray-100 text-gray-800' };
                    case ViewingStatus.TENANT_REJECTED: return { text: 'Not Interested', color: 'bg-gray-100 text-gray-800' };
                    default: return { text: 'Unknown', color: 'bg-gray-100 text-gray-800' };
                }
            };
        return (
            <div className="bg-white p-6 rounded-lg shadow-md border">
                <h3 className="text-2xl font-bold text-neutral-800 mb-4">My Viewings</h3>
                {sortedViewings.length > 0 ? (
                    <div className="space-y-4">
                        {sortedViewings.map(({ viewing, property }) => {
                            const statusInfo = getViewingStatusInfo(viewing.status);
                            const scheduledDate = viewing.scheduledAt ? new Date(viewing.scheduledAt) : null;
                            const canCancel = [ViewingStatus.REQUESTED, ViewingStatus.ACCEPTED].includes(viewing.status);

                            return (
                                <div key={viewing.id} className="p-4 border rounded-lg flex flex-col sm:flex-row gap-4">
                                    <img src={property.images[0]} alt={property.title} className="w-full sm:w-40 h-32 object-cover rounded-md" />
                                    <div className="flex-grow">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h4 className="font-bold">{property.title}</h4>
                                                <p className="text-xs text-neutral-500">{property.address}</p>
                                            </div>
                                            <span className={`px-2 py-1 text-xs font-bold rounded-full ${statusInfo.color}`}>{statusInfo.text}</span>
                                        </div>
                                        {scheduledDate && (
                                            <div className="text-sm text-neutral-600 mt-2">
                                                <p><strong>Scheduled for:</strong> {scheduledDate.toLocaleString()}</p>
                                            </div>
                                        )}
                                        {viewing.status === ViewingStatus.COMPLETED ? (
                                            <div className="mt-4 pt-4 border-t border-dashed">
                                                <h5 className="font-semibold text-md text-neutral-800 mb-2">What's your decision?</h5>
                                                <p className="text-xs text-neutral-500 mb-3">Let the owner know if you'd like to proceed with renting this property.</p>
                                                <div className="flex flex-col sm:flex-row gap-3">
                                                    <button onClick={() => onConfirmRent(viewing.id)} className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-md text-sm transition-colors">
                                                        <Icons.CheckCircleIcon className="w-5 h-5"/> I'm Interested
                                                    </button>
                                                    <button onClick={() => onTenantReject(viewing.id)} className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-neutral-200 hover:bg-neutral-300 text-neutral-800 font-semibold rounded-md text-sm transition-colors">
                                                        <Icons.XCircleIcon className="w-5 h-5"/> Not Interested
                                                    </button>
                                                </div>
                                                <p className="text-xs text-neutral-500 mt-2 text-center">If you're not interested, your viewing advance will be refunded.</p>
                                            </div>
                                        ) : (
                                            <div className="mt-3 pt-3 border-t flex flex-wrap gap-2 items-center">
                                                {canCancel && (
                                                    <button onClick={() => onCancelViewing(viewing.id)} className="px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-md text-xs">Cancel Viewing</button>
                                                )}
                                                <button onClick={() => onRaiseDispute(viewing.id, 'Viewing')} className="px-3 py-1.5 bg-neutral-200 hover:bg-neutral-300 text-neutral-800 font-semibold rounded-md text-xs">Raise Dispute</button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="text-center py-12">
                        <Icons.CalendarDaysIcon className="w-12 h-12 mx-auto text-neutral-300" />
                        <h3 className="mt-2 text-xl font-semibold text-neutral-700">No Scheduled Viewings</h3>
                        <p className="mt-1 text-neutral-500">When you request to see a property, it will appear here.</p>
                    </div>
                )}
            </div>
        );
    };

    const renderMyRentals = () => {
        const onboardingApplications = applications.filter(({ application }) => 
            !application.id.startsWith('rent-') && 
            !application.id.startsWith('deposit-') &&
            application.status !== ApplicationStatus.REJECTED &&
            application.status !== ApplicationStatus.COMPLETED &&
            !agreements.some(a => `agree-${application.id}` === a.agreement.id)
        );

        const activeAndCompletedRentals = agreements;

        return (
            <div className="bg-white p-6 rounded-lg shadow-md border space-y-8">
                <div>
                    <h3 className="text-2xl font-bold text-neutral-800 mb-4">My Active Rentals</h3>
                    {activeAndCompletedRentals.length > 0 ? (
                        <div className="space-y-8">
                            {activeAndCompletedRentals.map(({ agreement, property }) => {
                                const allPropertyApplications = applications
                                    .filter(a => a.application.propertyId === property.id)
                                    .map(a => a.application);

                                return (
                                <div key={agreement.id} className="p-6 border rounded-lg shadow-sm">
                                    <div className="flex flex-col sm:flex-row gap-6 mb-4">
                                        <img src={property.images[0]} alt={property.title} className="w-full sm:w-48 h-40 object-cover rounded-md" />
                                        <div className="flex-grow">
                                            <h4 className="text-lg font-bold">{property.title}</h4>
                                            <p className="text-xs text-neutral-500">{property.address}</p>
                                            <p className="text-sm mt-2"><strong>Lease Term:</strong> {new Date(agreement.startDate).toLocaleDateString()} to {new Date(agreement.endDate).toLocaleDateString()}</p>
                                            <p className="text-sm mt-1"><strong>Monthly Rent:</strong> ₹{agreement.rentAmount.toLocaleString()}</p>
                                        </div>
                                    </div>
                                    <RentCycleTracker
                                        agreement={agreement}
                                        property={property}
                                        applications={allPropertyApplications}
                                        onPayNow={onInitiatePaymentFlow}
                                        payments={payments}
                                    />
                                </div>
                            )})}
                        </div>
                    ) : (
                         <div className="text-center py-12">
                            <Icons.HomeIcon className="w-12 h-12 mx-auto text-neutral-300" />
                            <h3 className="mt-2 text-xl font-semibold text-neutral-700">No Active Rentals</h3>
                            <p className="mt-1 text-neutral-500">Your active rentals will appear here once the agreement is complete.</p>
                         </div>
                    )}
                </div>
                
                <div className="pt-8 border-t">
                     <h3 className="text-2xl font-bold text-neutral-800 mb-4">My Pending Applications</h3>
                     {onboardingApplications.length > 0 ? (
                        <div className="space-y-8">
                             {onboardingApplications.map(({ application, property }) => {
                                const effectiveStatus = applications.find(a => a.application.id === `deposit-${application.id}`)?.application.status || application.status;
                                return (
                                    <div key={application.id} className="p-6 border rounded-lg shadow-sm">
                                        <div className="flex flex-col sm:flex-row gap-6 mb-4">
                                            <img src={property.images[0]} alt={property.title} className="w-full sm:w-48 h-40 object-cover rounded-md" />
                                            <div>
                                                <h4 className="text-lg font-bold">{property.title}</h4>
                                                <p className="text-xs text-neutral-500">{property.address}</p>
                                            </div>
                                        </div>
                                        <OnboardingTracker status={effectiveStatus} />
                                    </div>
                                );
                            })}
                        </div>
                     ) : (
                        <div className="text-center py-12">
                            <Icons.DocumentTextIcon className="w-12 h-12 mx-auto text-neutral-300" />
                            <h3 className="mt-2 text-xl font-semibold text-neutral-700">No Pending Applications</h3>
                            <button onClick={onBrowseClick} className="mt-4 px-4 py-2 bg-primary hover:bg-secondary text-white font-semibold rounded-md text-sm transition-colors duration-300">
                                Find Your Next Home
                            </button>
                        </div>
                     )}
                </div>
            </div>
        );
    };

    const renderSavedProperties = () => (
        <div className="bg-white p-6 rounded-lg shadow-md border">
            <h3 className="text-2xl font-bold text-neutral-800 mb-4 flex items-center gap-2">
                <Icons.HeartIcon className="w-6 h-6 text-primary" />
                Saved Properties
            </h3>
            {savedProperties.length > 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {savedProperties.map(property => (
                        <PropertyCard
                            key={property.id}
                            property={property}
                            owner={users.find(u => u.id === property.ownerId)}
                            onSelectProperty={onSelectProperty}
                            isSaved={true}
                            onToggleSave={onToggleSaveProperty}
                            currentUser={user}
                        />
                    ))}
                </div>
            ) : (
                <div className="text-center py-12">
                    <Icons.HeartIcon className="w-12 h-12 mx-auto text-neutral-300" />
                    <h3 className="mt-2 text-xl font-semibold text-neutral-700">No Saved Properties</h3>
                    <p className="mt-1 text-neutral-500">When you save a property, it will appear here.</p>
                    <button
                        onClick={onBrowseClick}
                        className="mt-4 px-4 py-2 bg-primary hover:bg-secondary text-white font-semibold rounded-md text-sm transition-colors duration-300"
                    >
                        Start Browsing
                    </button>
                </div>
            )}
        </div>
    );

    const renderUtilityBills = () => (
        <div className="bg-white p-6 rounded-lg shadow-md border">
            <h3 className="text-2xl font-bold text-neutral-800 mb-2 flex items-center gap-2">
                <Icons.BoltIcon className="w-6 h-6 text-primary" />
                Utility Bills
            </h3>
            <p className="text-neutral-600 mb-6">Track and pay your electricity, water, and maintenance bills.</p>

            {utilityBillItems.length > 0 ? (
                <div className="space-y-4">
                    {utilityBillItems.map(item => <BillCard key={item.id} item={item} />)}
                </div>
            ) : (
                <div className="text-center py-12">
                    <Icons.CheckCircleIcon className="w-12 h-12 mx-auto text-green-400" />
                    <h3 className="mt-2 text-xl font-semibold text-neutral-700">No Utility Bills</h3>
                    <p className="mt-1 text-neutral-500">Your owner hasn't generated any utility bills yet.</p>
                </div>
            )}
        </div>
    );

    const renderRentPayments = () => (
         <div className="bg-white p-6 rounded-lg shadow-md border">
            <h3 className="text-2xl font-bold text-neutral-800 mb-2 flex items-center gap-2">
                <Icons.BanknotesIcon className="w-6 h-6 text-primary" />
                Rent & Deposit Payments
            </h3>
            <p className="text-neutral-600 mb-6">Manage your monthly rent and security deposit payments.</p>

            {rentBillableItems.length > 0 ? (
                <div className="space-y-4">
                    {rentBillableItems.map(item => <BillCard key={item.id} item={item} />)}
                </div>
            ) : (
                <div className="text-center py-12">
                    <Icons.CheckCircleIcon className="w-12 h-12 mx-auto text-green-400" />
                    <h3 className="mt-2 text-xl font-semibold text-neutral-700">No Rent Payments Due</h3>
                    <p className="mt-1 text-neutral-500">Your rent payments will appear here as they become due.</p>
                </div>
            )}
        </div>
    );


    const renderPastRentals = () => {
        const pastAgreements = agreements.filter(a => new Date(a.agreement.endDate) < new Date());
    
        return (
            <div className="bg-white p-6 rounded-lg shadow-md border">
                <h3 className="text-2xl font-bold text-neutral-800 mb-4">Past Rentals</h3>
                {pastAgreements.length > 0 ? (
                    <div className="space-y-4">
                        {pastAgreements.map(({ agreement, property }) => (
                            <div key={agreement.id} className="p-4 border rounded-lg flex flex-col sm:flex-row justify-between items-center gap-4">
                                <div>
                                    <h4 className="font-bold">{property.title}</h4>
                                    <p className="text-sm text-neutral-500">Lease Ended: {new Date(agreement.endDate).toLocaleDateString()}</p>
                                </div>
                                {agreement.reviewLeft ? (
                                    <p className="text-sm font-semibold text-green-600 flex items-center gap-1"><Icons.CheckCircleIcon className="w-4 h-4"/> Review Submitted</p>
                                ) : (
                                    <button onClick={() => setReviewingAgreement({ agreement, property })} className="px-4 py-2 bg-secondary text-white font-semibold rounded-md text-sm">
                                        Leave a Review
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-12 text-neutral-500">
                        <Icons.ArrowLeftIcon className="w-12 h-12 mx-auto text-neutral-300" />
                        <h3 className="mt-2 text-xl font-semibold text-neutral-700">No Past Rentals</h3>
                        <p className="mt-1">Your completed rental agreements will appear here.</p>
                    </div>
                )}
            </div>
        );
    };

    const renderMaintenance = () => {
        const sortedRequests = [...maintenanceRequests].sort((a, b) => {
            if (requestSortBy === 'dueDate-asc') return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
            if (requestSortBy === 'dueDate-desc') return new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime();
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(); // Default: newest first
        });

        const filteredRequests = sortedRequests.filter(r => {
            if (requestFilterStatus !== 'All' && r.status !== requestFilterStatus) return false;
            if (requestFilterProperty !== 'All' && r.propertyId !== requestFilterProperty) return false;
            if (requestFilterAssignee !== 'All' && r.assignedToId !== requestFilterAssignee) return false;
            return true;
        });

        return (
            <div className="space-y-8">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h2 className="text-3xl font-bold text-neutral-900">Maintenance Requests</h2>
                        <p className="text-neutral-600">Report issues and track maintenance for your property.</p>
                    </div>
                    <button onClick={() => setIsCreateRequestModalOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-secondary text-white font-semibold rounded-lg transition-colors duration-300 w-full sm:w-auto">
                        <Icons.PlusCircleIcon className="w-5 h-5" /> Create New Request
                    </button>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm border">
                     <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-4 pb-4 border-b">
                        <select value={requestFilterStatus} onChange={e => setRequestFilterStatus(e.target.value as any)} className="p-2 border rounded-md text-sm"><option value="All">All Statuses</option>{Object.values(MaintenanceStatus).map(s => <option key={s} value={s}>{s}</option>)}</select>
                        <select value={requestFilterProperty} onChange={e => setRequestFilterProperty(e.target.value)} className="p-2 border rounded-md text-sm"><option value="All">All Properties</option>{propertiesForMaintenance.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}</select>
                        <select value={requestSortBy} onChange={e => setRequestSortBy(e.target.value)} className="p-2 border rounded-md text-sm"><option value="createdAt-desc">Newest First</option><option value="dueDate-asc">Due Date (Asc)</option><option value="dueDate-desc">Due Date (Desc)</option></select>
                     </div>
                     <div className="space-y-4">
                        {filteredRequests.length > 0 ? filteredRequests.map(req => (
                            <MaintenanceRequestCard key={req.id} request={req} users={users} properties={properties} currentUser={user} onUpdateStatus={onUpdateMaintenanceStatus} onAddComment={onAddMaintenanceComment} />
                        )) : <p className="text-center py-8 text-neutral-500">No maintenance requests found.</p>}
                     </div>
                </div>
            </div>
        );
    };

    const renderContent = () => {
        switch (activeTab) {
            case 'overview': return renderOverview();
            case 'verification': return renderVerification();
            case 'viewings': return renderViewings();
            case 'saved': return renderSavedProperties();
            case 'myRentals': return renderMyRentals();
            case 'bills': return renderUtilityBills();
            case 'rent': return renderRentPayments();
            case 'pastRentals': return renderPastRentals();
            case 'maintenance': return renderMaintenance();
            default: return renderOverview();
        }
    };
    
    const sidebarOptions = [
        {id: "overview", label: "Overview", icon: <Icons.Squares2X2Icon className="w-5 h-5"/>, count: undefined},
        {id: "myRentals", label: "Applications & Tenancy", icon: <Icons.DocumentTextIcon className="w-5 h-5"/>, count: pendingAgreementSignatures},
        {id: "rent", label: "Rent Payments", icon: <Icons.BanknotesIcon className="w-5 h-5"/>, count: rentBillableItems.filter(i => i.status !== 'Paid').length},
        {id: "bills", label: "Utility Bills", icon: <Icons.BoltIcon className="w-5 h-5"/>, count: bills.filter(b => !b.isPaid).length},
        {id: "maintenance", label: "Maintenance", icon: <Icons.ClipboardDocumentListIcon className="w-5 h-5"/>, count: maintenanceRequests.filter(t => t.status !== MaintenanceStatus.DONE).length},
        {id: "viewings", label: "My Viewings", icon: <Icons.CalendarDaysIcon className="w-5 h-5"/>, count: undefined},
        {id: "saved", label: "Saved Properties", icon: <Icons.HeartIcon className="w-5 h-5"/>, count: undefined},
        {id: "pastRentals", label: "Past Rentals", icon: <Icons.ArrowLeftIcon className="w-5 h-5" />, count: undefined},
        {id: "verification", label: "Verification", icon: <Icons.ShieldCheckIcon className="w-5 h-5"/>, count: undefined},
    ];

    // Final JSX
    return (
        <div className="h-[calc(100vh-4rem)] flex flex-col md:flex-row container mx-auto px-4 md:px-8 py-8 gap-8">
            {isCreateRequestModalOpen && <CreateMaintenanceRequestModal onClose={() => setIsCreateRequestModalOpen(false)} onSubmit={onAddMaintenanceRequest} properties={propertiesForMaintenance} users={relevantUsersForMaintenance} currentUser={user} agreements={agreements}/>}
            {reviewingAgreement && (
                <LeaveReviewModal
                    details={reviewingAgreement}
                    onClose={() => setReviewingAgreement(null)}
                    onSubmit={handleReviewSubmit}
                />
            )}
            
            <aside className="hidden md:block md:w-1/4 lg:w-1/5 flex-shrink-0">
                <div className="bg-white p-4 rounded-lg shadow-md border space-y-2 sticky top-24">
                    {sidebarOptions.map(opt => <SidebarButton key={opt.id} {...opt} activeTab={activeTab} onTabChange={onTabChange} />)}
                </div>
            </aside>
            <main className="flex-grow min-w-0 overflow-y-auto custom-scrollbar">
                <div className="md:hidden mb-4">
                    <label htmlFor="dashboard-nav" className="sr-only">Select a section</label>
                    <select id="dashboard-nav" value={activeTab} onChange={(e) => onTabChange(e.target.value)} className="w-full p-3 border rounded-lg shadow-sm text-lg font-semibold">
                       {sidebarOptions.map(opt => <option key={opt.id} value={opt.id}>{opt.label}</option>)}
                    </select>
                </div>
                {renderContent()}
            </main>
        </div>
    );
};

export default RenterDashboard;