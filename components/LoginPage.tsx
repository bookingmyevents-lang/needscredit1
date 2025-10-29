import React, { useState, useEffect } from 'react';
import type { User } from '../types';
import { UserRole } from '../types';
import { HomeIcon, ArrowLeftIcon } from './Icons';
import ForgotPasswordForm from './ForgotPasswordForm';
import SignupForm from './SignupForm';

interface LoginPageProps {
  users: User[];
  onLogin: (email: string, pass: string) => void;
  onBackToHome: () => void;
  onSignup: (name: string, email: string, pass: string, role: UserRole, profilePictureUrl: string) => boolean;
}

const TabButton: React.FC<{ label: string; isActive: boolean; onClick: () => void }> = ({ label, isActive, onClick }) => (
    <button
        type="button"
        onClick={onClick}
        className={`flex-1 py-3 text-sm font-semibold border-b-2 transition-colors ${
            isActive ? 'border-primary text-primary' : 'border-transparent text-neutral-500 hover:text-neutral-800'
        }`}
    >
        {label}
    </button>
);


const LoginPage: React.FC<LoginPageProps> = ({ users, onLogin, onBackToHome, onSignup }) => {
  const [view, setView] = useState<'login' | 'forgot_password' | 'signup'>('login');
  const [activeRole, setActiveRole] = useState<UserRole>(UserRole.RENTER);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Auto-fill form with demo credentials when role changes
  useEffect(() => {
    const demoCredentials = {
        [UserRole.RENTER]: { email: 'renter@example.com', pass: 'password' },
        [UserRole.OWNER]: { email: 'owner@example.com', pass: 'password' },
        [UserRole.SUPER_ADMIN]: { email: 'admin@example.com', pass: 'password' },
    };
    
    const creds = demoCredentials[activeRole];
    if (creds) {
        setEmail(creds.email);
        setPassword(creds.pass);
    }
  }, [activeRole]);


  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    onLogin(email, password);
  };

  const renderFormContent = () => {
    if (view === 'forgot_password') {
      return (
        <>
            <h2 className="text-2xl font-bold text-center text-neutral-800 mb-2">Reset Password</h2>
            <p className="text-center text-neutral-500 mb-8 text-sm">Enter your email to get started.</p>
            <ForgotPasswordForm users={users} onBackToLogin={() => setView('login')} />
        </>
      );
    }
    
    if (view === 'signup') {
        return (
            <>
                <h2 className="text-2xl font-bold text-center text-neutral-800 mb-2">Create an Account</h2>
                <p className="text-center text-neutral-500 mb-8 text-sm">Join RentEase to find your next home.</p>
                <SignupForm users={users} onSignup={onSignup} onBackToLogin={() => setView('login')} />
            </>
        )
    }

    return (
      <>
        <div className="flex border-b mb-6">
            <TabButton label="Renter" isActive={activeRole === UserRole.RENTER} onClick={() => setActiveRole(UserRole.RENTER)} />
            <TabButton label="Owner" isActive={activeRole === UserRole.OWNER} onClick={() => setActiveRole(UserRole.OWNER)} />
            <TabButton label="Admin" isActive={activeRole === UserRole.SUPER_ADMIN} onClick={() => setActiveRole(UserRole.SUPER_ADMIN)} />
        </div>
        <h2 className="text-2xl font-bold text-center text-neutral-800 mb-2">
          {
            {
                [UserRole.RENTER]: 'Login as a Renter',
                [UserRole.OWNER]: 'Login as an Owner',
                [UserRole.SUPER_ADMIN]: 'Admin Portal Login',
            }[activeRole]
          }
        </h2>
        <p className="text-center text-neutral-500 mb-8 text-sm">Please enter your credentials to continue.</p>
        <form onSubmit={handleLogin} className="space-y-4">
            <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
                <input 
                    type="email" 
                    id="email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                    placeholder="Enter your email"
                    required
                />
            </div>
            <div>
                <label htmlFor="password"className="block text-sm font-medium text-gray-700">Password</label>
                <input 
                    type="password" 
                    id="password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                    placeholder="••••••••"
                    required
                />
                <div className="flex justify-between items-center mt-2">
                    <p className="text-xs text-green-600 bg-green-50 p-1 rounded">Demo credentials have been pre-filled.</p>
                    <button type="button" onClick={() => setView('forgot_password')} className="text-xs font-medium text-primary hover:underline">
                        Forgot Password?
                    </button>
                </div>
            </div>
            <div className="pt-2">
                 <button type="submit" className="w-full bg-secondary hover:bg-primary text-white font-bold py-3 px-4 rounded-lg transition-colors duration-300">
                    Login
                </button>
            </div>
        </form>
        {activeRole !== UserRole.SUPER_ADMIN && (
            <div className="text-center mt-6 pt-6 border-t">
                <p className="text-sm text-neutral-600">
                    Don't have an account?{' '}
                    <button type="button" onClick={() => setView('signup')} className="font-medium text-primary hover:underline">
                        Sign Up
                    </button>
                </p>
            </div>
        )}
      </>
    );
  };


  return (
    <div className="h-[calc(100vh-4rem)] flex">
        <div className="relative hidden lg:block w-1/2 bg-cover bg-center" style={{backgroundImage: "url('https://picsum.photos/seed/loginpage/1200/1200')"}}>
            <div className="absolute inset-0 bg-primary opacity-80"></div>
            <div className="relative h-full flex flex-col justify-between p-12 text-white">
                <div>
                    <button onClick={onBackToHome} className="flex items-center gap-3 cursor-pointer">
                        <HomeIcon className="w-8 h-8" />
                        <h1 className="text-2xl font-bold">RentEase</h1>
                    </button>
                </div>
                <div>
                    <h2 className="text-4xl font-bold leading-tight">Your next home is just a click away.</h2>
                    <p className="mt-4 text-lg text-neutral-200">Discover verified properties, seamless applications, and secure payments all in one place.</p>
                </div>
            </div>
        </div>
        <div className="w-full lg:w-1/2 flex items-center justify-center p-4 sm:p-12">
            <div className="w-full max-w-md">
                <button onClick={onBackToHome} className="lg:hidden flex items-center gap-2 text-sm font-semibold text-primary mb-4">
                    <ArrowLeftIcon className="w-4 h-4"/>
                    Back to Home
                </button>
                {renderFormContent()}
            </div>
        </div>
    </div>
  );
};

export default LoginPage;
