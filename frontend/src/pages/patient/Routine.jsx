import React, { useState, useEffect, useRef } from 'react';
import { useOutletContext } from 'react-router-dom';
import api from '../../api/axios';
import { useVoice } from '../../hooks/useVoice';
import LoadingSpinner from '../../components/LoadingSpinner';
import ConfettiCanvas from '../../components/ConfettiCanvas';

const Routine = () => {
  const [routines, setRoutines] = useState([]);
  const [patientId, setPatientId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All');
  const [error, setError] = useState('');
  
  const { soundEnabled, highContrast } = useOutletContext();
  const { speak } = useVoice();
  const confettiRef = useRef();

  useEffect(() => {
    const init = async () => {
      try {
        const pRes = await api.get('/patients/me');
        if (pRes.data && pRes.data._id) {
          setPatientId(pRes.data._id);
          fetchRoutines(pRes.data._id);
        } else {
          setError("Patient profile not found. Please ask your caregiver to set it up.");
          setLoading(false);
        }
      } catch (err) {
        console.error("Error fetching patient:", err);
        setError("Could not load your profile. Please try again later.");
        setLoading(false);
      }
    };
    init();
  }, []);

  const fetchRoutines = async (id) => {
    try {
      const res = await api.get(`/routines/today/${id}`);
      setRoutines(res.data.routines || res.data || []);
    } catch (err) {
      console.error("Error fetching routines:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = async (routine) => {
    if (routine.completed) return;
    
    try {
      await api.patch(`/routines/${routine._id}/complete`);
      
      if (confettiRef.current) {
        confettiRef.current.triggerConfetti();
      }
      if (soundEnabled) {
        speak("Great job completing " + routine.title + "!");
      }

      setRoutines(prev => 
        prev.map(r => r._id === routine._id ? { ...r, completed: true } : r)
      );
    } catch (err) {
      console.error("Error completing routine:", err);
      alert("Something went wrong. Please try again.");
    }
  };

  const getCategoryIcon = (cat) => {
    const icons = {
      medicine: '💊', hygiene: '🪥', meal: '🍳', exercise: '🚶', 
      cognitive: '🧠', sleep: '🌙', other: '⭐'
    };
    return icons[cat] || '📋';
  };

  const formatTime = (timeStr) => {
    if (!timeStr) return '';
    if (timeStr.includes(':')) {
      const [h, m] = timeStr.split(':').map(Number);
      const period = h >= 12 ? 'PM' : 'AM';
      const hour12 = h % 12 || 12;
      return `${hour12}:${m < 10 ? '0' + m : m} ${period}`;
    }
    return timeStr;
  };

  const getFilteredRoutines = () => {
    if (filter === 'All') return routines;
    return routines.filter(r => {
      const hour = parseInt(r.scheduledTime?.split(':')[0], 10) || 0;
      if (filter === 'Morning') return hour >= 5 && hour < 12;
      if (filter === 'Afternoon') return hour >= 12 && hour < 17;
      if (filter === 'Evening') return hour >= 17;
      return true;
    });
  };

  if (loading) return <LoadingSpinner message="Loading your routine..." />;

  if (error) {
    return (
      <div className="text-center p-8 bg-white rounded-3xl shadow-lg mt-8">
        <h2 className="text-3xl font-bold text-red-600 mb-4">Notice</h2>
        <p className="text-2xl">{error}</p>
      </div>
    );
  }

  const completedCount = routines.filter(r => r.isCompleted).length;
  const totalCount = routines.length;
  const progressPercent = totalCount === 0 ? 0 : Math.round((completedCount / totalCount) * 100);

  const textStyle = highContrast ? 'text-yellow-300' : 'text-gray-900';
  const cardStyle = highContrast ? 'bg-black border-2 border-yellow-300 text-yellow-300' : 'bg-white shadow-xl';

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <ConfettiCanvas ref={confettiRef} />
      
      <div className="text-center mb-8">
        <h1 className={`text-5xl font-bold mb-6 ${textStyle}`}>📋 Your Daily Routine</h1>
        
        {/* Progress Bar */}
        <div className={`p-6 rounded-3xl ${highContrast ? 'bg-gray-900 border border-yellow-300' : 'bg-white shadow-md'}`}>
          <div className="flex justify-between items-center mb-4 text-2xl font-bold">
            <span>Progress Today</span>
            <span>{completedCount} of {totalCount} Done ({progressPercent}%)</span>
          </div>
          <div className="w-full h-8 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className={`h-full transition-all duration-1000 ${highContrast ? 'bg-yellow-400' : 'bg-[#2E7D32]'}`}
              style={{ width: `${progressPercent}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap justify-center gap-4 mb-8">
        {['All', 'Morning', 'Afternoon', 'Evening'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`min-h-14 px-8 py-3 rounded-full text-2xl font-bold border-4 transition-colors ${
              filter === f 
              ? (highContrast ? 'bg-yellow-300 text-black border-yellow-300' : 'bg-[#2E7D32] text-white border-[#2E7D32]') 
              : (highContrast ? 'bg-black text-yellow-300 border-yellow-300' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50')
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Routine List */}
      <div className="space-y-6">
        {getFilteredRoutines().length === 0 ? (
          <div className={`text-center p-12 rounded-3xl ${cardStyle}`}>
            <p className="text-3xl">No activities scheduled for this time.</p>
          </div>
        ) : (
          getFilteredRoutines().map(routine => {
            const timeStr = formatTime(routine.scheduledTime);
            const isDone = routine.completed;

            return (
              <div 
                key={routine._id} 
                className={`flex flex-col sm:flex-row items-center justify-between p-6 rounded-3xl transition-all ${
                  isDone 
                  ? (highContrast ? 'bg-gray-900 border-2 border-yellow-300 opacity-75' : 'bg-green-50 border-2 border-green-200 shadow-sm') 
                  : cardStyle
                }`}
              >
                <div className="flex items-center gap-6 mb-4 sm:mb-0 w-full sm:w-auto">
                  <div className={`text-6xl w-24 h-24 flex items-center justify-center rounded-2xl ${
                    highContrast ? 'bg-black border border-yellow-300' : 'bg-gray-100'
                  }`}>
                    {getCategoryIcon(routine.category)}
                  </div>
                  <div>
                    <span className={`inline-block px-4 py-1 rounded-full text-xl font-bold mb-2 ${
                      highContrast ? 'bg-yellow-300 text-black' : 'bg-blue-100 text-blue-800'
                    }`}>
                      {timeStr}
                    </span>
                    <h3 className={`text-3xl font-bold ${isDone && !highContrast ? 'line-through text-gray-500' : ''}`}>
                      {routine.title}
                    </h3>
                  </div>
                </div>

                <div className="flex gap-4 w-full sm:w-auto mt-4 sm:mt-0">
                  {soundEnabled && (
                    <button 
                      onClick={() => speak(`At ${timeStr}, ${routine.title}`)}
                      className={`min-h-16 w-16 flex items-center justify-center rounded-2xl text-3xl border-2 ${
                        highContrast ? 'border-yellow-300' : 'bg-gray-100 border-gray-300 hover:bg-gray-200'
                      }`}
                      title="Read aloud"
                    >
                      🔊
                    </button>
                  )}
                  
                  <button
                    onClick={() => handleComplete(routine)}
                    disabled={isDone}
                    className={`flex-grow sm:flex-grow-0 min-h-16 px-8 py-4 rounded-2xl text-2xl font-bold shadow-md transition-transform active:scale-95 flex items-center justify-center gap-3 ${
                      isDone
                      ? 'bg-green-600 text-white cursor-default'
                      : (highContrast ? 'bg-yellow-300 text-black border-2 border-yellow-300' : 'bg-blue-600 hover:bg-blue-700 text-white')
                    }`}
                  >
                    {isDone ? (
                      <><span>✅</span> Done</>
                    ) : (
                      <><span>✓</span> I Did This</>
                    )}
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default Routine;
