import { BrowserRouter, Routes, Route, Link, useLocation, Navigate, useNavigate } from "react-router-dom";
import { BarChart, Calendar, QrCode, ClipboardList, User, LogOut, Sparkles } from "lucide-react";

import DirectorDashboard from "./components/director/DirectorDashboard";
import HodDashboard from "./components/hod/HodDashboard";
import TeacherDashboard from "./components/teacher/TeacherDashboard";
import StudentScanner from "./components/student/StudentDashboard";
import Auth from './components/Auth';
import Profile from './components/profile';
import { useState, useEffect } from "react";

const NavBar = ({ userRole, onLogout }: { userRole: string; onLogout: () => void }) => {
  const location = useLocation();

  const navItems: Record<string, { to: string; icon: React.ReactNode; label: string }> = {
    DIRECTOR: { to: '/director', icon: <BarChart size={16} />, label: 'Dashboard' },
    HOD: { to: '/hod', icon: <Calendar size={16} />, label: 'Control Center' },
    TEACHER: { to: '/teacher', icon: <ClipboardList size={16} />, label: 'Classes' },
    STUDENT: { to: '/student', icon: <QrCode size={16} />, label: 'Scanner' },
  };

  const nav = navItems[userRole];

  return (
    <nav style={{
      background: 'rgba(255, 255, 255, 0.8)',
      backdropFilter: 'blur(20px)',
      borderBottom: '1px solid rgba(0,0,0,0.06)',
      position: 'sticky',
      top: 0,
      zIndex: 40,
    }}>
      <div style={{
        maxWidth: '80rem', margin: '0 auto', padding: '0 1.5rem',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: '4rem',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{
            width: '2rem', height: '2rem', borderRadius: '0.5rem',
            background: 'linear-gradient(135deg, #6366f1, #06b6d4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Sparkles size={14} color="white" />
          </div>
          <span style={{ fontWeight: 800, fontSize: '1rem', letterSpacing: '-0.02em', color: '#1e1e2e' }}>
            QR <span style={{ color: '#6b7280' }}>Attend</span>
          </span>
        </div>

        <div style={{ display: 'flex', gap: '0.25rem' }}>
          {nav && (
            <Link to={nav.to} style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              padding: '0.5rem 1rem', borderRadius: '0.625rem',
              fontSize: '0.8125rem', fontWeight: 600, textDecoration: 'none',
              color: location.pathname === nav.to ? '#6366f1' : '#6b7280',
              background: location.pathname === nav.to ? 'rgba(99,102,241,0.06)' : 'transparent',
              transition: 'all 0.2s',
            }}>
              {nav.icon} {nav.label}
            </Link>
          )}
          <Link to="/profile" style={{
            display: 'flex', alignItems: 'center', gap: '0.5rem',
            padding: '0.5rem 1rem', borderRadius: '0.625rem',
            fontSize: '0.8125rem', fontWeight: 600, textDecoration: 'none',
            color: location.pathname === '/profile' ? '#6366f1' : '#6b7280',
            background: location.pathname === '/profile' ? 'rgba(99,102,241,0.06)' : 'transparent',
            transition: 'all 0.2s',
          }}>
            <User size={16} /> Profile
          </Link>
        </div>

        <button onClick={onLogout} style={{
          display: 'flex', alignItems: 'center', gap: '0.5rem',
          padding: '0.5rem 1rem', borderRadius: '0.625rem',
          fontSize: '0.8125rem', fontWeight: 600,
          color: '#dc2626', background: 'rgba(239,68,68,0.05)',
          border: '1px solid rgba(239,68,68,0.1)',
          cursor: 'pointer', transition: 'all 0.2s',
        }}>
          <LogOut size={14} /> Logout
        </button>
      </div>
    </nav>
  );
};

const AppContent = ({ session, onLogout }: { session: any; onLogout: () => void }) => {
  const userRole = session.user.role;
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    // If we are at the root or auth page, or on a dashboard that doesn't belong to our role
    // redirect to the correct role dashboard.
    const path = location.pathname.toLowerCase();
    const rolePath = `/${userRole.toLowerCase()}`;
    
    const isDashboardPath = ['/director', '/hod', '/teacher', '/student'].some(p => path.startsWith(p));
    const isIncorrectDashboard = isDashboardPath && !path.startsWith(rolePath);
    
    if (path === '/' || path === '/auth' || isIncorrectDashboard) {
      navigate(rolePath, { replace: true });
    }
  }, [userRole, location.pathname, navigate]);

  return (
    <>
      <NavBar userRole={userRole} onLogout={onLogout} />
      <main style={{ minHeight: 'calc(100vh - 4rem)' }}>
        <Routes>
          <Route path="/director" element={userRole === 'DIRECTOR' ? <DirectorDashboard /> : <Navigate to={`/${userRole.toLowerCase()}`} replace />} />
          <Route path="/hod" element={userRole === 'HOD' ? <HodDashboard /> : <Navigate to={`/${userRole.toLowerCase()}`} replace />} />
          <Route path="/teacher" element={userRole === 'TEACHER' ? <TeacherDashboard /> : <Navigate to={`/${userRole.toLowerCase()}`} replace />} />
          <Route path="/student" element={userRole === 'STUDENT' ? <StudentScanner /> : <Navigate to={`/${userRole.toLowerCase()}`} replace />} />
          <Route path="/profile" element={<Profile />} />
          {/* Fallback to profile if something goes wrong, or the correct dashboard will be picked up by useEffect */}
          <Route path="*" element={<Navigate to={`/${userRole.toLowerCase()}`} replace />} />
        </Routes>
      </main>
    </>
  );
};

const App = () => {
  const [session, setSession] = useState<any>(null);

  useEffect(() => {
    const savedToken = localStorage.getItem('qr_token');
    const savedUser = localStorage.getItem('qr_user');
    if (savedToken && savedUser) {
      setSession({ token: savedToken, user: JSON.parse(savedUser) });
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('qr_token');
    localStorage.removeItem('qr_user');
    setSession(null);
  };

  if (!session) {
    return <Auth onAuthSuccess={(data) => { setSession(data) }} />;
  }

  return (
    <BrowserRouter>
      <AppContent session={session} onLogout={handleLogout} />
    </BrowserRouter>
  );
};

export default App;