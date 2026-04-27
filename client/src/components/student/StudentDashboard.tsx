import React, { useEffect, useState, useMemo } from 'react';
import { Html5QrcodeScanner } from "html5-qrcode";
import { QrCode, CheckCircle, XCircle, History, Scan } from 'lucide-react';

const StudentDashboard = () => {
  const [activeTab, setActiveTab] = useState<'SCAN' | 'HISTORY'>('SCAN');
  const [history, setHistory] = useState<any[]>([]);

  const [status, setStatus] = useState<'IDLE' | 'SUCCESS' | 'ERROR'>('IDLE');
  const [message, setMessage] = useState<string>('');
  const [historyView, setHistoryView] = useState<"DAILY" | "COMBINED">("DAILY");
  const [summaryData, setSummaryData] = useState<{ subjects: any[], sessions: any[] }>({ subjects: [], sessions: [] });

  const token = localStorage.getItem('qr_token') ?? "";
  const user = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem('qr_user') ?? "{}");
    } catch (e) {
      return {};
    }
  }, []);

  // for daily history grouping
  const groupedHistory = useMemo(() => {
    return history.reduce((acc: any, record: any) => {
      const date = new Date(record.markedAt).toDateString();
      if (!acc[date]) acc[date] = [];
      acc[date].push(record);
      return acc;
    }, {});
  }, [history]);

  // Fetch History
  useEffect(() => {
    if (activeTab === 'HISTORY' && user.id) {
      const fetchHistory = async () => {
        try {
          const res = await fetch(`http://localhost:5000/api/student/history?studentId=${user.id}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (res.ok) setHistory(await res.json());
        } catch (error) {
          console.error("Failed to fetch history");
        }
      };
      fetchHistory();
    }
  }, [activeTab, user.id, token]);

  // Fetch Summary for Combined Grid
  useEffect(() => {
    if (activeTab === 'HISTORY' && historyView === 'COMBINED' && user.id) {
      const fetchSummary = async () => {
        try {
          const res = await fetch(`http://localhost:5000/api/student/summary?studentId=${user.id}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (res.ok) setSummaryData(await res.json());
        } catch (error) {
          console.error("Failed to fetch summary", error);
        }
      };
      fetchSummary();
    }
  }, [activeTab, historyView, user.id, token]);

  const uniqueDates = useMemo(() => {
    if (!summaryData.sessions) return [];
    const dates = summaryData.sessions.map(s => new Date(s.date).toLocaleDateString());
    return Array.from(new Set(dates)).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
  }, [summaryData.sessions]);

  // QR Scanner Logic
  useEffect(() => {
    let scanner: Html5QrcodeScanner | null = null;
    let isProcessing = false;

    if (activeTab === 'SCAN') {
      scanner = new Html5QrcodeScanner("reader", {
        fps: 10,
        qrbox: { width: 250, height: 250 }
      }, false);

      const onScanSuccess = async (decodedText: string) => {
        if (isProcessing) return;
        isProcessing = true;

        try { if (scanner) scanner.pause(true); } catch (e) {}

        setMessage("Processing attendance...");
        setStatus('IDLE');

        try {
          const response = await fetch('http://localhost:5000/api/student/scan', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              studentId: user.id,
              qrPayload: decodedText,
            })
          });

          const data = await response.json();

          if (response.ok) {
            setStatus('SUCCESS');
            setMessage(`Present! ${data.subjectName} with ${data.teacherName}`);
          } else {
            setStatus('ERROR');
            setMessage(data.message || "Failed to mark attendance");
            setTimeout(() => {
              setStatus('IDLE');
              setMessage('Ready to scan again...');
              isProcessing = false;
              try { if (scanner) scanner.resume(); } catch (e) {}
            }, 3000);
          }
        } catch (error) {
          setStatus('ERROR');
          setMessage("Server is unreachable.");
          setTimeout(() => {
            setStatus('IDLE');
            setMessage('Ready to scan again...');
            isProcessing = false;
            try { if (scanner) scanner.resume(); } catch (e) {}
          }, 3000);
        }
      };

      scanner.render(onScanSuccess, () => {});
    }

    return () => {
      if (scanner) {
        scanner.clear().catch(err => console.error("Scanner cleanup error", err));
      }
    };
  }, [activeTab, user.id, token]);

  return (
    <div className='max-w-2xl mx-auto mt-10 p-6 bg-white rounded-3xl shadow-xl border border-slate-100 flex flex-col'>

      <div className="text-center mb-8">
        <h1 className="text-4xl font-extrabold text-slate-800">Student Portal</h1>
        <p className="text-gray-500 mt-2">Welcome back, {user.name || 'Student'}!</p>
      </div>

      <div className="flex gap-4 border-b border-gray-200 pb-4 mb-6 justify-center">
        <button onClick={() => setActiveTab('SCAN')}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all ${activeTab === 'SCAN' ? 'bg-blue-50 text-blue-700' : 'text-gray-500 hover:bg-gray-50'}`}>
          <Scan size={20} /> Scanner
        </button>
        <button onClick={() => setActiveTab('HISTORY')}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all ${activeTab === 'HISTORY' ? 'bg-blue-50 text-blue-700' : 'text-gray-500 hover:bg-gray-50'}`}>
          <History size={20} /> My Attendance
        </button>
      </div>

      {activeTab === 'SCAN' && (
        <div className="max-w-md mx-auto w-full animate-in fade-in slide-in-from-bottom-4">
          <div className='flex items-center gap-3 mb-6'>
            <div className='p-3 bg-blue-100 text-blue-600 rounded-2xl'>
              <QrCode size={28} />
            </div>
            <div>
              <div className='text-2xl font-bold text-slate-800'>Scan QR Code</div>
              <p className='text-slate-500 text-sm'>Hold your phone steady over the code</p>
            </div>
          </div>

          <div className='w-full overflow-hidden rounded-2xl border-4 border-slate-50 shadow-inner'>
            <div id='reader' className='w-full' />
          </div>

          <div className={`mt-8 w-full p-4 rounded-2xl flex items-center gap-3 transition-colors duration-300 ${status === 'SUCCESS' ? 'bg-green-50 text-green-700 border border-green-100' : status === 'ERROR' ? 'bg-red-50 text-red-700 border border-red-100' : 'bg-slate-50 text-slate-700 border border-slate-100'}`}>
            {status === 'SUCCESS' && <CheckCircle size={24} className="text-green-500 shrink-0" />}
            {status === 'ERROR' && <XCircle size={24} className="text-red-500 shrink-0" />}
            {status === 'IDLE' && <div className="w-6 h-6 rounded-full border-2 border-slate-300 animate-pulse shrink-0" />}
            <p className='flex-1 font-medium text-sm'>{message || (status === 'IDLE' ? 'Waiting to scan...' : '')}</p>
          </div>
        </div>
      )}

      {activeTab === 'HISTORY' && (
        <div className="animate-in space-y-4 fade-in slide-in-from-bottom-4">
          <div className='flex justify-around p-1 bg-slate-50 rounded-2xl w-full border border-slate-100'>
            <button onClick={() => setHistoryView('DAILY')}
              className={`flex-1 py-2 px-4 rounded-xl text-sm font-bold transition-all ${historyView === 'DAILY' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:bg-slate-100'}`}>
              Daily View
            </button>
            <button onClick={() => setHistoryView('COMBINED')}
              className={`flex-1 py-2 px-4 rounded-xl text-sm font-bold transition-all ${historyView === 'COMBINED' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:bg-slate-100'}`}>
              Combined Grid
            </button>
          </div>

          {history.length === 0 && (
            <div className="text-center p-12 bg-gray-50 rounded-2xl border border-dashed border-gray-300 text-gray-500">
              <History className="mx-auto text-gray-300 mb-3" size={48} />
              No records found.
            </div>
          )}

          {history.length > 0 && historyView === "DAILY" && (
            <div className="space-y-6 max-h-[500px] overflow-y-auto pr-2">
              {Object.keys(groupedHistory).sort((a, b) => new Date(b).getTime() - new Date(a).getTime()).map(date => (
                <div key={date} className="space-y-3">
                  <div className="sticky top-0 bg-white/90 backdrop-blur-sm py-2 z-10">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">{date}</h4>
                  </div>
                  {groupedHistory[date].map((record: any) => (
                    <div key={record.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between hover:shadow-sm transition-all">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-green-100 text-green-600 flex items-center justify-center font-bold">
                          <CheckCircle size={20} />
                        </div>
                        <div>
                          <h3 className="font-bold text-slate-800 text-sm leading-tight">{record.session?.timetable?.subject?.name}</h3>
                          <p className="text-xs text-slate-500 mt-1">Prof. {record.session?.timetable?.teacher?.name}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="px-2 py-1 bg-indigo-100 text-indigo-700 rounded-lg text-[10px] font-bold">{record.session?.timetable?.subject?.code}</span>
                        <p className="text-[10px] text-gray-400 mt-1">{new Date(record.markedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}

          {history.length > 0 && historyView === "COMBINED" && (
            <div className="overflow-x-auto rounded-2xl border border-slate-100 shadow-inner bg-slate-50 max-h-[500px]">
              <table className="w-full text-left border-collapse">
                <thead className="sticky top-0 z-20 bg-slate-100">
                  <tr>
                    <th className="p-3 text-xs font-bold text-slate-600 border sticky left-0 bg-slate-100 z-30">Subject</th>
                    {uniqueDates.map(date => (
                      <th key={date} className={`p-3 text-[10px] font-bold text-slate-600 border text-center whitespace-nowrap`}>{date}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {summaryData.subjects.map(subject => (
                    <tr key={subject.id} className="bg-white hover:bg-slate-50">
                      <td className="p-3 text-xs font-bold text-slate-700 border sticky left-0 bg-white z-10 shadow-[2px_0_5px_rgba(0,0,0,0.05)]">{subject.code}</td>
                      {uniqueDates.map(date => {
                        const session = summaryData.sessions.find(s => s.subjectId === subject.id && new Date(s.date).toLocaleDateString() === date);
                        return (
                          <td key={date} className={`p-3 text-center border font-bold text-sm ${session ? (session.present ? 'text-green-600' : 'text-red-500') : 'text-slate-300'}`}>
                            {session ? (session.present ? 'P' : 'A') : '-'}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default StudentDashboard;
