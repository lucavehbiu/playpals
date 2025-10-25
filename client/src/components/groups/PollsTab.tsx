import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Calendar, Clock, Users, ArrowLeft, CheckCircle } from 'lucide-react';
import { CreatePollModal } from './CreatePollModal';
import { PollDetails } from './PollDetails';
import { format } from 'date-fns';

interface Poll {
  id: number;
  groupId: number;
  createdBy: number;
  title: string;
  description: string | null;
  minMembers: number;
  duration: number;
  endDate: string;
  isActive: boolean;
  createdAt: string;
  creator: {
    id: number;
    username: string;
    name: string;
    profileImage: string | null;
  };
  responseCount: number;
  timeSlotCount: number;
  canCreateEvent?: boolean;
}

interface PollsTabProps {
  groupId: number;
}

export function PollsTab({ groupId }: PollsTabProps) {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedPoll, setSelectedPoll] = useState<Poll | null>(null);

  const { data, isLoading, error } = useQuery<Poll[]>({
    queryKey: ['sports-groups', groupId, 'polls'],
    queryFn: async () => {
      const response = await fetch(`/api/sports-groups/${groupId}/polls`, {
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error('Failed to fetch polls');
      }
      const result = await response.json();
      const polls = Array.isArray(result) ? result : [];
      
      // Check each poll for event creation availability
      const pollsWithStatus = await Promise.all(
        polls.map(async (poll) => {
          try {
            const analysisResponse = await fetch(`/api/sports-groups/${groupId}/polls/${poll.id}/analysis`, {
              credentials: 'include'
            });
            if (analysisResponse.ok) {
              const analysisData = await analysisResponse.json();
              return {
                ...poll,
                canCreateEvent: analysisData.suggestions && analysisData.suggestions.length > 0
              };
            }
          } catch (error) {
            console.log('Error checking poll analysis:', error);
          }
          return { ...poll, canCreateEvent: false };
        })
      );
      
      return pollsWithStatus;
    },
    retry: 1,
  });

  const polls = data || [];

  // Show poll details if one is selected
  if (selectedPoll) {
    console.log('Rendering poll details for:', selectedPoll);
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            onClick={() => {
              console.log('Back button clicked');
              setSelectedPoll(null);
            }}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Polls
          </Button>
          <h2 className="text-xl font-semibold">{selectedPoll.title}</h2>
        </div>
        <PollDetails poll={selectedPoll} groupId={groupId} />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Unable to load polls</h3>
        <p className="text-gray-600 mb-4">There was an error loading the polls for this group.</p>
        <Button onClick={() => window.location.reload()}>
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Group Polls</h2>
          <p className="text-gray-600 text-sm mt-0.5">Coordinate event scheduling through availability polling</p>
        </div>
        <Button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 shadow-md"
        >
          <Plus className="h-4 w-4" />
          Create Poll
        </Button>
      </div>

      {polls.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Calendar className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No polls yet</h3>
            <p className="text-gray-600 text-center mb-4">
              Create your first poll to coordinate event times with group members
            </p>
            <Button onClick={() => setShowCreateModal(true)}>
              Create First Poll
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {polls.map((poll) => (
            <div
              key={poll.id}
              onClick={() => {
                console.log('Poll clicked:', poll);
                setSelectedPoll(poll);
              }}
              className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md hover:border-gray-300 transition-all duration-200 cursor-pointer"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <h3 className="text-lg font-bold text-gray-900 truncate">{poll.title}</h3>
                    <Badge
                      variant={poll.isActive ? "default" : "secondary"}
                      className={poll.isActive ? "bg-blue-500" : ""}
                    >
                      {poll.isActive ? "Active" : "Closed"}
                    </Badge>
                    {poll.canCreateEvent && (
                      <Badge className="bg-green-600 hover:bg-green-700">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Ready to Create Event
                      </Badge>
                    )}
                  </div>

                  {poll.description && (
                    <p className="text-sm text-gray-600 mb-3 line-clamp-1">{poll.description}</p>
                  )}

                  <div className="flex items-center gap-4 text-xs text-gray-500 flex-wrap">
                    <div className="flex items-center gap-1.5">
                      <Users className="h-3.5 w-3.5" />
                      <span>Min {poll.minMembers} members</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5" />
                      <span>{poll.duration} minutes</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5" />
                      <span>Ends {format(new Date(poll.endDate), 'MMM d, yyyy')}</span>
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
                    <p className="text-xs text-gray-500">
                      <span className="font-semibold text-gray-700">{poll.responseCount}</span> responses • Created by <span className="font-medium">{poll.creator.name}</span>
                    </p>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        console.log('Button clicked for poll:', poll);
                        setSelectedPoll(poll);
                      }}
                      className="text-xs h-8"
                    >
                      View Details
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showCreateModal && (
        <CreatePollModal
          groupId={groupId}
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            queryClient.invalidateQueries({ queryKey: ['sports-groups', groupId, 'polls'] });
          }}
        />
      )}
    </div>
  );
}