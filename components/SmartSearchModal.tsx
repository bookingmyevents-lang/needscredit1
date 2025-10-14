import React, { useState } from 'react';
import { SparklesIcon, XCircleIcon } from './Icons';

interface SmartSearchModalProps {
  isOpen: boolean;
  isLoading: boolean;
  onClose: () => void;
  onSearch: (query: string) => void;
}

const SmartSearchModal: React.FC<SmartSearchModalProps> = ({ isOpen, isLoading, onClose, onSearch }) => {
  const [query, setQuery] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch(query.trim());
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4" onClick={onClose}>
      <div className="w-full max-w-lg bg-white p-8 rounded-xl shadow-2xl relative" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
          <XCircleIcon className="w-6 h-6" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <SparklesIcon className="w-8 h-8 text-primary" />
          <h2 className="text-2xl font-bold text-neutral-800">Smart Search</h2>
        </div>
        <p className="text-neutral-500 mb-6 text-sm">Describe your ideal home in plain English, and let our AI find it for you.</p>

        <form onSubmit={handleSubmit}>
          <textarea
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full h-32 p-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary resize-none"
            placeholder="e.g., 'Find me a 2 bedroom apartment in Patia under ₹25000 with a gym and parking'"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !query.trim()}
            className="mt-4 w-full bg-secondary hover:bg-primary text-white font-bold py-3 px-4 rounded-lg transition-colors duration-300 flex items-center justify-center gap-2 disabled:bg-neutral-300 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Analyzing your request...
              </>
            ) : (
              <>
                <SparklesIcon className="w-5 h-5" />
                Find My Home
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default SmartSearchModal;
