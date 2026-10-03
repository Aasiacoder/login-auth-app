do $$ begin
  create type public.app_role as enum ('admin', 'user');
exception when duplicate_object then null;
end $$;

create table if not exists public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  role public.app_role not null default 'user',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.user_roles enable row level security;

revoke all on public.user_roles from anon, authenticated;
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role);
$$;

drop policy if exists "Users can read own role" on public.user_roles;
create policy "Users can read own role" on public.user_roles
  for select to authenticated using (auth.uid() = user_id);

drop policy if exists "Admins can read all roles" on public.user_roles;
create policy "Admins can read all roles" on public.user_roles
  for select to authenticated using (public.has_role(auth.uid(), 'admin'));

create or replace function public.handle_new_user_role()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  insert into public.user_roles (user_id, role) values (new.id, 'user')
  on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_assign_role on auth.users;
create trigger on_auth_user_created_assign_role
  after insert on auth.users
  for each row execute function public.handle_new_user_role();

insert into public.user_roles (user_id, role)
select id, 'user' from auth.users
on conflict (user_id) do nothing;

update public.user_roles set role = 'admin', updated_at = now()
where user_id in (select id from auth.users where lower(email) = 'aasia3017@gmail.com');

create or replace function public.get_my_role()
returns public.app_role
language sql stable security definer set search_path = public
as $$
  select coalesce(
    (select role from public.user_roles where user_id = auth.uid()),
    'user'::public.app_role
  );
$$;

create or replace function public.admin_list_users()
returns table (id uuid, email text, role public.app_role, created_at timestamptz, last_sign_in_at timestamptz)
language plpgsql stable security definer set search_path = public
as $$
begin
  if not public.has_role(auth.uid(), 'admin') then
    raise exception 'Only admins can view the user list' using errcode = '42501';
  end if;
  return query
    select u.id, u.email::text, coalesce(r.role, 'user'::public.app_role), u.created_at, u.last_sign_in_at
    from auth.users u
    left join public.user_roles r on r.user_id = u.id
    order by u.created_at;
end;
$$;

create or replace function public.admin_set_user_role(_user_id uuid, _role public.app_role)
returns void
language plpgsql security definer set search_path = public
as $$
begin
  if not public.has_role(auth.uid(), 'admin') then
    raise exception 'Only admins can change roles' using errcode = '42501';
  end if;
  if _user_id = auth.uid() then
    raise exception 'You cannot change your own role';
  end if;
  if not exists (select 1 from auth.users where id = _user_id) then
    raise exception 'User not found';
  end if;
  insert into public.user_roles (user_id, role) values (_user_id, _role)
  on conflict (user_id) do update set role = excluded.role, updated_at = now();
end;
$$;

revoke all on function public.has_role(uuid, public.app_role) from public, anon;
revoke all on function public.get_my_role() from public, anon;
revoke all on function public.admin_list_users() from public, anon;
revoke all on function public.admin_set_user_role(uuid, public.app_role) from public, anon;
grant execute on function public.has_role(uuid, public.app_role) to authenticated, service_role;
grant execute on function public.get_my_role() to authenticated;
grant execute on function public.admin_list_users() to authenticated;
grant execute on function public.admin_set_user_role(uuid, public.app_role) to authenticated;