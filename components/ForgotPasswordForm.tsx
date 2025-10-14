import React, { useState } from 'react';
import type { User } from '../types';
import { MailIcon } from './Icons';

interface ForgotPasswordFormProps {
  users: User[];
  onBackToLogin: () => void;
}

const ForgotPasswordForm: React.FC<ForgotPasswordFormProps> = ({ users, onBackToLogin }) => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSendResetLink = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    const userExists = users.some(u => u.email.toLowerCase() === email.trim().toLowerCase());
    if (userExists) {
      setSuccess("If an account with that email exists, a password reset link has been sent (this is a demo).");
    } else {
      setError("No account found with that email address.");
    }
  };

  return (
    <form onSubmit={handleSendResetLink} className="space-y-4">
      <div>
        <label htmlFor="reset-email" className="block text-sm font-medium text-gray-700">Email Address</label>
        <div className="relative mt-1">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <MailIcon className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="email"
            id="reset-email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="block w-full rounded-md border-gray-300 pl-10 shadow-sm focus:border-primary focus:ring-primary sm:text-sm py-2"
            placeholder="you@example.com"
            required
          />
        </div>
        {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
        {success && <p className="text-green-600 text-xs mt-1">{success}</p>}
      </div>
      <div className="pt-2">
        <button type="submit" className="w-full bg-secondary hover:bg-primary text-white font-bold py-3 px-4 rounded-lg transition-colors duration-300">
          Send Reset Link
        </button>
      </div>
      <div className="text-center">
          <button type="button" onClick={onBackToLogin} className="text-sm font-medium text-primary hover:underline">
              &larr; Back to Login
          </button>
      </div>
    </form>
  );
};

export default ForgotPasswordForm;