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
      setError(err.response?.data?.message || 'Failed to sign in. Please verify your credentials or create a new account.');
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
    <div className="min-h-screen flex flex-col justify-between bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-100 relative overflow-hidden font-sans">
      {/* Background Ambient Glow Orbs */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-purple-600/15 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-blue-600/15 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="flex-grow flex items-center justify-center p-4 sm:p-6 py-12 relative z-10">
        <div className="bg-slate-900/90 backdrop-blur-2xl p-8 sm:p-10 rounded-3xl shadow-[0_0_50px_rgba(147,51,234,0.15)] w-full max-w-lg mx-auto border border-purple-900/40 relative">
          
          {/* SIH Hackathon Innovation Badge */}
          <div className="flex justify-center mb-6">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-black bg-purple-950/80 text-purple-300 border border-purple-500/40 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
              SIH26003 AI Cognitive Care Platform
            </span>
          </div>

          {/* Logo & Portal Branding */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500/20 to-indigo-500/20 text-4xl mb-3 border border-purple-500/30 shadow-inner">
              🌿
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              MindCare <span className="text-purple-400">AI</span>
            </h1>
            <p className="text-sm sm:text-base text-purple-200/80 font-semibold mt-1">
              Cognitive Companion & 24/7 Routine Telemetry
            </p>
          </div>

          {/* 1-Click Demo Access for Judges / Evaluators */}
          <div className="mb-6 p-4 rounded-2xl bg-slate-950/80 border border-purple-900/50 shadow-inner">
            <p className="text-xs font-black text-purple-300 uppercase tracking-wider mb-2.5 text-center flex items-center justify-center gap-1.5">
              <span>⚡</span>
              <span>1-Click Demo Sign-In</span>
            </p>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => fillDemo('patient')}
                className="py-2.5 px-3 rounded-xl bg-purple-600/15 hover:bg-purple-600/30 border border-purple-500/40 text-purple-200 text-xs sm:text-sm font-extrabold shadow-sm transition-all flex items-center justify-center gap-1.5 active:scale-95"
              >
                <span>👤</span>
                <span>Demo Patient</span>
              </button>
              <button
                type="button"
                onClick={() => fillDemo('caregiver')}
                className="py-2.5 px-3 rounded-xl bg-blue-600/15 hover:bg-blue-600/30 border border-blue-500/40 text-blue-200 text-xs sm:text-sm font-extrabold shadow-sm transition-all flex items-center justify-center gap-1.5 active:scale-95"
              >
                <span>🩺</span>
                <span>Demo Caregiver</span>
              </button>
            </div>
          </div>

          {error && (
            <div className="bg-rose-950/80 text-rose-200 p-4 rounded-2xl mb-6 text-sm font-bold border border-rose-500/50 flex items-start gap-2.5 shadow-md">
              <span className="text-xl">⚠️</span>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-purple-200 mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3.5 text-base rounded-xl border border-slate-700 bg-slate-950 text-white font-medium focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-500/20 transition-all placeholder-slate-500"
                placeholder="Enter your registered email"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-purple-200 mb-1.5">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3.5 text-base rounded-xl border border-slate-700 bg-slate-950 text-white font-medium focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-500/20 transition-all placeholder-slate-500"
                placeholder="Enter your password"
              />
            </div>
            
            <button
              type="submit"
              disabled={loading}
              className="w-full min-h-14 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-lg font-black py-3.5 px-6 rounded-xl shadow-[0_0_30px_rgba(147,51,234,0.4)] transition-all active:scale-98 mt-3 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <span className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin"></span>
                  <span>Signing In...</span>
                </>
              ) : (
                <>
                  <span>Sign In to Portal</span>
                  <span className="text-xl">➔</span>
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-purple-900/40 text-center">
            <Link 
              to="/register" 
              className="text-sm sm:text-base text-purple-300 hover:text-white font-extrabold underline underline-offset-4 transition-colors"
            >
              Need a new account? Register & Link Care Partner →
            </Link>
          </div>
        </div>
      </div>

      <MedicalDisclaimer />
    </div>
  );
};

export default Login;
