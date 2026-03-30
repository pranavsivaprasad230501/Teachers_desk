-- Centre+ complete application schema
-- Apply this file to your Supabase project.

create extension if not exists "uuid-ossp";
create extension if not exists pgcrypto;

do $$
begin
    if not exists (
        select 1
        from pg_proc p
        join pg_namespace n on n.oid = p.pronamespace
        where p.proname = 'uuid_generate_v4'
          and n.nspname = 'public'
    ) then
        create function public.uuid_generate_v4()
        returns uuid
        language sql
        as $function$
            select gen_random_uuid();
        $function$;
    end if;
end;
$$;

create or replace function public.touch_updated_at()
returns trigger as $$
begin
    new.updated_at = timezone('utc'::text, now());
    return new;
end;
$$ language plpgsql;

create or replace function public.handle_new_user()
returns trigger as $$
begin
    insert into public.user_profiles (user_id, full_name, phone, role_hint, username)
    values (
        new.id,
        coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
        coalesce(new.phone, new.raw_user_meta_data ->> 'phone'),
        coalesce(new.raw_user_meta_data ->> 'role_hint', 'owner'),
        lower(nullif(new.raw_user_meta_data ->> 'username', ''))
    )
    on conflict (user_id) do update
    set
        full_name = excluded.full_name,
        phone = excluded.phone,
        role_hint = excluded.role_hint,
        username = coalesce(excluded.username, public.user_profiles.username),
        updated_at = timezone('utc'::text, now());

    return new;
end;
$$ language plpgsql security definer;

create or replace function public.has_centre_role(centre_uuid uuid, allowed_roles text[])
returns boolean as $$
declare
    has_access boolean;
begin
    execute
        'select exists (
            select 1
            from public.staff_memberships
            where staff_memberships.centre_id = $1
              and staff_memberships.user_id = auth.uid()
              and staff_memberships.role = any($2)
        )'
    into has_access
    using centre_uuid, allowed_roles;

    return coalesce(has_access, false);
end;
$$ language plpgsql stable security definer
set search_path = public, auth;

create or replace function public.is_batch_teacher(batch_uuid uuid)
returns boolean as $$
declare
    is_teacher boolean;
begin
    execute
        'select exists (
            select 1
            from public.teacher_batch_assignments
            where teacher_batch_assignments.batch_id = $1
              and teacher_batch_assignments.teacher_user_id = auth.uid()
        )'
    into is_teacher
    using batch_uuid;

    return coalesce(is_teacher, false);
end;
$$ language plpgsql stable security definer
set search_path = public, auth;

create table if not exists public.user_profiles (
    user_id uuid primary key references auth.users on delete cascade,
    username text,
    full_name text,
    phone text,
    role_hint text default 'owner',
    created_at timestamptz default timezone('utc'::text, now()) not null,
    updated_at timestamptz default timezone('utc'::text, now()) not null
);

alter table public.user_profiles add column if not exists username text;
create unique index if not exists user_profiles_username_lower_idx on public.user_profiles (lower(username)) where username is not null;

drop trigger if exists user_profiles_touch_updated_at on public.user_profiles;
create trigger user_profiles_touch_updated_at
before update on public.user_profiles
for each row execute function public.touch_updated_at();

alter table public.user_profiles enable row level security;
drop policy if exists "Users manage own profile" on public.user_profiles;
create policy "Users manage own profile" on public.user_profiles
    for all using (auth.uid() = user_id)
    with check (auth.uid() = user_id);

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

create table if not exists public.centres (
    id uuid primary key default uuid_generate_v4(),
    owner_id uuid references auth.users not null,
    name text not null,
    phone text,
    address text,
    created_at timestamptz default timezone('utc'::text, now()) not null,
    updated_at timestamptz default timezone('utc'::text, now()) not null
);

drop trigger if exists centres_touch_updated_at on public.centres;
create trigger centres_touch_updated_at
before update on public.centres
for each row execute function public.touch_updated_at();

