import React, { useEffect, useState } from 'react';
import axios from 'axios';

export default function DashboardAdmin() {
  const [stats, setStats] = useState({ totalPatients: 0, totalDoctors: 0, totalAppointments: 0 });
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [leaveDate, setLeaveDate] = useState('');
  const [actionMessage, setActionMessage] = useState('');

  // New Doctor Form States
  const [newDoc, setNewDoc] = useState({
    name: '', email: '', password: '', specialization: '', slotDuration: '30'
  });
  const [createMsg, setCreateMsg] = useState('');

  const fetchAdminData = async () => {
    try {
      const token = localStorage.getItem('token');
      const [statsRes, docRes] = await Promise.all([
        axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/admin/stats`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/admin/doctors`, { headers: { Authorization: `Bearer ${token}` } })
      ]);
      setStats(statsRes.data);
      setDoctors(docRes.data);
    } catch (err) {
      console.error("Failed to fetch admin data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handleMarkLeave = async (doctorId) => {
    if (!leaveDate) {
      setActionMessage('Please select a date first.');
      return;
    }
    try {
      setActionMessage('Processing...');
      const token = localStorage.getItem('token');
      const res = await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/admin/doctors/${doctorId}/leave`, 
        { leaveDate },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setActionMessage(res.data.message);
      setLeaveDate('');
    } catch (err) {
      setActionMessage(err.response?.data?.error || 'Failed to mark leave');
    }
  };

  const handleCreateDoctor = async (e) => {
    e.preventDefault();
    setCreateMsg('Creating...');
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/admin/doctors`, newDoc, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCreateMsg('Doctor created successfully!');
      setNewDoc({ name: '', email: '', password: '', specialization: '', slotDuration: '30' });
      fetchAdminData(); // Refresh list
      setTimeout(() => setCreateMsg(''), 3000);
    } catch (err) {
      setCreateMsg(err.response?.data?.error || 'Failed to create doctor');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-slate-800 mb-8">System Administration</h1>
      
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-pulse">
          <div className="bg-slate-200 p-6 rounded-lg h-32 w-full"></div>
          <div className="bg-slate-200 p-6 rounded-lg h-32 w-full"></div>
          <div className="bg-slate-200 p-6 rounded-lg h-32 w-full"></div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
              <h3 className="text-sm font-medium text-slate-500 uppercase tracking-wider">Total Patients</h3>
              <p className="text-4xl font-bold text-slate-800 mt-2">{stats.totalPatients || 0}</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
              <h3 className="text-sm font-medium text-slate-500 uppercase tracking-wider">Total Doctors</h3>
              <p className="text-4xl font-bold text-slate-800 mt-2">{stats.totalDoctors || 0}</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
              <h3 className="text-sm font-medium text-slate-500 uppercase tracking-wider">Appointments</h3>
              <p className="text-4xl font-bold text-slate-800 mt-2">{stats.totalAppointments || 0}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Create Doctor Form */}
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
                <h2 className="text-lg font-semibold text-slate-800">Create Doctor Profile</h2>
              </div>
              <div className="p-6">
                {createMsg && <div className={`mb-4 p-3 text-sm rounded ${createMsg.includes('success') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>{createMsg}</div>}
                
                <form onSubmit={handleCreateDoctor} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                    <input type="text" required value={newDoc.name} onChange={(e) => setNewDoc({...newDoc, name: e.target.value})} className="w-full p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                    <input type="email" required value={newDoc.email} onChange={(e) => setNewDoc({...newDoc, email: e.target.value})} className="w-full p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
                    <input type="password" required value={newDoc.password} onChange={(e) => setNewDoc({...newDoc, password: e.target.value})} className="w-full p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Specialisation</label>
                      <input type="text" required value={newDoc.specialization} onChange={(e) => setNewDoc({...newDoc, specialization: e.target.value})} placeholder="e.g. Cardiologist" className="w-full p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Slot Duration (mins)</label>
                      <input type="number" required value={newDoc.slotDuration} onChange={(e) => setNewDoc({...newDoc, slotDuration: e.target.value})} className="w-full p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500" />
                    </div>
                  </div>
                  <button type="submit" className="w-full py-2 bg-slate-800 text-white font-medium rounded-md hover:bg-slate-700 transition">Create Doctor</button>
                </form>
              </div>
            </div>

            {/* Manage Leaves */}
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
                <h2 className="text-lg font-semibold text-slate-800">Manage Doctors & Leaves</h2>
              </div>
              <div className="p-6">
                {actionMessage && <div className="mb-4 p-3 bg-blue-50 text-blue-700 text-sm rounded">{actionMessage}</div>}
                
                <div className="mb-6 bg-slate-50 p-4 rounded-md border border-slate-200">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Select Leave Date</label>
                  <input 
                    type="date" 
                    value={leaveDate}
                    onChange={(e) => setLeaveDate(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2"
                  />
                  <p className="text-xs text-slate-500">Choose a date, then click "Mark Leave" to cancel their appointments for that day.</p>
                </div>

                <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2">
                  {doctors.map(doc => (
                    <div key={doc.id} className="flex justify-between items-center p-3 border border-slate-200 rounded-lg">
                      <div>
                        <h3 className="font-bold text-slate-800 text-sm">Dr. {doc.user?.name?.replace(/^Dr\.\s*/i, '')}</h3>
                        <p className="text-xs text-slate-500">{doc.specialization}</p>
                      </div>
                      <button 
                        onClick={() => handleMarkLeave(doc.id)}
                        className="px-3 py-1.5 bg-red-600 text-white text-xs font-medium rounded hover:bg-red-700 transition"
                      >
                        Mark Leave
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
