import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, X, Clock, Users, Calendar } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface CreatePollModalProps {
  groupId: number;
  onClose: () => void;
}

interface TimeSlot {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
}

const DAYS_OF_WEEK = [
  { value: 0, label: 'Sunday' },
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' }
];

export function CreatePollModal({ groupId, onClose }: CreatePollModalProps) {
  const { toast } = useToast();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [minMembers, setMinMembers] = useState(2);
  const [duration, setDuration] = useState(60);
  const [endDate, setEndDate] = useState('');
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);

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

  const addTimeSlot = () => {
    setTimeSlots([...timeSlots, { dayOfWeek: 1, startTime: '09:00', endTime: '10:00' }]);
  };

  const removeTimeSlot = (index: number) => {
    setTimeSlots(timeSlots.filter((_, i) => i !== index));
  };

  const updateTimeSlot = (index: number, field: keyof TimeSlot, value: any) => {
    const updated = [...timeSlots];
    updated[index] = { ...updated[index], [field]: value };
    setTimeSlots(updated);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) {
      toast({ title: 'Please enter a poll title', variant: 'destructive' });
      return;
    }

    if (!endDate) {
      toast({ title: 'Please select an end date', variant: 'destructive' });
      return;
    }

    if (timeSlots.length === 0) {
      toast({ title: 'Please add at least one time slot', variant: 'destructive' });
      return;
    }

    createPollMutation.mutate({
      title,
      description,
      minMembers,
      duration,
      endDate: new Date(endDate).toISOString(),
      timeSlots
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
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
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add details about the event..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="minMembers">
                  <Users className="w-4 h-4 inline mr-2" />
                  Minimum Members
                </Label>
                <Input
                  id="minMembers"
                  type="number"
                  min="1"
                  value={minMembers}
                  onChange={(e) => setMinMembers(parseInt(e.target.value))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="duration">
                  <Clock className="w-4 h-4 inline mr-2" />
                  Duration (minutes)
                </Label>
                <Input
                  id="duration"
                  type="number"
                  min="15"
                  step="15"
                  value={duration}
                  onChange={(e) => setDuration(parseInt(e.target.value))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="endDate">
                <Calendar className="w-4 h-4 inline mr-2" />
                Poll End Date *
              </Label>
              <Input
                id="endDate"
                type="datetime-local"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                required
              />
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Available Time Slots *</Label>
                <Button type="button" variant="outline" size="sm" onClick={addTimeSlot}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Time Slot
                </Button>
              </div>

              {timeSlots.length === 0 && (
                <p className="text-sm text-gray-500">
                  Add time slots for members to choose their availability
                </p>
              )}

              {timeSlots.map((slot, index) => (
                <div key={index} className="flex items-center gap-2 p-3 border rounded-lg">
                  <select
                    value={slot.dayOfWeek}
                    onChange={(e) => updateTimeSlot(index, 'dayOfWeek', parseInt(e.target.value))}
                    className="px-3 py-2 border rounded"
                  >
                    {DAYS_OF_WEEK.map(day => (
                      <option key={day.value} value={day.value}>
                        {day.label}
                      </option>
                    ))}
                  </select>

                  <Input
                    type="time"
                    value={slot.startTime}
                    onChange={(e) => updateTimeSlot(index, 'startTime', e.target.value)}
                    className="w-24"
                  />

                  <span className="text-sm text-gray-500">to</span>

                  <Input
                    type="time"
                    value={slot.endTime}
                    onChange={(e) => updateTimeSlot(index, 'endTime', e.target.value)}
                    className="w-24"
                  />

                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeTimeSlot(index)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ))}
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