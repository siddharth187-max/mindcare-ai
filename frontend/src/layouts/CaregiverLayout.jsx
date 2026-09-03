import React from 'react';
import { Outlet, NavLink, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import MedicalDisclaimer from '../components/MedicalDisclaimer';

const CaregiverLayout = () => {
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { name: '📊 Telemetry Dashboard', path: '/caregiver', end: true },
    { name: '📈 Cognitive Trends', path: '/caregiver/progress' },
    { name: '🏆 Activity History', path: '/caregiver/results' },
    { name: '⏰ Care Reminders', path: '/caregiver/reminders' },
    { name: '🔔 Safety Alerts', path: '/caregiver/alerts' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Top Clinical Monitoring Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            
            {/* Brand & Portal Title */}
            <div className="flex items-center gap-3">
              <Link to="/caregiver" className="flex items-center gap-2">
                <span className="text-2xl p-1.5 rounded-lg bg-blue-50 text-blue-700">🌿</span>
                <span className="text-xl font-extrabold text-slate-900 tracking-tight">
                  MindCare <span className="text-blue-600">Pro</span>
                </span>
              </Link>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-200">
                Caregiver Monitoring Console
              </span>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-3">
              <NavLink
                to="/patient"
                className="px-3.5 py-1.5 text-xs sm:text-sm font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-xl transition-all flex items-center gap-1.5 shadow-sm active:scale-95"
              >
                <span>👤</span>
                <span>Switch to Patient View</span>
              </NavLink>
              
              <button
                onClick={handleLogout}
                className="px-3 py-1.5 text-xs sm:text-sm font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
          
          {/* Navigation Bar */}
          <nav className="flex space-x-2 sm:space-x-4 overflow-x-auto py-2 no-scrollbar border-t border-slate-100">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.end}
                className={({ isActive }) =>
                  `whitespace-nowrap px-3 py-1.5 rounded-lg text-sm font-bold transition-all ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`
                }
              >
                {item.name}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>

      {/* Main Caregiver View */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>

      <MedicalDisclaimer />
    </div>
  );
};

export default CaregiverLayout;
