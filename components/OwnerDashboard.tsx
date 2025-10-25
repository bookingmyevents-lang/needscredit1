import React, { useState, useMemo, useEffect } from 'react';
import type { Property, Viewing, User, Application, Agreement, Payment, MaintenanceRequest, Bill, Verification, PoliceVerificationFormData } from '../types';
import { ViewingStatus, ApplicationStatus, PaymentType, MaintenanceStatus, BillType, VerificationStatus, UserRole } from '../types';
import * as Icons from './Icons';
import CreateMaintenanceRequestModal from './CreateMaintenanceRequestModal';
import MaintenanceRequestCard from './MaintenanceRequestCard';
import OnboardingTracker from './OnboardingTracker';
import RentCycleTracker from './RentCycleTracker';


// Component-specific props
interface OwnerDashboardProps {
  user: User;
  properties: Property[];
  viewings: { viewing: Viewing, tenant: User, property: Property }[];
  applications: { application: Application, renter: User, property: Property }[];
  agreements: { agreement: Agreement, property: Property }[];
  paymentHistory: { payment: Payment; tenantName: string; propertyTitle: string; }[];
  maintenanceRequests: MaintenanceRequest[];
  users: User[];
  bills: Bill[];
  verifications: Verification[];
  activeTab: string;
  onTabChange: (tab: string) => void;
  onUpdateViewingStatus: (viewingId: string, status: ViewingStatus) => void;
  onUpdateApplicationStatus: (applicationId: string, status: ApplicationStatus) => void;
  onEditProperty: (property: Property) => void;
  onPostPropertyClick: () => void;
  onSignAgreement: (agreement: Agreement, property: Property) => void;
  onViewAgreementDetails: (agreement: Agreement, property: Property) => void;
  onPayPlatformFee: (applicationId: string) => void;
  onAcknowledgeOfflinePayment: (applicationId: string) => void;
  onMarkAsRented: (propertyId: string) => void;
  onInitiateFinalizeAgreement: (application: Application, property: Property) => void;
  onConfirmDepositPayment: (applicationId: string) => void;
  onConfirmKeyHandover: (applicationId: string) => void;
  onAddMaintenanceRequest: (requestData: Omit<MaintenanceRequest, 'id' | 'createdAt' | 'status' | 'createdBy'>) => void;
  onUpdateMaintenanceStatus: (requestId: string, status: MaintenanceStatus) => void;
  onAddMaintenanceComment: (requestId: string, commentText: string) => void;
  onGenerateBill: (billData: Omit<Bill, 'id' | 'isPaid'>) => void;
  onUpdateKycStatus: (userId: string, status: 'Verified' | 'Rejected') => void;
}

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

const StatCard: React.FC<{ icon: React.ReactNode, title: string, value: string | number, color: string }> = ({ icon, title, value, color }) => (
    <div className="bg-white p-6 rounded-lg shadow-md border flex items-start gap-4">
        <div className={`p-3 rounded-full ${color}`}>{icon}</div>
        <div>
            <p className="text-3xl font-bold text-neutral-800">{value}</p>
            <h4 className="text-sm font-medium text-neutral-500">{title}</h4>
        </div>
    </div>
);

// ... Other card components (ViewingCard, ApplicationCard, etc.) would be defined here for cleanliness
// For brevity in this refactor, they will remain inside the main component render logic.

