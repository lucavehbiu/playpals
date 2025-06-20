import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Calendar, Clock, Users, CheckCircle, AlertCircle } from 'lucide-react';
import { CreatePollModal } from './CreatePollModal';
import { format } from 'date-fns';

interface Poll {
  id: number;
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
  timeSlots: Array<{
    id: number;
    dayOfWeek: number;
    startTime: string;
    endTime: string;
  }>;
  responseCount: number;
  totalResponses: number;
}

interface PollsTabProps {
  groupId: number;
}

const DAYS_OF_WEEK = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export function PollsTab({ groupId }: PollsTabProps) {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedPoll, setSelectedPoll] = useState<Poll | null>(null);

  const { data: polls = [], isLoading, error } = useQuery<Poll[]>({
    queryKey: ['sports-groups', groupId, 'polls'],
    queryFn: async () => {
      const response = await fetch(`/api/sports-groups/${groupId}/polls`);
      if (!response.ok) {
        throw new Error('Failed to fetch polls');
      }
      const data = await response.json();
      return Array.isArray(data) ? data : [];
    },
    retry: 1,
  });

  const deletePollMutation = useMutation({
    mutationFn: async (pollId: number) => {
      const response = await fetch(`/api/sports-groups/${groupId}/polls/${pollId}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error('Failed to delete poll');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sports-groups', groupId, 'polls'] });
    },
  });

  const togglePollStatusMutation = useMutation({
    mutationFn: async ({ pollId, isActive }: { pollId: number; isActive: boolean }) => {
      const response = await fetch(`/api/sports-groups/${groupId}/polls/${pollId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive }),
      });
      if (!response.ok) {
        throw new Error('Failed to update poll');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sports-groups', groupId, 'polls'] });
    },
  });

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

  if (selectedPoll) {
    return (
      <div className="space-y-4">
        <Button
          variant="ghost"
          onClick={() => setSelectedPoll(null)}
          className="flex items-center gap-2"
        >
          ← Back to Polls
        </Button>
        <Card>
          <CardContent className="pt-6">
            <h2 className="text-xl font-bold mb-2">{selectedPoll.title}</h2>
            <p className="text-gray-600">Poll details coming soon...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Event Coordination Polls</h2>
          <p className="text-gray-600 mt-1">
            Create polls to find the best times for group events
          </p>
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
            <Card key={poll.id} className="hover:shadow-md transition-shadow">
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
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedPoll(poll)}
                    >
                      View Details
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <h4 className="font-medium mb-2">Available Time Slots:</h4>
                    <div className="flex flex-wrap gap-2">
                      {poll.timeSlots.map((slot) => (
                        <Badge key={slot.id} variant="outline">
                          {DAYS_OF_WEEK[slot.dayOfWeek]} {slot.startTime}-{slot.endTime}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between pt-3 border-t">
                    <div className="flex items-center gap-2">
                      {poll.responseCount >= poll.minMembers ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-yellow-600" />
                      )}
                      <span className="text-sm text-gray-600">
                        {poll.responseCount} of {poll.totalResponses} responses
                        {poll.responseCount >= poll.minMembers && " (Ready to schedule!)"}
                      </span>
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => setSelectedPoll(poll)}
                    >
                      View Details
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {showCreateModal && (
        <CreatePollModal
          groupId={groupId}
          onClose={() => setShowCreateModal(false)}
        />
      )}
    </div>
  );
}