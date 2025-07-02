
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Globe, Save } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const DomainForm = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    url: '',
    description: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Crea il dominio
      const { data: domain, error: domainError } = await supabase
        .from('domains')
        .insert([{
          name: formData.name,
          url: formData.url,
          description: formData.description || null
        }])
        .select()
        .single();

      if (domainError) throw domainError;

      // Recupera tutti i template e crea i task per questo dominio
      const { data: templates, error: templatesError } = await supabase
        .from('task_templates')
        .select('*');

      if (templatesError) throw templatesError;

      if (templates && templates.length > 0) {
        const domainTasks = templates.map(template => ({
          domain_id: domain.id,
          template_id: template.id,
          title: template.title,
          description: template.description,
          category: template.category,
          estimated_hours: template.estimated_hours,
          priority: template.priority,
          completed: false
        }));

        const { error: tasksError } = await supabase
          .from('domain_tasks')
          .insert(domainTasks);

        if (tasksError) throw tasksError;
      }

      toast({
        title: "Successo",
        description: `Dominio "${formData.name}" creato con successo${templates?.length ? ` con ${templates.length} task` : ''}`
      });

      navigate(`/domains/${domain.id}`);
    } catch (error) {
      console.error('Error creating domain:', error);
      toast({
        title: "Errore",
        description: "Impossibile creare il dominio",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
      <div className="max-w-2xl mx-auto">
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
          
          <div className="flex items-center mb-2">
            <Globe className="h-8 w-8 text-blue-600 mr-3" />
            <h1 className="text-4xl font-bold text-gray-900">
              Nuovo Dominio
            </h1>
          </div>
          <p className="text-lg text-gray-600">
            Aggiungi un nuovo dominio cliente per tracciare i suoi task
          </p>
        </div>

        {/* Form */}
        <Card className="bg-white border-0 shadow-xl">
          <CardHeader>
            <CardTitle className="text-xl text-gray-900">
              Informazioni Dominio
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Label htmlFor="name" className="text-sm font-medium text-gray-700">
                  Nome Dominio *
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="es. Sito Azienda XYZ"
                  required
                  className="mt-1"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Un nome identificativo per questo progetto
                </p>
              </div>

              <div>
                <Label htmlFor="url" className="text-sm font-medium text-gray-700">
                  URL Sito *
                </Label>
                <Input
                  id="url"
                  type="url"
                  value={formData.url}
                  onChange={(e) => setFormData({...formData, url: e.target.value})}
                  placeholder="https://esempio.com"
                  required
                  className="mt-1"
                />
                <p className="text-xs text-gray-500 mt-1">
                  L'URL principale del sito web
                </p>
              </div>

              <div>
                <Label htmlFor="description" className="text-sm font-medium text-gray-700">
                  Descrizione
                </Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="Breve descrizione del progetto, cliente o note particolari..."
                  rows={4}
                  className="mt-1"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Informazioni aggiuntive sul progetto (opzionale)
                </p>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/')}
                  disabled={loading}
                >
                  Annulla
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {loading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  {loading ? 'Creazione...' : 'Crea Dominio'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Info Card */}
        <Card className="mt-6 bg-blue-50 border-blue-200">
          <CardContent className="p-6">
            <h3 className="font-semibold text-blue-900 mb-2">
              💡 Cosa succede dopo?
            </h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Il dominio verrà creato automaticamente</li>
              <li>• Tutti i template di task esistenti verranno applicati</li>
              <li>• Potrai subito iniziare a spuntare i task completati</li>
              <li>• I progressi saranno salvati e tracciati automaticamente</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DomainForm;
