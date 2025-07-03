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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Edit, Trash2, Settings, CheckSquare, ArrowLeft, Tag, Link, Users } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Database } from "@/integrations/supabase/types";
import TemplateSubtaskManager from "./TemplateSubtaskManager";
import ChecklistManager from "./ChecklistManager";

type TaskTemplate = Database['public']['Tables']['task_templates']['Row'];

interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
}

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
    priority: 'medium' as 'low' | 'medium' | 'high',
    tags: [] as string[],
    dependencies: [] as string[],
    reference_links: [] as string[],
    checklist_items: [] as ChecklistItem[]
  });
  const [newTag, setNewTag] = useState('');
  const [newDependency, setNewDependency] = useState('');
  const [newLink, setNewLink] = useState('');

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
        priority: formData.priority as 'low' | 'medium' | 'high',
        tags: formData.tags.length > 0 ? formData.tags : null,
        dependencies: formData.dependencies.length > 0 ? formData.dependencies : null,
        reference_links: formData.reference_links.length > 0 ? formData.reference_links : null,
        checklist_items: formData.checklist_items.length > 0 ? formData.checklist_items : null
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
      priority: 'medium' as 'low' | 'medium' | 'high',
      tags: [],
      dependencies: [],
      reference_links: [],
      checklist_items: []
    });
    setNewTag('');
    setNewDependency('');
    setNewLink('');
  };

  const handleEdit = (template: TaskTemplate) => {
    setEditingTemplate(template);
    setFormData({
      title: template.title,
      description: template.description || '',
      category: template.category,
      estimated_hours: template.estimated_hours?.toString() || '',
      priority: template.priority as 'low' | 'medium' | 'high',
      tags: template.tags || [],
      dependencies: template.dependencies || [],
      reference_links: template.reference_links || [],
      checklist_items: template.checklist_items ? 
        (Array.isArray(template.checklist_items) ? template.checklist_items : []) : []
    });
    setIsCreateDialogOpen(true);
  };

  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
      setNewTag('');
    }
  };

  const removeTag = (tag: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tag)
    }));
  };

  const addDependency = () => {
    if (newDependency.trim() && !formData.dependencies.includes(newDependency.trim())) {
      setFormData(prev => ({
        ...prev,
        dependencies: [...prev.dependencies, newDependency.trim()]
      }));
      setNewDependency('');
    }
  };

  const removeDependency = (dependency: string) => {
    setFormData(prev => ({
      ...prev,
      dependencies: prev.dependencies.filter(d => d !== dependency)
    }));
  };

  const addLink = () => {
    if (newLink.trim() && !formData.reference_links.includes(newLink.trim())) {
      setFormData(prev => ({
        ...prev,
        reference_links: [...prev.reference_links, newLink.trim()]
      }));
      setNewLink('');
    }
  };

  const removeLink = (link: string) => {
    setFormData(prev => ({
      ...prev,
      reference_links: prev.reference_links.filter(l => l !== link)
    }));
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
              
              <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {editingTemplate ? 'Modifica Template' : 'Nuovo Template'}
                  </DialogTitle>
                </DialogHeader>
                
                <form onSubmit={handleSubmit}>
                  <Tabs defaultValue="basic" className="space-y-4">
                    <TabsList className="grid w-full grid-cols-4">
                      <TabsTrigger value="basic">Base</TabsTrigger>
                      <TabsTrigger value="advanced">Avanzato</TabsTrigger>
                      <TabsTrigger value="checklist">Checklist</TabsTrigger>
                      <TabsTrigger value="subtasks">Sottotask</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="basic" className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
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
                    </TabsContent>
                    
                    <TabsContent value="advanced" className="space-y-4">
                      <div>
                        <Label className="flex items-center gap-2">
                          <Tag className="h-4 w-4" />
                          Tag
                        </Label>
                        <div className="flex gap-2 mb-2">
                          <Input
                            value={newTag}
                            onChange={(e) => setNewTag(e.target.value)}
                            placeholder="Aggiungi tag..."
                            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                          />
                          <Button type="button" onClick={addTag} size="sm">
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {formData.tags.map(tag => (
                            <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                              {tag}
                              <button
                                type="button"
                                onClick={() => removeTag(tag)}
                                className="ml-1 hover:text-red-600"
                              >
                                ×
                              </button>
                            </Badge>
                          ))}
                        </div>
                      </div>
                      
                      <div>
                        <Label className="flex items-center gap-2">
                          <Users className="h-4 w-4" />
                          Dipendenze
                        </Label>
                        <div className="flex gap-2 mb-2">
                          <Input
                            value={newDependency}
                            onChange={(e) => setNewDependency(e.target.value)}
                            placeholder="Aggiungi dipendenza..."
                            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addDependency())}
                          />
                          <Button type="button" onClick={addDependency} size="sm">
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {formData.dependencies.map(dep => (
                            <Badge key={dep} variant="outline" className="flex items-center gap-1">
                              {dep}
                              <button
                                type="button"
                                onClick={() => removeDependency(dep)}
                                className="ml-1 hover:text-red-600"
                              >
                                ×
                              </button>
                            </Badge>
                          ))}
                        </div>
                      </div>
                      
                      <div>
                        <Label className="flex items-center gap-2">
                          <Link className="h-4 w-4" />
                          Link di Riferimento
                        </Label>
                        <div className="flex gap-2 mb-2">
                          <Input
                            value={newLink}
                            onChange={(e) => setNewLink(e.target.value)}
                            placeholder="Aggiungi URL..."
                            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addLink())}
                          />
                          <Button type="button" onClick={addLink} size="sm">
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="space-y-1">
                          {formData.reference_links.map(link => (
                            <div key={link} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                              <a href={link} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-sm truncate">
                                {link}
                              </a>
                              <button
                                type="button"
                                onClick={() => removeLink(link)}
                                className="ml-2 text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="checklist" className="space-y-4">
                      <div>
                        <Label>Checklist Integrata</Label>
                        <ChecklistManager 
                          items={formData.checklist_items}
                          onChange={(items) => setFormData({...formData, checklist_items: items})}
                        />
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="subtasks" className="space-y-4">
                      {editingTemplate ? (
                        <TemplateSubtaskManager templateId={editingTemplate.id} />
                      ) : (
                        <div className="text-center py-8 text-gray-500">
                          <p>Salva prima il template per aggiungere i sottotask</p>
                        </div>
                      )}
                    </TabsContent>
                  </Tabs>
                  
                  <div className="flex justify-end gap-3 pt-6 mt-6 border-t">
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
                    
                    {template.tags && template.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {template.tags.slice(0, 3).map(tag => (
                          <Badge key={tag} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                        {template.tags.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{template.tags.length - 3}
                          </Badge>
                        )}
                      </div>
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
