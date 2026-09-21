// FitAI AI Coach Controller
// Connects to Google Gemini 1.5 Flash API for real conversational AI.
// Builds rich user context from MongoDB before every AI call.
// Stores conversation history in AIChatMessage collection.

const mongoose = require('mongoose');
const AIChatMessage = require('../models/AIChatMessage');
const FitnessData = require('../models/FitnessData');
const Subscription = require('../models/Subscription');
const CustomRoutine = require('../models/CustomRoutine');
const TrainerWorkoutPlan = require('../models/TrainerWorkoutPlan');
const TrainerNutritionPlan = require('../models/TrainerNutritionPlan');
const TrainerClient = require('../models/TrainerClient');

// ─── Constants ────────────────────────────────────────────────────────────────

// Max messages to send to AI (controls token / cost usage)
const MAX_CONTEXT_MESSAGES = 20;

// Max length for a single user message
const MAX_MESSAGE_LENGTH = 2000;

// Gemini model
const AI_MODEL = process.env.AI_MODEL || 'gemini-1.5-flash';

// ─── FitAI System Prompt ──────────────────────────────────────────────────────

const FITAI_SYSTEM_PROMPT = `You are FitAI Coach — the AI-powered personal fitness assistant built into the FitAI platform. You are NOT a generic chatbot. You are an integrated part of FitAI and you know exactly which features the platform provides.

## Your Identity
- Name: FitAI Coach
- Platform: FitAI — an AI-powered fitness platform
- Your purpose: Help users achieve their fitness goals through personalized guidance, workout planning, nutrition advice, recovery tips, progress analysis, and motivation.

## FitAI Platform Features (you know these exist)
- **Dashboard** — overview of goal, workouts this week, hydration, saved workouts
- **Workouts** — browse and save workout routines
- **AI Coach** — this chat interface (you are the AI Coach)
- **Nutrition** — nutrition tracking and planning
- **Progress** — log and track fitness progress over time
- **Trainers** — browse certified personal trainers
- **Trainer Messaging** — message assigned trainer directly
- **Subscription Plans** — Free, Basic, Pro (unlock advanced features)
- **Fitness Setup** — set goal, weekly target, track water intake

## Your Responsibilities
1. Fitness guidance and exercise recommendations
2. Workout planning and routine generation (personalized)
3. Nutrition guidance and meal planning
4. Hydration guidance
5. Recovery and rest advice
6. Progress analysis (using real stored data only)
7. Fitness habit coaching and motivation
8. Answering general fitness questions
9. Helping users navigate FitAI features

## Personality & Tone
- Friendly, motivating, professional, and clear
- Concise for simple questions; detailed for complex plans
- Personalized — always use the user's name and known data
- Encouraging without being repetitive
- NEVER start every response with "Focus on progressive overload..."
- NEVER inject unrelated information into every answer
- If someone says "hi", just greet them naturally — don't immediately dump fitness advice

## Response Format Rules
- Use markdown headers (###) for structured plans
- Use markdown tables for exercises with sets/reps/rest
- Use bullet points for tips and lists
- Keep simple answers short (2–5 lines)
- For plans (workout/nutrition), be detailed and structured
- Bold key terms and numbers

## Safety Rules (CRITICAL — never violate)
- You are a fitness assistant, NOT a doctor or medical professional
- NEVER diagnose medical conditions or injuries
- If user mentions chest pain, heart issues, dizziness during exercise, or severe symptoms → advise them to stop exercise immediately and seek medical evaluation
- NEVER claim certainty about the cause of pain or injury
- Recommend professional medical advice for serious symptoms
- Avoid extreme calorie restriction (never recommend below 1200 kcal for women, 1500 kcal for men without medical supervision)
- Avoid dangerous exercise recommendations
- Ask about injuries/limitations when designing workout plans
- Always add a disclaimer for personalized nutrition: "This is general guidance, not a substitute for professional dietetic advice."

## Data Integrity Rules (CRITICAL — never violate)
- ONLY use information that is explicitly provided in the user context below
- If a value is not in the user context, DO NOT invent or guess it
- If the user asks something that requires data you don't have (e.g., their weight), ask them for it
- Example of correct behavior: If weight is not stored → say "I don't have your current weight on file. Could you share it so I can personalize this?"
- Example of WRONG behavior: "Since you weigh 75 kg..." (when weight is unknown)
- Do NOT hallucinate workout history, progress records, or subscription status
- Do NOT say "I saved your workout" unless the backend actually saved it

## FitAI Feature Guidance
- When a user asks to save a workout, say: "You can save this in the Workouts section of FitAI."
- When a user asks to talk to a trainer, direct them to: "Head to the Trainers section to browse and connect with a certified trainer."
- When a user asks about their progress, use only data explicitly provided in the context.
- When a user asks about their plan/subscription, use only the actual subscription data provided.`;

