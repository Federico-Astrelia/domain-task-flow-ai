
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Globe, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface DomainEmptyStateProps {
  showClosedDomains: boolean;
}

const DomainEmptyState = ({ showClosedDomains }: DomainEmptyStateProps) => {
  const navigate = useNavigate();

  return (
    <Card className="bg-white border-0 shadow-md">
      <CardContent className="p-12 text-center">
        <Globe className="h-16 w-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          {showClosedDomains ? 'Nessun dominio chiuso' : 'Nessun dominio ancora'}
        </h3>
        <p className="text-gray-600 mb-6">
          {showClosedDomains 
            ? 'Non hai ancora chiuso nessun dominio'
            : 'Inizia creando il tuo primo dominio cliente per tracciare i task'
          }
        </p>
        {!showClosedDomains && (
          <Button
            onClick={() => navigate('/domains/new')}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Plus className="h-4 w-4 mr-2" />
            Crea Primo Dominio
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default DomainEmptyState;
