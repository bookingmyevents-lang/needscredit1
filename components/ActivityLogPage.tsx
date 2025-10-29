import React from 'react';
import type { ActivityLog } from '../types';
import { ActivityType } from '../types';
import * as Icons from './Icons';

interface ActivityLogPageProps {
  activities: ActivityLog[];
  onBack: () => void;
}

const ActivityIcon: React.FC<{ type: ActivityType }> = ({ type }) => {
    const iconMap: Record<ActivityType, React.ReactNode> = {
        [ActivityType.VIEWED_PROPERTY]: <Icons.HomeIcon className="w-5 h-5 text-blue-500" />,
        [ActivityType.REQUESTED_VIEWING]: <Icons.CalendarDaysIcon className="w-5 h-5 text-purple-500" />,
        [ActivityType.SUBMITTED_APPLICATION]: <Icons.DocumentTextIcon className="w-5 h-5 text-indigo-500" />,
        [ActivityType.APPROVED_APPLICATION]: <Icons.CheckCircleIcon className="w-5 h-5 text-green-500" />,
        [ActivityType.PAID_BILL]: <Icons.CreditCardIcon className="w-5 h-5 text-green-500" />,
        [ActivityType.GENERATED_BILL]: <Icons.BanknotesIcon className="w-5 h-5 text-blue-500" />,
        [ActivityType.PAID_RENT]: <Icons.BanknotesIcon className="w-5 h-5 text-green-500" />,
        [ActivityType.SIGNED_AGREEMENT]: <Icons.DocumentCheckIcon className="w-5 h-5 text-teal-500" />,
        [ActivityType.RAISED_DISPUTE]: <Icons.ExclamationTriangleIcon className="w-5 h-5 text-red-500" />,
        [ActivityType.AGREEMENT_ACTION_REQUIRED]: <Icons.PencilIcon className="w-5 h-5 text-orange-500" />,
        [ActivityType.CREATED_MAINTENANCE_REQUEST]: <Icons.ClipboardDocumentListIcon className="w-5 h-5 text-gray-500" />,
        [ActivityType.COMPLETED_MAINTENANCE_REQUEST]: <Icons.CheckCircleIcon className="w-5 h-5 text-green-500" />,
        [ActivityType.LEFT_REVIEW]: <Icons.StarIcon className="w-5 h-5 text-yellow-500" />,
    };
    return <div className="flex items-center justify-center w-10 h-10 bg-neutral-100 rounded-full">{iconMap[type] || <Icons.ListBulletIcon className="w-5 h-5 text-gray-500" />}</div>;
};

const timeSince = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + " years ago";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + " months ago";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + " days ago";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + " hours ago";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + " minutes ago";
    return "Just now";
};

const ActivityLogPage: React.FC<ActivityLogPageProps> = ({ activities, onBack }) => {
  return (
    <div className="max-w-4xl mx-auto">
      <button onClick={onBack} className="mb-4 text-sm font-medium text-primary hover:underline">
        &larr; Back to Dashboard
      </button>
      <div className="bg-white p-8 rounded-lg shadow-lg border">
        <h2 className="text-3xl font-bold text-neutral-900 mb-2">My Activity Log</h2>
        <p className="text-neutral-600 mb-6">A record of your recent actions on RentEase.</p>
        
        {activities.length > 0 ? (
          <ul className="space-y-4">
            {activities.map(activity => (
              <li key={activity.id} className="flex items-start gap-4 p-4 border-b last:border-b-0">
                <ActivityIcon type={activity.type} />
                <div className="flex-grow">
                  <p className="text-neutral-800">{activity.message}</p>
                  <p className="text-sm text-neutral-500 mt-1">{timeSince(activity.timestamp)}</p>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="text-center py-12">
            <Icons.ListBulletIcon className="w-12 h-12 mx-auto text-neutral-300" />
            <h3 className="mt-2 text-xl font-semibold text-neutral-700">No Activity Yet</h3>
            <p className="mt-1 text-neutral-500">Your recent actions will be logged here.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ActivityLogPage;
