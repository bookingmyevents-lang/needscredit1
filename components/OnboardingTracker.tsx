import React from 'react';
import { ApplicationStatus } from '../types';
import { CheckCircleIcon, DocumentTextIcon, PencilIcon, BanknotesIcon, KeyIcon } from './Icons';

interface OnboardingTrackerProps {
    status: ApplicationStatus;
}

const steps = [
    { name: 'Application', statuses: [ApplicationStatus.PENDING], icon: DocumentTextIcon },
    { name: 'Approval', statuses: [ApplicationStatus.APPROVED], icon: CheckCircleIcon },
    { name: 'Agreement', statuses: [ApplicationStatus.AGREEMENT_SENT, ApplicationStatus.AGREEMENT_SIGNED], icon: PencilIcon },
    { name: 'Deposit', statuses: [ApplicationStatus.DEPOSIT_DUE, ApplicationStatus.DEPOSIT_PAID], icon: BanknotesIcon },
    { name: 'Move-in', statuses: [ApplicationStatus.MOVE_IN_READY, ApplicationStatus.COMPLETED], icon: KeyIcon },
];

const OnboardingTracker: React.FC<OnboardingTrackerProps> = ({ status }) => {
    const currentStepIndex = Math.max(0, steps.findIndex(step => step.statuses.includes(status)));

    return (
        <div className="w-full">
            {/* Mobile View */}
            <div className="md:hidden">
                <ol className="space-y-4">
                    {steps.map((step, stepIdx) => {
                        const isCompleted = status === ApplicationStatus.COMPLETED || stepIdx < currentStepIndex;
                        const isCurrent = !isCompleted && stepIdx === currentStepIndex;
                        const Icon = step.icon;

                        return (
                             <li key={step.name} className="flex items-start">
                                <div className="flex-shrink-0">
                                    <div className={`flex h-10 w-10 items-center justify-center rounded-full ${isCompleted ? 'bg-primary' : isCurrent ? 'border-2 border-primary bg-white' : 'border-2 border-gray-300 bg-white'}`}>
                                        {isCompleted ? (
                                            <CheckCircleIcon className="h-6 w-6 text-white" />
                                        ) : (
                                            <Icon className={`h-6 w-6 ${isCurrent ? 'text-primary' : 'text-gray-400'}`} />
                                        )}
                                    </div>
                                </div>
                                <div className="ml-4">
                                    <h4 className={`text-lg font-semibold ${isCurrent ? 'text-primary' : 'text-neutral-800'}`}>{step.name}</h4>
                                    <span className={`text-sm ${isCompleted ? 'text-green-600 font-semibold' : isCurrent ? 'text-primary' : 'text-gray-500'}`}>
                                        {isCompleted ? 'Completed' : isCurrent ? 'Current Step' : 'Pending'}
                                    </span>
                                </div>
                            </li>
                        );
                    })}
                </ol>
            </div>

            {/* Desktop View */}
            <nav aria-label="Progress" className="hidden md:block">
                <ol role="list" className="flex items-center">
                    {steps.map((step, stepIdx) => {
                        const isCompleted = status === ApplicationStatus.COMPLETED || stepIdx < currentStepIndex;
                        const isCurrent = !isCompleted && stepIdx === currentStepIndex;
                        const Icon = step.icon;

                        return (
                            <li key={step.name} className="relative flex-1">
                                {stepIdx !== 0 && (
                                    <div className="absolute inset-0 flex items-center" aria-hidden="true">
                                        <div className={`h-0.5 w-full ${stepIdx <= currentStepIndex ? 'bg-primary' : 'bg-gray-200'}`} />
                                    </div>
                                )}
                                <div className="relative flex flex-col items-center p-2">
                                    <div className={`flex h-12 w-12 items-center justify-center rounded-full ${isCompleted ? 'bg-primary' : isCurrent ? 'border-4 border-primary bg-white' : 'border-2 border-gray-300 bg-white'}`}>
                                        {isCompleted ? (
                                            <CheckCircleIcon className="h-7 w-7 text-white" />
                                        ) : (
                                            <Icon className={`h-7 w-7 ${isCurrent ? 'text-primary' : 'text-gray-400'}`} />
                                        )}
                                    </div>
                                    <p className={`mt-3 text-sm font-semibold ${isCurrent ? 'text-primary' : 'text-neutral-600'}`}>
                                        {step.name}
                                    </p>
                                </div>
                            </li>
                        );
                    })}
                </ol>
            </nav>
        </div>
    );
};

export default OnboardingTracker;
