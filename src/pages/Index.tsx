
import { useState, useEffect } from "react";
import { toast } from "@/hooks/use-toast";
import { 
  Domain, 
  SortOption, 
  fetchDomains, 
  closeDomain, 
  reopenDomain, 
  deleteDomain, 
  sortDomains 
} from "@/utils/domainUtils";
import DomainHeader from "@/components/DomainHeader";
import DomainStats from "@/components/DomainStats";
import DomainSortControls from "@/components/DomainSortControls";
import DomainsGrid from "@/components/DomainsGrid";
import DomainLoading from "@/components/DomainLoading";

const Index = () => {
  const [domains, setDomains] = useState<Domain[]>([]);
  const [loading, setLoading] = useState(true);
  const [showClosedDomains, setShowClosedDomains] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>('created_at');

  useEffect(() => {
    loadDomains();
  }, []);

  const loadDomains = async () => {
    try {
      const data = await fetchDomains();
      setDomains(data);
    } catch (error) {
      console.error('Error fetching domains:', error);
      toast({
        title: "Errore",
        description: "Impossibile caricare i domini",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCloseDomain = async (domainId: string) => {
    try {
      await closeDomain(domainId);
      loadDomains();
    } catch (error) {
      console.error('Error closing domain:', error);
      toast({
        title: "Errore",
        description: "Impossibile chiudere il dominio",
        variant: "destructive"
      });
    }
  };

  const handleReopenDomain = async (domainId: string) => {
    try {
      await reopenDomain(domainId);
      loadDomains();
    } catch (error) {
      console.error('Error reopening domain:', error);
      toast({
        title: "Errore",
        description: "Impossibile riaprire il dominio",
        variant: "destructive"
      });
    }
  };

  const handleDeleteDomain = async (domainId: string, domainName: string) => {
    try {
      const deleted = await deleteDomain(domainId, domainName);
      if (deleted) {
        loadDomains();
      }
    } catch (error) {
      console.error('Error deleting domain:', error);
      toast({
        title: "Errore",
        description: "Impossibile eliminare il dominio",
        variant: "destructive"
      });
    }
  };

  const filteredDomains = showClosedDomains 
    ? domains.filter(d => d.status === 'closed')
    : domains.filter(d => d.status === 'active');

  const sortedDomains = sortDomains(filteredDomains, sortBy);
  const activeDomains = domains.filter(d => d.status === 'active');

  if (loading) {
    return <DomainLoading />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="max-w-7xl mx-auto p-6">
        <DomainHeader 
          showClosedDomains={showClosedDomains}
          onToggleClosedDomains={() => setShowClosedDomains(!showClosedDomains)}
        />

        {!showClosedDomains && <DomainStats domains={activeDomains} />}

        <DomainSortControls 
          sortBy={sortBy}
          onSortChange={setSortBy}
          domainsCount={sortedDomains.length}
        />

        <DomainsGrid 
          domains={sortedDomains}
          showClosedDomains={showClosedDomains}
          onCloseDomain={handleCloseDomain}
          onReopenDomain={handleReopenDomain}
          onDeleteDomain={handleDeleteDomain}
        />
      </div>
    </div>
  );
};

export default Index;
