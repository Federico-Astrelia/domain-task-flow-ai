
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { MessageSquare, Send } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Database } from "@/integrations/supabase/types";

type TaskComment = Database['public']['Tables']['task_comments']['Row'];

interface TaskCommentsProps {
  taskId?: string;
  subtaskId?: string;
  isCompact?: boolean;
}

const TaskComments = ({ taskId, subtaskId, isCompact = false }: TaskCommentsProps) => {
  const [comments, setComments] = useState<TaskComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newComment, setNewComment] = useState('');

  useEffect(() => {
    fetchComments();
  }, [taskId, subtaskId]);

  const fetchComments = async () => {
    try {
      let query = supabase.from('task_comments').select('*');
      
      if (taskId) {
        query = query.eq('task_id', taskId).is('subtask_id', null);
      } else if (subtaskId) {
        query = query.eq('subtask_id', subtaskId).is('task_id', null);
      }
      
      const { data, error } = await query.order('created_at', { ascending: true });

      if (error) throw error;
      setComments(data || []);
    } catch (error) {
      console.error('Error fetching comments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newComment.trim()) return;

    try {
      const commentData: any = {
        content: newComment.trim()
      };

      if (taskId) {
        commentData.task_id = taskId;
      } else if (subtaskId) {
        commentData.subtask_id = subtaskId;
      }

      const { error } = await supabase
        .from('task_comments')
        .insert([commentData]);

      if (error) throw error;

      toast({
        title: "Successo",
        description: "Commento aggiunto con successo"
      });

      setNewComment('');
      setIsDialogOpen(false);
      fetchComments();
    } catch (error) {
      console.error('Error adding comment:', error);
      toast({
        title: "Errore",
        description: "Impossibile aggiungere il commento",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return null;
  }

  return (
    <div className={`${isCompact ? 'mt-2' : 'mt-4'}`}>
      <div className="flex items-center gap-2">
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button 
              size={isCompact ? "sm" : "default"} 
              variant="ghost" 
              className={`p-1 h-auto text-gray-600 hover:text-gray-900 ${isCompact ? 'text-xs' : ''}`}
            >
              <MessageSquare className={`${isCompact ? 'h-3 w-3' : 'h-4 w-4'} mr-1`} />
              {comments.length > 0 ? `${comments.length} commenti` : 'Aggiungi commento'}
            </Button>
          </DialogTrigger>
          
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Commenti</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {comments.length === 0 ? (
                <p className="text-sm text-gray-500 italic">Nessun commento ancora</p>
              ) : (
                comments.map((comment) => (
                  <div key={comment.id} className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-sm text-gray-900">{comment.content}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(comment.created_at).toLocaleString('it-IT')}
                    </p>
                  </div>
                ))
              )}
            </div>
            
            <form onSubmit={handleSubmitComment} className="space-y-3 border-t pt-4">
              <Textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Scrivi un commento..."
                rows={3}
                className="resize-none"
              />
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsDialogOpen(false);
                    setNewComment('');
                  }}
                >
                  Annulla
                </Button>
                <Button 
                  type="submit" 
                  disabled={!newComment.trim()}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Send className="h-4 w-4 mr-1" />
                  Invia
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default TaskComments;
