-- QG des associés : à coller UNE fois dans Supabase > SQL Editor > New query > Run.
-- Une seule table pour tout (tâches, appels, idées, commentaires, objectifs, réglages).

create table if not exists public.qg_items (
  col text not null,
  id text not null,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  primary key (col, id)
);

-- Sécurité : RLS activée SANS aucune règle. La clé publique (anon) ne peut ni lire ni écrire.
-- Seule la fonction serveur "qg", qui vérifie le code commun, accède aux données.
alter table public.qg_items enable row level security;
revoke all on public.qg_items from anon, authenticated;

-- Fusion d'une modification dans un élément existant (renvoie false si l'élément a été supprimé).
create or replace function public.qg_merge(p_col text, p_id text, p_patch jsonb)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.qg_items set data = data || p_patch, updated_at = now()
  where col = p_col and id = p_id;
  return found;
end;
$$;

revoke all on function public.qg_merge(text, text, jsonb) from public, anon, authenticated;
grant execute on function public.qg_merge(text, text, jsonb) to service_role;
