// @ts-nocheck
import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { ArrowLeft, Users, UserPlus, CheckCircle, Globe } from 'lucide-react';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const CreateEventInvite = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  const [selectedFriends, setSelectedFriends] = useState<number[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<number | null>(null);
  const [inviteType, setInviteType] = useState<'friends' | 'group' | null>(null);

  // Get stored event data
  const [eventData, setEventData] = useState<any>(null);

  useEffect(() => {
    const storedData = sessionStorage.getItem('pendingEventData');
    if (!storedData) {
      setLocation('/create-event');
      return;
    }
    setEventData(JSON.parse(storedData));
  }, []);

  // Fetch user's friends
  const { data: friends = [] } = useQuery({
    queryKey: [`/api/users/${user?.id}/friends`],
    enabled: !!user?.id && inviteType === 'friends',
  });

  // Fetch user's groups
  const { data: groups = [] } = useQuery({
    queryKey: [`/api/users/${user?.id}/sports-groups`],
    enabled: !!user?.id && inviteType === 'group',
  });

  // Mutation for creating event with invitations
  const createEventMutation = useMutation({
    mutationFn: async ({ eventData, invitations }: { eventData: any; invitations: any }) => {
      // Combine date and time
      const startDateTime = new Date(`${eventData.date}T${eventData.time}`);

      const finalEventData = {
        title: eventData.title,
        description: eventData.description,
        sportType: eventData.sportType,
        location: eventData.location,
        date: startDateTime.toISOString(),
        maxParticipants: parseInt(eventData.maxParticipants) || 10,
        creatorId: user!.id,
        isPublic: false, // Always private for this flow
        isFree: parseFloat(eventData.price) === 0,
        cost: Math.round((parseFloat(eventData.price) || 0) * 100),
        eventImage: eventData.eventImage || null, // Include image data
      };

      const response = await apiRequest('POST', '/api/events', finalEventData);
      const result = await response.json();

      // If it's a group event, link it to the group
      if (invitations.type === 'group' && invitations.groupId && result?.id) {
        await apiRequest('POST', `/api/sports-groups/${invitations.groupId}/events`, {
          eventId: result.id,
        });
      }

      // Send individual invitations to friends
      if (invitations.type === 'friends' && invitations.friendIds?.length > 0 && result?.id) {
        for (const friendId of invitations.friendIds) {
          await apiRequest('POST', '/api/rsvps', {
            eventId: result.id,
            userId: friendId,
            status: 'pending',
          });
        }
      }

      return result;
    },
    onSuccess: (data: any) => {
      sessionStorage.removeItem('pendingEventData');
      toast({
        title: 'Success!',
        description:
          inviteType === 'group'
            ? 'Your group event has been created and all members notified.'
            : 'Your private event has been created and invitations sent.',
      });

      queryClient.invalidateQueries({ queryKey: ['/api/events'] });
      if (user) {
        queryClient.invalidateQueries({ queryKey: [`/api/events/user/${user.id}`] });
      }
      if (selectedGroup) {
        queryClient.invalidateQueries({ queryKey: [`/api/sports-groups/${selectedGroup}/events`] });
      }

      setLocation('/myevents');
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error?.message || 'Failed to create event. Please try again.',
        variant: 'destructive',
      });
    },
  });

  const handleFriendToggle = (friendId: number) => {
    setSelectedFriends((prev) =>
      prev.includes(friendId) ? prev.filter((id) => id !== friendId) : [...prev, friendId]
    );
  };

  const handleCreateEvent = () => {
    if (!eventData || !user) return;

    let invitations;

    if (inviteType === 'group' && selectedGroup) {
      invitations = {
        type: 'group',
        groupId: selectedGroup,
      };
    } else if (inviteType === 'friends' && selectedFriends.length > 0) {
      invitations = {
        type: 'friends',
        friendIds: selectedFriends,
      };
    } else {
      toast({
        title: 'Please select invitees',
        description:
          inviteType === 'group'
            ? 'Select a group to invite'
            : 'Select at least one friend to invite',
        variant: 'destructive',
      });
      return;
    }

    createEventMutation.mutate({ eventData, invitations });
  };

  const goBack = () => {
    setLocation('/create-event');
  };

  if (!eventData) {
    return <div>Loading...</div>;
  }

  return (
    <div className="w-full max-w-2xl mx-auto min-h-screen bg-white">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b">
        <Button variant="ghost" className="p-2" onClick={goBack}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-xl font-semibold">Invite to Your Event</h1>
        <div className="w-10" />
      </div>

      {/* Event Summary */}
      <div className="p-6 border-b bg-gray-50">
        <h2 className="text-lg font-semibold text-gray-900">{eventData.title}</h2>
        <p className="text-gray-600 mt-1">
          {eventData.sportType} • {eventData.location} • {eventData.date} at {eventData.time}
        </p>
      </div>

      {/* Invite Type Selection */}
      <div className="p-6">
        <h3 className="text-lg font-medium mb-4">Who would you like to invite?</h3>

        <div className="space-y-3">
          <Card
            className={`cursor-pointer transition-all ${
              inviteType === 'friends'
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
            onClick={() => setInviteType('friends')}
          >
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <UserPlus className="h-6 w-6 text-blue-500" />
                <div>
                  <h4 className="font-medium">Invite Friends</h4>
                  <p className="text-sm text-gray-600">Select specific friends to invite</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card
            className={`cursor-pointer transition-all ${
              inviteType === 'group'
                ? 'border-green-500 bg-green-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
            onClick={() => setInviteType('group')}
          >
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <Users className="h-6 w-6 text-green-500" />
                <div>
                  <h4 className="font-medium">Invite a Sports Group</h4>
                  <p className="text-sm text-gray-600">
                    Invite all members of a group you're part of
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Friends Selection */}
      {inviteType === 'friends' && (
        <div className="p-6 border-t">
          <h4 className="font-medium mb-4">Select Friends to Invite</h4>

          {friends.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <UserPlus className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p>You don't have any friends yet.</p>
              <p className="text-sm">Add friends to invite them to your events!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {friends.map((friend: any) => (
                <div
                  key={friend.id}
                  className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                  onClick={() => handleFriendToggle(friend.id)}
                >
                  <Checkbox
                    checked={selectedFriends.includes(friend.id)}
                    onChange={() => handleFriendToggle(friend.id)}
                  />
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={friend.profileImage} />
                    <AvatarFallback>
                      {friend.name
                        .split(' ')
                        .map((n: string) => n[0])
                        .join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <h5 className="font-medium">{friend.name}</h5>
                    <p className="text-sm text-gray-500">@{friend.username}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {selectedFriends.length > 0 && (
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-700">
                {selectedFriends.length} friend{selectedFriends.length > 1 ? 's' : ''} selected
              </p>
            </div>
          )}
        </div>
      )}

      {/* Groups Selection */}
      {inviteType === 'group' && (
        <div className="p-6 border-t">
          <h4 className="font-medium mb-4">Select a Sports Group</h4>

          {groups.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Users className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p>You're not part of any sports groups yet.</p>
              <p className="text-sm">Join a group to create group events!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {groups.map((group: any) => (
                <Card
                  key={group.id}
                  className={`cursor-pointer transition-all ${
                    selectedGroup === group.id
                      ? 'border-green-500 bg-green-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setSelectedGroup(group.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h5 className="font-medium">{group.name}</h5>
                        <p className="text-sm text-gray-600">
                          {group.sport} • {group.memberCount} members
                        </p>
                      </div>
                      <Badge variant="secondary">{group.sport}</Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Create Event Button */}
      <div className="sticky bottom-0 bg-white border-t p-6">
        <Button
          onClick={handleCreateEvent}
          disabled={
            createEventMutation.isPending ||
            !inviteType ||
            (inviteType === 'friends' && selectedFriends.length === 0) ||
            (inviteType === 'group' && !selectedGroup)
          }
          className="w-full"
          size="lg"
        >
          {createEventMutation.isPending ? (
            'Creating Event...'
          ) : (
            <>
              <CheckCircle className="h-4 w-4 mr-2" />
              Create Private Event
            </>
          )}
        </Button>

        {inviteType === 'friends' && selectedFriends.length > 0 && (
          <p className="text-center text-sm text-gray-500 mt-2">
            {selectedFriends.length} friend{selectedFriends.length > 1 ? 's' : ''} will be invited
          </p>
        )}

        {inviteType === 'group' && selectedGroup && (
          <p className="text-center text-sm text-gray-500 mt-2">
            All group members will be notified
          </p>
        )}
      </div>
    </div>
  );
};

export default CreateEventInvite;