alter table public.centres enable row level security;
drop policy if exists "Centre owners and staff can read centres" on public.centres;
drop policy if exists "Centre owners can create centres" on public.centres;
drop policy if exists "Centre owners and admins can update centres" on public.centres;
create policy "Centre owners and staff can read centres" on public.centres
    for select using (
        owner_id = auth.uid()
        or public.has_centre_role(id, array['owner', 'admin', 'teacher'])
    );
create policy "Centre owners can create centres" on public.centres
    for insert with check (owner_id = auth.uid());
create policy "Centre owners and admins can update centres" on public.centres
    for update using (
        owner_id = auth.uid()
        or public.has_centre_role(id, array['owner', 'admin'])
    )
    with check (
        owner_id = auth.uid()
        or public.has_centre_role(id, array['owner', 'admin'])
    );

create table if not exists public.branches (
    id uuid primary key default uuid_generate_v4(),
    centre_id uuid references public.centres(id) on delete cascade not null,
    name text not null,
    phone text,
    address text,
    is_main boolean default false not null,
    created_at timestamptz default timezone('utc'::text, now()) not null,
    updated_at timestamptz default timezone('utc'::text, now()) not null
);

drop trigger if exists branches_touch_updated_at on public.branches;
create trigger branches_touch_updated_at
before update on public.branches
for each row execute function public.touch_updated_at();

alter table public.branches enable row level security;
drop policy if exists "Staff can read branches" on public.branches;
drop policy if exists "Owners and admins manage branches" on public.branches;
create policy "Staff can read branches" on public.branches
    for select using (
        public.has_centre_role(centre_id, array['owner', 'admin', 'teacher'])
    );
create policy "Owners and admins manage branches" on public.branches
    for all using (
        public.has_centre_role(centre_id, array['owner', 'admin'])
    )
    with check (
        public.has_centre_role(centre_id, array['owner', 'admin'])
    );

create table if not exists public.staff_memberships (
    id uuid primary key default uuid_generate_v4(),
    user_id uuid references auth.users on delete cascade not null,
    centre_id uuid references public.centres(id) on delete cascade not null,
    branch_id uuid references public.branches(id) on delete set null,
    role text not null check (role in ('owner', 'admin', 'teacher')),
    created_at timestamptz default timezone('utc'::text, now()) not null,
    unique(user_id, centre_id)
);

alter table public.staff_memberships enable row level security;
drop policy if exists "Staff can read memberships in their centre" on public.staff_memberships;
drop policy if exists "Owners and admins manage memberships" on public.staff_memberships;
create policy "Staff can read memberships in their centre" on public.staff_memberships
    for select using (
        auth.uid() = user_id
        or public.has_centre_role(centre_id, array['owner', 'admin'])
    );
create policy "Owners and admins manage memberships" on public.staff_memberships
    for all using (
        public.has_centre_role(centre_id, array['owner', 'admin'])
    )
    with check (
        public.has_centre_role(centre_id, array['owner', 'admin'])
    );

create table if not exists public.staff_invites (
    id uuid primary key default uuid_generate_v4(),
    centre_id uuid references public.centres(id) on delete cascade not null,
    branch_id uuid references public.branches(id) on delete set null,
    full_name text,
    phone text not null,
    role text not null check (role in ('admin', 'teacher')),
    claimed_by_user_id uuid references auth.users on delete set null,
    created_at timestamptz default timezone('utc'::text, now()) not null
);

alter table public.staff_invites enable row level security;
drop policy if exists "Owners and admins manage invites" on public.staff_invites;
create policy "Owners and admins manage invites" on public.staff_invites
    for all using (
        public.has_centre_role(centre_id, array['owner', 'admin'])
    )
    with check (
        public.has_centre_role(centre_id, array['owner', 'admin'])
    );