// Main Component
const OwnerDashboard: React.FC<OwnerDashboardProps> = (props) => {
    const { user, properties, viewings, applications, agreements, paymentHistory, maintenanceRequests, users, bills, verifications, activeTab, onTabChange, onUpdateKycStatus, ...handlers } = props;

    // ... State and Memos ...
    const [isCreateRequestModalOpen, setIsCreateRequestModalOpen] = useState(false);
    const [isCreateBillModalOpen, setIsCreateBillModalOpen] = useState(false);
    const [expandedPropertyId, setExpandedPropertyId] = useState<string | null>(null);
    const [expandedVerificationTenantId, setExpandedVerificationTenantId] = useState<string | null>(null);
    const [paymentFilters, setPaymentFilters] = useState({ propertyId: '', type: '', status: '' });
     const [newBillData, setNewBillData] = useState({
        propertyId: properties[0]?.id || '',
        tenantId: '',
        type: BillType.MAINTENANCE,
        amount: '',
        dueDate: new Date().toISOString().split('T')[0],
    });
    const [expandedViewingId, setExpandedViewingId] = useState<string | null>(null);

    const myTenantIds = useMemo(() => {
        const tenantIdSet = new Set<string>();
        applications.forEach(({ application }) => tenantIdSet.add(application.renterId));
        viewings.forEach(({ viewing }) => tenantIdSet.add(viewing.tenantId));
        agreements.forEach(({ agreement }) => tenantIdSet.add(agreement.tenantId));
        return Array.from(tenantIdSet);
    }, [applications, viewings, agreements]);

    const myVerifications = useMemo(() => {
        return verifications.filter(v => myTenantIds.includes(v.tenantId));
    }, [verifications, myTenantIds]);

    const pendingVerificationsCount = myVerifications.filter(v => v.status === VerificationStatus.PENDING).length;

    const pendingViewings = viewings.filter(v => v.viewing.status === ViewingStatus.REQUESTED);
    const pendingApplications = applications.filter(a => a.application.status === ApplicationStatus.PENDING);
    const activeRentals = agreements.filter(a => a.agreement.signedByOwner && a.agreement.signedByTenant).length;
    const totalEarnings = paymentHistory.filter(p => p.payment.status === 'Paid' && p.payment.type !== PaymentType.REFUND).reduce((sum, p) => sum + p.payment.amount, 0);

    const occupancy = useMemo(() => {
      const rented = properties.filter(p => p.availability === 'rented').length;
      const total = properties.length;
      return { rented, available: total - rented, total, percentage: total > 0 ? (rented / total) * 100 : 0 };
    }, [properties]);

    const recentActivities = useMemo(() => {
        const paymentActivities = paymentHistory.slice(0, 2).map(p => ({
            id: p.payment.id,
            icon: <Icons.CreditCardIcon className="w-5 h-5 text-green-500"/>,
            text: `Received ₹${p.payment.amount.toLocaleString()} from ${p.tenantName} for "${p.propertyTitle}".`,
            date: p.payment.paymentDate,
        }));
        const requestActivities = viewings.filter(v => v.viewing.status === ViewingStatus.REQUESTED).slice(0, 2).map(v => ({
            id: v.viewing.id,
            icon: <Icons.CalendarDaysIcon className="w-5 h-5 text-yellow-500"/>,
            text: `${v.tenant.name} requested a viewing for "${v.property.title}".`,
            date: v.viewing.requestedAt,
        }));
        return [...paymentActivities, ...requestActivities].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 4);
    }, [paymentHistory, viewings]);

    const propertiesWithTenants = useMemo(() => {
        return properties.map(p => {
            const activeAgreement = agreements.find(a => a.property.id === p.id && a.agreement.signedByOwner && a.agreement.signedByTenant);
            const tenant = activeAgreement ? users.find(u => u.id === activeAgreement.agreement.tenantId) : null;
            return { property: p, tenant, agreement: activeAgreement?.agreement };
        }).filter(item => item.tenant && item.agreement);
    }, [properties, agreements, users]);
    
     const tenantsForNewBill = useMemo(() => {
        if (!newBillData.propertyId) return [];
        const tenantIds = new Set(agreements.filter(a => a.property.id === newBillData.propertyId && a.agreement.signedByOwner && a.agreement.signedByTenant).map(a => a.agreement.tenantId));
        return users.filter(u => tenantIds.has(u.id));
    }, [newBillData.propertyId, agreements, users]);

    useEffect(() => {
        setNewBillData(prev => ({
            ...prev,
            tenantId: tenantsForNewBill[0]?.id || ''
        }));
    }, [tenantsForNewBill]);

    const handleNewBillChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setNewBillData(prev => ({ ...prev, [name]: value }));
    };

    const handleGenerateBillSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const { propertyId, tenantId, type, amount, dueDate } = newBillData;
        if (!propertyId || !tenantId || !amount || !dueDate) {
            alert("Please fill all fields.");
            return;
        }
        handlers.onGenerateBill({ propertyId, tenantId, type, amount: Number(amount), dueDate });
        setIsCreateBillModalOpen(false);
    };

    const filteredPaymentHistory = useMemo(() => {
        return paymentHistory.filter(p => {
            if (paymentFilters.propertyId && p.payment.propertyId !== paymentFilters.propertyId) return false;
            if (paymentFilters.type && p.payment.type !== paymentFilters.type) return false;
            if (paymentFilters.status && p.payment.status !== paymentFilters.status) return false;
            return true;
        });
    }, [paymentHistory, paymentFilters]);


    // Render Functions
    const renderOverview = () => (
        <div className="space-y-8">
            <div>
                <h2 className="text-3xl font-bold text-neutral-900">Owner Dashboard</h2>
                <p className="text-neutral-600">Manage your properties, tenants, and finances.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard icon={<Icons.BuildingIcon className="w-6 h-6 text-blue-800"/>} title="Total Properties" value={properties.length} color="bg-blue-100" />
                <StatCard icon={<Icons.UserGroupIcon className="w-6 h-6 text-green-800"/>} title="Active Rentals" value={activeRentals} color="bg-green-100" />
                <StatCard icon={<Icons.ExclamationTriangleIcon className="w-6 h-6 text-yellow-800"/>} title="Pending Actions" value={pendingViewings.length + pendingApplications.length} color="bg-yellow-100" />
                <StatCard icon={<Icons.BanknotesIcon className="w-6 h-6 text-indigo-800"/>} title="Total Earnings" value={`₹${(totalEarnings / 1000).toFixed(1)}k`} color="bg-indigo-100" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                <div className="lg:col-span-3 bg-white p-6 rounded-lg shadow-md border">
                    <h3 className="text-xl font-semibold text-neutral-800 mb-4">Pending Actions</h3>
                    {(pendingViewings.length + pendingApplications.length) === 0 ? <p className="text-center py-8 text-neutral-500">No pending actions right now.</p> : (
                        <div className="space-y-3">
                            {pendingViewings.map(v => (
                                <div key={v.viewing.id} className="p-3 bg-neutral-50 rounded-lg border flex justify-between items-center">
                                    <p className="text-sm font-medium text-neutral-700">{v.tenant.name} wants to view "{v.property.title}"</p>
                                    <button onClick={() => onTabChange('actions')} className="text-sm font-semibold text-primary hover:underline">View &rarr;</button>
                                </div>
                            ))}
                            {pendingApplications.map(a => (
                                <div key={a.application.id} className="p-3 bg-neutral-50 rounded-lg border flex justify-between items-center">
                                    <p className="text-sm font-medium text-neutral-700">{a.renter.name} applied for "{a.property.title}"</p>
                                    <button onClick={() => onTabChange('actions')} className="text-sm font-semibold text-primary hover:underline">View &rarr;</button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
                <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow-md border">
                    <h3 className="text-xl font-semibold text-neutral-800 mb-4">Property Occupancy</h3>
                    <div className="flex justify-between text-sm font-semibold text-neutral-600 mb-2">
                        <span>Rented: {occupancy.rented}</span>
                        <span>Available: {occupancy.available}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-4 relative">
                        <div className="bg-primary h-4 rounded-full" style={{ width: `${occupancy.percentage}%` }}></div>
                    </div>
                    <p className="text-right text-xs text-neutral-500 mt-1">{occupancy.percentage.toFixed(0)}% Occupied</p>
                </div>
            </div>

             <div className="bg-white p-6 rounded-lg shadow-md border">
                <h3 className="text-xl font-semibold text-neutral-800 mb-4">Recent Activity</h3>
                {recentActivities.length === 0 ? <p className="text-center py-8 text-neutral-500">No recent activity.</p> : (
                    <div className="space-y-3">
                        {recentActivities.map(act => (
                            <div key={act.id} className="p-3 flex items-center gap-3">
                                <div className="p-2 bg-neutral-100 rounded-full">{act.icon}</div>
                                <div>
                                    <p className="text-sm text-neutral-700">{act.text}</p>
                                    <p className="text-xs text-neutral-400">{new Date(act.date).toLocaleString()}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );

    const renderActions = () => {
        const viewingRequests = viewings.filter(v => v.viewing.status === ViewingStatus.REQUESTED);
        const rentalApplications = applications.filter(a => a.application.status === ApplicationStatus.PENDING);

        return (
            <div className="space-y-8">
                <div>
                    <h2 className="text-3xl font-bold text-neutral-900">Pending Actions</h2>
                    <p className="text-neutral-600">Review new viewing requests and rental applications.</p>
                </div>

                <div className="space-y-6">
                    <h3 className="text-xl font-semibold text-neutral-800 border-b pb-2">New Viewing Requests</h3>
                    {viewingRequests.length > 0 ? (
                        <div className="space-y-4">
                            {viewingRequests.map(({ viewing, tenant, property }) => {
                                const isExpanded = viewing.id === expandedViewingId;
                                return (
                                <div key={viewing.id} className="bg-white p-4 rounded-lg shadow-md border">
                                    <div className="flex flex-col sm:flex-row gap-4">
                                        <div className="flex-grow">
                                            <h4 className="font-bold">{property.title}</h4>
                                            <p className="text-xs text-neutral-500">{property.address}</p>
                                            
                                            <div className="mt-3 text-sm">
                                                <p><span className="font-semibold">Proposed Time:</span> {new Date(viewing.scheduledAt!).toLocaleString()}</p>
                                            </div>

                                             <div className="mt-4 pt-4 border-t">
                                                <button onClick={() => setExpandedViewingId(isExpanded ? null : viewing.id)} className="flex justify-between items-center w-full text-left font-semibold text-primary">
                                                    <span>Show Verification Details</span>
                                                    <Icons.ChevronDownIcon className={`w-5 h-5 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                                                </button>
                                                {isExpanded && viewing.verificationData && (
                                                    <div className="mt-2 p-4 bg-neutral-50 rounded-lg border text-sm space-y-2">
                                                        {Object.entries(viewing.verificationData).map(([key, value]) => (
                                                            <div key={key}>
                                                                <p className="font-medium text-neutral-500 capitalize">{key.replace(/([A-Z])/g, ' $1')}</p>
                                                                <p className="text-neutral-800">{String(value) || 'N/A'}</p>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex sm:flex-col justify-end sm:justify-center gap-2 flex-shrink-0">
                                            <button onClick={() => handlers.onUpdateViewingStatus(viewing.id, ViewingStatus.ACCEPTED)} className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-md text-sm">Approve</button>
                                            <button onClick={() => handlers.onUpdateViewingStatus(viewing.id, ViewingStatus.DECLINED)} className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-md text-sm">Decline</button>
                                        </div>
                                    </div>
                                </div>
                            )})}
                        </div>
                    ) : (
                        <p className="text-center py-8 text-neutral-500">No new viewing requests.</p>
                    )}
                </div>

                <div className="space-y-6">
                    <h3 className="text-xl font-semibold text-neutral-800 border-b pb-2">New Rental Applications</h3>
                    {rentalApplications.length > 0 ? (
                         <div className="space-y-4">
                            {rentalApplications.map(({ application, renter, property }) => (
                                <div key={application.id} className="bg-white p-4 rounded-lg shadow-md border flex justify-between items-center">
                                    <div>
                                        <h4 className="font-bold">{property.title}</h4>
                                        <p className="text-sm text-neutral-600">{renter.name} wants to move in on {new Date(application.moveInDate).toLocaleDateString()}.</p>
                                    </div>
                                     <button onClick={() => handlers.onInitiateFinalizeAgreement(application, property)} className="px-4 py-2 bg-primary hover:bg-secondary text-white font-semibold rounded-md text-sm whitespace-nowrap">Finalize Agreement</button>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-center py-8 text-neutral-500">No new rental applications.</p>
                    )}
                </div>
                 {(viewingRequests.length + rentalApplications.length) === 0 && <p className="text-center py-16 text-neutral-500 text-lg">You're all caught up!</p>}
            </div>
        );
    };

    const renderProperties = () => (
        <div className="space-y-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-bold text-neutral-900">My Properties</h2>
                    <p className="text-neutral-600">View and manage all your listed properties.</p>
                </div>
                <button onClick={handlers.onPostPropertyClick} className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-secondary text-white font-semibold rounded-lg transition-colors duration-300 w-full sm:w-auto">
                    <Icons.PlusCircleIcon className="w-5 h-5" /> Post New Property
                </button>
            </div>
            {properties.length > 0 ? (
                <div className="space-y-6">
                    {properties.map((property) => (
                        <div key={property.id} className="bg-white p-4 rounded-lg shadow-md border">
                            <div className="flex flex-col sm:flex-row gap-4">
                                <img src={property.images[0]} alt={property.title} className="w-full sm:w-48 h-40 object-cover rounded-lg" />
                                <div className="flex-grow">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h3 className="text-xl font-bold">{property.title}</h3>
                                            <p className="text-sm text-neutral-500">{property.address}</p>
                                        </div>
                                        <span className={`px-2 py-1 text-xs font-bold rounded-full capitalize ${property.availability === 'available' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{property.availability}</span>
                                    </div>
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4 text-sm border-t pt-4">
                                        <div><p className="font-semibold">Rent</p><p>₹{property.rent.toLocaleString()}</p></div>
                                        <div><p className="font-semibold">Beds</p><p>{property.bedrooms}</p></div>
                                        <div><p className="font-semibold">Baths</p><p>{property.bathrooms}</p></div>
                                        <div><p className="font-semibold">Sq.Ft</p><p>{property.sqft.toLocaleString()}</p></div>
                                    </div>
                                </div>
                            </div>
                            <div className="mt-4 pt-4 border-t flex flex-col sm:flex-row justify-between items-start gap-4">
                                <div>
                                    <h4 className="text-sm font-semibold">Current Tenant</h4>
                                    {propertiesWithTenants.find(pwt => pwt.property.id === property.id)?.tenant ? (
                                        <div className="flex items-center gap-3 mt-2">
                                            <img src={propertiesWithTenants.find(pwt => pwt.property.id === property.id)!.tenant!.profilePictureUrl} alt={propertiesWithTenants.find(pwt => pwt.property.id === property.id)!.tenant!.name} className="w-10 h-10 rounded-full" />
                                            <div>
                                                <p className="font-medium">{propertiesWithTenants.find(pwt => pwt.property.id === property.id)!.tenant!.name}</p>
                                            </div>
                                        </div>
                                    ) : <p className="text-sm text-neutral-500 mt-2">Currently available for rent.</p>}
                                </div>
                                <div className="flex items-center gap-2 self-start sm:self-end w-full sm:w-auto">
                                    <button onClick={() => handlers.onEditProperty(property)} className="flex-1 sm:flex-initial px-3 py-1.5 text-sm font-semibold text-primary hover:bg-primary/10 rounded-md">Edit</button>
                                    {property.availability === 'available' && <button onClick={() => handlers.onMarkAsRented(property.id)} className="flex-1 sm:flex-initial px-3 py-1.5 text-sm font-semibold bg-secondary text-white hover:bg-primary rounded-md">Mark as Rented</button>}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : <p className="text-center py-16 text-neutral-500 text-lg">You haven't listed any properties yet.</p>}
        </div>
    );
    
    const renderBills = () => (
         <div className="space-y-8">
             <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-bold text-neutral-900">Manage Bills</h2>
                    <p className="text-neutral-600">Generate and track utility and maintenance bills for your tenants.</p>
                </div>
                <button onClick={() => setIsCreateBillModalOpen(true)} className="flex items-center justify-center gap-2 px-4 py-2 bg-primary hover:bg-secondary text-white font-semibold rounded-lg transition-colors duration-300 w-full sm:w-auto">
                    <Icons.PlusCircleIcon className="w-5 h-5" /> Generate New Bill
                </button>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md border">
                <h3 className="text-xl font-semibold mb-4">Generated Bills</h3>
                <div className="space-y-4">
                    {bills.length > 0 ? bills.map(bill => {
                        const tenant = users.find(u => u.id === bill.tenantId);
                        const property = properties.find(p => p.id === bill.propertyId);
                        return (
                             <div key={bill.id} className="p-3 border rounded-lg flex flex-col sm:flex-row justify-between items-start gap-2">
                                <div>
                                    <p className="font-semibold">{bill.type.replace('_', ' ')} Bill for {property?.title}</p>
                                    <p className="text-sm text-neutral-600">To: {tenant?.name || 'N/A'} | Due: {new Date(bill.dueDate).toLocaleDateString()}</p>
                                </div>
                                <div className="text-left sm:text-right">
                                    <p className="font-bold text-lg">₹{bill.amount.toLocaleString()}</p>
                                    <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${bill.isPaid ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>{bill.isPaid ? 'Paid' : 'Unpaid'}</span>
                                </div>
                            </div>
                        );
                    }) : <p className="text-center py-8 text-neutral-500">No bills have been generated yet.</p>}
                </div>
            </div>
         </div>
    );

    const renderPaymentHistory = () => (
        <div className="space-y-8">
            <div>
                <h2 className="text-3xl font-bold text-neutral-900">Payment History</h2>
                <p className="text-neutral-600">Track all incoming payments for your properties.</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md border">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-4 pb-4 border-b">
                    <select value={paymentFilters.propertyId} onChange={e => setPaymentFilters({...paymentFilters, propertyId: e.target.value})} className="p-2 border rounded-md text-sm"><option value="">All Properties</option>{properties.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}</select>
                    <select value={paymentFilters.type} onChange={e => setPaymentFilters({...paymentFilters, type: e.target.value})} className="p-2 border rounded-md text-sm"><option value="">All Types</option>{Object.values(PaymentType).map(t => <option key={t} value={t}>{t}</option>)}</select>
                    <select value={paymentFilters.status} onChange={e => setPaymentFilters({...paymentFilters, status: e.target.value})} className="p-2 border rounded-md text-sm"><option value="">All Statuses</option><option value="Paid">Paid</option><option value="Failed">Failed</option><option value="Refunded">Refunded</option></select>
                    <button onClick={() => setPaymentFilters({ propertyId: '', type: '', status: '' })} className="text-sm font-semibold text-primary hover:underline justify-self-start sm:justify-self-auto">Clear Filters</button>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50"><tr><th className="px-4 py-3 text-left text-xs font-medium">Date</th><th className="px-4 py-3 text-left text-xs font-medium">Tenant</th><th className="px-4 py-3 text-left text-xs font-medium">Property</th><th className="px-4 py-3 text-left text-xs font-medium">Type</th><th className="px-4 py-3 text-right text-xs font-medium">Amount</th><th className="px-4 py-3 text-center text-xs font-medium">Status</th></tr></thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredPaymentHistory.map(({ payment, tenantName, propertyTitle }) => (
                                <tr key={payment.id}>
                                    <td className="px-4 py-3 text-sm">{new Date(payment.paymentDate).toLocaleDateString()}</td>
                                    <td className="px-4 py-3 text-sm">{tenantName}</td>
                                    <td className="px-4 py-3 text-sm">{propertyTitle}</td>
                                    <td className="px-4 py-3 text-sm">{payment.type}</td>
                                    <td className="px-4 py-3 text-sm text-right font-semibold">₹{payment.amount.toLocaleString()}</td>
                                    <td className="px-4 py-3 text-center"><span className={`px-2 py-0.5 text-xs rounded-full ${payment.status === 'Paid' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{payment.status}</span></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                     {filteredPaymentHistory.length === 0 && <p className="text-center py-8 text-neutral-500">No payments match your filters.</p>}
                </div>
            </div>
        </div>
    );

    const renderOnboarding = () => {
        const onboardingApplications = applications.filter(({ application }) => 
            !application.id.startsWith('rent-') && 
            !application.id.startsWith('deposit-') &&
            application.status !== ApplicationStatus.REJECTED
        );

        const sortedApplications = [...onboardingApplications].sort((a, b) => {
            const isACompleted = a.application.status === ApplicationStatus.COMPLETED;
            const isBCompleted = b.application.status === ApplicationStatus.COMPLETED;
            if (isACompleted && !isBCompleted) return 1;
            if (!isACompleted && isBCompleted) return -1;
            return new Date(b.application.moveInDate).getTime() - new Date(a.application.moveInDate).getTime();
        });

        const getEffectiveStatus = (app: Application): ApplicationStatus => {
            if ([ApplicationStatus.AGREEMENT_SIGNED, ApplicationStatus.DEPOSIT_PAID, ApplicationStatus.MOVE_IN_READY, ApplicationStatus.COMPLETED].includes(app.status)) {
                const depositApp = applications.find(a => a.application.id === `deposit-${app.id}`);
                if (depositApp) {
                    return depositApp.application.status;
                }
            }
            return app.status;
        };

        const getStatusDescription = (status: ApplicationStatus, renterName: string) => {
            switch (status) {
                case ApplicationStatus.PENDING: return "The application is awaiting your review.";
                case ApplicationStatus.APPROVED: return "You have approved the application. Please finalize and send the rental agreement.";
                case ApplicationStatus.AGREEMENT_SENT: return `The rental agreement has been sent to ${renterName}. Waiting for their signature.`;
                case ApplicationStatus.AGREEMENT_SIGNED: return "The tenant has signed. Please countersign to proceed to payment.";
                case ApplicationStatus.DEPOSIT_DUE: return `Waiting for ${renterName} to pay the security deposit and first month's rent.`;
                case ApplicationStatus.DEPOSIT_PAID: return `The tenant has paid the deposit. Please verify the payment in your bank account and confirm receipt.`;
                case ApplicationStatus.MOVE_IN_READY: return "Payment received and confirmed! The property is ready for key handover on the move-in date.";
                case ApplicationStatus.COMPLETED: return "The rental process is complete and the tenant has moved in.";
                default: return "The application is in progress.";
            }
        };
        
        const getActionForStatus = (originalApplication: Application, depositApplication: Application | undefined, property: Property, renter: User, effectiveStatus: ApplicationStatus) => {
            const agreement = agreements.find(a => `agree-${originalApplication.id}` === a.agreement.id)?.agreement;

            switch (effectiveStatus) {
                case ApplicationStatus.PENDING:
                    return (
                        <div className="flex items-center gap-2">
                            <button onClick={() => handlers.onInitiateFinalizeAgreement(originalApplication, property)} className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-md text-sm">Approve & Finalize</button>
                            <button onClick={() => handlers.onUpdateApplicationStatus(originalApplication.id, ApplicationStatus.REJECTED)} className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-md text-sm">Reject</button>
                        </div>
                    );
                case ApplicationStatus.APPROVED:
                    return <button onClick={() => handlers.onInitiateFinalizeAgreement(originalApplication, property)} className="px-4 py-2 bg-secondary hover:bg-primary text-white font-semibold rounded-md text-sm">Finalize Agreement</button>;
                case ApplicationStatus.AGREEMENT_SENT:
                     if (agreement?.signedByTenant && !agreement.signedByOwner) {
                        return <button onClick={() => handlers.onSignAgreement(agreement, property)} className="px-4 py-2 bg-secondary hover:bg-primary text-white font-semibold rounded-md text-sm">Countersign Agreement</button>;
                    }
                    return null;
                case ApplicationStatus.DEPOSIT_PAID:
                    if (depositApplication) {
                        return <button onClick={() => handlers.onConfirmDepositPayment(depositApplication.id)} className="px-4 py-2 bg-secondary hover:bg-primary text-white font-semibold rounded-md text-sm">Confirm Payment Received</button>;
                    }
                    return null;
                case ApplicationStatus.MOVE_IN_READY:
                    if (depositApplication) {
                        return <button onClick={() => handlers.onConfirmKeyHandover(depositApplication.id)} className="px-4 py-2 bg-secondary hover:bg-primary text-white font-semibold rounded-md text-sm">Confirm Key Handover</button>;
                    }
                    return null;
                default:
                    return null;
            }
        };

        return (
             <div className="space-y-8">
                <div>
                    <h2 className="text-3xl font-bold text-neutral-900">Tenant Onboarding</h2>
                    <p className="text-neutral-600">Track new tenants from application to move-in.</p>
                </div>
                {sortedApplications.length > 0 ? (
                    <div className="space-y-8">
                        {sortedApplications.map(({ application, property, renter }) => {
                            const depositApp = applications.find(a => a.application.id === `deposit-${application.id}`)?.application;
                            const effectiveStatus = depositApp ? depositApp.status : application.status;
                            return (
                                <div key={application.id} className="p-6 border rounded-lg shadow-sm bg-white">
                                    <div className="flex flex-col sm:flex-row gap-6">
                                        <img src={property.images[0]} alt={property.title} className="w-full sm:w-48 h-40 object-cover rounded-md" />
                                        <div className="flex-grow">
                                            <h4 className="text-lg font-bold">{property.title}</h4>
                                            <div className="flex items-center gap-3 mt-2">
                                                <img src={renter.profilePictureUrl || 'https://i.pravatar.cc/150'} alt={renter.name} className="w-10 h-10 rounded-full object-cover" />
                                                <div>
                                                    <p className="font-semibold">{renter.name}</p>
                                                    <p className="text-xs text-neutral-500">Move-in: {new Date(application.moveInDate).toLocaleDateString()}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="mt-6 pt-6 border-t">
                                        <div className="mb-12 overflow-x-auto pb-4">
                                            <OnboardingTracker status={effectiveStatus} />
                                        </div>
                                        <div className="p-4 bg-blue-50 rounded-lg text-center">
                                            <p className="font-semibold text-blue-800">Current Status</p>
                                            <p className="text-sm text-blue-700 mt-1">{getStatusDescription(effectiveStatus, renter.name)}</p>
                                        </div>
                                        <div className="mt-4 text-center">
                                            {getActionForStatus(application, depositApp, property, renter, effectiveStatus)}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="text-center py-12 bg-white rounded-lg shadow-sm border">
                        <Icons.DocumentTextIcon className="w-12 h-12 mx-auto text-neutral-300" />
                        <h3 className="mt-2 text-xl font-semibold text-neutral-700">No Active Applications</h3>
                        <p className="mt-1 text-neutral-500">New tenant applications for your properties will appear here.</p>
                    </div>
                )}
            </div>
        );
    };

     const renderActiveRentals = () => (
        <div className="space-y-8">
            <div>
                <h2 className="text-3xl font-bold text-neutral-900">Active Rentals</h2>
                <p className="text-neutral-600">Monitor payment schedules for your current tenants.</p>
            </div>
            {propertiesWithTenants.length > 0 ? (
                <div className="space-y-6">
                    {propertiesWithTenants.map(({ property, tenant, agreement }) => {
                        if (!tenant || !agreement) return null;

                        const relevantApplications = applications
                            .filter(a => a.application.propertyId === property.id && a.application.renterId === tenant.id)
                            .map(a => a.application);
                        
                        return (
                            <div key={property.id} className="bg-white p-6 rounded-lg shadow-md border">
                                <div className="flex flex-col sm:flex-row gap-6 mb-4">
                                    <img src={property.images[0]} alt={property.title} className="w-full sm:w-48 h-40 object-cover rounded-md" />
                                    <div className="flex-grow">
                                        <h3 className="text-xl font-bold">{property.title}</h3>
                                        <p className="text-sm text-neutral-500">{property.address}</p>
                                         <div className="flex items-center gap-3 mt-4 pt-4 border-t">
                                            <img src={tenant.profilePictureUrl} alt={tenant.name} className="w-10 h-10 rounded-full" />
                                            <div>
                                                <p className="font-semibold">{tenant.name}</p>
                                                <p className="text-xs text-neutral-500">Member since {new Date(agreement.startDate).getFullYear()}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <RentCycleTracker
                                    agreement={agreement}
                                    property={property}
                                    applications={relevantApplications}
                                    payments={paymentHistory.map(p => p.payment)}
                                />
                            </div>
                        );
                    })}
                </div>
            ) : <p className="text-center py-16 text-neutral-500 text-lg">You have no active rentals.</p>}
        </div>
    );


    const renderVerifications = () => {
        const sortedVerifications = [...myVerifications].sort((a, b) => {
            const statusOrder = { [VerificationStatus.PENDING]: 1, [VerificationStatus.NOT_SUBMITTED]: 2, [VerificationStatus.REJECTED]: 3, [VerificationStatus.VERIFIED]: 4 };
            return statusOrder[a.status] - statusOrder[b.status];
        });
    
        return (
            <div className="space-y-8">
                <div>
                    <h2 className="text-3xl font-bold text-neutral-900">Tenant KYC Verifications</h2>
                    <p className="text-neutral-600">Review and approve verification documents submitted by tenants.</p>
                </div>
                {sortedVerifications.length > 0 ? (
                    <div className="space-y-4">
                        {sortedVerifications.map(verification => {
                            const tenant = users.find(u => u.id === verification.tenantId);
                            if (!tenant) return null;
                            const isExpanded = expandedVerificationTenantId === verification.tenantId;
    
                            return (
                                <div key={verification.id} className="bg-white p-4 rounded-lg shadow-md border">
                                    <div className="flex justify-between items-center cursor-pointer" onClick={() => setExpandedVerificationTenantId(isExpanded ? null : verification.tenantId)}>
                                        <div className="flex items-center gap-4">
                                            <img src={tenant.profilePictureUrl || 'https://i.pravatar.cc/150'} alt={tenant.name} className="w-12 h-12 rounded-full object-cover" />
                                            <div>
                                                <h4 className="font-bold">{tenant.name}</h4>
                                                <p className="text-sm text-neutral-500">{tenant.email}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <span className={`px-2 py-1 text-xs font-bold rounded-full ${ {
                                                [VerificationStatus.PENDING]: 'bg-yellow-100 text-yellow-800',
                                                [VerificationStatus.VERIFIED]: 'bg-green-100 text-green-800',
                                                [VerificationStatus.REJECTED]: 'bg-red-100 text-red-800',
                                                [VerificationStatus.NOT_SUBMITTED]: 'bg-gray-100 text-gray-800',
                                            }[verification.status]}`}>{verification.status}</span>
                                            <Icons.ChevronDownIcon className={`w-5 h-5 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                                        </div>
                                    </div>
                                    {isExpanded && (
                                        <div className="mt-4 pt-4 border-t space-y-4">
                                            <h5 className="font-semibold">Submitted Information</h5>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2 text-sm p-4 bg-neutral-50 rounded-lg border">
                                                {Object.entries(verification.formData).map(([key, value]) => (
                                                    <div key={key}>
                                                        <p className="font-medium text-neutral-500 capitalize">{key.replace(/([A-Z])/g, ' $1')}</p>
                                                        <p className="text-neutral-800">{String(value) || 'N/A'}</p>
                                                    </div>
                                                ))}
                                            </div>
                                            {verification.status === VerificationStatus.PENDING && (
                                                <div className="flex justify-end gap-3">
                                                    <button onClick={() => onUpdateKycStatus(tenant.id, 'Rejected')} className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-md text-sm">Reject</button>
                                                    <button onClick={() => onUpdateKycStatus(tenant.id, 'Verified')} className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-md text-sm">Approve</button>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <p className="text-center py-16 text-neutral-500 text-lg">No verification requests from your tenants yet.</p>
                )}
            </div>
        );
    };
    
    const renderMaintenance = () => (
        <div className="space-y-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-bold text-neutral-900">Maintenance Requests</h2>
                    <p className="text-neutral-600">Track and manage maintenance tasks for your properties.</p>
                </div>
                <button onClick={() => setIsCreateRequestModalOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-secondary text-white font-semibold rounded-lg transition-colors duration-300 w-full sm:w-auto">
                    <Icons.PlusCircleIcon className="w-5 h-5" /> Create New Request
                </button>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md border">
                 <div className="space-y-4">
                    {maintenanceRequests.length > 0 ? maintenanceRequests.map(req => (
                        <MaintenanceRequestCard key={req.id} request={req} users={users} properties={properties} currentUser={user} onUpdateStatus={handlers.onUpdateMaintenanceStatus} onAddComment={handlers.onAddMaintenanceComment} />
                    )) : <p className="text-center py-8 text-neutral-500">No maintenance requests found.</p>}
                 </div>
            </div>
        </div>
    );

    const renderContent = () => {
        switch (activeTab) {
            case 'overview': return renderOverview();
            case 'actions': return renderActions();
            case 'properties': return renderProperties();
            case 'onboarding': return renderOnboarding();
            case 'activeRentals': return renderActiveRentals();
            case 'bills': return renderBills();
            case 'paymentHistory': return renderPaymentHistory();
            case 'verifications': return renderVerifications();
            case 'maintenance': return renderMaintenance();
            default: return renderOverview();
        }
    }
    
    const sidebarOptions = [
        {id: "overview", label: "Overview", icon: <Icons.Squares2X2Icon className="w-5 h-5"/>, count: undefined},
        {id: "properties", label: "My Properties", icon: <Icons.BuildingIcon className="w-5 h-5"/>, count: properties.length},
        {id: "onboarding", label: "Onboarding", icon: <Icons.DocumentTextIcon className="w-5 h-5"/>, count: applications.filter(a => a.application.status !== ApplicationStatus.COMPLETED && a.application.status !== ApplicationStatus.REJECTED).length},
        {id: "activeRentals", label: "Active Rentals", icon: <Icons.UserGroupIcon className="w-5 h-5" />, count: activeRentals},
        {id: "actions", label: "Pending Actions", icon: <Icons.ExclamationTriangleIcon className="w-5 h-5"/>, count: pendingViewings.length + pendingApplications.length},
        {id: "verifications", label: "KYC Verifications", icon: <Icons.DocumentCheckIcon className="w-5 h-5"/>, count: pendingVerificationsCount},
        {id: "maintenance", label: "Maintenance", icon: <Icons.ClipboardDocumentListIcon className="w-5 h-5"/>, count: maintenanceRequests.filter(t => t.status !== MaintenanceStatus.DONE).length},
        {id: "bills", label: "Bills", icon: <Icons.BanknotesIcon className="w-5 h-5"/>, count: undefined},
        {id: "paymentHistory", label: "Payment History", icon: <Icons.CreditCardIcon className="w-5 h-5"/>, count: undefined},
    ];

    return (
        <div className="h-[calc(100vh-4rem)] flex flex-col md:flex-row container mx-auto px-4 md:px-8 py-8 gap-8">
            {isCreateRequestModalOpen && <CreateMaintenanceRequestModal onClose={() => setIsCreateRequestModalOpen(false)} onSubmit={handlers.onAddMaintenanceRequest} properties={properties} users={users} currentUser={user} agreements={agreements}/>}
            {isCreateBillModalOpen && (
                 <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4">
                    <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md" onClick={e => e.stopPropagation()}>
                        <h3 className="text-xl font-bold mb-4">Generate New Bill</h3>
                        <form onSubmit={handleGenerateBillSubmit} className="space-y-4">
                            <div><label>Property</label><select name="propertyId" value={newBillData.propertyId} onChange={handleNewBillChange} className="w-full p-2 border rounded-md mt-1">{properties.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}</select></div>
                            <div><label>Tenant</label><select name="tenantId" value={newBillData.tenantId} onChange={handleNewBillChange} className="w-full p-2 border rounded-md mt-1" disabled={tenantsForNewBill.length === 0}>{tenantsForNewBill.length > 0 ? tenantsForNewBill.map(t => <option key={t.id} value={t.id}>{t.name}</option>) : <option>No active tenants</option>}</select></div>
                            <div><label>Bill Type</label><select name="type" value={newBillData.type} onChange={handleNewBillChange} className="w-full p-2 border rounded-md mt-1">{Object.values(BillType).map(t => <option key={t} value={t}>{t}</option>)}</select></div>
                            <div><label>Amount</label><input type="number" name="amount" value={newBillData.amount} onChange={handleNewBillChange} className="w-full p-2 border rounded-md mt-1" /></div>
                            <div><label>Due Date</label><input type="date" name="dueDate" value={newBillData.dueDate} onChange={handleNewBillChange} className="w-full p-2 border rounded-md mt-1" /></div>
                            <div className="flex justify-end gap-2 pt-4">
                                <button type="button" onClick={() => setIsCreateBillModalOpen(false)} className="px-4 py-2 bg-neutral-200 rounded-md">Cancel</button>
                                <button type="submit" className="px-4 py-2 bg-primary text-white rounded-md">Generate Bill</button>
                            </div>
                        </form>
                    </div>
                 </div>
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

export default OwnerDashboard;
