
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { CheckCircle, Clock, AlertCircle, MoreVertical, Archive, Trash2, Pin, PinOff } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Domain, getProgressColor } from "@/utils/domainUtils";

interface DomainCardProps {
  domain: Domain;
  onCloseDomain: (domainId: string) => void;
  onReopenDomain: (domainId: string) => void;
  onDeleteDomain: (domainId: string, domainName: string) => void;
  onPinDomain: (domainId: string) => void;
  onUnpinDomain: (domainId: string) => void;
}

const DomainCard = ({ 
  domain, 
  onCloseDomain, 
  onReopenDomain, 
  onDeleteDomain,
  onPinDomain,
  onUnpinDomain
}: DomainCardProps) => {
  const navigate = useNavigate();

  const getStatusIcon = (progress: number) => {
    if (progress === 100) return <CheckCircle className="h-5 w-5 text-green-600" />;
    if (progress > 0) return <Clock className="h-5 w-5 text-yellow-600" />;
    return <AlertCircle className="h-5 w-5 text-gray-400" />;
  };

  return (
    <Card
      className={`bg-white border-0 shadow-md hover:shadow-xl transition-all duration-300 relative ${
        domain.status === 'active' ? 'cursor-pointer transform hover:-translate-y-1' : 'opacity-75'
      } ${domain.pinned ? 'ring-2 ring-blue-200 border-blue-100' : ''}`}
      onClick={() => domain.status === 'active' && navigate(`/domains/${domain.id}`)}
    >
      {domain.pinned && (
        <div className="absolute top-2 right-2 z-10">
          <Badge variant="secondary" className="bg-blue-100 text-blue-800 border-blue-200">
            <Pin className="h-3 w-3 mr-1" />
            Fissato
          </Badge>
        </div>
      )}
      
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <CardTitle className="text-xl font-bold text-gray-900">
                {domain.name}
              </CardTitle>
              {domain.status === 'closed' && (
                <Badge variant="secondary" className="text-xs">
                  Chiuso
                </Badge>
              )}
            </div>
            <CardDescription className="text-gray-600">
              {domain.url}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {domain.status === 'active' && getStatusIcon(domain.progress)}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {domain.status === 'active' && (
                  <>
                    {domain.pinned ? (
                      <DropdownMenuItem 
                        onClick={(e) => {
                          e.stopPropagation();
                          onUnpinDomain(domain.id);
                        }}
                      >
                        <PinOff className="h-4 w-4 mr-2" />
                        Rimuovi Fissaggio
                      </DropdownMenuItem>
                    ) : (
                      <DropdownMenuItem 
                        onClick={(e) => {
                          e.stopPropagation();
                          onPinDomain(domain.id);
                        }}
                      >
                        <Pin className="h-4 w-4 mr-2" />
                        Fissa in Alto
                      </DropdownMenuItem>
                    )}
                  </>
                )}
                {domain.status === 'active' ? (
                  <DropdownMenuItem 
                    onClick={(e) => {
                      e.stopPropagation();
                      onCloseDomain(domain.id);
                    }}
                  >
                    <Archive className="h-4 w-4 mr-2" />
                    Chiudi Dominio
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem 
                    onClick={(e) => {
                      e.stopPropagation();
                      onReopenDomain(domain.id);
                    }}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Riapri Dominio
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem 
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteDomain(domain.id, domain.name);
                  }}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Elimina Dominio
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {domain.description && (
            <p className="text-sm text-gray-600 line-clamp-2">
              {domain.description}
            </p>
          )}
          
          {domain.status === 'active' && (
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700">
                  Progresso
                </span>
                <Badge
                  variant="secondary"
                  className={`${getProgressColor(domain.progress)} bg-transparent`}
                >
                  {domain.progress}%
                </Badge>
              </div>
              <Progress
                value={domain.progress}
                className="h-2"
              />
              <div className="flex justify-between text-xs text-gray-500">
                <span>{domain.completed_tasks} completati</span>
                <span>{domain.total_tasks} totali</span>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default DomainCard;
