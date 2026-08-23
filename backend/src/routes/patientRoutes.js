import express from 'express';
import prisma from '../config/db.js';
import { authMiddleware } from '../middlewares/auth.js';
import { generatePreVisitSummary } from '../config/llm.js';
import { sendEmail } from '../config/email.js';
import { createCalendarEvent } from '../config/calendar.js';

const router = express.Router();

router.get('/doctors', authMiddleware(['PATIENT']), async (req, res) => {
  try {
    const doctors = await prisma.doctorProfile.findMany({
      include: { user: { select: { name: true, email: true } } }
    });
    res.json(doctors);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch doctors' });
  }
});

router.post('/hold', authMiddleware(['PATIENT']), async (req, res) => {
  const { doctorId, date } = req.body;
  const userId = req.user.id;

  try {
    const patientProfile = await prisma.patientProfile.findUnique({ where: { userId } });
    const doctorProfile = await prisma.doctorProfile.findUnique({ 
      where: { id: doctorId }
    });

    if (!doctorProfile) return res.status(404).json({ error: 'Doctor not found' });

    const appointmentDate = new Date(date);
    
    // Check if doctor is on leave
    const isOnLeave = doctorProfile.leaveDays.some(leaveDate => {
       const d1 = new Date(leaveDate);
       return d1.getFullYear() === appointmentDate.getFullYear() &&
              d1.getMonth() === appointmentDate.getMonth() &&
              d1.getDate() === appointmentDate.getDate();
    });

    if (isOnLeave) {
      return res.status(400).json({ error: 'Doctor is on leave on this date' });
    }

    const appointment = await prisma.appointment.create({
      data: {
        patientId: patientProfile.id,
        doctorId: doctorProfile.id,
        date: appointmentDate,
        status: 'HOLD'
      }
    });

    res.status(201).json({ message: 'Slot held', appointmentId: appointment.id });
  } catch (error) {
    if (error.code === 'P2002') { 
      return res.status(409).json({ error: 'This slot is already held or booked.' });
    }
    console.error('Hold error:', error);
    res.status(500).json({ error: 'Failed to hold slot' });
  }
});

router.post('/book', authMiddleware(['PATIENT']), async (req, res) => {
  const { appointmentId, symptoms } = req.body;
  const userId = req.user.id;

  try {
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        patient: { include: { user: true } },
        doctor: { include: { user: true } }
      }
    });

    if (!appointment || appointment.patient.userId !== userId) {
      return res.status(404).json({ error: 'Hold session not found' });
    }
    
    if (appointment.status !== 'HOLD') {
      return res.status(400).json({ error: 'Slot is not on hold or already confirmed' });
    }

    // Generate Pre-Visit Summary using LLM
    const preVisitSummary = await generatePreVisitSummary(symptoms);

    const updatedAppointment = await prisma.appointment.update({
      where: { id: appointmentId },
      data: {
        symptoms,
        preVisitSummary,
        status: 'SCHEDULED'
      }
    });

    // Create Calendar Event
    const eventId = await createCalendarEvent({
      summary: `Appointment: ${appointment.patient.user.name} with Dr. ${appointment.doctor.user.name}`,
      description: `Symptoms: ${symptoms}\nUrgency: ${preVisitSummary.urgency}`,
      startTime: appointment.date.toISOString(),
      endTime: new Date(appointment.date.getTime() + appointment.doctor.slotDuration * 60000).toISOString()
    });

    if (eventId) {
      await prisma.appointment.update({
        where: { id: appointmentId },
        data: { googleEventId: eventId }
      });
    }

    // Send Emails
    await sendEmail(appointment.patient.user.email, 'Booking Confirmed', `Your appointment with Dr. ${appointment.doctor.user.name} is confirmed for ${appointment.date.toLocaleString()}.`);
    await sendEmail(appointment.doctor.user.email, 'New Appointment', `You have a new appointment with ${appointment.patient.user.name} on ${appointment.date.toLocaleString()}.\nUrgency: ${preVisitSummary.urgency}`);

    res.status(201).json({ message: 'Appointment booked successfully', appointment: updatedAppointment });
  } catch (error) {
    console.error('Booking error:', error);
    res.status(500).json({ error: 'Failed to confirm booking' });
  }
});

router.get('/appointments', authMiddleware(['PATIENT']), async (req, res) => {
  try {
    const patientProfile = await prisma.patientProfile.findUnique({ where: { userId: req.user.id } });
    const appointments = await prisma.appointment.findMany({
      where: { patientId: patientProfile.id },
      include: { doctor: { include: { user: { select: { name: true } } } } }
    });
    res.json(appointments);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch appointments' });
  }
});

export default router;