create table if not exists public.batches (
    id uuid primary key default uuid_generate_v4(),
    centre_id uuid references public.centres(id) on delete cascade not null,
    branch_id uuid references public.branches(id) on delete cascade,
    name text not null,
    subject text,
    grade text,
    schedule text,
    capacity integer,
    created_at timestamptz default timezone('utc'::text, now()) not null,
    updated_at timestamptz default timezone('utc'::text, now()) not null
);

drop trigger if exists batches_touch_updated_at on public.batches;
create trigger batches_touch_updated_at
before update on public.batches
for each row execute function public.touch_updated_at();

alter table public.batches enable row level security;
drop policy if exists "Staff can read batches" on public.batches;
drop policy if exists "Owners admins manage batches" on public.batches;
create policy "Staff can read batches" on public.batches
    for select using (
        public.has_centre_role(centre_id, array['owner', 'admin', 'teacher'])
    );
create policy "Owners admins manage batches" on public.batches
    for all using (
        public.has_centre_role(centre_id, array['owner', 'admin'])
    )
    with check (
        public.has_centre_role(centre_id, array['owner', 'admin'])
    );

create table if not exists public.teacher_batch_assignments (
    id uuid primary key default uuid_generate_v4(),
    teacher_user_id uuid references auth.users on delete cascade not null,
    batch_id uuid references public.batches(id) on delete cascade not null,
    created_at timestamptz default timezone('utc'::text, now()) not null,
    unique(teacher_user_id, batch_id)
);

alter table public.teacher_batch_assignments enable row level security;
drop policy if exists "Staff can read teacher assignments" on public.teacher_batch_assignments;
drop policy if exists "Owners admins manage teacher assignments" on public.teacher_batch_assignments;
create policy "Staff can read teacher assignments" on public.teacher_batch_assignments
    for select using (
        exists (
            select 1
            from public.batches
            where public.batches.id = teacher_batch_assignments.batch_id
              and public.has_centre_role(public.batches.centre_id, array['owner', 'admin', 'teacher'])
        )
    );
create policy "Owners admins manage teacher assignments" on public.teacher_batch_assignments
    for all using (
        exists (
            select 1
            from public.batches
            where public.batches.id = teacher_batch_assignments.batch_id
              and public.has_centre_role(public.batches.centre_id, array['owner', 'admin'])
        )
    )
    with check (
        exists (
            select 1
            from public.batches
            where public.batches.id = teacher_batch_assignments.batch_id
              and public.has_centre_role(public.batches.centre_id, array['owner', 'admin'])
        )
    );

create table if not exists public.students (
    id uuid primary key default uuid_generate_v4(),
    centre_id uuid references public.centres(id) on delete cascade not null,
    branch_id uuid references public.branches(id) on delete set null,
    batch_id uuid references public.batches(id) on delete set null,
    name text not null,
    parent_name text,
    parent_email text,
    parent_phone text not null,
    fee_amount numeric(10, 2) default 0 not null,
    fee_due_date integer default 1 check (fee_due_date >= 1 and fee_due_date <= 31),
    roll_number text,
    portal_token text unique,
    notes text,
    joined_on date default current_date not null,
    status text default 'active' check (status in ('active', 'inactive', 'dropped')) not null,
    created_at timestamptz default timezone('utc'::text, now()) not null,
    updated_at timestamptz default timezone('utc'::text, now()) not null
);

drop trigger if exists students_touch_updated_at on public.students;
create trigger students_touch_updated_at
before update on public.students
for each row execute function public.touch_updated_at();

alter table public.students enable row level security;
drop policy if exists "Staff can read students" on public.students;
drop policy if exists "Owners admins manage students" on public.students;
create policy "Staff can read students" on public.students
    for select using (
        public.has_centre_role(centre_id, array['owner', 'admin'])
        or (batch_id is not null and public.is_batch_teacher(batch_id))
    );
create policy "Owners admins manage students" on public.students
    for all using (
        public.has_centre_role(centre_id, array['owner', 'admin'])
    )
    with check (
        public.has_centre_role(centre_id, array['owner', 'admin'])
    );

