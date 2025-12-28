
import React, { useState, useEffect } from 'react';
import { User, UserRole } from './types';
import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/Signup';
import StudentDashboard from './pages/StudentDashboard';
import TeacherDashboard from './pages/TeacherDashboard';
import AdminDashboard from './pages/AdminDashboard';

type Page = 'home' | 'login' | 'signup' | 'dashboard';

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<Page>('home');
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem('smart_attendance_user');
    if (saved) {
      const parsed = JSON.parse(saved);
      setUser(parsed);
      setCurrentPage('dashboard');
    }
    setLoading(false);
  }, []);

  const handleAuthSuccess = (userData: User) => {
    setUser(userData);
    localStorage.setItem('smart_attendance_user', JSON.stringify(userData));
    setCurrentPage('dashboard');
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('smart_attendance_user');
    setCurrentPage('home');
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-indigo-50">
      <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  const renderContent = () => {
    switch (currentPage) {
      case 'home': return <Home onNavigate={setCurrentPage} />;
      case 'login': return <Login onNavigate={setCurrentPage} onAuthSuccess={handleAuthSuccess} />;
      case 'signup': return <Signup onNavigate={setCurrentPage} />;
      case 'dashboard':
        if (!user) { setCurrentPage('home'); return null; }
        return (
          <div className="min-h-screen bg-gray-50">
            <nav className="bg-white border-b sticky top-0 z-50 px-4 py-3 flex justify-between items-center shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold">A</div>
                <h1 className="font-bold text-gray-800">Attendo</h1>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-bold text-gray-900">{user.name}</p>
                  <p className="text-xs text-indigo-600 font-semibold uppercase">{user.role}</p>
                </div>
                <button onClick={handleLogout} className="text-sm text-red-600 hover:bg-red-50 px-3 py-1.5 rounded-md transition font-medium">
                  Logout
                </button>
              </div>
            </nav>
            <main className="max-w-7xl mx-auto p-4 md:p-8">
              {user.role === UserRole.STUDENT && <StudentDashboard user={user} />}
              {user.role === UserRole.TEACHER && <TeacherDashboard user={user} />}
              {user.role === UserRole.ADMIN && <AdminDashboard user={user} />}
            </main>
          </div>
        );
      default: return <Home onNavigate={setCurrentPage} />;
    }
  };

  return <div className="font-sans antialiased">{renderContent()}</div>;
};

export default App;
