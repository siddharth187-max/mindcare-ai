import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import MedicalDisclaimer from '../components/MedicalDisclaimer';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const loggedInUser = await login(email, password);
      const userRole = loggedInUser?.role || loggedInUser?.user?.role;
      if (userRole === 'caregiver') {
        navigate('/caregiver');
      } else {
        navigate('/patient');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'We could not sign you in with those details. Please check your email and password.');
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (role) => {
    if (role === 'patient') {
      setEmail('patient.demo@mindcare.local');
      setPassword('MindCareDemo123!');
    } else {
      setEmail('caregiver.demo@mindcare.local');
      setPassword('MindCareDemo123!');
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-between bg-[#F7F3E8] text-[#263B42] font-sans">
      <div className="flex-grow flex items-center justify-center p-4 sm:p-6 py-12">
        <div className="bg-[#FFFDF7] border border-[#EADBCC] p-7 sm:p-10 rounded-3xl shadow-sm w-full max-w-lg mx-auto">
          
          {/* Platform Badge */}
          <div className="flex justify-center mb-5">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs sm:text-sm font-bold bg-[#EAF2EE] text-[#397F7A] border border-[#C8DDD4]">
              <span className="w-2 h-2 rounded-full bg-[#4F8A5B]"></span>
              MindCare Cognitive Care Platform
            </span>
          </div>

          {/* Logo & Portal Branding */}
          <div className="text-center mb-7">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#EAF2EE] text-3xl mb-3 text-[#397F7A] border border-[#C8DDD4]">
              🌿
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-[#263B42] tracking-tight">
              Welcome to MindCare
            </h1>
            <p className="text-base sm:text-lg text-[#566D75] font-medium mt-1.5">
              Your calming cognitive companion & routine assistant
            </p>
          </div>

          {/* 1-Click Quick Demo Access */}
          <div className="mb-6 p-4 rounded-2xl bg-[#F7F3E8] border border-[#EADBCC]">
            <p className="text-xs font-bold text-[#566D75] uppercase tracking-wider mb-2.5 text-center flex items-center justify-center gap-1.5">
              <span>⚡</span>
              <span>1-Click Easy Sign-In</span>
            </p>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => fillDemo('patient')}
                className="py-3 px-3 rounded-xl bg-[#FFFDF7] hover:bg-[#EAF2EE] border border-[#8DB7A5] text-[#263B42] text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-1.5 active:scale-98 shadow-sm"
              >
                <span>👤</span>
                <span>Patient Account</span>
              </button>
              <button
                type="button"
                onClick={() => fillDemo('caregiver')}
                className="py-3 px-3 rounded-xl bg-[#FFFDF7] hover:bg-[#EBF3F2] border border-[#397F7A] text-[#263B42] text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-1.5 active:scale-98 shadow-sm"
              >
                <span>🩺</span>
                <span>Caregiver Portal</span>
              </button>
            </div>
          </div>

          {error && (
            <div className="bg-[#FAECEC] text-[#C95C5C] p-4 rounded-2xl mb-6 text-sm font-bold border border-[#E8B4B4] flex items-start gap-2.5">
              <span className="text-lg">⚠️</span>
              <span className="leading-relaxed">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-[#263B42] mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3.5 text-base rounded-xl border border-[#C8DDD4] bg-[#FFFDF7] text-[#263B42] font-medium focus:outline-none focus:border-[#397F7A] focus:ring-2 focus:ring-[#397F7A]/20 transition-all placeholder-[#849CA4]"
                placeholder="e.g. arthur@mindcare.com"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-[#263B42] mb-1.5">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3.5 text-base rounded-xl border border-[#C8DDD4] bg-[#FFFDF7] text-[#263B42] font-medium focus:outline-none focus:border-[#397F7A] focus:ring-2 focus:ring-[#397F7A]/20 transition-all placeholder-[#849CA4]"
                placeholder="Enter your password"
              />
            </div>
            
            <button
              type="submit"
              disabled={loading}
              className="w-full min-h-14 bg-[#397F7A] hover:bg-[#2E6B66] text-white text-lg font-bold py-3.5 px-6 rounded-2xl shadow-sm hover:shadow-md transition-all active:scale-98 mt-3 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <span className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin"></span>
                  <span>Signing In...</span>
                </>
              ) : (
                <>
                  <span>Sign In to MindCare</span>
                  <span className="text-xl">➔</span>
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-[#EADBCC] text-center">
            <Link 
              to="/register" 
              className="text-sm sm:text-base text-[#397F7A] hover:text-[#2E6B66] font-bold underline underline-offset-4 transition-colors"
            >
              Need a new account? Register here →
            </Link>
          </div>
        </div>
      </div>

      <MedicalDisclaimer />
    </div>
  );
};

export default Login;
