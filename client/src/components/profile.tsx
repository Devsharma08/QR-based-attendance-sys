import { useMemo } from 'react';
import { User, Mail, Phone, Building, GraduationCap, Calendar, Hash, ShieldCheck, MapPin, ChevronRight } from 'lucide-react';

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

  const DetailRow = ({ icon: Icon, label, value, accentColor, isLast = false }: { icon: any; label: string; value: string | number | null; accentColor: string; isLast?: boolean }) => {
    if (value === null || value === undefined) return null;
    return (
      <div className="animate-slide-up" style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        padding: '1.25rem 0',
        borderBottom: isLast ? 'none' : '1px solid rgba(0,0,0,0.04)',
        transition: 'background 0.2s'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <div style={{ 
            width: '2.5rem', 
            height: '2.5rem', 
            borderRadius: '0.625rem', 
            background: `${accentColor}0d`, 
            color: accentColor, 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            flexShrink: 0 
          }}>
            <Icon size={18} />
          </div>
          <div>
            <p style={{ fontSize: '0.625rem', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</p>
            <p style={{ fontSize: '0.9375rem', fontWeight: 700, color: '#1e1e2e', marginTop: '0.125rem' }}>{value}</p>
          </div>
        </div>
        <ChevronRight size={16} style={{ color: '#d1d5db' }} />
      </div>
    );
  };

  return (
    <div style={{ maxWidth: '42rem', margin: '0 auto', padding: '2rem 1rem' }}>
      {/* Header Profile Section */}
      <div className="glass-card animate-slide-up" style={{ padding: '2rem', marginBottom: '1.5rem', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '-4rem', right: '-4rem', width: '12rem', height: '12rem', borderRadius: '50%', background: 'radial-gradient(circle, rgba(99,102,241,0.06), transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '1.5rem', position: 'relative' }}>
          <div style={{ position: 'relative' }}>
            <div style={{ width: '5rem', height: '5rem', borderRadius: '1.125rem', background: 'linear-gradient(135deg, #6366f1, #06b6d4)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 32px rgba(99,102,241,0.2)' }}>
              <span style={{ fontSize: '1.75rem', fontWeight: 900, color: 'white', textTransform: 'uppercase' }}>{user.name?.charAt(0)}</span>
            </div>
            <div style={{ position: 'absolute', bottom: '-0.125rem', right: '-0.125rem', width: '1.25rem', height: '1.25rem', borderRadius: '50%', background: '#10b981', border: '2px solid white' }} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.625rem', marginBottom: '0.375rem' }}>
              <h1 style={{ fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.02em', color: '#1e1e2e' }}>{user.name}</h1>
              <span className="badge badge-purple">{user.role}</span>
            </div>
            <p style={{ color: '#6b7280', fontSize: '0.8125rem', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '0.375rem' }}><Mail size={14} /> {user.email}</p>
          </div>
          <div className="glass-card" style={{ padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', gap: '0.625rem', background: 'rgba(16,185,129,0.04)', border: '1px solid rgba(16,185,129,0.1)' }}>
            <ShieldCheck size={18} style={{ color: '#059669' }} />
            <p style={{ fontSize: '0.75rem', fontWeight: 700, color: '#059669' }}>Verified</p>
          </div>
        </div>
      </div>

      {/* Details List Section */}
      <div className="glass-card animate-slide-up" style={{ padding: '0.5rem 1.5rem' }}>
        <DetailRow icon={Building} label="Department" value={user.departmentName || user.department || "University Campus"} accentColor="#6366f1" />
        <DetailRow icon={Phone} label="Contact Number" value={user.contactNumber || "Not provided"} accentColor="#059669" />
        
        {user.role === "STUDENT" && (
          <>
            <DetailRow icon={Hash} label="Roll Number" value={user.roleNumber || "Not provided"} accentColor="#6366f1" />
            <DetailRow icon={User} label="Student Type" value={user.studentType === 'LATERAL_ENTRY' ? 'Lateral Entry' : 'Regular'} accentColor="#06b6d4" />
            <DetailRow icon={Hash} label="Batch / Group" value={user.batch} accentColor="#f97316" />
            <DetailRow icon={Calendar} label="Academic Year" value={user.year ? `${user.year}${user.year === 1 ? 'st' : user.year === 2 ? 'nd' : user.year === 3 ? 'rd' : 'th'} Year` : null} accentColor="#6366f1" />
            <DetailRow icon={GraduationCap} label="Current Semester" value={user.semester ? `Semester ${user.semester}` : null} accentColor="#ec4899" />
          </>
        )}
        
        <DetailRow icon={MapPin} label="Location" value="Academic Block" accentColor="#d97706" isLast={true} />
      </div>

      <div style={{ marginTop: '2rem', textAlign: 'center' }}>
        <p style={{ fontSize: '0.75rem', color: '#9ca3af', fontWeight: 500 }}>
          Digital ID: <span style={{ fontFamily: "'JetBrains Mono', monospace", color: '#6b7280' }}>{user.id}</span>
        </p>
      </div>
    </div>
  );
};

export default Profile;