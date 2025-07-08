
-- Funzione per aggiungere sottotask di un template a tutti i domini attivi
CREATE OR REPLACE FUNCTION public.add_template_subtask_to_all_domains()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
DECLARE
  domain_task_record RECORD;
BEGIN
  -- Per ogni task di dominio che usa questo template
  FOR domain_task_record IN 
    SELECT dt.id 
    FROM public.domain_tasks dt
    INNER JOIN public.domains d ON dt.domain_id = d.id
    WHERE dt.template_id = NEW.template_id 
    AND d.status = 'active'
  LOOP
    -- Inserire il nuovo sottotask
    INSERT INTO public.subtasks (
      parent_task_id,
      title,
      description
    ) VALUES (
      domain_task_record.id,
      NEW.title,
      NEW.description
    );
  END LOOP;
  
  RETURN NEW;
END;
$function$;

-- Trigger per aggiungere sottotask ai domini quando vengono aggiunti ai template
CREATE TRIGGER trigger_add_template_subtask_to_domains
  AFTER INSERT ON public.template_subtasks
  FOR EACH ROW
  EXECUTE FUNCTION public.add_template_subtask_to_all_domains();

-- Funzione per aggiornare i task dei domini quando un template viene modificato
CREATE OR REPLACE FUNCTION public.update_domain_tasks_from_template()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
BEGIN
  -- Aggiornare tutti i task dei domini attivi che usano questo template
  UPDATE public.domain_tasks 
  SET 
    title = NEW.title,
    description = NEW.description,
    category = NEW.category,
    priority = NEW.priority,
    estimated_hours = NEW.estimated_hours,
    tags = NEW.tags,
    dependencies = NEW.dependencies,
    reference_links = NEW.reference_links,
    updated_at = now()
  FROM public.domains d
  WHERE domain_tasks.template_id = NEW.id 
  AND domain_tasks.domain_id = d.id
  AND d.status = 'active';
  
  RETURN NEW;
END;
$function$;

-- Trigger per aggiornare i task dei domini quando un template viene modificato
CREATE TRIGGER trigger_update_domain_tasks_from_template
  AFTER UPDATE ON public.task_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_domain_tasks_from_template();

-- Funzione per aggiornare i sottotask dei domini quando un sottotask del template viene modificato
CREATE OR REPLACE FUNCTION public.update_domain_subtasks_from_template()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
DECLARE
  domain_task_record RECORD;
BEGIN
  -- Per ogni task di dominio che usa questo template
  FOR domain_task_record IN 
    SELECT dt.id 
    FROM public.domain_tasks dt
    INNER JOIN public.domains d ON dt.domain_id = d.id
    WHERE dt.template_id = NEW.template_id 
    AND d.status = 'active'
  LOOP
    -- Aggiornare i sottotask corrispondenti (basandosi sul title originale)
    UPDATE public.subtasks 
    SET 
      title = NEW.title,
      description = NEW.description,
      updated_at = now()
    WHERE parent_task_id = domain_task_record.id
    AND title = OLD.title;
  END LOOP;
  
  RETURN NEW;
END;
$function$;

-- Trigger per aggiornare i sottotask dei domini quando un sottotask del template viene modificato
CREATE TRIGGER trigger_update_domain_subtasks_from_template
  AFTER UPDATE ON public.template_subtasks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_domain_subtasks_from_template();
