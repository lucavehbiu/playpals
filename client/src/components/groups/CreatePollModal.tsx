import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X, Clock, Users, Calendar } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface CreatePollModalProps {
  groupId: number;
  onClose: () => void;
}

// Generate next 8 weeks
function getUpcomingWeeks() {
  const weeks = [];
  const today = new Date();
  
  for (let i = 0; i < 8; i++) {
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() + (i * 7) - today.getDay()); // Start of week (Sunday)
    
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6); // End of week (Saturday)
    
    const weekNumber = getWeekNumber(weekStart);
    const startMonth = weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const endMonth = weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    
    weeks.push({
      value: `${weekStart.toISOString()}-${weekEnd.toISOString()}`,
      label: `Week ${weekNumber} (${startMonth} - ${endMonth})`,
      startDate: weekStart,
      endDate: weekEnd
    });
  }
  
  return weeks;
}

function getWeekNumber(date: Date) {
  const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
  const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
  return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
}

const DURATION_OPTIONS = [
  { value: 30, label: '30 minutes' },
  { value: 45, label: '45 minutes' },
  { value: 60, label: '1 hour' },
  { value: 90, label: '1.5 hours' },
  { value: 120, label: '2 hours' },
  { value: 150, label: '2.5 hours' },
  { value: 180, label: '3 hours' }
];

const MIN_MEMBERS_OPTIONS = [
  { value: 2, label: '2 people' },
  { value: 3, label: '3 people' },
  { value: 4, label: '4 people' },
  { value: 5, label: '5 people' },
  { value: 6, label: '6 people' },
  { value: 8, label: '8 people' },
  { value: 10, label: '10 people' }
];

export function CreatePollModal({ groupId, onClose }: CreatePollModalProps) {
  const { toast } = useToast();
  const [title, setTitle] = useState('');
  const [minMembers, setMinMembers] = useState('2');
  const [duration, setDuration] = useState('60');
  const [selectedWeek, setSelectedWeek] = useState('');

  const upcomingWeeks = getUpcomingWeeks();

  const createPollMutation = useMutation({
    mutationFn: async (pollData: any) => {
      return apiRequest('POST', `/api/sports-groups/${groupId}/polls`, pollData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/sports-groups', groupId, 'polls'] });
      toast({ title: 'Poll created successfully!' });
      onClose();
    },
    onError: (error: any) => {
      toast({ 
        title: 'Error creating poll', 
        description: error.message || 'Please try again',
        variant: 'destructive'
      });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) {
      toast({ title: 'Please enter a poll title', variant: 'destructive' });
      return;
    }

    if (!selectedWeek) {
      toast({ title: 'Please select a week', variant: 'destructive' });
      return;
    }

    const [startDateStr, endDateStr] = selectedWeek.split('-');
    const weekStart = new Date(startDateStr);
    const weekEnd = new Date(endDateStr);

    // Create time slots for each day of the selected week
    const timeSlots = [];
    for (let i = 0; i < 7; i++) {
      timeSlots.push({
        dayOfWeek: i,
        startTime: '09:00',
        endTime: '21:00'
      });
    }

    createPollMutation.mutate({
      title,
      minMembers: parseInt(minMembers),
      duration: parseInt(duration),
      endDate: weekEnd.toISOString(),
      timeSlots
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-full max-w-lg mx-4">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Create Event Poll</h2>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">Poll Title *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Weekend Tennis Match"
                required
              />
            </div>

            <div className="space-y-2">
              <Label>
                <Users className="w-4 h-4 inline mr-2" />
                Minimum Members Needed *
              </Label>
              <Select value={minMembers} onValueChange={setMinMembers}>
                <SelectTrigger>
                  <SelectValue placeholder="Select minimum members" />
                </SelectTrigger>
                <SelectContent>
                  {MIN_MEMBERS_OPTIONS.map(option => (
                    <SelectItem key={option.value} value={option.value.toString()}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>
                <Clock className="w-4 h-4 inline mr-2" />
                Event Duration *
              </Label>
              <Select value={duration} onValueChange={setDuration}>
                <SelectTrigger>
                  <SelectValue placeholder="Select event duration" />
                </SelectTrigger>
                <SelectContent>
                  {DURATION_OPTIONS.map(option => (
                    <SelectItem key={option.value} value={option.value.toString()}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>
                <Calendar className="w-4 h-4 inline mr-2" />
                Select Week *
              </Label>
              <Select value={selectedWeek} onValueChange={setSelectedWeek}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a week for the event" />
                </SelectTrigger>
                <SelectContent>
                  {upcomingWeeks.map(week => (
                    <SelectItem key={week.value} value={week.value}>
                      {week.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">
                Members will be able to indicate their availability for any time during the selected week. 
                The system will then suggest the best times based on everyone's responses.
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={createPollMutation.isPending}>
                {createPollMutation.isPending ? 'Creating...' : 'Create Poll'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}