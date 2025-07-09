
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export interface Domain {
  id: string;
  name: string;
  url: string;
  description?: string;
  status: string;
  created_at: string;
  pinned: boolean;
  pinned_at: string | null;
  pinned_order: number | null;
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

export const pinDomain = async (domainId: string) => {
  // Get the highest pinned_order to add this domain at the top
  const { data: pinnedDomains } = await supabase
    .from('domains')
    .select('pinned_order')
    .eq('pinned', true)
    .order('pinned_order', { ascending: false })
    .limit(1);

  const newPinnedOrder = pinnedDomains && pinnedDomains.length > 0 
    ? (pinnedDomains[0].pinned_order || 0) + 1 
    : 1;

  const { error } = await supabase
    .from('domains')
    .update({ 
      pinned: true, 
      pinned_at: new Date().toISOString(),
      pinned_order: newPinnedOrder
    })
    .eq('id', domainId);

  if (error) throw error;

  toast({
    title: "Successo",
    description: "Dominio fissato in alto"
  });
};

export const unpinDomain = async (domainId: string) => {
  const { error } = await supabase
    .from('domains')
    .update({ 
      pinned: false, 
      pinned_at: null,
      pinned_order: null
    })
    .eq('id', domainId);

  if (error) throw error;

  toast({
    title: "Successo", 
    description: "Dominio rimosso dai fissati"
  });
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

export const filterDomains = (domains: Domain[], searchQuery: string) => {
  if (!searchQuery.trim()) return domains;
  
  const query = searchQuery.toLowerCase();
  return domains.filter(domain =>
    domain.name.toLowerCase().includes(query) ||
    domain.url.toLowerCase().includes(query) ||
    (domain.description && domain.description.toLowerCase().includes(query))
  );
};

export const sortDomains = (domains: Domain[], sortBy: SortOption) => {
  // Separa domini fissati e non fissati
  const pinnedDomains = domains.filter(d => d.pinned);
  const unpinnedDomains = domains.filter(d => !d.pinned);

  // Ordina i domini fissati per pinned_order (più recenti prima)
  pinnedDomains.sort((a, b) => {
    if (sortBy === 'name') {
      return a.name.localeCompare(b.name);
    }
    // Per gli altri ordinamenti o come fallback, usa pinned_order
    return (b.pinned_order || 0) - (a.pinned_order || 0);
  });

  // Ordina i domini non fissati normalmente
  unpinnedDomains.sort((a, b) => {
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

  // Combina: fissati prima, poi non fissati
  return [...pinnedDomains, ...unpinnedDomains];
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
