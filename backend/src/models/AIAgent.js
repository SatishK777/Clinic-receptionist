import mongoose from 'mongoose';

const aiAgentSchema = new mongoose.Schema(
  {
    hospitalId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Hospital',
      required: true,
      unique: true,
      index: true,
    },
    vapiAssistantId: {
      type: String,
      unique: true,
      sparse: true,
      index: true,
    },
    name: {
      type: String,
      default: 'Clinical Assistant',
    },
    systemPrompt: {
      type: String,
      required: [true, 'System prompt is required'],
      default: 'You are a warm, helpful AI front-desk receptionist for our medical clinic. Your goal is to gather patient name, phone number, choose a doctor and schedule an appointment. Use the live portal data below as the source of truth for current clinic date, timezone, doctors, hours, and availability. Crucial: You must never book an appointment for a date or time in the past. If the patient requests a past slot, inform them it has already passed and guide them to choose a future slot.',
    },
    greetingMessage: {
      type: String,
      required: [true, 'Greeting message is required'],
      default: 'Thank you for calling. This is the clinic AI receptionist. How can I help you today?',
    },
    faqs: [
      {
        question: { type: String, required: true },
        answer: { type: String, required: true },
      },
    ],
    emergencyWorkflow: {
      type: String,
      default: 'If a patient reports a life-threatening emergency, instruct them immediately to hang up and call 911.',
    },
    escalationRules: {
      transferNumber: { type: String, default: '' },
      triggerPhrases: { type: [String], default: ['speak to a human'] },
    },
    supportedLanguages: {
      type: [String],
      default: ['en'],
    },
    voiceSettings: {
      provider: { type: String, default: '11labs' },
      voiceId: { type: String, default: '21m00Tcm4TlvDq8ikWAM' }, // Rachel voice
      temperature: { type: Number, default: 0.7 },
    },
  },
  {
    timestamps: true,
  }
);

const AIAgent = mongoose.model('AIAgent', aiAgentSchema);
export default AIAgent;
