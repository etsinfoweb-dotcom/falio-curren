-- À exécuter UNE SEULE FOIS dans Supabase → SQL Editor
-- (ne pas ré-exécuter le fichier supabase_setup.sql, sinon les 185 montres seraient dupliquées)

alter table products add column if not exists specs jsonb;
