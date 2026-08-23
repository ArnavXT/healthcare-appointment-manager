import cron from 'node-cron';
import prisma from '../config/db.js';
import { sendEmail } from '../config/email.js';

// Run every day at 8:00 AM
cron.schedule('0 8 * * *', async () => {
  console.log('Running daily medication reminder job...');
  try {
    const today = new Date();
    // In a real scenario, you'd check if the prescription duration is still valid
    // Here we find completed appointments that have a medication schedule
    const appointments = await prisma.appointment.findMany({
      where: {
        status: 'COMPLETED',
        prescription: { not: null },
        postVisitSummary: { not: null }
      },
      include: { patient: { include: { user: true } } }
    });

    for (const appt of appointments) {
      if (appt.postVisitSummary && appt.postVisitSummary.medicationSchedule) {
        await sendEmail(
          appt.patient.user.email,
          'Daily Medication Reminder',
          `Hello ${appt.patient.user.name},\n\nPlease remember to take your medications today:\n${appt.postVisitSummary.medicationSchedule.join('\n')}\n\nStay healthy!`
        );
      }
    }
    console.log('Daily medication reminders sent.');
  } catch (error) {
    console.error('Error running reminder job:', error);
  }
});

// Run every 5 minutes to clean up expired slot holds (older than 10 minutes)
cron.schedule('*/5 * * * *', async () => {
  console.log('Cleaning up expired slot holds...');
  try {
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
    const result = await prisma.appointment.deleteMany({
      where: {
        status: 'HOLD',
        createdAt: {
          lt: tenMinutesAgo
        }
      }
    });
    if (result.count > 0) {
      console.log(`Deleted ${result.count} expired slot hold(s).`);
    }
  } catch (error) {
    console.error('Error cleaning up slot holds:', error);
  }
});
