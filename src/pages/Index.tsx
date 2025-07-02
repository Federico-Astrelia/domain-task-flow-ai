
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Plus, Globe, CheckCircle, Clock, AlertCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";

interface Domain {
  id: string;
  name: string;
  url: string;
  description?: string;
  created_at: string;
  total_tasks: number;
  completed_tasks: number;
  progress: number;
}

const Index = () => {
  const [domains, setDomains] = useState<Domain[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchDomains();
  }, []);

  const fetchDomains = async () => {
    try {
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

      setDomains(processedDomains);
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

  const getProgressColor = (progress: number) => {
    if (progress === 100) return "text-green-600";
    if (progress > 50) return "text-blue-600";
    if (progress > 0) return "text-yellow-600";
    return "text-gray-400";
  };

  const getStatusIcon = (progress: number) => {
    if (progress === 100) return <CheckCircle className="h-5 w-5 text-green-600" />;
    if (progress > 0) return <Clock className="h-5 w-5 text-yellow-600" />;
    return <AlertCircle className="h-5 w-5 text-gray-400" />;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-48 bg-gray-200 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
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
                onClick={() => navigate('/domains/new')}
                className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
              >
                <Plus className="h-4 w-4 mr-2" />
                Nuovo Dominio
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-white border-0 shadow-md hover:shadow-lg transition-shadow duration-200">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Globe className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-2xl font-bold text-gray-900">{domains.length}</p>
                  <p className="text-sm text-gray-600">Domini Totali</p>
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
                  <p className="text-2xl font-bold text-gray-900">
                    {domains.filter(d => d.progress === 100).length}
                  </p>
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
                  <p className="text-2xl font-bold text-gray-900">
                    {domains.filter(d => d.progress > 0 && d.progress < 100).length}
                  </p>
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
                  <p className="text-2xl font-bold text-gray-900">
                    {domains.filter(d => d.progress === 0).length}
                  </p>
                  <p className="text-sm text-gray-600">Da Iniziare</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Domains Grid */}
        {domains.length === 0 ? (
          <Card className="bg-white border-0 shadow-md">
            <CardContent className="p-12 text-center">
              <Globe className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Nessun dominio ancora
              </h3>
              <p className="text-gray-600 mb-6">
                Inizia creando il tuo primo dominio cliente per tracciare i task
              </p>
              <Button
                onClick={() => navigate('/domains/new')}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                Crea Primo Dominio
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {domains.map((domain) => (
              <Card
                key={domain.id}
                className="bg-white border-0 shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer transform hover:-translate-y-1"
                onClick={() => navigate(`/domains/${domain.id}`)}
              >
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-xl font-bold text-gray-900 mb-1">
                        {domain.name}
                      </CardTitle>
                      <CardDescription className="text-gray-600">
                        {domain.url}
                      </CardDescription>
                    </div>
                    {getStatusIcon(domain.progress)}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {domain.description && (
                      <p className="text-sm text-gray-600 line-clamp-2">
                        {domain.description}
                      </p>
                    )}
                    
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
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;
