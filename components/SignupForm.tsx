import React, { useState } from 'react';
import type { User } from '../types';
import { UserRole } from '../types';
import { CheckCircleIcon, UserPlusIcon } from './Icons';
import ImageUploader from './ImageUploader';

interface SignupFormProps {
  users: User[];
  onSignup: (name: string, email: string, pass: string, role: UserRole, profilePictureUrl: string) => boolean;
  onBackToLogin: () => void;
}

const SignupForm: React.FC<SignupFormProps> = ({ users, onSignup, onBackToLogin }) => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        role: UserRole.RENTER,
        profilePictureUrl: '',
    });
    const [errors, setErrors] = useState<Record<string, string>>({});

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const handleRoleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData(prev => ({ ...prev, role: e.target.value as UserRole }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const newErrors: Record<string, string> = {};

        if (!formData.name.trim()) newErrors.name = 'Full name is required.';
        if (!formData.email.trim()) {
            newErrors.email = 'Email is required.';
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
            newErrors.email = 'Email address is invalid.';
        } else if (users.some(u => u.email.toLowerCase() === formData.email.trim().toLowerCase())) {
            newErrors.email = 'An account with this email already exists.';
        }

        if (formData.password.length < 6) {
            newErrors.password = 'Password must be at least 6 characters long.';
        }

        if (formData.password !== formData.confirmPassword) {
            newErrors.confirmPassword = 'Passwords do not match.';
        }
        
        setErrors(newErrors);

        if (Object.keys(newErrors).length === 0) {
            onSignup(formData.name, formData.email, formData.password, formData.role, formData.profilePictureUrl);
        }
    };
    
    const FormInput = ({ id, label, type, placeholder }: { id: keyof typeof formData, label: string, type: string, placeholder?: string }) => (
         <div>
            <label htmlFor={id} className="block text-sm font-medium text-gray-700">{label}</label>
            <input 
                type={type} 
                id={id} 
                name={id}
                value={formData[id] as string}
                onChange={handleChange}
                className={`mt-1 block w-full px-3 py-2 border ${errors[id] ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary`}
                placeholder={placeholder}
                required
            />
            {errors[id] && <p className="text-red-500 text-xs mt-1">{errors[id]}</p>}
        </div>
    );

    const RoleSelector: React.FC<{ value: UserRole, label: string }> = ({ value, label }) => {
        const isSelected = formData.role === value;
        return (
            <label className={`relative flex items-center justify-center p-3 border-2 rounded-md cursor-pointer transition-all ${isSelected ? 'bg-primary/10 border-primary text-primary' : 'border-gray-300 hover:border-gray-400'}`}>
                <input type="radio" name="role" value={value} checked={isSelected} onChange={handleRoleChange} className="sr-only" />
                <span className="text-sm font-semibold">{label}</span>
                {isSelected && <CheckCircleIcon className="w-5 h-5 absolute top-2 right-2 text-primary" />}
            </label>
        );
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <ImageUploader 
                currentImageUrl={formData.profilePictureUrl}
                onImageSelect={(base64) => setFormData(prev => ({...prev, profilePictureUrl: base64}))}
                size="small"
            />
            <FormInput id="name" label="Full Name" type="text" placeholder="John Doe" />
            <FormInput id="email" label="Email Address" type="email" placeholder="you@example.com" />
            <FormInput id="password" label="Password" type="password" placeholder="••••••••" />
            <FormInput id="confirmPassword" label="Confirm Password" type="password" placeholder="••••••••" />
            
            <div>
                <label className="block text-sm font-medium text-gray-700">I am a...</label>
                <div className="mt-2 grid grid-cols-2 gap-3">
                    <RoleSelector value={UserRole.RENTER} label="Renter" />
                    <RoleSelector value={UserRole.OWNER} label="Owner" />
                </div>
            </div>

            <div className="pt-2">
                 <button type="submit" className="w-full bg-secondary hover:bg-primary text-white font-bold py-3 px-4 rounded-lg transition-colors duration-300 flex items-center justify-center gap-2">
                    <UserPlusIcon className="w-5 h-5" />
                    Create Account
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

export default SignupForm;