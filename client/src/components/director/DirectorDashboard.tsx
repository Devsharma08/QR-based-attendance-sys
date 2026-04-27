import React, { useState, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Legend,
  LineChart, Line,
} from 'recharts';
import {
  Building2, Users, BookOpen, LayoutGrid, Activity, TrendingUp,
  Plus, Pencil, Trash2, X, CheckCircle, AlertTriangle, School,
  BarChart2, List
} from 'lucide-react';

const API = 'http://localhost:5000/api/director';

const DirectorDashboard = () => {
  const token = localStorage.getItem('qr_token') || '';
  const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };

  // ── State ──────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'ANALYTICS' | 'DEPARTMENTS' | 'USERS'>('OVERVIEW');
  const [overview, setOverview] = useState<any>(null);
  const [analytics, setAnalytics] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [userFilter, setUserFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState('');

  // Department form state
  const [deptModalOpen, setDeptModalOpen] = useState(false);
  const [editingDept, setEditingDept] = useState<any>(null);
  const [deptName, setDeptName] = useState('');
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  // ── Helpers ──────────────────────────────────────────────
  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  // ── Fetchers ──────────────────────────────────────────────
  const fetchOverview = async () => {
    const res = await fetch(`${API}/overview`, { headers });
    if (res.ok) setOverview(await res.json());
  };

  const fetchAnalytics = async () => {
    const res = await fetch(`${API}/analytics`, { headers });
    if (res.ok) setAnalytics(await res.json());
  };

  const fetchDepartments = async () => {
    const res = await fetch(`${API}/departments`, { headers });
    if (res.ok) setDepartments(await res.json());
  };

  const fetchUsers = async () => {
    const res = await fetch(`${API}/users`, { headers });
    if (res.ok) setUsers(await res.json());
  };

  useEffect(() => {
    fetchOverview();
    fetchAnalytics();
    fetchDepartments();
    fetchUsers();
  }, []);

  // ── Department CRUD ──────────────────────────────────────────────
  const openCreate = () => { setEditingDept(null); setDeptName(''); setDeptModalOpen(true); };
  const openEdit = (dept: any) => { setEditingDept(dept); setDeptName(dept.name); setDeptModalOpen(true); };

  const handleSaveDept = async () => {
    if (!deptName.trim()) return showToast('Department name cannot be empty', 'error');
    try {
      let res;
      if (editingDept) {
        res = await fetch(`${API}/departments/${editingDept.id}`, {
          method: 'PATCH', headers, body: JSON.stringify({ name: deptName })
        });
      } else {
        res = await fetch(`${API}/departments`, {
          method: 'POST', headers, body: JSON.stringify({ name: deptName })
        });
      }
      const data = await res.json();
      if (!res.ok) return showToast(data.message || 'Failed', 'error');
      showToast(editingDept ? 'Department updated!' : 'Department created!');
      setDeptModalOpen(false);
      fetchDepartments();
      fetchAnalytics();
    } catch { showToast('Server error', 'error'); }
  };

  const handleDeleteDept = async (dept: any) => {
    if (!window.confirm(`Delete "${dept.name}"? This cannot be undone if it has no linked data.`)) return;
    try {
      const res = await fetch(`${API}/departments/${dept.id}`, { method: 'DELETE', headers });
      const data = await res.json();
      if (!res.ok) return showToast(data.message || 'Failed', 'error');
      showToast('Department deleted.');
      fetchDepartments();
      fetchAnalytics();
    } catch { showToast('Server error', 'error'); }
  };

  // ── Filtered users ──────────────────────────────────────────────
  const filteredUsers = users.filter(u => {
    const matchText = !userFilter || u.name.toLowerCase().includes(userFilter.toLowerCase()) || u.email.toLowerCase().includes(userFilter.toLowerCase());
    const matchRole = !roleFilter || u.role === roleFilter;
    return matchText && matchRole;
  });

  // ── Radar chart data (normalize to 0–100) ──────────────────────────────────────────────
  const maxStudents = Math.max(...analytics.map(a => a.studentCount), 1);
  const maxTeachers = Math.max(...analytics.map(a => a.teacherCount), 1);
  const maxSessions = Math.max(...analytics.map(a => a.sessionCount), 1);
  const maxSubjects = Math.max(...analytics.map(a => a.subjectCount), 1);

  const radarData = analytics.map(a => ({
    dept: a.name.split(' ')[0], // First word to keep label short
    Attendance: a.attendanceRate,
    Students: Math.round((a.studentCount / maxStudents) * 100),
    Teachers: Math.round((a.teacherCount / maxTeachers) * 100),
    Sessions: Math.round((a.sessionCount / maxSessions) * 100),
    Subjects: Math.round((a.subjectCount / maxSubjects) * 100),
  }));

  const COLORS = ['#6366f1', '#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#a855f7', '#ec4899'];

  // ── Render ──────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-4 rounded-2xl shadow-xl text-white font-medium animate-in fade-in slide-in-from-top-4 ${toast.type === 'success' ? 'bg-green-600' : 'bg-red-500'}`}>
          {toast.type === 'success' ? <CheckCircle size={20} /> : <AlertTriangle size={20} />}
          {toast.msg}
        </div>
      )}

      {/* Department Modal */}
      {deptModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 flex items-center justify-center">
          <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-md animate-in fade-in zoom-in-95">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-slate-800">{editingDept ? 'Edit Department' : 'New Department'}</h2>
              <button onClick={() => setDeptModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-xl transition-colors"><X size={20} /></button>
            </div>
            <label className="block text-sm font-semibold text-gray-600 mb-2">Department Name</label>
            <input
              value={deptName}
              onChange={e => setDeptName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSaveDept()}
              placeholder="e.g. Computer Science & Engineering"
              className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-400 text-slate-800 font-medium"
            />
            <div className="flex gap-3 mt-6">
              <button onClick={() => setDeptModalOpen(false)} className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-colors">Cancel</button>
              <button onClick={handleSaveDept} className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-colors">
                {editingDept ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto p-6 space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-cyan-500">
              Director's Command Center
            </h1>
            <p className="text-gray-500 mt-1 text-lg">Campus-wide analytics & department management</p>
          </div>
          {activeTab === 'DEPARTMENTS' && (
            <button onClick={openCreate} className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200">
              <Plus size={20} /> New Department
            </button>
          )}
        </div>

        {/* Tab Nav */}
        <div className="flex gap-2 p-1 bg-white border border-slate-100 rounded-2xl shadow-sm w-fit">
          {([
            { key: 'OVERVIEW', label: 'Overview', icon: <Activity size={17} /> },
            { key: 'ANALYTICS', label: 'Analytics', icon: <BarChart2 size={17} /> },
            { key: 'DEPARTMENTS', label: 'Departments', icon: <Building2 size={17} /> },
            { key: 'USERS', label: 'All Users', icon: <List size={17} /> },
          ] as const).map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all ${activeTab === tab.key ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-50'}`}>
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {/* ── OVERVIEW TAB ── */}
        {activeTab === 'OVERVIEW' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
            {/* KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {[
                { label: 'Departments', value: overview?.totalDepts ?? '—', icon: <Building2 size={22} />, color: 'indigo' },
                { label: 'Students', value: overview?.totalStudents ?? '—', icon: <Users size={22} />, color: 'sky' },
                { label: 'Teachers', value: overview?.totalTeachers ?? '—', icon: <School size={22} />, color: 'emerald' },
                { label: 'Total Sessions', value: overview?.totalSessions ?? '—', icon: <LayoutGrid size={22} />, color: 'amber' },
                { label: 'Attendances Logged', value: overview?.totalAttendances ?? '—', icon: <CheckCircle size={22} />, color: 'violet' },
                { label: 'Live Now', value: overview?.activeSessions ?? '—', icon: <Activity size={22} />, color: 'rose' },
              ].map((card, i) => (
                <div key={i} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col gap-3 hover:shadow-md transition-shadow">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center bg-${card.color}-50 text-${card.color}-600`}>{card.icon}</div>
                  <div>
                    <p className="text-2xl font-extrabold text-slate-800">{card.value}</p>
                    <p className="text-xs text-slate-500 font-medium mt-0.5">{card.label}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Attendance Rate Bar Chart */}
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
              <h3 className="text-lg font-bold text-slate-800 mb-1">Department-wise Attendance Rate (%)</h3>
              <p className="text-sm text-slate-400 mb-6">Based on closed sessions vs actual attendances</p>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analytics} margin={{ top: 5, right: 20, left: 0, bottom: 30 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} angle={-20} textAnchor="end" />
                    <YAxis domain={[0, 100]} tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} unit="%" />
                    <Tooltip
                      formatter={(v: any) => [`${v}%`, 'Attendance Rate']}
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
                    />
                    <Bar dataKey="attendanceRate" radius={[8, 8, 0, 0]} fill="#6366f1" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Student Count comparison */}
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
              <h3 className="text-lg font-bold text-slate-800 mb-6">Student Distribution by Department</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analytics} layout="vertical" margin={{ left: 20, right: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                    <XAxis type="number" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
                    <YAxis type="category" dataKey="name" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} width={140} />
                    <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
                    <Bar dataKey="studentCount" radius={[0, 8, 8, 0]} fill="#0ea5e9" name="Students" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* ── ANALYTICS TAB ── */}
        {activeTab === 'ANALYTICS' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">

            {/* Head-to-Head Radar */}
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
              <h3 className="text-lg font-bold text-slate-800 mb-1">Head-to-Head Comparison (Radar)</h3>
              <p className="text-sm text-slate-400 mb-6">All metrics normalized to 100 for fair cross-department comparison</p>
              <div className="h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="#e2e8f0" />
                    <PolarAngleAxis dataKey="dept" tick={{ fill: '#475569', fontSize: 13, fontWeight: 600 }} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: '#94a3b8', fontSize: 10 }} />
                    {analytics.map((dept, i) => (
                      <Radar key={dept.id} name={dept.name} dataKey={radarData[i] ? Object.keys(radarData[i])[1] : ''} stroke={COLORS[i % COLORS.length]} fill={COLORS[i % COLORS.length]} fillOpacity={0.15} />
                    ))}
                    <Legend wrapperStyle={{ fontSize: 13 }} />
                    <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Multi-metric bar chart */}
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
              <h3 className="text-lg font-bold text-slate-800 mb-6">Teachers vs Students per Department</h3>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analytics} margin={{ top: 5, right: 20, left: 0, bottom: 30 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} angle={-20} textAnchor="end" />
                    <YAxis tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
                    <Legend wrapperStyle={{ fontSize: 13, paddingTop: 16 }} />
                    <Bar dataKey="studentCount" name="Students" radius={[6, 6, 0, 0]} fill="#6366f1" />
                    <Bar dataKey="teacherCount" name="Teachers" radius={[6, 6, 0, 0]} fill="#0ea5e9" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Scorecards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {analytics.map((dept, i) => (
                <div key={dept.id} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-4">
                    <h4 className="font-bold text-slate-800 text-base leading-tight">{dept.name}</h4>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${dept.attendanceRate >= 75 ? 'bg-green-100 text-green-700' : dept.attendanceRate >= 50 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
                      {dept.attendanceRate}% att.
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 mb-5">
                    <div className="h-2 rounded-full bg-gradient-to-r from-indigo-500 to-cyan-400 transition-all" style={{ width: `${dept.attendanceRate}%` }} />
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    {[
                      { label: 'Students', value: dept.studentCount },
                      { label: 'Teachers', value: dept.teacherCount },
                      { label: 'Subjects', value: dept.subjectCount },
                      { label: 'Rooms', value: dept.roomCount },
                      { label: 'Sessions', value: dept.sessionCount },
                      { label: 'T:S Ratio', value: dept.teacherStudentRatio },
                    ].map((stat, j) => (
                      <div key={j} className="bg-slate-50 rounded-xl p-3 flex flex-col">
                        <span className="text-xs text-slate-500 font-medium">{stat.label}</span>
                        <span className="text-lg font-extrabold text-slate-800 mt-0.5">{stat.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── DEPARTMENTS TAB ── */}
        {activeTab === 'DEPARTMENTS' && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
            {departments.length === 0 ? (
              <div className="text-center py-16 text-slate-400 bg-white rounded-3xl border border-dashed border-slate-200">
                No departments yet. Click "New Department" to create one!
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {departments.map((dept) => (
                  <div key={dept.id} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5 flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center shrink-0">
                          <Building2 size={20} className="text-indigo-600" />
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => openEdit(dept)} className="p-2 hover:bg-blue-50 text-blue-500 rounded-lg transition-colors" title="Edit"><Pencil size={16} /></button>
                          <button onClick={() => handleDeleteDept(dept)} className="p-2 hover:bg-red-50 text-red-500 rounded-lg transition-colors" title="Delete"><Trash2 size={16} /></button>
                        </div>
                      </div>
                      <h3 className="font-bold text-slate-800 text-lg mt-4 leading-tight">{dept.name}</h3>
                    </div>
                    <div className="grid grid-cols-3 gap-3 mt-6 pt-4 border-t border-slate-100 text-center text-sm">
                      <div>
                        <p className="text-xl font-extrabold text-indigo-600">{dept._count?.users ?? 0}</p>
                        <p className="text-xs text-slate-500 mt-0.5">Users</p>
                      </div>
                      <div>
                        <p className="text-xl font-extrabold text-sky-500">{dept._count?.subjects ?? 0}</p>
                        <p className="text-xs text-slate-500 mt-0.5">Subjects</p>
                      </div>
                      <div>
                        <p className="text-xl font-extrabold text-emerald-500">{dept._count?.rooms ?? 0}</p>
                        <p className="text-xs text-slate-500 mt-0.5">Rooms</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── USERS TAB ── */}
        {activeTab === 'USERS' && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                value={userFilter}
                onChange={e => setUserFilter(e.target.value)}
                placeholder="Search by name or email..."
                className="flex-1 p-3 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-300 text-sm font-medium"
              />
              <select
                value={roleFilter}
                onChange={e => setRoleFilter(e.target.value)}
                className="p-3 bg-white border border-slate-200 rounded-xl outline-none text-sm font-medium focus:ring-2 focus:ring-indigo-300 min-w-[160px]"
              >
                <option value="">All Roles</option>
                <option value="STUDENT">Students</option>
                <option value="TEACHER">Teachers</option>
                <option value="HOD">HODs</option>
                <option value="DIRECTOR">Directors</option>
              </select>
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-100">
                  <tr>
                    {['Name', 'Email', 'Role', 'Department', 'Batch / Sem'].map(h => (
                      <th key={h} className="px-5 py-4 text-left font-semibold text-slate-600 text-xs uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.length === 0 ? (
                    <tr><td colSpan={5} className="px-5 py-12 text-center text-slate-400">No users found.</td></tr>
                  ) : filteredUsers.map((user) => (
                    <tr key={user.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                      <td className="px-5 py-4 font-semibold text-slate-800">{user.name}</td>
                      <td className="px-5 py-4 text-slate-500">{user.email}</td>
                      <td className="px-5 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                          user.role === 'STUDENT' ? 'bg-sky-100 text-sky-700' :
                          user.role === 'TEACHER' ? 'bg-indigo-100 text-indigo-700' :
                          user.role === 'HOD' ? 'bg-amber-100 text-amber-700' :
                          'bg-rose-100 text-rose-700'
                        }`}>{user.role}</span>
                      </td>
                      <td className="px-5 py-4 text-slate-600">{user.department?.name || '—'}</td>
                      <td className="px-5 py-4 text-slate-500">
                        {user.batch ? `${user.batch}` : '—'}
                        {user.semester ? ` • Sem ${user.semester}` : ''}
                        {user.year ? ` • Yr ${user.year}` : ''}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-slate-400 text-right">{filteredUsers.length} user(s) shown</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DirectorDashboard;