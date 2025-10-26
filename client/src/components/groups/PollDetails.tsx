import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar, Clock, Users, CheckCircle, Plus, X, Trash2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
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

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

// Convert database day index (Sunday=0) to display day index (Monday=0)
const convertDbDayToDisplayDay = (dbDay: number): number => {
  // Database: Sunday=0, Monday=1, Tuesday=2, ..., Saturday=6
  // Display:  Monday=0, Tuesday=1, Wednesday=2, ..., Sunday=6
  return dbDay === 0 ? 6 : dbDay - 1;
};

// Convert display day index (Monday=0) to database day index (Sunday=0)
const convertDisplayDayToDbDay = (displayDay: number): number => {
  // Display:  Monday=0, Tuesday=1, Wednesday=2, ..., Sunday=6
  // Database: Sunday=0, Monday=1, Tuesday=2, ..., Saturday=6
  return displayDay === 6 ? 0 : displayDay + 1;
};

// Helper function to get dates for the poll's selected week
const getPollWeekDates = (pollEndDate: string) => {
  // The poll stores the END date of the selected week
  const weekEnd = new Date(pollEndDate);

  // Find the Monday of the week containing the end date
  const endDayOfWeek = weekEnd.getDay(); // 0 = Sunday, 1 = Monday, etc.
  const daysFromMonday = endDayOfWeek === 0 ? 6 : endDayOfWeek - 1; // Convert Sunday=0 to be 6 days from Monday

  const mondayOfWeek = new Date(weekEnd);
  mondayOfWeek.setDate(weekEnd.getDate() - daysFromMonday);

  return DAYS_OF_WEEK.map((dayName, dayIndex) => {
    const targetDate = new Date(mondayOfWeek);
    targetDate.setDate(mondayOfWeek.getDate() + dayIndex);

    return {
      dayName,
      date: targetDate,
      dateString: format(targetDate, 'MMM d'),
    };
  });
};

