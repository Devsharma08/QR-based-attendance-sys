import React, { useState, useEffect } from 'react';
import { Loader2, QrCode, Eye, EyeOff } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const Auth = ({ onAuthSuccess }: { onAuthSuccess: (session: any) => void }) => {
  const location = useLocation();
  const navigate = useNavigate();
  
  const [isLogin, setIsLogin] = useState(location.pathname === '/login' || location.pathname === '/auth');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [year, setYear] = useState(1);
  const [role, setRole] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    setIsLogin(location.pathname === '/login' || location.pathname === '/auth');
  }, [location.pathname]);

  const getSemester = (year: number) => {
    switch (year) {
      case 1: return [1, 2]; case 2: return [3, 4];
      case 3: return [5, 6]; case 4: return [7, 8];
      default: return [1, 2];
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget as HTMLFormElement);
    const entries = Object.fromEntries(formData.entries());
    setLoading(true); setMessage("");

    try {
      if (isLogin) {
        const res = await fetch(`${API_URL}/api/auth/login`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: entries.email, password: entries.password })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Login failed");
        localStorage.setItem('qr_token', data.token);
        localStorage.setItem('qr_user', JSON.stringify(data.user));
        onAuthSuccess({ token: data.token, user: data.user });
      } else {
        const res = await fetch(`${API_URL}/api/auth/signup`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(entries)
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Signup failed");
        localStorage.setItem('qr_token', data.token);
        localStorage.setItem('qr_user', JSON.stringify(data.user));
        onAuthSuccess({ token: data.token, user: data.user });
      }
    } catch (error: any) {
      setMessage(error.message || "An unexpected error occurred");
      setTimeout(() => setMessage(""), 3000);
    } finally { setLoading(false); }
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '1.5rem', position: 'relative', overflow: 'hidden',
    }}>
      {/* Floating decorative orbs */}
      <div style={{
        position: 'absolute', width: '30rem', height: '30rem', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(99,102,241,0.06), transparent 70%)',
        top: '-8rem', left: '-8rem', animation: 'float 8s ease-in-out infinite',
      }} />
      <div style={{
        position: 'absolute', width: '24rem', height: '24rem', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(6,182,212,0.05), transparent 70%)',
        bottom: '-6rem', right: '-6rem', animation: 'float 10s ease-in-out infinite reverse',
      }} />

      <div className="animate-slide-up" style={{
        width: '100%', maxWidth: '26rem',
        background: 'rgba(255, 255, 255, 0.85)',
        backdropFilter: 'blur(24px)',
        border: '1px solid rgba(0,0,0,0.06)',
        borderRadius: '1.5rem',
        padding: '2.5rem',
        boxShadow: '0 12px 48px rgba(0,0,0,0.08)',
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            width: '3.5rem', height: '3.5rem', borderRadius: '1rem',
            background: 'linear-gradient(135deg, #6366f1, #06b6d4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 1.25rem',
            boxShadow: '0 8px 32px rgba(99,102,241,0.25)',
          }}>
            <QrCode size={22} color="white" />
          </div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.02em', color: '#1e1e2e', marginBottom: '0.375rem' }}>
            {isLogin ? 'Welcome Back' : 'Create Account'}
          </h2>
          <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>
            {isLogin ? 'Smart QR Attendance System' : 'Sign up to get started'}
          </p>
        </div>

        <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {!isLogin && (
            <>
              <div><label className="label-premium">Full Name</label><input required name="name" type="text" className="input-premium" placeholder="John Doe" /></div>
              {role === "STUDENT" && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div><label className="label-premium">Roll Number</label><input required name="roleNumber" type="text" className="input-premium" placeholder="e.g. 21001001" /></div>
                  <div>
                    <label className="label-premium">Student Type</label>
                    <select required name="studentType" className="input-premium">
                      <option value="REGULAR">Regular</option>
                      <option value="LATERAL_ENTRY">Lateral Entry</option>
                    </select>
                  </div>
                </div>
              )}
              <div><label className="label-premium">Contact Number</label><input required name="contactNumber" type="tel" className="input-premium" placeholder="+91 98765 43210" /></div>
              <div>
                <label className="label-premium">Role</label>
                <select required value={role} onChange={(e) => setRole(e.target.value)} name="role" className="input-premium">
                  <option value="" disabled>Select role</option>
                  <option value="STUDENT">Student</option>
                  <option value="TEACHER">Professor</option>
                  <option value="HOD">HOD</option>
                </select>
              </div>
              <div>
                <label className="label-premium">Department</label>
                <select required name="department" className="input-premium">
                  <option value="" disabled>Select Department</option>
                  <option value="CSE">Computer Science & Engineering</option>
                  <option value="ECE">Electronics & Communication</option>
                  <option value="EEE">Electrical Engineering</option>
                  <option value="AIML">AI & Machine Learning</option>
                  <option value="ROB">Robotics & Automation</option>
                  <option value="CHE">Chemical Engineering</option>
                  <option value="CIV">Civil Engineering</option>
                  <option value="MECH">Mechanical Engineering</option>
                  <option value="BIO">Biotechnology</option>
                </select>
              </div>
              {role === "STUDENT" && (
                <>
                  <div><label className="label-premium">Batch</label><select required name="batch" className="input-premium"><option value="" disabled>Select Batch</option><option value="Group-1">Group-1</option><option value="Group-2">Group-2</option></select></div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                    <div><label className="label-premium">Year</label><select onChange={(e) => setYear(parseInt(e.target.value))} required name="year" className="input-premium"><option value="1">1st Year</option><option value="2">2nd Year</option><option value="3">3rd Year</option><option value="4">4th Year</option></select></div>
                    <div><label className="label-premium">Semester</label><select required name="semester" className="input-premium">{getSemester(year).map((sem) => (<option key={sem} value={sem}>Sem {sem}</option>))}</select></div>
                  </div>
                </>
              )}
            </>
          )}

          <div><label className="label-premium">Email</label><input required name="email" type="email" className="input-premium" placeholder="you@college.edu" /></div>

          <div style={{ position: 'relative' }}>
            <label className="label-premium">Password</label>
            <input required name="password" type={showPassword ? 'text' : 'password'} className="input-premium" placeholder="••••••••" style={{ paddingRight: '3rem' }} />
            <button type="button" onClick={() => setShowPassword(!showPassword)} style={{
              position: 'absolute', right: '0.75rem', bottom: '0.75rem',
              background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer', padding: '0.25rem',
            }}>
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>

          {message && (
            <div style={{
              padding: '0.75rem 1rem', borderRadius: '0.75rem', fontSize: '0.8125rem', fontWeight: 600,
              background: message.toLowerCase().includes('success') ? 'rgba(16,185,129,0.06)' : 'rgba(239,68,68,0.06)',
              color: message.toLowerCase().includes('success') ? '#059669' : '#dc2626',
              border: `1px solid ${message.toLowerCase().includes('success') ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)'}`,
            }}>{message}</div>
          )}

          <button disabled={loading} type="submit" className="btn-primary" style={{
            width: '100%', padding: '1rem', marginTop: '0.5rem', fontSize: '0.9375rem',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
          }}>
            {loading ? <Loader2 className="animate-spin" size={18} /> : (isLogin ? 'Sign In' : 'Create Account')}
          </button>
        </form>

        <p style={{ textAlign: 'center', fontSize: '0.8125rem', color: '#6b7280', marginTop: '1.5rem' }}>
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <button type="button" onClick={() => { navigate(isLogin ? '/signup' : '/login'); setMessage(''); }} style={{
            border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '0.8125rem',
            background: 'linear-gradient(135deg, #6366f1, #06b6d4)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          }}>
            {isLogin ? 'Sign up' : 'Log in'}
          </button>
        </p>
      </div>
    </div>
  );
};

export default Auth;