// ─── Build User Context from MongoDB ──────────────────────────────────────────

async function buildUserContext(userId) {
  const lines = [];

  try {
    // User profile
    const User = require('../models/User');
    const user = await User.findById(userId).select('displayName email role').lean();
    if (user) {
      lines.push(`## User Profile`);
      lines.push(`- Name: ${user.displayName || user.email?.split('@')[0] || 'Unknown'}`);
      lines.push(`- Email: ${user.email}`);
    }
  } catch (e) {
    // ignore
  }

  try {
    // Fitness data
    const fitness = await FitnessData.findOne({ user: userId }).lean();
    if (fitness) {
      lines.push(`\n## Fitness Setup`);
      if (fitness.goal) lines.push(`- Goal: ${fitness.goal}`);
      if (fitness.weeklyTarget != null) lines.push(`- Weekly workout target: ${fitness.weeklyTarget} sessions/week`);
      if (fitness.workoutsThisWeek != null) lines.push(`- Workouts completed this week: ${fitness.workoutsThisWeek}`);
      if (fitness.waterCups != null) lines.push(`- Water intake today: ${fitness.waterCups} cups`);
      if (fitness.savedWorkouts && fitness.savedWorkouts.length > 0) {
        lines.push(`- Saved workouts: ${fitness.savedWorkouts.slice(0, 5).join(', ')}`);
      }
    } else {
      lines.push(`\n## Fitness Setup`);
      lines.push(`- No fitness setup data on file yet (ask the user for their goal, experience level, equipment, etc.)`);
    }
  } catch (e) {
    // ignore
  }

  try {
    // Subscription
    const sub = await Subscription.findOne({ user: userId }).lean();
    if (sub) {
      lines.push(`\n## Subscription`);
      lines.push(`- Plan: ${sub.planName || sub.planId || 'Free'}`);
      lines.push(`- Status: ${sub.status}`);
      if (sub.planId === 'free') {
        lines.push(`- AI Coach queries today: ${sub.dailyAiQueriesUsed || 0}/5`);
      } else if (sub.planId === 'basic') {
        lines.push(`- AI Coach queries today: ${sub.dailyAiQueriesUsed || 0}/50`);
      } else if (sub.planId === 'pro') {
        lines.push(`- AI Coach queries: Unlimited (Pro plan)`);
      }
    }
  } catch (e) {
    // ignore
  }

  try {
    // Recent custom routines (last 5, summarized)
    const routines = await CustomRoutine.find({ user: userId })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('title goal level equipment daysPerWeek completed createdAt')
      .lean();

    if (routines && routines.length > 0) {
      lines.push(`\n## Recent Custom Routines (last 5)`);
      routines.forEach((r) => {
        const status = r.completed ? '✓ completed' : 'in progress';
        lines.push(`- "${r.title}" — Goal: ${r.goal || 'N/A'}, Level: ${r.level || 'N/A'}, Equipment: ${r.equipment || 'N/A'}, ${r.daysPerWeek || '?'} days/week (${status})`);
      });
    }
  } catch (e) {
    // ignore
  }

  try {
    // Trainer-assigned workout plans
    const trainerWorkouts = await TrainerWorkoutPlan.find({ client: userId })
      .limit(3)
      .select('title goal duration schedule')
      .lean();

    if (trainerWorkouts && trainerWorkouts.length > 0) {
      lines.push(`\n## Trainer-Assigned Workout Plans`);
      trainerWorkouts.forEach((p) => {
        lines.push(`- "${p.title}" — Goal: ${p.goal || 'N/A'}, Duration: ${p.duration || 'N/A'}, Schedule: ${p.schedule || 'N/A'}`);
      });
    }
  } catch (e) {
    // ignore
  }

  try {
    // Trainer-assigned nutrition plans
    const trainerNutrition = await TrainerNutritionPlan.find({ client: userId })
      .limit(2)
      .select('title dailyCalories proteinGrams carbsGrams fatsGrams')
      .lean();

    if (trainerNutrition && trainerNutrition.length > 0) {
      lines.push(`\n## Trainer-Assigned Nutrition Plans`);
      trainerNutrition.forEach((p) => {
        lines.push(`- "${p.title}" — ${p.dailyCalories} kcal/day, Protein: ${p.proteinGrams}g, Carbs: ${p.carbsGrams}g, Fats: ${p.fatsGrams}g`);
      });
    }
  } catch (e) {
    // ignore
  }

  try {
    // Trainer connection status
    const trainerConn = await TrainerClient.findOne({ client: userId, status: 'active' })
      .populate('trainer', 'displayName specialization')
      .lean();

    if (trainerConn && trainerConn.trainer) {
      lines.push(`\n## Trainer`);
      lines.push(`- Assigned trainer: ${trainerConn.trainer.displayName || 'Unknown'}`);
      if (trainerConn.trainer.specialization) {
        lines.push(`- Specialization: ${trainerConn.trainer.specialization}`);
      }
      lines.push(`- You can message your trainer from the Dashboard.`);
    }
  } catch (e) {
    // ignore
  }

  return lines.length > 0 ? lines.join('\n') : 'No user data available yet.';
}

