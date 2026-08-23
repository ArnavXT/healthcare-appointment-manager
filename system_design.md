# Healthcare Appointment Manager: System Design & Architecture

This document provides a high-level architectural overview of the Healthcare Appointment Manager, specifically detailing the mechanisms implemented to ensure data integrity, conflict resolution, and fault tolerance across the platform.

## 1. Double-Booking Prevention

In a high-concurrency healthcare environment, preventing double-bookings is mission-critical. Relying solely on application-level checks (e.g., querying the database to see if a slot is free before inserting) introduces race conditions where two concurrent requests could theoretically book the exact same slot.

To absolutely guarantee that a double-booking can never occur, we enforced this at the **Database Engine Level** using PostgreSQL and Prisma.

Our `Appointment` model in the Prisma schema includes a compound unique constraint:
`@@unique([doctorId, date])`

Because `date` represents the exact start timestamp of the appointment slot, this constraint ensures that PostgreSQL will physically reject any attempt to insert a second appointment for the same doctor at the same exact time. 
If a race condition occurs, the database throws a `P2002 Unique Constraint Violation`. Our Express backend catches this specific error code and gracefully returns a `409 Conflict` HTTP response, prompting the user that the slot was just taken.

## 2. Slot Hold Mechanism

While the unique constraint prevents double-bookings, it creates a poor user experience if a patient spends 5 minutes typing out their symptoms only to find out the slot was taken while they were typing.

To solve this, we implemented a **Slot Hold Mechanism**:
1. **The Hold Request**: When a patient selects a time slot and clicks "Hold Slot", the frontend immediately fires a request to `POST /api/patient/hold`.
2. **Database Lock**: The backend instantly creates an `Appointment` record in the database with the status set to `HOLD` rather than `SCHEDULED`. Because this still utilizes the `@@unique([doctorId, date])` constraint, it effectively locks the slot for that specific patient.
3. **The Confirmation**: The patient can now take their time filling out the symptom form. When they click "Confirm Booking", a request is sent to `POST /api/patient/book` which updates the existing `HOLD` record with their symptoms and changes the status to `SCHEDULED`.
4. **Automated Cleanup**: If the patient abandons the page or takes too long, a `node-cron` background job runs every 5 minutes. It queries the database for any `HOLD` appointments where the `createdAt` timestamp is older than 10 minutes and hard-deletes them, releasing the slot back to the public pool.

## 3. Doctor Leave Conflict Handling

Doctors occasionally need to take unexpected time off, which immediately conflicts with their existing schedule. 

Our system handles this gracefully through the Admin Dashboard:
1. **Leave Registration**: An Admin can select a specific date and mark a doctor as "On Leave" via `POST /api/admin/doctors/:id/leave`.
2. **Profile Update**: The selected `leaveDate` is pushed to an array of `leaveDays` on the `DoctorProfile`. During the standard booking flow, the backend cross-references the requested appointment date against this array and blocks any new bookings for that day.
3. **Conflict Resolution**: The system doesn't stop at blocking new bookings. It automatically queries the database for all *existing* appointments (`status: 'SCHEDULED'`) for that specific doctor on that specific date.
4. **Automated Teardown**: In a single loop, the system:
   - Updates all conflicting appointments to `status: 'CANCELLED'`.
   - Fires a request to the Google Calendar API to delete the active calendar events.
   - Dispatches automated cancellation emails to the affected patients, instructing them to book a new slot.

## 4. Notification Failure Handling

Automated emails (booking confirmations, cancellations, daily medication reminders) are subject to network unreliability, API rate limits, and third-party downtime (e.g., SendGrid/Gmail outages). 

To ensure critical communications are not permanently lost due to a transient network glitch, we implemented an **Asynchronous Retry Loop** in our `email.js` configuration.

When `sendEmail(to, subject, text)` is invoked, it does not immediately fail if `nodemailer` throws an error. Instead:
- It operates within a `while` loop configured for a maximum of 3 retries.
- If an email transmission fails, the catch block increments the attempt counter and initiates a non-blocking delay (`await new Promise(res => setTimeout(res, 2000))`) to wait 2 seconds.
- It then attempts the transmission again.
- Only if the transmission fails 3 consecutive times does it finally log a terminal failure, ensuring that minor network hiccups are seamlessly absorbed by the system without crashing the main application thread or requiring manual intervention.
