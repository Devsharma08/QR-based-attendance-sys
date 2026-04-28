import React, { useState, useEffect } from 'react';
import { Building, BookOpen, Calendar, CheckCircle, Trash2, Download, Pencil, LayoutGrid } from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';
import Select from 'react-select';

const selectLightStyles = {
  control: (base: any, state: any) => ({
    ...base, background: '#f8f9fc', borderColor: state.isFocused ? '#6366f1' : 'rgba(0,0,0,0.06)',
    borderRadius: '0.875rem', padding: '0.25rem 0.25rem', boxShadow: state.isFocused ? '0 0 0 3px rgba(99,102,241,0.08)' : 'none',
    '&:hover': { borderColor: 'rgba(99,102,241,0.3)' }, minHeight: '2.75rem',
  }),
  menu: (base: any) => ({ ...base, background: 'white', border: '1px solid rgba(0,0,0,0.06)', borderRadius: '0.75rem', overflow: 'hidden', boxShadow: '0 8px 32px rgba(0,0,0,0.08)' }),
  option: (base: any, state: any) => ({
    ...base, background: state.isFocused ? 'rgba(99,102,241,0.06)' : 'transparent',
    color: '#1e1e2e', fontSize: '0.8125rem', cursor: 'pointer', '&:active': { background: 'rgba(99,102,241,0.1)' },
  }),
  singleValue: (base: any) => ({ ...base, color: '#1e1e2e', fontSize: '0.8125rem' }),
  input: (base: any) => ({ ...base, color: '#1e1e2e', fontSize: '0.8125rem' }),
  placeholder: (base: any) => ({ ...base, color: '#9ca3af', fontSize: '0.8125rem' }),
  indicatorSeparator: () => ({ display: 'none' }),
  dropdownIndicator: (base: any) => ({ ...base, color: '#6b7280', '&:hover': { color: '#1e1e2e' } }),
};

