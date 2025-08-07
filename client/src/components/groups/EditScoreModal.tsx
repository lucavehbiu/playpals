import { useState, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { History, Edit, AlertTriangle, Trophy, Users } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";

interface EditScoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  eventId: number;
  matchResult: any;
}

interface ScoreHistoryItem {
  id: number;
  previousScoreA: number;
  previousScoreB: number;
  newScoreA: number;
  newScoreB: number;
  previousWinningSide: string | null;
  newWinningSide: string | null;
  editedBy: number;
  reason: string | null;
  editedAt: string;
  editor: {
    id: number;
    name: string;
    profileImage: string | null;
  };
}

export const EditScoreModal = ({ isOpen, onClose, eventId, matchResult }: EditScoreModalProps) => {
  const { toast } = useToast();
  const { user } = useAuth();
  
  const [scoreA, setScoreA] = useState(matchResult?.scoreA || 0);
  const [scoreB, setScoreB] = useState(matchResult?.scoreB || 0);
  const [reason, setReason] = useState("");
  const [showHistory, setShowHistory] = useState(false);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen && matchResult) {
      setScoreA(matchResult.scoreA || 0);
      setScoreB(matchResult.scoreB || 0);
      setReason("");
    }
  }, [isOpen, matchResult]);

  // Fetch score history
  const { data: scoreHistory = [], isLoading: historyLoading } = useQuery<ScoreHistoryItem[]>({
    queryKey: [`/api/events/${eventId}/score-history`],
    enabled: isOpen && !!eventId,
  });

  // Determine winning side
  const getWinningSide = (scoreA: number, scoreB: number) => {
    if (scoreA > scoreB) return 'A';
    if (scoreB > scoreA) return 'B';
    return null; // Draw
  };

  // Edit score mutation
  const editScoreMutation = useMutation({
    mutationFn: async () => {
      const winningSide = getWinningSide(scoreA, scoreB);
      
      const res = await apiRequest("PUT", `/api/events/${eventId}/score`, {
        scoreA: parseInt(scoreA.toString()),
        scoreB: parseInt(scoreB.toString()),
        winningSide,
        reason: reason.trim() || null
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to update score");
      }
      
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/events/${eventId}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/events/${eventId}/score-history`] });
      queryClient.invalidateQueries({ queryKey: [`/api/rsvps/event/${eventId}`] });
      
      toast({
        title: "Score Updated",
        description: "The score has been updated successfully. All participants have been notified.",
        variant: "default",
      });
      
      onClose();
    },
    onError: (error: Error) => {
      toast({
        title: "Update Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate scores
    if (scoreA < 0 || scoreB < 0) {
      toast({
        title: "Invalid Score",
        description: "Scores cannot be negative numbers.",
        variant: "destructive",
      });
      return;
    }

    // Check if scores actually changed
    if (scoreA === matchResult.scoreA && scoreB === matchResult.scoreB) {
      toast({
        title: "No Changes",
        description: "The scores you entered are the same as current scores.",
        variant: "destructive",
      });
      return;
    }

    editScoreMutation.mutate();
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit className="h-5 w-5" />
            Edit Match Score
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Warning Notice */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-amber-800 mb-1">Score Edit Notice</p>
                <p className="text-amber-700">
                  Editing the score will notify all event participants about the change and add an entry to the score history.
                </p>
              </div>
            </div>
          </div>

          {/* Current Score Display */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
              <Trophy className="h-4 w-4" />
              Current Score
            </h4>
            <div className="flex items-center justify-center gap-8">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{matchResult?.scoreA || 0}</div>
                <div className="text-sm text-gray-600">Team A</div>
              </div>
              <div className="text-xl text-gray-400">vs</div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{matchResult?.scoreB || 0}</div>
                <div className="text-sm text-gray-600">Team B</div>
              </div>
            </div>
          </div>

          {/* Edit Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Team A Score
                </label>
                <Input
                  type="number"
                  min="0"
                  value={scoreA}
                  onChange={(e) => setScoreA(parseInt(e.target.value) || 0)}
                  className="text-center text-lg font-semibold"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Team B Score
                </label>
                <Input
                  type="number"
                  min="0"
                  value={scoreB}
                  onChange={(e) => setScoreB(parseInt(e.target.value) || 0)}
                  className="text-center text-lg font-semibold"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Reason for Edit (Optional)
              </label>
              <Textarea
                placeholder="Explain why you're changing the score (e.g., 'Counted wrong initially', 'Missed a goal', etc.)"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="h-20"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                type="submit"
                disabled={editScoreMutation.isPending}
                className="flex-1"
              >
                {editScoreMutation.isPending ? "Updating..." : "Update Score"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={editScoreMutation.isPending}
              >
                Cancel
              </Button>
            </div>
          </form>

          {/* Score History Toggle */}
          <div className="border-t pt-4">
            <Button
              variant="ghost"
              onClick={() => setShowHistory(!showHistory)}
              className="w-full justify-start"
            >
              <History className="h-4 w-4 mr-2" />
              {showHistory ? "Hide" : "Show"} Score History
              {scoreHistory.length > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {scoreHistory.length}
                </Badge>
              )}
            </Button>
          </div>

          {/* Score History */}
          {showHistory && (
            <div className="space-y-3">
              {historyLoading ? (
                <div className="text-center py-4">
                  <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
                  <p className="text-sm text-gray-500 mt-2">Loading history...</p>
                </div>
              ) : scoreHistory.length === 0 ? (
                <div className="text-center py-6">
                  <History className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No score edits yet</p>
                  <p className="text-sm text-gray-400">This will be the first edit for this match</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {scoreHistory.map((historyItem, index) => (
                    <div key={historyItem.id} className="bg-white border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Avatar className="h-6 w-6">
                            <AvatarImage src={historyItem.editor.profileImage || undefined} />
                            <AvatarFallback className="text-xs">
                              {historyItem.editor.name.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium text-sm">{historyItem.editor.name}</span>
                        </div>
                        <span className="text-xs text-gray-500">
                          {format(new Date(historyItem.editedAt), "MMM d, h:mm a")}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm">
                        <span className="text-gray-600">
                          {historyItem.previousScoreA}-{historyItem.previousScoreB}
                        </span>
                        <span className="text-gray-400">→</span>
                        <span className="font-medium text-gray-900">
                          {historyItem.newScoreA}-{historyItem.newScoreB}
                        </span>
                      </div>
                      
                      {historyItem.reason && (
                        <p className="text-sm text-gray-600 mt-2 italic">
                          "{historyItem.reason}"
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};