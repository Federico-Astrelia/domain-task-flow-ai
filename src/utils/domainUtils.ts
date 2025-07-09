
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export interface Domain {
  id: string;
  name: string;
  url: string;
  description?: string;
  status: string;
  created_at: string;
  total_tasks: number;
  completed_tasks: number;
  progress: number;
}

export type SortOption = 'created_at' | 'name' | 'progress';

export const fetchDomains = async (): Promise<Domain[]> => {
  const { data, error } = await supabase
    .from('domains')
    .select(`
      *,
      domain_tasks!inner(
        id,
        completed
      )
    `);

  if (error) throw error;

  const processedDomains = data?.map(domain => {
    const totalTasks = domain.domain_tasks?.length || 0;
    const completedTasks = domain.domain_tasks?.filter((task: any) => task.completed).length || 0;
    const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

    return {
      ...domain,
      total_tasks: totalTasks,
      completed_tasks: completedTasks,
      progress: Math.round(progress)
    };
  }) || [];

  return processedDomains;
};

export const closeDomain = async (domainId: string) => {
  const { error } = await supabase
    .from('domains')
    .update({ status: 'closed' })
    .eq('id', domainId);

  if (error) throw error;

  toast({
    title: "Successo",
    description: "Dominio chiuso con successo"
  });
};

export const reopenDomain = async (domainId: string) => {
  const { error } = await supabase
    .from('domains')
    .update({ status: 'active' })
    .eq('id', domainId);

  if (error) throw error;

  toast({
    title: "Successo",
    description: "Dominio riaperto con successo"
  });
};

export const deleteDomain = async (domainId: string, domainName: string) => {
  if (!confirm(`Sei sicuro di voler eliminare definitivamente il dominio "${domainName}"? Questa azione non può essere annullata.`)) {
    return false;
  }

  const { error } = await supabase
    .from('domains')
    .delete()
    .eq('id', domainId);

  if (error) throw error;

  toast({
    title: "Successo",
    description: "Dominio eliminato con successo"
  });

  return true;
};

export const sortDomains = (domains: Domain[], sortBy: SortOption) => {
  return [...domains].sort((a, b) => {
    switch (sortBy) {
      case 'created_at':
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      case 'name':
        return a.name.localeCompare(b.name);
      case 'progress':
        return b.progress - a.progress;
      default:
        return 0;
    }
  });
};

export const getProgressColor = (progress: number) => {
  if (progress === 100) return "text-green-600";
  if (progress > 50) return "text-blue-600";
  if (progress > 0) return "text-yellow-600";
  return "text-gray-400";
};

export const getStatusIcon = (progress: number) => {
  if (progress === 100) return "CheckCircle";
  if (progress > 0) return "Clock";
  return "AlertCircle";
};
