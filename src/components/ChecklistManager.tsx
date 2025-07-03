
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Trash2, GripVertical } from "lucide-react";

interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
}

interface ChecklistManagerProps {
  items: ChecklistItem[];
  onChange: (items: ChecklistItem[]) => void;
  readonly?: boolean;
}

const ChecklistManager = ({ items, onChange, readonly = false }: ChecklistManagerProps) => {
  const [newItemText, setNewItemText] = useState('');

  const addItem = () => {
    if (!newItemText.trim()) return;
    
    const newItem: ChecklistItem = {
      id: Date.now().toString(),
      text: newItemText.trim(),
      completed: false
    };
    
    onChange([...items, newItem]);
    setNewItemText('');
  };

  const updateItem = (id: string, updates: Partial<ChecklistItem>) => {
    onChange(items.map(item => 
      item.id === id ? { ...item, ...updates } : item
    ));
  };

  const removeItem = (id: string) => {
    onChange(items.filter(item => item.id !== id));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      addItem();
    }
  };

  return (
    <div className="space-y-3">
      {!readonly && (
        <div className="flex gap-2">
          <Input
            value={newItemText}
            onChange={(e) => setNewItemText(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Aggiungi elemento checklist..."
            className="flex-1"
          />
          <Button 
            onClick={addItem}
            size="sm"
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      )}
      
      {items.length > 0 && (
        <div className="space-y-2">
          {items.map((item) => (
            <Card key={item.id} className="bg-gray-50">
              <CardContent className="p-3">
                <div className="flex items-center gap-3">
                  {!readonly && <GripVertical className="h-4 w-4 text-gray-400" />}
                  <Checkbox
                    checked={item.completed}
                    onCheckedChange={(checked) => 
                      updateItem(item.id, { completed: checked as boolean })
                    }
                    disabled={readonly}
                  />
                  <span className={`text-sm flex-1 ${
                    item.completed ? 'line-through text-gray-500' : 'text-gray-900'
                  }`}>
                    {item.text}
                  </span>
                  {!readonly && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => removeItem(item.id)}
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
      
      {items.length === 0 && readonly && (
        <p className="text-sm text-gray-500 italic">Nessun elemento nella checklist</p>
      )}
    </div>
  );
};

export default ChecklistManager;
