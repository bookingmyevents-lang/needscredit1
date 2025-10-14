import React, { useState, useMemo } from 'react';
import type { User, Agreement, Property, Viewing, Bill, Verification, Application, Payment } from '../types';
import { BillType, ApplicationStatus, PaymentType, ViewingStatus } from '../types';
import * as Icons from './Icons';
import VerificationForm from './VerificationForm';

interface TenantDashboardProps {
  user: User;
  agreements: { agreement: Agreement, property: Property }[];
  viewings: { viewing: Viewing, property: Property }[];
  applications: { application: Application, property: Property }[];
  payments: Payment[];
  properties: Property[];
  bills: Bill[];
  verification: Verification;
  onSubmitVerification: (formData: Record<string, any>) => void;
  onPayBill: (billId: string) => void;
  onRaiseDispute: (relatedId: string, type: 'Viewing' | 'Payment' | 'Property') => void;
  onViewAgreementDetails: (agreement: Agreement, property: Property) => void;
  onSignAgreement: (agreement: Agreement, property: Property) => void;
  onInitiatePaymentFlow: (application: Application, property: Property) => void;
  onConfirmRent: (viewingId: string) => void;
  onCancelViewing: (viewingId: string) => void;
}

const KycStatusBadge: React.FC<{ status: 'Verified' | 'Pending' | 'Rejected' | 'Not Verified', large?: boolean }> = ({ status, large = false }) => {
    const statusInfo = {
        Verified: { text: 'KYC Verified', color: 'bg-green-100 text-green-800', icon: <Icons.ShieldCheckIcon className="w-4 h-4" /> },
        Pending: { text: 'KYC Pending', color: 'bg-yellow-100 text-yellow-800', icon: <Icons.ClockIcon className="w-4 h-4" /> },
        Rejected: { text: 'KYC Rejected', color: 'bg-red-100 text-red-800', icon: <Icons.XCircleIcon className="w-4 h-4" /> },
        'Not Verified': { text: 'Not Verified', color: 'bg-gray-100 text-gray-800', icon: <Icons.ExclamationTriangleIcon className="w-4 h-4" /> },
    }[status];

    const sizeClass = large ? 'px-3 py-1.5 text-base' : 'px-2.5 py-1 text-xs';

    return (
        <span className={`inline-flex items-center gap-1.5 font-semibold rounded-full ${sizeClass} ${statusInfo.color}`}>
            {statusInfo.icon}
            {statusInfo.text}
        </span>
    );
};

const StatCard: React.FC<{ icon: React.ReactNode, title: string, value: React.ReactNode, color: string }> = ({ icon, title, value, color }) => (
    <div className="bg-white p-6 rounded-lg shadow-md border flex items-start gap-4">
        <div className={`p-3 rounded-full ${color}`}>
            {icon}
        </div>
        <div>
            {typeof value === 'string' || typeof value === 'number' ? <p className="text-3xl font-bold text-neutral-800">{value}</p> : value}
            <h4 className="text-sm font-medium text-neutral-500">{title}</h4>
        </div>
    </div>
);

