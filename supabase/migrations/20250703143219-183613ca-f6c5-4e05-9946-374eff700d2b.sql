
-- Aggiungere colonna per lo stato del dominio
ALTER TABLE public.domains ADD COLUMN status TEXT DEFAULT 'active' CHECK (status IN ('active', 'closed'));

-- Creare tabella per i sottotask
CREATE TABLE public.subtasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  parent_task_id UUID REFERENCES public.domain_tasks(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  completed BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Abilitare RLS per i sottotask
ALTER TABLE public.subtasks ENABLE ROW LEVEL SECURITY;

-- Policy per i sottotask
CREATE POLICY "Allow all operations on subtasks" 
  ON public.subtasks 
  FOR ALL 
  USING (true);

-- Creare tabella per i commenti
CREATE TABLE public.task_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id UUID REFERENCES public.domain_tasks(id) ON DELETE CASCADE,
  subtask_id UUID REFERENCES public.subtasks(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CHECK (
    (task_id IS NOT NULL AND subtask_id IS NULL) OR 
    (task_id IS NULL AND subtask_id IS NOT NULL)
  )
);

-- Abilitare RLS per i commenti
ALTER TABLE public.task_comments ENABLE ROW LEVEL SECURITY;

-- Policy per i commenti
CREATE POLICY "Allow all operations on task_comments" 
  ON public.task_comments 
  FOR ALL 
  USING (true);

-- Creare funzione per aggiungere automaticamente i task ai domini esistenti
CREATE OR REPLACE FUNCTION public.add_template_to_all_domains()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.domain_tasks (
    domain_id,
    template_id,
    title,
    description,
    category,
    priority,
    estimated_hours
  )
  SELECT 
    d.id,
    NEW.id,
    NEW.title,
    NEW.description,
    NEW.category,
    NEW.priority,
    NEW.estimated_hours
  FROM public.domains d
  WHERE d.status = 'active';
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Creare trigger per aggiungere automaticamente i nuovi template a tutti i domini
CREATE TRIGGER add_template_to_domains_trigger
  AFTER INSERT ON public.task_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.add_template_to_all_domains();

-- Abilitare realtime per le nuove tabelle
ALTER PUBLICATION supabase_realtime ADD TABLE public.subtasks;
ALTER PUBLICATION supabase_realtime ADD TABLE public.task_comments;