export function PollDetails({ poll, groupId }: PollDetailsProps) {
  console.log('PollDetails component rendering with poll:', poll, 'groupId:', groupId);
  const { user } = useAuth();
  const { toast } = useToast();
  const [showAvailabilityForm, setShowAvailabilityForm] = useState(false);

  // Get the poll's selected week dates
  const weekDates = getPollWeekDates(poll.endDate);

  // Check if poll has expired
  const isExpired = new Date() > new Date(poll.endDate);
  const pollIsActive = poll.isActive && !isExpired;

  // User-defined availability state
  const [userAvailability, setUserAvailability] = useState<{
    [day: string]: { startTime: string; endTime: string; available: boolean }[];
  }>({});

  // Fetch poll analysis for event suggestions
  const { data: pollAnalysis } = useQuery({
    queryKey: ['sports-groups', groupId, 'polls', poll.id, 'analysis'],
    queryFn: async () => {
      console.log('Fetching poll analysis for poll:', poll.id);
      const response = await fetch(`/api/sports-groups/${groupId}/polls/${poll.id}/analysis`, {
        credentials: 'include',
      });
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
    queryKey: ['sports-groups', groupId, 'polls', poll.id, 'user-responses', user?.id],
    queryFn: async () => {
      const response = await fetch(
        `/api/sports-groups/${groupId}/polls/${poll.id}/user-responses`,
        {
          credentials: 'include',
        }
      );
      if (!response.ok) {
        console.log('Failed to fetch user responses:', response.status);
        return [];
      }
      const data = await response.json();
      console.log(
        'User responses received for poll',
        poll.id,
        'authenticated user ID:',
        user?.id,
        ':',
        data
      );
      console.log('User responses array length:', data?.length);
      return data;
    },
    enabled: !!user,
  });

  // Fetch time slots to map responses back to availability format
  const { data: timeSlots } = useQuery({
    queryKey: ['sports-groups', groupId, 'polls', poll.id, 'time-slots'],
    queryFn: async () => {
      const response = await fetch(`/api/sports-groups/${groupId}/polls/${poll.id}/time-slots`, {
        credentials: 'include',
      });
      if (!response.ok) {
        console.log('Failed to fetch time slots:', response.status);
        return [];
      }
      return response.json();
    },
    enabled: !!user,
  });

  // Load existing user responses into availability form when data changes
  useEffect(() => {
    if (
      userResponses &&
      userResponses.length > 0 &&
      timeSlots &&
      timeSlots.length > 0 &&
      showAvailabilityForm
    ) {
      console.log('Loading existing responses into form:', userResponses);
      console.log('Available time slots:', timeSlots);

      // Convert userResponses back to userAvailability format
      const newAvailability: {
        [day: string]: { startTime: string; endTime: string; available: boolean }[];
      } = {};

      // Group responses by day
      userResponses.forEach((response: any) => {
        const timeSlot = timeSlots.find((slot: any) => slot.id === response.timeSlotId);
        if (timeSlot) {
          const dayName = DAYS_OF_WEEK[convertDbDayToDisplayDay(timeSlot.dayOfWeek)];
          if (!newAvailability[dayName]) {
            newAvailability[dayName] = [];
          }

          newAvailability[dayName].push({
            startTime: timeSlot.startTime,
            endTime: timeSlot.endTime,
            available: response.isAvailable,
          });
        }
      });

      console.log('Converted availability for form:', newAvailability);
      setUserAvailability(newAvailability);
    } else if (showAvailabilityForm && (!userResponses || userResponses.length === 0)) {
      // Clear form if no existing responses
      setUserAvailability({});
    }
  }, [userResponses, timeSlots, showAvailabilityForm]);

  // Submit responses mutation
  const submitResponsesMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch(`/api/sports-groups/${groupId}/polls/${poll.id}/responses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Failed to submit responses');
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Availability saved',
        description: 'Your availability has been recorded successfully.',
      });
      setShowAvailabilityForm(false);
      setUserAvailability({});
      queryClient.invalidateQueries({ queryKey: ['sports-groups', groupId, 'polls'] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Delete poll mutation
  const deletePollMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/sports-groups/${groupId}/polls/${poll.id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to delete poll');
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Poll deleted',
        description: 'The poll has been deleted successfully.',
      });
      // Navigate back or refresh the parent component
      queryClient.invalidateQueries({ queryKey: ['sports-groups', groupId, 'polls'] });
      // You might want to navigate away from the poll details here
      window.history.back();
    },
    onError: (error: Error) => {
      toast({
        title: 'Error deleting poll',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleDeletePoll = () => {
    deletePollMutation.mutate();
  };

  // Helper functions for custom availability
  const addTimeSlot = (dayName: string) => {
    setUserAvailability((prev) => ({
      ...prev,
      [dayName]: [
        ...(prev[dayName] || []),
        { startTime: '09:00', endTime: '17:00', available: true },
      ],
    }));
  };

  const updateTimeSlot = (dayName: string, slotIndex: number, field: string, value: any) => {
    setUserAvailability((prev) => ({
      ...prev,
      [dayName]:
        prev[dayName]?.map((slot, index) =>
          index === slotIndex ? { ...slot, [field]: value } : slot
        ) || [],
    }));
  };

  const removeTimeSlot = (dayName: string, slotIndex: number) => {
    setUserAvailability((prev) => ({
      ...prev,
      [dayName]: prev[dayName]?.filter((_, index) => index !== slotIndex) || [],
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
      title: `${poll.title} - ${DAYS_OF_WEEK[convertDbDayToDisplayDay(timeSlot.dayOfWeek)]} Event`,
      description: `Event created from group poll: ${poll.title}`,
      date: suggestedDate,
      time: startTime,
      endTime: endTimeString,
      maxParticipants: suggestion.timeSlot.availableCount || poll.minMembers || 2,
      groupId: groupId,
      pollId: poll.id,
      suggestionId: suggestion.timeSlot.id,
    };

    // Encode the data for URL parameters
    const params = new URLSearchParams();
    Object.entries(eventData).forEach(([key, value]) => {
      params.append(key, String(value));
    });

    // Navigate to create event page with pre-filled data
    // TODO: Open CreateEventModal with params instead of direct navigation
    console.log('Create event from poll suggestion - params:', params.toString());
    window.location.href = `/events/create?${params.toString()}`;
  };

  const handleSubmitCustomAvailability = () => {
    // Check if user has any availability
    const hasAvailability = Object.values(userAvailability).some((slots) =>
      slots.some((slot) => slot.available)
    );

    if (!hasAvailability) {
      toast({
        title: 'No availability selected',
        description: "Please select at least one time when you're available.",
        variant: 'destructive',
      });
      return;
    }

    // Send availability data directly to backend
    submitResponsesMutation.mutate({ availability: userAvailability });
  };

  return (
    <div className="space-y-4">
      {/* Poll Header */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <h3 className="text-xl font-bold text-gray-900 mb-1">{poll.title}</h3>
            {poll.description && <p className="text-sm text-gray-600">{poll.description}</p>}
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Badge
              variant={pollIsActive ? 'default' : 'secondary'}
              className={pollIsActive ? 'bg-blue-500' : ''}
            >
              {pollIsActive ? 'Active' : 'Expired'}
            </Badge>
            {user && user.id === poll.createdBy && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    disabled={deletePollMutation.isPending}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Poll</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete this poll? This action cannot be undone and
                      will remove all responses from group members.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDeletePoll}
                      className="bg-red-600 hover:bg-red-700"
                      disabled={deletePollMutation.isPending}
                    >
                      {deletePollMutation.isPending ? 'Deleting...' : 'Delete Poll'}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </div>

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
      </div>

      {pollIsActive && user && (
        <div
          className={`bg-white border rounded-lg p-4 ${userResponses && userResponses.length > 0 ? 'border-green-300 bg-green-50' : 'border-gray-200'}`}
        >
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                Your Availability
                {userResponses && userResponses.length > 0 && (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                )}
              </h4>
              <p className="text-sm text-gray-600 mt-0.5">
                {userResponses && userResponses.length > 0
                  ? `Set your available times`
                  : 'Set your available times'}
              </p>
            </div>
            <Dialog open={showAvailabilityForm} onOpenChange={setShowAvailabilityForm}>
              <DialogTrigger asChild>
                {(() => {
                  const hasResponses = userResponses && userResponses.length > 0;
                  console.log(
                    'Button decision - user:',
                    user?.name,
                    'hasResponses:',
                    hasResponses,
                    'userResponses:',
                    userResponses
                  );
                  return (
                    <Button
                      size="sm"
                      className={
                        hasResponses
                          ? 'bg-gradient-to-r from-primary to-secondary'
                          : 'bg-gradient-to-r from-primary to-secondary'
                      }
                    >
                      {hasResponses ? 'Set Availability' : 'Set Availability'}
                    </Button>
                  );
                })()}
              </DialogTrigger>
              <DialogContent className="w-[95vw] max-w-md max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="text-lg">Set Your Availability</DialogTitle>
                </DialogHeader>
                <div className="space-y-3">
                  {weekDates.map((dayInfo, dayIndex) => {
                    const dayAvailability = userAvailability[dayInfo.dayName] || [];

                    return (
                      <div key={dayIndex} className="border rounded-lg p-3">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <h5 className="font-semibold text-gray-900 text-sm">
                              {dayInfo.dayName}
                            </h5>
                            <p className="text-xs text-gray-500">{dayInfo.dateString}</p>
                          </div>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => addTimeSlot(dayInfo.dayName)}
                            className="text-xs h-7 px-2"
                          >
                            <Plus className="h-3 w-3 mr-1" />
                            Add
                          </Button>
                        </div>

                        {dayAvailability.length === 0 ? (
                          <p className="text-xs text-gray-500 italic">
                            Click "Add" to set availability
                          </p>
                        ) : (
                          <div className="space-y-2">
                            {dayAvailability.map((slot, slotIndex) => (
                              <div key={slotIndex} className="space-y-2 p-2 bg-gray-50 rounded">
                                <div className="flex items-center gap-2">
                                  <Checkbox
                                    checked={slot.available}
                                    onCheckedChange={(checked) =>
                                      updateTimeSlot(
                                        dayInfo.dayName,
                                        slotIndex,
                                        'available',
                                        checked === true
                                      )
                                    }
                                  />
                                  <span className="text-xs text-gray-600">Available</span>
                                  <div className="ml-auto">
                                    <Button
                                      type="button"
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => removeTimeSlot(dayInfo.dayName, slotIndex)}
                                      className="text-red-500 hover:text-red-700 h-6 w-6 p-0"
                                    >
                                      <X className="h-3 w-3" />
                                    </Button>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <input
                                    type="time"
                                    value={slot.startTime}
                                    onChange={(e) =>
                                      updateTimeSlot(
                                        dayInfo.dayName,
                                        slotIndex,
                                        'startTime',
                                        e.target.value
                                      )
                                    }
                                    className="border border-gray-300 rounded px-2 py-1 text-xs flex-1"
                                  />
                                  <span className="text-xs text-gray-500">to</span>
                                  <input
                                    type="time"
                                    value={slot.endTime}
                                    onChange={(e) =>
                                      updateTimeSlot(
                                        dayInfo.dayName,
                                        slotIndex,
                                        'endTime',
                                        e.target.value
                                      )
                                    }
                                    className="border border-gray-300 rounded px-2 py-1 text-xs flex-1"
                                  />
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}

                  <div className="pt-3 flex flex-col gap-2">
                    <Button
                      onClick={handleSubmitCustomAvailability}
                      disabled={submitResponsesMutation.isPending}
                      className="w-full text-sm"
                      size="sm"
                    >
                      {submitResponsesMutation.isPending ? (
                        <div className="flex items-center gap-2">
                          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                          Saving...
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-3 w-3" />
                          Save My Availability
                        </div>
                      )}
                    </Button>
                    <Button
                      onClick={() => setShowAvailabilityForm(false)}
                      variant="outline"
                      disabled={submitResponsesMutation.isPending}
                      className="w-full text-sm"
                      size="sm"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      )}

      {pollAnalysis?.suggestions?.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h4 className="text-lg font-bold text-gray-900 flex items-center gap-2 mb-3">
            <CheckCircle className="h-5 w-5 text-green-600" />
            Suggested Events
          </h4>
          <p className="text-sm text-gray-600 mb-4">
            Times when enough members are available to create events
          </p>
          <div className="space-y-3">
            {pollAnalysis.suggestions.map((suggestion: any, index: number) => (
              <div key={index} className="border rounded-lg p-3 bg-green-50 border-green-200">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h5 className="font-bold text-green-900">
                      {DAYS_OF_WEEK[suggestion.timeSlot.dayOfWeek]} Event
                    </h5>
                    <p className="text-sm text-green-700">
                      {suggestion.timeSlot.startTime} - {suggestion.timeSlot.endTime}
                    </p>
                  </div>
                  <Badge className="bg-green-600 hover:bg-green-700">
                    {suggestion.estimatedParticipants || suggestion.timeSlot.availableCount}{' '}
                    available
                  </Badge>
                </div>
                <div className="flex items-center gap-3 text-xs text-green-700 mb-3">
                  <span>✓ Meets minimum {poll.minMembers} members</span>
                  <span>Duration: {poll.duration} minutes</span>
                </div>
                <div className="text-xs text-green-600 mb-3">
                  {suggestion.estimatedParticipants} members available • {suggestion.confidence}{' '}
                  confidence
                </div>
                {suggestion.timeSlot.isUsedForEvent ? (
                  <Button size="sm" className="w-full" disabled variant="secondary">
                    Event Already Created
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    className="w-full bg-green-600 hover:bg-green-700"
                    onClick={() => handleCreateEvent(suggestion)}
                  >
                    Create Event
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <h4 className="text-lg font-bold text-gray-900 mb-3">Poll Summary</h4>
        <div className="space-y-2 text-sm text-gray-600">
          <p>
            <span className="font-semibold text-gray-900">{poll.responseCount}</span> members have
            responded
          </p>
          <p>
            Created by <span className="font-medium text-gray-900">{poll.creator.name}</span> on{' '}
            {format(new Date(poll.createdAt), 'MMM d, yyyy')}
          </p>
          <p>
            Minimum <span className="font-medium text-gray-900">{poll.minMembers}</span> members
            needed to create events
          </p>
        </div>
      </div>
    </div>
  );
}
