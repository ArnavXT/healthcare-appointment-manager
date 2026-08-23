import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';

import Navbar from './components/Navbar';
import AuthDrawer from './components/AuthDrawer';
import DashboardAdmin from './pages/DashboardAdmin';
import DashboardDoctor from './pages/DashboardDoctor';
import DashboardPatient from './pages/DashboardPatient';
import BookAppointment from './pages/BookAppointment';

function Home() {
  const user = JSON.parse(localStorage.getItem('user') || 'null');

  return (
    <div 
      className="min-h-screen relative flex flex-col items-center justify-center bg-cover bg-center"
      style={{ backgroundImage: "url('/bg-hospital.png')" }}
    >
      <div className="absolute inset-0 bg-white/60 backdrop-blur-sm"></div>
      
      <div className="relative z-10 max-w-4xl mx-auto px-4 text-center">
        
        <h1 className="text-5xl md:text-6xl font-extrabold text-slate-900 tracking-tight mb-6">
          Book Your Next <span className="text-blue-600">Appointment.</span>
        </h1>
        
        <p className="text-lg text-slate-700 mb-10 max-w-xl mx-auto font-medium">
          A simple way to schedule doctor visits, manage your schedule, and get helpful clinical summaries after your appointment.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          {user ? (
            <Link to="/dashboard" className="px-8 py-4 text-lg font-semibold text-white bg-blue-600 rounded-xl hover:bg-blue-700 hover:shadow-lg hover:-translate-y-1 transition-all duration-200">
              Go to your Dashboard &rarr;
            </Link>
          ) : (
            <>
              <Link to="?auth=register" className="px-8 py-4 text-lg font-semibold text-white bg-blue-600 rounded-xl hover:bg-blue-700 hover:shadow-lg hover:-translate-y-1 transition-all duration-200">
                Get Started
              </Link>
              <Link to="?auth=login" className="px-8 py-4 text-lg font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 hover:shadow-md transition-all duration-200">
                Sign In
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function Dashboard() {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  
  if (!user.role) return <div className="p-8 text-center text-slate-500">Please login first.</div>;
  
  if (user.role === 'ADMIN') return <DashboardAdmin />;
  if (user.role === 'DOCTOR') return <DashboardDoctor />;
  return <DashboardPatient />;
}

function App() {
  return (
    <Router>
      <Navbar />
      <AuthDrawer />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/book/:doctorId" element={<BookAppointment />} />
      </Routes>
    </Router>
  );
}

export default App;
