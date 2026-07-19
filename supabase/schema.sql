-- ============================================================================
-- Onboard — Supabase schema, RLS, RPC functions, storage, seed data
--
-- HOW TO RUN THIS FILE:
--   1. Paste and run the whole file EXCEPT the "STEP 2" block below in the
--      Supabase Dashboard → SQL Editor → New query → Run.
--   2. Go to Authentication → Users → Add user, and create these 3 users
--      manually (this app never inserts into auth.users directly):
--        - andi@sunrisebistro.co   / demo123   (Sunrise Bistro admin)
--        - jamie@bloom.studio      / demo123   (Bloom Studio admin)
--        - admin@onboard.app       / admin123  (Owner / super-admin)
--   3. Come back and run the "STEP 2" block at the bottom (seed data) —
--      it looks up the 3 users you just created by email.
-- ============================================================================

-- ─── Extensions ──────────────────────────────────────────────────────────────
create extension if not exists pgcrypto;

-- ─── Tables ──────────────────────────────────────────────────────────────────

create table companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  industry text,
  size text,
  website text,
  description text,
  logo_url text,
  primary_color text default '#4f5fff',
  departments text[] default '{}',
  created_at timestamptz not null default now()
);

create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  company_id uuid references companies(id) on delete set null,
  role text not null default 'admin' check (role in ('admin', 'owner')),
  name text,
  email text
);

create table programs (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  name text not null,
  description text,
  target_role text,
  estimated_days text,
  status text not null default 'draft' check (status in ('draft', 'published')),
  header_image_url text,
  share_token uuid unique,
  created_at timestamptz not null default now()
);

create table stages (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  program_id uuid not null references programs(id) on delete cascade,
  name text not null,
  description text,
  "order" int not null default 1,
  deadline int
);

create table materials (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  stage_id uuid not null references stages(id) on delete cascade,
  type text not null check (type in ('video', 'reading', 'checklist', 'quiz', 'task', 'document', 'meeting')),
  title text not null,
  data jsonb not null default '{}'
);

create table employees (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  name text not null,
  email text not null,
  role text,
  department text,
  start_date date,
  status text not null default 'active',
  employment_type text,
  manager text,
  phone text,
  location text,
  notes text,
  avatar_url text,
  assigned_program_id uuid references programs(id) on delete set null,
  access_token uuid not null default gen_random_uuid() unique,
  created_at timestamptz not null default now()
);

create table employee_progress (
  employee_id uuid not null references employees(id) on delete cascade,
  material_id uuid not null references materials(id) on delete cascade,
  completed_at timestamptz not null default now(),
  detail jsonb,
  primary key (employee_id, material_id)
);

-- ─── auth.users → profiles trigger ──────────────────────────────────────────

create function handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into profiles (id, email, name, role)
  values (new.id, new.email, new.raw_user_meta_data->>'name', 'admin');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ─── RLS helper functions ────────────────────────────────────────────────────

create function my_company_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select company_id from profiles where id = auth.uid();
$$;

create function is_owner()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((select role = 'owner' from profiles where id = auth.uid()), false);
$$;

-- ─── RLS policies ────────────────────────────────────────────────────────────

alter table companies enable row level security;
alter table profiles enable row level security;
alter table programs enable row level security;
alter table stages enable row level security;
alter table materials enable row level security;
alter table employees enable row level security;
alter table employee_progress enable row level security;

-- companies
create policy "companies_select" on companies for select
  using (id = my_company_id() or is_owner());
create policy "companies_insert" on companies for insert
  with check (true); -- any authenticated user may create their own company once (enforced in app logic)
create policy "companies_update" on companies for update
  using (id = my_company_id());

-- profiles
create policy "profiles_select_self_or_company" on profiles for select
  using (id = auth.uid() or company_id = my_company_id() or is_owner());
create policy "profiles_update_self" on profiles for update
  using (id = auth.uid());

-- programs / stages / materials / employees (same tenant pattern)
create policy "programs_select" on programs for select using (company_id = my_company_id() or is_owner());
create policy "programs_write" on programs for insert with check (company_id = my_company_id());
create policy "programs_update" on programs for update using (company_id = my_company_id());
create policy "programs_delete" on programs for delete using (company_id = my_company_id());

create policy "stages_select" on stages for select using (company_id = my_company_id() or is_owner());
create policy "stages_write" on stages for insert with check (company_id = my_company_id());
create policy "stages_update" on stages for update using (company_id = my_company_id());
create policy "stages_delete" on stages for delete using (company_id = my_company_id());

