// Node.js Simulation Runner for Vapi Webhooks
// Usage: Node simulate-call.js (Make sure backend is running first: npm run dev)

const URL = 'http://localhost:5001/api/v1/calls/webhook';

// Generate dynamic times to represent "Tomorrow"
const tomorrow = new Date();
tomorrow.setDate(tomorrow.getDate() + 1);
tomorrow.setHours(10, 0, 0, 0); // 10:00 AM

const payload = {
  message: {
    type: 'end-of-call-report',
    call: {
      id: 'call_sim_' + Math.random().toString(36).substr(2, 9),
      assistantId: 'vapi_asst_metro_123', // Maps to Metro Health Center
      customer: {
        number: '+1 (555) 888-0011',
      },
      type: 'inboundPhoneCall',
      duration: 94.5,
      twilioCallSid: 'SM_SIM_' + Math.random().toString(36).substr(2, 9).toUpperCase(),
    },
    transcript: 'AI: Welcome to Metro Health Center. How can I help you today?\nPatient: Hi, I want to book a cardiology checkup with Dr. Michael Chen for tomorrow morning.\nAI: Sure! I see Dr. Michael Chen has an opening at 10 AM tomorrow. Does that work?\nPatient: Yes, 10 AM tomorrow is perfect. My name is Robert Downey.\nAI: Great, Robert. I have scheduled you with Dr. Michael Chen tomorrow at 10:00 AM. You are all set.',
    summary: 'Robert Downey called to book a cardiology checkup. Scheduled with Dr. Michael Chen for tomorrow at 10:00 AM.',
    recordingUrl: 'https://actions.google.com/sounds/v1/alarms/digital_watch_alarm_long.ogg',
    analysis: {
      sentiment: 'positive',
      structuredData: {
        appointmentBooked: true,
        patientName: 'Robert Downey',
        doctorName: 'Dr. Michael Chen',
        appointmentTime: tomorrow.toISOString(),
      },
    },
  },
};

async function run() {
  console.log('Sending mock Vapi webhook call session to backend...');
  try {
    const res = await fetch(URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    
    const data = await res.json();
    console.log('Backend response status:', res.status);
    console.log('Response payload:', JSON.stringify(data, null, 2));
    
    if (res.status === 200) {
      console.log('\n======================================================================');
      console.log('SUCCESS: Webhook parsed successfully.');
      console.log('1. A new Call record has been created for Metro Health Center.');
      console.log('2. An Appointment has been auto-booked for Robert Downey with Dr. Chen.');
      console.log('======================================================================');
    }
  } catch (error) {
    console.error(
      'Connection failed. Make sure the backend server is running on port 5001. Error:',
      error.message
    );
  }
}

run();
