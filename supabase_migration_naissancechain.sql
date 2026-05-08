-- IdentiGuinee / NaissanceChain
-- Migration d'alignement avec la documentation technique (01/05/2026)
-- A exécuter dans Supabase SQL Editor (projet unifié).

BEGIN;

-- ---------------------------------------------------------------------------
-- 1) Table citoyens : colonnes minimales + colonnes profil/connexion
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.citoyens (
  id SERIAL PRIMARY KEY,
  nom VARCHAR(100),
  prenom VARCHAR(100),
  date_naissance VARCHAR(20),
  lieu_naissance VARCHAR(100),
  telephone VARCHAR(20),
  email VARCHAR(100) UNIQUE,
  password TEXT,
  statut_demande VARCHAR(20) DEFAULT 'EN_ATTENTE',
  id_acte_lie VARCHAR(20),
  avatar_url TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

ALTER TABLE public.citoyens
  ADD COLUMN IF NOT EXISTS nom VARCHAR(100),
  ADD COLUMN IF NOT EXISTS prenom VARCHAR(100),
  ADD COLUMN IF NOT EXISTS date_naissance VARCHAR(20),
  ADD COLUMN IF NOT EXISTS lieu_naissance VARCHAR(100),
  ADD COLUMN IF NOT EXISTS telephone VARCHAR(20),
  ADD COLUMN IF NOT EXISTS email VARCHAR(100),
  ADD COLUMN IF NOT EXISTS password TEXT,
  ADD COLUMN IF NOT EXISTS statut_demande VARCHAR(20) DEFAULT 'EN_ATTENTE',
  ADD COLUMN IF NOT EXISTS id_acte_lie VARCHAR(20),
  ADD COLUMN IF NOT EXISTS avatar_url TEXT,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW();

-- ---------------------------------------------------------------------------
-- 2) Table documents_certifies : structure doc + compat portail existant
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.documents_certifies (
  id SERIAL PRIMARY KEY,
  id_acte VARCHAR(20),
  citoyen_id INT,
  statut_demande VARCHAR(20) DEFAULT 'EN_ATTENTE',
  hash_document VARCHAR(64),
  qr_code_url TEXT,
  pdf_url TEXT,
  date_generation TIMESTAMP DEFAULT NOW(),
  statut VARCHAR(20) DEFAULT 'GENERE'
);

ALTER TABLE public.documents_certifies
  ADD COLUMN IF NOT EXISTS id_acte VARCHAR(20),
  ADD COLUMN IF NOT EXISTS citoyen_id INT,
  ADD COLUMN IF NOT EXISTS statut_demande VARCHAR(20) DEFAULT 'EN_ATTENTE',
  ADD COLUMN IF NOT EXISTS hash_document VARCHAR(64),
  ADD COLUMN IF NOT EXISTS qr_code_url TEXT,
  ADD COLUMN IF NOT EXISTS pdf_url TEXT,
  ADD COLUMN IF NOT EXISTS date_generation TIMESTAMP DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS statut VARCHAR(20) DEFAULT 'GENERE';

-- Compatibilité rétroactive avec anciennes requêtes frontend
ALTER TABLE public.documents_certifies
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW();

-- ---------------------------------------------------------------------------
-- 3) Clés étrangères (idempotent via bloc DO)
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'documents_certifies_citoyen_id_fkey'
  ) THEN
    ALTER TABLE public.documents_certifies
      ADD CONSTRAINT documents_certifies_citoyen_id_fkey
      FOREIGN KEY (citoyen_id) REFERENCES public.citoyens(id) ON DELETE CASCADE;
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'citoyens_id_acte_lie_fkey'
  ) THEN
    ALTER TABLE public.citoyens
      ADD CONSTRAINT citoyens_id_acte_lie_fkey
      FOREIGN KEY (id_acte_lie) REFERENCES public.naissancechain(id_acte);
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'documents_certifies_id_acte_fkey'
  ) THEN
    ALTER TABLE public.documents_certifies
      ADD CONSTRAINT documents_certifies_id_acte_fkey
      FOREIGN KEY (id_acte) REFERENCES public.naissancechain(id_acte);
  END IF;
END$$;

-- ---------------------------------------------------------------------------
-- 4) Normalisation des valeurs (alignement doc)
-- ---------------------------------------------------------------------------
UPDATE public.documents_certifies
SET statut_demande = 'EN_ATTENTE'
WHERE statut_demande IS NULL
   OR UPPER(statut_demande) IN ('EN COURS', 'EN_COURS', 'PENDING', 'EN ATTENTE');

UPDATE public.documents_certifies
SET statut_demande = 'TERMINEE'
WHERE UPPER(statut_demande) IN ('TERMINEE', 'TERMINÉE', 'TERMINE', 'TERMINÉ');