create policy "materials_select" on materials for select using (company_id = my_company_id() or is_owner());
create policy "materials_write" on materials for insert with check (company_id = my_company_id());
create policy "materials_update" on materials for update using (company_id = my_company_id());
create policy "materials_delete" on materials for delete using (company_id = my_company_id());

create policy "employees_select" on employees for select using (company_id = my_company_id() or is_owner());
create policy "employees_write" on employees for insert with check (company_id = my_company_id());
create policy "employees_update" on employees for update using (company_id = my_company_id());
create policy "employees_delete" on employees for delete using (company_id = my_company_id());

create policy "employee_progress_select" on employee_progress for select
  using (exists (select 1 from employees e where e.id = employee_id and (e.company_id = my_company_id() or is_owner())));
create policy "employee_progress_write" on employee_progress for insert
  with check (exists (select 1 from employees e where e.id = employee_id and e.company_id = my_company_id()));
create policy "employee_progress_update" on employee_progress for update
  using (exists (select 1 from employees e where e.id = employee_id and e.company_id = my_company_id()));

-- ─── Public RPC functions (token-based access, no auth session) ─────────────
-- Granted to `anon` so the public /start/:token and /share/:token pages work
-- without a logged-in session. Each function validates the secret token
-- server-side before returning/mutating anything.