const HodDashboard = () => {
  const [activeTab, setActiveTab] = useState<'ROOM' | 'SUBJECT' | 'TIMETABLE' | 'MASTER_TIMETABLE'>('MASTER_TIMETABLE');
  const [statusMsg, setStatusMsg] = useState('');
  const [timeTable, setTimeTable] = useState<any[]>([]);
  const [isEditSubject, setIsEditSubject] = useState(false);
  const [editSubjectId, setEditSubjectId] = useState<string | null>(null);
  const [searchTimetable, setSearchTimetable] = useState('');
  const [teachers, setTeachers] = useState<any[]>([]);
  const [rooms, setRooms] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);

  const token = localStorage.getItem('qr_token') || '';
  const user = JSON.parse(localStorage.getItem('qr_user') || '{}');
  const departmentId = user.departmentId || '';
  const query = `?departmentId=${departmentId}`;
  const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };

  const handleDelete = async (t: any) => {
    if (!window.confirm("Delete this schedule?")) return;
    try {
      const res = await fetch(`http://localhost:5000/api/hod/timetable${query}`, {
        method: 'DELETE', headers,
        body: JSON.stringify({ subjectId: t.subjectId, teacherId: t.teacherId, roomId: t.roomId, dayOfWeek: t.dayOfWeek, startTime: t.startTime, endTime: t.endTime, batch: t.batch || null })
      });
      if (res.ok) { setStatusMsg("Schedule deleted"); setTimeTable(timeTable.filter(i => i.id !== t.id)); }
      else { const d = await res.json(); setStatusMsg(`Error: ${d.message || d.error}`); }
    } catch { setStatusMsg("Error: Failed to delete"); }
  };

  const handleDownloadQr = (roomId: string, roomName: string) => {
    const canvas = document.getElementById(`qr-${roomId}`) as HTMLCanvasElement;
    const url = canvas.toDataURL("image/jpeg", 0.92);
    const link = document.createElement("a"); link.download = `${roomName}.jpeg`; link.href = url;
    document.body.appendChild(link); link.click(); document.body.removeChild(link);
  };

  const handleDeleteRoom = async (roomId: string, deptId: string) => {
    if (!window.confirm("Delete this room?")) return;
    try {
      const res = await fetch(`http://localhost:5000/api/hod/rooms/${roomId}?departmentId=${deptId}`, { method: 'DELETE', headers });
      if (res.ok) { setStatusMsg("Room deleted"); setRooms(rooms.filter(r => r.id !== roomId)); }
      else { const d = await res.json(); setStatusMsg(`Error: ${d.message || d.error}`); }
    } catch { setStatusMsg("Error: Failed to delete room"); }
  };

  const handleDeleteSubject = async (subjectId: string, deptId: string) => {
    if (!window.confirm("Delete this subject?")) return;
    try {
      const res = await fetch(`http://localhost:5000/api/hod/subjects/${subjectId}?departmentId=${deptId}`, { method: 'DELETE', headers });
      if (res.ok) { setStatusMsg("Subject deleted"); setSubjects(subjects.filter(s => s.id !== subjectId)); }
      else { const d = await res.json(); setStatusMsg(`Error: ${d.message || d.error}`); }
    } catch { setStatusMsg("Error: Failed to delete subject"); }
  };

  const handleEditSubject = (subject: any) => {
    setIsEditSubject(true); setEditSubjectId(subject.id);
    Object.entries(subject).forEach(([key, value]: [string, any]) => {
      if (key === 'name' || key === 'code') (document.getElementById(key) as HTMLInputElement).value = value;
    });
  };

  useEffect(() => {
    const fetchData = async () => {
      const [teachersRes, roomsRes, subjectsRes, timeTableRes] = await Promise.all([
        fetch(`http://localhost:5000/api/hod/teachers${query}`, { headers }),
        fetch(`http://localhost:5000/api/hod/rooms${query}`, { headers }),
        fetch(`http://localhost:5000/api/hod/subjects${query}`, { headers }),
        fetch(`http://localhost:5000/api/hod/timetable${query}`, { headers })
      ]);
      if (teachersRes.ok) setTeachers(await teachersRes.json());
      if (roomsRes.ok) setRooms(await roomsRes.json());
      if (subjectsRes.ok) setSubjects(await subjectsRes.json());
      if (timeTableRes.ok) setTimeTable(await timeTableRes.json());
    };
    fetchData();
  }, []);

  const handleSubmit = async (e: React.FormEvent, endpoint: string) => {
    e.preventDefault(); setStatusMsg("Saving...");
    const formData = new FormData(e.target as HTMLFormElement);
    const payload = Object.fromEntries(formData.entries());
    let method = 'POST';
    if (isEditSubject) { method = 'PATCH'; payload.id = editSubjectId; }
    try {
      const res = await fetch(`http://localhost:5000/api/hod/${endpoint}?departmentId=${departmentId}`, { method, headers, body: JSON.stringify(payload) });
      if (res.ok) {
        setStatusMsg(`✓ Saved ${endpoint}`);
        (e.target as HTMLFormElement).reset();
        if (endpoint === "rooms") { const r = await fetch(`http://localhost:5000/api/hod/rooms${query}`, { headers }); if (r.ok) setRooms(await r.json()); }
        else if (endpoint === "subjects") { const r = await fetch(`http://localhost:5000/api/hod/subjects${query}`, { headers }); if (r.ok) setSubjects(await r.json()); setIsEditSubject(false); setEditSubjectId(null); }
        else if (endpoint === "timetable") { const r = await fetch(`http://localhost:5000/api/hod/timetable${query}`, { headers }); if (r.ok) setTimeTable(await r.json()); }
      } else { const d = await res.json(); setStatusMsg(`Error: ${d.message || d.error}`); }
    } catch { setStatusMsg("Backend server is offline."); }
  };

  const tabs = [
    { key: 'MASTER_TIMETABLE' as const, label: 'Schedule', icon: <LayoutGrid size={15} /> },
    { key: 'ROOM' as const, label: 'Rooms', icon: <Building size={15} /> },
    { key: 'SUBJECT' as const, label: 'Subjects', icon: <BookOpen size={15} /> },
    { key: 'TIMETABLE' as const, label: 'New Entry', icon: <Calendar size={15} /> },
  ];

  const filteredTimetable = timeTable.filter(t =>
    t.subject?.name?.toLowerCase().includes(searchTimetable.toLowerCase()) ||
    t.teacher?.name?.toLowerCase().includes(searchTimetable.toLowerCase()) ||
    t.room?.name?.toLowerCase().includes(searchTimetable.toLowerCase()) ||
    t.dayOfWeek?.toLowerCase().includes(searchTimetable.toLowerCase())
  );

  return (
    <div style={{ maxWidth: '56rem', margin: '0 auto', padding: '2rem 1.5rem' }}>
      <div className="animate-slide-up">
        <h1 style={{ fontSize: '2rem', fontWeight: 800, letterSpacing: '-0.03em' }} className="gradient-text">HOD Control Center</h1>
        <p style={{ color: '#6b7280', marginTop: '0.25rem' }}>Manage campus infrastructure and active schedules.</p>
      </div>

      <div className="tab-bar animate-slide-up-delay-1" style={{ marginTop: '1.5rem', marginBottom: '1.5rem' }}>
        {tabs.map(tab => (
          <button key={tab.key} onClick={() => { setActiveTab(tab.key); setStatusMsg(''); }} className={`tab-btn ${activeTab === tab.key ? 'active' : ''}`}>{tab.icon} {tab.label}</button>
        ))}
      </div>

      {/* MASTER TIMETABLE */}
      {activeTab === 'MASTER_TIMETABLE' && (
        <div className="animate-slide-up">
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#1e1e2e' }}>Master Schedule</h3>
            <input type="text" placeholder="Search..." value={searchTimetable} onChange={e => setSearchTimetable(e.target.value)} className="input-premium" style={{ maxWidth: '20rem' }} />
          </div>
          {timeTable.length === 0 ? (
            <div className="glass-card" style={{ textAlign: 'center', padding: '3rem', color: '#6b7280' }}>No schedules created yet.</div>
          ) : (
            <div className="glass-card" style={{ overflow: 'hidden' }}>
              <table className="table-premium">
                <thead><tr><th>Day</th><th>Time</th><th>Subject</th><th>Teacher</th><th>Room</th><th>Batch</th><th style={{ textAlign: 'right' }}>Action</th></tr></thead>
                <tbody>
                  {filteredTimetable.map((t, idx) => (
                    <tr key={idx}>
                      <td style={{ fontWeight: 600, color: '#1e1e2e' }}>{t.dayOfWeek}</td>
                      <td style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.75rem' }}>{t.startTime} - {t.endTime}</td>
                      <td><span style={{ fontWeight: 600, color: '#6366f1' }}>{t.subject?.code}</span><br /><span style={{ fontSize: '0.6875rem', color: '#6b7280' }}>{t.subject?.name}</span></td>
                      <td>{t.teacher?.name}</td>
                      <td style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.8125rem' }}>{t.room?.name}</td>
                      <td>{t.batch ? <span className="badge badge-blue">{t.batch}</span> : <span style={{ color: '#9ca3af', fontSize: '0.75rem' }}>All</span>}</td>
                      <td style={{ textAlign: 'right' }}><button onClick={() => handleDelete(t)} className="btn-danger" style={{ padding: '0.375rem 0.75rem', fontSize: '0.75rem' }}><Trash2 size={13} /></button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ROOM */}
      {activeTab === 'ROOM' && (
        <div className="animate-slide-up" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="glass-card" style={{ padding: '1.5rem' }}>
            <form onSubmit={e => handleSubmit(e, 'rooms')} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#1e1e2e', marginBottom: '0.5rem' }}>Register a Room</h3>
              <div><label className="label-premium">Room Name</label><input name="name" required className="input-premium" placeholder="e.g. L201" /></div>
              <div><label className="label-premium">Capacity</label><input name="capacity" type="number" required defaultValue={60} className="input-premium" /></div>
              <div><label className="label-premium">Static QR Payload</label><input name="qrPayload" required className="input-premium" placeholder="e.g. secret-room-code-123" /></div>
              <button type="submit" className="btn-primary" style={{ width: '100%' }}>Create Room</button>
            </form>
          </div>
          <div>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#1e1e2e', marginBottom: '1rem' }}>Existing Rooms & QR Codes</h3>
            {rooms.length === 0 ? (
              <div className="glass-card" style={{ textAlign: 'center', padding: '3rem', color: '#6b7280' }}>No rooms registered yet.</div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(16rem, 1fr))', gap: '0.75rem' }}>
                {rooms.map((r, i) => (
                  <div key={i} className="glass-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '1rem' }}>
                    <div style={{ padding: '1rem', background: 'white', borderRadius: '0.75rem', border: '1px solid rgba(0,0,0,0.04)' }}>
                      <QRCodeCanvas id={`qr-${r.id}`} value={String(r.qrPayload)} size={120} fgColor="#1e1e2e" bgColor="transparent" />
                    </div>
                    <div>
                      <h4 style={{ fontWeight: 700, fontSize: '1.25rem', color: '#1e1e2e' }}>{r.name}</h4>
                      <p style={{ fontSize: '0.75rem', color: '#6b7280' }}>Capacity: {r.capacity}</p>
                      <p style={{ fontSize: '0.6875rem', fontFamily: "'JetBrains Mono', monospace", color: '#6b7280', background: '#f1f5f9', padding: '0.25rem 0.5rem', borderRadius: '0.375rem', marginTop: '0.5rem' }}>{r.qrPayload}</p>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', width: '100%' }}>
                      <button onClick={() => handleDownloadQr(r.id, r.name)} className="btn-primary" style={{ flex: 1, padding: '0.5rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.375rem' }}><Download size={13} /> Download</button>
                      <button onClick={() => handleDeleteRoom(r.id, r.departmentId)} className="btn-danger" style={{ flex: 1, padding: '0.5rem', fontSize: '0.75rem' }}>Delete</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* SUBJECT */}
      {activeTab === 'SUBJECT' && (
        <div className="animate-slide-up" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="glass-card" style={{ padding: '1.5rem' }}>
            <form onSubmit={e => handleSubmit(e, 'subjects')} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#1e1e2e' }}>Register a Course</h3>
              <div><label className="label-premium">Course Code</label><input name="code" id="code" required className="input-premium" placeholder="e.g. TCS-601" /></div>
              <div><label className="label-premium">Course Name</label><input name="name" id="name" required className="input-premium" placeholder="e.g. Data Structures" /></div>
              <button type="submit" className="btn-primary" style={{ width: '100%' }}>{isEditSubject ? 'Update Subject' : 'Create Subject'}</button>
            </form>
          </div>
          <div>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#1e1e2e', marginBottom: '1rem' }}>Existing Subjects</h3>
            {subjects.length === 0 ? (
              <div className="glass-card" style={{ textAlign: 'center', padding: '3rem', color: '#6b7280' }}>No subjects registered yet.</div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(18rem, 1fr))', gap: '0.75rem' }}>
                {subjects.map((sub: any) => (
                  <div key={sub.id} className="glass-card" style={{ padding: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div><h4 style={{ fontWeight: 700, color: '#6366f1' }}>{sub.code}</h4><p style={{ fontSize: '0.8125rem', color: '#6b7280' }}>{sub.name}</p></div>
                    <div style={{ display: 'flex', gap: '0.375rem' }}>
                      <button onClick={() => handleEditSubject(sub)} className="btn-ghost" style={{ padding: '0.375rem 0.625rem', fontSize: '0.75rem' }}><Pencil size={13} /></button>
                      <button onClick={() => handleDeleteSubject(sub.id, sub.departmentId)} className="btn-danger" style={{ padding: '0.375rem 0.625rem', fontSize: '0.75rem' }}><Trash2 size={13} /></button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TIMETABLE FORM */}
      {activeTab === 'TIMETABLE' && (
        <div className="glass-card animate-slide-up" style={{ padding: '1.5rem' }}>
          <form onSubmit={e => handleSubmit(e, 'timetable')} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#1e1e2e', gridColumn: 'span 2', marginBottom: '0.5rem' }}>Link Data into Schedule</h3>
            <div><label className="label-premium">Day of Week</label><select name="dayOfWeek" className="input-premium">{['MONDAY','TUESDAY','WEDNESDAY','THURSDAY','FRIDAY','SATURDAY'].map(d => <option key={d} value={d}>{d.charAt(0) + d.slice(1).toLowerCase()}</option>)}</select></div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
              <div><label className="label-premium">Start</label><input name="startTime" type="time" required className="input-premium" /></div>
              <div><label className="label-premium">End</label><input name="endTime" type="time" required className="input-premium" /></div>
            </div>
            <div style={{ gridColumn: 'span 2' }}><label className="label-premium">Teacher</label><Select name="teacherId" options={teachers.map(t => ({ value: t.id, label: `${t.name} (${t.email})` }))} placeholder="Search teacher..." styles={selectLightStyles} required /></div>
            <div><label className="label-premium">Subject</label><Select name="subjectId" options={subjects.map((s: any) => ({ value: s.id, label: `${s.name} (${s.code})` }))} placeholder="Search..." styles={selectLightStyles} required /></div>
            <div><label className="label-premium">Room</label><Select name="roomId" options={rooms.map(r => ({ value: r.id, label: `${r.name} (Cap: ${r.capacity})` }))} placeholder="Search..." styles={selectLightStyles} required /></div>
            <div style={{ gridColumn: 'span 2' }}><label className="label-premium">Batch (Optional)</label><select name="batch" className="input-premium"><option value="">Entire Class</option><option value="Group-1">Group-1</option><option value="Group-2">Group-2</option></select></div>
            <button type="submit" className="btn-primary" style={{ gridColumn: 'span 2', marginTop: '0.5rem' }}>Publish to Timetable</button>
          </form>
        </div>
      )}

      {statusMsg && (
        <div style={{ marginTop: '1rem', padding: '0.875rem 1.25rem', borderRadius: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8125rem', fontWeight: 600,
          background: statusMsg.startsWith('Error') ? 'rgba(239,68,68,0.06)' : 'rgba(99,102,241,0.06)',
          color: statusMsg.startsWith('Error') ? '#dc2626' : '#6366f1',
          border: `1px solid ${statusMsg.startsWith('Error') ? 'rgba(239,68,68,0.1)' : 'rgba(99,102,241,0.1)'}` }}>
          <CheckCircle size={16} /> {statusMsg}
        </div>
      )}
    </div>
  );
};

export default HodDashboard;
