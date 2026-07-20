import { create } from 'zustand'
import { supabase } from '../lib/supabaseClient'

// supabase-js query builders are lazy thenables — building one without
// awaiting/`.then()`-ing it never actually sends the request. Every
// fire-and-forget mutation below must be routed through this so it fires.
function fireAndForget(builder) {
  builder.then(({ error }) => {
    if (error) console.error('Supabase write failed:', error.message)
  })
}

// ─── Demo accounts shown on the Login screen ─────────────────────────────────
// Real rows for these live in Supabase (see supabase/schema.sql seed section).
export const DEMO_ACCOUNTS = [
  {
    id: 'account-a',
    label: 'Sunrise Bistro',
    subtitle: '3 programs · 5 employees',
    description: 'A restaurant with full onboarding programs for kitchen staff and front of house — ready to explore.',
    badge: 'Sample Data',
    email: 'andi@sunrisebistro.co',
    password: 'demo123',
  },
  {
    id: 'account-b',
    label: 'Bloom Studio',
    subtitle: 'Start from scratch',
    description: 'A blank account to see what setting up Onboard looks like from day one.',
    badge: 'Empty',
    email: 'jamie@bloom.studio',
    password: 'demo123',
  },
]

// ─── Data loading ─────────────────────────────────────────────────────────────

async function loadCompanyData(companyId) {
  const [{ data: company }, { data: programsRaw }, { data: employeesRaw }] = await Promise.all([
    supabase.from('companies').select('*').eq('id', companyId).single(),
    supabase
      .from('programs')
      .select('*, stages(*, materials(*))')
      .eq('company_id', companyId)
      .order('created_at', { ascending: true }),
    supabase
      .from('employees')
      .select('*, employee_progress(material_id, detail)')
      .eq('company_id', companyId)
      .order('created_at', { ascending: true }),
  ])

  const programs = (programsRaw || []).map(mapProgramRow)
  const employees = (employeesRaw || []).map(mapEmployeeRow)

  return { company: mapCompanyRow(company), programs, employees }
}

function mapCompanyRow(row) {
  if (!row) return null
  return {
    id: row.id,
    name: row.name,
    industry: row.industry,
    size: row.size,
    website: row.website,
    description: row.description,
    logo: row.logo_url || '',
    primaryColor: row.primary_color,
    departments: row.departments || [],
    createdAt: row.created_at,
  }
}

function mapProgramRow(row) {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    targetRole: row.target_role,
    estimatedDays: row.estimated_days,
    status: row.status,
    headerImage: row.header_image_url || '',
    shareToken: row.share_token,
    createdAt: row.created_at,
    stages: (row.stages || [])
      .slice()
      .sort((a, b) => a.order - b.order)
      .map((s) => ({
        id: s.id,
        name: s.name,
        description: s.description,
        order: s.order,
        deadline: s.deadline,
        materials: (s.materials || []).map(mapMaterialRow),
      })),
  }
}

function mapMaterialRow(row) {
  return { id: row.id, type: row.type, title: row.title, ...(row.data || {}) }
}

function mapEmployeeRow(row) {
  const progress = row.employee_progress || []
  const materialDetails = {}
  progress.forEach((p) => {
    if (p.detail != null) materialDetails[p.material_id] = p.detail
  })
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role,
    department: row.department,
    startDate: row.start_date,
    status: row.status,
    employmentType: row.employment_type,
    manager: row.manager,
    phone: row.phone,
    location: row.location,
    notes: row.notes,
    avatar: row.avatar_url || '',
    assignedProgramId: row.assigned_program_id,
    completedMaterials: progress.map((p) => p.material_id),
    materialDetails,
    accessToken: row.access_token,
  }
}

