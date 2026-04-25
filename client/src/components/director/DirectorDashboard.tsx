import React from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const mockAnalyticsData = [
  { branch: 'Computer Science', attendance: 85, fill: '#3b82f6' }, // blue-500
  { branch: 'Information Tech', attendance: 78, fill: '#0ea5e9' }, // sky-500
  { branch: 'Electronics', attendance: 65, fill: '#6366f1' },      // indigo-500
  { branch: 'Mechanical', attendance: 52, fill: '#8b5cf6' },       // violet-500
  { branch: 'Civil', attendance: 45, fill: '#a855f7' },            // purple-500
];

const DirectorDashboard = () => {
  return (
    <div className='space-y-6 p-6 max-w-7xl mx-auto'>

      {/* header */}
      <div>
        <h1 className='text-4xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-blue-500 via-blue-700 to cyan-500'>Director Analytics Overview</h1>
        <p className='text-gray-600 mt-2 text-lg'>Cross-departmental insights and campus-wide attendance tracking for strategic decision making.</p>
      </div>

      {/* top level metric cards */}

      <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
        <div className='bg-white p-6 rounded-2xl shadow-sm border border-slate-100'>
          <p className='text-slate-500 text-sm font-medium '>College Average</p>
          <p className="text-4xl font-bold text-slate-800 mt-2">65%</p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <p className="text-slate-500 text-sm font-medium">Top Performing Branch</p>
          <p className="text-4xl font-bold text-blue-600 mt-2">Computer Science</p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <p className="text-slate-500 text-sm font-medium">Total Active Sessions Today</p>
          <p className="text-4xl font-bold text-slate-800 mt-2">12</p>
        </div>
      </div>

      {/* animated recharts bar charts */}
      <div className='w-full h-[400px] bg-white p-6 rounded-2xl shadow-sm border border-slate-100'>
        <h3 className='text-lg font-semibold text-slate-800 mb-6'>
          Branch Wise Attendance Performance
        </h3>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={mockAnalyticsData} margin={{top:10 ,right:30, left:0, bottom:20}}>
            <CartesianGrid strokeDasharray={"3 3"} vertical={false} stroke="#e2e8f0"/>
            <XAxis axisLine={false} tick={{fill:"#64748b", fontSize:13, fontWeight:500}} tickLine={false} dataKey="branch"/>
            <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} dx={-10} />
            {/* Floating rounded tooltip on hover */}
            <Tooltip 
              cursor={{ fill: '#f8fafc' }}
              contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
            />
             {/* The actual bars with slightly rounded top corners */}
            <Bar dataKey="attendance" radius={[6, 6, 0, 0]} />

          </BarChart>
          
        </ResponsiveContainer>

      </div>
    </div>
  )
}

export default DirectorDashboard