import React, { useState, useEffect } from 'react';
import { PlayCircle, Download, ShieldCheck, Square, Users } from 'lucide-react';

const TeacherDashboard = () => {
  const [timetables, setTimetables] = useState<any[]>([]);
  const [timetableId, setTimetableId] = useState('');
  
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [liveAttendance, setLiveAttendance] = useState<any[]>([]);
  const [message, setMessage] = useState('');

  // user info & token
  const user = JSON.parse(localStorage.getItem("qr_user") || "{}");
  const token = localStorage.getItem("qr_token") || "";

  // Fetch Teacher's Timetables 
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
      } catch (err) {
        console.error("Failed to load timetables", err);
      }
    };
    if (user.id) fetchTimetables();
  }, []);

  // Poll Live Attendance when a session is active - can we use socket io instead?
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
      if (res.ok) {
        setLiveAttendance(await res.json());
      }
    } catch (err) {
      console.error("Failed to fetch live attendance", err);
    }
  };

  // Start Session
  const handleStartSession = async () => {
    if (!timetableId) {
      setMessage("Please select a class schedule.");
      return;
    }
    
    setMessage("Starting session...");
    try {
      const res = await fetch("http://localhost:5000/api/teacher/session/start", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}` 
        },
        body: JSON.stringify({ timetableId, teacherId: user.id })
      });
      
      const data = await res.json();
      if (res.ok) {
        setActiveSessionId(data.id);
        setMessage("✅ Class is LIVE! Students can now scan the QR code.");
      } else if (data.session) {
        setActiveSessionId(data.session.id);
        setMessage("✅ Resumed existing active class.");
      } else {
        setMessage(`❌ Error: ${data.message || 'Failed to start'}`);
      }
    } catch (err) {
      setMessage("❌ Backend is offline. Cannot start class.");
    }
  };

  // Stop Session
  const handleStopSession = async () => {
    if (!activeSessionId) return;
    if (!window.confirm("Are you sure you want to stop this class? Students will no longer be able to scan.")) return;

    try {
      const res = await fetch(`http://localhost:5000/api/teacher/session/${activeSessionId}/stop`, {
        method: "POST",
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setActiveSessionId(null);
        setLiveAttendance([]);
        setMessage("🛑 Class has been closed successfully.");
      }
    } catch (err) {
      setMessage("❌ Failed to stop class.");
    }
  };

  // 5. Download Excel
  const handleExport = () => {
    if (!activeSessionId) return;
    window.open(`http://localhost:5000/api/student/export/session/${activeSessionId}?token=${token}`, '_blank');
  };

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-8 mt-10">
      
      <div className="text-center">
        <h1 className="text-4xl font-extrabold text-slate-800">Professor Portal</h1>
        <p className="text-gray-500 mt-2">Manage your active class and watch live attendance.</p>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        
        {/* Left Col: Control Panel */}
        <div className="bg-white p-8 rounded-3xl shadow-xl border border-slate-100 flex flex-col gap-6 h-fit">
          <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 flex items-start gap-3">
             <ShieldCheck className="text-blue-500 shrink-0 mt-1" />
             <p className="text-sm text-blue-800">
               Select your class below and click Start. The live feed will appear as students scan the QR code.
             </p>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Select Class</label>
            <select 
              value={timetableId} 
              onChange={(e) => setTimetableId(e.target.value)}
              disabled={activeSessionId !== null}
              className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all font-medium"
            >
              <option value="" disabled>-- No classes found --</option>
              {timetables.map(t => (
                <option key={t.id} value={t.id}>
                  {t.dayOfWeek} • {t.startTime}-{t.endTime} • {t.subject?.name} ({t.room?.name})
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-4 pt-2">
            {!activeSessionId ? (
              <button 
                onClick={handleStartSession}
                className="w-full flex items-center justify-center gap-2 py-4 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-colors"
              >
                <PlayCircle size={20} /> Start Session
              </button>
            ) : (
              <button 
                onClick={handleStopSession}
                className="w-full flex items-center justify-center gap-2 py-4 bg-red-100 text-red-700 font-bold rounded-xl hover:bg-red-200 transition-colors cursor-pointer"
              >
                <Square size={20} /> Stop Class & Lock Scans
              </button>
            )}

            <button 
              onClick={handleExport}
              disabled={!activeSessionId}
              className={`w-full flex items-center justify-center gap-2 py-4 font-bold rounded-xl transition-all ${
                activeSessionId 
                  ? 'bg-green-100 text-green-700 hover:bg-green-200 cursor-pointer' 
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
            >
              <Download size={20} /> Export to Excel
            </button>
          </div>

          {message && (
            <div className="text-center font-medium mt-2 text-slate-700 animate-in fade-in">
              {message}
            </div>
          )}
        </div>

        {/* Right Col: Live Feed */}
        <div className="bg-white p-8 rounded-3xl shadow-xl border border-slate-100 flex flex-col min-h-[500px]">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100">
            <Users className="text-indigo-600" size={24} />
            <h2 className="text-xl font-bold text-slate-800">Live Attendance</h2>
            {activeSessionId && (
              <span className="ml-auto flex items-center gap-2 text-xs font-bold text-green-600 bg-green-100 px-3 py-1 rounded-full">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-ping"></span> LIVE
              </span>
            )}
          </div>

          {!activeSessionId ? (
            <div className="flex-1 flex items-center justify-center text-center text-gray-400 p-8 border-2 border-dashed border-gray-100 rounded-2xl">
              Start a session to see students appear here in real-time.
            </div>
          ) : liveAttendance.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-center text-gray-400 p-8 border-2 border-dashed border-gray-100 rounded-2xl">
              Waiting for first student scan...
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto pr-2 space-y-3">
              {liveAttendance.map((record) => (
                <div key={record.id} className="p-4 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between animate-in fade-in slide-in-from-right-4">
                  <div>
                    <p className="font-bold text-slate-800">{record.student.name}</p>
                    <p className="text-xs text-slate-500">{record.student.email}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold text-indigo-600 bg-indigo-100 px-2 py-1 rounded-md">
                      {record.student.batch || 'All'}
                    </span>
                    <p className="text-[10px] text-gray-400 mt-1">
                      {new Date(record.markedAt).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default TeacherDashboard;
