import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, CheckCircle, Clock, AlertCircle, ExternalLink, Tag, Link as LinkIcon, Filter, ArrowUpDown } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Database } from "@/integrations/supabase/types";
import SubtaskManager from "./SubtaskManager";
import TaskComments from "./TaskComments";

type DomainTask = Database['public']['Tables']['domain_tasks']['Row'];
type Domain = Database['public']['Tables']['domains']['Row'];
type SortOption = 'priority' | 'created_at' | 'title';

const DomainTasks = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [domain, setDomain] = useState<Domain | null>(null);
  const [tasks, setTasks] = useState<DomainTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<SortOption>('created_at');
  const [filterTag, setFilterTag] = useState<string>('all');
  const [filterDependency, setFilterDependency] = useState<string>('all');

  useEffect(() => {
    if (id) {
      fetchDomainAndTasks();
    }
  }, [id]);

  // Set up real-time subscriptions
  useEffect(() => {
    if (!id) return;

    const channel = supabase
      .channel('domain-tasks-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'domain_tasks',
          filter: `domain_id=eq.${id}`,
        },
        (payload) => {
          console.log('Domain task change:', payload);
          fetchTasks();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'subtasks',
        },
        (payload) => {
          console.log('Subtask change:', payload);
          fetchTasks(); // Refresh to update task completion status
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [id]);

  const fetchDomainAndTasks = async () => {
    await Promise.all([fetchDomain(), fetchTasks()]);
    setLoading(false);
  };

  const fetchDomain = async () => {
    if (!id) return;

    const { data, error } = await supabase
      .from('domains')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      toast({
        title: "Errore",
        description: "Impossibile caricare il dominio",
        variant: "destructive",
      });
      return;
    }

    setDomain(data);
  };

  const fetchTasks = async () => {
    if (!id) return;

    const { data, error } = await supabase
      .from('domain_tasks')
      .select(`
        *,
        subtasks (
          id,
          title,
          description,
          completed,
          completed_at,
          created_at,
          updated_at
        )
      `)
      .eq('domain_id', id)
      .order('created_at', { ascending: true });

    if (error) {
      toast({
        title: "Errore",
        description: "Impossibile caricare i task",
        variant: "destructive",
      });
      return;
    }

    setTasks(data || []);
  };

  const toggleTaskCompletion = async (task: DomainTask) => {
    const now = new Date().toISOString();
    const { error } = await supabase
      .from('domain_tasks')
      .update({
        completed: !task.completed,
        completed_at: !task.completed ? now : null,
        updated_at: now,
      })
      .eq('id', task.id);

    if (error) {
      toast({
        title: "Errore",
        description: "Impossibile aggiornare il task",
        variant: "destructive",
      });
      return;
    }

    fetchTasks();
  };

  const getAllTags = () => {
    const allTags = tasks.flatMap(task => task.tags || []);
    return [...new Set(allTags)];
  };

  const getAllDependencies = () => {
    const allDeps = tasks.flatMap(task => task.dependencies || []);
    return [...new Set(allDeps)];
  };

  const sortTasks = (tasks: DomainTask[]) => {
    return [...tasks].sort((a, b) => {
      switch (sortBy) {
        case 'priority':
          const priorityOrder = { high: 3, medium: 2, low: 1 };
          return priorityOrder[b.priority as keyof typeof priorityOrder] - 
                 priorityOrder[a.priority as keyof typeof priorityOrder];
        case 'title':
          return a.title.localeCompare(b.title);
        case 'created_at':
        default:
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      }
    });
  };

  const filterTasks = (tasks: DomainTask[]) => {
    return tasks.filter((task) => {
      const matchesTag = filterTag === 'all' || (task.tags && task.tags.some(tag => 
        tag.toLowerCase().includes(filterTag.toLowerCase())
      ));
      
      const matchesDependency = filterDependency === 'all' || (task.dependencies && task.dependencies.some(dep => 
        dep.toLowerCase().includes(filterDependency.toLowerCase())
      ));
      
      return matchesTag && matchesDependency;
    });
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'medium':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'low':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const calculateProgress = () => {
    if (tasks.length === 0) return 0;
    const completedTasks = tasks.filter(task => task.completed).length;
    return Math.round((completedTasks / tasks.length) * 100);
  };

  const isTaskCompleted = (task: DomainTask) => {
    if (!task.subtasks || task.subtasks.length === 0) {
      return task.completed;
    }
    
    const completedSubtasks = task.subtasks.filter((subtask: any) => subtask.completed).length;
    return completedSubtasks === task.subtasks.length;
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Caricamento...</div>
      </div>
    );
  }

  if (!domain) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Dominio non trovato</h1>
          <Button onClick={() => navigate('/')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Torna alla Home
          </Button>
        </div>
      </div>
    );
  }

  const filteredAndSortedTasks = sortTasks(filterTasks(tasks));
  const progress = calculateProgress();

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <Button 
            onClick={() => navigate('/')} 
            variant="outline"
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Torna alla Home
          </Button>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {domain?.name}
              </h1>
              <p className="text-gray-600 flex items-center gap-2">
                <ExternalLink className="h-4 w-4" />
                {domain?.url}
              </p>
              {domain?.description && (
                <p className="text-gray-600 mt-2">{domain.description}</p>
              )}
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-500 mb-2">Completamento</div>
              <div className="flex items-center gap-3">
                <Progress value={progress} className="w-32" />
                <span className="text-lg font-semibold text-gray-700">
                  {progress}%
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <div className="flex items-center gap-4 mb-4">
            <Filter className="h-5 w-5 text-gray-500" />
            <h3 className="text-lg font-semibold">Filtri e Ordinamento</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filtra per Tag
              </label>
              <Select value={filterTag} onValueChange={setFilterTag}>
                <SelectTrigger>
                  <SelectValue placeholder="Tutti i tag" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tutti i tag</SelectItem>
                  {getAllTags().map((tag) => (
                    <SelectItem key={tag} value={tag}>{tag}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filtra per Dipendenze
              </label>
              <Select value={filterDependency} onValueChange={setFilterDependency}>
                <SelectTrigger>
                  <SelectValue placeholder="Tutte le dipendenze" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tutte le dipendenze</SelectItem>
                  {getAllDependencies().map((dep) => (
                    <SelectItem key={dep} value={dep}>{dep}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ordina per
              </label>
              <Select value={sortBy} onValueChange={(value: SortOption) => setSortBy(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="created_at">Data creazione</SelectItem>
                  <SelectItem value="priority">Priorità</SelectItem>
                  <SelectItem value="title">Nome (A-Z)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button 
                variant="outline" 
                onClick={() => {
                  setFilterTag('all');
                  setFilterDependency('all');
                  setSortBy('created_at');
                }}
                className="w-full"
              >
                Reset Filtri
              </Button>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {filteredAndSortedTasks.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg shadow-sm border">
              <div className="text-gray-500 mb-4">
                {tasks.length === 0 ? 'Nessun task trovato per questo dominio.' : 'Nessun task corrisponde ai filtri selezionati.'}
              </div>
              {tasks.length > 0 && (
                <Button 
                  variant="outline"
                  onClick={() => {
                    setFilterTag('all');
                    setFilterDependency('all');
                  }}
                >
                  Rimuovi Filtri
                </Button>
              )}
            </div>
          ) : (
            filteredAndSortedTasks.map((task) => (
              <Card key={task.id} className={`transition-all duration-200 ${task.completed ? 'opacity-75 bg-gray-50' : 'hover:shadow-md'}`}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      <Checkbox
                        checked={task.completed}
                        onCheckedChange={() => toggleTaskCompletion(task)}
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <CardTitle className={`text-xl mb-2 ${task.completed ? 'line-through text-gray-500' : ''}`}>
                          {task.title}
                        </CardTitle>
                        {task.description && (
                          <p className={`text-gray-600 ${task.completed ? 'text-gray-400' : ''}`}>
                            {task.description}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getPriorityIcon(task.priority)}
                      <Badge variant="outline" className={getPriorityColor(task.priority)}>
                        {task.priority === 'high' ? 'Alta' : task.priority === 'medium' ? 'Media' : 'Bassa'}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <span className="font-medium">Categoria:</span>
                        <Badge variant="secondary">{task.category}</Badge>
                      </div>
                      {task.estimated_hours && (
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          <span>{task.estimated_hours}h stimata</span>
                        </div>
                      )}
                    </div>

                    {task.tags && task.tags.length > 0 && (
                      <div className="flex items-center gap-2 flex-wrap">
                        <Tag className="h-4 w-4 text-gray-500" />
                        {task.tags.map((tag, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}

                    {task.dependencies && task.dependencies.length > 0 && (
                      <div className="flex items-center gap-2 flex-wrap">
                        <LinkIcon className="h-4 w-4 text-gray-500" />
                        <span className="text-sm text-gray-600">Dipende da:</span>
                        {task.dependencies.map((dep, index) => (
                          <Badge key={index} variant="outline" className="text-xs bg-blue-50 border-blue-200 text-blue-800">
                            {dep}
                          </Badge>
                        ))}
                      </div>
                    )}

                    {task.reference_links && task.reference_links.length > 0 && (
                      <div className="flex items-center gap-2 flex-wrap">
                        <ExternalLink className="h-4 w-4 text-gray-500" />
                        <span className="text-sm text-gray-600">Link di riferimento:</span>
                        {task.reference_links.map((link, index) => (
                          <a
                            key={index}
                            href={link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-blue-600 hover:text-blue-800 underline"
                          >
                            {link}
                          </a>
                        ))}
                      </div>
                    )}

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      <SubtaskManager taskId={task.id} isTaskCompleted={isTaskCompleted(task)} />
                      <TaskComments taskId={task.id} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default DomainTasks;