create table if not exists public.attendance (
    id uuid primary key default uuid_generate_v4(),
    student_id uuid references public.students(id) on delete cascade not null,
    date date not null,
    status text check (status in ('present', 'absent')) not null,
    marked_by uuid references auth.users on delete set null,
    created_at timestamptz default timezone('utc'::text, now()) not null,
    unique(student_id, date)
);

alter table public.attendance enable row level security;
drop policy if exists "Staff can read attendance" on public.attendance;
drop policy if exists "Owners admins teachers manage attendance" on public.attendance;
create policy "Staff can read attendance" on public.attendance
    for select using (
        exists (
            select 1
            from public.students
            where public.students.id = attendance.student_id
              and (
                  public.has_centre_role(public.students.centre_id, array['owner', 'admin'])
                  or (public.students.batch_id is not null and public.is_batch_teacher(public.students.batch_id))
              )
        )
    );
create policy "Owners admins teachers manage attendance" on public.attendance
    for all using (
        exists (
            select 1
            from public.students
            where public.students.id = attendance.student_id
              and (
                  public.has_centre_role(public.students.centre_id, array['owner', 'admin'])
                  or (public.students.batch_id is not null and public.is_batch_teacher(public.students.batch_id))
              )
        )
    )
    with check (
        exists (
            select 1
            from public.students
            where public.students.id = attendance.student_id
              and (
                  public.has_centre_role(public.students.centre_id, array['owner', 'admin'])
                  or (public.students.batch_id is not null and public.is_batch_teacher(public.students.batch_id))
              )
        )
    );

create table if not exists public.fees (
    id uuid primary key default uuid_generate_v4(),
    student_id uuid references public.students(id) on delete cascade not null,
    month text not null,
    status text check (status in ('paid', 'unpaid', 'overdue')) default 'unpaid' not null,
    amount_due numeric(10, 2) default 0 not null,
    amount_paid numeric(10, 2) default 0,
    paid_at timestamptz,
    reminder_stage text default 'none',
    created_at timestamptz default timezone('utc'::text, now()) not null,
    updated_at timestamptz default timezone('utc'::text, now()) not null,
    unique(student_id, month)
);

drop trigger if exists fees_touch_updated_at on public.fees;
create trigger fees_touch_updated_at
before update on public.fees
for each row execute function public.touch_updated_at();

alter table public.fees enable row level security;
drop policy if exists "Owners admins manage fees" on public.fees;
create policy "Owners admins manage fees" on public.fees
    for all using (
        exists (
            select 1
            from public.students
            where public.students.id = fees.student_id
              and public.has_centre_role(public.students.centre_id, array['owner', 'admin'])
        )
    )
    with check (
        exists (
            select 1
            from public.students
            where public.students.id = fees.student_id
              and public.has_centre_role(public.students.centre_id, array['owner', 'admin'])
        )
    );

create table if not exists public.enrollment_forms (
    id uuid primary key default uuid_generate_v4(),
    centre_id uuid references public.centres(id) on delete cascade not null,
    branch_id uuid references public.branches(id) on delete set null,
    token text unique not null,
    is_active boolean default true not null,
    created_at timestamptz default timezone('utc'::text, now()) not null
);

alter table public.enrollment_forms enable row level security;
drop policy if exists "Owners admins manage enrollment forms" on public.enrollment_forms;
create policy "Owners admins manage enrollment forms" on public.enrollment_forms
    for all using (
        public.has_centre_role(centre_id, array['owner', 'admin'])
    )
    with check (
        public.has_centre_role(centre_id, array['owner', 'admin'])
    );

create table if not exists public.enrollment_submissions (
    id uuid primary key default uuid_generate_v4(),
    centre_id uuid references public.centres(id) on delete cascade not null,
    branch_id uuid references public.branches(id) on delete set null,
    student_name text not null,
    parent_name text,
    parent_email text,
    parent_phone text not null,
    grade text,
    preferred_batch text,
    notes text,
    status text default 'new' check (status in ('new', 'accepted', 'rejected')) not null,
    linked_student_id uuid references public.students(id) on delete set null,
    created_at timestamptz default timezone('utc'::text, now()) not null
);

