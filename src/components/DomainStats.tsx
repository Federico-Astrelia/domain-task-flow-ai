
import { Card, CardContent } from "@/components/ui/card";
import { Globe, CheckCircle, Clock, AlertCircle } from "lucide-react";
import { Domain } from "@/utils/domainUtils";

interface DomainStatsProps {
  domains: Domain[];
}

const DomainStats = ({ domains }: DomainStatsProps) => {
  const completedDomains = domains.filter(d => d.progress === 100).length;
  const inProgressDomains = domains.filter(d => d.progress > 0 && d.progress < 100).length;
  const notStartedDomains = domains.filter(d => d.progress === 0).length;

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
      <Card className="bg-white border-0 shadow-md hover:shadow-lg transition-shadow duration-200">
        <CardContent className="p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Globe className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-2xl font-bold text-gray-900">{domains.length}</p>
              <p className="text-sm text-gray-600">Domini Attivi</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white border-0 shadow-md hover:shadow-lg transition-shadow duration-200">
        <CardContent className="p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-2xl font-bold text-gray-900">{completedDomains}</p>
              <p className="text-sm text-gray-600">Completati</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white border-0 shadow-md hover:shadow-lg transition-shadow duration-200">
        <CardContent className="p-6">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Clock className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-2xl font-bold text-gray-900">{inProgressDomains}</p>
              <p className="text-sm text-gray-600">In Corso</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white border-0 shadow-md hover:shadow-lg transition-shadow duration-200">
        <CardContent className="p-6">
          <div className="flex items-center">
            <div className="p-2 bg-gray-100 rounded-lg">
              <AlertCircle className="h-6 w-6 text-gray-600" />
            </div>
            <div className="ml-4">
              <p className="text-2xl font-bold text-gray-900">{notStartedDomains}</p>
              <p className="text-sm text-gray-600">Da Iniziare</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DomainStats;
