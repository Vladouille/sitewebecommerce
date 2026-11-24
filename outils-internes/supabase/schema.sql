-- QG des associés : à coller UNE fois dans Supabase > SQL Editor > New query > Run.
-- AVANT de cliquer sur Run : remplace CHANGE-MOI-par-votre-code (ligne 22) par votre code commun
-- (12 caractères minimum conseillés, par exemple trois mots séparés par des tirets).

-- 1. Les données (tâches, appels, idées, commentaires, objectifs, réglages) dans une seule table.
create table if not exists public.qg_items (
  col text not null,
  id text not null,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  primary key (col, id)
);
-- Personne ne peut lire ou écrire la table directement, même avec la clé publique.
alter table public.qg_items enable row level security;
revoke all on public.qg_items from anon, authenticated;

-- 2. Le code commun, rangé hors de portée de la page.
create schema if not exists qg_private;
revoke all on schema qg_private from public, anon, authenticated;
create table if not exists qg_private.settings (id int primary key default 1 check (id = 1), code text not null);
insert into qg_private.settings (id, code) values (1, 'CHANGE-MOI-par-votre-code')
  on conflict (id) do update set code = excluded.code;

create or replace function qg_private.check_code(p_code text) returns void
language plpgsql security definer set search_path = qg_private as $$
begin
  if p_code is null or not exists (
    select 1 from qg_private.settings
    where code = p_code and length(code) >= 8 and code <> 'CHANGE-MOI-par-votre-code'
  ) then
    perform pg_sleep(0.8); -- ralentit les essais au hasard
    raise exception 'bad_code' using errcode = '28000';
  end if;
end;
$$;

-- 3. Les seules portes d'entrée : chacune vérifie le code avant de faire quoi que ce soit.
create or replace function public.qg_ping(p_code text) returns boolean
language plpgsql security definer set search_path = public, qg_private as $$
begin
  perform qg_private.check_code(p_code);
  return true;
end;
$$;

create or replace function public.qg_list(p_code text)
returns table (col text, id text, data jsonb)
language plpgsql security definer set search_path = public, qg_private as $$
begin
  perform qg_private.check_code(p_code);
  return query select i.col, i.id, i.data from public.qg_items i;
end;
$$;

create or replace function public.qg_set(p_code text, p_col text, p_id text, p_data jsonb) returns void
language plpgsql security definer set search_path = public, qg_private as $$
begin
  perform qg_private.check_code(p_code);
  if p_col not in ('tasks', 'calls', 'ideas', 'comments', 'goals', 'config')
     or p_id !~ '^[A-Za-z0-9_.~:@+-]{1,200}$'
     or jsonb_typeof(p_data) <> 'object'
     or length(p_data::text) > 250000 then
    raise exception 'invalid_argument' using errcode = '22023';
  end if;
  insert into public.qg_items (col, id, data, updated_at) values (p_col, p_id, p_data, now())
  on conflict (col, id) do update set data = excluded.data, updated_at = now();
end;
$$;

-- Renvoie false si l'élément a été supprimé entre-temps par un associé.
create or replace function public.qg_merge(p_code text, p_col text, p_id text, p_patch jsonb) returns boolean
language plpgsql security definer set search_path = public, qg_private as $$
begin
  perform qg_private.check_code(p_code);
  if jsonb_typeof(p_patch) <> 'object' or length(p_patch::text) > 250000 then
    raise exception 'invalid_argument' using errcode = '22023';
  end if;
  update public.qg_items set data = data || p_patch, updated_at = now() where col = p_col and id = p_id;
  return found;
end;
$$;

create or replace function public.qg_delete(p_code text, p_col text, p_id text) returns void
language plpgsql security definer set search_path = public, qg_private as $$
begin
  perform qg_private.check_code(p_code);
  delete from public.qg_items where col = p_col and id = p_id;
end;
$$;

revoke all on function public.qg_ping(text), public.qg_list(text), public.qg_set(text, text, text, jsonb),
  public.qg_merge(text, text, text, jsonb), public.qg_delete(text, text, text) from public;
grant execute on function public.qg_ping(text), public.qg_list(text), public.qg_set(text, text, text, jsonb),
  public.qg_merge(text, text, text, jsonb), public.qg_delete(text, text, text) to anon, authenticated;
revoke all on function qg_private.check_code(text) from public, anon, authenticated;

-- Pour changer le code plus tard (chaque téléphone le redemandera) :
-- update qg_private.settings set code = 'nouveau-code-commun' where id = 1;
