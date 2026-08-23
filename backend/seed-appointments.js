import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding appointments...');
  
  const doctors = await prisma.doctorProfile.findMany();
  const patients = await prisma.patientProfile.findMany();

  if (doctors.length === 0 || patients.length === 0) {
    console.log('Please run seed.js first to create users.');
    return;
  }

  const symptomsList = [
    'Mild fever and continuous cough for 3 days.',
    'Severe back pain when lifting objects.',
    'Skin rash on the left arm.',
    'Frequent headaches and blurred vision.',
    'Routine checkup for blood pressure.'
  ];

  let createdCount = 0;
  for (let i = 0; i < 15; i++) {
    const doc = doctors[Math.floor(Math.random() * doctors.length)];
    const pat = patients[Math.floor(Math.random() * patients.length)];
    
    // Random date in the next 14 days
    const date = new Date();
    date.setDate(date.getDate() + Math.floor(Math.random() * 14) + 1);
    date.setHours(9 + Math.floor(Math.random() * 8), 0, 0, 0); // Random hour between 9 AM and 4 PM

    const symptoms = symptomsList[Math.floor(Math.random() * symptomsList.length)];
    
    const preVisitSummary = {
      urgency: Math.random() > 0.7 ? 'High' : 'Normal',
      chiefComplaint: symptoms,
      questions: ['How long has this been happening?', 'Any past history?']
    };

    try {
      await prisma.appointment.create({
        data: {
          patientId: pat.id,
          doctorId: doc.id,
          date: date,
          symptoms: symptoms,
          preVisitSummary: preVisitSummary,
          status: Math.random() > 0.6 ? 'COMPLETED' : 'SCHEDULED',
          postVisitSummary: Math.random() > 0.6 ? { patientFriendlySummary: 'Get plenty of rest and drink fluids.', followUp: 'In 2 weeks' } : null
        }
      });
      createdCount++;
    } catch (err) {
      // Ignore unique constraint errors for double bookings
    }
  }

  console.log(`Successfully created ${createdCount} random appointments!`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
