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
      setError(err.response?.data?.message || 'Failed to sign in. Please check credentials or register.');
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
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-[#F4F9F4] via-[#F8F6F0] to-[#EBF3FB]">
      <div className="flex-grow flex items-center justify-center p-4 sm:p-6 py-12">
        <div className="bg-white/95 backdrop-blur-md p-8 sm:p-10 rounded-3xl shadow-2xl w-full max-w-lg mx-auto border border-emerald-100 relative overflow-hidden">
          
          {/* Tech Innovation Header Badge */}
          <div className="flex justify-center mb-6">
            <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              SIH26003 AI Cognitive Care Platform
            </span>
          </div>

          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-emerald-50 text-3xl mb-3 shadow-inner">
              🌿
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-800 tracking-tight">
              MindCare AI
            </h1>
            <p className="text-lg text-slate-600 font-medium mt-1">
              Adaptive Cognitive & Routine Care Companion
            </p>
          </div>

          {/* Quick Demo Fill Buttons for Evaluators/Judges */}
          <div className="mb-6 p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2.5 text-center">
              ⚡ 1-Click Demo Access for Evaluation
            </p>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => fillDemo('patient')}
                className="py-2.5 px-3 rounded-xl bg-white hover:bg-emerald-50 border border-emerald-300 text-emerald-800 text-sm font-bold shadow-sm transition-all flex items-center justify-center gap-1.5 active:scale-95"
              >
                👤 Demo Patient
              </button>
              <button
                type="button"
                onClick={() => fillDemo('caregiver')}
                className="py-2.5 px-3 rounded-xl bg-white hover:bg-blue-50 border border-blue-300 text-blue-800 text-sm font-bold shadow-sm transition-all flex items-center justify-center gap-1.5 active:scale-95"
              >
                🩺 Demo Caregiver
              </button>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 text-red-700 p-4 rounded-2xl mb-6 text-base font-medium border border-red-200 flex items-start gap-2.5">
              <span className="text-xl">⚠️</span>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-base sm:text-lg font-semibold text-slate-700 mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3.5 text-lg border-2 border-slate-200 rounded-xl focus:outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100 transition-all bg-slate-50/50 hover:bg-white"
                placeholder="Enter your email"
              />
            </div>

            <div>
              <label className="block text-base sm:text-lg font-semibold text-slate-700 mb-1.5">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setEmail ? setPassword(e.target.value) : null}
                className="w-full px-4 py-3.5 text-lg border-2 border-slate-200 rounded-xl focus:outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100 transition-all bg-slate-50/50 hover:bg-white"
                placeholder="Enter your password"
              />
            </div>
            
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-700 hover:bg-emerald-800 text-white text-xl font-bold py-4 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all active:scale-98 mt-3 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <span className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin"></span>
                  <span>Signing In...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <span className="text-xl">➔</span>
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-100 text-center">
            <Link 
              to="/register" 
              className="text-base sm:text-lg text-emerald-800 hover:text-emerald-950 font-bold underline underline-offset-4"
            >
              Need a new account? Register here
            </Link>
          </div>
        </div>
      </div>
      <MedicalDisclaimer />
    </div>
  );
};

export default Login;
