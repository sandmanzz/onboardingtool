import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const generateId = () => Math.random().toString(36).substr(2, 9)

// ─── Mock Data — User A: Sunrise Bistro (Restaurant) ─────────────────────────
const MOCK_COMPANY_A = {
  name: 'Sunrise Bistro',
  industry: 'Food & Beverage',
  size: '11-50',
  website: 'https://sunrisebistro.co',
  description: 'Sunrise Bistro is a full-service restaurant known for its warm hospitality and consistent food quality. We serve breakfast and lunch daily, and our team is the heart of everything we do.',
  logo: '',
  primaryColor: '#f59e0b',
  createdAt: '2026-01-01T00:00:00.000Z',
  departments: ['Kitchen', 'Front of House', 'Management', 'Bar', 'Cashier', 'Delivery'],
}

const MOCK_PROGRAMS_A = [
  {
    id: 'prog-001',
    name: 'Kitchen Staff Onboarding',
    description: 'A 7-day onboarding program for new kitchen staff — covering food safety, kitchen stations, equipment, and daily operating procedures.',
    targetRole: 'Kitchen Staff',
    estimatedDays: '7',
    status: 'published',
    createdAt: '2026-01-15T00:00:00.000Z',
    stages: [
      {
        id: 'stage-001',
        name: 'Day 1–2: Food Safety & Personal Hygiene',
        order: 1,
        description: 'Before you touch any food, every kitchen staff member must understand our food safety standards. This protects our guests and our reputation.',
        deadline: 2,
        materials: [
          {
            id: 'mat-001',
            type: 'reading',
            title: 'Food Safety & Hygiene Standards',
            url: '',
            content: `Welcome to Sunrise Bistro!

Food safety is the foundation of everything we do. Please read the following standards carefully.

Personal Hygiene Rules:
• Always wash hands with soap for at least 20 seconds before handling food
• Wear clean uniform, hair net, and non-slip shoes at all times
• Do not work when sick — report illness to your supervisor immediately
• Keep nails short and clean; no nail polish or jewelry allowed in the kitchen

Temperature Rules:
• Cold items must be stored below 4°C (40°F)
• Hot foods must be held above 60°C (140°F)
• Never leave perishable food at room temperature for more than 2 hours

Cross-Contamination Prevention:
• Use color-coded cutting boards (Red = raw meat, Green = vegetables, Yellow = poultry)
• Never reuse utensils that touched raw meat without washing first
• Store raw meats below ready-to-eat foods in the fridge

If you ever have a question about food safety, ask your supervisor immediately — there are no silly questions when it comes to our guests' health.`,
          },
          {
            id: 'mat-002',
            type: 'checklist',
            title: 'Personal Hygiene & Uniform Checklist',
            items: [
              'Collect your uniform and non-slip kitchen shoes from management',
              'Confirm your locker assignment and store personal items safely',
              'Practice proper 20-second handwashing at the kitchen sink',
              'Learn the location of all handwashing stations in the kitchen',
              'Review the color-coded cutting board system with your supervisor',
              'Sign the Food Safety Acknowledgment form',
            ],
          },
          {
            id: 'mat-003',
            type: 'quiz',
            title: 'Food Safety Knowledge Check',
            questions: [
              {
                question: 'At what temperature must cold food be stored to prevent bacterial growth?',
                options: ['Below 10°C (50°F)', 'Below 4°C (40°F)', 'Below 0°C (32°F)', 'Below 15°C (59°F)'],
                correct: 1,
              },
              {
                question: 'Which color cutting board should you use for raw chicken?',
                options: ['Green', 'Red', 'Yellow', 'Blue'],
                correct: 2,
              },
              {
                question: 'How long should you wash your hands with soap before handling food?',
                options: ['5 seconds', '10 seconds', '20 seconds', '30 seconds'],
                correct: 2,
              },
              {
                question: 'What should you do if you feel sick before your shift?',
                options: [
                  'Come in and wear a mask',
                  'Report to your supervisor and stay home',
                  'Work your shift and take medicine',
                  'Ask a colleague to cover and tell no one',
                ],
                correct: 1,
              },
            ],
            passingScore: 75,
          },
        ],
      },
      {
        id: 'stage-002',
        name: 'Day 3–5: Kitchen Stations & Equipment',
        order: 2,
        description: 'Get familiar with our kitchen layout, stations, and how to safely operate all equipment. Safety always comes before speed.',
        deadline: 5,
        materials: [
          {
            id: 'mat-004',
            type: 'video',
            title: 'Kitchen Station Tour — Sunrise Bistro',
            url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
            duration: '12 min',
          },
          {
            id: 'mat-005',
            type: 'reading',
            title: 'Equipment Safety & Operation Manual',
            url: '',
            content: `Kitchen Equipment Safety

At Sunrise Bistro, safety is never compromised for speed. Before using any equipment, ensure you have been trained and signed off by a senior staff member.

Stove & Oven:
• Always check that burners are off before leaving the station
• Use oven mitts — never use damp towels (steam burns)
• Report any gas smell immediately to the Head Chef

Fryer:
• Never overfill the fryer basket — max 2/3 full
• Lower the basket slowly to avoid splashing hot oil
• Never leave the fryer unattended while heating

Slicer & Mandoline:
• Always use the cut-resistant glove provided
• Keep the safety guard in place at all times
• Unplug before cleaning

Fire Safety:
• Know the location of the nearest fire extinguisher
• For grease fires: NEVER use water — use the fire blanket or Class K extinguisher
• In case of fire, alert all staff and evacuate before calling emergency services`,
          },
          {
            id: 'mat-006',
            type: 'task',
            title: 'Shadow Head Chef for 1 Full Shift',
            instructions: 'Spend an entire shift shadowing the Head Chef or a designated senior cook. Observe station setup, cooking techniques, plating standards, and how the team communicates during service. You do not need to cook — just observe, ask questions, and take mental notes. Your supervisor will confirm completion at the end of the shift.',
            requiresConfirmation: true,
          },
        ],
      },
      {
        id: 'stage-003',
        name: 'Day 6–7: Daily Operations & Sign-off',
        order: 3,
        description: "You're almost ready! Complete the final procedures and official sign-off before your first independent shift.",
        deadline: 7,
        materials: [
          {
            id: 'mat-007',
            type: 'checklist',
            title: 'Daily Opening Procedures',
            items: [
              'Check in with the Head Chef and receive your station assignment',
              'Review the day\'s specials and any ingredient substitutions',
              'Inspect your station: clean surfaces, correct equipment, stocked ingredients',
              'Calibrate thermometers and confirm fridge temperatures are logged',
              'Set up mise en place before service begins',
              'Brief the team on any allergies or special dietary requests for the day',
            ],
          },
          {
            id: 'mat-008',
            type: 'document',
            title: 'Kitchen Rules & Code of Conduct — Sign-off',
            description: 'Please read the complete Kitchen Rules & Code of Conduct. Your signature confirms you understand and agree to follow all kitchen policies at Sunrise Bistro.',
            acknowledgmentRequired: true,
          },
          {
            id: 'mat-009',
            type: 'meeting',
            title: '30-Minute Check-in with Head Chef',
            with: 'Head Chef',
            durationMin: 30,
            notes: 'At the end of your first week, have a 30-minute conversation with the Head Chef. Share what went well, what felt challenging, and any questions you have. This is your safe space to ask anything.',
          },
        ],
      },
    ],
  },
  {
    id: 'prog-002',
    name: 'Front of House Staff Onboarding',
    description: 'A 5-day program for new waiters, cashiers, and host staff — covering service standards, menu knowledge, and POS system operation.',
    targetRole: 'Waiter / Cashier',
    estimatedDays: '5',
    status: 'published',
    createdAt: '2026-02-01T00:00:00.000Z',
    stages: [
      {
        id: 'stage-004',
        name: 'Day 1–2: Hospitality Standards & Menu',
        order: 1,
        description: "Our guests choose Sunrise Bistro because of how we make them feel — not just the food. Learn our service standards and menu inside out.",
        deadline: 2,
        materials: [
          {
            id: 'mat-010',
            type: 'video',
            title: 'Welcome & Guest Service Standards',
            url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
            duration: '15 min',
          },
          {
            id: 'mat-011',
            type: 'reading',
            title: 'Front of House Service Manual',
            url: '',
            content: `Sunrise Bistro — Service Standards

Greeting Guests:
• Every guest receives a smile and eye contact within 30 seconds of entering
• Standard greeting: "Welcome to Sunrise Bistro! Table for how many?"
• Seat guests promptly; if there is a wait, give an accurate estimate

Taking Orders:
• Always repeat the order back to the guest before leaving the table
• Know the top 5 allergens in every dish (ask the kitchen if unsure)
• If a guest has a special request, confirm with the kitchen before promising

Food Delivery:
• Announce each dish as you place it: "This is your Eggs Benedict — enjoy!"
• Always check back within 2 minutes of delivering food
• Offer refills proactively; never let a glass be empty

Handling Complaints:
• Never argue with a guest — listen fully before responding
• Apologize sincerely, even if the issue was not your fault
• Involve the manager for any complaint you cannot resolve yourself

Our promise: every guest should leave feeling better than when they arrived.`,
          },
          {
            id: 'mat-012',
            type: 'checklist',
            title: 'Uniform & Appearance Standards',
            items: [
              'Pick up your uniform set (2 shirts, 1 apron, name badge) from management',
              'Confirm your name badge is spelled correctly',
              'Wear black non-slip shoes — no sneakers or open-toed shoes',
              'Hair must be tied back or neatly groomed for all front-of-house shifts',
              'Practice the standard greeting with a colleague before your first shift',
              'Learn the table numbering layout for your assigned section',
            ],
          },
        ],
      },
      {
        id: 'stage-005',
        name: 'Day 3–5: POS System & Cash Handling',
        order: 2,
        description: 'Learn our point-of-sale system and cash handling procedures so every transaction is accurate and efficient.',
        deadline: 5,
        materials: [
          {
            id: 'mat-013',
            type: 'reading',
            title: 'POS System Quick Guide',
            url: '',
            content: `Sunrise Bistro POS — Quick Reference Guide

Opening the System:
1. Power on the terminal and log in with your staff PIN
2. Select your name from the server list
3. Check that the correct date and shift are shown

Taking an Order:
1. Select the table number from the floor plan view
2. Tap menu items one by one — use modifiers for special requests (e.g., "No onion")
3. Tap "Send to Kitchen" — order goes directly to the kitchen printer
4. Keep the order ticket for reference

Processing Payment:
• Card: Tap "Pay" → "Card" → Follow terminal prompts — do NOT touch the card or terminal during transaction
• Cash: Count cash in front of the guest → enter amount received → system shows change due → count change back aloud to guest
• Split bills: Use the "Split" function — divide by number of guests or by item

End-of-Shift:
1. Tap "Close Shift" and print your sales summary
2. Count your cash drawer against the printed summary
3. Any discrepancy > Rp 5,000 must be reported to the manager immediately

If you make a mistake, do not void without manager approval.`,
          },
          {
            id: 'mat-014',
            type: 'task',
            title: 'Supervised POS Practice Session',
            instructions: 'Complete at least 3 practice transactions on the training POS terminal with your trainer present. Practice one cash payment, one card payment, and one split bill. Your trainer will sign you off when they are confident you can operate the POS independently.',
            requiresConfirmation: true,
          },
          {
            id: 'mat-015',
            type: 'checklist',
            title: 'End-of-Shift Cash Out Procedure',
            items: [
              'Print and review your shift sales summary from the POS',
              'Count the physical cash in your drawer three times',
              'Record the total in the cash log sheet',
              'Report any discrepancy to the manager before leaving',
              'Return your cash drawer and keys to the manager on duty',
              'Log out of the POS system with your PIN',
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'prog-003',
    name: 'Restaurant Manager Orientation',
    description: 'A 14-day orientation for new restaurant managers covering operations, team leadership, and financial reporting.',
    targetRole: 'Restaurant Manager',
    estimatedDays: '14',
    status: 'draft',
    createdAt: '2026-03-10T00:00:00.000Z',
    stages: [
      {
        id: 'stage-006',
        name: 'Week 1: Operations & Leadership',
        order: 1,
        description: 'Understand how the restaurant runs day-to-day and how to lead your team effectively.',
        deadline: 7,
        materials: [
          {
            id: 'mat-016',
            type: 'reading',
            title: 'Manager Handbook — Operations Guide',
            url: '',
            content: `Sunrise Bistro — Manager Handbook

As a manager, you are responsible for the experience of every guest and the wellbeing of every team member on your shift.

Daily Opening Checklist (Manager):
• Arrive 45 minutes before opening
• Review reservations and any VIP or allergy notes
• Brief the full team on the day's specials and any key updates
• Confirm kitchen and FOH are stocked and stations are ready
• Unlock the entrance and flip the open sign at the correct time

During Service:
• Walk the floor every 15 minutes — visit every table at least once
• Monitor kitchen output speed — alert the Head Chef if tickets are stacking
• Handle all escalated complaints promptly and with a solution mindset
• Approve all voids and discounts in the POS

Closing Responsibilities:
• Confirm all guests have left before locking the front door
• Review end-of-day cash reports and sign off on variances
• Complete the manager log (incidents, issues, team feedback)
• Set the alarm and secure the building`,
          },
          {
            id: 'mat-017',
            type: 'meeting',
            title: 'Welcome Meeting with Area Manager',
            with: 'Area Manager',
            durationMin: 60,
            notes: 'Schedule a 1-hour introductory meeting with your Area Manager in your first week. Agenda: your background and goals, 30/60/90 day expectations, reporting cadence, and any immediate priorities.',
          },
        ],
      },
    ],
  },
]

const MOCK_EMPLOYEES_A = [
  {
    id: 'emp-001',
    name: 'Budi Hartono',
    email: 'budi.hartono@sunrisebistro.co',
    role: 'Kitchen Staff',
    department: 'Kitchen',
    startDate: '2026-07-07',
    status: 'active',
    employmentType: 'Full-time',
    manager: 'Andi Saputra',
    phone: '+62 812-3456-7890',
    location: 'Jakarta',
    notes: 'Strong learner. Has prior kitchen experience at Warung Pak Haji. Handles pressure well.',
    avatar: '',
    assignedProgramId: 'prog-001',
    completedMaterials: ['mat-001', 'mat-002', 'mat-003', 'mat-004', 'mat-005', 'mat-006'],
  },
  {
    id: 'emp-002',
    name: 'Sari Wulandari',
    email: 'sari.wulandari@sunrisebistro.co',
    role: 'Waiter',
    department: 'Front of House',
    startDate: '2026-07-10',
    status: 'active',
    employmentType: 'Full-time',
    manager: 'Andi Saputra',
    phone: '+62 857-9012-3456',
    location: 'Jakarta',
    notes: 'Needs extra support with POS system. Good customer-facing skills. Check in by end of week 2.',
    avatar: '',
    assignedProgramId: 'prog-002',
    completedMaterials: ['mat-010', 'mat-011'],
  },
  {
    id: 'emp-003',
    name: 'Ahmad Fauzi',
    email: 'ahmad.fauzi@sunrisebistro.co',
    role: 'Cashier',
    department: 'Front of House',
    startDate: '2026-06-15',
    status: 'active',
    employmentType: 'Full-time',
    manager: 'Andi Saputra',
    phone: '+62 821-4567-8901',
    location: 'Jakarta',
    notes: 'Completed onboarding ahead of schedule. Recommend for cashier team lead role.',
    avatar: '',
    assignedProgramId: 'prog-002',
    completedMaterials: ['mat-010', 'mat-011', 'mat-012', 'mat-013', 'mat-014', 'mat-015'],
  },
  {
    id: 'emp-004',
    name: 'Rina Kurnia',
    email: 'rina.kurnia@sunrisebistro.co',
    role: 'Kitchen Staff',
    department: 'Kitchen',
    startDate: '2026-07-15',
    status: 'active',
    employmentType: 'Probation',
    manager: 'Budi Hartono',
    phone: '+62 878-2345-6789',
    location: 'Jakarta',
    notes: 'First week. Monitor closely. Probation ends 2026-08-15.',
    avatar: '',
    assignedProgramId: 'prog-001',
    completedMaterials: ['mat-001'],
  },
  {
    id: 'emp-005',
    name: 'Doni Pratama',
    email: 'doni.pratama@sunrisebistro.co',
    role: 'Kitchen Staff',
    department: 'Kitchen',
    startDate: '2026-07-16',
    status: 'active',
    employmentType: 'Part-time',
    manager: 'Budi Hartono',
    phone: '+62 813-5678-9012',
    location: 'Jakarta',
    notes: 'Available Mon–Fri only. No prior restaurant experience.',
    avatar: '',
    assignedProgramId: null,
    completedMaterials: [],
  },
]

// ─── Mock Data — User B: Bloom Studio (empty / fresh) ────────────────────────
const MOCK_COMPANY_B = {
  name: 'Bloom Studio',
  industry: 'Creative Agency',
  size: '11-50',
  website: 'https://bloomstudio.co',
  description: '',
  logo: '',
  primaryColor: '#10b981',
  createdAt: '2026-07-01T00:00:00.000Z',
}

// ─── Mock Users ──────────────────────────────────────────────────────────────
export const MOCK_USERS = [
  { id: 'user-bistro', name: 'Andi Saputra', email: 'andi@sunrisebistro.co', password: 'demo123', role: 'admin', accountId: 'account-a' },
  { id: 'user-bloom', name: 'Jamie Lee', email: 'jamie@bloom.studio', password: 'demo123', role: 'admin', accountId: 'account-b' },
  { id: 'user-owner', name: 'Owen Park', email: 'admin@onboard.app', password: 'admin123', role: 'owner', accountId: null },
]

// ─── All Accounts (visible to owner panel) ───────────────────────────────────
export const ALL_ACCOUNTS = [
  { id: 'account-a', name: 'Sunrise Bistro', plan: 'Pro', owner: 'andi@sunrisebistro.co', employees: 5, programs: 3, status: 'active', joined: '2026-01-01', mrr: 49 },
  { id: 'account-b', name: 'Bloom Studio', plan: 'Free', owner: 'jamie@bloom.studio', employees: 0, programs: 0, status: 'trial', joined: '2026-02-15', mrr: 0 },
  { id: 'account-c', name: 'Meridian Health', plan: 'Pro', owner: 'ops@meridianhealth.com', employees: 12, programs: 4, status: 'active', joined: '2026-02-20', mrr: 49 },
  { id: 'account-d', name: 'Kite Logistics', plan: 'Team', owner: 'hr@kitelogistics.co', employees: 28, programs: 6, status: 'active', joined: '2026-03-05', mrr: 99 },
  { id: 'account-e', name: 'Nova Digital', plan: 'Free', owner: 'hello@novadigital.io', employees: 0, programs: 0, status: 'trial', joined: '2026-03-18', mrr: 0 },
  { id: 'account-f', name: 'Plumb & Partners', plan: 'Team', owner: 'admin@plumbpartners.com', employees: 45, programs: 8, status: 'active', joined: '2026-03-22', mrr: 99 },
]

// ─── Available Accounts (for login screen) ───────────────────────────────────
export const DEMO_ACCOUNTS = [
  {
    id: 'account-a',
    label: 'Sunrise Bistro',
    subtitle: '3 programs · 5 employees',
    description: 'A restaurant with full onboarding programs for kitchen staff and front of house — ready to explore.',
    badge: 'Sample Data',
    company: MOCK_COMPANY_A,
    programs: MOCK_PROGRAMS_A,
    employees: MOCK_EMPLOYEES_A,
  },
  {
    id: 'account-b',
    label: 'Bloom Studio',
    subtitle: 'Start from scratch',
    description: 'A blank account to see what setting up Onboard looks like from day one.',
    badge: 'Empty',
    company: MOCK_COMPANY_B,
    programs: [],
    employees: [],
  },
]

// ─── Store ────────────────────────────────────────────────────────────────────
const useStore = create(persist((set, get) => ({
  company: null,
  programs: [],
  employees: [],
  isSetupComplete: false,
  currentUser: null,
  registeredUsers: [...MOCK_USERS],

  // ── Auth ─────────────────────────────────────────────────────────────────
  login: (email, password) => {
    const users = get().registeredUsers
    const user = users.find((u) => u.email.toLowerCase() === email.toLowerCase())
    if (!user) return { success: false, error: 'No account found with this email.' }
    if (user.password !== password) return { success: false, error: 'Incorrect password.' }
    if (user.role === 'owner') {
      set({ currentUser: user, isSetupComplete: true })
    } else if (user.accountId) {
      const account = DEMO_ACCOUNTS.find((a) => a.id === user.accountId)
      if (account) {
        set({ currentUser: user, company: account.company, programs: account.programs, employees: account.employees, isSetupComplete: true })
      }
    } else {
      set({ currentUser: user, isSetupComplete: true })
    }
    return { success: true, user }
  },

  register: ({ name, email, password, companyName }) => {
    const users = get().registeredUsers
    if (users.find((u) => u.email.toLowerCase() === email.toLowerCase())) {
      return { success: false, error: 'An account with this email already exists.' }
    }
    const newUser = { id: generateId(), name, email, password, role: 'admin', accountId: null }
    const newCompany = {
      name: companyName,
      industry: '',
      size: '',
      website: '',
      description: '',
      logo: '',
      primaryColor: '#4f5fff',
      createdAt: new Date().toISOString(),
    }
    set((s) => ({
      registeredUsers: [...s.registeredUsers, newUser],
      currentUser: newUser,
      company: newCompany,
      programs: [],
      employees: [],
      isSetupComplete: true,
    }))
    return { success: true }
  },

  // ── Demo / Account switching ─────────────────────────────────────────────
  loginAs: (accountId) => {
    const account = DEMO_ACCOUNTS.find((a) => a.id === accountId)
    if (!account) return
    const demoUser = MOCK_USERS.find((u) => u.accountId === accountId) || null
    set({
      currentUser: demoUser,
      company: account.company,
      programs: account.programs,
      employees: account.employees,
      isSetupComplete: true,
    })
  },

  logout: () => set({ currentUser: null, company: null, programs: [], employees: [], isSetupComplete: false }),

  // ── Company ──────────────────────────────────────────────────────────────
  setCompany: (company) => set({ company, isSetupComplete: true }),

  updateCompany: (updates) =>
    set((s) => ({ company: { ...s.company, ...updates } })),

  addDepartment: (name) =>
    set((s) => ({
      company: {
        ...s.company,
        departments: [...(s.company.departments || []), name],
      },
    })),

  renameDepartment: (oldName, newName) =>
    set((s) => ({
      company: {
        ...s.company,
        departments: (s.company.departments || []).map((d) => (d === oldName ? newName : d)),
      },
      employees: s.employees.map((e) => (e.department === oldName ? { ...e, department: newName } : e)),
    })),

  deleteDepartment: (name) =>
    set((s) => ({
      company: {
        ...s.company,
        departments: (s.company.departments || []).filter((d) => d !== name),
      },
    })),

  // ── Programs ─────────────────────────────────────────────────────────────
  addProgram: (program) =>
    set((s) => ({
      programs: [
        ...s.programs,
        {
          id: generateId(),
          createdAt: new Date().toISOString(),
          stages: [],
          status: 'draft',
          ...program,
        },
      ],
    })),

  updateProgram: (id, updates) =>
    set((s) => ({
      programs: s.programs.map((p) => (p.id === id ? { ...p, ...updates } : p)),
    })),

  deleteProgram: (id) =>
    set((s) => ({
      programs: s.programs.filter((p) => p.id !== id),
      employees: s.employees.map((e) =>
        e.assignedProgramId === id ? { ...e, assignedProgramId: null, completedMaterials: [] } : e
      ),
    })),

  // ── Stages ───────────────────────────────────────────────────────────────
  addStage: (programId, stage) =>
    set((s) => ({
      programs: s.programs.map((p) => {
        if (p.id !== programId) return p
        return {
          ...p,
          stages: [
            ...p.stages,
            { id: generateId(), order: p.stages.length + 1, materials: [], deadline: null, ...stage },
          ],
        }
      }),
    })),

  updateStage: (programId, stageId, updates) =>
    set((s) => ({
      programs: s.programs.map((p) => {
        if (p.id !== programId) return p
        return {
          ...p,
          stages: p.stages.map((st) =>
            st.id === stageId ? { ...st, ...updates } : st
          ),
        }
      }),
    })),

  deleteStage: (programId, stageId) =>
    set((s) => ({
      programs: s.programs.map((p) => {
        if (p.id !== programId) return p
        return {
          ...p,
          stages: p.stages
            .filter((st) => st.id !== stageId)
            .map((st, i) => ({ ...st, order: i + 1 })),
        }
      }),
    })),

  addMaterial: (programId, stageId, material) =>
    set((s) => ({
      programs: s.programs.map((p) => {
        if (p.id !== programId) return p
        return {
          ...p,
          stages: p.stages.map((st) => {
            if (st.id !== stageId) return st
            return {
              ...st,
              materials: [...st.materials, { id: generateId(), ...material }],
            }
          }),
        }
      }),
    })),

  updateMaterial: (programId, stageId, materialId, updates) =>
    set((s) => ({
      programs: s.programs.map((p) => {
        if (p.id !== programId) return p
        return {
          ...p,
          stages: p.stages.map((st) => {
            if (st.id !== stageId) return st
            return {
              ...st,
              materials: st.materials.map((m) =>
                m.id === materialId ? { ...m, ...updates } : m
              ),
            }
          }),
        }
      }),
    })),

  deleteMaterial: (programId, stageId, materialId) =>
    set((s) => ({
      programs: s.programs.map((p) => {
        if (p.id !== programId) return p
        return {
          ...p,
          stages: p.stages.map((st) => {
            if (st.id !== stageId) return st
            return {
              ...st,
              materials: st.materials.filter((m) => m.id !== materialId),
            }
          }),
        }
      }),
    })),

  reorderStages: (programId, stages) =>
    set((s) => ({
      programs: s.programs.map((p) =>
        p.id === programId ? { ...p, stages } : p
      ),
    })),

  // ── Employees ─────────────────────────────────────────────────────────────
  addEmployee: (employee) =>
    set((s) => ({
      employees: [
        ...s.employees,
        {
          id: generateId(),
          assignedProgramId: null,
          completedMaterials: [],
          materialDetails: {},
          accessToken: generateId(),
          status: 'active',
          ...employee,
        },
      ],
    })),

  updateEmployee: (id, updates) =>
    set((s) => ({
      employees: s.employees.map((e) => (e.id === id ? { ...e, ...updates } : e)),
    })),

  deleteEmployee: (id) =>
    set((s) => ({ employees: s.employees.filter((e) => e.id !== id) })),

  assignProgram: (employeeId, programId) =>
    set((s) => ({
      employees: s.employees.map((e) =>
        e.id === employeeId
          ? { ...e, assignedProgramId: programId, completedMaterials: [] }
          : e
      ),
    })),

  markMaterialComplete: (employeeId, materialId) =>
    set((s) => ({
      employees: s.employees.map((e) => {
        if (e.id !== employeeId) return e
        if (e.completedMaterials.includes(materialId)) return e
        return { ...e, completedMaterials: [...e.completedMaterials, materialId] }
      }),
    })),

  recordMaterialDetail: (employeeId, materialId, detail) =>
    set((s) => ({
      employees: s.employees.map((e) =>
        e.id === employeeId
          ? { ...e, materialDetails: { ...(e.materialDetails || {}), [materialId]: detail } }
          : e
      ),
    })),

  ensureEmployeeAccess: (employeeId) => {
    const existing = get().employees.find((e) => e.id === employeeId)?.accessToken
    if (existing) return existing
    const token = generateId()
    set((s) => ({
      employees: s.employees.map((e) => (e.id === employeeId ? { ...e, accessToken: token } : e)),
    }))
    return token
  },

  duplicateProgram: (id) =>
    set((s) => {
      const program = s.programs.find((p) => p.id === id)
      if (!program) return {}
      const clone = {
        ...program,
        id: generateId(),
        name: `${program.name} (Copy)`,
        status: 'draft',
        shareToken: null,
        createdAt: new Date().toISOString(),
        stages: program.stages.map((stage) => ({
          ...stage,
          id: generateId(),
          materials: stage.materials.map((m) => ({ ...m, id: generateId() })),
        })),
      }
      return { programs: [...s.programs, clone] }
    }),

  enableShare: (programId) =>
    set((s) => ({
      programs: s.programs.map((p) =>
        p.id === programId ? { ...p, shareToken: p.shareToken || generateId() } : p
      ),
    })),

  disableShare: (programId) =>
    set((s) => ({
      programs: s.programs.map((p) => (p.id === programId ? { ...p, shareToken: null } : p)),
    })),
}), { name: 'onboarding-store' }))

export default useStore
