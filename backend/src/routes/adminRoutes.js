import express from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../config/db.js';
import { authMiddleware } from '../middlewares/auth.js';
import { sendEmail } from '../config/email.js';
import { cancelCalendarEvent } from '../config/calendar.js';

const router = express.Router();

router.get('/stats', authMiddleware(['ADMIN']), async (req, res) => {
  try {
    const totalPatients = await prisma.patientProfile.count();
    const totalDoctors = await prisma.doctorProfile.count();
    const totalAppointments = await prisma.appointment.count();
    res.json({ totalPatients, totalDoctors, totalAppointments });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

router.get('/doctors', authMiddleware(['ADMIN']), async (req, res) => {
  try {
    const doctors = await prisma.doctorProfile.findMany({
      include: { user: { select: { name: true, email: true } } }
    });
    res.json(doctors);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch doctors' });
  }
});

router.post('/doctors', authMiddleware(['ADMIN']), async (req, res) => {
  const { name, email, password, specialization, slotDuration } = req.body;
  try {
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) return res.status(400).json({ error: 'Email already exists' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role: 'DOCTOR'
      }
    });

    const doctorProfile = await prisma.doctorProfile.create({
      data: {
        userId: user.id,
        specialization: specialization || 'General',
        workingHours: { "monday": ["09:00-17:00"], "tuesday": ["09:00-17:00"], "wednesday": ["09:00-17:00"], "thursday": ["09:00-17:00"], "friday": ["09:00-17:00"] },
        slotDuration: parseInt(slotDuration) || 30
      }
    });

    res.status(201).json({ message: 'Doctor created successfully', doctor: doctorProfile });
  } catch (error) {
    console.error('Error creating doctor:', error);
    res.status(500).json({ error: 'Failed to create doctor' });
  }
});

router.post('/doctors/:id/leave', authMiddleware(['ADMIN']), async (req, res) => {
  const doctorProfileId = req.params.id;
  const { leaveDate } = req.body;

  try {
    const leaveDay = new Date(leaveDate);
    
    // Update doctor's leave days
    const doctor = await prisma.doctorProfile.update({
      where: { id: doctorProfileId },
      data: {
        leaveDays: {
          push: leaveDay
        }
      },
      include: { user: true }
    });

    // Find affected appointments
    const nextDay = new Date(leaveDay);
    nextDay.setDate(nextDay.getDate() + 1);

    const affectedAppointments = await prisma.appointment.findMany({
      where: {
        doctorId: doctorProfileId,
        date: {
          gte: leaveDay,
          lt: nextDay
        },
        status: 'SCHEDULED'
      },
      include: { patient: { include: { user: true } } }
    });

    // Cancel appointments, delete calendar events, send emails
    for (const appt of affectedAppointments) {
      await prisma.appointment.update({
        where: { id: appt.id },
        data: { status: 'CANCELLED' }
      });

      if (appt.googleEventId) {
        await cancelCalendarEvent(appt.googleEventId);
      }

      await sendEmail(
        appt.patient.user.email,
        'Appointment Cancelled',
        `Dear ${appt.patient.user.name}, your appointment with Dr. ${doctor.user.name} on ${appt.date.toLocaleString()} has been cancelled due to doctor unavailability. Please book another slot.`
      );
    }

    res.json({ message: 'Leave marked and affected appointments cancelled', affectedCount: affectedAppointments.length });
  } catch (error) {
    console.error('Leave marking error:', error);
    res.status(500).json({ error: 'Failed to process leave' });
  }
});

export default router;
