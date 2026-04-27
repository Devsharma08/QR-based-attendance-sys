import React, { useState, useEffect } from 'react';
import { PlayCircle, Download, ShieldCheck, Square, Users } from 'lucide-react';

const TeacherDashboard = () => {
  const [timetables, setTimetables] = useState<any[]>([]);
  const [timetableId, setTimetableId] = useState('');
  const [activeTab,setActiveTab]= useState<"CLASS" | "HISTORY">("CLASS");
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [liveAttendance, setLiveAttendance] = useState<any[]>([]);
  const [message, setMessage] = useState('');
  const [history,setHistory]= useState<any[]>([]);

  // filter states
  const [filter,setFilter] = useState<string>('');

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

  // fetch history
  useEffect(()=>{
  if(activeTab==='HISTORY'){
      const fetchHistory = async()=> {
        try {
          const res = await fetch(`http://localhost:5000/api/teacher/history`, {
            headers: {'Authorization': `Bearer ${token}`}
          });
          if (res.ok) {
            setHistory(await res.json());
          }
        } catch (error) {
          console.error("Failed to fetch history", error);
        }
      }
      fetchHistory();
    }
  },[activeTab])

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

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-8 mt-10">
      
            {/* Tab Navigation */}
      <div className="flex gap-4 border-b border-gray-200 pb-4 mb-6 justify-center mt-6">
        <button onClick={() => setActiveTab('CLASS')} 
          className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all ${activeTab === 'CLASS' ? 'bg-indigo-50 text-indigo-700' : 'text-gray-500 hover:bg-gray-50'}`}>
          <PlayCircle size={20} /> Active Class
        </button>
        <button onClick={() => setActiveTab('HISTORY')}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all ${activeTab === 'HISTORY' ? 'bg-indigo-50 text-indigo-700' : 'text-gray-500 hover:bg-gray-50'}`}>
          <Users size={20} /> Past Sessions
        </button>
      </div>

      {/* TAB 1: ACTIVE CLASS (Your existing layout) */}
      {activeTab === 'CLASS' && (
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
      )}

      {/* TAB 2: HISTORY (New feature!) */}
      {activeTab === 'HISTORY' && (
         <div className="bg-white p-8 rounded-3xl shadow-xl border border-slate-100 min-h-[500px] animate-in fade-in slide-in-from-bottom-4">
          {/* filter section - search by year,room_no,semester and date of class */}
          <div className='flex-1 flex w-full m-auto my-10'>
            <input type="text" value={filter} onChange={(e)=>setFilter(e.target.value)} className='w-full py-2 px-3 mx-auto outline:none focus:outline-none border-2 border-slate-300 rounded-md' placeholder="Search - give any valid text to search" />
          </div>
           
           {history.length === 0 ? (
             <div className="text-center text-gray-400 p-12 border-2 border-dashed border-gray-100 rounded-2xl">
               No past classes found.
             </div>
           ) : (
             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
               {history.filter(s=>s.timetable?.subject?.name?.toLowerCase().includes(filter.toLowerCase()) || s.timetable?.room?.name?.toLowerCase().includes(filter.toLowerCase()) || s.timetable?.dayOfWeek?.toLowerCase().includes(filter.toLowerCase()) || s.timetable?.startTime?.toLowerCase().includes(filter.toLowerCase()) || s.timetable?.endTime?.toLowerCase().includes(filter.toLowerCase()) || s.timetable?.year?.toLowerCase().includes(filter.toLowerCase()) || s.timetable?.semester?.toLowerCase().includes(filter.toLowerCase()) || s.timetable?.roomNo?.toLowerCase().includes(filter.toLowerCase()) || s.timetable?.date?.toLowerCase().includes(filter.toLowerCase())).map(session => (
                 <div key={session.id} className="p-6 border border-gray-200 rounded-2xl flex flex-col justify-between hover:shadow-lg transition-all bg-slate-50 hover:-translate-y-1">
                   <div>
                     <h3 className="font-bold text-xl text-slate-800 line-clamp-1" title={session.timetable?.subject?.name}>
                       {session.timetable?.subject?.name}
                     </h3>
                     <p className="text-sm font-medium text-gray-500 mt-1">
                       Room: <span className="text-slate-700">{session.timetable?.room?.name}</span>
                     </p>
                   </div>
                   
                   <div className="mt-6 pt-4 border-t border-gray-200 flex justify-between items-end">
                     <div>
                       <p className="text-xs text-gray-400 mb-1">
                         {new Date(session.startedAt).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                       </p>
                       <span className="inline-block px-3 py-1 bg-indigo-100 text-indigo-700 rounded-lg text-xs font-bold">
                         {session._count?.attendances} Attended
                       </span>
                     </div>
                     
                     {/* The Magic Excel Download Button for past classes! */}
                     <button 
                       onClick={() => window.open(`http://localhost:5000/api/teacher/export/session/${session.id}?token=${token}`, '_blank')}
                       className="p-3 bg-green-100 text-green-700 rounded-xl hover:bg-green-200 transition-colors cursor-pointer shadow-sm"
                       title="Download Excel Sheet"
                     >
                       <Download size={20} />
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
