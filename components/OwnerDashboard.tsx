import React, { useState, useMemo, useEffect } from 'react';
import type { Property, Viewing, User, Application, Agreement, Payment, Task } from '../types';
import { ViewingStatus, ApplicationStatus, PaymentType, TaskStatus } from '../types';
import { MailIcon, DocumentTextIcon, CheckCircleIcon, XCircleIcon, PencilIcon, PlusCircleIcon, CalendarDaysIcon, ClockIcon, ShieldCheckIcon, ExclamationTriangleIcon, DocumentCheckIcon, HomeIcon, CreditCardIcon, BanknotesIcon, TableCellsIcon, FilterIcon, UserCircleIcon, BuildingIcon, KeyIcon, ClipboardDocumentListIcon } from './Icons';

interface OwnerDashboardProps {
  user: User;
  properties: Property[];
  viewings: { viewing: Viewing, tenant: User, property: Property }[];
  applications: { application: Application, renter: User, property: Property }[];
  agreements: { agreement: Agreement, property: Property }[];
  paymentHistory: {
    payment: Payment;
    tenantName: string;
    propertyTitle: string;
  }[];
  tasks: Task[];
  users: User[];
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
  onConfirmKeyHandover: (applicationId: string) => void;
  onAddTask: (taskData: Omit<Task, 'id' | 'createdAt' | 'status' | 'createdBy'>) => void;
  onUpdateTaskStatus: (taskId: string, status: TaskStatus) => void;
}

interface ViewingCardProps {
  viewingData: { viewing: Viewing, tenant: User, property: Property };
  onUpdateViewingStatus: (viewingId: string, status: ViewingStatus) => void;
}

