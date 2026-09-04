import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import MedicalDisclaimer from '../components/MedicalDisclaimer';

const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('patient');
  const [partnerIdentifier, setPartnerIdentifier] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const payload = {
        name,
        email,
        password,
        role,
        ...(role === 'patient' ? { caregiverEmail: partnerIdentifier } : { patientEmailOrCode: partnerIdentifier }),
      };

      const res = await register(payload.name, payload.email, payload.password, payload.role, payload.caregiverEmail, payload.patientEmailOrCode);
      const userRole = res?.role || res?.user?.role || role;
      
      if (userRole === 'caregiver') {
        navigate('/caregiver');
      } else {
        navigate('/patient');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create account. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-between bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-100 relative overflow-hidden font-sans">
      {/* Background Ambient Glow Orbs */}
      <div className="absolute top-1/4 -right-32 w-96 h-96 bg-purple-600/15 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 -left-32 w-96 h-96 bg-emerald-600/15 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="flex-grow flex items-center justify-center p-4 sm:p-6 py-12 relative z-10">
        <div className="bg-slate-900/90 backdrop-blur-2xl p-8 sm:p-10 rounded-3xl shadow-[0_0_50px_rgba(147,51,234,0.15)] w-full max-w-lg mx-auto border border-purple-900/40 relative">
          
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500/20 to-emerald-500/20 text-4xl mb-3 border border-purple-500/30 shadow-inner">
              🌿
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              Create Your Account
            </h1>
            <p className="text-sm sm:text-base text-purple-200/80 font-semibold mt-1">
              Join MindCare AI for intelligent cognitive & routine support
            </p>
          </div>

          {error && (
            <div className="bg-rose-950/80 text-rose-200 p-4 rounded-2xl mb-6 text-sm font-bold border border-rose-500/50 flex items-start gap-2.5 shadow-md">
              <span className="text-xl">⚠️</span>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-purple-200 mb-1">
                Full Name
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-700 bg-slate-950 text-white font-medium focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-500/20 transition-all placeholder-slate-500 text-sm sm:text-base"
                placeholder="e.g. Arthur Pendelton"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-purple-200 mb-1">
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-700 bg-slate-950 text-white font-medium focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-500/20 transition-all placeholder-slate-500 text-sm sm:text-base"
                placeholder="name@example.com"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-purple-200 mb-1">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-700 bg-slate-950 text-white font-medium focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-500/20 transition-all placeholder-slate-500 text-sm sm:text-base"
                placeholder="Choose a password (min 6 characters)"
              />
            </div>
            
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-purple-200 mb-2">
                Select Your Role
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setRole('patient')}
                  className={`py-3.5 px-4 rounded-xl font-black transition-all text-xs sm:text-sm flex flex-col items-center gap-1.5 border-2 ${
                    role === 'patient' 
                    ? 'border-purple-500 bg-purple-600/30 text-white shadow-[0_0_20px_rgba(168,85,247,0.3)]' 
                    : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-700 hover:text-white'
                  }`}
                >
                  <span className="text-2xl">👤</span>
                  <span>Patient (Companion)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setRole('caregiver')}
                  className={`py-3.5 px-4 rounded-xl font-black transition-all text-xs sm:text-sm flex flex-col items-center gap-1.5 border-2 ${
                    role === 'caregiver' 
                    ? 'border-blue-500 bg-blue-600/30 text-white shadow-[0_0_20px_rgba(59,130,246,0.3)]' 
                    : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-700 hover:text-white'
                  }`}
                >
                  <span className="text-2xl">🩺</span>
                  <span>Caregiver (Monitor)</span>
                </button>
              </div>
            </div>

            {/* Optional Immediate Partner Linking Field */}
            <div className="p-4 rounded-2xl bg-slate-950/70 border border-purple-900/40">
              <label className="block text-xs font-bold text-purple-300 uppercase tracking-wider mb-1">
                {role === 'patient' 
                  ? 'Caregiver Email (Optional - or connect later)' 
                  : 'Patient Email or Pair Code (Optional - or connect later)'}
              </label>
              <input
                type="text"
                value={partnerIdentifier}
                onChange={(e) => setPartnerIdentifier(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-900 text-white text-xs sm:text-sm font-medium focus:outline-none focus:border-purple-400 placeholder-slate-500"
                placeholder={role === 'patient' ? 'e.g. caregiver@mindcare.local' : 'e.g. patient@mindcare.local or MC-1234'}
              />
              <p className="text-[11px] text-slate-400 mt-1">
                {role === 'patient' 
                  ? 'If your caregiver already registered, enter their email to link immediately.' 
                  : 'Enter patient email or 6-digit pair code to link them right away.'}
              </p>
            </div>
            
            <button
              type="submit"
              disabled={loading}
              className="w-full min-h-14 bg-gradient-to-r from-emerald-600 via-purple-600 to-indigo-600 hover:opacity-95 text-white text-lg font-black py-3.5 px-6 rounded-xl shadow-[0_0_30px_rgba(16,185,129,0.3)] transition-all active:scale-98 mt-3 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <span className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin"></span>
                  <span>Creating Account...</span>
                </>
              ) : (
                <>
                  <span>Create Account & Start</span>
                  <span className="text-xl">➔</span>
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-purple-900/40 text-center">
            <Link to="/login" className="text-sm sm:text-base text-purple-300 hover:text-white font-extrabold underline underline-offset-4 transition-colors">
              Already have an account? Sign in →
            </Link>
          </div>
        </div>
      </div>

      <MedicalDisclaimer />
    </div>
  );
};

export default Register;
