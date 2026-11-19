-- Banzic · Supabase · étape 2 (20/11/2026) : fiches DJ partagées, abonnés, commentaires, notifications
-- À coller dans Supabase > SQL Editor > New query, puis « Run ». On peut le relancer sans risque.

-- 1. Les fiches DJ visibles par tout le monde (nom, styles, ville, liens, dates annoncées, photo).
--    Seul le téléphone qui a créé la fiche peut la modifier : il garde une clé secrète, dont la base ne garde que l'empreinte.
create extension if not exists pgcrypto;
create table if not exists public.djs (
  cle         text primary key check (char_length(cle) between 2 and 40),   -- nom sans accents ni majuscules
  nom         text not null check (char_length(nom) between 2 and 40),
  profil      jsonb not null default '{}'::jsonb check (pg_column_size(profil) < 20000),
  jeton_hash  text not null,
  maj         timestamptz not null default now()
);
alter table public.djs enable row level security;
drop policy if exists "lire djs" on public.djs;
create policy "lire djs" on public.djs for select using (true);
-- La colonne jeton_hash n'est jamais lisible par l'appli
revoke select on public.djs from anon, authenticated;
grant select (cle, nom, profil, maj) on public.djs to anon, authenticated;

create or replace function public.publier_dj(p_cle text, p_nom text, p_jeton text, p_profil jsonb)
returns boolean language plpgsql security definer set search_path = public, extensions as $$
declare h text := encode(digest(p_jeton, 'sha256'), 'hex');
begin
  if char_length(coalesce(p_jeton, '')) < 20 then return false; end if;
  insert into public.djs (cle, nom, profil, jeton_hash, maj) values (p_cle, p_nom, coalesce(p_profil, '{}'::jsonb), h, now())
  on conflict (cle) do update set nom = excluded.nom, profil = excluded.profil, maj = now() where public.djs.jeton_hash = h;
  return found;
end $$;
grant execute on function public.publier_dj(text, text, text, jsonb) to anon, authenticated;

-- 2. Ce que les Bangers font sur une fiche DJ : banguer (casque), commenter, s'abonner, se désabonner.
create table if not exists public.interactions (
  id        uuid primary key default gen_random_uuid(),
  dj_cle    text not null check (char_length(dj_cle) between 2 and 40),
  dj_nom    text not null check (char_length(dj_nom) between 2 and 40),
  type      text not null,
  par       text check (par is null or char_length(par) <= 30),
  texte     text check (texte is null or char_length(texte) <= 280),
  appareil  text not null check (char_length(appareil) between 8 and 40),
  cree_le   timestamptz not null default now()
);
alter table public.interactions drop constraint if exists interactions_type_check;
alter table public.interactions add constraint interactions_type_check check (type in ('like', 'commentaire', 'abonne', 'desabonne'));
create unique index if not exists interactions_un_like on public.interactions (dj_cle, appareil) where type = 'like';
create index if not exists interactions_dj on public.interactions (dj_cle, cree_le desc);
alter table public.interactions enable row level security;
drop policy if exists "lire interactions" on public.interactions;
create policy "lire interactions" on public.interactions for select using (cree_le > now() - interval '365 days');
drop policy if exists "ajouter interaction" on public.interactions;
create policy "ajouter interaction" on public.interactions for insert with check (cree_le > now() - interval '5 minutes' and cree_le < now() + interval '5 minutes');