const KycStatusBadge: React.FC<{ status: 'Verified' | 'Pending' | 'Rejected' | 'Not Verified' }> = ({ status }) => {
    const statusInfo = {
        Verified: { text: 'Verified', color: 'bg-green-100 text-green-800', icon: <ShieldCheckIcon className="w-4 h-4" /> },
        Pending: { text: 'Pending', color: 'bg-yellow-100 text-yellow-800', icon: <ClockIcon className="w-4 h-4" /> },
        Rejected: { text: 'Rejected', color: 'bg-red-100 text-red-800', icon: <XCircleIcon className="w-4 h-4" /> },
        'Not Verified': { text: 'Not Verified', color: 'bg-gray-100 text-gray-800', icon: <ExclamationTriangleIcon className="w-4 h-4" /> },
    }[status];

    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-sm font-semibold rounded-full ${statusInfo.color}`}>
            {statusInfo.icon}
            {statusInfo.text}
        </span>
    );
};

const ViewingCard: React.FC<ViewingCardProps> = ({ viewingData, onUpdateViewingStatus }) => {
    const { viewing, tenant, property } = viewingData;
    const [isDetailsVisible, setIsDetailsVisible] = useState(false);
    
    const getStatusInfo = (status: ViewingStatus) => {
        switch(status) {
            case ViewingStatus.REQUESTED: return { text: 'Pending Verification', color: 'bg-yellow-100 text-yellow-800' };
            case ViewingStatus.ACCEPTED: return { text: 'Visit Approved', color: 'bg-green-100 text-green-800' };
            case ViewingStatus.DECLINED: return { text: 'Rejected', color: 'bg-red-100 text-red-800' };
            case ViewingStatus.COMPLETED: return { text: 'Visit Completed', color: 'bg-blue-100 text-blue-800' };
            case ViewingStatus.CANCELLED: return { text: 'Cancelled by Tenant', color: 'bg-gray-100 text-gray-800' };
            default: return { text: status, color: 'bg-gray-100 text-gray-800' };
        }
    };

    const statusInfo = getStatusInfo(viewing.status);

    return (
        <div className="bg-white p-4 rounded-lg border">
            <div className="flex justify-between items-start">
                <div>
                    <h4 className="font-bold text-lg">{tenant.name}</h4>
                    <p className="text-sm text-neutral-600 mb-2">Wants to view: <span className="font-medium text-primary">{property.title}</span></p>
                </div>
                 <span className={`px-2 py-1 text-xs font-bold rounded-full ${statusInfo.color}`}>{statusInfo.text}</span>
            </div>
            
            <div className="text-sm space-y-1 my-3 py-3 border-y">
                <div className="flex items-center gap-2"><MailIcon className="w-4 h-4 text-neutral-500" /><span>{tenant.email}</span></div>
                <div className="flex items-center gap-2"><ClockIcon className="w-4 h-4 text-neutral-500" /><span>Requested: {new Date(viewing.requestedAt).toLocaleString()}</span></div>
                {viewing.scheduledAt && <div className="flex items-center gap-2"><CalendarDaysIcon className="w-4 h-4 text-neutral-500" /><span>{viewing.status === ViewingStatus.REQUESTED ? 'Proposed Time' : 'Scheduled'}: {new Date(viewing.scheduledAt).toLocaleString()}</span></div>}
            </div>
            
            {viewing.verificationData && (
                <div className="mb-3">
                    <button onClick={() => setIsDetailsVisible(!isDetailsVisible)} className="text-sm font-semibold text-primary hover:underline">
                        {isDetailsVisible ? 'Hide' : 'Show'} Tenant Verification Info
                    </button>
                    {isDetailsVisible && (
                        <div className="mt-2 p-3 bg-neutral-50 rounded-md border text-sm space-y-2">
                            <div className="flex items-center gap-2"><UserCircleIcon className="w-4 h-4 text-neutral-500" /><strong>Full Name:</strong> {viewing.verificationData.fullName}</div>
                            <div className="flex items-center gap-2"><BuildingIcon className="w-4 h-4 text-neutral-500" /><strong>Employment:</strong> {viewing.verificationData.employmentDetails}</div>
                            <div className="flex items-center gap-2"><DocumentTextIcon className="w-4 h-4 text-neutral-500" /><strong>ID Proof:</strong> <a href={viewing.verificationData.idProofUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">View Document</a></div>
                        </div>
                    )}
                </div>
            )}
            
            <div className="flex justify-start items-center">
                 {viewing.status === ViewingStatus.REQUESTED ? (
                     <div className="flex gap-2">
                        <button onClick={() => onUpdateViewingStatus(viewing.id, ViewingStatus.ACCEPTED)} className="flex-1 bg-green-500 hover:bg-green-600 text-white text-sm font-bold py-2 px-3 rounded-md flex items-center justify-center gap-2">
                            <CheckCircleIcon className="w-5 h-5" /> Approve Visit
                        </button>
                        <button onClick={() => onUpdateViewingStatus(viewing.id, ViewingStatus.DECLINED)} className="flex-1 bg-red-500 hover:bg-red-600 text-white text-sm font-bold py-2 px-3 rounded-md flex items-center justify-center gap-2">
                            <XCircleIcon className="w-5 h-5" /> Reject Request
                        </button>
                    </div>
                ) : viewing.status === ViewingStatus.ACCEPTED ? (
                    <div className="flex gap-2">
                        <button onClick={() => onUpdateViewingStatus(viewing.id, ViewingStatus.COMPLETED)} className="flex-1 bg-blue-500 hover:bg-blue-600 text-white text-sm font-bold py-2 px-3 rounded-md flex items-center justify-center gap-2">
                            <CheckCircleIcon className="w-5 h-5" /> Mark Visit as Completed
                        </button>
                    </div>
                ) : <div />}
            </div>

        </div>
    );
};

interface ApplicationCardProps {
  appData: { application: Application, renter: User, property: Property };
  onUpdateApplicationStatus: (applicationId: string, status: ApplicationStatus) => void;
  agreements: { agreement: Agreement, property: Property }[];
  onViewAgreementDetails: (agreement: Agreement, property: Property) => void;
  onInitiateFinalizeAgreement: (application: Application, property: Property) => void;
  onConfirmKeyHandover: (applicationId: string) => void;
}

const ApplicationCard: React.FC<ApplicationCardProps> = ({ appData, onUpdateApplicationStatus, agreements, onViewAgreementDetails, onInitiateFinalizeAgreement, onConfirmKeyHandover }) => {
    const { application, renter, property } = appData;

    const getStatusInfo = (status: ApplicationStatus) => {
        const statusMap: Record<ApplicationStatus, { text: string; color: string }> = {
            [ApplicationStatus.PENDING]: { text: 'Finalization Pending', color: 'bg-yellow-100 text-yellow-800' },
            [ApplicationStatus.APPROVED]: { text: 'Approved', color: 'bg-green-100 text-green-800' },
            [ApplicationStatus.REJECTED]: { text: 'Rejected', color: 'bg-red-100 text-red-800' },
            [ApplicationStatus.AGREEMENT_SENT]: { text: 'Agreement Sent', color: 'bg-blue-100 text-blue-800' },
            [ApplicationStatus.AGREEMENT_SIGNED]: { text: 'Agreement Signed', color: 'bg-purple-100 text-purple-800' },
            [ApplicationStatus.DEPOSIT_DUE]: { text: 'Deposit Payment Pending', color: 'bg-orange-100 text-orange-800' },
            [ApplicationStatus.MOVE_IN_READY]: { text: 'Move-in Ready', color: 'bg-teal-100 text-teal-800' },
            [ApplicationStatus.COMPLETED]: { text: 'Rental Active', color: 'bg-green-100 text-green-800' },
            [ApplicationStatus.PLATFORM_FEE_DUE]: { text: 'Platform Fee Due', color: 'bg-orange-100 text-orange-800' },
            [ApplicationStatus.OFFLINE_PAYMENT_PENDING]: { text: 'Offline Payment Pending', color: 'bg-cyan-100 text-cyan-800' },
            [ApplicationStatus.RENT_DUE]: { text: 'Rent Due', color: 'bg-orange-100 text-orange-800' },
            [ApplicationStatus.RENT_PAID]: { text: 'Rent Paid', color: 'bg-green-100 text-green-800' },
        };
        return statusMap[status] || { text: (status as string).replace(/_/g, ' '), color: 'bg-gray-100 text-gray-800' };
    };
    
    const statusInfo = getStatusInfo(application.status);
    const agreement = agreements.find(a => a.agreement.id === `agree-${application.id}`)?.agreement;
    const isFromViewing = application.id.startsWith('app-from-viewing-');

    return (
        <div className="bg-white p-4 rounded-lg border">
            <div className="flex justify-between items-start">
                <div>
                    <h4 className="font-bold text-lg">{renter.name}</h4>
                    <p className="text-sm text-neutral-600 mb-2">Applied for: <span className="font-medium text-primary">{property.title}</span></p>
                </div>
                <span className={`px-2 py-1 text-xs font-bold rounded-full ${statusInfo.color}`}>{statusInfo.text}</span>
            </div>
            <div className="my-3 py-3 border-y text-sm space-y-2">
                 <div className="flex items-center justify-between"><span className="text-neutral-500">Applicant Email:</span> <span className="font-medium">{renter.email}</span></div>
                 <div className="flex items-center justify-between"><span className="text-neutral-500">Proposed Move-in:</span> <span className="font-medium">{new Date(application.moveInDate).toLocaleDateString()}</span></div>
                 <div className="flex items-center justify-between"><span className="text-neutral-500">Applicant KYC Status:</span> <KycStatusBadge status={renter.kycStatus} /></div>
            </div>
            
             <div className="flex justify-between items-center">
                {agreement ? (
                    <button onClick={() => onViewAgreementDetails(agreement, property)} className="text-sm font-semibold text-primary hover:underline flex items-center gap-1.5">
                        <DocumentTextIcon className="w-4 h-4"/> View Agreement
                    </button>
                ) : <div></div>}

                {application.status === ApplicationStatus.PENDING && isFromViewing ? (
                     <button onClick={() => onInitiateFinalizeAgreement(application, property)} className="bg-secondary hover:bg-primary text-white text-sm font-bold py-2 px-3 rounded-md flex items-center justify-center gap-2">
                        <PencilIcon className="w-5 h-5" /> Finalize Rent Agreement
                    </button>
                ) : application.status === ApplicationStatus.PENDING && !isFromViewing ? (
                     <div className="flex gap-2">
                        <button onClick={() => onUpdateApplicationStatus(application.id, ApplicationStatus.APPROVED)} className="bg-green-500 hover:bg-green-600 text-white text-sm font-bold py-2 px-3 rounded-md">Approve</button>
                        <button onClick={() => onUpdateApplicationStatus(application.id, ApplicationStatus.REJECTED)} className="bg-red-500 hover:bg-red-600 text-white text-sm font-bold py-2 px-3 rounded-md">Reject</button>
                    </div>
                ) : application.status === ApplicationStatus.MOVE_IN_READY ? (
                    <button onClick={() => onConfirmKeyHandover(application.id)} className="bg-green-600 hover:bg-green-700 text-white text-sm font-bold py-2 px-3 rounded-md flex items-center justify-center gap-2">
                        <KeyIcon className="w-5 h-5" /> Confirm Key Handover
                    </button>
                ) : null}
            </div>
        </div>
    );
};


const StatCard: React.FC<{ icon: React.ReactNode, title: string, value: string | number, color: string }> = ({ icon, title, value, color }) => (
    <div className="bg-white p-6 rounded-lg shadow-md border flex items-start gap-4">
        <div className={`p-3 rounded-full ${color}`}>
            {icon}
        </div>
        <div>
            <p className="text-3xl font-bold text-neutral-800">{value}</p>
            <h4 className="text-sm font-medium text-neutral-500">{title}</h4>
        </div>
    </div>
);

const getDueDateInfo = (dueDate: string): { text: string; color: string } => {
    const due = new Date(dueDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    due.setHours(0, 0, 0, 0);

    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return { text: `Overdue by ${Math.abs(diffDays)} day(s)`, color: 'bg-red-100 text-red-800' };
    if (diffDays === 0) return { text: 'Due Today', color: 'bg-red-100 text-red-800' };
    if (diffDays === 1) return { text: 'Due Tomorrow', color: 'bg-orange-100 text-orange-800' };
    if (diffDays <= 7) return { text: `Due in ${diffDays} days`, color: 'bg-yellow-100 text-yellow-800' };
    return { text: `Due ${due.toLocaleDateString()}`, color: 'bg-gray-100 text-gray-800' };
};

const TaskCard: React.FC<{ task: Task, users: User[], onUpdateStatus: (taskId: string, status: TaskStatus) => void, properties: Property[] }> = ({ task, users, onUpdateStatus, properties }) => {
    const assignedTo = users.find(u => u.id === task.assignedToId);
    const createdBy = users.find(u => u.id === task.createdBy);
    const property = properties.find(p => p.id === task.propertyId);
    const dueDateInfo = getDueDateInfo(task.dueDate);

    return (
        <div className="p-4 border rounded-lg bg-white shadow-sm">
            <div className="flex justify-between items-start gap-4">
                <h4 className="font-bold text-lg text-neutral-800">{task.title}</h4>
                {task.status !== TaskStatus.DONE && (
                    <span className={`px-2 py-1 text-xs font-bold rounded-full ${dueDateInfo.color}`}>{dueDateInfo.text}</span>
                )}
            </div>
            {task.description && <p className="text-sm text-neutral-600 mt-1">{task.description}</p>}
            
            <div className="mt-4 pt-4 border-t flex flex-wrap justify-between items-center gap-4">
                <div className="flex items-center gap-2 text-sm">
                    <strong className="font-semibold text-neutral-600">Property:</strong>
                    <span className="text-neutral-500">{property?.title || 'N/A'}</span>
                </div>
                <div className="flex items-center gap-2">
                    <label htmlFor={`status-${task.id}`} className="text-sm font-medium">Status:</label>
                    <select
                        id={`status-${task.id}`}
                        value={task.status}
                        onChange={(e) => onUpdateStatus(task.id, e.target.value as TaskStatus)}
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm py-1"
                    >
                        {Object.values(TaskStatus).map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                </div>
            </div>

            <div className="mt-3 pt-3 border-t flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-sm">
                 <div className="flex items-center gap-2">
                    {assignedTo?.profilePictureUrl ? (
                        <img src={assignedTo.profilePictureUrl} alt={assignedTo.name} className="w-8 h-8 rounded-full object-cover" />
                    ) : (
                        <UserCircleIcon className="w-8 h-8 text-neutral-400" />
                    )}
                    <div>
                        <p className="text-xs text-neutral-500">Assigned To</p>
                        <p className="font-semibold text-neutral-700">{assignedTo?.name || 'Unassigned'}</p>
                    </div>
                </div>
                 <div className="flex items-center gap-2">
                    {createdBy?.profilePictureUrl ? (
                        <img src={createdBy.profilePictureUrl} alt={createdBy.name} className="w-8 h-8 rounded-full object-cover" />
                    ) : (
                        <UserCircleIcon className="w-8 h-8 text-neutral-400" />
                    )}
                    <div>
                        <p className="text-xs text-neutral-500">Created By</p>
                        <p className="font-semibold text-neutral-700">{createdBy?.name || 'Unknown'}</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

const CreateTaskModal: React.FC<{
    onClose: () => void;
    onSubmit: (taskData: Omit<Task, 'id' | 'createdAt' | 'status' | 'createdBy'>) => void;
    properties: Property[];
    users: User[];
}> = ({ onClose, onSubmit, properties, users }) => {
    const [taskData, setTaskData] = useState({
        title: '',
        description: '',
        propertyId: '',
        assignedToId: '',
        dueDate: new Date(new Date().setDate(new Date().getDate() + 1)).toISOString().split('T')[0],
    });
    const [error, setError] = useState('');
    const today = new Date().toISOString().split('T')[0];

    useEffect(() => {
        if (!taskData.assignedToId && users.length > 0) {
            setTaskData(prev => ({ ...prev, assignedToId: users[0].id }));
        }
        if (!taskData.propertyId && properties.length > 0) {
            setTaskData(prev => ({ ...prev, propertyId: properties[0].id }));
        }
    }, [users, properties, taskData.assignedToId, taskData.propertyId]);


    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setTaskData({ ...taskData, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (!taskData.title || !taskData.propertyId || !taskData.assignedToId || !taskData.dueDate) {
            setError('Please fill out all required fields.');
            return;
        }
        onSubmit(taskData);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4" onClick={onClose}>
            <div className="max-w-lg w-full bg-white p-8 rounded-lg shadow-xl relative" onClick={e => e.stopPropagation()}>
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
                    <XCircleIcon className="w-6 h-6" />
                </button>
                <h2 className="text-2xl font-bold mb-6">Create New Task</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="title" className="block text-sm font-medium text-gray-700">Title</label>
                        <input type="text" name="title" id="title" value={taskData.title} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary" required />
                    </div>
                    <div>
                        <label htmlFor="description" className="block text-sm font-medium text-gray-700">Description (Optional)</label>
                        <textarea name="description" id="description" value={taskData.description} onChange={handleChange} rows={3} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"></textarea>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="propertyId" className="block text-sm font-medium text-gray-700">Property</label>
                            <select name="propertyId" id="propertyId" value={taskData.propertyId} onChange={handleChange} className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm" required>
                                {properties.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
                            </select>
                        </div>
                        <div>
                            <label htmlFor="assignedToId" className="block text-sm font-medium text-gray-700">Assign To</label>
                            <select name="assignedToId" id="assignedToId" value={taskData.assignedToId} onChange={handleChange} className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm" required>
                                {users.map(u => <option key={u.id} value={u.id}>{u.name} ({u.role === 'OWNER' ? 'Owner' : 'Renter'})</option>)}
                            </select>
                        </div>
                    </div>
                     <div>
                        <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700">Due Date</label>
                        <input type="date" name="dueDate" id="dueDate" value={taskData.dueDate} onChange={handleChange} min={today} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary" required />
                    </div>
                    {error && <p className="text-red-500 text-sm">{error}</p>}
                    <div className="flex justify-end gap-3 pt-4">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-neutral-200 hover:bg-neutral-300 text-neutral-800 font-semibold rounded-md text-sm">Cancel</button>
                        <button type="submit" className="px-4 py-2 bg-secondary hover:bg-primary text-white font-semibold rounded-md text-sm">Create Task</button>
                    </div>
                </form>
            </div>
        </div>
    );
};


const OwnerDashboard: React.FC<OwnerDashboardProps> = ({ user, properties, viewings, applications, agreements, paymentHistory, tasks, users, activeTab, onTabChange, onUpdateViewingStatus, onUpdateApplicationStatus, onEditProperty, onPostPropertyClick, onSignAgreement, onViewAgreementDetails, onPayPlatformFee, onAcknowledgeOfflinePayment, onMarkAsRented, onInitiateFinalizeAgreement, onConfirmKeyHandover, onAddTask, onUpdateTaskStatus }) => {
    const [paymentFilterType, setPaymentFilterType] = useState('');
    const [paymentFilterStatus, setPaymentFilterStatus] = useState('');
    const [paymentFilterStartDate, setPaymentFilterStartDate] = useState('');
    const [paymentFilterEndDate, setPaymentFilterEndDate] = useState('');
    
    const [isCreateTaskModalOpen, setIsCreateTaskModalOpen] = useState(false);
    const [taskSortBy, setTaskSortBy] = useState('dueDate-asc');
    const [taskFilterStatus, setTaskFilterStatus] = useState<TaskStatus | 'All'>('All');
    const [taskFilterProperty, setTaskFilterProperty] = useState<string>('All');
    const [taskFilterAssignee, setTaskFilterAssignee] = useState<string>('All');
    
    const pendingViewings = viewings.filter(v => v.viewing.status === ViewingStatus.REQUESTED);
    const pendingApplications = applications.filter(a => a.application.status === ApplicationStatus.PENDING);
    const pendingAgreements = agreements.filter(a => a.agreement.signedByTenant && !a.agreement.signedByOwner);
    const activeRentals = agreements.filter(a => a.agreement.signedByTenant && a.agreement.signedByOwner);
    const platformFeesDue = applications.filter(a => a.application.status === ApplicationStatus.PLATFORM_FEE_DUE);
    const offlinePaymentsPending = applications.filter(a => a.application.status === ApplicationStatus.OFFLINE_PAYMENT_PENDING);
    const keysReadyToHandover = applications.filter(a => a.application.status === ApplicationStatus.MOVE_IN_READY);

    const pendingActionCount = pendingViewings.length + pendingApplications.length + pendingAgreements.length + platformFeesDue.length + offlinePaymentsPending.length + keysReadyToHandover.length;
    const sortedPaymentHistory = [...paymentHistory].sort((a, b) => new Date(b.payment.paymentDate).getTime() - new Date(a.payment.paymentDate).getTime());
    
    const totalRentDue = applications
        .filter(({ application }) => application.status === ApplicationStatus.RENT_DUE)
        .reduce((sum, { application }) => sum + (application.amount || 0), 0);
        
    const filteredPaymentHistory = useMemo(() => {
        return sortedPaymentHistory.filter(({ payment }) => {
            if (paymentFilterType && payment.type !== paymentFilterType) return false;
            if (paymentFilterStatus && payment.status !== paymentFilterStatus) return false;
            
            const paymentDate = new Date(payment.paymentDate);
            if (paymentFilterStartDate && paymentDate < new Date(paymentFilterStartDate)) return false;
            if (paymentFilterEndDate) {
                const endDate = new Date(paymentFilterEndDate);
                endDate.setHours(23, 59, 59, 999);
                if (paymentDate > endDate) return false;
            }
            
            return true;
        });
    }, [sortedPaymentHistory, paymentFilterType, paymentFilterStatus, paymentFilterStartDate, paymentFilterEndDate]);

    const { netEarnings } = useMemo(() => {
        const totalRevenue = paymentHistory
            .filter(({ payment }) => (payment.type === PaymentType.RENT || payment.type === PaymentType.DEPOSIT) && payment.status === 'Paid')
            .reduce((sum, { payment }) => sum + payment.amount, 0);

        const totalFees = paymentHistory
            .filter(({ payment }) => payment.type === PaymentType.PLATFORM_FEE && payment.status === 'Paid')
            .reduce((sum, { payment }) => sum + payment.amount, 0);

        return { netEarnings: totalRevenue - totalFees };
    }, [paymentHistory]);

    const clearPaymentFilters = () => {
        setPaymentFilterType('');
        setPaymentFilterStatus('');
        setPaymentFilterStartDate('');
        setPaymentFilterEndDate('');
    };

    const relevantUsersForTasks = useMemo(() => {
        const tenantIds = new Set(applications.map(a => a.renter.id));
        return users.filter(u => u.id === user.id || tenantIds.has(u.id));
    }, [users, applications, user.id]);

    const filteredAndSortedTasks = useMemo(() => {
        let processedTasks = [...tasks];

        processedTasks = processedTasks.filter(task => {
            if (taskFilterStatus !== 'All' && task.status !== taskFilterStatus) return false;
            if (taskFilterProperty !== 'All' && task.propertyId !== taskFilterProperty) return false;
            if (taskFilterAssignee !== 'All' && task.assignedToId !== taskFilterAssignee) return false;
            return true;
        });

        processedTasks.sort((a, b) => {
            switch (taskSortBy) {
                case 'dueDate-asc': return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
                case 'dueDate-desc': return new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime();
                case 'createdAt-desc': return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
                case 'status':
                    const statusOrder = { [TaskStatus.TODO]: 1, [TaskStatus.IN_PROGRESS]: 2, [TaskStatus.DONE]: 3 };
                    return statusOrder[a.status] - statusOrder[b.status];
                default: return 0;
            }
        });

        return processedTasks;
    }, [tasks, taskSortBy, taskFilterStatus, taskFilterProperty, taskFilterAssignee]);


    const TabButton = ({ id, label, count }: { id: string, label: string, count?: number }) => (
        <button
            onClick={() => onTabChange(id)}
            className={`px-4 py-2 text-sm font-semibold rounded-t-lg border-b-2 transition-colors ${activeTab === id ? 'border-primary text-primary' : 'border-transparent text-neutral-500 hover:text-neutral-800'}`}
        >
            {label} {typeof count !== 'undefined' && count > 0 && <span className="bg-primary/10 text-primary text-xs font-bold rounded-full px-2 py-0.5 ml-1">{count}</span>}
        </button>
    );

    return (
        <div>
            {isCreateTaskModalOpen && (
                <CreateTaskModal
                    onClose={() => setIsCreateTaskModalOpen(false)}
                    onSubmit={onAddTask}
                    properties={properties}
                    users={relevantUsersForTasks}
                />
            )}

            <div className="flex flex-wrap gap-4 justify-between items-center mb-6">
                <div>
                  <h2 className="text-3xl font-bold text-neutral-900">Welcome, {user.name.split(' ')[0]}!</h2>
                  <p className="text-neutral-600">Here's a summary of your properties and activities.</p>
                </div>
                <button 
                    onClick={onPostPropertyClick}
                    className="flex items-center justify-center gap-2 px-4 py-2 bg-secondary hover:bg-primary text-white font-semibold rounded-lg transition-colors duration-300"
                >
                    <PlusCircleIcon className="w-5 h-5" />
                    <span>Post New Property</span>
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                <StatCard icon={<HomeIcon className="w-6 h-6 text-blue-800"/>} title="Total Properties" value={properties.length} color="bg-blue-100" />
                <StatCard icon={<DocumentCheckIcon className="w-6 h-6 text-green-800"/>} title="Active Rentals" value={activeRentals.length} color="bg-green-100" />
                <StatCard icon={<ExclamationTriangleIcon className="w-6 h-6 text-red-800"/>} title="Pending Actions" value={pendingActionCount} color="bg-red-100" />
                <StatCard icon={<CreditCardIcon className="w-6 h-6 text-purple-800"/>} title="Net Earnings" value={`₹${netEarnings.toLocaleString('en-IN')}`} color="bg-purple-100" />
                <StatCard icon={<BanknotesIcon className="w-6 h-6 text-orange-800" />} title="Current Rent Due" value={`₹${totalRentDue.toLocaleString('en-IN')}`} color="bg-orange-100" />
                <StatCard icon={<DocumentTextIcon className="w-6 h-6 text-indigo-800"/>} title="Total Applications" value={applications.length} color="bg-indigo-100" />
            </div>
            
            <div className="border-b mb-6">
                <TabButton id="actions" label="Action Required" count={pendingActionCount} />
                <TabButton id="tasks" label="Tasks" count={tasks.filter(t => t.status !== TaskStatus.DONE).length} />
                <TabButton id="viewings" label="All Viewings" count={viewings.length} />
                <TabButton id="applications" label="All Applications" count={applications.length} />
                <TabButton id="agreements" label="Agreements" count={agreements.length} />
                <TabButton id="properties" label="My Properties" count={properties.length} />
                <TabButton id="paymentHistory" label="Payment History" count={paymentHistory.length} />
            </div>

            {activeTab === 'actions' && (
                <div className="space-y-6">
                    {keysReadyToHandover.length > 0 && (
                        <div>
                            <h3 className="text-xl font-semibold mb-2 flex items-center gap-2"><KeyIcon className="w-6 h-6 text-teal-500"/> Confirm Key Handover</h3>
                            <div className="space-y-4">
                                {keysReadyToHandover.map(appData => <ApplicationCard key={appData.application.id} appData={appData} onUpdateApplicationStatus={onUpdateApplicationStatus} agreements={agreements} onViewAgreementDetails={onViewAgreementDetails} onInitiateFinalizeAgreement={onInitiateFinalizeAgreement} onConfirmKeyHandover={onConfirmKeyHandover} />)}
                            </div>
                        </div>
                    )}
                    {platformFeesDue.length > 0 && (
                        <div>
                            <h3 className="text-xl font-semibold mb-2 flex items-center gap-2"><CreditCardIcon className="w-6 h-6 text-orange-500"/> Platform Fees Due</h3>
                            <div className="space-y-4">
                                {platformFeesDue.map(({ application, renter, property }) => (
                                    <div key={application.id} className="p-4 border border-orange-200 rounded-lg bg-white flex justify-between items-center">
                                        <div>
                                            <p className="font-semibold">{property.title}</p>
                                            <p className="text-sm text-neutral-500">Renter: {renter.name}</p>
                                        </div>
                                        <button onClick={() => onPayPlatformFee(application.id)} className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-md">Pay Fee: ₹{application.platformFee?.amount}</button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                     {offlinePaymentsPending.length > 0 && (
                        <div>
                            <h3 className="text-xl font-semibold mb-2 flex items-center gap-2"><BanknotesIcon className="w-6 h-6 text-cyan-500"/> Acknowledge Offline Payments</h3>
                            <div className="space-y-4">
                                {offlinePaymentsPending.map(({ application, renter, property }) => (
                                    <div key={application.id} className="p-4 border border-cyan-200 rounded-lg bg-white">
                                        <div className="flex justify-between items-center">
                                            <div>
                                                <p className="font-semibold">{property.title}</p>
                                                <p className="text-sm text-neutral-500">Renter: {renter.name} | Amount: <span className="font-bold">₹{application.amount?.toLocaleString()}</span></p>
                                            </div>
                                            <button onClick={() => onAcknowledgeOfflinePayment(application.id)} className="px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white font-semibold rounded-md">Acknowledge</button>
                                        </div>
                                        <p className="mt-2 pt-2 border-t text-sm text-neutral-600">UPI Transaction ID: <span className="font-mono bg-gray-100 p-1 rounded">{application.offlinePaymentDetails?.upiTransactionId}</span></p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                    {pendingViewings.length > 0 && (
                        <div>
                            <h3 className="text-xl font-semibold mb-2 flex items-center gap-2"><CalendarDaysIcon className="w-6 h-6 text-yellow-500"/> Pending Viewing Requests</h3>
                            <div className="space-y-4">
                                {pendingViewings.map(v => <ViewingCard key={v.viewing.id} viewingData={v} onUpdateViewingStatus={onUpdateViewingStatus} />)}
                            </div>
                        </div>
                    )}
                    {pendingApplications.length > 0 && (
                        <div>
                            <h3 className="text-xl font-semibold mb-2 flex items-center gap-2"><DocumentTextIcon className="w-6 h-6 text-indigo-500"/> Pending Applications</h3>
                            <div className="space-y-4">
                                {pendingApplications.map(appData => <ApplicationCard key={appData.application.id} appData={appData} onUpdateApplicationStatus={onUpdateApplicationStatus} agreements={agreements} onViewAgreementDetails={onViewAgreementDetails} onInitiateFinalizeAgreement={onInitiateFinalizeAgreement} onConfirmKeyHandover={onConfirmKeyHandover} />)}
                            </div>
                        </div>
                    )}
                    {pendingActionCount === 0 && <p className="text-neutral-500 bg-white p-6 rounded-lg text-center">No pending actions. You're all caught up!</p>}
                </div>
            )}
            
            {activeTab === 'tasks' && (
                <div className="bg-white p-6 rounded-lg shadow-md border">
                    <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                        <h3 className="text-xl font-semibold text-neutral-800 flex items-center gap-2"><ClipboardDocumentListIcon className="w-6 h-6"/> Manage Tasks</h3>
                        <button onClick={() => setIsCreateTaskModalOpen(true)} className="flex items-center justify-center gap-2 px-4 py-2 bg-secondary hover:bg-primary text-white font-semibold rounded-lg transition-colors duration-300">
                            <PlusCircleIcon className="w-5 h-5" /> Create Task
                        </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 p-4 bg-neutral-50 rounded-lg border">
                        <div>
                            <label htmlFor="task-sort" className="block text-sm font-medium text-gray-700">Sort By</label>
                            <select id="task-sort" value={taskSortBy} onChange={e => setTaskSortBy(e.target.value)} className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm">
                                <option value="dueDate-asc">Due Date (Soonest)</option>
                                <option value="createdAt-desc">Date Created (Newest)</option>
                                <option value="dueDate-desc">Due Date (Latest)</option>
                                <option value="status">Status</option>
                            </select>
                        </div>
                        <div>
                            <label htmlFor="task-filter-status" className="block text-sm font-medium text-gray-700">Status</label>
                            <select id="task-filter-status" value={taskFilterStatus} onChange={e => setTaskFilterStatus(e.target.value as TaskStatus | 'All')} className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm">
                                <option value="All">All Statuses</option>
                                {Object.values(TaskStatus).map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>
                        <div>
                            <label htmlFor="task-filter-property" className="block text-sm font-medium text-gray-700">Property</label>
                            <select id="task-filter-property" value={taskFilterProperty} onChange={e => setTaskFilterProperty(e.target.value)} className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm">
                                <option value="All">All Properties</option>
                                {properties.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
                            </select>
                        </div>
                        <div>
                            <label htmlFor="task-filter-assignee" className="block text-sm font-medium text-gray-700">Assignee</label>
                            <select id="task-filter-assignee" value={taskFilterAssignee} onChange={e => setTaskFilterAssignee(e.target.value)} className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm">
                                <option value="All">All Assignees</option>
                                {relevantUsersForTasks.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                            </select>
                        </div>
                    </div>
                    <div className="space-y-4">
                        {filteredAndSortedTasks.length > 0 ? (
                            filteredAndSortedTasks.map(task => <TaskCard key={task.id} task={task} users={users} properties={properties} onUpdateStatus={onUpdateTaskStatus} />)
                        ) : (
                            <p className="text-center py-8 text-neutral-500">No tasks match the current filters.</p>
                        )}
                    </div>
                </div>
            )}

            {activeTab === 'viewings' && (
                <div>
                     {viewings.length > 0 ? (
                        <div className="space-y-4">
                            {viewings.map(v => <ViewingCard key={v.viewing.id} viewingData={v} onUpdateViewingStatus={onUpdateViewingStatus} />)}
                        </div>
                    ) : (
                        <p className="text-neutral-500 bg-white p-6 rounded-lg text-center">No viewing requests found.</p>
                    )}
                </div>
            )}
            
            {activeTab === 'applications' && (
                <div>
                     {applications.length > 0 ? (
                        <div className="space-y-4">
                            {applications.map(appData => <ApplicationCard key={appData.application.id} appData={appData} onUpdateApplicationStatus={onUpdateApplicationStatus} agreements={agreements} onViewAgreementDetails={onViewAgreementDetails} onInitiateFinalizeAgreement={onInitiateFinalizeAgreement} onConfirmKeyHandover={onConfirmKeyHandover} />)}
                        </div>
                    ) : (
                        <p className="text-neutral-500 bg-white p-6 rounded-lg text-center">No applications received for your properties.</p>
                    )}
                </div>
            )}

            {activeTab === 'agreements' && (
                 <div className="space-y-4">
                    {agreements.length > 0 ? agreements.map(({ agreement, property }) => {
                        let statusText, statusColor, actionButton;
                        
                        const viewButton = <button onClick={() => onViewAgreementDetails(agreement, property)} className="text-sm font-semibold text-primary hover:underline">View Details</button>;
                        
                        if (agreement.signedByOwner && agreement.signedByTenant) {
                            statusText = "Completed";
                            statusColor = "bg-green-100 text-green-800";
                            actionButton = null;
                        } else if (agreement.signedByTenant) {
                            statusText = "Action Required";
                            statusColor = "bg-yellow-100 text-yellow-800";
                            actionButton = <button onClick={() => onSignAgreement(agreement, property)} className="px-3 py-1.5 bg-secondary text-white text-sm font-semibold rounded-md">Review & Sign</button>;
                        } else {
                            statusText = "Waiting for Tenant";
                            statusColor = "bg-gray-100 text-gray-800";
                            actionButton = <button disabled className="text-sm font-semibold text-neutral-400 cursor-not-allowed">Awaiting Signature</button>;
                        }

                        return (
                             <div key={agreement.id} className="p-4 border rounded-lg bg-white">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h3 className="font-bold text-lg">{property.title}</h3>
                                        <p className="text-sm text-neutral-500">{property.address}</p>
                                    </div>
                                     <span className={`px-2 py-1 text-xs font-bold rounded-full ${statusColor}`}>{statusText}</span>
                                </div>
                                 <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-sm text-neutral-600">
                                    <span>Tenant Signed: <span className={`font-semibold ${agreement.signedByTenant ? 'text-green-600' : 'text-red-600'}`}>{agreement.signedByTenant ? 'Yes' : 'No'}</span></span>
                                    <span>Owner Signed: <span className={`font-semibold ${agreement.signedByOwner ? 'text-green-600' : 'text-red-600'}`}>{agreement.signedByOwner ? 'Yes' : 'No'}</span></span>
                                </div>
                                <div className="mt-4 pt-4 border-t flex justify-between items-center">
                                    {viewButton}
                                    {actionButton}
                                </div>
                            </div>
                        )
                    }) : <p className="text-neutral-500 bg-white p-6 rounded-lg text-center">No agreements found.</p>}
                </div>
            )}

            {activeTab === 'properties' && (
                <div className="space-y-4">
                    {properties.map(prop => (
                        <div key={prop.id} className="bg-white p-4 rounded-lg border">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h4 className="font-bold">{prop.title || 'Untitled Property'}</h4>
                                    <p className="text-sm text-neutral-500">{prop.address || 'No address provided'}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    {prop.availability === 'available' && (
                                        <button
                                            onClick={() => onMarkAsRented(prop.id)}
                                            className="flex items-center gap-2 px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white text-xs font-semibold rounded-md transition-colors"
                                            title="Mark this property as rented"
                                        >
                                            <CheckCircleIcon className="w-4 h-4" />
                                            Mark as Rented
                                        </button>
                                    )}
                                    <button 
                                        onClick={() => onEditProperty(prop)} 
                                        className="p-2 text-neutral-500 hover:bg-neutral-100 hover:text-primary rounded-full transition-colors"
                                        title="Edit Property"
                                    >
                                        <PencilIcon className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                            <span className={`mt-2 inline-block px-2 py-1 text-xs font-bold text-white rounded-full ${prop.availability === 'available' ? 'bg-green-500' : 'bg-red-500'}`}>
                                {prop.availability === 'available' ? 'Available' : 'Rented'}
                            </span>
                        </div>
                    ))}
                </div>
            )}
            
            {activeTab === 'paymentHistory' && (
                <div>
                     <div className="bg-white p-6 rounded-lg shadow-md border">
                        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                            <h3 className="text-xl font-semibold text-neutral-800 flex items-center gap-2"><FilterIcon className="w-5 h-5"/> Filter Transactions</h3>
                            <button onClick={clearPaymentFilters} className="text-sm font-semibold text-primary hover:underline">Clear Filters</button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div>
                                <label htmlFor="filterType" className="text-sm font-medium text-gray-700">Type</label>
                                <select id="filterType" value={paymentFilterType} onChange={e => setPaymentFilterType(e.target.value)} className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm">
                                    <option value="">All Types</option>
                                    {Object.values(PaymentType).map(type => <option key={type} value={type}>{type.replace(/_/g, ' ')}</option>)}
                                </select>
                            </div>
                            <div>
                                <label htmlFor="filterStatus" className="text-sm font-medium text-gray-700">Status</label>
                                <select id="filterStatus" value={paymentFilterStatus} onChange={e => setPaymentFilterStatus(e.target.value)} className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm">
                                    <option value="">All Statuses</option>
                                    <option value="Paid">Paid</option>
                                    <option value="Failed">Failed</option>
                                    <option value="Refunded">Refunded</option>
                                </select>
                            </div>
                            <div>
                                <label htmlFor="filterStartDate" className="text-sm font-medium text-gray-700">Start Date</label>
                                <input type="date" id="filterStartDate" value={paymentFilterStartDate} onChange={e => setPaymentFilterStartDate(e.target.value)} className="mt-1 block w-full py-2 px-3 border border-gray-300 rounded-md shadow-sm"/>
                            </div>
                            <div>
                                <label htmlFor="filterEndDate" className="text-sm font-medium text-gray-700">End Date</label>
                                <input type="date" id="filterEndDate" value={paymentFilterEndDate} onChange={e => setPaymentFilterEndDate(e.target.value)} className="mt-1 block w-full py-2 px-3 border border-gray-300 rounded-md shadow-sm"/>
                            </div>
                        </div>
                     </div>
                    {filteredPaymentHistory.length > 0 ? (
                        <div className="bg-white p-6 rounded-lg shadow-md border mt-6">
                            <h3 className="text-xl font-semibold mb-4 text-neutral-800">Transaction History ({filteredPaymentHistory.length} results)</h3>
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Property</th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">From/To</th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {filteredPaymentHistory.map(({ payment, tenantName, propertyTitle }) => {
                                            const isFee = payment.type === PaymentType.PLATFORM_FEE;
                                            return (
                                            <tr key={payment.id} className={isFee ? 'bg-red-50/50' : ''}>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{propertyTitle}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{isFee ? 'Platform' : tenantName}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 capitalize">{isFee ? 'Service Fee' : payment.type.toLowerCase().replace('_', ' ')}</td>
                                                <td className={`px-6 py-4 whitespace-nowrap text-sm font-semibold ${isFee ? 'text-red-600' : 'text-green-600'}`}>
                                                    {isFee ? `- ₹${payment.amount.toLocaleString('en-IN')}` : `+ ₹${payment.amount.toLocaleString('en-IN')}`}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{new Date(payment.paymentDate).toLocaleDateString()}</td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`px-3 py-1 text-sm font-semibold rounded-full ${
                                                        payment.status === 'Paid' ? (isFee ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800') :
                                                        payment.status === 'Failed' ? 'bg-red-100 text-red-800' :
                                                        'bg-indigo-100 text-indigo-800'
                                                    }`}>
                                                        {isFee ? 'Deducted' : payment.status}
                                                    </span>
                                                </td>
                                            </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-12 bg-white rounded-lg border mt-6">
                          <TableCellsIcon className="w-12 h-12 mx-auto text-neutral-300" />
                          <h3 className="mt-2 text-xl font-semibold text-neutral-700">No Payments Found</h3>
                          <p className="mt-1 text-neutral-500">No transactions match your current filter criteria.</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default OwnerDashboard;