
import { Button } from "@/components/ui/button";
import { Globe, Archive, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface DomainHeaderProps {
  showClosedDomains: boolean;
  onToggleClosedDomains: () => void;
}

const DomainHeader = ({ showClosedDomains, onToggleClosedDomains }: DomainHeaderProps) => {
  const navigate = useNavigate();

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Domain Task Flow
          </h1>
          <p className="text-lg text-gray-600">
            Gestisci i task per ogni dominio cliente con precisione e controllo
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            onClick={() => navigate('/admin')}
            variant="outline"
            className="bg-white hover:bg-gray-50"
          >
            <Globe className="h-4 w-4 mr-2" />
            Amministrazione
          </Button>
          <Button
            onClick={onToggleClosedDomains}
            variant="outline"
            className="bg-white hover:bg-gray-50"
          >
            <Archive className="h-4 w-4 mr-2" />
            {showClosedDomains ? 'Domini Attivi' : 'Domini Chiusi'}
          </Button>
          <Button
            onClick={() => navigate('/domains/new')}
            className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
          >
            <Plus className="h-4 w-4 mr-2" />
            Nuovo Dominio
          </Button>
        </div>
      </div>
    </div>
  );
};

export default DomainHeader;
