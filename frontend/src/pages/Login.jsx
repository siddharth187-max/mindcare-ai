import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import MedicalDisclaimer from '../components/MedicalDisclaimer';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const loggedInUser = await login(email, password);
      const userRole = loggedInUser?.role || loggedInUser?.user?.role;
      if (userRole === 'caregiver') {
        navigate('/caregiver');
      } else {
        navigate('/patient');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to sign in. Please try again.');
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F9F7F1]">
      <div className="flex-grow flex items-center justify-center p-4">
        <div className="bg-white p-8 sm:p-10 rounded-3xl shadow-xl w-full max-w-md mx-auto border-2 border-sage-200">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-[#2E7D32] mb-3">🌿 Welcome to MindCare</h1>
            <p className="text-xl text-gray-600">Your Cognitive & Daily Routine Companion</p>
          </div>

          {error && (
            <div className="bg-red-100 text-red-700 p-4 rounded-xl mb-6 text-lg font-medium border border-red-300">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-2xl font-medium text-gray-800 mb-2">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-4 text-xl border-2 border-gray-300 rounded-xl focus:outline-none focus:border-[#2E7D32] focus:ring-2 focus:ring-[#2E7D32]/50 transition-colors"
                placeholder="Enter your email"
              />
            </div>
            <div>
              <label className="block text-2xl font-medium text-gray-800 mb-2">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-4 text-xl border-2 border-gray-300 rounded-xl focus:outline-none focus:border-[#2E7D32] focus:ring-2 focus:ring-[#2E7D32]/50 transition-colors"
                placeholder="Enter your password"
              />
            </div>
            
            <button
              type="submit"
              className="w-full bg-blue-700 hover:bg-blue-800 text-white text-2xl font-bold py-5 px-8 rounded-xl shadow-lg transition-transform active:scale-95 mt-4 min-h-14"
            >
              Sign In
            </button>
          </form>

          <div className="mt-8 text-center">
            <Link to="/register" className="text-xl text-blue-700 hover:text-blue-900 font-semibold underline underline-offset-4">
              Don't have an account? Register here
            </Link>
          </div>
        </div>
      </div>
      <MedicalDisclaimer />
    </div>
  );
};

export default Login;
