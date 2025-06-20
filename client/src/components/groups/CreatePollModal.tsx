import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Plus, X, Clock, Users } from 'lucide-react';
import { format, addDays } from 'date-fns';

interface TimeSlot {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
}

interface CreatePollModalProps {
  groupId: number;
  onClose: () => void;
}

const DAYS_OF_WEEK = [
  'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'
];

const TIME_OPTIONS = Array.from({ length: 24 * 2 }, (_, i) => {
  const hour = Math.floor(i / 2);
  const minute = i % 2 === 0 ? '00' : '30';
  return `${hour.toString().padStart(2, '0')}:${minute}`;
});

export function CreatePollModal({ groupId, onClose }: CreatePollModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [minMembers, setMinMembers] = useState(2);
  const [duration, setDuration] = useState(60);
  const [endDate, setEndDate] = useState(format(addDays(new Date(), 7), 'yyyy-MM-dd'));
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [newSlot, setNewSlot] = useState<Partial<TimeSlot>>({});

  const createPollMutation = useMutation({
    mutationFn: async (pollData: any) => {
      const response = await fetch(`/api/sports-groups/${groupId}/polls`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pollData),
      });
      if (!response.ok) {
        throw new Error('Failed to create poll');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sports-groups', groupId, 'polls'] });
      onClose();
    },
  });

  const addTimeSlot = () => {
    if (newSlot.dayOfWeek !== undefined && newSlot.startTime && newSlot.endTime) {
      // Validate that end time is after start time
      if (newSlot.startTime >= newSlot.endTime) {
        alert('End time must be after start time');
        return;
      }

      // Check for duplicates
      const isDuplicate = timeSlots.some(slot => 
        slot.dayOfWeek === newSlot.dayOfWeek && 
        slot.startTime === newSlot.startTime && 
        slot.endTime === newSlot.endTime
      );

      if (isDuplicate) {
        alert('This time slot already exists');
        return;
      }

      setTimeSlots([...timeSlots, newSlot as TimeSlot]);
      setNewSlot({});
    }
  };

  const removeTimeSlot = (index: number) => {
    setTimeSlots(timeSlots.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) {
      alert('Please enter a poll title');
      return;
    }
    
    if (timeSlots.length === 0) {
      alert('Please add at least one time slot');
      return;
    }

    if (minMembers < 1) {
      alert('Minimum members must be at least 1');
      return;
    }

    if (duration < 15) {
      alert('Duration must be at least 15 minutes');
      return;
    }

    createPollMutation.mutate({
      title: title.trim(),
      description: description.trim() || null,
      minMembers,
      duration,
      endDate: new Date(endDate + 'T23:59:59'),
      timeSlots,
    });
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Create Event Coordination Poll
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Poll Title *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Weekend Basketball Game"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Additional details about the event..."
                className="mt-1"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="minMembers" className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Minimum Members *
                </Label>
                <Input
                  id="minMembers"
                  type="number"
                  min="1"
                  value={minMembers}
                  onChange={(e) => setMinMembers(parseInt(e.target.value) || 1)}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="duration" className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Duration (minutes) *
                </Label>
                <Input
                  id="duration"
                  type="number"
                  min="15"
                  step="15"
                  value={duration}
                  onChange={(e) => setDuration(parseInt(e.target.value) || 60)}
                  className="mt-1"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="endDate">Poll End Date *</Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                min={format(new Date(), 'yyyy-MM-dd')}
                className="mt-1"
              />
            </div>
          </div>

          {/* Time Slots */}
          <div className="space-y-4">
            <div>
              <Label className="text-base font-medium">Available Time Slots *</Label>
              <p className="text-sm text-gray-600 mt-1">
                Add all possible times when the event could happen
              </p>
            </div>

            {/* Add New Time Slot */}
            <Card>
              <CardContent className="pt-4">
                <div className="grid grid-cols-4 gap-3">
                  <div>
                    <Label>Day</Label>
                    <Select 
                      value={newSlot.dayOfWeek?.toString() || ''} 
                      onValueChange={(value) => setNewSlot({ ...newSlot, dayOfWeek: parseInt(value) })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select day" />
                      </SelectTrigger>
                      <SelectContent>
                        {DAYS_OF_WEEK.map((day, index) => (
                          <SelectItem key={index} value={index.toString()}>
                            {day}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Start Time</Label>
                    <Select 
                      value={newSlot.startTime || ''} 
                      onValueChange={(value) => setNewSlot({ ...newSlot, startTime: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Start" />
                      </SelectTrigger>
                      <SelectContent>
                        {TIME_OPTIONS.map((time) => (
                          <SelectItem key={time} value={time}>
                            {time}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>End Time</Label>
                    <Select 
                      value={newSlot.endTime || ''} 
                      onValueChange={(value) => setNewSlot({ ...newSlot, endTime: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="End" />
                      </SelectTrigger>
                      <SelectContent>
                        {TIME_OPTIONS.map((time) => (
                          <SelectItem key={time} value={time}>
                            {time}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-end">
                    <Button
                      type="button"
                      onClick={addTimeSlot}
                      disabled={!newSlot.dayOfWeek && newSlot.dayOfWeek !== 0 || !newSlot.startTime || !newSlot.endTime}
                      className="w-full"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Current Time Slots */}
            {timeSlots.length > 0 && (
              <div className="space-y-2">
                <Label>Added Time Slots:</Label>
                <div className="flex flex-wrap gap-2">
                  {timeSlots.map((slot, index) => (
                    <Badge key={index} variant="secondary" className="flex items-center gap-2">
                      {DAYS_OF_WEEK[slot.dayOfWeek]} {slot.startTime}-{slot.endTime}
                      <button
                        type="button"
                        onClick={() => removeTimeSlot(index)}
                        className="hover:text-red-600"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Submit Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={createPollMutation.isPending}
              className="min-w-[100px]"
            >
              {createPollMutation.isPending ? 'Creating...' : 'Create Poll'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}