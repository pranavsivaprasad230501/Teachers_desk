alter table public.students
    add column if not exists parent_email text;

alter table public.enrollment_submissions
    add column if not exists parent_email text;

alter table public.notification_messages
    add column if not exists recipient_email text;

alter table public.notification_messages
    alter column recipient_phone drop not null;
