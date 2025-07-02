import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Globe, CheckCircle, Sparkles } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Database } from "@/integrations/supabase/types";

type Domain = Database['public']['Tables']['domains']['Row'];
type DomainTask = Database['public']['Tables']['domain_tasks']['Row'];

const DomainTasks = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [domain, setDomain] = useState<Domain | null>(null);
  const [tasks, setTasks] = useState<DomainTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    if (id) {
      fetchDomainAndTasks();
    }
  }, [id]);

  const fetchDomainAndTasks = async () => {
    try {
      // Fetch domain info
      const { data: domainData, error: domainError } = await supabase
        .from('domains')
        .select('*')
        .eq('id', id)
        .single();

      if (domainError) throw domainError;
      setDomain(domainData);

      // Fetch domain tasks
      const { data: tasksData, error: tasksError } = await supabase
        .from('domain_tasks')
        .select('*')
        .eq('domain_id', id)
        .order('created_at', { ascending: true });

      if (tasksError) throw tasksError;
      setTasks(tasksData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Errore",
        description: "Impossibile caricare i dati del dominio",
        variant: "destructive"
      });
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const handleTaskToggle = async (taskId: string, completed: boolean) => {
    try {
      const { error } = await supabase
        .from('domain_tasks')
        .update({
          completed,
          completed_at: completed ? new Date().toISOString() : null
        })
        .eq('id', taskId);

      if (error) throw error;

      // Update local state
      setTasks(prevTasks =>
        prevTasks.map(task =>
          task.id === taskId
            ? { ...task, completed, completed_at: completed ? new Date().toISOString() : undefined }
            : task
        )
      );

      toast({
        title: completed ? "Task completato!" : "Task riaperto",
        description: `Il task è stato ${completed ? 'completato' : 'riaperto'} con successo`
      });
    } catch (error) {
      console.error('Error updating task:', error);
      toast({
        title: "Errore",
        description: "Impossibile aggiornare il task",
        variant: "destructive"
      });
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'high': return 'Alta';
      case 'medium': return 'Media';
      case 'low': return 'Bassa';
      default: return priority;
    }
  };

  const getFilteredTasks = () => {
    switch (activeTab) {
      case 'completed':
        return tasks.filter(task => task.completed);
      case 'pending':
        return tasks.filter(task => !task.completed);
      default:
        return tasks;
    }
  };

  const completedTasks = tasks.filter(task => task.completed).length;
  const totalTasks = tasks.length;
  const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  const groupedTasks = getFilteredTasks().reduce((acc, task) => {
    if (!acc[task.category]) {
      acc[task.category] = [];
    }
    acc[task.category].push(task);
    return acc;
  }, {} as Record<string, DomainTask[]>);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-16 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!domain) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6 flex items-center justify-center">
        <Card className="bg-white border-0 shadow-lg">
          <CardContent className="p-8 text-center">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Dominio non trovato
            </h2>
            <p className="text-gray-600 mb-4">
              Il dominio richiesto non esiste o non è accessibile
            </p>
            <Button onClick={() => navigate('/')}>
              Torna alla Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate('/')}
            className="mb-4 hover:bg-white/50"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Torna alla Dashboard
          </Button>
          
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center mb-2">
                <Globe className="h-8 w-8 text-blue-600 mr-3" />
                <h1 className="text-4xl font-bold text-gray-900">
                  {domain.name}
                </h1>
              </div>
              <p className="text-lg text-gray-600 mb-2">
                {domain.url}
              </p>
              {domain.description && (
                <p className="text-gray-600">
                  {domain.description}
                </p>
              )}
            </div>
            
            <Button
              onClick={() => {/* TODO: Implementare integrazione AI */}}
              variant="outline"
              className="bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0 hover:from-purple-600 hover:to-pink-600"
            >
              <Sparkles className="h-4 w-4 mr-2" />
              AI Assistant
            </Button>
          </div>
        </div>

        {/* Progress Overview */}
        <Card className="bg-white border-0 shadow-lg mb-8">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-900 mb-1">
                  {Math.round(progress)}%
                </div>
                <div className="text-sm text-gray-600">Completato</div>
              </div>
              
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600 mb-1">
                  {completedTasks}
                </div>
                <div className="text-sm text-gray-600">Task Completati</div>
              </div>
              
              <div className="text-center">
                <div className="text-3xl font-bold text-yellow-600 mb-1">
                  {totalTasks - completedTasks}
                </div>
                <div className="text-sm text-gray-600">Task Rimanenti</div>
              </div>
              
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-900 mb-1">
                  {totalTasks}
                </div>
                <div className="text-sm text-gray-600">Task Totali</div>
              </div>
            </div>
            
            <div className="mt-6">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-700">
                  Progresso Generale
                </span>
                <span className="text-sm text-gray-600">
                  {completedTasks}/{totalTasks}
                </span>
              </div>
              <Progress value={progress} className="h-3" />
            </div>
          </CardContent>
        </Card>

        {/* Tasks Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 bg-white border shadow-sm">
            <TabsTrigger value="all" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              Tutti ({totalTasks})
            </TabsTrigger>
            <TabsTrigger value="pending" className="data-[state=active]:bg-yellow-600 data-[state=active]:text-white">
              Da Fare ({totalTasks - completedTasks})
            </TabsTrigger>
            <TabsTrigger value="completed" className="data-[state=active]:bg-green-600 data-[state=active]:text-white">
              Completati ({completedTasks})
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab}>
            {Object.keys(groupedTasks).length === 0 ? (
              <Card className="bg-white border-0 shadow-md">
                <CardContent className="p-12 text-center">
                  <CheckCircle className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {activeTab === 'completed' ? 'Nessun task completato' : 
                     activeTab === 'pending' ? 'Nessun task da fare' : 'Nessun task disponibile'}
                  </h3>
                  <p className="text-gray-600">
                    {activeTab === 'completed' ? 'Inizia a completare i task per vederli qui' :
                     activeTab === 'pending' ? 'Ottimo lavoro! Tutti i task sono stati completati' :
                     'Crea dei template nell\'area amministrazione per vedere i task qui'}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-8">
                {Object.entries(groupedTasks).map(([category, categoryTasks]) => (
                  <Card key={category} className="bg-white border-0 shadow-lg">
                    <CardHeader>
                      <CardTitle className="text-xl text-gray-900 flex items-center justify-between">
                        <span>{category}</span>
                        <Badge variant="secondary">
                          {categoryTasks.filter(t => t.completed).length}/{categoryTasks.length}
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {categoryTasks.map((task) => (
                          <div
                            key={task.id}
                            className={`flex items-start gap-4 p-4 rounded-lg border-2 transition-all duration-200 ${
                              task.completed
                                ? 'bg-green-50 border-green-200'
                                : 'bg-white border-gray-200 hover:border-blue-300'
                            }`}
                          >
                            <Checkbox
                              checked={task.completed}
                              onCheckedChange={(checked) => 
                                handleTaskToggle(task.id, checked as boolean)
                              }
                              className="mt-1"
                            />
                            
                            <div className="flex-1">
                              <div className="flex items-start justify-between mb-2">
                                <h4 className={`font-medium ${
                                  task.completed 
                                    ? 'text-gray-500 line-through' 
                                    : 'text-gray-900'
                                }`}>
                                  {task.title}
                                </h4>
                                <div className="flex items-center gap-2">
                                  <Badge className={getPriorityColor(task.priority)}>
                                    {getPriorityLabel(task.priority)}
                                  </Badge>
                                  {task.estimated_hours && (
                                    <Badge variant="outline" className="text-xs">
                                      {task.estimated_hours}h
                                    </Badge>
                                  )}
                                </div>
                              </div>
                              
                              {task.description && (
                                <p className={`text-sm mb-2 ${
                                  task.completed ? 'text-gray-400' : 'text-gray-600'
                                }`}>
                                  {task.description}
                                </p>
                              )}
                              
                              {task.completed && task.completed_at && (
                                <div className="text-xs text-green-600 flex items-center gap-1">
                                  <CheckCircle className="h-3 w-3" />
                                  Completato il {new Date(task.completed_at).toLocaleDateString('it-IT')}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default DomainTasks;
