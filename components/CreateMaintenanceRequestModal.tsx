import React, { useState, useMemo } from 'react';
import type { Property, User, MaintenanceRequest, Agreement } from '../types';
import { MaintenanceCategory, UserRole } from '../types';
import { XCircleIcon, PlusCircleIcon } from './Icons';

interface CreateMaintenanceRequestModalProps {
    onClose: () => void;
    onSubmit: (requestData: Omit<MaintenanceRequest, 'id' | 'createdAt' | 'status' | 'createdBy'>) => void;
    properties: Property[];
    users: User[];
    currentUser: User;
    agreements: { agreement: Agreement, property: Property }[];
}

const CreateMaintenanceRequestModal: React.FC<CreateMaintenanceRequestModalProps> = ({ onClose, onSubmit, properties, users, currentUser, agreements }) => {
    const today = new Date().toISOString().split('T')[0];
    const [requestData, setRequestData] = useState({
        title: '',
        description: '',
        propertyId: properties[0]?.id || '',
        category: MaintenanceCategory.GENERAL,
        dueDate: today,
        assignedToId: '',
    });
    const [error, setError] = useState('');

    const assignableUsers = useMemo(() => {
        if (!requestData.propertyId) return [];

        if (currentUser.role === UserRole.OWNER) {
            // Owner can assign to themselves or tenants of the selected property
            const tenantIds = new Set(
                agreements
                    .filter(a => a.property.id === requestData.propertyId)
                    .map(a => a.agreement.tenantId)
            );
            return users.filter(u => u.id === currentUser.id || tenantIds.has(u.id));
        }

        if (currentUser.role === UserRole.RENTER) {
            // Renter can only assign to the property owner
            const property = properties.find(p => p.id === requestData.propertyId);
            if (!property) return [];
            const owner = users.find(u => u.id === property.ownerId);
            return owner ? [owner] : [];
        }

        return [];
    }, [requestData.propertyId, currentUser, users, properties, agreements]);

    React.useEffect(() => {
        // This effect runs when the list of possible assignees changes (i.e., when property is changed)
        if (currentUser.role === UserRole.RENTER) {
            // Renter: Auto-assign to the owner, which should be the only user in the list
            setRequestData(prev => ({ ...prev, assignedToId: assignableUsers[0]?.id || '' }));
        } else if (currentUser.role === UserRole.OWNER) {
            // Owner: Default assignment to self when property changes
            setRequestData(prev => ({ ...prev, assignedToId: currentUser.id }));
        }
    }, [assignableUsers, currentUser.id, currentUser.role]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        setRequestData({ ...requestData, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (!requestData.title || !requestData.propertyId || !requestData.assignedToId) {
            setError('Please fill out all required fields.');
            return;
        }
        onSubmit({
            ...requestData,
            imageUrls: [], // Image upload not implemented in this demo form
            comments: [],
        });
        onClose();
    };

    const isAssigneeDisabled = currentUser.role === UserRole.RENTER;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4" onClick={onClose}>
            <div className="max-w-lg w-full bg-white p-8 rounded-lg shadow-xl relative" onClick={e => e.stopPropagation()}>
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"><XCircleIcon className="w-6 h-6" /></button>
                <h2 className="text-2xl font-bold mb-6">Create Maintenance Request</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="title" className="block text-sm font-medium text-gray-700">Title</label>
                        <input type="text" name="title" id="title" value={requestData.title} onChange={handleChange} className="mt-1 block w-full p-2 border rounded-md" required />
                    </div>
                     <div>
                        <label htmlFor="description" className="block text-sm font-medium text-gray-700">Description</label>
                        <textarea name="description" id="description" value={requestData.description} onChange={handleChange} rows={3} className="mt-1 block w-full p-2 border rounded-md"></textarea>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="propertyId" className="block text-sm font-medium text-gray-700">Property</label>
                            <select name="propertyId" id="propertyId" value={requestData.propertyId} onChange={handleChange} className="mt-1 block w-full p-2 border rounded-md" required>
                                {properties.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
                            </select>
                        </div>
                        <div>
                            <label htmlFor="category" className="block text-sm font-medium text-gray-700">Category</label>
                            <select name="category" id="category" value={requestData.category} onChange={handleChange} className="mt-1 block w-full p-2 border rounded-md" required>
                                {Object.values(MaintenanceCategory).map(cat => <option key={cat} value={cat}>{cat}</option>)}
                            </select>
                        </div>
                    </div>
                     <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700">Due Date</label>
                            <input type="date" name="dueDate" id="dueDate" value={requestData.dueDate} onChange={handleChange} min={today} className="mt-1 block w-full p-2 border rounded-md" required />
                        </div>
                        <div>
                            <label htmlFor="assignedToId" className="block text-sm font-medium text-gray-700">Assign To</label>
                            <select
                                name="assignedToId"
                                id="assignedToId"
                                value={requestData.assignedToId}
                                onChange={handleChange}
                                className="mt-1 block w-full p-2 border rounded-md disabled:bg-gray-100 disabled:text-gray-500"
                                required
                                disabled={isAssigneeDisabled}
                            >
                                {isAssigneeDisabled && assignableUsers.length === 0 && <option value="">No Owner Found</option>}
                                {!isAssigneeDisabled && assignableUsers.length === 0 && <option value="">Select a property first</option>}
                                {assignableUsers.map(u => (
                                    <option key={u.id} value={u.id}>
                                        {u.name} ({u.id === currentUser.id ? 'Me' : u.role})
                                    </option>
                                ))}
                            </select>
                            {isAssigneeDisabled && <p className="text-xs text-neutral-500 mt-1">Requests are automatically assigned to the property owner.</p>}
                        </div>
                    </div>
                    {error && <p className="text-red-500 text-sm">{error}</p>}
                    <div className="flex justify-end gap-3 pt-4">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-neutral-200 hover:bg-neutral-300 text-neutral-800 font-semibold rounded-md text-sm">Cancel</button>
                        <button type="submit" className="px-4 py-2 bg-secondary hover:bg-primary text-white font-semibold rounded-md text-sm flex items-center gap-2">
                            <PlusCircleIcon className="w-5 h-5" />
                            Create Request
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
export default CreateMaintenanceRequestModal;