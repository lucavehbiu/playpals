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

  // Fetch poll analysis for event suggestions
  const { data: pollAnalysis } = useQuery({
    queryKey: ['sports-groups', groupId, 'polls', poll.id, 'analysis'],
    queryFn: async () => {
      const response = await fetch(`/api/sports-groups/${groupId}/polls/${poll.id}/analysis`);
      if (!response.ok) {
        return null;
      }
      return response.json();
    },
    enabled: !!pollDetails && poll.responseCount > 0,
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
  
  // Generate time slots if none exist (for the current week)
  const generateTimeSlots = () => {
    const slots = [];
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay()); // Start of current week (Sunday)
    
    for (let day = 0; day < 7; day++) {
      const currentDate = new Date(startOfWeek);
      currentDate.setDate(startOfWeek.getDate() + day);
      
      // Morning slot
      slots.push({
        id: day * 3 + 1,
        dayOfWeek: day,
        startTime: '09:00',
        endTime: '12:00',
        date: currentDate.toISOString().split('T')[0]
      });
      
      // Afternoon slot  
      slots.push({
        id: day * 3 + 2,
        dayOfWeek: day,
        startTime: '14:00',
        endTime: '17:00',
        date: currentDate.toISOString().split('T')[0]
      });
      
      // Evening slot
      slots.push({
        id: day * 3 + 3,
        dayOfWeek: day,
        startTime: '18:00',
        endTime: '21:00',
        date: currentDate.toISOString().split('T')[0]
      });
    }
    return slots;
  };

  const displayTimeSlots = timeSlots.length > 0 ? timeSlots : generateTimeSlots();

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
            <div className="space-y-4">
              <div className="grid gap-3">
                {DAYS_OF_WEEK.map((dayName, dayIndex) => {
                  const daySlots = displayTimeSlots.filter(slot => slot.dayOfWeek === dayIndex);
                  if (daySlots.length === 0) return null;
                  
                  return (
                    <div key={dayIndex} className="border rounded-lg p-4">
                      <h5 className="font-semibold text-gray-900 mb-3">{dayName}</h5>
                      <div className="grid gap-2">
                        {daySlots.map((slot: any) => (
                          <div key={slot.id} className="flex items-center space-x-3 p-2 border rounded">
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
                                <span className="text-sm">
                                  {slot.startTime} - {slot.endTime}
                                </span>
                                <span className="text-xs text-gray-500">
                                  {slot.date || 'This week'}
                                </span>
                              </div>
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
                
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
          </CardContent>
        </Card>
      )}

      {pollAnalysis && pollAnalysis.suggestedEvents && pollAnalysis.suggestedEvents.length > 0 && (
        <Card>
          <CardHeader>
            <h4 className="text-lg font-semibold flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Suggested Events
            </h4>
            <p className="text-gray-600">Times when enough members are available to create events</p>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pollAnalysis.suggestedEvents.map((suggestion: any, index: number) => (
                <div key={index} className="border rounded-lg p-4 bg-green-50 border-green-200">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h5 className="font-semibold text-green-900">
                        {DAYS_OF_WEEK[suggestion.dayOfWeek]} Event
                      </h5>
                      <p className="text-sm text-green-700">
                        {suggestion.startTime} - {suggestion.endTime}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="bg-green-600 text-white px-2 py-1 rounded text-sm font-medium">
                        {suggestion.availableCount} available
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-green-700">
                    <span>✓ Meets minimum {poll.minMembers} members</span>
                    <span>Duration: {poll.duration} minutes</span>
                  </div>
                  {suggestion.availableMembers && (
                    <div className="mt-2">
                      <p className="text-xs text-green-600 mb-1">Available members:</p>
                      <div className="flex flex-wrap gap-1">
                        {suggestion.availableMembers.map((member: any) => (
                          <span key={member.id} className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">
                            {member.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  <Button 
                    size="sm" 
                    className="mt-3 bg-green-600 hover:bg-green-700"
                    onClick={() => {
                      // TODO: Create event from this suggestion
                      console.log('Create event for:', suggestion);
                    }}
                  >
                    Create Event
                  </Button>
                </div>
              ))}
            </div>
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
            <p className="text-gray-600">
              Minimum <span className="font-medium">{poll.minMembers}</span> members needed to create events
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}