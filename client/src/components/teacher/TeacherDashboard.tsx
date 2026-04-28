import { useState, useEffect } from 'react';
import { PlayCircle, Download, ShieldCheck, Square, Users, History, Zap } from 'lucide-react';

const TeacherDashboard = () => {
  const [timetables, setTimetables] = useState<any[]>([]);
  const [timetableId, setTimetableId] = useState('');
  const [activeTab, setActiveTab] = useState<"CLASS" | "HISTORY">("CLASS");
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [liveAttendance, setLiveAttendance] = useState<any[]>([]);
  const [message, setMessage] = useState('');
  const [history, setHistory] = useState<any[]>([]);
  const [filter, setFilter] = useState('');

  const user = JSON.parse(localStorage.getItem("qr_user") || "{}");
  const token = localStorage.getItem("qr_token") || "";

  useEffect(() => {
    const fetchTimetables = async () => {
      try {
        const res = await fetch(`http://localhost:5000/api/teacher/timetables?teacherId=${user.id}`, { 
          headers: { 'Authorization': `Bearer ${token}` } 
        });
        if (res.ok) { 
          const data = await res.json(); 
          setTimetables(data); 
          if (data.length > 0) setTimetableId(data[0].id); 
        }
      } catch (err) { console.error("Failed to load timetables", err); }
    };
    if (user.id) fetchTimetables();
  }, [user.id, token]);

  useEffect(() => {
    if (activeTab === 'HISTORY') {
      const fetchHistory = async () => {
        try {
          const res = await fetch(`http://localhost:5000/api/teacher/history`, { 
            headers: { 'Authorization': `Bearer ${token}` } 
          });
          if (res.ok) setHistory(await res.json());
        } catch (error) { console.error("Failed to fetch history", error); }
      };
      fetchHistory();
    }
  }, [activeTab, token]);

  useEffect(() => {
    let interval: any;
    if (!activeSessionId) return;
    fetchLiveAttendance();
    interval = setInterval(fetchLiveAttendance, 3000);
    return () => clearInterval(interval);
  }, [activeSessionId]);

  const fetchLiveAttendance = async () => {
    try {
      const res = await fetch(`http://localhost:5000/api/teacher/session/${activeSessionId}/live`, { 
        headers: { 'Authorization': `Bearer ${token}` } 
      });
      if (res.ok) setLiveAttendance(await res.json());
    } catch (err) { console.error("Failed to fetch live attendance", err); }
  };

  const handleStartSession = async () => {
    if (!timetableId) { setMessage("Please select a class."); return; }
    setMessage("Starting...");
    try {
      const res = await fetch("http://localhost:5000/api/teacher/session/start", {
        method: "POST", 
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ timetableId, teacherId: user.id })
      });
      const data = await res.json();
      if (res.ok) { setActiveSessionId(data.id); setMessage("✅ Class is LIVE!"); }
      else if (data.session) { setActiveSessionId(data.session.id); setMessage("✅ Resumed existing class."); }
      else { setMessage(`❌ ${data.message || 'Failed'}`); }
    } catch { setMessage("❌ Backend offline."); }
  };

  const handleStopSession = async () => {
    if (!activeSessionId) return;
    if (!window.confirm("Stop this class?")) return;
    try {
      const res = await fetch(`http://localhost:5000/api/teacher/session/${activeSessionId}/stop`, { 
        method: "POST", 
        headers: { 'Authorization': `Bearer ${token}` } 
      });
      if (res.ok) { setActiveSessionId(null); setLiveAttendance([]); setMessage("🛑 Class closed."); }
    } catch { setMessage("❌ Failed to stop."); }
  };

  const tabs = [
    { key: 'CLASS' as const, label: 'Active Class', icon: <Zap size={15} /> },
    { key: 'HISTORY' as const, label: 'Past Sessions', icon: <History size={15} /> },
  ];

  const filteredHistory = history.filter(s =>
    s.timetable?.subject?.name?.toLowerCase().includes(filter.toLowerCase()) ||
    s.timetable?.room?.name?.toLowerCase().includes(filter.toLowerCase()) ||
    s.timetable?.dayOfWeek?.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div style={{ maxWidth: '64rem', margin: '0 auto', padding: '2rem 1.5rem' }}>
      <div className="animate-slide-up" style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 800, letterSpacing: '-0.03em' }} className="gradient-text">Teacher Dashboard</h1>
        <p style={{ color: 'var(--text-secondary)', marginTop: '0.25rem' }}>Manage your classes and view attendance</p>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '2rem' }}>
        <div className="tab-bar animate-slide-up-delay-1">
          {tabs.map(tab => (
            <button 
              key={tab.key} 
              onClick={() => setActiveTab(tab.key)} 
              className={`tab-btn ${activeTab === tab.key ? 'active' : ''}`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'CLASS' && (
        <div className="animate-slide-up" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(20rem, 1fr))', gap: '1.5rem' }}>
          <div className="glass-card" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ 
              padding: '1rem', borderRadius: '0.875rem', 
              background: 'rgba(99, 102, 241, 0.05)', 
              border: '1px solid rgba(99, 102, 241, 0.1)', 
              display: 'flex', gap: '0.75rem', alignItems: 'flex-start' 
            }}>
              <ShieldCheck size={18} style={{ color: 'var(--accent-1)', marginTop: '0.125rem', flexShrink: 0 }} />
              <p style={{ fontSize: '0.8125rem', color: 'var(--accent-1)', fontWeight: 500 }}>Select your class and click Start. Students will scan the QR code to mark attendance.</p>
            </div>

            <div>
              <label className="label-premium">Select Class</label>
              <select value={timetableId} onChange={e => setTimetableId(e.target.value)} disabled={activeSessionId !== null} className="input-premium">
                <option value="" disabled>-- No classes found --</option>
                {timetables.map(t => (
                  <option key={t.id} value={t.id}>{t.dayOfWeek} · {t.startTime}-{t.endTime} · {t.subject?.name} ({t.room?.name})</option>
                ))}
              </select>
            </div>

            {!activeSessionId ? (
              <button onClick={handleStartSession} className="btn-primary" style={{ width: '100%', padding: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', fontSize: '0.9375rem' }}>
                <PlayCircle size={18} /> Start Session
              </button>
            ) : (
              <button onClick={handleStopSession} className="btn-danger" style={{ width: '100%', padding: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', fontSize: '0.9375rem' }}>
                <Square size={18} /> Stop Class & Lock
              </button>
            )}

            {message && (
              <div style={{ textAlign: 'center', fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', padding: '0.75rem', borderRadius: '0.75rem', background: 'var(--bg-primary)' }}>
                {message}
              </div>
            )}
          </div>

          <div className="glass-card" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', minHeight: '28rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border-glass)' }}>
              <Users size={20} style={{ color: 'var(--accent-1)' }} />
              <h2 style={{ fontSize: '1rem', fontWeight: 700, flex: 1 }}>Live Attendance</h2>
              {activeSessionId && (
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.6875rem', fontWeight: 700, color: '#059669', background: 'rgba(16, 185, 129, 0.08)', padding: '0.375rem 0.75rem', borderRadius: '9999px' }}>
                  <span className="live-dot" /> LIVE
                </span>
              )}
            </div>

            {!activeSessionId ? (
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', border: '2px dashed var(--border-glass)', borderRadius: '1rem', padding: '2rem', textAlign: 'center', fontSize: '0.875rem' }}>
                Start a session to see students here.
              </div>
            ) : liveAttendance.length === 0 ? (
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', border: '2px dashed var(--border-glass)', borderRadius: '1rem', padding: '2rem', textAlign: 'center', fontSize: '0.875rem' }}>
                Waiting for first scan...
              </div>
            ) : (
              <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {liveAttendance.map(record => (
                  <div key={record.id} style={{ padding: '0.875rem', borderRadius: '0.75rem', background: 'var(--bg-primary)', border: '1px solid var(--border-glass)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', animation: 'slideRight 0.3s ease' }}>
                    <div>
                      <p style={{ fontWeight: 600, fontSize: '0.875rem' }}>{record.student.name}</p>
                      <p style={{ fontSize: '0.6875rem', color: 'var(--text-secondary)' }}>{record.student.email}</p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span className="badge badge-purple">{record.student.batch || 'All'}</span>
                      <p style={{ fontSize: '0.625rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>{new Date(record.markedAt).toLocaleTimeString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'HISTORY' && (
        <div className="glass-card animate-slide-up" style={{ padding: '2rem', minHeight: '28rem' }}>
          <input type="text" value={filter} onChange={e => setFilter(e.target.value)} className="input-premium" placeholder="Search by subject, room, day..." style={{ marginBottom: '1.5rem' }} />
          {history.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)', border: '2px dashed var(--border-glass)', borderRadius: '1rem' }}>No past classes found.</div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(17rem, 1fr))', gap: '0.75rem' }}>
              {filteredHistory.map(session => (
                <div key={session.id} className="glass-card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <h3 style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{session.timetable?.subject?.name}</h3>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>Room: <span style={{ color: 'var(--text-primary)' }}>{session.timetable?.room?.name}</span></p>
                  </div>
                  <div style={{ marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-glass)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                    <div>
                      <p style={{ fontSize: '0.6875rem', color: 'var(--text-secondary)' }}>{new Date(session.startedAt).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</p>
                      <span className="badge badge-purple" style={{ marginTop: '0.375rem' }}>{session._count?.attendances} Attended</span>
                    </div>
                    <button onClick={() => window.open(`http://localhost:5000/api/teacher/export/session/${session.id}?token=${token}`, '_blank')} style={{ padding: '0.625rem', borderRadius: '0.625rem', background: 'rgba(16, 185, 129, 0.08)', color: '#059669', border: '1px solid rgba(16, 185, 129, 0.12)', cursor: 'pointer', transition: 'all 0.2s' }} title="Download Excel">
                      <Download size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TeacherDashboard;
