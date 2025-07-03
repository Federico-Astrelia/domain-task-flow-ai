import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Plus, Edit, Trash2, Settings, CheckSquare, ArrowLeft } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Database } from "@/integrations/supabase/types";

type TaskTemplate = Database['public']['Tables']['task_templates']['Row'];

const AdminPanel = () => {
  const navigate = useNavigate();
  const [templates, setTemplates] = useState<TaskTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<TaskTemplate | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    estimated_hours: '',
    priority: 'medium' as 'low' | 'medium' | 'high'
  });

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from('task_templates')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTemplates(data || []);
    } catch (error) {
      console.error('Error fetching templates:', error);
      toast({
        title: "Errore",
        description: "Impossibile caricare i template",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const templateData = {
        title: formData.title,
        description: formData.description || null,
        category: formData.category,
        estimated_hours: formData.estimated_hours ? parseInt(formData.estimated_hours) : null,
        priority: formData.priority as 'low' | 'medium' | 'high'
      };

      if (editingTemplate) {
        const { error } = await supabase
          .from('task_templates')
          .update(templateData)
          .eq('id', editingTemplate.id);

        if (error) throw error;
        toast({
          title: "Successo",
          description: "Template aggiornato con successo"
        });
      } else {
        const { error } = await supabase
          .from('task_templates')
          .insert([templateData]);

        if (error) throw error;
        toast({
          title: "Successo",
          description: "Template creato con successo"
        });
      }

      resetForm();
      setIsCreateDialogOpen(false);
      setEditingTemplate(null);
      fetchTemplates();
    } catch (error) {
      console.error('Error saving template:', error);
      toast({
        title: "Errore",
        description: "Impossibile salvare il template",
        variant: "destructive"
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Sei sicuro di voler eliminare questo template?')) return;

    try {
      const { error } = await supabase
        .from('task_templates')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Successo",
        description: "Template eliminato con successo"
      });
      fetchTemplates();
    } catch (error) {
      console.error('Error deleting template:', error);
      toast({
        title: "Errore",
        description: "Impossibile eliminare il template",
        variant: "destructive"
      });
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      category: '',
      estimated_hours: '',
      priority: 'medium' as 'low' | 'medium' | 'high'
    });
  };

  const handleEdit = (template: TaskTemplate) => {
    setEditingTemplate(template);
    setFormData({
      title: template.title,
      description: template.description || '',
      category: template.category,
      estimated_hours: template.estimated_hours?.toString() || '',
      priority: template.priority as 'low' | 'medium' | 'high'
    });
    setIsCreateDialogOpen(true);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
        <div className="max-w-6xl mx-auto">
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
            Torna ai Domini
          </Button>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2 flex items-center">
                <Settings className="h-8 w-8 mr-3 text-blue-600" />
                Amministrazione
              </h1>
              <p className="text-lg text-gray-600">
                Gestisci i template di task predefiniti per tutti i domini
              </p>
            </div>
            
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  onClick={() => {
                    resetForm();
                    setEditingTemplate(null);
                  }}
                  className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Nuovo Template
                </Button>
              </DialogTrigger>
              
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>
                    {editingTemplate ? 'Modifica Template' : 'Nuovo Template'}
                  </DialogTitle>
                </DialogHeader>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="title">Titolo *</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => setFormData({...formData, title: e.target.value})}
                      placeholder="es. Controllo SEO, Backup database..."
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="category">Categoria *</Label>
                    <Input
                      id="category"
                      value={formData.category}
                      onChange={(e) => setFormData({...formData, category: e.target.value})}
                      placeholder="es. SEO, Sicurezza, Manutenzione..."
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="description">Descrizione</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                      placeholder="Descrizione dettagliata del task..."
                      rows={3}
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="priority">Priorità</Label>
                      <select
                        id="priority"
                        value={formData.priority}
                        onChange={(e) => setFormData({...formData, priority: e.target.value as 'low' | 'medium' | 'high'})}
                        className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="low">Bassa</option>
                        <option value="medium">Media</option>
                        <option value="high">Alta</option>
                      </select>
                    </div>
                    
                    <div>
                      <Label htmlFor="estimated_hours">Ore stimate</Label>
                      <Input
                        id="estimated_hours"
                        type="number"
                        value={formData.estimated_hours}
                        onChange={(e) => setFormData({...formData, estimated_hours: e.target.value})}
                        placeholder="es. 2"
                        min="0"
                        step="0.5"
                      />
                    </div>
                  </div>
                  
                  <div className="flex justify-end gap-3 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setIsCreateDialogOpen(false);
                        setEditingTemplate(null);
                        resetForm();
                      }}
                    >
                      Annulla
                    </Button>
                    <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                      {editingTemplate ? 'Salva Modifiche' : 'Crea Template'}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Templates Grid */}
        {templates.length === 0 ? (
          <Card className="bg-white border-0 shadow-md">
            <CardContent className="p-12 text-center">
              <CheckSquare className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Nessun template ancora
              </h3>
              <p className="text-gray-600 mb-6">
                Crea il tuo primo template per standardizzare i task su tutti i domini
              </p>
              <Button
                onClick={() => setIsCreateDialogOpen(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                Crea Primo Template
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {templates.map((template) => (
              <Card
                key={template.id}
                className="bg-white border-0 shadow-md hover:shadow-lg transition-all duration-200"
              >
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg font-bold text-gray-900 mb-1">
                        {template.title}
                      </CardTitle>
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="secondary" className="text-xs">
                          {template.category}
                        </Badge>
                        <Badge className={`text-xs ${getPriorityColor(template.priority)}`}>
                          {getPriorityLabel(template.priority)}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleEdit(template)}
                        className="p-2 h-8 w-8"
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDelete(template.id)}
                        className="p-2 h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {template.description && (
                      <p className="text-sm text-gray-600 line-clamp-3">
                        {template.description}
                      </p>
                    )}
                    
                    {template.estimated_hours && (
                      <div className="text-xs text-gray-500">
                        Tempo stimato: {template.estimated_hours}h
                      </div>
                    )}
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

export default AdminPanel;
