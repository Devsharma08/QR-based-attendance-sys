import { useState, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Legend,
} from 'recharts';
import {
  Building2, Users, LayoutGrid, Activity,
  Plus, Pencil, Trash2, X, CheckCircle, AlertTriangle, School,
  BarChart2, List
} from 'lucide-react';

const API = 'http://localhost:5000/api/director';

const DirectorDashboard = () => {
  const token = localStorage.getItem('qr_token') || '';
  const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };

  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'ANALYTICS' | 'DEPARTMENTS' | 'USERS'>('OVERVIEW');
  const [overview, setOverview] = useState<any>(null);
  const [analytics, setAnalytics] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [userFilter, setUserFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [deptModalOpen, setDeptModalOpen] = useState(false);
  const [editingDept, setEditingDept] = useState<any>(null);
  const [deptName, setDeptName] = useState('');
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3500); };

  const fetchOverview = async () => { const res = await fetch(`${API}/overview`, { headers }); if (res.ok) setOverview(await res.json()); };
  const fetchAnalytics = async () => { const res = await fetch(`${API}/analytics`, { headers }); if (res.ok) setAnalytics(await res.json()); };
  const fetchDepartments = async () => { const res = await fetch(`${API}/departments`, { headers }); if (res.ok) setDepartments(await res.json()); };
  const fetchUsers = async () => { const res = await fetch(`${API}/users`, { headers }); if (res.ok) setUsers(await res.json()); };

  useEffect(() => { fetchOverview(); fetchAnalytics(); fetchDepartments(); fetchUsers(); }, []);

  const openCreate = () => { setEditingDept(null); setDeptName(''); setDeptModalOpen(true); };
  const openEdit = (dept: any) => { setEditingDept(dept); setDeptName(dept.name); setDeptModalOpen(true); };

  const handleSaveDept = async () => {
    if (!deptName.trim()) return showToast('Name cannot be empty', 'error');
    try {
      const res = editingDept
        ? await fetch(`${API}/departments/${editingDept.id}`, { method: 'PATCH', headers, body: JSON.stringify({ name: deptName }) })
        : await fetch(`${API}/departments`, { method: 'POST', headers, body: JSON.stringify({ name: deptName }) });
      const data = await res.json();
      if (!res.ok) return showToast(data.message || 'Failed', 'error');
      showToast(editingDept ? 'Updated!' : 'Created!'); setDeptModalOpen(false); fetchDepartments(); fetchAnalytics();
    } catch { showToast('Server error', 'error'); }
  };

  const handleDeleteDept = async (dept: any) => {
    if (!window.confirm(`Delete "${dept.name}"?`)) return;
    try {
      const res = await fetch(`${API}/departments/${dept.id}`, { method: 'DELETE', headers });
      const data = await res.json();
      if (!res.ok) return showToast(data.message || 'Failed', 'error');
      showToast('Deleted.'); fetchDepartments(); fetchAnalytics();
    } catch { showToast('Server error', 'error'); }
  };

  const filteredUsers = users.filter(u => {
    const matchText = !userFilter || u.name.toLowerCase().includes(userFilter.toLowerCase()) || u.email.toLowerCase().includes(userFilter.toLowerCase());
    return matchText && (!roleFilter || u.role === roleFilter);
  });

  const maxStudents = Math.max(...analytics.map(a => a.studentCount), 1);
  const maxTeachers = Math.max(...analytics.map(a => a.teacherCount), 1);
  const maxSessions = Math.max(...analytics.map(a => a.sessionCount), 1);
  const maxSubjects = Math.max(...analytics.map(a => a.subjectCount), 1);

  const radarData = analytics.map(a => ({
    dept: a.name.split(' ')[0],
    Attendance: a.attendanceRate,
    Students: Math.round((a.studentCount / maxStudents) * 100),
    Teachers: Math.round((a.teacherCount / maxTeachers) * 100),
    Sessions: Math.round((a.sessionCount / maxSessions) * 100),
    Subjects: Math.round((a.subjectCount / maxSubjects) * 100),
  }));

  const COLORS = ['#6366f1', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

  const kpiCards = [
    { label: 'Departments', value: overview?.totalDepts ?? '—', icon: <Building2 size={20} />, color: '#6366f1' },
    { label: 'Students', value: overview?.totalStudents ?? '—', icon: <Users size={20} />, color: '#06b6d4' },
    { label: 'Teachers', value: overview?.totalTeachers ?? '—', icon: <School size={20} />, color: '#10b981' },
    { label: 'Sessions', value: overview?.totalSessions ?? '—', icon: <LayoutGrid size={20} />, color: '#f59e0b' },
    { label: 'Attendances', value: overview?.totalAttendances ?? '—', icon: <CheckCircle size={20} />, color: '#8b5cf6' },
    { label: 'Live Now', value: overview?.activeSessions ?? '—', icon: <Activity size={20} />, color: '#ec4899' },
  ];

  const tabs = [
    { key: 'OVERVIEW' as const, label: 'Overview', icon: <Activity size={15} /> },
    { key: 'ANALYTICS' as const, label: 'Analytics', icon: <BarChart2 size={15} /> },
    { key: 'DEPARTMENTS' as const, label: 'Departments', icon: <Building2 size={15} /> },
    { key: 'USERS' as const, label: 'All Users', icon: <List size={15} /> },
  ];

  return (
    <div style={{ minHeight: '100vh' }}>
      {toast && <div className={`toast ${toast.type}`}>{toast.type === 'success' ? <CheckCircle size={18} /> : <AlertTriangle size={18} />}{toast.msg}</div>}

      {deptModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#1e1e2e' }}>{editingDept ? 'Edit Department' : 'New Department'}</h2>
              <button onClick={() => setDeptModalOpen(false)} className="btn-ghost" style={{ padding: '0.5rem' }}><X size={18} /></button>
            </div>
            <label className="label-premium">Department Name</label>
            <input value={deptName} onChange={e => setDeptName(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSaveDept()} placeholder="e.g. Computer Science" className="input-premium" />
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
              <button onClick={() => setDeptModalOpen(false)} className="btn-ghost" style={{ flex: 1 }}>Cancel</button>
              <button onClick={handleSaveDept} className="btn-primary" style={{ flex: 1 }}>{editingDept ? 'Update' : 'Create'}</button>
            </div>
          </div>
        </div>
      )}

      <div style={{ maxWidth: '80rem', margin: '0 auto', padding: '2rem 1.5rem' }}>
        <div className="animate-slide-up" style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-end', gap: '1rem', marginBottom: '2rem' }}>
          <div>
            <h1 style={{ fontSize: '2rem', fontWeight: 800, letterSpacing: '-0.03em' }} className="gradient-text">Director's Command Center</h1>
            <p style={{ color: '#6b7280', marginTop: '0.25rem' }}>Campus-wide analytics & department management</p>
          </div>
          {activeTab === 'DEPARTMENTS' && <button onClick={openCreate} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Plus size={18} /> New Department</button>}
        </div>

        <div className="tab-bar animate-slide-up-delay-1" style={{ marginBottom: '2rem' }}>
          {tabs.map(tab => <button key={tab.key} onClick={() => setActiveTab(tab.key)} className={`tab-btn ${activeTab === tab.key ? 'active' : ''}`}>{tab.icon} {tab.label}</button>)}
        </div>

        {/* OVERVIEW */}
        {activeTab === 'OVERVIEW' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(10rem, 1fr))', gap: '0.75rem' }}>
              {kpiCards.map((card, i) => (
                <div key={i} className="glass-card stat-card animate-slide-up" style={{ padding: '1.25rem', animationDelay: `${i * 0.05}s` }}>
                  <div style={{ width: '2.25rem', height: '2.25rem', borderRadius: '0.625rem', background: `${card.color}0d`, color: card.color, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0.75rem' }}>{card.icon}</div>
                  <p style={{ fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.02em', color: '#1e1e2e' }}>{card.value}</p>
                  <p style={{ fontSize: '0.6875rem', color: '#6b7280', fontWeight: 600, marginTop: '0.125rem' }}>{card.label}</p>
                </div>
              ))}
            </div>
            <div className="glass-card animate-slide-up-delay-1" style={{ padding: '1.5rem' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#1e1e2e', marginBottom: '0.25rem' }}>Attendance Rate by Department</h3>
              <p style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '1.5rem' }}>Based on closed sessions</p>
              <div style={{ height: '18rem' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analytics} margin={{ top: 5, right: 20, left: 0, bottom: 30 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.04)" />
                    <XAxis dataKey="name" tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} angle={-20} textAnchor="end" />
                    <YAxis domain={[0, 100]} tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} unit="%" />
                    <Tooltip contentStyle={{ background: 'white', border: '1px solid rgba(0,0,0,0.06)', borderRadius: '0.75rem', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }} />
                    <Bar dataKey="attendanceRate" radius={[6, 6, 0, 0]} fill="url(#gradBar)" />
                    <defs><linearGradient id="gradBar" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#6366f1" /><stop offset="100%" stopColor="#06b6d4" /></linearGradient></defs>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="glass-card animate-slide-up-delay-2" style={{ padding: '1.5rem' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#1e1e2e', marginBottom: '1.5rem' }}>Student Distribution</h3>
              <div style={{ height: '16rem' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analytics} layout="vertical" margin={{ left: 20, right: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(0,0,0,0.04)" />
                    <XAxis type="number" tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis type="category" dataKey="name" tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} width={140} />
                    <Tooltip contentStyle={{ background: 'white', border: '1px solid rgba(0,0,0,0.06)', borderRadius: '0.75rem' }} />
                    <Bar dataKey="studentCount" radius={[0, 6, 6, 0]} fill="#06b6d4" name="Students" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* ANALYTICS */}
        {activeTab === 'ANALYTICS' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div className="glass-card animate-slide-up" style={{ padding: '1.5rem' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#1e1e2e' }}>Head-to-Head Comparison</h3>
              <p style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '1.5rem' }}>All metrics normalized to 100</p>
              <div style={{ height: '24rem' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="rgba(0,0,0,0.06)" />
                    <PolarAngleAxis dataKey="dept" tick={{ fill: '#374151', fontSize: 12, fontWeight: 600 }} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: '#9ca3af', fontSize: 10 }} />
                    {['Attendance', 'Students', 'Teachers', 'Sessions', 'Subjects'].map((key, i) => (
                      <Radar key={key} name={key} dataKey={key} stroke={COLORS[i]} fill={COLORS[i]} fillOpacity={0.08} />
                    ))}
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Tooltip contentStyle={{ background: 'white', border: '1px solid rgba(0,0,0,0.06)', borderRadius: '0.75rem' }} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(20rem, 1fr))', gap: '0.75rem' }}>
              {analytics.map((dept, i) => (
                <div key={dept.id} className="glass-card animate-slide-up" style={{ padding: '1.5rem', animationDelay: `${i * 0.05}s` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                    <h4 style={{ fontWeight: 700, fontSize: '0.9375rem', color: '#1e1e2e' }}>{dept.name}</h4>
                    <span className={`badge ${dept.attendanceRate >= 75 ? 'badge-green' : dept.attendanceRate >= 50 ? 'badge-amber' : 'badge-red'}`}>{dept.attendanceRate}%</span>
                  </div>
                  <div className="progress-bar" style={{ marginBottom: '1.25rem' }}><div className="progress-bar-fill" style={{ width: `${dept.attendanceRate}%` }} /></div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem' }}>
                    {[{ l: 'Students', v: dept.studentCount }, { l: 'Teachers', v: dept.teacherCount }, { l: 'Subjects', v: dept.subjectCount }, { l: 'Rooms', v: dept.roomCount }, { l: 'Sessions', v: dept.sessionCount }, { l: 'T:S', v: dept.teacherStudentRatio }].map((s, j) => (
                      <div key={j} style={{ background: '#f8f9fc', borderRadius: '0.625rem', padding: '0.625rem', textAlign: 'center' }}>
                        <p style={{ fontSize: '0.625rem', color: '#6b7280', fontWeight: 600 }}>{s.l}</p>
                        <p style={{ fontSize: '1.125rem', fontWeight: 800, color: '#1e1e2e', marginTop: '0.125rem' }}>{s.v}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* DEPARTMENTS */}
        {activeTab === 'DEPARTMENTS' && (
          <div className="animate-slide-up">
            {departments.length === 0 ? (
              <div className="glass-card" style={{ textAlign: 'center', padding: '4rem', color: '#6b7280' }}>No departments yet.</div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(18rem, 1fr))', gap: '0.75rem' }}>
                {departments.map(dept => (
                  <div key={dept.id} className="glass-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div style={{ width: '2.5rem', height: '2.5rem', borderRadius: '0.625rem', background: 'rgba(99,102,241,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6366f1' }}><Building2 size={18} /></div>
                        <div style={{ display: 'flex', gap: '0.375rem' }}>
                          <button onClick={() => openEdit(dept)} className="btn-ghost" style={{ padding: '0.375rem' }}><Pencil size={14} /></button>
                          <button onClick={() => handleDeleteDept(dept)} className="btn-danger" style={{ padding: '0.375rem' }}><Trash2 size={14} /></button>
                        </div>
                      </div>
                      <h3 style={{ fontWeight: 700, fontSize: '1.0625rem', marginTop: '1rem', color: '#1e1e2e' }}>{dept.name}</h3>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem', marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid rgba(0,0,0,0.04)', textAlign: 'center' }}>
                      <div><p style={{ fontSize: '1.125rem', fontWeight: 800, color: '#6366f1' }}>{dept._count?.users ?? 0}</p><p style={{ fontSize: '0.625rem', color: '#6b7280' }}>Users</p></div>
                      <div><p style={{ fontSize: '1.125rem', fontWeight: 800, color: '#06b6d4' }}>{dept._count?.subjects ?? 0}</p><p style={{ fontSize: '0.625rem', color: '#6b7280' }}>Subjects</p></div>
                      <div><p style={{ fontSize: '1.125rem', fontWeight: 800, color: '#10b981' }}>{dept._count?.rooms ?? 0}</p><p style={{ fontSize: '0.625rem', color: '#6b7280' }}>Rooms</p></div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* USERS */}
        {activeTab === 'USERS' && (
          <div className="animate-slide-up" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
              <input value={userFilter} onChange={e => setUserFilter(e.target.value)} placeholder="Search..." className="input-premium" style={{ flex: 1, minWidth: '14rem' }} />
              <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)} className="input-premium" style={{ minWidth: '10rem' }}>
                <option value="">All Roles</option><option value="STUDENT">Students</option><option value="TEACHER">Teachers</option><option value="HOD">HODs</option><option value="DIRECTOR">Directors</option>
              </select>
            </div>
            <div className="glass-card" style={{ overflow: 'hidden' }}>
              <table className="table-premium">
                <thead><tr>{['Name', 'Email', 'Role', 'Department', 'Roll No.', 'Type', 'Batch / Sem'].map(h => <th key={h}>{h}</th>)}</tr></thead>
                <tbody>
                  {filteredUsers.length === 0 ? (
                    <tr><td colSpan={5} style={{ textAlign: 'center', padding: '3rem', color: '#6b7280' }}>No users found.</td></tr>
                  ) : filteredUsers.map(user => (
                    <tr key={user.id}>
                      <td style={{ fontWeight: 600, color: '#1e1e2e' }}>{user.name}</td>
                      <td>{user.email}</td>
                      <td><span className={`badge ${user.role === 'STUDENT' ? 'badge-cyan' : user.role === 'TEACHER' ? 'badge-purple' : user.role === 'HOD' ? 'badge-amber' : 'badge-red'}`}>{user.role}</span></td>
                      <td>{user.department?.name || '—'}</td>
                      <td style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.75rem', fontWeight: 600 }}>{user.roleNumber || '—'}</td>
                      <td>{user.role === 'STUDENT' ? (user.studentType === 'LATERAL_ENTRY' ? 'Lateral' : 'Regular') : '—'}</td>
                      <td style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.75rem' }}>{user.batch || '—'}{user.semester ? ` · Sem ${user.semester}` : ''}{user.year ? ` · Yr ${user.year}` : ''}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p style={{ fontSize: '0.75rem', color: '#6b7280', textAlign: 'right' }}>{filteredUsers.length} user(s)</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DirectorDashboard;