const TenantDashboard: React.FC<TenantDashboardProps> = ({ user, agreements, viewings, applications, payments, properties, bills, verification, onSubmitVerification, onPayBill, onRaiseDispute, onViewAgreementDetails, onSignAgreement, onInitiatePaymentFlow, onConfirmRent, onCancelViewing }) => {
    const [activeTab, setActiveTab] = useState('agreements');
    const [filterType, setFilterType] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const [filterStartDate, setFilterStartDate] = useState('');
    const [filterEndDate, setFilterEndDate] = useState('');
    
    const rentDues = applications.filter(a => a.application.status === ApplicationStatus.RENT_DUE);
    const depositDues = applications.filter(a => a.application.status === ApplicationStatus.DEPOSIT_DUE);
    const offlinePending = applications.filter(a => a.application.status === ApplicationStatus.OFFLINE_PAYMENT_PENDING);
    const unpaidBills = bills.filter(b => !b.isPaid);
    const pendingAgreementSignatures = agreements.filter(a => a.agreement.signedByOwner && !a.agreement.signedByTenant).length;
    const sortedPayments = [...payments].sort((a, b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime());

    const filteredPayments = useMemo(() => {
        return sortedPayments.filter(payment => {
            if (filterType && payment.type !== filterType) return false;
            if (filterStatus && payment.status !== filterStatus) return false;
            
            const paymentDate = new Date(payment.paymentDate);
            if (filterStartDate && paymentDate < new Date(filterStartDate)) return false;
            if (filterEndDate) {
                const endDate = new Date(filterEndDate);
                endDate.setHours(23, 59, 59, 999);
                if (paymentDate > endDate) return false;
            }
            
            return true;
        });
    }, [sortedPayments, filterType, filterStatus, filterStartDate, filterEndDate]);

    const clearFilters = () => {
        setFilterType('');
        setFilterStatus('');
        setFilterStartDate('');
        setFilterEndDate('');
    };

    const paymentItems = [
        ...unpaidBills.map(bill => ({ type: 'bill' as const, data: bill, dueDate: new Date(bill.dueDate) })),
        ...rentDues.map(({ application, property }) => ({ type: 'rent' as const, data: { application, property }, dueDate: new Date(application.dueDate!) })),
        ...depositDues.map(({ application, property }) => ({ type: 'deposit' as const, data: { application, property }, dueDate: new Date() })),
        ...offlinePending.map(({ application, property }) => ({ type: 'offline' as const, data: { application, property }, dueDate: new Date(application.dueDate!) }))
    ].sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());


    const TabButton = ({ id, label, count }: { id: string, label: string, count?: number }) => (
        <button
            onClick={() => setActiveTab(id)}
            className={`px-4 py-2 text-sm font-semibold rounded-t-lg border-b-2 transition-colors flex items-center gap-2 ${activeTab === id ? 'border-primary text-primary' : 'border-transparent text-neutral-500 hover:text-neutral-800'}`}
        >
            {label} {typeof count !== 'undefined' && count > 0 && <span className="bg-primary/10 text-primary text-xs font-bold rounded-full px-2 py-0.5">{count}</span>}
        </button>
    );

    const getViewingStatusInfo = (status: ViewingStatus) => {
        const statuses: Record<ViewingStatus, {text: string; color: string; bgColor: string, icon: React.ReactNode}> = {
            [ViewingStatus.REQUESTED]: { text: 'Pending Owner Verification', color: 'text-yellow-800', bgColor: 'bg-yellow-100', icon: <Icons.ClockIcon className="w-4 h-4"/> },
            [ViewingStatus.ACCEPTED]: { text: 'Visit Approved', color: 'text-green-800', bgColor: 'bg-green-100', icon: <Icons.CheckCircleIcon className="w-4 h-4"/> },
            [ViewingStatus.DECLINED]: { text: 'Rejected (Refunded)', color: 'text-red-800', bgColor: 'bg-red-100', icon: <Icons.XCircleIcon className="w-4 h-4"/> },
            [ViewingStatus.COMPLETED]: { text: 'Visited', color: 'text-blue-800', bgColor: 'bg-blue-100', icon: <Icons.HomeIcon className="w-4 h-4"/> },
            [ViewingStatus.CANCELLED]: { text: 'Cancelled (Refunded)', color: 'text-gray-800', bgColor: 'bg-gray-100', icon: <Icons.XCircleIcon className="w-4 h-4"/> },
        };
        return statuses[status] || { text: 'Unknown', color: 'text-gray-800', bgColor: 'bg-gray-100', icon: <Icons.ExclamationTriangleIcon className="w-4 h-4"/> };
    }

    const getBillIcon = (type: BillType | 'RENT' | 'DEPOSIT') => {
        switch(type) {
            case BillType.ELECTRICITY: return <Icons.BoltIcon className="w-8 h-8 text-yellow-500" />;
            case BillType.WATER: return <Icons.WaterDropIcon className="w-8 h-8 text-blue-500" />;
            case BillType.MAINTENANCE: return <Icons.BuildingIcon className="w-8 h-8 text-gray-500" />;
            case 'RENT': return <Icons.BanknotesIcon className="w-8 h-8 text-green-500" />;
            case 'DEPOSIT': return <Icons.ShieldCheckIcon className="w-8 h-8 text-indigo-500" />;
        }
    }

    const getPaymentIcon = (type: PaymentType) => {
        const iconClass = "w-10 h-10 p-2 rounded-full";
        const iconMapping: Record<PaymentType, React.ReactElement> = {
            [PaymentType.RENT]: <div className="bg-green-100"><Icons.BanknotesIcon className={`${iconClass} text-green-600`} /></div>,
            [PaymentType.DEPOSIT]: <div className="bg-blue-100"><Icons.ShieldCheckIcon className={`${iconClass} text-blue-600`} /></div>,
            [PaymentType.BILL]: <div className="bg-yellow-100"><Icons.BoltIcon className={`${iconClass} text-yellow-600`} /></div>,
            [PaymentType.REFUND]: <div className="bg-purple-100"><Icons.CreditCardIcon className={`${iconClass} text-purple-600`} /></div>,
            [PaymentType.VIEWING_ADVANCE]: <div className="bg-indigo-100"><Icons.KeyIcon className={`${iconClass} text-indigo-600`} /></div>,
            [PaymentType.PLATFORM_FEE]: <div className="bg-gray-100"><Icons.HomeIcon className={`${iconClass} text-gray-600`} /></div>,
        };
        return iconMapping[type] || <div className="bg-gray-100"><Icons.CreditCardIcon className={`${iconClass} text-gray-600`} /></div>;
    }

    const getPaymentStatusBadge = (status: 'Paid' | 'Failed' | 'Refunded') => {
        const statuses = {
            Paid: 'bg-green-100 text-green-800',
            Failed: 'bg-red-100 text-red-800',
            Refunded: 'bg-indigo-100 text-indigo-800',
        };
        return <span className={`px-3 py-1 text-sm font-semibold rounded-full ${statuses[status]}`}>{status}</span>;
    }
  
    const activeAgreements = agreements.filter(a => a.agreement.signedByTenant && a.agreement.signedByOwner);

    return (
        <div>
            <div className="mb-6">
                <h2 className="text-3xl font-bold text-neutral-900">Welcome, {user.name.split(' ')[0]}!</h2>
                <p className="text-neutral-600">Here's an overview of your rental activity.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <StatCard 
                    icon={<Icons.ShieldCheckIcon className="w-6 h-6 text-blue-800"/>} 
                    title="Verification Status" 
                    value={<KycStatusBadge status={user.kycStatus} large />}
                    color="bg-blue-100" 
                />
                <StatCard 
                    icon={<Icons.BanknotesIcon className="w-6 h-6 text-red-800"/>} 
                    title="Upcoming Payments" 
                    value={paymentItems.length} 
                    color="bg-red-100" 
                />
                <StatCard 
                    icon={<Icons.DocumentCheckIcon className="w-6 h-6 text-green-800"/>} 
                    title="Active Rentals" 
                    value={activeAgreements.length} 
                    color="bg-green-100" 
                />
                 <StatCard 
                    icon={<Icons.PencilIcon className="w-6 h-6 text-indigo-800"/>} 
                    title="Pending Agreements" 
                    value={pendingAgreementSignatures} 
                    color="bg-indigo-100" 
                />
            </div>


            <div className="border-b mb-6 flex flex-wrap">
                <TabButton id="agreements" label="My Agreements" count={pendingAgreementSignatures} />
                <TabButton id="bills" label="Bills & Payments" count={paymentItems.length} />
                <TabButton id="history" label="Payment History" />
                <TabButton id="viewings" label="My Viewings" />
                <TabButton id="verification" label="Verification" />
            </div>

            {activeTab === 'agreements' && (
                <div className="space-y-4">
                    {applications.filter(a => a.application.status === ApplicationStatus.MOVE_IN_READY).map(({application, property}) => (
                        <div key={`move-in-${application.id}`} className="p-4 border-2 border-teal-200 rounded-lg bg-white flex justify-between items-center">
                            <div className="flex items-center gap-4">
                                <Icons.KeyIcon className="w-8 h-8 text-teal-500" />
                                <div>
                                    <h3 className="font-bold text-lg text-teal-800">Move-in Ready!</h3>
                                    <p className="text-sm text-neutral-600">{property.title}</p>
                                    <p className="text-sm text-neutral-500">Payment successful! Please coordinate with the owner for key handover.</p>
                                </div>
                            </div>
                        </div>
                    ))}
                    {agreements.length > 0 ? agreements.map(({ agreement, property }) => (
                        <div key={agreement.id} className="p-4 border rounded-lg bg-white">
                            <h3 className="font-bold text-lg">{property.title}</h3>
                            <p className="text-sm text-neutral-500">{property.address}</p>
                            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-sm">
                                <span>Rent: <span className="font-semibold">₹{agreement.rentAmount.toLocaleString()}</span></span>
                                <span>Deposit: <span className="font-semibold">₹{agreement.depositAmount.toLocaleString()}</span></span>
                                <span>Start Date: <span className="font-semibold">{new Date(agreement.startDate).toLocaleDateString()}</span></span>
                            </div>
                            <div className="mt-4 pt-4 border-t flex justify-between items-center">
                                <div className="flex items-center gap-4">
                                    {agreement.signedByOwner && !agreement.signedByTenant ? (
                                        <button
                                            onClick={() => onSignAgreement(agreement, property)}
                                            className="px-4 py-2 bg-secondary hover:bg-primary text-white font-semibold rounded-md text-sm transition-colors duration-300"
                                        >
                                            Review & Sign Agreement
                                        </button>
                                    ) : null}
                                    <button
                                        onClick={() => onViewAgreementDetails(agreement, property)}
                                        className="text-sm font-semibold text-primary hover:underline"
                                    >
                                        View Details
                                    </button>
                                </div>
                                <button onClick={() => onRaiseDispute(agreement.id, 'Property')} className="flex items-center gap-2 text-sm text-red-600 hover:text-red-800 font-semibold">
                                    <Icons.ExclamationTriangleIcon className="w-4 h-4" /> Raise Dispute
                                </button>
                            </div>
                        </div>
                    )) : <p>You have no active rentals.</p>}
                </div>
            )}

            {activeTab === 'viewings' && (
                <div className="space-y-4">
                    {viewings.length > 0 ? viewings.map(({ viewing, property }) => {
                        const statusInfo = getViewingStatusInfo(viewing.status);
                        return (
                             <div key={viewing.id} className="p-4 border rounded-lg bg-white">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h3 className="font-semibold">{property.title}</h3>
                                        <p className="text-sm text-neutral-500">{property.address}</p>
                                    </div>
                                    <p className={`px-2 py-1 text-xs font-bold rounded-full flex items-center gap-1.5 ${statusInfo.bgColor} ${statusInfo.color}`}>{statusInfo.icon}{statusInfo.text}</p>
                                </div>
                                <div className="mt-3 pt-3 border-t text-sm text-neutral-600 space-y-1">
                                    {viewing.scheduledAt && (
                                        <div className="flex items-center gap-2">
                                            <Icons.CalendarDaysIcon className="w-4 h-4 text-neutral-500 flex-shrink-0" />
                                            <span>
                                                {viewing.status === 'REQUESTED' ? 'Proposed time: ' : 'Scheduled for: '}
                                                <span className="font-semibold">{new Date(viewing.scheduledAt).toLocaleString()}</span>
                                            </span>
                                        </div>
                                    )}
                                    <div className="flex items-center gap-2">
                                        <Icons.ClockIcon className="w-4 h-4 text-neutral-500 flex-shrink-0" />
                                        <span>Requested on: {new Date(viewing.requestedAt).toLocaleString()}</span>
                                    </div>
                                </div>
                                {viewing.status === ViewingStatus.COMPLETED && (
                                    <div className="mt-4 pt-4 border-t flex justify-end gap-3">
                                        <button 
                                            onClick={() => onCancelViewing(viewing.id)}
                                            className="px-4 py-2 bg-neutral-200 hover:bg-neutral-300 text-neutral-800 font-semibold rounded-md text-sm transition-colors"
                                        >
                                            Not Interested
                                        </button>
                                        <button 
                                            onClick={() => onConfirmRent(viewing.id)}
                                            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-md text-sm transition-colors duration-300"
                                        >
                                            Confirm Rent
                                        </button>
                                    </div>
                                )}
                            </div>
                        );
                    }) : <p>You haven't requested any viewings yet.</p>}
                </div>
            )}
            
            {activeTab === 'bills' && (
                <div className="space-y-4">
                    {paymentItems.length > 0 ? paymentItems.map((item) => {
                        if (item.type === 'deposit') {
                            const { application, property } = item.data;
                            return (
                                <div key={`deposit-${application.id}`} className="p-4 border-2 border-red-200 rounded-lg bg-white flex justify-between items-center">
                                    <div className="flex items-center gap-4">
                                        {getBillIcon('DEPOSIT')}
                                        <div>
                                            <h3 className="font-bold text-lg">Deposit & First Rent Due</h3>
                                            <p className="text-sm text-neutral-600">{property.title}</p>
                                            <p className="text-sm text-neutral-500">Amount: <span className="font-bold">₹{application.amount!.toLocaleString()}</span></p>
                                        </div>
                                    </div>
                                    <button onClick={() => onInitiatePaymentFlow(application, property)} className="px-6 py-2 bg-red-500 hover:bg-red-600 text-white text-sm font-bold rounded-md transition-colors">Pay Now</button>
                                </div>
                            )
                        } else if (item.type === 'rent') {
                            const { application, property } = item.data;
                            return (
                                <div key={`rent-${application.id}`} className="p-4 border-2 border-red-200 rounded-lg bg-white flex justify-between items-center">
                                    <div className="flex items-center gap-4">
                                        {getBillIcon('RENT')}
                                        <div>
                                            <h3 className="font-bold text-lg">Monthly Rent Due</h3>
                                            <p className="text-sm text-neutral-600">{property.title}</p>
                                            <p className="text-sm text-neutral-500">Due: <span className="font-semibold text-red-600">{new Date(application.dueDate!).toLocaleDateString()}</span> | Amount: <span className="font-bold">₹{application.amount!.toLocaleString()}</span></p>
                                        </div>
                                    </div>
                                    <button onClick={() => onInitiatePaymentFlow(application, property)} className="px-6 py-2 bg-red-500 hover:bg-red-600 text-white text-sm font-bold rounded-md transition-colors">Pay Rent</button>
                                </div>
                            )
                        } else if (item.type === 'offline') {
                           const { application, property } = item.data;
                           return (
                                <div key={`offline-${application.id}`} className="p-4 border-2 border-cyan-200 rounded-lg bg-white flex justify-between items-center">
                                    <div className="flex items-center gap-4">
                                        {getBillIcon('RENT')}
                                        <div>
                                            <h3 className="font-bold text-lg">Offline Payment Submitted</h3>
                                            <p className="text-sm text-neutral-600">{property.title}</p>
                                            <p className="text-sm text-cyan-700 font-semibold">Waiting for owner to acknowledge</p>
                                        </div>
                                    </div>
                                    <button className="px-6 py-2 bg-cyan-200 text-cyan-800 text-sm font-bold rounded-md cursor-not-allowed">Pending</button>
                                </div>
                            )
                        } else {
                            const bill = item.data;
                            return (
                                <div key={bill.id} className="p-4 border rounded-lg bg-white flex justify-between items-center">
                                   <div className="flex items-center gap-4">
                                       {getBillIcon(bill.type)}
                                       <div>
                                           <h3 className="font-semibold capitalize">{bill.type.toLowerCase()} Bill</h3>
                                           <p className="text-sm text-neutral-500">Due: {new Date(bill.dueDate).toLocaleDateString()} | Amount: <span className="font-bold">₹{bill.amount.toLocaleString()}</span></p>
                                       </div>
                                   </div>
                                   <button onClick={() => onPayBill(bill.id)} className="px-4 py-1.5 bg-secondary text-white text-sm font-semibold rounded-md">Pay Now</button>
                               </div>
                           )
                        }
                    }) : <p className="text-center bg-white p-6 rounded-lg text-neutral-500">No outstanding payments. You're all caught up!</p>}
                </div>
            )}

             {activeTab === 'history' && (
                 <div>
                    <div className="bg-white p-6 rounded-lg shadow-md border mb-6">
                        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                            <h3 className="text-xl font-semibold text-neutral-800 flex items-center gap-2"><Icons.FilterIcon className="w-5 h-5"/> Filter History</h3>
                            <button onClick={clearFilters} className="text-sm font-semibold text-primary hover:underline">Clear Filters</button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div>
                                <label htmlFor="filterType" className="text-sm font-medium text-gray-700">Type</label>
                                <select id="filterType" value={filterType} onChange={e => setFilterType(e.target.value)} className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm">
                                    <option value="">All Types</option>
                                    {Object.values(PaymentType).map(type => <option key={type} value={type}>{type.replace(/_/g, ' ')}</option>)}
                                </select>
                            </div>
                            <div>
                                <label htmlFor="filterStatus" className="text-sm font-medium text-gray-700">Status</label>
                                <select id="filterStatus" value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm">
                                    <option value="">All Statuses</option>
                                    <option value="Paid">Paid</option>
                                    <option value="Failed">Failed</option>
                                    <option value="Refunded">Refunded</option>
                                </select>
                            </div>
                            <div>
                                <label htmlFor="filterStartDate" className="text-sm font-medium text-gray-700">Start Date</label>
                                <input type="date" id="filterStartDate" value={filterStartDate} onChange={e => setFilterStartDate(e.target.value)} className="mt-1 block w-full py-2 px-3 border border-gray-300 rounded-md shadow-sm"/>
                            </div>
                            <div>
                                <label htmlFor="filterEndDate" className="text-sm font-medium text-gray-700">End Date</label>
                                <input type="date" id="filterEndDate" value={filterEndDate} onChange={e => setFilterEndDate(e.target.value)} className="mt-1 block w-full py-2 px-3 border border-gray-300 rounded-md shadow-sm"/>
                            </div>
                        </div>
                    </div>
                     {filteredPayments.length > 0 ? (
                        <div className="space-y-4">
                            {filteredPayments.map(payment => {
                                const property = properties.find(p => p.id === payment.propertyId);
                                return (
                                    <div key={payment.id} className="p-4 border rounded-lg bg-white flex justify-between items-center">
                                        <div className="flex items-center gap-4">
                                            {getPaymentIcon(payment.type)}
                                            <div>
                                                <h3 className="font-bold capitalize">{payment.type.toLowerCase().replace('_', ' ')}</h3>
                                                <p className="text-sm text-neutral-600">{property?.title || 'N/A'}</p>
                                                <p className="text-sm text-neutral-500">{new Date(payment.paymentDate).toLocaleString()}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-bold text-lg">₹{payment.amount.toLocaleString()}</p>
                                            {getPaymentStatusBadge(payment.status)}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                     ) : (
                        <div className="text-center py-12 bg-white rounded-lg border">
                          <Icons.TableCellsIcon className="w-12 h-12 mx-auto text-neutral-300" />
                          <h3 className="mt-2 text-xl font-semibold text-neutral-700">No Payments Found</h3>
                          <p className="mt-1 text-neutral-500">No transactions match your current filter criteria.</p>
                        </div>
                     )}
                </div>
            )}

            {activeTab === 'verification' && (
                <VerificationForm verification={verification} onSubmit={onSubmitVerification} />
            )}
        </div>
    );
};

export default TenantDashboard;