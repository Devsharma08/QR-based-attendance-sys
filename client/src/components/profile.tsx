import { useMemo } from 'react';
import { User, Mail, Phone, Building, GraduationCap, Calendar, Hash, ShieldCheck, MapPin } from 'lucide-react';

const Profile = () => {
  const payload = localStorage.getItem('qr_user');
  const user = useMemo(() => {
    try { return payload ? JSON.parse(payload) : null; }
    catch (e) { console.error("Failed to parse user payload", e); return null; }
  }, [payload]);

  if (!user) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '400px' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: '4rem', height: '4rem', borderRadius: '50%', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem', color: '#94a3b8' }}><User size={32} /></div>
          <p style={{ color: '#6b7280', fontWeight: 500 }}>No user data found. Please log in again.</p>
        </div>
      </div>
    );
  }

  const DetailItem = ({ icon: Icon, label, value, accentColor }: { icon: any; label: string; value: string | number | null; accentColor: string }) => {
    if (value === null || value === undefined) return null;
    return (
      <div className="glass-card animate-slide-up" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <div style={{ width: '2.75rem', height: '2.75rem', borderRadius: '0.75rem', background: `${accentColor}0d`, color: accentColor, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Icon size={18} /></div>
        <div>
          <p style={{ fontSize: '0.625rem', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</p>
          <p style={{ fontSize: '0.875rem', fontWeight: 700, color: '#1e1e2e', marginTop: '0.125rem' }}>{value}</p>
        </div>
      </div>
    );
  };

  return (
    <div style={{ maxWidth: '56rem', margin: '0 auto', padding: '2rem 1rem' }}>
      <div className="glass-card animate-slide-up" style={{ padding: '2.5rem', marginBottom: '1.5rem', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '-6rem', right: '-6rem', width: '16rem', height: '16rem', borderRadius: '50%', background: 'radial-gradient(circle, rgba(99,102,241,0.05), transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '-6rem', left: '-6rem', width: '16rem', height: '16rem', borderRadius: '50%', background: 'radial-gradient(circle, rgba(6,182,212,0.04), transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '2rem', position: 'relative' }}>
          <div style={{ position: 'relative' }}>
            <div style={{ width: '6rem', height: '6rem', borderRadius: '1.25rem', background: 'linear-gradient(135deg, #6366f1, #06b6d4)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 32px rgba(99,102,241,0.2)' }}>
              <span style={{ fontSize: '2.25rem', fontWeight: 900, color: 'white', textTransform: 'uppercase' }}>{user.name?.charAt(0)}</span>
            </div>
            <div style={{ position: 'absolute', bottom: '-0.25rem', right: '-0.25rem', width: '1.5rem', height: '1.5rem', borderRadius: '50%', background: '#10b981', border: '3px solid white' }} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
              <h1 style={{ fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.02em', color: '#1e1e2e' }}>{user.name}</h1>
              <span className="badge badge-purple">{user.role}</span>
            </div>
            <p style={{ color: '#6b7280', fontSize: '0.875rem', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Mail size={14} /> {user.email}</p>
          </div>
          <div className="glass-card" style={{ padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <ShieldCheck size={20} style={{ color: '#059669' }} />
            <div>
              <p style={{ fontSize: '0.625rem', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase' }}>Status</p>
              <p style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#059669' }}>Verified</p>
            </div>
          </div>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(16rem, 1fr))', gap: '0.75rem' }}>
        <DetailItem icon={Building} label="Department" value={user.departmentName || user.department || "University Campus"} accentColor="#6366f1" />
        <DetailItem icon={Phone} label="Contact Number" value={user.contactNumber || "Not provided"} accentColor="#059669" />
        {user.role === "STUDENT" && (
          <>
            <DetailItem icon={Hash} label="Batch / Group" value={user.batch} accentColor="#f97316" />
            <DetailItem icon={Calendar} label="Academic Year" value={user.year ? `${user.year}${user.year === 1 ? 'st' : user.year === 2 ? 'nd' : user.year === 3 ? 'rd' : 'th'} Year` : null} accentColor="#6366f1" />
            <DetailItem icon={GraduationCap} label="Current Semester" value={user.semester ? `Semester ${user.semester}` : null} accentColor="#ec4899" />
          </>
        )}
        <DetailItem icon={MapPin} label="Location" value="Academic Block" accentColor="#d97706" />
      </div>
      <div style={{ marginTop: '2rem', textAlign: 'center' }}>
        <p style={{ fontSize: '0.75rem', color: '#6b7280', fontWeight: 500 }}>Digital ID: <span style={{ fontFamily: "'JetBrains Mono', monospace" }}>{user.id?.substring(0, 8)}...</span></p>
      </div>
    </div>
  );
};

export default Profile;