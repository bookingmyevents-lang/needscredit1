


import React, { useState, useMemo } from 'react';
import type { Property, Application, User, Dispute, ActivityLog, Payment, Viewing } from '../types';
import { ApplicationStatus, DisputeStatus, ActivityType, PaymentType, UserRole, ViewingStatus } from '../types';
import * as Icons from './Icons';
import OnboardingTracker from './OnboardingTracker';


interface SuperAdminDashboardProps {
  properties: Property[];
  applications: Application[];
  users: User[];
  disputes: Dispute[];
  activityLogs: ActivityLog[];
  payments: Payment[];
  viewings: Viewing[];
  onUpdateKycStatus: (userId: string, status: 'Verified' | 'Rejected') => void;
  onUpdateViewingStatus: (viewingId: string, status: ViewingStatus) => void;
  onRefundViewingAdvance: (viewingId: string, reason: 'owner_declined' | 'tenant_rejected') => void;
  currentUser: User;
  onUpdateUserRole: (userId: string, role: UserRole) => void;
}

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

type UserSortKey = 'name' | 'email' | 'kycStatus' | 'role';
type PropertySortKey = 'title' | 'rent' | 'availability';
type SortConfig<T> = { key: T; direction: 'ascending' | 'descending' };


const SuperAdminDashboard: React.FC<SuperAdminDashboardProps> = (props) => {
    const { properties, applications, users, disputes, activityLogs, payments, viewings, onUpdateKycStatus, onUpdateViewingStatus, onRefundViewingAdvance, currentUser, onUpdateUserRole } = props;

    const [activeTab, setActiveTab] = useState('overview');
    
    // State for Users tab
    const [userFilters, setUserFilters] = useState({ role: '', kycStatus: '' });
    const [userSortConfig, setUserSortConfig] = useState<SortConfig<UserSortKey>[]>([]);

    // State for Properties tab
    const [propertyFilters, setPropertyFilters] = useState({ availability: '' });
    const [propertySortConfig, setPropertySortConfig] = useState<SortConfig<PropertySortKey>[]>([]);
    
    // State for Viewings tab
    const [expandedViewingId, setExpandedViewingId] = useState<string | null>(null);
    const [viewingFilter, setViewingFilter] = useState<string>('All');


    const totalEarnings = useMemo(() => payments.filter(p => p.status === 'Paid').reduce((sum, p) => sum + p.amount, 0), [payments]);
    const openDisputes = useMemo(() => disputes.filter(d => d.status === DisputeStatus.OPEN).length, [disputes]);
    const pendingKyc = useMemo(() => users.filter(u => u.kycStatus === 'Pending').length, [users]);
    const pendingViewingsCount = useMemo(() => viewings.filter(v => v.status === ViewingStatus.REQUESTED).length, [viewings]);

    const recentActivities = useMemo(() => activityLogs.slice(0, 5), [activityLogs]);

    const filteredUsers = useMemo(() => {
        let filtered = [...users];
        if (userFilters.role) {
            filtered = filtered.filter(u => u.role === userFilters.role);
        }
        if (userFilters.kycStatus) {
            filtered = filtered.filter(u => u.kycStatus === userFilters.kycStatus);
        }
        return filtered;
    }, [users, userFilters]);

    const sortedUsers = useMemo(() => {
        const sortableUsers = [...filteredUsers];
        if (userSortConfig.length === 0) return sortableUsers;

        sortableUsers.sort((a, b) => {
            for (const { key, direction } of userSortConfig) {
                const valA = a[key];
                const valB = b[key];
                
                if (valA == null && valB != null) return 1;
                if (valA != null && valB == null) return -1;
                if (valA == null && valB == null) return 0;

                if (valA < valB) return direction === 'ascending' ? -1 : 1;
                if (valA > valB) return direction === 'ascending' ? 1 : -1;
            }
            return 0;
        });

        return sortableUsers;
    }, [filteredUsers, userSortConfig]);

    const handleUserSort = (key: UserSortKey, event: React.MouseEvent) => {
        const isShiftClick = event.shiftKey;
        
        setUserSortConfig(prev => {
            const newConfig = isShiftClick ? [...prev] : [];
            const existingIndex = newConfig.findIndex(s => s.key === key);

            if (existingIndex > -1) {
                if (newConfig[existingIndex].direction === 'ascending') {
                    newConfig[existingIndex].direction = 'descending';
                } else {
                    newConfig.splice(existingIndex, 1);
                }
            } else {
                newConfig.push({ key, direction: 'ascending' });
            }
            
            return newConfig;
        });
    };

    const getSortIndicator = (key: UserSortKey) => {
        const sortIndex = userSortConfig.findIndex(c => c.key === key);
        if (sortIndex === -1) return null;

        const config = userSortConfig[sortIndex];
        const Icon = config.direction === 'ascending' ? Icons.ChevronUpIcon : Icons.ChevronDownIcon;
        
        return (
            <span className="inline-flex items-center ml-1 text-neutral-500">
                <Icon className="w-4 h-4" />
                {userSortConfig.length > 1 && (
                    <span className="text-xs font-bold ml-0.5">{sortIndex + 1}</span>
                )}
            </span>
        );
    };
    
    const filteredProperties = useMemo(() => {
        let filtered = [...properties];
        if (propertyFilters.availability) {
            filtered = filtered.filter(p => p.availability === propertyFilters.availability);
        }
        return filtered;
    }, [properties, propertyFilters]);

    const sortedProperties = useMemo(() => {
        const sortableProperties = [...filteredProperties];
        if (propertySortConfig.length === 0) return sortableProperties;

        sortableProperties.sort((a, b) => {
            for (const { key, direction } of propertySortConfig) {
                const valA = a[key];
                const valB = b[key];
                
                if (valA == null && valB != null) return 1;
                if (valA != null && valB == null) return -1;
                if (valA == null && valB == null) return 0;

                if (valA < valB) return direction === 'ascending' ? -1 : 1;
                if (valA > valB) return direction === 'ascending' ? 1 : -1;
            }
            return 0;
        });

        return sortableProperties;
    }, [filteredProperties, propertySortConfig]);

    const handlePropertySort = (key: PropertySortKey, event: React.MouseEvent) => {
        const isShiftClick = event.shiftKey;
        
        setPropertySortConfig(prev => {
            const newConfig = isShiftClick ? [...prev] : [];
            const existingIndex = newConfig.findIndex(s => s.key === key);

            if (existingIndex > -1) {
                if (newConfig[existingIndex].direction === 'ascending') {
                    newConfig[existingIndex].direction = 'descending';
                } else {
                    newConfig.splice(existingIndex, 1);
                }
            } else {
                newConfig.push({ key, direction: 'ascending' });
            }
            
            return newConfig;
        });
    };

    const getPropertySortIndicator = (key: PropertySortKey) => {
        const sortIndex = propertySortConfig.findIndex(c => c.key === key);
        if (sortIndex === -1) return null;

        const config = propertySortConfig[sortIndex];
        const Icon = config.direction === 'ascending' ? Icons.ChevronUpIcon : Icons.ChevronDownIcon;
        
        return (
            <span className="inline-flex items-center ml-1 text-neutral-500">
                <Icon className="w-4 h-4" />
                {propertySortConfig.length > 1 && (
                    <span className="text-xs font-bold ml-0.5">{sortIndex + 1}</span>
                )}
            </span>
        );
    };


    const renderOverview = () => (
        <div className="space-y-8">
            <div>
                <h2 className="text-3xl font-bold text-neutral-900">Super Admin Dashboard</h2>
                <p className="text-neutral-600">Platform-wide overview and management tools.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard icon={<Icons.UserGroupIcon className="w-6 h-6 text-blue-800"/>} title="Total Users" value={users.length} color="bg-blue-100" />
                <StatCard icon={<Icons.BuildingIcon className="w-6 h-6 text-green-800"/>} title="Total Properties" value={properties.length} color="bg-green-100" />
                <StatCard icon={<Icons.BanknotesIcon className="w-6 h-6 text-indigo-800"/>} title="Total Revenue" value={`₹${(totalEarnings / 1000).toFixed(1)}k`} color="bg-indigo-100" />
                <StatCard icon={<Icons.ExclamationTriangleIcon className="w-6 h-6 text-yellow-800"/>} title="Pending Actions" value={openDisputes + pendingKyc} color="bg-yellow-100" />
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md border">
                <h3 className="text-xl font-semibold text-neutral-800 mb-4">Recent Platform Activity</h3>
                <ul className="space-y-3">
                    {recentActivities.map(log => (
                        <li key={log.id} className="p-3 bg-neutral-50 rounded-lg border text-sm">
                            <span className="font-semibold text-primary">{users.find(u => u.id === log.userId)?.name || 'A user'}</span> {log.message}
                            <span className="text-xs text-neutral-400 ml-2">{new Date(log.timestamp).toLocaleString()}</span>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
    
    const renderUsers = () => (
        <div className="space-y-8">
            <div>
                <h2 className="text-3xl font-bold text-neutral-900">User Management</h2>
                <p className="text-neutral-600">View, filter, and manage all users on the platform. Shift-click headers to sort by multiple columns.</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-md border">
                 <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-4 pb-4 border-b">
                    <select value={userFilters.role} onChange={e => setUserFilters({...userFilters, role: e.target.value})} className="p-2 border rounded-md text-sm"><option value="">All Roles</option>{Object.values(UserRole).map(r => <option key={r} value={r}>{r}</option>)}</select>
                    <select value={userFilters.kycStatus} onChange={e => setUserFilters({...userFilters, kycStatus: e.target.value})} className="p-2 border rounded-md text-sm"><option value="">All KYC Statuses</option><option>Verified</option><option>Pending</option><option>Rejected</option><option>Not Verified</option></select>
                    <button onClick={() => {setUserFilters({ role: '', kycStatus: '' }); setUserSortConfig([]);}} className="text-sm font-semibold text-primary hover:underline justify-self-start sm:justify-self-auto">Clear Filters</button>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium w-1/3">
                                    <button onClick={(e) => handleUserSort('name', e)} className="flex items-center hover:text-primary transition-colors">User {getSortIndicator('name')}</button>
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium">
                                    <button onClick={(e) => handleUserSort('role', e)} className="flex items-center hover:text-primary transition-colors">Role {getSortIndicator('role')}</button>
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium">
                                    <button onClick={(e) => handleUserSort('kycStatus', e)} className="flex items-center hover:text-primary transition-colors">KYC Status {getSortIndicator('kycStatus')}</button>
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium">Actions</th>
                                <th className="px-4 py-3 text-left text-xs font-medium">Modify Role</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {sortedUsers.map(user => (
                                <tr key={user.id}>
                                    <td className="px-4 py-3 text-sm">
                                        <div className="font-semibold">{user.name}</div>
                                        <div className="text-xs text-neutral-500">{user.email}</div>
                                    </td>
                                    <td className="px-4 py-3 text-sm">{user.role}</td>
                                    <td className="px-4 py-3 text-sm">
                                        <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${ {
                                            'Verified': 'bg-green-100 text-green-800',
                                            'Pending': 'bg-yellow-100 text-yellow-800',
                                            'Rejected': 'bg-red-100 text-red-800',
                                            'Not Verified': 'bg-gray-100 text-gray-800',
                                        }[user.kycStatus]}`}>{user.kycStatus}</span>
                                    </td>
                                    <td className="px-4 py-3 text-sm space-x-2">
                                        {user.kycStatus === 'Pending' && (
                                            <>
                                                <button onClick={() => onUpdateKycStatus(user.id, 'Verified')} className="font-semibold text-green-600 hover:underline text-xs">Approve</button>
                                                <button onClick={() => onUpdateKycStatus(user.id, 'Rejected')} className="font-semibold text-red-600 hover:underline text-xs">Reject</button>
                                            </>
                                        )}
                                    </td>
                                    <td className="px-4 py-3 text-sm">
                                         <select 
                                            value={user.role} 
                                            onChange={(e) => onUpdateUserRole(user.id, e.target.value as UserRole)}
                                            className="p-1 border rounded-md text-xs"
                                            disabled={currentUser.id === user.id}
                                            title={currentUser.id === user.id ? "You cannot change your own role." : "Change user role"}
                                        >
                                            {Object.values(UserRole).map(role => (
                                                <option key={role} value={role}>{role}</option>
                                            ))}
                                        </select>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
    
    const renderProperties = () => (
         <div className="space-y-8">
            <div>
                <h2 className="text-3xl font-bold text-neutral-900">Property Management</h2>
                <p className="text-neutral-600">View and manage all properties on the platform. Shift-click headers to sort by multiple columns.</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-md border">
                 <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-4 pb-4 border-b">
                    <select value={propertyFilters.availability} onChange={e => setPropertyFilters({ ...propertyFilters, availability: e.target.value })} className="p-2 border rounded-md text-sm">
                        <option value="">All Statuses</option>
                        <option value="available">Available</option>
                        <option value="rented">Rented</option>
                    </select>
                    <button onClick={() => {setPropertyFilters({ availability: '' }); setPropertySortConfig([]);}} className="text-sm font-semibold text-primary hover:underline justify-self-start sm:justify-self-auto">Clear Filters</button>
                </div>
                 <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium w-1/2">
                                     <button onClick={(e) => handlePropertySort('title', e)} className="flex items-center hover:text-primary transition-colors">Title {getPropertySortIndicator('title')}</button>
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium">Owner</th>
                                <th className="px-4 py-3 text-left text-xs font-medium">
                                     <button onClick={(e) => handlePropertySort('rent', e)} className="flex items-center hover:text-primary transition-colors">Rent {getPropertySortIndicator('rent')}</button>
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium">
                                    <button onClick={(e) => handlePropertySort('availability', e)} className="flex items-center hover:text-primary transition-colors">Status {getPropertySortIndicator('availability')}</button>
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {sortedProperties.map(property => {
                                const owner = users.find(u => u.id === property.ownerId);
                                return (
                                <tr key={property.id}>
                                    <td className="px-4 py-3 text-sm font-semibold">{property.title}</td>
                                    <td className="px-4 py-3 text-sm">{owner?.name || 'N/A'}</td>
                                    <td className="px-4 py-3 text-sm">₹{property.rent.toLocaleString()}</td>
                                    <td className="px-4 py-3 text-sm"><span className={`capitalize px-2 py-0.5 text-xs font-bold rounded-full ${property.availability === 'available' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{property.availability}</span></td>
                                </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
    
    const renderApplications = () => {
        const sortedApplications = useMemo(() => {
            return [...applications].sort((a, b) => {
                const isACompleted = a.status === ApplicationStatus.COMPLETED;
                const isBCompleted = b.status === ApplicationStatus.COMPLETED;
                if (isACompleted && !isBCompleted) return 1;
                if (!isACompleted && isBCompleted) return -1;
                return 0; // Keep original order otherwise for simplicity
            });
        }, [applications]);
        return (
            <div className="space-y-8">
                <div>
                    <h2 className="text-3xl font-bold text-neutral-900">Onboarding Tracker</h2>
                    <p className="text-neutral-600">Monitor all tenant application and onboarding processes.</p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-md border">
                    <div className="space-y-8">
                        {sortedApplications.map(app => {
                            const property = properties.find(p => p.id === app.propertyId);
                            const renter = users.find(u => u.id === app.renterId);
                            const owner = users.find(u => u.id === property?.ownerId);
                            if (!property || !renter || !owner) return null;
                            return (
                                <div key={app.id} className="p-4 border rounded-lg">
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <h4 className="font-bold">{property.title}</h4>
                                            <p className="text-xs text-neutral-500">Applicant: {renter.name} | Owner: {owner.name}</p>
                                        </div>
                                    </div>
                                    <div className="overflow-x-auto pb-4">
                                         <OnboardingTracker status={app.status} />
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            </div>
        );
    }
    
    const renderViewings = () => {
        const processedViewings = useMemo(() => {
            return viewings.map(viewing => {
                const property = properties.find(p => p.id === viewing.propertyId);
                const renter = users.find(u => u.id === viewing.tenantId);
                const owner = users.find(u => u.id === viewing.ownerId);
                const payment = payments.find(p => p.id === viewing.paymentId);
                return { viewing, property, renter, owner, payment };
            }).sort((a, b) => new Date(b.viewing.requestedAt).getTime() - new Date(a.viewing.requestedAt).getTime());
        }, [viewings, properties, users, payments]);

        const filteredViewings = useMemo(() => {
            if (viewingFilter === 'All') return processedViewings;
            return processedViewings.filter(v => v.viewing.status === viewingFilter);
        }, [processedViewings, viewingFilter]);

        const filterOptions = ['All', ViewingStatus.REQUESTED, ViewingStatus.ACCEPTED, ViewingStatus.DECLINED, ViewingStatus.COMPLETED, ViewingStatus.CANCELLED];
        
        const getStatusBadge = (status: ViewingStatus) => {
            const statusInfo = {
                [ViewingStatus.REQUESTED]: { text: 'Requested', color: 'bg-yellow-100 text-yellow-800' },
                [ViewingStatus.ACCEPTED]: { text: 'Accepted', color: 'bg-green-100 text-green-800' },
                [ViewingStatus.DECLINED]: { text: 'Declined', color: 'bg-red-100 text-red-800' },
                [ViewingStatus.COMPLETED]: { text: 'Completed', color: 'bg-blue-100 text-blue-800' },
                [ViewingStatus.CANCELLED]: { text: 'Cancelled', color: 'bg-gray-100 text-gray-800' },
                [ViewingStatus.TENANT_REJECTED]: { text: 'Tenant Rejected', color: 'bg-gray-100 text-gray-800' },
            };
            const info = statusInfo[status] || { text: 'Unknown', color: 'bg-gray-100 text-gray-800' };
            return <span className={`px-2 py-1 text-xs font-bold rounded-full ${info.color}`}>{info.text}</span>;
        };

        return (
            <div className="space-y-8">
                <div>
                    <h2 className="text-3xl font-bold text-neutral-900">Platform Viewings</h2>
                    <p className="text-neutral-600">Monitor and manage all viewing requests across the platform.</p>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-md border">
                    <div className="flex flex-wrap gap-2 mb-4">
                        {filterOptions.map(opt => (
                            <button
                                key={opt}
                                onClick={() => setViewingFilter(opt)}
                                className={`px-3 py-1 text-sm font-semibold rounded-full transition-colors ${viewingFilter === opt ? 'bg-primary text-white' : 'bg-neutral-200 text-neutral-700 hover:bg-neutral-300'}`}
                            >
                                {opt}
                            </button>
                        ))}
                    </div>

                    {filteredViewings.length > 0 ? (
                        <div className="space-y-4">
                            {filteredViewings.map(({ viewing, property, renter, owner, payment }) => {
                                if (!property || !renter || !owner) return null;
                                const isExpanded = viewing.id === expandedViewingId;
                                const canBeRefunded = payment && payment.status !== 'Refunded' && viewing.status !== ViewingStatus.DECLINED;

                                return (
                                    <div key={viewing.id} className="p-4 border rounded-lg">
                                        <div className="flex justify-between items-start">
                                            <h4 className="font-bold">{property.title}</h4>
                                            {getStatusBadge(viewing.status)}
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm mt-2 border-t pt-2">
                                            <p><strong>Renter:</strong> {renter.name}</p>
                                            <p><strong>Owner:</strong> {owner.name}</p>
                                            <p><strong>Scheduled:</strong> {new Date(viewing.scheduledAt!).toLocaleString()}</p>
                                            <p><strong>Advance:</strong> ₹{viewing.advanceAmount.toLocaleString()}</p>
                                        </div>
                                        <div className="mt-4 pt-4 border-t">
                                            <button onClick={() => setExpandedViewingId(isExpanded ? null : viewing.id)} className="flex justify-between items-center w-full text-left font-semibold text-primary text-sm">
                                                <span>{isExpanded ? 'Hide' : 'Show'} Verification Details</span>
                                                <Icons.ChevronDownIcon className={`w-5 h-5 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                                            </button>
                                            {isExpanded && viewing.verificationData && (
                                                <div className="mt-2 p-4 bg-neutral-50 rounded-lg border text-sm space-y-2">
                                                    {Object.entries(viewing.verificationData).map(([key, value]) => (
                                                        <div key={key} className="grid grid-cols-2">
                                                            <p className="font-medium text-neutral-500 capitalize">{key.replace(/([A-Z])/g, ' $1')}</p>
                                                            <p className="text-neutral-800">{String(value) || 'N/A'}</p>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                        <div className="mt-4 pt-4 border-t flex gap-2">
                                            {viewing.status === ViewingStatus.REQUESTED && (
                                                <>
                                                    <button onClick={() => onUpdateViewingStatus(viewing.id, ViewingStatus.ACCEPTED)} className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-md text-xs">Approve</button>
                                                    <button onClick={() => onUpdateViewingStatus(viewing.id, ViewingStatus.DECLINED)} className="px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-md text-xs">Decline</button>
                                                </>
                                            )}
                                            {canBeRefunded && (
                                                 <button onClick={() => { if(confirm('Are you sure you want to refund this viewing advance? This action cannot be undone.')) onRefundViewingAdvance(viewing.id, 'owner_declined')}} className="px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-md text-xs">Refund Advance</button>
                                            )}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    ) : (
                        <p className="text-center py-12 text-neutral-500">No viewings match the current filter.</p>
                    )}
                </div>
            </div>
        )
    }

    const renderDisputes = () => (
         <div className="space-y-8">
            <div>
                <h2 className="text-3xl font-bold text-neutral-900">Dispute Resolution</h2>
                <p className="text-neutral-600">Review and mediate open disputes.</p>
            </div>
             <div className="bg-white p-6 rounded-lg shadow-md border">
                {disputes.length > 0 ? (
                    <div className="space-y-4">
                        {disputes.map(dispute => {
                            const raisedByUser = users.find(u => u.id === dispute.raisedBy);
                            return (
                                <div key={dispute.id} className="p-4 border rounded-lg">
                                    <div className="flex justify-between items-start">
                                        <h4 className="font-bold">Dispute ID: {dispute.id}</h4>
                                        <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${dispute.status === DisputeStatus.OPEN ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'}`}>{dispute.status}</span>
                                    </div>
                                    <p className="text-sm">Type: {dispute.type} | Raised by: {raisedByUser?.name}</p>
                                    <div className="mt-2 pt-2 border-t">
                                        <p className="text-sm font-semibold">Messages:</p>
                                        {dispute.messages.map((msg, idx) => (
                                            <p key={idx} className="text-sm">{users.find(u=>u.id === msg.userId)?.name}: "{msg.text}"</p>
                                        ))}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                ): <p className="text-center py-12 text-neutral-500">No disputes to show.</p>}
            </div>
        </div>
    );
    
    const sidebarOptions = [
        {id: "overview", label: "Overview", icon: <Icons.Squares2X2Icon className="w-5 h-5"/>},
        {id: "users", label: "Users", icon: <Icons.UserGroupIcon className="w-5 h-5"/>, count: pendingKyc},
        {id: "properties", label: "Properties", icon: <Icons.BuildingIcon className="w-5 h-5"/>},
        {id: "applications", label: "Onboarding", icon: <Icons.DocumentTextIcon className="w-5 h-5"/>},
        {id: "viewings", label: "Viewings", icon: <Icons.CalendarDaysIcon className="w-5 h-5"/>, count: pendingViewingsCount},
        {id: "disputes", label: "Disputes", icon: <Icons.ExclamationTriangleIcon className="w-5 h-5"/>, count: openDisputes},
    ];

    const renderContent = () => {
        switch (activeTab) {
            case 'overview': return renderOverview();
            case 'users': return renderUsers();
            case 'properties': return renderProperties();
            case 'applications': return renderApplications();
            case 'viewings': return renderViewings();
            case 'disputes': return renderDisputes();
            default: return renderOverview();
        }
    }

    return (
        <div className="h-[calc(100vh-4rem)] flex flex-col md:flex-row container mx-auto px-4 md:px-8 py-8 gap-8">
            <aside className="hidden md:block md:w-1/4 lg:w-1/5 flex-shrink-0">
                <div className="bg-white p-4 rounded-lg shadow-md border space-y-2 sticky top-24">
                    {sidebarOptions.map(opt => <SidebarButton key={opt.id} {...opt} activeTab={activeTab} onTabChange={setActiveTab} />)}
                </div>
            </aside>
            <main className="flex-grow min-w-0 overflow-y-auto custom-scrollbar">
                 <div className="md:hidden mb-4">
                    <label htmlFor="dashboard-nav" className="sr-only">Select a section</label>
                    <select id="dashboard-nav" value={activeTab} onChange={(e) => setActiveTab(e.target.value)} className="w-full p-3 border rounded-lg shadow-sm text-lg font-semibold">
                       {sidebarOptions.map(opt => <option key={opt.id} value={opt.id}>{opt.label}</option>)}
                    </select>
                </div>
                {renderContent()}
            </main>
        </div>
    );
};

export default SuperAdminDashboard;
