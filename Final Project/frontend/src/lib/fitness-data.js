// Fitness data - static data for workouts, nutrition tips, and FAQs

export const workouts = [
  {
    id: 'weight-loss',
    title: 'Fat Burn Blitz',
    category: 'Weight Loss',
    difficulty: 'Beginner',
    duration: '30 min',
    calories: 320,
    description: 'High-energy circuit designed to torch calories and boost metabolism.',
    exercises: [
      { name: 'Jumping jacks', sets: '3 × 60s' },
      { name: 'Mountain climbers', sets: '3 × 45s' },
      { name: 'Burpees', sets: '3 × 10 reps' },
      { name: 'Plank hold', sets: '3 × 45s' },
    ],
  },
  {
    id: 'muscle-gain',
    title: 'Hypertrophy Stack',
    category: 'Muscle Gain',
    difficulty: 'Intermediate',
    duration: '55 min',
    calories: 410,
    description: 'Compound lifts with progressive overload to build lean mass.',
    exercises: [
      { name: 'Barbell bench press', sets: '4 × 8' },
      { name: 'Deadlift', sets: '4 × 6' },
      { name: 'Pull-ups', sets: '3 × 8' },
      { name: 'Overhead press', sets: '3 × 10' },
    ],
  },
  {
    id: 'home',
    title: 'Apartment Athlete',
    category: 'Home Workout',
    difficulty: 'Beginner',
    duration: '25 min',
    calories: 240,
    description: 'Zero equipment, full body — perfect for tight spaces.',
    exercises: [
      { name: 'Push-ups', sets: '4 × 12' },
      { name: 'Bodyweight squats', sets: '4 × 20' },
      { name: 'Glute bridge', sets: '3 × 15' },
      { name: 'Superman', sets: '3 × 12' },
    ],
  },
  {
    id: 'cardio',
    title: 'Endurance Engine',
    category: 'Cardio',
    difficulty: 'Intermediate',
    duration: '40 min',
    calories: 480,
    description: 'Steady-state and intervals to build a stronger heart.',
    exercises: [
      { name: 'Run / treadmill', sets: '20 min @ moderate' },
      { name: 'Sprint intervals', sets: '8 × 30s' },
      { name: 'Jump rope', sets: '5 × 90s' },
    ],
  },
  {
    id: 'strength',
    title: 'Iron Foundation',
    category: 'Strength',
    difficulty: 'Advanced',
    duration: '60 min',
    calories: 520,
    description: 'Heavy compound focus for raw strength gains.',
    exercises: [
      { name: 'Back squat', sets: '5 × 5' },
      { name: 'Romanian deadlift', sets: '4 × 6' },
      { name: 'Weighted dips', sets: '4 × 8' },
      { name: 'Barbell row', sets: '4 × 8' },
    ],
  },
  {
    id: 'beginner',
    title: 'Day One Starter',
    category: 'Beginner Fitness',
    difficulty: 'Beginner',
    duration: '20 min',
    calories: 180,
    description: 'Gentle on-ramp to build the habit and protect form.',
    exercises: [
      { name: 'Walking warm-up', sets: '5 min' },
      { name: 'Wall push-ups', sets: '3 × 10' },
      { name: 'Assisted squats', sets: '3 × 12' },
      { name: 'Cat-cow stretch', sets: '2 × 8' },
    ],
  },
];

export const nutritionTips = [
  {
    id: '1',
    title: 'Protein at every meal',
    category: 'Muscle Gain',
    body: 'Aim for 0.8–1g of protein per pound of body weight. Eggs, chicken, lentils, tofu, Greek yogurt.',
    emoji: '🥚',
  },
  {
    id: '2',
    title: 'Hydration math',
    category: 'Hydration',
    body: 'Body weight (kg) × 35ml is your daily baseline. Add 500ml per training hour.',
    emoji: '💧',
  },
  {
    id: '3',
    title: 'Smart deficit',
    category: 'Weight Loss',
    body: 'Target a 300–500 kcal daily deficit. Crash diets shred muscle, not fat.',
    emoji: '🔥',
  },
  {
    id: '4',
    title: 'Fiber first',
    category: 'Healthy Eating',
    body: '30g of fiber a day keeps cravings down and digestion smooth — oats, beans, berries.',
    emoji: '🌾',
  },
  {
    id: '5',
    title: 'Pre-workout fuel',
    category: 'Performance',
    body: 'Light carbs + protein 60–90 min before training. Banana with peanut butter is a classic.',
    emoji: '🍌',
  },
  {
    id: '6',
    title: 'Know your BMI',
    category: 'Health',
    body: 'BMI = weight(kg) / height(m)². Healthy range: 18.5–24.9. Pair with body composition for a fuller picture.',
    emoji: '📏',
  },
];

export const dailyTips = [
  { icon: '💧', text: 'Drink a glass of water within 10 minutes of waking up.' },
  { icon: '🚶', text: 'Take a 10-minute walk after lunch to spike fat oxidation.' },
  { icon: '🛌', text: 'Aim for 7–9 hours of sleep — recovery is when growth happens.' },
  { icon: '🥦', text: 'Half your plate should be vegetables at lunch and dinner.' },
  { icon: '🧘', text: 'Two minutes of deep breathing lowers cortisol noticeably.' },
  { icon: '🏋️', text: 'Track one lift per week — progressive overload beats motivation.' },
  { icon: '☀️', text: '10 minutes of morning sunlight regulates your circadian rhythm.' },
];

export const faqs = [
  {
    q: 'How often should I work out as a beginner?',
    a: 'Start with 3 sessions per week, alternating full-body strength and light cardio. Build to 4–5 once recovery feels easy.',
  },
  {
    q: 'What is BMI and is it accurate?',
    a: 'BMI = weight(kg) / height(m)². It\'s a quick screening tool but ignores muscle mass — pair it with waist measurement and how clothes fit.',
  },
  {
    q: 'Best exercises for absolute beginners?',
    a: 'Bodyweight squats, wall push-ups, glute bridges, and brisk walking. Master form before adding load.',
  },
  {
    q: 'How much water should I drink daily?',
    a: 'Roughly 35ml per kg of bodyweight, plus 500ml for every hour of intense training. Pale-yellow urine is a good signal.',
  },
  {
    q: 'How much protein do I need?',
    a: '0.8–1g per pound of bodyweight if you train. Spread across 3–4 meals for best muscle protein synthesis.',
  },
  {
    q: 'Cardio or weights for fat loss?',
    a: 'Both. Lifting preserves muscle in a deficit, cardio adds calorie burn. Lift 3×/week, add 2 cardio sessions.',
  },
];
