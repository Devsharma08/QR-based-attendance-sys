import React, { useEffect, useState } from 'react'
import { Html5QrcodeScanner } from "html5-qrcode";
import { QrCode, CheckCircle, XCircle } from 'lucide-react';

const StudentDashboard = () => {
  const [scanResult, setScanResult] = useState<String | null>(null);
  const [status, setStatus] = useState<'IDLE' | 'SUCCESS' | 'ERROR'>('IDLE');
  const [message, setMessage] = useState<String>('');
  const token = localStorage.getItem('qr_token') ?? "";

  const user = JSON.parse(localStorage.getItem('qr_user') ?? "{}");

  useEffect(() => {
    const scanner = new Html5QrcodeScanner("reader", {
      fps: 10, qrbox: {
        width: 250,
        height: 250
      },
    }, false)
    // what happens when it successfully reads a qr
    const onScanSuccess = async (decodedText: string) => {
      scanner.pause(); // stop so don't spam the server

      setScanResult(decodedText);
      setMessage("Processing attendance...");

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
        })

        const data = await response.json();

        if (response.ok) {
          setStatus('SUCCESS');
          setMessage(`Present! ${data.subjectName} with ${data.teacherName}`);
        } else {
          setStatus('ERROR');
          setMessage(data.message || "Failed to mark attendance");
        }
      } catch (error) {
        setStatus('ERROR');
        setMessage("Server is unreachable. Is the backend running?");
      }

    }

    scanner.render(onScanSuccess, (error) => {
      // ignore error,it just means no qr detected yet
    })

    return () => {
      scanner.clear().catch((err) => console.log(err)); // cleanup when component unmounts}
    }
  }, [])

  return (
    <div className='max-w-md mx-auto mt-10 p-6 bg-white rounded-3xl shadow-xl border border-slate-100 flex flex-col items-ceter'>
      {/* header */}
      <div className='flex items-center gap-3 mb-6'>
        <div className='p-3 bg-blue-100 text-blue-600 rounded-2xl'>
          <QrCode size={28} />
        </div>
        <div className='text-2xl font-bold text-slate-800'>Scan QR Code</div>
        <p className='text-slate-500 text-sm mt-1'>Hold your phone steady over the QR code</p>
      </div>

      {/* video feed */}
      <div className='w-full overflow-hidden rounded-2xl border-4 border-slate-50'>
        <div id='reader' className='w-full' />
      </div>

      {/* status box */}
      <div className={`mt-8 w-full p-4 rounded-2xl flex items-center gap-3 transition-colors duration-300 ${status === 'SUCCESS' ? 'bg-green-50 text-green-700 border border-green-100' : status === 'ERROR' ? 'bg-red-50 text-red-700 border border-red-100' : 'bg-slate-50 text-slate-700 border border-slate-100'}`}>

        {status === 'SUCCESS' && <CheckCircle size={24} className="text-green-500" />}
        {status === 'ERROR' && <XCircle size={24} className="text-red-500" />}
        {status === 'IDLE' && <div className="w-6 h-6 rounded-full border-2 border-slate-300 animate-pulse" />}

        <p className='flex-1 font-medium'>{message || (status === 'IDLE' ? 'Waiting to scan...' : '')}</p>

      </div>

      {scanResult && <div className='mt-4 text-xs text-slate-500 text-center p-2 bg-slate-50 rounded'>Scanned: {scanResult.slice(0, 40)}...</div>}

    </div>
  )
}

export default StudentDashboard