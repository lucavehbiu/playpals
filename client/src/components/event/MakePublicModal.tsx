import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { Globe, Users, UserPlus } from 'lucide-react';

interface MakePublicModalProps {
  isOpen: boolean;
  onClose: () => void;
  eventId: number;
  currentVisibility: string | null;
  onVisibilityChange: (visibility: string | null) => void;
}

export function MakePublicModal({
  isOpen,
  onClose,
  eventId,
  currentVisibility,
  onVisibilityChange,
}: MakePublicModalProps) {
  const [selectedVisibility, setSelectedVisibility] = useState<string>(
    currentVisibility || 'private'
  );
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSave = async () => {
    setIsLoading(true);
    try {
      const visibilityValue = selectedVisibility === 'private' ? null : selectedVisibility;

      await apiRequest('PUT', `/api/events/${eventId}/visibility`, {
        publicVisibility: visibilityValue,
      });

      onVisibilityChange(visibilityValue);
      toast({
        title: 'Visibility Updated',
        description: getVisibilityDescription(visibilityValue),
      });
      onClose();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update event visibility',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getVisibilityDescription = (visibility: string | null) => {
    switch (visibility) {
      case 'all':
        return 'Event is now visible to all users';
      case 'friends':
        return 'Event is now visible to friends of group members';
      case 'friends_participants':
        return 'Event is now visible to friends of event participants';
      default:
        return 'Event is now private to the group';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Make Event Public</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Choose how you want to make this group event visible to others:
          </p>

          <RadioGroup
            value={selectedVisibility}
            onValueChange={setSelectedVisibility}
            className="space-y-4"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="private" id="private" />
              <Label htmlFor="private" className="flex items-center space-x-2 cursor-pointer">
                <Users className="h-4 w-4" />
                <div>
                  <div className="font-medium">Keep Private</div>
                  <div className="text-sm text-muted-foreground">
                    Only group members can see this event
                  </div>
                </div>
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <RadioGroupItem value="all" id="all" />
              <Label htmlFor="all" className="flex items-center space-x-2 cursor-pointer">
                <Globe className="h-4 w-4" />
                <div>
                  <div className="font-medium">Public to All Users</div>
                  <div className="text-sm text-muted-foreground">
                    All users can see and join this event
                  </div>
                </div>
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <RadioGroupItem value="friends" id="friends" />
              <Label htmlFor="friends" className="flex items-center space-x-2 cursor-pointer">
                <Users className="h-4 w-4" />
                <div>
                  <div className="font-medium">Friends of Group Members</div>
                  <div className="text-sm text-muted-foreground">
                    Only friends of group members can see this event
                  </div>
                </div>
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <RadioGroupItem value="friends_participants" id="friends_participants" />
              <Label
                htmlFor="friends_participants"
                className="flex items-center space-x-2 cursor-pointer"
              >
                <UserPlus className="h-4 w-4" />
                <div>
                  <div className="font-medium">Friends of Event Participants</div>
                  <div className="text-sm text-muted-foreground">
                    Only friends of people who joined this event can see it
                  </div>
                </div>
              </Label>
            </div>
          </RadioGroup>
        </div>

        <div className="flex justify-end space-x-2 mt-6">
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isLoading}>
            {isLoading ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
