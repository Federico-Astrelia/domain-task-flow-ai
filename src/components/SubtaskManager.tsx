
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Plus, CheckCircle, MessageSquare } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Database } from "@/integrations/supabase/types";
import TaskComments from "./TaskComments";

type Subtask = Database['public']['Tables']['subtasks']['Row'];

interface SubtaskManagerProps {
  taskId: string;
  isTaskCompleted: boolean;
}

const SubtaskManager = ({ taskId, isTaskCompleted }: SubtaskManagerProps) => {
  const [subtasks, setSubtasks] = useState<Subtask[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: ''
  });

  useEffect(() => {
    fetchSubtasks();
  }, [taskId]);

  const fetchSubtasks = async () => {
    try {
      const { data, error } = await supabase
        .from('subtasks')
        .select('*')
        .eq('parent_task_id', taskId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setSubtasks(data || []);
    } catch (error) {
      console.error('Error fetching subtasks:', error);
      toast({
        title: "Errore",
        description: "Impossibile caricare i sottotask",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const { error } = await supabase
        .from('subtasks')
        .insert([{
          parent_task_id: taskId,
          title: formData.title,
          description: formData.description || null
        }]);

      if (error) throw error;

      toast({
        title: "Successo",
        description: "Sottotask creato con successo"
      });

      setFormData({ title: '', description: '' });
      setIsCreateDialogOpen(false);
      fetchSubtasks();
    } catch (error) {
      console.error('Error creating subtask:', error);
      toast({
        title: "Errore",
        description: "Impossibile creare il sottotask",
        variant: "destructive"
      });
    }
  };

  const handleToggleComplete = async (subtaskId: string, completed: boolean) => {
    try {
      const { error } = await supabase
        .from('subtasks')
        .update({
          completed,
          completed_at: completed ? new Date().toISOString() : null
        })
        .eq('id', subtaskId);

      if (error) throw error;

      setSubtasks(prevSubtasks =>
        prevSubtasks.map(subtask =>
          subtask.id === subtaskId
            ? { ...subtask, completed, completed_at: completed ? new Date().toISOString() : null }
            : subtask
        )
      );

      toast({
        title: completed ? "Sottotask completato!" : "Sottotask riaperto",
        description: `Il sottotask è stato ${completed ? 'completato' : 'riaperto'} con successo`
      });
    } catch (error) {
      console.error('Error updating subtask:', error);
      toast({
        title: "Errore",
        description: "Impossibile aggiornare il sottotask",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return <div className="animate-pulse h-32 bg-gray-200 rounded"></div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="font-medium text-gray-900">Sottotask</h4>
        {!isTaskCompleted && (
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline">
                <Plus className="h-3 w-3 mr-1" />
                Aggiungi
              </Button>
            </DialogTrigger>
            
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Nuovo Sottotask</DialogTitle>
              </DialogHeader>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="title">Titolo *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    placeholder="Titolo del sottotask..."
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="description">Descrizione</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    placeholder="Descrizione dettagliata..."
                    rows={3}
                  />
                </div>
                
                <div className="flex justify-end gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsCreateDialogOpen(false);
                      setFormData({ title: '', description: '' });
                    }}
                  >
                    Annulla
                  </Button>
                  <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                    Crea Sottotask
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {subtasks.length === 0 ? (
        <p className="text-sm text-gray-500 italic">Nessun sottotask ancora</p>
      ) : (
        <div className="space-y-2">
          {subtasks.map((subtask) => (
            <Card key={subtask.id} className="bg-gray-50 border border-gray-200">
              <CardContent className="p-3">
                <div className="flex items-start gap-3">
                  <Checkbox
                    checked={subtask.completed}
                    onCheckedChange={(checked) => 
                      handleToggleComplete(subtask.id, checked as boolean)
                    }
                    className="mt-1"
                    disabled={isTaskCompleted}
                  />
                  
                  <div className="flex-1">
                    <h5 className={`font-medium text-sm ${
                      subtask.completed 
                        ? 'text-gray-500 line-through' 
                        : 'text-gray-900'
                    }`}>
                      {subtask.title}
                    </h5>
                    
                    {subtask.description && (
                      <p className={`text-xs mt-1 ${
                        subtask.completed ? 'text-gray-400' : 'text-gray-600'
                      }`}>
                        {subtask.description}
                      </p>
                    )}
                    
                    {subtask.completed && subtask.completed_at && (
                      <div className="text-xs text-green-600 flex items-center gap-1 mt-1">
                        <CheckCircle className="h-3 w-3" />
                        Completato il {new Date(subtask.completed_at).toLocaleDateString('it-IT')}
                      </div>
                    )}
                    
                    <TaskComments 
                      subtaskId={subtask.id}
                      isCompact={true}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default SubtaskManager;
