import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Calendar, Clock, Users, ArrowLeft } from 'lucide-react';
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
      return Array.isArray(result) ? result : [];
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
          <h2 className="text-xl font-semibold">Group Polls</h2>
          <p className="text-gray-600 text-sm">Coordinate event scheduling through availability polling</p>
        </div>
        <Button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2"
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
        <div className="grid gap-4">
          {polls.map((poll) => (
            <Card 
              key={poll.id} 
              className="hover:shadow-lg hover:border-blue-300 transition-all duration-200 cursor-pointer border-2 border-transparent"
              onClick={() => {
                console.log('Poll clicked:', poll);
                setSelectedPoll(poll);
              }}
            >
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-semibold">{poll.title}</h3>
                      <Badge variant={poll.isActive ? "default" : "secondary"}>
                        {poll.isActive ? "Active" : "Closed"}
                      </Badge>
                    </div>
                    {poll.description && (
                      <p className="text-gray-600 mt-1">{poll.description}</p>
                    )}
                    <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        Min {poll.minMembers} members
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {poll.duration} minutes
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        Ends {format(new Date(poll.endDate), 'MMM d, yyyy')}
                      </div>
                    </div>
                    <div className="mt-3">
                      <p className="text-sm text-gray-500">
                        {poll.responseCount} responses • Created by {poll.creator.name}
                      </p>
                      <Button 
                        className="mt-2" 
                        size="sm" 
                        onClick={(e) => {
                          e.stopPropagation();
                          console.log('Button clicked for poll:', poll);
                          setSelectedPoll(poll);
                        }}
                      >
                        View Details
                      </Button>
                    </div>
                  </div>
                </div>
              </CardHeader>
            </Card>
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