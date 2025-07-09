
import { Domain } from "@/utils/domainUtils";
import DomainCard from "./DomainCard";
import DomainEmptyState from "./DomainEmptyState";

interface DomainsGridProps {
  domains: Domain[];
  showClosedDomains: boolean;
  onCloseDomain: (domainId: string) => void;
  onReopenDomain: (domainId: string) => void;
  onDeleteDomain: (domainId: string, domainName: string) => void;
}

const DomainsGrid = ({ 
  domains, 
  showClosedDomains, 
  onCloseDomain, 
  onReopenDomain, 
  onDeleteDomain 
}: DomainsGridProps) => {
  if (domains.length === 0) {
    return <DomainEmptyState showClosedDomains={showClosedDomains} />;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {domains.map((domain) => (
        <DomainCard
          key={domain.id}
          domain={domain}
          onCloseDomain={onCloseDomain}
          onReopenDomain={onReopenDomain}
          onDeleteDomain={onDeleteDomain}
        />
      ))}
    </div>
  );
};

export default DomainsGrid;
