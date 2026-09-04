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
      setError(err.response?.data?.message || 'Access denied. Invalid system credentials.');
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
    <div className="min-h-screen flex flex-col justify-between bg-slate-950 text-slate-100 relative overflow-hidden font-mono selection:bg-purple-500 selection:text-white">
      {/* Background Cyber Grid & Ambient Glows */}
      <div 
        className="absolute inset-0 opacity-20 pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(168, 85, 247, 0.25) 1px, transparent 0)',
          backgroundSize: '32px 32px'
        }}
      />
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-purple-600/20 rounded-full blur-[140px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-blue-600/20 rounded-full blur-[140px] pointer-events-none"></div>

      <div className="flex-grow flex items-center justify-center p-4 sm:p-6 py-12 relative z-10">
        <div className="bg-slate-900/90 backdrop-blur-2xl p-6 sm:p-10 rounded-2xl shadow-[0_0_60px_rgba(147,51,234,0.2)] w-full max-w-lg mx-auto border border-purple-500/30 relative">
          
          {/* Top Status Bar */}
          <div className="flex items-center justify-between border-b border-purple-900/60 pb-3 mb-6 text-xs text-purple-400">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="tracking-widest font-bold">[GATEWAY_AUTHENTICATION]</span>
            </div>
            <span className="text-[10px] text-slate-500 font-bold tracking-wider">SIH26003_ONLINE</span>
          </div>

          {/* Logo & Portal Branding */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-purple-500/10 text-3xl mb-2.5 border border-purple-500/40 shadow-[0_0_15px_rgba(168,85,247,0.3)]">
              🌿
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-wider uppercase">
              MindCare <span className="text-purple-400 underline decoration-purple-500/60 decoration-2">Terminal</span>
            </h1>
            <p className="text-xs sm:text-sm text-purple-300/80 font-medium mt-1 tracking-wide">
              {'>'} 24/7 Cognitive Telemetry & Routine Mesh
            </p>
          </div>

          {/* 1-Click Demo Quick-Access */}
          <div className="mb-6 p-3.5 rounded-xl bg-slate-950/80 border border-purple-900/50 shadow-inner">
            <p className="text-[11px] font-bold text-purple-300 uppercase tracking-widest mb-2 text-center flex items-center justify-center gap-1.5">
              <span>⚡</span>
              <span>[QUICK_AUTH // PRESET_PROFILES]</span>
            </p>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => fillDemo('patient')}
                className="py-2.5 px-3 rounded-lg bg-purple-600/15 hover:bg-purple-600/30 border border-purple-500/40 text-purple-200 text-xs font-bold transition-all flex items-center justify-center gap-1.5 active:scale-95"
              >
                <span>👤</span>
                <span>DEMO_PATIENT</span>
              </button>
              <button
                type="button"
                onClick={() => fillDemo('caregiver')}
                className="py-2.5 px-3 rounded-lg bg-blue-600/15 hover:bg-blue-600/30 border border-blue-500/40 text-blue-200 text-xs font-bold transition-all flex items-center justify-center gap-1.5 active:scale-95"
              >
                <span>🩺</span>
                <span>DEMO_CAREGIVER</span>
              </button>
            </div>
          </div>

          {error && (
            <div className="bg-rose-950/80 text-rose-200 p-3.5 rounded-xl mb-6 text-xs font-bold border border-rose-500/60 flex items-start gap-2 shadow-[0_0_20px_rgba(244,63,94,0.2)]">
              <span className="text-base">⚠️</span>
              <span className="leading-relaxed">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-widest text-purple-300 mb-1">
                [SYS_ID // REGISTERED_EMAIL]
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg border border-purple-900/60 bg-slate-950/80 text-white font-mono text-sm focus:outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-400 transition-all placeholder-slate-600 shadow-inner"
                placeholder="identity@mindcare.ai"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-widest text-purple-300 mb-1">
                [ENCRYPTED_PASSKEY]
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg border border-purple-900/60 bg-slate-950/80 text-white font-mono text-sm focus:outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-400 transition-all placeholder-slate-600 shadow-inner"
                placeholder="••••••••••••"
              />
            </div>
            
            <button
              type="submit"
              disabled={loading}
              className="w-full min-h-12 bg-gradient-to-r from-purple-600 via-indigo-600 to-emerald-600 hover:opacity-90 text-white text-sm font-bold tracking-widest uppercase py-3 px-4 rounded-lg shadow-[0_0_25px_rgba(147,51,234,0.35)] transition-all active:scale-98 mt-2 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  <span>AUTHENTICATING...</span>
                </>
              ) : (
                <>
                  <span>[INITIATE_SESSION]</span>
                  <span>➔</span>
                </>
              )}
            </button>
          </form>

          <div className="mt-5 pt-4 border-t border-purple-900/50 text-center">
            <Link 
              to="/register" 
              className="text-xs text-purple-300 hover:text-white font-bold tracking-wider uppercase underline underline-offset-4 transition-colors"
            >
              {'>'} NEW_OPERATOR? INITIALIZE_ACCOUNT_HERE
            </Link>
          </div>
        </div>
      </div>

      <MedicalDisclaimer />
    </div>
  );
};

export default Login;
