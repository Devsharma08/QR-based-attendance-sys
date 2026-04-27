import React, { useEffect, useState } from 'react';
import { Html5QrcodeScanner } from "html5-qrcode";
import { QrCode, CheckCircle, XCircle, History, Scan } from 'lucide-react';

const StudentDashboard = () => {
  const [activeTab, setActiveTab] = useState<'SCAN' | 'HISTORY'>('SCAN');
  const [history, setHistory] = useState<any[]>([]);

  const [scanResult, setScanResult] = useState<string | null>(null);
  const [status, setStatus] = useState<'IDLE' | 'SUCCESS' | 'ERROR'>('IDLE');
  const [message, setMessage] = useState<string>('');
  
  const token = localStorage.getItem('qr_token') ?? "";
  const user = JSON.parse(localStorage.getItem('qr_user') ?? "{}");

  // Fetch History when the History tab is clicked
  useEffect(() => {
    if (activeTab === 'HISTORY') {
      const fetchHistory = async () => {
        try {
          const res = await fetch(`http://localhost:5000/api/student/history?studentId=${user.id}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (res.ok) {
            setHistory(await res.json());
          }
        } catch (error) {
          console.error("Failed to fetch history");
        }
      };
      fetchHistory();
    }
  }, [activeTab]);

  // QR Scanner Logic
  useEffect(() => {
    let scanner: Html5QrcodeScanner | null = null;
    let isProcessing = false; // Add a flag to block spam frames!

    if (activeTab === 'SCAN') {
      scanner = new Html5QrcodeScanner("reader", {
        fps: 10, 
        qrbox: { width: 250, height: 250 }
      }, false);

      const onScanSuccess = async (decodedText: string) => {
        if (isProcessing) return; // Instantly block duplicate frames
        isProcessing = true;

        // Safely try to pause the camera (passing true freezes the video frame)
        try {
          if (scanner) scanner.pause(true); 
        } catch (e) {
          // console.warn("Scanner pause bypassed", e);
        }

        setScanResult(decodedText);
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
            // Note: We leave it paused here because they succeeded!
          } else {
            setStatus('ERROR');
            setMessage(data.message || "Failed to mark attendance");
            
            // If they failed (e.g. scanned wrong code), let them try again after 3 seconds
            setTimeout(() => {
              setStatus('IDLE');
              setMessage('Ready to scan again...');
              isProcessing = false;
              try { if (scanner) scanner.resume(); } catch(e) {}
            }, 3000);
          }
        } catch (error) {
          setStatus('ERROR');
          setMessage("Server is unreachable. Is the backend running?");
          
          setTimeout(() => {
            setStatus('IDLE');
            setMessage('Ready to scan again...');
            isProcessing = false;
            try { if (scanner) scanner.resume(); } catch(e) {}
          }, 3000);
        }
      };

      scanner.render(onScanSuccess, () => {});
    }

    // Cleanup scanner when switching tabs or unmounting
    return () => {
      if (scanner) {
        scanner.clear().catch(err => console.error("Scanner cleanup error", err));
      }
    };
  }, [activeTab]);


  return (
    <div className='max-w-2xl mx-auto mt-10 p-6 bg-white rounded-3xl shadow-xl border border-slate-100 flex flex-col'>
      
      <div className="text-center mb-8">
        <h1 className="text-4xl font-extrabold text-slate-800">Student Portal</h1>
        <p className="text-gray-500 mt-2">Welcome back, {user.name}!</p>
      </div>

      {/* Tab Navigation */}
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

      {/* SCANNER TAB */}
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

      {/* HISTORY TAB */}
      {activeTab === 'HISTORY' && (
        <div className="animate-in fade-in slide-in-from-bottom-4">
          {history.length === 0 ? (
            <div className="text-center p-12 bg-gray-50 rounded-2xl border border-dashed border-gray-300 text-gray-500">
              <History className="mx-auto text-gray-300 mb-3" size={48} />
              You haven't marked attendance for any classes yet.
            </div>
          ) : (
            <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
              {history.map((record, idx) => (
                <div key={record.id} className="p-5 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-green-100 text-green-600 flex items-center justify-center font-bold shadow-inner shrink-0">
                      <CheckCircle size={24} />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800 text-lg leading-tight">
                        {record.session?.timetable?.subject?.name || "Unknown Subject"}
                      </h3>
                      <p className="text-sm text-slate-500 font-medium mt-1">
                        Prof. {record.session?.timetable?.teacher?.name || "Unknown"}
                      </p>
                    </div>
                  </div>
                  <div className="text-left sm:text-right mt-2 sm:mt-0">
                    <span className="inline-block px-3 py-1 bg-indigo-100 text-indigo-700 rounded-lg text-xs font-bold mb-1">
                      {record.session?.timetable?.subject?.code || "CODE"}
                    </span>
                    <p className="text-xs text-gray-400 font-mono mt-1">
                      {new Date(record.markedAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

    </div>
  );
}

export default StudentDashboard;