// ─── Store ────────────────────────────────────────────────────────────────────
const useStore = create((set, get) => ({
  company: null,
  programs: [],
  employees: [],
  isSetupComplete: false,
  currentUser: null,
  authLoading: true,

  // ── Session bootstrap ────────────────────────────────────────────────────
  initSession: async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        await get()._hydrateFromSession(session)
      } else {
        set({ authLoading: false })
      }
    } catch (err) {
      console.error('Failed to restore session — check your Supabase credentials in .env', err)
      set({ authLoading: false })
    }

    supabase.auth.onAuthStateChange(async (event) => {
      if (event === 'SIGNED_OUT') {
        set({ currentUser: null, company: null, programs: [], employees: [], isSetupComplete: false })
      }
    })
  },

  _hydrateFromSession: async (session) => {
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single()

    if (!profile) {
      set({ authLoading: false })
      return
    }

    const currentUser = { id: profile.id, name: profile.name, email: profile.email, role: profile.role }

    if (profile.role === 'owner') {
      set({ currentUser, isSetupComplete: true, authLoading: false })
      return
    }

    if (!profile.company_id) {
      set({ currentUser, isSetupComplete: true, authLoading: false })
      return
    }

    const { company, programs, employees } = await loadCompanyData(profile.company_id)
    set({ currentUser, company, programs, employees, isSetupComplete: true, authLoading: false })
  },

  // ── Auth ─────────────────────────────────────────────────────────────────
  login: async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) return { success: false, error: error.message }
    await get()._hydrateFromSession(data.session)
    return { success: true, user: get().currentUser }
  },

  register: async ({ name, email, password, companyName }) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name } },
    })
    if (error) return { success: false, error: error.message }
    if (!data.session) {
      return { success: false, error: 'Check your email to confirm your account, then sign in.' }
    }

    const { data: company, error: companyError } = await supabase
      .from('companies')
      .insert({ name: companyName, primary_color: '#4f5fff' })
      .select()
      .single()
    if (companyError) return { success: false, error: companyError.message }

    await supabase.from('profiles').update({ company_id: company.id, name }).eq('id', data.user.id)

    set({
      currentUser: { id: data.user.id, name, email, role: 'admin' },
      company: mapCompanyRow(company),
      programs: [],
      employees: [],
      isSetupComplete: true,
      authLoading: false,
    })
    return { success: true }
  },

  logout: async () => {
    await supabase.auth.signOut()
    set({ currentUser: null, company: null, programs: [], employees: [], isSetupComplete: false })
  },

  // ── Company ──────────────────────────────────────────────────────────────
  setCompany: (company) => set({ company, isSetupComplete: true }),

  updateCompany: (updates) => {
    const companyId = get().company?.id
    set((s) => ({ company: { ...s.company, ...updates } }))
    if (!companyId) return
    const patch = {}
    if ('name' in updates) patch.name = updates.name
    if ('industry' in updates) patch.industry = updates.industry
    if ('size' in updates) patch.size = updates.size
    if ('website' in updates) patch.website = updates.website
    if ('description' in updates) patch.description = updates.description
    if ('logo' in updates) patch.logo_url = updates.logo
    if ('primaryColor' in updates) patch.primary_color = updates.primaryColor
    if (Object.keys(patch).length) fireAndForget(supabase.from('companies').update(patch).eq('id', companyId))
  },

  addDepartment: (name) => {
    const companyId = get().company?.id
    const departments = [...(get().company?.departments || []), name]
    set((s) => ({ company: { ...s.company, departments } }))
    if (companyId) fireAndForget(supabase.from('companies').update({ departments }).eq('id', companyId))
  },

  renameDepartment: (oldName, newName) => {
    const companyId = get().company?.id
    const departments = (get().company?.departments || []).map((d) => (d === oldName ? newName : d))
    set((s) => ({
      company: { ...s.company, departments },
      employees: s.employees.map((e) => (e.department === oldName ? { ...e, department: newName } : e)),
    }))
    if (!companyId) return
    fireAndForget(supabase.from('companies').update({ departments }).eq('id', companyId))
    fireAndForget(supabase.from('employees').update({ department: newName }).eq('company_id', companyId).eq('department', oldName))
  },

  deleteDepartment: (name) => {
    const companyId = get().company?.id
    const departments = (get().company?.departments || []).filter((d) => d !== name)
    set((s) => ({ company: { ...s.company, departments } }))
    if (companyId) fireAndForget(supabase.from('companies').update({ departments }).eq('id', companyId))
  },

  // ── Programs ─────────────────────────────────────────────────────────────
  addProgram: async (program) => {
    const companyId = get().company?.id
    if (!companyId) return
    const { data, error } = await supabase
      .from('programs')
      .insert({
        company_id: companyId,
        name: program.name,
        description: program.description || '',
        target_role: program.targetRole || '',
        estimated_days: program.estimatedDays || '',
        status: program.status || 'draft',
      })
      .select()
      .single()
    if (error || !data) return
    set((s) => ({ programs: [...s.programs, mapProgramRow({ ...data, stages: [] })] }))
  },

  updateProgram: (id, updates) => {
    set((s) => ({ programs: s.programs.map((p) => (p.id === id ? { ...p, ...updates } : p)) }))
    const patch = {}
    if ('name' in updates) patch.name = updates.name
    if ('description' in updates) patch.description = updates.description
    if ('targetRole' in updates) patch.target_role = updates.targetRole
    if ('estimatedDays' in updates) patch.estimated_days = updates.estimatedDays
    if ('status' in updates) patch.status = updates.status
    if ('headerImage' in updates) patch.header_image_url = updates.headerImage
    if (Object.keys(patch).length) fireAndForget(supabase.from('programs').update(patch).eq('id', id))
  },

  deleteProgram: (id) => {
    set((s) => ({
      programs: s.programs.filter((p) => p.id !== id),
      employees: s.employees.map((e) =>
        e.assignedProgramId === id ? { ...e, assignedProgramId: null, completedMaterials: [] } : e
      ),
    }))
    fireAndForget(supabase.from('programs').delete().eq('id', id))
  },

  // ── Stages ───────────────────────────────────────────────────────────────
  addStage: async (programId, stage) => {
    const companyId = get().company?.id
    const program = get().programs.find((p) => p.id === programId)
    if (!companyId || !program) return
    const { data, error } = await supabase
      .from('stages')
      .insert({
        company_id: companyId,
        program_id: programId,
        name: stage.name,
        description: stage.description || '',
        order: program.stages.length + 1,
        deadline: stage.deadline ?? null,
      })
      .select()
      .single()
    if (error || !data) return
    set((s) => ({
      programs: s.programs.map((p) =>
        p.id !== programId ? p : { ...p, stages: [...p.stages, mapProgramRow({ ...data, stages: [] }).stages[0] || { ...data, materials: [] }] }
      ),
    }))
  },

  updateStage: (programId, stageId, updates) => {
    set((s) => ({
      programs: s.programs.map((p) => {
        if (p.id !== programId) return p
        return { ...p, stages: p.stages.map((st) => (st.id === stageId ? { ...st, ...updates } : st)) }
      }),
    }))
    const patch = {}
    if ('name' in updates) patch.name = updates.name
    if ('description' in updates) patch.description = updates.description
    if ('deadline' in updates) patch.deadline = updates.deadline
    if ('order' in updates) patch.order = updates.order
    if (Object.keys(patch).length) fireAndForget(supabase.from('stages').update(patch).eq('id', stageId))
  },

  deleteStage: (programId, stageId) => {
    set((s) => ({
      programs: s.programs.map((p) => {
        if (p.id !== programId) return p
        return {
          ...p,
          stages: p.stages.filter((st) => st.id !== stageId).map((st, i) => ({ ...st, order: i + 1 })),
        }
      }),
    }))
    fireAndForget(supabase.from('stages').delete().eq('id', stageId))
  },

  addMaterial: async (programId, stageId, material) => {
    const companyId = get().company?.id
    if (!companyId) return
    const { type, title, ...data } = material
    const { data: row, error } = await supabase
      .from('materials')
      .insert({ company_id: companyId, stage_id: stageId, type, title, data })
      .select()
      .single()
    if (error || !row) return
    set((s) => ({
      programs: s.programs.map((p) => {
        if (p.id !== programId) return p
        return {
          ...p,
          stages: p.stages.map((st) =>
            st.id !== stageId ? st : { ...st, materials: [...st.materials, mapMaterialRow(row)] }
          ),
        }
      }),
    }))
  },

  updateMaterial: (programId, stageId, materialId, updates) => {
    set((s) => ({
      programs: s.programs.map((p) => {
        if (p.id !== programId) return p
        return {
          ...p,
          stages: p.stages.map((st) => {
            if (st.id !== stageId) return st
            return { ...st, materials: st.materials.map((m) => (m.id === materialId ? { ...m, ...updates } : m)) }
          }),
        }
      }),
    }))
    const { type, title, ...data } = updates
    const patch = {}
    if (type !== undefined) patch.type = type
    if (title !== undefined) patch.title = title
    if (Object.keys(data).length) {
      const current = get()
        .programs.flatMap((p) => p.stages)
        .flatMap((st) => st.materials)
        .find((m) => m.id === materialId)
      const { id, type: t, title: ti, ...rest } = current || {}
      patch.data = { ...rest, ...data }
    }
    fireAndForget(supabase.from('materials').update(patch).eq('id', materialId))
  },

  deleteMaterial: (programId, stageId, materialId) => {
    set((s) => ({
      programs: s.programs.map((p) => {
        if (p.id !== programId) return p
        return {
          ...p,
          stages: p.stages.map((st) =>
            st.id !== stageId ? st : { ...st, materials: st.materials.filter((m) => m.id !== materialId) }
          ),
        }
      }),
    }))
    fireAndForget(supabase.from('materials').delete().eq('id', materialId))
  },

  reorderStages: (programId, stages) => {
    set((s) => ({ programs: s.programs.map((p) => (p.id === programId ? { ...p, stages } : p)) }))
    stages.forEach((st, i) => fireAndForget(supabase.from('stages').update({ order: i + 1 }).eq('id', st.id)))
  },

  // ── Employees ─────────────────────────────────────────────────────────────
  addEmployee: async (employee) => {
    const companyId = get().company?.id
    if (!companyId) return
    const { data, error } = await supabase
      .from('employees')
      .insert({
        company_id: companyId,
        name: employee.name,
        email: employee.email,
        role: employee.role,
        department: employee.department,
        start_date: employee.startDate || null,
        employment_type: employee.employmentType,
        manager: employee.manager,
        phone: employee.phone,
        location: employee.location,
        notes: employee.notes,
        status: employee.status || 'active',
      })
      .select()
      .single()
    if (error || !data) return
    set((s) => ({ employees: [...s.employees, mapEmployeeRow({ ...data, employee_progress: [] })] }))
  },

  updateEmployee: (id, updates) => {
    set((s) => ({ employees: s.employees.map((e) => (e.id === id ? { ...e, ...updates } : e)) }))
    const patch = {}
    if ('name' in updates) patch.name = updates.name
    if ('email' in updates) patch.email = updates.email
    if ('role' in updates) patch.role = updates.role
    if ('department' in updates) patch.department = updates.department
    if ('startDate' in updates) patch.start_date = updates.startDate
    if ('employmentType' in updates) patch.employment_type = updates.employmentType
    if ('manager' in updates) patch.manager = updates.manager
    if ('phone' in updates) patch.phone = updates.phone
    if ('location' in updates) patch.location = updates.location
    if ('notes' in updates) patch.notes = updates.notes
    if ('status' in updates) patch.status = updates.status
    if ('avatar' in updates) patch.avatar_url = updates.avatar
    if (Object.keys(patch).length) fireAndForget(supabase.from('employees').update(patch).eq('id', id))
  },

  deleteEmployee: (id) => {
    set((s) => ({ employees: s.employees.filter((e) => e.id !== id) }))
    fireAndForget(supabase.from('employees').delete().eq('id', id))
  },

  assignProgram: (employeeId, programId) => {
    set((s) => ({
      employees: s.employees.map((e) =>
        e.id === employeeId ? { ...e, assignedProgramId: programId, completedMaterials: [] } : e
      ),
    }))
    fireAndForget(supabase.from('employees').update({ assigned_program_id: programId }).eq('id', employeeId))
    fireAndForget(supabase.from('employee_progress').delete().eq('employee_id', employeeId))
  },

  markMaterialComplete: (employeeId, materialId) => {
    set((s) => ({
      employees: s.employees.map((e) => {
        if (e.id !== employeeId) return e
        if (e.completedMaterials.includes(materialId)) return e
        return { ...e, completedMaterials: [...e.completedMaterials, materialId] }
      }),
    }))
    fireAndForget(supabase.from('employee_progress').insert({ employee_id: employeeId, material_id: materialId }))
  },

  recordMaterialDetail: (employeeId, materialId, detail) => {
    set((s) => ({
      employees: s.employees.map((e) =>
        e.id === employeeId
          ? { ...e, materialDetails: { ...(e.materialDetails || {}), [materialId]: detail } }
          : e
      ),
    }))
    fireAndForget(
      supabase
        .from('employee_progress')
        .upsert({ employee_id: employeeId, material_id: materialId, detail }, { onConflict: 'employee_id,material_id' })
    )
  },

  ensureEmployeeAccess: (employeeId) => {
    return get().employees.find((e) => e.id === employeeId)?.accessToken
  },

  duplicateProgram: async (id) => {
    const program = get().programs.find((p) => p.id === id)
    const companyId = get().company?.id
    if (!program || !companyId) return

    const { data: newProgram, error } = await supabase
      .from('programs')
      .insert({
        company_id: companyId,
        name: `${program.name} (Copy)`,
        description: program.description,
        target_role: program.targetRole,
        estimated_days: program.estimatedDays,
        status: 'draft',
      })
      .select()
      .single()
    if (error || !newProgram) return

    const clonedStages = []
    for (const stage of program.stages) {
      const { data: newStage } = await supabase
        .from('stages')
        .insert({
          company_id: companyId,
          program_id: newProgram.id,
          name: stage.name,
          description: stage.description,
          order: stage.order,
          deadline: stage.deadline,
        })
        .select()
        .single()
      if (!newStage) continue

      const clonedMaterials = []
      for (const m of stage.materials) {
        const { id: mId, type, title, ...data } = m
        const { data: newMaterial } = await supabase
          .from('materials')
          .insert({ company_id: companyId, stage_id: newStage.id, type, title, data })
          .select()
          .single()
        if (newMaterial) clonedMaterials.push(mapMaterialRow(newMaterial))
      }
      clonedStages.push({
        id: newStage.id,
        name: newStage.name,
        description: newStage.description,
        order: newStage.order,
        deadline: newStage.deadline,
        materials: clonedMaterials,
      })
    }

    set((s) => ({
      programs: [...s.programs, { ...mapProgramRow({ ...newProgram, stages: [] }), stages: clonedStages }],
    }))
  },

  addProgramFromTemplate: async (template) => {
    const companyId = get().company?.id
    if (!companyId) return
    const { data: newProgram, error } = await supabase
      .from('programs')
      .insert({
        company_id: companyId,
        name: template.name,
        description: template.description || '',
        target_role: template.targetRole || '',
        estimated_days: template.estimatedDays || '',
        status: 'draft',
      })
      .select()
      .single()
    if (error || !newProgram) return

    const stages = []
    for (let i = 0; i < template.stages.length; i++) {
      const stage = template.stages[i]
      const { data: newStage } = await supabase
        .from('stages')
        .insert({
          company_id: companyId,
          program_id: newProgram.id,
          name: stage.name,
          description: stage.description || '',
          order: i + 1,
          deadline: stage.deadline ?? null,
        })
        .select()
        .single()
      if (!newStage) continue

      const materials = []
      for (const m of stage.materials) {
        const { type, title, ...data } = m
        const { data: newMaterial } = await supabase
          .from('materials')
          .insert({ company_id: companyId, stage_id: newStage.id, type, title, data })
          .select()
          .single()
        if (newMaterial) materials.push(mapMaterialRow(newMaterial))
      }
      stages.push({
        id: newStage.id,
        name: newStage.name,
        description: newStage.description,
        order: newStage.order,
        deadline: newStage.deadline,
        materials,
      })
    }

    set((s) => ({ programs: [...s.programs, { ...mapProgramRow({ ...newProgram, stages: [] }), stages }] }))
  },

  enableShare: (programId) => {
    const existing = get().programs.find((p) => p.id === programId)?.shareToken
    const token = existing || crypto.randomUUID()
    set((s) => ({
      programs: s.programs.map((p) => (p.id === programId ? { ...p, shareToken: token } : p)),
    }))
    if (!existing) fireAndForget(supabase.from('programs').update({ share_token: token }).eq('id', programId))
  },

  disableShare: (programId) => {
    set((s) => ({ programs: s.programs.map((p) => (p.id === programId ? { ...p, shareToken: null } : p)) }))
    fireAndForget(supabase.from('programs').update({ share_token: null }).eq('id', programId))
  },
}))

export default useStore
