import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const CaregiverLayout = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { name: '📊 Dashboard', path: '/caregiver', end: true },
    { name: '📈 Progress', path: '/caregiver/progress' },
    { name: '🏆 Results', path: '/caregiver/results' },
    { name: '⏰ Reminders', path: '/caregiver/reminders' },
    { name: '🔔 Alerts', path: '/caregiver/alerts' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-blue-900">🌿 MindCare</h1>
              <span className="hidden sm:inline-block px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                Caregiver Portal
              </span>
            </div>
            <div className="flex items-center gap-3">
              <NavLink
                to="/patient"
                className="px-4 py-2 text-sm font-bold text-white bg-green-700 hover:bg-green-800 rounded-lg transition-colors flex items-center gap-1.5"
              >
                👤 Switch to Patient View
              </NavLink>
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
          
          <nav className="flex space-x-6 overflow-x-auto py-3 no-scrollbar border-t border-gray-100">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.end}
                className={({ isActive }) =>
                  `whitespace-nowrap pb-2 px-1 text-sm font-medium transition-colors border-b-2 ${
                    isActive
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`
                }
              >
                {item.name}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>
    </div>
  );
};

export default CaregiverLayout;
