-- Banzic · Supabase · étape 2 (20/11/2026) : notifications des DJ
-- À coller dans Supabase > SQL Editor > New query, puis « Run ».
-- Une table « interactions » : chaque fois qu'un Banger bangue un DJ (le casque) ou lui laisse un commentaire,
-- une ligne est ajoutée ; le DJ la voit dans sa cloche de notifications, sur son téléphone.

create table if not exists public.interactions (
  id        uuid primary key default gen_random_uuid(),
  dj_cle    text not null check (char_length(dj_cle) between 2 and 40),   -- nom du DJ sans accents ni majuscules
  dj_nom    text not null check (char_length(dj_nom) between 2 and 40),
  type      text not null check (type in ('like', 'commentaire')),
  par       text check (par is null or char_length(par) <= 30),         -- pseudo du Banger
  texte     text check (texte is null or char_length(texte) <= 280),    -- le commentaire
  appareil  text not null check (char_length(appareil) between 8 and 40), -- un même téléphone ne bangue un DJ qu'une fois
  cree_le   timestamptz not null default now()
);
create unique index if not exists interactions_un_like on public.interactions (dj_cle, appareil) where type = 'like';
create index if not exists interactions_dj on public.interactions (dj_cle, cree_le desc);

-- Sécurité (RLS) : tout le monde lit les 30 derniers jours ; l'appli peut ajouter ; personne ne modifie ni ne supprime.
alter table public.interactions enable row level security;
drop policy if exists "lire interactions" on public.interactions;
create policy "lire interactions" on public.interactions for select using (cree_le > now() - interval '30 days');
drop policy if exists "ajouter interaction" on public.interactions;
create policy "ajouter interaction" on public.interactions for insert with check (cree_le > now() - interval '5 minutes' and cree_le < now() + interval '5 minutes');
