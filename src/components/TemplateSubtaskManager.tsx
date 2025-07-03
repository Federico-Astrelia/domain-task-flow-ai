
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, GripVertical } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Database } from "@/integrations/supabase/types";

type TemplateSubtask = Database['public']['Tables']['template_subtasks']['Row'];

interface TemplateSubtaskManagerProps {
  templateId: string;
}

const TemplateSubtaskManager = ({ templateId }: TemplateSubtaskManagerProps) => {
  const [subtasks, setSubtasks] = useState<TemplateSubtask[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSubtask, setEditingSubtask] = useState<TemplateSubtask | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: ''
  });

  useEffect(() => {
    fetchSubtasks();
  }, [templateId]);

  const fetchSubtasks = async () => {
    try {
      const { data, error } = await supabase
        .from('template_subtasks')
        .select('*')
        .eq('template_id', templateId)
        .order('order_index', { ascending: true });

      if (error) throw error;
      setSubtasks(data || []);
    } catch (error) {
      console.error('Error fetching template subtasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) return;

    try {
      const subtaskData = {
        template_id: templateId,
        title: formData.title.trim(),
        description: formData.description.trim() || null,
        order_index: subtasks.length
      };

      if (editingSubtask) {
        const { error } = await supabase
          .from('template_subtasks')
          .update(subtaskData)
          .eq('id', editingSubtask.id);

        if (error) throw error;
        toast({
          title: "Successo",
          description: "Sottotask aggiornato con successo"
        });
      } else {
        const { error } = await supabase
          .from('template_subtasks')
          .insert([subtaskData]);

        if (error) throw error;
        toast({
          title: "Successo",
          description: "Sottotask aggiunto con successo"
        });
      }

      resetForm();
      setIsDialogOpen(false);
      setEditingSubtask(null);
      fetchSubtasks();
    } catch (error) {
      console.error('Error saving template subtask:', error);
      toast({
        title: "Errore",
        description: "Impossibile salvare il sottotask",
        variant: "destructive"
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Sei sicuro di voler eliminare questo sottotask?')) return;

    try {
      const { error } = await supabase
        .from('template_subtasks')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Successo",
        description: "Sottotask eliminato con successo"
      });
      fetchSubtasks();
    } catch (error) {
      console.error('Error deleting template subtask:', error);
      toast({
        title: "Errore",
        description: "Impossibile eliminare il sottotask",
        variant: "destructive"
      });
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: ''
    });
  };

  const handleEdit = (subtask: TemplateSubtask) => {
    setEditingSubtask(subtask);
    setFormData({
      title: subtask.title,
      description: subtask.description || ''
    });
    setIsDialogOpen(true);
  };

  if (loading) {
    return <div className="animate-pulse h-32 bg-gray-100 rounded"></div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="font-medium text-gray-900">Sottotask del Template</h4>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button
              size="sm"
              onClick={() => {
                resetForm();
                setEditingSubtask(null);
              }}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="h-4 w-4 mr-1" />
              Aggiungi Sottotask
            </Button>
          </DialogTrigger>
          
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingSubtask ? 'Modifica Sottotask' : 'Nuovo Sottotask'}
              </DialogTitle>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  placeholder="Titolo sottotask..."
                  required
                />
              </div>
              
              <div>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="Descrizione (opzionale)..."
                  rows={3}
                />
              </div>
              
              <div className="flex justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsDialogOpen(false);
                    setEditingSubtask(null);
                    resetForm();
                  }}
                >
                  Annulla
                </Button>
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                  {editingSubtask ? 'Salva Modifiche' : 'Aggiungi'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {subtasks.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p className="text-sm">Nessun sottotask ancora</p>
          <p className="text-xs mt-1">I sottotask verranno automaticamente creati quando il template viene applicato</p>
        </div>
      ) : (
        <div className="space-y-2">
          {subtasks.map((subtask, index) => (
            <Card key={subtask.id} className="bg-gray-50">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    <GripVertical className="h-4 w-4 text-gray-400 mt-1" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h5 className="font-medium text-gray-900">{subtask.title}</h5>
                        <Badge variant="outline" className="text-xs">
                          #{index + 1}
                        </Badge>
                      </div>
                      {subtask.description && (
                        <p className="text-sm text-gray-600">{subtask.description}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleEdit(subtask)}
                      className="p-2 h-8 w-8"
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDelete(subtask.id)}
                      className="p-2 h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
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

export default TemplateSubtaskManager;
