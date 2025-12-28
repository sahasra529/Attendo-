
import React, { useState } from 'react';
import { authApi } from '../services/api';

interface SignupProps {
  onNavigate: (page: any) => void;
}

const Signup: React.FC<SignupProps> = ({ onNavigate }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'Student'
  });
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState({ type: '', text: '' });

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMsg({ type: '', text: '' });
    try {
      await authApi.signup(formData);
      setMsg({ type: 'success', text: formData.role === 'Teacher' ? 'Registration sent! Awaiting Admin approval.' : 'Account created! You can now log in.' });
      setFormData({ name: '', email: '', role: 'Student' });
    } catch (err: any) {
      setMsg({ type: 'error', text: err.message || 'Signup failed.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl p-10">
        <button onClick={() => onNavigate('login')} className="text-indigo-600 text-sm font-bold mb-6 block">← Back to Login</button>
        <h2 className="text-3xl font-black text-gray-900 mb-2">Create Account</h2>
        <p className="text-gray-500 mb-8">Join the smartest attendance platform.</p>

        {msg.text && (
          <div className={`mb-6 p-4 rounded-xl text-sm font-bold ${msg.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
            {msg.text}
          </div>
        )}

        <form onSubmit={handleSignup} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Full Name</label>
            <input 
              required
              value={formData.name}
              onChange={e => setFormData({...formData, name: e.target.value})}
              className="w-full px-4 py-3 bg-gray-50 border rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none transition"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Email Address</label>
            <input 
              type="email" required
              value={formData.email}
              onChange={e => setFormData({...formData, email: e.target.value})}
              className="w-full px-4 py-3 bg-gray-50 border rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none transition"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1 text-center">I am a</label>
            <div className="flex gap-2 mt-2">
              {['Student', 'Teacher'].map(r => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setFormData({...formData, role: r})}
                  className={`flex-1 py-3 rounded-xl font-bold transition border ${formData.role === r ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-500 border-gray-200 hover:border-indigo-300'}`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>
          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-4 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition shadow-lg shadow-indigo-200 mt-6 disabled:opacity-50"
          >
            {loading ? 'Processing...' : 'Register'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Signup;
