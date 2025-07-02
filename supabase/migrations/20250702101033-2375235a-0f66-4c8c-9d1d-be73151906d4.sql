
-- Crea la tabella per i domini
CREATE TABLE public.domains (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Crea la tabella per i template di task
CREATE TABLE public.task_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  estimated_hours INTEGER,
  priority TEXT NOT NULL CHECK (priority IN ('low', 'medium', 'high')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Crea la tabella per i task specifici di ogni dominio
CREATE TABLE public.domain_tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  domain_id UUID NOT NULL REFERENCES public.domains(id) ON DELETE CASCADE,
  template_id UUID REFERENCES public.task_templates(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  estimated_hours INTEGER,
  priority TEXT NOT NULL CHECK (priority IN ('low', 'medium', 'high')),
  completed BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Abilita Row Level Security (opzionale, per ora senza autenticazione)
ALTER TABLE public.domains ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.domain_tasks ENABLE ROW LEVEL SECURITY;

-- Crea policy pubbliche per ora (dato che non c'è autenticazione)
CREATE POLICY "Allow all operations on domains" ON public.domains FOR ALL USING (true);
CREATE POLICY "Allow all operations on task_templates" ON public.task_templates FOR ALL USING (true);
CREATE POLICY "Allow all operations on domain_tasks" ON public.domain_tasks FOR ALL USING (true);

-- Crea indici per migliorare le performance
CREATE INDEX idx_domain_tasks_domain_id ON public.domain_tasks(domain_id);
CREATE INDEX idx_domain_tasks_template_id ON public.domain_tasks(template_id);
CREATE INDEX idx_domain_tasks_completed ON public.domain_tasks(completed);
