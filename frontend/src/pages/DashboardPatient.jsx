import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

export default function DashboardPatient() {
  const [appointments, setAppointments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        const [aptRes, docRes] = await Promise.all([
          axios.get(`\${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/patient/appointments`, { headers: { Authorization: `Bearer ${token}` } }),
          axios.get(`\${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/patient/doctors`, { headers: { Authorization: `Bearer ${token}` } })
        ]);
        setAppointments(aptRes.data);
        setDoctors(docRes.data);
      } catch (err) {
        console.error("Failed to fetch data", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-slate-800 mb-8">Patient Dashboard</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <h2 className="text-xl font-bold text-slate-800 mb-4">Book an Appointment</h2>
          <div className="mb-4">
            <input 
              type="text" 
              placeholder="Search by specialisation (e.g. Cardiologist)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
            />
          </div>
          <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
            {loading ? (
              <div className="space-y-4 animate-pulse">
                <div className="h-20 bg-slate-200 rounded-lg w-full"></div>
                <div className="h-20 bg-slate-200 rounded-lg w-full"></div>
              </div>
            ) : doctors.filter(doc => doc.specialization.toLowerCase().includes(searchQuery.toLowerCase())).map(doc => (
              <div key={doc.id} className="bg-white p-5 rounded-lg shadow-sm border border-slate-200 flex justify-between items-center">
                <div>
                  <h3 className="font-bold text-slate-800">Dr. {doc.user?.name?.replace(/^Dr\.\s*/i, '')}</h3>
                  <p className="text-sm text-slate-500">{doc.specialization}</p>
                </div>
                <Link to={`/book/${doc.id}`} className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700">
                  Book Slot
                </Link>
              </div>
            ))}
            {doctors.filter(doc => doc.specialization.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 && !loading && (
              <p className="text-slate-500">No doctors match your search.</p>
            )}
          </div>
        </div>

        <div>
          <h2 className="text-xl font-bold text-slate-800 mb-4">Your Appointments</h2>
          <div className="space-y-4">
            {loading ? (
              <div className="space-y-4 animate-pulse">
                <div className="h-28 bg-slate-200 rounded-lg w-full"></div>
                <div className="h-28 bg-slate-200 rounded-lg w-full"></div>
              </div>
            ) : appointments.length === 0 ? (
              <p className="text-slate-500">You have no upcoming appointments.</p>
            ) : (
              appointments.map(apt => (
                <div key={apt.id} className="bg-white p-5 rounded-lg shadow-sm border border-slate-200">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-slate-800">Dr. {apt.doctor?.user?.name?.replace(/^Dr\.\s*/i, '')}</h3>
                    <span className="text-xs font-bold px-2 py-1 bg-slate-100 rounded-full">{apt.status}</span>
                  </div>
                  <p className="text-sm text-slate-600 mb-3">{new Date(apt.date).toLocaleString()}</p>
                  
                  {apt.postVisitSummary && (
                    <div className="bg-blue-50 p-3 rounded border border-blue-100">
                      <p className="text-xs font-bold text-blue-800 mb-1">Follow-up Plan</p>
                      <p className="text-sm text-blue-900">{
                        typeof apt.postVisitSummary === 'object' ? apt.postVisitSummary.patientFriendlySummary || JSON.stringify(apt.postVisitSummary) : apt.postVisitSummary
                      }</p>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
