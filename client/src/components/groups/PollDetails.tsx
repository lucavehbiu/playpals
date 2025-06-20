import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Calendar, Clock, Users, CheckCircle, AlertCircle, TrendingUp } from 'lucide-react';
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

interface PollAnalysis {
  bestTimeSlots: Array<{
    timeSlot: {
      id: number;
      dayOfWeek: number;
      startTime: string;
      endTime: string;
    };
    availableCount: number;
    availableUsers: Array<{
      id: number;
      username: string;
      name: string;
      profileImage: string | null;
    }>;
    canScheduleEvent: boolean;
  }>;
  responseRate: number;
  totalMembers: number;
}

interface PollDetailsProps {
  poll: Poll;
  groupId: number;
  onBack: () => void;
}

const DAYS_OF_WEEK = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export function PollDetails({ poll, groupId, onBack }: PollDetailsProps) {
  const { user } = useAuth();
  const [userResponses, setUserResponses] = useState<{ [key: number]: boolean }>({});

  const { data: responses = [] } = useQuery<TimeSlotResponse[]>({
    queryKey: ['sports-groups', groupId, 'polls', poll.id, 'responses'],
    queryFn: async () => {
      const response = await fetch(`/api/sports-groups/${groupId}/polls/${poll.id}/responses`);
      if (!response.ok) {
        throw new Error('Failed to fetch poll responses');
      }
      return response.json();
    },
  });

  const { data: userPollResponses = [] } = useQuery<TimeSlotResponse[]>({
    queryKey: ['sports-groups', groupId, 'polls', poll.id, 'user-responses'],
    queryFn: async () => {
      if (!user) return [];
      const response = await fetch(`/api/sports-groups/${groupId}/polls/${poll.id}/user-responses`);
      if (!response.ok) {
        throw new Error('Failed to fetch user responses');
      }
      return response.json();
    },
    enabled: !!user,
  });

  const { data: analysis } = useQuery<PollAnalysis>({
    queryKey: ['sports-groups', groupId, 'polls', poll.id, 'analysis'],
    queryFn: async () => {
      const response = await fetch(`/api/sports-groups/${groupId}/polls/${poll.id}/analysis`);
      if (!response.ok) {
        throw new Error('Failed to fetch poll analysis');
      }
      return response.json();
    },
  });

  const submitResponsesMutation = useMutation({
    mutationFn: async (responseData: Array<{ timeSlotId: number; isAvailable: boolean }>) => {
      const response = await fetch(`/api/sports-groups/${groupId}/polls/${poll.id}/responses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ responses: responseData }),
      });
      if (!response.ok) {
        throw new Error('Failed to submit responses');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sports-groups', groupId, 'polls', poll.id] });
      queryClient.invalidateQueries({ queryKey: ['sports-groups', groupId, 'polls'] });
    },
  });

  // Initialize user responses from existing data
  useEffect(() => {
    const initialResponses: { [key: number]: boolean } = {};
    userPollResponses.forEach(response => {
      initialResponses[response.timeSlotId] = response.isAvailable;
    });
    setUserResponses(initialResponses);
  }, [userPollResponses]);

  const handleResponseChange = (timeSlotId: number, isAvailable: boolean) => {
    setUserResponses(prev => ({
      ...prev,
      [timeSlotId]: isAvailable
    }));
  };

  const handleSubmitResponses = () => {
    const responseData = poll.timeSlots.map(slot => ({
      timeSlotId: slot.id,
      isAvailable: userResponses[slot.id] || false
    }));

    submitResponsesMutation.mutate(responseData);
  };

  const hasUserResponded = userPollResponses.length > 0;
  const hasChanges = poll.timeSlots.some(slot => {
    const currentResponse = userResponses[slot.id] || false;
    const existingResponse = userPollResponses.find(r => r.timeSlotId === slot.id);
    return currentResponse !== (existingResponse?.isAvailable || false);
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">{poll.title}</h1>
            <Badge variant={poll.isActive ? "default" : "secondary"}>
              {poll.isActive ? "Active" : "Closed"}
            </Badge>
          </div>
          {poll.description && (
            <p className="text-gray-600 mt-1">{poll.description}</p>
          )}
        </div>
      </div>

      {/* Poll Info */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <Users className="h-5 w-5 mx-auto text-blue-600 mb-2" />
              <div className="text-sm text-gray-600">Min Members</div>
              <div className="font-semibold">{poll.minMembers}</div>
            </div>
            <div>
              <Clock className="h-5 w-5 mx-auto text-green-600 mb-2" />
              <div className="text-sm text-gray-600">Duration</div>
              <div className="font-semibold">{poll.duration} min</div>
            </div>
            <div>
              <Calendar className="h-5 w-5 mx-auto text-purple-600 mb-2" />
              <div className="text-sm text-gray-600">Ends</div>
              <div className="font-semibold">{format(new Date(poll.endDate), 'MMM d')}</div>
            </div>
            <div>
              <TrendingUp className="h-5 w-5 mx-auto text-orange-600 mb-2" />
              <div className="text-sm text-gray-600">Responses</div>
              <div className="font-semibold">{poll.responseCount}/{poll.totalResponses}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* User Response Form */}
      {user && poll.isActive && (
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">Your Availability</h3>
            <p className="text-gray-600">Select all time slots when you're available</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3">
              {poll.timeSlots.map((slot) => (
                <div key={slot.id} className="flex items-center space-x-3 p-3 border rounded-lg">
                  <Checkbox
                    id={`slot-${slot.id}`}
                    checked={userResponses[slot.id] || false}
                    onCheckedChange={(checked) => handleResponseChange(slot.id, !!checked)}
                  />
                  <label htmlFor={`slot-${slot.id}`} className="flex-1 cursor-pointer">
                    <div className="font-medium">
                      {DAYS_OF_WEEK[slot.dayOfWeek]} {slot.startTime} - {slot.endTime}
                    </div>
                  </label>
                </div>
              ))}
            </div>

            {(hasChanges || !hasUserResponded) && (
              <div className="flex justify-end pt-4 border-t">
                <Button 
                  onClick={handleSubmitResponses}
                  disabled={submitResponsesMutation.isPending}
                  className="min-w-[120px]"
                >
                  {submitResponsesMutation.isPending 
                    ? 'Submitting...' 
                    : hasUserResponded 
                      ? 'Update Response' 
                      : 'Submit Response'
                  }
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Analysis Results */}
      {analysis && (
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">Scheduling Analysis</h3>
            <p className="text-gray-600">
              Response rate: {Math.round(analysis.responseRate)}% ({poll.responseCount} of {analysis.totalMembers} members)
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analysis.bestTimeSlots.map((result, index) => (
                <div key={result.timeSlot.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <Badge variant="outline">
                        {DAYS_OF_WEEK[result.timeSlot.dayOfWeek]} {result.timeSlot.startTime}-{result.timeSlot.endTime}
                      </Badge>
                      {result.canScheduleEvent ? (
                        <div className="flex items-center gap-1 text-green-600">
                          <CheckCircle className="h-4 w-4" />
                          <span className="text-sm font-medium">Ready to schedule!</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 text-yellow-600">
                          <AlertCircle className="h-4 w-4" />
                          <span className="text-sm">Need {poll.minMembers - result.availableCount} more</span>
                        </div>
                      )}
                    </div>
                    <div className="text-sm text-gray-600">
                      {result.availableCount} available
                    </div>
                  </div>

                  {result.availableUsers.length > 0 && (
                    <div>
                      <div className="text-sm font-medium text-gray-700 mb-2">Available members:</div>
                      <div className="flex flex-wrap gap-2">
                        {result.availableUsers.map((member) => (
                          <div key={member.id} className="flex items-center gap-2 bg-gray-50 rounded-full px-3 py-1">
                            <Avatar className="h-5 w-5">
                              <AvatarImage src={member.profileImage || undefined} />
                              <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <span className="text-xs">{member.name}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {analysis.bestTimeSlots.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No responses yet. Encourage group members to share their availability!
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* All Responses */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">All Responses</h3>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {poll.timeSlots.map((slot) => {
              const slotResponses = responses.filter(r => r.timeSlotId === slot.id && r.isAvailable);
              return (
                <div key={slot.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-center mb-2">
                    <Badge variant="outline">
                      {DAYS_OF_WEEK[slot.dayOfWeek]} {slot.startTime}-{slot.endTime}
                    </Badge>
                    <span className="text-sm text-gray-600">
                      {slotResponses.length} available
                    </span>
                  </div>
                  
                  {slotResponses.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {slotResponses.map((response) => (
                        <div key={response.id} className="flex items-center gap-2 bg-green-50 rounded-full px-3 py-1 border border-green-200">
                          <Avatar className="h-5 w-5">
                            <AvatarImage src={response.user.profileImage || undefined} />
                            <AvatarFallback>{response.user.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <span className="text-xs text-green-800">{response.user.name}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-sm text-gray-500">No one available for this slot yet</div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}