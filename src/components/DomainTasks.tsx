
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, CheckCircle, Clock, AlertCircle, ExternalLink, Tag, Link as LinkIcon } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Database } from "@/integrations/supabase/types";
import SubtaskManager from "./SubtaskManager";
import TaskComments from "./TaskComments";
import ChecklistManager from "./ChecklistManager";

type DomainTask = Database['public']['Tables']['domain_tasks']['Row'];
type Domain = Database['public']['Tables']['domains']['Row'];

interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
}

const DomainTasks = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [domain, setDomain] = useState<Domain | null>(null);
  const [tasks, setTasks] = useState<DomainTask[]>([]);
  const [loading, setLoading] = useState(true);

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

      // Fetch tasks for this domain
      const { data: tasksData, error: tasksError } = await supabase
        .from('domain_tasks')
        .select('*')
        .eq('domain_id', id)
        .order('created_at', { ascending: false });

      if (tasksError) throw tasksError;
      setTasks(tasksData || []);
    } catch (error) {
      console.error('Error fetching domain and tasks:', error);
      toast({
        title: "Errore",
        description: "Impossibile caricare i dati del dominio",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTaskComplete = async (taskId: string, completed: boolean) => {
    try {
      const { error } = await supabase
        .from('domain_tasks')
        .update({
          completed,
          completed_at: completed ? new Date().toISOString() : null
        })
        .eq('id', taskId);

      if (error) throw error;

      setTasks(prevTasks =>
        prevTasks.map(task =>
          task.id === taskId
            ? { ...task, completed, completed_at: completed ? new Date().toISOString() : null }
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

  const handleChecklistUpdate = async (taskId: string, newChecklist: ChecklistItem[]) => {
    try {
      const { error } = await supabase
        .from('domain_tasks')
        .update({ checklist_items: newChecklist as any })
        .eq('id', taskId);

      if (error) throw error;

      setTasks(prevTasks =>
        prevTasks.map(task =>
          task.id === taskId
            ? { ...task, checklist_items: newChecklist as any }
            : task
        )
      );
    } catch (error) {
      console.error('Error updating checklist:', error);
      toast({
        title: "Errore",
        description: "Impossibile aggiornare la checklist",
        variant: "destructive"
      });
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'Urgente';
      case 'high': return 'Alta';
      case 'medium': return 'Media';
      case 'low': return 'Bassa';
      default: return priority;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-48 bg-gray-200 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!domain) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Dominio non trovato</h1>
          <Button onClick={() => navigate('/')} variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Torna alla Home
          </Button>
        </div>
      </div>
    );
  }

  const completedTasks = tasks.filter(task => task.completed).length;
  const totalTasks = tasks.length;
  const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="max-w-6xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <Button 
            onClick={() => navigate('/')} 
            variant="outline" 
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Torna alla Home
          </Button>
          
          <div className="bg-white rounded-lg p-6 shadow-md">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  {domain.name}
                </h1>
                <p className="text-gray-600 flex items-center gap-2">
                  <ExternalLink className="h-4 w-4" />
                  {domain.url}
                </p>
                {domain.description && (
                  <p className="text-gray-600 mt-2">{domain.description}</p>
                )}
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-blue-600 mb-1">
                  {Math.round(progress)}%
                </div>
                <div className="text-sm text-gray-500">
                  {completedTasks} di {totalTasks} task
                </div>
              </div>
            </div>
            
            <Progress value={progress} className="h-3" />
          </div>
        </div>

        {/* Tasks */}
        {tasks.length === 0 ? (
          <Card className="bg-white border-0 shadow-md">
            <CardContent className="p-12 text-center">
              <div className="text-6xl mb-4">📋</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Nessun task ancora
              </h3>
              <p className="text-gray-600">
                I task verranno creati automaticamente quando aggiungi nuovi template dal pannello amministrativo
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {tasks.map((task) => (
              <Card
                key={task.id}
                className={`bg-white border-0 shadow-md hover:shadow-lg transition-all duration-200 ${
                  task.completed ? 'opacity-75' : ''
                }`}
              >
                <CardHeader>
                  <div className="flex items-start gap-4">
                    <Checkbox
                      checked={task.completed}
                      onCheckedChange={(checked) => 
                        handleTaskComplete(task.id, checked as boolean)
                      }
                      className="mt-1"
                    />
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <CardTitle className={`text-xl font-bold ${
                          task.completed ? 'text-gray-500 line-through' : 'text-gray-900'
                        }`}>
                          {task.title}
                        </CardTitle>
                        
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{task.category}</Badge>
                          <Badge 
                            variant="secondary"
                            className={`text-white ${getPriorityColor(task.priority)}`}
                          >
                            {getPriorityLabel(task.priority)}
                          </Badge>
                          {task.estimated_hours && (
                            <Badge variant="outline">
                              {task.estimated_hours}h
                            </Badge>
                          )}
                        </div>
                        
                        {task.completed && task.completed_at && (
                          <div className="text-sm text-green-600 flex items-center gap-1">
                            <CheckCircle className="h-4 w-4" />
                            Completato il {new Date(task.completed_at).toLocaleDateString('it-IT')}
                          </div>
                        )}
                      </div>
                      
                      {task.description && (
                        <p className={`text-sm mb-4 ${
                          task.completed ? 'text-gray-500' : 'text-gray-600'
                        }`}>
                          {task.description}
                        </p>
                      )}
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-6">
                  {/* Tags */}
                  {task.tags && task.tags.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Tag className="h-4 w-4 text-gray-500" />
                        <span className="text-sm font-medium text-gray-700">Tags</span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {task.tags.map((tag) => (
                          <Badge key={tag} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Dependencies */}
                  {task.dependencies && task.dependencies.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <AlertCircle className="h-4 w-4 text-gray-500" />
                        <span className="text-sm font-medium text-gray-700">Dipendenze</span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {task.dependencies.map((dep) => (
                          <Badge key={dep} variant="outline" className="text-xs">
                            {dep}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Reference Links */}
                  {task.reference_links && task.reference_links.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <LinkIcon className="h-4 w-4 text-gray-500" />
                        <span className="text-sm font-medium text-gray-700">Link di Riferimento</span>
                      </div>
                      <div className="space-y-1">
                        {task.reference_links.map((link, idx) => (
                          <div key={idx}>
                            <a 
                              href={link} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-sm text-blue-600 hover:text-blue-800 underline break-all flex items-center gap-1"
                            >
                              <ExternalLink className="h-3 w-3" />
                              {link}
                            </a>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Checklist */}
                  {task.checklist_items && Array.isArray(task.checklist_items) && task.checklist_items.length > 0 && (
                    <div>
                      <span className="text-sm font-medium text-gray-700 mb-2 block">Checklist</span>
                      <ChecklistManager
                        items={task.checklist_items as unknown as ChecklistItem[]}
                        onChange={(items) => handleChecklistUpdate(task.id, items)}
                        readonly={task.completed}
                      />
                    </div>
                  )}
                  
                  {/* Subtasks */}
                  <SubtaskManager 
                    taskId={task.id} 
                    isTaskCompleted={task.completed}
                  />
                  
                  {/* Comments */}
                  <TaskComments taskId={task.id} />
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DomainTasks;
