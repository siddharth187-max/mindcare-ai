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
      setError('Please provide an emergency contact phone number so your patient can reach you directly.');
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
      setError(err.response?.data?.message || 'Could not create account. Please check your information and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-between bg-[#F7F3E8] text-[#263B42] font-sans">
      <div className="flex-grow flex items-center justify-center p-4 sm:p-6 py-12">
        <div className="bg-[#FFFDF7] border border-[#EADBCC] p-7 sm:p-10 rounded-3xl shadow-sm w-full max-w-lg mx-auto">
          
          {/* Header */}
          <div className="text-center mb-7">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#EAF2EE] text-3xl mb-3 text-[#397F7A] border border-[#C8DDD4]">
              🌿
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-[#263B42] tracking-tight">
              Create Your Account
            </h1>
            <p className="text-base sm:text-lg text-[#566D75] font-medium mt-1.5">
              Join MindCare for compassionate cognitive & routine support
            </p>
          </div>

          {error && (
            <div className="bg-[#FAECEC] text-[#C95C5C] p-4 rounded-2xl mb-6 text-sm font-bold border border-[#E8B4B4] flex items-start gap-2.5">
              <span className="text-lg">⚠️</span>
              <span className="leading-relaxed">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Full Name */}
            <div>
              <label className="block text-sm font-bold text-[#263B42] mb-1.5">
                Full Name
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3.5 text-base rounded-xl border border-[#C8DDD4] bg-[#FFFDF7] text-[#263B42] font-medium focus:outline-none focus:border-[#397F7A] focus:ring-2 focus:ring-[#397F7A]/20 transition-all placeholder-[#849CA4]"
                placeholder="e.g. Arthur Pendelton"
              />
            </div>

            {/* Email Address */}
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

            {/* Password */}
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
                placeholder="Choose a password (min 6 characters)"
              />
            </div>

            {/* Role Selection */}
            <div>
              <label className="block text-sm font-bold text-[#263B42] mb-2">
                I am using MindCare as a:
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setRole('patient')}
                  className={`py-3.5 px-3 rounded-2xl font-bold transition-all text-sm flex flex-col items-center gap-1.5 border-2 ${
                    role === 'patient'
                      ? 'border-[#397F7A] bg-[#EBF3F2] text-[#397F7A] shadow-sm'
                      : 'border-[#EADBCC] bg-[#FFFDF7] text-[#566D75] hover:border-[#8DB7A5]'
                  }`}
                >
                  <span className="text-2xl">👤</span>
                  <span className="text-base">Patient</span>
                  <span className="text-xs font-normal text-[#566D75]">Companion user</span>
                </button>
                <button
                  type="button"
                  onClick={() => setRole('caregiver')}
                  className={`py-3.5 px-3 rounded-2xl font-bold transition-all text-sm flex flex-col items-center gap-1.5 border-2 ${
                    role === 'caregiver'
                      ? 'border-[#397F7A] bg-[#EBF3F2] text-[#397F7A] shadow-sm'
                      : 'border-[#EADBCC] bg-[#FFFDF7] text-[#566D75] hover:border-[#8DB7A5]'
                  }`}
                >
                  <span className="text-2xl">🩺</span>
                  <span className="text-base">Caregiver</span>
                  <span className="text-xs font-normal text-[#566D75]">Family / Care team</span>
                </button>
              </div>
            </div>

            {/* ONLY CAREGIVERS ENTER PHONE NUMBER */}
            {role === 'caregiver' && (
              <div className="p-4 rounded-2xl bg-[#EBF3F2] border border-[#BCD5D3] animate-fadeIn">
                <label className="block text-sm font-bold text-[#263B42] mb-1">
                  Caregiver Mobile Number (for Patient Emergency Calls) *
                </label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-[#C8DDD4] bg-[#FFFDF7] text-[#263B42] text-sm focus:outline-none focus:border-[#397F7A]"
                  placeholder="+91 98765 43210"
                />
                <p className="text-xs text-[#566D75] mt-1.5">
                  📞 Your patient will directly call this number when tapping the <strong>"Call Caregiver"</strong> button.
                </p>
              </div>
            )}

            {/* Partner Linking Field */}
            <div className="p-4 rounded-2xl bg-[#F7F3E8] border border-[#EADBCC]">
              <label className="block text-sm font-bold text-[#263B42] mb-1">
                {role === 'patient' 
                  ? 'Caregiver Email (Optional — or connect later)' 
                  : 'Patient Email or Pair Code (Optional — or connect later)'}
              </label>
              <input
                type="text"
                value={partnerIdentifier}
                onChange={(e) => setPartnerIdentifier(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#C8DDD4] bg-[#FFFDF7] text-[#263B42] text-sm focus:outline-none focus:border-[#397F7A] placeholder-[#849CA4]"
                placeholder={role === 'patient' ? 'e.g. caregiver@mindcare.com' : 'e.g. patient@mindcare.com or MC-1234'}
              />
              <p className="text-xs text-[#566D75] mt-1">
                {role === 'patient' 
                  ? 'If your caregiver has already registered, enter their email to automatically link your accounts.' 
                  : 'Enter patient email or 6-digit pair code to link them immediately.'}
              </p>
            </div>

            {/* Submit Action */}
            <button
              type="submit"
              disabled={loading}
              className="w-full min-h-14 bg-[#397F7A] hover:bg-[#2E6B66] text-white text-lg font-bold py-3.5 px-6 rounded-2xl shadow-sm hover:shadow-md transition-all active:scale-98 mt-3 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <span className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin"></span>
                  <span>Creating Account...</span>
                </>
              ) : (
                <>
                  <span>Create Account & Get Started</span>
                  <span className="text-xl">➔</span>
                </>
              )}
            </button>
          </form>

          {/* Login Switch */}
          <div className="mt-6 pt-6 border-t border-[#EADBCC] text-center">
            <Link 
              to="/login" 
              className="text-sm sm:text-base text-[#397F7A] hover:text-[#2E6B66] font-bold underline underline-offset-4 transition-colors"
            >
              Already have an account? Sign in here →
            </Link>
          </div>
        </div>
      </div>

      <MedicalDisclaimer />
    </div>
  );
};

export default Register;