alter table public.enrollment_submissions enable row level security;
drop policy if exists "Owners admins manage enrollment submissions" on public.enrollment_submissions;
create policy "Owners admins manage enrollment submissions" on public.enrollment_submissions
    for all using (
        public.has_centre_role(centre_id, array['owner', 'admin'])
    )
    with check (
        public.has_centre_role(centre_id, array['owner', 'admin'])
    );

create table if not exists public.holidays (
    id uuid primary key default uuid_generate_v4(),
    centre_id uuid references public.centres(id) on delete cascade not null,
    branch_id uuid references public.branches(id) on delete set null,
    holiday_date date not null,
    title text not null,
    notes text,
    created_at timestamptz default timezone('utc'::text, now()) not null
);

alter table public.holidays enable row level security;
drop policy if exists "Staff can read holidays" on public.holidays;
drop policy if exists "Owners admins manage holidays" on public.holidays;
create policy "Staff can read holidays" on public.holidays
    for select using (
        public.has_centre_role(centre_id, array['owner', 'admin', 'teacher'])
    );
create policy "Owners admins manage holidays" on public.holidays
    for all using (
        public.has_centre_role(centre_id, array['owner', 'admin'])
    )
    with check (
        public.has_centre_role(centre_id, array['owner', 'admin'])
    );

create table if not exists public.timetable_entries (
    id uuid primary key default uuid_generate_v4(),
    batch_id uuid references public.batches(id) on delete cascade not null,
    weekday integer not null check (weekday between 0 and 6),
    start_time time not null,
    end_time time not null,
    topic text,
    room text,
    created_at timestamptz default timezone('utc'::text, now()) not null
);

alter table public.timetable_entries enable row level security;
drop policy if exists "Staff can read timetable entries" on public.timetable_entries;
drop policy if exists "Owners admins manage timetable entries" on public.timetable_entries;
create policy "Staff can read timetable entries" on public.timetable_entries
    for select using (
        exists (
            select 1
            from public.batches
            where public.batches.id = timetable_entries.batch_id
              and (
                  public.has_centre_role(public.batches.centre_id, array['owner', 'admin'])
                  or public.is_batch_teacher(public.batches.id)
              )
        )
    );
create policy "Owners admins manage timetable entries" on public.timetable_entries
    for all using (
        exists (
            select 1
            from public.batches
            where public.batches.id = timetable_entries.batch_id
              and public.has_centre_role(public.batches.centre_id, array['owner', 'admin'])
        )
    )
    with check (
        exists (
            select 1
            from public.batches
            where public.batches.id = timetable_entries.batch_id
              and public.has_centre_role(public.batches.centre_id, array['owner', 'admin'])
        )
    );

create table if not exists public.tests (
    id uuid primary key default uuid_generate_v4(),
    batch_id uuid references public.batches(id) on delete cascade not null,
    title text not null,
    max_marks numeric(10, 2) not null,
    test_date date not null,
    created_by uuid references auth.users on delete set null,
    created_at timestamptz default timezone('utc'::text, now()) not null
);

alter table public.tests enable row level security;
drop policy if exists "Staff can read tests" on public.tests;
drop policy if exists "Owners admins teachers manage tests" on public.tests;
create policy "Staff can read tests" on public.tests
    for select using (
        exists (
            select 1
            from public.batches
            where public.batches.id = tests.batch_id
              and (
                  public.has_centre_role(public.batches.centre_id, array['owner', 'admin'])
                  or public.is_batch_teacher(public.batches.id)
              )
        )
    );
