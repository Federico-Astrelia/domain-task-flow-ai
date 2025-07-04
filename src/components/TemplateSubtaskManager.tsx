
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, GripVertical } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Database } from "@/integrations/supabase/types";

type TemplateSubtask = Database['public']['Tables']['template_subtasks']['Row'];

interface TemplateSubtaskManagerProps {
  templateId: string;
  readonly?: boolean;
}

const TemplateSubtaskManager = ({ templateId, readonly = false }: TemplateSubtaskManagerProps) => {
  const [subtasks, setSubtasks] = useState<TemplateSubtask[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: ''
  });

  useEffect(() => {
    if (templateId) {
      fetchSubtasks();
    }
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
      toast({
        title: "Errore",
        description: "Impossibile caricare i sottotask del template",
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
        .from('template_subtasks')
        .insert([{
          template_id: templateId,
          title: formData.title,
          description: formData.description || null,
          order_index: subtasks.length
        }]);

      if (error) throw error;

      toast({
        title: "Successo",
        description: "Sottotask del template creato con successo"
      });

      setFormData({ title: '', description: '' });
      setIsCreateDialogOpen(false);
      fetchSubtasks();
    } catch (error) {
      console.error('Error creating template subtask:', error);
      toast({
        title: "Errore",
        description: "Impossibile creare il sottotask del template",
        variant: "destructive"
      });
    }
  };

  const handleDelete = async (subtaskId: string) => {
    try {
      const { error } = await supabase
        .from('template_subtasks')
        .delete()
        .eq('id', subtaskId);

      if (error) throw error;

      toast({
        title: "Successo",
        description: "Sottotask del template eliminato"
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

  if (loading) {
    return <div className="animate-pulse h-32 bg-gray-200 rounded"></div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="font-medium text-gray-900">Sottotask Template</h4>
        {!readonly && (
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline">
                <Plus className="h-3 w-3 mr-1" />
                Aggiungi
              </Button>
            </DialogTrigger>
            
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Nuovo Sottotask Template</DialogTitle>
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
        <p className="text-sm text-gray-500 italic">Nessun sottotask template ancora</p>
      ) : (
        <div className="space-y-2">
          {subtasks.map((subtask) => (
            <Card key={subtask.id} className="bg-gray-50 border border-gray-200">
              <CardContent className="p-3">
                <div className="flex items-start gap-3">
                  <GripVertical className="h-4 w-4 text-gray-400 mt-1" />
                  
                  <div className="flex-1">
                    <h5 className="font-medium text-sm text-gray-900">
                      {subtask.title}
                    </h5>
                    
                    {subtask.description && (
                      <p className="text-xs text-gray-600 mt-1">
                        {subtask.description}
                      </p>
                    )}
                  </div>
                  
                  {!readonly && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDelete(subtask.id)}
                      className="p-1 h-6 w-6 text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  )}
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
