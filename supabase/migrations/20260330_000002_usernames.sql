alter table public.user_profiles add column if not exists username text;

create unique index if not exists user_profiles_username_lower_idx
on public.user_profiles (lower(username))
where username is not null;

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
