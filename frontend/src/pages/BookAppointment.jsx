import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function BookAppointment() {
  const { doctorId } = useParams();
  const navigate = useNavigate();
  const [date, setDate] = useState('');
  const [symptoms, setSymptoms] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [appointmentId, setAppointmentId] = useState(null);
  const [holdMessage, setHoldMessage] = useState('');

  const handleHoldSlot = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post(`\${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/patient/hold`, 
        { doctorId, date },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setAppointmentId(res.data.appointmentId);
      setHoldMessage('Slot secured! You have 10 minutes to complete this form.');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to hold slot. It might be taken.');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const token = localStorage.getItem('token');
      await axios.post(`\${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/patient/book`, 
        { appointmentId, symptoms },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to confirm booking. It may have expired.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-slate-800 mb-8">Book Appointment</h1>
      
      <form onSubmit={appointmentId ? handleConfirm : handleHoldSlot} className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
        {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded text-sm font-semibold">{error}</div>}
        {holdMessage && <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded text-sm font-semibold">{holdMessage}</div>}
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-slate-700 mb-1">Date and Time</label>
          <input 
            type="datetime-local" 
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
            disabled={!!appointmentId}
            className="w-full p-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100 disabled:text-slate-500"
          />
        </div>
        
        {appointmentId && (
          <div className="mb-6">
            <label className="block text-sm font-medium text-slate-700 mb-1">Symptoms / Reason for Visit</label>
            <textarea 
              value={symptoms}
              onChange={(e) => setSymptoms(e.target.value)}
              required
              rows="4"
              className="w-full p-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Describe what you're experiencing..."
            ></textarea>
          </div>
        )}
        
        <button 
          type="submit" 
          disabled={loading}
          className={`w-full py-3 text-white font-semibold rounded-md transition disabled:opacity-50 ${appointmentId ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'}`}
        >
          {loading ? 'Processing...' : (appointmentId ? 'Confirm Booking' : 'Hold Slot')}
        </button>
      </form>
    </div>
  );
}