create policy "Owners admins teachers manage tests" on public.tests
    for all using (
        exists (
            select 1
            from public.batches
            where public.batches.id = tests.batch_id
              and (
                  public.has_centre_role(public.batches.centre_id, array['owner', 'admin'])
                  or public.is_batch_teacher(public.batches.id)
              )
        )
    )
    with check (
        exists (
            select 1
            from public.batches
            where public.batches.id = tests.batch_id
              and (
                  public.has_centre_role(public.batches.centre_id, array['owner', 'admin'])
                  or public.is_batch_teacher(public.batches.id)
              )
        )
    );

create table if not exists public.test_scores (
    id uuid primary key default uuid_generate_v4(),
    test_id uuid references public.tests(id) on delete cascade not null,
    student_id uuid references public.students(id) on delete cascade not null,
    marks numeric(10, 2) not null,
    remarks text,
    created_at timestamptz default timezone('utc'::text, now()) not null,
    unique(test_id, student_id)
);

alter table public.test_scores enable row level security;
drop policy if exists "Staff can read test scores" on public.test_scores;
drop policy if exists "Owners admins teachers manage test scores" on public.test_scores;
create policy "Staff can read test scores" on public.test_scores
    for select using (
        exists (
            select 1
            from public.tests
            join public.batches on public.batches.id = public.tests.batch_id
            where public.tests.id = test_scores.test_id
              and (
                  public.has_centre_role(public.batches.centre_id, array['owner', 'admin'])
                  or public.is_batch_teacher(public.batches.id)
              )
        )
    );
create policy "Owners admins teachers manage test scores" on public.test_scores
    for all using (
        exists (
            select 1
            from public.tests
            join public.batches on public.batches.id = public.tests.batch_id
            where public.tests.id = test_scores.test_id
              and (
                  public.has_centre_role(public.batches.centre_id, array['owner', 'admin'])
                  or public.is_batch_teacher(public.batches.id)
              )
        )
    )
    with check (
        exists (
            select 1
            from public.tests
            join public.batches on public.batches.id = public.tests.batch_id
            where public.tests.id = test_scores.test_id
              and (
                  public.has_centre_role(public.batches.centre_id, array['owner', 'admin'])
                  or public.is_batch_teacher(public.batches.id)
              )
        )
    );

create table if not exists public.risk_alerts (
    id uuid primary key default uuid_generate_v4(),
    centre_id uuid references public.centres(id) on delete cascade not null,
    student_id uuid references public.students(id) on delete cascade not null,
    alert_type text not null check (alert_type in ('consecutive_absence', 'low_attendance')),
    severity text default 'medium' check (severity in ('low', 'medium', 'high')) not null,
    status text default 'open' check (status in ('open', 'resolved')) not null,
    metadata jsonb default '{}'::jsonb not null,
    created_at timestamptz default timezone('utc'::text, now()) not null,
    resolved_at timestamptz
);

alter table public.risk_alerts enable row level security;
drop policy if exists "Owners admins read risk alerts" on public.risk_alerts;
drop policy if exists "Owners admins manage risk alerts" on public.risk_alerts;
create policy "Owners admins read risk alerts" on public.risk_alerts
    for select using (
        public.has_centre_role(centre_id, array['owner', 'admin'])
    );
create policy "Owners admins manage risk alerts" on public.risk_alerts
    for all using (
        public.has_centre_role(centre_id, array['owner', 'admin'])
    )
    with check (
        public.has_centre_role(centre_id, array['owner', 'admin'])
    );

create table if not exists public.notification_messages (
    id uuid primary key default uuid_generate_v4(),
    centre_id uuid references public.centres(id) on delete cascade not null,
    branch_id uuid references public.branches(id) on delete set null,
    student_id uuid references public.students(id) on delete set null,
    batch_id uuid references public.batches(id) on delete set null,
    category text not null,
    channel text default 'whatsapp' not null,
    recipient_phone text,
    recipient_email text,
    message_body text not null,
    status text default 'queued' check (status in ('queued', 'sent', 'failed')) not null,
    scheduled_for timestamptz default timezone('utc'::text, now()) not null,
    sent_at timestamptz,
    provider_message_id text,
    payload jsonb default '{}'::jsonb not null,
    created_at timestamptz default timezone('utc'::text, now()) not null
);

