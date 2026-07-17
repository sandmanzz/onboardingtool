// Starter templates so a new company can begin from something real instead of a blank page.
// Selecting one creates a full draft program the admin can immediately customize.

export const PROGRAM_TEMPLATES = [
  {
    id: 'restaurant-kitchen',
    icon: '👨‍🍳',
    category: 'Restaurant',
    name: 'Kitchen Staff Onboarding',
    description: 'A 7-day onboarding covering food safety, kitchen stations, equipment, and daily operating procedures.',
    targetRole: 'Kitchen Staff',
    estimatedDays: '7',
    stages: [
      {
        name: 'Day 1–2: Food Safety & Hygiene',
        description: 'Every kitchen staff member must understand food safety standards before touching any food.',
        deadline: 2,
        materials: [
          {
            type: 'reading',
            title: 'Food Safety & Hygiene Standards',
            content: 'Personal Hygiene Rules:\n• Wash hands with soap for at least 20 seconds before handling food\n• Wear a clean uniform, hair net, and non-slip shoes at all times\n• Never work while sick — report illness to your supervisor immediately\n\nTemperature Rules:\n• Cold items must be stored below 4°C (40°F)\n• Hot foods must be held above 60°C (140°F)\n• Never leave perishable food at room temperature for more than 2 hours',
          },
          {
            type: 'checklist',
            title: 'Personal Hygiene & Uniform Checklist',
            items: [
              { text: 'Collect your uniform and non-slip shoes from management', description: '', photoRequired: false },
              { text: 'Confirm your locker assignment', description: '', photoRequired: false },
              { text: 'Practice proper 20-second handwashing at the kitchen sink', description: '', photoRequired: false },
              { text: 'Review the color-coded cutting board system with your supervisor', description: '', photoRequired: false },
            ],
          },
          {
            type: 'quiz',
            title: 'Food Safety Knowledge Check',
            passingScore: 75,
            questions: [
              {
                question: 'At what temperature must cold food be stored?',
                options: ['Below 10°C (50°F)', 'Below 4°C (40°F)', 'Below 0°C (32°F)', 'Below 15°C (59°F)'],
                correct: 1,
              },
              {
                question: 'How long should you wash your hands before handling food?',
                options: ['5 seconds', '10 seconds', '20 seconds', '30 seconds'],
                correct: 2,
              },
            ],
          },
        ],
      },
      {
        name: 'Day 3–7: Stations, Equipment & Sign-off',
        description: 'Get familiar with the kitchen layout and safely operate equipment before your first independent shift.',
        deadline: 7,
        materials: [
          {
            type: 'task',
            title: 'Shadow a Senior Cook for 1 Full Shift',
            instructions: 'Spend an entire shift observing a senior cook — station setup, cooking techniques, and how the team communicates during service. You do not need to cook, just observe and ask questions.',
            requiresConfirmation: true,
          },
          {
            type: 'document',
            title: 'Kitchen Rules & Code of Conduct — Sign-off',
            description: 'Please read the complete kitchen rules and code of conduct. Your signature confirms you understand and agree to follow all kitchen policies.',
            acknowledgmentRequired: true,
          },
          {
            type: 'meeting',
            title: '30-Minute Check-in with Head Chef',
            with: 'Head Chef',
            durationMin: 30,
            notes: 'Share what went well, what felt challenging, and any questions you have.',
          },
        ],
      },
    ],
  },
  {
    id: 'restaurant-foh',
    icon: '🧑‍🍽️',
    category: 'Restaurant',
    name: 'Front of House Onboarding',
    description: 'A 5-day program for waiters, cashiers, and host staff covering service standards, menu knowledge, and POS operation.',
    targetRole: 'Waiter / Cashier',
    estimatedDays: '5',
    stages: [
      {
        name: 'Day 1–2: Hospitality Standards & Menu',
        description: 'Guests choose us because of how we make them feel — not just the food.',
        deadline: 2,
        materials: [
          {
            type: 'reading',
            title: 'Service Standards',
            content: 'Greeting Guests:\n• Every guest receives a smile and eye contact within 30 seconds\n• Seat guests promptly; give an accurate wait estimate\n\nTaking Orders:\n• Always repeat the order back to the guest\n• Know the top allergens in every dish\n\nHandling Complaints:\n• Never argue with a guest — listen fully before responding\n• Involve a manager for anything you cannot resolve yourself',
          },
          {
            type: 'checklist',
            title: 'Uniform & Appearance Standards',
            items: [
              { text: 'Pick up your uniform set and name badge', description: '', photoRequired: false },
              { text: 'Confirm your name badge is spelled correctly', description: '', photoRequired: false },
              { text: 'Practice the standard greeting with a colleague', description: '', photoRequired: false },
            ],
          },
        ],
      },
      {
        name: 'Day 3–5: POS System & Cash Handling',
        description: 'Learn the point-of-sale system so every transaction is accurate and efficient.',
        deadline: 5,
        materials: [
          {
            type: 'task',
            title: 'Supervised POS Practice Session',
            instructions: 'Complete at least 3 practice transactions with your trainer present — one cash payment, one card payment, and one split bill.',
            requiresConfirmation: true,
          },
          {
            type: 'checklist',
            title: 'End-of-Shift Cash Out Procedure',
            items: [
              { text: 'Print and review your shift sales summary', description: '', photoRequired: false },
              { text: 'Count the physical cash in your drawer', description: 'Count twice and log the total before reporting any discrepancy.', photoRequired: true },
              { text: 'Return your cash drawer and keys to the manager on duty', description: '', photoRequired: false },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'retail-associate',
    icon: '🛍️',
    category: 'Retail',
    name: 'Store Associate Onboarding',
    description: 'A 5-day onboarding for retail sales associates covering store standards, POS, and customer service.',
    targetRole: 'Sales Associate',
    estimatedDays: '5',
    stages: [
      {
        name: 'Day 1–2: Store Standards & Product Knowledge',
        description: 'Get comfortable with the store layout and how we represent the brand.',
        deadline: 2,
        materials: [
          {
            type: 'reading',
            title: 'Brand & Customer Service Standards',
            content: 'Every customer should be greeted within 30 seconds of entering. Know your top-selling products and be ready to answer common questions. Never leave the sales floor unattended during store hours.',
          },
          {
            type: 'checklist',
            title: 'Store Opening Checklist',
            items: [
              { text: 'Unlock and do a walkthrough of the sales floor', description: '', photoRequired: false },
              { text: 'Check that displays are fully stocked and tidy', description: 'Take a photo of the front display table once set up.', photoRequired: true },
              { text: 'Turn on POS terminals and confirm they are online', description: '', photoRequired: false },
            ],
          },
        ],
      },
      {
        name: 'Day 3–5: POS, Returns & Sign-off',
        description: 'Learn to process sales, returns, and exchanges confidently.',
        deadline: 5,
        materials: [
          {
            type: 'task',
            title: 'Supervised Register Practice',
            instructions: 'Process at least 5 practice transactions with your trainer, including one return and one exchange.',
            requiresConfirmation: true,
          },
          {
            type: 'document',
            title: 'Store Policy & Code of Conduct — Sign-off',
            description: 'Please read the complete store policy handbook. Your signature confirms you understand and agree to follow it.',
            acknowledgmentRequired: true,
          },
        ],
      },
    ],
  },
  {
    id: 'office-general',
    icon: '💼',
    category: 'Office',
    name: 'General Office Onboarding',
    description: 'A 5-day onboarding for new office/administrative hires covering company basics, tools, and team introductions.',
    targetRole: 'Office Staff',
    estimatedDays: '5',
    stages: [
      {
        name: 'Day 1–2: Welcome & Company Basics',
        description: 'Get oriented with the company, your team, and where to find things.',
        deadline: 2,
        materials: [
          {
            type: 'reading',
            title: 'Company Handbook Overview',
            content: 'Welcome to the team! This covers working hours, communication norms, time-off requests, and who to contact for IT or HR questions.',
          },
          {
            type: 'checklist',
            title: 'Day 1 Setup Checklist',
            items: [
              { text: 'Collect your equipment (laptop, access card)', description: '', photoRequired: false },
              { text: 'Set up your email and company chat account', description: '', photoRequired: false },
              { text: 'Meet your direct manager and immediate team', description: '', photoRequired: false },
            ],
          },
        ],
      },
      {
        name: 'Day 3–5: Role Deep-dive & Check-in',
        description: 'Get comfortable with your specific role and tools.',
        deadline: 5,
        materials: [
          {
            type: 'task',
            title: 'Shadow a Teammate for Half a Day',
            instructions: 'Spend half a day observing a teammate in a similar role to understand day-to-day workflows.',
            requiresConfirmation: true,
          },
          {
            type: 'meeting',
            title: '30-Minute Check-in with Manager',
            with: 'Direct Manager',
            durationMin: 30,
            notes: 'Discuss first impressions, 30/60/90-day goals, and any early questions.',
          },
        ],
      },
    ],
  },
]
