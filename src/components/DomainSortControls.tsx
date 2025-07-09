
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowUpDown } from "lucide-react";
import { SortOption } from "@/utils/domainUtils";

interface DomainSortControlsProps {
  sortBy: SortOption;
  onSortChange: (value: SortOption) => void;
  domainsCount: number;
}

const DomainSortControls = ({ sortBy, onSortChange, domainsCount }: DomainSortControlsProps) => {
  if (domainsCount === 0) return null;

  return (
    <div className="mb-6 flex items-center gap-4">
      <div className="flex items-center gap-2">
        <ArrowUpDown className="h-4 w-4 text-gray-500" />
        <span className="text-sm font-medium text-gray-700">Ordina per:</span>
      </div>
      <Select value={sortBy} onValueChange={(value: SortOption) => onSortChange(value)}>
        <SelectTrigger className="w-48">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="created_at">Data di Creazione</SelectItem>
          <SelectItem value="name">Ordine Alfabetico</SelectItem>
          <SelectItem value="progress">Completezza</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
};

export default DomainSortControls;
