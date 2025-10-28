import React from 'react';
import type { Agreement, Application, Property, Payment } from '../types';
import { ApplicationStatus, PaymentType } from '../types';
import * as Icons from './Icons';

interface RentCycleTrackerProps {
    agreement: Agreement;
    applications: Application[];
    property: Property;
    payments: Payment[];
    onPayNow?: (application: Application, property: Property) => void;
}

const RentCycleTracker: React.FC<RentCycleTrackerProps> = ({ agreement, applications, property, payments, onPayNow }) => {
    const months = React.useMemo(() => {
        const start = new Date(agreement.startDate);
        const end = new Date(agreement.endDate);
        const monthList = [];
        let current = new Date(start.getFullYear(), start.getMonth(), 1);

        while (current <= end) {
            monthList.push(new Date(current));
            current.setMonth(current.getMonth() + 1);
        }
        return monthList;
    }, [agreement.startDate, agreement.endDate]);

    const getMonthStatus = (monthDate: Date) => {
        const today = new Date();
        const rentApp = applications.find(app => {
            if (!app.dueDate) return false;
            const dueDate = new Date(app.dueDate);
            return dueDate.getFullYear() === monthDate.getFullYear() && dueDate.getMonth() === monthDate.getMonth();
        });

        if (rentApp?.status === ApplicationStatus.RENT_PAID) {
            const payment = rentApp.paymentHistory?.[0] || payments?.find(p => 
                p.propertyId === rentApp.propertyId && 
                p.userId === rentApp.renterId &&
                p.type === PaymentType.RENT &&
                p.amount === rentApp.amount &&
                rentApp.dueDate &&
                new Date(p.paymentDate).getMonth() === new Date(rentApp.dueDate).getMonth() &&
                new Date(p.paymentDate).getFullYear() === new Date(rentApp.dueDate).getFullYear()
            );
            return { status: 'Paid', app: rentApp, paidOn: payment?.paymentDate };
        }
        if (rentApp?.status === ApplicationStatus.RENT_DUE || rentApp?.status === ApplicationStatus.OFFLINE_PAYMENT_PENDING) {
            return { status: 'Due', app: rentApp };
        }

        // If no app, check date
        if (monthDate.getFullYear() < today.getFullYear() || (monthDate.getFullYear() === today.getFullYear() && monthDate.getMonth() < today.getMonth())) {
            return { status: 'Overdue', app: null }; // Should have an app, but as a fallback
        }
        
        return { status: 'Upcoming', app: null };
    };

    return (
        <div>
            <h4 className="text-sm font-semibold mb-2 text-neutral-700">Rent Payment Schedule</h4>
            <div className="bg-neutral-100 p-3 rounded-lg overflow-x-auto custom-scrollbar">
                <div className="flex space-x-1 min-w-max">
                    {months.map((monthDate, index) => {
                        const { status, app } = getMonthStatus(monthDate);
                        const monthLabel = monthDate.toLocaleString('default', { month: 'short', year: '2-digit' });
                        const isCurrentMonth = new Date().getFullYear() === monthDate.getFullYear() && new Date().getMonth() === monthDate.getMonth();

                        let bgColor = 'bg-gray-200';
                        let textColor = 'text-gray-600';
                        let Icon = Icons.CalendarDaysIcon;
                        let iconColor = 'text-gray-500';

                        switch (status) {
                            case 'Paid':
                                bgColor = 'bg-green-500';
                                textColor = 'text-white';
                                Icon = Icons.CheckCircleIcon;
                                iconColor = 'text-white';
                                break;
                            case 'Due':
                            case 'Overdue':
                                bgColor = 'bg-red-500';
                                textColor = 'text-white';
                                Icon = Icons.ExclamationTriangleIcon;
                                iconColor = 'text-white';
                                break;
                        }

                        const monthComponent = (
                            <div
                                key={index}
                                className={`relative flex-1 min-w-[70px] p-2 rounded-md text-center group ${bgColor} ${isCurrentMonth && status !== 'Paid' ? 'ring-2 ring-primary ring-offset-2' : ''} ${(status === 'Due' || status === 'Overdue') && onPayNow && app ? 'cursor-pointer hover:opacity-90' : ''}`}
                                onClick={() => (status === 'Due' || status === 'Overdue') && app && onPayNow ? onPayNow(app, property) : undefined}
                                title={`${monthLabel} - ${status}`}
                            >
                                <Icon className={`w-5 h-5 mx-auto mb-1 ${iconColor}`} />
                                <p className={`text-xs font-bold ${textColor}`}>{monthLabel}</p>
                                {(status === 'Due' || status === 'Overdue') && onPayNow && app && <p className={`text-xs font-semibold ${textColor}`}>Pay Now</p>}
                            </div>
                        );
                        
                        return monthComponent;
                    })}
                </div>
            </div>
        </div>
    );
};

export default RentCycleTracker;
