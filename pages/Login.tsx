
import React, { useState, useEffect } from 'react';
import { authApi } from '../services/api';
import { UserRole } from '../types';

interface LoginProps {
  onNavigate: (page: any) => void;
  onAuthSuccess: (user: any) => void;
}

const Login: React.FC<LoginProps> = ({ onNavigate, onAuthSuccess }) => {
  const [email, setEmail] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole>(UserRole.STUDENT);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const google = (window as any).google;
    if (google) {
      google.accounts.id.initialize({
        client_id: "YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com", 
        callback: handleGoogleResponse,
      });
      google.accounts.id.renderButton(
        document.getElementById("google-signin-btn"),
        { theme: "outline", size: "large", width: "100%" }
      );
    }
  }, [selectedRole]);

  const handleGoogleResponse = async (response: any) => {
    setLoading(true);
    setError('');
    try {
      const payload = JSON.parse(atob(response.credential.split('.')[1]));
      const userData = await authApi.loginGoogle(payload.email);
      
      if (!userData) {
        throw new Error("Access Denied: Account not found in our database.");
      }

      if (selectedRole === UserRole.STUDENT && userData.role !== UserRole.STUDENT) {
        throw new Error(`Access Denied: This account is registered as a ${userData.role}. Please switch to Staff login.`);
      }
      
      onAuthSuccess(userData);
    } catch (err: any) {
      setError(err.message || 'Google Sign-In failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleManualLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      // Password removed - login by email only
      const userData = await authApi.loginManual(email);
      
      if (!userData) {
        throw new Error("Access Denied: Account not found.");
      }

      const isStaffSelected = selectedRole === UserRole.TEACHER || selectedRole === UserRole.ADMIN;
      const isStaffAccount = userData.role === UserRole.TEACHER || userData.role === UserRole.ADMIN;

      if (selectedRole === UserRole.STUDENT && isStaffAccount) {
        throw new Error(`Account identified as ${userData.role}. Please switch to Staff login.`);
      }
      if (isStaffSelected && userData.role === UserRole.STUDENT) {
        throw new Error("Account identified as Student. Please switch to Student login.");
      }

      onAuthSuccess(userData);
    } catch (err: any) {
      setError(err.message || 'Login failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl overflow-hidden">
        <div className="p-8 md:p-12">
          <div className="mb-8">
            <button onClick={() => onNavigate('home')} className="text-indigo-600 text-sm font-bold mb-6 block transition hover:translate-x-1">← Back to Home</button>
            <h2 className="text-3xl font-black text-gray-900">Welcome back.</h2>
            <p className="text-gray-500">Sign in to your {selectedRole === UserRole.STUDENT ? 'Student' : 'Staff'} account.</p>
          </div>

          <div className="bg-gray-100 p-1 rounded-xl flex mb-8">
            <button 
              onClick={() => setSelectedRole(UserRole.STUDENT)}
              className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all ${selectedRole === UserRole.STUDENT ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Student
            </button>
            <button 
              onClick={() => setSelectedRole(UserRole.TEACHER)}
              className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all ${selectedRole !== UserRole.STUDENT ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Staff / Admin
            </button>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 text-sm rounded-r-lg font-medium animate-shake">
              <div className="flex items-center">
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                {error}
              </div>
            </div>
          )}

          <form onSubmit={handleManualLogin} className="space-y-6">
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Email Address</label>
              <input 
                type="email" 
                required 
                placeholder="name@institute.edu"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none transition"
              />
            </div>
            
            <button 
              type="submit" 
              disabled={loading}
              className="w-full py-4 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition shadow-lg shadow-indigo-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                  Verifying Identity...
                </>
              ) : `Sign In as ${selectedRole === UserRole.STUDENT ? 'Student' : 'Staff'}`}
            </button>
          </form>

          <div className="mt-8 relative text-center">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200"></div></div>
            <span className="relative bg-white px-4 text-xs font-bold text-gray-400 uppercase">Or Secure Sign-In</span>
          </div>

          <div className="mt-8 flex justify-center min-h-[44px]">
            <div id="google-signin-btn" className="w-full"></div>
          </div>

          <p className="mt-10 text-center text-sm text-gray-500">
            Don't have an account yet? <button onClick={() => onNavigate('signup')} className="text-indigo-600 font-bold hover:underline transition">Create one now</button>
          </p>
        </div>
      </div>
      
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-4px); }
          75% { transform: translateX(4px); }
        }
        .animate-shake {
          animation: shake 0.2s ease-in-out 0s 2;
        }
      `}</style>
    </div>
  );
};

export default Login;
