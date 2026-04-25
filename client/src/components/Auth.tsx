import React, { useState } from 'react';
import { supabase } from '../supabase';
import { UserCircle, Loader2 } from 'lucide-react';

const Auth = ({ onAuthSuccess }: { onAuthSuccess: (session: any) => void }) => {
   const [isLogin, setIsLogin] = useState(false);
   const [loading, setLoading] = useState(false);
   const [message, setMessage] = useState("");
   const [role,setRole]=useState("");
   

   const token = localStorage.getItem('qr_token') ?? "";

   // handle authentication
   const handleAuth = async (e: React.FormEvent) => {
      e.preventDefault();

      const formData = new FormData(e.currentTarget as HTMLFormElement);
      const { name, email, password, role, department, batch } = Object.fromEntries(formData.entries());
      // console.log(Object.fromEntries(formData.entries()));

      setLoading(true);
      setMessage("");

      try {
         if (isLogin) {
            setLoading(true);
            // login
            const res = await fetch('http://localhost:5000/api/auth/login',{
               method:'POST',
               headers:{
                  'Content-Type':'application/json'
               },
               body:JSON.stringify({
                  email:email as string,
                  password:password as string
               })
            });
            const data = await res.json();
            if(!res.ok) throw new Error(data.error || "Login failed");
         
            localStorage.setItem('qr_token', data.token);
            localStorage.setItem('qr_user', JSON.stringify(data.user));
         
            // telling App.tsx that login succeeded
            onAuthSuccess({ token: data.token, user: data.user });
            setLoading(false);
         } else {
            setLoading(true);
            const res = await fetch('http://localhost:5000/api/auth/signup',{
               method:'POST',
               headers:{
                  'Content-Type':'application/json'
               },
               body:JSON.stringify({
                  email:email as string,
                  department:department as string,
                  batch:batch as string,
                  name:name as string,
                  role:role as string,
                  password:password as string,
            
               })
            });
            const data = await res.json();
            if(!res.ok) throw new Error(data.error || "Signup failed");
         
            localStorage.setItem('qr_token', data.token);
            localStorage.setItem('qr_user', JSON.stringify(data.user));
         
            // telling App.tsx that login succeeded
            onAuthSuccess({ token: data.token, user: data.user });
            setLoading(false);
         }
      } catch (error: any) {
         setMessage(error.message || "An unexpected error occurred");
         setTimeout(() => setMessage(""), 3000);
      } finally {
         setLoading(false);
      }
   }

   return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
         <div className="max-w-md w-full bg-white p-8 rounded-3xl shadow-xl border border-slate-100 flex flex-col justify-center space-y-6">
            
            <div className='space-y-1 text-center'>
               <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <UserCircle size={32} />
               </div>
               <h2 className="text-3xl font-extrabold text-slate-800">
                  {isLogin ? 'Welcome Back' : 'Create Account'}
               </h2>
               <p className='text-slate-500'>
                  {isLogin ? 'Smart QR Attendance System' : 'Sign up to get started'}
               </p>
            </div>

            <form className='space-y-4' onSubmit={handleAuth}>
               {!isLogin && (
                  <>
                     <div>
                        <label className='block text-sm font-medium text-slate-700 mb-1'>Name</label>
                        <input required name="name" type="text" className='block w-full rounded-xl border border-slate-200 bg-gray-50 px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500' placeholder="John Doe" />
                     </div>
                     <div>
                        <label className='block text-sm font-medium text-slate-700 mb-1'>Role</label>
                        <select required value={role} onChange={(e)=>setRole(e.target.value)} name="role" className='block w-full rounded-xl border border-slate-200 bg-gray-50 px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500'>
                           <option value="" disabled>Select role</option>
                           <option value="STUDENT">Student</option>
                           <option value="TEACHER">Professor</option>
                           <option value="HOD">HOD</option>
                        </select>
                     </div>

                     {/* // DEPARTMENT */}
                     <div>
                        <label className='block text-sm font-medium text-slate-700 mb-1'>Department</label>
                        <select required name="department"  className='block w-full rounded-xl border border-slate-200 bg-gray-50 px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500' >
                           <option value="" disabled>Select Department</option>
                           <option value="CSE">Computer science and engineering</option>
                           <option value="ECE">Electronics and Communication Engineering</option>
                           <option value="EEE">Electronics and Electrical Engineering</option>
                           <option value="AIML">Artificial Intelligence and Machine Learning</option>
                           <option value="ROB">Robotics and Automation</option>
                           <option value="CHE">Chemical Engineering</option>
                           <option value="CIV">Civil Engineering</option>
                           <option value="MECH">Mechanical Engineering</option>
                           <option value="BIO">Biotechnology</option>
                        </select>
                     </div>
                     {
                        role === "STUDENT" && (
                           <div>
                              <label className='block text-sm font-medium text-slate-700 mb-1'>Batch</label>
                              <select required name="batch"  className='block w-full rounded-xl border border-slate-200 bg-gray-50 px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500' >
                                 <option value="" disabled>Select Batch</option>
                                 <option value="Group-1">Group-1</option>
                                 <option value="Group-2">Group-2</option>
                              </select>
                           </div>
                        )
                     }
                  </>
               )}

               <div>
                  <label className='block text-sm font-medium text-slate-700 mb-1'>Email</label>
                  <input required name="email" type="email" className='block w-full rounded-xl border border-slate-200 bg-gray-50 px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500' placeholder="you@college.edu" />
               </div>
               
               <div>
                  <label className='block text-sm font-medium text-slate-700 mb-1'>Password</label>
                  <input required name="password" type="password" className='block w-full rounded-xl border border-slate-200 bg-gray-50 px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500' placeholder="••••••••" />
               </div>

               {message && (
                  <div className={`p-3 text-sm rounded-lg ${message.toLowerCase().includes('success') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                     {message}
                  </div>
               )}

               <button disabled={loading} type='submit' className='w-full py-4 rounded-xl bg-blue-600 text-white font-bold text-center mt-2 hover:bg-blue-700 transition-colors flex items-center justify-center gap-2'>
                  {loading ? <Loader2 className="animate-spin" size={20} /> : (isLogin ? 'Sign In' : 'Create Account')}
               </button>
            </form>

            <p className='text-center text-sm text-gray-500 mt-4'> 
               {isLogin ? "Don't have an account? " : "Already have an account? "}
               <button type="button" className='text-blue-600 font-bold hover:underline' onClick={() => { setIsLogin(!isLogin); setMessage(''); }}>
                  {isLogin ? 'Sign up' : 'Log in'}
               </button>
            </p>

         </div>
      </div>
   );
}

export default Auth;