alter table public.notification_messages enable row level security;
drop policy if exists "Owners admins read notification messages" on public.notification_messages;
drop policy if exists "Owners admins manage notification messages" on public.notification_messages;
create policy "Owners admins read notification messages" on public.notification_messages
    for select using (
        public.has_centre_role(centre_id, array['owner', 'admin'])
    );
create policy "Owners admins manage notification messages" on public.notification_messages
    for all using (
        public.has_centre_role(centre_id, array['owner', 'admin'])
    )
    with check (
        public.has_centre_role(centre_id, array['owner', 'admin'])
    );

create table if not exists public.broadcast_messages (
    id uuid primary key default uuid_generate_v4(),
    centre_id uuid references public.centres(id) on delete cascade not null,
    branch_id uuid references public.branches(id) on delete set null,
    batch_id uuid references public.batches(id) on delete set null,
    title text not null,
    message text not null,
    created_by uuid references auth.users on delete set null,
    created_at timestamptz default timezone('utc'::text, now()) not null
);

alter table public.broadcast_messages enable row level security;
drop policy if exists "Owners admins manage broadcasts" on public.broadcast_messages;
create policy "Owners admins manage broadcasts" on public.broadcast_messages
    for all using (
        public.has_centre_role(centre_id, array['owner', 'admin'])
    )
    with check (
        public.has_centre_role(centre_id, array['owner', 'admin'])
    );

create table if not exists public.subscriptions (
    id uuid primary key default uuid_generate_v4(),
    centre_id uuid references public.centres(id) on delete cascade not null unique,
    status text not null default 'trialing',
    plan_key text,
    stripe_customer_id text,
    stripe_subscription_id text,
    stripe_price_id text,
    trial_ends_at timestamptz,
    current_period_end timestamptz,
    cancel_at_period_end boolean not null default false,
    created_at timestamptz default timezone('utc'::text, now()) not null,
    updated_at timestamptz default timezone('utc'::text, now()) not null
);

drop trigger if exists subscriptions_touch_updated_at on public.subscriptions;
create trigger subscriptions_touch_updated_at
before update on public.subscriptions
for each row execute function public.touch_updated_at();

alter table public.subscriptions enable row level security;
drop policy if exists "Owners admins manage subscriptions" on public.subscriptions;
create policy "Owners admins manage subscriptions" on public.subscriptions
    for all using (
        public.has_centre_role(centre_id, array['owner', 'admin'])
    )
    with check (
        public.has_centre_role(centre_id, array['owner', 'admin'])
    );

create table if not exists public.payment_events (
    id uuid primary key default uuid_generate_v4(),
    centre_id uuid references public.centres(id) on delete cascade not null,
    stripe_event_id text unique not null,
    event_type text not null,
    payload jsonb not null default '{}'::jsonb,
    created_at timestamptz default timezone('utc'::text, now()) not null
);

alter table public.payment_events enable row level security;
drop policy if exists "Owners admins read payment events" on public.payment_events;
create policy "Owners admins read payment events" on public.payment_events
    for select using (
        public.has_centre_role(centre_id, array['owner', 'admin'])
    );

create index if not exists idx_staff_memberships_user_id on public.staff_memberships (user_id);
create index if not exists idx_staff_memberships_centre_id on public.staff_memberships (centre_id);
create index if not exists idx_students_centre_id on public.students (centre_id);
create index if not exists idx_students_batch_id on public.students (batch_id);
create index if not exists idx_students_portal_token on public.students (portal_token);
create index if not exists idx_attendance_student_date on public.attendance (student_id, date desc);
create index if not exists idx_fees_month_status on public.fees (month, status);
create index if not exists idx_notification_messages_status_schedule on public.notification_messages (status, scheduled_for);
create index if not exists idx_risk_alerts_centre_status on public.risk_alerts (centre_id, status);
