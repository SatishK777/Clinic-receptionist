import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import Hospital from '../models/Hospital.js';
import User from '../models/User.js';
import Doctor from '../models/Doctor.js';
import Appointment from '../models/Appointment.js';
import Call from '../models/Call.js';
import AIAgent from '../models/AIAgent.js';
import PhoneNumber from '../models/PhoneNumber.js';
import Setting from '../models/Setting.js';

dotenv.config();

const seedData = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/ai-voice-receptionist';
    await mongoose.connect(mongoUri);
    console.log('Connected to database for seeding...');

    // Clear existing data
    await Hospital.deleteMany({});
    await User.deleteMany({});
    await Doctor.deleteMany({});
    await Appointment.deleteMany({});
    await Call.deleteMany({});
    await AIAgent.deleteMany({});
    await PhoneNumber.deleteMany({});
    await Setting.deleteMany({});
    console.log('Cleared existing database entries.');

    // 1. Create Hospital
    const hospital = await Hospital.create({
      name: 'Metro Health Center',
      subdomain: 'metrohealth',
      logoUrl: '',
      timezone: 'America/New_York',
      status: 'active',
      subscription: { planId: 'pro', stripeCustomerId: 'cus_seed123' },
    });
    console.log('Created Hospital (Metro Health Center).');

    // 2. Create Admin User
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash('password123', salt);

    const admin = await User.create({
      hospitalId: hospital._id,
      name: 'Dr. Sarah Jenkins',
      email: 'admin@metrohealth.com',
      passwordHash,
      role: 'hospital-admin',
      phone: '+1 (555) 901-2345',
      status: 'active',
    });
    console.log('Created Hospital Admin (admin@metrohealth.com / password123).');

    // Create a Super Admin for global operations
    const superAdminHash = await bcrypt.hash('Sat123@_', salt);
    await User.create({
      name: 'Satish Kanaujiya',
      email: 'satishkanaujiya19@gmail.com',
      passwordHash: superAdminHash,
      role: 'super-admin',
      phone: '+1 (800) 555-0199',
      status: 'active',
    });
    console.log('Created Super Admin (satishkanaujiya19@gmail.com / Sat123@_).');

    // 3. Create Doctors
    const doctor1 = await Doctor.create({
      hospitalId: hospital._id,
      name: 'Dr. Sarah Jenkins',
      specialization: 'Pediatrics',
      email: 'sjenkins@metrohealth.com',
      phone: '+1 (555) 301-4455',
      availableHours: [
        { dayOfWeek: 'Monday', startTime: '09:00', endTime: '16:00' },
        { dayOfWeek: 'Wednesday', startTime: '09:00', endTime: '16:00' },
        { dayOfWeek: 'Friday', startTime: '09:00', endTime: '12:00' },
      ],
      consultationDuration: 30,
      status: 'active',
    });

    const doctor2 = await Doctor.create({
      hospitalId: hospital._id,
      name: 'Dr. Michael Chen',
      specialization: 'Cardiology',
      email: 'mchen@metrohealth.com',
      phone: '+1 (555) 301-4466',
      availableHours: [
        { dayOfWeek: 'Tuesday', startTime: '08:00', endTime: '17:00' },
        { dayOfWeek: 'Thursday', startTime: '08:00', endTime: '17:00' },
      ],
      consultationDuration: 45,
      status: 'active',
    });

    const doctor3 = await Doctor.create({
      hospitalId: hospital._id,
      name: 'Dr. Emily Taylor',
      specialization: 'General Medicine',
      email: 'etaylor@metrohealth.com',
      phone: '+1 (555) 301-4477',
      availableHours: [
        { dayOfWeek: 'Monday', startTime: '09:00', endTime: '17:00' },
        { dayOfWeek: 'Tuesday', startTime: '09:00', endTime: '17:00' },
        { dayOfWeek: 'Wednesday', startTime: '09:00', endTime: '17:00' },
        { dayOfWeek: 'Thursday', startTime: '09:00', endTime: '17:00' },
        { dayOfWeek: 'Friday', startTime: '09:00', endTime: '17:00' },
      ],
      consultationDuration: 20,
      status: 'active',
    });
    console.log('Created Doctors.');

    // 4. Create default AI Agent
    const aiAgent = await AIAgent.create({
      hospitalId: hospital._id,
      name: 'Clinical AI Receptionist',
      vapiAssistantId: 'vapi_asst_metro_123',
      systemPrompt: 'You are a warm, helpful AI front-desk receptionist for Metro Health Center. Your goal is to schedule checkups, take patient queries, and escalate emergency symptoms. Use the live portal data below as the source of truth for current clinic date, timezone, doctors, hours, and availability.',
      greetingMessage: 'Thank you for calling Metro Health Center. This is your clinical AI assistant. How can I help you today?',
      faqs: [
        {
          question: 'What are your hours?',
          answer: 'We are open Monday through Friday from 9 AM to 5 PM, and Saturday from 9 AM to 1 PM.',
        },
        {
          question: 'Do you take insurance?',
          answer: 'Yes, we accept major insurance plans including Blue Cross, Aetna, Cigna, and UnitedHealthcare.',
        },
      ],
      emergencyWorkflow: 'If a patient describes chest pains, severe breathing problems, or heavy bleeding, immediately tell them: "Please hang up and call 911 immediately or go to the nearest emergency room. We cannot manage critical emergencies over this line."',
      escalationRules: {
        transferNumber: '+15550009999',
        triggerPhrases: ['speak to a human', 'representative', 'operator', 'receptionist'],
      },
      supportedLanguages: ['en', 'es'],
      voiceSettings: {
        provider: '11labs',
        voiceId: '21m00Tcm4TlvDq8ikWAM',
        temperature: 0.65,
      },
    });
    console.log('Created AI Agent config.');

    // 5. Create default Phone Numbers
    await PhoneNumber.create({
      hospitalId: hospital._id,
      phoneNumber: '+15558000100',
      twilioSid: 'PN_METRO_GENERAL',
      vapiAssistantId: aiAgent._id,
      department: 'General Reception',
      status: 'active',
    });
    console.log('Created Telephony Number.');

    // 6. Create default Settings
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const businessHours = days.map((day) => ({
      dayOfWeek: day,
      isOpen: day !== 'Sunday',
      openTime: '09:00',
      closeTime: '17:00',
    }));
    await Setting.create({
      hospitalId: hospital._id,
      businessHours,
      notifications: {
        emailAlerts: true,
        smsEscalations: true,
        escalationPhone: '+1 (555) 901-2345',
      },
    });
    console.log('Created Settings.');

    // 7. Create Call Logs
    const now = Date.now();
    const calls = [
      {
        hospitalId: hospital._id,
        vapiCallId: 'call_seed_001',
        twilioCallSid: 'SM_SEED_1',
        patientPhone: '+1 (555) 123-4567',
        direction: 'inbound',
        status: 'completed',
        duration: 84,
        recordingUrl: 'https://actions.google.com/sounds/v1/alarms/digital_watch_alarm_long.ogg',
        transcript: 'AI: Thank you for calling Metro Health Center. How can I help you?\nPatient: Hi, I would like to schedule a pediatrician appointment for my son Tommy tomorrow afternoon if possible.\nAI: I can help with that. Dr. Sarah Jenkins is available at 2 PM or 3:30 PM tomorrow. Which works better?\nPatient: Let\'s do 2 PM. My name is Alice Cooper.\nAI: Great, Alice. I have scheduled Tommy Cooper with Dr. Sarah Jenkins tomorrow at 2 PM. You will receive a confirmation shortly.',
        summary: 'Alice Cooper called to schedule a checkup for her son Tommy. Booked with Dr. Sarah Jenkins tomorrow at 2:00 PM.',
        sentiment: 'positive',
        escalated: false,
        appointmentBooked: true,
        createdAt: new Date(now - 3600000 * 2), // 2 hrs ago
      },
      {
        hospitalId: hospital._id,
        vapiCallId: 'call_seed_002',
        twilioCallSid: 'SM_SEED_2',
        patientPhone: '+1 (555) 987-6543',
        direction: 'inbound',
        status: 'completed',
        duration: 42,
        recordingUrl: 'https://actions.google.com/sounds/v1/alarms/digital_watch_alarm_long.ogg',
        transcript: 'AI: Thank you for calling Metro Health Center. How can I help you today?\nPatient: Hi, I was wondering if you accept United Healthcare insurance?\nAI: Yes, we do accept United Healthcare, as well as most other major providers.\nPatient: Okay, perfect. Thank you so much!\nAI: You\'re very welcome. Have a wonderful day.',
        summary: 'Inquiry regarding United Healthcare insurance acceptance. AI confirmed acceptance. No scheduling requested.',
        sentiment: 'neutral',
        escalated: false,
        appointmentBooked: false,
        createdAt: new Date(now - 3600000 * 5), // 5 hrs ago
      },
      {
        hospitalId: hospital._id,
        vapiCallId: 'call_seed_003',
        twilioCallSid: 'SM_SEED_3',
        patientPhone: '+1 (555) 999-1111',
        direction: 'inbound',
        status: 'completed',
        duration: 110,
        recordingUrl: 'https://actions.google.com/sounds/v1/alarms/digital_watch_alarm_long.ogg',
        transcript: 'AI: Thank you for calling Metro Health Center. How can I help you?\nPatient: Hi, my prescription for amoxicillin needs a refill, and I need to speak with the doctor because my pharmacy said they need authorization.\nAI: I can check on refills. However, for active prescription authorization, you will need to speak to our medical receptionist. Would you like me to transfer you now?\nPatient: Yes, please. Put me through to a real person right away.\nAI: Connecting you now. Please hold.',
        summary: 'Patient requested prescription refill authorization. Forwarded to receptionist line for manual handling.',
        sentiment: 'negative',
        escalated: true,
        appointmentBooked: false,
        createdAt: new Date(now - 3600000 * 8), // 8 hrs ago
      },
    ];

    for (const call of calls) {
      await Call.create(call);
    }
    console.log('Created Call Logs.');

    // 8. Create Appointments
    await Appointment.create({
      hospitalId: hospital._id,
      patientName: 'Tommy Cooper',
      patientPhone: '+1 (555) 123-4567',
      doctorId: doctor1._id,
      appointmentTime: new Date(now + 86400000 + 3600000 * 2), // Tomorrow + 2 hours
      duration: 30,
      status: 'scheduled',
      source: 'ai-call',
      notes: 'Auto-booked via Call Receptionist. General checkup.',
    });

    await Appointment.create({
      hospitalId: hospital._id,
      patientName: 'Richard Miller',
      patientPhone: '+1 (555) 777-8888',
      doctorId: doctor2._id,
      appointmentTime: new Date(now - 86400000 * 2), // 2 days ago
      duration: 45,
      status: 'completed',
      source: 'receptionist',
      notes: 'Follow-up on cardiovascular charts.',
    });

    await Appointment.create({
      hospitalId: hospital._id,
      patientName: 'Emma Watson',
      patientPhone: '+1 (555) 555-4433',
      doctorId: doctor3._id,
      appointmentTime: new Date(now + 86400000 * 2), // In 2 days
      duration: 20,
      status: 'scheduled',
      source: 'portal',
      notes: 'General checkup.',
    });
    console.log('Created Appointments.');

    console.log('Database successfully seeded!');
    process.exit(0);
  } catch (error) {
    console.error(`Seeding error: ${error.message}`);
    process.exit(1);
  }
};

seedData();
