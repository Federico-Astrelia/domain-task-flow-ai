
import { Input } from "@/components/ui/input";
import { Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DomainSearchBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  resultsCount: number;
}

const DomainSearchBar = ({ searchQuery, onSearchChange, resultsCount }: DomainSearchBarProps) => {
  const clearSearch = () => {
    onSearchChange('');
  };

  return (
    <div className="mb-6 bg-white rounded-lg shadow-sm border p-4">
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            type="text"
            placeholder="Cerca domini per nome, URL o descrizione..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 pr-10"
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearSearch}
              className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 hover:bg-gray-100"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
        {searchQuery && (
          <div className="text-sm text-gray-600 whitespace-nowrap">
            {resultsCount} {resultsCount === 1 ? 'risultato' : 'risultati'}
          </div>
        )}
      </div>
    </div>
  );
};

export default DomainSearchBar;
