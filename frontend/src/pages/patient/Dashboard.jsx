import React, { useState, useEffect } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { useVoice } from '../../hooks/useVoice';
import LoadingSpinner from '../../components/LoadingSpinner';

const Dashboard = () => {
  const { user } = useAuth();
  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [time, setTime] = useState(new Date());
  const { soundEnabled, highContrast } = useOutletContext();
  const { speak, isSpeaking } = useVoice();

  useEffect(() => {
    const fetchPatient = async () => {
      try {
        const res = await api.get('/patients/me');
        setPatient(res.data.patient || res.data);
      } catch (err) {
        console.error('Error fetching patient profile:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchPatient();

    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const getPeriod = (hour) => {
    if (hour >= 5 && hour < 12) return { name: 'Morning', icon: '🌅' };
    if (hour >= 12 && hour < 17) return { name: 'Afternoon', icon: '☀️' };
    if (hour >= 17 && hour < 21) return { name: 'Evening', icon: '🌆' };
    return { name: 'Night', icon: '🌙' };
  };

  const period = getPeriod(time.getHours());
  const formattedTime = time.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  const formattedDate = time.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const greetingText = `Good ${period.name}, ${patient?.firstName || user?.name?.split(' ')[0] || 'Friend'}. It is ${formattedTime} on ${formattedDate}. You are in your home, safe and cared for.`;

  const handleSpeakGreeting = () => {
    if (soundEnabled) {
      speak(greetingText);
    }
  };

  if (loading) return <LoadingSpinner message="Loading your dashboard..." />;

  const cardStyle = highContrast ? 'bg-gray-900 border-2 border-yellow-300' : 'bg-white shadow-xl';
  const textStyle = highContrast ? 'text-yellow-300' : 'text-gray-800';

  return (
    <div className="space-y-8 pb-12">
      {/* Orientation Card */}
      <div className={`${cardStyle} rounded-3xl p-8 sm:p-12 text-center border-t-8 ${highContrast ? 'border-t-yellow-300' : 'border-t-[#2E7D32]'}`}>
        <div className="flex flex-col items-center justify-center mb-6">
          <span className="text-8xl mb-4">{period.icon}</span>
          <h2 className={`text-5xl sm:text-7xl font-bold mb-4 ${textStyle}`}>
            {formattedTime}
          </h2>
          <p className={`text-2xl sm:text-4xl font-medium ${highContrast ? 'text-yellow-200' : 'text-gray-600'}`}>
            {formattedDate}
          </p>
        </div>

        <h1 className={`text-4xl sm:text-5xl font-bold mt-8 mb-6 ${textStyle}`}>
          Good {period.name}, {patient?.name || user?.name || 'Friend'}!
        </h1>
        
        <p className={`text-2xl sm:text-3xl max-w-3xl mx-auto leading-relaxed mb-8 ${highContrast ? 'text-yellow-100' : 'text-[#2E7D32]'}`}>
          You are in your home, safe and cared for.
        </p>

        {soundEnabled && (
          <button 
            onClick={handleSpeakGreeting}
            disabled={isSpeaking}
            className={`min-h-16 py-4 px-8 rounded-2xl text-2xl font-bold flex items-center justify-center mx-auto gap-3 transition-colors ${
              isSpeaking 
              ? 'bg-gray-400 cursor-not-allowed' 
              : 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg'
            }`}
          >
            🔊 {isSpeaking ? 'Reading...' : 'Read To Me'}
          </button>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link 
          to="/patient/routine"
          className={`${cardStyle} rounded-3xl p-8 flex flex-col items-center justify-center text-center hover:scale-105 transition-transform min-h-[250px] group`}
        >
          <span className="text-6xl mb-4 group-hover:animate-bounce">📋</span>
          <h3 className={`text-3xl font-bold mb-2 ${textStyle}`}>Today's Routine</h3>
          <p className={`text-xl ${highContrast ? 'text-yellow-100' : 'text-gray-600'}`}>Check what's next</p>
        </Link>

        <Link 
          to="/patient/games"
          className={`${cardStyle} rounded-3xl p-8 flex flex-col items-center justify-center text-center hover:scale-105 transition-transform min-h-[250px] group`}
        >
          <span className="text-6xl mb-4 group-hover:animate-pulse">🧠</span>
          <h3 className={`text-3xl font-bold mb-2 ${textStyle}`}>Brain Activities</h3>
          <p className={`text-xl ${highContrast ? 'text-yellow-100' : 'text-gray-600'}`}>Play fun games</p>
        </Link>

        <Link 
          to="/patient/results"
          className={`${cardStyle} rounded-3xl p-8 flex flex-col items-center justify-center text-center hover:scale-105 transition-transform min-h-[250px] group`}
        >
          <span className="text-6xl mb-4 group-hover:rotate-12 transition-transform">📊</span>
          <h3 className={`text-3xl font-bold mb-2 ${textStyle}`}>My Progress</h3>
          <p className={`text-xl ${highContrast ? 'text-yellow-100' : 'text-gray-600'}`}>See how you're doing</p>
        </Link>
      </div>
    </div>
  );
};

export default Dashboard;
