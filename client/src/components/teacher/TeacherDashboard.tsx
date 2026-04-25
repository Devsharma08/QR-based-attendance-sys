import React, { useState } from 'react';
import { PlayCircle, Download, ShieldCheck, AlertCircle } from 'lucide-react';

const TeacherDashboard = () => {
  const [timetableId, setTimetableId] = useState('');
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [message, setMessage] = useState('');

  // user info
  const user = JSON.parse(localStorage.getItem("qr_user") || "{}");
  // token
  const token = localStorage.getItem("qr_token") || "";

  // 1. The Pulse: Starts the Matchmaking Engine
  const handleStartSession = async () => {
    if (!timetableId) {
      setMessage("Please enter a Timetable ID.");
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
        setMessage("✅ Class is now LIVE! Students can scan the QR code.");
      } else {
        // If the class is already running, our backend actually returns the existing session ID!
        if (data.session) {
            setActiveSessionId(data.session.id);
            setMessage("✅ This class is already active. Export is ready.");
        } else {
            setMessage(`❌ Error: ${data.message || 'Failed to start'}`);
        }
      }
    } catch (err) {
      setMessage("❌ Backend is offline. Cannot start class.");
    }
  };

  // 2. The Reward: Download the Excel Sheet
  const handleExport = () => {
    if (!activeSessionId) return;
    // We simply open the GET route, and your backend forces a .xlsx download!
   window.open(`http://localhost:5000/api/student/export/session/${activeSessionId}?token=${token}`, '_blank');
  };

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-8 mt-10">
      
      {/* Header */}
      <div className="text-center">
        <h1 className="text-4xl font-extrabold text-slate-800">Professor Portal</h1>
        <p className="text-gray-500 mt-2">Manage your active class and export attendance.</p>
      </div>

      {/* Control Panel */}
      <div className="bg-white p-8 rounded-3xl shadow-xl border border-slate-100 flex flex-col gap-6">
        
        <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 flex items-start gap-3">
           <ShieldCheck className="text-blue-500 shrink-0 mt-1" />
           <p className="text-sm text-blue-800">
             To unlock the QR Matchmaking system, you must start the session. Until you click Start, all student scans will be automatically rejected.
           </p>
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">Target Timetable ID</label>
          <input 
            value={timetableId} 
            onChange={(e) => setTimetableId(e.target.value)}
            placeholder="Paste your specific Timetable UUID here..." 
            className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all font-mono text-sm" 
          />
        </div>

        <div className="flex flex-col sm:flex-row gap-4 pt-2">
          {/* Start Session Button */}
          <button 
            onClick={handleStartSession}
            className="flex-1 flex items-center justify-center gap-2 py-4 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-colors"
          >
            <PlayCircle size={20} />
            Start Session
          </button>

          {/* Download Excel Button - Only unlocks if a session is active! */}
          <button 
            onClick={handleExport}
            disabled={!activeSessionId}
            className={`flex-1 flex items-center justify-center gap-2 py-4 font-bold rounded-xl transition-all ${
              activeSessionId 
                ? 'bg-green-100 text-green-700 hover:bg-green-200 border border-green-200 cursor-pointer' 
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
          >
            <Download size={20} />
            Export to Excel
          </button>
        </div>

        {/* Status Messages */}
        {message && (
          <div className="text-center font-medium mt-2 text-slate-700 animate-in fade-in">
            {message}
          </div>
        )}

      </div>
    </div>
  );
};

export default TeacherDashboard;
