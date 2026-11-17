-- Autcar · cadastro de contas (email/palavra-passe e Google)
-- Execute no Supabase: SQL Editor > New query > colar > Run.
-- As credenciais e palavras-passe ficam em auth.users (geridas pelo Supabase Auth, com hash).
-- Estas tabelas guardam os dados da oficina/conta e o registo das contas criadas com Google.

-- ---------------------------------------------------------------------------
-- 1) profiles: uma linha por conta (qualquer método de entrada)
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  email       text not null,
  name        text not null default '',
  workshop    text not null default '',   -- vazio = perfil por completar (contas Google novas)
  phone       text not null default '',
  provider    text not null default 'email' check (provider in ('email', 'google')),
  avatar_url  text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists profiles_email_idx on public.profiles (lower(email));

-- ---------------------------------------------------------------------------
-- 2) google_accounts: registo das contas criadas através do Google
-- ---------------------------------------------------------------------------
create table if not exists public.google_accounts (
  user_id     uuid primary key references auth.users (id) on delete cascade,
  google_sub  text unique,                 -- identificador estável da conta Google
  email       text not null,
  full_name   text,
  avatar_url  text,
  created_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- 3) updated_at automático
-- ---------------------------------------------------------------------------
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_touch_updated_at on public.profiles;
create trigger profiles_touch_updated_at
  before update on public.profiles
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- 4) Quando nasce uma conta em auth.users, cria o perfil (e o registo Google)
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  meta     jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  prov     text  := case when coalesce(new.raw_app_meta_data ->> 'provider', 'email') = 'google' then 'google' else 'email' end;
  nome     text  := coalesce(nullif(meta ->> 'name', ''), nullif(meta ->> 'full_name', ''), '');
  avatar   text  := coalesce(meta ->> 'avatar_url', meta ->> 'picture');
begin
  insert into public.profiles (id, email, name, workshop, phone, provider, avatar_url)
  values (
    new.id,
    coalesce(new.email, ''),
    nome,
    coalesce(meta ->> 'workshop', ''),
    coalesce(meta ->> 'phone', ''),
    prov,
    avatar
  )
  on conflict (id) do nothing;

  if prov = 'google' then
    insert into public.google_accounts (user_id, google_sub, email, full_name, avatar_url)
    values (
      new.id,
      coalesce(meta ->> 'provider_id', meta ->> 'sub'),
      coalesce(new.email, ''),
      nullif(nome, ''),
      avatar
    )
    on conflict (user_id) do nothing;
  end if;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- 5) Segurança (RLS): cada utilizador só vê e altera a sua própria linha
-- ---------------------------------------------------------------------------
alter table public.profiles        enable row level security;
alter table public.google_accounts enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
  for select to authenticated using ((select auth.uid()) = id);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own" on public.profiles
  for insert to authenticated with check ((select auth.uid()) = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

drop policy if exists "google_accounts_select_own" on public.google_accounts;
create policy "google_accounts_select_own" on public.google_accounts
  for select to authenticated using ((select auth.uid()) = user_id);

-- google_accounts só é escrita pelo gatilho (security definer); sem políticas de escrita para o cliente.

-- Funções de gatilho não devem ser chamáveis pela API
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.touch_updated_at() from public, anon, authenticated;
