import { create } from 'zustand'

const generateId = () => Math.random().toString(36).substr(2, 9)

// ─── Mock Data — User A: Stride Technologies (populated) ──────────────────────
const MOCK_COMPANY_A = {
  name: 'Stride Technologies',
  industry: 'Technology',
  size: '51-200',
  website: 'https://stridetechnologies.io',
  description: 'Stride Technologies builds developer tools and productivity software for modern engineering teams. We are a remote-first company with a strong culture of ownership, transparency, and continuous learning.',
  logo: '',
  primaryColor: '#4f5fff',
  createdAt: '2026-01-01T00:00:00.000Z',
}

const MOCK_PROGRAMS_A = [
  {
    id: 'prog-001',
    name: 'Software Engineer Onboarding',
    description: 'A 30-day program to ramp up new software engineers — from company culture and values to shipping your first pull request to production.',
    targetRole: 'Software Engineer',
    estimatedDays: '30',
    status: 'published',
    createdAt: '2026-01-15T00:00:00.000Z',
    stages: [
      {
        id: 'stage-001',
        name: 'Week 1: Culture & Orientation',
        order: 1,
        description: 'Get familiar with who we are, how we work, and the values that guide every decision at Stride.',
        materials: [
          {
            id: 'mat-001',
            type: 'video',
            title: 'Welcome to Stride Technologies',
            url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
            duration: '8 min',
          },
          {
            id: 'mat-002',
            type: 'reading',
            title: 'Employee Handbook',
            url: 'https://notion.so/stride/handbook',
            content: `Welcome to Stride Technologies!

This handbook covers everything you need to know — from our core values and how we work, to leave policies and benefits.

Our Core Values:
• Ship with Confidence — move fast, but never at the cost of reliability
• Own the Outcome — every engineer is accountable for what they ship
• Communicate Openly — decisions, blockers, and feedback should be visible
• Grow Relentlessly — learning is a job requirement, not a bonus

Your first week is all about listening. Meet people, ask questions, and don't worry about contributing code yet. Relationships are the foundation everything else is built on.

If you have questions, your buddy or manager is always available on Slack.`,
          },
          {
            id: 'mat-003',
            type: 'checklist',
            title: 'Day 1 Checklist',
            items: [
              'Set up your MacBook with IT using the setup guide in #onboarding',
              'Activate your work email and sign in to Google Workspace',
              'Join the Slack workspace and explore key channels',
              'Introduce yourself in #general with a short bio',
              'Schedule a 30-min intro call with your manager',
              'Sign and return your NDA and employment contract',
            ],
          },
        ],
      },
      {
        id: 'stage-002',
        name: 'Week 2: Tech Stack & Systems',
        order: 2,
        description: 'Understand our architecture, tech stack, and engineering workflow so you can contribute with confidence.',
        materials: [
          {
            id: 'mat-004',
            type: 'video',
            title: 'System Architecture Overview',
            url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
            duration: '22 min',
          },
          {
            id: 'mat-005',
            type: 'reading',
            title: 'Git Workflow & Contribution Guide',
            url: 'https://github.com/stride/engineering/blob/main/CONTRIBUTING.md',
            content: `Our Git Workflow

We follow trunk-based development with short-lived feature branches.

Branch naming convention:
  feat/short-description
  fix/short-description
  chore/short-description

Commit message format:
  feat: add user authentication endpoint
  fix: resolve race condition in job queue
  chore: upgrade Node.js to 20 LTS

Pull Request process:
1. Open a draft PR early — this signals work in progress and invites early feedback
2. Request review from at least 1 engineer when ready
3. All CI checks must pass before merge (lint, tests, type check)
4. We use squash merges to keep main history clean

Code review turnaround target: within 1 business day.`,
          },
          {
            id: 'mat-006',
            type: 'checklist',
            title: 'Dev Environment Setup',
            items: [
              'Clone the main monorepo from GitHub',
              'Run the bootstrap script (./scripts/setup.sh)',
              'Verify all services start with docker-compose up',
              'Confirm all unit and integration tests pass locally',
              'Open a "hello world" PR to test the CI pipeline',
            ],
          },
        ],
      },
      {
        id: 'stage-003',
        name: 'Weeks 3–4: Ship Your First Feature',
        order: 3,
        description: 'Pick up a real task from the backlog with guidance from your buddy and ship it to production.',
        materials: [
          {
            id: 'mat-007',
            type: 'reading',
            title: 'Code Review Best Practices',
            url: '',
            content: `How We Do Code Review

Code review is one of the most important practices at Stride. It's how we share knowledge, maintain quality, and grow as engineers.

As a reviewer:
• Respond within 1 business day
• Focus on logic and correctness — let the linter handle style
• Ask questions, don't give orders: "What do you think about..." vs "You should..."
• Acknowledge great work — positive feedback matters as much as corrections
• If blocking, explain clearly why and suggest an alternative

As an author:
• Small PRs are easier to review and safer to ship — aim for <400 lines changed
• Describe the "why" in your PR description, not just the "what"
• Respond to every comment, even with just "done" or "acknowledged"

The goal is to make each other better, not to gatekeep.`,
          },
          {
            id: 'mat-008',
            type: 'checklist',
            title: '30-Day Milestone Checklist',
            items: [
              'Complete and merge your first feature PR',
              'Participate in sprint planning and estimation',
              'Conduct at least 2 code reviews for teammates',
              'Deploy a feature to the staging environment',
              'Complete your 30-day check-in with your manager',
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'prog-002',
    name: 'Sales & Business Development Onboarding',
    description: 'A 2-week intensive program for new Sales hires — covering product knowledge, our sales process, and how to close your first deal.',
    targetRole: 'Sales Representative',
    estimatedDays: '14',
    status: 'published',
    createdAt: '2026-02-01T00:00:00.000Z',
    stages: [
      {
        id: 'stage-004',
        name: 'Days 1–3: Product & Market',
        order: 1,
        description: "Deep-dive into Stride's products, our target market, and the problems we solve for customers.",
        materials: [
          {
            id: 'mat-009',
            type: 'video',
            title: 'Product Demo — Full Feature Walkthrough',
            url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
            duration: '35 min',
          },
          {
            id: 'mat-010',
            type: 'reading',
            title: 'Competitive Landscape & Positioning',
            url: 'https://notion.so/stride/competitive-analysis',
            content: `Competitive Positioning

Our primary competitors and how we differentiate:

1. Competitor A — Strong brand, but slow release cycle. We win on velocity and developer experience.
2. Competitor B — Low price point, but limited integrations. We win on ecosystem depth and support quality.
3. Competitor C — Enterprise-focused, very complex. We win on time-to-value and ease of setup.

Core value proposition (use this in pitches):
"Stride cuts engineering tool setup time by 70% and gives teams a single pane of glass for the entire developer workflow — without the enterprise complexity."

Always ask before pitching: "What tools does your team currently use?" — this maps their pain to our solution.`,
          },
          {
            id: 'mat-011',
            type: 'checklist',
            title: 'Product Knowledge Sign-off',
            items: [
              'Complete product demo certification (schedule with Sales Enablement)',
              'Know Stride\'s top 3 value propositions by heart',
              'Understand all pricing tiers and what each includes',
              'Identify our 5 strongest differentiators vs. top competitors',
            ],
          },
        ],
      },
      {
        id: 'stage-005',
        name: 'Days 4–7: Sales Process',
        order: 2,
        description: 'Learn our end-to-end sales methodology from prospecting to closing.',
        materials: [
          {
            id: 'mat-012',
            type: 'reading',
            title: 'Stride Sales Playbook',
            url: '',
            content: `Stride Sales Methodology — MEDDIC Framework

M — Metrics: What is the quantifiable business impact for the customer?
E — Economic Buyer: Have you identified the person who controls the budget?
D — Decision Criteria: What criteria will they use to make a decision?
D — Decision Process: What does their internal approval process look like?
I — Identify Pain: What is the root problem driving them to look for a solution?
C — Champion: Who inside the account is advocating for Stride?

Pipeline stages and targets:
• Discovery → Qualification rate: 50%
• Qualified → Demo rate: 70%
• Demo → Proposal rate: 40%
• Proposal → Close rate: 30%

Average deal size: $12,000 ARR. Sales cycle: 45 days.`,
          },
          {
            id: 'mat-013',
            type: 'video',
            title: 'Recorded Discovery Call — Analysis',
            url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
            duration: '28 min',
          },
          {
            id: 'mat-014',
            type: 'checklist',
            title: 'First Week Sales Activities',
            items: [
              'Shadow 3 discovery calls with a senior AE',
              'Complete MEDDIC certification quiz in LMS',
              'Set up your HubSpot CRM account and review your territory',
              'Draft your personal prospecting email template (review with manager)',
              'Book your first 5 outbound calls for week 2',
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'prog-003',
    name: 'Product Design Onboarding',
    description: 'Get up to speed on our design system, product principles, and design-engineering collaboration workflow.',
    targetRole: 'Product Designer',
    estimatedDays: '21',
    status: 'draft',
    createdAt: '2026-03-10T00:00:00.000Z',
    stages: [
      {
        id: 'stage-006',
        name: 'Week 1: Design System & Tools',
        order: 1,
        description: 'Understand our component library, design tokens, and the tooling we use day-to-day.',
        materials: [
          {
            id: 'mat-015',
            type: 'video',
            title: 'Stride Design System — Getting Started',
            url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
            duration: '18 min',
          },
          {
            id: 'mat-016',
            type: 'checklist',
            title: 'Design Tools Setup',
            items: [
              'Accept your Figma organization invite',
              'Explore the Stride Design System Figma file',
              'Install required Figma plugins (listed in #design Slack channel)',
              'Review the design token documentation in Notion',
            ],
          },
        ],
      },
    ],
  },
]

const MOCK_EMPLOYEES_A = [
  {
    id: 'emp-001',
    name: 'Alex Rivera',
    email: 'alex.rivera@stridetechnologies.io',
    role: 'Software Engineer',
    department: 'Engineering',
    startDate: '2026-07-01',
    status: 'active',
    avatar: '',
    phone: '+1 (415) 555-0182',
    location: 'San Francisco, CA',
    assignedProgramId: 'prog-001',
    completedMaterials: ['mat-001', 'mat-002', 'mat-003', 'mat-004', 'mat-005'],
  },
  {
    id: 'emp-002',
    name: 'Jordan Kim',
    email: 'jordan.kim@stridetechnologies.io',
    role: 'Sales Representative',
    department: 'Sales',
    startDate: '2026-07-08',
    status: 'active',
    avatar: '',
    phone: '+1 (312) 555-0247',
    location: 'Chicago, IL',
    assignedProgramId: 'prog-002',
    completedMaterials: ['mat-009', 'mat-010'],
  },
  {
    id: 'emp-003',
    name: 'Morgan Taylor',
    email: 'morgan.taylor@stridetechnologies.io',
    role: 'Software Engineer',
    department: 'Engineering',
    startDate: '2026-06-02',
    status: 'active',
    avatar: '',
    phone: '+1 (206) 555-0391',
    location: 'Seattle, WA',
    assignedProgramId: 'prog-001',
    completedMaterials: ['mat-001', 'mat-002', 'mat-003', 'mat-004', 'mat-005', 'mat-006', 'mat-007', 'mat-008'],
  },
  {
    id: 'emp-004',
    name: 'Casey Nguyen',
    email: 'casey.nguyen@stridetechnologies.io',
    role: 'Product Designer',
    department: 'Design',
    startDate: '2026-07-14',
    status: 'active',
    avatar: '',
    phone: '+1 (646) 555-0128',
    location: 'New York, NY',
    assignedProgramId: null,
    completedMaterials: [],
  },
  {
    id: 'emp-005',
    name: 'Riley Chen',
    email: 'riley.chen@stridetechnologies.io',
    role: 'Sales Representative',
    department: 'Sales',
    startDate: '2026-07-16',
    status: 'active',
    avatar: '',
    phone: '+1 (512) 555-0063',
    location: 'Austin, TX',
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
  { id: 'user-stride', name: 'Alex Morgan', email: 'alex@stridetechnologies.io', password: 'demo123', role: 'admin', accountId: 'account-a' },
  { id: 'user-bloom', name: 'Jamie Lee', email: 'jamie@bloom.studio', password: 'demo123', role: 'admin', accountId: 'account-b' },
  { id: 'user-owner', name: 'Owen Park', email: 'admin@onboard.app', password: 'admin123', role: 'owner', accountId: null },
]

// ─── All Accounts (visible to owner panel) ───────────────────────────────────
export const ALL_ACCOUNTS = [
  { id: 'account-a', name: 'Stride Technologies', plan: 'Pro', owner: 'alex@stridetechnologies.io', employees: 5, programs: 3, status: 'active', joined: '2026-01-01', mrr: 49 },
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
    label: 'Stride Technologies',
    subtitle: '3 programs · 5 employees',
    description: 'A fully configured account with onboarding programs and employees ready to explore.',
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
const useStore = create((set, get) => ({
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
      // unassign employees from deleted program
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
            { id: generateId(), order: p.stages.length + 1, materials: [], ...stage },
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

  // used from employee self-service preview
  markMaterialComplete: (employeeId, materialId) =>
    set((s) => ({
      employees: s.employees.map((e) => {
        if (e.id !== employeeId) return e
        if (e.completedMaterials.includes(materialId)) return e
        return { ...e, completedMaterials: [...e.completedMaterials, materialId] }
      }),
    })),
}))

export default useStore
