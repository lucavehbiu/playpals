import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar, Clock, Users, CheckCircle } from 'lucide-react';
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

interface TimeSlot {
  id: number;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
}

interface TimeSlotResponse {
  id: number;
  timeSlotId: number;
  userId: number;
  isAvailable: boolean;
  user: {
    id: number;
    username: string;
    name: string;
    profileImage: string | null;
  };
}

interface PollDetailsProps {
  poll: Poll;
  groupId: number;
}

const DAYS_OF_WEEK = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export function PollDetails({ poll, groupId }: PollDetailsProps) {
  const { user } = useAuth();
  const [userResponses, setUserResponses] = useState<Record<number, boolean>>({});

  // Fetch poll details with time slots
  const { data: pollDetails, isLoading } = useQuery({
    queryKey: ['sports-groups', groupId, 'polls', poll.id],
    queryFn: async () => {
      const response = await fetch(`/api/sports-groups/${groupId}/polls/${poll.id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch poll details');
      }
      return response.json();
    },
  });

  // Fetch user's responses
  const { data: responses } = useQuery({
    queryKey: ['sports-groups', groupId, 'polls', poll.id, 'user-responses'],
    queryFn: async () => {
      if (!user) return [];
      const response = await fetch(`/api/sports-groups/${groupId}/polls/${poll.id}/user-responses`);
      if (!response.ok) {
        return [];
      }
      return response.json();
    },
    enabled: !!user,
  });

  // Update local state when responses are loaded
  useEffect(() => {
    if (responses && Array.isArray(responses)) {
      const responseMap: Record<number, boolean> = {};
      responses.forEach((response: any) => {
        responseMap[response.timeSlotId] = response.isAvailable;
      });
      setUserResponses(responseMap);
    }
  }, [responses]);

  // Submit availability responses
  const submitResponsesMutation = useMutation({
    mutationFn: async (availabilityData: { timeSlotId: number; isAvailable: boolean }[]) => {
      const response = await fetch(`/api/sports-groups/${groupId}/polls/${poll.id}/responses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          responses: availabilityData.map(item => ({
            timeSlotId: item.timeSlotId,
            response: item.isAvailable ? 'available' : 'unavailable'
          }))
        }),
      });
      if (!response.ok) {
        throw new Error('Failed to submit responses');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sports-groups', groupId, 'polls', poll.id] });
      queryClient.invalidateQueries({ queryKey: ['sports-groups', groupId, 'polls', poll.id, 'user-responses'] });
    },
  });

  const handleAvailabilityChange = (timeSlotId: number, isAvailable: boolean) => {
    setUserResponses(prev => ({
      ...prev,
      [timeSlotId]: isAvailable
    }));
  };

  const handleSubmitResponses = () => {
    const responses = Object.entries(userResponses).map(([timeSlotId, isAvailable]) => ({
      timeSlotId: parseInt(timeSlotId),
      isAvailable
    }));
    submitResponsesMutation.mutate(responses);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const timeSlots = pollDetails?.timeSlots || [];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h3 className="text-xl font-semibold">{poll.title}</h3>
                <Badge variant={poll.isActive ? "default" : "secondary"}>
                  {poll.isActive ? "Active" : "Closed"}
                </Badge>
              </div>
              {poll.description && (
                <p className="text-gray-600 mb-3">{poll.description}</p>
              )}
              <div className="flex items-center gap-4 text-sm text-gray-500">
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
          </div>
        </CardHeader>
      </Card>

      {poll.isActive && user && (
        <Card>
          <CardHeader>
            <h4 className="text-lg font-semibold">Your Availability</h4>
            <p className="text-gray-600">Select the times when you're available for this event</p>
          </CardHeader>
          <CardContent>
            {timeSlots.length === 0 ? (
              <p className="text-center text-gray-500 py-8">
                No time slots available for this poll
              </p>
            ) : (
              <div className="space-y-4">
                {timeSlots.map((slot: TimeSlot) => (
                  <div key={slot.id} className="flex items-center space-x-3 p-3 border rounded-lg">
                    <Checkbox
                      id={`slot-${slot.id}`}
                      checked={userResponses[slot.id] || false}
                      onCheckedChange={(checked) => 
                        handleAvailabilityChange(slot.id, checked === true)
                      }
                    />
                    <label 
                      htmlFor={`slot-${slot.id}`} 
                      className="flex-1 cursor-pointer"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium">
                          {DAYS_OF_WEEK[slot.dayOfWeek]}
                        </span>
                        <span className="text-gray-600">
                          {slot.startTime} - {slot.endTime}
                        </span>
                      </div>
                    </label>
                  </div>
                ))}
                
                <div className="pt-4">
                  <Button 
                    onClick={handleSubmitResponses}
                    disabled={submitResponsesMutation.isPending}
                    className="w-full"
                  >
                    {submitResponsesMutation.isPending ? (
                      <div className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Saving...
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4" />
                        Save Availability
                      </div>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <h4 className="text-lg font-semibold">Poll Summary</h4>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <p className="text-gray-600">
              <span className="font-medium">{poll.responseCount}</span> members have responded
            </p>
            <p className="text-gray-600">
              Created by <span className="font-medium">{poll.creator.name}</span> on {format(new Date(poll.createdAt), 'MMM d, yyyy')}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}