import React, { useMemo } from 'react';
import { User, Mail, Phone, Building, GraduationCap, Calendar, Hash, ShieldCheck, MapPin } from 'lucide-react';

const Profile = () => {
  const payload = localStorage.getItem('qr_user');
  
  const user = useMemo(() => {
    try {
      return payload ? JSON.parse(payload) : null;
    } catch (e) {
      console.error("Failed to parse user payload", e);
      return null;
    }
  }, [payload]);

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-400">
            <User size={32} />
          </div>
          <p className="text-slate-500 font-medium">No user data found. Please log in again.</p>
        </div>
      </div>
    );
  }

  const DetailItem = ({ icon: Icon, label, value, colorClass }: { icon: any, label: string, value: string | number | null, colorClass?: string }) => {
    if (value === null || value === undefined) return null;
    return (
      <div className="flex items-center gap-4 p-4 rounded-2xl bg-white border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
        <div className={`p-3 rounded-xl ${colorClass || 'bg-blue-50 text-blue-600'}`}>
          <Icon size={20} />
        </div>
        <div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{label}</p>
          <p className="text-sm font-bold text-slate-700">{value}</p>
        </div>
      </div>
    );
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 max-w-4xl mx-auto py-8 px-4">
      {/* Profile Header Card */}
      <div className="relative overflow-hidden bg-white rounded-[2.5rem] p-8 shadow-xl border border-slate-100 mb-8">
        {/* Background Decorative Circles */}
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-blue-50 rounded-full opacity-50 blur-3xl -z-10" />
        <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-indigo-50 rounded-full opacity-50 blur-3xl -z-10" />

        <div className="flex flex-col md:flex-row items-center gap-8">
          {/* Avatar Section */}
          <div className="relative">
            <div className="w-32 h-32 rounded-3xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-lg">
              <span className="text-4xl font-black uppercase">{user.name?.charAt(0)}</span>
            </div>
            <div className="absolute -bottom-2 -right-2 bg-green-500 border-4 border-white w-8 h-8 rounded-full shadow-sm" />
          </div>

          {/* User Basic Info */}
          <div className="flex-1 text-center md:text-left">
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mb-2">
              <h1 className="text-3xl font-black text-slate-800 tracking-tight">{user.name}</h1>
              <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-[10px] font-black uppercase tracking-widest">
                {user.role}
              </span>
            </div>
            <p className="text-slate-500 font-medium flex items-center justify-center md:justify-start gap-2">
              <Mail size={14} />
              {user.email}
            </p>
          </div>

          {/* Role Badge / Status */}
          <div className="hidden lg:block bg-slate-50 rounded-2xl p-4 border border-slate-100">
            <div className="flex items-center gap-3">
              <ShieldCheck className="text-green-600" size={24} />
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase">Account Status</p>
                <p className="text-xs font-bold text-slate-700">Verified Member</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <DetailItem 
          icon={Building} 
          label="Department" 
          value={user.departmentName || user.department || "University Campus"} 
          colorClass="bg-purple-50 text-purple-600"
        />
        <DetailItem 
          icon={Phone} 
          label="Contact Number" 
          value={user.contactNumber || "Not provided"} 
          colorClass="bg-green-50 text-green-600"
        />
        
        {user.role === "STUDENT" && (
          <>
            <DetailItem 
              icon={Hash} 
              label="Batch / Group" 
              value={user.batch} 
              colorClass="bg-orange-50 text-orange-600"
            />
            <DetailItem 
              icon={Calendar} 
              label="Academic Year" 
              value={user.year ? `${user.year}${user.year === 1 ? 'st' : user.year === 2 ? 'nd' : user.year === 3 ? 'rd' : 'th'} Year` : null} 
              colorClass="bg-indigo-50 text-indigo-600"
            />
            <DetailItem 
              icon={GraduationCap} 
              label="Current Semester" 
              value={user.semester ? `Semester ${user.semester}` : null} 
              colorClass="bg-pink-50 text-pink-600"
            />
          </>
        )}

        <DetailItem 
          icon={MapPin} 
          label="Location" 
          value="Academic Block" 
          colorClass="bg-amber-50 text-amber-600"
        />
      </div>

      {/* Footer / Logout Button Area */}
      <div className="mt-8 text-center">
        <p className="text-xs text-slate-400 font-medium">
          Digital ID: <span className="font-mono">{user.id?.substring(0, 8)}...</span>
        </p>
      </div>
    </div>
  );
};

export default Profile;