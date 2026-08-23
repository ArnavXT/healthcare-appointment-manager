import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database with Indian doctors and patients...');
  const hashedPassword = await bcrypt.hash('password123', 10);

  const doctorsData = [
    { name: 'Dr. Rajesh Sharma', email: 'rajesh.sharma@example.com', spec: 'Cardiologist' },
    { name: 'Dr. Priya Patel', email: 'priya.patel@example.com', spec: 'Pediatrician' },
    { name: 'Dr. Amit Kumar', email: 'amit.kumar@example.com', spec: 'Orthopedic' },
    { name: 'Dr. Sneha Desai', email: 'sneha.desai@example.com', spec: 'Dermatologist' },
    { name: 'Dr. Vikram Singh', email: 'vikram.singh@example.com', spec: 'Neurologist' },
  ];

  const patientsData = [
    { name: 'Rahul Gupta', email: 'rahul.gupta@example.com' },
    { name: 'Anjali Verma', email: 'anjali.verma@example.com' },
    { name: 'Sanjay Das', email: 'sanjay.das@example.com' },
    { name: 'Meera Reddy', email: 'meera.reddy@example.com' },
    { name: 'Rohan Mehra', email: 'rohan.mehra@example.com' },
    { name: 'Kiran Nair', email: 'kiran.nair@example.com' },
    { name: 'Aditya Joshi', email: 'aditya.joshi@example.com' },
    { name: 'Neha Kapoor', email: 'neha.kapoor@example.com' },
  ];

  // Create Doctors
  for (const doc of doctorsData) {
    const user = await prisma.user.upsert({
      where: { email: doc.email },
      update: {},
      create: {
        email: doc.email,
        name: doc.name,
        password: hashedPassword,
        role: 'DOCTOR',
        doctorProfile: {
          create: {
            specialization: doc.spec,
            workingHours: { "monday": ["09:00-17:00"], "tuesday": ["09:00-17:00"], "wednesday": ["09:00-17:00"] },
            slotDuration: 30,
            leaveDays: []
          }
        }
      }
    });
    console.log(`Created doctor: ${user.name}`);
  }

  // Create Patients
  for (const pat of patientsData) {
    const user = await prisma.user.upsert({
      where: { email: pat.email },
      update: {},
      create: {
        email: pat.email,
        name: pat.name,
        password: hashedPassword,
        role: 'PATIENT',
        patientProfile: {
          create: {}
        }
      }
    });
    console.log(`Created patient: ${user.name}`);
  }

  // Create Admin
  const admin = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      name: 'System Admin',
      password: hashedPassword,
      role: 'ADMIN',
    }
  });
  console.log(`Created admin: ${admin.name}`);

  console.log('Seeding complete! All users have password: password123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