// ─── Call Gemini API ──────────────────────────────────────────────────────────

async function callGeminiAPI(systemPrompt, conversationHistory) {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured in environment variables.');
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${AI_MODEL}:generateContent?key=${apiKey}`;

  // Convert OpenAI-style roles to Gemini roles: 'assistant' → 'model'
  const contents = conversationHistory.map((msg) => ({
    role: msg.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: msg.content }],
  }));

  const body = {
    system_instruction: {
      parts: [{ text: systemPrompt }],
    },
    contents,
    generationConfig: {
      temperature: 0.7,
      topK: 40,
      topP: 0.95,
      maxOutputTokens: 2048,
    },
    safetySettings: [
      { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
    ],
  };

  const fetchRes = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(30000), // 30s timeout
  });

  if (!fetchRes.ok) {
    const errData = await fetchRes.json().catch(() => ({}));
    const errMsg = errData?.error?.message || `Gemini API error: ${fetchRes.status}`;
    console.error('Gemini API error:', errMsg);
    throw new Error(errMsg);
  }

  const data = await fetchRes.json();

  // Extract text from Gemini response
  const candidate = data?.candidates?.[0];
  if (!candidate) throw new Error('No candidates returned from Gemini API.');

  // Check finish reason
  if (candidate.finishReason === 'SAFETY') {
    throw new Error('Response blocked by safety filters. Please rephrase your question.');
  }

  const text = candidate?.content?.parts?.[0]?.text;
  if (!text) throw new Error('Empty response from Gemini API.');

  return text.trim();
}

// ─── POST /api/chat — Main AI Chat Endpoint ───────────────────────────────────

// @desc    Chat with FitAI AI Coach (real Gemini LLM)
// @route   POST /api/chat
// @access  Optional Auth (subscription middleware handles limits)
const chatWithCoach = async (req, res) => {
  try {
    const { message, conversationId } = req.body;

    // Validate message
    if (!message || typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({ message: 'Message is required.' });
    }

    const trimmedMessage = message.trim().slice(0, MAX_MESSAGE_LENGTH);

    // Determine conversation session ID
    const userId = req.user?._id;
    let sessionId = conversationId;

    if (!sessionId) {
      sessionId = new mongoose.Types.ObjectId().toString();
    }

    // Build system prompt with user-specific context
    let userContext = 'No user context available (guest user).';
    if (userId) {
      try {
        userContext = await buildUserContext(userId);
      } catch (e) {
        console.warn('Failed to build user context:', e.message);
      }
    }

    const fullSystemPrompt = `${FITAI_SYSTEM_PROMPT}

---

## Current User Context (from FitAI database — use this data, do not invent anything not listed here)

${userContext}

---

Important: Only reference information listed above. If the user asks about data not listed, ask them for it directly.`;

    // Load conversation history from MongoDB (last N messages)
    let dbHistory = [];
    if (userId) {
      dbHistory = await AIChatMessage.find({ userId, conversationId: sessionId })
        .sort({ createdAt: 1 })
        .limit(MAX_CONTEXT_MESSAGES)
        .select('role content')
        .lean();
    }

    // Build history array for Gemini (must alternate user/model; start with user)
    // Include stored history + new user message
    const historyForAI = [
      ...dbHistory.map((m) => ({ role: m.role, content: m.content })),
      { role: 'user', content: trimmedMessage },
    ];

    // Call Gemini API
    let aiReply;
    try {
      aiReply = await callGeminiAPI(fullSystemPrompt, historyForAI);
    } catch (aiErr) {
      console.error('Gemini API call failed:', aiErr.message);

      // Return a clean error — do NOT fake a response
      const isKeyMissing = aiErr.message.includes('GEMINI_API_KEY');
      const isRateLimit = aiErr.message.includes('429') || aiErr.message.toLowerCase().includes('quota');
      const isSafety = aiErr.message.includes('safety');

      let clientMessage = 'AI Coach is temporarily unavailable. Please try again in a moment.';
      if (isKeyMissing) clientMessage = 'AI Coach is not yet configured. Please contact support.';
      else if (isRateLimit) clientMessage = 'AI Coach is experiencing high demand right now. Please wait a moment and try again.';
      else if (isSafety) clientMessage = aiErr.message;

      return res.status(503).json({
        success: false,
        message: clientMessage,
        errorType: isKeyMissing ? 'config' : isRateLimit ? 'rateLimit' : 'unavailable',
      });
    }

    // Persist messages to MongoDB (only for authenticated users)
    if (userId) {
      try {
        await AIChatMessage.insertMany([
          { userId, conversationId: sessionId, role: 'user', content: trimmedMessage },
          { userId, conversationId: sessionId, role: 'assistant', content: aiReply },
        ]);
      } catch (saveErr) {
        console.error('Failed to save chat messages:', saveErr.message);
        // Continue — don't fail the response just because history save failed
      }
    }

    return res.json({
      success: true,
      conversationId: sessionId,
      message: {
        role: 'assistant',
        content: aiReply,
      },
    });
  } catch (error) {
    console.error('chatWithCoach error:', error);
    res.status(500).json({ message: 'Server error during AI chat. Please try again.' });
  }
};

// ─── GET /api/chat/history/:conversationId — Load Conversation ────────────────

// @desc    Get conversation history for a session
// @route   GET /api/chat/history/:conversationId
// @access  Private
const getConversationHistory = async (req, res) => {
  try {
    const userId = req.user._id;
    const { conversationId } = req.params;

    if (!conversationId) {
      return res.status(400).json({ message: 'conversationId is required.' });
    }

    const messages = await AIChatMessage.find({ userId, conversationId })
      .sort({ createdAt: 1 })
      .limit(100)
      .select('role content createdAt')
      .lean();

    return res.json({ success: true, conversationId, messages });
  } catch (error) {
    console.error('getConversationHistory error:', error);
    res.status(500).json({ message: 'Server error retrieving conversation.' });
  }
};

// ─── POST /api/chat/new — Start New Conversation ─────────────────────────────

// @desc    Create a new conversation session ID
// @route   POST /api/chat/new
// @access  Private
const newConversation = async (req, res) => {
  try {
    const conversationId = new mongoose.Types.ObjectId().toString();
    return res.json({ success: true, conversationId });
  } catch (error) {
    console.error('newConversation error:', error);
    res.status(500).json({ message: 'Server error creating new conversation.' });
  }
};

// ─── DELETE /api/chat/history/:conversationId — Clear Conversation ────────────

// @desc    Delete all messages in a conversation
// @route   DELETE /api/chat/history/:conversationId
// @access  Private
const clearConversation = async (req, res) => {
  try {
    const userId = req.user._id;
    const { conversationId } = req.params;

    if (!conversationId) {
      return res.status(400).json({ message: 'conversationId is required.' });
    }

    const result = await AIChatMessage.deleteMany({ userId, conversationId });

    return res.json({
      success: true,
      message: `Cleared ${result.deletedCount} messages.`,
    });
  } catch (error) {
    console.error('clearConversation error:', error);
    res.status(500).json({ message: 'Server error clearing conversation.' });
  }
};

// ─── POST /api/chat/generate-routine — AI Routine Generator ──────────────────

// @desc    Generate a custom workout routine via Gemini
// @route   POST /api/chat/generate-routine
// @access  Private (Basic/Pro plan required — enforced by route middleware)
const generateCustomRoutine = async (req, res) => {
  try {
    const routineData = req.body || {};
    const userId = req.user?._id;

    const prompt = `Generate a detailed, structured custom workout routine with these specifications:
- Goal: ${routineData.goal || 'General Fitness'}
- Experience Level: ${routineData.level || 'Beginner'}
- Available Equipment: ${routineData.equipment || 'Bodyweight only'}
- Training Days Per Week: ${routineData.daysPerWeek || 3}
- Session Duration: ${routineData.timeMin || 30} minutes
- Focus Area: ${routineData.focus || 'Full body'}
- Injuries or Limitations: ${routineData.injuries || 'None'}
- Intensity Level: ${routineData.intensity || 'Moderate'}
- Additional Notes: ${routineData.notes || 'None'}

Format the response exactly like this:
### [Descriptive Routine Title]

**Goal:** [goal] · **Level:** [level] · **Duration:** [X] min · **Equipment:** [equipment]

**Warm-up (5 min)**
- [movement] — [duration/reps]
- [movement] — [duration/reps]
- [movement] — [duration/reps]

**Main Sets**
| Exercise | Sets | Reps | Rest |
|---|---|---|---|
| [Exercise Name] | [X] | [X–X reps] | [Xs] |

**Cool-down (3–5 min)**
- [movement] — [duration]

**Coach Notes:**
[Brief coaching cues and technique advice]`;

    // Build system prompt for routine generation
    let userContext = '';
    if (userId) {
      try {
        userContext = await buildUserContext(userId);
      } catch (e) {
        // ignore
      }
    }

    const routineSystemPrompt = `${FITAI_SYSTEM_PROMPT}

${userContext ? `## User Context\n${userContext}` : ''}`;

    let content;
    try {
      content = await callGeminiAPI(routineSystemPrompt, [
        { role: 'user', content: prompt },
      ]);
    } catch (aiErr) {
      console.error('Gemini routine generation failed:', aiErr.message);
      return res.status(503).json({
        message: 'AI routine generation is temporarily unavailable. Please try again.',
      });
    }

    // Extract title from first ### heading
    const titleMatch = content.match(/^###\s+(.+)$/m);
    const title = titleMatch ? titleMatch[1].trim() : 'Custom Routine';

    return res.json({ title, content });
  } catch (error) {
    console.error('generateCustomRoutine error:', error);
    res.status(500).json({ message: 'Server error generating routine.' });
  }
};

module.exports = {
  chatWithCoach,
  getConversationHistory,
  newConversation,
  clearConversation,
  generateCustomRoutine,
};
