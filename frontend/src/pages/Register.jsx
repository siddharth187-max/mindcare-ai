import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import MedicalDisclaimer from '../components/MedicalDisclaimer';

const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState('patient');
  const [partnerIdentifier, setPartnerIdentifier] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (role === 'caregiver' && !phone.trim()) {
      setError('Caregivers must provide an emergency contact mobile number for patient safety.');
      return;
    }

    setLoading(true);
    try {
      const caregiverEmail = role === 'patient' ? partnerIdentifier.trim() : '';
      const patientEmailOrCode = role === 'caregiver' ? partnerIdentifier.trim() : '';
      const caregiverPhone = role === 'caregiver' ? phone.trim() : '';

      const res = await register(
        name.trim(),
        email.trim(),
        password,
        role,
        caregiverPhone,
        caregiverEmail,
        patientEmailOrCode
      );

      const userRole = res?.role || res?.user?.role || role;
      if (userRole === 'caregiver') {
        navigate('/caregiver');
      } else {
        navigate('/patient');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to initialize account. System rejected credentials.');
    } finally {
      setLoading(false);
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
      <div className="absolute top-1/4 -right-32 w-96 h-96 bg-purple-600/20 rounded-full blur-[140px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 -left-32 w-96 h-96 bg-emerald-600/20 rounded-full blur-[140px] pointer-events-none"></div>

      <div className="flex-grow flex items-center justify-center p-4 sm:p-6 py-12 relative z-10">
        <div className="bg-slate-900/90 backdrop-blur-2xl p-6 sm:p-10 rounded-2xl shadow-[0_0_60px_rgba(147,51,234,0.2)] w-full max-w-lg mx-auto border border-purple-500/30 relative">
          
          {/* Cyber Terminal Top Bar */}
          <div className="flex items-center justify-between border-b border-purple-900/60 pb-3 mb-6 text-xs text-purple-400">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="tracking-widest font-bold">[SYS_REGISTRATION_CORE]</span>
            </div>
            <span className="text-[10px] text-slate-500 font-bold tracking-wider">SECURE_CHANNEL_v2.6</span>
          </div>

          {/* Header */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-purple-500/10 text-3xl mb-2.5 border border-purple-500/40 shadow-[0_0_15px_rgba(168,85,247,0.3)]">
              🌿
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-wider uppercase">
              MindCare <span className="text-purple-400 underline decoration-purple-500/60 decoration-2">Protocol</span>
            </h1>
            <p className="text-xs sm:text-sm text-purple-300/80 font-medium mt-1 tracking-wide">
              {'>'} Initializing Cognitive Neural Profile...
            </p>
          </div>

          {error && (
            <div className="bg-rose-950/80 text-rose-200 p-3.5 rounded-xl mb-6 text-xs font-bold border border-rose-500/60 flex items-start gap-2 shadow-[0_0_20px_rgba(244,63,94,0.2)]">
              <span className="text-base">⚠️</span>
              <span className="leading-relaxed">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Full Name */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-widest text-purple-300 mb-1">
                [USER_LEGAL_NAME]
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg border border-purple-900/60 bg-slate-950/80 text-white font-mono text-sm focus:outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-400 transition-all placeholder-slate-600 shadow-inner"
                placeholder="e.g. Arthur Pendelton"
              />
            </div>

            {/* Email Address */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-widest text-purple-300 mb-1">
                [SECURE_IDENTIFIER // EMAIL]
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

            {/* Password */}
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
                placeholder="•••••••••••• (min 6 chars)"
              />
            </div>

            {/* Role Selection */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-widest text-purple-300 mb-1.5">
                [ASSIGN_PROTOCOL_ROLE]
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setRole('patient')}
                  className={`py-3 px-3 rounded-lg font-bold transition-all text-xs flex flex-col items-center gap-1 border ${
                    role === 'patient'
                      ? 'border-purple-400 bg-purple-600/30 text-white shadow-[0_0_20px_rgba(168,85,247,0.35)]'
                      : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-700 hover:text-white'
                  }`}
                >
                  <span className="text-xl">👤</span>
                  <span className="tracking-wide">PATIENT_MODE</span>
                </button>
                <button
                  type="button"
                  onClick={() => setRole('caregiver')}
                  className={`py-3 px-3 rounded-lg font-bold transition-all text-xs flex flex-col items-center gap-1 border ${
                    role === 'caregiver'
                      ? 'border-blue-400 bg-blue-600/30 text-white shadow-[0_0_20px_rgba(59,130,246,0.35)]'
                      : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-700 hover:text-white'
                  }`}
                >
                  <span className="text-xl">🩺</span>
                  <span className="tracking-wide">CAREGIVER_NODE</span>
                </button>
              </div>
            </div>

            {/* ONLY CAREGIVERS ENTER PHONE NUMBER */}
            {role === 'caregiver' && (
              <div className="p-3.5 rounded-xl bg-blue-950/40 border border-blue-500/50 animate-fadeIn">
                <label className="block text-[11px] font-bold text-blue-300 uppercase tracking-widest mb-1 flex items-center justify-between">
                  <span>[CAREGIVER_MOBILE_DISPATCH]</span>
                  <span className="text-emerald-400 text-[10px] font-mono animate-pulse">● REQUIRED</span>
                </label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-lg border border-blue-500/40 bg-slate-950 text-white font-mono text-sm focus:outline-none focus:border-blue-300 shadow-inner"
                  placeholder="+91 98765 43210"
                />
                <p className="text-[10px] text-blue-200/80 mt-1 font-sans">
                  🚨 <strong className="text-blue-100">Patient Emergency Direct-Dial:</strong> Your patient will instantly call this registered number when tapping <strong>"📞 Call Caregiver"</strong>.
                </p>
              </div>
            )}

            {/* Partner Linking Field */}
            <div className="p-3.5 rounded-xl bg-slate-950/80 border border-purple-900/50">
              <label className="block text-[11px] font-bold text-purple-300 uppercase tracking-widest mb-1">
                {role === 'patient' 
                  ? '[CARE_PARTNER_LINK // OPTIONAL]' 
                  : '[PATIENT_TELEMETRY_LINK // OPTIONAL]'}
              </label>
              <input
                type="text"
                value={partnerIdentifier}
                onChange={(e) => setPartnerIdentifier(e.target.value)}
                className="w-full px-3.5 py-2 rounded-lg border border-purple-900/60 bg-slate-900 text-white font-mono text-xs focus:outline-none focus:border-purple-400 placeholder-slate-600 shadow-inner"
                placeholder={role === 'patient' ? 'caregiver@mindcare.ai (or leave blank)' : 'patient@mindcare.ai or MC-1234'}
              />
              <p className="text-[10px] text-slate-400 mt-1 font-sans leading-tight">
                {role === 'patient' 
                  ? 'Enter caregiver email to immediately link emergency alerts & contact numbers.' 
                  : 'Enter patient email or pair code to instantly attach your emergency phone to their dashboard.'}
              </p>
            </div>

            {/* Submit Action */}
            <button
              type="submit"
              disabled={loading}
              className="w-full min-h-12 bg-gradient-to-r from-purple-600 via-indigo-600 to-emerald-600 hover:opacity-90 text-white text-sm font-bold tracking-widest uppercase py-3 px-4 rounded-lg shadow-[0_0_25px_rgba(147,51,234,0.35)] transition-all active:scale-98 mt-2 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  <span>INITIALIZING_PROFILE...</span>
                </>
              ) : (
                <>
                  <span>[EXECUTE_REGISTRATION]</span>
                  <span>➔</span>
                </>
              )}
            </button>
          </form>

          {/* Login Switch */}
          <div className="mt-5 pt-4 border-t border-purple-900/50 text-center">
            <Link 
              to="/login" 
              className="text-xs text-purple-300 hover:text-white font-bold tracking-wider uppercase underline underline-offset-4 transition-colors"
            >
              {'>'} EXISTING_OPERATOR? SIGN_IN_HERE
            </Link>
          </div>
        </div>
      </div>

      <MedicalDisclaimer />
    </div>
  );
};

export default Register;
