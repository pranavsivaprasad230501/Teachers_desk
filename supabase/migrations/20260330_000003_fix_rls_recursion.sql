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
