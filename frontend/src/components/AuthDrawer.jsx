import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function AuthDrawer() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  
  // Keep track of the last known mode so that when closing (isOpen=false), 
  // it doesn't suddenly shrink back to login width before finishing the slide out animation
  const currentMode = searchParams.get('auth');
  const [renderMode, setRenderMode] = useState(currentMode || 'login');
  
  useEffect(() => {
    if (currentMode) {
      setRenderMode(currentMode);
    }
  }, [currentMode]);

  const isOpen = !!currentMode;

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState('PATIENT');
  const [error, setError] = useState('');

  // Clear errors when switching modes
  useEffect(() => {
    setError('');
  }, [currentMode]);

  const handleClose = () => {
    searchParams.delete('auth');
    setSearchParams(searchParams);
  };

  const switchMode = (mode) => {
    setSearchParams({ auth: mode });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    try {
      if (renderMode === 'login') {
        const res = await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/auth/login`, { email, password });
        localStorage.setItem('token', res.data.token);
        localStorage.setItem('user', JSON.stringify({ role: res.data.role, name: res.data.name, id: res.data.id }));
        handleClose();
        // Use window.location to force a full re-render so Navbar picks up localStorage changes
        window.location.href = '/dashboard'; 
      } else {
        await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/auth/register`, { name, email, password, role });
        switchMode('login'); // auto switch to login on success
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Authentication failed');
    }
  };

  const isLogin = renderMode === 'login';

  return (
    <div className={`fixed inset-0 z-50 flex justify-end ${!isOpen ? 'pointer-events-none' : ''}`}>
      {/* Backdrop */}
      <div 
        className={`absolute inset-0 bg-slate-900/20 backdrop-blur-sm transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0'}`}
        onClick={handleClose}
      />

      {/* Drawer */}
      <div 
        className={`relative bg-white h-full shadow-2xl flex flex-col transition-all duration-300 transform ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        } ${!isLogin ? 'w-full max-w-lg' : 'w-full max-w-md'}`}
      >
        {/* Close Button */}
        <button 
          onClick={handleClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-full transition"
          aria-label="Close"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        </button>

        <div className="flex-1 overflow-y-auto p-8 flex flex-col justify-center">
          <h2 className="text-3xl font-extrabold text-slate-900 mb-2">
            {isLogin ? 'Welcome Back' : 'Create an Account'}
          </h2>
          <p className="text-slate-500 mb-8">
            {isLogin 
              ? 'Enter your credentials to access your dashboard.' 
              : 'Sign up to start booking appointments and managing your health.'}
          </p>

          {error && <div className="p-3 mb-6 bg-red-50 text-red-600 rounded-lg text-sm">{error}</div>}

          <form onSubmit={handleSubmit} className="space-y-5">
            {!isLogin && (
              <>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                  <input 
                    type="text" 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Account Role</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                  >
                    <option value="PATIENT">Patient</option>
                    <option value="DOCTOR">Doctor</option>
                    <option value="ADMIN">System Admin</option>
                  </select>
                </div>
              </>
            )}
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                required 
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                required 
              />
            </div>

            <button type="submit" className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-sm transition-all duration-200 mt-4">
              {isLogin ? 'Sign In' : 'Create Account'}
            </button>
          </form>

          <div className="mt-8 text-center">
            {isLogin ? (
              <p className="text-sm text-slate-600">
                Don't have an account?{' '}
                <button type="button" onClick={() => switchMode('register')} className="font-semibold text-blue-600 hover:underline">
                  Register here
                </button>
              </p>
            ) : (
              <p className="text-sm text-slate-600">
                Already have an account?{' '}
                <button type="button" onClick={() => switchMode('login')} className="font-semibold text-blue-600 hover:underline">
                  Sign In
                </button>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
