import React, { useState } from 'react';
import type { Agreement, Property, Review } from '../types';
import { XCircleIcon, StarIcon } from './Icons';

interface LeaveReviewModalProps {
    details: { agreement: Agreement; property: Property };
    onClose: () => void;
    onSubmit: (agreementId: string, reviewData: Omit<Review, 'id' | 'author' | 'role' | 'time' | 'userId'>) => void;
}

const StarRating: React.FC<{ rating: number; onRate: (rating: number) => void }> = ({ rating, onRate }) => {
    return (
        <div className="flex justify-center gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
                <button
                    key={star}
                    type="button"
                    onClick={() => onRate(star)}
                    className="text-gray-300 hover:text-yellow-400 transition-colors"
                    aria-label={`Rate ${star} stars`}
                >
                    <StarIcon className={`w-10 h-10 transition-colors ${rating >= star ? 'text-yellow-400' : 'hover:text-yellow-300'}`} />
                </button>
            ))}
        </div>
    );
};

const LeaveReviewModal: React.FC<LeaveReviewModalProps> = ({ details, onClose, onSubmit }) => {
    const { agreement, property } = details;
    const [rating, setRating] = useState(0);
    const [goodThings, setGoodThings] = useState('');
    const [needsImprovement, setNeedsImprovement] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (rating === 0) {
            setError('Please provide a star rating.');
            return;
        }
        if (!goodThings.trim() && !needsImprovement.trim()) {
            setError('Please provide some feedback in at least one of the fields.');
            return;
        }
        setError('');
        onSubmit(agreement.id, { rating, goodThings, needsImprovement });
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4" onClick={onClose}>
            <div className="max-w-lg w-full bg-white p-8 rounded-lg shadow-xl relative" onClick={e => e.stopPropagation()}>
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
                    <XCircleIcon className="w-6 h-6" />
                </button>
                <h2 className="text-2xl font-bold mb-2 text-center">Leave a Review</h2>
                <p className="text-center text-neutral-600 mb-6">For: <span className="font-semibold">{property.title}</span></p>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-center text-sm font-medium text-gray-700 mb-2">Overall Rating</label>
                        <StarRating rating={rating} onRate={setRating} />
                    </div>

                    <div>
                        <label htmlFor="goodThings" className="block text-sm font-medium text-gray-700">What did you like?</label>
                        <textarea
                            id="goodThings"
                            value={goodThings}
                            onChange={(e) => setGoodThings(e.target.value)}
                            rows={3}
                            className="mt-1 block w-full p-2 border rounded-md shadow-sm focus:ring-primary focus:border-primary"
                            placeholder="e.g., Great location, responsive owner..."
                        />
                    </div>

                    <div>
                        <label htmlFor="needsImprovement" className="block text-sm font-medium text-gray-700">What could be improved?</label>
                        <textarea
                            id="needsImprovement"
                            value={needsImprovement}
                            onChange={(e) => setNeedsImprovement(e.target.value)}
                            rows={3}
                            className="mt-1 block w-full p-2 border rounded-md shadow-sm focus:ring-primary focus:border-primary"
                            placeholder="e.g., Parking was a bit tight..."
                        />
                    </div>

                    {error && <p className="text-red-500 text-sm text-center">{error}</p>}
                    
                    <button type="submit" className="w-full bg-secondary hover:bg-primary text-white font-bold py-3 px-4 rounded-lg transition-colors">
                        Submit Review
                    </button>
                </form>
            </div>
        </div>
    );
};

export default LeaveReviewModal;
