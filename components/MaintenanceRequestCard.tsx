import React, { useState } from 'react';
import type { MaintenanceRequest, User, Property } from '../types';
import { MaintenanceStatus, MaintenanceCategory } from '../types';
import * as Icons from './Icons';

interface MaintenanceRequestCardProps {
    request: MaintenanceRequest;
    users: User[];
    properties: Property[];
    currentUser: User;
    onUpdateStatus: (requestId: string, status: MaintenanceStatus) => void;
    onAddComment: (requestId: string, commentText: string) => void;
}

const MaintenanceRequestCard: React.FC<MaintenanceRequestCardProps> = ({ request, users, properties, currentUser, onUpdateStatus, onAddComment }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [newComment, setNewComment] = useState('');

    const createdByUser = users.find(u => u.id === request.createdBy);
    const assignedToUser = users.find(u => u.id === request.assignedToId);
    const property = properties.find(p => p.id === request.propertyId);

    const getStatusInfo = (status: MaintenanceStatus) => {
        const info = {
            [MaintenanceStatus.OPEN]: { text: 'Open', color: 'bg-red-100 text-red-800' },
            [MaintenanceStatus.IN_PROGRESS]: { text: 'In Progress', color: 'bg-yellow-100 text-yellow-800' },
            [MaintenanceStatus.DONE]: { text: 'Done', color: 'bg-green-100 text-green-800' },
        };
        return info[status];
    };

    const getCategoryIcon = (category: MaintenanceCategory) => {
        const iconMap: Record<MaintenanceCategory, React.ReactNode> = {
            [MaintenanceCategory.PLUMBING]: <Icons.WaterDropIcon className="w-5 h-5 text-blue-600" />,
            [MaintenanceCategory.ELECTRICAL]: <Icons.BoltIcon className="w-5 h-5 text-yellow-600" />,
            [MaintenanceCategory.APPLIANCE]: <Icons.WashingMachineIcon className="w-5 h-5 text-gray-600" />,
            [MaintenanceCategory.GENERAL]: <Icons.PencilIcon className="w-5 h-5 text-indigo-600" />,
            [MaintenanceCategory.CLEANING]: <Icons.TrashIcon className="w-5 h-5 text-green-600" />,
            [MaintenanceCategory.OTHER]: <Icons.ClipboardDocumentListIcon className="w-5 h-5 text-purple-600" />,
        };
        return <div className="p-2 bg-gray-100 rounded-full">{iconMap[category]}</div>;
    };
    
    const getDueDateInfo = (dueDate: string, status: MaintenanceStatus): { text: string; color: string } => {
        if (status === MaintenanceStatus.DONE) {
            return { text: 'Completed', color: 'text-green-600' };
        }
        const due = new Date(dueDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        due.setHours(0, 0, 0, 0);

        const diffTime = due.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays < 0) return { text: `Overdue by ${Math.abs(diffDays)} day(s)`, color: 'text-red-600' };
        if (diffDays === 0) return { text: 'Due Today', color: 'text-red-600' };
        return { text: `Due in ${diffDays} days`, color: 'text-neutral-600' };
    };

    const handleCommentSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (newComment.trim()) {
            onAddComment(request.id, newComment.trim());
            setNewComment('');
        }
    };

    const statusInfo = getStatusInfo(request.status);
    const dueDateInfo = getDueDateInfo(request.dueDate, request.status);

    return (
        <div className="bg-white p-4 rounded-lg border">
            <div className="flex justify-between items-start gap-4 cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
                <div className="flex items-start gap-3">
                    {getCategoryIcon(request.category)}
                    <div>
                        <h4 className="font-bold">{request.title}</h4>
                        <p className="text-sm text-neutral-500">For: {property?.title || 'N/A'}</p>
                    </div>
                </div>
                <div className="text-right flex-shrink-0">
                    <span className={`px-2 py-1 text-xs font-bold rounded-full ${statusInfo.color}`}>{statusInfo.text}</span>
                    <p className={`text-xs font-semibold mt-1 ${dueDateInfo.color}`}>{dueDateInfo.text}</p>
                </div>
            </div>

            {isExpanded && (
                <div className="mt-4 pt-4 border-t">
                    <p className="text-sm text-neutral-700 mb-4">{request.description || 'No description provided.'}</p>
                    {request.imageUrls && request.imageUrls.length > 0 && (
                        <div className="mb-4">
                            <img src={request.imageUrls[0]} alt="Maintenance issue" className="max-w-xs rounded-lg" />
                        </div>
                    )}
                    <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                        <p><strong>Created by:</strong> {createdByUser?.name}</p>
                        <p><strong>Assigned to:</strong> {assignedToUser?.name}</p>
                        <p><strong>Created on:</strong> {new Date(request.createdAt).toLocaleDateString()}</p>
                        <p><strong>Category:</strong> {request.category}</p>
                    </div>

                    <div className="mb-4">
                        <h5 className="font-semibold mb-2">Comments</h5>
                        <div className="space-y-3 max-h-48 overflow-y-auto custom-scrollbar pr-2">
                            {(request.comments || []).map((comment, index) => {
                                const commenter = users.find(u => u.id === comment.userId);
                                return (
                                    <div key={index} className="text-sm">
                                        <p><strong>{commenter?.name || 'Unknown'}:</strong> {comment.text}</p>
                                        <p className="text-xs text-neutral-400">{new Date(comment.timestamp).toLocaleString()}</p>
                                    </div>
                                );
                            })}
                        </div>
                        <form onSubmit={handleCommentSubmit} className="mt-3 flex gap-2">
                            <input type="text" value={newComment} onChange={e => setNewComment(e.target.value)} placeholder="Add a comment..." className="flex-grow p-2 border rounded-md text-sm" />
                            <button type="submit" className="px-4 py-2 bg-secondary text-white font-semibold rounded-md text-sm">Send</button>
                        </form>
                    </div>

                    <div>
                        <label htmlFor={`status-${request.id}`} className="text-sm font-medium text-gray-700 mr-2">Update Status:</label>
                        <select
                            id={`status-${request.id}`}
                            value={request.status}
                            onChange={(e) => onUpdateStatus(request.id, e.target.value as MaintenanceStatus)}
                            className="p-2 border rounded-md text-sm"
                        >
                            {Object.values(MaintenanceStatus).map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MaintenanceRequestCard;
