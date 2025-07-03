
-- Creare tabella per i sottotask dei template
CREATE TABLE public.template_subtasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  template_id UUID REFERENCES public.task_templates(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Abilitare RLS per i sottotask dei template
ALTER TABLE public.template_subtasks ENABLE ROW LEVEL SECURITY;

-- Policy per i sottotask dei template
CREATE POLICY "Allow all operations on template_subtasks" 
  ON public.template_subtasks 
  FOR ALL 
  USING (true);

-- Aggiungere colonne per le nuove funzionalità ai task templates
ALTER TABLE public.task_templates ADD COLUMN tags TEXT[];
ALTER TABLE public.task_templates ADD COLUMN dependencies TEXT[];
ALTER TABLE public.task_templates ADD COLUMN reference_links TEXT[];
ALTER TABLE public.task_templates ADD COLUMN checklist_items JSONB DEFAULT '[]';

-- Aggiungere colonne per le nuove funzionalità ai domain tasks
ALTER TABLE public.domain_tasks ADD COLUMN tags TEXT[];
ALTER TABLE public.domain_tasks ADD COLUMN dependencies TEXT[];
ALTER TABLE public.domain_tasks ADD COLUMN reference_links TEXT[];
ALTER TABLE public.domain_tasks ADD COLUMN checklist_items JSONB DEFAULT '[]';

-- Aggiornare la funzione per includere i nuovi campi e creare sottotask
CREATE OR REPLACE FUNCTION public.add_template_to_all_domains()
RETURNS TRIGGER AS $$
DECLARE
  domain_record RECORD;
  new_task_id UUID;
  subtask_record RECORD;
BEGIN
  -- Inserire il task principale per ogni dominio attivo
  FOR domain_record IN 
    SELECT id FROM public.domains WHERE status = 'active'
  LOOP
    -- Inserire il task principale
    INSERT INTO public.domain_tasks (
      domain_id,
      template_id,
      title,
      description,
      category,
      priority,
      estimated_hours,
      tags,
      dependencies,
      reference_links,
      checklist_items
    ) VALUES (
      domain_record.id,
      NEW.id,
      NEW.title,
      NEW.description,
      NEW.category,
      NEW.priority,
      NEW.estimated_hours,
      NEW.tags,
      NEW.dependencies,
      NEW.reference_links,
      NEW.checklist_items
    ) RETURNING id INTO new_task_id;
    
    -- Inserire i sottotask del template
    FOR subtask_record IN 
      SELECT * FROM public.template_subtasks 
      WHERE template_id = NEW.id 
      ORDER BY order_index
    LOOP
      INSERT INTO public.subtasks (
        parent_task_id,
        title,
        description
      ) VALUES (
        new_task_id,
        subtask_record.title,
        subtask_record.description
      );
    END LOOP;
  END LOOP;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Abilitare realtime per i template subtasks
ALTER PUBLICATION supabase_realtime ADD TABLE public.template_subtasks;
