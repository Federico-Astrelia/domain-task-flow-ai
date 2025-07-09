
-- Aggiungi colonne per il fissaggio dei domini
ALTER TABLE public.domains 
ADD COLUMN pinned BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN pinned_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN pinned_order INTEGER;

-- Crea un indice per migliorare le performance delle query ordinate
CREATE INDEX idx_domains_pinned_order ON public.domains(pinned DESC, pinned_order ASC, created_at DESC);
