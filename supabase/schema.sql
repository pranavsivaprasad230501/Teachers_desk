-- Supabase Schema for Tuition & Coaching Centre App

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- CENTRES
-- Represents an individual coaching center or branch
create table centres (
    id uuid primary key default uuid_generate_v4(),
    owner_id uuid references auth.users not null,
    name text not null,
    phone text,
    address text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security (RLS)
alter table centres enable row level security;
create policy "Owners can view their own centres" on centres for select using (auth.uid() = owner_id);
create policy "Owners can insert their own centres" on centres for insert with check (auth.uid() = owner_id);
create policy "Owners can update their own centres" on centres for update using (auth.uid() = owner_id);
create policy "Owners can delete their own centres" on centres for delete using (auth.uid() = owner_id);

-- BATCHES
-- E.g. "Morning English" or "Class 10 Math"
create table batches (
    id uuid primary key default uuid_generate_v4(),
    centre_id uuid references centres(id) on delete cascade not null,
    name text not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Note: RLS policies for batches, students, attendance, and fees should allow access based on the linked centre_id's owner_id.
-- For simplicity, we create policies that allow access if the user is the owner of the centre.
alter table batches enable row level security;
create policy "Owners can manage batches for their centres" on batches
    for all using (
        exists (select 1 from centres where centres.id = batches.centre_id and centres.owner_id = auth.uid())
    );

-- STUDENTS
-- Each student belongs to a specific batch and centre.
create table students (
    id uuid primary key default uuid_generate_v4(),
    centre_id uuid references centres(id) on delete cascade not null,
    batch_id uuid references batches(id) on delete set null,
    name text not null,
    parent_phone text not null,
    fee_amount numeric(10, 2) default 0 not null,
    fee_due_date integer default 1 check (fee_due_date >= 1 and fee_due_date <= 31),
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table students enable row level security;
create policy "Owners can manage students for their centres" on students
    for all using (
        exists (select 1 from centres where centres.id = students.centre_id and centres.owner_id = auth.uid())
    );

-- ATTENDANCE
-- Tracks daily attendance per student
create table attendance (
    id uuid primary key default uuid_generate_v4(),
    student_id uuid references students(id) on delete cascade not null,
    date date not null,
    status text check (status in ('present', 'absent')) not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table attendance enable row level security;
create policy "Owners can manage attendance" on attendance
    for all using (
        exists (
            select 1 from students
            join centres on centres.id = students.centre_id
            where students.id = attendance.student_id and centres.owner_id = auth.uid()
        )
    );

-- FEES
-- Tracks monthly fee payments per student
create table fees (
    id uuid primary key default uuid_generate_v4(),
    student_id uuid references students(id) on delete cascade not null,
    month text not null, -- Format: 'YYYY-MM'
    status text check (status in ('paid', 'unpaid', 'overdue')) default 'unpaid' not null,
    amount_paid numeric(10, 2) default 0,
    paid_at timestamp with time zone,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    UNIQUE(student_id, month)
);

alter table fees enable row level security;
create policy "Owners can manage fees" on fees
    for all using (
        exists (
            select 1 from students
            join centres on centres.id = students.centre_id
            where students.id = fees.student_id and centres.owner_id = auth.uid()
        )
    );
