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
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
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
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F9F7F1]">
      <div className="flex-grow flex items-center justify-center p-4 py-12">
        <div className="bg-white p-8 sm:p-10 rounded-3xl shadow-xl w-full max-w-md mx-auto border-2 border-sage-200">
          <div className="text-center mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold text-[#2E7D32] mb-3">🌿 Create Your MindCare Account</h1>
          </div>

          {error && (
            <div className="bg-red-100 text-red-700 p-4 rounded-xl mb-6 text-lg font-medium border border-red-300">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xl font-medium text-gray-800 mb-2">Full Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 text-xl border-2 border-gray-300 rounded-xl focus:outline-none focus:border-[#2E7D32]"
                placeholder="Enter your name"
              />
            </div>
            <div>
              <label className="block text-xl font-medium text-gray-800 mb-2">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 text-xl border-2 border-gray-300 rounded-xl focus:outline-none focus:border-[#2E7D32]"
                placeholder="Enter your email"
              />
            </div>
            <div>
              <label className="block text-xl font-medium text-gray-800 mb-2">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 text-xl border-2 border-gray-300 rounded-xl focus:outline-none focus:border-[#2E7D32]"
                placeholder="Create a password"
              />
            </div>
            
            <div>
              <label className="block text-xl font-medium text-gray-800 mb-3">I am a...</label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setRole('patient')}
                  className={`py-4 px-2 text-xl font-bold rounded-xl border-4 transition-all min-h-14 ${
                    role === 'patient' 
                    ? 'border-[#2E7D32] bg-[#2E7D32] text-white' 
                    : 'border-gray-300 bg-gray-50 text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  Patient
                </button>
                <button
                  type="button"
                  onClick={() => setRole('caregiver')}
                  className={`py-4 px-2 text-xl font-bold rounded-xl border-4 transition-all min-h-14 ${
                    role === 'caregiver' 
                    ? 'border-blue-600 bg-blue-600 text-white' 
                    : 'border-gray-300 bg-gray-50 text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  Caregiver
                </button>
              </div>
            </div>
            
            <button
              type="submit"
              className="w-full bg-[#2E7D32] hover:bg-[#1b5e20] text-white text-2xl font-bold py-5 px-8 rounded-xl shadow-lg transition-transform active:scale-95 mt-6 min-h-14"
            >
              Create Account
            </button>
          </form>

          <div className="mt-8 text-center">
            <Link to="/login" className="text-xl text-[#2E7D32] hover:text-[#1b5e20] font-semibold underline underline-offset-4">
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
