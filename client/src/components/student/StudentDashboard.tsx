import { useEffect, useState, useMemo } from 'react';
import { Html5QrcodeScanner } from "html5-qrcode";
import { QrCode, CheckCircle, XCircle, History, Scan } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const StudentDashboard = () => {
  const [activeTab, setActiveTab] = useState<'SCAN' | 'HISTORY'>('SCAN');
  const [history, setHistory] = useState<any[]>([]);
  const [status, setStatus] = useState<'IDLE' | 'SUCCESS' | 'ERROR'>('IDLE');
  const [message, setMessage] = useState('');
  const [historyView, setHistoryView] = useState<"DAILY" | "COMBINED">("DAILY");
  const [summaryData, setSummaryData] = useState<{ subjects: any[], sessions: any[] }>({ subjects: [], sessions: [] });

  const token = localStorage.getItem('qr_token') ?? "";
  const user = useMemo(() => { 
    try { return JSON.parse(localStorage.getItem('qr_user') ?? "{}"); } 
    catch { return {}; } 
  }, []);

  const groupedHistory = useMemo(() => {
    return history.reduce((acc: any, record: any) => {
      const date = new Date(record.markedAt).toDateString();
      if (!acc[date]) acc[date] = [];
      acc[date].push(record);
      return acc;
    }, {});
  }, [history]);

  useEffect(() => {
    if (activeTab === 'HISTORY' && user.id) {
      fetch(`${API_URL}/api/student/history?studentId=${user.id}`, { 
        headers: { 'Authorization': `Bearer ${token}` } 
      })
        .then(r => r.ok ? r.json() : [])
        .then(setHistory)
        .catch(() => {});
    }
  }, [activeTab, user.id, token]);

  useEffect(() => {
    if (activeTab === 'HISTORY' && historyView === 'COMBINED' && user.id) {
      fetch(`${API_URL}/api/student/summary?studentId=${user.id}`, { 
        headers: { 'Authorization': `Bearer ${token}` } 
      })
        .then(r => r.ok ? r.json() : { subjects: [], sessions: [] })
        .then(setSummaryData)
        .catch(() => {});
    }
  }, [activeTab, historyView, user.id, token]);

  const uniqueDates = useMemo(() => {
    if (!summaryData.sessions) return [];
    const dates = summaryData.sessions.map(s => new Date(s.date).toLocaleDateString());
    return Array.from(new Set(dates)).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
  }, [summaryData.sessions]);

  useEffect(() => {
    let scanner: Html5QrcodeScanner | null = null;
    let isProcessing = false;
    
    if (activeTab === 'SCAN') {
      scanner = new Html5QrcodeScanner("reader", { 
        fps: 10, 
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0
      }, false);

      const onScanSuccess = async (decodedText: string) => {
        if (isProcessing) return;
        isProcessing = true;
        
        try { if (scanner) scanner.pause(true); } catch {}
        setMessage("Processing...");
        setStatus('IDLE');

        try {
          const response = await fetch(`${API_URL}/api/student/scan`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ studentId: user.id, qrPayload: decodedText })
          });
          const data = await response.json();
          if (response.ok) {
            setStatus('SUCCESS');
            setMessage(`Present! ${data.subjectName} with ${data.teacherName}`);
          } else {
            setStatus('ERROR');
            setMessage(data.message || "Failed");
            setTimeout(() => {
              setStatus('IDLE');
              setMessage('Ready...');
              isProcessing = false;
              try { if (scanner) scanner.resume(); } catch {}
            }, 3000);
          }
        } catch {
          setStatus('ERROR');
          setMessage("Server unreachable.");
          setTimeout(() => {
            setStatus('IDLE');
            setMessage('Ready...');
            isProcessing = false;
            try { if (scanner) scanner.resume(); } catch {}
          }, 3000);
        }
      };

      scanner.render(onScanSuccess, () => {});
    }
    return () => { if (scanner) scanner.clear().catch(() => {}); };
  }, [activeTab, user.id, token]);

  const tabs = [
    { key: 'SCAN' as const, label: 'Scanner', icon: <Scan size={15} /> },
    { key: 'HISTORY' as const, label: 'My Attendance', icon: <History size={15} /> },
  ];

  return (
    <div style={{ maxWidth: '40rem', margin: '0 auto', padding: '2rem 1.5rem' }}>
      <div className="animate-slide-up" style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 800, letterSpacing: '-0.03em' }} className="gradient-text">Student Portal</h1>
        <p style={{ color: 'var(--text-secondary)', marginTop: '0.25rem' }}>Welcome back, {user.name || 'Student'}!</p>
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

      {activeTab === 'SCAN' && (
        <div className="glass-card animate-slide-up" style={{ padding: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
            <div style={{ 
              width: '2.75rem', height: '2.75rem', borderRadius: '0.75rem', 
              background: 'rgba(99, 102, 241, 0.08)', color: 'var(--accent-1)', 
              display: 'flex', alignItems: 'center', justifyContent: 'center' 
            }}>
              <QrCode size={22} />
            </div>
            <div>
              <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)' }}>Scan QR Code</div>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Hold your device steady over the code</p>
            </div>
          </div>

          <div style={{ borderRadius: '1.25rem', overflow: 'hidden', border: '2px solid var(--border-glass)', background: '#000' }}>
            <div id="reader" style={{ width: '100%' }} />
          </div>

          <div style={{
            marginTop: '1.5rem', padding: '1rem', borderRadius: '0.875rem',
            display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.875rem', fontWeight: 600,
            background: status === 'SUCCESS' ? 'rgba(16, 185, 129, 0.06)' : status === 'ERROR' ? 'rgba(239, 68, 68, 0.06)' : 'var(--bg-primary)',
            color: status === 'SUCCESS' ? '#059669' : status === 'ERROR' ? '#dc2626' : 'var(--text-secondary)',
            border: `1px solid ${status === 'SUCCESS' ? 'rgba(16, 185, 129, 0.12)' : status === 'ERROR' ? 'rgba(239, 68, 68, 0.12)' : 'var(--border-glass)'}`,
          }}>
            {status === 'SUCCESS' && <CheckCircle size={20} style={{ flexShrink: 0 }} />}
            {status === 'ERROR' && <XCircle size={20} style={{ flexShrink: 0 }} />}
            {status === 'IDLE' && <div className="live-dot" style={{ background: 'var(--accent-1)' }} />}
            <p style={{ flex: 1 }}>{message || 'Ready to scan...'}</p>
          </div>
        </div>
      )}

      {activeTab === 'HISTORY' && (
        <div className="animate-slide-up" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ 
            display: 'flex', gap: '0.25rem', padding: '0.25rem', 
            background: 'var(--bg-secondary)', border: '1px solid var(--border-glass)', 
            borderRadius: '0.875rem', boxShadow: 'var(--shadow-sm)' 
          }}>
            {(['DAILY', 'COMBINED'] as const).map(v => (
              <button 
                key={v} 
                onClick={() => setHistoryView(v)} 
                style={{
                  flex: 1, padding: '0.625rem', borderRadius: '0.625rem', fontSize: '0.8125rem', 
                  fontWeight: 600, cursor: 'pointer', border: 'none', transition: 'all 0.25s',
                  background: historyView === v ? 'var(--accent-gradient)' : 'transparent',
                  color: historyView === v ? 'white' : 'var(--text-secondary)',
                  boxShadow: historyView === v ? '0 4px 12px rgba(99, 102, 241, 0.2)' : 'none'
                }}
              >
                {v === 'DAILY' ? 'Daily Timeline' : 'Monthly Grid'}
              </button>
            ))}
          </div>

          {history.length === 0 && (
            <div className="glass-card" style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-secondary)' }}>
              <History size={48} style={{ margin: '0 auto 1rem', opacity: 0.2 }} />
              <p style={{ fontWeight: 500 }}>No attendance records found yet.</p>
            </div>
          )}

          {history.length > 0 && historyView === 'DAILY' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {Object.keys(groupedHistory).sort((a, b) => new Date(b).getTime() - new Date(a).getTime()).map(date => (
                <div key={date} style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                  <div style={{ position: 'sticky', top: '5rem', zIndex: 10, paddingBlock: '0.5rem', background: 'var(--bg-primary)' }}>
                    <h4 style={{ fontSize: '0.6875rem', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{date}</h4>
                  </div>
                  {groupedHistory[date].map((record: any) => (
                    <div key={record.id} className="glass-card" style={{ padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div style={{ 
                          width: '2.5rem', height: '2.5rem', borderRadius: '50%', 
                          background: 'rgba(16, 185, 129, 0.08)', color: '#059669', 
                          display: 'flex', alignItems: 'center', justifyContent: 'center' 
                        }}>
                          <CheckCircle size={18} />
                        </div>
                        <div>
                          <h3 style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--text-primary)' }}>{record.session?.timetable?.subject?.name}</h3>
                          <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Prof. {record.session?.timetable?.teacher?.name}</p>
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <span className="badge badge-purple">{record.session?.timetable?.subject?.code}</span>
                        <p style={{ fontSize: '0.6875rem', color: '#94a3b8', marginTop: '0.375rem', fontWeight: 600 }}>{new Date(record.markedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}

          {history.length > 0 && historyView === 'COMBINED' && (
            <div className="glass-card" style={{ overflow: 'auto', maxHeight: '32rem', border: '1px solid var(--border-glass)' }}>
              <table className="table-premium" style={{ minWidth: '40rem' }}>
                <thead>
                  <tr>
                    <th style={{ position: 'sticky', left: 0, zIndex: 20, background: 'var(--bg-primary)' }}>Course</th>
                    {uniqueDates.map(date => <th key={date} style={{ textAlign: 'center', whiteSpace: 'nowrap', fontSize: '0.625rem' }}>{date}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {summaryData.subjects.map(subject => (
                    <tr key={subject.id}>
                      <td style={{ fontWeight: 800, fontSize: '0.75rem', position: 'sticky', left: 0, background: 'white', zIndex: 10, color: 'var(--accent-1)' }}>{subject.code}</td>
                      {uniqueDates.map(date => {
                        const session = summaryData.sessions.find(s => s.subjectId === subject.id && new Date(s.date).toLocaleDateString() === date);
                        return (
                          <td key={date} style={{ textAlign: 'center' }}>
                            {session ? (
                              <span style={{ 
                                fontWeight: 800, 
                                color: session.present ? '#059669' : '#dc2626',
                                background: session.present ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                                padding: '0.25rem 0.5rem',
                                borderRadius: '0.375rem',
                                fontSize: '0.75rem'
                              }}>
                                {session.present ? 'P' : 'A'}
                              </span>
                            ) : (
                              <span style={{ color: '#e2e8f0' }}>-</span>
                            )}
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
};

export default StudentDashboard;
