import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import MedicalDisclaimer from '../components/MedicalDisclaimer';

const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('patient');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const registeredUser = await register(name, email, password, role);
      const userRole = registeredUser?.role || registeredUser?.user?.role;
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
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-[#F4F9F4] via-[#F8F6F0] to-[#EBF3FB]">
      <div className="flex-grow flex items-center justify-center p-4 sm:p-6 py-12">
        <div className="bg-white/95 backdrop-blur-md p-8 sm:p-10 rounded-3xl shadow-2xl w-full max-w-lg mx-auto border border-emerald-100">
          
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-emerald-50 text-3xl mb-2">
              🌿
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-800 tracking-tight">
              Create Your Account
            </h1>
            <p className="text-base text-slate-600 font-medium mt-1">
              Join MindCare AI for intelligent cognitive support
            </p>
          </div>

          {error && (
            <div className="bg-red-50 text-red-700 p-4 rounded-2xl mb-6 text-base font-medium border border-red-200 flex items-start gap-2">
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">
                Full Name
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 text-base border-2 border-slate-200 rounded-xl focus:outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100 transition-all bg-slate-50/50 hover:bg-white"
                placeholder="e.g. Arthur Pendelton"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 text-base border-2 border-slate-200 rounded-xl focus:outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100 transition-all bg-slate-50/50 hover:bg-white"
                placeholder="name@example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 text-base border-2 border-slate-200 rounded-xl focus:outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100 transition-all bg-slate-50/50 hover:bg-white"
                placeholder="Choose a secure password"
              />
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Select Your Role
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setRole('patient')}
                  className={`py-3.5 px-4 rounded-xl font-bold transition-all text-sm sm:text-base flex flex-col items-center gap-1 border-2 ${
                    role === 'patient' 
                    ? 'border-emerald-600 bg-emerald-600 text-white shadow-md' 
                    : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <span className="text-xl">👤</span>
                  <span>Patient (Elderly)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setRole('caregiver')}
                  className={`py-3.5 px-4 rounded-xl font-bold transition-all text-sm sm:text-base flex flex-col items-center gap-1 border-2 ${
                    role === 'caregiver' 
                    ? 'border-blue-600 bg-blue-600 text-white shadow-md' 
                    : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <span className="text-xl">🩺</span>
                  <span>Caregiver (Monitor)</span>
                </button>
              </div>
            </div>
            
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-700 hover:bg-emerald-800 text-white text-lg font-bold py-4 px-6 rounded-xl shadow-lg transition-all active:scale-98 mt-4 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <span className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin"></span>
                  <span>Creating Account...</span>
                </>
              ) : (
                <>
                  <span>Create Account</span>
                  <span className="text-xl">➔</span>
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-100 text-center">
            <Link to="/login" className="text-base text-emerald-800 hover:text-emerald-950 font-bold underline underline-offset-4">
              Already have an account? Sign in
            </Link>
          </div>
        </div>
      </div>
      <MedicalDisclaimer />
    </div>
  );
};

export default Register;
