
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Plus, Edit, Trash2, Save, X, Tag, Link, ArrowLeft } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Database } from "@/integrations/supabase/types";
import TemplateSubtaskManager from "./TemplateSubtaskManager";
import { useNavigate } from "react-router-dom";

type TaskTemplate = Database['public']['Tables']['task_templates']['Row'];

const AdminPanel = () => {
  const navigate = useNavigate();
  const [templates, setTemplates] = useState<TaskTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    priority: 'medium',
    estimated_hours: '',
    tags: [] as string[],
    dependencies: [] as string[],
    reference_links: [] as string[]
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

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      category: '',
      priority: 'medium',
      estimated_hours: '',
      tags: [],
      dependencies: [],
      reference_links: []
    });
    setNewTag('');
    setNewDependency('');
    setNewLink('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const templateData = {
        title: formData.title,
        description: formData.description || null,
        category: formData.category,
        priority: formData.priority,
        estimated_hours: formData.estimated_hours ? parseInt(formData.estimated_hours) : null,
        tags: formData.tags.length > 0 ? formData.tags : null,
        dependencies: formData.dependencies.length > 0 ? formData.dependencies : null,
        reference_links: formData.reference_links.length > 0 ? formData.reference_links : null
      };

      if (editingTemplate) {
        const { error } = await supabase
          .from('task_templates')
          .update(templateData)
          .eq('id', editingTemplate);

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

  const handleEdit = (template: TaskTemplate) => {
    setFormData({
      title: template.title,
      description: template.description || '',
      category: template.category,
      priority: template.priority,
      estimated_hours: template.estimated_hours?.toString() || '',
      tags: template.tags || [],
      dependencies: template.dependencies || [],
      reference_links: template.reference_links || []
    });
    setEditingTemplate(template.id);
    setIsCreateDialogOpen(true);
  };

  const handleDelete = async (templateId: string) => {
    if (!confirm('Sei sicuro di voler eliminare questo template? Questa azione eliminerà anche tutti i sottotask associati.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('task_templates')
        .delete()
        .eq('id', templateId);

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

  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData({...formData, tags: [...formData.tags, newTag.trim()]});
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData({...formData, tags: formData.tags.filter(tag => tag !== tagToRemove)});
  };

  const addDependency = () => {
    if (newDependency.trim() && !formData.dependencies.includes(newDependency.trim())) {
      setFormData({...formData, dependencies: [...formData.dependencies, newDependency.trim()]});
      setNewDependency('');
    }
  };

  const removeDependency = (depToRemove: string) => {
    setFormData({...formData, dependencies: formData.dependencies.filter(dep => dep !== depToRemove)});
  };

  const addLink = () => {
    if (newLink.trim() && !formData.reference_links.includes(newLink.trim())) {
      setFormData({...formData, reference_links: [...formData.reference_links, newLink.trim()]});
      setNewLink('');
    }
  };

  const removeLink = (linkToRemove: string) => {
    setFormData({...formData, reference_links: formData.reference_links.filter(link => link !== linkToRemove)});
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="grid gap-6">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="max-w-6xl mx-auto p-6">
        <div className="mb-8">
          <Button 
            onClick={() => navigate('/')} 
            variant="outline" 
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Torna alla Home
          </Button>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Pannello Amministrativo
              </h1>
              <p className="text-gray-600">
                Gestisci i template dei task che verranno applicati automaticamente a tutti i domini
              </p>
            </div>
            <Dialog open={isCreateDialogOpen} onOpenChange={(open) => {
              setIsCreateDialogOpen(open);
              if (!open) {
                resetForm();
                setEditingTemplate(null);
              }
            }}>
              <DialogTrigger asChild>
                <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                  <Plus className="h-4 w-4 mr-2" />
                  Nuovo Template
                </Button>
              </DialogTrigger>
              
              <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {editingTemplate ? 'Modifica Template' : 'Nuovo Template Task'}
                  </DialogTitle>
                </DialogHeader>
                
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="title">Titolo *</Label>
                      <Input
                        id="title"
                        value={formData.title}
                        onChange={(e) => setFormData({...formData, title: e.target.value})}
                        placeholder="Titolo del task..."
                        required
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="category">Categoria *</Label>
                      <Input
                        id="category"
                        value={formData.category}
                        onChange={(e) => setFormData({...formData, category: e.target.value})}
                        placeholder="es. SEO, Content, Technical..."
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

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="priority">Priorità</Label>
                      <Select
                        value={formData.priority}
                        onValueChange={(value) => setFormData({...formData, priority: value})}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Bassa</SelectItem>
                          <SelectItem value="medium">Media</SelectItem>
                          <SelectItem value="high">Alta</SelectItem>
                          <SelectItem value="urgent">Urgente</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label htmlFor="estimated_hours">Ore Stimate</Label>
                      <Input
                        id="estimated_hours"
                        type="number"
                        min="0"
                        step="0.5"
                        value={formData.estimated_hours}
                        onChange={(e) => setFormData({...formData, estimated_hours: e.target.value})}
                        placeholder="8"
                      />
                    </div>
                  </div>

                  <Separator />

                  {/* Tags Section */}
                  <div>
                    <Label className="flex items-center gap-2 mb-2">
                      <Tag className="h-4 w-4" />
                      Tags
                    </Label>
                    <div className="flex gap-2 mb-2">
                      <Input
                        value={newTag}
                        onChange={(e) => setNewTag(e.target.value)}
                        placeholder="Aggiungi tag..."
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                      />
                      <Button type="button" onClick={addTag} size="sm">
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {formData.tags.map((tag) => (
                        <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                          {tag}
                          <X className="h-3 w-3 cursor-pointer" onClick={() => removeTag(tag)} />
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Dependencies Section */}
                  <div>
                    <Label className="mb-2 block">Dipendenze</Label>
                    <div className="flex gap-2 mb-2">
                      <Input
                        value={newDependency}
                        onChange={(e) => setNewDependency(e.target.value)}
                        placeholder="Aggiungi dipendenza..."
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addDependency())}
                      />
                      <Button type="button" onClick={addDependency} size="sm">
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {formData.dependencies.map((dep) => (
                        <Badge key={dep} variant="outline" className="flex items-center gap-1">
                          {dep}
                          <X className="h-3 w-3 cursor-pointer" onClick={() => removeDependency(dep)} />
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Reference Links Section */}
                  <div>
                    <Label className="flex items-center gap-2 mb-2">
                      <Link className="h-4 w-4" />
                      Link di Riferimento
                    </Label>
                    <div className="flex gap-2 mb-2">
                      <Input
                        value={newLink}
                        onChange={(e) => setNewLink(e.target.value)}
                        placeholder="https://esempio.com"
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addLink())}
                      />
                      <Button type="button" onClick={addLink} size="sm">
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                    <div className="space-y-1">
                      {formData.reference_links.map((link) => (
                        <div key={link} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                          <span className="text-sm flex-1 truncate">{link}</span>
                          <X className="h-3 w-3 cursor-pointer text-red-600" onClick={() => removeLink(link)} />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Subtasks Section - only show for editing existing templates */}
                  {editingTemplate && (
                    <div>
                      <Label className="mb-2 block">Sottotask Template</Label>
                      <TemplateSubtaskManager templateId={editingTemplate} />
                    </div>
                  )}

                  <div className="flex justify-end gap-3 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setIsCreateDialogOpen(false);
                        resetForm();
                        setEditingTemplate(null);
                      }}
                    >
                      Annulla
                    </Button>
                    <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                      <Save className="h-4 w-4 mr-2" />
                      {editingTemplate ? 'Aggiorna' : 'Crea'} Template
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {templates.length === 0 ? (
          <Card className="bg-white border-0 shadow-md">
            <CardContent className="p-12 text-center">
              <div className="text-6xl mb-4">📋</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Nessun template ancora
              </h3>
              <p className="text-gray-600 mb-6">
                Crea il tuo primo template per automatizzare la creazione di task per tutti i domini
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {templates.map((template) => (
              <Card key={template.id} className="bg-white border-0 shadow-md hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-xl font-bold text-gray-900 mb-1">
                        {template.title}
                      </CardTitle>
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline">{template.category}</Badge>
                        <Badge 
                          variant={
                            template.priority === 'urgent' ? 'destructive' :
                            template.priority === 'high' ? 'default' :
                            template.priority === 'medium' ? 'secondary' : 'outline'
                          }
                        >
                          {template.priority === 'low' ? 'Bassa' :
                           template.priority === 'medium' ? 'Media' :
                           template.priority === 'high' ? 'Alta' : 'Urgente'}
                        </Badge>
                        {template.estimated_hours && (
                          <Badge variant="outline">
                            {template.estimated_hours}h
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(template)}
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDelete(template.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {template.description && (
                    <p className="text-gray-600 mb-4">{template.description}</p>
                  )}
                  
                  <div className="space-y-3">
                    {template.tags && template.tags.length > 0 && (
                      <div>
                        <span className="text-sm font-medium text-gray-700 mr-2">Tags:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {template.tags.map((tag) => (
                            <Badge key={tag} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {template.dependencies && template.dependencies.length > 0 && (
                      <div>
                        <span className="text-sm font-medium text-gray-700 mr-2">Dipendenze:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {template.dependencies.map((dep) => (
                            <Badge key={dep} variant="outline" className="text-xs">
                              {dep}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {template.reference_links && template.reference_links.length > 0 && (
                      <div>
                        <span className="text-sm font-medium text-gray-700 mr-2">Link:</span>
                        <div className="space-y-1 mt-1">
                          {template.reference_links.map((link, idx) => (
                            <div key={idx}>
                              <a 
                                href={link} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-xs text-blue-600 hover:text-blue-800 underline break-all"
                              >
                                {link}
                              </a>
                            </div>
                          ))}
                        </div>
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
