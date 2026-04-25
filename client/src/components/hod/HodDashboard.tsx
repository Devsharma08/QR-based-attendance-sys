import React, { useState, useEffect } from 'react';
import { Building, BookOpen, Calendar, CheckCircle } from 'lucide-react';

const HodDashboard = () => {
  const [activeTab, setActiveTab] = useState<'ROOM' | 'SUBJECT' | 'TIMETABLE' | 'MASTER_TIMETABLE'>('ROOM');
  const [statusMsg, setStatusMsg] = useState('');
  const [timeTable, setTimeTable] = useState<any[]>([]);


  // Data for smart dropdowns
  const [teachers, setTeachers] = useState<any[]>([]);
  const [rooms, setRooms] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);

  const token = localStorage.getItem('qr_token') || '';
  const user = JSON.parse(localStorage.getItem('qr_user') || '{}');
  const departmentId = user.departmentId || '';

  // handle delete
  const handleDelete = async (t: any) => {
    // making sure the user is sure about deleting the schedule
    if (!window.confirm("Are you sure you want to delete this schedule?")) return;

    try {
      const headers = { 'Authorization': `Bearer ${token}` };
      const query = `?departmentId=${departmentId}`;

      const res = await fetch(`http://localhost:5000/api/hod/timetable${query}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          subjectId: t.subjectId,
          teacherId: t.teacherId,
          roomId: t.roomId,
          dayOfWeek: t.dayOfWeek,
          startTime: t.startTime,
          endTime: t.endTime,
          batch: t.batch || null
        })
      });

      if (res.ok) {
        setStatusMsg("Schedule deleted successfully");
        // deleting the schedule from the state variable
        setTimeTable(timeTable.filter((item) => item.id !== t.id));
      } else {
        const errorData = await res.json();
        setStatusMsg(`Error: ${errorData.message || errorData.error}`);
      }
    } catch (error) {
      setStatusMsg("Error: Failed to delete schedule");
    }
  }

  useEffect(() => {
    // fetching the timetable from the backend

    const fetchData =async() => {

    const query = `?departmentId=${departmentId}`;
    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };

    const [teachersRes, roomsRes, subjectsRes, timeTableRes] = await Promise.all([
      fetch(`http://localhost:5000/api/hod/teachers${query}`, { headers }),
      fetch(`http://localhost:5000/api/hod/rooms${query}`, { headers }),
      fetch(`http://localhost:5000/api/hod/subjects${query}`, { headers }),
      fetch(`http://localhost:5000/api/hod/timetable${query}`, { headers })
    ])

    if (teachersRes.ok) setTeachers(await teachersRes.json());
    if (roomsRes.ok) setRooms(await roomsRes.json());
    if (subjectsRes.ok) setSubjects(await subjectsRes.json());
    if (timeTableRes.ok) setTimeTable(await timeTableRes.json());
  } 
  // calling the fetchData function
  fetchData();
  }, [])

  const handleSubmit = async (e: React.FormEvent, endpoint: string) => {
    e.preventDefault();
    setStatusMsg("Saving to database...");

    const formData = new FormData(e.target as HTMLFormElement);
    const payload = Object.fromEntries(formData.entries());

    // Automatically attach the HOD's departmentId to Rooms and Subjects!
    if (endpoint === 'rooms' || endpoint === 'subjects') {
      payload.departmentId = departmentId;
    }

    try {
      const res = await fetch(`http://localhost:5000/api/hod/${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setStatusMsg(`Success! Saved ${endpoint} to database.`);
        (e.target as HTMLFormElement).reset(); // Clear the form
      } else {
        const errorData = await res.json();
        setStatusMsg(`Error: ${errorData.message || errorData.error}`);
      }
    } catch (err) {
      setStatusMsg("Backend server is offline.");
    }
  };

  const daysOfWeek = {
    'MONDAY': 'Monday',
    'TUESDAY': 'Tuesday',
    'WEDNESDAY': 'Wednesday',
    'THURSDAY': 'Thursday',
    'FRIDAY': 'Friday',
    'SATURDAY': 'Saturday',
    'SUNDAY': 'Sunday'
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div>
        <h1 className="text-4xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-indigo-500">
          HOD Control Center
        </h1>
        <p className="text-gray-500 mt-2 text-lg">Manage campus infrastructure and active schedules.</p>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-4 border-b border-gray-200 pb-4">
        <button onClick={() => { setActiveTab('MASTER_TIMETABLE'); setStatusMsg(''); }}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all ${activeTab === 'MASTER_TIMETABLE' ? 'bg-purple-50 text-purple-700' : 'text-gray-500 hover:bg-gray-50'}`}>
          <Calendar size={20} /> MASTER TIMETABLE
        </button>
        <button onClick={() => { setActiveTab('ROOM'); setStatusMsg(''); }}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all ${activeTab === 'ROOM' ? 'bg-purple-50 text-purple-700' : 'text-gray-500 hover:bg-gray-50'}`}>
          <Building size={20} /> Add Classroom
        </button>
        <button onClick={() => { setActiveTab('SUBJECT'); setStatusMsg(''); }}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all ${activeTab === 'SUBJECT' ? 'bg-indigo-50 text-indigo-700' : 'text-gray-500 hover:bg-gray-50'}`}>
          <BookOpen size={20} /> Add Subject
        </button>
        <button onClick={() => { setActiveTab('TIMETABLE'); setStatusMsg(''); }}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all ${activeTab === 'TIMETABLE' ? 'bg-indigo-50 text-indigo-700' : 'text-gray-500 hover:bg-gray-50'}`}>
          <Calendar size={20} /> Master Timetable
        </button>
      </div>

      {/* Form Container */}
      <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">

        {/* --- MASTER TIMETABLE VIEW --- */}
        {
          activeTab === 'MASTER_TIMETABLE' && (
            <>
              <div className="mt-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <h3 className="text-xl font-semibold text-slate-800 mb-4 border-t pt-8">Current Master Schedule</h3>

                {timeTable.length === 0 ? (
                  <div className="text-center p-8 bg-gray-50 rounded-2xl border border-dashed border-gray-300 text-gray-500">
                    No schedules have been created yet.
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-xl border border-gray-200">
                    <table className="w-full text-left text-sm text-gray-600">
                      <thead className="bg-slate-50 text-slate-800 font-medium border-b border-gray-200">
                        <tr>
                          <th className="p-4">Day</th>
                          <th className="p-4">Time</th>
                          <th className="p-4">Subject</th>
                          <th className="p-4">Teacher</th>
                          <th className="p-4">Room</th>
                          <th className="p-4">Batch</th>
                          <th className="p-4 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {timeTable.map((t, idx) => (
                          <tr key={idx} className="hover:bg-slate-50 transition-colors">
                            <td className="p-4 font-medium text-slate-700">{t.dayOfWeek}</td>
                            <td className="p-4">{t.startTime} - {t.endTime}</td>
                            <td className="p-4">
                              <span className="font-semibold text-indigo-700">{t.subject?.code}</span>
                              <br /><span className="text-xs text-gray-400">{t.subject?.name}</span>
                            </td>
                            <td className="p-4">{t.teacher?.name}</td>
                            <td className="p-4 font-mono">{t.room?.name}</td>
                            <td className="p-4">
                              {t.batch ? (
                                <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-md text-xs font-bold">{t.batch}</span>
                              ) : (
                                <span className="text-gray-400 italic text-xs">All</span>
                              )}
                            </td>
                            <td className="p-4 text-right">
                              <button
                                onClick={() => handleDelete(t)}
                                className="text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded-lg transition-colors font-medium text-xs"
                              >
                                Delete
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )
        }

        {/* ROOM FORM */}
        {activeTab === 'ROOM' && (
          <form onSubmit={(e) => handleSubmit(e, 'rooms')} className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h3 className="text-xl font-semibold text-slate-800 mb-4">Register a Physical Room</h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Room Name (e.g. L201)</label>
              <input name="name" required className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Capacity</label>
              <input name="capacity" type="number" required defaultValue={60} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Static QR Payload string</label>
              <input name="qrPayload" required className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="e.g. secret-room-code-123" />
            </div>
            <button type="submit" className="w-full py-4 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors">Create Room</button>
          </form>
        )}

        {/* SUBJECT FORM */}
        {activeTab === 'SUBJECT' && (
          <form onSubmit={(e) => handleSubmit(e, 'subjects')} className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h3 className="text-xl font-semibold text-slate-800 mb-4">Register a Course</h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Course Code</label>
              <input name="code" required className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none" placeholder="e.g. TCS-601" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Course Name</label>
              <input name="name" required className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none" placeholder="e.g. Data Structures" />
            </div>
            <button type="submit" className="w-full py-4 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700">Create Subject</button>
          </form>
        )}

        {/* TIMETABLE FORM */}
        {activeTab === 'TIMETABLE' && (
          <form onSubmit={(e) => handleSubmit(e, 'timetable')} className="grid grid-cols-2 gap-5 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h3 className="text-xl font-semibold text-slate-800 mb-2 col-span-2">Link Data into a Schedule</h3>

            <div className="col-span-2 md:col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Day of Week</label>
              <select name="dayOfWeek" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none">
                <option value="MONDAY">Monday</option><option value="TUESDAY">Tuesday</option><option value="WEDNESDAY">Wednesday</option>
                <option value="THURSDAY">Thursday</option><option value="FRIDAY">Friday</option><option value="SATURDAY">Saturday</option>
              </select>
            </div>

            <div className="col-span-2 md:col-span-1 grid grid-cols-2 gap-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
                <input name="startTime" type="time" required className="w-full p-3 bg-gray-50 border rounded-xl outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
                <input name="endTime" type="time" required className="w-full p-3 bg-gray-50 border rounded-xl outline-none" />
              </div>
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Select Teacher</label>
              <select name="teacherId" required className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none">
                <option value="" disabled selected>-- Choose a Teacher --</option>
                {teachers.map(t => <option key={t.id} value={t.id}>{t.name} ({t.email})</option>)}
              </select>
            </div>

            <div className="col-span-2 md:col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Select Subject</label>
              <select name="subjectId" required className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none">
                <option value="" disabled selected>-- Choose Subject --</option>
                {subjects.map(s => <option key={s.id} value={s.id}>{s.name} ({s.code})</option>)}
              </select>
            </div>

            <div className="col-span-2 md:col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Select Room</label>
              <select name="roomId" required className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none">
                <option value="" disabled selected>-- Choose Room --</option>
                {rooms.map(r => <option key={r.id} value={r.id}>{r.name} (Cap: {r.capacity})</option>)}
              </select>
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Select Batch (Optional)</label>
              <select name="batch" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none">
                <option value="">No Batch (Entire Class)</option>
                <option value="Group-1">Group-1</option>
                <option value="Group-2">Group-2</option>
              </select>
            </div>

            <button type="submit" className="col-span-2 mt-4 py-4 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700">Publish to Timetable</button>
          </form>
        )}

        {/* Status Message */}
        {statusMsg && (
          <div className="mt-6 p-4 bg-blue-50 text-blue-700 rounded-xl flex items-center gap-3">
            <CheckCircle size={20} /> <p className="font-medium">{statusMsg}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default HodDashboard;
