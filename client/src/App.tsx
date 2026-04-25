import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import { BarChart, Calendar, QrCode, ClipboardList } from "lucide-react";

import DirectorDashboard from "./components/director/DirectorDashboard";
import HodDashboard from "./components/hod/HodDashboard";
import TeacherDashboard from "./components/teacher/TeacherDashboard";
import StudentScanner from "./components/student/StudentDashboard";
import Auth from './components/Auth';
import { useState,useEffect } from "react";
// import { useNavigate } from "react-router-dom";

const App = () => {

  const [session, setSession] = useState<any>(null);
  // const navigate = useNavigate();

  useEffect(() => {
    const savedToken = localStorage.getItem('qr_token');
    const savedUser = localStorage.getItem('qr_user');
    if (savedToken && savedUser) {
      setSession({ token:savedToken, user:JSON.parse(savedUser) });
    }
  }, []);

  if(!session){
    return <Auth onAuthSuccess={(data)=>{setSession(data)}} />
  }

  const userRole = session.user.role;

  if (session && !location.pathname.includes(`/${userRole.toLowerCase()}`)) {
    window.location.replace(`/${userRole.toLowerCase()}`);
  }


  const handleLogout = () => {
    localStorage.removeItem('qr_token');
    localStorage.removeItem('qr_user');
    setSession(null);
  }
  
  return (
    <BrowserRouter>
       <nav className="p-4 bg-slate-900 text-white flex justify-between items-center">
        <div className="flex gap-6">
        {userRole === "DIRECTOR" && <Link to="/director" className="flex items-center gap-2 hover:text-blue-400"> <BarChart size={18} /> Director </Link>}
        {userRole === "HOD" && <Link to="/hod" className="flex items-center gap-2 hover:text-blue-400"> <Calendar size={18} /> HOD </Link>}
        {userRole === "TEACHER" && <Link to="/teacher" className="flex items-center gap-2 hover:text-blue-400"> <ClipboardList size={18} /> Teacher </Link>}
        {userRole==="STUDENT" && <Link to="/student" className="flex items-center gap-2 hover:text-blue-400"> <QrCode size={18} /> Student Scanner</Link>}
        </div>
        <div>
          <span className="text-gray-300 mr-4">
            {session?.user?.name} ({userRole})
          </span>
          <button onClick={handleLogout} className="bg-red-500 px-4 py-2 rounded-lg hover:bg-red-600">
            Logout
          </button>
        </div>
      </nav>

      <main>
        <Routes>
          <Route path="/auth" element={<Auth onAuthSuccess={() => { }} />} />
          <Route path="/director" element={<DirectorDashboard />} />
          <Route path="/hod" element={<HodDashboard />} />
          <Route path="/teacher" element={<TeacherDashboard />} />
          <Route path="/student" element={<StudentScanner />} />
        </Routes>
      </main>
    </BrowserRouter>
  )
}


export default App;