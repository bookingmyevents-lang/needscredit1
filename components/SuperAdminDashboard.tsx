import React from 'react';
import type { Property, Application, User, Dispute } from '../types';
import { ApplicationStatus, DisputeStatus } from '../types';
import { ShieldCheckIcon, DocumentTextIcon, HomeIcon, UserGroupIcon, ExclamationTriangleIcon } from './Icons';

interface SuperAdminDashboardProps {
  properties: Property[];
  applications: Application[];
  users: User[];
  disputes: Dispute[];
  onUpdateKycStatus: (userId: string, status: 'Verified' | 'Rejected') => void;
}

const SuperAdminDashboard: React.FC<SuperAdminDashboardProps> = ({ properties, applications, users, disputes, onUpdateKycStatus }) => {
  const findProperty = (id: string) => properties.find(p => p.id === id);

  const getStatusColor = (status: ApplicationStatus | DisputeStatus) => {
    const colors: Record<string, string> = {
      [ApplicationStatus.PENDING]: 'text-yellow-600',
      [ApplicationStatus.APPROVED]: 'text-cyan-600',
      [ApplicationStatus.REJECTED]: 'text-red-600',
      [ApplicationStatus.AGREEMENT_SENT]: 'text-blue-600',
      [ApplicationStatus.AGREEMENT_SIGNED]: 'text-indigo-600',
      [ApplicationStatus.RENT_DUE]: 'text-orange-600',
      [ApplicationStatus.RENT_PAID]: 'text-green-600',
      [DisputeStatus.OPEN]: 'bg-red-100 text-red-800',
      [DisputeStatus.IN_REVIEW]: 'bg-yellow-100 text-yellow-800',
      [DisputeStatus.RESOLVED]: 'bg-green-100 text-green-800',
    };
    return colors[status] || 'text-gray-600';
  };
  
  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'N/A';
    return date.toLocaleDateString();
  };

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <ShieldCheckIcon className="w-10 h-10 text-primary" />
        <div>
            <h2 className="text-3xl font-bold text-neutral-900">Super Admin Dashboard</h2>
            <p className="text-neutral-600">Platform overview and management tools.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow"><h4 className="text-sm font-medium text-neutral-500">Total Properties</h4><p className="text-3xl font-bold text-primary">{properties.length}</p></div>
        <div className="bg-white p-6 rounded-lg shadow"><h4 className="text-sm font-medium text-neutral-500">Total Users</h4><p className="text-3xl font-bold text-primary">{users.length}</p></div>
        <div className="bg-white p-6 rounded-lg shadow"><h4 className="text-sm font-medium text-neutral-500">Active Rentals</h4><p className="text-3xl font-bold text-primary">{applications.filter(a => a.status === ApplicationStatus.RENT_PAID || a.status === ApplicationStatus.RENT_DUE).length}</p></div>
        <div className="bg-white p-6 rounded-lg shadow"><h4 className="text-sm font-medium text-neutral-500">Open Disputes</h4><p className="text-3xl font-bold text-red-500">{disputes.filter(d => d.status === DisputeStatus.OPEN).length}</p></div>
      </div>
      
       <div className="bg-white p-6 rounded-lg shadow mb-8">
        <div className="flex items-center gap-3 mb-4"><ExclamationTriangleIcon className="w-6 h-6 text-secondary" /><h3 className="text-2xl font-semibold">Dispute Resolution</h3></div>
        <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50"><tr><th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dispute Type</th><th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Raised By</th><th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th><th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th></tr></thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {disputes.map(d => (<tr key={d.id}><td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{d.type}</td><td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{users.find(u=>u.id === d.raisedBy)?.name || 'Unknown User'}</td><td className="px-6 py-4 whitespace-nowrap"><span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(d.status)}`}>{d.status}</span></td><td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium"><a href="#" className="text-primary hover:text-secondary">Review</a></td></tr>))}
                </tbody>
            </table>
            {disputes.length === 0 && <p className="text-center py-8 text-neutral-500">No active disputes.</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center gap-3 mb-4"><UserGroupIcon className="w-6 h-6 text-secondary" /><h3 className="text-2xl font-semibold">All Users</h3></div>
            <div className="overflow-x-auto max-h-96">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50 sticky top-0"><tr><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">KYC</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th></tr></thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {users.map(u => (<tr key={u.id}><td className="px-6 py-4"><div className="font-medium">{u.name}</div><div className="text-xs text-gray-500">{u.email}</div></td><td className="px-6 py-4 text-sm">{u.role}</td><td className="px-6 py-4 text-sm">{u.kycStatus}</td><td className="px-6 py-4 whitespace-nowrap text-sm">{u.kycStatus === 'Pending' ? (<div className="flex gap-2"><button onClick={() => onUpdateKycStatus(u.id, 'Verified')} className="text-green-600 hover:text-green-900 font-semibold">Approve</button><button onClick={() => onUpdateKycStatus(u.id, 'Rejected')} className="text-red-600 hover:text-red-900 font-semibold">Reject</button></div>) : (<span>-</span>)}</td></tr>))}
                    </tbody>
                </table>
            </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center gap-3 mb-4"><HomeIcon className="w-6 h-6 text-secondary" /><h3 className="text-2xl font-semibold">All Properties</h3></div>
             <div className="overflow-x-auto max-h-96">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50 sticky top-0"><tr><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Title</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Owner</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th></tr></thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {properties.map(p => (<tr key={p.id}><td className="px-6 py-4 text-sm font-medium">{p.title}</td><td className="px-6 py-4 text-sm">{users.find(u=>u.id===p.ownerId)?.name || 'N/A'}</td><td className="px-6 py-4 text-sm capitalize">{p.availability}</td></tr>))}
                    </tbody>
                </table>
            </div>
        </div>
      </div>
    </div>
  );
};

export default SuperAdminDashboard;
