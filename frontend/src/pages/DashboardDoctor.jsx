import React, { useEffect, useState } from 'react';
import axios from 'axios';

export default function DashboardDoctor() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/doctor/appointments`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setAppointments(res.data);
      } catch (err) {
        console.error("Failed to fetch appointments", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAppointments();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-slate-800 mb-8">Provider Workspace</h1>
      
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
          <h2 className="text-lg font-semibold text-slate-800">Upcoming Appointments</h2>
        </div>
        
        {loading ? (
          <div className="p-6 space-y-4 animate-pulse">
            <div className="h-24 bg-slate-200 rounded-lg w-full"></div>
            <div className="h-24 bg-slate-200 rounded-lg w-full"></div>
            <div className="h-24 bg-slate-200 rounded-lg w-full"></div>
          </div>
        ) : appointments.length === 0 ? (
          <div className="p-6 text-center text-slate-500">No appointments scheduled.</div>
        ) : (
          <ul className="divide-y divide-slate-200">
            {appointments.map((apt) => (
              <li key={apt.id} className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-slate-800">{apt.patient?.user?.name || 'Patient'}</h3>
                    <p className="text-sm text-slate-500">{new Date(apt.date).toLocaleString()}</p>
                  </div>
                  <span className="px-3 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                    {apt.status}
                  </span>
                </div>
                {apt.symptoms && (
                  <div className="mb-4">
                    <p className="text-xs font-bold text-slate-500 uppercase">Reported Symptoms</p>
                    <p className="text-sm text-slate-700">{apt.symptoms}</p>
                  </div>
                )}
                {apt.preVisitSummary && (
                  <div className="bg-slate-50 p-4 rounded-md border border-slate-200">
                    <p className="text-xs font-bold text-blue-600 uppercase mb-1">AI Pre-Visit Summary</p>
                    <pre className="text-sm text-slate-700 whitespace-pre-wrap font-sans">
                      {typeof apt.preVisitSummary === 'object' ? JSON.stringify(apt.preVisitSummary, null, 2) : apt.preVisitSummary}
                    </pre>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