UPDATE public.documents_certifies
SET statut = 'GENERE'
WHERE statut IS NULL
   OR UPPER(statut) IN ('GÉNÉRÉ', 'GENERE', 'GENERATED');

UPDATE public.citoyens
SET statut_demande = 'EN_ATTENTE'
WHERE statut_demande IS NULL
   OR UPPER(statut_demande) IN ('EN COURS', 'EN_COURS', 'PENDING', 'EN ATTENTE');

-- ---------------------------------------------------------------------------
-- 5) Index de performance
-- ---------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_naissancechain_id_acte
  ON public.naissancechain (id_acte);

CREATE INDEX IF NOT EXISTS idx_citoyens_email
  ON public.citoyens (email);

CREATE INDEX IF NOT EXISTS idx_documents_certifies_citoyen_id
  ON public.documents_certifies (citoyen_id);

CREATE INDEX IF NOT EXISTS idx_documents_certifies_id_acte
  ON public.documents_certifies (id_acte);

CREATE INDEX IF NOT EXISTS idx_documents_certifies_date_generation
  ON public.documents_certifies (date_generation DESC);

-- ---------------------------------------------------------------------------
-- 6) Trigger : garantir date_generation en insertion
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.set_documents_date_generation()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.date_generation IS NULL THEN
    NEW.date_generation := NOW();
  END IF;
  IF NEW.created_at IS NULL THEN
    NEW.created_at := NOW();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_set_documents_date_generation ON public.documents_certifies;
CREATE TRIGGER trg_set_documents_date_generation
BEFORE INSERT ON public.documents_certifies
FOR EACH ROW
EXECUTE FUNCTION public.set_documents_date_generation();

-- ---------------------------------------------------------------------------
-- 7) RLS policies (mode démo hackathon)
-- ---------------------------------------------------------------------------
-- NOTE: ces policies sont permissives pour faciliter la démo front-end
-- avec clé anon (auth custom dans la table citoyens).
-- A durcir après le hackathon.

ALTER TABLE public.citoyens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents_certifies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.naissancechain ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS citoyens_select_all ON public.citoyens;
DROP POLICY IF EXISTS citoyens_insert_all ON public.citoyens;
DROP POLICY IF EXISTS citoyens_update_all ON public.citoyens;
DROP POLICY IF EXISTS documents_select_all ON public.documents_certifies;
DROP POLICY IF EXISTS documents_insert_all ON public.documents_certifies;
DROP POLICY IF EXISTS documents_update_all ON public.documents_certifies;
DROP POLICY IF EXISTS naissancechain_select_all ON public.naissancechain;

CREATE POLICY citoyens_select_all
ON public.citoyens
FOR SELECT
USING (true);

CREATE POLICY citoyens_insert_all
ON public.citoyens
FOR INSERT
WITH CHECK (true);

CREATE POLICY citoyens_update_all
ON public.citoyens
FOR UPDATE
USING (true)
WITH CHECK (true);

CREATE POLICY documents_select_all
ON public.documents_certifies
FOR SELECT
USING (true);

CREATE POLICY documents_insert_all
ON public.documents_certifies
FOR INSERT
WITH CHECK (true);

CREATE POLICY documents_update_all
ON public.documents_certifies
FOR UPDATE
USING (true)
WITH CHECK (true);

CREATE POLICY naissancechain_select_all
ON public.naissancechain
FOR SELECT
USING (true);

COMMIT;

-- ---------------------------------------------------------------------------
-- PATCH v2 : colonnes supplémentaires + policy DELETE manquante
-- A exécuter après la migration initiale
-- ---------------------------------------------------------------------------

-- Ajout colonnes optionnelles pour enrichissement document
ALTER TABLE public.documents_certifies
  ADD COLUMN IF NOT EXISTS type_document TEXT,
  ADD COLUMN IF NOT EXISTS nom VARCHAR(100),
  ADD COLUMN IF NOT EXISTS prenom VARCHAR(100),
  ADD COLUMN IF NOT EXISTS date_naissance VARCHAR(30),
  ADD COLUMN IF NOT EXISTS lieu_naissance VARCHAR(100),
  ADD COLUMN IF NOT EXISTS genre VARCHAR(10);

-- Policy DELETE manquante (nécessaire pour la suppression côté citoyen)
DROP POLICY IF EXISTS documents_delete_all ON public.documents_certifies;
CREATE POLICY documents_delete_all
ON public.documents_certifies
FOR DELETE
USING (true);

-- Policy DELETE citoyens
DROP POLICY IF EXISTS citoyens_delete_all ON public.citoyens;
CREATE POLICY citoyens_delete_all
ON public.citoyens
FOR DELETE
USING (true);
