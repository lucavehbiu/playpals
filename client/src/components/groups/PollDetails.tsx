import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar, Clock, Users, CheckCircle, Plus, X } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
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
  responseCount: number;
  createdAt: string;
  creator: {
    id: number;
    name: string;
  };
}

interface PollDetailsProps {
  poll: Poll;
  groupId: number;
}

interface TimeSlot {
  id: number;
  pollId: number;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  date?: string;
}

interface PollResponse {
  id: number;
  pollId: number;
  userId: number;
  timeSlotId: number;
  isAvailable: boolean;
  createdAt: string;
}

interface UserResponse {
  timeSlotId: number;
  isAvailable: boolean;
}

const DAYS_OF_WEEK = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export function PollDetails({ poll, groupId }: PollDetailsProps) {
  console.log('PollDetails component rendering with poll:', poll, 'groupId:', groupId);
  const { user } = useAuth();
  const { toast } = useToast();
  const [showAvailabilityForm, setShowAvailabilityForm] = useState(false);
  
  // User-defined availability state
  const [userAvailability, setUserAvailability] = useState<{
    [day: string]: { startTime: string; endTime: string; available: boolean }[]
  }>({});

  // Fetch poll analysis for event suggestions
  const { data: pollAnalysis } = useQuery({
    queryKey: ['sports-groups', groupId, 'polls', poll.id, 'analysis'],
    queryFn: async () => {
      console.log('Fetching poll analysis for poll:', poll.id);
      const response = await fetch(`/api/sports-groups/${groupId}/polls/${poll.id}/analysis`);
      if (!response.ok) {
        console.log('Poll analysis fetch failed:', response.status);
        return null;
      }
      const result = await response.json();
      console.log('Poll analysis result:', result);
      return result;
    },
    enabled: poll.responseCount > 0,
  });

  // Fetch user's existing responses
  const { data: userResponses } = useQuery({
    queryKey: ['sports-groups', groupId, 'polls', poll.id, 'user-responses'],
    queryFn: async () => {
      const response = await fetch(`/api/sports-groups/${groupId}/polls/${poll.id}/user-responses`);
      if (!response.ok) {
        return [];
      }
      return response.json();
    },
    enabled: !!user,
  });

  // Submit responses mutation
  const submitResponsesMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch(`/api/sports-groups/${groupId}/polls/${poll.id}/responses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Failed to submit responses');
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Availability saved",
        description: "Your availability has been recorded successfully.",
      });
      setShowAvailabilityForm(false);
      setUserAvailability({});
      queryClient.invalidateQueries({ queryKey: ['sports-groups', groupId, 'polls'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Helper functions for custom availability
  const addTimeSlot = (dayName: string) => {
    setUserAvailability(prev => ({
      ...prev,
      [dayName]: [
        ...(prev[dayName] || []),
        { startTime: '09:00', endTime: '17:00', available: true }
      ]
    }));
  };

  const updateTimeSlot = (dayName: string, slotIndex: number, field: string, value: any) => {
    setUserAvailability(prev => ({
      ...prev,
      [dayName]: prev[dayName]?.map((slot, index) => 
        index === slotIndex ? { ...slot, [field]: value } : slot
      ) || []
    }));
  };

  const removeTimeSlot = (dayName: string, slotIndex: number) => {
    setUserAvailability(prev => ({
      ...prev,
      [dayName]: prev[dayName]?.filter((_, index) => index !== slotIndex) || []
    }));
  };

  const handleCreateEvent = (suggestion: any) => {
    const timeSlot = suggestion.timeSlot;
    const suggestedDate = suggestion.suggestedDate;
    
    // Calculate end time based on poll duration
    const startTime = timeSlot.startTime;
    const [hours, minutes] = startTime.split(':').map(Number);
    const endTime = new Date();
    endTime.setHours(hours, minutes + poll.duration, 0, 0);
    const endTimeString = endTime.toTimeString().slice(0, 5);

    // Create URL with pre-filled event data
    const eventData = {
      title: `${poll.title} - ${DAYS_OF_WEEK[timeSlot.dayOfWeek]} Event`,
      description: `Event created from group poll: ${poll.title}`,
      date: suggestedDate,
      time: startTime,
      endTime: endTimeString,
      maxParticipants: suggestion.timeSlot.availableCount || poll.minMembers || 2,
      groupId: groupId,
      pollId: poll.id,
      suggestionId: suggestion.timeSlot.id
    };

    // Encode the data for URL parameters
    const params = new URLSearchParams();
    Object.entries(eventData).forEach(([key, value]) => {
      params.append(key, String(value));
    });

    // Navigate to create event page with pre-filled data
    window.location.href = `/events/create?${params.toString()}`;
  };

  const handleSubmitCustomAvailability = () => {
    // Check if user has any availability
    const hasAvailability = Object.values(userAvailability).some(slots => 
      slots.some(slot => slot.available)
    );

    if (!hasAvailability) {
      toast({
        title: "No availability selected",
        description: "Please select at least one time when you're available.",
        variant: "destructive",
      });
      return;
    }

    // Send availability data directly to backend
    submitResponsesMutation.mutate({ availability: userAvailability });
  };

  return (
    <div className="space-y-6 bg-white p-4 rounded-lg border-2 border-blue-500"
         style={{ minHeight: '400px', zIndex: 10, position: 'relative' }}>
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-xl font-semibold">{poll.title}</h3>
              {poll.description && (
                <p className="text-gray-600 mt-1">{poll.description}</p>
              )}
            </div>
            <Badge variant={poll.isActive ? "default" : "secondary"}>
              {poll.isActive ? "Active" : "Ended"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-gray-500" />
              <span className="text-sm text-gray-600">
                Min {poll.minMembers} members
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-gray-500" />
              <span className="text-sm text-gray-600">
                {poll.duration} minutes
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-gray-500" />
              <span className="text-sm text-gray-600">
                Ends {format(new Date(poll.endDate), 'MMM d, yyyy')}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {poll.isActive && user && (
        <Card className={userResponses && userResponses.length > 0 ? "border-green-200 bg-green-50" : ""}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-lg font-semibold flex items-center gap-2">
                  Your Availability
                  {userResponses && userResponses.length > 0 && (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  )}
                </h4>
                <p className="text-gray-600">
                  {userResponses && userResponses.length > 0 
                    ? `Available for ${userResponses.length} time slots` 
                    : "Set your available times"
                  }
                </p>
              </div>
              <Dialog open={showAvailabilityForm} onOpenChange={setShowAvailabilityForm}>
                <DialogTrigger asChild>
                  {userResponses && userResponses.length > 0 ? (
                    <Button variant="outline" size="sm">
                      Update Availability
                    </Button>
                  ) : (
                    <Button size="sm">
                      Set Availability
                    </Button>
                  )}
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Set Your Availability</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    {DAYS_OF_WEEK.map((dayName, dayIndex) => {
                      const dayAvailability = userAvailability[dayName] || [];
                      
                      return (
                        <div key={dayIndex} className="border rounded-lg p-4">
                          <div className="flex items-center justify-between mb-3">
                            <h5 className="font-semibold text-gray-900">{dayName}</h5>
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() => addTimeSlot(dayName)}
                              className="text-xs"
                            >
                              <Plus className="h-3 w-3 mr-1" />
                              Add Time
                            </Button>
                          </div>
                          
                          {dayAvailability.length === 0 ? (
                            <p className="text-sm text-gray-500 italic">Click "Add Time" to set your availability</p>
                          ) : (
                            <div className="space-y-2">
                              {dayAvailability.map((slot, slotIndex) => (
                                <div key={slotIndex} className="flex items-center gap-3 p-3 bg-gray-50 rounded">
                                  <Checkbox
                                    checked={slot.available}
                                    onCheckedChange={(checked) => 
                                      updateTimeSlot(dayName, slotIndex, 'available', checked === true)
                                    }
                                  />
                                  <div className="flex items-center gap-2 flex-1">
                                    <input
                                      type="time"
                                      value={slot.startTime}
                                      onChange={(e) => updateTimeSlot(dayName, slotIndex, 'startTime', e.target.value)}
                                      className="border border-gray-300 rounded px-2 py-1 text-sm"
                                    />
                                    <span className="text-gray-500">to</span>
                                    <input
                                      type="time"
                                      value={slot.endTime}
                                      onChange={(e) => updateTimeSlot(dayName, slotIndex, 'endTime', e.target.value)}
                                      className="border border-gray-300 rounded px-2 py-1 text-sm"
                                    />
                                  </div>
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => removeTimeSlot(dayName, slotIndex)}
                                    className="text-red-500 hover:text-red-700 p-1"
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                    
                    <div className="pt-4 flex gap-3">
                      <Button 
                        onClick={handleSubmitCustomAvailability}
                        disabled={submitResponsesMutation.isPending}
                        className="flex-1"
                      >
                        {submitResponsesMutation.isPending ? (
                          <div className="flex items-center gap-2">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            Saving...
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4" />
                            Save My Availability
                          </div>
                        )}
                      </Button>
                      <Button 
                        onClick={() => setShowAvailabilityForm(false)}
                        variant="outline"
                        disabled={submitResponsesMutation.isPending}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
        </Card>
      )}

      {pollAnalysis && pollAnalysis.suggestions && pollAnalysis.suggestions.length > 0 && (
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
              {pollAnalysis.suggestions.map((suggestion: any, index: number) => (
                <div key={index} className="border rounded-lg p-4 bg-green-50 border-green-200">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h5 className="font-semibold text-green-900">
                        {DAYS_OF_WEEK[suggestion.timeSlot.dayOfWeek]} Event
                      </h5>
                      <p className="text-sm text-green-700">
                        {suggestion.timeSlot.startTime} - {suggestion.timeSlot.endTime}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="bg-green-600 text-white px-2 py-1 rounded text-sm font-medium">
                        {suggestion.timeSlot.availableCount} available
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-green-700">
                    <span>✓ Meets minimum {poll.minMembers} members</span>
                    <span>Duration: {poll.duration} minutes</span>
                  </div>
                  <div className="mt-2">
                    <p className="text-xs text-green-600 mb-1">
                      {suggestion.estimatedParticipants} members available • {suggestion.confidence} confidence
                    </p>
                  </div>
                  {suggestion.timeSlot.isUsedForEvent ? (
                    <div className="mt-3 space-y-2">
                      <Button 
                        size="sm" 
                        className="w-full"
                        disabled
                        variant="secondary"
                      >
                        Event Already Created
                      </Button>
                      <p className="text-xs text-gray-500">
                        This time slot has already been used to create an event
                      </p>
                    </div>
                  ) : (
                    <Button 
                      size="sm" 
                      className="mt-3 bg-green-600 hover:bg-green-700"
                      onClick={() => handleCreateEvent(suggestion)}
                    >
                      Create Event
                    </Button>
                  )}
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