create function get_employee_portal(p_token uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_employee employees%rowtype;
  v_program jsonb;
  v_company jsonb;
  v_completed jsonb;
begin
  select * into v_employee from employees where access_token = p_token;
  if not found then
    return jsonb_build_object('error', 'invalid_token');
  end if;

  select to_jsonb(c) into v_company from companies c where c.id = v_employee.company_id;

  select jsonb_build_object(
    'id', p.id, 'name', p.name, 'description', p.description,
    'header_image_url', p.header_image_url,
    'stages', coalesce(jsonb_agg(
      jsonb_build_object(
        'id', s.id, 'name', s.name, 'description', s.description,
        'order', s."order", 'deadline', s.deadline,
        'materials', (
          select coalesce(jsonb_agg(
            jsonb_build_object('id', m.id, 'type', m.type, 'title', m.title) || m.data
            order by m.id
          ), '[]'::jsonb)
          from materials m where m.stage_id = s.id
        )
      ) order by s."order"
    ) filter (where s.id is not null), '[]'::jsonb)
  ) into v_program
  from programs p
  left join stages s on s.program_id = p.id
  where p.id = v_employee.assigned_program_id
  group by p.id;

  select coalesce(jsonb_agg(jsonb_build_object('material_id', material_id, 'detail', detail)), '[]'::jsonb)
  into v_completed
  from employee_progress where employee_id = v_employee.id;

  return jsonb_build_object(
    'employee', to_jsonb(v_employee),
    'company', v_company,
    'program', v_program,
    'completed', v_completed
  );
end;
$$;

create function mark_material_complete(p_token uuid, p_material_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_employee_id uuid;
begin
  select id into v_employee_id from employees where access_token = p_token;
  if v_employee_id is null then
    raise exception 'invalid_token';
  end if;
  insert into employee_progress (employee_id, material_id)
  values (v_employee_id, p_material_id)
  on conflict (employee_id, material_id) do nothing;
end;
$$;

create function record_material_detail(p_token uuid, p_material_id uuid, p_detail jsonb)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_employee_id uuid;
begin
  select id into v_employee_id from employees where access_token = p_token;
  if v_employee_id is null then
    raise exception 'invalid_token';
  end if;
  insert into employee_progress (employee_id, material_id, detail)
  values (v_employee_id, p_material_id, p_detail)
  on conflict (employee_id, material_id) do update set detail = excluded.detail;
end;
$$;

create function get_shared_program(p_token uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_program programs%rowtype;
  v_company jsonb;
  v_stages jsonb;
  v_enrolled int;
  v_completed int;
  v_avg_pct numeric;
begin
  select * into v_program from programs where share_token = p_token;
  if not found then
    return jsonb_build_object('error', 'invalid_token');
  end if;

  select to_jsonb(c) into v_company from companies c where c.id = v_program.company_id;

  select coalesce(jsonb_agg(
    jsonb_build_object(
      'id', s.id, 'name', s.name, 'order', s."order",
      'material_count', (select count(*) from materials m where m.stage_id = s.id)
    ) order by s."order"
  ), '[]'::jsonb) into v_stages
  from stages s where s.program_id = v_program.id;

  select count(*) into v_enrolled from employees where assigned_program_id = v_program.id;

  select count(*) into v_completed
  from employees e
  where e.assigned_program_id = v_program.id
    and (select count(*) from materials m join stages s on s.id = m.stage_id where s.program_id = v_program.id)
        = (select count(*) from employee_progress ep join materials m on m.id = ep.material_id join stages s on s.id = m.stage_id where s.program_id = v_program.id and ep.employee_id = e.id);

  select coalesce(avg(pct), 0) into v_avg_pct
  from (
    select
      case when total.cnt = 0 then 0
      else (select count(*) from employee_progress ep join materials m on m.id = ep.material_id join stages s on s.id = m.stage_id where s.program_id = v_program.id and ep.employee_id = e.id)::numeric / total.cnt * 100
      end as pct
    from employees e, (select count(*) as cnt from materials m join stages s on s.id = m.stage_id where s.program_id = v_program.id) total
    where e.assigned_program_id = v_program.id
  ) sub;

  return jsonb_build_object(
    'program', to_jsonb(v_program),
    'company', v_company,
    'stages', v_stages,
    'stats', jsonb_build_object('enrolled', v_enrolled, 'completed', v_completed, 'avg_pct', round(v_avg_pct))
  );
end;
$$;

grant execute on function get_employee_portal(uuid) to anon, authenticated;
grant execute on function mark_material_complete(uuid, uuid) to anon, authenticated;
grant execute on function record_material_detail(uuid, uuid, jsonb) to anon, authenticated;
grant execute on function get_shared_program(uuid) to anon, authenticated;

-- ─── Storage buckets ─────────────────────────────────────────────────────────

insert into storage.buckets (id, name, public) values ('company-logos', 'company-logos', true);
insert into storage.buckets (id, name, public) values ('program-images', 'program-images', true);

create policy "company_logos_public_read" on storage.objects for select
  using (bucket_id = 'company-logos');
create policy "company_logos_auth_write" on storage.objects for insert
  with check (bucket_id = 'company-logos' and (storage.foldername(name))[1] = my_company_id()::text);
create policy "company_logos_auth_update" on storage.objects for update
  using (bucket_id = 'company-logos' and (storage.foldername(name))[1] = my_company_id()::text);

create policy "program_images_public_read" on storage.objects for select
  using (bucket_id = 'program-images');
create policy "program_images_auth_write" on storage.objects for insert
  with check (bucket_id = 'program-images' and (storage.foldername(name))[1] = my_company_id()::text);
create policy "program_images_auth_update" on storage.objects for update
  using (bucket_id = 'program-images' and (storage.foldername(name))[1] = my_company_id()::text);

-- ============================================================================
-- STEP 2 — SEED DATA
-- Run this AFTER you've created the 3 auth users in the Dashboard (see top).
-- ============================================================================

do $$
declare
  v_andi_id uuid;
  v_jamie_id uuid;
  v_owen_id uuid;
  v_company_a uuid;
  v_company_b uuid;
  v_prog1 uuid; v_prog2 uuid; v_prog3 uuid;
  v_stage1 uuid; v_stage2 uuid; v_stage3 uuid; v_stage4 uuid; v_stage5 uuid; v_stage6 uuid;
  v_mat1 uuid; v_mat2 uuid; v_mat3 uuid; v_mat4 uuid; v_mat5 uuid; v_mat6 uuid;
  v_mat10 uuid; v_mat11 uuid; v_mat12 uuid; v_mat13 uuid;
  v_emp1 uuid; v_emp2 uuid; v_emp3 uuid;
begin
  select id into v_andi_id from auth.users where email = 'andi@sunrisebistro.co';
  select id into v_jamie_id from auth.users where email = 'jamie@bloom.studio';
  select id into v_owen_id from auth.users where email = 'admin@onboard.app';

  if v_andi_id is null or v_jamie_id is null or v_owen_id is null then
    raise exception 'Create the 3 auth users first (see instructions at top of this file), then re-run STEP 2.';
  end if;

  -- Companies
  insert into companies (name, industry, size, website, description, primary_color, departments)
  values ('Sunrise Bistro', 'Food & Beverage', '11-50', 'https://sunrisebistro.co',
    'Sunrise Bistro is a full-service restaurant known for its warm hospitality and consistent food quality. We serve breakfast and lunch daily, and our team is the heart of everything we do.',
    '#f59e0b', array['Kitchen','Front of House','Management','Bar','Cashier','Delivery'])
  returning id into v_company_a;

  insert into companies (name, industry, size, website, description, primary_color)
  values ('Bloom Studio', 'Creative Agency', '11-50', 'https://bloomstudio.co', '', '#10b981')
  returning id into v_company_b;

  update profiles set company_id = v_company_a, name = 'Andi Saputra', role = 'admin' where id = v_andi_id;
  update profiles set company_id = v_company_b, name = 'Jamie Lee', role = 'admin' where id = v_jamie_id;
  update profiles set role = 'owner', name = 'Owen Park' where id = v_owen_id;

  -- Program 1: Kitchen Staff Onboarding
  insert into programs (company_id, name, description, target_role, estimated_days, status)
  values (v_company_a, 'Kitchen Staff Onboarding',
    'A 7-day onboarding program for new kitchen staff — covering food safety, kitchen stations, equipment, and daily operating procedures.',
    'Kitchen Staff', '7', 'published') returning id into v_prog1;

  insert into stages (company_id, program_id, name, description, "order", deadline)
  values (v_company_a, v_prog1, 'Day 1–2: Food Safety & Personal Hygiene',
    'Before you touch any food, every kitchen staff member must understand our food safety standards.', 1, 2)
  returning id into v_stage1;

  insert into materials (company_id, stage_id, type, title, data) values
    (v_company_a, v_stage1, 'reading', 'Food Safety & Hygiene Standards', jsonb_build_object('url', '', 'content', 'Welcome to Sunrise Bistro! Food safety is the foundation of everything we do.')),
    (v_company_a, v_stage1, 'checklist', 'Personal Hygiene & Uniform Checklist', jsonb_build_object('items', jsonb_build_array('Collect your uniform and non-slip kitchen shoes', 'Confirm your locker assignment', 'Practice proper 20-second handwashing', 'Review the color-coded cutting board system', 'Sign the Food Safety Acknowledgment form'))),
    (v_company_a, v_stage1, 'quiz', 'Food Safety Knowledge Check', jsonb_build_object('passingScore', 75, 'questions', jsonb_build_array(
      jsonb_build_object('question', 'At what temperature must cold food be stored?', 'options', jsonb_build_array('Below 10°C', 'Below 4°C', 'Below 0°C', 'Below 15°C'), 'correct', 1)
    )));

  insert into stages (company_id, program_id, name, description, "order", deadline)
  values (v_company_a, v_prog1, 'Day 3–5: Kitchen Stations & Equipment',
    'Get familiar with our kitchen layout, stations, and how to safely operate all equipment.', 2, 5)
  returning id into v_stage2;

  insert into materials (company_id, stage_id, type, title, data) values
    (v_company_a, v_stage2, 'video', 'Kitchen Station Tour — Sunrise Bistro', jsonb_build_object('url', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 'duration', '12 min')),
    (v_company_a, v_stage2, 'task', 'Shadow Head Chef for 1 Full Shift', jsonb_build_object('instructions', 'Spend an entire shift shadowing the Head Chef or a designated senior cook.', 'requiresConfirmation', true));

  insert into stages (company_id, program_id, name, description, "order", deadline)
  values (v_company_a, v_prog1, 'Day 6–7: Daily Operations & Sign-off',
    'Complete the final procedures and official sign-off before your first independent shift.', 3, 7)
  returning id into v_stage3;

  insert into materials (company_id, stage_id, type, title, data) values
    (v_company_a, v_stage3, 'document', 'Kitchen Rules & Code of Conduct — Sign-off', jsonb_build_object('description', 'Please read the complete Kitchen Rules & Code of Conduct.', 'acknowledgmentRequired', true)),
    (v_company_a, v_stage3, 'meeting', '30-Minute Check-in with Head Chef', jsonb_build_object('with', 'Head Chef', 'durationMin', 30, 'notes', 'Share what went well and any questions.'));

  -- Program 2: Front of House Staff Onboarding
  insert into programs (company_id, name, description, target_role, estimated_days, status)
  values (v_company_a, 'Front of House Staff Onboarding',
    'A 5-day program for new waiters, cashiers, and host staff — covering service standards, menu knowledge, and POS system operation.',
    'Waiter / Cashier', '5', 'published') returning id into v_prog2;

  insert into stages (company_id, program_id, name, description, "order", deadline)
  values (v_company_a, v_prog2, 'Day 1–2: Hospitality Standards & Menu',
    'Learn our service standards and menu inside out.', 1, 2) returning id into v_stage4;

  insert into materials (company_id, stage_id, type, title, data) values
    (v_company_a, v_stage4, 'video', 'Welcome & Guest Service Standards', jsonb_build_object('url', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 'duration', '15 min')),
    (v_company_a, v_stage4, 'reading', 'Front of House Service Manual', jsonb_build_object('url', '', 'content', 'Sunrise Bistro — Service Standards. Greet every guest within 30 seconds.'));

  insert into stages (company_id, program_id, name, description, "order", deadline)
  values (v_company_a, v_prog2, 'Day 3–5: POS System & Cash Handling',
    'Learn our point-of-sale system and cash handling procedures.', 2, 5) returning id into v_stage5;

  insert into materials (company_id, stage_id, type, title, data) values
    (v_company_a, v_stage5, 'reading', 'POS System Quick Guide', jsonb_build_object('url', '', 'content', 'Sunrise Bistro POS — Quick Reference Guide.')),
    (v_company_a, v_stage5, 'task', 'Supervised POS Practice Session', jsonb_build_object('instructions', 'Complete at least 3 practice transactions with your trainer present.', 'requiresConfirmation', true));

  -- Program 3: Restaurant Manager Orientation (draft)
  insert into programs (company_id, name, description, target_role, estimated_days, status)
  values (v_company_a, 'Restaurant Manager Orientation',
    'A 14-day orientation for new restaurant managers covering operations, team leadership, and financial reporting.',
    'Restaurant Manager', '14', 'draft') returning id into v_prog3;

  insert into stages (company_id, program_id, name, description, "order", deadline)
  values (v_company_a, v_prog3, 'Week 1: Operations & Leadership',
    'Understand how the restaurant runs day-to-day and how to lead your team.', 1, 7) returning id into v_stage6;

  insert into materials (company_id, stage_id, type, title, data) values
    (v_company_a, v_stage6, 'reading', 'Manager Handbook — Operations Guide', jsonb_build_object('url', '', 'content', 'As a manager, you are responsible for the experience of every guest.'));

  -- Employees
  select id into v_mat1 from materials where stage_id = v_stage1 order by id limit 1;

  insert into employees (company_id, name, email, role, department, start_date, employment_type, manager, phone, location, notes, assigned_program_id)
  values (v_company_a, 'Budi Hartono', 'budi.hartono@sunrisebistro.co', 'Kitchen Staff', 'Kitchen', '2026-07-07', 'Full-time', 'Andi Saputra', '+62 812-3456-7890', 'Jakarta', 'Strong learner. Has prior kitchen experience.', v_prog1)
  returning id into v_emp1;

  insert into employees (company_id, name, email, role, department, start_date, employment_type, manager, phone, location, notes, assigned_program_id)
  values (v_company_a, 'Sari Wulandari', 'sari.wulandari@sunrisebistro.co', 'Waiter', 'Front of House', '2026-07-10', 'Full-time', 'Andi Saputra', '+62 857-9012-3456', 'Jakarta', 'Needs extra support with POS system.', v_prog2)
  returning id into v_emp2;

  insert into employees (company_id, name, email, role, department, start_date, employment_type, manager, phone, location, notes, assigned_program_id)
  values (v_company_a, 'Ahmad Fauzi', 'ahmad.fauzi@sunrisebistro.co', 'Cashier', 'Front of House', '2026-06-15', 'Full-time', 'Andi Saputra', '+62 821-4567-8901', 'Jakarta', 'Completed onboarding ahead of schedule.', v_prog2)
  returning id into v_emp3;

  insert into employees (company_id, name, email, role, department, start_date, employment_type, manager, phone, location, notes, assigned_program_id)
  values (v_company_a, 'Rina Kurnia', 'rina.kurnia@sunrisebistro.co', 'Kitchen Staff', 'Kitchen', '2026-07-15', 'Probation', 'Budi Hartono', '+62 878-2345-6789', 'Jakarta', 'First week. Monitor closely.', v_prog1);

  insert into employees (company_id, name, email, role, department, start_date, employment_type, manager, phone, location, notes, assigned_program_id)
  values (v_company_a, 'Doni Pratama', 'doni.pratama@sunrisebistro.co', 'Kitchen Staff', 'Kitchen', '2026-07-16', 'Part-time', 'Budi Hartono', '+62 813-5678-9012', 'Jakarta', 'Available Mon–Fri only.', null);

  -- Mark some progress so the dashboard shows realistic numbers
  insert into employee_progress (employee_id, material_id)
  select v_emp1, id from materials where stage_id in (v_stage1, v_stage2);

  insert into employee_progress (employee_id, material_id)
  select v_emp2, id from materials where stage_id = v_stage4;

  insert into employee_progress (employee_id, material_id)
  select v_emp3, id from materials where stage_id in (v_stage4, v_stage5);
end $$;
