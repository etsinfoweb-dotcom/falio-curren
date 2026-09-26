-- À exécuter UNE SEULE FOIS dans Supabase → SQL Editor
-- (ne pas ré-exécuter supabase_setup.sql, sinon les 185 montres seraient dupliquées)

create table if not exists site_settings (
  id integer primary key default 1,
  logo_image text,
  brand_name text not null default 'FALIO',
  brand_tagline text not null default 'MONTRES CURREN',
  hero_image text,
  hero_kicker text not null default 'FALIO PRÉSENTE CURREN',
  hero_title text not null default 'Le style CURREN.',
  hero_text text not null default 'Découvrez chez FALIO une sélection de montres CURREN choisies pour leur style. Trouvez votre modèle, choisissez sa couleur et commandez simplement sur WhatsApp.',
  cta_text text not null default 'DÉCOUVRIR LE CATALOGUE',
  story_image text,
  story_kicker text not null default 'L''ESPRIT FALIO · CURREN',
  story_title text not null default 'Un style qui vous ressemble.',
  story_text text not null default 'FALIO vous propose une sélection de montres CURREN aux lignes affirmées et aux couleurs variées. Choisissez votre modèle et contactez-nous pour confirmer sa disponibilité.',
  updated_at timestamptz not null default now(),
  constraint single_row check (id = 1)
);

alter table site_settings enable row level security;

insert into site_settings (id, hero_image, story_image)
values (1, 'assets/catalogue/011.jpg', 'assets/catalogue/011.jpg')
on conflict (id) do nothing;
